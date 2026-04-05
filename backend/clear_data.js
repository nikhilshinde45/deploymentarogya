require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const Slot = require('./models/Slot');
const Appointment = require('./models/Appointment');
const connectDB = require('./config/db');

(async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const slotResult = await Slot.deleteMany({});
        console.log(`Deleted ${slotResult.deletedCount} old slots`);

        const apptResult = await Appointment.deleteMany({});
        console.log(`Deleted ${apptResult.deletedCount} old appointments`);

        console.log('Successfully cleared old data');
        process.exit(0);
    } catch (err) {
        console.error('Error clearing data:', err);
        process.exit(1);
    }
})();
