# AssetFlow Database Tables - Part 2

## Modules 15-26: Asset Management | Modules 27-30: Resource & Booking | Modules 31-34: Maintenance | Modules 35-38: Audit

> **Stack:** PostgreSQL 16+ | Prisma ORM | UUID Primary Keys
> **Convention:** All tables use gen_random_uuid() for PKs, soft delete via deleted_at, audit columns on every table.
> **Last Updated:** 2026-07-12

---

# Table of Contents

- Module 15-26: Asset Management
  - 15. asset_categories
  - 16. category_custom_fields
  - 17. assets
  - 18. asset_images
  - 19. asset_documents
  - 20. asset_qr_codes
  - 21. asset_status_history
  - 22. asset_allocations
  - 23. allocation_history
  - 24. asset_returns
  - 25. transfer_requests
  - 26. transfer_history
- Module 27-30: Resource & Booking
  - 27. shared_resources
  - 28. resource_bookings
  - 29. booking_participants
  - 30. booking_history
- Module 31-34: Maintenance Workflow
  - 31. maintenance_requests
  - 32. maintenance_attachments
  - 33. maintenance_status_history
  - 34. technician_assignments
- Module 35-38: Audit Workflow
  - 35. audit_cycles
  - 36. audit_assignments
  - 37. audit_results
  - 38. audit_discrepancies
- Cross-Table Relationship Diagram
- Global Conventions

---

# Module 15-26: Asset Management

---

## 15. asset_categories

### Purpose
Hierarchical categorization of assets using PostgreSQL LTREE for efficient tree traversal. Supports multi-level org-specific category structures (e.g., IT > Laptops > High-Performance).

### Business Requirement
Organizations need to classify assets into nested categories for reporting, depreciation rules, budget allocation, maintenance scheduling, and procurement workflows. Categories must support drag-and-drop reordering and configurable depth.

### Description
asset_categories stores the organizational taxonomy for assets. The path column uses PostgreSQL ltree extension for O(1) ancestor/descendant queries. Each category belongs to an organization and can have custom fields defined at the category level via category_custom_fields. Categories may optionally link to depreciation policies and approval workflows.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique category identifier |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| parent_id | UUID | YES | NULL | FK asset_categories(id) ON DELETE CASCADE | Parent category (NULL = root) |
| name | VARCHAR(255) | NO | - | NOT NULL | Display name of the category |
| slug | VARCHAR(255) | NO | - | NOT NULL, UNIQUE(organization_id, slug) | URL-friendly identifier |
| path | LTREE | NO | - | NOT NULL, UNIQUE | Materialized path for tree queries |
| depth | INTEGER | NO | 0 | CHECK (depth >= 0 AND depth <= 20) | Nesting level (0 = root) |
| sort_order | INTEGER | NO | 0 | NOT NULL | Ordering within siblings |
| description | TEXT | YES | NULL | - | Human-readable description |
| icon | VARCHAR(100) | YES | NULL | - | UI icon identifier |
| color | VARCHAR(7) | YES | NULL | - | Hex color code for UI |
| is_active | BOOLEAN | NO | true | NOT NULL | Whether category is available for assignment |
| is_leaf | BOOLEAN | NO | true | NOT NULL | Whether category can have children |
| asset_count | INTEGER | NO | 0 | CHECK (asset_count >= 0) | Denormalized count of direct assets |
| total_asset_count | INTEGER | NO | 0 | CHECK (total_asset_count >= 0) | Denormalized count including descendants |
| depreciation_policy_id | UUID | YES | NULL | FK depreciation_policies(id) ON DELETE SET NULL | Default depreciation policy |
| default_location_id | UUID | YES | NULL | FK locations(id) ON DELETE SET NULL | Default storage location |
| metadata | JSONB | YES | '{}'::jsonb | - | Extensible key-value configuration |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| created_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | User who created the record |
| updated_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | User who last modified the record |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp (NULL = active) |

### Indexes

`sql
CREATE INDEX idx_asset_categories_org ON asset_categories(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_categories_parent ON asset_categories(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_categories_path ON asset_categories USING gist(path);
CREATE INDEX idx_asset_categories_slug ON asset_categories(organization_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_categories_active ON asset_categories(is_active) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_asset_categories_sort ON asset_categories(parent_id, sort_order) WHERE deleted_at IS NULL;
`

### Example Record

`json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "organization_id": "org-uuid-001",
  "parent_id": "parent-uuid-001",
  "name": "High-Performance Laptops",
  "slug": "high-performance-laptops",
  "path": "IT.Laptops.High-Performance",
  "depth": 2,
  "sort_order": 3,
  "description": "Powerful laptops for development and design teams",
  "icon": "laptop-fast",
  "color": "#2563EB",
  "is_active": true,
  "is_leaf": true,
  "asset_count": 45,
  "total_asset_count": 45,
  "depreciation_policy_id": "dep-policy-001",
  "default_location_id": "loc-uuid-001",
  "metadata": {"required_fields": ["gpu_model", "ram_size"], "max_age_months": 48},
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-06-20T14:15:00Z",
  "created_by": "user-uuid-admin",
  "updated_by": "user-uuid-admin",
  "deleted_at": null
}
`

### Validation Rules
- name must be 1-255 characters, no leading/trailing whitespace
- slug must match ^[a-z0-9]+(?:-[a-z0-9]+)*$
- path must be valid LTREE label (alphanumeric + underscores, max 256 bytes)
- parent_id must reference a category within the same organization_id
- Circular references are prevented by path uniqueness
- color must be valid hex ^#[0-9A-Fa-f]{6}$

### Business Rules
1. A root category has parent_id IS NULL and depth = 0
2. Max depth is 20 levels (configurable via metadata.max_depth)
3. Deleting a category cascades to children (re-parent or soft-delete)
4. asset_count is updated via trigger when assets are created/updated
5. Categories with is_active = false cannot receive new assets
6. Moving a category updates path and depth for all descendants (batch operation)
7. Root categories cannot be deleted if they have active children

### Relationships

| Type | Related Table | FK Column | Description |
|------|---------------|-----------|-------------|
| Self-referencing One-to-Many | asset_categories | parent_id | Parent-child tree structure |
| Many-to-One | organizations | organization_id | Category belongs to one org |
| One-to-Many | assets | category_id | Category contains many assets |
| One-to-Many | category_custom_fields | category_id | Custom fields defined per category |
| Many-to-One | depreciation_policies | depreciation_policy_id | Default depreciation policy |
| Many-to-One | locations | default_location_id | Default storage location |

### Cascade Rules
- DELETE on parent category: CASCADE to children (cascading soft delete)
- DELETE on organization: CASCADE (all categories removed)
- SET NULL on depreciation policy delete
- SET NULL on location delete

### Soft Delete Behavior
Soft-deleting a category sets deleted_at. The application layer must filter WHERE deleted_at IS NULL and prevent asset assignment to soft-deleted categories. Descendant categories are also soft-deleted.

### Future Expansion
- Category-level approval workflows
- Multi-language support via category_translations table
- Category-level budget caps and spending alerts
- AI-suggested category assignment based on asset name/description

### Performance Notes
- LTREE GiST index provides sub-millisecond ancestor/descendant queries even at 100K+ categories
- asset_count and total_asset_count are denormalized to avoid COUNT queries on large asset tables
- Materialized path avoids recursive CTEs for common ancestor operations
- Consider pg_stat_user_tables monitoring for high-churn path updates

### API Usage
`
GET    /api/v1/organizations/:orgId/categories
GET    /api/v1/organizations/:orgId/categories/:id
POST   /api/v1/organizations/:orgId/categories
PATCH  /api/v1/organizations/:orgId/categories/:id
DELETE /api/v1/organizations/:orgId/categories/:id
GET    /api/v1/organizations/:orgId/categories/:id/tree
GET    /api/v1/organizations/:orgId/categories/:id/path
`

---

## 16. category_custom_fields

### Purpose
Defines dynamic custom fields that can be attached to assets within a specific category. Supports the EAV (Entity-Attribute-Value) pattern for flexible metadata.

### Business Requirement
Different asset categories require different metadata (e.g., laptops need RAM/CPU, vehicles need license plates, furniture needs dimensions). Rather than adding columns to the assets table, categories define their own custom fields.

### Description
category_custom_fields allows organization admins to define additional fields for assets in specific categories. Each field has a data type, validation rules, and display configuration. Values are stored in the assets.custom_fields JSONB column, validated against these definitions.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique field identifier |
| category_id | UUID | NO | - | NOT NULL, FK asset_categories(id) ON DELETE CASCADE | Owning category |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| field_key | VARCHAR(100) | NO | - | NOT NULL, UNIQUE(category_id, field_key) | Machine-readable key (snake_case) |
| field_label | VARCHAR(255) | NO | - | NOT NULL | Human-readable display label |
| field_type | custom_field_type_enum | NO | - | NOT NULL | Data type |
| description | TEXT | YES | NULL | - | Help text for the field |
| is_required | BOOLEAN | NO | false | NOT NULL | Whether the field must be filled |
| is_unique | BOOLEAN | NO | false | NOT NULL | Whether values must be unique across category |
| is_filterable | BOOLEAN | NO | false | NOT NULL | Whether field appears in search filters |
| is_sortable | BOOLEAN | NO | false | NOT NULL | Whether field can be used for sorting |
| is_visible_in_list | BOOLEAN | NO | true | NOT NULL | Show in asset list views |
| default_value | JSONB | YES | NULL | - | Default value in JSON format |
| validation_rules | JSONB | YES | '{}'::jsonb | - | Validation config (min, max, minLength, maxLength, pattern) |
| select_options | JSONB | YES | NULL | - | Array of options for select/multi_select |
| sort_order | INTEGER | NO | 0 | NOT NULL | Display ordering |
| group_name | VARCHAR(100) | YES | NULL | - | UI grouping label |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| created_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | User who created the record |
| updated_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | User who last modified the record |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definition

`sql
CREATE TYPE custom_field_type_enum AS ENUM (
  'text', 'number', 'boolean', 'date', 'select',
  'multi_select', 'url', 'email', 'phone', 'file',
  'rich_text', 'color', 'json'
);
`

### Indexes

`sql
CREATE INDEX idx_category_custom_fields_category ON category_custom_fields(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_category_custom_fields_org ON category_custom_fields(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_category_custom_fields_key ON category_custom_fields(category_id, field_key) WHERE deleted_at IS NULL;
CREATE INDEX idx_category_custom_fields_type ON category_custom_fields(field_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_category_custom_fields_sort ON category_custom_fields(category_id, sort_order) WHERE deleted_at IS NULL;
`

### Example Record

`json
{
  "id": "cf-uuid-001",
  "category_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "organization_id": "org-uuid-001",
  "field_key": "gpu_model",
  "field_label": "GPU Model",
  "field_type": "select",
  "description": "Graphics card model installed in the laptop",
  "is_required": true,
  "is_unique": false,
  "is_filterable": true,
  "is_sortable": true,
  "is_visible_in_list": true,
  "default_value": "NVIDIA RTX 4060",
  "validation_rules": {"minLength": 1, "maxLength": 100},
  "select_options": [
    {"label": "NVIDIA RTX 4060", "value": "nvidia-rtx-4060", "color": "#76B900"},
    {"label": "NVIDIA RTX 4070", "value": "nvidia-rtx-4070", "color": "#76B900"},
    {"label": "AMD Radeon RX 7900", "value": "amd-radeon-7900", "color": "#ED1C24"}
  ],
  "sort_order": 1,
  "group_name": "Hardware Specifications",
  "created_at": "2026-01-15T10:35:00Z",
  "updated_at": "2026-01-15T10:35:00Z",
  "created_by": "user-uuid-admin",
  "updated_by": "user-uuid-admin",
  "deleted_at": null
}
`

### Validation Rules
- field_key must match ^[a-z][a-z0-9_]{0,99}$
- field_label must be 1-255 characters
- select_options must be non-empty array for select and multi_select types
- Cannot change field_type after creation if data exists using this field
- Max 50 custom fields per category

### Business Rules
1. Custom fields are scoped to a single category (no cross-category sharing)
2. Changing field_type when assets have values requires a data migration
3. is_unique enforcement requires a background job to scan assets.custom_fields
4. Deleting a custom field does NOT remove existing values from assets.custom_fields (cleanup job needed)
5. sort_order is re-indexed when fields are reordered

### Relationships

| Type | Related Table | FK Column | Description |
|------|---------------|-----------|-------------|
| Many-to-One | asset_categories | category_id | Field belongs to one category |
| Many-to-One | organizations | organization_id | Field belongs to one org |
| Many-to-One | users | created_by / updated_by | Audit trail |

### Cascade Rules
- DELETE on category: CASCADE (fields deleted when category deleted)
- DELETE on organization: CASCADE

### Soft Delete Behavior
Soft-deleting a field removes it from forms but preserves historical data in assets.custom_fields.

### Future Expansion
- Field-level access control (hide from certain roles)
- Field templates: reusable field sets applied to multiple categories
- Computed fields: auto-calculated from other custom fields
- Import/export of custom field definitions across organizations

### Performance Notes
- validation_rules and select_options JSONB columns are not indexed (queried in application layer)
- Application should cache custom field definitions per category in Redis
- At 10K+ custom fields (unlikely), consider partitioning by category_id

### API Usage
`
GET    /api/v1/categories/:categoryId/fields
POST   /api/v1/categories/:categoryId/fields
PATCH  /api/v1/categories/:categoryId/fields/:fieldId
DELETE /api/v1/categories/:categoryId/fields/:fieldId
PATCH  /api/v1/categories/:categoryId/fields/reorder
`

---

## 17. assets

### Purpose
THE core table of the entire system. Stores every physical and digital asset tracked by the organization. This is the central entity that all other tables reference.

### Business Requirement
Organizations need a single source of truth for all assets including: identification, location tracking, assignment/allocation, lifecycle management, financial tracking (depreciation, valuation), maintenance scheduling, compliance, and audit readiness.

