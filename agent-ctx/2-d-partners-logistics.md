# Task 2-d — Partners + Logistics modules

**Agent:** full-stack-developer (partners+logistics)
**Date:** 2025-10-18

## What I built

Two client-side Next.js 16 modules for the Dimarclub B2C marketplace admin:

1. **`src/components/dimar/modules/partners.tsx`** — Socios capitalistas management
2. **`src/components/dimar/modules/logistics.tsx`** — Mensajería & courier management

## Files created

- `/home/z/my-project/src/components/dimar/modules/partners.tsx`
- `/home/z/my-project/src/components/dimar/modules/logistics.tsx`

## Contracts followed

### Partners module
- `GET /api/partners` → Partner[] (with user + contributions)
- `POST /api/partners` `{name,email,phone,city,amount}` → Partner
- `POST /api/partners/contributions` `{partnerId,amount}` → PartnerContribution

### Logistics module
- `GET /api/couriers` → Courier[]
- `POST /api/couriers` `{name,email,phone,vehicleType,licensePlate,zone}` → Courier
- `PATCH /api/couriers/[id]` `{available:boolean}` → Courier
- `GET /api/deliveries` → Delivery[] (with order + courier)
- `PATCH /api/deliveries/[id]` `{courierId, status}` → Delivery

## Key decisions

- **Type extensions:** the shared `Partner.user` type didn't include `city`, and `Delivery` didn't include `updatedAt`, but both Prisma queries return them. I defined `PartnerWithCity` and `DeliveryWithUpdated` locally to type these extra fields without modifying `src/lib/types.ts`.
- **Vehicle icons:** mapped `VEHICLE_ICONS` (string values `'Bike' | 'Truck' | 'Car'`) to actual Lucide components via `VEHICLE_ICON_COMPONENTS`.
- **Delivery status flow:** `ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED` with Spanish labels `{Asignado, Recogido, En camino, Entregado}`. Each card has an "Avanzar a <next>" button that PATCHes the next status.
- **Optimistic toggle:** the availability Switch updates UI immediately and rolls back on fetch error.
- **Styling:** esmeralda (primary) + ámbar (accent), no indigo/blue. `Intl.NumberFormat('es-EC', { currency: 'USD' })` for currency. Custom `.scroll-thin` scrollbar class used in tables and kanban.
- **Kanban:** horizontal `flex gap-4 overflow-x-auto` with 4 columns each `min-w-64 max-w-72`.
- **Capital semilla & Oportunidades laborales:** purely visual sections with realistic mock data (Ecuador context).

## What other agents need to know

- The `src/app/page.tsx` already imports `PartnersModule` and `LogisticsModule` from `@/components/dimar/modules/partners` and `@/components/dimar/modules/logistics` respectively — both exports are now available.
- `useAppStore` Zustand store is used for toast notifications via `useAppStore((s) => s.toast)`.
- The shared `VEHICLE_LABELS` and `VEHICLE_ICONS` from `@/lib/types` are imported directly.
- No new dependencies were added. All UI uses existing shadcn/ui components.
