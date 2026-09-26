# Identidad común: Google, onboarding y referidos

Estado: implementación de extensión con pruebas locales. **No está conectada a producción**.
El repositorio contiene overlays del backend pero no `app.api.auth`, `app.models`,
`app.api.deps` ni el emisor de sesiones que usa la API publicada. Por ello, este
módulo se integra por un adaptador explícito; no crea una segunda base de usuarios.

## Lo implementado

- Flujo Google Authorization Code + PKCE S256, state y nonce; validación de firma,
  audiencia, expiración y emisor mediante google-auth. Email verificado obligatorio.
- Identidad por Google `sub`. Una cuenta existente con el mismo correo requiere
  login con contraseña y vinculación explícita autenticada; no se fusiona por email.
- Estado OAuth en base de datos, TTL de 10 minutos, cookie HttpOnly/Secure/SameSite=Lax.
- Retorno mediante ticket de 60 segundos, consumible una vez y ligado al navegador.
  El JWT de la aplicación nunca viaja en URL; se usa el emisor de sesión existente.
- Perfil y finalización comunes, persistentes e idempotentes. Los productos no
  generan otro onboarding; permisos y suscripciones siguen en la plataforma actual.
- Código de referido de 12 caracteres, aleatorio, único; atribución por usuario,
  bloqueo de autorreferido y cambio de referente. No se implementan recompensas.
- Interfaz común, campo opcional de referido, página de cuenta y enlace para compartir.
- Ya no se guarda la contraseña de registro en sessionStorage. Limpia el valor antiguo.
- Redirección por lista permitida. El login no envía contraseñas a un origen tomado de localStorage.

## Integración pendiente y obligatoria

1. Recuperar del servidor el código exacto de la API publicada, incluyendo modelos,
   dependencias de autenticación, alta de usuarios y emisor/revocación de sesiones.
2. Implementar `Users` (service.py) sobre **los usuarios actuales**. Sus cuatro métodos:
   `find_by_email`, `create_google_user`, `assert_active`, `issue_session`.
   - `create_google_user` debe crear la cuenta normal con correo verificado, sin
     permisos administrativos ni productos pagados. No activar Legal como efecto del onboarding.
   - `assert_active` valida existencia, bloqueo y baja de la cuenta.
   - `issue_session` devuelve JSON `{access_token, user}` con los tokens existentes.
   - Usar la transacción recibida, sin commit/rollback interno; email normalizado y único.
3. Inyectar una dependencia de sesión SQLAlchemy async **separada** de la usada por
   `current_user`, sin transacción previa. El router es dueño de begin/commit/rollback.
   Así no colisiona con el autobegin de la dependencia de autenticación existente.
4. Aplicar `migration.sql` en PostgreSQL de staging; añadir/verificar restricciones
   hacia el identificador canónico según el tipo y esquema real recuperado. Probar
   carreras con PostgreSQL (las pruebas automatizadas locales usan SQLite).
5. Registrar `create_router(...)` y `IdentityError` con `identity_error_handler`.
   No montar si falta configuración o el adaptador no está listo. CORS: origen web
   exacto con credentials; no wildcard. Mantener límite de peticiones del backend y
   validar IP real del proxy; comprobar límites compartidos antes de escalar réplicas.
6. Configurar cliente OAuth Web de Google: callback
   `https://api.aviarockets.cl/api/v1/identity/google/callback`. Guardar ID y secreto
   en el gestor del servidor. Publicar pantalla de consentimiento según el proyecto.
7. Configurar URLs reales y aprobadas de términos/privacidad; el formulario no se
   habilita sin ellas. `2026-09-25` es versión técnica provisional, no texto legal aprobado.
8. Migrar el estado de usuarios ya incorporados, respetando su finalización existente.
   Agregar requisito de onboarding en los accesos de productos del backend, con
   excepciones para perfil, logout y estado; no depender sólo del redirect del navegador.
9. El registro por correo actual llama `/api/register/*`. Verificar que dichos endpoints
   existan en el backend recuperado. La verificación deriva al onboarding común cuando
   `/identity/config` está activo; durante despliegue parcial conserva la ruta anterior.
10. Verificar mapeo de usuarios de AeroClub/Quant y destinos: las rutas de producto
    aquí regresan al app común; no afirman SSO entre instalaciones aún no integradas.

## Despliegue seguro

Primero base de datos + adaptador + endpoints en staging; después frontend. El botón
Google y el enlace de cuenta permanecen ocultos si `/identity/config` no está disponible.
No presentar esta condición como producción terminada. Probar Google real con cuenta
nueva y existente (vinculación), logout, sesión vencida, referido válido/inválido,
recarga y llegada desde cada producto. Después publicar y verificar producción.
Rollback: desmontar router y revertir frontend; conservar tablas para no perder atribución.
No borrar cuentas ni estados de onboarding.

## Pruebas

```sh
python -m pip install -r backend/identity/requirements.txt aiosqlite pytest pytest-asyncio
python -m pytest -q backend/identity/test_identity.py
node --test tests/identity-client.test.cjs
```

No necesitan secretos, correo real ni cuentas Google; los tests HTTP simulan el proveedor.
Los tests locales no sustituyen integración con el emisor de sesión ni Google real.

Fuente del protocolo: https://developers.google.com/identity/openid-connect/openid-connect

Prueba de interfaz reproducible (Google/API simulados, sin cuentas reales):

```sh
npm ci
npx playwright install chromium
npm run test:identity
npm run test:identity:browser
```

Incluye móvil y escritorio, referido, consentimiento, regreso de Google, vinculación y
usuario ya incorporado. Imágenes y resultados se guardan en `.identity-artifacts/`.
La suite Python también verifica criptografía real con claves efímeras locales y
rechaza firma, audiencia, emisor y vencimiento incorrectos, sin contactar Google.

Resultado local del 25-09-2026: 38 pruebas Python, 17 de lógica web y 10 recorridos de
navegador pasan. La suite general tiene cuatro fallos preexistentes, confirmados en
el commit base 0d8c2ac: contacto (endpoint esperado), dos de home y una etiqueta de
Portadas. No se modificaron esas expectativas para ocultarlos.
