const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { supabaseAdmin } = require('../db/supabase');

const ROLE_TABLES = {
  student: 'students',
  faculty: 'faculty',
  hod: 'faculty',
  dean: 'faculty',
  admin: 'dispensary_staff',
  doctor: 'dispensary_staff',
  dispensary_staff: 'dispensary_staff',
  parent: 'parents',
};

// First-time role-specific data entry. The handle_new_user trigger only seeds
// the profiles row; the role-specific table needs a separate insert. Using
// service-role bypasses RLS (which has no INSERT policy for self on these tables).
router.post('/', authenticateToken, async (req, res) => {
  const { role, data } = req.body || {};

  if (!role || !data) {
    return res.status(400).json({ message: 'role and data are required' });
  }
  if (role !== req.user.role) {
    return res.status(403).json({ message: 'role mismatch — ask an admin to change your role' });
  }
  const table = ROLE_TABLES[role];
  if (!table) return res.status(400).json({ message: `unsupported role: ${role}` });

  const row = { id: req.user.id, ...data };

  const { data: upserted, error } = await supabaseAdmin
    .from(table)
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('onboarding upsert failed:', error);
    return res.status(400).json({ message: error.message });
  }

  res.json({ message: 'Onboarding complete', row: upserted });
});

module.exports = router;
