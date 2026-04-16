# AVIA Rockets API (SaaS Chile)

Backend agregado sin tocar el front actual, orientado a SaaS en Chile:
registro/login, suscripción mensual, pagos, webhook, control de acceso y base de facturación.

## Ejecutar localmente
```bash
npm install
cp .env.example .env
npm run dev
```

## Endpoints

## Salud
- `GET /api/health`

## Auth
- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/login`
- `POST /api/auth/recover-password`

## Leads
- `POST /api/leads`

## Perfil de facturación (Chile)
- `POST /api/billing-profiles` (requiere `Authorization: Bearer <token>`)
- `GET /api/billing-profiles/me` (requiere token)

Campos: `customerType`, `legalName`, `rut`, `giro`, `address`, `district`, `city`, `country`.

## Planes/Pagos
- `GET /api/payments/plans`
- `POST /api/payments/intents`
- `POST /api/payments/checkout-session`
- `POST /api/payments/webhook`

`checkout-session` soporta `provider`: `mock | stripe | transbank_oneclick | mercadopago`.

## Suscripciones
- `GET /api/subscriptions/statuses`
- `POST /api/subscriptions` (requiere token)
- `GET /api/subscriptions/me/current` (requiere token)
- `POST /api/subscriptions/:id/change-plan` (requiere token)
- `POST /api/subscriptions/:id/cancel` (requiere token)

Estados: `incomplete`, `trialing`, `active`, `past_due`, `suspended`, `canceled`.

## Acceso premium
- `GET /api/access/entitlements` (requiere token)

Responde si el usuario tiene acceso premium según estado de suscripción y período de gracia.

## Cobro mensual (job mock)
- `POST /api/billing/run-daily-cycle`

Procesa suscripciones vencidas, registra intentos en `paymentAttempts` y actualiza estado.

## Notas clave
- El backend NO guarda datos sensibles de tarjeta.
- El flujo de PSP real quedó preparado para integración productiva posterior.
- Persistencia actual es file-based (`data/store.json`), recomendado migrar a PostgreSQL para producción.
