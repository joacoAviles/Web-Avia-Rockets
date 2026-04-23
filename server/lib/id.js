import crypto from 'node:crypto';

export function uid(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}
