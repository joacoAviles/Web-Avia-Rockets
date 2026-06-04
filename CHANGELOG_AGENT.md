# CHANGELOG_AGENT (append-only)

> Regla: este archivo solo crece. No se eliminan entradas anteriores.

## 2026-04-18

### Cambio
Se creó documentación operativa completa para acelerar una versión funcional en pocos prompts:
- `docs/API_REFERENCE.md`
- `docs/DB_SETUP.md`
- `docs/INTEGRATION_KEYS_REQUIRED.md`

### Por qué
El objetivo fue dejar claridad total sobre:
1) qué APIs consume el front,
2) qué tablas/base de datos debes crear,
3) qué claves externas debes entregar para pasar de mock a operación real.

### Impacto
- Reduce iteraciones para integración frontend-backend.
- Permite onboarding rápido de desarrollo y operación.
- Deja checklist explícito de credenciales para habilitar cobros reales.

## 2026-06-04

### Cambio
Se conectó el front productivo con el backend Express:
- endpoints `/api/dashboard`, `/api/causes`, `/api/results`, `/api/account`, `/api/public/home`, `/api/site`, `/api/auth/me`, `/api/auth/logout`
- alta, carga masiva, activación/pausa y resultados de causas desde `app.html`
- API local automática en desarrollo y producción en dominio real
- seed local Legal / Causas para `usuario1` en `data/store.json`
- SQL único de producción en `sql/avia_app_complete.sql`

### Por qué
La web ya tenía botones y vistas preparados, pero llamaban rutas inexistentes o contratos de API mezclados entre FastAPI y Express.

### Impacto
- El flujo cliente puede iniciar sesión, administrar causas, registrar resultados y ver estadísticas.

## 2026-06-04 Home

### Cambio
Se recuperó el home completo con Hero, automatización por pasos, visualizaciones, las 3 soluciones principales y contacto conectado al backend.
Se ajustó la sección `Soluciones` al formato antiguo: tres productos con icono pequeño, descripción breve y botón directo.

### Impacto
- El `index.html` vuelve a mostrar el recorrido público completo.
- Legal / Causas toma métricas y filas desde `/api/public/home`.
- Las tarjetas `Avia OPS`, `Avia Intelligence` y `Avia Labs` quedan protegidas para no ser reemplazadas por el loader de servicios.
- La home pública puede poblar visualizaciones desde API.
- La documentación queda alineada con el contrato real del frontend.
