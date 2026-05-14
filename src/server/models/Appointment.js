const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  symptoms: {
    type: String,
    required: true
  },
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  queueNumber: {
    type: Number,
    required: true
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  actualWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  consultationNotes: {
    type: String,
    default: ''
  },
  prescription: {
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String
    }],
    instructions: String,
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date
  },
  diagnosis: {
    type: String,
    default: ''
  },
  treatment: {
    type: String,
    default: ''
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  emergencyReason: {
    type: String,
    default: ''
  },
  checkInTime: {
    type: Date,
    default: null
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String
  },
  leaveRequest: {
    requested: {
      type: Boolean,
      default: false
    },
    duration: Number, // in days
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: String,
      default: ''
    },
    approvedAt: Date,
    // HOD decision audit fields (populated when HOD approves/rejects)
    decidedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', default: null },
    decidedByName:   { type: String, default: '' },
    decidedAt:       { type: Date, default: null },
    decisionRole:    { type: String, default: '' },
    decisionComments:{ type: String, default: '' },
    hodReviewedAt:   { type: Date, default: null },
  }
}, {
  timestamps: true
});

// Index for efficient queries
appointmentSchema.index({ student: 1, appointmentDate: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ priority: -1, appointmentDate: 1 });

// Virtual for calculating total consultation time
appointmentSchema.virtual('consultationDuration').get(function() {
  if (this.checkInTime && this.checkOutTime) {
    return Math.round((this.checkOutTime - this.checkInTime) / (1000 * 60)); // in minutes
  }
  return 0;
});

// Method to update appointment status
appointmentSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  if (newStatus === 'in-progress') {
    this.checkInTime = new Date();
  } else if (newStatus === 'completed') {
    this.checkOutTime = new Date();
    this.actualWaitTime = this.consultationDuration;
  }
  return this.save();
};

// Method to calculate wait time
appointmentSchema.methods.calculateWaitTime = function() {
  if (this.checkInTime) {
    const now = new Date();
    const waitTime = Math.round((now - this.checkInTime) / (1000 * 60));
    this.estimatedWaitTime = waitTime;
    return waitTime;
  }
  return 0;
};

// Static method to get queue statistics
appointmentSchema.statics.getQueueStats = function(doctorId) {
  return this.aggregate([
    {
      $match: {
        doctor: mongoose.Types.ObjectId(doctorId),
        status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgWaitTime: { $avg: '$estimatedWaitTime' }
      }
    }
  ]);
};

module.exports = mongoose.model('Appointment', appointmentSchema);
