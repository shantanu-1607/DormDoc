import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Badge,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Download,
  Upload,
  Search,
  FilterList,
  Inventory,
  LocalPharmacy,
  Warning,
  CheckCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Assessment,
  FileDownload,
  FileUpload,
  Medication,
  Store,
  Inventory2,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [uploadDialog, setUploadDialog] = useState(false);
  const [csvFile, setCsvFile] = useState(null);

  const [inventoryData, setInventoryData] = useState({
    name: '',
    category: '',
    description: '',
    currentStock: '',
    minimumStock: '',
    maximumStock: '',
    unitPrice: '',
    supplier: '',
    expiryDate: '',
    batchNumber: '',
  });

  const queryClient = useQueryClient();

  // Fetch inventory items
  const { data: inventoryItems, isLoading } = useQuery(
    'inventory',
    async () => {
      const response = await axios.get('/api/admin/inventory');
      return response.data;
    }
  );

  // Add inventory item mutation
  const addInventoryMutation = useMutation(
    async (itemData) => {
      const response = await axios.post('/api/admin/inventory', itemData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('inventory');
        toast.success('Inventory item added successfully!');
        setOpenDialog(false);
        setInventoryData({
          name: '',
          category: '',
          description: '',
          currentStock: '',
          minimumStock: '',
          maximumStock: '',
          unitPrice: '',
          supplier: '',
          expiryDate: '',
          batchNumber: '',
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add inventory item');
      },
    }
  );

  // Update inventory item mutation
  const updateInventoryMutation = useMutation(
    async ({ itemId, itemData }) => {
      const response = await axios.put(`/api/admin/inventory/${itemId}`, itemData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('inventory');
        toast.success('Inventory item updated successfully!');
        setOpenDialog(false);
        setSelectedItem(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update inventory item');
      },
    }
  );

  // Delete inventory item mutation
  const deleteInventoryMutation = useMutation(
    async (itemId) => {
      const response = await axios.delete(`/api/admin/inventory/${itemId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('inventory');
        toast.success('Inventory item deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete inventory item');
      },
    }
  );

  // CSV upload mutation
  const csvUploadMutation = useMutation(
    async (formData) => {
      const response = await axios.post('/api/admin/inventory/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('inventory');
        toast.success('CSV file uploaded successfully!');
        setUploadDialog(false);
        setCsvFile(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to upload CSV file');
      },
    }
  );

  // CSV export mutation
  const csvExportMutation = useMutation(
    async () => {
      const response = await axios.get('/api/admin/inventory/export-csv', {
        responseType: 'blob',
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'inventory.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('CSV file downloaded successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to export CSV file');
      },
    }
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (field, value) => {
    setInventoryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (selectedItem) {
      updateInventoryMutation.mutate({ itemId: selectedItem._id, itemData: inventoryData });
    } else {
      addInventoryMutation.mutate(inventoryData);
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setInventoryData({
      name: item.name,
      category: item.category,
      description: item.description,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      maximumStock: item.maximumStock,
      unitPrice: item.unitPrice,
      supplier: item.supplier,
      expiryDate: item.expiryDate,
      batchNumber: item.batchNumber,
    });
    setOpenDialog(true);
  };

  const handleDelete = (itemId) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      deleteInventoryMutation.mutate(itemId);
    }
  };

  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    setCsvFile(file);
  };

  const handleCsvSubmit = () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('csvFile', csvFile);
    csvUploadMutation.mutate(formData);
  };

  const filteredItems = inventoryItems?.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'low' && item.currentStock <= item.minimumStock) ||
                         (filterStatus === 'out' && item.currentStock === 0) ||
                         (filterStatus === 'expired' && new Date(item.expiryDate) < new Date());
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStockStatus = (item) => {
    if (item.currentStock === 0) return { status: 'Out of Stock', color: 'error' };
    if (item.currentStock <= item.minimumStock) return { status: 'Low Stock', color: 'warning' };
    if (new Date(item.expiryDate) < new Date()) return { status: 'Expired', color: 'error' };
    return { status: 'In Stock', color: 'success' };
  };

  const getStockPercentage = (item) => {
    return (item.currentStock / item.maximumStock) * 100;
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            📦 Inventory Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage medication inventory and stock levels
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FileUpload />}
            onClick={() => setUploadDialog(true)}
          >
            Upload CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={() => csvExportMutation.mutate()}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            sx={{ bgcolor: '#1e3a8a' }}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Inventory />
                </Avatar>
                <Box>
                  <Typography variant="h4">{inventoryItems?.length || 0}</Typography>
                  <Typography color="textSecondary">Total Items</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {inventoryItems?.filter(item => item.currentStock > item.minimumStock).length || 0}
                  </Typography>
                  <Typography color="textSecondary">In Stock</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {inventoryItems?.filter(item => item.currentStock <= item.minimumStock && item.currentStock > 0).length || 0}
                  </Typography>
                  <Typography color="textSecondary">Low Stock</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <Info />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {inventoryItems?.filter(item => item.currentStock === 0).length || 0}
                  </Typography>
                  <Typography color="textSecondary">Out of Stock</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search inventory"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="medication">Medication</MenuItem>
                  <MenuItem value="supplies">Medical Supplies</MenuItem>
                  <MenuItem value="equipment">Equipment</MenuItem>
                  <MenuItem value="consumables">Consumables</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="low">Low Stock</MenuItem>
                  <MenuItem value="out">Out of Stock</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                fullWidth
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('all');
                  setFilterStatus('all');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="All Items" icon={<Inventory />} />
            <Tab label="Low Stock" icon={<Warning />} />
            <Tab label="Out of Stock" icon={<Info />} />
            <Tab label="Expired Items" icon={<TrendingDown />} />
          </Tabs>
        </Box>

        {/* All Items Tab */}
        <TabPanel value={activeTab} index={0}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Stock Level</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems?.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const stockPercentage = getStockPercentage(item);
                  
                  return (
                    <TableRow key={item._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{item.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.category} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.currentStock} / {item.maximumStock}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={stockStatus.status}
                          color={stockStatus.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ width: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={stockPercentage}
                            color={stockStatus.color}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="textSecondary">
                            {stockPercentage.toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(item.expiryDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleEdit(item)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(item._id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Low Stock Tab */}
        <TabPanel value={activeTab} index={1}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Minimum Stock</TableCell>
                  <TableCell>Stock Level</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems?.filter(item => item.currentStock <= item.minimumStock && item.currentStock > 0).map((item) => {
                  const stockPercentage = getStockPercentage(item);
                  
                  return (
                    <TableRow key={item._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{item.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="warning.main">
                          {item.currentStock}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.minimumStock}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ width: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={stockPercentage}
                            color="warning"
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="textSecondary">
                            {stockPercentage.toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleEdit(item)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Out of Stock Tab */}
        <TabPanel value={activeTab} index={2}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Last Stock</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems?.filter(item => item.currentStock === 0).map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{item.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="error.main">
                        Out of Stock
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEdit(item)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Expired Items Tab */}
        <TabPanel value={activeTab} index={3}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems?.filter(item => new Date(item.expiryDate) < new Date()).map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{item.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="error.main">
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.currentStock}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleDelete(item._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>

      {/* Add/Edit Item Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Name"
                value={inventoryData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={inventoryData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  label="Category"
                >
                  <MenuItem value="medication">Medication</MenuItem>
                  <MenuItem value="supplies">Medical Supplies</MenuItem>
                  <MenuItem value="equipment">Equipment</MenuItem>
                  <MenuItem value="consumables">Consumables</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={inventoryData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Current Stock"
                type="number"
                value={inventoryData.currentStock}
                onChange={(e) => handleInputChange('currentStock', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Minimum Stock"
                type="number"
                value={inventoryData.minimumStock}
                onChange={(e) => handleInputChange('minimumStock', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Maximum Stock"
                type="number"
                value={inventoryData.maximumStock}
                onChange={(e) => handleInputChange('maximumStock', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit Price"
                type="number"
                value={inventoryData.unitPrice}
                onChange={(e) => handleInputChange('unitPrice', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier"
                value={inventoryData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                type="date"
                value={inventoryData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Batch Number"
                value={inventoryData.batchNumber}
                onChange={(e) => handleInputChange('batchNumber', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={addInventoryMutation.isLoading || updateInventoryMutation.isLoading}
          >
            {(addInventoryMutation.isLoading || updateInventoryMutation.isLoading) ? 
              <CircularProgress size={20} /> : 
              (selectedItem ? 'Update' : 'Add')} Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Inventory CSV</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Please ensure your CSV file has the following columns: name, category, description, currentStock, minimumStock, maximumStock, unitPrice, supplier, expiryDate, batchNumber
            </Alert>
            <Button
              variant="outlined"
              component="label"
              startIcon={<FileUpload />}
              fullWidth
            >
              Select CSV File
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={handleCsvUpload}
              />
            </Button>
            {csvFile && (
              <Alert severity="success" sx={{ mt: 2 }}>
                File selected: {csvFile.name}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCsvSubmit}
            variant="contained"
            disabled={!csvFile || csvUploadMutation.isLoading}
          >
            {csvUploadMutation.isLoading ? <CircularProgress size={20} /> : 'Upload CSV'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryManagement;
