# AGENTS.md — Parroquia de La Rinconada

> Guía de referencia exhaustiva del proyecto, pensada para que un agente de IA (o cualquier desarrollador nuevo) localice rápidamente cualquier pieza del sitio, entienda sus convenciones y pueda ampliarlo sin romper nada.

---

## 1. Project Overview

Web oficial de la **Parroquia de La Rinconada** (Diócesis de Sevilla). Es un sitio **estático** generado con **Astro**, con contenido editable por el personal de la parroquia desde un panel **Decap CMS** que se sirve desde el propio sitio. El CMS escribe commits directamente en este repositorio (branch `main`) y cada push redespliega la web en **Netlify**.

**Idioma del sitio:** español (`<html lang="es">`, `locale: "es"` en Decap).
**Sin frameworks UI** (sin React/Vue/Svelte/Tailwind): todo es HTML + CSS plano + JS inline.
**Sin backend propio**: el formulario de contacto delega en **Web3Forms** (servicio externo con access_key).

---

## 2. Tech Stack

| Capa | Tecnología | Versión | Notas |
|------|------------|---------|-------|
| Framework | Astro | `^6.2.1` | Estático, sin adapter SSR |
| Lenguaje | TypeScript | (vía `astro/tsconfigs/strict`) | `tsconfig.json:2` |
| Markdown | `marked` | (latest) | Usado para parsear campos markdown del frontmatter (ver §10.8) |
| Runtime | Node.js | `>= 22.12.0` | Declarado en `package.json:6` |
| CMS | Decap CMS | `^3.0.0` | Cargado por CDN en `public/admin/index.html` |
| Auth CMS | Netlify Identity (git-gateway) | — | `public/admin/index.html:16-19` |
| Host | Netlify | — | `netlify.toml` + auto-deploy desde `main` |
| Formulario | Web3Forms | API pública | `https://api.web3forms.com/submit` |
| Fuentes | Google Fonts (Lora + Open Sans) | — | Cargadas en `Layout.astro:16-18` |

**Dependencias (`package.json`):** `astro` y `marked`. No hay UI frameworks, linters, formateadores ni tests configurados.

---

## 3. Repository Map

```
parroquia-web/
├── astro.config.mjs          # Config de Astro (vacía por defecto: defineConfig({}))
├── netlify.toml              # Build + publish + redirect /admin → /admin/
├── package.json              # Scripts y dependencias
├── package-lock.json
├── tsconfig.json             # Extiende astro/tsconfigs/strict
├── README.md                 # Plantilla starter de Astro (ignorar)
├── .gitignore                # Ignora dist/, .astro/, node_modules/, .env
│
├── public/                   # Assets estáticos servidos tal cual
│   ├── _headers              # Reglas de caché Netlify
│   ├── _redirects            # Aliases de URL
│   ├── favicon.ico / .svg
│   ├── admin/                # Decap CMS (configuración inline)
│   │   ├── index.html        # ★ CONFIGURACIÓN ACTIVA del CMS
│   │   └── config.yml        # ⚠️ Config alternativa/legacy (no se usa)
│   └── uploads/              # Imágenes subidas vía CMS y hardcodeadas
│
├── src/
│   ├── content.config.ts     # Definición de colecciones (Zod) — Astro Content Layer
│   ├── layouts/
│   │   └── Layout.astro      # Layout ÚNICO y global: header + nav + footer + CSS vars
│   ├── pages/                # Rutas del sitio (file-based routing)
│   │   ├── index.astro
│   │   ├── contacto.astro
│   │   ├── actualidad/       # Noticias + calendario
│   │   ├── parroquia/        # Historia + horarios
│   │   ├── hermandades/      # 3 hermandades
│   │   └── vida-parroquial/  # Catequesis + pastoral de la salud
│   └── content/              # Markdown editable (consumido por páginas)
│       ├── anuncios/         # Colección 'anuncios' (noticias)
│       └── paginas/          # Colección 'paginas' (ficheros individuales)
│
├── functions/                # Netlify Functions (vacío)
├── netlify/                  # Edge functions (vacío)
├── dist/                     # Output de build (gitignored)
└── .astro/                   # Tipos autogenerados (gitignored)
```

---

## 4. Local Development

```bash
npm install        # Instala dependencias (solo astro)
npm run dev        # Servidor dev en http://localhost:4321
npm run build      # Build de producción → ./dist
npm run preview    # Sirve ./dist localmente para verificar
```

**VSCode:** `.vscode/extensions.json` recomienda `astro-build.astro-vscode`. `.vscode/launch.json` tiene una tarea "Development server" que ejecuta `./node_modules/.bin/astro dev`.

**No hay** scripts de lint, format, test, type-check, ni validación de contenido configurados. Si los necesitas, instalarlos y añadirlos a `package.json`.

---

## 5. Build & Deployment (Netlify)

- **Build command:** `npm run build` (netlify.toml:2)
- **Publish directory:** `dist` (netlify.toml:3)
- **Auto-deploy:** cada commit a `main` dispara un deploy.
- **CMS auth:** Netlify Identity (proxied a Git Gateway) — el panel `/admin/` se autentica contra el repo.

