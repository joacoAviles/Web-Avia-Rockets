import { Router } from 'express';
import { z } from 'zod';
import { appendRecord } from '../lib/store.js';
import { uid } from '../lib/id.js';
import { sendFormEmail } from '../lib/mailer.js';

const router = Router();

const DESTINATIONS = {
  avia_contact: {
    to: process.env.FORM_TO_AVIA_CONTACT || 'contactoweb@aviarockets.cl',
    subject: 'Nuevo contacto desde AVIA Rockets',
    title: 'Nuevo contacto desde AVIA Rockets'
  },
  avia_jobs: {
    to: process.env.FORM_TO_AVIA_JOBS || 'trabajo@aviarockets.cl',
    subject: 'Nueva postulacion desde AVIA Rockets',
    title: 'Nueva postulacion desde AVIA Rockets'
  },
  joaquin_contact: {
    to: process.env.FORM_TO_JOAQUIN_CONTACT || 'keanuavia+webpage@gmail.com',
    subject: 'Nuevo contacto desde joaquin.aviles.cl',
    title: 'Nuevo contacto desde joaquin.aviles.cl'
  }
};

const formSchema = z.object({
  form: z.enum(['avia_contact', 'avia_jobs', 'joaquin_contact']),
  name: z.string().min(2).max(120),
  email: z.string().email().max(180),
  message: z.string().min(5).max(5000),
  interest: z.string().max(120).optional(),
  area: z.string().max(120).optional(),
  service_interest: z.string().max(160).optional(),
  subject: z.string().max(180).optional(),
  source: z.string().max(180).optional(),
  phone: z.string().max(60).optional(),
  company: z.string().max(160).optional(),
  website: z.string().max(220).optional(),
  portfolio: z.string().max(220).optional(),
  _honey: z.string().max(1).optional()
}).passthrough();

function cleanFields(fields) {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
  );
}

function buildFields(data, req) {
  return cleanFields({
    Nombre: data.name,
    Correo: data.email,
    Telefono: data.phone,
    Empresa: data.company,
    Sitio: data.website,
    Portafolio: data.portfolio,
    'Linea de interes': data.interest,
    'Area de interes': data.area,
    'Tipo de consulta': data.service_interest,
    Asunto: data.subject,
    Mensaje: data.message,
    Formulario: data.form,
    Origen: data.source || req.get('origin') || req.get('referer') || 'sin origen',
    Fecha: new Date().toISOString()
  });
}

router.post('/submit', async (req, res) => {
  const parsed = formSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  }

  const data = parsed.data;
  if (data._honey) return res.status(200).json({ ok: true, skipped: true });

  const destination = DESTINATIONS[data.form];
  const fields = buildFields(data, req);
  const record = appendRecord('leads', {
    id: uid('form'),
    type: data.form,
    to: destination.to,
    fields,
    status: 'received',
    createdAt: new Date().toISOString()
  });

  try {
    await sendFormEmail({
      to: destination.to,
      subject: data.subject || destination.subject,
      title: destination.title,
      fields
    });
    return res.status(201).json({ ok: true, id: record.id, message: 'Formulario enviado correctamente' });
  } catch (error) {
    console.error('MAIL_SEND_FAILED', error);
    return res.status(502).json({ ok: false, error: 'MAIL_SEND_FAILED', message: 'No se pudo enviar el correo' });
  }
});

export default router;
