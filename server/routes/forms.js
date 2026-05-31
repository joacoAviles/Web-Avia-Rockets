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
    title: 'Nuevo contacto desde AVIA Rockets',
    routeField: 'interest',
    routes: {
      legal: process.env.FORM_TO_AVIA_CONTACT_LEGAL || process.env.FORM_TO_AVIA_CONTACT || 'contactoweb@aviarockets.cl',
      flota: process.env.FORM_TO_AVIA_CONTACT_FLOTA || process.env.FORM_TO_AVIA_CONTACT || 'contactoweb@aviarockets.cl',
      intelligence: process.env.FORM_TO_AVIA_CONTACT_INTELLIGENCE || process.env.FORM_TO_AVIA_CONTACT || 'contactoweb@aviarockets.cl',
      api: process.env.FORM_TO_AVIA_CONTACT_API || process.env.FORM_TO_AVIA_CONTACT || 'contactoweb@aviarockets.cl',
      lab: process.env.FORM_TO_AVIA_CONTACT_LAB || process.env.FORM_TO_AVIA_CONTACT || 'contactoweb@aviarockets.cl'
    }
  },
  avia_jobs: {
    to: process.env.FORM_TO_AVIA_JOBS || 'trabajo@aviarockets.cl',
    subject: 'Nueva postulacion desde AVIA Rockets',
    title: 'Nueva postulacion desde AVIA Rockets',
    routeField: 'area',
    routes: {
      'Desarrollo / Ingeniería': process.env.FORM_TO_AVIA_JOBS_ENGINEERING || process.env.FORM_TO_AVIA_JOBS || 'trabajo@aviarockets.cl',
      'Datos / BI / Automatización': process.env.FORM_TO_AVIA_JOBS_DATA || process.env.FORM_TO_AVIA_JOBS || 'trabajo@aviarockets.cl',
      'Producto / UX': process.env.FORM_TO_AVIA_JOBS_PRODUCT || process.env.FORM_TO_AVIA_JOBS || 'trabajo@aviarockets.cl',
      'Ventas / Growth': process.env.FORM_TO_AVIA_JOBS_SALES || process.env.FORM_TO_AVIA_JOBS || 'trabajo@aviarockets.cl',
      Operaciones: process.env.FORM_TO_AVIA_JOBS_OPERATIONS || process.env.FORM_TO_AVIA_JOBS || 'trabajo@aviarockets.cl',
      'Contenido / Marketing': process.env.FORM_TO_AVIA_JOBS_MARKETING || process.env.FORM_TO_AVIA_JOBS || 'trabajo@aviarockets.cl',
      'Administración / Finanzas': process.env.FORM_TO_AVIA_JOBS_ADMIN_FINANCE || process.env.FORM_TO_AVIA_JOBS || 'trabajo@aviarockets.cl',
      Otro: process.env.FORM_TO_AVIA_JOBS_OTHER || process.env.FORM_TO_AVIA_JOBS || 'trabajo@aviarockets.cl'
    }
  },
  joaquin_contact: {
    to: process.env.FORM_TO_JOAQUIN_CONTACT || 'keanuavia+webpage@gmail.com',
    subject: 'Nuevo contacto desde joaquin.aviles.cl',
    title: 'Nuevo contacto desde joaquin.aviles.cl',
    routeField: 'service_interest',
    routes: {
      'Instalación Domótica (Casa Automatizada)': process.env.FORM_TO_JOAQUIN_DOMOTICA || process.env.FORM_TO_JOAQUIN_CONTACT || 'keanuavia+webpage@gmail.com',
      'Marketing y Redes Sociales': process.env.FORM_TO_JOAQUIN_MARKETING || process.env.FORM_TO_JOAQUIN_CONTACT || 'keanuavia+webpage@gmail.com',
      Colaboraciones: process.env.FORM_TO_JOAQUIN_COLLABS || process.env.FORM_TO_JOAQUIN_CONTACT || 'keanuavia+webpage@gmail.com',
      Ranking: process.env.FORM_TO_JOAQUIN_RANKING || process.env.FORM_TO_JOAQUIN_CONTACT || 'keanuavia+webpage@gmail.com',
      Otros: process.env.FORM_TO_JOAQUIN_OTHER || process.env.FORM_TO_JOAQUIN_CONTACT || 'keanuavia+webpage@gmail.com'
    }
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

function resolveDestination(destination, data) {
  const selectedValue = destination.routeField ? data[destination.routeField] : undefined;
  return destination.routes?.[selectedValue] || destination.to;
}

function buildFields(data, req, to) {
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
    Destino: to,
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
  const to = resolveDestination(destination, data);
  const fields = buildFields(data, req, to);
  const record = appendRecord('leads', {
    id: uid('form'),
    type: data.form,
    to,
    routeField: destination.routeField,
    routeValue: destination.routeField ? data[destination.routeField] : null,
    fields,
    status: 'received',
    createdAt: new Date().toISOString()
  });

  try {
    await sendFormEmail({
      to,
      subject: data.subject || destination.subject,
      title: destination.title,
      fields
    });
    return res.status(201).json({ ok: true, id: record.id, to, message: 'Formulario enviado correctamente' });
  } catch (error) {
    console.error('MAIL_SEND_FAILED', error);
    return res.status(502).json({ ok: false, error: 'MAIL_SEND_FAILED', message: 'No se pudo enviar el correo' });
  }
});

export default router;
