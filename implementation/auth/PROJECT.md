# Avia Rockets — Identidad y administración
Estado actual — 30-10-2026: backend y migración desplegados en PROD01 (`avia_public_api:auth-20261030-e547e13`), frontend publicado mediante PR #22 y correcciones hasta `1df9a62`. SMTP, Google, plantillas y clave administrativa configurados. Ingreso real con Google al panel existente, tabla administrativa, correo de recuperación recibido en Inbox y cierre de sesión comprobados. SDK administrativo validado en ejecución Rundeck #15712 y comprobación independiente; secreto con permisos 600, API health=200.

Límites de validación: no se ejecutó un alta nueva con OTP real, sus variantes vencido/incorrecto/reutilizado, un cambio real de contraseña ni la entrega de invitación a una cuenta nueva. Las pruebas automáticas cubren permisos, aislamiento y callbacks con las sustituciones documentadas en README. Las secciones históricas siguientes conservan el diagnóstico previo; no describen el estado actual.


## Implementación incorporada en esta rama

## Histórico previo al despliegue — segunda revisión del 30 de octubre de 2026

- La API pública `/api/v1/identity/me` responde `{"detail":"Not Found"}`: el router todavía no está instalado.
- SSH a PROD01 desde esta sesión falla con `Operation not permitted`; Git por Terminal no resuelve github.com.
- El conector GitHub sí permite leer el repositorio. Supabase Dashboard y Rundeck abren sus pantallas de ingreso, sin sesión autenticada.
- Corregida opción inexistente `detect_session_in_url` en ClientOptions Python, contrastada con el código oficial v2.16.0.
- El guard cubre slash final y, al retirar acceso heredado, bloquea tanto login como refresh.
- `backend/auth-release/install.py` integra router/middleware, dependencias y claims sid sobre el checkout completo, bloquea refresh inactivo y respalda los archivos; no aplica SQL ni despliega imágenes.
- Siete pruebas del instalador pasan: preflight sin cambios, integración, reintento rechazado, conflicto de dependencias, drift, restauración ante escritura fallida y rechazo de symlinks.
- Corregida referencia a event.currentTarget después de await en invitación administrativa; se conserva el formulario antes de la operación.
- Persisten pendientes el despliegue servidor, secreto administrativo, configuración efectiva SMTP/Google y pruebas reales. Estas pruebas locales no acreditan operación productiva.

- `/login.html` y `/register.html` conservan la URL pública y redirigen a las nuevas pantallas profesionales de `web-auth/`.
- `web-auth/auth.js` usa Supabase Auth para contraseña, Google OAuth, registro con código OTP, reenvío con control de ritmo, recuperación y cambio de contraseña. No guarda la contraseña en el navegador, muestra mensajes genéricos y renueva la sesión de API desde la sesión Supabase.
- `web-auth/session.js` coordina inicio/cierre de sesión con la API y revoca el identificador local de sesión al salir.
- `web-auth/admin.html` expone gestión de invitaciones, vinculación de UID verificado, bloqueo y permisos de productos; todas las acciones pasan por autorización de plataforma en FastAPI.
- `backend/auth-release/` contiene el puente API, revisión de sesión revocada, guard para las rutas públicas locales antiguas, esquema/migración y requisitos del SDK administrativo.
- `email-templates/supabase-confirm-signup.html`, `supabase-recovery.html` y `supabase-invite.html` mantienen la marca y el formato de los correos Avia, usando los placeholders oficiales de Supabase.
- El código fuente de la API está integrado en la imagen de FastAPI y el frontend está publicado. La guía operativa está en `backend/auth-release/README.md`.

Backend, configuración y frontend publicados; ver el estado actual al inicio y `backend/auth-release/README.md` para evidencia y límites.

## Evidencia y problema
El código exportado de PROD01 el 30 de octubre deriva Admin y fhevia a Supabase, mantiene contraseñas locales para otros usuarios y un registro local que asigna admin y Legal. El frontend inspeccionado contiene reintentos contra varias API y muestra detalles técnicos al fallar. register.html utiliza endpoints de registro anteriores. La lectura pública del login por el buscador falló; no constituye una revisión visual.

