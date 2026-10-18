# Task 2-a — Marketplace module + shared layout

Agent: full-stack-developer (marketplace)
Task ID: 2-a
Parent: /home/z/my-project/worklog.md

## What was built

Shared layout + marketplace module for Dimarclub (B2C marketplace with 3-level affiliate system).

### Files created

1. `src/components/dimar/sidebar.tsx` — Collapsible sidebar.
   - Desktop: `hidden lg:flex`, `sticky top-0 h-screen w-[260px]`, brand with esmeralda→amber gradient logo mark.
   - Mobile: shadcn `Sheet` (side=left), controlled via `open`/`onOpenChange` props (page.tsx passes `sidebarOpen`/`setSidebarOpen`).
   - 3 nav sections: **Tienda** (Marketplace), **Administración** (Dashboard, Proveedores, Logística, CRM, Email Marketing, Publicidad, Solicitudes), **Comunidad** (Afiliados, Socios, Beneficios).
   - Active item: `bg-primary/10 text-primary border-l-2 border-primary`. Inactive: muted with hover.
   - Uses `useAppStore` (`activeModule`, `setModule`). Clicking an item closes the Sheet on mobile.

2. `src/components/dimar/topbar.tsx` — Sticky top bar (`h-16`, `bg-background/85 backdrop-blur`).
   - Hamburger (`Menu`) — `lg:hidden`, calls `onMenuClick`.
   - Decorative search input (desktop only) with `Search` icon.
   - Cart button — dispatches `window.dispatchEvent(new CustomEvent('dimar-open-cart'))`. Badge with item count (`bg-accent`).
   - User switcher (`DropdownMenu`) — fetches `/api/users`, groups by role with Spanish labels (`ROLE_LABELS`). Trigger shows avatar initials + name + role subtitle + role `Badge` (lg+). Selecting a user calls `setUser`.
   - Role badge colors use esmeralda/amber/emerald/orange palette — no blue/indigo.

3. `src/components/dimar/footer.tsx` — `mt-auto bg-card border-t`. 4 columns: Dimarclub info (brand + description), Enlaces (navigates via `setModule`), Legal, Contacto. Bottom row: `© 2025 Dimarclub. Todos los derechos reservados.` + affiliate system small print (N0 3% + N1-N3 2%).

4. `src/components/dimar/product-card.tsx` — shadcn `Card` (`gap-0 p-0 overflow-hidden`).
   - Image: `aspect-square object-cover`, hover `scale-105`.
   - Badges: discount % (`bg-destructive`) + `Destacado` (`bg-accent`).
   - Supplier name (muted, truncate), name (`line-clamp-2 min-h-[2.5rem]`), stars (Lucide `Star`, filled accent for active), price (`text-primary font-bold`), compareAtPrice (strikethrough).
   - "Agregar" button → `addToCart({productId, name, price, imageUrl, quantity:1, supplierId})` + `toast()`. Shows "Agregado" with `Check` for 1.4s.
   - Whole card clickable → opens `Dialog` with larger image, description, stock badge, SKU, and add-to-cart button.

5. `src/components/dimar/cart-drawer.tsx` — shadcn `Sheet` (side=right, `w-full sm:max-w-md`).
   - Listens for `dimar-open-cart` custom event (TopBar + floating button both dispatch it).
   - Floating action button: `fixed bottom-6 right-6 z-40`, `size-14 rounded-full bg-primary`, badge with item count.
   - Each cart line: thumb, name, price, qty stepper (`-`/`+` via `updateQty`), `Trash2` remove. "Vaciar carrito" link.
   - Footer: subtotal, commission note "Comisión para afiliado (3%)", total, checkout button.
   - Checkout: POST `/api/orders` with `{userId, items:[{productId,quantity,price}], shippingAddress, city, paymentMethod:'TARJETA'}`. On success: `clearCart()`, close drawer, toast `¡Pedido creado! Nº {orderNumber}`. Uses `currentUser?.id` with fallback to `'client'`.