### Description
assets is the largest and most complex table in the system. It stores comprehensive asset information across identification, physical characteristics, financial data, lifecycle management, and operational status. The table uses JSONB extensively for flexible metadata, custom fields, and extensible attributes. Every status change is traced through asset_status_history. The table supports soft delete, multi-tenancy, and is designed for 1M+ records with appropriate indexing.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique asset identifier |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| category_id | UUID | NO | - | NOT NULL, FK asset_categories(id) ON DELETE RESTRICT | Asset category |
| location_id | UUID | YES | NULL | FK locations(id) ON DELETE SET NULL | Current physical location |
| assigned_to_user_id | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Currently assigned user |
| assigned_to_department_id | UUID | YES | NULL | FK departments(id) ON DELETE SET NULL | Currently assigned department |
| custodian_id | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Person responsible for the asset |
| asset_tag | VARCHAR(100) | NO | - | NOT NULL, UNIQUE(organization_id, asset_tag) | Human-readable asset tag (e.g., IT-LP-00456) |
| serial_number | VARCHAR(255) | YES | NULL | UNIQUE(organization_id, serial_number) WHERE serial_number IS NOT NULL | Manufacturer serial number |
| name | VARCHAR(500) | NO | - | NOT NULL | Asset display name |
| description | TEXT | YES | NULL | - | Detailed description |
| status | asset_status_enum | NO | 'draft' | NOT NULL | Current lifecycle status |
| sub_status | VARCHAR(100) | YES | NULL | - | Granular sub-status for custom workflows |
| condition_status | asset_condition_enum | NO | 'good' | NOT NULL | Physical condition rating |
| priority | asset_priority_enum | NO | 'medium' | NOT NULL | Business priority level |
| acquisition_type | acquisition_type_enum | YES | NULL | - | How asset was acquired |
| acquisition_date | DATE | YES | NULL | - | Date asset was acquired |
| acquisition_cost | DECIMAL(15,2) | YES | NULL | CHECK (acquisition_cost >= 0) | Original purchase cost |
| current_value | DECIMAL(15,2) | YES | NULL | CHECK (current_value >= 0) | Current depreciated value |
| replacement_cost | DECIMAL(15,2) | YES | NULL | CHECK (replacement_cost >= 0) | Cost to replace |
| currency_code | CHAR(3) | NO | 'USD' | NOT NULL | ISO 4217 currency code |
| depreciation_method | depreciation_method_enum | YES | NULL | - | Depreciation calculation method |
| useful_life_months | INTEGER | YES | NULL | CHECK (useful_life_months > 0) | Expected useful life in months |
| salvage_value | DECIMAL(15,2) | YES | NULL | CHECK (salvage_value >= 0) | Value at end of useful life |
| depreciation_start_date | DATE | YES | NULL | - | When depreciation begins |
| last_depreciation_date | DATE | YES | NULL | - | Last depreciation run date |
| manufacturer | VARCHAR(255) | YES | NULL | - | Manufacturer/brand name |
| model | VARCHAR(255) | YES | NULL | - | Model number/name |
| year_manufactured | INTEGER | YES | NULL | CHECK (year_manufactured >= 1900 AND year_manufactured <= 2100) | Year of manufacture |
| warranty_start_date | DATE | YES | NULL | - | Warranty start date |
| warranty_end_date | DATE | YES | NULL | - | Warranty expiration date |
| warranty_provider | VARCHAR(255) | YES | NULL | - | Warranty provider name |
| warranty_terms | TEXT | YES | NULL | - | Warranty coverage details |
| purchase_order_number | VARCHAR(100) | YES | NULL | - | Associated PO number |
| invoice_number | VARCHAR(100) | YES | NULL | - | Associated invoice number |
| supplier_id | UUID | YES | NULL | FK suppliers(id) ON DELETE SET NULL | Vendor/supplier |
| insurance_policy_number | VARCHAR(100) | YES | NULL | - | Insurance policy reference |
| insurance_expiry_date | DATE | YES | NULL | - | Insurance expiration |
| insurance_value | DECIMAL(15,2) | YES | NULL | CHECK (insurance_value >= 0) | Insured value |
| barcode | VARCHAR(255) | YES | NULL | UNIQUE(organization_id, barcode) WHERE barcode IS NOT NULL | Barcode value |
| rfid_tag | VARCHAR(255) | YES | NULL | UNIQUE(organization_id, rfid_tag) WHERE rfid_tag IS NOT NULL | RFID tag identifier |
| qr_code_id | UUID | YES | NULL | FK asset_qr_codes(id) ON DELETE SET NULL | Associated QR code |
| image_urls | JSONB | YES | '[]'::jsonb | - | Array of image URLs |
| thumbnail_url | VARCHAR(500) | YES | NULL | - | Primary thumbnail image URL |
| is_assigned | BOOLEAN | NO | false | NOT NULL | Denormalized: currently allocated? |
| is_insured | BOOLEAN | NO | false | NOT NULL | Has active insurance? |
| is_under_warranty | BOOLEAN | NO | false | NOT NULL | Has active warranty? |
| is_movable | BOOLEAN | NO | true | NOT NULL | Can asset be transferred? |
| requires_audit | BOOLEAN | NO | false | NOT NULL | Flagged for audit |
| last_audit_date | DATE | YES | NULL | - | Date of last physical audit |
| next_maintenance_date | DATE | YES | NULL | - | Scheduled next maintenance |
| last_maintenance_date | DATE | YES | NULL | - | Last completed maintenance |
| total_maintenance_cost | DECIMAL(15,2) | NO | 0.00 | CHECK (total_maintenance_cost >= 0) | Accumulated maintenance spend |
| book_value | DECIMAL(15,2) | YES | NULL | - | Current book value (computed) |
| custom_fields | JSONB | YES | '{}'::jsonb | - | Dynamic custom field values |
| tags | JSONB | YES | '[]'::jsonb | - | Array of tag strings |
| notes | TEXT | YES | NULL | - | Free-form notes |
| metadata | JSONB | YES | '{}'::jsonb | - | Extensible metadata store |
| disposal_date | DATE | YES | NULL | - | Date asset was disposed |
| disposal_method | VARCHAR(100) | YES | NULL | - | How asset was disposed |
| disposal_value | DECIMAL(15,2) | YES | NULL | CHECK (disposal_value >= 0) | Value received at disposal |
| disposal_reason | TEXT | YES | NULL | - | Reason for disposal |
| version | INTEGER | NO | 1 | NOT NULL, CHECK (version > 0) | Optimistic locking version |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| created_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | User who created the record |
| updated_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | User who last modified the record |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp (NULL = active) |

### Enum Type Definitions

`sql
CREATE TYPE asset_status_enum AS ENUM (
  'draft', 'pending_approval', 'approved', 'active', 'in_use',
  'available', 'reserved', 'in_transit', 'in_maintenance',
  'under_repair', 'retired', 'disposed', 'lost', 'stolen',
  'written_off', 'pending_disposal', 'archived'
);

CREATE TYPE asset_condition_enum AS ENUM (
  'excellent', 'good', 'fair', 'poor', 'damaged', 'non_functional', 'salvage'
);

CREATE TYPE asset_priority_enum AS ENUM (
  'critical', 'high', 'medium', 'low', 'none'
);

CREATE TYPE acquisition_type_enum AS ENUM (
  'purchase', 'lease', 'lease_to_own', 'donation', 'transfer',
  'inheritance', 'government_surplus', 'trade_in', 'other'
);

CREATE TYPE depreciation_method_enum AS ENUM (
  'straight_line', 'declining_balance', 'double_declining',
  'sum_of_years', 'units_of_production', 'none'
);
`

### Indexes

`sql
CREATE INDEX idx_assets_org ON assets(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_category ON assets(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_location ON assets(location_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_status ON assets(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_condition ON assets(condition_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_assigned_user ON assets(assigned_to_user_id) WHERE deleted_at IS NULL AND assigned_to_user_id IS NOT NULL;
CREATE INDEX idx_assets_assigned_dept ON assets(assigned_to_department_id) WHERE deleted_at IS NULL AND assigned_to_department_id IS NOT NULL;
CREATE INDEX idx_assets_is_assigned ON assets(is_assigned) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_tag ON assets(organization_id, asset_tag) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_serial ON assets(organization_id, serial_number) WHERE deleted_at IS NULL AND serial_number IS NOT NULL;
CREATE INDEX idx_assets_barcode ON assets(organization_id, barcode) WHERE deleted_at IS NULL AND barcode IS NOT NULL;
CREATE INDEX idx_assets_rfid ON assets(organization_id, rfid_tag) WHERE deleted_at IS NULL AND rfid_tag IS NOT NULL;
CREATE INDEX idx_assets_name_gin ON assets USING gin(to_tsvector('english', name)) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_description_gin ON assets USING gin(to_tsvector('english', COALESCE(description, ''))) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_tags ON assets USING gin(tags) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_custom_fields ON assets USING gin(custom_fields) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_metadata ON assets USING gin(metadata) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_acquisition_cost ON assets(acquisition_cost) WHERE deleted_at IS NULL AND acquisition_cost IS NOT NULL;
CREATE INDEX idx_assets_depreciation_date ON assets(depreciation_start_date) WHERE deleted_at IS NULL AND depreciation_start_date IS NOT NULL;
CREATE INDEX idx_assets_next_maintenance ON assets(next_maintenance_date) WHERE deleted_at IS NULL AND next_maintenance_date IS NOT NULL;
CREATE INDEX idx_assets_requires_audit ON assets(requires_audit) WHERE deleted_at IS NULL AND requires_audit = true;
CREATE INDEX idx_assets_warranty_end ON assets(warranty_end_date) WHERE deleted_at IS NULL AND warranty_end_date IS NOT NULL;
CREATE INDEX idx_assets_insurance_expiry ON assets(insurance_expiry_date) WHERE deleted_at IS NULL AND insurance_expiry_date IS NOT NULL;
CREATE INDEX idx_assets_org_status_cat ON assets(organization_id, status, category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_active ON assets(organization_id, status) WHERE deleted_at IS NULL AND status IN ('active', 'in_use', 'available');
`

### Example Record

`json
{
  "id": "asset-uuid-001",
  "organization_id": "org-uuid-001",
  "category_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "location_id": "loc-uuid-042",
  "assigned_to_user_id": "user-uuid-087",
  "assigned_to_department_id": "dept-uuid-003",
  "custodian_id": "user-uuid-087",
  "asset_tag": "IT-LP-00456",
  "serial_number": "C02XK1ABCDE",
  "name": "MacBook Pro 16-inch M3 Max",
  "description": "Primary development workstation for senior engineer. 64GB RAM, 2TB SSD.",
  "status": "in_use",
  "condition_status": "excellent",
  "priority": "high",
  "acquisition_type": "purchase",
  "acquisition_date": "2026-01-15",
  "acquisition_cost": 3499.00,
  "current_value": 2799.20,
  "replacement_cost": 3999.00,
  "currency_code": "USD",
  "depreciation_method": "straight_line",
  "useful_life_months": 48,
  "salvage_value": 500.00,
  "depreciation_start_date": "2026-01-15",
  "last_depreciation_date": "2026-06-30",
  "manufacturer": "Apple",
  "model": "MacBook Pro 16-inch M3 Max",
  "year_manufactured": 2026,
  "warranty_start_date": "2026-01-15",
  "warranty_end_date": "2029-01-15",
  "warranty_provider": "Apple Inc.",
  "purchase_order_number": "PO-2026-00123",
  "invoice_number": "INV-APL-45678",
  "supplier_id": "supplier-uuid-apple",
  "barcode": "8884298427123",
  "rfid_tag": "E280116080F0123456789ABC",
  "qr_code_id": "qr-uuid-001",
  "image_urls": ["https://cdn.assetflow.io/assets/asset-uuid-001/front.webp"],
  "thumbnail_url": "https://cdn.assetflow.io/assets/asset-uuid-001/thumb.webp",
  "is_assigned": true,
  "is_insured": true,
  "is_under_warranty": true,
  "is_movable": true,
  "requires_audit": false,
  "last_audit_date": "2026-03-15",
  "next_maintenance_date": "2026-07-15",
  "last_maintenance_date": "2026-01-15",
  "total_maintenance_cost": 0.00,
  "book_value": 2799.20,
  "custom_fields": {"gpu_model": "nvidia-rtx-4060", "ram_size": "64GB", "storage_size": "2TB SSD"},
  "tags": ["development", "engineering", "high-priority", "apple"],
  "metadata": {"it_asset_type": "workstation", "encryption_enabled": true, "mdm_enrolled": true},
  "version": 7,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-07-10T09:22:00Z",
  "created_by": "user-uuid-admin",
  "updated_by": "user-uuid-087",
  "deleted_at": null
}
`

### Validation Rules
- asset_tag must be unique within the organization
- serial_number must be unique within the organization when provided
- acquisition_cost must be >= 0
- current_value must be <= acquisition_cost (unless appreciation applies)
- warranty_end_date must be > warranty_start_date when both are provided
- custom_fields keys must match field_key values from category_custom_fields for the asset's category
- tags array max 20 tags, each max 50 characters
- version must match for optimistic locking on updates

### Business Rules
1. **Status State Machine**: Assets follow a defined state machine. Each transition is recorded in asset_status_history.
2. **Allocation Consistency**: When is_assigned = true, assigned_to_user_id or assigned_to_department_id must be non-NULL
3. **Depreciation Calculation**: current_value is recalculated on each depreciation run
4. **Warranty Tracking**: is_under_warranty is computed from warranty_end_date > NOW()
5. **Insurance Tracking**: is_insured is computed from insurance_expiry_date > NOW()
6. **Disposal Workflow**: Assets must go through pending_disposal -> approval -> disposed (never directly)
7. **Maintenance Cost Rollup**: total_maintenance_cost is updated via trigger when maintenance requests are completed
8. **Custom Field Validation**: On save, custom_fields values are validated against category_custom_fields definitions
9. **Soft Delete Guard**: Soft-deleted assets cannot be allocated, transferred, or have maintenance requests created
10. **Optimistic Locking**: version field is checked on every update; stale updates are rejected

### Status State Machine

`
draft -> pending_approval -> approved -> active -> in_use
                                     \-> available -> reserved -> in_use
                                                       \-> in_transit
active -> in_maintenance -> under_repair -> active
active -> retired -> disposed
active -> lost
active -> stolen
active -> written_off
active -> pending_disposal -> disposed
active -> archived
any status -> retired (admin override)
`

### Relationships

| Type | Related Table | FK Column | Description |
|------|---------------|-----------|-------------|
| Many-to-One | organizations | organization_id | Asset belongs to one org |
| Many-to-One | asset_categories | category_id | Asset classified in one category |
| Many-to-One | locations | location_id | Asset physically at one location |
| Many-to-One | users | assigned_to_user_id | Asset assigned to one user |
| Many-to-One | departments | assigned_to_department_id | Asset assigned to one department |
| Many-to-One | users | custodian_id | Asset has one custodian |
| One-to-Many | asset_images | asset_id | Asset has many images |
| One-to-Many | asset_documents | asset_id | Asset has many documents |
| One-to-One | asset_qr_codes | asset_id | Asset has one QR code |
| One-to-Many | asset_status_history | asset_id | Status change audit trail |
| One-to-Many | asset_allocations | asset_id | Allocation history |
| One-to-Many | asset_returns | asset_id | Return records |
| One-to-Many | transfer_requests | asset_id | Transfer requests |
| One-to-Many | maintenance_requests | asset_id | Maintenance requests |
| One-to-Many | audit_assignments | asset_id | Audit assignments |
| Many-to-One | suppliers | supplier_id | Purchased from supplier |

### Cascade Rules
- DELETE on organization: CASCADE (all assets deleted)
- DELETE on category: RESTRICT (prevent deletion if assets exist)
- DELETE on location: SET NULL (asset loses location)
- DELETE on assigned user: SET NULL (asset becomes unassigned)
- DELETE on supplier: SET NULL

### Soft Delete Behavior
Soft-deleting an asset removes it from all active queries, prevents new allocations/transfers/maintenance, and preserves all historical records. The asset tag becomes available for reuse only after hard delete (admin operation).

### Future Expansion
- AI-powered asset categorization from images
- Predictive maintenance using next_maintenance_date patterns
- Multi-currency support with exchange rate tracking
- Asset parent-child relationships (components/modules)
- Digital twin integration via metadata.digital_twin_url
- Blockchain-based provenance tracking

### Performance Notes
- Target scale: 1M+ assets per large organization
- Partial indexes (WHERE deleted_at IS NULL) reduce index size by ~50% for soft-deleted data
- GIN indexes on JSONB columns (custom_fields, tags, metadata) support flexible search but increase write time by ~15%
- Full-text search index on name and description supports efficient free-text queries
- Consider table partitioning by organization_id at 10M+ rows
- Materialized views recommended for dashboard aggregations (status counts, value summaries)
- Batch updates for depreciation runs should use SKIP LOCKED for concurrent-safe processing

### API Usage
`
GET    /api/v1/assets
GET    /api/v1/assets/:id
POST   /api/v1/assets
PATCH  /api/v1/assets/:id
DELETE /api/v1/assets/:id
POST   /api/v1/assets/:id/assign
POST   /api/v1/assets/:id/return
POST   /api/v1/assets/:id/transfer
POST   /api/v1/assets/:id/status
GET    /api/v1/assets/:id/history
GET    /api/v1/assets/:id/maintenance
GET    /api/v1/assets/:id/depreciation
POST   /api/v1/assets/:id/dispose
GET    /api/v1/assets/scan/:barcode
POST   /api/v1/assets/bulk-import
GET    /api/v1/assets/export
`

---


## 18. asset_images

### Purpose
Stores image metadata for assets. Actual images are stored in object storage (S3/R2); this table tracks references, ordering, and display configuration.

### Business Requirement
Assets need multiple images (front, back, damage photos, receipts) with ordering, captions, and type classification for comprehensive visual documentation.

### Description
asset_images is a media management table that references images stored in external object storage. It tracks image ordering, type classification, upload metadata, and AI-generated tags.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique image identifier |
| asset_id | UUID | NO | - | NOT NULL, FK assets(id) ON DELETE CASCADE | Parent asset |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| image_type | image_type_enum | NO | 'general' | NOT NULL | Classification of image |
| file_name | VARCHAR(500) | NO | - | NOT NULL | Original file name |
| file_size_bytes | BIGINT | NO | - | NOT NULL, CHECK (file_size_bytes > 0) | File size in bytes |
| mime_type | VARCHAR(100) | NO | - | NOT NULL | MIME type (image/jpeg, image/png, image/webp) |
| storage_provider | VARCHAR(50) | NO | 's3' | NOT NULL | Object storage provider |
| storage_bucket | VARCHAR(255) | NO | - | NOT NULL | S3 bucket name |
| storage_key | VARCHAR(1000) | NO | - | NOT NULL, UNIQUE | Object key/path in storage |
| storage_region | VARCHAR(50) | YES | NULL | - | Storage region |
| cdn_url | VARCHAR(1000) | NO | - | NOT NULL | Public CDN URL for access |
| thumbnail_url | VARCHAR(1000) | YES | NULL | - | Thumbnail variant URL |
| medium_url | VARCHAR(1000) | YES | NULL | - | Medium-size variant URL |
| width_pixels | INTEGER | YES | NULL | CHECK (width_pixels > 0) | Image width |
| height_pixels | INTEGER | YES | NULL | CHECK (height_pixels > 0) | Image height |
| alt_text | VARCHAR(255) | YES | NULL | - | Accessibility alt text |
| caption | VARCHAR(500) | YES | NULL | - | User-provided caption |
| sort_order | INTEGER | NO | 0 | NOT NULL | Display ordering within asset |
| is_primary | BOOLEAN | NO | false | NOT NULL | Primary/display image |
| is_public | BOOLEAN | NO | false | NOT NULL | Visible in public-facing views |
| exif_data | JSONB | YES | '{}'::jsonb | - | EXIF metadata (camera, GPS, timestamp) |
| ai_tags | JSONB | YES | '[]'::jsonb | - | AI-generated tags for search |
| uploaded_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | User who uploaded |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definition

