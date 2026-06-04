import { Router } from 'express';
import { readStore } from '../lib/store.js';
import { dashboardForUser, productServices, publicCause } from '../lib/app-data.js';

const router = Router();

function publicDashboardSnapshot() {
  const store = readStore();
  const user = store.users.find((item) => item.status === 'active') || store.users[0];
  if (!user) {
    return {
      products: productServices,
      causes: [],
      stats: {
        total_causes_count: 0,
        active_causes_count: 0,
        inactive_causes_count: 0,
        daily_summary_email_enabled: false
      }
    };
  }

  const dashboard = dashboardForUser(user, store);
  return {
    products: productServices,
    causes: dashboard.causes.slice(0, 8),
    stats: dashboard.stats
  };
}

router.get('/home', (_req, res) => {
  return res.json(publicDashboardSnapshot());
});

router.get('/causes', (_req, res) => {
  const store = readStore();
  const causes = store.causes
    .slice(0, 20)
    .map((cause) => publicCause(cause, store.causeResults));

  return res.json({ causes });
});

export function sitePayload() {
  return {
    services: productServices,
    settings: {
      brand: 'AVIA Rockets',
      defaultLanguage: 'es',
      supportEmail: 'contactoweb@aviarockets.cl'
    }
  };
}

export default router;
