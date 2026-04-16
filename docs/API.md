# AVIA Rockets API (Back-end agregado sin tocar el front actual)

## Objetivo
Este backend habilita funcionalidades de negocio para la web actual sin modificar su UI existente:

- Captura de leads/contactos (`/api/leads`)
- Catálogo de planes (`/api/payments/plans`)
- Flujo de pagos con modo **mock** o **Stripe real**
- Gestión de suscripciones (`/api/subscriptions`)
- Webhook de Stripe para eventos de pago

## Ejecutar localmente
```bash
npm install
cp .env.example .env
npm run dev
```

## Variables de entorno
- `PORT`: puerto del API (default `8080`)
- `FRONTEND_ORIGIN`: origen permitido por CORS
- `ENABLE_STRIPE`: `true|false` (default `false`)
- `STRIPE_SECRET_KEY`: clave secreta Stripe
- `STRIPE_WEBHOOK_SECRET`: secreto de webhook
- `DEFAULT_CURRENCY`: moneda por defecto (`usd`)

## Endpoints principales

### Salud
- `GET /api/health`

### Leads
- `POST /api/leads`

Payload ejemplo:
```json
{
  "name": "Ana Pérez",
  "company": "Fleet Chile",
  "email": "ana@fleet.cl",
  "interest": "fleet",
  "preferredLanguage": "es",
  "message": "Necesito control de vencimientos para 60 vehículos"
}
```

### Planes y pagos
- `GET /api/payments/plans`
- `POST /api/payments/intents` (pago único)
- `POST /api/payments/checkout-session` (suscripción)
- `POST /api/payments/webhook`

### Suscripciones
- `POST /api/subscriptions`
- `GET /api/subscriptions/:id`
- `POST /api/subscriptions/:id/cancel`

## Integración recomendada sin cambiar diseño
Sin tocar componentes visuales existentes, puedes:
1. Conectar el formulario de contacto actual a `/api/leads`.
2. Agregar una nueva sección/landing de pricing que consulte `/api/payments/plans`.
3. Al confirmar plan, invocar `/api/payments/checkout-session`.
4. Para venta asistida, crear la suscripción con `/api/subscriptions` en estado `pending_payment`.
