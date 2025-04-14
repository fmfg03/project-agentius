const mongoose = require('mongoose');

// Use in-memory MongoDB for testing/development when MongoDB is not available
const useInMemoryMongoDB = process.env.USE_IN_MEMORY_DB === 'true';

const connectDB = async () => {
  try {
    if (useInMemoryMongoDB) {
      console.log('Using in-memory MongoDB alternative...');
      // This is a simple in-memory store that mimics basic MongoDB functionality
      // for development/testing purposes only
      global.inMemoryDB = {
        users: [],
        projects: [],
        conversations: [],
        messages: [],
        assets: []
      };
      console.log('In-memory database initialized');
      return;
    }
    
    // Try to connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('Falling back to in-memory database...');
    
    // Initialize in-memory database as fallback
    global.inMemoryDB = {
      users: [],
      projects: [],
      conversations: [],
      messages: [],
      assets: []
    };
    console.log('In-memory database initialized');
  }
};

module.exports = connectDB;