## Arquitectura objetivo
Supabase Auth será la autoridad de identidad: correo/contraseña, confirmación OTP, recuperación y Google. PROD01 conserva usuarios internos, organizaciones, permisos y causas. Crear una tabla de vínculos únicos (issuer, supabase_uid, internal_user_id); migrar Admin y fhevia con verificación explícita de ambos lados. Nunca reemplazar IDs internos ni asignar privilegios desde user_metadata. Nuevas identidades reciben perfil pendiente sin productos ni causas. Autorización administrativa en servidor, exclusiva del administrador de plataforma, distinta del administrador de un cliente.

## Flujos y pantallas
1. login.html: tarjeta centrada, logo Avia, etiquetas visibles, correo, contraseña con mostrar/ocultar, Ingresar, Continuar con Google, Olvidé mi contraseña, Crear cuenta. Una sola solicitud por intento. Credenciales inválidas: «Usuario o contraseña incorrectos». Caída real: «No pudimos iniciar sesión. Inténtalo nuevamente». No mostrar URLs, stack traces, respuestas crudas ni códigos internos. Foco visible, teclado, autocompletado, estado de carga y móvil 360px.
2. register.html: nombre, correo, contraseña; signUp en Supabase. Confirmación por código con verifyOtp de tipo email; reenviar con límite y temporizador. No guardar contraseña en localStorage ni logs. Confirmado el correo, completar perfil dentro de Avia, sin crear una causa obligatoria ni otorgar acceso por defecto.
3. forgot-password.html: solicitar correo; respuesta genérica exista o no. Correo con marca y remitente Avia Rockets. reset-password.html valida el contexto de recuperación y permite contraseña nueva y confirmación. Enlace vencido: reenviar. Revocar las sesiones aplicables y comprobar que las sesiones locales anteriores no eluden el cambio.
4. auth-callback.html: completar PKCE de Google y dirigir al perfil o panel. Cancelación y error muestran mensajes cortos. No vincular cuentas internas solamente por un correo proporcionado por el navegador.
5. admin-users.html: búsqueda, paginación, crear/invitar, estado de confirmación, reenviar invitación/recuperación, bloquear/reactivar, asignar organización y productos. Cada operación valida permisos en servidor y genera auditoría sin secretos. No permitir borrar al último administrador ni autoelevar roles.
6. Sesiones: renovación, expiración, cierre local/global y cuentas bloqueadas verificados también en backend. Eliminar gradualmente fallback de contraseñas locales tras migrar todas las cuentas; inventariar previamente workers que usen credenciales humanas.

## Configuración externa aplicada y requisitos operativos
- Supabase: Site URL https://aviarockets.cl; redirecciones exactas a web-auth/verify.html, web-auth/callback.html y web-auth/reset.html. Confirm email habilitado; anonymous deshabilitado.
- SMTP personalizado en Supabase con remitente verificado del dominio Avia; SPF/DKIM/DMARC verificados. El SMTP de PROD01 no configura automáticamente Supabase.
- Plantilla de confirmación con {{ .Token }} para OTP; recuperación con URL de confirmación y retorno correcto. Validar entrega real, expiración, reenvío y carpeta spam.
- Google Cloud: cliente OAuth Web, consentimiento y audiencia; origen https://aviarockets.cl; redirect autorizado https://mqlwzfsjmhoeiqizzzwk.supabase.co/auth/v1/callback. Client ID y secret en proveedor Google de Supabase; secret nunca en frontend.
- Clave administrativa Supabase exclusivamente en entorno secreto de PROD01. No pegar en chat, repositorio ni informe de diagnóstico.

## Entregables y orden
A. Diagnóstico y respaldo de código/configuración; confirmar qué API sirve cada ruta y cuál imagen arranca con Compose.
B. Migración de vínculos y controles de permisos, tests de aislamiento y denegación.
C. Cliente Supabase y pantallas de acceso, OTP, recuperación, callback y perfil.
D. Endpoints administrativos, auditoría y panel de usuarios.
E. Configurar SMTP, plantillas, redirects y Google; probar con cuentas de prueba autorizadas.
F. Desplegar imagen nueva persistente mediante Compose; conservar imagen y configuración previas para rollback. Desplegar frontend después del backend compatible. No sustituir toda la API con el respaldo parcial.
G. Retirar acceso heredado una vez verificada la migración. Documentar qué sesiones quedan revocadas y qué tareas usan claves de servicio.

