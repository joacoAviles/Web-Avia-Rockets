# Base de datos a crear (qué tablas y para qué)

Este proyecto hoy funciona con `data/store.json` para rapidez de implementación.
Para producción debes crear PostgreSQL usando un solo archivo: `sql/avia_app_complete.sql`.

## 1) Crear base de datos

```sql
create database avia_saas_cl;
```

## 2) Ejecutar esquema

```bash
psql -U <usuario> -d avia_saas_cl -f sql/avia_app_complete.sql
```

## 3) Tablas mínimas necesarias

- `app_users`: cuentas + roles + estado
- `account_settings`: preferencias, correo resumen y terminos
- `billing_profiles`: datos tributarios (RUT, razón social, dirección)
- `product_services`: catalogo publico de productos
- `plans`: catálogo comercial
- `subscriptions`: estado de suscripción y fechas
- `causes`: causas por usuario, activas o pausadas
- `cause_results`: resultados/historial de revision por causa
- `leads` y `form_submissions`: formularios web
- `payment_attempts`: historial de cobros
- `webhook_events`: log de eventos + dedupe
- `account_deletion_requests`: solicitudes de eliminacion
- `audit_logs`: trazabilidad operativa

## 4) Índices importantes

Ya incluidos en `sql/avia_app_complete.sql`:
- `subscriptions(user_id)`
- `causes(user_id, user_status)`
- `cause_results(cause_id, checked_at)`
- `cause_results(user_id, checked_at)`
- `payment_attempts(created_at)`
- unique `webhook_events(provider, provider_event_id)`

## 5) Seed incluido

`sql/avia_app_complete.sql` ya incluye seed idempotente para:
- productos: Legal, Flota, Intelligence, API y Lab
- planes: Free, Start, Growth mensual, Growth anual y Enterprise

## 6) Migración sugerida en pocos prompts

1. Mantener API actual igual.
2. Reemplazar `server/lib/store.js` por repositorios SQL.
3. Migrar primero: `app_users`, `account_settings`, `causes`, `cause_results`.
4. Luego: `subscriptions`, `payment_attempts`, `webhook_events`, `billing_profiles`.
5. Activar backups diarios + alertas de webhook.
