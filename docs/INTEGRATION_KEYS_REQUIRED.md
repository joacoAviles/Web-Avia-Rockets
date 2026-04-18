# APIs y claves que debes entregar para operar todo

## Prioridad 1 (dejar funcional ya)

### A) Frontend origin
- `FRONTEND_ORIGIN` (ej: `https://tu-dominio.cl`)

### B) Proveedor de pago principal (elige uno primero)

#### Opción 1: Transbank Oneclick (recomendado Chile)
Debes entregar:
- Commerce Code (integración y producción)
- API Key Secret (integración y producción)
- URLs de retorno (`success`, `failure`, `cancel`)
- IPs / whitelisting si aplica

#### Opción 2: Mercado Pago Suscripciones
Debes entregar:
- Access Token (test y prod)
- Public Key
- Webhook Secret / firma
- URL de notificación

#### Opción 3: Stripe (si prefieres internacional)
Debes entregar:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Prioridad 2 (operación real)

### C) Correos transaccionales
- API Key de proveedor (SendGrid, Resend, Postmark, etc.)
- Dominio verificado
- Remitente oficial (ej: `facturacion@tu-dominio.cl`)

### D) Facturación electrónica Chile
Debes definir:
- SII directo o facturador externo
- Credenciales API del facturador
- Certificado digital (si aplica)
- Rango folios / tipo DTE habilitado

## Variables sugeridas para `.env`

```env
# Core
PORT=8080
FRONTEND_ORIGIN=https://tu-dominio.cl

# PSP (elige una ruta principal)
PAYMENT_PROVIDER=transbank_oneclick

# Stripe (opcional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Transbank (recomendado CL)
TBK_COMMERCE_CODE=
TBK_API_KEY=
TBK_ENV=integration

# MercadoPago (alternativa)
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
MP_WEBHOOK_SECRET=

# Mail
MAIL_PROVIDER=
MAIL_API_KEY=
MAIL_FROM=

# Facturación
INVOICING_PROVIDER=
INVOICING_API_KEY=
INVOICING_ENV=sandbox
```

## Qué mandarme en el próximo prompt para dejarlo operativo

1. Proveedor elegido (`transbank_oneclick` o `mercadopago` o `stripe`).
2. Claves de **sandbox** del proveedor.
3. URL pública de frontend + URL pública backend para webhooks.
4. Si emitirás boleta, factura o ambas.
5. Proveedor de correos (si quieres activar emails ya).
