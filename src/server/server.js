const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
// Load .env first (committed defaults), then .env.local on top (gitignored secrets).
require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local'), override: true });

const authRoutes = require('./routes/auth');
const adminAuthRoutes = require('./routes/admin');
// Legacy Clerk + Mongo-OTP routes removed in Phase 2 (Supabase Auth migration).
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const ambulanceRoutes = require('./routes/ambulance');
const aiRoutes = require('./routes/ai');
const analyticsRoutes = require('./routes/analytics');
const qrRoutes = require('./routes/qr');
const erpRoutes = require('./routes/erp');
const chatbotRoutes = require('./routes/chatbot');
const profileRoutes = require('./routes/profile');
const prescriptionRoutes = require('./routes/prescriptions');
const inventoryRoutes = require('./routes/inventory');
const ambulanceTrackingRoutes = require('./routes/ambulance-tracking');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database: Supabase (see src/server/db/supabase.js). The old MongoDB
// connection block was removed at the end of Phase 3 — every route now
// uses req.sb / supabaseAdmin.

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', require('./routes/onboarding'));
app.use('/api/admin', adminAuthRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ambulance', ambulanceRoutes);
app.use('/api/chat', require('./routes/chat'));
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/erp', erpRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/student', profileRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/ambulance-tracking', ambulanceTrackingRoutes);
app.use('/api/hod', require('./routes/hod'));
app.use('/api/admin/analytics', require('./routes/adminAnalytics.routes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };
