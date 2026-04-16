import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import healthRoutes from './routes/health.js';
import leadRoutes from './routes/leads.js';
import paymentRoutes from './routes/payments.js';
import subscriptionRoutes from './routes/subscriptions.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendOrigin === '*' ? true : config.frontendOrigin }));
app.use(morgan('dev'));

app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    express.raw({ type: 'application/json' })(req, res, () => {
      req.rawBody = req.body;
      next();
    });
  } else {
    express.json()(req, res, next);
  }
});

app.get('/', (_req, res) => {
  res.json({
    service: 'AVIA Rockets API',
    docs: '/api/health',
    features: ['lead capture', 'payments', 'subscriptions']
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
});

export default app;