## Criterios de aceptación
- Admin conserva alcance de plataforma; fhevia conserva únicamente sus causas y permisos.
- Registro no confirmado no accede; OTP correcto funciona; incorrecto, vencido o reutilizado falla; reenvío limitado.
- Recuperación se inicia y termina en Avia; contraseña anterior deja de funcionar; no se revela existencia de cuentas.
- Google: cuenta nueva, existente, cancelación y callback inválido cubiertos; no duplica ni eleva permisos.
- Bloqueado no puede ingresar ni renovar; logout impide reutilizar la sesión según política definida.
- Usuarios sin privilegios reciben 403 en todos los endpoints administrativos aunque llamen directamente a la API.
- Errores técnicos quedan en logs depurados; mensajes de pantalla son comprensibles.
- Emails recibidos con remitente y marca Avia; pruebas reales de móvil y escritorio.
- Reiniciar el contenedor conserva la integración; rollback probado sin pérdida de datos.

## Diagnósticos
Mac/Linux: bash diagnose-client.sh. Windows PowerShell: .\diagnose-windows.ps1. En PROD01: bash diagnose-prod01.sh. No ejecutarlos en Proxmox para inspeccionar Docker: los contenedores viven en la VM. Proxmox solo requiere qm status 100 y qm config 100 si se investiga conectividad o arranque.
Interpretación: /auth/me sin sesión debe devolver 401 o 403; 200 con datos privados es fallo. 404 indica ruta inexistente, 000 fallo de transporte. OPTIONS debe permitir el origen y método requeridos. Los diagnósticos no crean usuarios, no envían correos y no cambian configuración.

## Fuentes
https://supabase.com/docs/guides/auth/auth-email-templates
https://supabase.com/docs/guides/auth/social-sign-in/auth-google
https://supabase.com/docs/guides/auth/auth-smtp

## Diagnóstico confirmado — 30 octubre 2026
Evidencia aportada por el operador en Mac, Windows y PROD01: login y registro HTTP 200, health HTTP 200, /auth/me HTTP 401 sin sesión. TLS 0 en ambos clientes. CORS permite https://aviarockets.cl y content-type. VM 100 running, onboot=1, startup order=1/up=30. API avia_public_api:pjud-hardening-20261029 healthy, puerto 18001. Estos resultados validan conectividad, no credenciales, recuperación, correo ni autorización por usuario.

## Contrato único de inputs y correos
Conservar nombres existentes: full_name, email, password, company_name, phone, daily_summary_email_enabled. El formulario administrativo y el onboarding reutilizan el mismo esquema de perfil, validaciones y componentes de input. No duplicar nombre/name/customer_name en base de datos: customer_name es únicamente el alias de plantilla de full_name. customer_email deriva de email. first_cause_code y first_cause_court permanecen exclusivamente en el producto Legal, después de autorización, no son requisitos de identidad.

| Dato canónico | Input | Regla | Plantilla existente |
|---|---|---|---|
| full_name | Nombre | 2–200 caracteres, trim | customer_name |
| email | Correo | validación servidor, normalización consistente | customer_email |
| password | Contraseña | política única Supabase; nunca persistir en perfil/logs | nunca se incluye |
| company_name | Empresa | opcional, máximo 200 | dato de perfil |
| phone | Teléfono | opcional, formato internacional validado | dato de perfil |
| daily_summary_email_enabled | Resumen diario | booleano; no controla correos de seguridad | preferencia operativa |
| code | Código de confirmación | longitud según configuración OTP efectiva | verification_code |
| organization_id | Organización | asignación controlada por servidor | nunca aceptarla como permiso del signup |
| role/product_access | Permisos | administrador autorizado únicamente | user_role/product_name |

Fuentes de diseño verificadas: email-templates/verify-email.html, welcome.html, product-access.html y avia-client-email-kit.html. Preservar encabezado, pie, ancho 640px, colores #071426/#0A6CFF, tipografía y botones. Adaptar la zona de acción para OTP, recuperación e invitación; no construir otra identidad gráfica. El logo SVG actual debe probarse en Gmail/Outlook; si falla, usar exportación PNG del mismo logo.