### `netlify.toml` (netlify.toml:1-8)
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/admin"
  to = "/admin/"
  status = 301
```

### `public/_headers` (caché)
- `/_astro/*` → `max-age=31536000, immutable` (assets con hash)
- `/uploads/*` → `max-age=604800` (1 semana)
- `/favicon.svg` → `max-age=604800`

### `public/_redirects` (aliases)
- `/anuncios` → `/actualidad` (301)
- `/anuncios/*` → `/actualidad/:splat` (301)
- `/horarios` → `/parroquia/horarios` (301)

> **Importante:** los redirects en `public/_redirects` se procesan **antes** que `netlify.toml`. Si necesitas un redirect nuevo, este es el sitio por defecto.

---

## 6. URL / Routing Map

| URL pública | Archivo `.astro` | Origen del contenido |
|-------------|------------------|----------------------|
| `/` | `src/pages/index.astro` | Hardcoded + últimos 4 de `anuncios` |
| `/actualidad` | `src/pages/actualidad/index.astro` | Colección `anuncios` (orden desc) |
| `/actualidad/:slug` | `src/pages/actualidad/[slug].astro` | Una entrada de `anuncios` por slug |
| `/actualidad/calendario` | `src/pages/actualidad/calendario.astro` | `paginas/calendario.md` (eventos filtrados por mes actual) |
| `/parroquia` | `src/pages/parroquia/index.astro` | `paginas/historia.md` + galería hardcoded |
| `/parroquia/horarios` | `src/pages/parroquia/horarios.astro` | **Hardcoded** (no usa `paginas/horarios.md`) |
| `/sacramentos` | `src/pages/sacramentos/index.astro` | Hardcoded (4 tarjetas) |
| `/sacramentos/bautismo` | `src/pages/sacramentos/bautismo.astro` | `paginas/bautismo.md` |
| `/sacramentos/primera-comunion` | `src/pages/sacramentos/primera-comunion.astro` | `paginas/primera-comunion.md` |
| `/sacramentos/confirmacion` | `src/pages/sacramentos/confirmacion.astro` | `paginas/confirmacion.md` |
| `/sacramentos/matrimonio` | `src/pages/sacramentos/matrimonio.astro` | `paginas/matrimonio.md` |
| `/hermandades` | `src/pages/hermandades/index.astro` | **Hardcoded** (3 tarjetas estáticas) |
| `/vida-parroquial/catequesis` | `src/pages/vida-parroquial/catequesis.astro` | `paginas/catequesis.md` (4 pestañas) |
| `/vida-parroquial/pastoral-salud` | `src/pages/vida-parroquial/pastoral-salud.astro` | `paginas/pastoral-salud.md` |
| `/contacto` | `src/pages/contacto.astro` | `paginas/contacto.md` |
| `/admin/` | `public/admin/index.html` | Decap CMS |

---

## 7. Content Collections (Astro Content Layer)

Definidas en `src/content.config.ts` con **glob loader** + **Zod schemas**.

### `anuncios` (noticias)
- **Loader:** `glob({ pattern: "**/*.md", base: "./src/content/anuncios" })`
- **Slug pattern (CMS):** `{{year}}-{{month}}-{{day}}-{{slug}}`
- **Schema (`src/content.config.ts:4-12`):**
  ```ts
  {
    title: string,
    date?: Date,       // se permite frontmatter sin fecha
    image?: string,    // ruta pública, ej. "/uploads/foto.webp"
    summary: string,   // obligatorio
    body: string       // markdown (vía render)
  }
  ```
- **Plantilla ejemplo:** `src/content/anuncios/2026-05-04-cambio-en-calendario.md`

### `paginas` (páginas fijas)
- **Loader:** `glob({ pattern: "*.md", base: "./src/content/paginas" })`
- **Schema (`src/content.config.ts:14-50`):**
  ```ts
  {
    title: string,
    direccion?: string,
    telefono?: string,
    email?: string,
    mapa?: string,        // HTML crudo (iframe Google Maps) — se inyecta con set:html
    eventos?: Array<{    // solo usado en calendario.md
      dia: number,
      mes: number,        // 1-12
      texto: string,
      tipo: string        // "misa" | "sacramento" | "pastoral" | "formacion" | "especial" | "festivo"
    }>,
    // Campos para sacramentos (4 páginas)
    intro?: string,         // subtítulo del hero
    informacion?: string,   // bloque "Información" (markdown)
    requisitos?: string,    // bloque "Requisitos" (markdown)
    catequesis?: string,    // bloque "Catequesis" (markdown, opcional) — específico del sacramento
    nota?: string,          // nota final (markdown)
    // Campos para catequesis (pestañas)
    visionGeneral?: string, // pestaña 1
    catequesisAdultos?: string, // pestaña 2 (Catequesis de Adultos)
    pasos?: Array<{         // tarjetas numeradas 1-2-3 (sacramentos)
      titulo: string,
      descripcion?: string,
    }>,
    body: string          // markdown (vía render)
  }
  ```
