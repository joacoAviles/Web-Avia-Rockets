import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import healthRoutes from './routes/health.js';
import leadRoutes from './routes/leads.js';
import formRoutes from './routes/forms.js';
import paymentRoutes from './routes/payments.js';
import subscriptionRoutes from './routes/subscriptions.js';
import authRoutes from './routes/auth.js';
import billingProfileRoutes from './routes/billing-profiles.js';
import accessRoutes from './routes/access.js';
import billingCycleRoutes from './routes/billing-cycle.js';
import causeRoutes from './routes/causes.js';
import resultRoutes from './routes/results.js';
import dashboardRoutes from './routes/dashboard.js';
import accountRoutes from './routes/account.js';
import publicRoutes from './routes/public.js';
import siteRoutes from './routes/site.js';
import adminRoutes from './routes/admin.js';

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
    features: [
      'lead capture',
      'form email delivery',
      'authentication',
      'billing profiles (Chile)',
      'payments',
      'subscriptions',
      'entitlements',
      'billing cycle',
      'dashboard',
      'causes',
      'results'
    ]
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/billing-profiles', billingProfileRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/billing', billingCycleRoutes);
app.use('/api/causes', causeRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/site', siteRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
});

export default app;
