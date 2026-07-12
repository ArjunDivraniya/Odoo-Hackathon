# AssetFlow - Enterprise Asset & Resource Management System

![AssetFlow Architecture](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-ISC-blue) ![Version](https://img.shields.io/badge/Version-1.0.0-informational) ![Typescript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white) ![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white)

**AssetFlow** is a comprehensive, production-ready, multi-tenant enterprise system designed to provide organizations with complete control over their physical assets, human resources, facilities, and daily operations.

By tightly integrating organizational structures (Companies, Buildings, Departments, Employees) with asset lifecycles (Procurement, Allocation, Maintenance, Auditing, and Retirement), AssetFlow acts as a single source of truth for an enterprise's physical capital.

---

## 🌟 Executive Features Overview

### 🔐 1. Advanced Security & Access Control
- **Multi-Tenant Architecture**: Strict data isolation at the `Company` level.
- **Granular RBAC (Role-Based Access Control)**: Custom roles with module-level, action-level, and field-level permissions.
- **Authentication**: JWT-based authentication with token rotation (Refresh Tokens) and session tracking.
- **MFA (Multi-Factor Authentication)**: OTP codes and device fingerprinting to detect login anomalies.
- **Audit Trails**: Every login, failed attempt, and significant mutation is logged in `activity_logs`.

### 🏢 2. Complete Organizational Hierarchy
- **Facilities Management**: Model physical locations hierarchically (`Company` → `Office` → `Building` → `Floor` → `Location`/`Room`).
- **HR Integration**: Manage `Departments` (with nested closure tables for deep hierarchies) and map them to `EmployeeProfiles` linked directly to user accounts.

### 💻 3. Enterprise Asset Management (EAM)
- **Asset Lifecycles**: Track statuses from `AVAILABLE` to `ALLOCATED`, `UNDER_MAINTENANCE`, `LOST`, `DAMAGED`, or `RETIRED`.
- **Categorization & Metadata**: Infinite-depth category trees (`AssetCategory`) with support for custom dynamic fields per category.
- **Asset Media & QR Codes**: Built-in support for generating QR codes, managing asset galleries (`asset-image`), and attaching warranties/manuals (`asset-document`).

### 🔄 4. Workflows & Operations
- **Allocations**: Checkout/Checkin workflows to assign assets to employees or locations. Includes Approval flows.
- **Maintenance**: Schedule preventative maintenance, track repair costs, and verify completed jobs.
- **Auditing**: Conduct regular inventory audits with `AuditCycles` and `AuditAssignments`.
- **Transfers**: Move assets between buildings/offices with a formal request-approve-transit-receive pipeline.
- **Bookings**: Allow users to reserve shared resources (like meeting rooms or projectors).

---

## 🏛️ System Architecture

AssetFlow employs a decoupled, API-first architecture designed for scale.

```mermaid
graph TD
    %% Client Tier
    subgraph Client["Frontend - Next.js App Router"]
        UI["React Components & Pages"]
        State["React Query & Context"]
        Forms["React Hook Form + Zod"]
        Charts["Recharts Dashboards"]
    end

    %% API Gateway & Routing
    subgraph API["Backend Server - Express.js"]
        Router["Module Routers"]
        Auth["Auth & MFA Middleware"]
        Valid["Zod Schema Validation"]
        Error["Global Error Handler"]
    end

    %% Domain Logic Modules
    subgraph Modules["Domain Modules (33+)"]
        ModAsset["Asset & Category"]
        ModOrg["Org & Facilities"]
        ModHR["HR & Employees"]
        ModOps["Allocations & Maintenance"]
        ModSys["System & Notifications"]
    end

    %% Persistence Tier
    subgraph Data["Data Persistence Layer"]
        ORM["Prisma ORM"]
        DB[("PostgreSQL / NeonDB")]
        Cache[("Redis (Planned)")]
    end

    %% External Integrations
    subgraph External["External Services"]
        Storage["Cloudinary - Media/Docs"]
        Email["Nodemailer - Alerts/OTP"]
    end

    %% Connections
    UI -->|State Management| State
    State <-->|REST API JSON| Router
    Router <--> Auth
    Router <--> Valid
    Router --> Modules
    Modules <-->|Queries/Mutations| ORM
    ORM <--> DB
    Modules -->|Uploads| Storage
    Modules -->|Transactional Emails| Email

    classDef react fill:#61DAFB,stroke:#333,stroke-width:2px,color:black;
    classDef express fill:#ffffff,stroke:#000000,stroke-width:2px,color:black;
    classDef modules fill:#e0e0e0,stroke:#333,stroke-width:2px,color:black;
    classDef db fill:#336791,stroke:#ffffff,stroke-width:2px,color:white;
    classDef external fill:#f9a826,stroke:#333,stroke-width:2px,color:black;

    class Client react;
    class API express;
    class Modules modules;
    class Data db;
    class External external;
```

---

## 🔄 Core Workflow: Asset Allocation Lifecycle

The diagram below illustrates how an asset moves from available inventory to an employee, and the strict state tracking involved.

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE : Asset Procured & Onboarded
    AVAILABLE --> PENDING_APPROVAL : Employee Requests Asset
    PENDING_APPROVAL --> AVAILABLE : Request Rejected
    PENDING_APPROVAL --> ALLOCATED : Request Approved
    
    ALLOCATED --> UNDER_MAINTENANCE : Needs Repair
    UNDER_MAINTENANCE --> ALLOCATED : Fixed & Returned
    
    ALLOCATED --> RETURN_PENDING : Employee Resigns / Upgrades
    RETURN_PENDING --> AVAILABLE : Asset Checked In
    
    ALLOCATED --> LOST_STOLEN : Reported Missing
    LOST_STOLEN --> [*]
    AVAILABLE --> RETIRED : End of Useful Life
    RETIRED --> [*]
```

---

## 🧰 Comprehensive Tech Stack

### Frontend Application (`/frontend`)
- **Core**: Next.js 16 (App Router), React 19.
- **Styling & UI**: Tailwind CSS v4, `shadcn/ui` (accessible, customizable components), Base UI, `clsx`, `tailwind-merge`.
- **State & Data Fetching**: `@tanstack/react-query` for server state, caching, and optimistic updates. `axios` for standardizing requests.
- **Form Handling**: `react-hook-form` paired with `zod` for strict, type-safe client-side validation.
- **Visuals**: `recharts` for analytics dashboards (pie charts, bar charts of asset usage), `lucide-react` for iconography, `framer-motion` for micro-interactions.

### Backend Application (`/backend`)
- **Core**: Node.js, Express.js 5, heavily strictly typed with TypeScript.
- **Database Architecture**: PostgreSQL (schema-based multi-tenancy ready).
- **ORM**: Prisma ORM (`@prisma/client`, `@prisma/adapter-pg`) providing complete end-to-end type safety from DB to API boundary.
- **Authentication**: `jsonwebtoken` (JWT), `bcryptjs` (password hashing).
- **Storage & Media**: `multer` & `multer-storage-cloudinary` syncing directly to Cloudinary for asset imagery and PDF manuals.
- **Emails**: `nodemailer` for sending OTPs, approval requests, and maintenance alerts.
- **Validation**: `zod` schemas ensuring payload integrity before touching business logic.

---

## 📁 Detailed Project Structure

```text
Odoo-Hackathon/
├── frontend/                       # NEXT.JS FRONTEND
│   ├── app/                        # Next.js App Router Pages
│   │   ├── (dashboard)/            # Protected routes layout
│   │   │   ├── analytics/          # Reporting views
│   │   │   ├── assets/             # Asset grids and details
│   │   │   ├── allocations/        # Asset assignment workflows
│   │   │   ├── organization/       # Facilities & Dept Setup
│   │   │   └── settings/           # User & System preferences
│   │   └── auth/                   # Login, MFA, Password Reset
│   ├── components/                 # React Components
│   │   ├── dashboard/              # Sidebar, Navbar, Widgets
│   │   ├── charts/                 # Reusable Recharts wrappers
│   │   └── ui/                     # shadcn/ui primitives
│   ├── config/                     # Navigation & App constants
│   ├── hooks/                      # Data hooks (useAssets, useAuth)
│   ├── services/                   # Axios API instances & interceptors
│   └── types/                      # Shared TS Interfaces
│
└── backend/                        # EXPRESS.JS BACKEND
    ├── prisma/                     # Database
    │   ├── schema.prisma           # Huge ~2200 line enterprise schema
    │   └── migrations/             # SQL migration history
    └── src/
        ├── modules/                # 33+ DOMAIN MODULES
        │   ├── activity-log/       # Global audit trailing
        │   ├── asset/              # Core asset CRUD
        │   ├── auth/               # JWT/OTP logic
        │   ├── company/            # Multi-tenant root
        │   ├── employee/           # HR integrations
        │   ├── maintenance/        # Ticketing & repairs
        │   ├── notification/       # In-app alerts
        │   └── roles/              # RBAC logic
        ├── middleware/             # Auth guards, Error handlers
        ├── utils/                  # Helpers (Cloudinary, Mailer)
        ├── server.ts               # HTTP Server bootstrap
        └── app.ts                  # Express config & route mounting
```

---

## 🚀 Step-by-Step Setup Guide

### 1. Prerequisites
- **Node.js**: v18.x or v20.x
- **Database**: A PostgreSQL instance (local or hosted like NeonDB/Supabase).
- **Cloudinary**: Create a free account to get API keys for image uploads.

### 2. Backend Initialization
```bash
# Move into backend
cd backend

# Install dependencies
npm install

# Create environment variables
cp .env.example .env
```

**Configure `backend/.env`:**
```env
PORT=5000
NODE_ENV=development

# Prisma Postgres Connection
DATABASE_URL="postgresql://username:password@localhost:5432/assetflow_db?schema=public"

# Auth Secrets (Generate a long random string)
JWT_SECRET="super_secret_jwt_key_here"
JWT_REFRESH_SECRET="super_secret_refresh_key_here"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_EXPIRES_IN="7d"

# Media Storage
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Email SMTP (e.g., Mailtrap, SendGrid, or Gmail App Password)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="your_user"
SMTP_PASS="your_pass"
SMTP_FROM="noreply@assetflow.com"
```

**Database Sync & Seed:**
```bash
# Generate Prisma Client types
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed the database with initial Admin roles and dummy data
npm run seed

# Start the development server (runs on port 5000)
npm run dev
```

### 3. Frontend Initialization
```bash
# Open a new terminal and move into frontend
cd frontend

# Install dependencies
npm install

# Create environment variables
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" > .env.local

# Start the Next.js development server
npm run dev
```

The application is now live!
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API Base**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)

---

## 📚 Developer Guide: Where to start?

1. **Understanding the Data**: Read `backend/prisma/schema.prisma`. It is extensively commented. The core relationship to understand is `Company -> Office/Department -> Employee -> Allocation -> Asset`.
2. **Adding a New API Route**: 
   - Create a folder in `backend/src/modules/[feature_name]`.
   - Add a `controller.ts`, `route.ts`, and `service.ts` to keep business logic separated from HTTP logic.
   - Register the route in `backend/src/app.ts`.
3. **Adding Frontend Views**:
   - Create the page in `frontend/app/(dashboard)/[feature]/page.tsx`.
   - Ensure the route is added to the Sidebar in `frontend/config/navigation.ts`.
   - Use React Query hooks inside `frontend/hooks/` to interface with your new API route.