- **Ficheros esperados** (todos en `src/content/paginas/`):
  - `bautismo.md` — sacramento (intro, informacion, requisitos, pasos, catequesis, nota) — `catequesis` = Cursillos Prebautismales
  - `primera-comunion.md` — sacramento — `catequesis` = Catequesis de Comunión
  - `confirmacion.md` — sacramento — `catequesis` = Catequesis de Confirmación
  - `matrimonio.md` — sacramento — `catequesis` opcional (no se usa actualmente)
  - `calendario.md` — con `eventos` + `body`
  - `catequesis.md` — 2 campos markdown (`visionGeneral`, `catequesisAdultos`)
  - `contacto.md` — con `direccion`, `telefono`, `email`, `mapa`
  - `historia.md`
  - `horarios.md` ⚠️ **huérfano** (ver §14)
  - `pastoral-salud.md`

> **Convención importante:** cada nombre de archivo en `paginas/` se convierte en el `id` Astro. Por ejemplo, `contacto.md` → `getEntry("paginas", "contacto")`.

---

## 8. Decap CMS (Admin Panel)

El panel se sirve en **`/admin/`** desde `public/admin/index.html` (CDN: `https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js`). Se inicializa manualmente con `window.CMS_MANUAL_INIT = true` y `load_config_file: false`, lo que significa que la configuración se pasa **inline** en el `<script>` del propio HTML.

### ⚠️ Atención: existen DOS archivos de configuración
| Archivo | Estado | Detalle |
|---------|--------|---------|
| `public/admin/index.html` (líneas 12-169) | **ACTIVA** | Config completa, 9 entradas en `paginas`, editorial workflow |
| `public/admin/config.yml` | **No se carga** | Versión mínima con solo `anuncios`, `horarios` y `contacto`. Conservar solo si se quiere migrar; si no, **bórralo** para evitar confusión. |

### Configuración activa (resumen)
- **Backend:** `git-gateway`, branch `main` (public/admin/index.html:16-19)
- **`publish_mode: "editorial_workflow"`** → los cambios pasan por draft → review → publish (no van directos a `main`)
- **Media folder:** `public/uploads` / public path `/uploads`
- **Locale:** `es`

### Colección `anuncios` (folder)
- Carpeta: `src/content/anuncios`
- `create: true`, `slug: "{{year}}-{{month}}-{{day}}-{{slug}}"`
- Campos: `title`, `date` (datetime), `image` (image), `summary` (text), `body` (markdown)
- ⚠️ **Divergencia con el schema Astro:** el CMS declara `date` como **obligatorio** y `image` como **opcional con default `false`**, mientras que el Zod de `content.config.ts:6-11` los marca como **opcionales**. Si el editor deja la fecha vacía, el build fallará por la validación del CMS al guardar.

### Colección `paginas` (files)
10 ficheros declarados en `public/admin/index.html` (líneas 40-204): `horarios`, `contacto`, `historia`, `catequesis`, `pastoral-salud`, `bautismo`, `primera-comunion`, `confirmacion`, `matrimonio`, `calendario`.

- `catequesis.md` → 2 campos markdown (visionGeneral, catequesisAdultos).
- `bautismo`, `primera-comunion`, `confirmacion`, `matrimonio` → campos estructurados: title, intro, informacion, requisitos, pasos (lista de objetos), catequesis, nota.
- `contacto.md` y `calendario.md` → campos estructurados clásicos.
- El resto → solo `title` + `body` markdown.

### Flujo CMS → deploy
1. Editor edita en `/admin/`.
2. Decap abre un PR (o commit directo según `publish_mode`) en este repo vía Git Gateway.
3. Netlify detecta el push y redespliega.
4. El nuevo HTML aparece en producción tras ~30-60 s.

### Requisitos de Netlify
- Habilitar **Netlify Identity** en el sitio.
- Activar **Git Gateway** en Identity settings.
- Añadir usuarios en Identity → "Invite users".

---

## 9. Design System & Layout

### Layout global: `src/layouts/Layout.astro`
Es el **único layout**. Define:
- Estructura HTML5 completa (`<!doctype html>` ... `</html>`).
- `<head>` con fuentes, favicon, título dinámico (default: "Parroquia").
- **Header sticky** con logo, nav (5 grupos con dropdown) y hamburguesa móvil.
- **`<main>` con `<slot />`** — el contenido de la página se inyecta aquí.
- **Footer** con 3 columnas (info, horarios, accesos) + copyright dinámico.
- **Todo el CSS** en un `<style is:global>` al final del archivo.
- **Todo el JS** en un `<script is:inline>` (hamburguesa + dropdowns + cerrar fuera).

### Variables CSS (en `:root`, Layout.astro:157-167)
```css
--color-primary: #7a3e2b;       /* marrón burdeos principal */
--color-primary-light: #9a5a3f;
--color-bg: #fdf8f3;            /* crema de fondo */
--color-text: #2c2c2c;
--color-muted: #6b6b6b;
--color-border: #e0d5c8;
--font-serif: "Lora", Georgia, serif;
--font-sans: "Open Sans", system-ui, sans-serif;
--max-width: 960px;
```

### Tipografías
- **Lora** (serif) → títulos y cuerpo de contenido editorial
- **Open Sans** (sans) → UI, botones, nav, formularios

