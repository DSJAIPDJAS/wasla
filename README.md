# wasla (وصلة)

E-Commerce Platform (React.js Training Project)

## Stack
React (Vite) · Bootstrap · Redux Toolkit · React Router v6 · JSON Server

## Prerequisites
Node.js 18+

## Installation
```bash
npm install
```

## Run

Start each command in its own terminal.

```bash
# 1. JSON Server (API) -> http://localhost:3001
npm run server

# 2. React app -> http://localhost:5173
npm run dev
```

## Optional: Google Sign-In
The "Continue with Google" button on Login/Register works out of the box as a clearly-labelled
placeholder. To make it functional, copy `.env.example` to `.env`, add a Google OAuth Client ID
(see the comments in that file for how to get one), and restart `npm run dev`.

## API Endpoints
Base URL: `http://localhost:3001`

| Endpoint | Description |
|---|---|
| `/products` | Product catalog (`sellerId` links a product to its seller, `null` for admin-owned) |
| `/categories` | Product categories (managed from Admin > Categories) |
| `/users` | Admins, customers, sellers (`status`, `sellerStatus` control access) |
| `/orders` | Customer and guest orders |
| `/reviews` | Product reviews |
| `/wishlist` | Saved items |
| `/coupons` | Discount codes |
| `/banners` | Homepage collection banners (managed from Admin > Content) |

## Demo Accounts

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | admin@wasla.local | admin123 | Full admin panel at `/admin` |
| Customer | customer@wasla.local | customer123 | |
| Seller | seller@wasla.local | seller123 | Already approved — Seller Center at `/seller` |

> Demo credentials are for development only.

## Payments
Cash on delivery, credit card, and wallet are all selectable at checkout. Card/wallet are
**simulated** — there's no real payment gateway behind them (see comments in `CardForm.jsx` /
`WalletForm.jsx` / `Checkout.jsx`). No card or wallet details are ever sent to the server or
stored anywhere; they only exist in the form's local state long enough to validate their shape.

## Guest checkout
`/checkout` doesn't require login. Guest orders are saved with `userId: null` and aren't visible
under any account's Order History — that's expected, same as most real stores.

## Becoming a seller
Two ways in: check "I want to sell on wasla" while registering, or an existing customer can apply
from Profile > "Sell on wasla". Either way the account becomes `role: "seller"` with
`sellerStatus: "pending"` until an admin approves it from Admin > Users. Until approved, `/seller`
shows a pending-approval screen instead of the dashboard.
