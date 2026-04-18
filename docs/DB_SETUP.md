# Base de datos a crear (qué tablas y para qué)

Este proyecto hoy funciona con `data/store.json` para rapidez de implementación.
Para producción debes crear PostgreSQL usando `db/schema.sql`.

## 1) Crear base de datos

```sql
create database avia_saas_cl;
```

## 2) Ejecutar esquema

```bash
psql -U <usuario> -d avia_saas_cl -f db/schema.sql
```

## 3) Tablas mínimas necesarias

- `users`: cuentas + roles + estado
- `billing_profiles`: datos tributarios (RUT, razón social, dirección)
- `plans`: catálogo comercial
- `subscriptions`: estado de suscripción y fechas
- `payment_methods`: identificadores seguros PSP (no PAN)
- `payment_attempts`: historial de cobros
- `webhook_events`: log de eventos + dedupe
- `invoices_local`: boleta/factura local
- `subscription_changes`: upgrades/downgrades

## 4) Índices importantes

Ya incluidos en `db/schema.sql`:
- `subscriptions(user_id)`
- `subscriptions(next_billing_at)`
- `payment_attempts(subscription_id)`
- `payment_attempts(created_at)`
- unique `webhook_events(provider, provider_event_id)`

## 5) Seed recomendado de planes (ejemplo)

```sql
insert into plans (id, code, name, currency, billing_period, net_price_clp, vat_clp, gross_price_clp, has_trial, trial_days, created_at, updated_at)
values
('plan_start_monthly','START_M','Start Mensual','clp','monthly',15958,3032,18990,true,14,now(),now()),
('plan_growth_monthly','GROWTH_M','Growth Mensual','clp','monthly',32765,6225,38990,true,14,now(),now());
```

## 6) Migración sugerida en pocos prompts

1. Mantener API actual igual.
2. Reemplazar `server/lib/store.js` por repositorios SQL.
3. Migrar primero: `users`, `subscriptions`, `payment_attempts`, `webhook_events`.
4. Luego: `billing_profiles`, `invoices_local`, `subscription_changes`.
5. Activar backups diarios + alertas de webhook.