### Breakpoints
- **820 px** → colapsa la nav a hamburguesa
- **700 px** → grids de 2 columnas pasan a 1 (contacto, horarios)
- **640 px** → grids secundarios colapsan
- **600 px** → calendario compacto (oculta texto de eventos, muestra `•`)
- **500 px** → items de noticias en columna
- **620 px** → banner y grid de noticias

### Patrones de hero de páginas interiores
Bloque `.hero-interior` con gradiente marrón:
```css
background: linear-gradient(135deg, #4a2515, #7a4020);
```
Replicado literalmente en: `contacto.astro:159`, `actualidad/index.astro:57`, `actualidad/calendario.astro:102`, `parroquia/index.astro:37`, `parroquia/horarios.astro:106`, `vida-parroquial/catequesis.astro:25`, `vida-parroquial/pastoral-salud.astro:25`.

### Patrones de hero de hermandades
`.hero-hmd` con gradiente específico (en `style` inline en cada `.astro`):
- Dolores: `linear-gradient(135deg, #2a0a0a, #6a1a1a)` (rojo oscuro)
- Salud: `linear-gradient(135deg, #0a2a0a, #1a5a2a)` (verde)
- Resucitado: `linear-gradient(135deg, #1a1a2a, #2a2a6a)` (azul)

---

## 10. Global Features

### 10.1 Navegación (`Layout.astro:32-77`)
- 5 grupos: Inicio, La Parroquia, Hermandades, Vida Parroquial, Actualidad + Contacto.
- Cada grupo con botón `.nav-btn` que abre `.dropdown` con hijos.
- En desktop: hover abre dropdown (`Layout.astro:276`).
- En móvil: tap abre dropdown; click fuera cierra.
- Accesibilidad: `aria-haspopup`, `aria-expanded`, `role="menu"`.

### 10.2 Menú móvil (`Layout.astro:113-150`)
- Botón `#nav-toggle` con clase `.hamburger` (3 líneas que se transforman a ✕).
- `aria-expanded` se actualiza al togglear.

### 10.3 Slider del home (`index.astro:25-162`)
- 3 slides estáticos con imágenes de `public/uploads/rotativo-1|2|3.webp`.
- Cambio automático cada **5 s** (`setInterval(next, 5000)`).
- Controles: dots clicables + flechas prev/next.
- `resetTimer()` se llama en cada interacción manual.

### 10.4 Formulario de contacto (`contacto.astro:82-156`)
- POST a `https://api.web3forms.com/submit` con `FormData`.
- Campo oculto `access_key` ⚠️ **pendiente de configurar** (ver §14).
- Honeypot `botcheck` (checkbox oculto) — si viene relleno, Web3Forms descarta.
- `subject` se sobrescribe con `"Parroquia Rinconada — " + asunto`.
- UI: muestra `#aviso-ok` (verde) o `#aviso-error` (rojo), deshabilita botón durante envío.

### 10.5 Helper de fecha `fechaDeAnuncio` (duplicado)
Aparece tal cual en 3 archivos:
- `src/pages/index.astro:5-9`
- `src/pages/actualidad/index.astro:5-9`
- `src/pages/actualidad/[slug].astro:16-20`

Lógica: si el frontmatter tiene `date` lo usa; si no, intenta extraer `YYYY-MM-DD` del inicio del slug; si no, usa `new Date()`. **Candidato a refactor** (extraer a `src/lib/fechas.ts`).

### 10.6 Formateo de fechas
- Listas: `day, month long, year` → ej. "4 de mayo de 2026"
- Detalle: `weekday long, day, month long, year` → ej. "lunes, 4 de mayo de 2026"
- Locale siempre `es-ES`.

### 10.7 Calendario litúrgico (`actualidad/calendario.astro`)
- Calcula el grid del mes actual (Lunes a Domingo).
- Filtra `eventos` por `mes === mesActual` (donde `mes` viene 1-indexed del frontmatter).
- Resalta el día de hoy con fondo `#fff8f0` y número circular.
- Tipos de evento con colores: `misa`, `sacramento`, `pastoral`, `formacion`, `especial`, `festivo` (ver colores en `calendario.astro:179-184`).
- En móvil (`max-width: 600px`) muestra solo un punto `•` en días con eventos.

### 10.8 Renderizado de campos markdown del frontmatter
Astro Content Layer (`render()`) **no parsea automáticamente campos markdown del frontmatter** — solo parsea el `body` principal del archivo `.md`. Para los sacramentos y catequesis, donde el contenido está dividido en varios campos markdown (`informacion`, `requisitos`, `catequesis`, `nota`, `visionGeneral`, `catequesisAdultos`), se usa el patrón:

```ts
import { marked } from "marked";
marked.setOptions({ gfm: true, breaks: false });
const htmlInfo = await marked.parse(entrada.data.informacion);
// ...
<div set:html={htmlInfo} />
```

**Páginas que usan este patrón:**
- `src/pages/vida-parroquial/catequesis.astro` (2 campos → 2 paneles con pestañas)
- `src/pages/sacramentos/{bautismo,primera-comunion,confirmacion,matrimonio}.astro` (4 campos: `informacion`, `requisitos`, `catequesis`, `nota`)

