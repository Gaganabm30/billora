// server/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Routes
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import subscriptionRouter from './routes/subscriptions.js';
import billingRouter from './routes/billing.js';
import invoiceRouter from './routes/invoices.js';
import teamRouter from './routes/team.js';
import usageRouter from './routes/usage.js';
import ticketsRouter from './routes/tickets.js';
import auditRouter from './routes/audit.js';
import notificationRouter from './routes/notifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://gbillora.netlify.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Base healthcheck
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// API Routes Mounting
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/billing', billingRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/team', teamRouter);
app.use('/api/usage', usageRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api/notifications', notificationRouter);

// Express Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Billora Express API Server running on port ${PORT}`);
  console.log(`🔗 Healthcheck available at: http://localhost:${PORT}/api/health`);
  console.log(`==================================================`);
});
