require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const MedicalRecord = require('./models/MedicalRecord');
const connectDB = require('./config/db');

(async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const recordResult = await MedicalRecord.deleteMany({});
        console.log(`Deleted ${recordResult.deletedCount} old medical records`);

        // Drop the whole collection to drop legacy indexes
        await mongoose.connection.collection('medicalrecords').drop().catch(err => {
             // 26 is namespace not found
             if (err.code !== 26) console.log(err);
        });
        console.log('Cleared medicalrecords indexes');

        process.exit(0);
    } catch (err) {
        console.error('Error clearing records:', err);
        process.exit(1);
    }
})();
