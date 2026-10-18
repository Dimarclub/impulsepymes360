# Task 5-b: Image upload + liquidation UI

Agent: full-stack-developer (upload+liquidation UI)
Task: Image upload component + integration in forms + commission liquidation module

## Files created
- `src/components/dimar/image-upload.tsx` — Reusable client component. Dropzone (dashed border, UploadCloud icon, "Arrastra una imagen o haz clic"), preview (max-h-40 object-cover) with "Eliminar"/"Cambiar" controls, Loader2 spinner during upload, validation (image/* only, max 5MB) with inline AlertCircle error + toast, hidden file input, alternative URL paste input. Props: value, onChange, label, className.
- `src/components/dimar/modules/commissions-liquidation.tsx` — Standalone admin module. Fetches GET /api/affiliates/commissions/liquidate?status=PENDING. 3 summary cards (Total pendiente, Afiliados con saldo, Comisiones pendientes). "Liquidar todo" button in header. Table by user (Afiliado/Email/Código/Count/Monto/Liquidar). Detail table with checkboxes (max-h-96 scroll), columns Fecha/Afiliado/Origen/Nivel badge/Tasa/Monto/Estado. "Liquidar seleccionadas" button at footer. Loading skeleton + empty state. Emerald/amber palette.

## Files modified
- `src/components/dimar/modules/suppliers.tsx` — Added ImageUpload import; replaced "URL de imagen" Input in "Agregar producto" dialog with `<ImageUpload value={productForm.imageUrl} onChange={(url) => setProductForm({ ...productForm, imageUrl: url })} />`. All other form logic preserved.
- `src/components/dimar/modules/ads.tsx` — Added ImageUpload import; removed unused ImageIcon import; replaced 2-col grid (URL imagen + URL destino) with vertical stack (ImageUpload + URL destino Input); removed redundant "Vista previa" block (ImageUpload has its own preview). All submit/edit/delete logic preserved.
- `src/components/dimar/modules/affiliates.tsx` — Imported CommissionsLiquidation + BanknoteIcon. Added `isAdmin = currentUser?.role === 'ADMIN'` check. TabsList grid-cols dynamic (3 or 4). 4th TabsTrigger "Liquidación" rendered only when isAdmin. 4th TabsContent renders `<CommissionsLiquidation />`. When currentUser is null, existing early-return hides all tabs.

## Verification
- eslint on my 5 files: 0 errors, 0 warnings.
- tsc on my 5 files: 0 errors.
- Remaining lint error in `topbar.tsx` (setState in effect) — belongs to another agent.
- Remaining tsc errors in `src/app/api/affiliates/commissions/liquidate/route.ts` and `commissions/route.ts` (Prisma `include: { sourceUser }` doesn't exist in schema — `sourceUserId` is just a String column without a relation). Main agent must either add a `sourceUser User? @relation(...)` to the schema or rewrite the include to use a manual join. My UI gracefully handles missing sourceUser (`c.sourceUser?.name || 'Venta directa'`).

## API contract used
- POST /api/upload multipart/form-data field "file" → { url, thumbUrl, filename, size }. UI uses `url`.
- GET /api/affiliates/commissions/liquidate?status=PENDING → { commissions, byUser }.
  - commissions: Commission[] with `user: { name, email, affiliateCode }` and `sourceUser?: { name }`.
  - byUser: [{ userId, name, email, affiliateCode, total, count }].
- POST /api/affiliates/commissions/liquidate:
  - `{ all: true }` → liquidate all PENDING.
  - `{ all: true, userId }` → liquidate all PENDING for one user.
  - `{ commissionIds: string[] }` → liquidate specific commissions.
  - Returns `{ liquidated: number }`.
