# AssetFlow Database: Security, Performance & API Documentation

> **Version:** 1.0.0
> **Database:** PostgreSQL (via Prisma ORM)
> **Target Scale:** 1M assets, 100K employees, 1000 departments, 100 offices, millions of bookings/logs
> **Last Updated:** 2026-07-12

---

## Table of Contents

- [PART 1: INDEX STRATEGY](#part-1-index-strategy)
  - [1.1 Primary Key Indexes](#11-primary-key-indexes)
  - [1.2 Foreign Key Indexes](#12-foreign-key-indexes)
  - [1.3 Unique Constraint Indexes](#13-unique-constraint-indexes)
  - [1.4 Composite Indexes](#14-composite-indexes)
  - [1.5 Full-Text Search Indexes (GIN)](#15-full-text-search-indexes-gin)
  - [1.6 Partial Indexes](#16-partial-indexes)
  - [1.7 GiST Indexes (LTREE Hierarchies)](#17-gist-indexes-ltree-hierarchies)
- [PART 2: PERFORMANCE CONSIDERATIONS](#part-2-performance-considerations)
  - [2.1 Table Partitioning Strategy](#21-table-partitioning-strategy)
  - [2.2 Connection Pooling Recommendations](#22-connection-pooling-recommendations)
  - [2.3 Query Optimization Patterns](#23-query-optimization-patterns)
  - [2.4 N+1 Query Prevention with Prisma](#24-n1-query-prevention-with-prisma)
  - [2.5 Pagination Strategies](#25-pagination-strategies)
  - [2.6 Bulk Operations](#26-bulk-operations)
  - [2.7 Caching Strategy (Redis Integration)](#27-caching-strategy-redis-integration)
  - [2.8 Database Connection Limits](#28-database-connection-limits)
  - [2.9 Vacuum and Maintenance](#29-vacuum-and-maintenance)
  - [2.10 Monitoring and Alerting](#210-monitoring-and-alerting)
  - [2.11 Capacity Planning](#211-capacity-planning)
- [PART 3: SECURITY ARCHITECTURE](#part-3-security-architecture)
  - [3.1 Password Storage](#31-password-storage)
  - [3.2 JWT Token Strategy](#32-jwt-token-strategy)
  - [3.3 API Token Management](#33-api-token-management)
  - [3.4 Row-Level Security (RLS)](#34-row-level-security-rls)
  - [3.5 Data Encryption](#35-data-encryption)
  - [3.6 Sensitive Data Handling](#36-sensitive-data-handling)
  - [3.7 SQL Injection Prevention](#37-sql-injection-prevention)
  - [3.8 Audit Logging](#38-audit-logging)
  - [3.9 Session Security](#39-session-security)
  - [3.10 Rate Limiting](#310-rate-limiting)
  - [3.11 IP Allowlisting/Blocklisting](#311-ip-allowlistingblocklisting)
  - [3.12 GDPR Compliance](#312-gdpr-compliance)
  - [3.13 Data Retention Policies](#313-data-retention-policies)
- [PART 4: API DESIGN GUIDELINES](#part-4-api-design-guidelines)
  - [4.1 REST API Resource Naming](#41-rest-api-resource-naming)
  - [4.2 Pagination](#42-pagination)
  - [4.3 Filtering](#43-filtering)
  - [4.4 Sorting](#44-sorting)
  - [4.5 Searching](#45-searching)
  - [4.6 Bulk Operations](#46-bulk-operations)
  - [4.7 Error Response Format](#47-error-response-format)
  - [4.8 Rate Limiting per Endpoint](#48-rate-limiting-per-endpoint)
  - [4.9 Versioning Strategy](#49-versioning-strategy)
  - [4.10 HATEOAS Considerations](#410-hateoas-considerations)
- [PART 5: FUTURE EXPANSION ROADMAP](#part-5-future-expansion-roadmap)
  - [5.1 Inventory Management](#51-inventory-management)
  - [5.2 Purchase Order Management](#52-purchase-order-management)
  - [5.3 Vendor Management](#53-vendor-management)
  - [5.4 Invoice Processing](#54-invoice-processing)
  - [5.5 Finance / Depreciation](#55-finance--depreciation)
  - [5.6 Warehouse Management](#56-warehouse-management)
  - [5.7 Asset Leasing](#57-asset-leasing)
  - [5.8 Mobile App (Offline Support, Sync)](#58-mobile-app-offline-support-sync)
  - [5.9 RFID Integration](#59-rfid-integration)
  - [5.10 Barcode Integration](#510-barcode-integration)
  - [5.11 AI Predictions](#511-ai-predictions)
  - [5.12 IoT Sensors](#512-iot-sensors)
  - [5.13 GPS Tracking](#513-gps-tracking)
  - [5.14 Multi-Currency Support](#514-multi-currency-support)

---

## PART 1: INDEX STRATEGY

### Core Schema Reference

The AssetFlow database contains the following primary tables:

```
offices, departments, employees, assets, asset_categories, asset_history,
bookings, booking_history, notifications, activity_logs, login_history,
comments, attachments, api_tokens, refresh_tokens
```

Each index below is designed for the target scale of **1M assets**, **100K employees**, **1000 departments**, **100 offices**, and **millions** of booking/activity log records.

---

### 1.1 Primary Key Indexes

Primary key indexes are created automatically by PostgreSQL on every `id` column. All primary keys use the `uuid` type (stored as 16 bytes) for distributed-system friendliness and collision avoidance.

| Table | Column | Index Name | Storage | Purpose |
|---|---|---|---|---|
| `offices` | `id` | `offices_pkey` | UUID -> 16 B | Uniquely identifies each office |
| `departments` | `id` | `departments_pkey` | UUID -> 16 B | Uniquely identifies each department |
| `employees` | `id` | `employees_pkey` | UUID -> 16 B | Uniquely identifies each employee |
| `assets` | `id` | `assets_pkey` | UUID -> 16 B | Uniquely identifies each asset |
| `asset_categories` | `id` | `asset_categories_pkey` | UUID -> 16 B | Uniquely identifies each category |
| `asset_history` | `id` | `asset_history_pkey` | UUID -> 16 B | Uniquely identifies each history record |
| `bookings` | `id` | `bookings_pkey` | UUID -> 16 B | Uniquely identifies each booking |
| `booking_history` | `id` | `booking_history_pkey` | UUID -> 16 B | Uniquely identifies each booking history record |
| `notifications` | `id` | `notifications_pkey` | UUID -> 16 B | Uniquely identifies each notification |
| `activity_logs` | `id` | `activity_logs_pkey` | UUID -> 16 B | Uniquely identifies each log entry |
| `comments` | `id` | `comments_pkey` | UUID -> 16 B | Uniquely identifies each comment |
| `attachments` | `id` | `attachments_pkey` | UUID -> 16 B | Uniquely identifies each attachment |
| `api_tokens` | `id` | `api_tokens_pkey` | UUID -> 16 B | Uniquely identifies each API token |
| `refresh_tokens` | `id` | `refresh_tokens_pkey` | UUID -> 16 B | Uniquely identifies each refresh token |

**Performance note:** PostgreSQL B-tree primary key indexes have O(log n) lookup. At 1M rows, this means approximately 3-4 page reads to locate any row by ID (< 1 ms on SSD).

---

### 1.2 Foreign Key Indexes

PostgreSQL does **not** automatically create indexes on foreign key columns. Every FK below has an explicit B-tree index to prevent sequential scans during JOINs and cascading deletes.

| Table | Column(s) | Index Name | References | Purpose |
|---|---|---|---|---|
| `departments` | `office_id` | `idx_departments_office_id` | `offices.id` | JOIN departments to offices; cascade deletes when office is removed |
| `employees` | `department_id` | `idx_employees_department_id` | `departments.id` | JOIN employees to departments; filter by department |
| `employees` | `office_id` | `idx_employees_office_id` | `offices.id` | Filter employees by office; cascade on office deletion |
| `assets` | `category_id` | `idx_assets_category_id` | `asset_categories.id` | Filter assets by category |
| `assets` | `assigned_to_id` | `idx_assets_assigned_to_id` | `employees.id` | Find assets assigned to a specific employee |
| `assets` | `office_id` | `idx_assets_office_id` | `offices.id` | Filter assets by office location |
| `assets` | `department_id` | `idx_assets_department_id` | `departments.id` | Filter assets by department |
| `asset_history` | `asset_id` | `idx_asset_history_asset_id` | `assets.id` | Retrieve full history of an asset |
| `asset_history` | `performed_by_id` | `idx_asset_history_performed_by` | `employees.id` | Find all actions performed by an employee |
| `bookings` | `asset_id` | `idx_bookings_asset_id` | `assets.id` | Find all bookings for an asset |
| `bookings` | `booked_by_id` | `idx_bookings_booked_by_id` | `employees.id` | Find all bookings made by an employee |
| `bookings` | `approved_by_id` | `idx_bookings_approved_by_id` | `employees.id` | Filter bookings by approver |
| `booking_history` | `booking_id` | `idx_booking_history_booking_id` | `bookings.id` | Retrieve full history of a booking |
| `notifications` | `user_id` | `idx_notifications_user_id` | `employees.id` | Retrieve notifications for a user |
| `activity_logs` | `user_id` | `idx_activity_logs_user_id` | `employees.id` | Find all activity by a user |
| `activity_logs` | `asset_id` | `idx_activity_logs_asset_id` | `assets.id` | Find all activity for an asset |
| `comments` | `asset_id` | `idx_comments_asset_id` | `assets.id` | Retrieve comments on an asset |
| `comments` | `author_id` | `idx_comments_author_id` | `employees.id` | Find comments by an author |
| `attachments` | `asset_id` | `idx_attachments_asset_id` | `assets.id` | Retrieve attachments for an asset |
| `attachments` | `uploaded_by_id` | `idx_attachments_uploaded_by` | `employees.id` | Find files uploaded by an employee |
| `api_tokens` | `user_id` | `idx_api_tokens_user_id` | `employees.id` | Find active API tokens for a user |
| `refresh_tokens` | `user_id` | `idx_refresh_tokens_user_id` | `employees.id` | Find active refresh tokens for a user |

**Scale impact at 1M assets:**

- `idx_assets_assigned_to_id`: At 1M assets with ~50% assigned, this index allows finding an employee's assets in ~2 ms vs ~200 ms for a seq scan.
- `idx_bookings_asset_id`: An asset may have 50-200 bookings over its lifetime. The index scopes the scan to that subset immediately.
- `idx_asset_history_asset_id`: Critical for the asset detail page; an asset may accumulate 20-100 history records. Without this index, a seq scan across 10M+ history rows would take seconds.

---

### 1.3 Unique Constraint Indexes

Unique constraints create implicit B-tree unique indexes. These enforce data integrity and serve double duty as lookup indexes.

| Table | Column(s) | Index Name | Purpose | Notes |
|---|---|---|---|---|
| `offices` | `name` | `offices_name_key` | Prevent duplicate office names | Case-sensitive; normalized at application layer |
| `departments` | `(name, office_id)` | `departments_name_office_id_key` | Prevent duplicate department names within an office | Composite unique; enforces hierarchical uniqueness |
| `employees` | `email` | `employees_email_key` | Enforce unique employee emails (login identifier) | Case-insensitive via `citext` or lower() application-side |
| `employees` | `employee_code` | `employees_employee_code_key` | Enforce unique employee badge codes | Used for quick lookup during check-in/check-out |
| `assets` | `asset_tag` | `assets_asset_tag_key` | Enforce unique asset tag numbers | Primary human-readable identifier for assets |
| `assets` | `serial_number` | `assets_serial_number_key` | Enforce unique serial numbers (when not null) | Partial unique: only for non-null values |
| `asset_categories` | `name` | `asset_categories_name_key` | Prevent duplicate category names | Top-level unique; children use parent+name |
| `api_tokens` | `token_hash` | `api_tokens_token_hash_key` | Enforce unique token hashes | Tokens stored as SHA-256 hashes, never plaintext |
| `refresh_tokens` | `token` | `refresh_tokens_token_key` | Enforce unique refresh tokens | Opaque random strings |

**Query patterns supported:**

- Login by email: `WHERE email = $1` — O(log n) via unique index, ~1 ms at 100K employees
- Asset lookup by tag: `WHERE asset_tag = $1` — O(log n), used in barcode/QR scanning
- Employee lookup by code: `WHERE employee_code = $1` — used at physical check-in kiosks

---

### 1.4 Composite Indexes

Composite indexes cover multi-column queries that the application issues frequently. Column order follows the **equality-first, range-second, sort-third** rule.

| Index Name | Table | Columns | Type | Purpose & Query Patterns |
|---|---|---|---|---|
| `idx_assets_status_category` | `assets` | `(status, category_id)` | B-tree | Dashboard: "Show all Available assets in category X". Status has low cardinality (~6 values); category narrows further. |
| `idx_assets_office_status` | `assets` | `(office_id, status)` | B-tree | Office-level inventory: "Show all In-Use assets at office Y". Supports office dashboard and capacity views. |
| `idx_assets_department_status` | `assets` | `(department_id, status)` | B-tree | Department-level reports: "Show all Available assets in department Z". |
| `idx_assets_category_status_created` | `assets` | `(category_id, status, created_at DESC)` | B-tree | Category pages sorted by newest. Covers the common "list assets by category, filter by status, order by date" UI pattern. |
| `idx_bookings_asset_status` | `bookings` | `(asset_id, status)` | B-tree | "Show all active (Pending/Approved) bookings for asset X". Critical for preventing double-booking. |
| `idx_bookings_booked_by_status` | `bookings` | `(booked_by_id, status)` | B-tree | "My Bookings" page: all active bookings by the current user. |
| `idx_bookings_asset_dates` | `bookings` | `(asset_id, start_date, end_date)` | B-tree | Availability check: "Is this asset free between dates A and B?". Range scan on dates after equality on asset. |
| `idx_bookings_status_start_date` | `bookings` | `(status, start_date)` | B-tree | Upcoming bookings report: "Show all approved bookings starting this week". |
| `idx_asset_history_asset_created` | `asset_history` | `(asset_id, created_at DESC)` | B-tree | Asset timeline: chronological history of an asset, newest first. Supports infinite-scroll pagination. |
| `idx_activity_logs_user_created` | `activity_logs` | `(user_id, created_at DESC)` | B-tree | User activity feed: "Show my recent actions, newest first". |
| `idx_activity_logs_asset_created` | `activity_logs` | `(asset_id, created_at DESC)` | B-tree | Asset audit trail: "Show all activity on asset X". |
| `idx_notifications_user_read` | `notifications` | `(user_id, is_read, created_at DESC)` | B-tree | Unread notification badge: "Count unread notifications for user X". Partially covered by partial index (see 1.6). |
| `idx_employees_dept_office` | `employees` | `(department_id, office_id)` | B-tree | Employee directory: "List all employees in department Y at office Z". |
| `idx_employees_status_dept` | `employees` | `(status, department_id)` | B-tree | Active employee count per department. |
| `idx_departments_office_name` | `departments` | `(office_id, name)` | B-tree | Department listing within an office, alphabetically. |
| `idx_comments_asset_created` | `comments` | `(asset_id, created_at)` | B-tree | Comment thread on an asset, chronological. |
| `idx_booking_history_booking_created` | `booking_history` | `(booking_id, created_at)` | B-tree | Booking timeline in chronological order. |

**Scale impact:**

- At 1M assets, `idx_assets_status_category` reduces a dashboard query from ~500 ms (seq scan + filter) to ~5 ms.
- `idx_bookings_asset_dates` is critical for the booking conflict detection query. Without it, checking availability across 5M bookings would require a full table scan.

---

### 1.5 Full-Text Search Indexes (GIN)

PostgreSQL GIN (Generalized Inverted Index) indexes power full-text search. AssetFlow uses `tsvector` columns and GIN indexes for searching across assets, employees, and comments.

| Index Name | Table | Expression | Purpose | Query Pattern |
|---|---|---|---|---|
| `idx_assets_search` | `assets` | `to_tsvector('english', name \|\| ' ' \|\| description \|\| ' ' \|\| asset_tag \|\| ' ' \|\| serial_number)` | Global asset search bar | `WHERE to_tsvector(...) @@ plainto_tsquery('english', $1)` |
| `idx_assets_search_trgm` | `assets` | `name gin_trgm_ops` | Fuzzy/partial name matching | `WHERE name % $1` (similarity search) |
| `idx_employees_search` | `employees` | `to_tsvector('english', first_name \|\| ' ' \|\| last_name \|\| ' ' \|\| email)` | Employee directory search | `WHERE to_tsvector(...) @@ plainto_tsquery('english', $1)` |
| `idx_comments_search` | `comments` | `to_tsvector('english', content)` | Search within comments | `WHERE to_tsvector(...) @@ plainto_tsquery('english', $1)` |
| `idx_asset_categories_search` | `asset_categories` | `to_tsvector('english', name \|\| ' ' \|\| description)` | Category search | `WHERE to_tsvector(...) @@ plainto_tsquery('english', $1)` |

**GIN index DDL example:**

```sql
-- tsvector column approach (preferred for 1M+ rows):
ALTER TABLE assets ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(asset_tag, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(serial_number, '')), 'C')
  ) STORED;

CREATE INDEX idx_assets_search ON assets USING GIN (search_vector);

-- Trigram index for fuzzy matching:
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_assets_search_trgm ON assets USING GIN (name gin_trgm_ops);
```

**Performance at scale:**

- GIN indexes have higher build cost but sub-millisecond query time. For 1M assets, a `plainto_tsquery` search completes in ~3-8 ms vs ~1.2 s for a LIKE '%term%' seq scan.
- The trigram index enables "did you mean?" suggestions with `similarity()` at ~5 ms.
- Weighted ranking (`setweight`) allows prioritizing matches in asset names/tags over descriptions.

**Prisma integration:** Since Prisma does not natively support GIN indexes, these are created via raw SQL migrations:

```sql
-- In a Prisma migration file:
CREATE INDEX CONCURRENTLY idx_assets_search ON assets USING GIN (search_vector);
CREATE INDEX CONCURRENTLY idx_assets_search_trgm ON assets USING GIN (name gin_trgm_ops);
```

Application queries use `prisma.$queryRaw` or `prisma.$executeRaw` for full-text search.

---

### 1.6 Partial Indexes

Partial indexes include only rows matching a `WHERE` clause, reducing index size and improving write performance while accelerating the most common queries.

| Index Name | Table | Definition | Purpose | Size Savings |
|---|---|---|---|---|
| `idx_assets_available` | `assets` | `ON assets (office_id, category_id) WHERE status = 'AVAILABLE'` | Dashboard "available assets" widget — the most frequently queried subset | Only ~30-40% of 1M rows |
| `idx_assets_in_maintenance` | `assets` | `ON assets (office_id, maintenance_date) WHERE status = 'MAINTENANCE'` | Maintenance scheduling view — only ~5-10% of rows | 90%+ size reduction |
| `idx_bookings_active` | `bookings` | `ON bookings (asset_id, start_date, end_date) WHERE status IN ('PENDING', 'APPROVED')` | Booking conflict detection — only checks active bookings | ~20-30% of all bookings |
| `idx_notifications_unread` | `notifications` | `ON notifications (user_id, created_at DESC) WHERE is_read = false` | Unread notification count badge | ~10-20% of notifications |
| `idx_refresh_tokens_valid` | `refresh_tokens` | `ON refresh_tokens (user_id, expires_at) WHERE revoked_at IS NULL` | Token validation during refresh | ~60-70% revoked/expired |
| `idx_api_tokens_active` | `api_tokens` | `ON api_tokens (user_id) WHERE expires_at > now() AND is_revoked = false` | Active API token validation | ~70-80% are expired/revoked |
| `idx_activity_logs_recent` | `activity_logs` | `ON activity_logs (user_id, created_at DESC) WHERE created_at > now() - interval '90 days'` | Recent activity feed (90-day window) | ~30% of all logs |
| `idx_assets_overdue_maintenance` | `assets` | `ON assets (office_id, maintenance_date) WHERE status = 'ACTIVE' AND maintenance_date < now()` | Alert: assets needing maintenance | ~5-8% of active assets |

**Scale impact:** At 1M assets with 10M activity_log rows, `idx_activity_logs_recent` indexes only ~3M rows instead of 10M, reducing both index build time and write amplification.

---

### 1.7 GiST Indexes (LTREE Hierarchies)

AssetFlow uses PostgreSQL's `ltree` extension for hierarchical asset category trees and department org-chart paths. GiST (Generalized Search Tree) indexes support ltree's `@>` (ancestor), `<@` (descendant), and `~` (match) operators.

| Index Name | Table | Column/Expression | Type | Purpose |
|---|---|---|---|---|
| `idx_asset_categories_path` | `asset_categories` | `path ltree` | GiST | Hierarchical category tree queries |
| `idx_departments_path` | `departments` | `path ltree` | GiST | Organizational hierarchy queries |

**Schema design:**

```sql
CREATE EXTENSION IF NOT EXISTS ltree;

-- Asset categories with hierarchical paths
-- Example: root -> IT Equipment -> Laptops -> Dell
-- Path: 'it_equipment.laptops.dell'

ALTER TABLE asset_categories ADD COLUMN path ltree;
CREATE INDEX idx_asset_categories_path ON asset_categories USING GIST (path);

-- Department hierarchy
-- Example: HQ -> Engineering -> Backend -> Platform
-- Path: 'hq.engineering.backend.platform'

ALTER TABLE departments ADD COLUMN path ltree;
CREATE INDEX idx_departments_path ON departments USING GIST (path);
```

**Query patterns supported:**

```sql
-- Find all descendants of "IT Equipment" category (any depth):
SELECT * FROM asset_categories WHERE path <@ 'it_equipment';

-- Find all ancestors of "Dell Laptops":
SELECT * FROM asset_categories WHERE path @> 'it_equipment.laptops.dell';

-- Find all categories at exactly 3 levels deep:
SELECT * FROM asset_categories WHERE nlevel(path) = 3;

-- Match a pattern (all categories containing "laptop" at any level):
SELECT * FROM asset_categories WHERE path ~ '*.laptop.*';

-- Find all assets in any sub-category of "IT Equipment":
SELECT a.* FROM assets a
  JOIN asset_categories ac ON a.category_id = ac.id
  WHERE ac.path <@ 'it_equipment';
```

**Performance:** GiST ltree indexes support O(log n) hierarchy lookups. At 1000 categories, depth-first traversals complete in <1 ms. The `<@` operator is particularly fast because GiST can skip entire subtrees.

---

### 1.8 Index Summary: Total Count and Impact

| Category | Count | Total Index Size (est. at 1M assets) |
|---|---|---|
| Primary Key (B-tree) | 14 | ~140 MB |
| Foreign Key (B-tree) | 22 | ~220 MB |
| Unique Constraint (B-tree) | 9 | ~90 MB |
| Composite (B-tree) | 17 | ~170 MB |
| Full-Text (GIN) | 5 | ~300 MB |
| Partial (B-tree) | 8 | ~80 MB |
| Hierarchy (GiST ltree) | 2 | ~20 MB |
| **Total** | **77** | **~1.02 GB** |

**Write overhead:** Each INSERT/UPDATE on the `assets` table triggers up to ~15 index updates. For bulk imports of 10K assets, this adds ~2-3x write time. Mitigation: use `CREATE INDEX CONCURRENTLY`, batch imports during off-hours, and temporarily drop non-critical indexes during massive data loads.

---

## PART 2: PERFORMANCE CONSIDERATIONS

### 2.1 Table Partitioning Strategy

Partitioning is essential for tables that grow unboundedly: `activity_logs`, `login_history`, `booking_history`, and `notifications`.

#### Partitioning Scheme: Range by `created_at`

```sql
-- activity_logs: partitioned by month
CREATE TABLE activity_logs (
  id         UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  asset_id   UUID,
  action     VARCHAR(100) NOT NULL,
  details    JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Monthly partitions (automated via pg_partman or cron)
CREATE TABLE activity_logs_2026_01 PARTITION OF activity_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE activity_logs_2026_02 PARTITION OF activity_logs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- login_history: partitioned by month
CREATE TABLE login_history (
  id             UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  ip_address     INET,
  user_agent     TEXT,
  success        BOOLEAN NOT NULL,
  failure_reason VARCHAR(255),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

CREATE TABLE login_history_2026_01 PARTITION OF login_history
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- booking_history: partitioned by month
CREATE TABLE booking_history (
  id         UUID NOT NULL DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  changed_by UUID,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

CREATE TABLE booking_history_2026_01 PARTITION OF booking_history
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- notifications: partitioned by month
CREATE TABLE notifications (
  id         UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  type       VARCHAR(50) NOT NULL,
  title      VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

CREATE TABLE notifications_2026_01 PARTITION OF notifications
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

#### Partition Management

```sql
-- Automated partition creation via pg_partman:
CREATE EXTENSION IF NOT EXISTS pg_partman;

SELECT partman.create_parent(
  p_parent_table := 'public.activity_logs',
  p_control := 'created_at',
  p_type := 'range',
  p_interval := '1 month',
  p_premake := 3  -- create 3 months ahead
);

-- Automatic partition detachment for old data:
-- Retention: 24 months for activity_logs, 12 months for login_history
UPDATE partman.part_config
SET retention = '24 months', retention_keep_table = false
WHERE parent_table = 'public.activity_logs';

UPDATE partman.part_config
SET retention = '12 months', retention_keep_table = false
WHERE parent_table = 'public.login_history';
```

**Benefits at scale:**

- A query on `activity_logs` for the current month scans ~100K rows instead of 50M+.
- `VACUUM` runs on individual partitions, not the entire table.
- Old partitions can be moved to cheaper storage (tablespaces) or dropped entirely.
- Partition pruning is automatic when `created_at` is in the `WHERE` clause.

#### Prisma Considerations for Partitioned Tables

Prisma does not natively support table partitioning. Two approaches:

1. **Use Prisma for schema-level operations only** and access partitioned tables via `prisma.$queryRaw`.
2. **Create a Prisma model** for the table (ignoring partitions) and manage partition creation via separate migration SQL. Prisma will read/write to the parent table, and PostgreSQL will route to the correct partition automatically based on `created_at`.

```typescript
// Prisma model for activity_logs (works with partitions transparently)
model activity_logs {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  assetId   String?  @map("asset_id") @db.Uuid
  action    String   @db.VarChar(100)
  details   Json?
  ipAddress String?  @map("ip_address") @db.Inet
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  user  employees? @relation(fields: [userId], references: [id])
  asset assets?    @relation(fields: [assetId], references: [id])

  @@index([userId, createdAt(sort: Desc)])
  @@index([assetId, createdAt(sort: Desc)])
  @@map("activity_logs")
}
```

---

### 2.2 Connection Pooling Recommendations

#### PgBouncer Configuration (Recommended for Production)

```ini
; pgbouncer.ini
[databases]
assetflow = host=localhost port=5432 dbname=assetflow

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

; Pool mode: transaction (recommended for Prisma)
pool_mode = transaction

; Pool sizing
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5
max_client_conn = 200
max_db_connections = 50

; Timeouts
server_idle_timeout = 300
client_idle_timeout = 0
query_timeout = 30
query_wait_timeout = 30
client_login_timeout = 60

; Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
stats_period = 60
```

#### Prisma Connection Pool Configuration

```typescript
// Application-level pool configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // points to PgBouncer on port 6432
    },
  },
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});
```

**Connection pool sizing formula:**

```
pool_size = (CPU_cores * 2) + effective_spindle_count
```

For a typical 4-core server with SSDs:

- PgBouncer pool: 20 connections (default_pool_size)
- Prisma internal pool: 10 + (num_cores * 2) = 18
- Total PostgreSQL max_connections: 50 (enough for PgBouncer + admin)

**Key rules:**

- Always use PgBouncer in `transaction` mode with Prisma (Prisma opens a connection per query in some cases).
- Never set `connection_limit` in Prisma higher than 100 without PgBouncer.
- Set `DATABASE_URL` to point at PgBouncer (port 6432) in production, direct PostgreSQL (port 5432) only for migrations.

---

### 2.3 Query Optimization Patterns

#### Pattern 1: Select Only Needed Columns

```typescript
// BAD: Fetches all columns including large text/JSON fields
const assets = await prisma.assets.findMany();

// GOOD: Select only display fields
const assets = await prisma.assets.findMany({
  select: {
    id: true,
    name: true,
    assetTag: true,
    status: true,
    category: { select: { name: true } },
    office: { select: { name: true } },
  },
});
```

#### Pattern 2: Use `take` Instead of Unbounded Queries

```typescript
// BAD: Could return 1M rows into memory
const allAssets = await prisma.assets.findMany({ where: { status: 'AVAILABLE' } });

// GOOD: Bounded result set
const firstBatch = await prisma.assets.findMany({
  where: { status: 'AVAILABLE' },
  take: 100,
  skip: 0,
});
```

#### Pattern 3: Aggregate Instead of Fetch + Count

```typescript
// BAD: Fetches all rows just to count them
const bookings = await prisma.bookings.findMany({ where: { status: 'APPROVED' } });
const count = bookings.length;

// GOOD: Single aggregate query
const { count } = await prisma.bookings.aggregate({
  where: { status: 'APPROVED' },
  _count: true,
});
```

#### Pattern 4: Avoid SELECT * in Raw Queries

```sql
-- BAD
SELECT * FROM assets WHERE office_id = $1;

-- GOOD: explicit column list
SELECT id, name, asset_tag, status, assigned_to_id
FROM assets
WHERE office_id = $1
ORDER BY created_at DESC
LIMIT 50;
```

#### Pattern 5: Use EXPLAIN ANALYZE to Verify

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT a.id, a.name, a.asset_tag, c.name as category_name
FROM assets a
JOIN asset_categories c ON a.category_id = c.id
WHERE a.office_id = $1 AND a.status = 'AVAILABLE'
ORDER BY a.created_at DESC
LIMIT 50;
```

Expected output at 1M assets with proper indexes:

```
Limit (cost=0.43..12.34 rows=50 width=...) (actual time=0.08..1.23 rows=50 loops=1)
  -> Index Scan using idx_assets_office_status on assets a (cost=0.43..234567.89 rows=100000 width=...) (actual time=0.07..1.18 rows=50 loops=1)
        Filter: (status = 'AVAILABLE')
        Rows Removed by Filter: 0
Planning Time: 0.15 ms
Execution Time: 1.45 ms
```

---

### 2.4 N+1 Query Prevention with Prisma

The N+1 problem occurs when fetching a list of items and then making a separate query for each item's related data.

#### Problem Example

```typescript
// BAD: 1 query for assets + N queries for categories = N+1
const assets = await prisma.assets.findMany({ take: 50 });
for (const asset of assets) {
  asset.category = await prisma.asset_categories.findUnique({
    where: { id: asset.categoryId },
  });
}
```

#### Solution 1: Eager Loading with `include`

```typescript
// GOOD: Single query with JOIN via Prisma's include
const assets = await prisma.assets.findMany({
  take: 50,
  include: {
    category: { select: { id: true, name: true } },
    office: { select: { id: true, name: true } },
    assignedTo: {
      select: { id: true, firstName: true, lastName: true, email: true },
    },
    department: { select: { id: true, name: true } },
  },
});
```

Generated SQL (single query with LEFT JOINs):

```sql
SELECT
  a."id", a."name", a."asset_tag", a."status",
  c."id" AS c_id, c."name" AS c_name,
  o."id" AS o_id, o."name" AS o_name,
  e."id" AS e_id, e."first_name" AS e_first_name,
  e."last_name" AS e_last_name, e."email" AS e_email,
  d."id" AS d_id, d."name" AS d_name
FROM "assets" a
LEFT JOIN "asset_categories" c ON c."id" = a."category_id"
LEFT JOIN "offices" o ON o."id" = a."office_id"
LEFT JOIN "employees" e ON e."id" = a."assigned_to_id"
LEFT JOIN "departments" d ON d."id" = a."department_id"
ORDER BY a."created_at" DESC
LIMIT 50;
```

#### Solution 2: Selective Field Loading

```typescript
// GOOD: Only load fields you actually display
const assets = await prisma.assets.findMany({
  take: 50,
  select: {
    id: true,
    name: true,
    assetTag: true,
    status: true,
    category: { select: { name: true } },
    office: { select: { name: true } },
  },
});
```

#### Solution 3: Batch Loading for Deeply Nested Relations

When you need related data of related data (e.g., asset -> assignedTo -> department -> office), use `include` nesting:

```typescript
const assets = await prisma.assets.findMany({
  take: 20,
  select: {
    id: true,
    name: true,
    assignedTo: {
      select: {
        firstName: true,
        lastName: true,
        department: {
          select: {
            name: true,
            office: { select: { name: true } },
          },
        },
      },
    },
  },
});
```

#### Solution 4: DataLoader for Custom Batch Resolution

For complex scenarios (e.g., aggregations on relations), use the `dataloader` package:

```typescript
import DataLoader from 'dataloader';

const assetBookingCountLoader = new DataLoader(async (assetIds: string[]) => {
  const results = await prisma.bookings.groupBy({
    by: ['assetId'],
    where: { assetId: { in: assetIds } },
    _count: { id: true },
  });

  const countMap = new Map(results.map(r => [r.assetId, r._count.id]));
  return assetIds.map(id => countMap.get(id) || 0);
});

// Usage
const assets = await prisma.assets.findMany({ take: 50 });
const counts = await assetBookingCountLoader.loadMany(assets.map(a => a.id));
```

---

### 2.5 Pagination Strategies

#### Strategy 1: Cursor-Based Pagination (Recommended)

Best for: infinite scroll, API stability, large datasets.

```typescript
async function getAssetsCursor(params: {
  cursor?: string;
  take?: number;
  where?: Prisma.assetsWhereInput;
  orderBy?: Prisma.assetsOrderByWithRelationInput;
}) {
  const { cursor, take = 25, where, orderBy } = params;

  const query: Prisma.assetsFindManyArgs = {
    take: take + 1, // Fetch one extra to detect "has next"
    where,
    orderBy: orderBy || { createdAt: 'desc' },
    cursor: cursor ? { id: cursor } : undefined,
    include: {
      category: { select: { name: true } },
      office: { select: { name: true } },
    },
  };

  const results = await prisma.assets.findMany(query);
  const hasNext = results.length > take;
  const items = hasNext ? results.slice(0, take) : results;
  const nextCursor = hasNext ? items[items.length - 1].id : null;

  return { items, nextCursor, hasNext };
}
```

**API response format:**

```json
{
  "data": [
    { "id": "abc-123", "name": "MacBook Pro 16", "assetTag": "AST-001" }
  ],
  "pagination": {
    "nextCursor": "xyz-789",
    "hasNext": true,
    "count": 25
  }
}
```

**Why cursor-based over offset:**

- At offset 500,000, PostgreSQL must scan and discard 500K rows before returning results (~2-5 s).
- Cursor-based uses the primary key index to start reading from the exact position (~2-5 ms regardless of position).
- No "phantom rows" when data is inserted/deleted between page requests.

#### Strategy 2: Offset-Based Pagination (Simple Queries Only)

Acceptable for: small result sets (< 10K total), admin UIs with explicit page numbers.

```typescript
async function getAssetsOffset(page: number, perPage: number = 25) {
  const skip = (page - 1) * perPage;

  const [items, total] = await Promise.all([
    prisma.assets.findMany({
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.assets.aggregate({ _count: true }),
  ]);

  return {
    data: items,
    pagination: {
      page,
      perPage,
      total: total._count,
      totalPages: Math.ceil(total._count / perPage),
    },
  };
}
```

**Limitation:** Prisma's `skip` + `take` with offset becomes slow at high offsets. For offsets > 10K, always switch to cursor-based.

#### Strategy 3: Keyset Pagination for Reports

For ordered reports that need stable ordering:

```sql
-- Keyset pagination for a report sorted by created_at DESC, id DESC
SELECT id, name, asset_tag, status, created_at
FROM assets
WHERE (created_at, id) < ($1, $2)  -- cursor values
ORDER BY created_at DESC, id DESC
LIMIT 50;
```

---

### 2.6 Bulk Operations

#### Bulk Insert with Prisma

```typescript
// createMany: fast bulk insert (single INSERT statement)
await prisma.assets.createMany({
  data: [
    { name: 'MacBook Pro 1', assetTag: 'AST-001', status: 'AVAILABLE' },
    { name: 'MacBook Pro 2', assetTag: 'AST-002', status: 'AVAILABLE' },
    // ... up to 10K records
  ],
  skipDuplicates: true, // Skip on unique constraint violation
});
```

**Performance at scale:**

| Batch Size | Time (10K rows) | Memory Usage |
|---|---|---|
| 100 | ~4.2 s | ~10 MB |
| 500 | ~1.8 s | ~50 MB |
| 1,000 | ~1.1 s | ~100 MB |
| 5,000 | ~0.9 s | ~500 MB |
| 10,000 | ~0.85 s | ~1 GB |

**Recommendation:** Batch at 500-1000 rows for the best balance of speed and memory.

#### Bulk Update

```typescript
// Transaction-based bulk update
await prisma.$transaction(async (tx) => {
  const batchSize = 500;
  const assetIds = ['id-1', 'id-2'];

  for (let i = 0; i < assetIds.length; i += batchSize) {
    const batch = assetIds.slice(i, i + batchSize);
    await tx.assets.updateMany({
      where: { id: { in: batch } },
      data: { status: 'IN_MAINTENANCE' },
    });
  }
});
```

#### Bulk Delete

```typescript
// Soft delete (preferred for auditable data)
await prisma.assets.updateMany({
  where: { officeId: decommissionedOfficeId },
  data: { status: 'DECOMMISSIONED', deletedAt: new Date() },
});

// Hard delete via raw SQL (only for partition maintenance)
await prisma.$executeRaw`
  DELETE FROM activity_logs
  WHERE created_at < now() - interval '24 months'
`;
```

#### Raw SQL Bulk Operations

```sql
-- Bulk asset status transition with a single UPDATE
UPDATE assets
SET status = 'AVAILABLE', updated_at = now()
WHERE assigned_to_id = $1
  AND status = 'IN_USE';

-- Bulk insert with conflict handling
INSERT INTO asset_history (asset_id, action, performed_by_id, details, created_at)
VALUES
  ($1, 'ASSIGNED', $2, '{"from": "unassigned", "to": "user-123"}', now()),
  ($3, 'MAINTENANCE_START', $4, '{"reason": "annual check"}', now())
ON CONFLICT DO NOTHING;
```

---

### 2.7 Caching Strategy (Redis Integration)

#### Cache Architecture

```
Client -> Express -> Redis Cache -> PostgreSQL
                | (miss)
            PostgreSQL -> Cache result in Redis -> Return to client
```

#### Cache Layers

| Layer | What to Cache | TTL | Invalidation Strategy |
|---|---|---|---|
| **L1: Application** | Current user's profile, permissions | 5 min | On user update |
| **L2: Redis — Hot Data** | Asset detail pages, category trees, office lists | 15 min | On write to entity |
| **L3: Redis — Query Cache** | Dashboard counts, search results | 5 min | TTL-based (stale OK) |
| **L4: CDN** | Static assets, export files | 1 hour | On file version change |

#### Redis Integration Implementation

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
  db: 0,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
});

class CacheService {
  private static PREFIX = 'assetflow:';
  private static DEFAULT_TTL = 900; // 15 minutes

  static async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(this.PREFIX + key);
    return data ? JSON.parse(data) : null;
  }

  static async set(key: string, value: unknown, ttl: number = this.DEFAULT_TTL): Promise<void> {
    await redis.setex(this.PREFIX + key, ttl, JSON.stringify(value));
  }

  static async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(this.PREFIX + pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  // Cache-aside pattern for asset details
  static async getAsset(assetId: string): Promise<Asset | null> {
    const cacheKey = `asset:${assetId}`;
    let asset = await this.get<Asset>(cacheKey);
    if (!asset) {
      asset = await prisma.assets.findUnique({
        where: { id: assetId },
        include: { category: true, office: true, assignedTo: true },
      });
      if (asset) await this.set(cacheKey, asset);
    }
    return asset;
  }

  // Invalidate on asset update
  static async invalidateAsset(assetId: string): Promise<void> {
    await this.invalidate(`asset:${assetId}`);
    await this.invalidate('dashboard:*');
    await this.invalidate('assets:list:*');
  }
}
```

#### Cache Invalidation Rules

| Event | Cache Keys Invalidated | Method |
|---|---|---|
| Asset updated | `asset:{id}`, `assets:list:*`, `dashboard:*` | Pattern delete |
| Asset assigned/returned | `asset:{id}`, `employee:{assigneeId}:assets`, `dashboard:*` | Pattern delete |
| Booking created/approved | `asset:{assetId}:bookings`, `dashboard:*` | Pattern delete |
| Employee updated | `employee:{id}`, `employees:list:*` | Pattern delete |
| Category tree modified | `categories:tree`, `categories:*` | Pattern delete |
| Office updated | `offices:list`, `office:{id}` | Direct delete |

---

### 2.8 Database Connection Limits

| Environment | Max Connections | PgBouncer Pool | Recommendation |
|---|---|---|---|
| **Development** | 20 | N/A (direct) | Single user, no pooling needed |
| **Staging** | 50 | 20 | Simulate production load |
| **Production** | 100-200 | 50 (transaction mode) | PgBouncer between app and DB |
| **Read Replica** | 50 | 25 | Separate pool for read-heavy queries |

#### Connection Monitoring Query

```sql
-- Current connection count and state
SELECT
  state,
  COUNT(*) as count,
  MAX(now() - state_change) as max_duration
FROM pg_stat_activity
WHERE datname = 'assetflow'
GROUP BY state;

-- Connections per application
SELECT
  application_name,
  COUNT(*) as count,
  state
FROM pg_stat_activity
WHERE datname = 'assetflow'
GROUP BY application_name, state
ORDER BY count DESC;

-- Idle connections older than 5 minutes (potential leak)
SELECT pid, usename, application_name, state, state_change
FROM pg_stat_activity
WHERE datname = 'assetflow'
  AND state = 'idle'
  AND state_change < now() - interval '5 minutes';
```

#### PostgreSQL Configuration for 1M-Asset Scale

```sql
-- postgresql.conf recommendations
max_connections = 100          -- PgBouncer handles multiplexing
shared_buffers = '4GB'         -- 25% of 16GB RAM
effective_cache_size = '12GB'  -- 75% of RAM
work_mem = '64MB'              -- Per-sort/hash operation
maintenance_work_mem = '1GB'   -- VACUUM, CREATE INDEX
wal_buffers = '64MB'
checkpoint_completion_target = 0.9
random_page_cost = 1.1         -- SSD storage
effective_io_concurrency = 200 -- SSD storage
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
```

---

### 2.9 Vacuum and Maintenance

#### Autovacuum Configuration

```sql
-- Aggressive autovacuum for high-write tables
ALTER TABLE activity_logs SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005,
  autovacuum_vacuum_cost_delay = 2,
  autovacuum_vacuum_cost_limit = 1000
);

ALTER TABLE booking_history SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005,
  autovacuum_vacuum_cost_delay = 2,
  autovacuum_vacuum_cost_limit = 1000
);

ALTER TABLE notifications SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_cost_delay = 5,
  autovacuum_vacuum_cost_limit = 500
);

ALTER TABLE login_history SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_cost_delay = 2,
  autovacuum_vacuum_cost_limit = 1000
);
```

#### Maintenance Schedule

| Task | Frequency | Window | Impact |
|---|---|---|---|
| Autovacuum (default) | Continuous | N/A | Minimal overhead |
| Autovacuum (high-write tables) | Continuous (tuned) | N/A | Low overhead, higher frequency |
| `ANALYZE` | Daily | 03:00 UTC | Updates planner statistics |
| `REINDEX` on GIN indexes | Weekly | Sunday 02:00 UTC | 10-30 min lock on search |
| `VACUUM FULL` (partition detach) | Monthly | First Sunday 01:00 UTC | Requires exclusive lock |
| Partition maintenance (pg_partman) | Daily | 04:00 UTC | Creates future partitions |
| Backup verification | Weekly | Sunday 05:00 UTC | Restore test to staging |

#### Bloat Monitoring

```sql
SELECT
  schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS table_size,
  n_live_tup,
  n_dead_tup,
  round(n_dead_tup::numeric / GREATEST(n_live_tup, 1) * 100, 2) AS dead_ratio
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;
```

---

### 2.10 Monitoring and Alerting

#### Key Metrics to Monitor

| Metric | Query | Threshold | Alert |
|---|---|---|---|
| Connection count | `SELECT count(*) FROM pg_stat_activity WHERE datname='assetflow'` | > 80% of max | Critical |
| Slow queries | `pg_stat_statements` WHERE mean_time > 1000ms | > 100/day | Warning |
| Cache hit ratio | `sum(blks_hit) / (sum(blks_hit) + sum(blks_read))` | < 99% | Warning |
| Dead tuple ratio | `n_dead_tup / GREATEST(n_live_tup, 1)` | > 10% | Warning |
| Table size growth | `pg_total_relation_size()` over time | > 50% monthly growth | Info |
| Replica lag | `pg_stat_replication` | > 30 seconds | Critical |
| Transaction rate | `xact_commit + xact_rollback` per second | > 1000 TPS sustained | Info |
| Lock waits | `pg_locks` WHERE NOT granted | > 10 concurrent | Warning |
| Disk usage | `pg_tablespace_size()` | > 80% of disk | Critical |

#### pg_stat_statements Setup

```sql
-- Enable in postgresql.conf:
-- shared_preload_libraries = 'pg_stat_statements'
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 10 slowest queries
SELECT
  calls,
  round(total_exec_time::numeric, 2) AS total_ms,
  round(mean_exec_time::numeric, 2) AS avg_ms,
  round(max_exec_time::numeric, 2) AS max_ms,
  rows,
  query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Most frequently called queries
SELECT calls, query
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;
```

#### Application-Level Metrics (Express Middleware)

```typescript
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const labels = { method: req.method, path: req.route?.path, status: res.statusCode };

    // Export to Prometheus/StatsD/Datadog
    httpRequestDuration.observe(labels, duration / 1000);

    if (duration > 5000) {
      logger.warn('Slow request', { ...labels, duration });
    }
  });
  next();
});
```

---

### 2.11 Capacity Planning

#### Data Volume Projections (5-Year)

| Table | Year 1 | Year 3 | Year 5 | Avg Row Size | Storage (Year 5) |
|---|---|---|---|---|---|
| `assets` | 1M | 2M | 3.5M | ~1 KB | ~3.5 GB |
| `asset_history` | 5M | 20M | 40M | ~0.5 KB | ~20 GB |
| `bookings` | 2M | 8M | 15M | ~0.8 KB | ~12 GB |
| `booking_history` | 4M | 16M | 30M | ~0.4 KB | ~12 GB |
| `activity_logs` | 10M | 40M | 80M | ~0.6 KB | ~48 GB |
| `login_history` | 5M | 15M | 25M | ~0.3 KB | ~7.5 GB |
| `notifications` | 3M | 10M | 20M | ~0.4 KB | ~8 GB |
| `employees` | 100K | 150K | 200K | ~0.5 KB | ~100 MB |
| **Total (Year 5)** | | | | | **~111 GB** |

With partitioning and retention policies (dropping data older than 24 months for logs, 12 months for login_history):

| Table | Retention | Year 5 On-Disk |
|---|---|---|
| `activity_logs` | 24 months | ~24 GB |
| `booking_history` | 24 months | ~6 GB |
| `login_history` | 12 months | ~2.5 GB |
| `notifications` | 12 months | ~3 GB |
| **Total with retention** | | **~62 GB** |

#### Hardware Recommendations

| Component | Minimum (Year 1) | Recommended (Year 3+) |
|---|---|---|
| CPU | 4 cores | 8 cores |
| RAM | 16 GB | 32 GB |
| Storage | 200 GB SSD | 500 GB NVMe SSD |
| IOPS | 3,000 | 10,000+ |
| Network | 1 Gbps | 10 Gbps |
| Backup | Daily WAL + weekly full | Streaming replication + daily WAL |

#### Index Storage Budget

At 1M assets with 77 total indexes (see Section 1.8): **~1 GB total index storage**.
At 3.5M assets (Year 5): **~3.5 GB total index storage**.

This is well within acceptable bounds. The GIN indexes for full-text search are the largest (~300 MB at 1M rows, ~1 GB at 3.5M rows).

---

## PART 3: SECURITY ARCHITECTURE

### 3.1 Password Storage

#### Implementation: bcrypt with salt rounds

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // 2^12 = 4096 iterations

// Hash password on creation/update
async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// Verify password on login
async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
```

**Configuration rationale:**

| Salt Rounds | Hash Time (2026 Hardware) | Security Level | Recommendation |
|---|---|---|---|
| 10 | ~100 ms | Adequate for low-value | Not recommended |
| 11 | ~200 ms | Good | Minimum |
| **12** | **~400 ms** | **Strong** | **Recommended (default)** |
| 13 | ~800 ms | Very strong | High-security environments |
| 14 | ~1.5 s | Maximum | May impact UX on login |

**Rules:**

- Never store plaintext passwords.
- Never log password hashes.
- Enforce minimum password policy: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.
- Rotate salt rounds upward as hardware improves (review annually).
- Use constant-time comparison (bcrypt.compare does this internally).

**Prisma schema:**

```prisma
model employees {
  id             String    @id @default(uuid()) @db.Uuid
  email          String    @unique @db.VarChar(255)
  passwordHash   String    @map("password_hash") @db.VarChar(255)
  // ... other fields
}
```

---

### 3.2 JWT Token Strategy

#### Token Architecture: Access + Refresh

```
+-----------------------------------------------------+
|                    Auth Flow                         |
|                                                      |
|  Login -> Access Token (15 min) + Refresh Token (7d) |
|                                                      |
|  API Request + Access Token                         |
|    |-- Valid -> Process request                      |
|    |-- Expired -> Use Refresh Token to get new pair  |
|                                                      |
|  Refresh Token used -> Old refresh token revoked     |
|                        (rotation)                    |
+-----------------------------------------------------+
```

#### Access Token

```typescript
import jwt from 'jsonwebtoken';

interface AccessTokenPayload {
  sub: string;       // Employee UUID
  email: string;
  role: string;      // 'ADMIN', 'MANAGER', 'EMPLOYEE'
  officeId: string;
  departmentId: string;
  iat: number;
  exp: number;
  jti: string;       // Unique token ID for revocation
}

// Generate access token
function generateAccessToken(user: Employee): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      officeId: user.officeId,
      departmentId: user.departmentId,
      jti: crypto.randomUUID(),
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: '15m',
      issuer: 'assetflow',
      audience: 'assetflow-api',
    }
  );
}

// Verify access token
function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
    issuer: 'assetflow',
    audience: 'assetflow-api',
  }) as AccessTokenPayload;
}
```

#### Refresh Token

```typescript
// Generate refresh token
async function generateRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refresh_tokens.create({
    data: {
      userId,
      token: tokenHash,
      expiresAt,
      userAgent: /* from request */,
      ipAddress: /* from request */,
    },
  });

  return token; // Send plaintext to client; only hash stored in DB
}

// Refresh flow: rotate tokens
async function refreshTokens(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const stored = await prisma.refresh_tokens.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Revoke old token (rotation)
  await prisma.refresh_tokens.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  // Issue new pair
  const newAccessToken = generateAccessToken(stored.user);
  const newRefreshToken = await generateRefreshToken(stored.userId);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

#### Token Security Rules

| Rule | Implementation |
|---|---|
| Access token TTL: 15 minutes | `expiresIn: '15m'` in JWT sign |
| Refresh token TTL: 7 days | Stored in DB with `expires_at` |
| Refresh token rotation | Old token revoked on every use |
| Revoked refresh tokens rejected | `revokedAt IS NOT NULL` check |
| Token family tracking | Detect reuse of revoked tokens (breach alert) |
| Secrets from env vars | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — 256-bit minimum |
| No tokens in URLs | Only in `Authorization: Bearer` header |
| HttpOnly cookies for web | Refresh token stored in HttpOnly, Secure, SameSite=Strict cookie |

---

### 3.3 API Token Management

API tokens are long-lived tokens for programmatic access (integrations, webhooks, CLI tools).

#### Schema

```sql
CREATE TABLE api_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES employees(id),
  name         VARCHAR(100) NOT NULL,       -- "CI/CD Pipeline", "Zapier Integration"
  token_hash   VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 of the token
  scopes       TEXT[] NOT NULL DEFAULT '{}',  -- ['assets:read', 'bookings:write']
  expires_at   TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  is_revoked   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Token Lifecycle

```typescript
// Create API token
async function createApiToken(userId: string, name: string, scopes: string[], expiresInDays?: number) {
  const rawToken = `af_${crypto.randomBytes(32).toString('hex')}`; // prefixed for identification
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const token = await prisma.api_tokens.create({
    data: {
      userId,
      name,
      tokenHash,
      scopes,
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 86400000)
        : null,
    },
  });

  // Return raw token ONCE — never stored or retrievable again
  return { ...token, rawToken };
}

// Validate API token
async function validateApiToken(rawToken: string): Promise<{ user: Employee; scopes: string[] } | null> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const stored = await prisma.api_tokens.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.isRevoked) return null;
  if (stored.expiresAt && stored.expiresAt < new Date()) return null;

  // Update last_used_at (async, don't block)
  prisma.api_tokens.update({
    where: { id: stored.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {}); // fire and forget

  return { user: stored.user, scopes: stored.scopes };
}
```

#### Scope Hierarchy

```
admin:*               -> Full access
assets:read           -> View assets
assets:write          -> Create/update assets
assets:delete         -> Delete assets
bookings:read         -> View bookings
bookings:write        -> Create/update bookings
employees:read        -> View employees
employees:write       -> Create/update employees
reports:read          -> View reports
admin:tokens          -> Manage API tokens
```

---

### 3.4 Row-Level Security (RLS)

RLS ensures that users can only access data they are authorized to see, even if application code has bugs.

#### Enable RLS on All Tables

```sql
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
```

#### Policy: Set Current User Context

```sql
-- Application sets this at the start of each request:
SET LOCAL app.current_user_id = '<employee-uuid>';
SET LOCAL app.current_user_role = 'ADMIN';
SET LOCAL app.current_user_office_id = '<office-uuid>';
```

#### Policies

```sql
-- ASSETS: Users see assets in their office; admins see all
CREATE POLICY assets_office_isolation ON assets
  FOR SELECT
  USING (
    current_setting('app.current_user_role') = 'ADMIN'
    OR office_id = current_setting('app.current_user_office_id')::uuid
  );

-- ASSETS: Users can only modify assets in their office
CREATE POLICY assets_office_modify ON assets
  FOR UPDATE
  USING (
    current_setting('app.current_user_role') IN ('ADMIN', 'MANAGER')
    OR office_id = current_setting('app.current_user_office_id')::uuid
  );

-- BOOKINGS: Users see their own bookings + bookings in their office
CREATE POLICY bookings_visibility ON bookings
  FOR SELECT
  USING (
    current_setting('app.current_user_role') = 'ADMIN'
    OR booked_by_id = current_setting('app.current_user_id')::uuid
    OR asset_id IN (
      SELECT id FROM assets
      WHERE office_id = current_setting('app.current_user_office_id')::uuid
    )
  );

-- EMPLOYEES: Users see employees in their office; admins see all
CREATE POLICY employees_office_isolation ON employees
  FOR SELECT
  USING (
    current_setting('app.current_user_role') = 'ADMIN'
    OR office_id = current_setting('app.current_user_office_id')::uuid
  );

-- NOTIFICATIONS: Users only see their own
CREATE POLICY notifications_user_isolation ON notifications
  FOR ALL
  USING (
    user_id = current_setting('app.current_user_id')::uuid
  );

-- ACTIVITY_LOGS: Managers and admins can read; users see own actions
CREATE POLICY activity_logs_visibility ON activity_logs
  FOR SELECT
  USING (
    current_setting('app.current_user_role') IN ('ADMIN', 'MANAGER')
    OR user_id = current_setting('app.current_user_id')::uuid
  );

-- COMMENTS: Visible if asset is visible
CREATE POLICY comments_asset_visibility ON comments
  FOR SELECT
  USING (
    asset_id IN (
      SELECT id FROM assets
      WHERE current_setting('app.current_user_role') = 'ADMIN'
        OR office_id = current_setting('app.current_user_office_id')::uuid
    )
  );
```

#### RLS in Prisma

```typescript
// Middleware to set session variables before each query
prisma.$use(async (params, next) => {
  if (params.model && params.action) {
    const userId = getCurrentUserId();
    const userRole = getCurrentUserRole();
    const officeId = getCurrentUserOfficeId();

    await prisma.$executeRawUnsafe(
      `SET LOCAL app.current_user_id = '${userId}';`
    );
    await prisma.$executeRawUnsafe(
      `SET LOCAL app.current_user_role = '${userRole}';`
    );
    await prisma.$executeRawUnsafe(
      `SET LOCAL app.current_user_office_id = '${officeId}';`
    );
  }

  return next(params);
});
```

**Important:** RLS policies execute at the database level, meaning even raw SQL queries and Prisma `findMany` calls are filtered. This provides defense-in-depth against SQL injection and authorization bypass bugs.

---

### 3.5 Data Encryption

#### At Rest

| Layer | Method | Scope |
|---|---|---|
| **PostgreSQL Transparent** | `pgcrypto` filesystem encryption or LUKS/dm-crypt | Full database volume |
| **Column-level** | `pgcrypto` `pgp_sym_encrypt()` | `employees.salary`, `employees.ssn` |
| **Backup encryption** | AES-256 via `pg_basebackup` + GPG | All backup files |
| **Application-level** | AES-256-GCM via Node.js `crypto` | Sensitive PII fields |

```sql
-- Column-level encryption for highly sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypted column example (salary, accessible only via stored function)
ALTER TABLE employees ADD COLUMN salary_encrypted BYTEA;

-- Encrypt on insert
UPDATE employees
SET salary_encrypted = pgp_sym_encrypt(
  salary::text,
  current_setting('app.encryption_key')
)
WHERE salary IS NOT NULL;

-- Decrypt only via controlled function
CREATE OR REPLACE FUNCTION get_employee_salary(emp_id UUID, requesting_user UUID)
RETURNS NUMERIC AS $$
DECLARE
  result NUMERIC;
BEGIN
  IF current_setting('app.current_user_role') != 'ADMIN' THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;
  result := pgp_sym_decrypt(
    (SELECT salary_encrypted FROM employees WHERE id = emp_id),
    current_setting('app.encryption_key')
  )::numeric;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### In Transit

| Connection | Protocol | Configuration |
|---|---|---|
| App -> PostgreSQL | TLS 1.3 | `sslmode=verify-full` in connection string |
| App -> Redis | TLS 1.3 | `tls: { rejectUnauthorized: true }` |
| Client -> App (API) | TLS 1.3 | HTTPS only; HSTS header |
| App -> Email/SMTP | TLS 1.2+ | `secure: true` in SMTP config |

```
# DATABASE_URL with TLS
DATABASE_URL=postgresql://user:pass@host:5432/assetflow?sslmode=verify-full&sslcert=/path/to/client-cert.pem&sslkey=/path/to/client-key.pem&sslrootcert=/path/to/ca-cert.pem
```

---

### 3.6 Sensitive Data Handling

#### Classification

| Level | Data Examples | Protection | Access |
|---|---|---|---|
| **Public** | Office names, department names, asset categories | None required | Everyone |
| **Internal** | Asset names, statuses, employee names, emails | Standard auth | Authenticated users |
| **Confidential** | Employee salary, home address, phone number | Encryption + RLS + audit | HR/Admin only |
| **Restricted** | SSN, bank details, medical info | Column-level encryption + MFA | HR Admin only |

#### Prisma Schema Annotations

```prisma
model employees {
  // ... standard fields

  // Confidential: visible to managers+
  phoneNumber   String?  @map("phone_number") @db.VarChar(20)
  homeAddress   String?  @map("home_address") @db.Text

  // Restricted: encrypted at application level, never returned in lists
  salary        Decimal? @db.Decimal(12, 2)
  ssn           String?  @map("ssn") @db.VarChar(11)  // Stored encrypted

  // NOT stored: credit cards, bank account numbers
  // These are never persisted; processed via PCI-compliant third party
}
```

#### API Response Filtering

```typescript
// Middleware to strip sensitive fields from responses
function sanitizeResponse(data: unknown, userRole: string): unknown {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponse(item, userRole));
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };

    // Never expose these to non-admins
    const restrictedFields = ['salary', 'ssn', 'homeAddress', 'phoneNumber'];
    if (!['ADMIN', 'HR_ADMIN'].includes(userRole)) {
      for (const field of restrictedFields) {
        delete sanitized[field];
      }
    }

    // Never expose these to anyone
    delete sanitized.passwordHash;
    delete sanitized.salaryEncrypted;

    return sanitized;
  }

  return data;
}
```

---

### 3.7 SQL Injection Prevention

#### Layer 1: Parameterized Queries (Prisma)

```typescript
// Prisma uses parameterized queries by default — SAFE
const assets = await prisma.assets.findMany({
  where: {
    name: userInput, // Prisma parameterizes this automatically
  },
});
```

#### Layer 2: Raw Query Parameterization

```typescript
// SAFE: Parameterized raw query
const assets = await prisma.$queryRaw`
  SELECT id, name, asset_tag
  FROM assets
  WHERE name ILIKE ${'%' + searchTerm + '%'}
    AND office_id = ${officeId}
  LIMIT 50
`;

// DANGEROUS: Never do this
const assets = await prisma.$queryRawUnsafe(
  `SELECT * FROM assets WHERE name ILIKE '%${userInput}%'`  // SQL INJECTION!
);
```

#### Layer 3: Input Validation (Zod)

```typescript
import { z } from 'zod';

const AssetSearchSchema = z.object({
  query: z.string().max(200).regex(/^[a-zA-Z0-9\s\-_.]+$/), // Whitelist characters
  officeId: z.string().uuid(),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'DECOMMISSIONED']),
  page: z.number().int().min(1).max(1000),
  limit: z.number().int().min(1).max(100),
});
```

#### Layer 4: Stored Procedures for Sensitive Operations

```sql
-- Only the function owner can execute sensitive queries
CREATE OR REPLACE FUNCTION search_assets(
  p_search_term TEXT,
  p_office_id UUID,
  p_limit INT DEFAULT 50
)
RETURNS TABLE(id UUID, name VARCHAR, asset_tag VARCHAR, status VARCHAR)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.name, a.asset_tag, a.status
  FROM assets a
  WHERE a.name ILIKE '%' || p_search_term || '%'
    AND (p_office_id IS NULL OR a.office_id = p_office_id)
  ORDER BY a.name
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

---

### 3.8 Audit Logging

#### Audit Log Schema

```sql
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES employees(id),
  action       VARCHAR(50) NOT NULL,       -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT'
  entity_type  VARCHAR(50) NOT NULL,       -- 'asset', 'booking', 'employee', 'settings'
  entity_id    UUID,
  old_values   JSONB,                      -- Snapshot before change
  new_values   JSONB,                      -- Snapshot after change
  ip_address   INET,
  user_agent   TEXT,
  request_id   UUID,                       -- Correlation ID for tracing
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partitioned by month (like activity_logs)
-- audit_logs is also partitioned by range (created_at) for consistency

-- Indexes
CREATE INDEX idx_audit_logs_user ON audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs (action, created_at DESC);
```

#### Audit Middleware

```typescript
// Automatic audit logging via Prisma middleware
prisma.$use(async (params, next) => {
  const action = params.action;
  const model = params.model;

  if (['create', 'update', 'delete', 'upsert'].includes(action)) {
    const startTime = Date.now();
    const result = await next(params);
    const duration = Date.now() - startTime;

    // Log asynchronously (don't block the response)
    logAudit({
      userId: getCurrentUserId(),
      action: action.toUpperCase(),
      entityType: model,
      entityId: result?.id,
      oldValues: action === 'update' ? params.args.data : undefined,
      newValues: result,
      ipAddress: getCurrentIP(),
      userAgent: getCurrentUserAgent(),
      requestId: getCurrentRequestId(),
    }).catch(err => logger.error('Audit log failed', err));

    return result;
  }

  return next(params);
});
```

#### What MUST Be Audited

| Event | Minimum Required Data |
|---|---|
| Asset created/updated/deleted | Before/after snapshot, user, timestamp |
| Asset assigned/returned | Employee, dates, before/after status |
| Booking created/approved/rejected/cancelled | Booked by, approved by, dates, status changes |
| Employee created/updated/deactivated | Before/after snapshot (excluding PII for non-admins) |
| Login success/failure | Email, IP, user agent, success/failure |
| Password changed | User, IP, timestamp |
| API token created/revoked | User, token name, scopes |
| Data export (CSV/PDF) | User, query filters, record count |
| Settings changed | Before/after settings, user |
| Role changed | User, target employee, old role, new role |

---

### 3.9 Session Security

#### Session Configuration

```typescript
import session from 'express-session';

app.use(session({
  secret: process.env.SESSION_SECRET,       // 256-bit random
  name: 'af.sid',                           // Non-descriptive cookie name
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,                          // Not accessible via JavaScript
    secure: true,                            // HTTPS only
    sameSite: 'strict',                      // CSRF protection
    maxAge: 15 * 60 * 1000,                 // 15 minutes (matches access token)
    domain: '.assetflow.example.com',
    path: '/',
  },
}));
```

#### Session Rules

| Rule | Implementation |
|---|---|
| Max session duration | 15 minutes (access token TTL) |
| Idle timeout | 15 minutes |
| Max concurrent sessions | 5 per user |
| Session fixation prevention | Regenerate session ID on login |
| Secure cookie flags | `httpOnly`, `secure`, `sameSite=strict` |
| Session invalidation on logout | Delete from Redis + clear cookie |
| Invalidated on password change | All sessions for user revoked |

#### Concurrent Session Management

```typescript
const MAX_SESSIONS_PER_USER = 5;

async function createSession(userId: string, req: Request) {
  const activeSessions = await redis.keys(`session:${userId}:*`);

  if (activeSessions.length >= MAX_SESSIONS_PER_USER) {
    // Revoke oldest session
    const oldest = activeSessions[0];
    await redis.del(oldest);
  }

  const sessionId = crypto.randomUUID();
  await redis.setex(
    `session:${userId}:${sessionId}`,
    900, // 15 min
    JSON.stringify({
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      createdAt: Date.now(),
    })
  );
}
```

---

### 3.10 Rate Limiting

#### Strategy: Sliding Window with Redis

```typescript
import RateLimiterRedis from 'rate-limiter-flexible';

const redisClient = new Redis(/* ... */);

// Global rate limiter: 100 requests per minute per IP
const globalLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:global',
  points: 100,
  duration: 60,
  blockDuration: 300, // Block for 5 min if exceeded
});

// Auth endpoints: 5 attempts per 15 minutes (prevent brute force)
const authLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:auth',
  points: 5,
  duration: 900,
  blockDuration: 900,
});

// API token endpoints: 10 requests per minute
const apiLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:api',
  points: 10,
  duration: 60,
});

// Apply rate limiting middleware
async function rateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.ip || req.headers['x-forwarded-for'];
    await globalLimiter.consume(key);
    next();
  } catch (rateLimiterRes) {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        retryAfter: Math.ceil(rateLimiterRes.msBeforeNext / 1000),
      },
    });
  }
}
```

---

### 3.11 IP Allowlisting/Blocklisting

#### Implementation

```sql
CREATE TABLE ip_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type   VARCHAR(10) NOT NULL,  -- 'ALLOW' or 'BLOCK'
  ip_range    CIDR NOT NULL,          -- Supports individual IPs and CIDR ranges
  description TEXT,
  expires_at  TIMESTAMPTZ,            -- Auto-expire temporary blocks
  created_by  UUID REFERENCES employees(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Block known malicious IPs
INSERT INTO ip_rules (rule_type, ip_range, description) VALUES
  ('BLOCK', '10.0.0.0/8', 'Internal test network - block in production'),
  ('BLOCK', '192.168.1.100/32', 'Known scanner IP');

-- Allow office VPN ranges
INSERT INTO ip_rules (rule_type, ip_range, description) VALUES
  ('ALLOW', '203.0.113.0/24', 'Headquarters VPN'),
  ('ALLOW', '198.51.100.0/24', 'Branch office VPN');
```

#### Middleware

```typescript
async function ipFilter(req: Request, res: Response, next: NextFunction) {
  const clientIP = req.ip;

  // Check blocklist first
  const blocked = await prisma.$queryRaw`
    SELECT 1 FROM ip_rules
    WHERE rule_type = 'BLOCK'
      AND ip_range >>= ${clientIP}::inet
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1
  `;

  if (blocked.length > 0) {
    logger.warn('Blocked IP attempted access', { ip: clientIP, path: req.path });
    return res.status(403).json({ error: { code: 'IP_BLOCKED' } });
  }

  // If allowlist is configured, enforce it
  const allowlisted = await prisma.$queryRaw`
    SELECT 1 FROM ip_rules
    WHERE rule_type = 'ALLOW'
      AND ip_range >>= ${clientIP}::inet
    LIMIT 1
  `;

  const hasAllowlist = await prisma.ip_rules.count({ where: { ruleType: 'ALLOW' } });
  if (hasAllowlist > 0 && allowlisted.length === 0) {
    logger.warn('IP not in allowlist', { ip: clientIP });
    return res.status(403).json({ error: { code: 'IP_NOT_ALLOWED' } });
  }

  next();
}
```

**Cache IP rules in Redis** (TTL: 5 min) to avoid a database query on every request.

---

### 3.12 GDPR Compliance

#### Data Subject Rights Implementation

| Right | Implementation | Endpoint |
|---|---|---|
| **Right to Access** (Art. 15) | Export all employee data as JSON/CSV | `GET /api/v1/gdpr/export/:userId` |
| **Right to Rectification** (Art. 16) | Employees can update own profile | `PUT /api/v1/employees/me` |
| **Right to Erasure** (Art. 17) | Anonymize employee data, keep asset records | `DELETE /api/v1/gdpr/erase/:userId` (Admin only) |
| **Right to Portability** (Art. 20) | Machine-readable data export (JSON) | `GET /api/v1/gdpr/portability/:userId` |
| **Right to Object** (Art. 21) | Opt-out of non-essential notifications | `PATCH /api/v1/employees/me/preferences` |
| **Consent Management** | Track consent for data processing | `consent_records` table |

#### Data Anonymization

```typescript
// GDPR Erasure: Anonymize employee data while preserving referential integrity
async function anonymizeEmployee(employeeId: string) {
  const anonymizedEmail = `anonymized-${employeeId}@deleted.invalid`;
  const anonymizedName = 'Deleted User';

  await prisma.$transaction(async (tx) => {
    // Anonymize personal data
    await tx.employees.update({
      where: { id: employeeId },
      data: {
        firstName: anonymizedName,
        lastName: anonymizedName,
        email: anonymizedEmail,
        phoneNumber: null,
        homeAddress: null,
        passwordHash: 'DELETED',
        salary: null,
        ssn: null,
        status: 'DEACTIVATED',
        profilePictureUrl: null,
      },
    });

    // Nullify assignments (assets return to pool)
    await tx.assets.updateMany({
      where: { assignedToId: employeeId },
      data: { assignedToId: null, status: 'AVAILABLE' },
    });

    // Anonymize activity logs (keep for audit, remove PII)
    await tx.$executeRaw`
      UPDATE activity_logs
      SET user_id = NULL, ip_address = NULL
      WHERE user_id = ${employeeId}::uuid
    `;

    // Cancel active bookings
    await tx.bookings.updateMany({
      where: { bookedById: employeeId, status: { in: ['PENDING', 'APPROVED'] } },
      data: { status: 'CANCELLED', notes: 'Cancelled due to account deletion' },
    });

    // Delete refresh tokens and API tokens
    await tx.refresh_tokens.deleteMany({ where: { userId: employeeId } });
    await tx.api_tokens.deleteMany({ where: { userId: employeeId } });

    // Delete notifications
    await tx.notifications.deleteMany({ where: { userId: employeeId } });
  });
}
```

#### Consent Records

```sql
CREATE TABLE consent_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES employees(id),
  consent_type  VARCHAR(50) NOT NULL,  -- 'DATA_PROCESSING', 'MARKETING', 'ANALYTICS'
  granted       BOOLEAN NOT NULL,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable: never UPDATE or DELETE consent records
-- Query consent status:
SELECT consent_type, granted
FROM consent_records
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 1;
```

---

### 3.13 Data Retention Policies

| Data Type | Retention Period | Action After Expiry | Legal Basis |
|---|---|---|---|
| Employee PII (active) | Duration of employment + 3 years | Anonymize | Labor law compliance |
| Employee PII (terminated) | 3 years post-termination | Anonymize | Statute of limitations |
| Asset records | Permanent (anonymized references) | Keep with anonymized user IDs | Asset tracking audit trail |
| Booking history | 5 years | Archive to cold storage, then delete | Financial audit |
| Activity logs | 24 months | Auto-delete via partition drop | Operational necessity |
| Login history | 12 months | Auto-delete via partition drop | Security audit |
| Audit logs | 7 years | Archive to cold storage | Compliance |
| Notifications | 12 months | Auto-delete | User convenience |
| Refresh tokens | 30 days (post-expiry) | Auto-delete | Security |
| API tokens (revoked) | 90 days (post-revocation) | Auto-delete | Security |
| File attachments | Duration of related asset | Delete when asset is decommissioned + 1 year | Storage management |
| Consent records | Permanent | Never delete (legal requirement) | GDPR Art. 7 |
| Backups | 12 months rolling | Securely wipe | Disaster recovery |

#### Automated Retention Enforcement

```typescript
// Scheduled job: run daily at 02:00 UTC
async function enforceRetentionPolicy() {
  const now = new Date();

  // Delete expired refresh tokens
  await prisma.refresh_tokens.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { revokedAt: { lt: new Date(now.getTime() - 30 * 86400000) } }, // 30 days after revocation
      ],
    },
  });

  // Delete revoked API tokens older than 90 days
  await prisma.api_tokens.deleteMany({
    where: {
      isRevoked: true,
      updatedAt: { lt: new Date(now.getTime() - 90 * 86400000) },
    },
  });

  // Anonymize terminated employees older than 3 years
  const threeYearsAgo = new Date(now.getTime() - 3 * 365 * 86400000);
  const terminatedEmployees = await prisma.employees.findMany({
    where: {
      status: 'TERMINATED',
      updatedAt: { lt: threeYearsAgo },
    },
    select: { id: true },
  });

  for (const emp of terminatedEmployees) {
    await anonymizeEmployee(emp.id);
  }

  // Partition maintenance (handled by pg_partman)
  await prisma.$executeRaw`SELECT partman.run_maintenance()`;
}
```

---

## PART 4: API DESIGN GUIDELINES

### 4.1 REST API Resource Naming

#### URL Structure

```
/api/v1/{resource}
/api/v1/{resource}/{id}
/api/v1/{resource}/{id}/{sub-resource}
```

#### Naming Rules

| Rule | Good | Bad |
|---|---|---|
| Plural nouns | `/api/v1/assets` | `/api/v1/asset` |
| Lowercase kebab-case | `/api/v1/asset-categories` | `/api/v1/AssetCategories` |
| No verbs in URLs | `POST /api/v1/assets` | `POST /api/v1/createAsset` |
| Nested for sub-resources | `/api/v1/assets/{id}/history` | `/api/v1/assetHistory?assetId={id}` |
| Max 2 levels of nesting | `/api/v1/bookings/{id}/history` | `/api/v1/offices/{id}/departments/{id}/employees/{id}/assets` |

#### Complete Endpoint Map

```
Auth:
  POST   /api/v1/auth/login
  POST   /api/v1/auth/logout
  POST   /api/v1/auth/refresh
  POST   /api/v1/auth/forgot-password
  POST   /api/v1/auth/reset-password
  POST   /api/v1/auth/change-password

Offices:
  GET    /api/v1/offices
  POST   /api/v1/offices
  GET    /api/v1/offices/:id
  PATCH  /api/v1/offices/:id
  DELETE /api/v1/offices/:id

Departments:
  GET    /api/v1/departments
  POST   /api/v1/departments
  GET    /api/v1/departments/:id
  PATCH  /api/v1/departments/:id
  DELETE /api/v1/departments/:id

Employees:
  GET    /api/v1/employees
  POST   /api/v1/employees
  GET    /api/v1/employees/:id
  PATCH  /api/v1/employees/:id
  DELETE /api/v1/employees/:id
  GET    /api/v1/employees/me
  PATCH  /api/v1/employees/me
  GET    /api/v1/employees/:id/assets
  GET    /api/v1/employees/:id/bookings

Assets:
  GET    /api/v1/assets
  POST   /api/v1/assets
  GET    /api/v1/assets/:id
  PATCH  /api/v1/assets/:id
  DELETE /api/v1/assets/:id
  POST   /api/v1/assets/:id/assign
  POST   /api/v1/assets/:id/return
  POST   /api/v1/assets/:id/maintenance
  GET    /api/v1/assets/:id/history
  GET    /api/v1/assets/:id/comments
  POST   /api/v1/assets/:id/comments
  GET    /api/v1/assets/:id/attachments
  POST   /api/v1/assets/:id/attachments

Asset Categories:
  GET    /api/v1/asset-categories
  POST   /api/v1/asset-categories
  GET    /api/v1/asset-categories/:id
  PATCH  /api/v1/asset-categories/:id
  DELETE /api/v1/asset-categories/:id
  GET    /api/v1/asset-categories/:id/assets
  GET    /api/v1/asset-categories/tree

Bookings:
  GET    /api/v1/bookings
  POST   /api/v1/bookings
  GET    /api/v1/bookings/:id
  PATCH  /api/v1/bookings/:id
  DELETE /api/v1/bookings/:id
  POST   /api/v1/bookings/:id/approve
  POST   /api/v1/bookings/:id/reject
  POST   /api/v1/bookings/:id/cancel
  GET    /api/v1/bookings/:id/history

Notifications:
  GET    /api/v1/notifications
  PATCH  /api/v1/notifications/:id/read
  POST   /api/v1/notifications/read-all
  GET    /api/v1/notifications/unread-count

Activity Logs:
  GET    /api/v1/activity-logs

Search:
  GET    /api/v1/search?q={query}&type={asset|employee|booking}

Reports:
  GET    /api/v1/reports/dashboard
  GET    /api/v1/reports/assets/summary
  GET    /api/v1/reports/bookings/summary
  GET    /api/v1/reports/utilization

API Tokens:
  GET    /api/v1/api-tokens
  POST   /api/v1/api-tokens
  DELETE /api/v1/api-tokens/:id

GDPR:
  GET    /api/v1/gdpr/export/:userId
  GET    /api/v1/gdpr/portability/:userId
  DELETE /api/v1/gdpr/erase/:userId

Bulk:
  POST   /api/v1/bulk/assets/import
  POST   /api/v1/bulk/assets/update
  POST   /api/v1/bulk/assets/export
```

---

### 4.2 Pagination

#### Cursor-Based (Default for List Endpoints)

**Request:**

```
GET /api/v1/assets?limit=25&cursor=abc-123-def
```

**Response:**

```json
{
  "data": [
    {
      "id": "ghi-456-jkl",
      "name": "Dell XPS 15",
      "assetTag": "AST-00142",
      "status": "AVAILABLE",
      "category": { "id": "cat-1", "name": "Laptops" },
      "office": { "id": "off-1", "name": "Headquarters" },
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "nextCursor": "mno-789-pqr",
    "hasNext": true,
    "count": 25
  }
}
```

**Rules:**

- Default `limit`: 25
- Maximum `limit`: 100
- `nextCursor`: The `id` of the last item in the current response
- `hasNext`: Boolean indicating if more results exist
- No `previousCursor` — clients should cache previous pages

#### Offset-Based (Reports/Admin)

**Request:**

```
GET /api/v1/reports/assets/summary?page=1&perPage=50
```

**Response:**

```json
{
  "data": [ "..." ],
  "pagination": {
    "page": 1,
    "perPage": 50,
    "total": 1247,
    "totalPages": 25
  }
}
```

---

### 4.3 Filtering

#### Query Parameter Patterns

```
# Exact match
GET /api/v1/assets?status=AVAILABLE

# Multiple values (OR)
GET /api/v1/assets?status=AVAILABLE,IN_USE

# Comparison operators
GET /api/v1/assets?createdAfter=2026-01-01&createdBefore=2026-06-30
GET /api/v1/assets?valueMin=500&valueMax=5000

# Nested resource filter
GET /api/v1/assets?categoryId=cat-123
GET /api/v1/assets?officeId=off-456&departmentId=dep-789

# Boolean filter
GET /api/v1/assets?assigned=true

# Range filter (for dates)
GET /api/v1/bookings?startDate=2026-07-01&endDate=2026-07-31
```

#### Filter Implementation with Prisma

```typescript
interface AssetFilters {
  status?: string[];
  categoryId?: string;
  officeId?: string;
  departmentId?: string;
  assignedToId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  valueMin?: number;
  valueMax?: number;
  search?: string;
}

function buildAssetWhere(filters: AssetFilters): Prisma.assetsWhereInput {
  const where: Prisma.assetsWhereInput = {};

  if (filters.status?.length) {
    where.status = { in: filters.status };
  }
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }
  if (filters.officeId) {
    where.officeId = filters.officeId;
  }
  if (filters.departmentId) {
    where.departmentId = filters.departmentId;
  }
  if (filters.assignedToId) {
    where.assignedToId = filters.assignedToId;
  }
  if (filters.createdAfter || filters.createdBefore) {
    where.createdAt = {};
    if (filters.createdAfter) where.createdAt.gte = filters.createdAfter;
    if (filters.createdBefore) where.createdAt.lte = filters.createdBefore;
  }
  if (filters.valueMin || filters.valueMax) {
    where.purchasePrice = {};
    if (filters.valueMin) where.purchasePrice.gte = filters.valueMin;
    if (filters.valueMax) where.purchasePrice.lte = filters.valueMax;
  }

  return where;
}
```

#### Filter Validation (Zod)

```typescript
const AssetFilterSchema = z.object({
  status: z.string().optional().transform(s => s?.split(',')).pipe(
    z.array(z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'DECOMMISSIONED', 'LOST'])).optional()
  ),
  categoryId: z.string().uuid().optional(),
  officeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  createdAfter: z.coerce.date().optional(),
  createdBefore: z.coerce.date().optional(),
  valueMin: z.coerce.number().min(0).optional(),
  valueMax: z.coerce.number().min(0).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(25),
});
```

---

### 4.4 Sorting

#### Query Parameter Format

```
GET /api/v1/assets?sort=created_at:desc,name:asc
```

**Supported fields per resource:**

| Resource | Sortable Fields |
|---|---|
| `assets` | `created_at`, `name`, `asset_tag`, `status`, `purchase_price`, `updated_at` |
| `employees` | `first_name`, `last_name`, `email`, `created_at`, `department.name` |
| `bookings` | `created_at`, `start_date`, `end_date`, `status` |
| `departments` | `name`, `created_at` |
| `offices` | `name`, `created_at` |
| `asset_history` | `created_at`, `action` |

#### Implementation

```typescript
function parseSortParam(sortParam: string, allowedFields: string[]): Record<string, 'asc' | 'desc'> {
  if (!sortParam) return { createdAt: 'desc' }; // default

  const orderBy: Record<string, 'asc' | 'desc'> = {};
  const parts = sortParam.split(',');

  for (const part of parts) {
    const [field, direction] = part.split(':');
    if (allowedFields.includes(field)) {
      orderBy[field] = direction === 'asc' ? 'asc' : 'desc';
    }
  }

  return Object.keys(orderBy).length > 0 ? orderBy : { createdAt: 'desc' };
}
```

---

### 4.5 Searching

#### Global Search

```
GET /api/v1/search?q=laptop+Dell&type=asset&officeId=off-1
```

**Response:**

```json
{
  "data": {
    "assets": [
      { "id": "...", "name": "Dell XPS 15", "assetTag": "AST-00142", "_score": 0.95 }
    ],
    "employees": [
      { "id": "...", "firstName": "Dell", "lastName": "John", "_score": 0.72 }
    ],
    "totalHits": 12
  }
}
```

#### Implementation

```typescript
async function globalSearch(query: string, officeId?: string) {
  const tsQuery = query.trim().split(/\s+/).join(' & ');

  const [assets, employees] = await Promise.all([
    prisma.$queryRaw`
      SELECT id, name, asset_tag as "assetTag", 'asset' as type,
             ts_rank(search_vector, to_tsquery('english', ${tsQuery})) as score
      FROM assets
      WHERE search_vector @@ to_tsquery('english', ${tsQuery})
        AND (${officeId}::uuid IS NULL OR office_id = ${officeId}::uuid)
      ORDER BY score DESC
      LIMIT 20
    `,
    prisma.$queryRaw`
      SELECT id, first_name as "firstName", last_name as "lastName", email, 'employee' as type,
             ts_rank(search_vector, to_tsquery('english', ${tsQuery})) as score
      FROM employees
      WHERE search_vector @@ to_tsquery('english', ${tsQuery})
        AND (${officeId}::uuid IS NULL OR office_id = ${officeId}::uuid)
      ORDER BY score DESC
      LIMIT 20
    `,
  ]);

  return { assets, employees, totalHits: assets.length + employees.length };
}
```

#### Resource-Specific Search

```
GET /api/v1/assets?search=Dell+XPS
```

---

### 4.6 Bulk Operations

#### Bulk Create

```
POST /api/v1/bulk/assets/import
Content-Type: multipart/form-data
Body: file=<CSV or JSON file>
```

**Response:**

```json
{
  "data": {
    "importId": "imp-abc-123",
    "totalRows": 500,
    "successfulRows": 495,
    "failedRows": 5,
    "status": "PARTIAL_SUCCESS",
    "errors": [
      { "row": 23, "error": "Asset tag 'AST-001' already exists" },
      { "row": 142, "error": "Invalid category ID: 'cat-invalid'" }
    ]
  }
}
```

#### Bulk Update

```
PATCH /api/v1/bulk/assets/update
Content-Type: application/json
Body: {
  "ids": ["asset-1", "asset-2", "asset-3"],
  "updates": {
    "status": "MAINTENANCE",
    "officeId": "off-2"
  }
}
```

#### Bulk Delete (Soft)

```
DELETE /api/v1/bulk/assets
Content-Type: application/json
Body: {
  "ids": ["asset-1", "asset-2", "asset-3"],
  "reason": "Decommissioned batch 2026-Q3"
}
```

#### Bulk Export

```
POST /api/v1/bulk/assets/export
Content-Type: application/json
Body: {
  "filters": { "status": "AVAILABLE", "officeId": "off-1" },
  "format": "csv",
  "fields": ["name", "assetTag", "status", "category.name"]
}
```

**Response:**

```json
{
  "data": {
    "exportId": "exp-xyz-789",
    "status": "PROCESSING",
    "estimatedRows": 4521,
    "downloadUrl": null,
    "expiresAt": null
  }
}
```

**Polling:** `GET /api/v1/bulk/assets/export/exp-xyz-789` -> Returns `downloadUrl` when ready.

---

### 4.7 Error Response Format

#### Standard Error Schema

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request body contains invalid fields",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "value": "not-an-email"
      },
      {
        "field": "firstName",
        "message": "Required, cannot be empty"
      }
    ],
    "requestId": "req-abc-123",
    "timestamp": "2026-07-12T10:30:00Z",
    "documentation": "https://api.assetflow.dev/errors/VALIDATION_ERROR"
  }
}
```

#### HTTP Status Code Mapping

| Code | HTTP Status | When to Use |
|---|---|---|
| `BAD_REQUEST` | 400 | Malformed request, missing required fields |
| `UNAUTHORIZED` | 401 | No auth token or invalid/expired token |
| `FORBIDDEN` | 403 | Valid token but insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate resource (unique constraint violation) |
| `VALIDATION_ERROR` | 422 | Request body fails validation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Maintenance or dependency failure |
| `ASSET_UNAVAILABLE` | 4221 | Asset already booked/in-use |
| `BOOKING_CONFLICT` | 4222 | Date range overlaps existing booking |

#### Error Response for Prisma Errors

```typescript
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError) {
  switch (error.code) {
    case 'P2002':
      return {
        status: 409,
        error: {
          code: 'CONFLICT',
          message: `Unique constraint violation on: ${error.meta?.target}`,
        },
      };
    case 'P2025':
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      };
    case 'P2003':
      return {
        status: 422,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Foreign key constraint violation: ${error.meta?.field_name}`,
        },
      };
    default:
      return {
        status: 500,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected database error occurred',
          requestId: getCurrentRequestId(),
        },
      };
  }
}
```

---

### 4.8 Rate Limiting per Endpoint

Rate limit headers are included in every response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1689168060
Retry-After: 12  (only when rate limited)
```

#### Tier Configuration

| Tier | Rate Limit | Burst | Applicable To |
|---|---|---|---|
| **Public** | 30 req/min | 10 req/10s | Login, register, forgot password |
| **Authenticated** | 100 req/min | 30 req/10s | Standard GET requests |
| **Authenticated (write)** | 30 req/min | 10 req/10s | POST, PUT, PATCH, DELETE |
| **Admin** | 200 req/min | 50 req/10s | Admin endpoints |
| **Bulk** | 5 req/min | 2 req/10s | Import, export, bulk update |
| **Search** | 30 req/min | 10 req/10s | Full-text search endpoints |
| **API Token** | Configurable per token | N/A | Set when token is created |

---

### 4.9 Versioning Strategy

#### URL-Based Versioning

```
/api/v1/assets    <- Current stable
/api/v2/assets    <- Next breaking change
```

#### Version Lifecycle

| Phase | Duration | Behavior |
|---|---|---|
| **Current** | Active development | Full support, all new features |
| **Supported** | 12 months after next version release | Bug fixes and security patches only |
| **Deprecated** | 6 months after supported phase | Returns `Sunset` header, logs usage |
| **Retired** | After deprecation | Returns `410 Gone` with migration guide |

#### Headers

```
# Deprecation notice (returned for deprecated versions)
Deprecation: Sat, 01 Jul 2028 00:00:00 GMT
Sunset: Sun, 01 Jan 2029 00:00:00 GMT
Link: </api/v2/assets>; rel="successor-version"
```

#### Backward Compatibility Rules

- Adding a new field to a response: **non-breaking** (no version bump)
- Adding a new query parameter: **non-breaking** (defaults preserve old behavior)
- Removing or renaming a field: **breaking** (requires new version)
- Changing field type: **breaking** (requires new version)
- Changing error codes: **breaking** (requires new version)
- Adding new endpoint: **non-breaking**
- Changing response envelope: **breaking** (requires new version)

---

### 4.10 HATEOAS Considerations

HATEOAS (Hypermedia as the Engine of Application State) enables clients to discover available actions dynamically.

#### Resource with Links

```json
{
  "data": {
    "id": "abc-123",
    "name": "MacBook Pro 16",
    "assetTag": "AST-00001",
    "status": "AVAILABLE",
    "_links": {
      "self": { "href": "/api/v1/assets/abc-123", "method": "GET" },
      "update": { "href": "/api/v1/assets/abc-123", "method": "PATCH" },
      "delete": { "href": "/api/v1/assets/abc-123", "method": "DELETE" },
      "assign": { "href": "/api/v1/assets/abc-123/assign", "method": "POST" },
      "history": { "href": "/api/v1/assets/abc-123/history", "method": "GET" },
      "comments": { "href": "/api/v1/assets/abc-123/comments", "method": "GET" },
      "attachments": { "href": "/api/v1/assets/abc-123/attachments", "method": "GET" },
      "category": { "href": "/api/v1/asset-categories/cat-456", "method": "GET" },
      "office": { "href": "/api/v1/offices/off-789", "method": "GET" }
    }
  }
}
```

#### Action Availability Based on State

```typescript
function addLinks(asset: Asset, userRole: string) {
  const links: Record<string, { href: string; method: string }> = {
    self: { href: `/api/v1/assets/${asset.id}`, method: 'GET' },
    history: { href: `/api/v1/assets/${asset.id}/history`, method: 'GET' },
    comments: { href: `/api/v1/assets/${asset.id}/comments`, method: 'GET' },
  };

  // State-dependent actions
  if (asset.status === 'AVAILABLE') {
    links.assign = { href: `/api/v1/assets/${asset.id}/assign`, method: 'POST' };
  }
  if (asset.status === 'IN_USE') {
    links.return = { href: `/api/v1/assets/${asset.id}/return`, method: 'POST' };
  }
  if (asset.status === 'ACTIVE' && userRole === 'ADMIN') {
    links.maintenance = { href: `/api/v1/assets/${asset.id}/maintenance`, method: 'POST' };
    links.delete = { href: `/api/v1/assets/${asset.id}`, method: 'DELETE' };
  }

  // Role-dependent actions
  if (['ADMIN', 'MANAGER'].includes(userRole)) {
    links.update = { href: `/api/v1/assets/${asset.id}`, method: 'PATCH' };
  }

  return { ...asset, _links: links };
}
```

**Note:** HATEOAS is recommended as a progressive enhancement. The AssetFlow API is fully functional without clients consuming `_links` — they serve as discoverability aids for clients that choose to use them.

---

## PART 5: FUTURE EXPANSION ROADMAP

### 5.1 Inventory Management

#### What Exists Today

The `assets` table already models individual asset items with status, location, and assignment. The `asset_categories` table provides hierarchical categorization via ltree paths.

#### What to Add

```sql
-- Inventory counts and warehouse locations
CREATE TABLE inventory_counts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id       UUID NOT NULL REFERENCES assets(id),
  warehouse_id   UUID REFERENCES warehouses(id),  -- from Warehouse Management (5.6)
  shelf_location VARCHAR(50),                      -- "A-3-2-B" (aisle-shelf-level-position)
  quantity       INT NOT NULL DEFAULT 1,           -- for consumable assets
  counted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  counted_by     UUID NOT NULL REFERENCES employees(id),
  notes          TEXT
);

-- Low stock alerts for consumable assets
CREATE TABLE inventory_alerts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id       UUID NOT NULL REFERENCES assets(id),
  threshold      INT NOT NULL,                     -- alert when quantity falls below this
  notify_user_id UUID REFERENCES employees(id),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Integration

- Asset creation automatically creates an `inventory_counts` entry.
- Inventory count updates trigger alerts when thresholds are breached.
- Warehouse Management (5.6) provides `warehouses` and `shelves` tables.
- Barcode/RFID (5.9, 5.10) enables automated inventory counting.

---

### 5.2 Purchase Order Management

#### New Tables

```sql
CREATE TABLE purchase_orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number        VARCHAR(50) NOT NULL UNIQUE,
  vendor_id        UUID REFERENCES vendors(id),       -- from Vendor Management (5.3)
  requested_by_id  UUID NOT NULL REFERENCES employees(id),
  approved_by_id   UUID REFERENCES employees(id),
  status           VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
                     -- DRAFT, PENDING_APPROVAL, APPROVED, ORDERED, RECEIVED, CANCELLED
  total_amount     DECIMAL(12,2),
  currency         VARCHAR(3) NOT NULL DEFAULT 'USD',
  expected_date    DATE,
  received_date    DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_order_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id            UUID NOT NULL REFERENCES purchase_orders(id),
  asset_category_id UUID REFERENCES asset_categories(id),
  description      TEXT NOT NULL,
  quantity         INT NOT NULL,
  unit_price       DECIMAL(12,2) NOT NULL,
  total_price      DECIMAL(12,2) NOT NULL,
  received_qty     INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_order_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id      UUID NOT NULL REFERENCES purchase_orders(id),
  old_status VARCHAR(30),
  new_status VARCHAR(30),
  changed_by UUID REFERENCES employees(id),
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Integration

- Receiving a PO auto-creates assets in the `assets` table (status: `AVAILABLE`).
- Links to Vendor Management (5.3) for vendor details.
- Links to Invoice Processing (5.4) for invoice matching.
- PO approval workflow follows the same pattern as booking approval.

---

### 5.3 Vendor Management

#### New Tables

```sql
CREATE TABLE vendors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(200) NOT NULL,
  contact_name  VARCHAR(200),
  email         VARCHAR(255),
  phone         VARCHAR(20),
  address       TEXT,
  tax_id        VARCHAR(50),
  payment_terms VARCHAR(50),           -- "NET_30", "NET_60", "COD"
  rating        DECIMAL(3,2),          -- 0.00 to 5.00
  is_active     BOOLEAN NOT NULL DEFAULT true,
  metadata      JSONB,                 -- flexible additional fields
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vendor_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   UUID NOT NULL REFERENCES vendors(id),
  category_id UUID NOT NULL REFERENCES asset_categories(id),
  UNIQUE (vendor_id, category_id)
);

CREATE TABLE vendor_contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID NOT NULL REFERENCES vendors(id),
  contract_type   VARCHAR(50) NOT NULL,  -- "WARRANTY", "MAINTENANCE", "LEASE", "SERVICE"
  start_date      DATE NOT NULL,
  end_date        DATE,
  value           DECIMAL(12,2),
  auto_renew      BOOLEAN NOT NULL DEFAULT false,
  renewal_term_months INT,
  document_url    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Integration

- Assets reference `vendors` for purchase source and warranty.
- Purchase Orders (5.2) link to vendors.
- Contract expiry alerts trigger maintenance scheduling.
- Full-text search on vendor names via GIN index.

---

### 5.4 Invoice Processing

#### New Tables

```sql
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  VARCHAR(50) NOT NULL,
  vendor_id       UUID NOT NULL REFERENCES vendors(id),
  po_id           UUID REFERENCES purchase_orders(id),
  amount          DECIMAL(12,2) NOT NULL,
  tax_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount    DECIMAL(12,2) NOT NULL,
  currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
  status          VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
                    -- RECEIVED, APPROVED, PAID, DISPUTED, CANCELLED
  due_date        DATE NOT NULL,
  paid_date       DATE,
  payment_method  VARCHAR(50),
  notes           TEXT,
  document_url    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invoice_line_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id),
  po_item_id      UUID REFERENCES purchase_order_items(id),
  description     TEXT NOT NULL,
  quantity        INT NOT NULL,
  unit_price      DECIMAL(12,2) NOT NULL,
  total_price     DECIMAL(12,2) NOT NULL,
  asset_id        UUID REFERENCES assets(id)  -- link to created asset
);
```

#### Integration

- PO receipt auto-generates an invoice in `DRAFT` status.
- Invoice approval triggers payment workflow.
- `invoice_line_items` link back to PO items and forward to created assets.
- Vendor Management (5.3) provides vendor payment terms for due date calculation.

---

### 5.5 Finance / Depreciation

#### New Tables

```sql
CREATE TABLE depreciation_schedules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          UUID NOT NULL REFERENCES assets(id),
  method            VARCHAR(30) NOT NULL,
                      -- STRAIGHT_LINE, DECLINING_BALANCE, UNITS_OF_PRODUCTION
  useful_life_years INT NOT NULL,
  salvage_value     DECIMAL(12,2) NOT NULL DEFAULT 0,
  purchase_price    DECIMAL(12,2) NOT NULL,
  purchase_date     DATE NOT NULL,
  depreciation_start DATE NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE depreciation_entries (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id              UUID NOT NULL REFERENCES depreciation_schedules(id),
  asset_id                 UUID NOT NULL REFERENCES assets(id),
  period_start             DATE NOT NULL,
  period_end               DATE NOT NULL,
  depreciation_amount      DECIMAL(12,2) NOT NULL,
  accumulated_depreciation DECIMAL(12,2) NOT NULL,
  book_value               DECIMAL(12,2) NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Current asset valuation view
CREATE VIEW asset_valuation AS
SELECT
  a.id,
  a.name,
  a.purchase_price,
  ds.useful_life_years,
  ds.salvage_value,
  COALESCE(MAX(de.accumulated_depreciation), 0) as accumulated_depreciation,
  a.purchase_price - COALESCE(MAX(de.accumulated_depreciation), 0) as current_book_value,
  ds.method,
  ds.purchase_date
FROM assets a
JOIN depreciation_schedules ds ON ds.asset_id = a.id
LEFT JOIN depreciation_entries de ON de.schedule_id = ds.id
GROUP BY a.id, a.name, a.purchase_price, ds.useful_life_years,
         ds.salvage_value, ds.method, ds.purchase_date;
```

#### Integration

- Asset creation (from PO receipt or manual) auto-creates a `depreciation_schedules` entry.
- Monthly cron job calculates `depreciation_entries` for all active schedules.
- Reports endpoint (`/api/v1/reports/assets/depreciation`) queries the `asset_valuation` view.
- Decommissioned assets retain full depreciation history for audit.

---

### 5.6 Warehouse Management

#### New Tables

```sql
CREATE TABLE warehouses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id  UUID REFERENCES offices(id),
  name       VARCHAR(200) NOT NULL,
  address    TEXT,
  capacity   INT,                       -- max asset count
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shelves (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id  UUID NOT NULL REFERENCES warehouses(id),
  aisle         VARCHAR(10) NOT NULL,
  shelf_number  INT NOT NULL,
  level_number  INT NOT NULL,
  position      VARCHAR(10),             -- "A", "B", etc. within shelf
  capacity      INT,
  UNIQUE (warehouse_id, aisle, shelf_number, level_number)
);

CREATE TABLE asset_locations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id     UUID NOT NULL REFERENCES assets(id),
  shelf_id     UUID REFERENCES shelves(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  moved_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  moved_by     UUID NOT NULL REFERENCES employees(id)
);
```

#### Integration

- `assets.office_id` provides the office; `asset_locations` provides the precise shelf position.
- Inventory Management (5.1) uses warehouse/shelf data for counts.
- RFID/barcode scanners (5.9, 5.10) update `asset_locations` on scan.
- GPS tracking (5.13) provides warehouse-level geo-coordinates.

---

### 5.7 Asset Leasing

#### New Tables

```sql
CREATE TABLE leases (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id             UUID NOT NULL REFERENCES assets(id),
  lessor_id            UUID REFERENCES vendors(id),
  lease_type           VARCHAR(30) NOT NULL,   -- OPERATING, FINANCE, CAPITAL
  start_date           DATE NOT NULL,
  end_date             DATE NOT NULL,
  monthly_payment      DECIMAL(12,2) NOT NULL,
  total_payments       DECIMAL(12,2),
  buyout_price         DECIMAL(12,2),
  status               VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
                         -- ACTIVE, EXPIRED, TERMINATED, RENEWED
  auto_renew           BOOLEAN NOT NULL DEFAULT false,
  renewal_term_months  INT,
  contract_url         TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lease_payments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id   UUID NOT NULL REFERENCES leases(id),
  due_date   DATE NOT NULL,
  paid_date  DATE,
  amount     DECIMAL(12,2) NOT NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, OVERDUE
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Integration

- `assets` gains a `lease_id` optional FK for leased assets.
- Asset status reflects lease status (`LEASED` status).
- Lease expiry alerts trigger renewal or return workflows.
- Finance (5.5) tracks lease payments as depreciation basis for finance leases.
- Vendor Management (5.3) provides lessor details.

---

### 5.8 Mobile App (Offline Support, Sync)

#### Architecture

```
Mobile App (SQLite offline) -> Sync Engine -> REST API -> PostgreSQL
```

#### New Tables (Server-Side Sync Support)

```sql
-- Sync metadata for conflict resolution
ALTER TABLE assets ADD COLUMN last_synced_at TIMESTAMPTZ;
ALTER TABLE assets ADD COLUMN sync_version   BIGINT NOT NULL DEFAULT 1;
ALTER TABLE assets ADD COLUMN device_id      VARCHAR(100);  -- last device that modified

-- Offline operation queue
CREATE TABLE sync_queue (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id      VARCHAR(100) NOT NULL,
  user_id        UUID NOT NULL REFERENCES employees(id),
  entity_type    VARCHAR(50) NOT NULL,
  entity_id      UUID,
  operation      VARCHAR(10) NOT NULL,  -- CREATE, UPDATE, DELETE
  payload        JSONB NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, SYNCED, CONFLICT
  conflict_data  JSONB,                  -- server state on conflict
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at      TIMESTAMPTZ
);

CREATE INDEX idx_sync_queue_device ON sync_queue (device_id, status, created_at);
```

#### Conflict Resolution Strategy

1. **Optimistic locking** via `sync_version`: Client sends `If-Match: <version>` header.
2. If version matches -> apply update, increment `sync_version`.
3. If version mismatch -> return 409 with both client and server versions.
4. Client presents conflict to user for manual resolution.
5. For offline creates: server generates UUID client-side, dedup via `idempotency_key`.

#### Sync Protocol

```
GET /api/v1/sync/changes?since=<timestamp>&table=assets,bookings
-> Returns all changes since timestamp

POST /api/v1/sync/push
Body: { operations: [...sync_queue items...] }
-> Server processes operations, returns results/conflicts
```

---

### 5.9 RFID Integration

#### New Tables

```sql
CREATE TABLE rfid_tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_code   VARCHAR(100) NOT NULL UNIQUE,  -- EPC code from RFID tag
  asset_id   UUID REFERENCES assets(id),
  tag_type   VARCHAR(30) NOT NULL,          -- PASSIVE_UHF, ACTIVE, NFC
  status     VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  issued_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rfid_read_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id          UUID NOT NULL REFERENCES rfid_tags(id),
  reader_id       UUID NOT NULL REFERENCES rfid_readers(id),
  read_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  signal_strength INT,
  location        JSONB                    -- {"lat": ..., "lng": ..., "reader_name": "..."}
) PARTITION BY RANGE (read_at);          -- High volume, must partition

CREATE TABLE rfid_readers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) NOT NULL,
  warehouse_id   UUID REFERENCES warehouses(id),
  location_desc  TEXT,
  ip_address     INET,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  last_heartbeat TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Integration

- `rfid_tags.asset_id` links tags to assets.
- `rfid_read_events` auto-populated by RFID middleware.
- Event stream triggers asset location updates (`asset_locations`).
- Anomaly detection: tag read at unexpected location triggers alert.
- Inventory counts automated from RFID scans (5.1).
- GPS correlation (5.13) for outdoor asset tracking.

---

### 5.10 Barcode Integration

#### New Tables

```sql
CREATE TABLE barcodes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id     UUID NOT NULL REFERENCES assets(id),
  barcode      VARCHAR(100) NOT NULL UNIQUE,
  barcode_type VARCHAR(20) NOT NULL,     -- QR_CODE, CODE_128, CODE_39, DATA_MATRIX
  label_url    TEXT,                       -- URL to generated barcode image
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_barcodes_value ON barcodes (barcode);
```

#### Integration

- Barcode is the human-readable alias for `assets.asset_tag`.
- Scanning a barcode calls `GET /api/v1/assets?barcode=<value>`.
- Barcode generation service creates printable labels for physical assets.
- Mobile app (5.8) uses device camera for barcode scanning.
- Check-in/check-out flows triggered by barcode scan.
- Complementary to RFID: barcodes for manual scans, RFID for automated detection.

---

### 5.11 AI Predictions

#### New Tables

```sql
CREATE TABLE ml_models (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name       VARCHAR(100) NOT NULL,
  model_type       VARCHAR(50) NOT NULL,     -- FAILURE_PREDICTION, MAINTENANCE_OPTIMIZATION, DEMAND_FORECAST
  version          VARCHAR(20) NOT NULL,
  trained_at       TIMESTAMPTZ,
  accuracy         DECIMAL(5,4),
  feature_columns  TEXT[],
  hyperparameters  JSONB,
  model_binary     BYTEA,                    -- Serialized model (small models only)
  model_url        TEXT,                     -- Path to model file (large models)
  status           VARCHAR(20) NOT NULL DEFAULT 'TRAINING', -- TRAINING, ACTIVE, DEPRECATED
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE predictions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id         UUID NOT NULL REFERENCES ml_models(id),
  entity_type      VARCHAR(50) NOT NULL,     -- 'asset', 'booking', 'employee'
  entity_id        UUID NOT NULL,
  prediction_type  VARCHAR(50) NOT NULL,     -- FAILURE_PROBABILITY, MAINTENANCE_DATE, DEMAND_SCORE
  prediction       JSONB NOT NULL,           -- {"probability": 0.82, "confidence": 0.95, "features": {...}}
  predicted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until      TIMESTAMPTZ,              -- Prediction expiry
  actual_outcome   JSONB,                    -- Filled in retrospectively for model evaluation
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_predictions_entity ON predictions (entity_type, entity_id, prediction_type);
CREATE INDEX idx_predictions_valid ON predictions (valid_until) WHERE valid_until > now();
```

#### Integration

- **Failure Prediction:** Uses `asset_history`, maintenance records, asset age, usage frequency.
- **Maintenance Optimization:** Predicts optimal maintenance windows from booking patterns.
- **Demand Forecasting:** Uses booking history to predict future asset demand by category/office.
- Predictions feed dashboard widgets and proactive alerts.
- Model retraining triggered by scheduled jobs or accuracy degradation.

---

### 5.12 IoT Sensors

#### New Tables

```sql
CREATE TABLE iot_sensors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        UUID REFERENCES assets(id),
  sensor_type     VARCHAR(50) NOT NULL,     -- TEMPERATURE, HUMIDITY, VIBRATION, GPS, USAGE_COUNTER
  manufacturer    VARCHAR(100),
  model           VARCHAR(100),
  unit            VARCHAR(20),              -- "celsius", "percent", "rpm", "hours"
  min_threshold   DECIMAL(10,4),
  max_threshold   DECIMAL(10,4),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_reading_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sensor_readings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id  UUID NOT NULL REFERENCES iot_sensors(id),
  value      DECIMAL(14,6) NOT NULL,
  unit       VARCHAR(20) NOT NULL,
  quality    VARCHAR(10) NOT NULL DEFAULT 'GOOD', -- GOOD, UNCERTAIN, BAD
  read_at    TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (read_at);          -- Extremely high volume

CREATE TABLE sensor_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id   UUID NOT NULL REFERENCES iot_sensors(id),
  alert_type  VARCHAR(50) NOT NULL,       -- THRESHOLD_EXCEEDED, SENSOR_OFFLINE, ANOMALY
  severity    VARCHAR(20) NOT NULL,       -- INFO, WARNING, CRITICAL
  value       DECIMAL(14,6),
  threshold   DECIMAL(14,6),
  message     TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES employees(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Integration

- Each IoT sensor is linked to an `assets` row.
- `sensor_readings` are partitioned by month (extremely high volume: potentially millions/day).
- `sensor_alerts` trigger notifications to assigned employees.
- Threshold-based alerts generated by a streaming processor (e.g., Node.js worker or Kafka consumer).
- Data feeds into AI Predictions (5.11) for anomaly detection models.
- GPS sensors overlap with GPS Tracking (5.13).

---

### 5.13 GPS Tracking

#### New Tables

```sql
CREATE TABLE gps_trackers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id      UUID NOT NULL REFERENCES assets(id),
  tracker_type  VARCHAR(30) NOT NULL,     -- BATTERY, WIRED, SOLAR
  imei          VARCHAR(20) UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  installed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gps_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id  UUID NOT NULL REFERENCES gps_trackers(id),
  latitude    DECIMAL(10,7) NOT NULL,
  longitude   DECIMAL(10,7) NOT NULL,
  altitude_m  DECIMAL(8,2),
  speed_kmh   DECIMAL(6,2),
  heading     DECIMAL(5,2),                -- 0-360 degrees
  battery_pct INT,
  accuracy_m  DECIMAL(6,2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (recorded_at);       -- Extremely high volume

CREATE TABLE geofences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  office_id   UUID REFERENCES offices(id),
  boundary    GEOMETRY(Polygon, 4326) NOT NULL,  -- PostGIS polygon
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_geofences_boundary ON geofences USING GIST (boundary);

CREATE TABLE geofence_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id  UUID NOT NULL REFERENCES gps_trackers(id),
  geofence_id UUID NOT NULL REFERENCES geofences(id),
  event_type  VARCHAR(20) NOT NULL,       -- ENTER, EXIT
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Integration

- GPS trackers are 1:1 with assets.
- `gps_locations` are partitioned by hour or day (potentially millions of rows/day).
- Geofence enter/exit events trigger alerts for asset movement outside allowed areas.
- PostGIS `boundary` column enables spatial queries: "Which assets are currently at office X?"
- GPS data feeds into AI Predictions (5.11) for route optimization.
- IoT Sensors (5.12) GPS sensors can write to the same `gps_locations` table via a shared partition.

**Prisma note:** PostGIS `GEOMETRY` columns are managed via raw SQL migrations. Prisma models reference the table but spatial queries use `prisma.$queryRaw`.

---

### 5.14 Multi-Currency Support

#### New Tables

```sql
CREATE TABLE currencies (
  code        VARCHAR(3) PRIMARY KEY,      -- USD, EUR, GBP, INR, JPY
  name        VARCHAR(50) NOT NULL,
  symbol      VARCHAR(5) NOT NULL,
  decimal_places INT NOT NULL DEFAULT 2,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE exchange_rates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_currency VARCHAR(3) NOT NULL REFERENCES currencies(code),
  target_currency VARCHAR(3) NOT NULL REFERENCES currencies(code),
  rate          DECIMAL(18,8) NOT NULL,
  source        VARCHAR(50) NOT NULL,      -- "ECB", "MANUAL", "API"
  effective_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_exchange_rates_current
  ON exchange_rates (source_currency, target_currency, effective_at DESC);

-- Seed currencies
INSERT INTO currencies (code, name, symbol, decimal_places) VALUES
  ('USD', 'US Dollar', '$', 2),
  ('EUR', 'Euro', 'EUR', 2),
  ('GBP', 'British Pound', 'GBP', 2),
  ('INR', 'Indian Rupee', 'INR', 2),
  ('JPY', 'Japanese Yen', 'JPY', 0);
```

#### Column Additions to Existing Tables

```sql
-- Assets: track purchase in local currency
ALTER TABLE assets ADD COLUMN purchase_currency VARCHAR(3) REFERENCES currencies(code) DEFAULT 'USD';
ALTER TABLE assets ADD COLUMN purchase_amount_local DECIMAL(14,2);  -- amount in purchase currency
ALTER TABLE assets ADD COLUMN purchase_amount_usd DECIMAL(14,2);    -- normalized to USD

-- Purchase Orders: multi-currency support
-- Already has `currency` column from 5.2

-- Invoices: multi-currency support
-- Already has `currency` column from 5.4

-- Leases: multi-currency support
ALTER TABLE leases ADD COLUMN currency VARCHAR(3) REFERENCES currencies(code) DEFAULT 'USD';
```

#### Conversion Service

```typescript
class CurrencyService {
  // Convert amount from source to target currency at a specific date
  async convert(
    amount: number,
    sourceCurrency: string,
    targetCurrency: string,
    atDate: Date = new Date()
  ): Promise<number> {
    if (sourceCurrency === targetCurrency) return amount;

    const rate = await prisma.exchange_rates.findFirst({
      where: {
        sourceCurrency,
        targetCurrency,
        effectiveAt: { lte: atDate },
      },
      orderBy: { effectiveAt: 'desc' },
    });

    if (!rate) throw new Error(`No exchange rate for ${sourceCurrency} -> ${targetCurrency}`);
    return Number((amount * rate.rate).toFixed(2));
  }

  // Get all rates relative to USD
  async getUsdRates(): Promise<Map<string, number>> {
    const rates = await prisma.exchange_rates.findMany({
      where: { sourceCurrency: 'USD' },
      orderBy: { effectiveAt: 'desc' },
      distinct: ['targetCurrency'],
    });

    return new Map(rates.map(r => [r.targetCurrency, Number(r.rate)]));
  }
}
```

#### Integration

- Exchange rates are updated via a daily cron job pulling from ECB/open exchange rate API.
- Asset purchase prices stored in both local currency and USD (normalized).
- Reports can display in any supported currency; conversion happens at query time.
- Historical exchange rates are preserved for audit (e.g., "What was the GBP value of this asset when purchased?").
- No schema changes needed for existing tables — currency columns are additive with defaults.
