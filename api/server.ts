import app from './app.js';
import { connectDB, disconnectDB } from './lib/db.js';

const PORT = process.env.PORT || 3001;

async function startServer() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Health: http://localhost:${PORT}/api/health`);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await disconnectDB();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await disconnectDB();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

startServer().catch(console.error);
