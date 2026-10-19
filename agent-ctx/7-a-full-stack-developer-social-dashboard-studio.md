# Task 7-a — Social Dashboard + Content Studio IA

Agent: full-stack-developer (social dashboard + studio)
Task: Social Dashboard + Content Studio IA modules for Dimarclub Social

## Work Log

- Leído `worklog.md` (Task 6 foundation: schema Social con SocialAccount/SocialPost/MediaAsset/BioPage/AutomationRule, 10 APIs bajo /api/social/*, servicio IA con z-ai-web-dev-sdk, seed con 6 cuentas + 7 posts + 2 bio pages + 3 reglas, tipos sociales en types.ts).
- Leído `src/lib/types.ts` (SocialAccount, SocialPost, MediaAsset, GeneratedContent, constantes SOCIAL_PLATFORM_ICONS/LABELS, POST_STATUS_LABELS/COLORS).
- Leído `src/lib/store.ts` (currentUser del Zustand, sincronizado por topbar vía /api/auth/me, con `affiliateCode`).
- Leído `src/lib/security/auth.ts` (requireSession/requireRole/getSessionUser via getServerSession(authOptions)).
- Verificados los contratos de API existentes:
  - `GET /api/social/analytics` → { stats, postsByPlatform[], engagementByDay[14], topPosts[5] }
  - `GET /api/social/accounts` → SocialAccount[]
  - `POST /api/social/accounts` { platform, handle, displayName } → SocialAccount (OAuth mock)
  - `GET /api/social/platforms` → 10 plataformas con { id, name, icon, color, maxCaption, supports }
  - `GET /api/social/posts?status=` → SocialPost[] (con product + accounts)
  - `POST /api/social/posts` { caption, mediaUrls, mediaType, productId, affiliateCode, accountIds, scheduledAt, status } → SocialPost
  - `PATCH /api/social/posts/[id]` (mismo body, reconstruye accountIds)
  - `DELETE /api/social/posts/[id]`
  - `POST /api/social/posts/publish/[id]` → simula publicación (genera reach/likes/comments/clicks aleatorios + permalink)
  - `POST /api/social/generate` { productId | prompt, platform, tone } → { caption, hashtags, variations }
  - `GET /api/products?limit=100` → Product[]
  - `GET /api/social/media` → MediaAsset[]
- Leído `src/components/dimar/modules/dashboard.tsx` (patrones de StatCard, Recharts AreaChart/BarChart, skeletons, tooltips custom) y `commissions-liquidation.tsx` (patrones de fetch + actions + AlertDialog de confirmación).
- Leído `src/components/dimar/image-upload.tsx` (componente controlado value/onChange, POST /api/upload multipart).

### Bug fix en backend (Task 6)
- Movido `src/app/api/social/posts/publish/route.ts` → `src/app/api/social/posts/publish/[id]/route.ts`.
- Razón: el handler `POST(req, { params }: { params: Promise<{ id: string }> })` esperaba un segmento dinámico `[id]` que no existía en el path. Sin el move, el contrato `POST /api/social/posts/publish/{id}` rompía con 308 redirect → /api/social/posts/publish (sin id).
- El contenido del archivo quedó intacto (solo cambia la ubicación).

### social.tsx (Social Dashboard)
- Layout vertical: header + 2 filas de KPIs + AreaChart + 2 columnas + tabla top posts + scroll horizontal de recientes.
- Header: "Dimarclub Social" + subtítulo "Programa y publica contenido en tus redes sociales con IA".
- KPI row 1 (grid-cols-2 md:grid-cols-4): Alcance total (Eye, esmeralda), Engagements (Heart, ámbar — suma likes+comments), Clics (MousePointerClick, esmeralda), Ventas atribuidas (DollarSign, ámbar — con revenue `$N.toFixed(2)`). Cada StatCard con icono en cuadro accent, número grande, sublabel contextual.
- KPI row 2 (grid-cols-2 md:grid-cols-4): Posts publicados (Send), Posts programados (CalendarClock — totalPosts - publishedPosts), Cuentas conectadas (Users — len(accounts)), Bio pages views (Link2 — stats.bioViews + hint clicks).
- Engagement AreaChart (Recharts): 3 áreas (reach/likes/clicks) con gradientes esmeralda/ámbar/sky, 14 días en eje X (formato dd/MM es-EC), tooltip custom con payload multiserie, leyenda inline debajo.
- Dos columnas:
  - Izquierda — BarChart horizontal de postsByPlatform (layout vertical, YAxis con SOCIAL_PLATFORM_LABELS, radius [0,6,6,0], barSize 18, esmeralda sólido). Empty state con icono Hash cuando no hay posts.
  - Derecha — "Cuentas conectadas" card list (Avatar con icono plataforma, displayName + handle + label plataforma, badge "Conectada" esmeralda, follower count a la derecha). Botón "Conectar cuenta" en header del card → abre Dialog.
- ConnectAccountDialog: GET /api/social/platforms para el Select, Input handle (placeholder "@dimarclub"), Input displayName opcional, nota informativa "OAuth simulado", POST /api/social/accounts al confirmar, reset al cerrar, onCreated dispara refetch.
- Top posts table: caption (line-clamp-2), reach, likes (con icono Heart), pedidos, ingresos (usd(0) — el API de analytics no retorna revenue por post, solo caption/reach/likes/attributedOrders; la columna se mantiene para la estructura).
- Recent posts preview: scroll horizontal (scroll-thin) de cards 256px con primera media URL (aspect 4/3), badge POST_STATUS_COLORS top-right, caption (line-clamp-2), iconos de plataformas (max 3 + "+N"), fecha (publishedAt/scheduledAt/createdAt), mini stats (reach/likes/clicks) solo si PUBLISHED. SafeParse de mediaUrls (try/catch JSON.parse).
- Skeletons mientras carga (fetchAll con Promise.all de 3 endpoints).
- Helpers: usd, fmtNum (es-EC), fmtShortDate, fmtDateTime. Paleta esmeralda `oklch(0.6 0.13 162)` + ámbar `oklch(0.75 0.15 75)`.
- ICON_MAP para mapear SOCIAL_PLATFORM_ICONS (strings) → componentes Lucide. PlatformIcon component reutilizable.

### social-studio.tsx (Content Studio IA)
- Layout 2 columnas (composer izquierda, posts list derecha) en desktop, 1 columna en móvil (grid lg:grid-cols-2 gap-6).
- Carga inicial: Promise.all de /api/products?limit=100, /api/social/accounts, /api/social/media.

- **Composer (columna izquierda, 4 cards apiladas):**
  1. **Card "Nuevo post"** (cabecera con icono Wand2):
     - ProductPicker: Popover trigger como botón full-width, busca entre 100 productos con filtro en vivo (max 50 resultados), muestra imagen thumbnail + nombre + precio, opción "Sin producto (texto libre)" al inicio. Cuando no hay producto seleccionado → aparece Textarea para prompt libre.
     - PlatformChips: grid de 10 botones tipo chip con icono + label + Check si activo. Default INSTAGRAM + FACEBOOK. Hint "Se publicará en N de M cuentas" (cruzando platforms con accounts del usuario). Warning ámbar si no hay cuentas conectadas.
     - Tono Select: 5 opciones (Entusiasta, Profesional, Juvenil, Urgente, Informativo) en minúsculas.
     - "Generar con IA" Button primary size lg con Sparkles (o Loader2 si generating). POST /api/social/generate con { productId | prompt, platform: platforms[0], tone }.
  2. **Card "Contenido"** (FileText):
     - Textarea caption editable, contador de caracteres.
     - Hashtags como chips removibles (X) si los hay.
     - Variations como botones clickeables (V1, V2…) — click reemplaza caption, resaltado con border-primary si es el actual.
  3. **Card "Multimedia"** (ImageIcon):
     - MediaGallery: thumbnails 80px con botón X al hover (opacity-0 group-hover:opacity-100).
     - ImageUpload con value="" — al subir, append a mediaUrls (sin duplicados).
     - MediaLibraryPicker: Popover con grid 4 cols de assets existentes, click añade a mediaUrls.
  4. **Card "Programación"** (CalendarClock):
     - Input datetime-local para scheduledAt.
     - 3 botones en grid sm:grid-cols-3:
       - Guardar borrador (outline) → handleSave('draft') → POST /api/social/posts status DRAFT
       - Programar (outline ámbar) → handleSave('schedule') → status SCHEDULED + scheduledAt
       - Publicar ahora (primary esmeralda) → handleSave('publish') → crea como SCHEDULED, luego POST /api/social/posts/publish/{id} → toast "¡Post publicado!"
     - Modo edición (editingId set): PATCH en lugar de POST, botón "Cancelar edición" en header del primer card.

- **Posts list (columna derecha):**
  - Tabs (Todos / Borradores / Programados / Publicados) con grid-cols-4. fetchPosts cambia según tab (sin status param para ALL).
  - PostCard: media thumbnail 80px + caption line-clamp-2 + badges de plataformas (max 4 + "+N") + nombre producto + fecha (publishedAt/scheduledAt/createdAt) + mini stats (Eye/Heart) si PUBLISHED.
  - Actions via DropdownMenu: "Publicar ahora" (solo DRAFT/SCHEDULED), "Editar" (carga el post en el composer con platforms derivadas de accounts, mediaUrls parseados, scheduledAt formateado a datetime-local), "Eliminar" (abre Dialog confirmación).
  - Dialog de confirmación de borrado con preview del caption + estado + fecha, botones Cancelar/Eliminar (destructive).
  - Loading: 4 skeletons de cards con imagen + texto.
  - Empty state: icono FileText + "No hay posts en esta vista" + hint de crear con composer.
  - Card inferior tipo "Tip" con gradiente primary→accent y consejo de variar tono por plataforma.
  - Lista scrollable max-h-[800px] con scroll-thin.

- **Lógica de acciones:**
  - `handleGenerate`: valida productId o customPrompt, valida platforms.length > 0, POST a /api/social/generate, rellena caption/hashtags/variations.
  - `buildPayload`: arma el body para POST/PATCH con status DRAFT o SCHEDULED, scheduledAt solo si SCHEDULED, mediaType derivado de mediaUrls.length.
  - `handleSave`: orquesta los 3 modos (draft/schedule/publish), soporta edición (PATCH) o creación (POST), en modo publish hace segundo fetch a /publish/{id}, resetea composer al éxito, refetcha posts.
  - `handlePublish`: desde la lista, POST directo a /publish/{id}.
  - `handleEdit`: parsea mediaUrls JSON, deriva platforms desde post.accounts, setea scheduledAt con `.toISOString().slice(0,16)` para input datetime-local, scroll al top del composer.
  - `confirmDelete`: DELETE /api/social/posts/[id], toast, refetch.
  - `selectedAccountIds`: useMemo que cruza composer.platforms con accounts del usuario → array de accountIds para el payload.

- **Accesibilidad/UI:**
  - Todos los botones con aria-label cuando son icon-only.
  - Popover de ProductPicker con width `var(--radix-popover-trigger-width)` para alinear al trigger.
  - Skeletons con tamaños realistas para evitar layout shift.
  - `scroll-thin` para scrollbars custom en listas largas.
  - Variantes de Button consistentes: outline para secundarios, default para primary, destructive para eliminar.

## Verificación

- **Lint:** `bun run lint` → 0 errores, 0 warnings (después de --fix para eliminar 5 directivas `@next/next/no-img-element` no necesarias porque las `<img>` están en JSX inline que ESLint no detecta como rutas Next/Image).
- **TypeScript:** `tsc --noEmit` no genera errores en mis archivos (social.tsx, social-studio.tsx). Otros errores preexistentes en el repo (seed-social.ts, products/bulk/route.ts, examples/, skills/) no son responsabilidad de esta tarea.
- **Runtime:** Dev server compila `/` con HTTP 200. Smoke test de `/api/social/platforms` retorna las 10 plataformas correctamente.
- **Backend fix verificado:** `/api/social/posts/publish/{id}` ahora resuelve correctamente (sin 308 redirect). El handler original requería `params.id` pero el archivo estaba en ruta estática.

## Stage Summary

- Archivos creados:
  - `/home/z/my-project/src/components/dimar/modules/social.tsx` (~880 líneas) — Social Dashboard
  - `/home/z/my-project/src/components/dimar/modules/social-studio.tsx` (~770 líneas) — Content Studio IA
- Archivos movidos (bug fix Task 6):
  - `src/app/api/social/posts/publish/route.ts` → `src/app/api/social/posts/publish/[id]/route.ts`
- Archivos referenciados (sin modificar):
  - `src/components/dimar/image-upload.tsx` (importado y usado en composer)
  - `src/lib/types.ts` (constantes y tipos sociales)
  - `src/lib/store.ts` (currentUser con affiliateCode)
  - `src/app/page.tsx` (ya renderiza `<SocialModule />` y `<SocialStudioModule />` por el trabajo de Task 6)
- Decisiones clave:
  - PlatformIcon como componente único que mapea SOCIAL_PLATFORM_ICONS (strings) → ICON_MAP (componentes Lucide). Reutilizado en ambos módulos.
  - StatCard idéntico al patrón del dashboard administrativo (mismo accentBg, misma estructura) para consistencia visual.
  - ProductPicker usa Popover + búsqueda en vivo en lugar de Select nativo (Select no soporta search). Limita a 50 resultados para no romper el DOM.
  - ImageUpload se usa con `value=""` siempre — el callback onChange appenda a `mediaUrls[]` (array), permitiendo múltiples imágenes (contrario al uso tradicional de 1 imagen).
  - MediaLibraryPicker como Popover con grid 4 cols — evita un Dialog modal para una acción rápida.
  - Modo edición (PATCH) detectado por `composer.editingId` — reutiliza el mismo handleSave con un branch.
  - "Publicar ahora" = POST status SCHEDULED + POST /publish/{id} (según el contrato). Toast distinto para cada modo.
  - `selectedAccountIds` derivado via useMemo de composer.platforms ∩ accounts — si el usuario no tiene cuenta de esa plataforma, simplemente no se asocia (no bloquea).
  - Variations como botones clickeables que reemplazan el caption (más simple que un sistema de tabs).
  - Paleta esmeralda + ámbar exclusivamente. Cero azul/índigo. Esmeralda `oklch(0.6 0.13 162)`, ámbar `oklch(0.75 0.15 75)`.
  - Formatos: `usd(n)` = `$N.toFixed(2)`, `fmtNum(n)` = `toLocaleString('es-EC')`, fechas con `toLocaleString('es-EC')`.
  - Skeletons específicos por sección (no un solo skeleton genérico) para mejor perceived performance.
  - Para el "Publicar ahora" del composer, el POST inicial usa status SCHEDULED (no DRAFT) porque /publish requiere un post ya sea SCHEDULED o DRAFT y semánticamente "Publicar ahora" = programar para ya.