```sql
CREATE TYPE image_type_enum AS ENUM (
  'general', 'front', 'back', 'left_side', 'right_side',
  'top', 'bottom', 'damage', 'receipt', 'label',
  'serial_number', 'screenshot', 'certificate', 'other'
);
```

### Indexes

```sql
CREATE INDEX idx_asset_images_asset ON asset_images(asset_id, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_images_org ON asset_images(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_images_type ON asset_images(image_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_images_primary ON asset_images(asset_id) WHERE deleted_at IS NULL AND is_primary = true;
CREATE INDEX idx_asset_images_ai_tags ON asset_images USING gin(ai_tags) WHERE deleted_at IS NULL;
```

### Example Record

```json
{
  "id": "img-uuid-001",
  "asset_id": "asset-uuid-001",
  "organization_id": "org-uuid-001",
  "image_type": "front",
  "file_name": "macbook_pro_front_2026.webp",
  "file_size_bytes": 245760,
  "mime_type": "image/webp",
  "storage_provider": "s3",
  "storage_bucket": "assetflow-prod-assets",
  "storage_key": "org-001/assets/asset-uuid-001/images/img-uuid-001.webp",
  "cdn_url": "https://cdn.assetflow.io/org-001/assets/asset-uuid-001/images/img-uuid-001.webp",
  "thumbnail_url": "https://cdn.assetflow.io/org-001/assets/asset-uuid-001/images/img-uuid-001_thumb.webp",
  "width_pixels": 4032,
  "height_pixels": 3024,
  "alt_text": "Front view of MacBook Pro 16-inch",
  "caption": "Initial condition photo",
  "sort_order": 0,
  "is_primary": true,
  "is_public": false,
  "exif_data": {"camera": "iPhone 15 Pro", "taken_at": "2026-01-15T11:30:00Z"},
  "ai_tags": ["laptop", "apple", "macbook", "keyboard", "screen"],
  "uploaded_by": "user-uuid-087",
  "created_at": "2026-01-15T11:32:00Z",
  "updated_at": "2026-01-15T11:32:00Z",
  "deleted_at": null
}
```

### Validation Rules
- mime_type must be: image/jpeg, image/png, image/webp, image/tiff, image/bmp
- file_size_bytes max 50MB (configurable per org)
- Only one is_primary = true per asset
- alt_text required when is_public = true

### Business Rules
1. Max 50 images per asset
2. Only one primary image per asset; setting new primary unsets previous
3. Deleting an image removes the storage object via background job
4. ai_tags populated asynchronously after upload via ML pipeline
5. exif_data GPS is stripped if org policy strip_gps = true

### Relationships

| Type | Related Table | FK Column | Description |
|------|---------------|-----------|-------------|
| Many-to-One | assets | asset_id | Image belongs to one asset |
| Many-to-One | organizations | organization_id | Image belongs to one org |
| Many-to-One | users | uploaded_by | Upload audit trail |

### Cascade Rules
- DELETE on asset: CASCADE (storage cleanup via background job)
- DELETE on organization: CASCADE

### Soft Delete Behavior
Soft-deleted images return 410 Gone for direct CDN URLs. Primary image cannot be soft-deleted without reassigning primary.

### Future Expansion
- Image versioning (before/after for condition tracking)
- Video attachment support
- AI-powered damage detection from images
- Batch upload with drag-and-drop
- Image comparison tool for condition assessment

### Performance Notes
- Image metadata queries are fast; actual serving goes through CDN
- ai_tags GIN index supports tag-based search at scale
- Thumbnail generation is async (background worker)
- At 10M+ images, consider partitioning by organization_id

### API Usage
```
GET    /api/v1/assets/:assetId/images
POST   /api/v1/assets/:assetId/images
PATCH  /api/v1/assets/:assetId/images/:imageId
DELETE /api/v1/assets/:assetId/images/:imageId
PATCH  /api/v1/assets/:assetId/images/reorder
PATCH  /api/v1/assets/:assetId/images/:imageId/primary
```

---

## 19. asset_documents

### Purpose
Stores document metadata and references for asset-related files (invoices, warranties, manuals, contracts, certificates).

### Business Requirement
Assets often have associated documents that need to be stored, tracked, and made accessible. Documents have types, expiration dates, and may require periodic renewal.

### Description
asset_documents manages document attachments for assets. Files are stored in object storage; this table tracks metadata, access controls, expiration tracking, and document lifecycle.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique document identifier |
| asset_id | UUID | NO | - | NOT NULL, FK assets(id) ON DELETE CASCADE | Parent asset |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| document_type | document_type_enum | NO | 'other' | NOT NULL | Classification of document |
| title | VARCHAR(500) | NO | - | NOT NULL | Document title |
| description | TEXT | YES | NULL | - | Document description |
| file_name | VARCHAR(500) | NO | - | NOT NULL | Original file name |
| file_size_bytes | BIGINT | NO | - | NOT NULL, CHECK (file_size_bytes > 0) | File size in bytes |
| mime_type | VARCHAR(100) | NO | - | NOT NULL | MIME type |
| storage_bucket | VARCHAR(255) | NO | - | NOT NULL | S3 bucket |
| storage_key | VARCHAR(1000) | NO | - | NOT NULL, UNIQUE | Object key in storage |
| cdn_url | VARCHAR(1000) | NO | - | NOT NULL | Download URL |
| version_number | INTEGER | NO | 1 | NOT NULL, CHECK (version_number > 0) | Document version |
| is_latest_version | BOOLEAN | NO | true | NOT NULL | Whether this is the current version |
| parent_document_id | UUID | YES | NULL | FK asset_documents(id) ON DELETE SET NULL | Previous version reference |
| effective_date | DATE | YES | NULL | - | When document becomes effective |
| expiration_date | DATE | YES | NULL | - | When document expires |
| is_confidential | BOOLEAN | NO | false | NOT NULL | Restricted access flag |
| tags | JSONB | YES | '[]'::jsonb | - | Searchable tags |
| metadata | JSONB | YES | '{}'::jsonb | - | Extensible metadata |
| uploaded_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Upload audit trail |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definition

```sql
CREATE TYPE document_type_enum AS ENUM (
  'invoice', 'receipt', 'purchase_order', 'warranty_card',
  'warranty_certificate', 'insurance_policy', 'insurance_certificate',
  'user_manual', 'technical_manual', 'maintenance_log',
  'inspection_report', 'compliance_certificate', 'safety_certificate',
  'lease_agreement', 'rental_agreement', 'contract',
  'photograph', 'scan', 'spreadsheet', 'presentation',
  'email_correspondence', 'legal_document', 'other'
);
```

### Indexes

```sql
CREATE INDEX idx_asset_documents_asset ON asset_documents(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_documents_org ON asset_documents(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_documents_type ON asset_documents(document_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_documents_expiration ON asset_documents(expiration_date) WHERE deleted_at IS NULL AND expiration_date IS NOT NULL;
CREATE INDEX idx_asset_documents_latest ON asset_documents(asset_id) WHERE deleted_at IS NULL AND is_latest_version = true;
CREATE INDEX idx_asset_documents_tags ON asset_documents USING gin(tags) WHERE deleted_at IS NULL;
```

### Example Record

```json
{
  "id": "doc-uuid-001",
  "asset_id": "asset-uuid-001",
  "organization_id": "org-uuid-001",
  "document_type": "invoice",
  "title": "Apple Purchase Invoice - MacBook Pro",
  "description": "Original purchase invoice from Apple Store",
  "file_name": "invoice_apple_2026_00123.pdf",
  "file_size_bytes": 156432,
  "mime_type": "application/pdf",
  "storage_bucket": "assetflow-prod-documents",
  "storage_key": "org-001/assets/asset-uuid-001/documents/doc-uuid-001.pdf",
  "cdn_url": "https://cdn.assetflow.io/org-001/assets/asset-uuid-001/documents/doc-uuid-001.pdf",
  "version_number": 1,
  "is_latest_version": true,
  "parent_document_id": null,
  "effective_date": "2026-01-15",
  "expiration_date": null,
  "is_confidential": false,
  "tags": ["invoice", "apple", "purchase", "2026"],
  "uploaded_by": "user-uuid-admin",
  "created_at": "2026-01-15T12:00:00Z",
  "updated_at": "2026-01-15T12:00:00Z",
  "deleted_at": null
}
```

### Validation Rules
- mime_type must be a valid document MIME type (PDF, DOCX, XLSX, etc.)
- file_size_bytes max 100MB (configurable per org)
- expiration_date must be > effective_date when both provided
- version_number auto-increments when new version uploaded

### Business Rules
1. Max 100 documents per asset
2. Document versioning: new uploads linked via parent_document_id
3. Only one is_latest_version = true per document chain
4. Expiring documents trigger notifications 30, 7, and 1 days before expiration_date
5. Confidential documents excluded from bulk exports and public API

### Relationships

| Type | Related Table | FK Column | Description |
|------|---------------|-----------|-------------|
| Many-to-One | assets | asset_id | Document belongs to one asset |
| Self-referencing | asset_documents | parent_document_id | Document version chain |

### Cascade Rules
- DELETE on asset: CASCADE (storage cleanup async)
- Self-referencing: SET NULL on parent_document_id when previous version deleted

### Performance Notes
- Document metadata is small; file serving goes through CDN
- Expiration date index supports efficient notification queries

### API Usage
```
GET    /api/v1/assets/:assetId/documents
POST   /api/v1/assets/:assetId/documents
GET    /api/v1/assets/:assetId/documents/:docId
GET    /api/v1/assets/:assetId/documents/:docId/download
PATCH  /api/v1/assets/:assetId/documents/:docId
DELETE /api/v1/assets/:assetId/documents/:docId
```

---

## 20. asset_qr_codes

### Purpose
Generates and manages QR codes for asset identification, enabling quick lookup via mobile scanning.

### Business Requirement
Physical assets need scannable QR codes that link to their digital records, enabling field personnel to instantly access asset information, log maintenance, and update status.

### Description
asset_qr_codes stores QR code generation metadata. The actual QR code image is generated server-side and stored in object storage.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique QR code identifier |
| asset_id | UUID | NO | - | NOT NULL, UNIQUE, FK assets(id) ON DELETE CASCADE | Associated asset (one-to-one) |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| qr_data | TEXT | NO | - | NOT NULL | Encoded QR content (URL or JSON) |
| qr_type | qr_type_enum | NO | 'url' | NOT NULL | Type of QR code |
| display_text | VARCHAR(255) | YES | NULL | - | Text shown below QR code when printed |
| storage_bucket | VARCHAR(255) | NO | - | NOT NULL | Storage bucket for QR image |
| storage_key | VARCHAR(1000) | NO | - | NOT NULL, UNIQUE | Storage path for QR image |
| image_url | VARCHAR(1000) | NO | - | NOT NULL | CDN URL for QR image |
| print_size | VARCHAR(20) | NO | 'medium' | NOT NULL | Size variant for printing |
| format | VARCHAR(10) | NO | 'PNG' | NOT NULL | Image format (PNG, SVG) |
| error_correction | VARCHAR(1) | NO | 'M' | NOT NULL, CHECK (error_correction IN ('L', 'M', 'Q', 'H')) | QR error correction level |
| scan_count | INTEGER | NO | 0 | CHECK (scan_count >= 0) | Denormalized scan counter |
| last_scanned_at | TIMESTAMPTZ | YES | NULL | - | Last scan timestamp |
| last_scanned_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Last user who scanned |
| is_active | BOOLEAN | NO | true | NOT NULL | Whether QR code is valid |
| is_printed | BOOLEAN | NO | false | NOT NULL | Whether label has been printed |
| printed_at | TIMESTAMPTZ | YES | NULL | - | When label was printed |
| label_config | JSONB | YES | '{}'::jsonb | - | Print label layout configuration |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definition

```sql
CREATE TYPE qr_type_enum AS ENUM ('url', 'json', 'vcard', 'custom');
```

### Indexes

```sql
CREATE INDEX idx_asset_qr_codes_asset ON asset_qr_codes(asset_id);
CREATE INDEX idx_asset_qr_codes_org ON asset_qr_codes(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_qr_codes_active ON asset_qr_codes(is_active) WHERE deleted_at IS NULL AND is_active = true;
```

### Example Record

```json
{
  "id": "qr-uuid-001",
  "asset_id": "asset-uuid-001",
  "organization_id": "org-uuid-001",
  "qr_data": "https://app.assetflow.io/org/org-uuid-001/asset/asset-uuid-001",
  "qr_type": "url",
  "display_text": "IT-LP-00456",
  "storage_bucket": "assetflow-prod-qr",
  "storage_key": "org-001/qr/qr-uuid-001.png",
  "image_url": "https://cdn.assetflow.io/org-001/qr/qr-uuid-001.png",
  "print_size": "medium",
  "format": "PNG",
  "error_correction": "M",
  "scan_count": 23,
  "last_scanned_at": "2026-07-10T08:45:00Z",
  "last_scanned_by": "user-uuid-087",
  "is_active": true,
  "is_printed": true,
  "printed_at": "2026-01-20T14:30:00Z",
  "label_config": {"show_asset_tag": true, "show_name": true, "paper_size": "3x2_inches"},
  "created_at": "2026-01-15T12:30:00Z",
  "updated_at": "2026-07-10T08:45:00Z",
  "deleted_at": null
}
```

### Business Rules
1. One QR code per asset (enforced by UNIQUE on asset_id)
2. Scanning increments scan_count and updates last_scanned_at
3. QR codes are regenerated when asset tag changes
4. Inactive QR codes return 404 on scan

### Performance Notes
- Very small table; one row per asset
- Scan counter updates are batched via Redis buffer (flushed every 60s)

### API Usage
```
POST   /api/v1/assets/:assetId/qr
GET    /api/v1/assets/:assetId/qr
GET    /api/v1/assets/:assetId/qr/download
POST   /api/v1/assets/:assetId/qr/print
GET    /api/v1/qr/scan/:qrData
```

---

## 21. asset_status_history

### Purpose
Immutable audit trail recording every status transition for an asset. Provides complete lifecycle visibility.

### Business Requirement
Regulatory compliance and internal audit require knowing exactly when, why, and by whom every asset status change occurred. This table is append-only and never updated or deleted.

### Description
asset_status_history is an append-only log of all status transitions. Each record captures the previous status, new status, transition reason, approval chain, and timestamp.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique history identifier |
| asset_id | UUID | NO | - | NOT NULL, FK assets(id) ON DELETE RESTRICT | Associated asset |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE RESTRICT | Owning organization |
| previous_status | asset_status_enum | YES | NULL | - | Status before transition |
| new_status | asset_status_enum | NO | - | NOT NULL | Status after transition |
| transition_type | VARCHAR(50) | NO | - | NOT NULL | Type (manual, automated, approval, system) |
| reason | TEXT | YES | NULL | - | Human-readable reason for transition |
| reason_code | VARCHAR(50) | YES | NULL | - | Standardized reason code |
| previous_condition | asset_condition_enum | YES | NULL | - | Condition before change |
| new_condition | asset_condition_enum | YES | NULL | - | Condition after change |
| previous_location_id | UUID | YES | NULL | - | Location before change |
| new_location_id | UUID | YES | NULL | - | Location after change |
| previous_assigned_to | UUID | YES | NULL | - | User assignment before change |
| new_assigned_to | UUID | YES | NULL | - | User assignment after change |
| metadata | JSONB | YES | '{}'::jsonb | - | Additional transition context |
| ip_address | INET | YES | NULL | - | Client IP address |
| user_agent | VARCHAR(500) | YES | NULL | - | Client user agent |
| changed_by | UUID | NO | - | NOT NULL, FK users(id) ON DELETE RESTRICT | User who initiated the change |
| approved_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Approver if required |
| approved_at | TIMESTAMPTZ | YES | NULL | - | Approval timestamp |
| batch_id | UUID | YES | NULL | - | Batch operation identifier |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |

