# Task 13 — full-stack-developer (courier app)

## Tarea
Mobile-first courier app module — vista móvil optimizada para mensajeros.

## Work Log
- Leído contexto: worklog.md, src/lib/types.ts, src/lib/store.ts, src/lib/security/auth.ts
- Leído APIs existentes:
  - `GET /api/impulse/fuerza/shipments` — filtra por rol (COURIER ve `where.courier.userId === currentUser.id`)
  - `PATCH /api/impulse/fuerza/shipments/[id]` con `{status}` — avanza pipeline, setea pickedUpAt/deliveredAt/finalPrice
  - `GET /api/couriers` — lista todos los couriers con `user` incluido
  - `PATCH /api/couriers/[id]` con `{available: boolean}` — requiere rol ADMIN o COURIER
- Leído prisma schema del modelo ShipmentRequest para validar campos (createdAt, requestedAt, assignedAt, pickedUpAt, deliveredAt, finalPrice, estimatedPrice, courier { user })
- Creado `src/components/dimar/modules/courier-app.tsx`:
  - `'use client'` + Spanish UI + shadcn (Card, Button, Badge, Switch, AlertDialog, Skeleton)
  - Shell tipo teléfono: `max-w-md mx-auto` + `rounded-3xl border shadow-sm overflow-hidden`
  - Sticky header con gradiente esmeralda→emerald-700: título "Fuerza Delta · Mensajero" + nombre courier + badges vehículo/zona + Switch de disponibilidad
  - Stats bar 4 celdas (Hoy/Pendientes/Entregados/Ganancias del día — cuenta entregados hoy con finalPrice)
  - Botón "Refrescar" con spinner (pull-to-refresh feel)
  - Cards de envío: status badge + ganancia, destinatario + dirección con 📍, referencia, info paquete, origen provider
  - Grid 2 cols: botón "GPS" (Google Maps encode en nueva pestaña) + "Llamar" (tel:)
  - Botón primario según status: ASSIGNED→"Recogí paquete" (esmeralda), PICKED_UP→"En camino" (ámbar), IN_TRANSIT→"Entregado" (emerald-600 con confirm AlertDialog)
  - DELIVERED muestra banner con fecha/hora
  - Empty state ilustrado (icono en círculo) con copy específica por tab
  - Loading skeleton con 3 cards
  - Bottom nav 2 tabs: "Asignados" + "Historial" con badges count ámbar
  - AlertDialog confirma antes de marcar DELIVERED (menciona ganancia del día)
  - Toasts: "✓ Paquete recogido", "✓ En camino", "✓ Entregado. Ganancia: $X"
  - Acceso restringido: COURIER o ADMIN únicamente (card "Acceso restringido" si otro rol)
  - Sin sesión: card "Inicia sesión para usar la app"
  - Paleta esmeralda + ámbar (NO indigo/blue)
  - Targets táctiles min-h-10 / min-h-12
- Integración:
  - `src/lib/types.ts`: añadido `'courier-app'` al union `ModuleId`
  - `src/components/dimar/sidebar.tsx`: añadido import `Smartphone` + item `{ id: 'courier-app', label: 'App Mensajero', icon: Smartphone }` en sección ImpulsePymes360
  - `src/app/page.tsx`: añadido import `CourierAppModule` + `case 'courier-app': return <CourierAppModule />`
- Lint: `bun run lint` → exit 0, 0 errores, 0 warnings

## Stage Summary
- Archivo creado: `src/components/dimar/modules/courier-app.tsx`
- Archivos modificados: `src/lib/types.ts`, `src/components/dimar/sidebar.tsx`, `src/app/page.tsx`
- APIs consumidas (todas existentes): `/api/couriers`, `/api/impulse/fuerza/shipments`, `/api/couriers/[id]`, `/api/impulse/fuerza/shipments/[id]`
- App lista para couriers: ven envíos asignados, navegan al destino (Google Maps), llaman al destinatario, avanzan pipeline con confirmación + toasts en español
