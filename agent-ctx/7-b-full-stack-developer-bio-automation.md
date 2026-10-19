# Task 7-b — Link in Bio + Automation

Agent: full-stack-developer (bio + automation)
Task: Link in Bio builder + Automation module for Dimarclub Social

## Work Log

- Leído `worklog.md` (Task 6 foundation: schema Social, APIs `/api/social/bio` y `/api/social/automation`, seed con 2 bio pages + 3 reglas), `src/lib/types.ts` (BioPage, AutomationRule, Category), `src/lib/store.ts` (currentUser con affiliateCode, toast con tipos success/error/info/warning).
- Verificados los contratos de API existentes:
  - `GET /api/social/bio` → BioPage[] (requireSession, filtra por userId)
  - `POST /api/social/bio` {title, subtitle, avatarUrl, theme, affiliateCode, links, published} → BioPage (genera slug desde affiliateCode o timestamp)
  - `PATCH /api/social/bio/[id]` (acepta `links` como array → JSON.stringify en servidor)
  - `DELETE /api/social/bio/[id]`
  - `GET /api/social/automation` → AutomationRule[]
  - `POST /api/social/automation` {name, type, config, status} → AutomationRule
  - `PATCH /api/social/automation/[id]` {status?} | {execute:true} → este último crea SocialPost en DRAFT desde productos filtrados por categoryId, retorna {executed, postsCreated}
  - `DELETE /api/social/automation/[id]`
  - `GET /api/categories` → Category[] con children

### social-bio.tsx (Link in Bio builder)

- Layout responsive `grid lg:grid-cols-2` (editor izquierda, preview derecha con `lg:sticky top-6`). En móvil colapsa a 1 columna.
- Header con icono gradiente esmeralda→ámbar, título "Link in Bio", subtítulo. Botones "Eliminar" y "Nueva página".
- Empty state ilustrado cuando no hay páginas: Card con borde dashed + CTA "Crear mi página Link in Bio".
- Selector de páginas (scroll horizontal scroll-thin) cuando hay múltiples: cards con avatar, título, slug y dot verde/muted para estado published.
- Columna izquierda — Editor (Card):
  - ImageUpload para avatar
  - Input título (maxLength 60 + contador)
  - Input subtítulo (maxLength 120)
  - Selector de tema: grid de 5 botones con swatch circular gradiente/sólido y label (Esmeralda, Ámbar, Oscuro, Minimal, Atardecer)
  - Links manager: lista ordenable con botones ↑↓ (ChevronUp/ChevronDown + GripVertical), cada link en Card con: icono preview + input etiqueta + botón eliminar; fila inferior con input URL (placeholder dinámico según tipo) + Select tipo (Interna/Externa); Select de icono (10 opciones); hint esmeralda "Se añadirá ?ref=CODE" para links internos con affiliateCode
  - "Agregar" link button
  - Slug display read-only con botón Copy (Check icon tras copiar)
  - Switch "Publicada" con PATCH optimista
  - Footer con contadores vistas/clicks + botón "Guardar página" (POST o PATCH según editId)
- Columna derecha — PhonePreview:
  - max-w-[320px], aspect-[9/16], rounded-[2.5rem], border-4 border-gray-900, overflow-hidden
  - Notch absolute top-0 w-28 h-6 rounded-b-2xl
  - Screen content aplica themeConfig.bg + themeConfig.text, scroll-thin interno
  - Avatar size-20 rounded-full con ring-4 (color del tema)
  - Título bold + subtítulo opacity-80
  - Links como pills rounded-full con icono + label + ExternalLink si es externo
  - Footer con vistas/clicks + badge "Borrador" si !published
  - Watermark "Hecho con Dimarclub · CODE"
- 5 temas definidos inline (THEMES map) con bg, text, pillBg, pillText, pillBorder, accent, swatch
- `safeParseLinks` con try/catch, `buildInternalUrl` añade `?ref=CODE` sin duplicar si ya existe
- AlertDialog de confirmación para eliminar página
- useEffect de sync de form rellena defaults si no hay página actual