6. `src/components/dimar/modules/marketplace.tsx` — main marketplace view.
   - **Hero**: `rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-8 md:p-12`, headline "Compra, recomienda y gana con Dimarclub", 2 CTAs ("Explorar productos" scrolls to catalog, "Conocer beneficios" → `setModule('benefits')`).
   - **Category pills**: horizontal scroll, fetches `/api/categories`, "Todas" default, active pill uses `cat.color`.
   - **Header ad**: fetches `/api/ads?placement=HEADER`, shows wide banner with overlay + title + "Publicidad" badge.
   - **Featured products**: horizontal scroll of `ProductCard` (w-40 to w-52).
   - **Catalog grid**: `grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4`. Sort dropdown (newest/price-asc/price-desc/rating) + search input (refetches via `/api/products?q=&categoryId=&sort=&limit=48`). Skeletons while loading, empty state card.
   - **Sidebar ads** (lg+): `w-56` right column with `/api/ads?placement=SIDEBAR_RIGHT` + `SIDEBAR_LEFT` combined.
   - **Footer ad**: `/api/ads?placement=FOOTER` banner.
   - **CartDrawer** rendered at the end (floating button + Sheet).

## Key decisions

- **Cart drawer state**: Managed locally in `CartDrawer` via `useState`. Cross-component trigger via `window` custom event `dimar-open-cart` (TopBar cart button + floating FAB both dispatch it). This avoids adding `cartOpen` to the Zustand store (which is out of scope per task constraints).
- **CartDrawer placement**: Rendered inside `MarketplaceModule` per task instructions. The floating FAB is therefore only visible while the marketplace module is active. **For the FAB to appear on ALL modules, the main agent should lift `<CartDrawer />` to `page.tsx`** (e.g. right before `<Footer />`) and remove it from marketplace.tsx. The component is self-contained and portable.
- **Sidebar grouping**: Tienda=Marketplace; Administración=Dashboard/Proveedores/Logística/CRM/Email/Ads/Applications; Comunidad=Afiliados/Socios/Benefits. This puts community-facing modules (affiliates, partners, benefits) under "Comunidad" and operational/admin modules under "Administración".
- **No blue/indigo**: All role badges and accents use esmeralda (primary), amber (accent), emerald, orange, red, muted. Verified zero usage of `blue`, `indigo`, `sky`, `cyan`.
- **Currency**: All prices formatted as `$${value.toFixed(2)}` (USD).
- **Images**: Plain `<img>` with `picsum` URLs from the API (seeded by product id). `loading="lazy"` on catalog images.
- **Accessibility**: `SheetTitle`/`SheetDescription` (sr-only) on sidebar Sheet and cart Sheet. ARIA labels on icon buttons. `DialogDescription` (sr-only) on product dialog.
- **Responsive**: Mobile-first. Catalog grid `grid-cols-2 md:grid-cols-3 xl:grid-cols-4`. Sidebar hidden on mobile (Sheet). Topbar search hidden on mobile (shown in catalog section). Sidebar ads hidden below lg.
- **Scrollbars**: Used `scroll-thin` custom class (defined in globals.css) for category pills, featured row, cart list, and user dropdown.

## API contracts used

- `GET /api/products?q=&categoryId=&featured=&sort=&limit=` → `Product[]` (with `category`, `supplier` includes)
- `GET /api/categories` → `Category[]` (with `children`)
- `GET /api/ads?placement=HEADER|SIDEBAR_LEFT|SIDEBAR_RIGHT|FOOTER` → `Advertisement[]`
- `POST /api/orders {userId, items, shippingAddress, city, paymentMethod}` → `Order` (with `orderNumber`)
- `GET /api/users` → `DemoUser[]` (for user switcher, grouped by role)

## Notes for next agents

- The dev server currently shows "Module not found" errors for `dashboard`, `affiliates`, `suppliers`, `partners`, `logistics`, `crm`, `email`, `ads`, `applications`, `benefits` modules — these are expected (other agents' tasks). My 6 files compile clean.
- `page.tsx` already imports `Sidebar`, `TopBar`, `MarketplaceModule`, `Footer` from the paths I created — all named exports match.
- To make the cart FAB global (visible on all modules), lift `<CartDrawer />` from `marketplace.tsx` into `page.tsx`.
- The TopBar cart button already works via the `dimar-open-cart` event — it just needs a mounted `CartDrawer` somewhere in the tree to listen.
