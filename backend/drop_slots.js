require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const Slot = require('./models/Slot');
const connectDB = require('./config/db');

(async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        // Drop the entire collection to clear old indexes
        await mongoose.connection.collection('slots').drop().catch(err => {
            if (err.code === 26) console.log('slots collection does not exist');
            else throw err;
        });
        console.log('Dropped slots collection and its indexes');

        await Slot.syncIndexes();
        console.log('Recreated the correct indexes');

        process.exit(0);
    } catch (err) {
        console.error('Error dropping collection:', err);
        process.exit(1);
    }
})();