### social-automation.tsx (Automation)

- Layout single column full width.
- Hero Card con gradiente primary→accent/80, texto primary-foreground, badge "Dimarclub Social · Automatización", título "Automatización de contenido", subtítulo, botón "Crear regla".
- Stats row (grid sm:grid-cols-3): Reglas activas (esmeralda), Posts generados totales (ámbar), Última ejecución (muted, formato es-EC datetime).
- Quick templates section: 3 Card clickeables con icono gradiente, badge de tipo, nombre, descripción, chips de plataformas + frecuencia, hover effect. Click → applyTemplate (pre-llena form y abre dialog).
- Rules list (grid lg:grid-cols-2): cada RuleCard con:
  - Header: icono tipo + título + badges de tipo y estado + Switch activar/pausar
  - Resumen de config: plataformas como badges con icono, frecuencia + count como badges, categoría + template si existen
  - Separator
  - Grid 2 cols: Última ejecución (fmtDate es-EC) + Posts creados
  - Footer con 4 botones: "Ejecutar ahora" (POST execute:true, toast "N posts creados", refresca reglas), "Pausar/Activar" (PATCH status optimista), Editar (Pencil), Eliminar (Trash2 con AlertDialog)
- Empty state cuando no hay reglas.
- Create/Edit Dialog (max-w-lg, overflow-y-auto scroll-thin):
  - Nombre input
  - Tipo Select (BULK_PRODUCT ámbar "Productos masivos", RECURRING esmeralda "Recurrente", DAILY_DIGEST sky "Resumen diario") con iconos
  - Si BULK_PRODUCT: grid 2 cols con Select categoría (aplana children con prefix ↳, opción "Todas las categorías") + Input count (1-10 con clamp)
  - Plantilla Select (featured, new-arrivals, discount)
  - Plataformas multi-select chips: grid 2 cols de botones toggle (INSTAGRAM, FACEBOOK, TIKTOK, X) con icono + label + CheckCircle2 si seleccionado
  - Frecuencia Select (DAILY, WEEKLY, MONTHLY)
  - Footer Cancelar + Crear/Guardar (con spinner Loader2)
- Sub-componentes extraídos: StatCard, RuleCard, RuleFormBody (patrón FormBody para evitar setState en effects)
- Constantes: TYPE_LABELS, TYPE_BADGES, TYPE_ICONS, STATUS_LABELS, STATUS_BADGES, FREQUENCY_LABELS, TEMPLATE_LABELS, PLATFORMS
- QUICK_TEMPLATES: 3 presets (daily-featured, weekly-benefits, new-arrivals)
- `safeParseConfig` con try/catch para JSON config
- Optimistic update en toggleStatus con rollback en error

## Stage Summary

- Archivos creados:
  - `/home/z/my-project/src/components/dimar/modules/social-bio.tsx` (~1045 líneas)
  - `/home/z/my-project/src/components/dimar/modules/social-automation.tsx` (~770 líneas)
- Lint: 0 errores, 0 warnings. TypeScript: sin errores.
- Decisiones clave:
  - Ordenamiento de links con botones ↑↓ (simpler que @dnd-kit, recomendado por el spec)
  - PhonePreview como sub-componente puro que recibe el themeConfig + estado del form → re-render en tiempo real sin persistencia
  - applyTemplate en Quick Templates pre-llena el form y abre el dialog en un solo click (no crea directamente)
  - toggleStatus con optimistic update + rollback
  - executeNow hace refetch de reglas para actualizar lastRunAt y postsCreated
  - Slug autogenerado por el backend desde affiliateCode (no editable en UI, solo display + copy)
  - Para links internos, el preview muestra el link sin ?ref; el hint visual confirma que se añadirá
  - FormBody extraído en sub-componente para evitar patrón anti de setState en effects
  - Categorías aplanadas en flatCategories (padre + hijos con depth) para Select con indentación visual
