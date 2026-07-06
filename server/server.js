import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import helmet from 'helmet';

import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/error.js';
import { startCronJobs } from './utils/cronJobs.js';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/product.js';
import orderRoutes from './routes/order.js';
import storeRoutes from './routes/store.js';
import reviewRoutes from './routes/review.js';
import userRoutes from './routes/user.js';
import cartRoutes from './routes/cart.js';

dotenv.config();

const app = express();

// Security and utility middlewares
app.use(helmet());
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Prevent browser from caching API responses — fixes stale/304 empty-list bugs
app.use('/api/v1', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/store', storeRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/cart', cartRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// Seed endpoint — call once from browser after deploy to populate production DB
// Set SEED_KEY env var on Render, then visit:
//   https://your-backend.onrender.com/api/v1/seed?key=your-seed-key
app.get('/api/v1/seed', async (req, res) => {
  if (req.query.key !== process.env.SEED_KEY) {
    return res.status(401).json({ success: false, message: 'Invalid or missing seed key' });
  }
  try {
    const { seedDatabase } = await import('./scripts/seed.js');
    const result = await seedDatabase();
    res.json({ success: true, message: 'Database seeded successfully', ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Error Handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    // Only start cron jobs after the connection is fully open
    if (mongoose.connection.readyState === 1) {
      startCronJobs();
    } else {
      mongoose.connection.once('open', startCronJobs);
    }
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});