**Estilos del HTML inyectado** vía `:global(...)` en `.bloque-cuerpo` y `.panel-cuerpo` (h2, h3, ul, ol, blockquote, p, strong, em, etc.).

---

## 11. Page-by-Page Reference

### `/` — `src/pages/index.astro`
- **Estructura:** banner slider + barra de acceso rápido (3 botones) + grid de últimas 4 noticias (1 principal grande + 3 secundarias).
- **Datos:** `getCollection("anuncios")` ordenado por fecha desc, slice(0, 4).
- **Imagen principal:** `principal.data.image` (opcional; si no hay, no se muestra el bloque).
- **Formato fecha:** `4 de mayo de 2026`.

### `/actualidad` — `src/pages/actualidad/index.astro`
- **Estructura:** hero marrón + tabs (Noticias / Calendario) + lista vertical de TODOS los anuncios.
- **Cada item:** imagen 200px a la izquierda, body con fecha, título, summary y "Leer más →".
- En móvil (`<500px`): imagen pasa a arriba con `height: 160px`.

### `/actualidad/:slug` — `src/pages/actualidad/[slug].astro`
- **Generación estática:** `getStaticPaths()` mapea cada anuncio a `{ params: { slug: anuncio.id }, props: { anuncio } }`.
- **Estructura:** imagen de portada a 420px + migas (Inicio › Noticias) + cabecera con fecha/título/entradilla + `<Content />` (markdown renderizado) + enlace "Volver a noticias".
- **Estilos del `<Content />`** vía `:global()` en `.cuerpo` (h2, h3, p, ul/ol, img).

### `/actualidad/calendario` — `src/pages/actualidad/calendario.astro`
- Ver §10.7.

### `/parroquia` — `src/pages/parroquia/index.astro`
- **Estructura:** hero marrón + galería de 3 imágenes (`/uploads/historia-1|2|3.webp`) + `<Content />` de `paginas/historia.md`.
- Galería: `grid-template-columns: repeat(3, 1fr)`, items a 200px de alto con `object-fit: cover`.

### `/parroquia/horarios` — `src/pages/parroquia/horarios.astro`
- **Estructura:** hero marrón + grid 2 columnas con 6 bloques.
- **Bloques:** Misas invierno, Misas verano, Confesiones, Apertura del templo, Despacho parroquial, Celebraciones especiales.
- ⚠️ **Todo hardcoded en HTML**. No consume `paginas/horarios.md` (ver §14).

### `/hermandades` — `src/pages/hermandades/index.astro`
- **Estructura:** hero marrón + intro + grid 3 columnas con 3 tarjetas estáticas.
- **Tarjetas:** Dolores (rojo `#2a0a0a → #6a1a1a`), Salud (verde `#0a2a0a → #1a5a2a`), Resucitado (azul `#1a1a2a → #2a2a6a`).
- ⚠️ **No consume CMS.** Las 3 hermandades individuales (Páginas `/hermandades/{dolores,salud,resucitado}`) ya no existen.

### `/sacramentos` — `src/pages/sacramentos/index.astro`
- **Estructura:** hero marrón + intro + grid 2×2 con 4 tarjetas (Bautismo, Primera Comunión, Confirmación, Matrimonio).
- **Tarjetas:** icono + nombre + descripción corta fija + enlace a la página individual.
- **No consume CMS** (es estático, igual que el listado de hermandades).

### `/sacramentos/:slug` — `src/pages/sacramentos/*.astro`
4 páginas estructuralmente idénticas. Cambia:
- ID de `getEntry` ("bautismo" | "primera-comunion" | "confirmacion" | "matrimonio")
- Contenido desde el .md correspondiente (campos `intro`, `informacion`, `requisitos`, `pasos[]`, `catequesis`, `nota`).
- Estructura común: hero marrón → bloque **Información** → bloque **Requisitos** → bloque **Pasos a seguir** (3 tarjetas numeradas 1-2-3 con círculo y descripción) → bloque **Catequesis** (opcional, solo si tiene contenido) → bloque **Nota** (opcional) → bloque de contacto al despacho parroquial.
- **Bautismo** → `catequesis` = Cursillos Prebautismales
- **Primera Comunión** → `catequesis` = Catequesis de Comunión
- **Confirmación** → `catequesis` = Catequesis de Confirmación
- **Matrimonio** → `catequesis` vacío (no se muestra el bloque)

### `/vida-parroquial/catequesis` — `src/pages/vida-parroquial/catequesis.astro`
- **Estructura:** hero marrón + sistema de 2 pestañas (Visión general, Catequesis de Adultos) + bloque de contacto.
- **Pestañas:** CSS-only con `<input type="radio" hidden>` + `<label>` + `:checked ~ .panels .panel`. **Sin JavaScript**.
- **Datos:** `getEntry("paginas", "catequesis")` con 2 campos markdown (`visionGeneral`, `catequesisAdultos`), cada uno parseado con `marked.parse()` e inyectado con `set:html`.
- La primera pestaña aparece activa por defecto (`checked` en el primer input radio).
- **Editar:** cada campo es markdown editable desde el CMS (en `public/admin/index.html`).
- **Nota histórica:** esta página antes tenía 4 pestañas (incluyendo Comunión, Confirmación, Prebautismales). Esos contenidos se fusionaron dentro de las páginas de sacramentos correspondientes (ver bloque "Catequesis" arriba).

