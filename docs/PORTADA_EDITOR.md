# Creador de portadas: revisión y verificación

Implementación en la rama `codex/portadas-editor`, basada en `5a87d15`.

## Cambios

- Interfaz con logo, colores, fondos, bordes y botones de AVIA; vista adaptable a móvil.
- Proyectos completos con guardado automático y manual en IndexedDB, separados por correo de la sesión. Conservan título, subtítulo, formato, imágenes embebidas, orden y geometría de capas, tipografía y sombras.
- Migración de los perfiles anteriores de localStorage sin borrar su almacenamiento original.
- Descarga/importación de proyectos JSON autocontenidos para reutilizarlos en otro navegador o equipo.
- Imágenes PNG/JPEG/WebP/SVG; opacidad, posición, dimensiones, rotación y orden de capas.
- Sombras por texto: color, transparencia, desenfoque, desplazamiento horizontal/vertical y repeticiones. Todo se incluye en el proyecto exportado.
- Exportación PNG desde un lienzo independiente, esperando la carga de imágenes y sin selección ni guías.
- Ejemplo «hola / chao» disponible mediante un botón. El ejemplo verificado incluye un PNG y un SVG transparentes importados.

## Verificación

Pruebas unitarias: `node --test tests/portada.test.js tests/portada-core.test.js`.

Prueba de navegador: iniciar el sitio en `http://127.0.0.1:8091` y ejecutar `node scripts/verify-portada.cjs`. Requiere Playwright; `PLAYWRIGHT_MODULE` permite indicar su módulo instalado y `BROWSER_CHANNEL` permite elegir el navegador (por defecto Edge). Utiliza una sesión ficticia solo en un contexto de navegador aislado, sin acceder a servicios remotos.

Comprueba creación, guardado automático, recarga, edición de sombras, importación PNG/SVG, arrastre, exportación idéntica al render limpio, respaldo y reimportación, formatos, archivo inválido, migración de perfiles, fallo de cuota y ausencia de desbordamiento horizontal a 390 px.

Archivos de revisión en `artifacts/portada`: portada PNG, proyecto JSON, capturas de escritorio y móvil.

## Alcance

Los proyectos se guardan en este navegador. No hay sincronización con el servidor: para otro equipo se usa el respaldo JSON. La restricción de acceso por sesión/correo existente se conserva; este cambio no agrega autorización de servidor. La publicación se realiza mediante GitHub Pages desde la rama `main`, en https://aviarockets.cl/portada.html.

## Edición para canales y marcas

- Miniatura HD, miniatura 4K, banner de canal, historia/Reel, publicación vertical, cuadrado y dimensiones personalizadas (64–4096 px por lado).
- El banner incluye la zona segura proporcional de YouTube. Fuentes de medidas: [branding del canal](https://support.google.com/youtube/answer/10456525?hl=es) y [miniaturas](https://support.google.com/youtube/answer/72431?hl=es), verificadas el 6 de septiembre de 2026.
- Fuentes incluidas y alojadas en el sitio: Bebas Neue, Montserrat, Oswald y Playfair Display, con sus licencias OFL en `assets/fonts/portada` (origen: repositorio google/fonts). Más fuentes del sistema e importación de TTF/OTF/WOFF/WOFF2.
- Tamaño de texto en píxeles, peso, cursiva, interlineado, espaciado, alineación, contorno, opacidad y patrones de sombra. El tamaño explícito desactiva la reducción automática a la caja.
- Plantillas por marca con todos sus recursos. Crear desde una plantilla produce una portada independiente.
- Deshacer/rehacer durante la sesión, ocultar/bloquear capas y usar una imagen como fondo.

Prueba adicional: `node scripts/verify-portada-brands.cjs`, con las mismas variables de Playwright. `PORTADA_BASE_URL` permite verificar la versión publicada en un contexto aislado. Comprueba las cuatro fuentes locales, importación de fuente, persistencia tipográfica, independencia de las plantillas, historial, medidas y exportación.
