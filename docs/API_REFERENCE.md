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
Inicia sesión y devuelve token. Acepta `identifier` para usuario o correo, o `email` para compatibilidad.

**Body**
```json
{
  "identifier": "usuario1",
  "password": "usuario1"
}
```

**Respuesta 200**
```json
{
  "token": "eyJ1c2VySWQiOiJ1c3Jf...",
  "user": {
    "id": "usr_usuario1",
    "username": "usuario1",
    "name": "Usuario Legal 1",
    "email": "usuario1@aviarockets.local",
    "role": "legal",
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

## 3.1) Sitio publico

### GET `/api/site`
Entrega catalogo de servicios y settings publicos para poblar textos/selects del front.

### GET `/api/public/home`
Entrega productos, estadisticas y causas publicas de referencia para las visualizaciones del home.

**Respuesta 200**
```json
{
  "products": [
    {
      "id": "svc_legal",
      "slug": "legal",
      "name": "OPS Legal",
      "short_description": "Causas judiciales",
      "full_description": "Revisa causas, registra resultados, detecta cambios y mantiene trazabilidad por usuario.",
      "is_active": true
    }
  ],
  "causes": [],
  "stats": {
    "total_causes_count": 0,
    "active_causes_count": 0,
    "inactive_causes_count": 0,
    "daily_summary_email_enabled": true
  }
}
```

---

## 3.2) Dashboard cliente

### GET `/api/dashboard` (Auth)
Entrega todo lo necesario para `app.html`: usuario, cuenta, causas, resultados recientes y estadisticas.

---

## 3.3) Causas y resultados

### GET `/api/causes` (Auth)
Lista las causas del usuario.

### POST `/api/causes` (Auth)
Crea o actualiza una causa por `code`.

**Body**
```json
{
  "code": "C-5351-2026",
  "court": "29 Juzgado Civil de Santiago",
  "title": "Cobranza ejecutiva",
  "status": "active"
}
```

### POST `/api/causes/bulk` (Auth)
Carga varias causas.

**Body**
```json
{
  "causes": [
    { "code": "C-5351-2026", "court": "29 Juzgado Civil de Santiago" },
    { "code": "O-808-2025", "court": "2 Juzgado de Letras del Trabajo", "status": "inactive" }
  ]
}
```

### PATCH `/api/causes/:id/status` (Auth)
Activa o pausa una causa.

**Body**
```json
{ "status": "inactive" }
```

### POST `/api/causes/:id/results` (Auth)
Guarda un resultado manual para una causa.

**Body**
```json
{
  "summary": "Cambio relevante detectado",
  "result_text": "Nuevo movimiento en expediente",
  "has_changes": true
}
```

### GET `/api/causes/:id/results` (Auth)
Lista historial de resultados de una causa.

### POST `/api/causes/:id/run` (Auth)
Genera una revision manual. Si el resultado nuevo es igual al anterior, queda marcado sin cambios.

---

## 3.4) Cuenta y configuracion

### GET `/api/auth/me` (Auth)
Devuelve el usuario autenticado.

### POST `/api/auth/logout`
Cierra sesion en cliente. La API responde `{ "ok": true }`.

### PATCH `/api/account/settings` (Auth)
Actualiza preferencias.

**Body**
```json
{
  "daily_summary_email_enabled": true,
  "ui_theme_preference": "dark",
  "default_payment_method": "manual"
}
```

### POST `/api/account/delete-request` (Auth)
Registra solicitud de eliminacion de cuenta.

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
  -d '{"identifier":"usuario1","password":"usuario1"}'
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
