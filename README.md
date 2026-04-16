# Web-Avia-Rockets

Sitio web de AVIA Rockets + backend de operaciones comerciales agregado.

## Qué se agregó (sin modificar el front existente)
- API REST con Express para:
  - leads/contacto
  - pagos (mock o Stripe)
  - suscripciones
- Persistencia simple en `data/store.json`
- Documentación de API en `docs/API.md`
- Tests básicos de consistencia de planes

## Uso rápido
```bash
npm install
cp .env.example .env
npm run dev
```

API base: `http://localhost:8080`

Consulta `docs/API.md` para payloads y rutas.
