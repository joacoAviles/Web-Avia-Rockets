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
