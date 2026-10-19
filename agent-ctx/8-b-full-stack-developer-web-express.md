# Task 8-b — Web Express module (visualizer + editor)

Agent: full-stack-developer (web express)
Task ID: 8-b
Parent: Dimarclub / ImpulsePymes360

## Objetivo
Construir el módulo Web Express: visualizador de sitios auto-generados + editor con vista previa en vivo.

## Archivos leídos (contexto)
- `/home/z/my-project/worklog.md` (Task 8 foundation — schema, APIs, seed, tipos)
- `/home/z/my-project/src/lib/types.ts` — WebsiteExpress, Provider, ModuleId
- `/home/z/my-project/src/lib/store.ts` — useAppStore (currentUser, setModule, toast)
- `/home/z/my-project/src/lib/security/auth.ts` — requireSession, isOwnerOrAdmin
- `/home/z/my-project/src/app/api/impulse/websites/route.ts` (GET lista)
- `/home/z/my-project/src/app/api/impulse/websites/[id]/route.ts` (PATCH, stringify businessHours/socialLinks)
- `/home/z/my-project/src/app/api/impulse/w/[slug]/route.ts` (GET público, parsea JSON, +1 view, une productos del supplier)
- `/home/z/my-project/src/components/dimar/image-upload.tsx` (componente reutilizable)
- `/home/z/my-project/src/components/dimar/modules/social-bio.tsx` (patrón de módulo con editor + preview)
- `/home/z/my-project/prisma/schema.prisma` (model WebsiteExpress)
- `/home/z/my-project/prisma/seed-impulse.ts` (datos seed TecnoExpress)

## Contratos API usados
- `GET /api/impulse/websites` → `WebsiteExpress[]` (con `provider: { companyName, category, city, logoUrl }`)
- `PATCH /api/impulse/websites/[id]` → body con businessHours/socialLinks como objetos (el backend los stringifica)
- `GET /api/impulse/w/[slug]` → `{ site (businessHours/socialLinks parseados), products[] }` (404 si no publicado)

## Trabajo realizado
1. Creado `src/components/dimar/modules/web-express.tsx` (~1100 líneas, 'use client').
2. Tipos locales: `BusinessHours`, `SocialLinks`, `ProviderLite`, `SiteWithProvider`, `PreviewProduct`, `PreviewSite`, `EditorForm`.
3. Constantes: `TEMPLATES` (classic/modern/minimal/vibrant), `COLOR_PRESETS` (5 combinaciones), `DAY_KEYS`, `DAY_LABELS`.
4. Helpers: `parseJSON`, `safeStr`, `normalizePhone`, `whatsappUrl`, `socialUrl`, `formatPrice`, `formatDate`, `toPreviewSite`.
5. Componente `WebsitePreview` — renderiza un sitio web completo (nav, hero, about, products, contact, footer) con 4 variantes de plantilla:
   - **classic**: hero 2 columnas (texto | imagen), secciones apiladas
   - **modern**: hero full-width con overlay gradiente, fondos alternados
   - **minimal**: sin imagen hero, tipografía limpia, mucho whitespace
   - **vibrant**: gradiente bold, divisor diagonal (clip-path), mayúsculas
   - Usa `primaryColor`/`accentColor` vía inline styles. Productos con precio, compareAtPrice tachado, link "Ver en marketplace". Horarios por día (Cerrado si "closed"). Redes sociales con iconos Lucide. WhatsApp con wa.me.
6. Componente `TemplateMiniPreview` — miniaturas visuales de cada plantilla para el selector del editor.
7. Componente `BrowserFrame` — marco de navegador (dots + URL `dimarclub.com/w/{slug}`) con scroll-thin.
8. Módulo principal `WebExpressModule`:
   - **Estado**: sites, selectedId, mode (gallery/editor), publicData (+cache por slug), form, dirty, saving, publishing.
   - **Gallery mode**: sidebar con tarjetas de sitios (logo gradiente, slug, template, badge publicado, vistas); toolbar (Ver sitio / Editar / Visitar URL + switch published + vistas); BrowserFrame con WebsitePreview; 4 tarjetas de stats (vistas, estado, plantilla, actualizado).
   - **Editor mode**: layout 2 columnas (form | live preview sticky). Form en Tabs (Diseño / Contenido / Contacto / SEO). Botón "Guardar cambios" sticky. Live preview con WebsitePreview que refleja el form en tiempo real.
   - **Empty state**: CTA "Crear mi sitio web" → `setModule('impulse-wizard')`.
   - **Toggle published**: PATCH inmediato desde toolbar.
   - **Save**: PATCH con todos los campos (businessHours/socialLinks como objetos); actualiza lista, invalida caché, toast "¡Sitio actualizado!".
9. Regenerado Prisma client (`bun run db:generate` + `bun run db:push`) — los modelos Plan/AdEdition/WebsiteExpress/QRCode estaban ausentes del cliente en runtime (stale), causando 500 en todas las rutas /api/impulse/*. Ahora el cliente tiene todos los modelos.

## Decisiones de diseño
- **App UI**: paleta esmeralda/ámbar del proyecto (bg-primary, text-primary...), sin azul/índigo. El *preview del sitio* sí usa los colores elegidos por el proveedor (inline styles con hex).
- **Live preview**: en editor mode, el preview se construye desde el form state (no refetch), así cambia al instante. Productos vienen del último fetch de /w/[slug].
- **Cache público**: `publicCache` (Map) evita refetchear /w/[slug] (que incrementa views) al cambiar de sitio y volver. Se invalida al guardar/toggle.
- **Fallback no publicado**: si /w/[slug] devuelve 404 (sitio no publicado), se construye el preview desde los datos de la lista con products=[]. Así el usuario puede previsualizar borradores.
- **Plantillas**: cada una cambia layout del hero + fondos de secciones + tipografía del footer, pero comparten about/products/contact.

## Lint
- `eslint src/components/dimar/modules/web-express.tsx` → 0 errors, 0 warnings.

## Pendiente / Notas para el agente principal
- El dev server necesitaba un cliente Prisma regenerado (hecho). Si las rutas /api/impulse/* siguen dando 500, reiniciar el dev server para que cargue el nuevo `@prisma/client` (el `globalForPrisma.prisma` cachea la instancia vieja en el proceso Node).
- El módulo asume que el usuario logueado es dueño de un Provider con WebsiteExpress (seed: TecnoExpress, slug `tecnoexpress`, template `modern`, publicado).
- `page.tsx` ya importa `WebExpressModule` (línea 27) y lo renderiza en `case 'web-express'`.
