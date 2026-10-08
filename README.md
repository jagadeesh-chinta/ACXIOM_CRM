# ACXIOMCRM - Enterprise Full-Stack CRM Web Application

AcxiomCRM is a production-style, role-based Customer Relationship Management (CRM) platform built with a high-performance modern web stack. It provides real-time dynamic statistics, dedicated role portals, granular role-based authorization, enterprise lead and pipeline management, and a self-service customer relationship center.

---

## 🛠 Technology Stack

- **Frontend**: React 19, Vite, React Router v7, Axios, Bootstrap 5, Bootstrap Icons, Chart.js / React-ChartJS-2, Vanilla CSS design system.
- **Backend**: Node.js, Express 4, MySQL2 (Connection Pool), JWT (JSON Web Tokens), Bcrypt.js, Express-Validator, Express-Rate-Limit, Helmet, CORS.
- **Database**: Relational MySQL with normalized schema, foreign keys, cascading constraints, and audit logging.

---

## 📁 Repository Structure

```
CRM/
├── backend/                  # REST API Server (Node.js + Express)
│   ├── config/               # Database pool & environment configuration
│   ├── controllers/          # Business logic controllers
│   ├── middleware/           # Auth, role-guard, error, and rate-limit middleware
│   ├── routes/               # Express REST API routes
│   ├── services/             # Audit logging & database services
│   ├── validators/           # Express-validator schemas
│   ├── tests/                # Automated API test suites
│   ├── server.js             # Server startup file
│   └── package.json
│
├── frontend/                 # Single Page Application (React + Vite)
│   ├── src/
│   │   ├── components/       # Common UI, forms, tables, modals, navbar, sidebar
│   │   ├── context/          # AuthContext and ToastContext
│   │   ├── dashboards/       # Dynamic dashboards (Admin, Manager, Sales, Customer)
│   │   ├── pages/            # Role portals, CRM entities, Settings, Reports
│   │   ├── routes/           # RoleGuard, ProtectedRoute, AppRoutes
│   │   ├── services/         # Axios API service integrations
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
│
├── database/                 # MySQL Schema and Seed Data
│   ├── schema.sql            # Table definitions, constraints, indexes
│   ├── seed.sql              # Enterprise demo dataset
│   └── README.md
│
└── README.md                 # Project Documentation
```

---

## 🚀 How to Run the Project

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MySQL**: v8.0 or higher running on `localhost:3306`

---

### Step 1: Database Setup

1. Open your MySQL client (Command Line, MySQL Workbench, or phpMyAdmin) and create the database:
   ```sql
   CREATE DATABASE acxiomcrm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Execute the schema file to create all tables and indexes:
   ```bash
   mysql -u root -p acxiomcrm < database/schema.sql
   ```

3. *(Optional)* Seed demo records (or start fresh with clean registrations):
   ```bash
   mysql -u root -p acxiomcrm < database/seed.sql
   ```

---

### Step 2: Backend Setup & Run

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables by creating `.env` in the `backend/` folder (or copy from `.env.example`):
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development

   # MySQL Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=acxiomcrm
   DB_USER=root
   DB_PASSWORD=your_mysql_password

   # JWT Authentication
   JWT_SECRET=super_secret_jwt_key_acxiomcrm_2026
   JWT_EXPIRES_IN=1d
   ```

4. Start the backend service:
   ```bash
   # Production/standard mode:
   node server.js

   # Development auto-reload mode:
   npm run dev
   ```
   > Backend runs at: **`http://localhost:5000`**  
   > Health Check: **`http://localhost:5000/api/health`**

---

### Step 3: Frontend Setup & Run

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   > Frontend runs at: **`http://localhost:5173`**

4. To build for production:
   ```bash
   npm run build
   ```

---

## 🌐 Dedicated Role Panels & Portals (Frontend)

AcxiomCRM isolates user authentication and workflows into dedicated, customized portals. All registration and sign-in forms uniformly utilize the `name@gmail.com` email format.

