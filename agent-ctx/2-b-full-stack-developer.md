# Task 2-b — Dashboard + Affiliates modules

## What was built

### 1. `src/components/dimar/modules/dashboard.tsx`
Admin dashboard with KPIs and charts. Fetches data from GET `/api/dashboard`.

- **StatCard** helper component (inline) — icon, label, big number, trend indicator, accent color (primary/accent/muted), hint text. Card `p-5`.
- **KPI row 1** (grid-cols-2 md:grid-cols-4): Revenue, Pedidos, Usuarios, Comisiones pagadas. Each with trend % (TrendingUp/TrendingDown from Lucide).
- **KPI row 2** (grid-cols-2 md:grid-cols-4): Capital socios, Proveedores, Mensajeros, Solicitudes pendientes. Each with hint text.
- **AreaChart** "Ventas últimos 14 días" — Recharts, height 280px, esmeralda gradient fill (linearGradient `salesGradient` using `oklch(0.6 0.13 162)`), tooltip custom, X axis short-date.
- **Two-column section**:
  - Left: horizontal BarChart "Ventas por categoría" (layout="vertical", esmeralda fill).
  - Right: PieChart/Donut "Comisiones por nivel" with 4 cells using `var(--chart-1..4)` colors + manual legend with percentages.
- **Recent orders table** — Pedido, Cliente, Total, Estado (badge with ORDER_STATUS_COLORS), Fecha. Container `max-h-80 overflow-y-auto scroll-thin` with sticky header.
- **Skeleton** loading placeholders while fetching (DashboardSkeleton component).
- `useState` + `useEffect` for data fetching.
- Currency `$${n.toFixed(2)}`, numbers `toLocaleString('es-EC')`.

### 2. `src/components/dimar/modules/affiliates.tsx`
Affiliate back-office with shadcn Tabs (3 tabs). Uses `useAppStore(s => s.currentUser)`.

- If `currentUser` is null, shows centered message "Inicia sesión para ver tu red".
- Header: title + user name + affiliate code.

**Tab "Mi Red"** (`/api/affiliates/tree?userId=`):
- Summary panel: "Tu código de afiliado: XXX" card (2-col span) + MiniStat cards for referidos directos, comisiones totales, tamaño de la red.
- **Recursive TreeNode component** rendering the affiliate tree 3+ levels deep.
  - Each node = NodeCard with: avatar circle (initials, colored by level via LEVEL_STYLES), name, email, role badge (ROLE_LABELS), city (MapPin), affiliate code (Award), and 3-col stats grid (referrals, sales, commissions).
  - Connectors: vertical lines (`w-px h-5 bg-border`) parent→down and child→up; horizontal line (absolute positioned, `left/right = 50%/N %`) between siblings when 2+ children. Recursive children layout via `flex justify-center`.
  - Tree is horizontally scrollable (`overflow-x-auto scroll-thin`) on small screens.
  - Level colors: L0 = primary (esmeralda), L1 = amber, L2 = teal, L3 = muted.
  - Legend at bottom showing all 4 levels.

**Tab "Comisiones"** (`/api/affiliates/commissions?userId=`):
- 4 mini stat cards: Total comisiones, N0, N1, N2+N3.
- Filter dropdown (Select) — ALL, N0, N1, N2, N3 — using `useMemo` for filtered list.
- Table: Fecha, Origen, Nivel (badge), Tasa, Monto, Estado. Scrollable `max-h-[480px]`.

**Tab "Mis Ventas"** (`/api/affiliates/sales?userId=`):
- 4 mini stat cards: Total ventas, Monto vendido, Comisión N0 (3%), Ticket promedio.
- Table: Pedido, Fecha, Items count, Total, Estado badge, Comisión N0 (total * 0.03).

## Key decisions
- Inline `LEVEL_STYLES`, `ROLE_LABELS`, `ROLE_COLORS` constants for the tree visualization.
- Tree connecting lines use a recursive TreeNode with `flex justify-center` parent and absolutely-positioned horizontal line at `left: calc(50%/N)`, `right: calc(50%/N)` — this gives exact center-to-center alignment when gap=0 and children use `px-2` for spacing.
- Used `getInitials` for avatar circles.
- Used `countNetwork` and `sumCommissions` recursive helpers for the summary panel totals.
- Currency format `$${n.toFixed(2)}` and numbers `toLocaleString('es-EC')` per task spec.
- All components are `'use client'` since they use hooks/Recharts.
- Recharts colors: `oklch(0.6 0.13 162)` for primary series, `oklch(0.75 0.15 75)` for secondary, `var(--chart-1..5)` for pie cells — no indigo/blue.

## Files created
- `/home/z/my-project/src/components/dimar/modules/dashboard.tsx`
- `/home/z/my-project/src/components/dimar/modules/affiliates.tsx`

## Lint status
- No lint or TypeScript errors in the two new files (errors in other modules belong to other agents).