### Indexes

```sql
CREATE INDEX idx_asset_status_history_asset ON asset_status_history(asset_id, created_at DESC);
CREATE INDEX idx_asset_status_history_org ON asset_status_history(organization_id, created_at DESC);
CREATE INDEX idx_asset_status_history_new_status ON asset_status_history(new_status, created_at DESC);
CREATE INDEX idx_asset_status_history_changed_by ON asset_status_history(changed_by);
CREATE INDEX idx_asset_status_history_batch ON asset_status_history(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_asset_status_history_date ON asset_status_history(created_at DESC);
```

### Example Record

```json
{
  "id": "ash-uuid-001",
  "asset_id": "asset-uuid-001",
  "organization_id": "org-uuid-001",
  "previous_status": "available",
  "new_status": "in_use",
  "transition_type": "manual",
  "reason": "Allocated to John Smith for Project Phoenix development work",
  "reason_code": "allocation",
  "metadata": {"allocation_id": "alloc-uuid-001", "project": "Project Phoenix"},
  "ip_address": "192.168.1.100",
  "changed_by": "user-uuid-087",
  "approved_by": null,
  "batch_id": null,
  "created_at": "2026-01-20T09:00:00Z"
}
```

### Validation Rules
- This table is APPEND-ONLY: no UPDATE or DELETE operations allowed
- previous_status must match current assets.status at time of creation
- new_status must differ from previous_status
- Status transition must be valid per the state machine

### Business Rules
1. **Immutability**: Records are never updated or deleted (enforced via database trigger)
2. **Completeness**: Every assets.status change MUST have a corresponding record
3. **Batch Operations**: batch_id groups related changes (e.g., bulk status update)
4. **Approval Chain**: transitions requiring approval include approved_by and approved_at
5. **Reason Codes**: standardized codes for reporting (allocation, return, maintenance, disposal, etc.)

### Relationships

| Type | Related Table | FK Column | Description |
|------|---------------|-----------|-------------|
| Many-to-One | assets | asset_id | History entry for one asset |
| Many-to-One | organizations | organization_id | History belongs to one org |
| Many-to-One | users | changed_by | Who made the change |
| Many-to-One | users | approved_by | Who approved |

### Cascade Rules
- DELETE on asset: RESTRICT (cannot delete asset with history)
- DELETE on organization: RESTRICT

### Soft Delete Behavior
This table does NOT use soft delete. Records are permanent and immutable.

### Future Expansion
- Real-time event streaming (Kafka) for status changes
- Timeline visualization component
- Compliance reporting dashboards
- Automated anomaly detection on transition patterns

### Performance Notes
- Append-only table: no UPDATE/DELETE means minimal index maintenance
- At 1M assets with avg 10 transitions = 10M rows; consider partitioning by created_at (monthly)
- asset_id + created_at DESC index is the most critical for rendering asset timelines
- Vacuum/analyze less frequently (append-only = minimal dead tuples)

### API Usage
```
GET    /api/v1/assets/:assetId/history
GET    /api/v1/assets/:assetId/history?from=&to=
GET    /api/v1/assets/:assetId/timeline
```

---

## 22. asset_allocations

### Purpose
Tracks the active allocation (assignment) of an asset to a user or department. Each record represents a current or recent assignment period.

### Business Requirement
Organizations need to know who is responsible for each asset at any point in time. Allocations track the assignment period, expected return, and custodial responsibility.

### Description
asset_allocations records each allocation period for an asset. An allocation begins when an asset is assigned and ends when it is returned or transferred.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique allocation identifier |
| asset_id | UUID | NO | - | NOT NULL, FK assets(id) ON DELETE RESTRICT | Allocated asset |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| allocated_to_user_id | UUID | NO | - | NOT NULL, FK users(id) ON DELETE RESTRICT | User receiving the asset |
| allocated_to_department_id | UUID | YES | NULL | FK departments(id) ON DELETE SET NULL | Department (if dept-level allocation) |
| allocated_by | UUID | NO | - | NOT NULL, FK users(id) ON DELETE RESTRICT | User who created the allocation |
| custodian_id | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Custodian (person responsible) |
| allocation_type | allocation_type_enum | NO | 'permanent' | NOT NULL | Type of allocation |
| status | allocation_status_enum | NO | 'active' | NOT NULL | Current allocation status |
| allocation_date | DATE | NO | CURRENT_DATE | NOT NULL | Date allocation started |
| expected_return_date | DATE | YES | NULL | - | Expected return date |
| actual_return_date | DATE | YES | NULL | - | Actual return date |
| purpose | TEXT | YES | NULL | - | Reason for allocation |
| project_code | VARCHAR(100) | YES | NULL | - | Associated project code |
| cost_center | VARCHAR(100) | YES | NULL | - | Cost center for billing |
| location_at_allocation | UUID | YES | NULL | FK locations(id) ON DELETE SET NULL | Location when allocated |
| condition_at_allocation | asset_condition_enum | YES | NULL | - | Condition when allocated |
| notes | TEXT | YES | NULL | - | Allocation notes |
| metadata | JSONB | YES | '{}'::jsonb | - | Extensible data |
| approved_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Approval authority |
| approved_at | TIMESTAMPTZ | YES | NULL | - | Approval timestamp |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| created_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Audit trail |
| updated_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Audit trail |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definitions

```sql
CREATE TYPE allocation_type_enum AS ENUM (
  'permanent', 'temporary', 'project_based', 'hot_desk', 'pool'
);

CREATE TYPE allocation_status_enum AS ENUM (
  'pending', 'active', 'returned', 'overdue', 'transferred', 'cancelled'
);
```

### Indexes

```sql
CREATE INDEX idx_asset_allocations_asset ON asset_allocations(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_allocations_user ON asset_allocations(allocated_to_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_allocations_status ON asset_allocations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_allocations_active ON asset_allocations(asset_id) WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX idx_asset_allocations_expected_return ON asset_allocations(expected_return_date) WHERE deleted_at IS NULL AND status IN ('active', 'overdue');
CREATE INDEX idx_asset_allocations_org ON asset_allocations(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_allocations_dept ON asset_allocations(allocated_to_department_id) WHERE deleted_at IS NULL AND allocated_to_department_id IS NOT NULL;
```

### Example Record

```json
{
  "id": "alloc-uuid-001",
  "asset_id": "asset-uuid-001",
  "organization_id": "org-uuid-001",
  "allocated_to_user_id": "user-uuid-087",
  "allocated_to_department_id": "dept-uuid-003",
  "allocated_by": "user-uuid-admin",
  "custodian_id": "user-uuid-087",
  "allocation_type": "permanent",
  "status": "active",
  "allocation_date": "2026-01-20",
  "expected_return_date": null,
  "actual_return_date": null,
  "purpose": "Primary development workstation for senior ML engineer",
  "project_code": "PROJ-PHOENIX",
  "cost_center": "CC-ENG-001",
  "location_at_allocation": "loc-uuid-042",
  "condition_at_allocation": "excellent",
  "notes": "User acknowledged asset responsibility policy",
  "metadata": {"acknowledgment_signed": true, "policy_version": "2026.1"},
  "approved_by": "user-uuid-manager-001",
  "approved_at": "2026-01-19T16:30:00Z",
  "created_at": "2026-01-20T09:00:00Z",
  "updated_at": "2026-01-20T09:00:00Z",
  "created_by": "user-uuid-admin",
  "updated_by": "user-uuid-admin",
  "deleted_at": null
}
```

### Validation Rules
- expected_return_date must be > allocation_date when provided
- actual_return_date must be >= allocation_date
- allocated_to_user_id must be active and in the same organization
- Only one active allocation per asset at a time (partial unique index)

### Business Rules
1. Creating an allocation sets assets.is_assigned = true and updates assets.assigned_to_user_id
2. Completing a return sets assets.is_assigned = false
3. Overdue allocations (expected_return_date < TODAY() AND status = 'active') trigger notifications
4. Maximum active allocations per user configurable (default: 10)
5. Transfers create a return record + new allocation

### Relationships

| Type | Related Table | FK Column | Description |
|------|---------------|-----------|-------------|
| Many-to-One | assets | asset_id | Allocation for one asset |
| Many-to-One | users | allocated_to_user_id | Allocated to one user |
| One-to-Many | asset_returns | allocation_id | Return records |
| One-to-Many | allocation_history | allocation_id | History entries |

### Cascade Rules
- DELETE on asset: RESTRICT (must handle allocations first)
- DELETE on user: RESTRICT (must transfer allocations first)

### Performance Notes
- Active allocation lookup (asset_id + status = 'active') is the hottest query
- Overdue detection query runs as a scheduled job (daily)
- At 1M assets, expect ~5M allocation rows (historical); partition by year

### API Usage
```
POST   /api/v1/assets/:assetId/allocations
GET    /api/v1/assets/:assetId/allocations
GET    /api/v1/assets/:assetId/allocations/active
PATCH  /api/v1/assets/:assetId/allocations/:id
GET    /api/v1/users/:userId/allocations
GET    /api/v1/organizations/:orgId/allocations/overdue
```

---

## 23. allocation_history

### Purpose
Records changes to allocation records (reassignments, extensions, modifications) without losing historical data.

### Business Requirement
When an allocation is modified (extended, reassigned, purpose changed), the original data must be preserved for audit.

### Description
allocation_history captures modifications to asset_allocations records. Each entry is a snapshot of the changed fields before and after modification.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique history identifier |
| allocation_id | UUID | NO | - | NOT NULL, FK asset_allocations(id) ON DELETE RESTRICT | Parent allocation |
| asset_id | UUID | NO | - | NOT NULL, FK assets(id) ON DELETE RESTRICT | Associated asset |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE RESTRICT | Owning organization |
| change_type | VARCHAR(50) | NO | - | NOT NULL | Type of change (reassigned, extended, purpose_changed, etc.) |
| previous_values | JSONB | NO | - | NOT NULL | Snapshot of changed fields before modification |
| new_values | JSONB | NO | - | NOT NULL | Snapshot of changed fields after modification |
| reason | TEXT | YES | NULL | - | Reason for the change |
| changed_by | UUID | NO | - | NOT NULL, FK users(id) ON DELETE RESTRICT | User who made the change |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |

### Indexes

```sql
CREATE INDEX idx_allocation_history_allocation ON allocation_history(allocation_id, created_at DESC);
CREATE INDEX idx_allocation_history_asset ON allocation_history(asset_id, created_at DESC);
CREATE INDEX idx_allocation_history_org ON allocation_history(organization_id, created_at DESC);
CREATE INDEX idx_allocation_history_change_type ON allocation_history(change_type);
```

### Example Record

```json
{
  "id": "ah-uuid-001",
  "allocation_id": "alloc-uuid-001",
  "asset_id": "asset-uuid-001",
  "organization_id": "org-uuid-001",
  "change_type": "extended",
  "previous_values": {"expected_return_date": "2026-06-30", "purpose": "Development workstation for Q1-Q2"},
  "new_values": {"expected_return_date": "2026-12-31", "purpose": "Development workstation for Q1-Q4"},
  "reason": "Project Phoenix timeline extended through Q4 per PM approval",
  "changed_by": "user-uuid-admin",
  "created_at": "2026-06-15T11:00:00Z"
}
```

### Validation Rules
- Append-only: no UPDATE or DELETE operations allowed
- previous_values and new_values contain only the changed fields
- Created automatically via application trigger on asset_allocations UPDATE

### Business Rules
1. Created automatically whenever an allocation record is updated
2. change_type values: reassigned, extended, purpose_changed, cost_center_changed, custodian_changed, other

### Performance Notes
- Append-only; minimal maintenance

### API Usage
```
GET    /api/v1/allocations/:allocationId/history
```

---

## 24. asset_returns

### Purpose
Records the return of a previously allocated asset, capturing condition at return, return location, and return notes.

### Business Requirement
When assets are returned from allocation, the return must be formally recorded with condition assessment, location verification, and custodial transfer.

### Description
asset_returns captures the completion of an allocation lifecycle. It records the return condition, any damage, the return location, and triggers downstream workflows.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique return identifier |
| allocation_id | UUID | NO | - | NOT NULL, FK asset_allocations(id) ON DELETE RESTRICT | Associated allocation |
| asset_id | UUID | NO | - | NOT NULL, FK assets(id) ON DELETE RESTRICT | Returned asset |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| returned_by | UUID | NO | - | NOT NULL, FK users(id) ON DELETE RESTRICT | User returning the asset |
| received_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | User accepting the return |
| return_date | DATE | NO | CURRENT_DATE | NOT NULL | Date of return |
| condition_at_return | asset_condition_enum | NO | - | NOT NULL | Condition assessment at return |
| condition_notes | TEXT | YES | NULL | - | Notes on asset condition |
| damage_reported | BOOLEAN | NO | false | NOT NULL | Whether damage was noted |
| damage_description | TEXT | YES | NULL | - | Description of any damage |
| damage_photos | JSONB | YES | '[]'::jsonb | - | Array of damage photo URLs |
| return_location_id | UUID | YES | NULL | FK locations(id) ON DELETE SET NULL | Where asset was returned to |
| maintenance_required | BOOLEAN | NO | false | NOT NULL | Whether maintenance is needed post-return |
| return_type | return_type_enum | NO | 'voluntary' | NOT NULL | How return was initiated |
| late_return | BOOLEAN | NO | false | NOT NULL | Was return past expected date? |
| days_overdue | INTEGER | YES | NULL | CHECK (days_overdue >= 0) | Number of days late |
| notes | TEXT | YES | NULL | - | Return notes |
| metadata | JSONB | YES | '{}'::jsonb | - | Extensible return data |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| created_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Audit trail |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definition

```sql
CREATE TYPE return_type_enum AS ENUM (
  'voluntary', 'requested', 'overdue_forced', 'termination', 'transfer', 'other'
);
```

### Indexes

```sql
CREATE INDEX idx_asset_returns_allocation ON asset_returns(allocation_id);
CREATE INDEX idx_asset_returns_asset ON asset_returns(asset_id);
CREATE INDEX idx_asset_returns_org ON asset_returns(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_returns_date ON asset_returns(return_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_returns_damage ON asset_returns(damage_reported) WHERE deleted_at IS NULL AND damage_reported = true;
```

### Example Record

```json
{
  "id": "ret-uuid-001",
  "allocation_id": "alloc-uuid-001",
  "asset_id": "asset-uuid-001",
  "organization_id": "org-uuid-001",
  "returned_by": "user-uuid-087",
  "received_by": "user-uuid-it-ops",
  "return_date": "2026-07-10",
  "condition_at_return": "good",
  "condition_notes": "Minor cosmetic scratches on bottom case. Functionally perfect.",
  "damage_reported": true,
  "damage_description": "Two small scratches on aluminum bottom case (1cm each)",
  "damage_photos": ["https://cdn.assetflow.io/org-001/assets/asset-uuid-001/damage/ret-uuid-001_1.webp"],
  "return_location_id": "loc-uuid-010",
  "maintenance_required": false,
  "return_type": "requested",
  "late_return": false,
  "days_overdue": null,
  "notes": "User upgraded to new machine. All data wiped per security policy.",
  "metadata": {"data_wiped": true, "wipe_certificate": "wipe-cert-2026-0710"},
  "created_at": "2026-07-10T16:30:00Z",
  "updated_at": "2026-07-10T16:30:00Z",
  "created_by": "user-uuid-it-ops",
  "deleted_at": null
}
```

### Business Rules
1. Creating a return sets the associated allocation status to 'returned'
2. damage_reported = true triggers a maintenance request creation workflow
3. late_return = true is computed if return_date > allocation.expected_return_date
4. Returns can only be created for 'active' or 'overdue' allocations
5. maintenance_required = true automatically creates a maintenance request

### Performance Notes
- Small table relative to allocations; one return per allocation

### API Usage
```
POST   /api/v1/assets/:assetId/returns
GET    /api/v1/assets/:assetId/returns
GET    /api/v1/returns/:id
```

---

## 25. transfer_requests

### Purpose
Manages requests to move assets between locations, departments, or users. Tracks the approval workflow from request to completion.

### Business Requirement
Asset transfers require formal requests with approval workflows, especially for high-value or controlled assets.

