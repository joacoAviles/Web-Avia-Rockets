import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 8080),
  frontendOrigin: process.env.FRONTEND_ORIGIN || '*',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  defaultCurrency: (process.env.DEFAULT_CURRENCY || 'clp').toLowerCase(),
  enableStripe: String(process.env.ENABLE_STRIPE || 'false').toLowerCase() === 'true',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.zoho.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromName: process.env.SMTP_FROM_NAME || 'AVIA Rockets',
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || ''
  }
};
