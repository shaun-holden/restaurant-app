# BurgerHouse — Full-Stack Restaurant Ordering System

A full-stack restaurant ordering system with a customer-facing menu, cart, Stripe checkout, real-time order tracking, and a staff dashboard for managing live orders and the menu.

**Live demo:** https://backend-production-71c4.up.railway.app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma ORM |
| Real-Time | Socket.IO |
| Payments | Stripe (PaymentIntent flow) |
| Image Upload | Cloudinary (signed direct uploads) |
| Auth | JWT (stored in localStorage) |
| Deployment | Railway (single service — Express serves the React build) |

---

## Features

### Customer
- Browse menu by category with live search
- Customize items — radio (size) and checkbox (add-ons) option groups
- Cart with localStorage persistence (survives page refresh)
- Pickup or delivery checkout with Stripe test cards
- Real-time order status tracking via WebSocket

### Staff / Admin
- Live incoming orders dashboard (Socket.IO — no refresh needed)
- Advance orders through: PENDING → CONFIRMED → PREPARING → READY → DELIVERED
- Menu management — create, edit, delete items and categories
- Image upload via Cloudinary
- Toggle item availability on/off instantly

---

## Project Structure

```
RestaurantApp/
├── package.json          ← root build/start scripts (used by Railway)
├── client/               ← React app (built into client/dist by Railway)
│   ├── src/
│   │   ├── hooks/        ← useAuth, useCart, useSocket (React Context)
│   │   ├── pages/        ← Home, Cart, Checkout, OrderTracking, staff/
│   │   ├── components/   ← layout, menu, cart, order, common
│   │   └── utils/        ← api.js (Axios instance), formatCurrency.js
│   └── .env              ← VITE_API_URL, VITE_STRIPE_PUBLISHABLE_KEY
└── server/               ← Express API
    ├── prisma/
    │   ├── schema.prisma ← 9 database models
    │   └── seed.js       ← sample menu + staff accounts
    ├── src/
    │   ├── controllers/  ← auth, menu, order, payment, upload
    │   ├── routes/       ← one file per resource
    │   ├── middleware/   ← auth.js, errorHandler.js, validate.js
    │   └── socket/       ← socketHandler.js (join:order, join:staff rooms)
    └── .env              ← all server secrets
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- A Railway account (for hosted PostgreSQL — no local Postgres needed)
- A Stripe account (free, test mode)
- A Cloudinary account (free tier)

### 1. Clone and install

```bash
git clone https://github.com/shaun-holden/restaurant-app.git
cd restaurant-app

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

**`server/.env`**
```env
DATABASE_URL="postgresql://..."         # from Railway Postgres → public URL
JWT_SECRET="your-32-char-random-string"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."       # from: stripe listen CLI (see step 5)
CLOUDINARY_CLOUD_NAME="your-name"
CLOUDINARY_API_KEY="your-key"
CLOUDINARY_API_SECRET="your-secret"
NODE_ENV="development"
PORT=5000
```

**`client/.env`**
```env
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Set up the database

```bash
cd server
npx prisma migrate dev --name init   # creates all tables
node prisma/seed.js                   # loads sample menu + staff accounts
```

### 4. Run locally

Open two terminals:

```bash
# Terminal 1 — backend (auto-restarts on file changes)
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Open http://localhost:5173

### 5. Test Stripe webhooks locally

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Forward webhooks to your local server
stripe listen \
  --api-key sk_test_YOUR_KEY \
  --forward-to localhost:5000/api/payments/webhook
```

Copy the printed `whsec_...` secret into `server/.env` as `STRIPE_WEBHOOK_SECRET`.

---

## Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@restaurant.com | admin123 |
| Staff | staff@restaurant.com | staff123 |

Register any new account to get the CUSTOMER role.

## Test Payment

Use Stripe's test card:
- **Card:** `4242 4242 4242 4242`
- **Expiry:** any future date
- **CVC:** any 3 digits

---

## API Routes

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create customer account |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | Any | Current user profile |

### Menu
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/menu/categories` | — | All categories |
| GET | `/api/menu/items` | — | All items (`?categoryId=`, `?search=`) |
| GET | `/api/menu/items/:id` | — | Single item with option groups |
| POST | `/api/menu/items` | ADMIN | Create item |
| PATCH | `/api/menu/items/:id` | ADMIN | Update item |
| DELETE | `/api/menu/items/:id` | ADMIN | Delete item |

### Orders
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/orders` | Any | Own orders (CUSTOMER) or all (STAFF/ADMIN) |
| GET | `/api/orders/active` | STAFF/ADMIN | Non-delivered orders for dashboard |
| GET | `/api/orders/:id` | Any | Single order detail |
| PATCH | `/api/orders/:id/status` | STAFF/ADMIN | Advance order status |
| PATCH | `/api/orders/:id/cancel` | CUSTOMER | Cancel a pending order |

### Payments
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/create-intent` | CUSTOMER | Create Stripe PaymentIntent |
| POST | `/api/payments/webhook` | Stripe | Handle `payment_intent.succeeded` |

### Upload
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/upload/sign` | ADMIN | Get signed Cloudinary upload params |

---

## Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `join:order` | Client → Server | Customer subscribes to their order's real-time updates |
| `join:staff` | Client → Server | Staff joins the room for all new orders |
| `order:new` | Server → Staff | Fired when a new order is placed |
| `order:status_update` | Server → All | Fired when order status changes |

---

## Deployment (Railway)

Everything runs as a single Railway service. In production, Express serves the built React app as static files — no separate frontend host needed.

### How it works

```
Railway build:  npm run build
  → cd client && npm run build    (creates client/dist/)
  → cd server && npx prisma generate

Railway start:  npm start
  → npx prisma migrate deploy     (runs any pending migrations)
  → node src/server.js            (Express serves API + client/dist)
```

### Deploy a new version

```bash
git add .
git commit -m "your message"
git push
railway up --service backend --detach
```

### Required Railway environment variables

```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}   ← auto-links to Postgres service
JWT_SECRET=...
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Stripe webhook (production)

1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**
2. URL: `https://backend-production-71c4.up.railway.app/api/payments/webhook`
3. Event: `payment_intent.succeeded`
4. Copy the signing secret → update Railway variable:

```bash
railway variable --service backend --set "STRIPE_WEBHOOK_SECRET=whsec_..."
```

---

## Order Status Flow

```
PENDING → CONFIRMED → PREPARING → READY → DELIVERED
   ↓           ↓           ↓        ↓
                      CANCELLED (from any non-final status)
```

---

## Database Schema

Nine models: `User`, `Category`, `MenuItem`, `MenuItemOptionGroup`, `OptionChoice`, `Order`, `OrderItem`, `OrderItemChoice`

Key design decisions:
- `unitPrice` on `OrderItem` is a **price snapshot** — menu price changes don't affect historical orders
- `OrderItemChoice` records exactly which customizations were chosen per line item
- `stripePaymentId` on `Order` links to Stripe for refund traceability
- Orders are created in the **Stripe webhook handler**, not the client callback — webhooks are retried automatically if the client disconnects mid-payment
