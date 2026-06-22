// dotenv always load 1st for use anywhere you want
import '../src/config/env.js';

import express from 'express';
import cors from 'cors';

import connectDB from './config/db.js';
import authRoute from './routes/authRoute.js'
import flightRoutes from './routes/flightRoutes.js';

connectDB();
const app = express();

// Middleware setup 
app.use(cors());
app.use(express.json());

// routes
app.use('/api/auth', authRoute)
app.use('/api/flights', flightRoutes);


export default app;