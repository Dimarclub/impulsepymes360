# 🚀 Guía de Despliegue — DimarClub en Vercel

Guía paso a paso para desplegar tu proyecto en Vercel con el dominio `dimarclub.com`.

**Tiempo total estimado: 15-20 minutos**

---

## 📋 Lo que necesitas antes de empezar

- [ ] Tu cuenta de GitHub (`Dimarclub`) con el repo `impulsepymes360`
- [ ] Tu acceso a hPanel de Hostinger (para cambiar los DNS del dominio)
- [ ] 15-20 minutos

---

## PASO 1: Crear cuenta en Vercel (2 minutos)

1. Ve a **https://vercel.com**
2. Click en **"Sign Up"** (arriba a la derecha)
3. Click en **"Continue with GitHub"** (la opción verde con el logo de GitHub)
4. Autoriza a Vercel a acceder a tu cuenta de GitHub
5. ¡Listo! Ya tienes tu cuenta gratuita de Vercel

---

## PASO 2: Importar el proyecto desde GitHub (3 minutos)

1. En tu dashboard de Vercel, click en **"Add New..."** → **"Project"**
2. Verás una lista de tus repos de GitHub
3. Busca **`impulsepymes360`** y click en **"Import"**
4. Vercel auto-detecta que es Next.js (verás "Next.js" detectado)

### Configuración del proyecto:
- **Framework Preset:** Next.js (auto-detectado, no lo cambies)
- **Root Directory:** `./` (default)
- **Build Command:** (déjalo vacío, Vercel usa el del package.json)
- **Output Directory:** (déjalo vacío, auto-detectado)
- **Install Command:** (déjalo vacío, auto-detectado)

---

## PASO 3: Crear la base de datos Postgres (3 minutos)

1. En el mismo formulario de import, busca la sección **"Storage"** (abajo)
2. Click en **"Create Database"** o ve a la pestaña **"Storage"**
3. Selecciona **"Postgres"** (Neon — el recomendado)
4. Click en **"Create"**
5. Vercel crea la DB y **automáticamente añade `DATABASE_URL` a las variables de entorno**

> 💡 Si no ves la opción Storage en el import, puedes crearla después:
> Dashboard → tu proyecto → pestaña **"Storage"** → **"Create Database"** → **Postgres (Neon)**

---

## PASO 4: Añadir variables de entorno (2 minutos)

1. En el formulario de import, busca **"Environment Variables"**
2. Añade cada una (nombre + valor + click en "Add"):

| Name | Value |
|------|-------|
| `NEXTAUTH_SECRET` | (genera un secret aleatorio — ver abajo) |
| `NEXTAUTH_URL` | `https://dimarclub.com` |
| `NEXT_PUBLIC_APP_URL` | `https://dimarclub.com` |
| `WHATSAPP_NUMBER` | `593992689844` |

> 🔑 **Para generar el NEXTAUTH_SECRET:**
> Ve a https://generate-secret-nextauth.vercel.app/ y copia el secret que te genera.
> O escribe cualquier texto aleatorio de 32+ caracteres (ej: `k7Xm2Lp9Qr4St8Uv3Wx6Yz1Ab5Cd0Ef2Gh7Ij8`)

> ✅ **DATABASE_URL** se añade automáticamente cuando creas la Postgres DB en el PASO 3. No la añadas manualmente.

---

## PASO 5: Deploy! (5 minutos)

1. Click en **"Deploy"** (abajo del formulario)
2. Vercel empieza el build:
   - `npm install` → instala dependencias (~2 min)
   - `prisma generate` → genera el cliente Prisma (automático)
   - `next build` → construye el proyecto (~3-5 min)
3. Espera a que termine (verás una animación de loading)
4. Cuando termine verás: **"Congratulations!"** con confeti 🎉
5. Te da una URL temporal como: `https://impulsepymes360.vercel.app`

### ¡Ya tienes tu app funcionando!
Pero todavía sin datos. Continuemos.

---

## PASO 6: Crear las tablas en la base de datos (3 minutos)

Las tablas se crean automáticamente con el primer deploy gracias al `postinstall` script, pero si necesitas hacerlo manual:

