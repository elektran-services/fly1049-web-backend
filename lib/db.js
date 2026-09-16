const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<db_password>')) {
    throw new Error(
      'MONGODB_URI is missing or still contains <db_password>. Set the full connection string in backend/.env'
    );
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

module.exports = { connectDB };
