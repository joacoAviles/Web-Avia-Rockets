# API Reference completa - AVIA Rockets SaaS (Chile)

> Base URL local: `http://localhost:8080`
>
> Formato respuestas: JSON
>
> Auth: `Authorization: Bearer <token>` en endpoints protegidos

---

## 1) Health

### GET `/api/health`
Verifica estado del servicio.

**Respuesta 200**
```json
{
  "ok": true,
  "service": "avia-rockets-api",
  "timestamp": "2026-04-18T11:00:00.000Z"
}
```

---

## 2) Autenticación

### POST `/api/auth/register`
Registra un usuario nuevo.

**Body**
```json
{
  "name": "Ana Pérez",
  "email": "ana@empresa.cl",
  "phone": "+56911112222",
  "password": "claveSuperSegura123",
  "type": "company"
}
```

**Respuesta 201**
```json
{
  "user": {
    "id": "usr_xxx",
    "email": "ana@empresa.cl",
    "name": "Ana Pérez",
    "role": "user",
    "status": "pending_verification"
  },
  "verificationToken": "verify_xxx",
  "message": "User created, verify email to activate account"
}
```

### POST `/api/auth/verify-email`
Activa la cuenta con token de verificación.

**Body**
```json
{ "token": "verify_xxx" }
```

### POST `/api/auth/login`
Inicia sesión y devuelve token.

**Body**
```json
{
  "email": "ana@empresa.cl",
  "password": "claveSuperSegura123"
}
```

**Respuesta 200**
```json
{
  "token": "eyJ1c2VySWQiOiJ1c3Jf...",
  "user": {
    "id": "usr_xxx",
    "name": "Ana Pérez",
    "email": "ana@empresa.cl",
    "role": "user",
    "status": "active"
  }
}
```

### POST `/api/auth/recover-password`
Genera token de recuperación (flujo base).

**Body**
```json
{ "email": "ana@empresa.cl" }
```

---

## 3) Leads / Contacto

### POST `/api/leads`
Captura lead desde web pública.

**Body**
```json
{
  "name": "Ana Pérez",
  "company": "Fleet Chile",
  "email": "ana@fleet.cl",
  "interest": "fleet",
  "preferredLanguage": "es",
  "message": "Necesito demo de gestión de vencimientos"
}
```

---

## 4) Perfil de facturación Chile

### POST `/api/billing-profiles` (Auth)
Crea/actualiza perfil tributario.

**Body**
```json
{
  "customerType": "company",
  "legalName": "Transportes XYZ SpA",
  "rut": "76.123.456-7",
  "giro": "Transporte de carga",
  "address": "Av. Siempre Viva 123",
  "district": "Santiago Centro",
  "city": "Santiago",
  "country": "Chile"
}
```

### GET `/api/billing-profiles/me` (Auth)
Retorna perfil de facturación del usuario autenticado.

---

## 5) Planes y pagos

### GET `/api/payments/plans`
Lista planes y política de cobro (IVA, gracia, trial, etc.).

### POST `/api/payments/intents`
Crea intento de pago único.

**Body**
```json
{
  "amount": 18990,
  "currency": "clp",
  "customerEmail": "ana@empresa.cl",
  "description": "Pago único setup"
}
```

### POST `/api/payments/checkout-session`
Crea sesión de checkout/recurrente.

**Body**
```json
{
  "planId": "plan_growth_monthly",
  "customerEmail": "ana@empresa.cl",
  "customerName": "Ana Pérez",
  "provider": "transbank_oneclick",
  "successUrl": "https://tuweb.cl/success",
  "cancelUrl": "https://tuweb.cl/cancel"
}
```

`provider` soportados:
- `mock`
- `stripe`
- `transbank_oneclick`
- `mercadopago`

### POST `/api/payments/webhook`
Webhook PSP. Dedupe por `x-event-id`.

Headers recomendados:
- `x-provider`: `stripe | transbank_oneclick | mercadopago`
- `x-event-id`: ID único del evento PSP

Para Stripe real, se valida además `stripe-signature`.

---

## 6) Suscripciones

### GET `/api/subscriptions/statuses`
Estados soportados y política actual.

### POST `/api/subscriptions` (Auth)
Crea suscripción.

**Body**
```json
{
  "planId": "plan_start_monthly",
  "paymentMethod": "card",
  "provider": "mock"
}
```

### GET `/api/subscriptions/me/current` (Auth)
Suscripción actual del usuario.

### POST `/api/subscriptions/:id/change-plan` (Auth)
Upgrade / downgrade.

**Body**
```json
{
  "targetPlanId": "plan_growth_monthly",
  "reason": "growth_team"
}
```

### POST `/api/subscriptions/:id/cancel` (Auth)
Cancelación inmediata o fin de período según policy.

---

## 7) Entitlements (bloqueo premium)

### GET `/api/access/entitlements` (Auth)
Determina acceso según estado:
- `active` / `trialing` => acceso completo
- `past_due` + `graceUntil` vigente => acceso temporal con banner
- resto => acceso denegado + acción sugerida

---

## 8) Cobro automático diario

### POST `/api/billing/run-daily-cycle`
Procesa suscripciones por cobrar:
- registra `paymentAttempts`
- extiende período si aprueba
- marca `past_due` y gracia si rechaza

> En estado actual es un job mock para acelerar desarrollo.

---

## 9) Códigos de error frecuentes

- `VALIDATION_ERROR`
- `EMAIL_ALREADY_REGISTERED`
- `INVALID_CREDENTIALS`
- `INVALID_OR_EXPIRED_TOKEN`
- `MISSING_AUTH_TOKEN`
- `PLAN_NOT_FOUND`
- `SUBSCRIPTION_NOT_FOUND`
- `USER_ALREADY_HAS_SUBSCRIPTION`
- `INVALID_RUT`

---

## 10) Colección cURL mínima para dejar la página funcional rápido

1. Registrar usuario
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"name":"Ana","email":"ana@empresa.cl","password":"supersegura123","type":"company"}'
```

2. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"ana@empresa.cl","password":"supersegura123"}'
```

3. Ver planes
```bash
curl http://localhost:8080/api/payments/plans
```

4. Crear suscripción
```bash
curl -X POST http://localhost:8080/api/subscriptions \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer <TOKEN>' \
  -d '{"planId":"plan_start_monthly","provider":"mock","paymentMethod":"card"}'
```

5. Consultar acceso premium
```bash
curl http://localhost:8080/api/access/entitlements \
  -H 'authorization: Bearer <TOKEN>'
```
