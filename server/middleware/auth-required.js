import { readToken } from '../lib/auth.js';

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'MISSING_AUTH_TOKEN' });

  const payload = readToken(token);
  if (!payload) return res.status(401).json({ error: 'INVALID_OR_EXPIRED_TOKEN' });

  req.auth = payload;
  return next();
}
