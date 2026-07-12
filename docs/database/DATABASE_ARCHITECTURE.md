# AssetFlow — Enterprise Database Architecture

> **Version:** 1.0.0
> **Last Updated:** 2026-07-12
> **Database Engine:** PostgreSQL 15+
> **ORM:** Prisma (schema.prisma)
> **Status:** Production-Ready Specification

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Design Principles](#3-design-principles)
4. [Core Enums](#4-core-enums)
5. [Module 01-06: Authentication & Authorization](#5-module-0106--authentication--authorization)
6. [Module 07-14: Organization Structure](#6-module-0714--organization-structure)

---

## 1. Executive Summary

AssetFlow is an enterprise-grade **IT Asset Management System** designed to provide complete lifecycle management of organizational assets — from procurement through allocation, maintenance, transfer, and eventual disposal. The system supports multi-tenant deployments with hierarchical organizational structures spanning companies, offices, buildings, floors, and granular locations.

### 1.1 System Capabilities

| Capability | Description |
|---|---|
| **Asset Lifecycle Management** | Track assets from procurement to disposal with full audit trails |
| **Multi-Company Support** | Support for multiple legal entities with isolated data scopes |
| **Hierarchical Organization** | LTREE-based department hierarchies with configurable nesting |
| **Role-Based Access Control** | Granular RBAC with permissions scoped to organizations and assets |
| **Booking & Allocation** | Real-time asset booking, allocation, and return workflows |
| **Maintenance Scheduling** | Preventive and corrective maintenance with SLA tracking |
| **Audit & Compliance** | Complete audit trails, physical verification, and compliance reporting |
| **Real-Time Notifications** | Event-driven notification system across multiple channels |
| **Analytics & Reporting** | Dashboards, KPIs, and exportable reports |

### 1.2 Database Scale Targets

| Metric | Target |
|---|---|
| Concurrent Users | 10,000+ |
| Total Assets Tracked | 5,000,000+ |
| Transactions per Second | 2,000+ |
| Audit Log Retention | 7 years |
| Data Latency | < 50ms for reads |
| Availability | 99.95% uptime |

### 1.3 Module Map

| Module Group | Modules | Tables | Purpose |
|---|---|---|---|
| **Authentication & Authorization** | 01-06 | 12 | Identity, sessions, RBAC |
| **Organization Structure** | 07-14 | 8 | Companies, offices, departments, employees |
| **Asset Management** | 15-22 | 8+ | Asset registry, categories, lifecycle |
| **Allocation & Booking** | 23-28 | 6+ | Assignments, returns, reservations |
| **Maintenance** | 29-34 | 6+ | Service requests, schedules, work orders |
| **Audit & Verification** | 35-40 | 6+ | Audits, inspections, compliance |
| **Procurement** | 41-46 | 6+ | Purchase orders, vendors, receiving |
| **Notifications** | 47-50 | 4+ | Alerts, channels, preferences |
| **Reporting & Analytics** | 51-54 | 4+ | KPIs, exports, dashboards |

---

## 2. Architecture Overview

### 2.1 High-Level Entity Relationship Diagram

```
+---------------------------------------------------------------------------+
|                        AUTHENTICATION & AUTHORIZATION                     |
|                                                                           |
|  +----------+    +----------+    +--------------+    +--------------+     |
|  |  users   |<-->|user_roles|<-->|    roles     |<-->|role_perms    |     |
|  +----+-----+    +----------+    +------+-------+    +------+-------+     |
|       |                                  |                    |            |
|       |  +----------+  +----------+     |           +-------+-------+    |
|       +--| sessions |  |  refresh |     |           |  permissions  |    |
|       |  +----------+  | _tokens  |     |           +---------------+    |
|       |                +----------+     |                                |
|       |  +----------+  +----------+     |                                |
|       +--|  login   |  |password  |     |                                |
|       |  | _history |  | _resets  |     |                                |
|       |  +----------+  +----------+     |                                |
|       |  +----------+  +----------+     |                                |
|       +--|  email   |  |  otp     |     |                                |
|       |  | _verify  |  | _codes   |     |                                |
|       |  +----------+  +----------+     |                                |
|       |  +----------+                   |                                |
|       +--| device   |                   |                                |
|          | _history |                   |                                |
|          +----------+                   |                                |
+---------+-------------------------------+--------------------------------+
          |                              |
          |  created_by / updated_by     |  scoped via FK
          v                              v
+---------------------------------------------------------------------------+
|                      ORGANIZATION STRUCTURE                               |
|                                                                           |
|  +----------+    +----------+    +----------+    +----------+            |
|  | company  |<---| offices  |<---| buildings|<---|  floors  |            |
|  +----+-----+    +----+-----+    +----------+    +----+-----+           |
|       |               |                               |                  |
|       |    +----------v----+                          |                  |
|       +--->|   locations   |<-------------------------+                  |
|       |    +---------------+                                              |
|       |    +------------------+    +-------------------+                 |
|       +--->|  departments     |<-->|department_hierarchy|                 |
|       |    +--------+---------+    +-------------------+                 |
|       |             |                                                     |
|       |    +--------v---------+                                          |
|       +--->| employee_profiles|                                          |
|            +------------------+                                          |
+---------------------------------------------------------------------------+
```

### 2.2 Module Dependency Graph

```
Module Dependencies (-> = depends on):

Authentication & Authorization (M01-06)
  +---> [no dependencies, foundation layer]

Organization Structure (M07-14)
  +---> Authentication & Authorization (M01-06)
        [users, roles used for created_by/updated_by and employee linking]

Asset Management (M15-22)           [documented in future phase]
  +---> Authentication & Authorization (M01-06)
  +---> Organization Structure (M07-14)
        [assets belong to companies, locations, departments]

Allocation & Booking (M23-28)       [documented in future phase]
  +---> Authentication & Authorization (M01-06)
  +---> Organization Structure (M07-14)
  +---> Asset Management (M15-22)

Maintenance (M29-34)                [documented in future phase]
  +---> Authentication & Authorization (M01-06)
  +---> Organization Structure (M07-14)
  +---> Asset Management (M15-22)

Audit & Verification (M35-40)       [documented in future phase]
  +---> Authentication & Authorization (M01-06)
  +---> Organization Structure (M07-14)
  +---> Asset Management (M15-22)

Procurement (M41-46)                [documented in future phase]
  +---> Authentication & Authorization (M01-06)
  +---> Organization Structure (M07-14)
  +---> Asset Management (M15-22)

Notifications (M47-50)              [documented in future phase]
  +---> Authentication & Authorization (M01-06)
  +---> ALL modules (consumes events)

Reporting & Analytics (M51-54)      [documented in future phase]
  +---> ALL modules (reads aggregated data)
```

### 2.3 Schema Organization

```
Database: assetflow_db

Schemas:
  +-- public            -> Extensions, enums, shared utilities
  +-- auth              -> Users, roles, permissions, sessions
  +-- org               -> Company, offices, departments, employees
  +-- asset             -> Asset registry, categories, lifecycle
  +-- allocation        -> Bookings, assignments, returns
  +-- maintenance       -> Service requests, schedules
  +-- audit             -> Audit trails, inspections
  +-- procurement       -> Purchase orders, vendors
  +-- notification      -> Alerts, channels, preferences
  +-- reporting         -> KPIs, dashboards, exports
```

### 2.4 Technology Stack

| Component | Technology | Version |
|---|---|---|
| Database | PostgreSQL | 15+ |
| ORM | Prisma | 5.x |
| Migration Tool | Prisma Migrate | 5.x |
| Connection Pooling | PgBouncer | 1.20+ |
| Hierarchy Extension | ltree | built-in |
| Full-Text Search | pg_trgm + tsvector | built-in |
| JSON Support | JSONB | built-in |
| UUID Generation | pgcrypto (gen_random_uuid()) | built-in |
| Encryption | pgcrypto | built-in |

---

## 3. Design Principles

### 3.1 Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Tables | snake_case, plural | `users`, `employee_profiles`, `login_history` |
| Columns | snake_case, singular | `first_name`, `created_at`, `is_active` |
| Primary Keys | `id` (UUID) | `id UUID DEFAULT gen_random_uuid()` |
| Foreign Keys | `<referenced_table_singular>_id` | `user_id`, `company_id`, `role_id` |
| Indexes | `idx_<table>_<column(s)>` | `idx_users_email`, `idx_assets_company_status` |
| Unique Constraints | `uq_<table>_<column(s)>` | `uq_users_email`, `uq_roles_name_company` |
| Check Constraints | `chk_<table>_<description>` | `chk_users_email_format` |
| Enums | `snake_case` | `asset_status`, `user_status` |
| Boolean columns | `is_<adjective>` or `has_<noun>` | `is_active`, `is_verified`, `has_mfa` |
| Timestamps | `*_at` suffix | `created_at`, `deleted_at`, `last_login_at` |
| Soft delete column | `deleted_at` | `deleted_at TIMESTAMPTZ` |
| LTREE columns | `*_path` suffix | `hierarchy_path`, `category_path` |

### 3.2 Standard Columns

Every main entity table includes these standard columns:

```sql
-- Surrogate primary key (UUID v4)
id              UUID        NOT NULL DEFAULT gen_random_uuid()

-- Soft delete (NULL = active, timestamp = deleted)
deleted_at      TIMESTAMPTZ NOT NULL DEFAULT NULL

-- Audit trail
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()

-- User references for audit accountability
created_by      UUID        NOT NULL        -- FK -> users.id
updated_by      UUID        NOT NULL        -- FK -> users.id

-- Optimistic concurrency control
version         INTEGER     NOT NULL DEFAULT 1
```

### 3.3 Soft Delete Policy

```sql
-- Rule: All main entity tables use soft delete via deleted_at
-- Active record:   deleted_at IS NULL
-- Deleted record:  deleted_at IS NOT NULL
-- Query pattern:   WHERE deleted_at IS NULL (or use Prisma soft-delete middleware)
-- Restore pattern: UPDATE ... SET deleted_at = NULL
-- Permanent purge: Only via admin scheduled job after retention period (default: 90 days)
```

**Cascade Behavior:**

- Soft-deleted parents do NOT cascade to children automatically.
- Children must be soft-deleted explicitly or via application-level cascade.
- Hard delete is prohibited on tables with audit requirements.

### 3.4 Primary Key Strategy

```sql
-- All tables use UUID v4 as primary key
id UUID NOT NULL DEFAULT gen_random_uuid()

-- Prisma schema:
id String @id @default(uuid()) @db.Uuid

-- Why UUID over SERIAL/BIGSERIAL?
-- 1. No sequential enumeration (security: IDs cannot be guessed)
-- 2. Distributed generation (no central sequence bottleneck)
-- 3. Merge-safe (no collision across environments)
-- 4. Client-side generation (reduces round trips)
```

### 3.5 Foreign Key Naming Convention

```sql
-- Convention: <referenced_table_singular>_id
-- Examples:
--   users.id <--- created_by       (in all audit columns)
--   users.id <--- user_id          (in user-specific tables)
--   company.id <--- company_id     (in org-scoped tables)
--   roles.id <--- role_id          (in role-specific tables)
```

### 3.6 Normalization Strategy (3NF)

| Normal Form | Application |
|---|---|
| **1NF** | All columns contain atomic values. No arrays in columns (use JSONB or junction tables). No repeating groups. |
| **2NF** | All non-key columns depend on the entire primary key. Composite keys avoided (single UUID PK). |
| **3NF** | Non-key columns depend only on the primary key, not on other non-key columns. Reference data in separate lookup tables. |
| **Strategic Denormalization** | `company_name` cached in `employee_profiles` for read performance. `full_name` computed from `first_name` + `last_name`. Materialized paths for LTREE hierarchies. |

### 3.7 JSONB Usage Guidelines

```sql
-- Use JSONB for:
-- 1. Extensible metadata that varies by entity type
-- 2. Configuration objects with schema flexibility
-- 3. API response caching
-- 4. Form field definitions (dynamic schemas)

-- Avoid JSONB for:
-- 1. Frequently queried/filtered fields -> use dedicated columns
-- 2. Fields requiring foreign key constraints
-- 3. Fields that participate in joins
-- 4. Fields requiring NOT NULL constraints

-- Convention:
-- metadata     JSONB NOT NULL DEFAULT '{}'::jsonb    -- Entity-specific extension data
-- settings     JSONB NOT NULL DEFAULT '{}'::jsonb    -- Configuration objects
-- properties   JSONB NOT NULL DEFAULT '{}'::jsonb    -- Dynamic key-value pairs
```

### 3.8 Indexing Strategy

| Index Type | Use Case | Example |
|---|---|---|
| **Primary** | UUID `id` columns | `CREATE UNIQUE INDEX idx_users_id ON users(id)` |
| **Foreign Key** | All FK columns | `CREATE INDEX idx_assets_company_id ON assets(company_id)` |
| **Composite** | Multi-column WHERE clauses | `CREATE INDEX idx_assets_status_company ON assets(status, company_id)` |
| **Partial** | Filtered queries on active records | `CREATE INDEX idx_users_active ON users(email) WHERE deleted_at IS NULL` |
| **GIN** | Full-text search, JSONB, array | `CREATE INDEX idx_assets_name_search ON assets USING gin(name gin_trgm_ops)` |
| **Unique** | Business key uniqueness | `CREATE UNIQUE INDEX uq_users_email ON users(email) WHERE deleted_at IS NULL` |
| **LTREE** | Hierarchy path queries | `CREATE INDEX idx_departments_path ON departments USING gist(hierarchy_path)` |

### 3.9 Transaction Isolation

| Operation | Isolation Level | Rationale |
|---|---|---|
| Read (default) | READ COMMITTED | Sufficient for most queries |
| Write (concurrent) | SERIALIZABLE | Prevents lost updates on concurrent modifications |
| Reporting | REPEATABLE READ | Consistent snapshots for complex reports |
| Bulk Import | READ COMMITTED | Acceptable for import scenarios |

---

## 4. Core Enums

All enums are defined as PostgreSQL ENUM types in the `public` schema. This ensures type safety at the database level, reduces storage (internal integer representation), and enables efficient comparisons.

### 4.1 asset_status

```sql
CREATE TYPE asset_status AS ENUM (
  'draft',          -- Asset record created but not yet approved
  'active',         -- Asset is in service and allocated
  'available',      -- Asset is in inventory, ready for allocation
  'reserved',       -- Asset is booked but not yet allocated
  'allocated',      -- Asset is assigned to an employee/location
  'in_maintenance', -- Asset is undergoing maintenance/repair
  'retired',        -- Asset is permanently out of service
  'disposed',       -- Asset has been sold, donated, or destroyed
  'stolen',         -- Asset reported stolen
  'lost',           -- Asset cannot be located
  'write_off'       -- Asset written off for accounting purposes
);
```

| Value | Description | Valid Transitions |
|---|---|---|
| `draft` | Newly created, pending approval | -> `active`, -> `disposed` |
| `active` | In active service | -> `available`, -> `in_maintenance`, -> `retired`, -> `stolen`, -> `lost` |
| `available` | In inventory, ready for use | -> `allocated`, -> `reserved`, -> `in_maintenance`, -> `retired` |
| `reserved` | Booked by an employee | -> `allocated`, -> `available` (cancelled) |
| `allocated` | Assigned to employee/location | -> `available` (returned), -> `in_maintenance`, -> `stolen`, -> `lost` |
| `in_maintenance` | Undergoing repair/service | -> `active`, -> `available`, -> `retired`, -> `disposed` |
| `retired` | Permanently out of service | -> `disposed` |
| `disposed` | Terminal state | (no transitions) |
| `stolen` | Reported stolen | (terminal, or -> `active` if recovered) |
| `lost` | Cannot be located | (terminal, or -> `active` if found) |
| `write_off` | Accounting write-off | Terminal state |

### 4.2 allocation_status

```sql
CREATE TYPE allocation_status AS ENUM (
  'pending',       -- Allocation request submitted, awaiting approval
  'approved',      -- Allocation approved by manager
  'active',        -- Asset is currently allocated and in use
  'returned',      -- Asset has been returned by the employee
  'overdue',       -- Allocation past its expected return date
  'cancelled',     -- Allocation was cancelled before activation
  'rejected'       -- Allocation request was rejected
);
```

| Value | Description |
|---|---|
| `pending` | Request submitted, awaiting manager approval |
| `approved` | Approved, pending physical handover |
| `active` | Employee has received the asset |
| `returned` | Asset returned and checked in |
| `overdue` | Past expected return date, alerts triggered |
| `cancelled` | Employee or manager cancelled before activation |
| `rejected` | Manager rejected the allocation request |

### 4.3 booking_status

```sql
CREATE TYPE booking_status AS ENUM (
  'pending',     -- Booking request submitted
  'confirmed',   -- Booking confirmed, time slot reserved
  'active',      -- Booking is currently in effect
  'completed',   -- Booking period ended successfully
  'cancelled',   -- Booking cancelled by user or system
  'no_show'      -- User did not pick up the booked asset
);
```

### 4.4 maintenance_status

```sql
CREATE TYPE maintenance_status AS ENUM (
  'scheduled',      -- Maintenance planned for future date
  'in_progress',    -- Maintenance work is ongoing
  'on_hold',        -- Maintenance paused (parts pending, etc.)
  'completed',      -- Maintenance finished successfully
  'cancelled',      -- Maintenance cancelled
  'overdue',        -- Scheduled maintenance past due date
  'requires_review' -- Maintenance done, needs quality check
);
```

### 4.5 maintenance_type

```sql
CREATE TYPE maintenance_type AS ENUM (
  'preventive',    -- Scheduled preventive maintenance
  'corrective',    -- Repair due to breakdown or malfunction
  'predictive',    -- Triggered by condition monitoring
  'inspection',    -- Routine inspection/check
  'calibration',   -- Equipment calibration
  'upgrade',       -- Hardware/software upgrade
  'emergency'      -- Urgent unscheduled maintenance
);
```

### 4.6 audit_status

```sql
CREATE TYPE audit_status AS ENUM (
  'draft',          -- Audit plan created but not yet started
  'scheduled',      -- Audit is scheduled for a future date
  'in_progress',    -- Audit is currently being conducted
  'findings',       -- Audit complete, findings being documented
  'under_review',   -- Findings under review by management
  'remediation',    -- Corrective actions being implemented
  'closed',         -- Audit fully resolved and closed
  'cancelled'       -- Audit was cancelled
);
```

### 4.7 employee_status

```sql
CREATE TYPE employee_status AS ENUM (
  'active',        -- Currently employed
  'on_leave',      -- Temporarily on leave (medical, personal, etc.)
  'suspended',     -- Temporarily suspended
  'transferred',   -- Transferred to another department/company
  'resigned',      -- Voluntarily left
  'terminated',    -- Involuntarily separated
  'retired'        -- Retired from service
);
```

### 4.8 department_status

```sql
CREATE TYPE department_status AS ENUM (
  'active',     -- Department is operational
  'inactive',   -- Department is temporarily inactive
  'merged',     -- Department was merged into another
  'dissolved'   -- Department permanently dissolved
);
```

### 4.9 user_status

```sql
CREATE TYPE user_status AS ENUM (
  'active',          -- User account is active and usable
  'inactive',        -- User account temporarily disabled
  'suspended',       -- Account suspended (security/admin action)
  'locked',          -- Account locked due to failed login attempts
  'pending',         -- Account created but email not verified
  'deactivated'      -- Account permanently deactivated
);
```

### 4.10 notification_status

```sql
CREATE TYPE notification_status AS ENUM (
  'pending',     -- Notification queued but not yet sent
  'sent',        -- Notification dispatched to channel
  'delivered',   -- Notification confirmed delivered
  'read',        -- User has read the notification
  'failed',      -- Notification delivery failed
  'cancelled'    -- Notification was cancelled before sending
);
```

### 4.11 priority_level

```sql
CREATE TYPE priority_level AS ENUM (
  'low',        -- Non-urgent, can wait
  'medium',     -- Normal priority, standard SLA
  'high',       -- Urgent, expedited SLA
  'critical',   -- Emergency, immediate attention required
  'blocker'     -- System/blocking issue, all other work paused
);
```

### 4.12 asset_condition

```sql
CREATE TYPE asset_condition AS ENUM (
  'excellent',  -- Like new, no wear
  'good',       -- Minor cosmetic wear, fully functional
  'fair',       -- Visible wear, functional
  'poor',       -- Significant wear, may have issues
  'damaged',    -- Physical damage, needs repair
  'non_functional' -- Not working, requires repair or disposal
);
```

### 4.13 transfer_status

```sql
CREATE TYPE transfer_status AS ENUM (
  'pending',      -- Transfer request submitted
  'approved',     -- Transfer approved by authority
  'in_transit',   -- Asset physically being moved
  'completed',    -- Transfer completed, asset at new location
  'rejected',     -- Transfer request rejected
  'cancelled'     -- Transfer cancelled before execution
);
```

### 4.14 approval_status

```sql
CREATE TYPE approval_status AS ENUM (
  'pending',      -- Awaiting approval
  'approved',     -- Approved
  'rejected',     -- Rejected
  'escalated',    -- Escalated to higher authority
  'expired'       -- Approval request expired (SLA breached)
);
```

### 4.15 role_type

```sql
CREATE TYPE role_type AS ENUM (
  'system',      -- System-defined role (cannot be deleted)
  'custom',      -- User-defined role
  'template'     -- Template role (can be cloned to create custom roles)
);
```

### 4.16 permission_type

```sql
CREATE TYPE permission_type AS ENUM (
  'create',    -- Create new records
  'read',      -- View/read records
  'update',    -- Modify existing records
  'delete',    -- Soft-delete records
  'export',    -- Export data (CSV, PDF, etc.)
  'import',    -- Import data (bulk upload)
  'approve',   -- Approve requests (allocations, transfers, etc.)
  'assign',    -- Assign roles/permissions to others
  'manage',    -- Full management access to module
  'admin'      -- Administrative operations
);
```

### 4.17 Session & Auth Enums

```sql
-- Session status
CREATE TYPE session_status AS ENUM (
  'active',     -- Session is live
  'expired',    -- Session has expired
  'revoked'     -- Session was manually revoked (logout, security)
);

-- OTP purpose
CREATE TYPE otp_purpose AS ENUM (
  'login',              -- Two-factor authentication for login
  'email_verification', -- Verify email address
  'password_reset',     -- Verify identity for password reset
  'transaction'         -- High-value transaction verification
);

-- OTP channel
CREATE TYPE otp_channel AS ENUM (
  'email',    -- Sent via email
  'sms',      -- Sent via SMS
  'totp'      -- Time-based one-time password (authenticator app)
);

-- Device type
CREATE TYPE device_type AS ENUM (
  'desktop',   -- Desktop/laptop computer
  'mobile',    -- Mobile phone
  'tablet',    -- Tablet device
  'api',       -- API client (service-to-service)
  'unknown'    -- Unidentified device type
);
```

---

## 5. Module 01-06: Authentication & Authorization

> This module implements the complete identity and access management layer for AssetFlow. It provides user registration, authentication (password + OTP/MFA), session management, role-based access control (RBAC), and comprehensive security audit trails.

### Module Dependency Diagram

```
+-------------------------------------------------------------------+
|                Authentication & Authorization                     |
|                                                                    |
|  users -----------+---> user_roles ---------> roles                |
|    |              |       |                       |                 |
|    |              |       |              role_permissions           |
|    |              |       |                   |                     |
|    |              |       |              permissions                |
|    |              |                                                   |
|    +---> sessions                                                    |
|    +---> refresh_tokens                                              |
|    +---> login_history                                               |
|    +---> password_resets                                             |
|    +---> email_verifications                                         |
|    +---> otp_codes                                                   |
|    +---> device_history                                              |
+-------------------------------------------------------------------+
```

---

### 5.1 users

#### Purpose

Central identity record for every person who can authenticate to the AssetFlow system. This is the most referenced table in the entire database — almost every table has a foreign key back to `users.id` via `created_by` / `updated_by` audit columns.

#### Business Requirement

- Every employee who needs system access must have a user record.
- Email addresses must be globally unique across all companies.
- Users must be linkable to employee profiles in the Organization module.
- Passwords must be stored as bcrypt hashes (never plaintext).
- Accounts must support multi-factor authentication (MFA).
- Inactive/terminated users must be deactivated but never hard-deleted (audit trail).

#### Description

The `users` table stores authentication credentials, profile information, and account status for every system user. It serves as the identity backbone for the RBAC system and is referenced by every audit column (`created_by`, `updated_by`) across the database.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique identifier for the user |
| `email` | VARCHAR(255) | NOT NULL | — | UNIQUE, NOT NULL | Primary login identifier (globally unique) |
| `email_normalized` | VARCHAR(255) | NOT NULL | — | UNIQUE, NOT NULL | Lowercased, trimmed email for consistent lookups |
| `password_hash` | VARCHAR(255) | YES | NULL | — | Bcrypt password hash (NULL for SSO-only users) |
| `first_name` | VARCHAR(100) | NOT NULL | — | NOT NULL | User's given name |
| `last_name` | VARCHAR(100) | NOT NULL | — | NOT NULL | User's family name |
| `display_name` | VARCHAR(200) | YES | NULL | — | Computed: `first_name || ' ' || last_name`, cached |
| `phone` | VARCHAR(20) | YES | NULL | — | Contact phone number (E.164 format preferred) |
| `avatar_url` | VARCHAR(500) | YES | NULL | — | URL to profile image (S3/CDN) |
| `status` | user_status | NOT NULL | `'pending'` | NOT NULL | Current account status |
| `is_email_verified` | BOOLEAN | NOT NULL | `false` | NOT NULL | Whether email has been verified |
| `is_mfa_enabled` | BOOLEAN | NOT NULL | `false` | NOT NULL | Whether multi-factor authentication is enabled |
| `mfa_secret` | VARCHAR(255) | YES | NULL | — | TOTP secret key (encrypted at rest) |
| `mfa_backup_codes` | TEXT[] | YES | NULL | — | Encrypted backup recovery codes |
| `last_login_at` | TIMESTAMPTZ | YES | NULL | — | Timestamp of most recent successful login |
| `last_login_ip` | INET | YES | NULL | — | IP address of most recent successful login |
| `failed_login_attempts` | INTEGER | NOT NULL | `0` | — | Consecutive failed login attempts |
| `locked_until` | TIMESTAMPTZ | YES | NULL | — | Account lock expires at this timestamp |
| `password_changed_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | When password was last changed |
| `company_id` | UUID | YES | NULL | FK -> company.id | Company this user belongs to |
| `employee_profile_id` | UUID | YES | NULL | UNIQUE, FK -> employee_profiles.id | Link to employee record |
| `metadata` | JSONB | NOT NULL | `'{}'::jsonb` | — | Extensible user metadata |
| `version` | INTEGER | NOT NULL | `1` | — | Optimistic concurrency version |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp (NULL = active) |
| `created_by` | UUID | YES | NULL | FK -> users.id | User who created this record |
| `updated_by` | UUID | YES | NULL | FK -> users.id | User who last modified this record |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_users_id` | `id` | PRIMARY | — | Primary key lookup |
| `uq_users_email` | `email` | UNIQUE | `WHERE deleted_at IS NULL` | Email uniqueness |
| `uq_users_email_normalized` | `email_normalized` | UNIQUE | `WHERE deleted_at IS NULL` | Normalized email uniqueness |
| `idx_users_status` | `status` | BTREE | — | Filter by account status |
| `idx_users_company_id` | `company_id` | BTREE | — | Company-scoped user listing |
| `idx_users_employee_profile_id` | `employee_profile_id` | BTREE | — | Employee profile lookup |
| `idx_users_last_login_at` | `last_login_at` | BTREE | — | Sort by last activity |
| `idx_users_email_search` | `email_normalized` | BTREE | `WHERE deleted_at IS NULL` | Login lookup |
| `idx_users_name_search` | `first_name`, `last_name` | GIN (pg_trgm) | — | Fuzzy name search |
| `idx_users_created_at` | `created_at` | BTREE | — | Temporal queries |

#### Example Record

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "priya.sharma@acme-corp.com",
  "email_normalized": "priya.sharma@acme-corp.com",
  "password_hash": "$2b$12$LJ3m4ys3Pz0q.rZ0yQOz6eJkXH1v8aK3QxZtMpL9N4bR7yS2uVwC",
  "first_name": "Priya",
  "last_name": "Sharma",
  "display_name": "Priya Sharma",
  "phone": "+91-9876543210",
  "avatar_url": "https://cdn.assetflow.io/avatars/a1b2c3d4.jpg",
  "status": "active",
  "is_email_verified": true,
  "is_mfa_enabled": true,
  "mfa_secret": "JBSWY3DPEHPK3PXP",
  "mfa_backup_codes": ["$2b$12$encrypted_code_1", "$2b$12$encrypted_code_2"],
  "last_login_at": "2026-07-12T09:15:00.000Z",
  "last_login_ip": "192.168.1.100",
  "failed_login_attempts": 0,
  "locked_until": null,
  "password_changed_at": "2026-06-15T10:30:00.000Z",
  "company_id": "c0a80001-0000-0000-0000-000000000001",
  "employee_profile_id": "e0a1b2c3-d4e5-6789-abcd-ef1234567890",
  "metadata": {
    "language": "en",
    "timezone": "Asia/Kolkata",
    "theme": "dark",
    "notification_preferences": {
      "email": true,
      "push": true,
      "sms": false
    }
  },
  "version": 1,
  "created_at": "2026-01-15T08:00:00.000Z",
  "updated_at": "2026-07-12T09:15:00.000Z",
  "deleted_at": null,
  "created_by": null,
  "updated_by": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `email format` | Regex | Must match `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` |
| `email max length` | Length | Maximum 255 characters |
| `password min length` | Length | Minimum 8 characters when setting new password |
| `password complexity` | Policy | Must contain: 1 uppercase, 1 lowercase, 1 digit, 1 special character |
| `phone format` | Regex | E.164 format preferred: `^\+[1-9]\d{1,14}$` |
| `first_name not blank` | Not Empty | Cannot be empty or whitespace-only |
| `last_name not blank` | Not Empty | Cannot be empty or whitespace-only |
| `status valid transition` | State Machine | Status changes must follow valid transition rules |
| `lockout threshold` | Business | Account locks after 5 consecutive failed login attempts |
| `lockout duration` | Business | Account lock lasts 30 minutes |
| `password expiry` | Business | Password expires after 90 days (configurable per company) |
| `mfa required` | Policy | Admin users must enable MFA (enforced at application level) |

#### Business Rules

1. **Email is the login identifier.** There is no separate `username` field.
2. **Email normalization** is performed at write time: lowercased, trimmed of whitespace.
3. **Password hashing** uses bcrypt with cost factor 12.
4. **Account lockout** activates after 5 consecutive failed login attempts. Lockout lasts 30 minutes or until admin intervention.
5. **MFA enforcement** is configurable per company. Platform admins always require MFA.
6. **Soft-deleted users** cannot log in. The authentication middleware checks `deleted_at IS NULL`.
7. **Single session policy** (optional): Can be enforced via `sessions` table by revoking previous sessions on new login.
8. **Platform admins** have `company_id = NULL` and can access all companies.
9. **The `created_by` column** is NULL for system-seeded users, and references another user ID for admin-created accounts.
10. **Concurrent login** is permitted by default (multiple active sessions), configurable per company.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `company` | Many-to-One | `users.company_id -> company.id` | SET NULL | User belongs to a company |
| `employee_profiles` | One-to-One | `users.employee_profile_id -> employee_profiles.id` | SET NULL | Links user to employee record |
| `user_roles` | One-to-Many | `user_roles.user_id -> users.id` | CASCADE | User has many role assignments |
| `sessions` | One-to-Many | `sessions.user_id -> users.id` | CASCADE | User has many sessions |
| `refresh_tokens` | One-to-Many | `refresh_tokens.user_id -> users.id` | CASCADE | User has many refresh tokens |
| `login_history` | One-to-Many | `login_history.user_id -> users.id` | SET NULL | Login attempts logged |
| `password_resets` | One-to-Many | `password_resets.user_id -> users.id` | CASCADE | Password reset tokens |
| `email_verifications` | One-to-Many | `email_verifications.user_id -> users.id` | CASCADE | Email verification tokens |
| `otp_codes` | One-to-Many | `otp_codes.user_id -> users.id` | CASCADE | OTP codes for MFA |
| `device_history` | One-to-Many | `device_history.user_id -> users.id` | CASCADE | Login device tracking |
| All audit columns | Self-reference | `created_by -> users.id`, `updated_by -> users.id` | SET NULL | Audit trail ownership |

#### Future Expansion

| Enhancement | Description |
|---|---|
| SSO/SAML Integration | Add `sso_provider`, `sso_subject_id` columns for SAML/OIDC federation |
| Social Login | Add `oauth_provider`, `oauth_subject_id` for Google/Microsoft login |
| API Keys | Separate `api_keys` table for programmatic access tokens |
| Biometric Auth | Store biometric verification tokens in separate secure table |
| Risk Scoring | Add `risk_score` column for adaptive authentication |

#### Performance Notes

- The `email_normalized` lookup is the **hottest query** in the system (every login). The unique partial index ensures O(log n) lookup.
- `pg_trgm` GIN index on name columns enables fast autocomplete search.
- `password_hash` is only read during login — not indexed.
- Consider read replicas for login history queries at scale.

#### API Usage

| Endpoint | Method | Description |
|---|---|---|
| `POST /api/v1/auth/register` | POST | Create new user |
| `POST /api/v1/auth/login` | POST | Authenticate user (returns JWT) |
| `GET /api/v1/users/me` | GET | Get current user profile |
| `PUT /api/v1/users/:id` | PUT | Update user profile |
| `PATCH /api/v1/users/:id/status` | PATCH | Admin: change user status |
| `DELETE /api/v1/users/:id` | DELETE | Soft-delete user |
| `POST /api/v1/users/:id/mfa/enable` | POST | Enable MFA for user |
| `POST /api/v1/users/:id/mfa/disable` | POST | Disable MFA for user |

---

### 5.2 roles

#### Purpose

Defines named roles that encapsulate sets of permissions. Roles are assigned to users via the `user_roles` junction table, forming the backbone of the RBAC (Role-Based Access Control) system.

#### Business Requirement

- Every user must have at least one role to access the system.
- Roles can be system-defined (immutable) or custom (user-created).
- Roles must be scoped to a company (company-specific) or global (platform-level).
- Role names must be unique within a company scope.
- System roles cannot be deleted or renamed.
- Roles can inherit from template roles.

#### Description

The `roles` table defines authorization roles within the system. Each role represents a collection of permissions that grant specific capabilities. Roles are assigned to users and can be scoped to specific companies or departments. The RBAC model supports hierarchical role inheritance and fine-grained permission management.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique role identifier |
| `name` | VARCHAR(100) | NOT NULL | — | UNIQUE (composite) | Human-readable role name |
| `slug` | VARCHAR(100) | NOT NULL | — | UNIQUE (composite) | URL-safe identifier |
| `description` | TEXT | YES | NULL | — | Detailed description of role |
| `type` | role_type | NOT NULL | `'custom'` | NOT NULL | System-defined or user-created |
| `is_default` | BOOLEAN | NOT NULL | `false` | — | Auto-assigned to new users |
| `is_active` | BOOLEAN | NOT NULL | `true` | — | Whether role is available |
| `max_assignments` | INTEGER | YES | NULL | — | Max users that can hold this role |
| `company_id` | UUID | YES | NULL | FK -> company.id | Company scope (NULL = platform) |
| `parent_role_id` | UUID | YES | NULL | FK -> roles.id | Inherited parent role |
| `hierarchy_level` | INTEGER | NOT NULL | `0` | — | Depth in role hierarchy |
| `metadata` | JSONB | NOT NULL | `'{}'::jsonb` | — | Role-specific configuration |
| `version` | INTEGER | NOT NULL | `1` | — | Optimistic concurrency |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last update timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |
| `created_by` | UUID | YES | NULL | FK -> users.id | Creator user ID |
| `updated_by` | UUID | YES | NULL | FK -> users.id | Last modifier user ID |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_roles_id` | `id` | PRIMARY | — | Primary key |
| `uq_roles_name_company` | `name`, `company_id` | UNIQUE | `WHERE deleted_at IS NULL` | Unique name per company |
| `uq_roles_slug_company` | `slug`, `company_id` | UNIQUE | `WHERE deleted_at IS NULL` | Unique slug per company |
| `idx_roles_type` | `type` | BTREE | — | Filter by system vs custom |
| `idx_roles_company_id` | `company_id` | BTREE | — | Company-scoped listing |
| `idx_roles_parent_role_id` | `parent_role_id` | BTREE | — | Hierarchy traversal |
| `idx_roles_is_default` | `is_default` | BTREE | `WHERE is_default = true AND deleted_at IS NULL` | Find default role |
| `idx_roles_is_active` | `is_active` | BTREE | `WHERE deleted_at IS NULL` | Active roles |

#### Example Record

```json
{
  "id": "r1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "name": "Asset Manager",
  "slug": "asset-manager",
  "description": "Full management of assets including allocation, maintenance, and disposal.",
  "type": "system",
  "is_default": false,
  "is_active": true,
  "max_assignments": null,
  "company_id": "c0a80001-0000-0000-0000-000000000001",
  "parent_role_id": null,
  "hierarchy_level": 0,
  "metadata": {
    "color": "#3B82F6",
    "icon": "shield",
    "dashboard_widgets": ["asset_overview", "pending_approvals"],
    "sidebar_priority": 10
  },
  "version": 1,
  "created_at": "2026-01-15T08:00:00.000Z",
  "updated_at": "2026-01-15T08:00:00.000Z",
  "deleted_at": null,
  "created_by": null,
  "updated_by": null
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `name not blank` | Not Empty | Role name cannot be empty |
| `name max length` | Length | Maximum 100 characters |
| `slug format` | Regex | `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| `type protection` | Business | System roles cannot be deleted or have type changed |
| `no self-inheritance` | Business | `parent_role_id` cannot reference the same record |
| `circular inheritance` | Business | Role hierarchy must be a DAG (no cycles) |
| `max_assignments` | Business | Must be > 0 or NULL |
| `default unique` | Business | Only one default role per company |

#### Business Rules

1. **System roles** (type = `'system'`) are seeded during installation and cannot be deleted or renamed.
2. **Template roles** (type = `'template'`) serve as blueprints for new company role sets.
3. **Custom roles** are company-scoped and can be fully managed by company admins.
4. **Role hierarchy**: If role B inherits from role A, users with role B automatically get all permissions of role A plus B's own permissions.
5. **Default role** is automatically assigned to new users within a company.
6. **Platform-wide roles** (company_id = NULL) are available across all companies.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `company` | Many-to-One | `roles.company_id -> company.id` | SET NULL | Role belongs to a company |
| `roles` (self) | Many-to-One | `roles.parent_role_id -> roles.id` | SET NULL | Role inherits from parent |
| `user_roles` | One-to-Many | `user_roles.role_id -> roles.id` | CASCADE | Users assigned to role |
| `role_permissions` | One-to-Many | `role_permissions.role_id -> roles.id` | CASCADE | Permissions granted |

#### Future Expansion

| Enhancement | Description |
|---|---|
| Role Cloning | API to clone a role with all its permissions |
| Conditional Permissions | Permissions with time-based or attribute-based conditions |
| Role Approval Workflow | Require approval before assigning high-privilege roles |
| Role Usage Analytics | Track which roles are most/least used |

---

### 5.3 permissions

#### Purpose

Defines individual, granular permission atoms that can be combined into roles. Each permission represents a single capability (e.g., "create assets", "approve allocations") within a specific module and resource scope.

#### Business Requirement

- Permissions must be granular enough to support principle of least privilege.
- Each permission is uniquely identified by module, resource, and action.
- Permissions are never assigned directly to users — only through roles.
- New modules/resources should be easy to register as permissions.
- Permission names must be human-readable for audit log display.

#### Description

The `permissions` table is the atomic unit of the RBAC system. Each permission represents a specific action on a specific resource within a specific module. For example, `asset:asset:create` means "can create assets in the asset module." Permissions are aggregated into roles via `role_permissions`, and roles are assigned to users via `user_roles`.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique permission identifier |
| `name` | VARCHAR(200) | NOT NULL | — | UNIQUE | Human-readable name |
| `slug` | VARCHAR(200) | NOT NULL | — | UNIQUE | Machine ID: `module:resource:action` |
| `module` | VARCHAR(50) | NOT NULL | — | — | Module (e.g., `asset`, `org`) |
| `resource` | VARCHAR(50) | NOT NULL | — | — | Resource type (e.g., `asset`, `department`) |
| `action` | permission_type | NOT NULL | — | — | Allowed action |
| `description` | TEXT | YES | NULL | — | Detailed description for admin UI |
| `is_system` | BOOLEAN | NOT NULL | `true` | — | System-defined (cannot be modified) |
| `is_active` | BOOLEAN | NOT NULL | `true` | — | Whether permission is available |
| `requires_approval` | BOOLEAN | NOT NULL | `false` | — | Requires extra approval to grant |
| `metadata` | JSONB | NOT NULL | `'{}'::jsonb` | — | Additional permission config |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last update timestamp |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_permissions_id` | `id` | PRIMARY | — | Primary key |
| `uq_permissions_slug` | `slug` | UNIQUE | — | Unique permission identifier |
| `uq_permissions_name` | `name` | UNIQUE | — | Unique display name |
| `idx_permissions_module` | `module` | BTREE | — | Module-scoped listing |
| `idx_permissions_module_resource` | `module`, `resource` | BTREE | — | Composite lookup |
| `idx_permissions_module_resource_action` | `module`, `resource`, `action` | BTREE | — | Full composite lookup |
| `idx_permissions_action` | `action` | BTREE | — | Filter by permission type |
| `idx_permissions_is_active` | `is_active` | BTREE | `WHERE is_active = true` | Active permissions |

#### Example Record

```json
{
  "id": "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "name": "Create Assets",
  "slug": "asset:asset:create",
  "module": "asset",
  "resource": "asset",
  "action": "create",
  "description": "Allows creating new asset records in the asset management module",
  "is_system": true,
  "is_active": true,
  "requires_approval": false,
  "metadata": {
    "category": "core",
    "danger_level": "low",
    "requires_scoping": true
  },
  "created_at": "2026-01-15T08:00:00.000Z",
  "updated_at": "2026-01-15T08:00:00.000Z"
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `slug format` | Regex | Must match `^[a-z]+:[a-z_]+:[a-z_]+$` |
| `slug uniqueness` | UNIQUE | No two permissions share the same slug |
| `module not empty` | Not Empty | Module must be specified |
| `resource not empty` | Not Empty | Resource must be specified |
| `action valid` | Enum | Must be a valid `permission_type` value |
| `system protection` | Business | `is_system = true` permissions cannot be deleted |

#### Business Rules

1. **Permission format** follows `module:resource:action` convention (e.g., `asset:asset:create`).
2. **System permissions** are seeded at installation. Custom permissions are not supported in v1.
3. **Permissions are never assigned directly to users.** They must go through roles.
4. **Wildcard permissions**: The slug `*:*:*` represents superadmin access. Only assigned to platform admins.
5. **Scoping**: The `requires_scoping` metadata flag indicates whether the permission requires company/department-level scoping at the role level.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `role_permissions` | One-to-Many | `role_permissions.permission_id -> permissions.id` | CASCADE | Permissions assigned to roles |

#### Future Expansion

| Enhancement | Description |
|---|---|
| Custom Permissions | Allow companies to define custom permission atoms |
| Conditional Permissions | Time-based, IP-based, or attribute-based conditions |
| Permission Groups | Group related permissions for easier management |

---

### 5.4 user_roles

#### Purpose

Junction (associative) table implementing the Many-to-Many relationship between users and roles. This is the assignment table that determines which users have which roles.

#### Business Requirement

- A user can have multiple roles simultaneously.
- A role can be assigned to multiple users.
- Role assignments can be scoped to specific companies or departments.
- Temporary role assignments must support start/end dates.
- All role assignments must be audited.
- Duplicate assignments must be prevented.

#### Description

The `user_roles` table is the central junction table in the RBAC system. It resolves the Many-to-Many relationship between `users` and `roles`. Each record represents a single role assignment. The RBAC middleware reads this table (or its cached representation) on every authorization check.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique assignment identifier |
| `user_id` | UUID | NOT NULL | — | FK -> users.id, NOT NULL | User receiving the role |
| `role_id` | UUID | NOT NULL | — | FK -> roles.id, NOT NULL | Role being assigned |
| `company_id` | UUID | YES | NULL | FK -> company.id | Scope: company (NULL = platform) |
| `department_id` | UUID | YES | NULL | FK -> departments.id | Scope: department (NULL = company-wide) |
| `is_active` | BOOLEAN | NOT NULL | `true` | — | Whether assignment is active |
| `assigned_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | When role was assigned |
| `expires_at` | TIMESTAMPTZ | YES | NULL | — | When assignment auto-revokes |
| `assigned_by` | UUID | NOT NULL | — | FK -> users.id | Who made the assignment |
| `revoked_at` | TIMESTAMPTZ | YES | NULL | — | When assignment was revoked |
| `revoked_by` | UUID | YES | NULL | FK -> users.id | Who revoked the assignment |
| `revoke_reason` | TEXT | YES | NULL | — | Reason for revocation |
| `notes` | TEXT | YES | NULL | — | Additional context |
| `metadata` | JSONB | NOT NULL | `'{}'::jsonb` | — | Assignment-specific metadata |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |
| `created_by` | UUID | YES | NULL | FK -> users.id | Record creator |
| `updated_by` | UUID | YES | NULL | FK -> users.id | Last modifier |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_user_roles_id` | `id` | PRIMARY | — | Primary key |
| `uq_user_role_scope` | `user_id`, `role_id`, `company_id`, `department_id` | UNIQUE | `WHERE deleted_at IS NULL` | Prevent duplicate assignments |
| `idx_user_roles_user_id` | `user_id` | BTREE | — | Find all roles for a user |
| `idx_user_roles_role_id` | `role_id` | BTREE | — | Find all users with a role |
| `idx_user_roles_company_id` | `company_id` | BTREE | — | Company-scoped listing |
| `idx_user_roles_department_id` | `department_id` | BTREE | — | Department-scoped listing |
| `idx_user_roles_active` | `is_active` | BTREE | `WHERE is_active = true AND deleted_at IS NULL` | Active assignments |
| `idx_user_roles_expires_at` | `expires_at` | BTREE | `WHERE expires_at IS NOT NULL AND is_active = true` | Expired cleanup |
| `idx_user_roles_user_active` | `user_id`, `is_active` | BTREE | `WHERE deleted_at IS NULL` | Active roles per user |

#### Example Record

```json
{
  "id": "ur1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "role_id": "r1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "company_id": "c0a80001-0000-0000-0000-000000000001",
  "department_id": "d1a2b3c4-e5f6-7890-abcd-ef1234567890",
  "is_active": true,
  "assigned_at": "2026-03-01T10:00:00.000Z",
  "expires_at": null,
  "assigned_by": "b1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "revoked_at": null,
  "revoked_by": null,
  "revoke_reason": null,
  "notes": "Promoted to Asset Manager for IT department",
  "metadata": {
    "promotion_reason": "Annual review",
    "approved_by": "cfo@acme-corp.com"
  },
  "created_at": "2026-03-01T10:00:00.000Z",
  "updated_at": "2026-03-01T10:00:00.000Z",
  "deleted_at": null,
  "created_by": "b1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "updated_by": "b1a2b3c4-d5e6-7890-abcd-ef1234567890"
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `unique assignment` | UNIQUE | Same user cannot have same role in same scope twice |
| `valid expiration` | Business | `expires_at` must be in the future (or NULL) at assignment time |
| `revocation consistency` | Business | If `revoked_at` is set, `revoked_by` must also be set |
| `self-assignment protection` | Business | Users cannot assign roles to themselves |
| `role active check` | Business | Cannot assign a role where `roles.is_active = false` |
| `user active check` | Business | Cannot assign roles to inactive/suspended users |
| `scope validity` | Business | If `department_id` is set, `company_id` must also be set |

#### Business Rules

1. **Each assignment is scoped.** A user might be "Asset Manager" in Company A and "Viewer" in Company B.
2. **Temporary assignments** use `expires_at`. A cron job sets `is_active = false` when `expires_at < now()`.
3. **Revocation** is soft: `revoked_at` records when, `revoked_by` records who, `revoke_reason` records why.
4. **History is preserved.** Revoked assignments are never deleted.
5. **RBAC evaluation** aggregates all active role permissions for a user within the request's scope.
6. **Assignment notifications** are triggered when a new role is assigned.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `users` | Many-to-One | `user_roles.user_id -> users.id` | CASCADE | User receiving the role |
| `roles` | Many-to-One | `user_roles.role_id -> roles.id` | CASCADE | Role being assigned |
| `company` | Many-to-One | `user_roles.company_id -> company.id` | SET NULL | Scope: company |
| `departments` | Many-to-One | `user_roles.department_id -> departments.id` | SET NULL | Scope: department |
| `users` (assigned_by) | Many-to-One | `user_roles.assigned_by -> users.id` | SET NULL | Who made the assignment |
| `users` (revoked_by) | Many-to-One | `user_roles.revoked_by -> users.id` | SET NULL | Who revoked |

#### Future Expansion

| Enhancement | Description |
|---|---|
| Approval Workflow | Multi-step approval for high-privilege role assignments |
| Role Request | Users can request roles; requires approval |
| Role Rotation | Automatic role rotation for compliance |

---

### 5.5 role_permissions

#### Purpose

Junction (associative) table implementing the Many-to-Many relationship between roles and permissions. This table defines what each role is allowed to do.

#### Business Requirement

- Each role can have many permissions.
- Each permission can belong to many roles.
- Permission assignments to roles are audited.
- System role permissions can be viewed but not modified.
- Bulk permission updates for roles must be supported.

#### Description

The `role_permissions` table resolves the Many-to-Many relationship between `roles` and `permissions`. It is the second half of the RBAC authorization chain: `users -> user_roles -> roles -> role_permissions -> permissions`.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique assignment identifier |
| `role_id` | UUID | NOT NULL | — | FK -> roles.id, NOT NULL | Role receiving the permission |
| `permission_id` | UUID | NOT NULL | — | FK -> permissions.id, NOT NULL | Permission being assigned |
| `granted_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | When permission was granted |
| `granted_by` | UUID | NOT NULL | — | FK -> users.id | Who granted the permission |
| `notes` | TEXT | YES | NULL | — | Reason/context |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |
| `created_by` | UUID | YES | NULL | FK -> users.id | Record creator |
| `updated_by` | UUID | YES | NULL | FK -> users.id | Last modifier |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_role_permissions_id` | `id` | PRIMARY | — | Primary key |
| `uq_role_permission` | `role_id`, `permission_id` | UNIQUE | `WHERE deleted_at IS NULL` | Prevent duplicate assignments |
| `idx_role_permissions_role_id` | `role_id` | BTREE | — | Permissions for a role |
| `idx_role_permissions_permission_id` | `permission_id` | BTREE | — | Roles with a permission |
| `idx_role_permissions_role_active` | `role_id` | BTREE | `WHERE deleted_at IS NULL` | Active per role |

#### Example Record

```json
{
  "id": "rp1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "role_id": "r1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "permission_id": "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "granted_at": "2026-01-15T08:00:00.000Z",
  "granted_by": "b1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "notes": "Asset Manager requires create asset permission",
  "created_at": "2026-01-15T08:00:00.000Z",
  "updated_at": "2026-01-15T08:00:00.000Z",
  "deleted_at": null,
  "created_by": null,
  "updated_by": null
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `unique assignment` | UNIQUE | Same role cannot have same permission twice |
| `role active check` | Business | Cannot add permissions to inactive roles |
| `permission active check` | Business | Cannot assign inactive permissions |
| `system role protection` | Business | System role permissions can only be viewed, not modified |

#### Business Rules

1. **Permission resolution**: User's effective permissions = UNION of all permissions from all active roles within the current scope.
2. **No revocation concept**: Unlike `user_roles`, `role_permissions` are either active or soft-deleted.
3. **Bulk operations**: When editing a role's permissions, the application performs a diff-and-apply strategy.
4. **Inheritance**: If role B inherits from role A, the RBAC resolver includes role A's permissions automatically.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `roles` | Many-to-One | `role_permissions.role_id -> roles.id` | CASCADE | Permission belongs to this role |
| `permissions` | Many-to-One | `role_permissions.permission_id -> permissions.id` | CASCADE | Permission being assigned |
| `users` (granted_by) | Many-to-One | `role_permissions.granted_by -> users.id` | SET NULL | Who granted |

#### Future Expansion

| Enhancement | Description |
|---|---|
| Conditional Permissions | Add `conditions` JSONB for attribute-based access control |
| Permission Expiration | Add `expires_at` for time-limited grants |

---

### 5.6 sessions

#### Purpose

Tracks active user sessions across devices and browsers. Enables session management, forced logout, concurrent session control, and security monitoring.

#### Business Requirement

- Every authenticated session must be tracked.
- Users must be able to view and revoke their own sessions.
- Administrators must be able to revoke any user's sessions.
- Concurrent session limits must be configurable per company.
- Session tokens must be securely generated and stored.
- Expired sessions must be automatically cleaned up.

#### Description

The `sessions` table stores active authentication sessions. Each record represents a logged-in session from a specific device/browser. Sessions are validated on every API request. When a user logs out or an admin forces a session revocation, the session status changes to `revoked`.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique session identifier |
| `user_id` | UUID | NOT NULL | — | FK -> users.id, NOT NULL | User owning this session |
| `token` | VARCHAR(512) | NOT NULL | — | UNIQUE | Hashed session token |
| `token_family` | VARCHAR(100) | NOT NULL | — | — | Token family for rotation tracking |
| `status` | session_status | NOT NULL | `'active'` | — | Current session status |
| `ip_address` | INET | YES | NULL | — | Client IP address |
| `user_agent` | TEXT | YES | NULL | — | Full User-Agent string |
| `device_type` | device_type | NOT NULL | `'unknown'` | — | Detected device type |
| `device_name` | VARCHAR(200) | YES | NULL | — | Human-readable device name |
| `browser` | VARCHAR(100) | YES | NULL | — | Detected browser |
| `os` | VARCHAR(100) | YES | NULL | — | Detected OS |
| `location_city` | VARCHAR(100) | YES | NULL | — | GeoIP-derived city |
| `location_country` | VARCHAR(100) | YES | NULL | — | GeoIP-derived country |
| `started_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | When session was created |
| `last_active_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last request timestamp |
| `expires_at` | TIMESTAMPTZ | NOT NULL | — | NOT NULL | When session expires |
| `revoked_at` | TIMESTAMPTZ | YES | NULL | — | When session was revoked |
| `revoke_reason` | VARCHAR(50) | YES | NULL | — | Why session was revoked |
| `metadata` | JSONB | NOT NULL | `'{}'::jsonb` | — | Additional session metadata |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_sessions_id` | `id` | PRIMARY | — | Primary key |
| `uq_sessions_token` | `token` | UNIQUE | — | Token lookup |
| `idx_sessions_user_id` | `user_id` | BTREE | — | User's active sessions |
| `idx_sessions_status` | `status` | BTREE | — | Filter by status |
| `idx_sessions_expires_at` | `expires_at` | BTREE | `WHERE status = 'active'` | Expired cleanup |
| `idx_sessions_last_active_at` | `last_active_at` | BTREE | — | Stale session detection |
| `idx_sessions_user_active` | `user_id`, `status` | BTREE | `WHERE status = 'active'` | Active per user |
| `idx_sessions_ip_address` | `ip_address` | BTREE | — | IP security analysis |

#### Example Record

```json
{
  "id": "s1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "token": "a3f1b2c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef",
  "token_family": "family_abc123",
  "status": "active",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "device_type": "desktop",
  "device_name": "Windows Desktop - Chrome",
  "browser": "Chrome 125.0",
  "os": "Windows 10",
  "location_city": "Mumbai",
  "location_country": "IN",
  "started_at": "2026-07-12T08:00:00.000Z",
  "last_active_at": "2026-07-12T09:15:00.000Z",
  "expires_at": "2026-07-12T20:00:00.000Z",
  "revoked_at": null,
  "revoke_reason": null,
  "metadata": {
    "login_method": "password+mfa",
    "mfa_verified": true
  },
  "created_at": "2026-07-12T08:00:00.000Z",
  "updated_at": "2026-07-12T09:15:00.000Z",
  "deleted_at": null
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `token unique` | UNIQUE | Each session token must be globally unique |
| `expires_at in future` | Business | `expires_at` must be greater than `started_at` |
| `revoked consistency` | Business | If `revoked_at` is set, status must be `revoked` |
| `concurrent limit` | Business | Active sessions per user must not exceed company limit |

#### Business Rules

1. **Token storage**: Only hashed tokens are stored (SHA-256). The raw token is sent to the client.
2. **Token family**: Used for refresh token rotation. If a token from an old family is used, all sessions in that family are revoked.
3. **Heartbeat**: The `last_active_at` is updated on every API request.
4. **Concurrent sessions**: Default limit is 5 per user.
5. **Revocation reasons**: `logout`, `force_logout`, `password_change`, `security_breach`, `concurrent_limit`, `expired`.
6. **Cleanup job**: Runs every hour to delete sessions where `expires_at < now() - interval '7 days'`.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `users` | Many-to-One | `sessions.user_id -> users.id` | CASCADE | Session belongs to a user |

#### Future Expansion

| Enhancement | Description |
|---|---|
| Session Recording | Log API calls per session for forensics |
| Risk Scoring | IP/device reputation scoring |
| Push Notifications | Notify user of new login from unrecognized device |

---

### 5.7 refresh_tokens

#### Purpose

Stores refresh tokens for JWT-based authentication. Enables long-lived sessions while supporting secure token rotation and revocation.

#### Business Requirement

- Refresh tokens must support secure rotation.
- Old refresh tokens must be detectable as replay attacks.
- Refresh tokens must be revocable per-device or globally.
- Token family tracking must detect stolen refresh tokens.
- Expired tokens must be automatically cleaned up.

#### Description

The `refresh_tokens` table stores the server-side state for JWT refresh token rotation. When a user authenticates, both an access token (short-lived) and a refresh token (long-lived, stateful) are issued.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique token record identifier |
| `user_id` | UUID | NOT NULL | — | FK -> users.id, NOT NULL | Token owner |
| `session_id` | UUID | NOT NULL | — | FK -> sessions.id, NOT NULL | Associated session |
| `token_hash` | VARCHAR(512) | NOT NULL | — | UNIQUE | SHA-256 hash of refresh token |
| `token_family` | VARCHAR(100) | NOT NULL | — | — | Family for rotation tracking |
| `is_revoked` | BOOLEAN | NOT NULL | `false` | — | Whether token revoked |
| `revoked_at` | TIMESTAMPTZ | YES | NULL | — | When revoked |
| `revoke_reason` | VARCHAR(50) | YES | NULL | — | Why revoked |
| `ip_address` | INET | YES | NULL | — | IP at issuance |
| `user_agent` | TEXT | YES | NULL | — | User-Agent at issuance |
| `issued_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | When issued |
| `expires_at` | TIMESTAMPTZ | NOT NULL | — | NOT NULL | When token expires |
| `last_used_at` | TIMESTAMPTZ | YES | NULL | — | When last used for refresh |
| `use_count` | INTEGER | NOT NULL | `0` | — | Number of times used |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_refresh_tokens_id` | `id` | PRIMARY | — | Primary key |
| `uq_refresh_tokens_hash` | `token_hash` | UNIQUE | — | Token lookup |
| `idx_refresh_tokens_user_id` | `user_id` | BTREE | — | User's refresh tokens |
| `idx_refresh_tokens_session_id` | `session_id` | BTREE | — | Session's tokens |
| `idx_refresh_tokens_family` | `token_family` | BTREE | — | Family replay detection |
| `idx_refresh_tokens_expires_at` | `expires_at` | BTREE | `WHERE is_revoked = false` | Cleanup |
| `idx_refresh_tokens_user_active` | `user_id`, `is_revoked` | BTREE | `WHERE is_revoked = false` | Active per user |

#### Example Record

```json
{
  "id": "rt1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "session_id": "s1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "token_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "token_family": "family_abc123",
  "is_revoked": false,
  "revoked_at": null,
  "revoke_reason": null,
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "issued_at": "2026-07-12T08:00:00.000Z",
  "expires_at": "2026-07-19T08:00:00.000Z",
  "last_used_at": null,
  "use_count": 0,
  "created_at": "2026-07-12T08:00:00.000Z",
  "updated_at": "2026-07-12T08:00:00.000Z",
  "deleted_at": null
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `token_hash unique` | UNIQUE | Each refresh token hash globally unique |
| `expires_at in future` | Business | Token must not be pre-expired |
| `revoked consistency` | Business | If `is_revoked = true`, `revoked_at` must be set |
| `use_count non-negative` | CHECK | `use_count >= 0` |

#### Business Rules

1. **Token rotation**: On each refresh, old token revoked, new one issued with same `token_family`.
2. **Replay detection**: If a revoked token is used, all tokens in same family are revoked.
3. **Lifetime**: Refresh tokens expire after 7 days (configurable).
4. **Single-use enforcement**: After `last_used_at` is set, the token should not be reused.
5. **Global revocation**: Password changes revoke all refresh tokens for the user.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `users` | Many-to-One | `refresh_tokens.user_id -> users.id` | CASCADE | Token belongs to user |
| `sessions` | Many-to-One | `refresh_tokens.session_id -> sessions.id` | CASCADE | Token belongs to session |

---

### 5.8 login_history

#### Purpose

Comprehensive audit trail of every authentication attempt — successful or failed. Essential for security monitoring, forensic analysis, and compliance reporting.

#### Business Requirement

- Every login attempt (success or failure) must be recorded.
- Records must include IP, user agent, geolocation, and timestamp.
- Failed login attempts must be tracked for account lockout logic.
- History must be retained for at least 1 year.
- Data must be queryable by user, IP, time range, and outcome.

#### Description

The `login_history` table serves as the security audit log for authentication events. It records every attempt to authenticate along with rich contextual data for security analysis.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique record identifier |
| `user_id` | UUID | YES | NULL | FK -> users.id | User attempting login |
| `email_attempted` | VARCHAR(255) | NOT NULL | — | — | Email used in attempt |
| `was_successful` | BOOLEAN | NOT NULL | — | NOT NULL | Whether login succeeded |
| `failure_reason` | VARCHAR(100) | YES | NULL | — | Reason for failure |
| `ip_address` | INET | NOT NULL | — | NOT NULL | Client IP address |
| `user_agent` | TEXT | YES | NULL | — | Full User-Agent string |
| `device_type` | device_type | NOT NULL | `'unknown'` | — | Detected device type |
| `browser` | VARCHAR(100) | YES | NULL | — | Detected browser |
| `os` | VARCHAR(100) | YES | NULL | — | Detected OS |
| `location_city` | VARCHAR(100) | YES | NULL | — | GeoIP city |
| `location_region` | VARCHAR(100) | YES | NULL | — | GeoIP region |
| `location_country` | VARCHAR(100) | YES | NULL | — | GeoIP country |
| `latitude` | DECIMAL(10,8) | YES | NULL | — | GeoIP latitude |
| `longitude` | DECIMAL(11,8) | YES | NULL | — | GeoIP longitude |
| `mfa_attempted` | BOOLEAN | NOT NULL | `false` | — | Whether MFA attempted |
| `mfa_successful` | BOOLEAN | YES | NULL | — | MFA outcome |
| `session_id` | UUID | YES | NULL | FK -> sessions.id | Created session |
| `attempted_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | When attempt occurred |
| `response_time_ms` | INTEGER | YES | NULL | — | Auth processing time |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_login_history_id` | `id` | PRIMARY | — | Primary key |
| `idx_login_history_user_id` | `user_id` | BTREE | — | User's login history |
| `idx_login_history_email_attempted` | `email_attempted` | BTREE | — | Search by login email |
| `idx_login_history_ip_address` | `ip_address` | BTREE | — | IP security analysis |
| `idx_login_history_attempted_at` | `attempted_at` | BTREE | — | Time-range queries |
| `idx_login_history_was_successful` | `was_successful` | BTREE | — | Filter outcomes |
| `idx_login_history_user_time` | `user_id`, `attempted_at` | BTREE | — | User's recent activity |
| `idx_login_history_ip_time` | `ip_address`, `attempted_at` | BTREE | — | Brute-force detection |
| `idx_login_history_failures` | `was_successful`, `attempted_at` | BTREE | `WHERE was_successful = false` | Failed attempt analysis |

#### Example Record

```json
{
  "id": "lh1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email_attempted": "priya.sharma@acme-corp.com",
  "was_successful": true,
  "failure_reason": null,
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "device_type": "desktop",
  "browser": "Chrome 125.0",
  "os": "Windows 10",
  "location_city": "Mumbai",
  "location_region": "Maharashtra",
  "location_country": "IN",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "mfa_attempted": true,
  "mfa_successful": true,
  "session_id": "s1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "attempted_at": "2026-07-12T08:00:00.000Z",
  "response_time_ms": 245,
  "created_at": "2026-07-12T08:00:00.000Z",
  "updated_at": "2026-07-12T08:00:00.000Z"
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `failure_reason on failure` | Business | If `was_successful = false`, `failure_reason` should be set |
| `session_id on success` | Business | If `was_successful = true`, `session_id` should be set |
| `mfa consistency` | Business | If `mfa_successful` is set, `mfa_attempted` must be true |

#### Business Rules

1. **Failure reasons**: `invalid_password`, `invalid_email`, `account_locked`, `account_inactive`, `mfa_failed`, `mfa_expired`, `ip_blocked`, `rate_limited`.
2. **Brute-force detection**: If 5+ failures from same IP in 10 minutes, trigger rate limiting.
3. **Anomaly detection**: Alert on logins from new countries/devices.
4. **Data retention**: Records older than 1 year are archived, 2+ years are purged.
5. **No soft delete**: This table uses hard delete for retention policy (no `deleted_at`).
6. **Read-only**: This table is append-only; no updates after creation.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `users` | Many-to-One | `login_history.user_id -> users.id` | SET NULL | Login attempt by user |
| `sessions` | Many-to-One | `login_history.session_id -> sessions.id` | SET NULL | Created session |

---

### 5.9 password_resets

#### Purpose

Manages password reset tokens issued when users forget their passwords. Tokens are single-use, time-limited, and fully audited.

#### Business Requirement

- Password reset tokens must be cryptographically random and single-use.
- Tokens must expire after a short period (default: 15 minutes).
- Reset attempts must be rate-limited.
- Password change must invalidate all existing sessions.
- Old password must not be reusable for a configurable period.

#### Description

The `password_resets` table stores tokens for the password reset workflow. When a user requests a reset, a token is generated, stored as a hash, and sent to the user's email. The user must present this token within the expiry window to set a new password.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique record identifier |
| `user_id` | UUID | NOT NULL | — | FK -> users.id, NOT NULL | User requesting reset |
| `token_hash` | VARCHAR(512) | NOT NULL | — | UNIQUE | SHA-256 hash of reset token |
| `email_sent_to` | VARCHAR(255) | NOT NULL | — | — | Email the token was sent to |
| `is_used` | BOOLEAN | NOT NULL | `false` | — | Whether token has been consumed |
| `used_at` | TIMESTAMPTZ | YES | NULL | — | When token was used |
| `ip_address` | INET | YES | NULL | — | IP of the requester |
| `user_agent` | TEXT | YES | NULL | — | User-Agent of the requester |
| `expires_at` | TIMESTAMPTZ | NOT NULL | — | NOT NULL | Token expiry (15 min default) |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | When reset was requested |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_password_resets_id` | `id` | PRIMARY | — | Primary key |
| `uq_password_resets_hash` | `token_hash` | UNIQUE | — | Token lookup |
| `idx_password_resets_user_id` | `user_id` | BTREE | — | User's reset history |
| `idx_password_resets_expires_at` | `expires_at` | BTREE | `WHERE is_used = false` | Cleanup |
| `idx_password_resets_user_active` | `user_id`, `is_used` | BTREE | `WHERE is_used = false` | Active per user |

#### Example Record

```json
{
  "id": "pr1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "token_hash": "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
  "email_sent_to": "priya.sharma@acme-corp.com",
  "is_used": false,
  "used_at": null,
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "expires_at": "2026-07-12T08:15:00.000Z",
  "created_at": "2026-07-12T08:00:00.000Z",
  "updated_at": "2026-07-12T08:00:00.000Z",
  "deleted_at": null
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `token unique` | UNIQUE | Each token hash globally unique |
| `expires_at > now()` | Business | Token must not be pre-expired |
| `used consistency` | Business | If `is_used = true`, `used_at` must be set |
| `rate limit` | Business | Max 3 reset requests per user per hour |

#### Business Rules

1. **Token generation**: 32 bytes of cryptographic randomness, base64url-encoded.
2. **Token lifetime**: 15 minutes (configurable).
3. **Single-use**: Once used, the token is marked and cannot be reused.
4. **Session invalidation**: On successful password reset, all existing sessions and refresh tokens for the user are revoked.
5. **Password history**: The last 5 password hashes are retained to prevent reuse.
6. **Notification**: An email is sent to the user confirming the password change.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `users` | Many-to-One | `password_resets.user_id -> users.id` | CASCADE | Reset belongs to user |

#### Future Expansion

| Enhancement | Description |
|---|---|
| Password History Table | Track previous password hashes for reuse prevention |
| Admin Reset | Allow admins to force-reset user passwords |
| Reset Questions | Security questions as additional verification |

---

### 5.10 email_verifications

#### Purpose

Manages email verification tokens for verifying user email addresses during registration or after email changes.

#### Business Requirement

- New users must verify their email before gaining full access.
- Email changes require re-verification of the new address.
- Tokens must be single-use and time-limited.
- Verification must be rate-limited to prevent email bombing.

#### Description

The `email_verifications` table stores tokens for the email verification workflow. When a user registers or changes their email, a verification token is generated and sent to the email address.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique record identifier |
| `user_id` | UUID | NOT NULL | — | FK -> users.id, NOT NULL | User verifying email |
| `token_hash` | VARCHAR(512) | NOT NULL | — | UNIQUE | SHA-256 hash of verification token |
| `email` | VARCHAR(255) | NOT NULL | — | NOT NULL | Email being verified |
| `is_verified` | BOOLEAN | NOT NULL | `false` | — | Whether email was verified |
| `verified_at` | TIMESTAMPTZ | YES | NULL | — | When email was verified |
| `verified_ip` | INET | YES | NULL | — | IP used during verification |
| `expires_at` | TIMESTAMPTZ | NOT NULL | — | NOT NULL | Token expiry (24 hours default) |
| `attempt_count` | INTEGER | NOT NULL | `0` | — | Number of verification attempts |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_email_verifications_id` | `id` | PRIMARY | — | Primary key |
| `uq_email_verifications_hash` | `token_hash` | UNIQUE | — | Token lookup |
| `idx_email_verifications_user_id` | `user_id` | BTREE | — | User's verification records |
| `idx_email_verifications_email` | `email` | BTREE | — | Email lookup |
| `idx_email_verifications_expires` | `expires_at` | BTREE | `WHERE is_verified = false` | Cleanup |

#### Example Record

```json
{
  "id": "ev1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "token_hash": "f0e1d2c3b4a5968778695a4b3c2d1e0ff0e1d2c3b4a5968778695a4b3c2d1e0f",
  "email": "priya.sharma@acme-corp.com",
  "is_verified": true,
  "verified_at": "2026-01-15T08:30:00.000Z",
  "verified_ip": "192.168.1.100",
  "expires_at": "2026-01-16T08:00:00.000Z",
  "attempt_count": 1,
  "created_at": "2026-01-15T08:00:00.000Z",
  "updated_at": "2026-01-15T08:30:00.000Z",
  "deleted_at": null
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `token unique` | UNIQUE | Each token hash globally unique |
| `email format` | Regex | Must be valid email format |
| `attempt limit` | Business | Max 5 verification attempts per token |
| `rate limit` | Business | Max 3 requests per email per hour |

#### Business Rules

1. **Token lifetime**: 24 hours (configurable).
2. **Verification flow**: User clicks link -> token validated -> `is_email_verified` set to `true` on `users`.
3. **Email change flow**: New email verification required before updating `users.email`.
4. **Auto-deactivation**: Users who do not verify within 7 days may be auto-deactivated.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `users` | Many-to-One | `email_verifications.user_id -> users.id` | CASCADE | Verification belongs to user |

---

### 5.11 otp_codes

#### Purpose

Stores one-time password (OTP) codes for multi-factor authentication, email verification, and transaction verification.

#### Business Requirement

- OTP codes must be cryptographically random and time-limited.
- Maximum verification attempts must be enforced (typically 3).
- OTPs must support multiple delivery channels (email, SMS, TOTP).
- Used OTPs must be tracked to prevent reuse.
- Rate limiting must prevent OTP bombing.

#### Description

The `otp_codes` table stores one-time passwords used for multi-factor authentication and identity verification. OTPs are short-lived (5 minutes), single-use, and limited to 3 verification attempts.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique record identifier |
| `user_id` | UUID | NOT NULL | — | FK -> users.id, NOT NULL | OTP recipient |
| `code_hash` | VARCHAR(255) | NOT NULL | — | — | SHA-256 hash of the OTP code |
| `code_digits` | INTEGER | NOT NULL | `6` | — | Number of digits |
| `purpose` | otp_purpose | NOT NULL | — | NOT NULL | Purpose of the OTP |
| `channel` | otp_channel | NOT NULL | — | NOT NULL | Delivery channel |
| `is_used` | BOOLEAN | NOT NULL | `false` | — | Whether OTP was used |
| `used_at` | TIMESTAMPTZ | YES | NULL | — | When OTP was consumed |
| `is_expired` | BOOLEAN | NOT NULL | `false` | — | Whether OTP expired |
| `expired_at` | TIMESTAMPTZ | YES | NULL | — | When OTP expired |
| `attempt_count` | INTEGER | NOT NULL | `0` | — | Verification attempts |
| `max_attempts` | INTEGER | NOT NULL | `3` | — | Maximum allowed attempts |
| `ip_address` | INET | YES | NULL | — | IP of the requester |
| `delivered_at` | TIMESTAMPTZ | YES | NULL | — | When OTP was delivered |
| `delivery_status` | VARCHAR(50) | YES | NULL | — | Channel delivery status |
| `expires_at` | TIMESTAMPTZ | NOT NULL | — | NOT NULL | OTP expiry (5 min default) |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_otp_codes_id` | `id` | PRIMARY | — | Primary key |
| `idx_otp_codes_user_id` | `user_id` | BTREE | — | User's OTP history |
| `idx_otp_codes_user_active` | `user_id`, `is_used` | BTREE | `WHERE is_used = false AND is_expired = false` | Active OTPs |
| `idx_otp_codes_purpose` | `purpose` | BTREE | — | Filter by purpose |
| `idx_otp_codes_expires_at` | `expires_at` | BTREE | `WHERE is_used = false` | Expiration cleanup |

#### Example Record

```json
{
  "id": "otp1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "code_hash": "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
  "code_digits": 6,
  "purpose": "login",
  "channel": "email",
  "is_used": false,
  "used_at": null,
  "is_expired": false,
  "expired_at": null,
  "attempt_count": 0,
  "max_attempts": 3,
  "ip_address": "192.168.1.100",
  "delivered_at": "2026-07-12T08:00:01.000Z",
  "delivery_status": "delivered",
  "expires_at": "2026-07-12T08:05:00.000Z",
  "created_at": "2026-07-12T08:00:00.000Z",
  "updated_at": "2026-07-12T08:00:01.000Z",
  "deleted_at": null
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `attempt limit` | Business | Cannot verify after `max_attempts` exceeded |
| `single use` | Business | Cannot use OTP after `is_used = true` |
| `expiry check` | Business | Cannot use OTP after `expires_at` |
| `rate limit` | Business | Max 3 OTP requests per user per 10 minutes |

#### Business Rules

1. **Code generation**: Numeric OTP, 6 digits by default. Stored as SHA-256 hash.
2. **Lifetime**: 5 minutes for login MFA, 10 minutes for password reset, 24 hours for email verification.
3. **Attempt limiting**: After `max_attempts` (default 3), the OTP is marked as expired.
4. **Delivery tracking**: The system tracks whether the OTP was successfully delivered.
5. **Cleanup**: Expired OTPs are purged after 24 hours.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `users` | Many-to-One | `otp_codes.user_id -> users.id` | CASCADE | OTP belongs to user |

---

### 5.12 device_history

#### Purpose

Tracks all devices used by users to access the system. Enables device-based security policies, anomaly detection, and user device management.

#### Business Requirement

- Every unique device must be recorded.
- Device information includes type, OS, browser, and IP.
- Users must be able to view and revoke trusted devices.
- New devices must trigger a notification.
- Device fingerprinting must be supported.

#### Description

The `device_history` table maintains a record of every device used to access the AssetFlow system. It enables the system to recognize trusted devices, detect unauthorized access, and enforce device-based security policies.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique record identifier |
| `user_id` | UUID | NOT NULL | — | FK -> users.id, NOT NULL | Device owner |
| `device_fingerprint` | VARCHAR(255) | NOT NULL | — | UNIQUE (composite) | Browser/device fingerprint |
| `device_type` | device_type | NOT NULL | `'unknown'` | — | Device type category |
| `device_name` | VARCHAR(200) | YES | NULL | — | Human-readable name |
| `os` | VARCHAR(100) | NOT NULL | — | — | Operating system |
| `os_version` | VARCHAR(50) | YES | NULL | — | OS version |
| `browser` | VARCHAR(100) | NOT NULL | — | — | Browser name |
| `browser_version` | VARCHAR(50) | YES | NULL | — | Browser version |
| `is_trusted` | BOOLEAN | NOT NULL | `false` | — | Whether device is trusted |
| `trusted_at` | TIMESTAMPTZ | YES | NULL | — | When marked trusted |
| `is_blocked` | BOOLEAN | NOT NULL | `false` | — | Whether device is blocked |
| `blocked_at` | TIMESTAMPTZ | YES | NULL | — | When blocked |
| `first_seen_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | First login from this device |
| `last_seen_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Most recent login |
| `login_count` | INTEGER | NOT NULL | `1` | — | Total logins from device |
| `last_ip_address` | INET | YES | NULL | — | Most recent IP |
| `last_location_city` | VARCHAR(100) | YES | NULL | — | Last known city |
| `last_location_country` | VARCHAR(100) | YES | NULL | — | Last known country |
| `metadata` | JSONB | NOT NULL | `'{}'::jsonb` | — | Additional device metadata |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_device_history_id` | `id` | PRIMARY | — | Primary key |
| `uq_device_fingerprint_user` | `device_fingerprint`, `user_id` | UNIQUE | `WHERE deleted_at IS NULL` | Unique device per user |
| `idx_device_history_user_id` | `user_id` | BTREE | — | User's device list |
| `idx_device_history_last_seen_at` | `last_seen_at` | BTREE | — | Stale device cleanup |
| `idx_device_history_is_trusted` | `is_trusted` | BTREE | `WHERE is_trusted = true` | Trusted devices |
| `idx_device_history_is_blocked` | `is_blocked` | BTREE | `WHERE is_blocked = true` | Blocked devices |

#### Example Record

```json
{
  "id": "dh1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "device_fingerprint": "fp_abc123def456ghi789jkl012mno345pqr678stu901",
  "device_type": "desktop",
  "device_name": "Windows Desktop - Chrome",
  "os": "Windows 10",
  "os_version": "10.0.19045",
  "browser": "Chrome",
  "browser_version": "125.0.6422.112",
  "is_trusted": true,
  "trusted_at": "2026-03-15T10:00:00.000Z",
  "is_blocked": false,
  "blocked_at": null,
  "first_seen_at": "2026-01-15T08:00:00.000Z",
  "last_seen_at": "2026-07-12T09:15:00.000Z",
  "login_count": 127,
  "last_ip_address": "192.168.1.100",
  "last_location_city": "Mumbai",
  "last_location_country": "IN",
  "metadata": {
    "screen_resolution": "1920x1080",
    "timezone": "Asia/Kolkata",
    "language": "en-US"
  },
  "created_at": "2026-01-15T08:00:00.000Z",
  "updated_at": "2026-07-12T09:15:00.000Z",
  "deleted_at": null
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `unique device per user` | UNIQUE | Same fingerprint cannot exist twice for same user |
| `trusted consistency` | Business | If `is_trusted = true`, `trusted_at` should be set |
| `blocked consistency` | Business | If `is_blocked = true`, `blocked_at` should be set |
| `blocked not trusted` | Business | Device cannot be both trusted and blocked |

#### Business Rules

1. **Device fingerprinting**: Generated from browser attributes (canvas, WebGL, screen resolution, timezone).
2. **Trust workflow**: After successful login from a new device, user can choose to trust it.
3. **Blocked devices**: Blocked devices are rejected at login. Used for stolen device scenarios.
4. **New device notification**: When a login comes from an unrecognized device, a notification is sent.
5. **Cleanup**: Devices not seen in 90 days are soft-deleted.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `users` | Many-to-One | `device_history.user_id -> users.id` | CASCADE | Device belongs to user |

#### Future Expansion

| Enhancement | Description |
|---|---|
| Device Compliance | Check device health (OS version, antivirus) |
| MDM Integration | Mobile Device Management integration |
| Device Groups | Group devices for bulk management |

---

## 6. Module 07-14: Organization Structure

> This module defines the organizational hierarchy of companies, physical locations, and employee records. It provides the structural backbone for asset scoping, departmental reporting, and employee lifecycle management.

### Module Dependency Diagram

```
+-------------------------------------------------------------------+
|                    Organization Structure                           |
|                                                                    |
|  +----------+                                                      |
|  | company  |<---------------------------+                         |
|  +----+-----+                             |                         |
|       |                                   |                         |
|       +---> offices --> buildings --> floors                        |
|       |                                   |                         |
|       +---> departments --> department_                            |
|       |                   hierarchy                                |
|       |                                                            |
|       +---> locations (references offices,                         |
|       |              buildings, floors)                             |
|       |                                                            |
|       +---> employee_profiles                                      |
|              (references users, departments,                       |
|               locations, companies)                                 |
+-------------------------------------------------------------------+
```

---

### 6.1 company

#### Purpose

Represents a legal entity or business unit within the system. The top-level organizational entity. All data in the system is scoped to a company (except platform-level records).

#### Business Requirement

- Each company is an independent legal entity with its own assets, employees, and settings.
- The system must support multiple companies (multi-tenant).
- Company records must include registration details for compliance.
- Each company has independent configuration (timezone, currency, policies).
- Platform administrators can access all companies.

#### Description

The `company` table is the root of the organizational hierarchy. Every other entity in the system (assets, employees, departments, etc.) is scoped to a company. This table stores legal entity information, configuration settings, and company-level metadata. The system supports full multi-tenancy with data isolation per company.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique company identifier |
| `name` | VARCHAR(200) | NOT NULL | — | UNIQUE | Legal company name |
| `slug` | VARCHAR(100) | NOT NULL | — | UNIQUE | URL-safe identifier (e.g., `acme-corp`) |
| `legal_name` | VARCHAR(300) | YES | NULL | — | Full legal entity name |
| `registration_number` | VARCHAR(100) | YES | NULL | UNIQUE | Company registration/tax ID |
| `tax_id` | VARCHAR(100) | YES | NULL | — | Tax identification number |
| `industry` | VARCHAR(100) | YES | NULL | — | Industry classification |
| `logo_url` | VARCHAR(500) | YES | NULL | — | Company logo (S3/CDN URL) |
| `website` | VARCHAR(500) | YES | NULL | — | Company website |
| `email` | VARCHAR(255) | YES | NULL | — | Company contact email |
| `phone` | VARCHAR(20) | YES | NULL | — | Company contact phone |
| `address_line1` | VARCHAR(300) | YES | NULL | — | Registered address line 1 |
| `address_line2` | VARCHAR(300) | YES | NULL | — | Registered address line 2 |
| `city` | VARCHAR(100) | YES | NULL | — | City |
| `state` | VARCHAR(100) | YES | NULL | — | State/Province |
| `country` | VARCHAR(100) | NOT NULL | — | NOT NULL | Country (ISO 3166-1 alpha-2) |
| `postal_code` | VARCHAR(20) | YES | NULL | — | Postal/ZIP code |
| `timezone` | VARCHAR(50) | NOT NULL | `'UTC'` | — | Default timezone (IANA format) |
| `currency` | VARCHAR(3) | NOT NULL | `'USD'` | — | Default currency (ISO 4217) |
| `fiscal_year_start_month` | INTEGER | NOT NULL | `1` | — | Month fiscal year starts (1-12) |
| `fiscal_year_start_day` | INTEGER | NOT NULL | `1` | — | Day fiscal year starts |
| `phone_prefix` | VARCHAR(5) | YES | NULL | — | Default phone country code |
| `date_format` | VARCHAR(20) | NOT NULL | `'YYYY-MM-DD'` | — | Default date format |
| `max_employees` | INTEGER | YES | NULL | — | License limit (NULL = unlimited) |
| `max_assets` | INTEGER | YES | NULL | — | License limit (NULL = unlimited) |
| `is_active` | BOOLEAN | NOT NULL | `true` | — | Whether company is active |
| `subscription_plan` | VARCHAR(50) | NOT NULL | `'free'` | — | Current subscription tier |
| `subscription_expires_at` | TIMESTAMPTZ | YES | NULL | — | When subscription expires |
| `settings` | JSONB | NOT NULL | `'{}'::jsonb` | — | Company-specific configuration |
| `features` | JSONB | NOT NULL | `'{}'::jsonb` | — | Enabled feature flags |
| `metadata` | JSONB | NOT NULL | `'{}'::jsonb` | — | Extensible metadata |
| `version` | INTEGER | NOT NULL | `1` | — | Optimistic concurrency |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |
| `created_by` | UUID | YES | NULL | FK -> users.id | Creator (NULL for system) |
| `updated_by` | UUID | YES | NULL | FK -> users.id | Last modifier |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_company_id` | `id` | PRIMARY | — | Primary key |
| `uq_company_name` | `name` | UNIQUE | `WHERE deleted_at IS NULL` | Unique company name |
| `uq_company_slug` | `slug` | UNIQUE | `WHERE deleted_at IS NULL` | Unique slug |
| `uq_company_registration` | `registration_number` | UNIQUE | `WHERE deleted_at IS NULL AND registration_number IS NOT NULL` | Unique registration |
| `idx_company_is_active` | `is_active` | BTREE | `WHERE deleted_at IS NULL` | Active companies |
| `idx_company_country` | `country` | BTREE | — | Country-based queries |
| `idx_company_industry` | `industry` | BTREE | — | Industry queries |
| `idx_company_created_at` | `created_at` | BTREE | — | Temporal ordering |

#### Example Record

```json
{
  "id": "c0a80001-0000-0000-0000-000000000001",
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "legal_name": "Acme Corporation Private Limited",
  "registration_number": "U72200MH2020PTC123456",
  "tax_id": "27AABCA1234C1Z5",
  "industry": "Information Technology",
  "logo_url": "https://cdn.assetflow.io/logos/acme-corp.png",
  "website": "https://www.acme-corp.com",
  "email": "info@acme-corp.com",
  "phone": "+91-22-1234-5678",
  "address_line1": "15th Floor, Bandra Kurla Complex",
  "address_line2": "Tower B, Unit 1501-1505",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "IN",
  "postal_code": "400051",
  "timezone": "Asia/Kolkata",
  "currency": "INR",
  "fiscal_year_start_month": 4,
  "fiscal_year_start_day": 1,
  "phone_prefix": "+91",
  "date_format": "DD/MM/YYYY",
  "max_employees": 5000,
  "max_assets": 50000,
  "is_active": true,
  "subscription_plan": "enterprise",
  "subscription_expires_at": "2027-01-15T00:00:00.000Z",
  "settings": {
    "asset_tag_prefix": "ACM",
    "auto_asset_tag": true,
    "require_mfa": true,
    "password_expiry_days": 90,
    "session_timeout_minutes": 480,
    "max_concurrent_sessions": 5,
    "approval_workflow": true,
    "audit_retention_days": 2555
  },
  "features": {
    "maintenance": true,
    "procurement": true,
    "audit": true,
    "booking": true,
    "advanced_reporting": true,
    "api_access": true,
    "sso": false
  },
  "metadata": {
    "founded_year": 2020,
    "employee_count": 2500,
    "offices_count": 5
  },
  "version": 1,
  "created_at": "2026-01-15T08:00:00.000Z",
  "updated_at": "2026-06-01T12:00:00.000Z",
  "deleted_at": null,
  "created_by": null,
  "updated_by": null
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `name not empty` | Not Empty | Company name cannot be blank |
| `slug format` | Regex | `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| `country required` | Not Null | Country must be specified |
| `currency valid` | ISO 4217 | Must be valid ISO 4217 currency code |
| `timezone valid` | IANA | Must be valid IANA timezone |
| `fiscal_year_start_month` | CHECK | Between 1 and 12 |
| `fiscal_year_start_day` | CHECK | Between 1 and 31 |
| `max_employees` | CHECK | Must be > 0 or NULL |
| `max_assets` | CHECK | Must be > 0 or NULL |
| `email format` | Regex | Must be valid email (if provided) |
| `website format` | URL | Must be valid URL (if provided) |

#### Business Rules

1. **Multi-tenancy**: All data is scoped to a company. Platform admins (company_id = NULL) access all companies.
2. **License limits**: `max_employees` and `max_assets` enforce subscription limits. Application checks before creating records.
3. **Fiscal year**: `fiscal_year_start_month` and `fiscal_year_start_day` define the company's fiscal year for reporting.
4. **Settings cascade**: Company settings serve as defaults. Departments/locations can override specific settings.
5. **Soft delete**: Soft-deleting a company cascades to all associated records (via application logic).
6. **Subscription**: `subscription_plan` and `subscription_expires_at` control feature access.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `offices` | One-to-Many | `offices.company_id -> company.id` | SET NULL | Company has many offices |
| `departments` | One-to-Many | `departments.company_id -> company.id` | SET NULL | Company has many departments |
| `employee_profiles` | One-to-Many | `employee_profiles.company_id -> company.id` | SET NULL | Company has many employees |
| `locations` | One-to-Many | `locations.company_id -> company.id` | SET NULL | Company has many locations |
| `users` | One-to-Many | `users.company_id -> company.id` | SET NULL | Company has many users |
| `roles` | One-to-Many | `roles.company_id -> company.id` | SET NULL | Company-scoped roles |
| `buildings` | One-to-Many | `buildings.company_id -> company.id` | SET NULL | Company has many buildings |

#### Future Expansion

| Enhancement | Description |
|---|---|
| Company Groups | Parent-child company relationships for conglomerates |
| Multi-Currency | Per-transaction currency conversion support |
| Company Templates | Pre-configured setups for onboarding |
| API Rate Limiting | Per-company API rate limits |
| Data Residency | Country-based data storage requirements |

---

### 6.2 offices

#### Purpose

Represents physical office locations owned or leased by a company. Offices are the primary grouping for buildings, floors, and locations.

#### Business Requirement

- Each company can have multiple offices across different cities/countries.
- Offices must include address and contact information.
- Each office can have one or more buildings.
- Offices must support timezone overrides for regional operations.

#### Description

The `offices` table defines the top-level physical location within a company. An office represents a distinct physical premises — typically in a single city or campus. Buildings, floors, and granular locations are children of an office.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique office identifier |
| `name` | VARCHAR(200) | NOT NULL | — | — | Office name (e.g., "Mumbai HQ") |
| `code` | VARCHAR(20) | NOT NULL | — | UNIQUE (composite) | Short office code (e.g., "MUM-HQ") |
| `description` | TEXT | YES | NULL | — | Office description |
| `company_id` | UUID | NOT NULL | — | FK -> company.id, NOT NULL | Owning company |
| `address_line1` | VARCHAR(300) | NOT NULL | — | NOT NULL | Street address line 1 |
| `address_line2` | VARCHAR(300) | YES | NULL | — | Street address line 2 |
| `city` | VARCHAR(100) | NOT NULL | — | NOT NULL | City |
| `state` | VARCHAR(100) | YES | NULL | — | State/Province |
| `country` | VARCHAR(100) | NOT NULL | — | NOT NULL | Country |
| `postal_code` | VARCHAR(20) | YES | NULL | — | Postal/ZIP code |
| `latitude` | DECIMAL(10,8) | YES | NULL | — | Geographic latitude |
| `longitude` | DECIMAL(11,8) | YES | NULL | — | Geographic longitude |
| `timezone` | VARCHAR(50) | NOT NULL | `'UTC'` | — | Office timezone |
| `phone` | VARCHAR(20) | YES | NULL | — | Office phone |
| `email` | VARCHAR(255) | YES | NULL | — | Office contact email |
| `is_headquarters` | BOOLEAN | NOT NULL | `false` | — | Whether this is HQ |
| `is_active` | BOOLEAN | NOT NULL | `true` | — | Whether office is operational |
| `opening_date` | DATE | YES | NULL | — | When office was opened |
| `total_area_sqft` | DECIMAL(12,2) | YES | NULL | — | Total area in sq ft |
| `metadata` | JSONB | NOT NULL | `'{}'::jsonb` | — | Extensible metadata |
| `version` | INTEGER | NOT NULL | `1` | — | Optimistic concurrency |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |
| `created_by` | UUID | YES | NULL | FK -> users.id | Creator |
| `updated_by` | UUID | YES | NULL | FK -> users.id | Last modifier |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_offices_id` | `id` | PRIMARY | — | Primary key |
| `uq_offices_code_company` | `code`, `company_id` | UNIQUE | `WHERE deleted_at IS NULL` | Unique code per company |
| `idx_offices_company_id` | `company_id` | BTREE | — | Company's offices |
| `idx_offices_country` | `country` | BTREE | — | Country queries |
| `idx_offices_city` | `city` | BTREE | — | City queries |
| `idx_offices_is_headquarters` | `is_headquarters` | BTREE | `WHERE is_headquarters = true` | Find HQ |
| `idx_offices_is_active` | `is_active` | BTREE | `WHERE deleted_at IS NULL` | Active offices |

#### Example Record

```json
{
  "id": "off1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "name": "Mumbai Headquarters",
  "code": "MUM-HQ",
  "description": "Main corporate headquarters in Bandra Kurla Complex, Mumbai",
  "company_id": "c0a80001-0000-0000-0000-000000000001",
  "address_line1": "15th Floor, Tower B",
  "address_line2": "Bandra Kurla Complex",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "IN",
  "postal_code": "400051",
  "latitude": 19.0596,
  "longitude": 72.8656,
  "timezone": "Asia/Kolkata",
  "phone": "+91-22-1234-5678",
  "email": "mumbai-office@acme-corp.com",
  "is_headquarters": true,
  "is_active": true,
  "opening_date": "2020-06-01",
  "total_area_sqft": 25000.00,
  "metadata": {
    "floor_count": 5,
    "parking_spaces": 200,
    "cafeteria": true,
    "gym": true,
    "emergency_contact": "+91-22-9999-0000"
  },
  "version": 1,
  "created_at": "2026-01-15T08:00:00.000Z",
  "updated_at": "2026-01-15T08:00:00.000Z",
  "deleted_at": null,
  "created_by": null,
  "updated_by": null
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `name not empty` | Not Empty | Office name required |
| `code format` | Regex | `^[A-Z]{2,5}(-[A-Z0-9]+)*$` |
| `address required` | Not Empty | `address_line1` and `city` required |
| `country required` | Not Null | Must specify country |
| `timezone valid` | IANA | Must be valid IANA timezone |
| `single hq per company` | Business | Only one HQ per company |

#### Business Rules

1. **Headquarters**: Each company has exactly one headquarters (`is_headquarters = true`).
2. **Timezone override**: Office timezone overrides company timezone for location-specific operations.
3. **Geocoding**: Latitude/longitude auto-populated from address via geocoding API.
4. **Asset scoping**: Assets can be scoped to offices for location-based reporting.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `company` | Many-to-One | `offices.company_id -> company.id` | SET NULL | Office belongs to company |
| `buildings` | One-to-Many | `buildings.office_id -> offices.id` | SET NULL | Office has many buildings |
| `employee_profiles` | One-to-Many | `employee_profiles.office_id -> offices.id` | SET NULL | Employees in office |
| `locations` | One-to-Many | `locations.office_id -> offices.id` | SET NULL | Locations in office |

#### Future Expansion

| Enhancement | Description |
|---|---|
| Office Capacity | Maximum occupancy tracking |
| Office Hours | Operating hours configuration |
| Map Integration | Google Maps/Apple Maps integration |
| Parking Management | Parking space allocation |

---

### 6.3 buildings

#### Purpose

Represents a physical building within an office campus or complex. Buildings group floors and provide structural organization for large campuses.

#### Business Requirement

- An office can have one or more buildings.
- Buildings must have identification (name, code, address).
- Each building contains one or more floors.
- Building-level metadata (year built, total floors) must be tracked.

#### Description

The `buildings` table represents a distinct physical building structure within an office. This allows large campuses with multiple buildings to properly organize their physical infrastructure. Each building has a code, address details, and contains multiple floors.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique building identifier |
| `name` | VARCHAR(200) | NOT NULL | — | — | Building name |
| `code` | VARCHAR(20) | NOT NULL | — | UNIQUE (composite) | Short building code |
| `description` | TEXT | YES | NULL | — | Building description |
| `company_id` | UUID | NOT NULL | — | FK -> company.id, NOT NULL | Owning company |
| `office_id` | UUID | NOT NULL | — | FK -> offices.id, NOT NULL | Parent office |
| `address_line1` | VARCHAR(300) | YES | NULL | — | Building-specific address |
| `address_line2` | VARCHAR(300) | YES | NULL | — | Address line 2 |
| `city` | VARCHAR(100) | YES | NULL | — | City |
| `state` | VARCHAR(100) | YES | NULL | — | State/Province |
| `country` | VARCHAR(100) | YES | NULL | — | Country |
| `postal_code` | VARCHAR(20) | YES | NULL | — | Postal code |
| `latitude` | DECIMAL(10,8) | YES | NULL | — | Building latitude |
| `longitude` | DECIMAL(11,8) | YES | NULL | — | Building longitude |
| `total_floors` | INTEGER | NOT NULL | `1` | — | Total number of floors |
| `year_built` | INTEGER | YES | NULL | — | Year building was constructed |
| `total_area_sqft` | DECIMAL(12,2) | YES | NULL | — | Total area in sq ft |
| `is_active` | BOOLEAN | NOT NULL | `true` | — | Whether building is active |
| `metadata` | JSONB | NOT NULL | `'{}'::jsonb` | — | Extensible metadata |
| `version` | INTEGER | NOT NULL | `1` | — | Optimistic concurrency |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |
| `created_by` | UUID | YES | NULL | FK -> users.id | Creator |
| `updated_by` | UUID | YES | NULL | FK -> users.id | Last modifier |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_buildings_id` | `id` | PRIMARY | — | Primary key |
| `uq_buildings_code_office` | `code`, `office_id` | UNIQUE | `WHERE deleted_at IS NULL` | Unique code per office |
| `idx_buildings_office_id` | `office_id` | BTREE | — | Office's buildings |
| `idx_buildings_company_id` | `company_id` | BTREE | — | Company's buildings |
| `idx_buildings_is_active` | `is_active` | BTREE | `WHERE deleted_at IS NULL` | Active buildings |

#### Example Record

```json
{
  "id": "bld1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "name": "Tower B",
  "code": "TWR-B",
  "description": "Main office tower with 15 floors, housing IT and Finance departments",
  "company_id": "c0a80001-0000-0000-0000-000000000001",
  "office_id": "off1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "address_line1": "Bandra Kurla Complex",
  "address_line2": null,
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "IN",
  "postal_code": "400051",
  "latitude": 19.0597,
  "longitude": 72.8657,
  "total_floors": 15,
  "year_built": 2018,
  "total_area_sqft": 180000.00,
  "is_active": true,
  "metadata": {
    "elevator_count": 4,
    "parking_levels": 2,
    "generator_backup": true,
    "fire_safety_certified": true,
    "last_inspection_date": "2026-01-15"
  },
  "version": 1,
  "created_at": "2026-01-15T08:00:00.000Z",
  "updated_at": "2026-01-15T08:00:00.000Z",
  "deleted_at": null,
  "created_by": null,
  "updated_by": null
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `name not empty` | Not Empty | Building name required |
| `code format` | Regex | `^[A-Z0-9]{2,10}(-[A-Z0-9]+)*$` |
| `total_floors positive` | CHECK | `total_floors >= 1` |
| `year_built reasonable` | CHECK | Between 1800 and current year |

#### Business Rules

1. **Building codes** are unique within an office (not globally).
2. **Floor count** is informational; actual floors are managed via the `floors` table.
3. **Asset scoping** can be at building level for location-based queries.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `company` | Many-to-One | `buildings.company_id -> company.id` | SET NULL | Building belongs to company |
| `offices` | Many-to-One | `buildings.office_id -> offices.id` | SET NULL | Building belongs to office |
| `floors` | One-to-Many | `floors.building_id -> buildings.id` | SET NULL | Building has many floors |
| `locations` | One-to-Many | `locations.building_id -> buildings.id` | SET NULL | Locations in building |

---

### 6.4 floors

#### Purpose

Represents a floor within a building. Floors group locations and provide navigation context for physical asset tracking.

#### Business Requirement

- A building can have many floors.
- Each floor must have a number or name.
- Floors contain multiple granular locations (rooms, desks, etc.).
- Floor-level metadata (area, capacity) must be tracked.

#### Description

The `floors` table represents a single floor within a building. Floors serve as the parent grouping for granular locations (rooms, desks, racks, etc.). The floor number/name is used in asset location descriptions and navigation.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique floor identifier |
| `name` | VARCHAR(100) | NOT NULL | — | — | Floor name (e.g., "15th Floor") |
| `code` | VARCHAR(20) | NOT NULL | — | UNIQUE (composite) | Short code (e.g., "F15") |
| `description` | TEXT | YES | NULL | — | Floor description |
| `company_id` | UUID | NOT NULL | — | FK -> company.id, NOT NULL | Owning company |
| `office_id` | UUID | NOT NULL | — | FK -> offices.id, NOT NULL | Parent office |
| `building_id` | UUID | NOT NULL | — | FK -> buildings.id, NOT NULL | Parent building |
| `floor_number` | INTEGER | NOT NULL | — | — | Numeric floor level (-1=basement) |
| `area_sqft` | DECIMAL(12,2) | YES | NULL | — | Floor area in sq ft |
| `is_active` | BOOLEAN | NOT NULL | `true` | — | Whether floor is active |
| `metadata` | JSONB | NOT NULL | `'{}'::jsonb` | — | Extensible metadata |
| `version` | INTEGER | NOT NULL | `1` | — | Optimistic concurrency |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |
| `created_by` | UUID | YES | NULL | FK -> users.id | Creator |
| `updated_by` | UUID | YES | NULL | FK -> users.id | Last modifier |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_floors_id` | `id` | PRIMARY | — | Primary key |
| `uq_floors_code_building` | `code`, `building_id` | UNIQUE | `WHERE deleted_at IS NULL` | Unique code per building |
| `idx_floors_building_id` | `building_id` | BTREE | — | Building's floors |
| `idx_floors_office_id` | `office_id` | BTREE | — | Office's floors |
| `idx_floors_company_id` | `company_id` | BTREE | — | Company's floors |
| `idx_floors_floor_number` | `building_id`, `floor_number` | BTREE | — | Sorted floor listing |

#### Example Record

```json
{
  "id": "fl1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "name": "15th Floor",
  "code": "F15",
  "description": "Executive floor with boardroom and IT department",
  "company_id": "c0a80001-0000-0000-0000-000000000001",
  "office_id": "off1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "building_id": "bld1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "floor_number": 15,
  "area_sqft": 12000.00,
  "is_active": true,
  "metadata": {
    "restroom_count": 4,
    "emergency_exits": 3,
    "server_room": true,
    "boardroom": true,
    "seating_capacity": 80
  },
  "version": 1,
  "created_at": "2026-01-15T08:00:00.000Z",
  "updated_at": "2026-01-15T08:00:00.000Z",
  "deleted_at": null,
  "created_by": null,
  "updated_by": null
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `name not empty` | Not Empty | Floor name required |
| `code format` | Regex | `^[GF]?[0-9]{1,3}[BS]?$` (G=ground, B=basement, S=sub-basement) |
| `floor_number valid` | CHECK | Between -5 and 200 |

#### Business Rules

1. **Negative floor numbers** represent basements (e.g., -1 = B1).
2. **Floor 0** represents ground floor in systems using 0-based numbering; use code to differentiate.
3. **Locations** (rooms, desks) reference this floor.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `company` | Many-to-One | `floors.company_id -> company.id` | SET NULL | Floor belongs to company |
| `offices` | Many-to-One | `floors.office_id -> offices.id` | SET NULL | Floor belongs to office |
| `buildings` | Many-to-One | `floors.building_id -> buildings.id` | SET NULL | Floor belongs to building |
| `locations` | One-to-Many | `locations.floor_id -> floors.id` | SET NULL | Floor has many locations |

---

### 6.5 locations

#### Purpose

Represents the most granular physical location in the system — a room, desk, rack, cabinet, or any specific spot where an asset can be placed. Locations are the leaf nodes of the physical hierarchy.

#### Business Requirement

- Locations are the finest granularity for asset placement.
- Each location belongs to a floor (optionally a building/office).
- Locations can be of different types (room, desk, rack, cabinet, storage).
- Locations must support capacity limits for asset counts.
- Assets are assigned to specific locations.

#### Description

The `locations` table represents the most specific physical placement point in the system. While companies, offices, buildings, and floors provide the structural hierarchy, locations pinpoint exactly where an asset resides. This enables precise physical audits, asset finding, and space management.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique location identifier |
| `name` | VARCHAR(200) | NOT NULL | — | — | Location name (e.g., "Room 1501") |
| `code` | VARCHAR(50) | NOT NULL | — | UNIQUE (composite) | Short location code |
| `description` | TEXT | YES | NULL | — | Location description |
| `company_id` | UUID | NOT NULL | — | FK -> company.id, NOT NULL | Owning company |
| `office_id` | UUID | NOT NULL | — | FK -> offices.id, NOT NULL | Parent office |
| `building_id` | UUID | YES | NULL | FK -> buildings.id | Parent building (optional) |
| `floor_id` | UUID | YES | NULL | FK -> floors.id | Parent floor (optional) |
| `parent_location_id` | UUID | YES | NULL | FK -> locations.id | Parent location (nested) |
| `location_type` | VARCHAR(50) | NOT NULL | `'room'` | — | Type: room, desk, rack, cabinet, storage, floor_area |
| `capacity` | INTEGER | YES | NULL | — | Max assets this location can hold |
| `current_asset_count` | INTEGER | NOT NULL | `0` | — | Current number of assets |
| `is_active` | BOOLEAN | NOT NULL | `true` | — | Whether location is active |
| `hierarchy_path` | LTREE | YES | NULL | — | Materialized path for hierarchy queries |
| `metadata` | JSONB | NOT NULL | `'{}'::jsonb` | — | Extensible metadata |
| `version` | INTEGER | NOT NULL | `1` | — | Optimistic concurrency |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |
| `created_by` | UUID | YES | NULL | FK -> users.id | Creator |
| `updated_by` | UUID | YES | NULL | FK -> users.id | Last modifier |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_locations_id` | `id` | PRIMARY | — | Primary key |
| `uq_locations_code_company` | `code`, `company_id` | UNIQUE | `WHERE deleted_at IS NULL` | Unique code per company |
| `idx_locations_company_id` | `company_id` | BTREE | — | Company's locations |
| `idx_locations_office_id` | `office_id` | BTREE | — | Office's locations |
| `idx_locations_building_id` | `building_id` | BTREE | — | Building's locations |
| `idx_locations_floor_id` | `floor_id` | BTREE | — | Floor's locations |
| `idx_locations_parent_location_id` | `parent_location_id` | BTREE | — | Nested location queries |
| `idx_locations_location_type` | `location_type` | BTREE | — | Filter by type |
| `idx_locations_hierarchy_path` | `hierarchy_path` | GIST | — | LTREE hierarchy queries |
| `idx_locations_is_active` | `is_active` | BTREE | `WHERE deleted_at IS NULL` | Active locations |

#### Example Record

```json
{
  "id": "loc1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "name": "Room 1501 - Server Room",
  "code": "MUM-HQ/TWR-B/F15/1501",
  "description": "Primary server room on 15th floor of Tower B",
  "company_id": "c0a80001-0000-0000-0000-000000000001",
  "office_id": "off1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "building_id": "bld1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "floor_id": "fl1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "parent_location_id": null,
  "location_type": "room",
  "capacity": 50,
  "current_asset_count": 32,
  "is_active": true,
  "hierarchy_path": "c0a80001.off1a2b3c4.bld1a2b3c4.fl1a2b3c4.loc1a2b3c4",
  "metadata": {
    "temperature_controlled": true,
    "access_restricted": true,
    "fire_suppression": "FM-200",
    "ups_backup": true,
    "rack_count": 8,
    "cable_management": "overhead"
  },
  "version": 1,
  "created_at": "2026-01-15T08:00:00.000Z",
  "updated_at": "2026-07-12T09:15:00.000Z",
  "deleted_at": null,
  "created_by": null,
  "updated_by": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `name not empty` | Not Empty | Location name required |
| `code format` | Business | Follows hierarchy path pattern |
| `capacity positive` | CHECK | `capacity > 0` or NULL |
| `current_asset_count non-negative` | CHECK | `current_asset_count >= 0` |
| `no circular nesting` | Business | `parent_location_id` cannot create cycles |
| `location type valid` | Enum | Must be: room, desk, rack, cabinet, storage, floor_area |

#### Business Rules

1. **Nested locations**: A rack can contain shelves, a room can contain desks. The `parent_location_id` enables arbitrary nesting.
2. **LTREE hierarchy**: The `hierarchy_path` is auto-maintained via triggers and enables efficient subtree queries.
3. **Capacity enforcement**: When `current_asset_count >= capacity`, new allocations to this location are blocked (configurable).
4. **Location codes** follow the hierarchy: `COMP/OFFICE/BUILDING/FLOOR/LOCATION`.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `company` | Many-to-One | `locations.company_id -> company.id` | SET NULL | Location belongs to company |
| `offices` | Many-to-One | `locations.office_id -> offices.id` | SET NULL | Location in office |
| `buildings` | Many-to-One | `locations.building_id -> buildings.id` | SET NULL | Location in building |
| `floors` | Many-to-One | `locations.floor_id -> floors.id` | SET NULL | Location on floor |
| `locations` (self) | Many-to-One | `locations.parent_location_id -> locations.id` | SET NULL | Nested location |
| `assets` (future) | One-to-Many | `assets.location_id -> locations.id` | SET NULL | Assets at this location |

#### Future Expansion

| Enhancement | Description |
|---|---|
| Location Map | Floor plan integration with visual location markers |
| Capacity Alerts | Alerts when location approaches capacity |
| Location QR Codes | QR code generation for physical location identification |
| IoT Sensors | Integration with temperature/humidity sensors in server rooms |

---

### 6.6 departments

#### Purpose

Represents organizational departments within a company. Departments group employees, scope assets, and form the basis for hierarchical organizational reporting.

#### Business Requirement

- Each company has multiple departments.
- Departments form a hierarchy (e.g., Engineering -> Frontend, Backend, DevOps).
- Departments must be linkable to managers and parent departments.
- Department hierarchy must support LTREE for efficient tree queries.
- Assets and employees are scoped to departments.

#### Description

The `departments` table represents organizational units within a company. Departments are the primary organizational grouping for employees, assets, and reporting. They form a hierarchy using PostgreSQL's LTREE extension, enabling efficient tree traversal, subtree queries, and path-based lookups.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique department identifier |
| `name` | VARCHAR(200) | NOT NULL | — | — | Department name |
| `code` | VARCHAR(20) | NOT NULL | — | UNIQUE (composite) | Short department code |
| `description` | TEXT | YES | NULL | — | Department description |
| `company_id` | UUID | NOT NULL | — | FK -> company.id, NOT NULL | Owning company |
| `parent_department_id` | UUID | YES | NULL | FK -> departments.id | Parent department (NULL = top-level) |
| `manager_id` | UUID | YES | NULL | FK -> users.id | Department manager |
| `hierarchy_path` | LTREE | NOT NULL | — | NOT NULL, GIST INDEX | Materialized path for LTREE queries |
| `depth` | INTEGER | NOT NULL | `0` | — | Depth in hierarchy (0 = root) |
| `status` | department_status | NOT NULL | `'active'` | NOT NULL | Department status |
| `budget_code` | VARCHAR(50) | YES | NULL | — | Financial budget code |
| `cost_center` | VARCHAR(50) | YES | NULL | — | Cost center code |
| `head_count` | INTEGER | NOT NULL | `0` | — | Current employee count |
| `max_head_count` | INTEGER | YES | NULL | — | Authorized headcount (NULL = unlimited) |
| `location_id` | UUID | YES | NULL | FK -> locations.id | Primary location |
| `metadata` | JSONB | NOT NULL | `'{}'::jsonb` | — | Extensible metadata |
| `version` | INTEGER | NOT NULL | `1` | — | Optimistic concurrency |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |
| `created_by` | UUID | YES | NULL | FK -> users.id | Creator |
| `updated_by` | UUID | YES | NULL | FK -> users.id | Last modifier |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_departments_id` | `id` | PRIMARY | — | Primary key |
| `uq_departments_code_company` | `code`, `company_id` | UNIQUE | `WHERE deleted_at IS NULL` | Unique code per company |
| `idx_departments_company_id` | `company_id` | BTREE | — | Company's departments |
| `idx_departments_parent_department_id` | `parent_department_id` | BTREE | — | Direct children lookup |
| `idx_departments_manager_id` | `manager_id` | BTREE | — | Manager's departments |
| `idx_departments_hierarchy_path` | `hierarchy_path` | GIST | — | LTREE hierarchy queries |
| `idx_departments_status` | `status` | BTREE | `WHERE deleted_at IS NULL` | Active departments |
| `idx_departments_depth` | `depth` | BTREE | — | Level-based queries |
| `idx_departments_location_id` | `location_id` | BTREE | — | Location-based queries |

#### Example Record

```json
{
  "id": "d1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "name": "Information Technology",
  "code": "IT",
  "description": "Enterprise IT department managing infrastructure, applications, and IT assets",
  "company_id": "c0a80001-0000-0000-0000-000000000001",
  "parent_department_id": null,
  "manager_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "hierarchy_path": "c0a80001.d1a2b3c4",
  "depth": 0,
  "status": "active",
  "budget_code": "IT-2026",
  "cost_center": "CC-IT-001",
  "head_count": 45,
  "max_head_count": 60,
  "location_id": "loc1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "metadata": {
    "department_type": "technical",
    "sla_targets": {
      "incident_response": "4h",
      "change_approval": "24h",
      "asset_provisioning": "48h"
    },
    "annual_budget": 5000000,
    "currency": "INR"
  },
  "version": 1,
  "created_at": "2026-01-15T08:00:00.000Z",
  "updated_at": "2026-06-01T12:00:00.000Z",
  "deleted_at": null,
  "created_by": null,
  "updated_by": "b1a2b3c4-d5e6-7890-abcd-ef1234567890"
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `name not empty` | Not Empty | Department name required |
| `code format` | Regex | `^[A-Z0-9]{2,20}$` |
| `no circular hierarchy` | Business | Parent cannot be self or descendant |
| `depth consistency` | Business | `depth` must equal parent's depth + 1 |
| `max_head_count positive` | CHECK | `max_head_count > 0` or NULL |
| `hierarchy_path format` | LTREE | Must be valid LTREE path |

#### Business Rules

1. **LTREE hierarchy**: `hierarchy_path` is auto-maintained via triggers. Format: `company_id.dept_id[.child_dept_id...]`.
2. **Manager assignment**: A manager must be an active employee in the same company.
3. **Headcount tracking**: `head_count` is auto-maintained when employees are added/removed.
4. **Budget scoping**: `budget_code` and `cost_center` link to financial systems.
5. **Status transitions**: Active -> Inactive -> Merged/Dissolved. Inactive departments cannot receive new employees.
6. **Subtree queries**: Find all sub-departments: `WHERE hierarchy_path <@ 'c0a80001.d1a2b3c4'`.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `company` | Many-to-One | `departments.company_id -> company.id` | SET NULL | Department belongs to company |
| `departments` (self) | Many-to-One | `departments.parent_department_id -> departments.id` | SET NULL | Parent department |
| `users` (manager) | Many-to-One | `departments.manager_id -> users.id` | SET NULL | Department manager |
| `locations` | Many-to-One | `departments.location_id -> locations.id` | SET NULL | Primary location |
| `employee_profiles` | One-to-Many | `employee_profiles.department_id -> departments.id` | SET NULL | Employees in department |
| `user_roles` | One-to-Many | `user_roles.department_id -> departments.id` | SET NULL | Scoped role assignments |

#### Future Expansion

| Enhancement | Description |
|---|---|
| Department Groups | Logical groupings for cross-department projects |
| Cost Allocation | Per-department asset cost allocation |
| Department Metrics | KPIs per department (asset utilization, etc.) |
| Org Chart | Visual org chart generation from hierarchy |

---

### 6.7 department_hierarchy

#### Purpose

Materialized view of the department hierarchy providing efficient tree traversal, path lookups, and ancestor/descendant queries without recursive CTEs.

#### Business Requirement

- Support efficient ancestor and descendant queries.
- Enable subtree containment checks.
- Allow path-based lookups (e.g., "show all departments under IT").
- Support depth-limited queries.
- Must stay synchronized with `departments` table changes.

#### Description

The `department_hierarchy` table is a materialized adjacency list that provides pre-computed relationship data for the department tree. While `departments.hierarchy_path` (LTREE) handles most hierarchy queries, this table provides additional relationship metadata and supports complex org-chart queries that benefit from explicit parent-child records.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique record identifier |
| `department_id` | UUID | NOT NULL | — | FK -> departments.id, NOT NULL | The department |
| `ancestor_id` | UUID | NOT NULL | — | FK -> departments.id, NOT NULL | Ancestor department |
| `descendant_id` | UUID | NOT NULL | — | FK -> departments.id, NOT NULL | Descendant department |
| `depth` | INTEGER | NOT NULL | — | — | Distance from ancestor to descendant |
| `path` | TEXT | NOT NULL | — | — | Text path: "dept1/dept2/dept3" |
| `is_direct_parent` | BOOLEAN | NOT NULL | `false` | — | Whether ancestor is direct parent |
| `company_id` | UUID | NOT NULL | — | FK -> company.id, NOT NULL | Owning company |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_dept_hierarchy_id` | `id` | PRIMARY | — | Primary key |
| `uq_dept_hierarchy_rel` | `ancestor_id`, `descendant_id` | UNIQUE | — | Unique ancestor-descendant pair |
| `idx_dept_hierarchy_department_id` | `department_id` | BTREE | — | All relationships for a dept |
| `idx_dept_hierarchy_ancestor_id` | `ancestor_id` | BTREE | — | All descendants of an ancestor |
| `idx_dept_hierarchy_descendant_id` | `descendant_id` | BTREE | — | All ancestors of a descendant |
| `idx_dept_hierarchy_is_direct` | `is_direct_parent` | BTREE | `WHERE is_direct_parent = true` | Direct parent lookups |
| `idx_dept_hierarchy_company_id` | `company_id` | BTREE | — | Company-scoped queries |
| `idx_dept_hierarchy_depth` | `ancestor_id`, `depth` | BTREE | — | Depth-limited queries |

#### Example Record

```json
{
  "id": "dh1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "department_id": "d2a2b3c4-d5e6-7890-abcd-ef1234567891",
  "ancestor_id": "d1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "descendant_id": "d2a2b3c4-d5e6-7890-abcd-ef1234567891",
  "depth": 1,
  "path": "Information Technology/Frontend Engineering",
  "is_direct_parent": true,
  "company_id": "c0a80001-0000-0000-0000-000000000001",
  "created_at": "2026-01-15T08:00:00.000Z",
  "updated_at": "2026-01-15T08:00:00.000Z"
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `unique pair` | UNIQUE | Same ancestor-descendant pair cannot exist twice |
| `depth consistency` | Business | `depth` must equal actual path length |
| `is_direct_parent consistency` | Business | `is_direct_parent = true` implies `depth = 1` |
| `no self-reference` | Business | `ancestor_id != descendant_id` |

#### Business Rules

1. **Auto-maintenance**: This table is updated via database triggers when departments are created, moved, or deleted.
2. **Self-referencing rows**: Each department has a row where `ancestor_id = descendant_id` (depth = 0).
3. **Direct parent**: When `is_direct_parent = true`, the `ancestor_id` is the direct parent.
4. **Query pattern**: "Find all sub-departments of IT" -> `SELECT descendant_id FROM department_hierarchy WHERE ancestor_id = 'IT_ID' AND depth > 0`.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `departments` (department) | Many-to-One | `department_hierarchy.department_id -> departments.id` | CASCADE | The department |
| `departments` (ancestor) | Many-to-One | `department_hierarchy.ancestor_id -> departments.id` | CASCADE | Ancestor department |
| `departments` (descendant) | Many-to-One | `department_hierarchy.descendant_id -> departments.id` | CASCADE | Descendant department |
| `company` | Many-to-One | `department_hierarchy.company_id -> company.id` | CASCADE | Owning company |

#### Future Expansion

| Enhancement | Description |
|---|---|
| Materialized Refresh | Configurable refresh interval for read-heavy scenarios |
| Permission Inheritance | Inherit department-level permissions up/down the hierarchy |
| Cost Rollup | Aggregate costs up the department tree |

---

### 6.8 employee_profiles

#### Purpose

Stores detailed employee information, linking human resources data with system user accounts. This is the bridge between the organizational structure and the authentication system.

#### Business Requirement

- Every system user who is an internal employee must have an employee profile.
- Employee profiles store HR data: employee ID, designation, department, reporting manager.
- Profiles must link to user accounts for system access.
- Employee status changes (on leave, terminated) must reflect in system access.
- Historical employment data must be preserved.

#### Description

The `employee_profiles` table is the comprehensive employee record that bridges organizational data with the user authentication system. It stores employment details including employee number, designation, department assignment, reporting structure, and employment dates. The `users.employee_profile_id` creates a one-to-one link between system access and employment records.

#### Table Definition

| Column | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | Unique profile identifier |
| `employee_number` | VARCHAR(50) | NOT NULL | — | UNIQUE (composite) | HR employee ID (e.g., "EMP-00123") |
| `user_id` | UUID | NOT NULL | — | UNIQUE, FK -> users.id, NOT NULL | Linked system user |
| `company_id` | UUID | NOT NULL | — | FK -> company.id, NOT NULL | Employing company |
| `department_id` | UUID | NOT NULL | — | FK -> departments.id, NOT NULL | Assigned department |
| `office_id` | UUID | YES | NULL | FK -> offices.id | Primary office |
| `location_id` | UUID | YES | NULL | FK -> locations.id | Primary work location |
| `reporting_to_id` | UUID | YES | NULL | FK -> employee_profiles.id | Direct reporting manager |
| `designation` | VARCHAR(200) | NOT NULL | — | — | Job title/designation |
| `job_level` | VARCHAR(50) | YES | NULL | — | Job level/grade (e.g., "L5", "Senior") |
| `employment_type` | VARCHAR(50) | NOT NULL | `'full_time'` | — | full_time, part_time, contract, intern |
| `status` | employee_status | NOT NULL | `'active'` | NOT NULL | Employment status |
| `date_of_joining` | DATE | NOT NULL | — | NOT NULL | Employment start date |
| `date_of_leaving` | DATE | YES | NULL | — | Employment end date (if applicable) |
| `probation_end_date` | DATE | YES | NULL | — | Probation period end date |
| `last_working_date` | DATE | YES | NULL | — | Last active working date |
| `work_email` | VARCHAR(255) | YES | NULL | UNIQUE | Official work email |
| `work_phone` | VARCHAR(20) | YES | NULL | — | Official work phone |
| `emergency_contact_name` | VARCHAR(200) | YES | NULL | — | Emergency contact person |
| `emergency_contact_phone` | VARCHAR(20) | YES | NULL | — | Emergency contact phone |
| `date_of_birth` | DATE | YES | NULL | — | Employee DOB |
| `gender` | VARCHAR(20) | YES | NULL | — | Gender |
| `nationality` | VARCHAR(100) | YES | NULL | — | Nationality |
| `address` | TEXT | YES | NULL | — | Residential address |
| `qualifications` | JSONB | NOT NULL | `'[]'::jsonb` | — | Educational qualifications |
| `skills` | TEXT[] | YES | NULL | — | Skill tags |
| `certifications` | JSONB | NOT NULL | `'[]'::jsonb` | — | Professional certifications |
| `assets_assigned` | INTEGER | NOT NULL | `0` | — | Count of currently assigned assets |
| `metadata` | JSONB | NOT NULL | `'{}'::jsonb` | — | Extensible metadata |
| `version` | INTEGER | NOT NULL | `1` | — | Optimistic concurrency |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft delete timestamp |
| `created_by` | UUID | YES | NULL | FK -> users.id | Creator |
| `updated_by` | UUID | YES | NULL | FK -> users.id | Last modifier |

#### Indexes

| Index Name | Columns | Type | Condition | Purpose |
|---|---|---|---|---|
| `idx_employee_profiles_id` | `id` | PRIMARY | — | Primary key |
| `uq_employee_profiles_number` | `employee_number`, `company_id` | UNIQUE | `WHERE deleted_at IS NULL` | Unique employee number per company |
| `uq_employee_profiles_user_id` | `user_id` | UNIQUE | — | One profile per user |
| `uq_employee_profiles_work_email` | `work_email` | UNIQUE | `WHERE deleted_at IS NULL AND work_email IS NOT NULL` | Unique work email |
| `idx_employee_profiles_company_id` | `company_id` | BTREE | — | Company's employees |
| `idx_employee_profiles_department_id` | `department_id` | BTREE | — | Department's employees |
| `idx_employee_profiles_office_id` | `office_id` | BTREE | — | Office's employees |
| `idx_employee_profiles_location_id` | `location_id` | BTREE | — | Location's employees |
| `idx_employee_profiles_reporting_to_id` | `reporting_to_id` | BTREE | — | Direct reports lookup |
| `idx_employee_profiles_status` | `status` | BTREE | `WHERE deleted_at IS NULL` | Active employees |
| `idx_employee_profiles_date_of_joining` | `date_of_joining` | BTREE | — | Tenure queries |
| `idx_employee_profiles_designation` | `designation` | BTREE | — | Designation-based queries |
| `idx_employee_profiles_name_search` | `employee_number`, `designation` | GIN (pg_trgm) | — | Fuzzy search |
| `idx_employee_profiles_skills` | `skills` | GIN | — | Skills-based search |

#### Example Record

```json
{
  "id": "e0a1b2c3-d4e5-6789-abcd-ef1234567890",
  "employee_number": "EMP-00456",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "company_id": "c0a80001-0000-0000-0000-000000000001",
  "department_id": "d1a2b3c4-e5f6-7890-abcd-ef1234567890",
  "office_id": "off1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "location_id": "loc1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "reporting_to_id": null,
  "designation": "IT Director",
  "job_level": "L8",
  "employment_type": "full_time",
  "status": "active",
  "date_of_joining": "2020-01-15",
  "date_of_leaving": null,
  "probation_end_date": "2020-04-15",
  "last_working_date": null,
  "work_email": "priya.sharma@acme-corp.com",
  "work_phone": "+91-22-1234-5680",
  "emergency_contact_name": "Raj Sharma",
  "emergency_contact_phone": "+91-9876543211",
  "date_of_birth": "1988-05-20",
  "gender": "female",
  "nationality": "Indian",
  "address": "42 Marine Drive, Mumbai, Maharashtra 400001",
  "qualifications": [
    {
      "degree": "B.Tech Computer Science",
      "institution": "IIT Bombay",
      "year": 2010
    },
    {
      "degree": "MBA Information Systems",
      "institution": "ISB Hyderabad",
      "year": 2015
    }
  ],
  "skills": ["IT Strategy", "Cloud Architecture", "Team Leadership", "Budget Management", "Vendor Relations"],
  "certifications": [
    {
      "name": "AWS Solutions Architect Professional",
      "issued_date": "2023-06-15",
      "expiry_date": "2026-06-15"
    },
    {
      "name": "ITIL v4 Foundation",
      "issued_date": "2022-03-10",
      "expiry_date": null
    }
  ],
  "assets_assigned": 3,
  "metadata": {
    "work_arrangement": "hybrid",
    "office_days": ["Monday", "Tuesday", "Wednesday"],
    "remote_days": ["Thursday", "Friday"],
    "salary_band": "Executive",
    "annual_leave_balance": 24
  },
  "version": 1,
  "created_at": "2026-01-15T08:00:00.000Z",
  "updated_at": "2026-07-10T14:30:00.000Z",
  "deleted_at": null,
  "created_by": null,
  "updated_by": "b1a2b3c4-d5e6-7890-abcd-ef1234567890"
}
```

#### Validation Rules

| Rule | Type | Description |
|---|---|---|
| `employee_number not empty` | Not Empty | Employee number required |
| `employee_number format` | Regex | `^EMP-[0-9]{5,}$` |
| `user_id unique` | UNIQUE | One employee profile per user account |
| `work_email format` | Regex | Must be valid email (if provided) |
| `date_of_joining not future` | Business | Cannot be in the future |
| `date_of_leaving after joining` | Business | Must be after `date_of_joining` if set |
| `status valid transition` | State Machine | Must follow valid status transitions |
| `employment_type valid` | Enum | Must be: full_time, part_time, contract, intern |
| `reporting_to same company` | Business | Reporting manager must be in same company |
| `department same company` | Business | Department must belong to same company |

#### Business Rules

1. **One-to-one with users**: Each employee profile links to exactly one user account. External contractors may have profiles without full user access.
2. **Employee number generation**: Auto-generated as `EMP-XXXXX` sequential within company (configurable prefix).
3. **Status-driven access**: When `status` changes to `terminated` or `resigned`, the linked user account is auto-deactivated.
4. **Reporting chain**: `reporting_to_id` creates the management hierarchy. Used for approval workflows (e.g., allocation requests go to direct manager).
5. **Asset tracking**: `assets_assigned` is auto-maintained when assets are allocated/returned.
6. **Historical data**: When an employee transfers departments, the old record is soft-deleted and a new one created, preserving history.
7. **Data separation**: Sensitive fields (emergency contact, DOB) are accessible only to HR role.

#### Relationships

| Related Table | Relationship | FK Column | Cascade | Description |
|---|---|---|---|---|
| `users` | One-to-One | `employee_profiles.user_id -> users.id` | CASCADE | Profile links to user |
| `company` | Many-to-One | `employee_profiles.company_id -> company.id` | SET NULL | Employee belongs to company |
| `departments` | Many-to-One | `employee_profiles.department_id -> departments.id` | SET NULL | Employee's department |
| `offices` | Many-to-One | `employee_profiles.office_id -> offices.id` | SET NULL | Employee's office |
| `locations` | Many-to-One | `employee_profiles.location_id -> locations.id` | SET NULL | Employee's location |
| `employee_profiles` (self) | Many-to-One | `employee_profiles.reporting_to_id -> employee_profiles.id` | SET NULL | Direct manager |
| `assets` (future) | One-to-Many | `assets.assigned_to_id -> employee_profiles.id` | SET NULL | Assets assigned to employee |
| `allocations` (future) | One-to-Many | `allocations.employee_id -> employee_profiles.id` | SET NULL | Active allocations |
| `maintenance_requests` (future) | One-to-Many | `maintenance_requests.requested_by_id -> employee_profiles.id` | SET NULL | Maintenance requests |

#### Future Expansion

| Enhancement | Description |
|---|---|
| Employee History | Separate table for employment history (role changes, promotions) |
| Performance Data | Performance review data integration |
| Training Records | Training and development tracking |
| Asset Responsibility | Track asset custody transfers |
| Org Chart API | Generate visual org charts from reporting chain |
| Leave Management | Integration with leave management system |

---

## Document Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0.0 | 2026-07-12 | AssetFlow Team | Initial complete architecture document |

---

*This document is maintained alongside the Prisma schema (`schema.prisma`) and should be updated whenever database schema changes are made. All table definitions in this document must be reflected in the Prisma schema and vice versa.*
