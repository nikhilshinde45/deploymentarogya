require('dotenv').config({ override: true });
const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const initSocketHandler = require('./socketHandler');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorAuthRoutes = require('./routes/doctorAuthRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const recordsRoutes = require('./routes/recordsRoutes');

const app = express();
const httpServer = http.createServer(app);

// Socket.io setup — lightweight signaling only
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
initSocketHandler(io);

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
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorAuthRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/records', recordsRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
