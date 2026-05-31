import nodemailer from 'nodemailer';
import { config } from '../config.js';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildTransport() {
  if (!config.smtp.user || !config.smtp.pass) {
    throw new Error('SMTP credentials are not configured');
  }

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });
}

export function buildFormHtml({ title, fields }) {
  const rows = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `
      <tr>
        <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;background:#f9fafb;vertical-align:top;">${escapeHtml(key)}</th>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;white-space:pre-wrap;">${escapeHtml(value)}</td>
      </tr>
    `)
    .join('');

  return `
    <!doctype html>
    <html lang="es">
      <body style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
        <h2 style="margin:0 0 16px;">${escapeHtml(title)}</h2>
        <table style="border-collapse:collapse;width:100%;max-width:720px;border:1px solid #e5e7eb;">
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:18px;font-size:12px;color:#6b7280;">Correo generado automáticamente por AVIA Rockets.</p>
      </body>
    </html>
  `;
}

export async function sendFormEmail({ to, subject, title, fields }) {
  const transporter = buildTransport();
  const from = `${config.smtp.fromName} <${config.smtp.fromEmail}>`;
  const html = buildFormHtml({ title, fields });
  const text = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });
}
