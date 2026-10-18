# Guía de Despliegue en Producción — Dimarclub

## 1. Base de datos: SQLite → PostgreSQL

El esquema Prisma ya es agnóstico. Para migrar a PostgreSQL:

1. **Crear la base de datos PostgreSQL** en tu proveedor (Supabase, Neon, Railway, RDS, etc.)

2. **Actualizar `prisma/schema.prisma`**:
   ```prisma
   datasource db {
     provider = "postgresql"   // era "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. **Actualizar `.env`**:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/dimarclub?schema=public"
   ```

4. **Migrar**:
   ```bash
   bun run db:migrate dev --name init
   bun run prisma/seed.ts   # contraseña: dimar123 (hasheada con bcrypt)
   ```

> **Nota sobre el entorno de desarrollo**: este sandbox usa SQLite por restricción del entorno. El servidor de desarrollo debe iniciarse con `next dev` (Node.js) — **no** con `bun --bun run next dev`, ya que el runtime de Bun tiene un bug con Prisma 6 (error `@prisma/client-<hash>` module not found). El `package.json` script `dev` ya usa `next dev` correctamente.

---

## 2. Pagos: modo test → Stripe real

El servicio de pagos (`src/lib/services/payment.ts`) ya soporta Stripe. Para activarlo:

1. **Instalar Stripe** (ya instalado): `bun add stripe`

2. **Configurar `.env`**:
   ```
   PAYMENT_PROVIDER=stripe
   STRIPE_SECRET_KEY=sk_live_tu_clave_real
   STRIPE_PUBLISHABLE_KEY=pk_live_tu_clave_real
   ```

3. El flujo ya está implementado: `/api/payments/intent` crea el PaymentIntent, `/api/payments/confirm` lo confirma, descuenta stock y genera comisiones.

---

## 3. Email: modo dev (logs) → Resend real

El servicio de email (`src/lib/services/email.ts`) ya soporta Resend. Para activarlo:

1. **Instalar Resend**: `bun add resend`

2. **Configurar `.env`**:
   ```
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_tu_clave_real
   EMAIL_FROM="Dimarclub <no-reply@dimarclub.com>"
   ```

3. El endpoint `/api/email/send` ya envía campañas a suscriptores con personalización `{nombre}` y plantilla HTML.

---

## 4. Autenticación

- **NextAuth.js** con CredentialsProvider (bcrypt) ya configurado.
- Todas las cuentas demo usan contraseña `dimar123`.
- Para cambiar la contraseña por defecto del admin, actualiza el seed o usa un endpoint de cambio de contraseña.
- El `NEXTAUTH_SECRET` debe cambiarse en producción (genera uno con `openssl rand -base64 32`).

---

## 5. Seguridad de APIs

Todas las rutas están protegidas con `requireRole()` / `requireSession()`:
- **Públicas**: catálogo de productos, categorías, anuncios, benefits, registro.
- **Sesión requerida**: compras, afiliados (red, comisiones, ventas).
- **Admin**: dashboard, CRM, email marketing, solicitudes, liquidación de comisiones, gestión de usuarios.
- **Admin/Supplier**: productos, anuncios.
- **Admin/Courier**: entregas, mensajeros.

---

## 6. Almacenamiento de imágenes

Las subidas se guardan en `/public/uploads` procesadas con Sharp (WebP, 1200px max + thumbnail 400px). Para producción, migra a almacenamiento en la nube (S3, Cloudinary) modificando `src/app/api/upload/route.ts`.