### `/vida-parroquial/pastoral-salud` — `src/pages/vida-parroquial/pastoral-salud.astro`
- **Estructura:** hero marrón + `<Content />` de `paginas/pastoral-salud.md` (markdown libre).

### `/contacto` — `src/pages/contacto.astro`
- **Estructura:** hero marrón + grid 2 columnas (info+mapa | formulario) + bloque de redes sociales.
- **Info:** `direccion`, `telefono`, `email` y `mapa` (iframe) desde `paginas/contacto.md` (con `set:html` para el iframe).
- **Despacho parroquial:** horarios hardcoded (no editables vía CMS).
- **Formulario:** ver §10.4.
- **Redes:** 3 botones con SVG (Facebook, Instagram, YouTube). Los href son placeholders (`https://facebook.com`, etc.) ⚠️ **pendiente configurar**.

---

## 12. Static Assets

Todo lo que va en `public/` se sirve **tal cual** en la raíz.

### `public/uploads/` (imágenes)
| Fichero | Uso actual |
|---------|-----------|
| `historia-1.webp`, `historia-2.webp`, `historia-3.webp` | Galería de `/parroquia` (hardcoded) |
| `rotativo-1.webp`, `rotativo-2.webp`, `rotativo-3.webp` | Banner del home (hardcoded) |
| `landing-sucio.jpg` | Solo referenciada en `paginas/horarios.md` (no se muestra en ningún sitio) |
| `per12-279.webp` | ⚠️ **No referenciada** en ningún `.astro` ni `.md` |
| `.gitkeep` | Placeholder para que la carpeta exista en git |

**Convención recomendada:** WebP para fotos, JPG solo si se necesita compatibilidad legacy. Subir siempre al directorio `public/uploads/` (el CMS lo hace automáticamente al `media_folder` configurado; al añadirlas a mano, misma carpeta).

> **No usar** `<Image>` de Astro ni `@astrojs/image`. El proyecto usa `<img>` plano con `loading="lazy"` (excepto la primera slide del banner, que lleva `fetchpriority="high"`).

---

## 13. Conventions & Naming

- **Slug de anuncio:** `YYYY-MM-DD-<slug-descriptivo>` (generado por el CMS). El id Astro es el nombre de archivo sin extensión.
- **Slug de página fija:** el nombre del archivo `.md` en `src/content/paginas/` (ej. `catequesis.md` → id `"catequesis"`). Para añadir una nueva página fija, crear el `.md` y **registrarla en la config inline de Decap** (`public/admin/index.html`).
- **Frontmatter de anuncio:** `title`, `summary` (obligatorios), `date`, `image` (opcionales pero `date` debería estar siempre).
- **Idiomas:** todo el contenido en español. Mantener `lang="es"` y locale `es-ES` en `toLocaleDateString`.
- **Estilos:** CSS plano + variables globales del `Layout.astro`. Cada página puede añadir su propio `<style>` (scoped) para customizaciones. Si necesitas afectar al `<Content />` renderizado (markdown), usa `:global()`.
- **Scripts de página:** `<script is:inline>` al final (van al bundle como están, sin procesar por Astro).
- **Imágenes en markdown:** se sirven desde `/uploads/...` (público). El `body` se inyecta con `set:html` indirectamente vía `<Content />`.

---

## 14. Known Issues / TODOs

| # | Severidad | Issue | Archivo / línea |
|---|-----------|-------|-----------------|
| 1 | 🔴 Alta | `access_key` de Web3Forms es un placeholder. **El formulario NO funciona hasta reemplazarlo.** | `src/pages/contacto.astro:83` |
| 2 | 🟠 Media | `public/admin/config.yml` está abandonado y no se carga. Mantenerlo genera confusión; el activo es el inline en `index.html`. | `public/admin/config.yml` |
| 3 | 🟠 Media | `paginas/horarios.md` existe pero **nadie lo renderiza**. `/parroquia/horarios` está hardcoded. | `src/pages/parroquia/horarios.astro` vs `src/content/paginas/horarios.md` |
| 4 | 🟠 Media | Divergencia CMS ↔ schema: el CMS obliga `date` + `image?` mientras el Zod los marca opcionales. | `public/admin/index.html:30-35` vs `src/content.config.ts:6-11` |
| 5 | 🟡 Baja | Helper `fechaDeAnuncio` duplicado en 3 archivos. Refactor a `src/lib/fechas.ts`. | `index.astro:5-9`, `actualidad/index.astro:5-9`, `actualidad/[slug].astro:16-20` |
| 6 | 🟡 Baja | Hero marrón `linear-gradient(135deg, #4a2515, #7a4020)` repetido literal en 7 archivos. Extraer a variable CSS. | ver §9 |
| 7 | 🟢 Resuelto | Las 3 hermandades individuales fueron eliminadas y consolidadas en `/hermandades/index.astro` (listado). | — |
| 8 | 🟡 Baja | Href de redes sociales son placeholders (`https://facebook.com`, `https://instagram.com`, `https://youtube.com`). | `src/pages/contacto.astro:112,116,120` |
| 9 | 🟡 Baja | Imágenes huérfanas en `public/uploads/`: `per12-279.webp` y `landing-sucio.jpg` no se referencian. | `public/uploads/` |
| 10 | 🟢 Cosmética | Banner del home está hardcoded. Podría moverse a una colección CMS (`banner` con `image`, `title`, `subtitle`). | `src/pages/index.astro:25-59` |
| 11 | 🟢 Cosmética | Teléfono del footer hardcoded (`955 79 00 00`) mientras la colección `contacto` tiene `telefono`. | `src/layouts/Layout.astro:90` vs `src/content/paginas/contacto.md:4` |
| 12 | 🟢 Cosmética | Dirección y horarios del footer hardcoded. | `src/layouts/Layout.astro:89,93-97` |
| 13 | 🟢 Cosmética | No hay `package.json` scripts para `astro check`, `lint` o `format`. | `package.json:8-13` |
| 14 | 🟢 Cosmética | `README.md` sigue siendo la plantilla starter de Astro (no se ha reemplazado por docs reales del proyecto). | `README.md` |

