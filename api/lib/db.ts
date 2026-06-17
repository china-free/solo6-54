import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri) {
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB at', mongoUri);
    } else {
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log('Connected to in-memory MongoDB at', uri);
    }
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}
