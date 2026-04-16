import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 8080),
  frontendOrigin: process.env.FRONTEND_ORIGIN || '*',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  defaultCurrency: (process.env.DEFAULT_CURRENCY || 'clp').toLowerCase(),
  enableStripe: String(process.env.ENABLE_STRIPE || 'false').toLowerCase() === 'true'
};
