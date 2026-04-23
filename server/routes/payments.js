import { Router } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { plans, pricingPolicy } from '../lib/plans.js';
import { appendRecord, findBy } from '../lib/store.js';
import { uid } from '../lib/id.js';

const router = Router();
const stripe = config.enableStripe && config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

const checkoutSchema = z.object({
  planId: z.string(),
  customerEmail: z.string().email(),
  customerName: z.string().min(2),
  provider: z.enum(['mock', 'stripe', 'transbank_oneclick', 'mercadopago']).default('mock'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
});

const intentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  customerEmail: z.string().email(),
  description: z.string().min(3)
});

router.get('/plans', (_req, res) => {
  res.json({ plans, pricingPolicy });
});

router.post('/intents', async (req, res) => {
  const parsed = intentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const input = parsed.data;

  if (!stripe) {
    const mockPayment = {
      id: uid('pay'),
      provider: 'mock',
      amount: input.amount,
      currency: (input.currency || config.defaultCurrency).toLowerCase(),
      customerEmail: input.customerEmail,
      description: input.description,
      status: 'requires_payment_method',
      clientSecret: `mock_secret_${crypto.randomBytes(12).toString('hex')}`,
      createdAt: new Date().toISOString()
    };

    appendRecord('payments', mockPayment);
    return res.status(201).json({ paymentIntent: mockPayment, mode: 'mock' });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(input.amount * 100),
    currency: (input.currency || config.defaultCurrency).toLowerCase(),
    receipt_email: input.customerEmail,
    description: input.description,
    automatic_payment_methods: { enabled: true }
  });

  appendRecord('payments', {
    id: paymentIntent.id,
    provider: 'stripe',
    amount: input.amount,
    currency: paymentIntent.currency,
    customerEmail: input.customerEmail,
    description: input.description,
    status: paymentIntent.status,
    clientSecret: paymentIntent.client_secret,
    createdAt: new Date().toISOString()
  });

  return res.status(201).json({ paymentIntent, mode: 'stripe' });
});

router.post('/checkout-session', async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const input = parsed.data;
  const plan = plans.find((p) => p.id === input.planId);
  if (!plan) return res.status(404).json({ error: 'PLAN_NOT_FOUND' });

  if (input.provider === 'transbank_oneclick') {
    const token = uid('tbk_inscription');
    const session = {
      id: uid('cs'),
      provider: input.provider,
      status: 'redirect_required',
      redirectUrl: `https://webpay3gint.transbank.cl/oneclick/start?token=${token}`,
      externalReference: token,
      customerEmail: input.customerEmail,
      planId: plan.id,
      createdAt: new Date().toISOString()
    };

    appendRecord('payments', session);
    return res.status(201).json({ checkoutSession: session, mode: 'transbank_oneclick' });
  }

  if (input.provider === 'mercadopago') {
    const preapprovalId = uid('mp_preapproval');
    const session = {
      id: uid('cs'),
      provider: input.provider,
      status: 'redirect_required',
      redirectUrl: `https://www.mercadopago.cl/subscriptions/checkout?preapproval_id=${preapprovalId}`,
      externalReference: preapprovalId,
      customerEmail: input.customerEmail,
      planId: plan.id,
      createdAt: new Date().toISOString()
    };

    appendRecord('payments', session);
    return res.status(201).json({ checkoutSession: session, mode: 'mercadopago' });
  }

  if (input.provider === 'mock' || !stripe) {
    const session = {
      id: uid('cs'),
      provider: 'mock',
      url: `${input.successUrl || 'http://localhost:5500'}/?checkout=success&session=${uid('sess')}`,
      customerEmail: input.customerEmail,
      planId: plan.id,
      status: 'open',
      createdAt: new Date().toISOString()
    };

    appendRecord('payments', session);
    return res.status(201).json({ checkoutSession: session, mode: 'mock' });
  }

  if (!input.successUrl || !input.cancelUrl) {
    return res.status(400).json({ error: 'successUrl and cancelUrl are required in stripe mode' });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: input.customerEmail,
    line_items: [
      {
        price_data: {
          currency: plan.currency,
          recurring: { interval: plan.billingPeriod === 'annual' ? 'year' : 'month' },
          product_data: { name: plan.name },
          unit_amount: Math.round(plan.grossPriceClp)
        },
        quantity: 1
      }
    ],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: {
      planId: plan.id,
      customerName: input.customerName
    }
  });

  appendRecord('payments', {
    id: session.id,
    provider: 'stripe',
    url: session.url,
    customerEmail: input.customerEmail,
    planId: plan.id,
    status: session.status,
    createdAt: new Date().toISOString()
  });

  return res.status(201).json({ checkoutSession: session, mode: 'stripe' });
});

router.post('/webhook', async (req, res) => {
  const provider = String(req.headers['x-provider'] || 'stripe').toLowerCase();
  const eventId = String(req.headers['x-event-id'] || req.body?.id || '');

  if (eventId) {
    const alreadyProcessed = findBy('webhookEvents', (event) => event.providerEventId === eventId);
    if (alreadyProcessed) {
      return res.status(200).json({ message: 'Duplicate event ignored', duplicate: true });
    }
  }

  if (provider !== 'stripe') {
    appendRecord('webhookEvents', {
      id: uid('wh_evt'),
      provider,
      providerEventId: eventId || uid('evt'),
      status: 'processed',
      payload: req.body,
      receivedAt: new Date().toISOString()
    });

    return res.status(200).json({ received: true, provider });
  }

  if (!stripe || !config.stripeWebhookSecret) {
    return res.status(200).json({ message: 'Webhook ignored (stripe disabled)' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).send('Missing stripe-signature header');

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, config.stripeWebhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  appendRecord('webhookEvents', {
    id: uid('wh_evt'),
    provider,
    providerEventId: event.id,
    status: 'processed',
    eventType: event.type,
    receivedAt: new Date().toISOString()
  });

  if (event.type.startsWith('payment_intent.')) {
    appendRecord('payments', {
      id: uid('wh'),
      provider: 'stripe',
      eventType: event.type,
      payloadId: event.data.object.id,
      status: event.data.object.status,
      createdAt: new Date().toISOString()
    });
  }

  return res.status(200).json({ received: true });
});

export default router;
