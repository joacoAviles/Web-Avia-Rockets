# Web-Avia-Rockets

Sitio web de AVIA Rockets + backend SaaS Chile agregado (sin modificar el front existente).

## Qué se agregó
- API REST con Express para:
  - autenticación (registro, login, verificación email, recovery)
  - leads/contacto
  - perfiles de facturación chilena (incluye validación de RUT)
  - pagos (mock + Stripe + base para Transbank/Mercado Pago)
  - suscripciones SaaS con estados estándar
  - control de acceso premium por estado de suscripción
  - job diario de cobros (mock) con reintentos/gracia
- Persistencia simple en `data/store.json`
- Backlog ejecutable y archivos de import para Notion/Trello/ClickUp

## Uso rápido
```bash
npm install
cp .env.example .env
npm run dev
```

API base: `http://localhost:8080`

## Documentación
- API: `docs/API.md`
- Backlog: `docs/BACKLOG_SAAS_CHILE.md`
- Import board Notion: `docs/BOARD_NOTION.csv`
- Import board Trello: `docs/TRELLO_IMPORT.csv`
- Import board ClickUp: `docs/CLICKUP_IMPORT.csv`

- API Reference detallada: `docs/API_REFERENCE.md`
- Setup DB: `docs/DB_SETUP.md`
- APIs y claves requeridas: `docs/INTEGRATION_KEYS_REQUIRED.md`
- Hoja de cambios del agente: `CHANGELOG_AGENT.md`