| Panel / Role | Dedicated Portal URL | Access Capabilities |
|---|---|---|
| **Master Admin** | `http://localhost:5173/admin` | One-time Master Admin signup (locks automatically after registration), full user & role management, audit logs, health metrics, CRM data. |
| **Sales Manager** | `http://localhost:5173/manager` | Team pipeline overview, manager sign-in/up, sales performance reports, lead and customer oversight. |
| **Sales Executive** | `http://localhost:5173/sales-exec` | Personal sales rep sign-in/up, lead qualification & conversion, deals, customer follow-up schedule, activity logging. |
| **Customer** | `http://localhost:5173/login`<br>`http://localhost:5173/register` | Customer sign-in/up, dynamic profile management, dedicated representative card, ticket submission, active deals & meetings. |
| **Settings** *(All Roles)* | `http://localhost:5173/settings` | Dynamic profile details & editing, live session details, **Sign Out**, and **Delete Account Permanently** (with security confirmation). |

---

## 📡 REST API Reference

All protected endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

### 1. Authentication & System Access (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate existing user (all roles) | No |
| `POST` | `/api/auth/register` | Register customer account (`CUSTOMER` role) | No |
| `GET` | `/api/auth/admin-status` | Check if Master Administrator account exists | No |
| `POST` | `/api/auth/admin-register` | Single Master Admin setup (locks on registration) | No |
| `POST` | `/api/auth/manager-register` | Register new Sales Manager account | No |
| `POST` | `/api/auth/sales-register` | Register new Sales Executive account | No |
| `GET` | `/api/auth/public-stats` | Real-time dynamic count of customers, leads, users | No |
| `GET` | `/api/auth/me` | Retrieve currently authenticated user profile | Yes |
| `PUT` | `/api/auth/profile` | Update user profile details (first name, phone, etc.) | Yes |
| `DELETE`| `/api/auth/delete-account` | Permanently wipe user account from database | Yes |
| `POST` | `/api/auth/logout` | Terminate session and audit logout event | Yes |
| `POST` | `/api/auth/forgot-password` | Request password reset verification | No |
| `POST` | `/api/auth/reset-password` | Reset password using verified token | No |

---

### 2. Customer Portal APIs (`/api/customer-portal` & `/api/dashboard/customer`)

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| `GET` | `/api/customer-portal/profile` | Retrieve dynamic customer details & dedicated rep | `CUSTOMER` |
| `PUT` | `/api/customer-portal/profile` | Edit customer contact info, company name, address | `CUSTOMER` |
| `GET` | `/api/customer-portal/requests` | List customer support inquiries & staff responses | `CUSTOMER`, Staff |
| `POST` | `/api/customer-portal/requests` | Submit support inquiry / license expansion ticket | `CUSTOMER` |
| `PUT` | `/api/customer-portal/requests/:id`| Respond to customer inquiry (staff response) | Staff |
| `GET` | `/api/dashboard/customer` | Customer Relationship Center overview metrics | `CUSTOMER` |

---

### 3. Administrator Panel APIs (`/api/users`, `/api/audit-logs`, `/api/system`)

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| `GET` | `/api/dashboard/admin` | Enterprise KPI metrics, revenue, pipeline health | `ADMIN` |
| `GET` | `/api/users` | List users with pagination, role filter, search | `ADMIN`, `MANAGER` |
| `POST` | `/api/users` | Provision internal user account with assigned role | `ADMIN` |
| `PUT` | `/api/users/:id` | Update user department, status (`ACTIVE`/`INACTIVE`) | `ADMIN` |
| `DELETE`| `/api/users/:id` | Deactivate/delete internal user account | `ADMIN` |
| `GET` | `/api/audit-logs` | Retrieve immutable audit trail with IP & timestamps | `ADMIN`, `MANAGER` |
| `GET` | `/api/system/health` | Real-time database connection & memory metrics | `ADMIN` |
| `GET` | `/api/system/settings` | Read system configurations | `ADMIN` |
| `PUT` | `/api/system/settings` | Update system configurations | `ADMIN` |

---

