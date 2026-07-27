# QA visual — Legal / Causas

## Fuentes comparadas

- Referencia: `C:\Users\keanu\AppData\Local\Temp\codex-clipboard-02ef4131-6a18-4914-92dd-53ed89b61442.png`
- Implementación local: `C:\Users\keanu\.codex\visualizations\2026\07\19\019f7cc3-afdc-78b1-b428-b1c7afad3b57\legal-causas-qa-20260727.png`
- Comparación conjunta: `C:\Users\keanu\.codex\visualizations\2026\07\19\019f7cc3-afdc-78b1-b428-b1c7afad3b57\legal-causas-comparison-20260727.png`

## Estado verificado

- Vista: Legal → Causas, sesión de `fhevia@asesoriasnow.cl`.
- Viewport: 1280 × 720 CSS px, densidad 2.
- Datos: 286 causas obtenidas desde la API productiva.
- Primera columna: `Causa / Año / Estado`.
- Muestras reales verificadas: `448 / 2025 / No publicada`, `2858 / 2023 / Publicada` y `3125 / 2023 / Publicada`.

## Revisión visual

- Se conservan el header, el footer, la paleta oscura, la tipografía, los bordes, los radios y el espaciado existentes.
- El cambio queda limitado a la primera columna del listado.
- Número, año y estado de publicación se leen en una sola línea y no desplazan las demás columnas.
- El estado utiliza una insignia discreta coherente con las etiquetas existentes.
- No se agregaron acciones ni controles de edición.
- Al final del listado se agregó una única acción de descarga, separada visualmente de la paginación y alineada con el estilo existente.
- La descarga fue probada con los 286 registros y produjo un libro `.xlsx` válido con 287 filas (encabezado más datos) y 9 columnas.
- Consola del navegador sin errores.

## Historial

1. La API se amplió para exponer el campo real `publicada` junto al año ya existente.
2. La primera celda se ajustó para mostrar código, año y estado sin alterar la estructura general.
3. Se comparó la referencia y la implementación en una misma imagen y no se detectaron desbordes, cortes ni cambios visuales fuera de alcance.
4. Se verificó visualmente la ubicación del botón junto al footer y se abrió el Excel generado para confirmar encabezados, filas y ausencia de errores.

final result: passed