### Description
transfer_requests captures the lifecycle of an asset transfer from request through approval, execution, and completion.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique request identifier |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| request_number | VARCHAR(50) | NO | - | NOT NULL, UNIQUE(organization_id, request_number) | Human-readable request ID |
| status | transfer_status_enum | NO | 'draft' | NOT NULL | Current request status |
| transfer_type | transfer_type_enum | NO | 'location' | NOT NULL | Type of transfer |
| from_location_id | UUID | YES | NULL | FK locations(id) ON DELETE SET NULL | Source location |
| to_location_id | UUID | YES | NULL | FK locations(id) ON DELETE SET NULL | Destination location |
| from_department_id | UUID | YES | NULL | FK departments(id) ON DELETE SET NULL | Source department |
| to_department_id | UUID | YES | NULL | FK departments(id) ON DELETE SET NULL | Destination department |
| from_user_id | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Source user |
| to_user_id | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Destination user |
| requested_by | UUID | NO | - | NOT NULL, FK users(id) ON DELETE RESTRICT | Request initiator |
| asset_count | INTEGER | NO | 0 | CHECK (asset_count >= 0) | Number of assets in transfer |
| reason | TEXT | YES | NULL | - | Transfer justification |
| priority | asset_priority_enum | NO | 'medium' | NOT NULL | Transfer priority |
| requested_date | DATE | NO | CURRENT_DATE | NOT NULL | Request date |
| approved_date | DATE | YES | NULL | - | Approval date |
| approved_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Approver |
| execution_date | DATE | YES | NULL | - | When transfer was executed |
| completed_date | DATE | YES | NULL | - | When transfer was confirmed complete |
| notes | TEXT | YES | NULL | - | Transfer notes |
| metadata | JSONB | YES | '{}'::jsonb | - | Extensible data |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| created_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Audit trail |
| updated_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Audit trail |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definitions

```sql
CREATE TYPE transfer_status_enum AS ENUM (
  'draft', 'pending_approval', 'approved', 'in_transit',
  'delivered', 'completed', 'rejected', 'cancelled'
);

CREATE TYPE transfer_type_enum AS ENUM (
  'location', 'department', 'user', 'inter_org', 'disposal', 'return_to_stock'
);
```

### Indexes

```sql
CREATE INDEX idx_transfer_requests_org ON transfer_requests(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfer_requests_status ON transfer_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfer_requests_type ON transfer_requests(transfer_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfer_requests_requested_by ON transfer_requests(requested_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfer_requests_pending ON transfer_requests(status) WHERE deleted_at IS NULL AND status IN ('pending_approval', 'approved');
CREATE INDEX idx_transfer_requests_number ON transfer_requests(organization_id, request_number) WHERE deleted_at IS NULL;
```

### Example Record

```json
{
  "id": "tr-uuid-001",
  "organization_id": "org-uuid-001",
  "request_number": "TR-2026-0078",
  "status": "approved",
  "transfer_type": "department",
  "from_location_id": "loc-uuid-042",
  "to_location_id": "loc-uuid-055",
  "from_department_id": "dept-uuid-003",
  "to_department_id": "dept-uuid-007",
  "from_user_id": "user-uuid-087",
  "to_user_id": null,
  "requested_by": "user-uuid-manager-001",
  "asset_count": 3,
  "reason": "Team reorganization",
  "priority": "medium",
  "requested_date": "2026-07-01",
  "approved_date": "2026-07-02",
  "approved_by": "user-uuid-director",
  "execution_date": null,
  "completed_date": null,
  "metadata": {"assets": ["asset-uuid-001", "asset-uuid-002", "asset-uuid-003"]},
  "created_at": "2026-07-01T10:00:00Z",
  "updated_at": "2026-07-02T14:00:00Z",
  "created_by": "user-uuid-manager-001",
  "updated_by": "user-uuid-director",
  "deleted_at": null
}
```

### Business Rules
1. Request number auto-generated as TR-YYYY-NNNNN
2. Approval required for transfers > $5,000 total value (configurable)
3. In-transit assets cannot be allocated or further transferred
4. Completing a transfer updates all associated assets.location_id
5. Each status change is logged in transfer_history

### Performance Notes
- Small table relative to assets; one row per transfer request

### API Usage
```
POST   /api/v1/transfers
GET    /api/v1/transfers
GET    /api/v1/transfers/:id
PATCH  /api/v1/transfers/:id
POST   /api/v1/transfers/:id/approve
POST   /api/v1/transfers/:id/reject
POST   /api/v1/transfers/:id/execute
POST   /api/v1/transfers/:id/complete
POST   /api/v1/transfers/:id/cancel
```

---

## 26. transfer_history

### Purpose
Immutable audit trail for all transfer request status changes and actions.

### Business Requirement
Every action on a transfer request (create, approve, reject, execute, complete, cancel) must be logged for compliance.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique history identifier |
| transfer_request_id | UUID | NO | - | NOT NULL, FK transfer_requests(id) ON DELETE RESTRICT | Associated transfer |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE RESTRICT | Owning organization |
| action | VARCHAR(50) | NO | - | NOT NULL | Action performed |
| previous_status | transfer_status_enum | YES | NULL | - | Status before action |
| new_status | transfer_status_enum | NO | - | NOT NULL | Status after action |
| reason | TEXT | YES | NULL | - | Reason for the action |
| metadata | JSONB | YES | '{}'::jsonb | - | Additional context |
| performed_by | UUID | NO | - | NOT NULL, FK users(id) ON DELETE RESTRICT | User who performed the action |
| ip_address | INET | YES | NULL | - | Client IP |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |

### Indexes

```sql
CREATE INDEX idx_transfer_history_request ON transfer_history(transfer_request_id, created_at DESC);
CREATE INDEX idx_transfer_history_org ON transfer_history(organization_id, created_at DESC);
CREATE INDEX idx_transfer_history_action ON transfer_history(action);
```

### Example Record

```json
{
  "id": "th-uuid-001",
  "transfer_request_id": "tr-uuid-001",
  "organization_id": "org-uuid-001",
  "action": "approved",
  "previous_status": "pending_approval",
  "new_status": "approved",
  "reason": "Approved per department head authorization",
  "metadata": {"total_asset_value": 10497.00},
  "performed_by": "user-uuid-director",
  "ip_address": "10.0.0.50",
  "created_at": "2026-07-02T14:00:00Z"
}
```

### Business Rules
1. Append-only: no UPDATE or DELETE operations allowed
2. Created automatically on every transfer_requests status change

### Performance Notes
- Append-only table, minimal maintenance

### API Usage
```
GET    /api/v1/transfers/:id/history
```

---

# Module 27-30: Resource & Booking

---

## 27. shared_resources

### Purpose
Manages bookable shared resources (meeting rooms, equipment, vehicles, shared workstations) with availability tracking.

### Business Requirement
Organizations need to share limited resources across departments with conflict detection, capacity management, and recurring booking support.

### Description
shared_resources defines each bookable resource with its capacity, location, amenities, booking rules, and availability configuration.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique resource identifier |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| name | VARCHAR(255) | NO | - | NOT NULL | Resource display name |
| slug | VARCHAR(255) | NO | - | NOT NULL, UNIQUE(organization_id, slug) | URL-friendly identifier |
| description | TEXT | YES | NULL | - | Resource description |
| resource_type | resource_type_enum | NO | - | NOT NULL | Type of resource |
| category | VARCHAR(100) | YES | NULL | - | Resource category for grouping |
| location_id | UUID | YES | NULL | FK locations(id) ON DELETE SET NULL | Physical location |
| floor | VARCHAR(50) | YES | NULL | - | Floor/building designation |
| room_number | VARCHAR(50) | YES | NULL | - | Room number |
| capacity | INTEGER | NO | 1 | CHECK (capacity > 0) | Maximum capacity |
| amenities | JSONB | YES | '[]'::jsonb | - | Available amenities |
| status | resource_status_enum | NO | 'available' | NOT NULL | Current availability status |
| is_bookable | BOOLEAN | NO | true | NOT NULL | Whether resource can be booked |
| requires_approval | BOOLEAN | NO | false | NOT NULL | Bookings need admin approval |
| max_booking_duration_hours | INTEGER | YES | NULL | CHECK (max_booking_duration_hours > 0) | Max single booking duration |
| min_booking_duration_hours | INTEGER | YES | NULL | CHECK (min_booking_duration_hours > 0) | Min single booking duration |
| advance_booking_days | INTEGER | NO | 90 | CHECK (advance_booking_days > 0) | How far ahead bookings can be made |
| cancellation_hours | INTEGER | NO | 24 | CHECK (cancellation_hours >= 0) | Min hours before for free cancellation |
| hourly_rate | DECIMAL(10,2) | YES | NULL | CHECK (hourly_rate >= 0) | Cost per hour |
| daily_rate | DECIMAL(10,2) | YES | NULL | CHECK (daily_rate >= 0) | Cost per day |
| currency_code | CHAR(3) | NO | 'USD' | NOT NULL | ISO 4217 currency |
| image_url | VARCHAR(1000) | YES | NULL | - | Resource image |
| available_hours | JSONB | YES | '{}'::jsonb | NOT NULL | Weekly availability schedule by day |
| blocked_dates | JSONB | YES | '[]'::jsonb | - | Date ranges when resource is unavailable |
| total_bookings | INTEGER | NO | 0 | CHECK (total_bookings >= 0) | Denormalized booking count |
| metadata | JSONB | YES | '{}'::jsonb | - | Extensible metadata |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| created_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Audit trail |
| updated_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Audit trail |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definitions

```sql
CREATE TYPE resource_type_enum AS ENUM (
  'meeting_room', 'conference_room', 'huddle_room', 'auditorium',
  'desk', 'hot_desk', 'workstation', 'equipment', 'vehicle',
  'parking_spot', 'lab', 'studio', 'other'
);

CREATE TYPE resource_status_enum AS ENUM (
  'available', 'booked', 'maintenance', 'out_of_service', 'reserved'
);
```

### Indexes

```sql
CREATE INDEX idx_shared_resources_org ON shared_resources(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_shared_resources_type ON shared_resources(resource_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_shared_resources_location ON shared_resources(location_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_shared_resources_bookable ON shared_resources(is_bookable) WHERE deleted_at IS NULL AND is_bookable = true;
CREATE INDEX idx_shared_resources_status ON shared_resources(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_shared_resources_slug ON shared_resources(organization_id, slug) WHERE deleted_at IS NULL;
```

### Example Record

```json
{
  "id": "res-uuid-001",
  "organization_id": "org-uuid-001",
  "name": "Executive Boardroom - Olympus",
  "slug": "executive-boardroom-olympus",
  "description": "Premium 20-seat boardroom with panoramic city views",
  "resource_type": "conference_room",
  "category": "premium",
  "location_id": "loc-uuid-001",
  "floor": "32nd Floor",
  "room_number": "BR-3201",
  "capacity": 20,
  "amenities": ["dual_85inch_displays", "video_conferencing", "whiteboard", "premium_audio"],
  "status": "available",
  "is_bookable": true,
  "requires_approval": true,
  "max_booking_duration_hours": 8,
  "min_booking_duration_hours": 1,
  "advance_booking_days": 60,
  "cancellation_hours": 48,
  "hourly_rate": 150.00,
  "daily_rate": 800.00,
  "currency_code": "USD",
  "image_url": "https://cdn.assetflow.io/resources/res-uuid-001/main.webp",
  "available_hours": {
    "mon": {"start": "07:00", "end": "20:00"},
    "tue": {"start": "07:00", "end": "20:00"},
    "wed": {"start": "07:00", "end": "20:00"},
    "thu": {"start": "07:00", "end": "20:00"},
    "fri": {"start": "07:00", "end": "18:00"},
    "sat": null,
    "sun": null
  },
  "blocked_dates": [{"from": "2026-12-24", "to": "2026-12-31", "reason": "Holiday closure"}],
  "total_bookings": 342,
  "metadata": {"av_support_contact": "av-support@company.com"},
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-07-10T12:00:00Z",
  "created_by": "user-uuid-admin",
  "updated_by": "user-uuid-admin",
  "deleted_at": null
}
```

### Business Rules
1. Booking availability checked against available_hours, blocked_dates, and existing bookings
2. requires_approval = true sends bookings through approval workflow
3. total_bookings updated via trigger on resource_bookings changes

### Performance Notes
- Small table; typically hundreds to low thousands of resources per org
- Consider caching availability in Redis for high-booking-volume resources

### API Usage
```
GET    /api/v1/resources
GET    /api/v1/resources/:id
POST   /api/v1/resources
PATCH  /api/v1/resources/:id
DELETE /api/v1/resources/:id
GET    /api/v1/resources/:id/availability
GET    /api/v1/resources/:id/calendar
```

---

## 28. resource_bookings

### Purpose
Tracks reservations of shared resources with time-based conflict detection and lifecycle management.

### Business Requirement
Users need to reserve shared resources for specific time periods with double-booking prevention, recurring support, and usage tracking.

### Description
resource_bookings stores each booking instance. Recurring bookings have a recurrence_id linking instances.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique booking identifier |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| resource_id | UUID | NO | - | NOT NULL, FK shared_resources(id) ON DELETE RESTRICT | Booked resource |
| booked_by | UUID | NO | - | NOT NULL, FK users(id) ON DELETE RESTRICT | User who made the booking |
| booking_number | VARCHAR(50) | NO | - | NOT NULL, UNIQUE(organization_id, booking_number) | Human-readable booking ID |
| title | VARCHAR(500) | NO | - | NOT NULL | Booking title |
| description | TEXT | YES | NULL | - | Booking description |
| status | booking_status_enum | NO | 'pending' | NOT NULL | Booking status |
| start_time | TIMESTAMPTZ | NO | - | NOT NULL | Booking start timestamp |
| end_time | TIMESTAMPTZ | NO | - | NOT NULL | Booking end timestamp |
| actual_start_time | TIMESTAMPTZ | YES | NULL | - | Actual check-in time |
| actual_end_time | TIMESTAMPTZ | YES | NULL | - | Actual check-out time |
| duration_minutes | INTEGER | NO | - | NOT NULL, CHECK (duration_minutes > 0) | Expected duration in minutes |
| attendee_count | INTEGER | NO | 1 | CHECK (attendee_count > 0) | Number of attendees |
| is_recurring | BOOLEAN | NO | false | NOT NULL | Part of a recurring series? |
| recurrence_id | UUID | YES | NULL | - | Links recurring booking instances |
| recurrence_rule | JSONB | YES | NULL | - | RRULE-like config |
| purpose | TEXT | YES | NULL | - | Purpose of the booking |
| department_id | UUID | YES | NULL | FK departments(id) ON DELETE SET NULL | Booking department |
| project_code | VARCHAR(100) | YES | NULL | - | Associated project code |
| total_cost | DECIMAL(10,2) | YES | NULL | CHECK (total_cost >= 0) | Total booking cost |
| currency_code | CHAR(3) | NO | 'USD' | NOT NULL | ISO 4217 currency |
| approved_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Approver |
| approved_at | TIMESTAMPTZ | YES | NULL | - | Approval timestamp |
| cancellation_reason | TEXT | YES | NULL | - | Cancellation reason |
| cancelled_at | TIMESTAMPTZ | YES | NULL | - | Cancellation timestamp |
| is_no_show | BOOLEAN | NO | false | NOT NULL | Did the booker not show up? |
| check_in_token | VARCHAR(255) | YES | NULL | - | QR code / token for check-in |
| metadata | JSONB | YES | '{}'::jsonb | - | Extensible booking data |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| created_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Audit trail |
| updated_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Audit trail |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definition

```sql
CREATE TYPE booking_status_enum AS ENUM (
  'pending', 'confirmed', 'active', 'completed', 'cancelled',
  'no_show', 'rejected', 'expired'
);
```

### Indexes

```sql
CREATE INDEX idx_resource_bookings_resource ON resource_bookings(resource_id, start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_resource_bookings_booked_by ON resource_bookings(booked_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_resource_bookings_status ON resource_bookings(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_resource_bookings_time_range ON resource_bookings(start_time, end_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_resource_bookings_active ON resource_bookings(resource_id, start_time, end_time) WHERE deleted_at IS NULL AND status IN ('confirmed', 'active');
CREATE INDEX idx_resource_bookings_org ON resource_bookings(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_resource_bookings_recurrence ON resource_bookings(recurrence_id) WHERE deleted_at IS NULL AND recurrence_id IS NOT NULL;
```

### Example Record

