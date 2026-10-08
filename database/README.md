# AcxiomCRM Database Documentation

## Overview
AcxiomCRM uses a normalized, relational MySQL schema designed with foreign keys, cascading constraints, unique indexes, and audit logging support.

## Database Name
`acxiomcrm`

## Tables Summary
1. `roles`: Role definitions (`ADMIN`, `MANAGER`, `SALES_EXECUTIVE`, `CUSTOMER`).
2. `users`: System users with bcrypt hashed passwords, account lockout, failed attempt tracking, department.
3. `customers`: Enterprise customer records with unique email, phone, and customer codes.
4. `leads`: Inbound sales leads with priority levels (`HOT`, `WARM`, `COLD`), conversion links, expected values.
5. `opportunities`: Deals pipeline with stage tracking, win probabilities (0-100), and close dates.
6. `followups`: Scheduled touchpoints (`CALL`, `MEETING`, `EMAIL`, `DEMO`) with statuses (`PLANNED`, `COMPLETED`, `MISSED`, `CANCELLED`).
7. `activities`: Multi-channel engagement history (`CALL`, `MEETING`, `EMAIL`, `TASK`).
8. `audit_logs`: Immutable security and transactional audit log table tracking IP, old/new states.
9. `customer_requests`: Customer self-service portal communication requests and tickets.
10. `notifications`: Real-time user notifications.
11. `system_settings`: Key-value application configurations.

## Setup Instructions

### 1. Manual MySQL CLI Execution
```bash
# Create database and apply schema
mysql -u root -p < database/schema.sql

# Seed development & demo data
mysql -u root -p < database/seed.sql
```

### 2. Node.js Automated Seeding
```bash
cd backend
npm run seed
```

## Seed Credentials (Development)
| Persona | Email | Password | Role |
|---|---|---|---|
| Administrator | admin@acxiomcrm.com | Admin@123 | ADMIN |
| Sales Manager | manager@acxiomcrm.com | Manager@123 | MANAGER |
| Sales Executive | sales.alex@acxiomcrm.com | Sales@123 | SALES_EXECUTIVE |
| Sales Executive | sales.sarah@acxiomcrm.com | Sales@123 | SALES_EXECUTIVE |
| Customer Portal | customer.robert@cloudscale.io | Customer@123 | CUSTOMER |
| Customer Portal | customer.elena@nexusfin.com | Customer@123 | CUSTOMER |
