const express = require('express');
const multer = require('multer');
const path = require('path');
const { Readable } = require('stream');
const csv = require('csv-parser');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// CSV import never persists the file — parse it from memory and discard.
// Drops the legacy ../uploads/csv disk dependency.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      return cb(null, true);
    }
    cb(new Error('Only CSV files are allowed'));
  },
});

router.use(authenticateToken);
router.use(requireRole(['admin']));

// Mongoose treated currentStock as required (no default) but the new Postgres
// schema has NOT NULL on description/supplier/batch_number with no defaults.
// Coerce undefined → '' on those fields so old clients keep working.
const toRow = (body, addedBy) => ({
  name: body.name,
  category: body.category || 'medication',
  description: body.description ?? '',
  current_stock: parseInt(body.currentStock, 10) || 0,
  minimum_stock: parseInt(body.minimumStock, 10) || 0,
  maximum_stock: parseInt(body.maximumStock, 10) || 0,
  unit_price: parseFloat(body.unitPrice) || 0,
  supplier: body.supplier ?? '',
  expiry_date: body.expiryDate || null,
  batch_number: body.batchNumber ?? '',
  added_by: addedBy,
});

const toPatch = (body, updatedBy) => {
  const patch = { updated_by: updatedBy };
  if (body.name !== undefined) patch.name = body.name;
  if (body.category !== undefined) patch.category = body.category;
  if (body.description !== undefined) patch.description = body.description;
  if (body.currentStock !== undefined) patch.current_stock = parseInt(body.currentStock, 10);
  if (body.minimumStock !== undefined) patch.minimum_stock = parseInt(body.minimumStock, 10);
  if (body.maximumStock !== undefined) patch.maximum_stock = parseInt(body.maximumStock, 10);
  if (body.unitPrice !== undefined) patch.unit_price = parseFloat(body.unitPrice);
  if (body.supplier !== undefined) patch.supplier = body.supplier;
  if (body.expiryDate !== undefined) patch.expiry_date = body.expiryDate || null;
  if (body.batchNumber !== undefined) patch.batch_number = body.batchNumber;
  return patch;
};

router.get('/admin/inventory', async (req, res) => {
  const { data, error } = await req.sb.from('inventory_items').select('*').order('name');
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

router.post('/admin/inventory', async (req, res) => {
  const { name, category, currentStock, minimumStock, maximumStock } = req.body;
  if (!name || !category || currentStock === undefined || minimumStock === undefined || maximumStock === undefined) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }
  const { data, error } = await req.sb
    .from('inventory_items')
    .insert(toRow(req.body, req.user.id))
    .select()
    .single();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

router.put('/admin/inventory/:id', async (req, res) => {
  const { data, error } = await req.sb
    .from('inventory_items')
    .update(toPatch(req.body, req.user.id))
    .eq('id', req.params.id)
    .select()
    .maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  if (!data) return res.status(404).json({ message: 'Inventory item not found' });
  res.json(data);
});

router.delete('/admin/inventory/:id', async (req, res) => {
  const { error, count } = await req.sb
    .from('inventory_items')
    .delete({ count: 'exact' })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ message: error.message });
  if (count === 0) return res.status(404).json({ message: 'Inventory item not found' });
  res.json({ message: 'Inventory item deleted successfully' });
});

router.post('/admin/inventory/upload-csv', upload.single('csvFile'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No CSV file uploaded' });

  const results = [];
  const errors = [];

  Readable.from(req.file.buffer)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        for (const row of results) {
          const { error } = await req.sb.from('inventory_items').insert(toRow(row, req.user.id));
          if (error) errors.push({ row, error: error.message });
        }
        res.json({
          message: 'CSV file processed successfully',
          totalRows: results.length,
          successCount: results.length - errors.length,
          errorCount: errors.length,
          errors,
        });
      } catch (error) {
        console.error('CSV processing error:', error);
        res.status(500).json({ message: 'Error processing CSV file' });
      }
    });
});

router.get('/admin/inventory/export-csv', async (req, res) => {
  const { data, error } = await req.sb.from('inventory_items').select('*').order('name');
  if (error) return res.status(500).json({ message: error.message });

  const header = 'Name,Category,Description,Current Stock,Minimum Stock,Maximum Stock,Unit Price,Supplier,Expiry Date,Batch Number,Status\n';
  const today = new Date();
  const rows = (data || []).map((item) => {
    const status =
      item.current_stock === 0
        ? 'Out of Stock'
        : item.current_stock <= item.minimum_stock
        ? 'Low Stock'
        : item.expiry_date && new Date(item.expiry_date) < today
        ? 'Expired'
        : 'In Stock';
    const expiry = item.expiry_date ? new Date(item.expiry_date).toISOString().split('T')[0] : '';
    return `"${item.name}","${item.category}","${item.description}","${item.current_stock}","${item.minimum_stock}","${item.maximum_stock}","${item.unit_price}","${item.supplier}","${expiry}","${item.batch_number}","${status}"`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="inventory.csv"');
  res.send(header + rows.join('\n'));
});

// PostgREST can't filter by `column <= other_column`. Pull the rows and filter
// in node — fine until the catalog gets huge, then a view/RPC takes over.
router.get('/admin/inventory/low-stock', async (req, res) => {
  const { data, error } = await req.sb
    .from('inventory_items')
    .select('*')
    .order('current_stock', { ascending: true });
  if (error) return res.status(500).json({ message: error.message });
  res.json((data || []).filter((it) => it.current_stock <= it.minimum_stock));
});

router.get('/admin/inventory/expired', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await req.sb
    .from('inventory_items')
    .select('*')
    .lt('expiry_date', today)
    .order('expiry_date', { ascending: true });
  if (error) return res.status(500).json({ message: error.message });
  res.json(data || []);
});

router.put('/admin/inventory/:id/stock', async (req, res) => {
  const { currentStock, operation, quantity } = req.body;
  const { data: item, error: readErr } = await req.sb
    .from('inventory_items')
    .select('current_stock')
    .eq('id', req.params.id)
    .maybeSingle();
  if (readErr) return res.status(500).json({ message: readErr.message });
  if (!item) return res.status(404).json({ message: 'Inventory item not found' });

  let next = item.current_stock;
  if (currentStock !== undefined) {
    next = parseInt(currentStock, 10);
  } else if (operation && quantity) {
    const qty = parseInt(quantity, 10);
    next = operation === 'add' ? item.current_stock + qty : Math.max(0, item.current_stock - qty);
  }

  const { data, error } = await req.sb
    .from('inventory_items')
    .update({ current_stock: next, updated_by: req.user.id })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

module.exports = router;
