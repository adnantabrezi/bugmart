# 🐞 BugMart — Intentionally Buggy E-Commerce Classroom Lab

Welcome to **BugMart**, a complete, functional, intentionally buggy demonstration e-commerce website created specifically for **SOFTWARE TESTING** classroom labs, QA training, and bug hunting workshops.

> ⚠️ **IMPORTANT SAFETY & CLASSROOM NOTICE**:
> - This application is **ONLY** for local classroom demonstrations and software testing labs.
> - All users, products, orders, coupons, addresses, and payment transactions use **COMPLETELY FAKE DEMO DATA**.
> - It does **NOT** connect to real payment gateways, real authentication services, real email providers, or external systems.

---

## 🛠️ Tech Stack & Requirements

- **Frontend**: React + TypeScript (Vite)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Port: `54321`, Password: `1234`)
- **ORM**: Prisma ORM
- **Containerization**: Docker Compose

---

## 🚀 Quick Start Instructions

### Method 1: Running with Docker Compose (Recommended)

To launch PostgreSQL, Express Backend, and React Frontend in isolated Docker containers:

```bash
docker-compose up --build
```

Once running, access:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api/products](http://localhost:5000/api/products)
---

### Method 3: Deploying to Render as a Single Docker Instance

BugMart is pre-configured to run as a **single, self-contained Docker container** on Render (combining internal PostgreSQL, Express API, and built React frontend assets into a single Web Service):

1. **Push project to GitHub / GitLab**.
2. **Log into Render** ([render.com](https://render.com)).
3. **Create New Web Service**:
   - Select **"Build and deploy from a Git repository"**.
   - Connect your repository.
   - Choose **Environment**: `Docker`.
   - **Dockerfile Path**: `./Dockerfile` (uses root Dockerfile).
4. Click **"Deploy Web Service"**.

Render will automatically build the image, initialize the internal PostgreSQL database, run Prisma schema push & seeding, serve the frontend static files, and bind to Render's assigned `$PORT`!


### Method 2: Running Locally without Docker

#### 1. Start PostgreSQL
Ensure PostgreSQL is running locally on port `54321` with password `1234`:

```bash
# Example Docker PostgreSQL container on port 54321:
docker run --name bugmart-db -e POSTGRES_PASSWORD=1234 -e POSTGRES_DB=bugmart -p 54321:5432 -d postgres:15-alpine
```

#### 2. Setup & Start Backend Server

```bash
cd backend
npm install
npx prisma db push
npm run db:seed
npm run dev
```

#### 3. Setup & Start Frontend App

```bash
cd frontend
npm install
npm run dev
```

Access the web application at [http://localhost:3000](http://localhost:3000).

---

## 🔄 Resetting the Database State

When students finish a bug-hunting session or alter data during testing, you can reset the database back to its original seeded buggy state in two ways:

### Option A: Single-Click Admin UI Reset
1. Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) in the application.
2. Click the red **"Reset Lab Database"** button in the top right header.

### Option B: Terminal Command Reset
Run the npm reset script inside the `backend` directory:

```bash
cd backend
npm run db:reset
```

Or via Docker Compose:

```bash
docker-compose exec backend npm run db:reset
```

---

## 🔑 Fake Classroom Credentials

| Account Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Customer 1** | `user@bugmart.com` | `Password123` | Primary customer account for testing orders & cart |
| **Customer 2** | `jane@bugmart.com` | `Password123` | Secondary customer account for cross-user security testing |
| **Admin** | `admin@bugmart.com` | `Admin123!` | Administrator account for products & orders management |

---

## 🛍️ Web Application Pages

BugMart includes 13 complete pages:

1. **Home (`/`)**: Hero banner, trust features, featured products catalog, quick view modal.
2. **Product Listing (`/products`)**: Category filters, min price filter, sorting options, pagination.
3. **Product Details (`/products/:id`)**: Product info, stock indicator, reviews, submit review form.
4. **Search (`/search`)**: Real-time product search.
5. **Login (`/login`)**: User login.
6. **Register (`/register`)**: Customer registration.
7. **User Profile (`/profile`)**: View/update profile address and phone.
8. **Shopping Cart (`/cart`)**: Item list, quantity controls, coupon application, subtotal/tax/shipping summary.
9. **Checkout (`/checkout`)**: Shipping address, contact phone, fake payment gateway selection, simulated error trigger.
10. **Order History (`/orders`)**: User order history listing.
11. **Order Details (`/orders/:id`)**: Detailed order summary.
12. **Admin Dashboard (`/admin`)**: Manage products, view registered users, change order status, reset lab database.
13. **404 Page (`*`)**: Handles invalid routes.

---

## 🧪 Instructor Reference & Bug Database

An instructor-only bug database is included in:

`/instructor/seeded-bugs.json`

It documents **77 intentionally planted realistic software defects** categorized into:
- UI / Functional Bugs
- Input Validation Defects
- Boundary Value Bugs
- Equivalence Partitioning Bugs
- Business Logic Discrepancies
- Authentication & Authorization Vulnerabilities
- ID / Object Access Control (IDOR) Issues
- API & Status Code Defects
- Database & State Synchronization Issues
- Mild Performance Bottlenecks
- Responsive UI Layout Issues
- Error Handling Defects

Each bug in `seeded-bugs.json` is mapped to difficulty (EASY, MEDIUM, HARD), exact reproduction steps, expected vs actual behavior, and software testing concepts (e.g., Boundary Value Analysis, Integration Testing, Equivalence Partitioning, Authorization).

> 🛑 **NOTE FOR INSTRUCTORS**: Do NOT share `instructor/seeded-bugs.json` with students before the lab session. Share `instructor/STUDENT_TESTING_GUIDE.md` and `instructor/BUG_REPORT_TEMPLATE.md` instead!
