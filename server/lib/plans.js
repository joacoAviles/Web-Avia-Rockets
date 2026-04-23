export const pricingPolicy = {
  country: 'CL',
  currency: 'clp',
  vatRate: 0.19,
  pricesIncludeVat: true,
  graceDaysAfterFailedPayment: 5,
  cancellationPolicy: 'cancel_at_period_end',
  refundPolicy: 'proportional_refund_only_for_billing_errors',
  trialPolicy: {
    enabled: true,
    days: 14,
    requiresCard: true
  },
  delinquencyPolicy: {
    firstFailureStatus: 'past_due',
    finalFailureStatus: 'suspended',
    retries: [1, 3, 5]
  }
};

export const plans = [
  {
    id: 'plan_free',
    code: 'FREE',
    name: 'Free',
    billingPeriod: 'monthly',
    hasTrial: false,
    netPriceClp: 0,
    vatClp: 0,
    grossPriceClp: 0,
    currency: 'clp',
    features: ['1 usuario', 'Funciones básicas', 'Sin cobro recurrente']
  },
  {
    id: 'plan_start_monthly',
    code: 'START_M',
    name: 'Start Mensual',
    billingPeriod: 'monthly',
    hasTrial: true,
    trialDays: 14,
    netPriceClp: 15958,
    vatClp: 3032,
    grossPriceClp: 18990,
    currency: 'clp',
    features: ['Hasta 3 usuarios', 'Soporte por correo', 'API básica']
  },
  {
    id: 'plan_growth_monthly',
    code: 'GROWTH_M',
    name: 'Growth Mensual',
    billingPeriod: 'monthly',
    hasTrial: true,
    trialDays: 14,
    netPriceClp: 32765,
    vatClp: 6225,
    grossPriceClp: 38990,
    currency: 'clp',
    features: ['Hasta 15 usuarios', 'Módulos premium', 'Soporte prioritario']
  },
  {
    id: 'plan_growth_annual',
    code: 'GROWTH_Y',
    name: 'Growth Anual',
    billingPeriod: 'annual',
    hasTrial: false,
    netPriceClp: 330168,
    vatClp: 62732,
    grossPriceClp: 392900,
    currency: 'clp',
    features: ['Hasta 15 usuarios', '2 meses de ahorro', 'Soporte prioritario']
  },
  {
    id: 'plan_enterprise',
    code: 'ENTERPRISE',
    name: 'Enterprise',
    billingPeriod: 'monthly',
    hasTrial: false,
    netPriceClp: 0,
    vatClp: 0,
    grossPriceClp: 0,
    currency: 'clp',
    features: ['Usuarios ilimitados', 'Integraciones avanzadas', 'SLA dedicado']
  }
];
