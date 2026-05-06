const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticateToken: auth } = require('../middleware/auth');

// @route   GET /api/student/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// @route   PUT /api/student/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      department,
      year,
      bloodGroup,
      address,
      emergencyContact,
      emergencyPhone,
      medicalHistory,
      allergies,
      medications,
    } = req.body;

    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (department) updateData.department = department;
    if (year) updateData.year = year;
    if (bloodGroup) updateData.bloodGroup = bloodGroup;
    if (address) updateData.address = address;
    if (emergencyContact) updateData.emergencyContact = emergencyContact;
    if (emergencyPhone) updateData.emergencyPhone = emergencyPhone;
    if (medicalHistory) updateData.medicalHistory = medicalHistory;
    if (allergies) updateData.allergies = allergies;
    if (medications) updateData.medications = medications;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   PUT /api/student/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(req.user._id, { password: hashedPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

// @route   GET /api/student/medical-history
// @desc    Get user's medical history
// @access  Private
router.get('/medical-history', auth, async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    const Prescription = require('../models/Prescription');

    // Get recent appointments
    const appointments = await Appointment.find({ student: req.user._id })
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: -1 })
      .limit(10);

    // Get recent prescriptions
    const prescriptions = await Prescription.find({ student: req.user._id })
      .populate('doctor', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      appointments: appointments.map(apt => ({
        id: apt._id,
        date: apt.appointmentDate,
        doctor: apt.doctor.name,
        reason: apt.symptoms,
        status: apt.status
      })),
      prescriptions: prescriptions.map(pres => ({
        id: pres._id,
        date: pres.createdAt,
        doctor: pres.doctor.name,
        medications: pres.medications,
        status: pres.status
      }))
    });
  } catch (error) {
    console.error('Get medical history error:', error);
    res.status(500).json({ message: 'Server error fetching medical history' });
  }
});

// @route   PUT /api/student/notifications
// @desc    Update notification preferences
// @access  Private
router.put('/notifications', auth, async (req, res) => {
  try {
    const {
      emailNotifications,
      smsNotifications,
      appointmentReminders,
      emergencyAlerts,
      healthTips
    } = req.body;

    const notificationSettings = {
      emailNotifications: emailNotifications || false,
      smsNotifications: smsNotifications || false,
      appointmentReminders: appointmentReminders || false,
      emergencyAlerts: emergencyAlerts || false,
      healthTips: healthTips || false
    };

    await User.findByIdAndUpdate(
      req.user._id,
      { notificationSettings },
      { new: true }
    );

    res.json({
      message: 'Notification settings updated successfully',
      notificationSettings
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ message: 'Server error updating notifications' });
  }
});

// @route   POST /api/student/upload-profile-picture
// @desc    Upload profile picture
// @access  Private
router.post('/upload-profile-picture', auth, async (req, res) => {
  try {
    // This would typically handle file upload
    // For now, we'll just return a success message
    const { profilePictureUrl } = req.body;

    if (!profilePictureUrl) {
      return res.status(400).json({ message: 'Profile picture URL is required' });
    }

    await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: profilePictureUrl },
      { new: true }
    );

    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: profilePictureUrl
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ message: 'Server error uploading profile picture' });
  }
});

// @route   GET /api/student/activity-history
// @desc    Get user's activity history
// @access  Private
router.get('/activity-history', auth, async (req, res) => {
  try {
    const activities = [
      {
        id: 1,
        type: 'profile_update',
        description: 'Profile updated',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        icon: 'edit'
      },
      {
        id: 2,
        type: 'appointment_booked',
        description: 'Appointment booked with Dr. Smith',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        icon: 'medical_services'
      },
      {
        id: 3,
        type: 'password_changed',
        description: 'Password changed',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        icon: 'security'
      },
      {
        id: 4,
        type: 'prescription_issued',
        description: 'Prescription issued',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        icon: 'medication'
      }
    ];

    res.json({ activities });
  } catch (error) {
    console.error('Get activity history error:', error);
    res.status(500).json({ message: 'Server error fetching activity history' });
  }
});

module.exports = router;
