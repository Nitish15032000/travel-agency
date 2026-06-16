import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoute from './routes/authRoute.js'

dotenv.config();
connectDB();
const app = express();

// Middleware setup 
app.use(cors());
app.use(express.json());

// routes
app.use('/api/auth', authRoute)


export default app;