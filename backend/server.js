import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import { loadUser } from './middleware.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import albumRoutes from './routes/albums.js';
import activityRoutes from './routes/activity.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Uploaded images are sent as base64 data URLs, so allow larger bodies
app.use(express.json({ limit: '8mb' }));
app.use(loadUser);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api', activityRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Bad JSON or a body over the size limit
app.use((err, req, res, next) => {
  const status = err.type === 'entity.too.large' ? 413 : err.status || 500;
  const message = status === 413 ? 'That image is too large (max 5MB)' : 'Invalid request';
  res.status(status).json({ success: false, message });
});

async function startServer() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas!');
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
}

startServer();
