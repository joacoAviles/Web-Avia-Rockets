# Backlog SaaS Chile (listo para ejecución)

Este backlog toma tus 20 fases y las transforma en un plan operativo.  
Estado actual del repo: se avanzó en **backend base, autenticación inicial, perfiles de facturación (RUT), suscripciones, cobros mock, webhook idempotente y control de acceso por estado**.

## Prioridad real (roadmap)

### Sprint 1 (Primero)
- [x] Web pública (ya existente)
- [x] Registro/login (API base)
- [x] Planes (catálogo CLP, mensual/anual/free/trial)
- [x] Integración de pago (mock + base Stripe + placeholders Transbank/Mercado Pago)
- [x] Suscripción (estados SaaS)
- [x] Webhook (idempotencia + registro de eventos)
- [ ] Portal cliente básico (UI)
- [x] Bloqueo premium por estado (endpoint de entitlements)

### Sprint 2 (Después)
- [ ] Facturación electrónica Chile (SII o proveedor)
- [x] Reintentos automáticos (job base diario mock)
- [ ] Correos transaccionales
- [ ] Panel admin
- [ ] Métricas de negocio

### Sprint 3 (Después)
- [x] Upgrade/downgrade (API cambio de plan)
- [ ] Portal más completo
- [ ] Automatizaciones contables
- [ ] Reportería avanzada

## Definiciones de negocio ya modeladas en backend
- [x] Precios en CLP
- [x] Política IVA (19%)
- [x] Política de trial
- [x] Política de cancelación
- [x] Política de mora / gracia / reintentos

## Pendientes críticos recomendados
1. Implementar DB real (PostgreSQL + migraciones).
2. Implementar auth con sesiones/JWT firmado y refresh tokens.
3. Integrar PSP productivo chileno (Transbank Oneclick o Mercado Pago) con credenciales reales.
4. Implementar emisión DTE (boleta/factura) y almacenamiento tributario.
5. Construir portal cliente y panel admin en front.
