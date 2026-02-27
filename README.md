# BurgerHouse — Full-Stack Restaurant Ordering System

A full-stack restaurant ordering system with a customer-facing menu, cart, Stripe checkout, real-time order tracking via Socket.IO, and a staff dashboard for managing orders and the menu.

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
| Deployment | Vercel (frontend) + Railway (backend + database) |

---

## Features

### Customer
- Browse menu by category with live search
- Customize items — radio (size) and checkbox (add-ons) option groups
- Cart with localStorage persistence (survives page refresh)
- Pickup or delivery checkout with Stripe
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
├── package.json          ← root scripts (used by Railway)
├── client/               ← React app → deploys to Vercel
│   ├── src/
│   │   ├── hooks/        ← useAuth, useCart, useSocket
│   │   ├── pages/        ← Home, Cart, Checkout, OrderTracking, staff/
│   │   ├── components/   ← layout, menu, cart, order, checkout, common
│   │   └── utils/        ← api.js (Axios), formatCurrency.js
│   └── .env
└── server/               ← Express API → deploys to Railway
    ├── prisma/
    │   ├── schema.prisma ← database models
    │   └── seed.js       ← sample menu data + staff accounts
    ├── src/
    │   ├── controllers/  ← auth, menu, order, payment, upload
    │   ├── routes/       ← one file per resource
    │   ├── middleware/   ← auth.js, errorHandler.js, validate.js
    │   └── socket/       ← socketHandler.js (rooms + events)
    └── .env
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

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Configure environment variables

**`server/.env`**
```env
DATABASE_URL="postgresql://..."         # from Railway Postgres service
JWT_SECRET="your-32-char-random-string"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."       # from stripe listen CLI
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
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Open `http://localhost:5173`

### 5. Test Stripe webhooks locally

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Forward webhooks to your local server
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Copy the printed `whsec_...` secret into `server/.env` as `STRIPE_WEBHOOK_SECRET`.

---

## Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@restaurant.com | admin123 |
| Staff | staff@restaurant.com | staff123 |

Register any new account to get a CUSTOMER role.

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
| POST | `/api/orders` | CUSTOMER | Place order |
| GET | `/api/orders` | Any | Own orders (CUSTOMER) or all (STAFF/ADMIN) |
| GET | `/api/orders/active` | STAFF/ADMIN | Active orders for dashboard |
| GET | `/api/orders/:id` | Any | Single order detail |
| PATCH | `/api/orders/:id/status` | STAFF/ADMIN | Advance order status |
| PATCH | `/api/orders/:id/cancel` | CUSTOMER | Cancel pending order |

### Payments
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/create-intent` | CUSTOMER | Create Stripe PaymentIntent |
| POST | `/api/payments/webhook` | Stripe | Handle payment confirmation |

### Upload
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/upload/sign` | ADMIN | Get signed Cloudinary upload params |

---

## Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `join:order` | Client → Server | Customer subscribes to their order's updates |
| `join:staff` | Client → Server | Staff subscribes to all new orders |
| `order:new` | Server → Staff | Emitted when a new order is placed |
| `order:status_update` | Server → All | Emitted when order status changes |

---

## Deployment

### Backend → Railway

```bash
# Set env vars on Railway (repeat for each variable)
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set JWT_SECRET=...
railway variables set CLIENT_URL=https://your-app.vercel.app
# ... all other server/.env variables

# Deploy
git push  # Railway auto-deploys from your connected GitHub repo
```

### Frontend → Vercel

```bash
cd client
npx vercel --prod
# Set VITE_API_URL and VITE_STRIPE_PUBLISHABLE_KEY in Vercel dashboard
```

### Stripe Webhook (production)

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-railway-url.up.railway.app/api/payments/webhook`
3. Event: `payment_intent.succeeded`
4. Copy the signing secret → add to Railway as `STRIPE_WEBHOOK_SECRET`

---

## Order Status Flow

```
PENDING → CONFIRMED → PREPARING → READY → DELIVERED
                                         ↘
Any status except DELIVERED/CANCELLED → CANCELLED
```

---

## Database Schema

Nine models: `User`, `Category`, `MenuItem`, `MenuItemOptionGroup`, `OptionChoice`, `Order`, `OrderItem`, `OrderItemChoice`

Key design decisions:
- `unitPrice` on `OrderItem` is a **price snapshot** — menu price changes don't affect historical orders
- `OrderItemChoice` is a join table recording exactly which customizations were chosen per line item
- `stripePaymentId` on `Order` links to Stripe for refund traceability
- Orders are created in the **Stripe webhook**, not the client callback — webhooks are retried automatically, client connections are not
