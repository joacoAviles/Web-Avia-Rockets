# Contact section lock

La sección de contacto del home vive en:

`sections/contact.html`

Este bloque no debe modificarse en cambios generales del home, landing, hero, scripts o producto.

Hash inicial SHA-256 del archivo protegido:

`65bdb57ec6de0097ece0e719529abf6f4c77bcbcf9a0ddf1a5bc23cd47032b56`

## Regla

Cualquier cambio a `sections/contact.html`, `contact-loader.js`, `forms-api.js` o este archivo debe hacerse de forma explícita.

Para permitir un cambio intencional, el mensaje del commit debe incluir:

`[allow-contact-change]`

Ejemplo:

`Update contact copy [allow-contact-change]`

Sin esa marca, el workflow `Protect contact section` debe fallar.
