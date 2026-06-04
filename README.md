# Billora — Multi-Tenant SaaS Billing & Subscription Management Platform

Billora is a complete, production-quality, multi-tenant SaaS Billing & Subscription Management Platform. Inspired by modern fintech UI paradigms (such as Stripe, Linear, and Vercel), it features a premium glassmorphic visual style, strict Role-Based Access Control (RBAC) middleware, a step-by-step Workspace Onboarding Flow, and an interactive First-Time User Experience (FTUE) dashboard.

---

## 🚀 Key Features

* **Multi-Tenant Workspace Onboarding Flow**:
  - **Credentials-Only Sign Up**: Defer workspace initialization until registration completes.
  - **5-Step Onboarding Wizard**: Guides the user through defining company metadata (industry, size, location, currency), selecting subscriptions, adding team members, connecting payment details, and executing a final review with confetti celebrations.
  - **Automatic Role Assignment**: The first user to onboard an organization becomes the **Organization Owner** (`ORG_ADMIN`).
  - **Access Guardrails**: Restricts dashboard access for accounts that have not completed onboarding, redirecting them straight to the onboarding wizard.

* **First-Time User Experience (FTUE) Dashboard**:
  - **Guided Progress Checklist**: If the tenant has no recorded payments, the dashboard renders a checklist (creating workspace, selecting plan, inviting team members, generating test invoices, and simulating payments).
  - **Interactive Sandbox Actions**: Action cards allow users to instantly generate client invoices and process simulated payments.
  - **Dynamic Dashboard Evolution**: Once the first test transaction is processed, the checklist is replaced by live MMR/growth charts, storage metrics, and interactive ledgers.

* **Workspace Customization & Branding**:
  - **Regional Options**: Modify default workspace billing currency and timezones.
  - **Color Customization**: Set primary theme and accent colors for workspace styling.
  - **Custom Invoice Headers & Notes**: Admins can define payment term notes and header greetings printed on invoice records.

* **Developer Sandbox tools**:
  - **Role Quick-Login**: Log in instantly as any role (Super Admin, Org Admin, Finance Manager, Team Member) with pre-populated sandbox accounts.
  - **Simulator Suite**: Trigger declined card charges, file support tickets to chat with an automated bot, or run mock transactions.
  - **Ledger Export**: Download TXT invoices or export payment logs to CSV.
  - **Command Palette**: Press `Ctrl + K` (or `Cmd + K`) to search options or switch workspaces.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (v19), Vite, Tailwind CSS, Zustand, Recharts, Framer Motion, React Router DOM (v7), React Hook Form, Zod, Canvas Confetti
- **Backend**: Node.js, Express.js, JWT Authentication
- **Database**: Prisma ORM with MongoDB (features an automatic in-memory fallback store seeded with realistic demo data if MongoDB connection is unavailable)

---

## 📂 Project Structure

```
billora/
├── client/                           # React + Vite Frontend application
│   ├── public/                       # Static assets
│   ├── src/
│   │   ├── components/               # Reusable UI widgets, alerts, and loaders
│   │   ├── layouts/                  # App wrappers (Dashboard, Public, Suspended)
│   │   ├── pages/                    # Frontend Pages & Views
│   │   │   ├── Onboarding.jsx        # [NEW] Multi-step glassmorphic setup wizard
│   │   │   ├── Overview.jsx          # [UPDATED] FTUE Checklist vs Live dashboard view
│   │   │   ├── Settings.jsx          # [UPDATED] Regional, branding, and invoice customization
│   │   │   ├── Signup.jsx            # [UPDATED] Credentials-only registration entrypoint
│   │   │   └── ... (Other subviews)
│   │   ├── routes/
│   │   │   └── RouteGuards.jsx       # [UPDATED] Onboarding status route redirection guards
│   │   ├── store/
│   │   │   └── authStore.js          # Zustand store for signup, onboarding, and settings
│   │   ├── App.jsx                   # React Router declarations
│   │   └── index.css                 # Core CSS styles and glassmorphism definitions
│   └── vite.config.js
│
└── server/                           # Express.js Backend application
    ├── config/                       # CORS & Environment configurations
    ├── middleware/                   # JWT validation and RBAC checks
    ├── prisma/                       # Database model schemas & index settings
    │   └── schema.prisma             # [UPDATED] Added workspace customization & branding fields
    ├── routes/
    │   ├── auth.js                   # [UPDATED] Registration, Onboard wizard, and Settings APIs
    │   ├── billing.js                # [UPDATED] Client invoice simulators & payment processors
    │   └── ... (Other endpoint routers)
    ├── services/
    │   └── dbService.js              # [UPDATED] Database initialization & seeded in-memory store
    └── server.js                     # Main server entrypoint
```

---

## 💻 Local Setup & Installation

### Prerequisites
- Node.js (v18+)
- npm

### 1. Configure the Server
1. Navigate to the `server` folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   PORT=5000
   DATABASE_URL="mongodb+srv://..."
   JWT_SECRET="billora-super-secret-dev-jwt-key-2026"
   NODE_ENV=development
   ```
4. **Database Syncing (Optional)**: If using MongoDB, push the schemas and sync indexes:
   ```bash
   npx prisma db push
   ```
5. Start the backend developer server:
   ```bash
   npm run dev
   ```

### 2. Configure the Client
1. Navigate to the `client` folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite developer server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to: [http://localhost:5173](http://localhost:5173)

---

## 🔒 Role-Based Permissions Checklist

The platform enforces the following role assignments:
- **Super Admin**: Global ARR/MRR statistics, plans management, tenant suspension.
- **Organization Admin**: Invite users, assign roles, upgrade/change plans, manage card details, edit colors and branding.
- **Finance Manager**: View payment history, request refunds, export ledgers.
- **Team Member**: View usage metrics, access ticket center.
