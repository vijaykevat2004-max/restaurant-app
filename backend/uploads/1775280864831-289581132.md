# ServeFlow - Multi-Tenant Restaurant Operating System

A production-ready SaaS platform for restaurant management featuring POS, KDS, payments, wallet, and payout systems with full multi-tenant isolation.

## Features

- **Multi-Tenant Architecture**: Complete data isolation between restaurants
- **Role-Based Access Control**: Owner, Manager, and Staff roles with different permissions
- **Multi-Branch Support**: Manage multiple locations from one dashboard
- **Point of Sale (POS)**: Fast, tablet-optimized order management
- **Kitchen Display System (KDS)**: Real-time order tracking for kitchen staff
- **Wallet System**: Per-restaurant wallet with ledger-based accounting
- **Payout System**: Independent withdrawal functionality per tenant
- **Real-Time Updates**: Socket.io powered instant sync across all devices

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- PostgreSQL (for production) or use SQLite (for development)

### Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. Start development servers:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173

### Demo Accounts

| Role   | Email             | Password    |
|--------|-------------------|-------------|
| Owner  | owner@demo.com    | password123 |
| Manager| manager@demo.com  | password123 |
| Staff  | staff@demo.com    | password123 |

## Project Structure

```
serveflow/
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── config/   # Database, Socket.io config
│   │   ├── middleware/# Auth, RBAC, tenant isolation
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   └── types/    # TypeScript types
│   └── prisma/       # Database schema
├── frontend/         # React + Vite
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── stores/   # Zustand state management
│       └── api/      # API client
├── docker-compose.yml
└── SPEC.md           # Full design specification
```

## API Documentation

### Authentication
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/register` - Register new user
- `GET /api/v1/auth/me` - Get current user

### Orders
- `GET /api/v1/orders` - List orders (filtered by restaurant/branch)
- `POST /api/v1/orders` - Create order
- `PATCH /api/v1/orders/:id/status` - Update order status

### Wallet
- `GET /api/v1/wallet/balance` - Get wallet balance
- `GET /api/v1/wallet/transactions` - List transactions

### Payouts
- `GET /api/v1/payouts` - List payouts
- `POST /api/v1/payouts` - Initiate payout

### Menu
- `GET /api/v1/menu` - Get full menu
- `POST /api/v1/menu/items` - Create menu item

## Environment Variables

### Backend (.env)
```
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=8h
PORT=3001
FRONTEND_URL=http://localhost:5173
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
```

## Production Deployment

### Docker

```bash
# Build and run
docker-compose up -d

# Set environment variables
JWT_SECRET=your-production-secret
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret
```

### Manual Deployment

1. Build both applications
2. Set up PostgreSQL database
3. Configure environment variables
4. Run migrations: `prisma migrate deploy`
5. Start backend: `npm start`
6. Serve frontend with Nginx

## Security Features

- JWT authentication with 8-hour expiry
- Password hashing with bcrypt (cost factor 12)
- Role-based access control
- Tenant isolation middleware
- Rate limiting on auth endpoints
- CORS configuration
- Helmet.js security headers
- Input validation with Zod

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- Socket.io
- JWT + bcrypt
- Zod validation
- Razorpay integration

### Frontend
- React 18
- Vite
- TypeScript
- TailwindCSS
- Zustand (state management)
- Socket.io-client
- React Router
- Lucide Icons

## License

MIT
