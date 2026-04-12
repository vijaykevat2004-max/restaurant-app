# ServeFlow Pro - Advanced Restaurant Operating System

## 1. Concept & Vision

ServeFlow Pro is a next-generation multi-tenant restaurant SaaS platform featuring a futuristic 3D-inspired interface with glassmorphism effects, neon accents, and smooth animations. The system combines powerful restaurant management with seamless UPI/QR payment integration, allowing customers to order directly from digital menus and pay instantly.

**Design Philosophy**: Cyberpunk meets enterprise software - dark futuristic backgrounds with glowing neon accents, glass-morphic cards, floating 3D elements, and buttery smooth animations that make every interaction feel premium.

## 2. Design Language

### Color Palette (Futuristic)
- **Background Primary**: `#0a0a0f` (deep space)
- **Background Secondary**: `rgba(20, 20, 31, 0.8)` (glass)
- **Background Tertiary**: `rgba(30, 30, 46, 0.6)` (glass dark)
- **Border**: `rgba(139, 92, 246, 0.3)` (violet glow)
- **Text Primary**: `#ffffff`
- **Text Secondary**: `#a1a1aa`
- **Accent Primary**: `#8b5cf6` (electric violet)
- **Accent Secondary**: `#06b6d4` (cyan)
- **Accent Pink**: `#f43f5e` (neon pink)
- **Accent Success**: `#10b981` (matrix green)
- **Accent Warning**: `#f59e0b` (amber)
- **Accent Danger**: `#ef4444` (red)

### Neon Effects
```css
.glow-primary { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5); }
.glow-cyan { box-shadow: 0 0 20px rgba(6, 182, 212, 0.5); }
.glass-card { 
  background: rgba(20, 20, 31, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.2);
}
```

### Typography
- **Headings**: Inter (700) with tracking-wider
- **Body**: Inter (400, 500)
- **Mono**: JetBrains Mono for prices

### Animations
- Page transitions: Fade + slide 300ms
- Hover: Scale 1.02 + glow pulse
- 3D tilt: Perspective transform on hover
- Loading: Neon pulse animation
- Background: Floating particles

## 3. Core Features

### Multi-Tenant Architecture
- Complete data isolation per restaurant
- Personal UPI payment configuration
- Custom branding

### UPI Payment System
- Restaurant configures their UPI ID
- QR code generation for payments
- Instant payment verification
- Auto-confirmation on payment

### Menu Management
- Upload food images
- Category management
- Item modifiers (size, extras)
- Veg/Non-veg indicators
- Availability toggle
- Prep time settings

### QR Menu & Ordering
- Shareable QR codes
- Direct browser ordering
- Cart management
- UPI payment integration
- Order confirmation
- Real-time status

### POS System
- 3D card-based menu
- Quick category nav
- Split bills
- Payment collection

### Kitchen Display
- Real-time queue
- Timer with colors
- Bump to complete

### Wallet & Payouts
- Per-restaurant wallet
- Transaction ledger
- UPI payout

## 4. Database Schema

```prisma
model Restaurant {
  id           String   @id @default(uuid())
  name         String
  slug        String   @unique
  logo        String?
  upiId       String?
  upiName     String?
  createdAt   DateTime @default(now())
  
  users         User[]
  branches      Branch[]
  wallet        Wallet?
  orders        Order[]
  payouts       Payout[]
  menuCategories MenuCategory[]
}

model MenuItem {
  id          String   @id @default(uuid())
  categoryId  String
  name        String
  description String?
  price       Decimal
  imageUrl    String?
  isAvailable Boolean  @default(true)
  isVeg       Boolean  @default(true)
  modifiers   String?
  prepTime    Int      @default(15)
  
  category    MenuCategory @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
}
```

## 5. API Endpoints

**Auth**
- POST /auth/login
- POST /auth/register
- GET /auth/me

**Menu**
- GET /menu (auth)
- GET /menu/public/:slug (no auth)
- POST /menu/upload (image upload)
- POST /menu/categories
- POST /menu/items

**Orders**
- POST /orders
- GET /orders
- PATCH /orders/:id/status
- POST /orders/:id/pay

**Payments**
- POST /payments/create-qr
- POST /payments/verify
- GET /payments/upi/:restaurantId

**Restaurant**
- GET /restaurant
- PATCH /restaurant
- POST /restaurant/upi-config

## 6. Deployment

Docker-ready with PostgreSQL for production.