Un adaptador de correo convierte el contrato canónico a placeholders existentes: full_name→customer_name; email→customer_email; acción→cta_url/verification_url/product_url; caducidad efectiva→expiration_minutes. Supabase usa sintaxis distinta: {{ .Token }} y {{ .ConfirmationURL }}. Generar las plantillas de Supabase desde la base Avia con adaptador explícito; nunca pegar placeholders Avia sin resolver en Supabase. Escapar HTML de datos del usuario, validar destino de enlaces y no registrar OTP ni enlaces de un solo uso.

Decisión de entrega: SMTP personalizado en Supabase usando remitente verificado Avia Rockets; Supabase genera/verifica los códigos y controla reenvíos. Si se exige el motor SMTP propio, implementar Send Email Hook firmado y verificado con reintentos e idempotencia; no mantener dos emisores simultáneos. Remitente y dirección de soporte se toman de configuración existente verificada, no se inventan.

## Backlog ejecutable
| ID | Entregable | Depende de | Prueba de cierre |
|---|---|---|---|
| AUTH-01 | Inventario completo, backup y hashes | diagnóstico | código coincide con imagen activa |
| AUTH-02 | Esquema compartido de perfil y inputs | AUTH-01 | mismo payload en alta/admin/onboarding |
| AUTH-03 | Vínculo Supabase UID ↔ usuario interno | AUTH-01 | Admin/fhevia conservan IDs y causas |
| AUTH-04 | Validación tokens, permisos y bloqueo | AUTH-03 | token inválido y usuario bloqueado rechazados |
| AUTH-05 | Plantillas Avia adaptadas y SMTP | AUTH-02 | OTP/recuperación recibidos con marca Avia |
| AUTH-06 | Registro + código + reenvío + perfil | AUTH-04,05 | código válido, vencido, repetido y límites |
| AUTH-07 | Login profesional y sesión | AUTH-04 | ingreso/renovación/logout en ambos navegadores |
| AUTH-08 | Recuperación y nueva contraseña | AUTH-05,07 | anterior rechazada, nueva aceptada |
| AUTH-09 | Google OAuth + callback PKCE | AUTH-04,07 | alta/ingreso/cancelación sin duplicar cuentas |
| AUTH-10 | Panel y endpoints administrativos | AUTH-02,04,05 | crear/invitar/bloquear/asignar con auditoría |
| AUTH-11 | Migración usuarios restantes | AUTH-03,08,10 | inventario conciliado y rollback preparado |
| AUTH-12 | Pruebas integrales y despliegue | AUTH-06 a 11 | aceptación firmada por evidencia, reinicio correcto |

## Contratos API propuestos
GET /api/v1/auth/me: perfil interno y permisos calculados por servidor.
POST /api/v1/auth/onboarding: full_name, company_name, phone, daily_summary_email_enabled; exige sesión Supabase verificada; no acepta role/product_access.
GET /api/v1/admin/users: búsqueda y cursor de paginación; solo admin de plataforma.
POST /api/v1/admin/users: perfil + organización/productos autorizados, modo invitación o creación; idempotency key, compensación si falla creación interna tras creación Supabase.
PATCH /api/v1/admin/users/{id}: cambios permitidos explícitamente, control de versión, sin password_hash.
POST /api/v1/admin/users/{id}/invite: reenvío limitado y auditado.
POST /api/v1/admin/users/{id}/recovery: recuperación sin devolver enlace/token al frontend.
POST /api/v1/admin/users/{id}/block: bloquear y revocar sesiones; rechazar autobloqueo del último administrador.
Autenticación/OTP/recovery/Google usan SDK Supabase. Evitar que endpoints locales heredados permitan saltarse validación Supabase.

## Puertas de despliegue
No publicar botones que prometan flujos no habilitados. SMTP, secreto administrativo y Google ya están configurados; el release está publicado en main. Probar en staging con remitente/cuentas autorizadas, backup de tablas afectadas e imagen anterior. Tras desplegar comprobar reinicio y acceso real de ambos roles. No declarar terminado con solo health 200 o compilación correcta.