### 4. Manager Panel APIs (`/api/dashboard/manager` & `/api/reports`)

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| `GET` | `/api/dashboard/manager` | Team revenue, sales conversion, pipeline stages | `MANAGER`, `ADMIN` |
| `GET` | `/api/reports/leads` | Lead source distribution & qualification stats | `MANAGER`, `ADMIN`, `SALES_EXECUTIVE` |
| `GET` | `/api/reports/pipeline` | Weighted pipeline value by opportunity stage | `MANAGER`, `ADMIN`, `SALES_EXECUTIVE` |
| `GET` | `/api/reports/sales-performance`| Sales representative win rates and closed deals | `MANAGER`, `ADMIN` |

---

### 5. Sales Executive Panel & CRM Core APIs

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| `GET` | `/api/dashboard/sales` | Executive quota progress, won deals, touchpoints | `SALES_EXECUTIVE`, `MANAGER`, `ADMIN` |
| `GET` | `/api/leads` | List inbound leads with search & priority filters | `ADMIN`, `MANAGER`, `SALES_EXECUTIVE` |
| `POST` | `/api/leads` | Create sales lead (`HOT`, `WARM`, `COLD`) | `ADMIN`, `MANAGER`, `SALES_EXECUTIVE` |
| `PUT` | `/api/leads/:id` | Update lead qualification status | `ADMIN`, `MANAGER`, `SALES_EXECUTIVE` |
| `POST` | `/api/leads/:id/convert`| Convert qualified lead to Customer + Opportunity | `ADMIN`, `MANAGER`, `SALES_EXECUTIVE` |
| `GET` | `/api/customers` | Paginated customer list with assigned reps | All authenticated |
| `GET` | `/api/customers/:id` | Deep customer profile with deal history | All authenticated |
| `POST` | `/api/customers` | Register commercial client record | `ADMIN`, `MANAGER`, `SALES_EXECUTIVE` |
| `PUT` | `/api/customers/:id` | Update customer record details | `ADMIN`, `MANAGER`, `SALES_EXECUTIVE` |
| `GET` | `/api/opportunities` | Opportunity deal pipeline stages | All authenticated |
| `POST` | `/api/opportunities` | Open new deal pipeline opportunity | `ADMIN`, `MANAGER`, `SALES_EXECUTIVE` |
| `PUT` | `/api/opportunities/:id`| Update opportunity stage (`DISCOVERY` to `CLOSED_WON`)| `ADMIN`, `MANAGER`, `SALES_EXECUTIVE` |
| `GET` | `/api/followups` | Scheduled touchpoints (`CALL`, `MEETING`, `DEMO`)| All authenticated |
| `POST` | `/api/followups` | Schedule new client follow-up | `ADMIN`, `MANAGER`, `SALES_EXECUTIVE` |
| `PUT` | `/api/followups/:id` | Mark follow-up as `COMPLETED` / update notes | `ADMIN`, `MANAGER`, `SALES_EXECUTIVE` |
| `GET` | `/api/activities` | Multi-channel interaction timeline | All authenticated |
| `POST` | `/api/activities` | Log call, email, or meeting activity | `ADMIN`, `MANAGER`, `SALES_EXECUTIVE` |

---

## 🔒 Security & Quality Highlights

1. **Role-Based Access Control (RBAC)**: Enforced via `authenticateToken` and `authorizeRoles(...)` middleware at route level, mirrored by client-side `RoleGuard` routing components.
2. **Account Lockout Protection**: Automatically locks accounts for 15 minutes after 5 consecutive failed login attempts.
3. **Bcrypt Key Derivation**: High-entropy password hashing with salt cost 10.
4. **Audit Trail Logging**: Every login, profile update, lead conversion, and request update is permanently written to `audit_logs`.
5. **Real-time Live Metrics**: Dynamic MySQL `COUNT(*)` and aggregate queries drive the landing page, dashboard counters, and reports.
6. **Notification System**: Red badge automatically disappears upon opening notifications.
7. **Clean Account Governance**: Settings section supports instant logout and permanent self-service account deletion with confirmation.

---

## 🧪 Testing

Automated test scripts are available in `backend/tests/`:

```bash
cd backend

# Test Customer Profile, Settings & Permanent Account Deletion
node tests/testCustomerProfileAndSettings.js

# Test Role Portals, Admin Lockout & Dynamic Statistics
node tests/testRolePortalsAndDynamicStats.js

# Verify Full System Requirements & Auth Pipeline
node tests/verifyAllRequirements.js
```
