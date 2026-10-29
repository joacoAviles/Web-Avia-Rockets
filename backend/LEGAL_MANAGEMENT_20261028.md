# Gestión Now y autenticación Supabase

API desplegada desde PROD01, preservando su código efectivo. Backend: legal_admin.py, web_compat.py y prod01_auth.py (destino app/api/auth.py), supabase_identity.py. Sólo admin@aviarockets.cl y fhevia@asesoriasnow.cl validan contraseña con Supabase; el resto conserva su autenticación actual. Se conservan usuarios, permisos y sesiones internas; no hay creación automática de cuentas ni permisos a registros nuevos.

Gestión de causas: catálogos de año, corte y juzgado; tipo C/V conservado para consulta PJUD. Quitar archiva la asignación y preserva historial; se puede reactivar agregando la misma causa. Acceso limitado a clientes autorizados. Portafolio Now archivado no se ofrece como destino activo.

Validación: CRUD real dentro de transacción exterior revertida, aislamiento de cliente, identidad V, archivo y reactivación sin duplicados; pruebas existentes de frontend y CC. La prueba transaccional requiere el módulo candidato en /tmp/legal-admin-candidate.py dentro del contenedor.

Rollback API: imagen avia_public_api:legal-now-scope-20261028-v2; copias fuente y compose en /opt/prod01/legal-management-20261028. Rollback web: revertir el commit de esta entrega. No borrar las cuatro causas reales creadas al revertir código.
