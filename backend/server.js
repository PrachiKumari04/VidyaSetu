const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Modular MediKiosk Routes
const userRoutes = require('./src/routes/userRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const feedbackRoutes = require('./src/routes/feedbackRoutes');
const ocrRoutes = require('./src/routes/ocrRoutes');
const vitalsRoutes = require('./src/routes/vitalsRoutes');
const labRoutes = require('./src/routes/labRoutes');
const labExtractionRoutes = require('./src/routes/labExtractionRoutes');
const labAnalysisRoutes = require('./src/routes/labAnalysisRoutes');
const alertRoutes = require('./src/routes/alertRoutes');
const preferenceRoutes = require('./src/routes/preferenceRoutes');
const medicationRoutes = require('./src/routes/medicationRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');
const ayushRoutes = require('./src/routes/ayushRoutes');
const ragRoutes = require('./src/routes/ragRoutes');

// NEW MediKiosk First-Mile Clinical Intake Modules
const intakeRoutes = require('./src/routes/intakeRoutes');
const queueRoutes = require('./src/routes/queueRoutes');
const summaryRoutes = require('./src/routes/summaryRoutes');
const consentRoutes = require('./src/routes/consentRoutes');
const encounterRoutes = require('./src/routes/encounterRoutes');
const labOrderRoutes = require('./src/routes/labOrderRoutes');

const { resolveLanguage } = require('./src/middleware/languageResolver');
const { runReminderService } = require('./src/services/reminderService');
const initCronJobs = require('./src/scripts/cronJobs');

const app = express();
const httpServer = createServer(app);

// Setup Real-time WebSocket Gateway
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});
app.set('io', io);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(resolveLanguage);

// Deprecation settings
mongoose.set('returnDocument', 'after');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// MediKiosk First-Mile Clinical Core Routes
app.use('/api/intake', intakeRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/encounters', encounterRoutes);
app.use('/api/lab-orders', labOrderRoutes);

// Retained Supporting Clinical Services
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/lab-results', labRoutes);
app.use('/api/lab-results', labExtractionRoutes);
app.use('/api/lab-results', labAnalysisRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/ayush', ayushRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/preferences', preferenceRoutes);

// Socket.io Handlers
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  
  socket.on('join:doctor', (doctorId) => {
    socket.join(`doctor:${doctorId}`);
    console.log(`[Socket] Joined doctor room: doctor:${doctorId}`);
  });

  socket.on('join:patient', (patientId) => {
    socket.join(`patient:${patientId}`);
    console.log(`[Socket] Joined patient room: patient:${patientId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'MediKiosk - Advanced Patient Case-Taking System',
    db_status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

httpServer.listen(PORT, () => {
  console.log(`MediKiosk Server is running on port ${PORT}`);
  runReminderService();
  initCronJobs();
});
