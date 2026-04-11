# ID Card Designer — Project Documentation

> Version 1.0.0 · FastAPI + React · Docker Compose

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Features](#2-features)
3. [System Overview](#3-system-overview)
4. [User Workflow](#4-user-workflow)
5. [Tech Stack](#5-tech-stack)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Backend Architecture](#7-backend-architecture)
8. [Database Design](#8-database-design)
9. [API Documentation](#9-api-documentation)
10. [Payment Flow](#10-payment-flow)
11. [File Storage](#11-file-storage)
12. [Export System](#12-export-system)
13. [Deployment](#13-deployment)
14. [Security](#14-security)
15. [Scalability](#15-scalability)
16. [Folder Structure](#16-folder-structure)
17. [Setup Instructions](#17-setup-instructions)
18. [Future Enhancements](#18-future-enhancements)

---

## 1. Introduction

### Project Description
**ID Card Designer** is a full-stack SaaS web application that enables individuals and organisations to design, customise, and order professional-grade ID cards entirely in the browser. Users choose a template (or start from scratch), drag-and-drop fields on an interactive card canvas, configure print specifications, and place an order — all without installing any software or having design skills.

### Purpose
Traditional ID card production involves expensive design software, back-and-forth with print vendors, and long turnaround times. ID Card Designer eliminates all of that by combining a self-service design studio with an integrated print-order workflow into a single, cloud-hosted product.

### Target Users

| Segment | Use Case |
|---------|----------|
| **Corporates / SMEs** | Employee ID cards with company branding |
| **Schools & Colleges** | Student and staff identity cards |
| **Event Organisers** | Delegate / volunteer badges |
| **Freelancers** | Personal identity or business cards |
| **Print Shops** | White-label order intake |

---

## 2. Features

### 2.1 Authentication & Accounts
- Email + password registration with complexity rules (min 8 chars, uppercase, lowercase, digit)
- JWT-based login with short-lived access tokens (60 min) and long-lived refresh tokens (30 days)
- Automatic silent token refresh — users stay logged in without re-entering credentials
- User profile (name, company, phone) editable post-registration

### 2.2 Template Gallery
- Curated library of pre-built templates organised by category (Company, School, Events, etc.)
- Each template ships with front and back layouts, accent colours, and background images
- One-click "Apply" loads the entire layout into the designer canvas
- Admin-managed: templates can be activated, deactivated, or deleted from the admin panel

### 2.3 Interactive Card Designer
- **Dual-side canvas** — design front and back independently; switch with a single click
- **Field types**: Photo, Name, Title, Company, Employee ID, Email, Phone, Barcode, Logo, Address
- **Drag-and-drop positioning** — click and drag any field to reposition; precise pixel-level control
- **8-handle resize** — resize fields by dragging any of the eight directional handles (N, S, E, W, NE, NW, SE, SW)
- **Style controls**: font family (45+ Google Fonts), size, colour, bold/italic/underline, text alignment
- **Field decoration**: border width/colour/style/radius, drop shadow colour and size
- **Background**: SVG colour gradients or uploaded image backgrounds per side
- **Orientation**: Horizontal (CR80: 380×240 px) or Vertical (240×380 px)
- Real-time preview panel showing exactly how the printed card will look
- Auto-save to backend with "Saved ✓" toast notification

### 2.4 Card Configuration
Every design is tied to print specifications selectable inside the designer:

| Option | Choices |
|--------|---------|
| **Printer** | Thermal · Inkjet |
| **Print Side** | Single Side · Both Sides |
| **Card Type** | Company · School · Others |
| **Chip Type** | None · RFID · LED |
| **Finish** | Matte · Glossy · Metallic |
| **Material** | PVC Plastic · Paper · Composite |
| **Orientation** | Horizontal · Vertical |
| **Quantity** | Min 10, step 10, up to any amount |

### 2.5 Dynamic Pricing
- Unit price calculated server-side from base rate + add-ons (finish, chip, both-sides)
- Automatic volume discounts:
  - 50+ cards → 7% off
  - 100+ cards → 12% off
  - 200+ cards → 18% off
  - 500+ cards → 25% off
- 5% GST applied at checkout
- Shipping options: Standard (free) · Express (₹9.99) · Overnight (₹24.99)
- All pricing values configurable live from the Admin panel without code changes

### 2.6 Shopping Cart
- Multiple designs in a single cart session
- Per-item quantity, specifications, and calculated price shown at a glance
- Remove or modify items before proceeding to checkout

### 2.7 Checkout Flow (5 steps)
1. **Cart** — Review items and totals
2. **Shipping** — Delivery address form + shipping method selection
3. **Payment** — COD or payment via Razorpay (card / UPI / net banking)
4. **Review** — Full order summary, optional promo code, terms acceptance
5. **Confirmed** — Order number displayed; confirmation email dispatched

### 2.8 Order Management
- Users can view their complete order history with status tracking
- Order statuses: `pending` → `confirmed` → `printing` → `packaging` → `shipped` → `delivered`
- Order confirmation email sent automatically with itemised receipt and shipping info

### 2.9 Export / Download
- Export any card side as **PNG** (full-resolution via html2canvas)
- Export as **PDF** (single or multi-page via jsPDF)
- Downloads are entirely client-side — no server roundtrip required

### 2.10 Admin Dashboard
- **Overview**: total orders, revenue, cards printed; top materials, finishes, chip types
- **Orders**: filterable/searchable table; update order status
- **Pricing**: live editing of all base prices, add-ons, discounts, and shipping costs
- **Card Options**: CRUD for available chip types, finishes, and materials with price add-ons
- **Templates**: upload new templates (front + back images), toggle active/inactive, delete
- **Users**: paginated user list

---

## 3. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet / Browser                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP :80
                    ┌────────▼────────┐
                    │   Nginx Proxy   │
                    │  (static SPA +  │
                    │  /api reverse   │
                    │   proxy)        │
                    └────┬───────┬───┘
             /api/       │       │  /  and  /uploads/
        ┌────────────▼─┐ │  ┌───▼────────────────────┐
        │   Backend     │ │  │  React SPA (static)    │
        │  FastAPI +    │ │  │  + uploads/ volume     │
        │  Gunicorn     │ │  │  (served as static)    │
        └───────┬───────┘ │  └────────────────────────┘
                │
        ┌───────▼─────────┐
        │  PostgreSQL 16  │
        │  (Docker vol)   │
        └─────────────────┘
```

**Request flow:**
1. Browser requests any URL → Nginx serves the React SPA (`index.html`) for non-API paths
2. React Router handles client-side navigation
3. API calls (prefixed `/api/`) are proxied by Nginx to the FastAPI backend on port 8000
4. FastAPI validates JWTs, runs business logic, reads/writes PostgreSQL via SQLAlchemy async
5. Uploaded images land on a shared Docker named volume, served directly by Nginx at `/uploads/`

---

## 4. User Workflow

```
Landing Page
    │
    ▼
Browse Templates  ──or──  Start from Scratch
    │                           │
    └────────── Designer ───────┘
                    │
                    ▼
          Configure Print Specs
          (printer, finish, chip, qty)
                    │
                    ▼
              Add to Cart
                    │
                    ▼
         Checkout (5 steps)
         1. Cart review
         2. Shipping address
         3. Payment method
         4. Order review
         5. Confirmation + Email
                    │
                    ▼
          Order Fulfilment
       (printing → packaging → shipped → delivered)
```

**Step-by-step user journey:**

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Land on homepage | Animated hero, feature highlights, pricing teaser |
| 2 | Click "Start Designing" (unauthenticated) | Auth modal opens (login / register) |
| 3 | Register / log in | JWT tokens stored in localStorage; user profile loaded |
| 4 | Browse templates at `/templates` | Public API lists active templates |
| 5 | Click "Use Template" | Designer loads with template fields pre-applied |
| 6 | Drag, resize, style fields | All changes held in Redux state |
| 7 | Click "Save" | `PUT /api/designs/{id}` saves JSON field data |
| 8 | Set quantity and specs | Unit price recalculated live in browser |
| 9 | Click "Add to Cart" | Item appended to `cartSlice` |
| 10 | Proceed to Checkout | 5-step modal; shipping form; payment; review |
| 11 | Place Order | `POST /api/orders/` → order created in DB, email sent |
| 12 | See confirmation screen | Order number shown; inbox email received |
| 13 | (Optional) Export card | PNG or PDF downloaded in browser |

---

## 5. Tech Stack

### Frontend

| Technology | Version | Why |
|------------|---------|-----|
| **React** | 19 | Industry-standard component UI library; concurrent rendering |
| **TypeScript** | 5 | Static typing prevents runtime errors; rich IDE support |
| **Tailwind CSS** | 3 | Utility-first CSS for rapid, consistent styling without custom CSS bloat |
| **Redux Toolkit** | 2 | Predictable global state; async thunks; slices prevent boilerplate |
| **Framer Motion** | 12 | Production-grade animation API; spring physics; gesture support |
| **html2canvas** | 1.4 | Rasterises the DOM card canvas to a pixel-accurate PNG |
| **jsPDF** | 4 | Client-side PDF generation from canvas images |
| **DOMPurify** | 3 | Sanitises SVG background strings to prevent XSS attacks |
| **Vite** | 8 | Sub-second HMR in dev; optimised production bundle via Rollup |

### Backend

| Technology | Version | Why |
|------------|---------|-----|
| **FastAPI** | 0.115 | Async-first Python web framework; auto-generates OpenAPI docs; Pydantic integration |
| **Pydantic** | 2.11 | Request/response validation and settings management; v2 is significantly faster |
| **SQLAlchemy** | 2.0 | Mature ORM with full async support; works with multiple DB backends |
| **Alembic** | 1.16 | Database schema migration tool; integrates directly with SQLAlchemy models |
| **python-jose** | 3.4 | JWT encoding/decoding with HS256; supports token expiry and type validation |
| **bcrypt** | 5 | Adaptive password hashing; resistant to brute-force attacks |
| **slowapi** | 0.1 | Rate limiting middleware for FastAPI; key-based (IP) limiting |
| **aiosmtplib** | 3.0 | Async SMTP client for Gmail; non-blocking email dispatch |
| **Gunicorn + Uvicorn** | 23 / 0.34 | Production-grade ASGI server; Gunicorn manages worker processes |
| **Pillow** | 11 | Image processing; validates uploaded images |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **PostgreSQL 16** | Production relational database; ACID compliant |
| **Docker Compose** | Multi-container orchestration (db, migrate, backend, frontend) |
| **Nginx** | Reverse proxy, SPA fallback routing, static file serving, security headers |

---

## 6. Frontend Architecture

### 6.1 Folder Structure (feature-based)

```
frontend/src/
├── app/
│   ├── store.ts              # Redux store (all slices combined)
│   └── hooks.ts              # Typed useAppDispatch / useAppSelector
│
├── features/                 # Feature modules — state + components co-located
│   ├── auth/
│   │   └── authSlice.ts      # Login, register, token refresh, modal state
│   ├── cart/
│   │   └── cartSlice.ts      # Cart items, checkout modal toggle
│   ├── config/
│   │   └── configSlice.ts    # Card options and pricing fetched from API
│   ├── admin/
│   │   └── adminSlice.ts     # Stats, orders, pricing config, card options, users
│   └── designer/
│       ├── designerSlice.ts  # All card state (fields, specs, UI tabs)
│       ├── constants.ts      # Field colours, handles, font list
│       └── components/
│           ├── CardCanvas.tsx       # Renders a card with all its fields
│           ├── DraggableField.tsx   # Individual interactive field
│           ├── FontPicker.tsx       # Google Font selector dropdown
│           └── PhotoUpload.tsx      # Photo field upload component
│
├── pages/
│   ├── Home/
│   │   ├── HomePage.tsx          # Landing page (hero, features, testimonials)
│   │   └── HeroSection.tsx       # Animated hero with Framer Motion
│   ├── Designer/
│   │   ├── DesignerPage.tsx      # Full designer UI (canvas, controls, tabs)
│   │   ├── Templategallery.tsx   # Template picker inside designer
│   │   └── templateData.ts       # Static template definitions
│   ├── Templates/
│   │   └── TemplatesPage.tsx     # Public template gallery page
│   ├── Admin/
│   │   ├── AdminLayout.tsx       # Sidebar + outlet wrapper
│   │   ├── AdminOverview.tsx     # Stats dashboard
│   │   ├── AdminOrders.tsx       # Order management table
│   │   ├── AdminPricing.tsx      # Pricing configuration
│   │   ├── AdminCardOptions.tsx  # Card option CRUD
│   │   └── AdminTemplates.tsx    # Template management
│   └── Checkout.tsx              # 5-step checkout modal
│
├── routes/
│   ├── AppRoutes.tsx         # All route definitions
│   └── AdminGuard.tsx        # Redirect non-admins away from /admin
│
└── shared/
    ├── components/
    │   ├── AuthModal.tsx         # Login / register modal
    │   ├── FormControls.tsx      # Reusable Btn, Select, RadioGroup, FieldRow
    │   └── ErrorBoundary.tsx     # Global error catch
    ├── types/
    │   ├── card.types.ts         # CardField, CardTemplate, all enum types
    │   └── order.types.ts        # CartItem, ShippingAddress, OrderItem
    └── utils/
        ├── api.ts                # Fetch wrapper with auth headers + auto-refresh
        ├── apiBase.ts            # VITE_API_URL resolution
        ├── pricing.ts            # calcUnitPrice, calcTotal, getDiscountLabel
        ├── fonts.ts              # Google Fonts dynamic loader (45+ fonts)
        ├── storage.ts            # localStorage helpers
        └── uid.ts                # UUID generation
```

### 6.2 State Management

All global state lives in Redux. Local UI state (hover, focus, form values) stays in component `useState`.

| Slice | Responsibility |
|-------|---------------|
| `authSlice` | Current user object, JWT token, auth modal visibility |
| `designerSlice` | All card fields (front + back), print specs (printer/finish/chip/etc.), active tab, selected field, quantity |
| `cartSlice` | Cart items array, cart/checkout modal visibility, order confirmation flag |
| `configSlice` | Pricing config and card options fetched from backend at app load |
| `adminSlice` | Admin dashboard data (stats, orders, pricing, options, users) |

**Data flow example — add to cart:**
```
DesignerPage
  → user sets quantity via designerSlice.setQuantity()
  → user clicks "Add to Cart"
  → cartSlice.addItem({ ...designerState, unitPrice, totalPrice }) dispatched
  → Checkout modal reads cart items from cartSlice
  → POST /api/orders/ → backend re-validates all prices server-side
```

### 6.3 API Client

`/src/shared/utils/api.ts` wraps the native Fetch API:

```typescript
// All requests attach the bearer token from localStorage.
// On 401: attempt silent refresh → retry original request.
// On refresh failure: logout user.

const api = {
  get:  <T>(path: string)               => request<T>("GET",    path),
  post: <T>(path: string, body?: unknown) => request<T>("POST",   path, body),
  put:  <T>(path: string, body?: unknown) => request<T>("PUT",    path, body),
  del:  <T>(path: string)               => request<T>("DELETE",  path),
};
```

### 6.4 Routing

```
/                     → HomePage
/designer/:id         → DesignerPage   (public; save requires auth)
/templates            → TemplatesPage  (public)
/admin                → AdminGuard → AdminOverview
/admin/orders         → AdminOrders
/admin/pricing        → AdminPricing
/admin/card-options   → AdminCardOptions
/admin/templates      → AdminTemplates
*                     → 404 Not Found
```

---

## 7. Backend Architecture

### 7.1 Application Assembly (`app/main.py`)

```
FastAPI app
  ├── Middleware
  │     ├── SlowAPIMiddleware   — rate limiting
  │     └── CORSMiddleware      — allowlisted origins only
  ├── Exception handlers
  │     └── RateLimitExceeded → HTTP 429
  ├── Routers
  │     ├── /api/auth
  │     ├── /api/designs
  │     ├── /api/templates
  │     ├── /api/orders
  │     ├── /api/uploads
  │     ├── /api/pricing
  │     └── /api/admin
  ├── Static files
  │     └── /uploads → settings.UPLOAD_DIR (local disk)
  └── GET /api/health → {"status": "ok"}
```

### 7.2 Request / Response Flow

```
HTTP Request
    │
    ▼
Nginx  (proxy_pass → backend:8000)
    │
    ▼
SlowAPIMiddleware  (check rate limit by X-Real-IP)
    │
    ▼
CORSMiddleware     (check Origin header)
    │
    ▼
Router function    (e.g. POST /api/orders/)
    │
    ├── FastAPI dependency injection
    │     ├── get_db()             → AsyncSession (SQLAlchemy)
    │     ├── get_current_user()   → User (validates JWT)
    │     └── get_current_admin()  → User (requires is_admin=True)
    │
    ├── Pydantic schema validation  (request body)
    │
    ├── Service layer call          (order_service.create_order)
    │     ├── Business logic
    │     ├── DB writes
    │     └── Email dispatch (fire-and-forget)
    │
    └── Pydantic response model serialisation → JSON
```

### 7.3 Services

| Service | File | Responsibility |
|---------|------|---------------|
| `auth_service` | `services/auth_service.py` | Password hashing (bcrypt), JWT creation and decoding |
| `pricing_service` | `services/pricing_service.py` | Unit price calculation, volume discount, order total with tax |
| `order_service` | `services/order_service.py` | Create order + items; generate order number; trigger email |
| `image_service` | `services/image_service.py` | Validate and save uploaded images to `UPLOAD_DIR` |
| `email_service` | `services/email_service.py` | Build HTML email; send via Gmail SMTP (non-blocking) |

### 7.4 Dependency Injection

```python
# database.py
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

# dependencies.py
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    # Validates Bearer token, checks type == "access", loads User from DB

async def get_current_admin(user: User = Depends(get_current_user)) -> User:
    # Raises 403 if user.is_admin is False
```

---

## 8. Database Design

### Entity Relationship Summary

```
users ──< designs
users ──< orders ──< order_items
                           │
                      (references)
                         designs

templates       (standalone — not FK-linked to designs)
pricing_config  (key-value store for all pricing rules)
card_options    (lookup table: chip_type / finish / material)
```

### Table Definitions

#### `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR (UUID) | PK | User identifier |
| `email` | VARCHAR | UNIQUE, NOT NULL, indexed | Login email |
| `password_hash` | VARCHAR | NOT NULL | bcrypt hash |
| `first_name` | VARCHAR | nullable | |
| `last_name` | VARCHAR | nullable | |
| `company` | VARCHAR | nullable | |
| `phone` | VARCHAR | nullable | |
| `is_active` | BOOLEAN | default `true` | Soft-disable account |
| `is_admin` | BOOLEAN | default `false` | Admin flag |
| `created_at` | TIMESTAMP | server default now | |
| `updated_at` | TIMESTAMP | server default now | |

#### `designs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR (UUID) | PK | Design identifier |
| `user_id` | VARCHAR | FK → users.id, indexed | Owner |
| `name` | VARCHAR | default `"Untitled Design"` | |
| `printer` | VARCHAR | | "Thermal" or "Inkjet" |
| `print_side` | VARCHAR | | "Single Side" or "Both Sides" |
| `card_type` | VARCHAR | | "Company" / "School" / "Others" |
| `orientation` | VARCHAR | | "Horizontal" or "Vertical" |
| `chip_type` | VARCHAR | | "None" / "RFID" / "LED" |
| `finish` | VARCHAR | | "Matte" / "Glossy" / "Metallic" |
| `material` | VARCHAR | | "PVC Plastic" / "Paper" / "Composite" |
| `front_fields` | JSON | | Array of `CardField` objects |
| `back_fields` | JSON | | Array of `CardField` objects |
| `thumbnail_url` | VARCHAR | nullable | Preview image path |
| `created_at` | TIMESTAMP | server default | |
| `updated_at` | TIMESTAMP | server default | |

#### `orders`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR (UUID) | PK | |
| `order_number` | VARCHAR | UNIQUE | e.g. `ORD-A3F9KL` |
| `user_id` | VARCHAR | FK → users.id, indexed | |
| `status` | VARCHAR | default `"confirmed"` | Order lifecycle stage |
| `shipping_address` | JSON | | Full address dict |
| `shipping_method` | VARCHAR | | "standard" / "express" / "overnight" |
| `shipping_cost` | NUMERIC(10,2) | | |
| `payment_method` | VARCHAR | | "cod" / "card" / "upi" / "netbanking" |
| `payment_ref` | VARCHAR | nullable | Razorpay payment ID when applicable |
| `subtotal` | NUMERIC(10,2) | | Before tax and shipping |
| `promo_discount` | NUMERIC(10,2) | default 0 | |
| `tax` | NUMERIC(10,2) | | 5% GST |
| `grand_total` | NUMERIC(10,2) | | Final charged amount |
| `total_cards` | INTEGER | | Sum of all item quantities |
| `created_at` | TIMESTAMP | server default | |
| `updated_at` | TIMESTAMP | server default | |

#### `order_items`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR (UUID) | PK | |
| `order_id` | VARCHAR | FK → orders.id | |
| `design_id` | VARCHAR | FK → designs.id, nullable | Linked design (if saved) |
| `card_type` | VARCHAR | | |
| `printer` | VARCHAR | | |
| `print_side` | VARCHAR | | |
| `orientation` | VARCHAR | | |
| `chip_type` | VARCHAR | | |
| `finish` | VARCHAR | | |
| `material` | VARCHAR | | |
| `quantity` | INTEGER | | |
| `unit_price` | NUMERIC(10,2) | | Server-calculated |
| `total_price` | NUMERIC(10,2) | | unit_price × quantity |
| `front_field_count` | INTEGER | default 0 | |
| `back_field_count` | INTEGER | default 0 | |

#### `templates`

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR (UUID) PK | |
| `name` | VARCHAR | Display name |
| `category` | VARCHAR, indexed | "Company" / "School" / etc. |
| `accent_color` | VARCHAR | Hex colour for UI accents |
| `bg_color` | VARCHAR | Hex background colour |
| `front_fields` | JSON | Pre-set field layout |
| `back_fields` | JSON | Pre-set back layout |
| `front_bg_url` | VARCHAR | Background image URL |
| `back_bg_url` | VARCHAR | |
| `orientation` | VARCHAR | "Horizontal" / "Vertical" |
| `is_active` | BOOLEAN | Controls visibility in gallery |
| `created_at` | TIMESTAMP | |

#### `pricing_config`

| Column | Type | Description |
|--------|------|-------------|
| `key` | VARCHAR(50) PK | e.g. `"base_thermal"`, `"discount_100"` |
| `value` | NUMERIC(10,4) | Numeric value (price in ₹ or discount %) |
| `label` | VARCHAR(100) | Human-readable label for admin UI |
| `updated_at` | TIMESTAMP | |

**Default pricing keys:**

| Key | Default | Description |
|-----|---------|-------------|
| `base_thermal` | 2.50 | Base price per card (Thermal printer) |
| `base_inkjet` | 1.20 | Base price per card (Inkjet printer) |
| `addon_glossy` | 0.30 | Glossy finish surcharge |
| `addon_metallic` | 0.80 | Metallic finish surcharge |
| `addon_rfid` | 1.50 | RFID chip surcharge |
| `addon_led` | 2.00 | LED chip surcharge |
| `addon_both_sides` | 0.40 | Both-sides printing surcharge |
| `discount_50` | 7.0 | Discount % for qty ≥ 50 |
| `discount_100` | 12.0 | Discount % for qty ≥ 100 |
| `discount_200` | 18.0 | Discount % for qty ≥ 200 |
| `discount_500` | 25.0 | Discount % for qty ≥ 500 |
| `shipping_standard` | 0.0 | Standard shipping (5–7 days) |
| `shipping_express` | 9.99 | Express shipping (2–3 days) |
| `shipping_overnight` | 24.99 | Overnight shipping (1 day) |

#### `card_options`

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR (UUID) PK | |
| `category` | VARCHAR, indexed | `"chip_type"` / `"finish"` / `"material"` |
| `value` | VARCHAR(50) | Machine value e.g. `"Glossy"` |
| `label` | VARCHAR(100) | Display label |
| `price_addon` | NUMERIC(10,2) | Additional cost per card |
| `is_active` | BOOLEAN | |
| `sort_order` | INTEGER | Display ordering |

---

## 9. API Documentation

**Base URL:** `https://yourdomain.com/api`  
**Authentication:** `Authorization: Bearer <access_token>` header (where marked ✅)  
**Content-Type:** `application/json` for all request bodies  
**Interactive docs:** `GET /api/docs` (Swagger UI, auto-generated by FastAPI)

---

### 9.1 Auth Endpoints

#### `POST /auth/register`
> Rate-limited: **3 requests / minute per IP**

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "MyPass123",
  "first_name": "Rahul",
  "last_name": "Sharma",
  "company": "Acme Corp",
  "phone": "9876543210"
}
```

**Response `201`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

---

#### `POST /auth/login`
> Rate-limited: **5 requests / minute per IP**

**Request body:**
```json
{ "email": "user@example.com", "password": "MyPass123" }
```

**Response `200`:** Same `TokenResponse` as register.

---

#### `POST /auth/refresh`

**Request body:**
```json
{ "refresh_token": "eyJhbGciOiJIUzI1NiJ9..." }
```

**Response `200`:** New `TokenResponse`.

---

#### `GET /auth/me` ✅

**Response `200`:**
```json
{
  "id": "a1b2c3d4-...",
  "email": "user@example.com",
  "first_name": "Rahul",
  "last_name": "Sharma",
  "company": "Acme Corp",
  "phone": "9876543210",
  "is_admin": false,
  "created_at": "2025-01-15T10:30:00Z"
}
```

---

#### `PUT /auth/me` ✅

**Request body:** Any subset of `{ first_name, last_name, company, phone }`  
**Response `200`:** Updated `UserResponse`.

---

### 9.2 Design Endpoints

#### `POST /designs/` ✅

**Request body:**
```json
{
  "name": "My Company Card",
  "printer": "Thermal",
  "print_side": "Both Sides",
  "card_type": "Company",
  "orientation": "Horizontal",
  "chip_type": "RFID",
  "finish": "Glossy",
  "material": "PVC Plastic",
  "front_fields": [{ "id": "f1", "type": "name", "x": 10, "y": 20 }],
  "back_fields": []
}
```

**Response `201`:** Full `DesignResponse` with `id` and timestamps.

---

#### `GET /designs/` ✅
Query params: `page=1`, `per_page=20`  
**Response `200`:** Array of `DesignResponse`.

---

#### `GET /designs/{design_id}` ✅
**Response `200`:** Single `DesignResponse`.

---

#### `PUT /designs/{design_id}` ✅
**Request body:** Partial update — any `DesignCreate` fields.  
**Response `200`:** Updated `DesignResponse`.

---

#### `DELETE /designs/{design_id}` ✅
**Response `204`:** No content.

---

### 9.3 Template Endpoints

#### `GET /templates/`
Query params: `category` (optional filter)  
**Response `200`:** Array of active `TemplateResponse`.

---

#### `GET /templates/{template_id}`
**Response `200`:** Single `TemplateResponse`.

---

### 9.4 Order Endpoints

#### `POST /orders/` ✅

**Request body:**
```json
{
  "items": [
    {
      "card_type": "Company",
      "printer": "Thermal",
      "print_side": "Single Side",
      "orientation": "Horizontal",
      "chip_type": "RFID",
      "finish": "Glossy",
      "material": "PVC Plastic",
      "quantity": 100,
      "design_id": "a1b2c3d4-...",
      "front_field_count": 6,
      "back_field_count": 3
    }
  ],
  "shipping": {
    "first_name": "Rahul",
    "last_name": "Sharma",
    "email": "rahul@example.com",
    "phone": "9876543210",
    "address1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zip": "400001",
    "country": "India"
  },
  "shipping_method": "express",
  "payment_method": "cod"
}
```

**Response `201`:**
```json
{
  "id": "...",
  "order_number": "ORD-A3F9KL",
  "status": "confirmed",
  "subtotal": 430.00,
  "shipping_cost": 9.99,
  "tax": 21.50,
  "grand_total": 461.49,
  "total_cards": 100,
  "items": [ { "..." : "..." } ],
  "created_at": "2025-01-15T12:00:00Z"
}
```

---

#### `GET /orders/` ✅
**Response `200`:** Paginated array of `OrderResponse`.

---

#### `GET /orders/{order_id}` ✅
**Response `200`:** Single `OrderResponse` (owner-only access).

---

### 9.5 Upload Endpoint

#### `POST /uploads/image` ✅
**Request:** `multipart/form-data`, field name `file` (JPEG / PNG / WebP, max 5 MB)  
**Response `200`:**
```json
{ "url": "/uploads/8f3a2b1c-uuid.jpg" }
```

---

### 9.6 Pricing Endpoints

#### `POST /pricing/calculate`

**Request body:**
```json
{
  "printer": "Thermal",
  "finish": "Glossy",
  "chip_type": "RFID",
  "print_side": "Both Sides",
  "quantity": 100
}
```

**Response `200`:**
```json
{
  "unit_price": 4.80,
  "total_price": 422.40,
  "discount_label": "12% OFF",
  "quantity": 100
}
```

---

#### `GET /pricing/config`
**Response `200`:** `{ "base_thermal": 2.50, "addon_rfid": 1.50, ... }`

---

#### `GET /pricing/card-options`
**Response `200`:** `{ "chip_type": [...], "finish": [...], "material": [...] }`

---

### 9.7 Error Responses

| HTTP Code | Meaning |
|-----------|---------|
| `400` | Validation error — check `detail` field |
| `401` | Missing or expired token |
| `403` | Forbidden (admin required) |
| `404` | Resource not found |
| `422` | Pydantic validation failed — `detail` is an array of field errors |
| `429` | Rate limit exceeded — back off and retry |
| `500` | Internal server error |

---

## 10. Payment Flow

### Current State — Cash on Delivery (COD)
```
Frontend → POST /api/orders/  { payment_method: "cod" }
Backend  → creates order with status = "pending"
         → sends confirmation email
Frontend → shows order confirmation screen
```

### Razorpay Integration (`feature/razorpay` branch)

When API keys are configured and the branch is merged, the full online payment flow becomes:

```
1. User selects Card / UPI / Net Banking at checkout

2. Frontend  → POST /api/payments/initiate  { amount: grandTotal }
   Backend   → calls Razorpay SDK to create an order
   Backend   → returns { razorpay_order_id, amount_paise, key_id }

3. Frontend opens window.Razorpay popup (Razorpay Checkout.js)
   User completes payment inside the Razorpay UI

4. On success, Razorpay calls the handler with:
   { razorpay_payment_id, razorpay_order_id, razorpay_signature }

5. Frontend  → POST /api/orders/  {
       ...orderPayload,
       razorpay_payment_id,
       razorpay_order_id,
       razorpay_signature
   }

6. Backend HMAC-SHA256 verification:
   message  = f"{razorpay_order_id}|{razorpay_payment_id}"
   expected = HMAC(RAZORPAY_KEY_SECRET, message, SHA256).hexdigest()
   if expected ≠ razorpay_signature → HTTP 400 "Payment verification failed"

7. Verified → create order (status = "confirmed", payment_ref = payment_id)
   Confirmation email dispatched
```

> **Security note:** The HMAC signature check ensures payment data was not tampered with in transit. The secret key never reaches the browser — only the public `key_id` is sent to the frontend.

### Activating Razorpay

1. Register at [razorpay.com](https://razorpay.com)
2. Dashboard → Settings → API Keys → Generate Test Keys
3. Add to `backend/.env.production`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
   ```
4. Merge `feature/razorpay` into `master`
5. Rebuild and redeploy backend + frontend

---

## 11. File Storage

Uploaded images (card backgrounds, photo fields, template images) are stored on the server's local filesystem inside a Docker named volume.

### Upload Flow

```
Browser selects image file
    │
    ▼
POST /api/uploads/image  (multipart/form-data)
    │
    ▼
image_service.save_image()
  ├── Validates MIME type  (JPEG, PNG, WebP only)
  ├── Validates file size  (max 5 MB)
  ├── Generates UUID filename
  └── Writes to settings.UPLOAD_DIR  (/app/uploads/ in container)
    │
    ▼
Returns  "/uploads/{uuid}.{ext}"
    │
    ▼
Nginx serves /uploads/ directly from Docker volume
(no Python involved in serving — direct disk read, fast)
```

### Docker Volume Architecture

```yaml
volumes:
  uploads_data:

services:
  backend:
    volumes:
      - uploads_data:/app/uploads          # backend writes here

  frontend:  # Nginx container
    volumes:
      - uploads_data:/var/www/uploads:ro   # Nginx reads here (read-only)
```

### Nginx Static Serving

```nginx
location /uploads/ {
    alias /var/www/uploads/;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header X-Content-Type-Options nosniff;
}
```

> **Scaling note:** For multi-server or cloud deployments, replace `image_service.save_image()` with an S3/R2 upload. That single function is the only change required.

---

## 12. Export System

The export feature runs entirely in the browser — no server involvement.

### PNG Export

```typescript
import html2canvas from "html2canvas";

const canvas = await html2canvas(cardDomElement, {
  scale: 3,           // 3× resolution for print quality
  useCORS: true,      // allow cross-origin background images
  backgroundColor: null,
});

const link = document.createElement("a");
link.download = "id-card-front.png";
link.href = canvas.toDataURL("image/png");
link.click();
```

### PDF Export

```typescript
import jsPDF from "jspdf";

const pdf = new jsPDF({
  orientation: "landscape",
  unit: "mm",
  format: [85.6, 54],   // ISO CR80 card size
});

const imgData = canvas.toDataURL("image/png");
pdf.addImage(imgData, "PNG", 0, 0, 85.6, 54);

// Double-sided: add a second page for the back
pdf.addPage();
// ... capture back canvas → pdf.addImage(...)

pdf.save("id-card.pdf");
```

### Card Dimensions

| Orientation | Canvas (px) | Physical (ISO CR80) |
|-------------|------------|---------------------|
| Horizontal | 380 × 240 | 85.6 × 54 mm |
| Vertical | 240 × 380 | 54 × 85.6 mm |

---

## 13. Deployment

### Architecture on Server

```
VPS (Linux)
├── Docker Engine
└── docker compose up -d
    ├── db        (postgres:16-alpine)  — internal port 5432
    ├── migrate   (backend image)       — runs alembic upgrade head, exits 0
    ├── backend   (python:3.12-slim)    — internal port 8000, Gunicorn 4 workers
    └── frontend  (nginx:alpine)        — host port 80, React SPA + /api/ proxy
```

### Service Startup Order

```
db (healthy) → migrate (exits 0) → backend (running) → frontend (running)
```

### `docker-compose.yml` Summary

```yaml
services:
  db:
    image: postgres:16-alpine
    env_file: backend/.env.production
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER"]
      interval: 5s
      retries: 10

  migrate:
    build: ./backend
    command: alembic upgrade head
    env_file: backend/.env.production
    depends_on:
      db: { condition: service_healthy }

  backend:
    build: ./backend
    command: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
    env_file: backend/.env.production
    volumes: [uploads_data:/app/uploads]
    depends_on:
      migrate: { condition: service_completed_successfully }

  frontend:
    build: ./frontend
    ports: ["80:80"]
    volumes:
      - uploads_data:/var/www/uploads:ro
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on: [backend]

volumes:
  postgres_data:
  uploads_data:
```

### Deploy Commands

```bash
# One-time: install Docker
curl -fsSL https://get.docker.com | sh

# Clone project
git clone https://github.com/your-org/id-card-designer.git
cd id-card-designer

# Configure secrets
nano backend/.env.production

# Build and start all services
docker compose build --no-cache
docker compose up -d

# Verify everything is healthy
docker compose ps
curl http://localhost/api/health    # → {"status":"ok"}
```

### Update Deployment

```bash
git pull
docker compose build
docker compose up -d --force-recreate
```

---

## 14. Security

### 14.1 Authentication
- Passwords hashed with **bcrypt** (adaptive cost factor — never stored in plain text)
- Password policy enforced on both client and server: min 8 chars, uppercase, lowercase, digit
- JWT access tokens expire in **60 minutes**; refresh tokens in **30 days**
- Token `type` field (`"access"` vs `"refresh"`) prevents refresh tokens being used as access tokens
- Tokens stored in `localStorage` — appropriate for SPAs; upgrade to `httpOnly` cookies for higher-security requirements

### 14.2 Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `POST /auth/register` | 3 / minute / IP |
| `POST /auth/login` | 5 / minute / IP |
| `POST /payments/initiate` | 10 / minute / IP |

Rate limiter reads the `X-Real-IP` header (set by Nginx) so Docker container IPs are not used as the key. Exceeded requests receive `HTTP 429`.

### 14.3 Input Validation
- All request bodies validated by **Pydantic v2** schemas — invalid data is rejected before reaching business logic
- File uploads: MIME type checked, file extension checked, size capped at 5 MB
- SVG backgrounds sanitised via **DOMPurify** before `dangerouslySetInnerHTML` — prevents stored XSS from malicious SVG payloads

### 14.4 Security Headers (Nginx)

```nginx
add_header Content-Security-Policy
  "default-src 'self';
   script-src 'self';
   style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
   font-src 'self' https://fonts.gstatic.com;
   img-src 'self' data: blob:;
   connect-src 'self';
   frame-ancestors 'self';" always;

add_header Permissions-Policy  "camera=(), microphone=(), geolocation=()" always;
add_header X-Content-Type-Options "nosniff" always;
```

### 14.5 Payment Security
- HMAC-SHA256 signature verification on every Razorpay callback — tampered payment data is rejected immediately
- `RAZORPAY_KEY_SECRET` lives only on the backend; the browser receives only the public `key_id`
- `hmac.compare_digest()` used for constant-time comparison (prevents timing attacks)

### 14.6 Database & Infrastructure
- PostgreSQL is **not exposed on any host port** — accessible only within the Docker internal network
- `backend/.env.production` is excluded from version control (`.gitignore`)
- CORS `allow_origins` is an exact-match allowlist — no wildcards
- Admin API endpoints protected by `get_current_admin()` dependency — non-admin users receive `HTTP 403`

---

## 15. Scalability

### Current Single-Server Architecture
The Docker Compose setup handles typical early-stage SaaS traffic on a single VPS without modification.

### Horizontal Scaling Path

| Component | Scaling Strategy |
|-----------|-----------------|
| **Frontend (Nginx + SPA)** | Stateless — deploy multiple replicas behind a load balancer |
| **Backend (FastAPI)** | Stateless — increase `gunicorn -w` worker count, or run multiple containers behind a load balancer |
| **Database (PostgreSQL)** | Add read replicas for read-heavy workloads; PgBouncer for connection pooling |
| **File Storage** | Replace `image_service.save_image()` with S3/R2 upload — single function change, removes shared volume dependency |
| **Email** | Swap Gmail SMTP for AWS SES or SendGrid at volume — `email_service.py` is the only change point |
| **Rate Limiting** | Switch slowapi from in-memory to Redis backend (`limits[redis]`) for multi-instance consistency |

### Performance Notes
- All database operations are **async** (SQLAlchemy 2.0 + asyncpg) — no threads blocked on I/O
- Gunicorn spawns 4 async Uvicorn workers; each handles many concurrent requests cooperatively
- Pricing calculation is in-memory (falls back to hardcoded defaults if DB is unreachable)
- Static assets (React bundle + uploaded images) are served directly by Nginx — zero Python overhead on static delivery

---

## 16. Folder Structure

```
id-card-designer/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── store.ts              # Redux store
│   │   │   └── hooks.ts              # Typed Redux hooks
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   └── authSlice.ts
│   │   │   ├── cart/
│   │   │   │   └── cartSlice.ts
│   │   │   ├── config/
│   │   │   │   └── configSlice.ts
│   │   │   ├── admin/
│   │   │   │   └── adminSlice.ts
│   │   │   └── designer/
│   │   │       ├── designerSlice.ts
│   │   │       ├── constants.ts
│   │   │       └── components/
│   │   │           ├── CardCanvas.tsx
│   │   │           ├── DraggableField.tsx
│   │   │           ├── FontPicker.tsx
│   │   │           └── PhotoUpload.tsx
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   │   ├── HomePage.tsx
│   │   │   │   └── HeroSection.tsx
│   │   │   ├── Designer/
│   │   │   │   ├── DesignerPage.tsx
│   │   │   │   ├── Templategallery.tsx
│   │   │   │   └── templateData.ts
│   │   │   ├── Templates/
│   │   │   │   └── TemplatesPage.tsx
│   │   │   ├── Admin/
│   │   │   │   ├── AdminLayout.tsx
│   │   │   │   ├── AdminOverview.tsx
│   │   │   │   ├── AdminOrders.tsx
│   │   │   │   ├── AdminPricing.tsx
│   │   │   │   ├── AdminCardOptions.tsx
│   │   │   │   └── AdminTemplates.tsx
│   │   │   └── Checkout.tsx
│   │   ├── routes/
│   │   │   ├── AppRoutes.tsx
│   │   │   └── AdminGuard.tsx
│   │   └── shared/
│   │       ├── components/
│   │       │   ├── AuthModal.tsx
│   │       │   ├── FormControls.tsx
│   │       │   └── ErrorBoundary.tsx
│   │       ├── types/
│   │       │   ├── card.types.ts
│   │       │   └── order.types.ts
│   │       └── utils/
│   │           ├── api.ts
│   │           ├── apiBase.ts
│   │           ├── pricing.ts
│   │           ├── fonts.ts
│   │           ├── storage.ts
│   │           └── uid.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── package.json
│   └── Dockerfile
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── design.py
│   │   │   ├── order.py
│   │   │   ├── template.py
│   │   │   ├── pricing_config.py
│   │   │   └── card_option.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── designs.py
│   │   │   ├── templates.py
│   │   │   ├── orders.py
│   │   │   ├── uploads.py
│   │   │   ├── pricing.py
│   │   │   └── admin.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── design.py
│   │   │   ├── order.py
│   │   │   ├── template.py
│   │   │   └── pricing.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── order_service.py
│   │   │   ├── pricing_service.py
│   │   │   ├── image_service.py
│   │   │   └── email_service.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── limiter.py
│   │   └── main.py
│   ├── alembic/
│   │   └── versions/
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── nginx/
│   └── nginx.conf
│
├── docker-compose.yml
├── .gitignore
└── docs/
    └── PROJECT_DOCUMENTATION.md   ← this file
```

---

## 17. Setup Instructions

### Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | 20 |
| npm | 10 |
| Python | 3.12 |
| Docker | 24 |
| Docker Compose | 2.20 |

---

### Option A — Local Development (no Docker)

#### 1. Clone the repository
```bash
git clone https://github.com/your-org/id-card-designer.git
cd id-card-designer
```

#### 2. Backend setup
```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create the local environment file (SQLite works out of the box)
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start the development server (auto-reloads on file change)
uvicorn app.main:app --reload --port 8000
```

Backend running at: `http://localhost:8000`  
Swagger docs at: `http://localhost:8000/docs`

#### 3. Frontend setup
```bash
cd ../frontend

# Install Node dependencies
npm install

# Start the Vite dev server
npm run dev
```

Frontend running at: `http://localhost:5173`

---

### Option B — Docker Compose (production)

#### 1. Clone and configure

```bash
git clone https://github.com/your-org/id-card-designer.git
cd id-card-designer

cp backend/.env.example backend/.env.production
nano backend/.env.production
```

#### 2. Complete environment variables

```env
# ── Database ──────────────────────────────────────────────────────
POSTGRES_USER=idcard
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=idcard_db
DATABASE_URL=postgresql+asyncpg://idcard:your_secure_password_here@db:5432/idcard_db

# ── JWT ───────────────────────────────────────────────────────────
# Generate: python3 -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=replace_with_64_char_random_hex_string
JWT_ACCESS_EXPIRE_MINUTES=60
JWT_REFRESH_EXPIRE_DAYS=30

# ── File Uploads ──────────────────────────────────────────────────
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=5242880

# ── CORS — your actual domain, no trailing slash ──────────────────
CORS_ORIGINS=["https://yourdomain.com"]

# ── Email (Gmail App Password) ────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME=ID Card Designer
SMTP_FROM_EMAIL=your@gmail.com
```

#### 3. Build and start

```bash
docker compose build --no-cache
docker compose up -d
```

#### 4. Verify

```bash
docker compose ps
# Expected: db=healthy, migrate=exited(0), backend=running, frontend=running

curl http://localhost/api/health
# Expected: {"status":"ok"}
```

#### 5. Access
- **Web app**: `http://localhost` (or your server IP / domain)
- **API docs**: `http://localhost/api/docs`

---

### Gmail App Password (for order confirmation emails)

1. Sign in to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification → enable if not already on
3. Security → App passwords → App name: **ID Card Designer** → **Create**
4. Copy the 16-character password → paste as `SMTP_PASSWORD` in `.env.production`
5. Set `SMTP_USER` and `SMTP_FROM_EMAIL` to your Gmail address

---

### Creating the first admin user

```bash
# Open a Python shell inside the running backend container
docker compose exec backend python

>>> from app.database import AsyncSessionLocal
>>> from app.models.user import User
>>> import asyncio

>>> async def make_admin(user_id: str):
...     async with AsyncSessionLocal() as db:
...         user = await db.get(User, user_id)
...         user.is_admin = True
...         await db.commit()
...         print(f"Done — {user.email} is now admin")

>>> asyncio.run(make_admin("paste-the-user-uuid-here"))
```

You can find the user's UUID in the response from `GET /api/auth/me` after logging in.

---

## 18. Future Enhancements

### Near-term (v1.x)

| Enhancement | Description |
|-------------|-------------|
| **Bulk CSV upload** | Upload a CSV of names/departments to auto-generate hundreds of personalised cards |
| **QR code fields** | Dynamic QR field that encodes any text or URL at design time |
| **Promo code engine** | Backend-driven discount codes redeemable at checkout |
| **Design duplication** | Clone an existing design with one click |
| **Print-ready proof PDF** | Download a preflight-checked PDF before placing the order |

### Medium-term (v2.x)

| Enhancement | Description |
|-------------|-------------|
| **Team accounts** | Shared workspace where multiple users share templates and designs under one company |
| **White-label mode** | Custom domain, logo, and colour scheme for print-shop resellers |
| **Object storage migration** | Replace Docker volume with AWS S3 / Cloudflare R2 for cloud-scalable uploads |
| **Order tracking page** | Real-time status page showing courier tracking number |
| **Webhook notifications** | Trigger Slack / WhatsApp / email alerts on order status changes |
| **Razorpay subscription** | Monthly card printing plans with auto-renewal |

### Long-term (v3.x)

| Enhancement | Description |
|-------------|-------------|
| **AI layout generator** | Describe a card style → AI generates the field layout and colour scheme |
| **Advanced canvas editor** | Full Fabric.js interactive canvas for layers, grouping, and rotation |
| **Mobile app** | React Native app for designing and re-ordering on the go |
| **HR integrations API** | Public REST API so tools like BambooHR or Zoho People can trigger card orders programmatically |
| **Redis caching** | Cache pricing config and templates in Redis to reduce DB load at scale |
| **Analytics dashboard** | Revenue charts, conversion funnels, top-performing templates |
