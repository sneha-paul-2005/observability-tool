const mongoose = require('mongoose');
const prisma = require('./prisma');

const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const connectPostgres = async () => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL Connected');
  } catch (error) {
    console.error(`PostgreSQL Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectMongoDB, connectPostgres };