/**
 * LeaveDecision — append-only audit collection.
 *
 * Every approve/reject action by an HOD (or admin) creates a new document
 * here. Documents are NEVER updated or deleted — this is an immutable audit
 * trail required for compliance and accountability.
 *
 * No update hooks or methods are intentionally provided.
 */
const mongoose = require('mongoose');

const leaveDecisionSchema = new mongoose.Schema(
  {
    // Reference to the Appointment whose leaveRequest was acted on
    leaveRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true,
    },

    // Student info (denormalised for audit durability — survives student deletion)
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentName:       { type: String, required: true },
    studentDepartment: { type: String, required: true },

    // Decider info (denormalised for same durability reason)
    deciderId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    deciderName: { type: String, required: true },
    deciderRole: { type: String, required: true }, // 'hod' | 'admin'

    // Decision
    action:   { type: String, enum: ['approved', 'rejected'], required: true },
    comments: { type: String, default: '' },
    decidedAt: { type: Date, required: true, default: Date.now },

    // Snapshot of the leave request at the moment of decision (immutable context)
    leaveSnapshot: {
      duration: Number,
      reason:   String,
      status:   String,
    },

    // Request context (for security investigation if needed)
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  {
    timestamps: true,
    // Prevent accidental updates to audit records at the Mongoose level
    strict: true,
  }
);

// Compound index for efficient HOD dashboard queries
leaveDecisionSchema.index({ studentDepartment: 1, decidedAt: -1 });
leaveDecisionSchema.index({ leaveRequestId: 1, decidedAt: -1 });

module.exports = mongoose.model('LeaveDecision', leaveDecisionSchema);
