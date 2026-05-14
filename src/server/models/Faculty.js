const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  // Identity
  facultyId: { type: String, required: true, unique: true, trim: true, index: true }, // e.g. BIT-FAC-001
  clerkUserId: { type: String, unique: true, sparse: true },

  // Personal Info
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  photo: { type: String },

  // Academic Info
  department: { type: String, required: true, trim: true },
  designation: {
    type: String,
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'HOD', 'Dean', 'Registrar', 'Director'],
    required: true,
  },
  specialization: [String],
  qualification: [String], // e.g. ['Ph.D', 'M.Tech']
  joiningDate: { type: Date },
  employeeType: { type: String, enum: ['permanent', 'contractual', 'visiting'], default: 'permanent' },
  cabinNumber: { type: String },
  campusAddress: { type: String },

  // Medical Info
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  allergies: [String],
  chronicConditions: [String],
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    relation: { type: String },
  },

  // Role in portal
  role: { type: String, enum: ['faculty', 'hod', 'dean'], default: 'faculty' },
  hodDepartment: { type: String }, // if role is 'hod', which dept they head
  hodSince: { type: Date },        // date the faculty member became HOD
  hodPermissions: {
    canApproveLeave:       { type: Boolean, default: true },
    canViewMedicalHistory: { type: Boolean, default: true },
    canExportReports:      { type: Boolean, default: true },
  },

  // Status
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

facultySchema.index({ department: 1 });
facultySchema.index({ designation: 1 });

module.exports = mongoose.model('Faculty', facultySchema);
