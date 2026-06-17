require('dotenv').config();
const app = require('./app');
const { connectMongoDB, connectPostgres } = require('./config/database');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectMongoDB();
  await connectPostgres();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
};

startServer();