```json
{
  "id": "bk-uuid-001",
  "organization_id": "org-uuid-001",
  "resource_id": "res-uuid-001",
  "booked_by": "user-uuid-087",
  "booking_number": "BK-2026-12345",
  "title": "Sprint Planning - Phoenix Team",
  "status": "confirmed",
  "start_time": "2026-07-14T10:00:00Z",
  "end_time": "2026-07-14T12:00:00Z",
  "duration_minutes": 120,
  "attendee_count": 8,
  "is_recurring": true,
  "recurrence_id": "rec-uuid-001",
  "recurrence_rule": {"frequency": "biweekly", "interval": 2, "days": ["monday"], "until": "2026-12-31"},
  "department_id": "dept-uuid-003",
  "project_code": "PROJ-PHOENIX",
  "total_cost": 300.00,
  "currency_code": "USD",
  "approved_by": "user-uuid-admin",
  "approved_at": "2026-07-12T09:00:00Z",
  "check_in_token": "chk_bk-uuid-001_abc123",
  "metadata": {"catering_ordered": true, "av_setup_required": true},
  "created_at": "2026-07-10T14:00:00Z",
  "updated_at": "2026-07-12T09:00:00Z",
  "created_by": "user-uuid-087",
  "updated_by": "user-uuid-admin",
  "deleted_at": null
}
```

### Business Rules
1. **Conflict Detection**: Application must check for overlapping bookings before confirming
2. **Auto-expire**: Bookings with status pending expire after 24 hours without confirmation
3. **No-show Detection**: If actual_start_time is null 30 minutes after start_time, mark as no_show
4. **Recurring Bookings**: Each instance is a separate row linked by recurrence_id
5. **Cost Calculation**: total_cost = duration_hours * resource.hourly_rate
6. **Check-in Flow**: Scanning check_in_token sets actual_start_time and status = 'active'

### Performance Notes
- At 1M bookings, resource_id + start_time index is critical for conflict detection
- Consider partitioning by start_time (monthly) for large volumes
- Conflict detection query: WHERE resource_id = $1 AND status IN ('confirmed', 'active') AND start_time < $end AND end_time > $start

### API Usage
```
POST   /api/v1/bookings
GET    /api/v1/bookings
GET    /api/v1/bookings/:id
PATCH  /api/v1/bookings/:id
POST   /api/v1/bookings/:id/cancel
POST   /api/v1/bookings/:id/check-in
POST   /api/v1/bookings/:id/check-out
```

---

## 29. booking_participants

### Purpose
Tracks individual participants/attendees for resource bookings, enabling capacity management and attendance tracking.

### Description
booking_participants stores the many-to-many relationship between bookings and users.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique participant identifier |
| booking_id | UUID | NO | - | NOT NULL, FK resource_bookings(id) ON DELETE CASCADE | Associated booking |
| user_id | UUID | NO | - | NOT NULL, FK users(id) ON DELETE CASCADE | Participant user |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| role | VARCHAR(50) | NO | 'attendee' | NOT NULL | Participant role |
| rsvp_status | rsvp_status_enum | NO | 'pending' | NOT NULL | RSVP response |
| attended | BOOLEAN | NO | false | NOT NULL | Did participant attend? |
| check_in_time | TIMESTAMPTZ | YES | NULL | - | When participant checked in |
| check_out_time | TIMESTAMPTZ | YES | NULL | - | When participant checked out |
| notes | TEXT | YES | NULL | - | Participant notes |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definition

```sql
CREATE TYPE rsvp_status_enum AS ENUM (
  'pending', 'accepted', 'declined', 'tentative', 'waitlisted'
);
```

### Indexes

```sql
CREATE INDEX idx_booking_participants_booking ON booking_participants(booking_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_booking_participants_user ON booking_participants(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_booking_participants_org ON booking_participants(organization_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_booking_participants_unique ON booking_participants(booking_id, user_id) WHERE deleted_at IS NULL;
```

### Example Record

```json
{
  "id": "bp-uuid-001",
  "booking_id": "bk-uuid-001",
  "user_id": "user-uuid-087",
  "organization_id": "org-uuid-001",
  "role": "organizer",
  "rsvp_status": "accepted",
  "attended": false,
  "check_in_time": null,
  "check_out_time": null,
  "notes": "Bringing presentation slides",
  "created_at": "2026-07-10T14:05:00Z",
  "updated_at": "2026-07-10T14:05:00Z",
  "deleted_at": null
}
```

### Business Rules
1. One participant per user per booking (unique constraint)
2. role values: organizer, required, optional, speaker
3. attended is set to true when check_in_time is recorded
4. Notifications sent based on rsvp_status changes

### API Usage
```
GET    /api/v1/bookings/:bookingId/participants
POST   /api/v1/bookings/:bookingId/participants
PATCH  /api/v1/bookings/:bookingId/participants/:id
DELETE /api/v1/bookings/:bookingId/participants/:id
```

---

## 30. booking_history

### Purpose
Immutable audit trail for all booking status changes and actions.

### Description
booking_history logs every action performed on resource bookings.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique history identifier |
| booking_id | UUID | NO | - | NOT NULL, FK resource_bookings(id) ON DELETE RESTRICT | Associated booking |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE RESTRICT | Owning organization |
| action | VARCHAR(50) | NO | - | NOT NULL | Action performed |
| previous_status | booking_status_enum | YES | NULL | - | Status before action |
| new_status | booking_status_enum | NO | - | NOT NULL | Status after action |
| reason | TEXT | YES | NULL | - | Reason for the action |
| metadata | JSONB | YES | '{}'::jsonb | - | Additional context |
| performed_by | UUID | NO | - | NOT NULL, FK users(id) ON DELETE RESTRICT | User who performed the action |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |

### Indexes

```sql
CREATE INDEX idx_booking_history_booking ON booking_history(booking_id, created_at DESC);
CREATE INDEX idx_booking_history_org ON booking_history(organization_id, created_at DESC);
```

### Example Record

```json
{
  "id": "bh-uuid-001",
  "booking_id": "bk-uuid-001",
  "organization_id": "org-uuid-001",
  "action": "confirmed",
  "previous_status": "pending",
  "new_status": "confirmed",
  "reason": "Auto-confirmed: room availability verified",
  "performed_by": "user-uuid-admin",
  "created_at": "2026-07-12T09:01:00Z"
}
```

### Business Rules
1. Append-only: no UPDATE or DELETE operations allowed
2. Created automatically on every resource_bookings status change

---

# Module 31-34: Maintenance Workflow

---

## 31. maintenance_requests

### Purpose
Tracks maintenance and repair requests for assets, from submission through completion, including cost tracking and technician assignment.

### Business Requirement
Organizations need systematic maintenance request management to ensure asset reliability, track maintenance costs, schedule preventive maintenance, and maintain compliance with safety regulations.

### Description
maintenance_requests is the central table for the maintenance workflow. It tracks requests from initial submission through assignment, work execution, and completion. Supports both reactive and preventive maintenance.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique request identifier |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| asset_id | UUID | NO | - | NOT NULL, FK assets(id) ON DELETE RESTRICT | Asset requiring maintenance |
| request_number | VARCHAR(50) | NO | - | NOT NULL, UNIQUE(organization_id, request_number) | Human-readable request ID |
| title | VARCHAR(500) | NO | - | NOT NULL | Maintenance request title |
| description | TEXT | YES | NULL | - | Detailed description of the issue |
| request_type | maintenance_request_type_enum | NO | 'reactive' | NOT NULL | Type of maintenance |
| status | maintenance_status_enum | NO | 'submitted' | NOT NULL | Current status |
| priority | asset_priority_enum | NO | 'medium' | NOT NULL | Maintenance priority |
| severity | maintenance_severity_enum | NO | 'normal' | NOT NULL | Issue severity |
| reported_by | UUID | NO | - | NOT NULL, FK users(id) ON DELETE RESTRICT | Who reported the issue |
| assigned_to | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Assigned technician |
| maintenance_team_id | UUID | YES | NULL | FK maintenance_teams(id) ON DELETE SET NULL | Assigned team |
| scheduled_date | DATE | YES | NULL | - | Scheduled maintenance date |
| scheduled_start_time | TIMESTAMPTZ | YES | NULL | - | Scheduled start time |
| scheduled_end_time | TIMESTAMPTZ | YES | NULL | - | Scheduled end time |
| started_at | TIMESTAMPTZ | YES | NULL | - | Actual start time |
| completed_at | TIMESTAMPTZ | YES | NULL | - | Actual completion time |
| estimated_cost | DECIMAL(12,2) | YES | NULL | CHECK (estimated_cost >= 0) | Estimated maintenance cost |
| actual_cost | DECIMAL(12,2) | YES | NULL | CHECK (actual_cost >= 0) | Actual maintenance cost |
| currency_code | CHAR(3) | NO | 'USD' | NOT NULL | ISO 4217 currency |
| parts_cost | DECIMAL(12,2) | YES | NULL | CHECK (parts_cost >= 0) | Parts cost component |
| labor_cost | DECIMAL(12,2) | YES | NULL | CHECK (labor_cost >= 0) | Labor cost component |
| external_vendor | VARCHAR(255) | YES | NULL | - | External vendor name |
| vendor_reference | VARCHAR(100) | YES | NULL | - | Vendor reference/ticket number |
| is_under_warranty | BOOLEAN | NO | false | NOT NULL | Is maintenance covered by warranty? |
| warranty_claim_number | VARCHAR(100) | YES | NULL | - | Warranty claim reference |
| failure_code | VARCHAR(50) | YES | NULL | - | Standardized failure code |
| resolution_notes | TEXT | YES | NULL | - | How the issue was resolved |
| root_cause | TEXT | YES | NULL | - | Root cause analysis |
| condition_before | asset_condition_enum | YES | NULL | - | Asset condition before maintenance |
| condition_after | asset_condition_enum | YES | NULL | - | Asset condition after maintenance |
| downtime_hours | DECIMAL(8,2) | YES | NULL | CHECK (downtime_hours >= 0) | Asset downtime in hours |
| is_preventive | BOOLEAN | NO | false | NOT NULL | Is this preventive/scheduled maintenance? |
| preventive_schedule_id | UUID | YES | NULL | - | Link to preventive maintenance schedule |
| recurrence_rule | JSONB | YES | NULL | - | If recurring, the recurrence pattern |
| tags | JSONB | YES | '[]'::jsonb | - | Searchable tags |
| metadata | JSONB | YES | '{}'::jsonb | - | Extensible data |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| created_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Audit trail |
| updated_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Audit trail |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definitions

```sql
CREATE TYPE maintenance_request_type_enum AS ENUM (
  'reactive', 'preventive', 'predictive', 'inspection', 'emergency', 'upgrade', 'recall'
);

CREATE TYPE maintenance_status_enum AS ENUM (
  'submitted', 'acknowledged', 'assigned', 'in_progress', 'on_hold',
  'awaiting_parts', 'awaiting_approval', 'completed', 'verified',
  'closed', 'cancelled', 'reopened'
);

CREATE TYPE maintenance_severity_enum AS ENUM (
  'critical', 'high', 'normal', 'low', 'cosmetic'
);
```

### Indexes

```sql
CREATE INDEX idx_maintenance_requests_org ON maintenance_requests(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_requests_asset ON maintenance_requests(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_requests_priority ON maintenance_requests(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_requests_assigned ON maintenance_requests(assigned_to) WHERE deleted_at IS NULL AND assigned_to IS NOT NULL;
CREATE INDEX idx_maintenance_requests_scheduled ON maintenance_requests(scheduled_date) WHERE deleted_at IS NULL AND scheduled_date IS NOT NULL;
CREATE INDEX idx_maintenance_requests_open ON maintenance_requests(status) WHERE deleted_at IS NULL AND status NOT IN ('completed', 'closed', 'cancelled');
CREATE INDEX idx_maintenance_requests_number ON maintenance_requests(organization_id, request_number) WHERE deleted_at IS NULL;
```

### Example Record

```json
{
  "id": "maint-uuid-001",
  "organization_id": "org-uuid-001",
  "asset_id": "asset-uuid-001",
  "request_number": "MR-2026-00456",
  "title": "Screen flickering intermittently on MacBook Pro",
  "description": "Display flickers intermittently when lid is at certain angles. Started after recent OS update. Affects productivity during video calls.",
  "request_type": "reactive",
  "status": "in_progress",
  "priority": "high",
  "severity": "normal",
  "reported_by": "user-uuid-087",
  "assigned_to": "user-uuid-tech-001",
  "maintenance_team_id": "team-uuid-it-hw",
  "scheduled_date": "2026-07-14",
  "scheduled_start_time": "2026-07-14T09:00:00Z",
  "scheduled_end_time": "2026-07-14T12:00:00Z",
  "started_at": "2026-07-14T09:15:00Z",
  "completed_at": null,
  "estimated_cost": 0.00,
  "actual_cost": null,
  "currency_code": "USD",
  "parts_cost": null,
  "labor_cost": null,
  "external_vendor": null,
  "is_under_warranty": true,
  "warranty_claim_number": "AC-2026-78901",
  "failure_code": "HW-DISP-FLK",
  "resolution_notes": null,
  "root_cause": null,
  "condition_before": "good",
  "condition_after": null,
  "downtime_hours": null,
  "is_preventive": false,
  "tags": ["display", "warranty", "apple"],
  "metadata": {
    "troubleshooting_steps_completed": ["restart", "safe_mode", "external_display_test"],
    "apple_case_id": "CAS-2026-12345"
  },
  "created_at": "2026-07-12T14:00:00Z",
  "updated_at": "2026-07-14T09:15:00Z",
  "created_by": "user-uuid-087",
  "updated_by": "user-uuid-tech-001",
  "deleted_at": null
}
```

### Validation Rules
- request_number auto-generated as MR-YYYY-NNNNN
- scheduled_end_time must be > scheduled_start_time
- completed_at must be >= started_at when both provided
- actual_cost must be >= 0
- warranty_claim_number required when is_under_warranty = true

### Business Rules
1. Request number auto-generated as MR-YYYY-NNNNN
2. Completing maintenance updates assets.total_maintenance_cost, assets.last_maintenance_date
3. condition_after != condition_before triggers asset_status_history update
4. Emergency requests bypass normal assignment workflow
5. Overdue scheduled maintenance triggers escalation notifications
6. Preventive maintenance auto-generates requests based on schedules
7. Critical severity requests auto-escalate to management

### Relationships

| Type | Related Table | FK Column | Description |
|------|---------------|-----------|-------------|
| Many-to-One | organizations | organization_id | Request belongs to one org |
| Many-to-One | assets | asset_id | Request is for one asset |
| Many-to-One | users | reported_by | Reported by one user |
| Many-to-One | users | assigned_to | Assigned to one technician |
| One-to-Many | maintenance_attachments | maintenance_request_id | Request has many attachments |
| One-to-Many | maintenance_status_history | maintenance_request_id | Status change audit trail |
| One-to-Many | technician_assignments | maintenance_request_id | Technician assignments |

### Cascade Rules
- DELETE on organization: CASCADE
- DELETE on asset: RESTRICT (must close maintenance first)

### Performance Notes
- Open maintenance requests index is critical for dashboard queries
- At 1M+ requests, partition by created_at (quarterly)
- Scheduled maintenance queries support calendar views

### API Usage
```
POST   /api/v1/maintenance
GET    /api/v1/maintenance
GET    /api/v1/maintenance/:id
PATCH  /api/v1/maintenance/:id
POST   /api/v1/maintenance/:id/assign
POST   /api/v1/maintenance/:id/start
POST   /api/v1/maintenance/:id/complete
POST   /api/v1/maintenance/:id/close
POST   /api/v1/maintenance/:id/reopen
GET    /api/v1/assets/:assetId/maintenance
GET    /api/v1/organizations/:orgId/maintenance/dashboard
```

---

## 32. maintenance_attachments

### Purpose
Stores file attachments for maintenance requests (photos, videos, work orders, inspection reports).

### Description
maintenance_attachments manages file uploads related to maintenance requests. Files are stored in object storage.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique attachment identifier |
| maintenance_request_id | UUID | NO | - | NOT NULL, FK maintenance_requests(id) ON DELETE CASCADE | Associated maintenance request |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| attachment_type | maintenance_attachment_type_enum | NO | 'other' | NOT NULL | Type of attachment |
| file_name | VARCHAR(500) | NO | - | NOT NULL | Original file name |
| file_size_bytes | BIGINT | NO | - | NOT NULL, CHECK (file_size_bytes > 0) | File size |
| mime_type | VARCHAR(100) | NO | - | NOT NULL | MIME type |
| storage_bucket | VARCHAR(255) | NO | - | NOT NULL | S3 bucket |
| storage_key | VARCHAR(1000) | NO | - | NOT NULL, UNIQUE | Object key in storage |
| cdn_url | VARCHAR(1000) | NO | - | NOT NULL | Download URL |
| thumbnail_url | VARCHAR(1000) | YES | NULL | - | Thumbnail URL (for images) |
| description | TEXT | YES | NULL | - | Attachment description |
| uploaded_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Upload audit trail |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definition

