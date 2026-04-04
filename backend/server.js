require('dotenv').config({ override: true });
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const recordsRoutes = require('./routes/recordsRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  const line = `${new Date().toISOString()} ${req.method} ${req.path} body=${JSON.stringify(req.body)}\n`;
  fs.appendFileSync('request.log', line);
  next();
});

// Connect Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/records', recordsRoutes);
app.use((req, res, next) => {
  console.log("Incoming:", req.method, req.url);
  next();
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
