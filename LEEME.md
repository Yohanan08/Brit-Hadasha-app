# Brit Hadasha · Mattityahu — App (PWA)

Aplicación instalable (móvil y computador) con los 18 capítulos de Mattityahu.

## Publicar en Vercel (igual que el Calendario)
1. Crea un repositorio nuevo en GitHub (por ejemplo `Brit-Hadasha`) y sube **todo el contenido de esta carpeta** (index.html en la raíz).
2. En Vercel: *Add New → Project*, elige el repositorio y pulsa *Deploy* (no necesita configuración: es un sitio estático).
3. Si el dominio que te da Vercel **no** es `brit-hadasha.vercel.app`, cambia `siteUrl` en `js/chapters.js` y en las etiquetas `og:` de `index.html` y `c/*.html` (o pídele a Claude que regenere esas páginas con tu dominio).

## Qué hay en cada carpeta
- `data/` — el texto de cada capítulo (mateo-1.json … mateo-18.json)
- `pdf/` — el PDF de cada capítulo con el diseño del ministerio
- `c/` — páginas para compartir: al pegar el enlace en WhatsApp/Facebook aparece la tarjeta del capítulo
- `img/og/` — imágenes de vista previa de cada capítulo
- `js/chapters.js` — temas, versículo central de cada capítulo, redes sociales y dominio
- `sw.js` — permite leer sin conexión. Si cambias textos, sube el número de `VERSION` (bh-mateo-v2…) para que los teléfonos descarguen la actualización.

## Agregar más capítulos o libros
Añade el archivo `data/mateo-19.json` y su entrada en `js/chapters.js`, y agrega el archivo a la lista de `sw.js`.
