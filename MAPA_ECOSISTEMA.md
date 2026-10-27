# 🗺️ ImpulsePymes360 — Mapa Completo del Ecosistema

## 📋 Resumen Ejecutivo

**ImpulsePymes360** es un sistema de marketing integral y omnicanal que combina 6 elementos en una sola plataforma para impulsar negocios PYME en Ecuador.

---

## 🌐 Estructura de Dominios

| Subdominio | Elemento | Estado |
|------------|----------|--------|
| `impulsepymes360.space-z.ai` | **Portal principal** (este proyecto) | ✅ Activo |
| `impulsepymes360.com` | Dominio producción (futuro) | ⏳ Por comprar |

**Importante:** Los 6 elementos son módulos dentro del proyecto principal. No necesitan proyectos separados en space-z.ai.

---

## 🧩 Los 6 Elementos del Ecosistema

### 1. 🛒 Impulso360 (Marketplace)
- **Qué es:** Tienda online 24/7 donde se compran productos
- **Dónde está:** Sidebar → "Marketplace"
- **Funciones:** Catálogo, carrito, checkout, pago con tarjeta, banners publicitarios
- **Acceso:** Público (visitante puede navegar y comprar)

### 2. 👥 Dimarclub (Comunidad + Afiliados)
- **Qué es:** Red de afiliados de 3 niveles que gana comisiones
- **Dónde está:** Sidebar → "Afiliados"
- **Funciones:** Árbol de red, comisiones N0 (3%) + N1/N2/N3 (2%), liquidación
- **Acceso:** CLIENT, AFFILIATE, ADMIN

### 3. 🚚 Fuerza Delta (Mensajería + WhatsApp)
- **Qué es:** Servicio de logística exclusiva para proveedores
- **Dónde está:** Sidebar → "Fuerza Delta"
- **Funciones:** Bot de WhatsApp, solicitudes de envío, asignación de mensajeros, app móvil
- **Acceso:** SUPPLIER (solicita), COURIER (entrega), ADMIN (gestiona)

### 4. 📔 Directorio360 (Directorio + Álbum)
- **Qué es:** Directorio digital de proveedores + álbum de stickers coleccionables
- **Dónde está:** Sidebar → "Directorio360"
- **Funciones:** Fichas de proveedores, stickers (common/rare/golden), progreso, sorteos
- **Acceso:** Todos los autenticados

### 5. 👜 PubliBags (Publicidad Física)
- **Qué es:** Bolsas reutilizables con espacios publicitarios 5×5cm + QR
- **Dónde está:** Sidebar → "PubliBags"
- **Funciones:** Ediciones, grid de 80 espacios, compra, mockup para imprenta (PDF)
- **Acceso:** SUPPLIER (compra espacios), ADMIN (gestiona ediciones)

### 6. 🌐 Web Express (Constructor de Sitios)
- **Qué es:** Genera automáticamente el sitio web del proveedor
- **Dónde está:** Sidebar → "Web Express"
- **Funciones:** 4 templates, editor visual, sitio público en /w/[slug]
- **Acceso:** SUPPLIER (edita su sitio), ADMIN (gestiona todos)

---

## 🔐 Control de Acceso por Rol

| Rol | Módulos que ve |
|-----|----------------|
| **Visitante** (no logueado) | Solo Marketplace |
| **CLIENT** | Marketplace + Afiliados + Beneficios |
| **AFFILIATE** | + Link in Bio |
| **SUPPLIER** | Marketplace + Proveedores + Fuerza Delta + Web Express + PubliBags + Directorio + Social + Impulse |
| **COURIER** | Marketplace + App Mensajero + Fuerza Delta |
| **PARTNER** | Marketplace + Socios + Beneficios |
| **ADMIN** | TODO |

---

## 👤 Credenciales de Acceso (Demo)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `opcionred1968@gmail.com` | `admin123` |
| Admin (demo) | `admin@dimarclub.com` | `dimar123` |
| Afiliada | `ana@dimarclub.com` | `dimar123` |
| Cliente | `pedro@dimarclub.com` | `dimar123` |
| Proveedor | `ventas@tecnoexpress.com` | `dimar123` |
| Socio | `socio1@dimarclub.com` | `dimar123` |

---

## 🧭 Navegación del Navbar Superior (3 filas)

### Fila 1 (barra esmeralda→ámbar)
- Logo ImpulsePymes360 (clic → inicio)
- Teléfono +593992689844 (clic → llama)
- Texto marquee desplazándose (editable desde admin)
- Icono ⚙️ Configuración (solo admin)

### Fila 2
- Buscador
- Botón usuario (dropdown: Iniciar sesión / Registrarse como Cliente/Afiliado/Socio)
- Campana de notificaciones
- Carrito de compras

### Fila 3 (centrada)
- Categorías (dropdown con subcategorías)
- Inicio
- Comunidad
- Dimarclub (enlace a dimarclub.com)
- Proveedor (dropdown: Iniciar sesión / Crear cuenta / Proveedores)
- Alquiler

---

## ⚙️ Configuración del Sitio (Admin)

Accede con el icono ⚙️ en la barra superior:

1. **Texto marquee** — editable
2. **Teléfono de contacto** — editable
3. **Logo del sitio** — sube tu logo de ImpulsePymes360
4. **Banners publicitarios** — 1320×330px (imagen, GIF o video)
5. **Logos de marcas** — slider de logos debajo del banner principal

---

## 🛠️ Módulos de Administración (solo ADMIN)

| Módulo | Función |
|--------|---------|
| Dashboard | KPIs y gráficos del marketplace |
| Proveedores | CRUD de proveedores + carga CSV |
| Logística | Flota de mensajeros |
| CRM | Pipeline de leads (kanban) |
| Email Marketing | Campañas + suscriptores |
| Publicidad | Espacios publicitarios marketplace |
| Solicitudes | Registro de proveedores/mensajeros/socios |
| Socios | Capitalistas + aportes |
| Config del sitio | Textos, banners, logos |
| Automatización360 | Dashboard unificado + eventos |

---

## 📱 Rutas Públicas Importantes

| Ruta | Qué muestra |
|------|-------------|
| `/` | Portal principal con navbar |
| `/w/[slug]` | Sitio web público del proveedor (Web Express) |
| `/print/bag/[editionId]` | Mockup de bolsa PubliBags para imprimir |

---

## 🔗 Enlaces Externos

- **Dimarclub.com** — enlace en el navbar (sitio satélite de la comunidad)
- **WhatsApp Business API** — webhook en `/api/impulse/fuerza/webhook`

---

## 📦 Para Producción

1. Comprar dominio `impulsepymes360.com`
2. Migrar SQLite → PostgreSQL (ver PRODUCTION.md)
3. Activar Stripe (pagos reales)
4. Activar Resend (email real)
5. Configurar WhatsApp Business API
6. Desplegar en Vercel o servidor propio

---

*Documento generado el {fecha} · ImpulsePymes360 v1.0 · Ecuador*
