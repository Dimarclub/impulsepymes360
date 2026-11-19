# 🚀 Guía de Despliegue — DimarClub en Hostinger

Esta guía te lleva paso a paso desde el ZIP hasta tener `dimarclub.com` funcionando.

---

## 📋 Lo que necesitas antes de empezar

- [ ] Tu acceso a hPanel de Hostinger (https://hpanel.hostinger.com)
- [ ] El ZIP `dimarclub-deploy.zip` que te pasé
- [ ] 30-60 minutos de tiempo
- [ ] Un editor de texto (para editar el `.env`)

---

## 🎯 Resumen de los pasos

1. Subir el ZIP a Hostinger
2. Descomprimirlo en `public_html`
3. Crear la aplicación Node.js en hPanel
4. Configurar variables de entorno (`.env`)
5. Instalar dependencias y construir el proyecto
6. Crear la base de datos y ejecutar el seed
7. Activar SSL (HTTPS)
8. ¡Probar el sitio!

---

## PASO 1: Subir el ZIP a Hostinger

1. Entra a **hPanel** → **Sitios web** → haz clic en **"Gestionar"** en `dimarclub.com`
2. En el menú izquierdo, ve a **Archivos** → **Administrador de archivos**
3. Entra a la carpeta `public_html`
4. Si hay archivos por defecto (como `default.php` o `index.html`), **bórralos**
5. Haz clic en **"Subir"** (arriba a la derecha)
6. Selecciona el archivo `dimarclub-deploy.zip`
7. Espera a que se suba (son ~5MB, tarda 1-2 minutos)

---

## PASO 2: Descomprimir el ZIP

1. En el Administrador de archivos, haz clic derecho sobre `dimarclub-deploy.zip`
2. Selecciona **"Extraer"**
3. Confirma la extracción en `public_html/`
4. Cuando termine, **borra el ZIP** (`dimarclub-deploy.zip`)
5. Deberías ver estos archivos/directorios en `public_html/`:
   - `src/`
   - `prisma/`
   - `public/`
   - `package.json`
   - `next.config.ts`
   - `tsconfig.json`
   - `.env.example`
   - `DEPLOY.md` (este archivo)
   - Otros archivos del proyecto

---

## PASO 3: Crear la aplicación Node.js en hPanel

1. En hPanel → **Avanzado** → **Node.js** (o "Aplicaciones Node.js")
2. Haz clic en **"Crear aplicación"**
3. Llena el formulario:
   - **Nombre:** `dimarclub`
   - **Dominio:** `dimarclub.com`
   - **Versión de Node.js:** `18.x` o `20.x` (la más alta disponible)
   - **Directorio de la app:** `public_html` (donde descomprimiste)
   - **Archivo de entrada:** `server.js` (lo crearemos en el PASO 5)
4. Haz clic en **"Crear"**

> ⚠️ Si Hostinger no tiene la opción de Node.js, tienes que activarla primero. Algunos planes la incluyen, otros no. Si no la ves, contáctame.

---

## PASO 4: Configurar variables de entorno (.env)

1. En el Administrador de archivos, entra a `public_html`
2. Edita el archivo `.env.example`:
   - Haz clic derecho → **"Editar"**
3. **Renombra el archivo** de `.env.example` a `.env`
4. Modifica estas líneas:

```env
# Cambia esta ruta por la ruta real de tu hosting (ver PASO 4a)
DATABASE_URL=file:/home/u743469517/domains/dimarclub.com/public_html/db/custom.db

# Genera un secret aleatorio: cambia "cambia_esto_por..." por 32+ caracteres al azar
# Ejemplo: k7Xm2Lp9Qr4St8Uv3Wx6Yz1Ab5Cd0Ef2Gh7Ij8Kl9Mn0Op1Q
NEXTAUTH_SECRET=tu_secret_aleatorio_aqui_de_32_caracteres
NEXTAUTH_URL=https://dimarclub.com
NEXT_PUBLIC_APP_URL=https://dimarclub.com
```

### PASO 4a: Conocer tu ruta real en Hostinger

La ruta `file:/home/u743469517/domains/dimarclub.com/public_html/db/custom.db` es un ejemplo.
Tu ruta real depende de tu usuario de Hostinger. Para saberlo:

1. En hPanel → **Avanzado** → **Node.js** → haz clic en tu app `dimarclub`
2. Busca el campo **"Directorio raíz de la aplicación"** o **"App Directory"**
3. Esa es tu ruta real. Por ejemplo: `/home/u743469517/domains/dimarclub.com/public_html`
4. Tu `DATABASE_URL` sería: `file:/home/u743469517/domains/dimarclub.com/public_html/db/custom.db`

**Importante:** La carpeta `db/` debe existir y ser escribible. Si no existe, créala:
1. En el Administrador de archivos → Entra a `public_html`
2. Haz clic en **"Nueva carpeta"** → Nómbrala `db`
3. Permisos: 755 (default)

### PASO 4b: También configura las variables en hPanel

Además del archivo `.env`, **tienes que configurar las variables en hPanel**:
1. hPanel → **Avanzado** → **Node.js** → haz clic en tu app `dimarclub`
2. Busca **"Variables de entorno"** (Environment Variables)
3. Añade cada variable:
   - `DATABASE_URL` = `file:/home/u743469517/domains/dimarclub.com/public_html/db/custom.db`
   - `NEXTAUTH_SECRET` = tu_secret_aleatorio_aqui
   - `NEXTAUTH_URL` = `https://dimarclub.com`
   - `NEXT_PUBLIC_APP_URL` = `https://dimarclub.com`
   - `NODE_ENV` = `production`
   - `PORT` = `3000`

---

## PASO 5: Instalar dependencias y construir el proyecto

Hostinger te permite ejecutar comandos en la terminal de la app.

1. hPanel → **Avanzado** → **Node.js** → haz clic en tu app `dimarclub`
2. Busca el botón **"Terminal"** o **"Consola"** (a veces es un ícono `>_`)
3. Se abre una terminal en la carpeta `public_html`
4. Ejecuta estos comandos uno por uno:

```bash
# 1. Instalar dependencias (puede tardar 3-5 minutos)
npm install

# 2. Generar el cliente Prisma
npx prisma generate

# 3. Crear las tablas en la base de datos
npx prisma db push

# 4. Construir el proyecto para producción (puede tardar 5-10 minutos)
npm run build

# 5. Mover archivos estáticos al standalone (automático con nuestro build script)
# El package.json ya lo hace, pero por si acaso:
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
```

> ⚠️ **Si el build falla por memoria** (Hostinger tiene 2GB RAM): intenta 2-3 veces. Si sigue fallando, contáctame para optimizar el build o usar build local.

---

## PASO 6: Crear el archivo server.js (entry point)

Hostinger necesita un archivo `server.js` en la raíz de la app para arrancar.

1. En el Administrador de archivos → `public_html`
2. Crea un nuevo archivo llamado `server.js`
3. Pega este contenido:

```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const port = process.env.PORT || 3000
const dev = false
const hostname = '0.0.0.0'
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(port, hostname, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
```

4. Guarda el archivo

---

## PASO 7: Ejecutar el seed (datos iniciales)

En la terminal de Node.js:

```bash
# Crear los 6 planes + combo PubliBags
node scripts/seed-plans.cjs

# Crear usuarios demo (opcional, recomendado)
npx prisma db seed
```

---

## PASO 8: Iniciar la aplicación

En hPanel → **Avanzado** → **Node.js** → tu app `dimarclub`:

1. Haz clic en **"Iniciar"** (o "Start")
2. Espera 30-60 segundos
3. Estado debería cambiar a **"En ejecución"**

Si falla, revisa los logs en la misma página (suele haber un botón "Ver logs").

---

## PASO 9: Configurar el dominio y SSL

### Configurar SSL (HTTPS)

1. hPanel → **Seguridad** → **SSL**
2. Selecciona `dimarclub.com`
3. Activa **SSL gratuito** (Let's Encrypt)
4. Marca **"Forzar HTTPS"** (redirect automático de HTTP a HTTPS)

### Configurar el proxy del dominio

Por defecto, Hostinger sirve la web desde `public_html/` con Apache. Para que el dominio apunte a tu app Node.js:

1. hPanel → **Avanzado** → **Node.js** → tu app
2. Debería haber un botón **"Vincular dominio"** o ya estar vinculado
3. Si no, hay que crear un `.htaccess` en `public_html/` con:

```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

---

## PASO 10: ¡Probar el sitio!

1. Abre tu navegador y visita: **https://dimarclub.com**
2. Deberías ver la página principal de DimarClub
3. Prueba:
   - Ir a `/dima` → debería cargar el Robot Dima
   - Iniciar sesión como admin: `admin@dimarclub.com` / `dimar123`
   - Navegar por el marketplace
4. Si algo no funciona, revisa los logs de la app en hPanel

---

## 🆘 Problemas comunes y soluciones

### "La página carga en blanco"
- Revisa los logs de la app en hPanel
- Probablemente falta alguna variable de entorno en hPanel
- Verifica que el `.env` tenga los valores correctos

### "Database connection failed"
- Verifica la ruta de `DATABASE_URL` en el `.env`
- Asegúrate que la carpeta `db/` exista y sea escribible (permisos 755)
- Si usas MySQL, verifica usuario/contraseña de la DB

### "El build falla por memoria"
- Intenta ejecutarlo 2-3 veces
- Si sigue fallando, contáctame para hacer build local y subir solo el standalone

### "Chat en vivo no funciona"
- En shared hosting NO funciona WebSocket en tiempo real
- El chat usa polling cada 5 segundos (suficiente para la mayoría de casos)

### "La app no arranca"
- Revisa los logs en hPanel → Node.js → tu app → "Ver logs"
- Verifica que `server.js` existe en `public_html/`
- Verifica que el puerto configurado (3000) no esté ocupado

---

## 📞 Soporte

Si tienes problemas:
1. Toma screenshot del error
2. Copia los logs de la app
3. Escríbeme con el detalle

¡Mucha suerte! 🚀