---

## 15. Common Tasks (Recipes)

### Añadir un anuncio (noticia) nueva
1. Vía CMS (recomendado): ir a `/admin/`, entrar en **Anuncios → Nuevo anuncio**, rellenar `title`, `date`, `image`, `summary`, `body`. Publicar.
2. A mano: crear `src/content/anuncios/YYYY-MM-DD-<slug>.md` con el frontmatter del schema (ver §7).

### Añadir una página fija nueva (no-hermandad, no-catequesis)
1. Crear `src/content/paginas/<id>.md` con frontmatter.
2. Crear `src/pages/<seccion>/<id>.astro` que haga `getEntry("paginas", "<id>")` y renderice `<Content />` dentro del `Layout`.
3. Si quieres que sea editable desde el CMS, **registrarla en `public/admin/index.html`** dentro de la colección `paginas` (líneas 39-165). Como alternativa, mantener el contenido como Markdown y editarlo desde git.
4. Añadir el enlace al header en `src/layouts/Layout.astro:32-77` (y opcionalmente al footer en líneas 99-105).

### Añadir un sacramento nuevo
1. Crear `src/content/paginas/<sacramento>.md` con frontmatter estructurado (campos `title`, `intro`, `informacion`, `requisitos`, `pasos[]`, `nota`).
2. Crear `src/pages/sacramentos/<sacramento>.astro` copiando uno existente (ej. `bautismo.astro`) y cambiando el ID de `getEntry`.
3. Añadir tarjeta en `src/pages/sacramentos/index.astro` (array `sacramentos`).
4. Añadir entrada en el dropdown "Sacramentos" de `Layout.astro`.
5. Registrar en `public/admin/index.html` con sus campos.

### Modificar contenido de un sacramento existente
- Vía CMS (recomendado): `/admin/` → **Páginas fijas → Sacramento: [Nombre]**.
- A mano: editar el .md correspondiente en `src/content/paginas/`. Cada campo es markdown o texto, según el schema. Los 3 `pasos` se numeran automáticamente (1, 2, 3) en la página.

### Añadir una pestaña a Catequesis
1. Añadir el campo en el schema de `paginas` en `src/content.config.ts` (ej. `nuevaPestana: z.string().optional()`).
2. Añadir el campo markdown en `src/content/paginas/catequesis.md` y registrarlo en `public/admin/index.html` (entrada `catequesis`).
3. Añadir bloque al array `tabs` en `src/pages/vida-parroquial/catequesis.astro` (la nueva pestaña aparece automáticamente al final) y replicar las reglas CSS del panel correspondiente.

### Cambiar el banner del home
- Reemplazar `public/uploads/rotativo-1.webp`, `rotativo-2.webp`, `rotativo-3.webp` por las nuevas imágenes (mismo nombre y formato).
- Para cambiar **texto** del slide, editar `src/pages/index.astro:30-50` (h1 y p de cada `.slide-texto`).
- Para añadir un 4º slide: añadir un nuevo `<div class="slide">` con su imagen y un nuevo `.dot` en el contenedor `.dots`. Actualizar el JS si quieres más de 3.

### Editar el calendario litúrgico
- Vía CMS: `/admin/` → **Páginas fijas → Calendario Litúrgico** → añadir/editar entradas en el campo `eventos` (cada una con `mes`, `dia`, `texto`, `tipo`).
- A mano: editar `src/content/paginas/calendario.md`. Tipos válidos: `misa`, `sacramento`, `pastoral`, `formacion`, `especial`, `festivo`. Si añades un tipo nuevo, también hay que:
  - Añadir su color en `src/pages/actualidad/calendario.astro:179-184` (`.tipo-<nuevo>`).
  - Añadir su entrada en la leyenda (`calendario.astro:83-88`).
  - Si quieres que sea elegible en el CMS, añadirlo al `widget: "select"` de `public/admin/index.html:138-147`.

