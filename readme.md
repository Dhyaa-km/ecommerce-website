# ShopNest

A full-stack e-commerce platform built with React, TypeScript, Node.js, Express, PostgreSQL, and Prisma.

## Overview

ShopNest is a full-stack e-commerce application designed to demonstrate modern web development practices, secure authentication, relational database design, and modular backend architecture.

The platform provides a customer storefront for browsing products, managing a shopping cart, and placing orders, alongside an administrative dashboard for managing products, categories, users, and orders.

## Live Demo

🌐 https://shopnestt-store.vercel.app/

## Features

### Customer

- User registration and login
- JWT-based authentication
- Persistent authentication across page reloads
- Product browsing
- Product search
- Category filtering
- Price filtering
- Pagination
- Shopping cart management
- Checkout and order creation
- Order history
- Order details
- Account management
- Password change

### Admin

- Admin dashboard
- Product management
- Category management
- User management
- User activation/deactivation
- Order management
- Order status management
- Role-based access control

## Security

- HTTP-only refresh token cookies
- Short-lived access tokens
- Refresh token rotation
- Refresh token reuse detection
- Session revocation
- Authentication versioning
- Password hashing with bcrypt
- Request validation with Zod
- Helmet security headers
- CORS protection
- Authentication rate limiting
- PostgreSQL database integrity constraints
- Protected admin routes
- In-memory access token storage on the frontend

## Architecture

The backend follows a feature-based modular monolith architecture.

Each feature is organized into its own module containing its related routes, controllers, services, and validation logic.

```text
server/
├── Prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   │   └── env.ts
│   │
│   ├── generated/
│   │
│   ├── lib/
│   │   └── prisma.ts
│   │
│   ├── middleware/
│   │   ├── validate.ts
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── auth-rate-limit.middleware.ts
│   │   └── validate-param.middleware.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── cart/
│   │   ├── orders/
│   │   └── users/
│   │
│   ├── tests/
│   │   ├── health.test.ts
│   │   └── auth.test.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── .env
├── .gitignore
├── package.json
├── prisma.config.ts
├── tsconfig.json
└── vitest.config.ts
```

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Axios
- Lucide React

### Backend

- Node.js
- Express
- TypeScript
- JWT
- bcrypt
- Zod
- Helmet
- express-rate-limit
- cookie-parser

### Database

- PostgreSQL
- Prisma ORM
- Docker

### Testing

- Vitest

### Deployment

- Vercel — Frontend
- Render — Backend
- Neon — PostgreSQL Database

## Database

The application uses PostgreSQL with Prisma ORM.

The main entities are:

```text
User
 ├── Cart
 ├── Orders
 └── RefreshSessions

Category
 └── Products

Product
 ├── CartItems
 └── OrderItems

Cart
 └── CartItems

Order
 └── OrderItems
```

### Main Models

- User
- RefreshSession
- Category
- Product
- Cart
- CartItem
- Order
- OrderItem

The database also includes integrity constraints for:

- Product stock
- Product price
- Cart item quantity
- Order item quantity



## API Overview

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get products |
| GET | `/api/products/:id` | Get product |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

Product listing supports:

- Search
- Category filtering
- Price filtering
- Pagination

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get categories |
| POST | `/api/categories` | Create category |

### Cart

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get current cart |
| POST | `/api/cart/items` | Add item |
| PUT | `/api/cart/items/:itemId` | Update item |
| DELETE | `/api/cart/items/:itemId` | Remove item |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders/my` | Get current user's orders |
| GET | `/api/orders/:id` | Get order |
| GET | `/api/orders` | Get all orders |
| PATCH | `/api/orders/:id/status` | Update order status |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get account |
| PUT | `/api/users/me` | Update account |
| PUT | `/api/users/me/password` | Change password |
| GET | `/api/users` | Get users |
| PATCH | `/api/users/:id/status` | Activate/deactivate user |

## Order Management

Orders use controlled status transitions:

```text
PENDING
   ├── CONFIRMED
   │      └── SHIPPED
   │             └── DELIVERED
   │
   └── CANCELLED
```

Order cancellation also restores reserved product stock.

Checkout uses database transactions and row locking to prevent concurrent requests from overselling available inventory.

## Local Development

### Prerequisites

Make sure you have installed:

- Node.js
- Docker Desktop
- Git

### Clone the Repository

```bash
git clone https://github.com/Dhyaa-km/ecommerce-website.git
cd ecommerce-website
```

### Backend Setup

```bash
cd server
npm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ecommerce_db"
```

### Start PostgreSQL

```bash
docker compose up -d
```

### Run Database Migrations

```bash
npx prisma migrate dev
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Start the Backend

```bash
npm run dev
```

The backend will run on:

```text
http://localhost:3000
```

### Frontend Setup

From the frontend directory:

```bash
npm install
npm run dev
```

The frontend will run on:

```text
http://localhost:5173
```

## Testing

The backend uses Vitest and Supertest for automated testing.

Run:

```bash
npm test
```

The test suite includes authentication and health-check coverage.

## Deployment

ShopNest is deployed using:

```text
Frontend
   │
   ▼
Vercel
   │
   │ HTTPS API requests
   ▼
Render
   │
   ▼
Neon PostgreSQL
```


## Future Improvements

Potential future improvements include:

- Product image storage
- Advanced admin analytics
- Product reviews and ratings
- Wishlist functionality
- Email notifications
- Payment integration
- More comprehensive automated testing
- Advanced product management
- Order filtering and analytics

## Licence

This project is licensed under the MIT License.