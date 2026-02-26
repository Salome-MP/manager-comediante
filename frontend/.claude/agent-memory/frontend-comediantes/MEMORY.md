# Frontend Comediantes - Agent Memory

## shadcn/ui Componentes Disponibles
`src/components/ui/`: avatar, badge, button, card, dialog, dropdown-menu, input, label, select, separator, sheet, sonner, table, tabs, textarea
- NO hay: skeleton, tooltip, popover, checkbox, radio, switch, accordion, alert, progress
- Badge tiene variantes: default, secondary, destructive, outline, ghost, link
- **TODOS actualizados al tema oscuro** (sin prefijos `dark:` — tema es :root global)

## CRÍTICO: Prefijos dark: NO funcionan en este proyecto
- `@custom-variant dark (&:is(.dark *))` — dark: solo activa con clase `.dark` en un padre
- El tema oscuro está en `:root` SIN ninguna clase — los `dark:` de shadcn por defecto NO se aplican
- Solución: convertir `dark:bg-input/30` → `bg-input/30` directamente como estilo base

## Estilos Base de Componentes UI (dark, post-actualización)
- `Input/Textarea`: `bg-input/30 border-input focus-visible:border-violet-500/70 focus-visible:ring-violet-500/20`
- `Card`: `bg-card border-white/8` (usa var --card = #16161F)
- `Dialog/Sheet content`: `bg-[#16161F] border-white/8 shadow-2xl shadow-black/60`, overlay: `bg-black/70 backdrop-blur-sm`
- `DropdownMenu/Select content`: `bg-[#16161F] border-white/8 rounded-xl shadow-2xl shadow-black/50`
- `DropdownMenuItem/SelectItem hover`: `focus:bg-white/8`
- `Table head`: `text-muted-foreground text-xs font-semibold uppercase tracking-wider`, row border: `border-white/8`, row hover: `hover:bg-white/4`
- `Separator`: `bg-white/8`
- `Avatar fallback`: `bg-white/8 text-foreground/70 border border-white/10`
- `Tabs list (default)`: `bg-white/6 border border-white/8`, trigger active: `bg-white/10 border-white/10`
- `Sonner`: `theme="dark"` hardcoded, toast: `bg-[#16161F] border border-white/10 rounded-xl`
- `Button outline`: `border-white/10 bg-white/5 hover:bg-white/10`, ghost: `text-foreground/70 hover:bg-white/5`

## Tema de la Plataforma (ACTUALIZADO - Dark Theme Global)
- globals.css ahora usa tema OSCURO por defecto en :root (no en .light)
- **Accent principal:** Púrpura/violet — `oklch(0.627 0.265 303.9)` ~ `#8B5CF6`
- **Superficies (dark layers):**
  - `bg-[#0A0A0F]` — deepest / footer / hero bg / sidebar admin
  - `bg-[#111118]` — body background default
  - `bg-[#16161F]` — card surface (shadcn --card variable)
  - `bg-[#1E1E2A]` — elevated card / hover
  - `bg-[#0f0f17]` — admin content areas
- **Texto:** white con opacidades: `text-white`, `text-white/70`, `text-white/50`, `text-white/40`, `text-white/30`
- **Bordes:** `border-white/8`, `border-white/10`, `border-white/5`
- Clase `.light` disponible para override si se necesita modo claro

## Clases Utilitarias Personalizadas (globals.css)
- `.text-gradient-purple` — gradiente de texto violet
- `.text-gradient-gold` — gradiente de texto dorado
- `.card-glow` — card con borde sutil + hover glow violet on dark bg
- `.separator-glow` — separador luminoso horizontal
- `.noise-overlay` — textura ruido sutil via SVG inline

## Estructura de Archivos Clave
- `src/app/globals.css` — Variables CSS (Tailwind v4, oklch colors, dark theme)
- `src/app/layout.tsx` — RootLayout con Navbar, Footer, Toaster (sonner)
- `src/lib/api.ts` — Axios con interceptor JWT (lee token de localStorage)
- `src/types/index.ts` — Todas las interfaces TypeScript del proyecto
- Font: Inter Variable via @fontsource-variable/inter
- Navbar: `src/components/layout/navbar.tsx` (lowercase — crítico)
- Footer: `src/components/layout/footer.tsx` (lowercase — crítico)

## IMPORTANTE: Case Sensitivity en Imports
- Turbopack (Next.js 16) ES CASE-SENSITIVE en nombres de archivos
- layout.tsx importa `@/components/layout/navbar` y `@/components/layout/footer` en lowercase
- Los archivos fisicos deben ser `navbar.tsx` y `footer.tsx` (no Navbar.tsx)

## Patrones de Diseño Globales

### Hero Sections (Landing)
- Fondo: `bg-[#0A0A0F]` con blur orbs `violet-600/15 blur-3xl` absolutas
- Grid pattern overlay: SVG inline, `opacity-[0.03]`, `backgroundSize: '60px 60px'`
- Badge "eyebrow": `border-violet-500/20 bg-violet-500/10 text-violet-300 rounded-full`
- H1 con `.text-gradient-purple` en palabras clave
- Bottom fade: `bg-gradient-to-t from-[#111118] to-transparent h-24`

### Cards con Hover Effect
- `card-glow` class + `rounded-xl bg-[#16161F] transition-all duration-300`
- Hover: `hover:-translate-y-1` + imagen `group-hover:scale-105`
- Overlay gradient imagen: `opacity-0 group-hover:opacity-100 transition-opacity duration-300`

### Section Headers
- Eyebrow: `text-xs font-semibold uppercase tracking-widest text-violet-400`
- H2: `text-3xl font-black text-white md:text-4xl`

### Botones CTAs
- Primary: `bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/30 hover:-translate-y-0.5`
- Outline dark: `border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8`
- Ghost dark: `text-white/50 hover:bg-white/5 hover:text-white`

### Date Badge para Shows
- `bg-violet-600/15 ring-1 ring-violet-500/20 rounded-xl` + texto: mes `text-violet-400`, día `text-2xl font-black`

### Decoración blur orbs
```tsx
<div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
```

## Navbar (Dark Premium)
- Sticky con scroll detection: `bg-[#0A0A0F]/95 backdrop-blur-xl` scrolled / `/80 backdrop-blur-md` top
- Logo: `.text-gradient-purple` para "Comediantes" + `text-white/70` para ".com"
- Nav links: `text-white/60 hover:bg-white/5 hover:text-white`
- Search dropdown: `bg-[#16161F] border-white/10 shadow-2xl shadow-black/50`
- Cart badge: `bg-violet-500`, Notif badge: `bg-red-500`
- Dropdown menus: `bg-[#16161F] border-white/10 text-white shadow-2xl shadow-black/50`
- Logout: `text-red-400 focus:bg-red-500/10`

## Patrones por Página

### /artistas
- Fondo: `bg-slate-950` con hero `bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950`
- Cards: `rounded-2xl border border-slate-700/50 bg-slate-800/60`
- Input oscuro: `border-slate-700/60 bg-slate-800/80 text-slate-100`
- Grid: `grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`

### /artistas/[slug] (Perfil público)
- Fondo: `bg-zinc-950 text-white`
- Avatar ring gradiente: `from-violet-500 via-fuchsia-500 to-pink-500`
- Layout: `grid gap-10 lg:grid-cols-[1fr_320px]`
- Botón gradiente: `bg-gradient-to-r from-violet-600 to-fuchsia-600`

### /dashboard (Panel artista) — COMPLETO dark theme
- Mismo patrón que /admin: sidebar `bg-[#0f0f17]`, content `bg-[#0a0a0f]`, header `bg-[#0f0f17]`
- Brand icon sidebar: `Mic` (vs `Shield` en admin), label "Artista" / "Panel del artista"
- Role badge en header: texto fijo `ARTISTA`, dot color `bg-violet-500`
- Stat cards: `rounded-2xl border border-white/5 bg-[#0f0f17] p-5` + glow orb absoluto
- Chart: AreaChart con `id="artistSalesGradient"` (evitar conflicto de id con admin)
- Forms inputs dark: `border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus:border-violet-500`
- Galería: `grid-cols-3 md:grid-cols-4 lg:grid-cols-5`, hover overlay `group-hover:bg-black/40`
- Tabs dark: `bg-[#0f0f17] border border-white/5`, trigger activo `bg-violet-600/20 text-violet-300`
- Fulfill btn: `bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30`

### /admin (Panel admin) — COMPLETO dark theme
- Fondo: `bg-[#0a0a0f]`, sidebar: `bg-[#0f0f17]`
- Sidebar active: `bg-violet-600/20 text-violet-300`
- Cards métricas: `rounded-2xl border border-white/5 bg-[#0f0f17] p-5`
- Gráfico: AreaChart con gradiente violet
- **Tablas admin dark:**
  - Contenedor: `overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]`
  - Header row: `border-white/[0.06] hover:bg-transparent`, celdas: `text-zinc-400 font-medium`
  - Body rows: `border-white/[0.04] hover:bg-white/[0.03] transition-colors`
  - Texto principal: `text-white`, secundario: `text-zinc-400`, terciario: `text-zinc-500`
- **Badges de estado dark (patrón ring-inset):**
  - `inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20`
  - Mismo patrón con amber (pendiente), red (cancelado), blue (pagado), violet (procesando), orange (enviado), zinc (inactivo)
- **Dialogs dark:** `bg-[#16161F] border-white/10 text-white`
- **Inputs en dialogs dark:** `bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-violet-500 focus-visible:ring-violet-500/20`
- **Labels en forms dark:** `text-zinc-300 text-sm font-medium`
- **Selects dark:** trigger same as inputs, content: `bg-[#16161F] border-white/10 text-white`, items: `focus:bg-white/5 focus:text-white`
- **Toggle switch dark:** `bg-violet-600` activo / `bg-white/10` inactivo, thumb siempre `bg-white`
- **Paginación dark:** buttons con `border border-white/10 text-zinc-300 hover:bg-white/5`, número: `rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1`
- **Estado vacío:** icono en `rounded-xl bg-white/5` + texto `text-zinc-500`

## Convenciones
- Todo texto en español latinoamericano (Peru)
- Moneda: `S/. XX.XX` → `S/. {Number(price).toFixed(2)}`
- Toasts: `toast.success()` / `toast.error()` de sonner ÚNICAMENTE
- NO usar emojis en ningún texto de UI
- Mobile-first: sm: md: lg: xl: breakpoints
- Contenedor principal: `max-w-7xl mx-auto px-4`

## Bugs / Errores Conocidos
- admin/page.tsx: `stats?.recentOrders?.length > 0` falla TypeScript strict
  Fix: `(stats?.recentOrders?.length ?? 0) > 0`
- admin/page.tsx: `stats?.recentOrders.map(...)` requiere `stats?.recentOrders?.map(...)`

## API Endpoints Conocidos
- `GET /artists/public?limit=N` — Lista pública (res.data.data)
- `GET /artists/public/:slug` — Perfil artista
- `POST /artists/:id/follow` — Follow/unfollow (retorna { following: boolean })
- `GET /auth/followed-artists` — Artistas seguidos
- `GET /shows/upcoming?limit=N` — Próximos shows (res.data.data)
- `GET /products/featured?limit=N` — Productos destacados (res.data.data ?? res.data)
- `GET /notifications/unread-count` → { unreadCount }
- `GET /notifications?limit=10` → { data: [], unreadCount }
- Response paginada: `{ data: T[], total, page, limit }`

## Iconos Lucide Frecuentes
- Layout/Nav: ShoppingCart, User, LogOut, LayoutDashboard, Bell, Package, Search, CheckCheck, X
- Landing: ArrowRight, Ticket, Star, TrendingUp, Mic, ShoppingBag, MapPin, CalendarDays
- /artistas: Users, Search, Star, ShoppingBag, X
- /artistas/[slug]: Heart, ImageIcon, Package, ExternalLink, Sparkles, Play, Clock
- E-commerce/Auth: Minus, Plus, Trash2, CreditCard, Loader2, CheckCircle, XCircle, ArrowLeft, Lock, Mail

## Patrones Auth Pages (login, registro, forgot, reset)
- Wrapper: `relative flex min-h-[80vh] items-center justify-center px-4 bg-[#111118]`
- Orbs: `pointer-events-none absolute inset-0 overflow-hidden` + `rounded-full bg-violet-600/10 blur-3xl`
- Logo link: `.text-gradient-purple` + `.com` en `text-white/50`
- Card: `rounded-2xl border border-white/10 bg-[#16161F] p-8 shadow-2xl shadow-black/40`
- Input: `bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-violet-500 focus-visible:ring-violet-500/20 focus-visible:ring-2`
- Label: `text-zinc-300 text-sm font-medium`
- Success/error state icons: `rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30` + `text-emerald-400`

## Patrones E-commerce (carrito, checkout, producto, confirmación)
- Wrapper: `min-h-screen bg-[#111118]` → inner: `mx-auto max-w-7xl px-4 py-8`
- Item cards: `rounded-xl border border-white/8 bg-[#16161F] p-4 transition-all duration-200 hover:border-white/12`
- Quantity controls: `rounded-lg border border-white/10 bg-white/5` + ghost btns `text-white/60 hover:bg-white/10`
- Delete: `text-red-400/70 hover:bg-red-500/10 hover:text-red-400`
- Summary sticky panel: `sticky top-4 rounded-xl border border-white/8 bg-[#16161F] p-6`
- Select dark: trigger `bg-white/5 border-white/10 text-white`, content `bg-[#16161F] border-white/10`
- Status badges: usar `border` + `bg-COLOR/15 text-COLOR-300 border-COLOR/20` (NO fondo sólido)
- Loader: `<Loader2 className="h-8 w-8 animate-spin text-violet-400" />` en contenedor centrado

## Patrones Mi Cuenta
- TabsList: `bg-white/5 border border-white/8 p-1`
- TabsTrigger: `text-white/50 data-[state=active]:bg-violet-600 data-[state=active]:text-white`
- Secciones perfil: `rounded-xl border border-white/8 bg-[#16161F] p-6` (sin shadcn Card)
- Empty states: `rounded-xl border border-white/8 bg-[#16161F] py-16 text-center` + icono en `rounded-full bg-white/5`

## Patrones Páginas Legales
- Eyebrow: `text-xs font-semibold uppercase tracking-widest text-violet-400`
- H1: `text-3xl font-bold text-white md:text-4xl`
- Secciones: `rounded-xl border border-white/8 bg-[#16161F] p-6`
- Párrafos: `text-white/60 leading-relaxed text-sm`

## Tienda Artista (/artistas/[slug]/tienda)
- Sidebar desktop categorías: `text-white/50 hover:bg-white/5 hover:text-white`, activo: `bg-violet-600 hover:bg-violet-500`
- Product cards: hover `border-violet-500/25 -translate-y-1 shadow-xl shadow-black/40` + imagen `group-hover:scale-105`
- Precio + "Ver detalle": flex justify-between, texto violet `group-hover:text-violet-300`