### Cambiar horarios (actualmente hardcoded)
- Editar `src/pages/parroquia/horarios.astro` directamente (todo el HTML está en el archivo).
- O refactorizar: hacer que la página use `getEntry("paginas", "horarios")` y mueva los datos a `paginas/horarios.md`. **No hecho todavía** (ver §14 #3).

### Configurar el formulario de contacto
1. Crear cuenta en https://web3forms.com (gratis).
2. Obtener el `access_key`.
3. Sustituir `REEMPLAZA_CON_TU_CLAVE_WEB3FORMS` en `src/pages/contacto.astro:83` por la clave real.
4. Commit y push.

### Desplegar
1. Hacer commit a `main`.
2. Push → Netlify auto-despliega (~30-60s).
3. Si el deploy falla, revisar logs en el dashboard de Netlify.

---

## 16. File Index (Quick Lookup)

### Configuración
| Archivo | Propósito |
|---------|-----------|
| `astro.config.mjs` | Vacío (`defineConfig({})`). Aquí se añadirían integraciones/adapters. |
| `netlify.toml` | Build command + publish + redirect /admin |
| `tsconfig.json` | Extiende `astro/tsconfigs/strict` |
| `package.json` | Solo `astro` como dependencia, scripts dev/build/preview |
| `.gitignore` | Ignora `dist/`, `.astro/`, `node_modules/`, `.env*`, `node_modules/` |
| `public/_headers` | Caché Netlify |
| `public/_redirects` | Aliases de URL |
| `.vscode/extensions.json` | Recomienda extensión de Astro |
| `.vscode/launch.json` | Tarea "Development server" |
| `public/admin/index.html` | Decap CMS (config inline ACTIVA) |
| `public/admin/config.yml` | Decap CMS (config LEGACY, ignorada) |

### Layouts
| Archivo | Propósito |
|---------|-----------|
| `src/layouts/Layout.astro` | Layout global único: head, header, nav, footer, CSS vars, scripts |

### Contenido (Markdown)
| Archivo | Propósito |
|---------|-----------|
| `src/content.config.ts` | Schemas Zod de `anuncios` y `paginas` |
| `src/content/anuncios/*.md` | Noticias |
| `src/content/paginas/calendario.md` | Eventos del mes + texto "próximos eventos" |
| `src/content/paginas/contacto.md` | Dirección, teléfono, email, mapa |
| `src/content/paginas/horarios.md` | ⚠️ Huérfano (no se renderiza) |
| `src/content/paginas/historia.md` | Texto largo de historia y patrimonio |
| `src/content/paginas/catequesis.md` | 4 campos markdown (pestañas de Catequesis) |
| `src/content/paginas/pastoral-salud.md` | Servicio pastoral de enfermos |
| `src/content/paginas/{bautismo,primera-comunion,confirmacion,matrimonio}.md` | Contenido de cada sacramento (intro, informacion, requisitos, pasos[], nota) |

### Páginas
| Archivo | Ruta pública |
|---------|--------------|
| `src/pages/index.astro` | `/` |
| `src/pages/contacto.astro` | `/contacto` |
| `src/pages/actualidad/index.astro` | `/actualidad` |
| `src/pages/actualidad/[slug].astro` | `/actualidad/:slug` |
| `src/pages/actualidad/calendario.astro` | `/actualidad/calendario` |
| `src/pages/parroquia/index.astro` | `/parroquia` |
| `src/pages/parroquia/horarios.astro` | `/parroquia/horarios` |
| `src/pages/sacramentos/index.astro` | `/sacramentos` |
| `src/pages/sacramentos/bautismo.astro` | `/sacramentos/bautismo` |
| `src/pages/sacramentos/primera-comunion.astro` | `/sacramentos/primera-comunion` |
| `src/pages/sacramentos/confirmacion.astro` | `/sacramentos/confirmacion` |
| `src/pages/sacramentos/matrimonio.astro` | `/sacramentos/matrimonio` |
| `src/pages/hermandades/index.astro` | `/hermandades` |
| `src/pages/vida-parroquial/catequesis.astro` | `/vida-parroquial/catequesis` |
| `src/pages/vida-parroquial/pastoral-salud.astro` | `/vida-parroquial/pastoral-salud` |

### Assets
| Carpeta | Contenido |
|---------|-----------|
| `public/uploads/` | Imágenes: `rotativo-{1,2,3}.webp` (banner), `historia-{1,2,3}.webp` (galería), `per12-279.webp` y `landing-sucio.jpg` (huérfanas) |
| `public/favicon.svg`, `public/favicon.ico` | Favicon |

---

## Anexo: flujo end-to-end de un cambio de contenido

```
Editor en /admin/
  └─ Decap CMS (public/admin/index.html)
       └─ Commit/Push via Git Gateway a main
            └─ Netlify detecta push
                 └─ npm run build (Astro)
                      └─ Genera /dist con HTML estático
                           └─ Publica en CDN Netlify
                                └─ Visible en producción
```

Cualquier `.md` modificado localmente y pusheado sigue exactamente el mismo flujo a partir del commit.
