
# Narsinha SolarPump Tracking System - Tech Design

This document outlines the professional architecture for the Solar Pump Material Store & Installation Tracking application.

## 1. Frontend Architecture (React)
- **UI Framework**: React 19 + Tailwind CSS (Mobile-First)
- **Iconography**: Lucide React
- **Data Visualization**: Recharts (for stock/progress trends)
- **Utilities**: XLSX (Excel Exports), JSZip (Media Archiving)

## 2. Backend Design (Proposed Stack)
- **Runtime**: Node.js (LTS)
- **Framework**: Express.js or NestJS
- **Database**: PostgreSQL (Relational integrity for stock & dispatches)
- **ORM**: Prisma or TypeORM
- **Authentication**: JWT (JSON Web Tokens) with Role-Based Access Control (RBAC)

## 3. Database Schema (ERD)

### Table: `users`
- `id`: UUID (Primary Key)
- `username`: String (Unique)
- `password_hash`: String
- `role`: Enum ('ADMIN', 'STORE_KEEPER', 'INSTALLER')
- `full_name`: String

### Table: `materials_stock`
- `id`: UUID (PK)
- `category`: Enum ('MOTOR', 'PANEL', 'STRUCTURE', 'CONTROLLER', 'BOS')
- `specification`: String
- `quantity`: Integer (Atomic updates)
- `min_threshold`: Integer (For alerts)

### Table: `inward_logs` (Materials Arrival)
- `id`: UUID (PK)
- `invoice_no`: String (Unique)
- `supplier`: String
- `arrival_date`: Timestamp
- `items`: JSONB (Array of category, spec, qty)
- `remarks`: Text
- `created_by`: UUID (FK to users)

### Table: `beneficiaries` (Dispatch & Tracking)
- `id`: UUID (PK)
- `beneficiary_id`: String (Unique - e.g. BEN-MH-1024)
- `farmer_name`: String
- `location_json`: JSONB (Village, Taluka, District, Zone)
- `current_status`: Enum (InstallStatus)
- `vehicle_no`: String
- `expected_completion`: Date

### Table: `site_history`
- `id`: UUID (PK)
- `beneficiary_id`: UUID (FK)
- `status`: Enum
- `remarks`: Text
- `image_urls`: String[] (Stored in S3/Cloudinary)
- `created_at`: Timestamp
- `created_by`: UUID (FK)

## 4. API Endpoints (REST)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Authenticate & get JWT | Public |
| GET | `/api/stock` | Get current warehouse levels | Admin, StoreKeeper |
| POST | `/api/inward` | Register new material arrival | StoreKeeper |
| GET | `/api/dispatch` | List all beneficiary sites | Admin, Installer |
| POST | `/api/dispatch` | Create new site & issue material | StoreKeeper |
| PATCH | `/api/dispatch/:id/status` | Update installation progress | Installer |
| GET | `/api/reports/export` | Download XLSX/ZIP data | Admin |

## 5. Security & Deployment
- **CORS**: Restricted to frontend domain.
- **Media**: Photos should be compressed on the client before upload to an S3-compatible bucket.
- **Atomic Transactions**: Material dispatch must be an atomic DB transaction (Update Site + Decrease Stock).

## Local SQLite API (Laptop-Only)

For offline/local use, a lightweight Express + SQLite API is included.

1) Install backend deps: `cd server && npm install`
2) Start API: `npm start` (runs on http://localhost:4000)
3) Start frontend from project root: `npm run dev`

Auth defaults (change in server/index.js):
- Admin PIN 1111
- Store Keeper PIN 2222
- Installer INST-0001 PIN 3333

Data lives in `server/database.sqlite`; copy that file for backups.
