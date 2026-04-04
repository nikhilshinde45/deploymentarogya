const mongoose = require('mongoose');

const connectDB = async () => {

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'aarogyaai' // force correct DB
    });

    console.log('✅ FULL DB INFO:');
    console.log('Host:', conn.connection.host);
    console.log('DB Name:', conn.connection.name);
    console.log('DB URI:', process.env.MONGO_URI);
  } catch (error) {
    console.error('DB connection error:', error.message);
    process.exit(1);
  }

};

module.exports = connectDB;