1. En tu proyecto de Vercel → pestaña **"Storage"**
2. Click en tu base de datos Postgres
3. Busca **"Data Browser"** o **"Tables"**
4. Si no ves tablas, ejecuta el push desde tu computadora:
   ```bash
   # En tu compu, en la carpeta del proyecto:
   DATABASE_URL="TU_DATABASE_URL_DE_VERCEL" npx prisma db push
   ```
   (La DATABASE_URL está en: Vercel → Storage → tu DB → ".env.local" tab)

---

## PASO 7: Cargar datos iniciales (seed) (2 minutos)

Para crear los 6 planes + Combo PubliBags + usuarios demo:

**Opción A — Desde tu computadora:**
```bash
# En la carpeta del proyecto:
DATABASE_URL="TU_DATABASE_URL_DE_VERCEL" node scripts/seed-plans.cjs
```

**Opción B — Pedirme que lo haga:**
Avísame cuando estés en este paso y te preparo un endpoint temporal de seed que puedes llamar desde el navegador.

---

## PASO 8: Conectar tu dominio dimarclub.com (5 minutos)

1. En Vercel → tu proyecto → pestaña **"Settings"** → **"Domains"**
2. Escribe: `dimarclub.com` y click en **"Add"**
3. Vercel te muestra **2 registros DNS** que debes añadir en Hostinger:

### Ahora ve a Hostinger hPanel:

1. hPanel → **Avanzado** → **Editor de zonas DNS** (para `dimarclub.com`)
2. **Borra** los registros `A` existentes que apunten a la IP de Hostinger (ej: `179.61.189.197`)
3. **Añade** estos registros (los que te dio Vercel):

**Registro 1 (el principal):**
```
Tipo: A
Nombre/Host: @
Valor/Points to: 76.76.21.21 (o la IP que te dé Vercel)
TTL: 14400
```

**Registro 2 (para www):**
```
Tipo: CNAME
Nombre/Host: www
Valor/Points to: cname.vercel-dns.com
TTL: 14400
```

4. Guarda los cambios
5. Vuelve a Vercel → Settings → Domains
6. Vercel verifica los DNS automáticamente (puede tardar 5-30 minutos en propagar)
7. Cuando esté verificado, verás: **"Valid Configuration"** con un ✓ verde

---

## PASO 9: ¡PROBAR! 🎉

1. Abre **https://dimarclub.com** en tu navegador
2. Deberías ver la página principal de DimarClub
3. Prueba:
   - `/dima` → el Robot Dima con voz
   - Inicia sesión: `admin@dimarclub.com` / `dimar123`
   - Navega por el marketplace, CRM Hub, etc.

---

## 🔄 A partir de ahora: Deploy automático

Cada vez que se hagan cambios y se suban a GitHub (`git push`):
1. Vercel lo detecta automáticamente
2. Ejecuta el build
3. Tu sitio se actualiza solo
4. **No tienes que hacer nada**

---

## 🆘 Problemas comunes

### "Build Failed" en Vercel
- Revisa los logs: Vercel → Deployments → click en el que falló → "Building" logs
- Error más común: falta alguna variable de entorno
- Solución: Settings → Environment Variables → verifica que estén todas

### "Database connection error"
- Verifica que la DB Postgres esté creada (Storage tab)
- Verifica que `DATABASE_URL` esté en las variables de entorno
- Prueba reiniciar el deploy: Deployments → ⋯ → "Redeploy"

### "El dominio no funciona"
- Los DNS tardan hasta 30 minutos en propagar (a veces horas)
- Verifica que los registros DNS en Hostinger estén exactamente como Vercel pidió
- Usa https://dnschecker.org para verificar la propagación

### "Error 500 en la página"
- Revisa los logs: Vercel → Deployments → "Functions" logs
- Puede ser falta de tablas en la DB (ejecuta prisma db push)

---

## 📞 Soporte

Si tienes problemas en cualquier paso:
1. Toma screenshot del error
2. Copia el log del error (Vercel → Deployments → logs)
3. Escríbeme y lo solucionamos juntos

---

## 💰 Sobre costos

| Servicio | Plan gratuito | Límite |
|----------|--------------|--------|
| Vercel Hobby | $0/mes | 100GB bandwidth, deploy ilimitado |
| Vercel Postgres (Neon) | $0/mes | 256MB storage, 60h compute |
| GitHub | $0/mes | repo privado ilimitado |

**Cuando escalar:** si tu app crece (miles de usuarios), Vercel Pro cuesta $20/mes e incluye más recursos. Pero para empezar, el plan gratuito es más que suficiente.

¡Mucha suerte! 🚀
