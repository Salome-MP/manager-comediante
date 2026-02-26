# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Comediantes.com — E-commerce platform for comedians in Latin America. Comedians get branded product pages and show listings; the platform manufactures/ships products and splits margins. Four user roles: SUPER_ADMIN, STAFF, ARTIST, USER.

## Architecture

Monorepo with two independent projects:

- **backend/** — NestJS 11 + Prisma v7 + PostgreSQL (REST API on port 4000)
- **frontend/** — Next.js 16 + Tailwind CSS v4 + shadcn/ui (on port 3000)

Frontend consumes backend via HTTP. All API routes are prefixed with `/api`.

## Commands

### Backend
```bash
cd backend
pnpm run start:dev      # Dev server with hot reload (port 4000)
pnpm run build          # Compile TypeScript
pnpm run start:prod     # Production server
pnpm run lint           # ESLint
pnpm run test           # Jest unit tests
pnpm run test:e2e       # End-to-end tests
npx prisma db push      # Push schema changes (no migrations)
npx prisma generate     # Regenerate Prisma client after schema changes
npx prisma studio       # Visual DB browser
pnpm run seed           # Seed test data
```

### Frontend
```bash
cd frontend
pnpm dev                # Dev server (port 3000)
pnpm build              # Production build
pnpm lint               # ESLint
```

**Important:** After changing `prisma/schema.prisma`, always run `npx prisma generate` before building, or TypeScript will fail on new fields.

## Backend Structure

NestJS modular architecture. Each domain module has: `module.ts`, `controller.ts`, `service.ts`, `dto/`.

- `src/prisma/` — Global PrismaService (uses @prisma/adapter-pg with pg Pool for Prisma v7)
- `src/auth/` — JWT auth, login/register, forgot/reset password, profile management
- `src/common/guards/` — JwtAuthGuard, RolesGuard
- `src/common/decorators/` — @Roles(), @CurrentUser()
- `src/artists/` — CRUD + public profile + customizations, gallery, follow, blast-followers, landing-config
- `src/products/` — Base products + ArtistProduct assignment, featured, search, scheduling
- `src/categories/` — Product categories
- `src/cart/` — Shopping cart with item customizations
- `src/orders/` — Orders from cart, stock management, simulate-payment, PDF receipts
- `src/shows/` — Events, ticket purchase, QR generation/validation
- `src/payments/` — Mercado Pago integration (preferences, webhooks with HMAC-SHA256)
- `src/notifications/` — In-app notifications + EmailService (nodemailer SMTP) + follower notifications
- `src/referrals/` — Referral/affiliate system with commission tracking
- `src/upload/` — Bunny CDN image upload (artists, products, shows, gallery)
- `src/settings/` — Platform key-value settings (admin)
- `src/coupons/` — Discount coupons with validation
- `src/reviews/` — Product reviews (rating + comment)
- `src/wishlist/` — User wishlists
- `src/messages/` — User messaging
- `prisma/schema.prisma` — Database schema (19 models, all entities)

### Key Backend Patterns

**Auth:** Protected endpoints use `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.SUPER_ADMIN)`. Public endpoints have no guards. User data from JWT via `@CurrentUser()` decorator. `JwtStrategy.validate()` queries DB with `include: { artist: true }` — returns `{ id, email, role, firstName, lastName, artistId }`.

**Validation:** Global `ValidationPipe` in `main.ts` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. DTOs use `class-validator` decorators + `@ApiProperty()` from `@nestjs/swagger`.

**Prisma v7:** Uses driver adapter pattern — `@prisma/adapter-pg` wraps a `pg.Pool`. No built-in engine. `PrismaModule` is `@Global()` so PrismaService is available everywhere without imports.

**JWT type workaround:** `expiresIn` in `JwtModule.registerAsync` needs `as any` cast (NestJS JWT v11 type issue).

**API Docs:** Swagger at http://localhost:4000/api/docs when backend is running.

### Pricing Model

`salePrice - manufacturingCost = margin`. Artist gets `artistCommission%` of margin. Commissions tracked in `Commission` table with type `"artist"` or `"referral"`.

## Frontend Structure

Next.js App Router with `src/` directory. Font: Inter (local via @fontsource-variable/inter).

- `src/app/` — Pages (file-based routing)
- `src/components/ui/` — shadcn/ui components
- `src/components/layout/` — Navbar (search with 300ms debounce, notifications bell, cart badge), Footer
- `src/components/providers/` — ThemeProvider (next-themes)
- `src/lib/api.ts` — Axios client with JWT interceptor
- `src/stores/` — Zustand stores (auth, cart)
- `src/types/` — TypeScript interfaces matching backend DTOs (includes `PaginatedResponse<T>` generic)
- `src/hooks/` — Custom hooks (e.g., `use-chart-colors.ts` for Recharts theme adaptation)

### Key Frontend Patterns

**API Client (`src/lib/api.ts`):** Axios instance with `baseURL` from `NEXT_PUBLIC_API_URL`. Request interceptor adds `Authorization: Bearer <token>` from localStorage. Response interceptor clears token + user from localStorage on 401.

**Auth Store (`src/stores/auth.store.ts`):** Zustand store. `login()` → POST /auth/login → stores `{ user, token }` in state + localStorage. `loadFromStorage()` hydrates from localStorage on mount.

**Cart Store (`src/stores/cart.store.ts`):** Zustand store. Syncs with backend via API calls (fetchCart, addItem, updateQuantity, removeItem, clearCart). `itemCount` computed from `cart.items`.

**Forms:** `react-hook-form` + `@hookform/resolvers` + `zod` for validation.

**Protected Layouts:** Admin (`/admin/`) and artist (`/dashboard/`) layouts call `loadFromStorage()` in useEffect, check `user.role`, redirect to `/login` if unauthorized. Both use collapsible sidebar (60px collapsed, 240px expanded).

### Theme System

`next-themes` with `attribute="class"`, **default light (white background)**, storageKey `comediantes-theme`. CSS variables in `globals.css`: `:root` = **light** (white bg), `.dark` = dark overrides. Use semantic design tokens — `bg-surface-card` not `bg-[#16161F]`, `text-text-primary` not `text-white`. **NEVER use hardcoded zinc/slate/gray colors** — always use semantic tokens (`surface-*`, `overlay-*`, `text-*`, `border-*`, `chart-*`). For colors that differ in light vs dark, use `dark:` variant (e.g., `text-navy-600 dark:text-navy-300`).

### Frontend Routes

- `/` — Landing page (public)
- `/login`, `/registro` — Auth pages
- `/forgot-password`, `/reset-password` — Password recovery flow
- `/artistas` — Public artist listing with search
- `/artistas/[slug]` — Artist public profile (with follow button)
- `/artistas/[slug]/tienda` — Artist shop with category filters
- `/producto/[id]` — Product detail page
- `/buscar` — Search results
- `/carrito` — Shopping cart
- `/checkout` — Checkout with Mercado Pago redirect
- `/confirmacion/[id]` — Order confirmation (handles MP payment status)
- `/mi-cuenta` — User account (orders, followed artists, profile)
- `/mis-entradas` — User tickets
- `/admin/*` — Admin panel (SUPER_ADMIN, STAFF): dashboard, artists, categories, products, orders, users, shows, commissions, coupons, reports
- `/dashboard/*` — Artist panel (ARTIST): dashboard, profile, products, shows, sales, referrals, customizations, analytics, messages, scheduling, landing
- `/terminos`, `/privacidad` — Legal pages

### Seed Data
Run `cd backend && pnpm run seed` to create test data:
- Admin: admin@comediantes.com / admin123
- Artist: jorge@comediantes.com / artista123
- Fan: fan@email.com / fan12345
- Categories: Poleras, Gorros, Casacas, Accesorios, Tazas

## Database

PostgreSQL via Prisma ORM. Schema at `backend/prisma/schema.prisma`.
Connection: `postgresql://postgres:***@localhost:5432/comediantes_db`

Key entities: User, Artist, ArtistFollower, ArtistCustomization, MediaItem, Category, Product, ArtistProduct, Cart, CartItem, CartItemCustomization, Order, OrderItem, OrderItemCustomization, Show, Ticket, Referral, Commission, Notification, Message, Coupon, Wishlist, Review, PlatformSetting.

Key enums: Role, OrderStatus (PENDING→PAID→PROCESSING→SHIPPED→DELIVERED), TicketStatus, ShowStatus, CustomizationType (AUTOGRAPH, HANDWRITTEN_LETTER, VIDEO_GREETING, VIDEO_CALL, PRODUCT_PERSONALIZATION), NotificationType, CommissionStatus, InvoiceType.

## Environment Variables

### Backend (.env)
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing secret
- `JWT_EXPIRES_IN` — Token expiry (default: 7d)
- `PORT` — Server port (default: 4000)
- `MERCADOPAGO_ACCESS_TOKEN` — Mercado Pago server access token
- `MERCADOPAGO_PUBLIC_KEY` — Mercado Pago public key
- `MERCADOPAGO_WEBHOOK_SECRET` — Webhook signature secret
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_PORT`, `EMAIL_FROM` — SMTP config
- `FRONTEND_URL` — Frontend URL for emails (default: http://localhost:3000)
- `BUNNY_STORAGE_ZONE` — Bunny CDN storage zone name
- `BUNNY_STORAGE_API_KEY` — Bunny CDN storage API key
- `BUNNY_CDN_HOSTNAME` — Bunny CDN pull zone hostname
- `BUNNY_BASE_PATH` — Base path in storage (default: comediantes)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` — Backend API URL (default: http://localhost:4000/api)
- `NEXT_PUBLIC_MP_PUBLIC_KEY` — Mercado Pago public key (for client-side)