```sql
CREATE TYPE maintenance_attachment_type_enum AS ENUM (
  'before_photo', 'after_photo', 'damage_photo', 'work_order',
  'invoice', 'inspection_report', 'safety_report', 'video',
  'document', 'other'
);
```

### Indexes

```sql
CREATE INDEX idx_maintenance_attachments_request ON maintenance_attachments(maintenance_request_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_attachments_org ON maintenance_attachments(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_attachments_type ON maintenance_attachments(attachment_type) WHERE deleted_at IS NULL;
```

### Example Record

```json
{
  "id": "ma-uuid-001",
  "maintenance_request_id": "maint-uuid-001",
  "organization_id": "org-uuid-001",
  "attachment_type": "before_photo",
  "file_name": "screen_flicker_photo.jpg",
  "file_size_bytes": 1843200,
  "mime_type": "image/jpeg",
  "storage_bucket": "assetflow-prod-maintenance",
  "storage_key": "org-001/maintenance/maint-uuid-001/ma-uuid-001.jpg",
  "cdn_url": "https://cdn.assetflow.io/org-001/maintenance/maint-uuid-001/ma-uuid-001.jpg",
  "thumbnail_url": "https://cdn.assetflow.io/org-001/maintenance/maint-uuid-001/ma-uuid-001_thumb.jpg",
  "description": "Photo showing screen flicker artifact at bottom of display",
  "uploaded_by": "user-uuid-087",
  "created_at": "2026-07-12T14:05:00Z",
  "updated_at": "2026-07-12T14:05:00Z",
  "deleted_at": null
}
```

### Business Rules
1. Max 20 attachments per maintenance request
2. Before/after photos required for warranty claims
3. Attachment types categorize files for workflow automation

### API Usage
```
GET    /api/v1/maintenance/:id/attachments
POST   /api/v1/maintenance/:id/attachments
DELETE /api/v1/maintenance/:id/attachments/:attachmentId
```

---

## 33. maintenance_status_history

### Purpose
Immutable audit trail for all maintenance request status changes.

### Description
maintenance_status_history logs every status transition for maintenance requests.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique history identifier |
| maintenance_request_id | UUID | NO | - | NOT NULL, FK maintenance_requests(id) ON DELETE RESTRICT | Associated request |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE RESTRICT | Owning organization |
| previous_status | maintenance_status_enum | YES | NULL | - | Status before transition |
| new_status | maintenance_status_enum | NO | - | NOT NULL | Status after transition |
| transition_type | VARCHAR(50) | NO | - | NOT NULL | Type of transition |
| reason | TEXT | YES | NULL | - | Reason for transition |
| metadata | JSONB | YES | '{}'::jsonb | - | Additional context |
| changed_by | UUID | NO | - | NOT NULL, FK users(id) ON DELETE RESTRICT | User who initiated the change |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |

### Indexes

```sql
CREATE INDEX idx_maintenance_status_history_request ON maintenance_status_history(maintenance_request_id, created_at DESC);
CREATE INDEX idx_maintenance_status_history_org ON maintenance_status_history(organization_id, created_at DESC);
```

### Example Record

```json
{
  "id": "msh-uuid-001",
  "maintenance_request_id": "maint-uuid-001",
  "organization_id": "org-uuid-001",
  "previous_status": "assigned",
  "new_status": "in_progress",
  "transition_type": "manual",
  "reason": "Technician started diagnostic work",
  "metadata": {"estimated_completion": "2026-07-14T12:00:00Z"},
  "changed_by": "user-uuid-tech-001",
  "created_at": "2026-07-14T09:15:00Z"
}
```

### Business Rules
1. Append-only: no UPDATE or DELETE operations allowed
2. Created automatically on every maintenance_requests status change
3. Critical severity escalations logged with management notification

---

## 34. technician_assignments

### Purpose
Tracks technician assignments to maintenance requests, including time tracking and task decomposition.

### Business Requirement
Complex maintenance tasks may require multiple technicians or multiple sessions. Time tracking enables cost allocation and productivity analysis.

### Description
technician_assignments records each assignment of a technician to a maintenance request, supporting time tracking and task assignment.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique assignment identifier |
| maintenance_request_id | UUID | NO | - | NOT NULL, FK maintenance_requests(id) ON DELETE CASCADE | Associated maintenance request |
| technician_id | UUID | NO | - | NOT NULL, FK users(id) ON DELETE RESTRICT | Assigned technician |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| assignment_type | VARCHAR(50) | NO | 'primary' | NOT NULL | Type (primary, secondary, reviewer, supervisor) |
| status | VARCHAR(50) | NO | 'assigned' | NOT NULL | Assignment status |
| task_description | TEXT | YES | NULL | - | Specific task assigned |
| estimated_hours | DECIMAL(8,2) | YES | NULL | CHECK (estimated_hours >= 0) | Estimated time |
| actual_hours | DECIMAL(8,2) | YES | NULL | CHECK (actual_hours >= 0) | Actual time spent |
| started_at | TIMESTAMPTZ | YES | NULL | - | When technician started work |
| completed_at | TIMESTAMPTZ | YES | NULL | - | When work was completed |
| notes | TEXT | YES | NULL | - | Technician notes |
| parts_used | JSONB | YES | '[]'::jsonb | - | Parts/materials consumed |
| metadata | JSONB | YES | '{}'::jsonb | - | Extensible data |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Indexes

```sql
CREATE INDEX idx_technician_assignments_request ON technician_assignments(maintenance_request_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_technician_assignments_technician ON technician_assignments(technician_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_technician_assignments_org ON technician_assignments(organization_id) WHERE deleted_at IS NULL;
```

### Example Record

```json
{
  "id": "ta-uuid-001",
  "maintenance_request_id": "maint-uuid-001",
  "technician_id": "user-uuid-tech-001",
  "organization_id": "org-uuid-001",
  "assignment_type": "primary",
  "status": "in_progress",
  "task_description": "Diagnose and repair screen flickering issue on MacBook Pro 16-inch",
  "estimated_hours": 3.00,
  "actual_hours": null,
  "started_at": "2026-07-14T09:15:00Z",
  "completed_at": null,
  "notes": "Running display diagnostics. May need Apple diagnostic tool.",
  "parts_used": [],
  "metadata": {"diagnostic_tool": "Apple Service Toolkit 3"},
  "created_at": "2026-07-13T10:00:00Z",
  "updated_at": "2026-07-14T09:15:00Z",
  "deleted_at": null
}
```

### Business Rules
1. actual_hours is used for labor cost calculation
2. Parts used are tracked for inventory management
3. Multiple technicians can be assigned to complex tasks
4. Assignment completion updates parent request status if all assignments complete

### API Usage
```
GET    /api/v1/maintenance/:id/technicians
POST   /api/v1/maintenance/:id/technicians
PATCH  /api/v1/maintenance/:id/technicians/:assignmentId
GET    /api/v1/technicians/:userId/assignments
```

---

# Module 35-38: Audit Workflow

---

## 35. audit_cycles

### Purpose
Defines periodic audit cycles for asset verification, compliance checks, and inventory reconciliation.

### Business Requirement
Organizations must periodically verify that physical assets match records, check condition assessments, verify allocations, and ensure regulatory compliance. Audit cycles define the schedule and scope.

### Description
audit_cycles defines recurring or one-time audit periods. Each cycle has a scope (which assets/locations/categories to audit), schedule, assigned auditors, and completion criteria.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique cycle identifier |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| name | VARCHAR(255) | NO | - | NOT NULL | Audit cycle name |
| description | TEXT | YES | NULL | - | Audit cycle description |
| cycle_type | audit_cycle_type_enum | NO | 'scheduled' | NOT NULL | Type of audit cycle |
| status | audit_cycle_status_enum | NO | 'draft' | NOT NULL | Current cycle status |
| start_date | DATE | NO | - | NOT NULL | Audit period start |
| end_date | DATE | NO | - | NOT NULL | Audit period end |
| due_date | DATE | NO | - | NOT NULL | All audits must be completed by |
| scope | JSONB | NO | '{}'::jsonb | NOT NULL | Audit scope: {location_ids[], category_ids[], asset_filter, tags[]} |
| audit_criteria | JSONB | NO | '[]'::jsonb | NOT NULL | Checklist items to verify per asset |
| total_assets_to_audit | INTEGER | NO | 0 | CHECK (total_assets_to_audit >= 0) | Total assets in scope |
| total_audits_completed | INTEGER | NO | 0 | CHECK (total_audits_completed >= 0) | Completed audits count |
| total_discrepancies | INTEGER | NO | 0 | CHECK (total_discrepancies >= 0) | Discrepancies found count |
| completion_percentage | DECIMAL(5,2) | NO | 0.00 | CHECK (completion_percentage >= 0 AND completion_percentage <= 100) | Progress percentage |
| lead_auditor_id | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Lead auditor |
| auto_assign | BOOLEAN | NO | false | NOT NULL | Auto-assign assets to auditors? |
| require_photos | BOOLEAN | NO | true | NOT NULL | Require photo evidence? |
| require_condition_assessment | BOOLEAN | NO | true | NOT NULL | Require condition rating? |
| escalation_rules | JSONB | YES | '{}'::jsonb | - | Escalation rules for overdue audits |
| metadata | JSONB | YES | '{}'::jsonb | - | Extensible data |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| created_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Audit trail |
| updated_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Audit trail |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definitions

```sql
CREATE TYPE audit_cycle_type_enum AS ENUM (
  'scheduled', 'annual', 'quarterly', 'monthly', 'ad_hoc', 'triggered'
);

CREATE TYPE audit_cycle_status_enum AS ENUM (
  'draft', 'active', 'in_progress', 'completed', 'overdue', 'cancelled'
);
```

### Indexes

```sql
CREATE INDEX idx_audit_cycles_org ON audit_cycles(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_cycles_status ON audit_cycles(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_cycles_dates ON audit_cycles(start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_cycles_active ON audit_cycles(status) WHERE deleted_at IS NULL AND status IN ('active', 'in_progress');
```

### Example Record

```json
{
  "id": "acycle-uuid-001",
  "organization_id": "org-uuid-001",
  "name": "Q3 2026 IT Equipment Audit",
  "description": "Quarterly audit of all IT equipment across headquarters and branch offices",
  "cycle_type": "quarterly",
  "status": "in_progress",
  "start_date": "2026-07-01",
  "end_date": "2026-09-30",
  "due_date": "2026-09-30",
  "scope": {
    "location_ids": ["loc-uuid-001", "loc-uuid-002", "loc-uuid-003"],
    "category_ids": ["cat-uuid-it"],
    "tags": ["IT", "equipment"],
    "exclude_tags": ["disposed"]
  },
  "audit_criteria": [
    {"id": "physically_present", "label": "Asset physically present at location", "required": true},
    {"id": "condition_matches", "label": "Condition matches record", "required": true},
    {"id": "assigned_correctly", "label": "Assigned to correct user", "required": true},
    {"id": "label_intact", "label": "Asset tag/label intact and readable", "required": false},
    {"id": "security_compliant", "label": "Security measures in place", "required": false}
  ],
  "total_assets_to_audit": 2450,
  "total_audits_completed": 1230,
  "total_discrepancies": 47,
  "completion_percentage": 50.20,
  "lead_auditor_id": "user-uuid-auditor-lead",
  "auto_assign": true,
  "require_photos": true,
  "require_condition_assessment": true,
  "escalation_rules": {
    "overdue_days_threshold": 14,
    "escalate_to": "user-uuid-facilities-dir",
    "auto_remind_days": [7, 3, 1]
  },
  "metadata": {"audit_type": "physical_inventory", "regulatory": false},
  "created_at": "2026-06-15T10:00:00Z",
  "updated_at": "2026-07-12T16:00:00Z",
  "created_by": "user-uuid-admin",
  "updated_by": "user-uuid-auditor-lead",
  "deleted_at": null
}
```

### Validation Rules
- end_date must be >= start_date
- due_date must be >= start_date
- completion_percentage auto-computed from total_audits_completed / total_assets_to_audit
- scope must contain at least one filter criteria

### Business Rules
1. Activating a cycle auto-generates audit_assignments based on scope
2. Completion_percentage updates when audit_results are submitted
3. Overdue cycles trigger escalation notifications per escalation_rules
4. Cycles with status = 'completed' are immutable

### Performance Notes
- Small table (typically dozens of cycles per org)
- Active cycles index supports dashboard queries

### API Usage
```
POST   /api/v1/audit-cycles
GET    /api/v1/audit-cycles
GET    /api/v1/audit-cycles/:id
PATCH  /api/v1/audit-cycles/:id
POST   /api/v1/audit-cycles/:id/activate
POST   /api/v1/audit-cycles/:id/complete
GET    /api/v1/audit-cycles/:id/progress
```

---

## 36. audit_assignments

### Purpose
Assigns specific assets to auditors within an audit cycle, tracking individual audit progress.

### Business Requirement
Each audit cycle distributes assets among available auditors. Assignments track who audits what, their progress, and any issues found.

### Description
audit_assignments links auditors to specific assets within an audit cycle. Each assignment represents one asset to be audited by one auditor.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique assignment identifier |
| audit_cycle_id | UUID | NO | - | NOT NULL, FK audit_cycles(id) ON DELETE CASCADE | Parent audit cycle |
| asset_id | UUID | NO | - | NOT NULL, FK assets(id) ON DELETE RESTRICT | Asset to be audited |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| auditor_id | UUID | NO | - | NOT NULL, FK users(id) ON DELETE RESTRICT | Assigned auditor |
| status | audit_assignment_status_enum | NO | 'pending' | NOT NULL | Assignment status |
| assigned_date | DATE | NO | CURRENT_DATE | NOT NULL | When assigned |
| due_date | DATE | NO | - | NOT NULL | When audit is due |
| started_at | TIMESTAMPTZ | YES | NULL | - | When auditor started |
| completed_at | TIMESTAMPTZ | YES | NULL | - | When audit was completed |
| location_verified | BOOLEAN | YES | NULL | - | Was location verified? |
| condition_verified | BOOLEAN | YES | NULL | - | Was condition verified? |
| assignment_notes | TEXT | YES | NULL | - | Notes from assignment |
| discrepancy_found | BOOLEAN | NO | false | NOT NULL | Was a discrepancy found? |
| metadata | JSONB | YES | '{}'::jsonb | - | Extensible data |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definition

```sql
CREATE TYPE audit_assignment_status_enum AS ENUM (
  'pending', 'in_progress', 'completed', 'overdue', 'skipped', 'reassigned'
);
```

### Indexes

```sql
CREATE INDEX idx_audit_assignments_cycle ON audit_assignments(audit_cycle_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_assignments_asset ON audit_assignments(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_assignments_auditor ON audit_assignments(auditor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_assignments_status ON audit_assignments(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_assignments_due ON audit_assignments(due_date) WHERE deleted_at IS NULL AND status IN ('pending', 'in_progress');
CREATE INDEX idx_audit_assignments_org ON audit_assignments(organization_id) WHERE deleted_at IS NULL;
```

### Example Record

```json
{
  "id": "aa-uuid-001",
  "audit_cycle_id": "acycle-uuid-001",
  "asset_id": "asset-uuid-001",
  "organization_id": "org-uuid-001",
  "auditor_id": "user-uuid-auditor-001",
  "status": "completed",
  "assigned_date": "2026-07-01",
  "due_date": "2026-07-31",
  "started_at": "2026-07-15T09:00:00Z",
  "completed_at": "2026-07-15T09:25:00Z",
  "location_verified": true,
  "condition_verified": true,
  "assignment_notes": "Asset found at reported location. Condition matches record.",
  "discrepancy_found": false,
  "metadata": {"scan_method": "qr_code", "time_spent_minutes": 25},
  "created_at": "2026-07-01T08:00:00Z",
  "updated_at": "2026-07-15T09:25:00Z",
  "deleted_at": null
}
```

### Business Rules
1. status = 'overdue' is set by scheduled job when due_date < TODAY() AND status = 'pending'
2. Completing an assignment updates audit_cycles.total_audits_completed
3. discrepancy_found = true requires an audit_discrepancies record
4. Overdue assignments trigger escalation per cycle escalation_rules

### Performance Notes
- At 1M assets with quarterly audits = 1M rows per cycle per quarter
- Consider partitioning by audit_cycle_id or created_at
- Auditor assignment index supports workload distribution queries

### API Usage
```
GET    /api/v1/audit-cycles/:cycleId/assignments
POST   /api/v1/audit-cycles/:cycleId/assignments
PATCH  /api/v1/audit-cycles/:cycleId/assignments/:id
GET    /api/v1/auditors/:userId/assignments
POST   /api/v1/audit-assignments/:id/complete
```

