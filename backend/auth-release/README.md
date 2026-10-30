# Implementación en desarrollo — no desplegar todavía
Estos módulos están escritos contra el código exportado de PROD01 del 30/10/2026. La comprobación realizada es sintáctica, no integración productiva.

Implementado en código: dependencia Supabase, vínculo explícito a usuario interno, onboarding sin privilegios, listado administrativo, bloqueo local y asignación de productos, auditoría; pantallas web-auth con SDK para login, registro OTP, recuperación, Google y perfil.

Pendiente antes del despliegue: tests de API con PostgreSQL, creación/invitación administrativa y compensación, integración de dependencias en TODAS las rutas protegidas, renovación del token en app.html y cierre de sesión coordinado, desactivar endpoints de registro/login/refresh heredados después de la migración, vincular restantes cuentas, verificar sesiones revocadas, configurar SMTP/plantillas y Google, renderizar pantallas y probar recuperación en navegador nuevo, revisar accesibilidad.

No ejecutar migration.sql hasta confirmar que los UID Supabase corresponden a los correos internos indicados. No publicar web-auth como sustituto del login actual hasta integrar el backend. /api/v1/identity requiere registrar identity_routes.router y resolver current_user en el backend; los archivos por sí solos no activan endpoints.

Configuración necesaria: SUPABASE_SECRET_KEY exclusivamente en servidor para operaciones administrativas; SMTP Avia en Supabase; redirects exactos https://aviarockets.cl/web-auth/callback.html y https://aviarockets.cl/web-auth/reset.html; Google OAuth autorizado. Las direcciones finales deben coincidir con el despliegue elegido.
