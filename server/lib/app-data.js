import { plans } from './plans.js';

export const productServices = [
  {
    id: 'svc_legal',
    slug: 'legal',
    name: 'OPS Legal',
    short_description: 'Causas judiciales',
    full_description: 'Revisa causas, registra resultados, detecta cambios y mantiene trazabilidad por usuario.',
    is_active: true
  },
  {
    id: 'svc_flota',
    slug: 'flota',
    name: 'OPS Flota',
    short_description: 'Vehiculos y vencimientos',
    full_description: 'Ordena vehiculos, mantenciones, documentos criticos y alertas operativas.',
    is_active: true
  },
  {
    id: 'svc_intelligence',
    slug: 'intelligence',
    name: 'Avia Intelligence',
    short_description: 'Riesgo y datos',
    full_description: 'Convierte datos dispersos en senales, scores y tableros de decision.',
    is_active: true
  },
  {
    id: 'svc_api',
    slug: 'api',
    name: 'Avia API',
    short_description: 'Conectores',
    full_description: 'Endpoints para conectar operacion, datos, paneles y automatizaciones internas.',
    is_active: true
  },
  {
    id: 'svc_lab',
    slug: 'lab',
    name: 'Avia Lab',
    short_description: 'Apps internas',
    full_description: 'Apps, APIs y automatizaciones a medida para procesos reales.',
    is_active: true
  }
];

export function normalizeCauseStatus(status) {
  if (status === 'active') return 'active';
  if (status === 'inactive' || status === 'paused' || status === 'pause') return 'inactive';
  return null;
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username || null,
    email: user.email,
    name: user.name || user.full_name || user.email,
    full_name: user.full_name || user.name || user.email,
    role: user.role || 'user',
    status: user.status || 'active',
    type: user.type || 'person',
    products: Array.isArray(user.products) ? user.products : [],
    permissions: user.permissions && typeof user.permissions === 'object'
      ? {
          products: Array.isArray(user.permissions.products) ? user.permissions.products : [],
          lines: Array.isArray(user.permissions.lines) ? user.permissions.lines : []
        }
      : { products: [], lines: [] }
  };
}

export function defaultSettings(user = {}) {
  return {
    daily_summary_email_enabled: true,
    ui_theme_preference: 'dark',
    default_payment_method: 'manual',
    ...(user.settings || {})
  };
}

export function latestResultForCause(cause, results) {
  return results
    .filter((result) => result.causeId === cause.id)
    .sort((a, b) => new Date(b.checkedAt || b.createdAt || 0) - new Date(a.checkedAt || a.createdAt || 0))[0] || null;
}

export function comparisonForCause(cause, results) {
  const sorted = results
    .filter((result) => result.causeId === cause.id)
    .sort((a, b) => new Date(b.checkedAt || b.createdAt || 0) - new Date(a.checkedAt || a.createdAt || 0));
  const latest = sorted[0] || null;
  const previous = sorted[1] || null;

  if (!latest || !previous) {
    return {
      latest,
      previous,
      changed: false,
      label: latest ? 'Sin comparacion anterior' : 'Sin resultados'
    };
  }

  const changed = String(latest.result_text || '').trim() !== String(previous.result_text || '').trim();
  return {
    latest,
    previous,
    changed,
    label: changed ? 'Cambio detectado contra ayer' : 'Sin cambios contra ayer'
  };
}

export function publicCause(cause, results = []) {
  const status = normalizeCauseStatus(cause.user_status || cause.status) || 'inactive';
  const comparison = comparisonForCause(cause, results);
  const latest = comparison.latest;
  return {
    id: cause.id,
    code: cause.code,
    title: cause.title || 'Causa sin titulo',
    court: cause.court || '',
    status,
    user_status: status,
    assigned_users_count: 1,
    last_checked_at: latest?.checkedAt || cause.last_checked_at || null,
    last_result: latest?.result_text || cause.last_result || 'Pendiente primera revision',
    last_has_changes: Boolean(latest?.has_changes ?? cause.last_has_changes),
    latest_result: latest
      ? {
          id: latest.id,
          summary: latest.summary,
          result_text: latest.result_text,
          has_changes: Boolean(latest.has_changes),
          checkedAt: latest.checkedAt || latest.createdAt
        }
      : null,
    comparison: {
      changed: comparison.changed,
      label: comparison.label,
      previous_checked_at: comparison.previous?.checkedAt || comparison.previous?.createdAt || null,
      latest_checked_at: latest?.checkedAt || latest?.createdAt || null
    },
    createdAt: cause.createdAt,
    updatedAt: cause.updatedAt
  };
}

export function subscriptionSummary(subscription) {
  if (!subscription) {
    return {
      plan_slug: 'free',
      planId: 'plan_free',
      status: 'active',
      is_paid: false,
      provider: 'mock'
    };
  }

  const plan = subscription.planSnapshot || plans.find((item) => item.id === subscription.planId);
  return {
    id: subscription.id,
    plan_slug: plan?.code?.toLowerCase() || subscription.planId || 'free',
    planId: subscription.planId,
    status: subscription.status,
    is_paid: Boolean(plan && plan.grossPriceClp > 0 && ['active', 'trialing'].includes(subscription.status)),
    provider: subscription.provider,
    currentPeriodEnd: subscription.currentPeriodEnd,
    nextBillingAt: subscription.nextBillingAt
  };
}

export function accountForUser(user, store) {
  const subscription = store.subscriptions.find(
    (item) => item.userId === user.id && !['canceled', 'suspended'].includes(item.status)
  );

  return {
    id: `acct_${user.id}`,
    email: user.email,
    personal_data: {
      full_name: user.full_name || user.name || user.email,
      phone: user.phone || null,
      type: user.type || 'person'
    },
    settings: defaultSettings(user),
    subscription: subscriptionSummary(subscription),
    terms: {
      accepted: Boolean(user.terms?.accepted),
      version: user.terms?.version || '1.102',
      acceptedAt: user.terms?.acceptedAt || user.emailVerifiedAt || user.createdAt
    }
  };
}

export function dashboardForUser(user, store) {
  const results = store.causeResults.filter((result) => result.userId === user.id);
  const causes = store.causes
    .filter((cause) => cause.userId === user.id && normalizeCauseStatus(cause.user_status || cause.status))
    .map((cause) => publicCause(cause, results))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  const settings = defaultSettings(user);
  const active = causes.filter((cause) => cause.user_status === 'active').length;
  const inactive = causes.filter((cause) => cause.user_status === 'inactive').length;
  const changes = results.filter((result) => result.has_changes).length;

  return {
    user: publicUser(user),
    products: Array.isArray(user.products) ? user.products : [],
    account: accountForUser(user, store),
    causes,
    recentResults: results
      .slice()
      .sort((a, b) => new Date(b.checkedAt || b.createdAt || 0) - new Date(a.checkedAt || a.createdAt || 0))
      .slice(0, 20),
    stats: {
      total_causes_count: causes.length,
      active_causes_count: active,
      inactive_causes_count: inactive,
      results_count: results.length,
      changes_count: changes,
      daily_summary_email_enabled: Boolean(settings.daily_summary_email_enabled)
    }
  };
}