---

## 37. audit_results

### Purpose
Stores the detailed results of each asset audit, including condition assessments, photo evidence, and compliance checks.

### Business Requirement
Audit results provide the definitive record of each asset's status at audit time, including photographic evidence and structured check responses.

### Description
audit_results stores the detailed findings for each audited asset. Each result links to an audit_assignment and contains structured data matching the cycle's audit_criteria.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique result identifier |
| audit_assignment_id | UUID | NO | - | NOT NULL, FK audit_assignments(id) ON DELETE CASCADE | Associated assignment |
| audit_cycle_id | UUID | NO | - | NOT NULL, FK audit_cycles(id) ON DELETE RESTRICT | Parent audit cycle |
| asset_id | UUID | NO | - | NOT NULL, FK assets(id) ON DELETE RESTRICT | Audited asset |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| auditor_id | UUID | NO | - | NOT NULL, FK users(id) ON DELETE RESTRICT | Who performed the audit |
| audit_date | DATE | NO | CURRENT_DATE | NOT NULL | Date of audit |
| condition_assessed | asset_condition_enum | NO | - | NOT NULL | Assessed condition |
| location_match | BOOLEAN | NO | true | NOT NULL | Does physical location match record? |
| recorded_location_id | UUID | YES | NULL | - | Location recorded in system |
| actual_location_id | UUID | YES | NULL | FK locations(id) ON DELETE SET NULL | Actual location found |
| allocation_match | BOOLEAN | YES | NULL | - | Does assignment match record? |
| recorded_assigned_to | UUID | YES | NULL | - | User recorded in system |
| actual_assigned_to | UUID | YES | NULL | - | User actually found with asset |
| physical_tag_present | BOOLEAN | NO | true | NOT NULL | Is asset tag physically present? |
| tag_condition | VARCHAR(50) | YES | NULL | - | Condition of physical tag |
| criteria_responses | JSONB | NO | '[]'::jsonb | NOT NULL | Responses to each audit criteria item |
| photos | JSONB | YES | '[]'::jsonb | - | Array of audit photo URLs |
| overall_status | audit_result_status_enum | NO | 'passed' | NOT NULL | Overall audit result |
| notes | TEXT | YES | NULL | - | Auditor notes |
| recommended_actions | JSONB | YES | '[]'::jsonb | - | Recommended follow-up actions |
| verified_by | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | QA reviewer |
| verified_at | TIMESTAMPTZ | YES | NULL | - | Verification timestamp |
| metadata | JSONB | YES | '{}'::jsonb | - | Extensible data |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definition

```sql
CREATE TYPE audit_result_status_enum AS ENUM (
  'passed', 'failed', 'partial', 'conditional', 'not_found', 'requires_investigation'
);
```

### Indexes

```sql
CREATE INDEX idx_audit_results_assignment ON audit_results(audit_assignment_id);
CREATE INDEX idx_audit_results_cycle ON audit_results(audit_cycle_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_results_asset ON audit_results(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_results_status ON audit_results(overall_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_results_org ON audit_results(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_results_date ON audit_results(audit_date DESC) WHERE deleted_at IS NULL;
```

### Example Record

```json
{
  "id": "ar-uuid-001",
  "audit_assignment_id": "aa-uuid-001",
  "audit_cycle_id": "acycle-uuid-001",
  "asset_id": "asset-uuid-001",
  "organization_id": "org-uuid-001",
  "auditor_id": "user-uuid-auditor-001",
  "audit_date": "2026-07-15",
  "condition_assessed": "good",
  "location_match": true,
  "recorded_location_id": "loc-uuid-042",
  "actual_location_id": "loc-uuid-042",
  "allocation_match": true,
  "recorded_assigned_to": "user-uuid-087",
  "actual_assigned_to": "user-uuid-087",
  "physical_tag_present": true,
  "tag_condition": "good",
  "criteria_responses": [
    {"criteria_id": "physically_present", "passed": true, "notes": "Found at desk 42B"},
    {"criteria_id": "condition_matches", "passed": true, "notes": "Cosmetic wear consistent with age"},
    {"criteria_id": "assigned_correctly", "passed": true, "notes": "Confirmed with assignee"},
    {"criteria_id": "label_intact", "passed": true, "notes": "QR label clean and scannable"},
    {"criteria_id": "security_compliant", "passed": true, "notes": "Screen lock active, encrypted"}
  ],
  "photos": [
    "https://cdn.assetflow.io/org-001/audits/acycle-uuid-001/asset-uuid-001/front.jpg",
    "https://cdn.assetflow.io/org-001/audits/acycle-uuid-001/asset-uuid-001/tag.jpg"
  ],
  "overall_status": "passed",
  "notes": "Asset in good condition. Minor cosmetic wear on bottom case consistent with records.",
  "recommended_actions": [],
  "verified_by": "user-uuid-auditor-lead",
  "verified_at": "2026-07-16T10:00:00Z",
  "metadata": {"gps_coordinates": {"lat": 37.7749, "lng": -122.4194}, "wifi_network": "corp-secure"},
  "created_at": "2026-07-15T09:25:00Z",
  "updated_at": "2026-07-16T10:00:00Z",
  "deleted_at": null
}
```

### Validation Rules
- criteria_responses must match the audit_criteria defined in the parent audit_cycle
- photos required when audit_cycle.require_photos = true
- condition_assessed required when audit_cycle.require_condition_assessment = true
- overall_status = 'failed' or 'not_found' requires recommended_actions

### Business Rules
1. Submitting a result with overall_status != 'passed' creates an audit_discrepancies record
2. Photos are uploaded to object storage and referenced via CDN URLs
3. QA verification (verified_by) is required before results are final
4. Results update audit_cycles.total_audits_completed and completion_percentage
5. Condition changes (assessed != asset.condition_status) trigger asset condition update workflow

### Performance Notes
- At 1M assets per audit cycle = 1M result rows
- Partition by audit_cycle_id for query performance
- JSONB criteria_responses supports flexible audit checklists

### API Usage
```
POST   /api/v1/audit-assignments/:assignmentId/results
GET    /api/v1/audit-cycles/:cycleId/results
GET    /api/v1/assets/:assetId/audit-results
GET    /api/v1/audit-results/:id
PATCH  /api/v1/audit-results/:id/verify
```

---

## 38. audit_discrepancies

### Purpose
Tracks discrepancies found during audits, linking to resolution workflows and maintenance requests.

### Business Requirement
When audits reveal discrepancies (missing assets, wrong location, wrong condition, unauthorized modifications), they must be tracked through resolution with root cause analysis and corrective actions.

### Description
audit_discrepancies captures every deviation found during audits. Each discrepancy has a severity, type, and resolution workflow that may create maintenance requests or transfer requests.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique discrepancy identifier |
| audit_result_id | UUID | NO | - | NOT NULL, FK audit_results(id) ON DELETE RESTRICT | Source audit result |
| audit_cycle_id | UUID | NO | - | NOT NULL, FK audit_cycles(id) ON DELETE RESTRICT | Parent audit cycle |
| asset_id | UUID | NO | - | NOT NULL, FK assets(id) ON DELETE RESTRICT | Affected asset |
| organization_id | UUID | NO | - | NOT NULL, FK organizations(id) ON DELETE CASCADE | Owning organization |
| discrepancy_type | discrepancy_type_enum | NO | - | NOT NULL | Type of discrepancy |
| severity | asset_priority_enum | NO | 'medium' | NOT NULL | Discrepancy severity |
| status | discrepancy_status_enum | NO | 'open' | NOT NULL | Resolution status |
| title | VARCHAR(500) | NO | - | NOT NULL | Brief discrepancy title |
| description | TEXT | NO | - | NOT NULL | Detailed description |
| expected_value | JSONB | YES | NULL | - | What the system expected |
| actual_value | JSONB | YES | NULL | - | What was actually found |
| evidence_photos | JSONB | YES | '[]'::jsonb | - | Photo evidence URLs |
| reported_by | UUID | NO | - | NOT NULL, FK users(id) ON DELETE RESTRICT | Auditor who found it |
| assigned_to | UUID | YES | NULL | FK users(id) ON DELETE SET NULL | Assigned resolver |
| resolution_type | VARCHAR(50) | YES | NULL | - | How it was resolved |
| resolution_description | TEXT | YES | NULL | - | Resolution details |
| resolved_at | TIMESTAMPTZ | YES | NULL | - | Resolution timestamp |
| related_maintenance_id | UUID | YES | NULL | FK maintenance_requests(id) ON DELETE SET NULL | Related maintenance request |
| related_transfer_id | UUID | YES | NULL | FK transfer_requests(id) ON DELETE SET NULL | Related transfer request |
| root_cause | TEXT | YES | NULL | - | Root cause analysis |
| corrective_action | TEXT | YES | NULL | - | Preventive corrective action |
| estimated_financial_impact | DECIMAL(15,2) | YES | NULL | - | Financial impact |
| actual_financial_impact | DECIMAL(15,2) | YES | NULL | - | Actual financial loss |
| currency_code | CHAR(3) | NO | 'USD' | NOT NULL | ISO 4217 currency |
| metadata | JSONB | YES | '{}'::jsonb | - | Extensible data |
| created_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | NOT NULL | Last modification timestamp |
| deleted_at | TIMESTAMPTZ | YES | NULL | - | Soft delete timestamp |

### Enum Type Definitions

```sql
CREATE TYPE discrepancy_type_enum AS ENUM (
  'missing', 'wrong_location', 'wrong_condition', 'unauthorized_modification',
  'wrong_allocation', 'tag_missing', 'tag_illegible', 'duplicate_record',
  'unrecorded_asset', 'data_mismatch', 'security_violation', 'other'
);

CREATE TYPE discrepancy_status_enum AS ENUM (
  'open', 'investigating', 'in_progress', 'resolved', 'accepted_risk',
  'escalated', 'closed', 'invalid'
);
```

### Indexes

```sql
CREATE INDEX idx_audit_discrepancies_result ON audit_discrepancies(audit_result_id);
CREATE INDEX idx_audit_discrepancies_cycle ON audit_discrepancies(audit_cycle_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_discrepancies_asset ON audit_discrepancies(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_discrepancies_status ON audit_discrepancies(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_discrepancies_type ON audit_discrepancies(discrepancy_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_discrepancies_severity ON audit_discrepancies(severity) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_discrepancies_open ON audit_discrepancies(status) WHERE deleted_at IS NULL AND status NOT IN ('resolved', 'closed', 'invalid');
CREATE INDEX idx_audit_discrepancies_org ON audit_discrepancies(organization_id) WHERE deleted_at IS NULL;
```

### Example Record

```json
{
  "id": "disc-uuid-001",
  "audit_result_id": "ar-uuid-fail-001",
  "audit_cycle_id": "acycle-uuid-001",
  "asset_id": "asset-uuid-042",
  "organization_id": "org-uuid-001",
  "discrepancy_type": "wrong_location",
  "severity": "medium",
  "status": "investigating",
  "title": "Asset found in wrong location",
  "description": "Dell Monitor U2723QE found in Building B, Room 301 but system shows Building A, Room 105. Asset was physically moved without transfer request.",
  "expected_value": {"location_id": "loc-uuid-105", "location_name": "Building A, Room 105"},
  "actual_value": {"location_id": "loc-uuid-301", "location_name": "Building B, Room 301"},
  "evidence_photos": [
    "https://cdn.assetflow.io/org-001/audits/disc-uuid-001/photo1.jpg"
  ],
  "reported_by": "user-uuid-auditor-001",
  "assigned_to": "user-uuid-facilities-mgr",
  "resolution_type": null,
  "resolution_description": null,
  "resolved_at": null,
  "related_maintenance_id": null,
  "related_transfer_id": null,
  "root_cause": null,
  "corrective_action": null,
  "estimated_financial_impact": null,
  "metadata": {
    "suspected_reason": "Temporary workspace setup during office renovation",
    "requires_transfer_request": true
  },
  "created_at": "2026-07-15T09:30:00Z",
  "updated_at": "2026-07-15T14:00:00Z",
  "deleted_at": null
}
```

### Validation Rules
- discrepancy_type must be from the enum
- severity must be from asset_priority_enum
- Resolution fields (resolution_type, resolution_description, resolved_at) must all be present or all NULL
- expected_value and actual_value should be JSONB objects with relevant fields

### Business Rules
1. Creating a discrepancy with severity = 'critical' triggers immediate escalation notification
2. Resolution may auto-generate transfer_requests or maintenance_requests
3. Discrepancies update audit_cycles.total_discrepancies counter
4. accepted_risk status requires documented justification
5. All discrepancies must be resolved before an audit cycle can be marked completed
6. Root cause analysis required for severity = 'critical' or 'high'

### Performance Notes
- Open discrepancies index supports dashboard alerts
- At 1M audited assets with 2% discrepancy rate = 20K rows per cycle
- Consider partitioning by audit_cycle_id

### API Usage
```
GET    /api/v1/audit-cycles/:cycleId/discrepancies
GET    /api/v1/audit-results/:resultId/discrepancies
POST   /api/v1/audit-results/:resultId/discrepancies
GET    /api/v1/discrepancies/:id
PATCH  /api/v1/discrepancies/:id
POST   /api/v1/discrepancies/:id/resolve
POST   /api/v1/discrepancies/:id/escalate
GET    /api/v1/organizations/:orgId/discrepancies/open
```

---

# Cross-Table Relationship Diagram

```
organizations
  |
  +-- asset_categories (LTREE hierarchy)
  |     +-- category_custom_fields
  |     +-- assets (THE core table)
  |           +-- asset_images
  |           +-- asset_documents
  |           +-- asset_qr_codes
  |           +-- asset_status_history (append-only)
  |           +-- asset_allocations
  |           |     +-- allocation_history (append-only)
  |           |     +-- asset_returns
  |           +-- transfer_requests
  |           |     +-- transfer_history (append-only)
  |           +-- maintenance_requests
  |           |     +-- maintenance_attachments
  |           |     +-- maintenance_status_history (append-only)
  |           |     +-- technician_assignments
  |           +-- audit_assignments
  |                 +-- audit_results
  |                       +-- audit_discrepancies
  |
  +-- shared_resources
  |     +-- resource_bookings
  |           +-- booking_participants
  |           +-- booking_history (append-only)
  |
  +-- audit_cycles
        +-- audit_assignments
        +-- audit_results
        +-- audit_discrepancies
```

---

# Global Conventions

## UUID Primary Keys
All tables use `gen_random_uuid()` (PostgreSQL 13+) for primary keys. This provides:
- No sequential prediction (security)
- No cross-table collision
- Offline ID generation capability
- Optimal B-tree index performance

## Soft Delete Pattern
Every mutable table includes a `deleted_at` timestamp column:
- `NULL` = active record
- `TIMESTAMPTZ` = soft-deleted at that time
- All queries must include `WHERE deleted_at IS NULL` (enforced via Prisma middleware or database views)
- Partial indexes are used to exclude deleted records from index scans

## Audit Columns
Every table includes:
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` - Record creation timestamp
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` - Last modification timestamp (trigger-maintained)
- `created_by UUID` - User who created the record (FK to users)
- `updated_by UUID` - User who last modified the record (FK to users)

## Immutable History Tables
Tables ending in `_history` (asset_status_history, allocation_history, transfer_history, booking_history, maintenance_status_history) are append-only:
- No UPDATE or DELETE operations allowed
- Enforced via PostgreSQL trigger (REJECT for UPDATE/DELETE)
- No soft delete (records are permanent)
- No updated_at column (created_at is the only timestamp)

## JSONB Conventions
- `metadata` columns: free-form extensible data (no schema enforced at DB level)
- `tags` columns: array of strings `["tag1", "tag2"]`
- `custom_fields` columns: key-value map `{"key": "value"}`
- `*_options` columns: array of objects `[{label, value, color}]`
- All JSONB columns are validated at the application layer

## Enum Types
All PostgreSQL enum types are defined with `CREATE TYPE ... AS ENUM`. Enum values are ordered by severity/severity where applicable. Adding new values requires `ALTER TYPE ... ADD VALUE` (cannot remove values).

## Index Conventions
- Partial indexes with `WHERE deleted_at IS NULL` on all mutable tables
- GIN indexes for JSONB and full-text search columns
- Composite indexes follow the most-common query pattern
- GiST index for LTREE path queries

## Cascade Rules Philosophy
- **CASCADE**: For organizational ownership (org deleted -> all data deleted)
- **RESTRICT**: For critical relationships (cannot delete asset with active allocations)
- **SET NULL**: For optional references (location deleted -> asset loses location)
- **NO ACTION**: Default; deferred check for complex multi-table operations
