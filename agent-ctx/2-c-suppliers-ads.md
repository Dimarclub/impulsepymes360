# Task 2-c — Suppliers + Ads modules

**Agent:** full-stack-developer (suppliers+ads)
**Task ID:** 2-c
**Date:** 2025-10-18

## Goal
Build the Suppliers module (with CSV bulk import) AND the Ads management module for the Dimarclub back-office.

## Files created
- `src/components/dimar/modules/suppliers.tsx` — Suppliers back-office (list + detail, dialogs for new supplier / new product / CSV bulk)
- `src/components/dimar/modules/ads.tsx` — Ads management (placement map, ads table, pricing tiers, create/edit/delete)
- `src/app/api/ads/[id]/route.ts` — PATCH + DELETE handlers for ads (required for the edit/delete actions)

## Files modified
- `src/app/api/ads/route.ts` — added optional `?all=true` query so the management view can list all ads (not just active-by-date ones); default behavior unchanged for the public marketplace consumption.

## Key decisions
- **Layout**: Suppliers uses `grid lg:grid-cols-[320px_1fr]` (sticky list on left + detail on right) and collapses to single column on mobile.
- **Product fetching**: the embedded `products` on `/api/suppliers` only has `{id,name,price,stock,status}`. For the detail table (Imagen, SKU, Estado, etc.) we use the dedicated `/api/suppliers/{id}/products` endpoint which returns full product rows with category.
- **CSV flow**: template is a Blob download via a synthetic anchor. File upload uses a hidden `<input type="file">` + `FileReader.readAsText`. Result toast shows `{created}/{errors}/{total}`.
- **Ads placement map**: a CSS grid with `gridTemplateAreas` rendering HEADER (top, full), SIDEBAR_LEFT | HERO | SIDEBAR_RIGHT (middle row), IN_GRID below HERO, FOOTER (bottom, full). Each zone shows the count of active ads as a Badge.
- **Ads state**: a single shared Dialog is used for both create and edit (driven by `createOpen` and `editAd`). Delete uses an `AlertDialog`.
- **Pricing tiers**: purely visual marketing cards (Básico $90 / Destacado $150 — popular / Premium $250). The "Contratar" button opens the create dialog.
- **Palette**: emerald (`bg-emerald-600`, `text-emerald-700`, `bg-emerald-50`) + amber (`bg-amber-500`, `text-amber-700`, `bg-amber-50`). No indigo/blue. `text-gradient` class used for h1 titles.
- **Toasts** routed through the Zustand store's `toast()` helper, which dispatches a `dimar-toast` CustomEvent that the root `page.tsx` forwards to Sonner.
- **i18n**: Spanish (es-EC) for both display text and `Intl.NumberFormat` currency formatting.
- **Empty states**: nice placeholder (icon + text + CTA) when no supplier is selected and when a supplier has no products.
- **Stat cards**: Suppliers shows 4 (total / verified / products / avg rating); Ads shows 4 (active count / impressions / clicks / revenue).
- **Lint**: my two module files lint cleanly. The remaining lint errors (in `crm.tsx` and `email.tsx`) are from other parallel agents and not introduced by this task.

## API contracts verified
- GET /api/suppliers → returns Supplier[] with `user` + `products[]`
- POST /api/suppliers {companyName,email,phone,taxId,address,city,category} → creates user (role SUPPLIER) + supplier, returns Supplier
- GET /api/categories → Category[] (top-level with children) — flattened locally for the product form select
- GET /api/suppliers/{id}/products → Product[] (full, with category)
- POST /api/products {name,price,compareAtPrice,stock,sku,categoryId,supplierId,description,imageUrl} → Product
- POST /api/products/bulk {csv, supplierId} → {created, errors[], total}
- GET /api/ads?all=true → Advertisement[] (with supplier)
- POST /api/ads {title,imageUrl,targetUrl,placement,supplierId,price,startDate,endDate} → Advertisement
- PATCH /api/ads/{id} (same body) — **added in this task**
- DELETE /api/ads/{id} — **added in this task**

## Notes for downstream agents
- `PLACEMENT_LABELS` is imported from `@/lib/types` — already exported there.
- The `/api/ads?all=true` flag is now available for any module that needs the management view; the public marketplace should keep using `/api/ads` (no flag) to get only currently-active ads.
- The Suppliers and Ads modules expect `Sidebar`, `TopBar`, and `Footer` to exist in `src/components/dimar/` and the other modules to be importable from `src/components/dimar/modules/` — these are being built by parallel agents.
