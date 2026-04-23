# Documentación de base de datos (v1)

## Objetivo
Diseñar una base SQL escalable para la web de Avia Rockets con:

- Multi-tenant (múltiples empresas/clientes).
- Multi-proyecto dentro de cada empresa.
- Soporte transversal para los módulos AVIA RISK, AVIA FLEET y AVIA SYSTEMS.
- Seguridad, trazabilidad y crecimiento futuro sin reestructurar todo.

---

## Necesidades funcionales cubiertas

1. **Aislamiento por organización (tenant)**
   - Cada registro crítico referencia `organization_id`.
   - Permite separar datos de clientes de manera segura.

2. **Multi-proyecto real**
   - `projects` permite operar múltiples iniciativas por organización.
   - Tablas funcionales incluyen `project_id` para filtrar analítica y operaciones.

3. **Control de acceso**
   - Membresías por organización y por proyecto (`organization_memberships`, `project_memberships`).
   - Roles simples y extensibles.

4. **Soporte modular por producto**
   - Catálogo de productos (`products`) + activación por proyecto (`project_product_settings`).
   - Habilita activar solo Risk/Fleet/Systems según cada cliente.

5. **Operación de negocio centralizada**
   - Entidades comunes reutilizables (`counterparties`, `assets`).
   - Evita duplicar catálogos por producto.

6. **Auditoría y observabilidad**
   - `audit_logs` para trazabilidad total.
   - `automation_runs` y `notifications` para seguimiento operativo.

---

## Modelo lógico (resumen)

- **organizations** 1---N **projects**
- **organizations** N---N **users** (vía `organization_memberships`)
- **projects** N---N **users** (vía `project_memberships`)
- **projects** N---N **products** (vía `project_product_settings`)
- **projects** 1---N tablas operativas (`risk_assessments`, `compliance_documents`, `automations`, etc.)

---

## Diccionario de tablas

## 1) Tenancy y seguridad

### `organizations`
Tenant principal (empresa cliente).

### `projects`
Subespacios operativos por organización (multi-proyecto).

### `users`
Usuarios globales del sistema.

### `organization_memberships`
Roles del usuario en la organización (owner/admin/manager/analyst/viewer).

### `project_memberships`
Roles del usuario por proyecto (owner/admin/editor/operator/viewer).

---

## 2) Catálogo de producto

### `products`
Catálogo maestro de módulos (ej.: RISK, FLEET, SYSTEMS).

### `project_product_settings`
Configuración JSON por producto dentro de cada proyecto.

---

## 3) Entidades comunes

### `counterparties`
Personas/empresas evaluadas o gestionadas en procesos de negocio.

### `assets`
Activos controlados por la organización/proyecto (vehículos, equipos, etc.).

---

## 4) Módulo AVIA RISK

### `risk_assessments`
Evaluaciones de riesgo históricas por contraparte.
Incluye score, banda y recomendación.

---

## 5) Módulo AVIA FLEET

### `compliance_documents`
Documentos con vencimiento por activo (PRT, SOAP, permisos, etc.).

---

## 6) Módulo AVIA SYSTEMS

### `automations`
Definición de automatizaciones (trigger + acción JSON).

### `automation_runs`
Historial de ejecuciones para diagnóstico y SLA.

---

## 7) Comunicación y auditoría

### `notifications`
Outbox de notificaciones multicanal.

### `audit_logs`
Bitácora inmutable de acciones sobre entidades.

---

## Reglas de escalabilidad recomendadas

1. **Siempre indexar por tenant/proyecto**
   - Patrones de lectura principales usan `organization_id`, `project_id`, fechas.

2. **JSONB para configuración, no para datos críticos relacionales**
   - Config flexible en `project_product_settings`, `automations`, `notifications`.

3. **Particionado futuro por fecha y tenant**
   - Candidatas: `audit_logs`, `automation_runs`, `notifications`, `risk_assessments`.

4. **Estrategia de migraciones versionadas**
   - Recomendado: Flyway / Liquibase / Prisma Migrate.
   - Crear carpetas `sql/migrations/Vxxx__...sql`.

5. **Soft delete opcional para tablas sensibles**
   - Agregar `deleted_at` según necesidades regulatorias.

6. **RLS (Row Level Security) en PostgreSQL**
   - Activar por tenant para reforzar aislamiento de datos en producción.

---

## Script base

El script inicial está en:

- `sql/schema_v1.sql`

Incluye:
- Llaves primarias UUID.
- FKs y `ON DELETE` coherentes.
- Índices para consultas de producción.
- Checks de estados para integridad.

---

## Plan sugerido de implementación

1. Ejecutar `sql/schema_v1.sql` en entorno dev.
2. Sembrar catálogo `products` con RISK/FLEET/SYSTEMS.
3. Implementar capa API con filtros obligatorios por `organization_id` + `project_id`.
4. Añadir RLS + tests de aislamiento multi-tenant.
5. Crear migraciones incrementales para features futuras.

