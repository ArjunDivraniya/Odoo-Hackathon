# AssetFlow Database Tables — Part 3

## Modules 39–67: Notifications & Activity, Reports & System, Location & Calendar, Tags & Attributes, Security & Future, AI Prediction Data

> **Stack:** PostgreSQL 15+ · Prisma ORM · UUID primary keys · 3NF normalization · Soft-delete + audit columns throughout.

---

## Table of Contents

- [Module 39–41: Notifications & Activity](#module-3941-notifications--activity)
  - [39. notifications](#39-notifications)
  - [40. notification_preferences](#40-notification_preferences)
  - [41. activity_logs](#41-activity_logs)
- [Module 42–47: Reports & System](#module-4247-reports--system)
  - [42. report_metadata](#42-report_metadata)
  - [43. dashboard_widgets](#43-dashboard_widgets)
  - [44. email_templates](#44-email_templates)
  - [45. system_settings](#45-system_settings)
  - [46. lookup_tables](#46-lookup_tables)
  - [47. master_status_tables](#47-master_status_tables)
- [Module 48–53: Location & Calendar](#module-4853-location--calendar)
  - [48. countries](#48-countries)
  - [49. states](#49-states)
  - [50. cities](#50-cities)
  - [51. holiday_calendar](#51-holiday_calendar)
  - [52. working_hours](#52-working_hours)
  - [53. file_storage](#53-file_storage)
- [Module 54–57: Tags & Attributes](#module-5457-tags--attributes)
  - [54. tags](#54-tags)
  - [55. asset_tags](#55-asset_tags)
  - [56. asset_labels](#56-asset_labels)
  - [57. custom_attributes](#57-custom_attributes)
- [Module 58–66: Security & Future](#module-5866-security--future)
  - [58. api_tokens](#58-api_tokens)
  - [59. future_iot_sensors](#59-future_iot_sensors)
  - [60. future_iot_readings](#60-future_iot_readings)
  - [61. future_rfid_tags](#61-future_rfid_tags)
  - [62. future_barcode_scans](#62-future_barcode_scans)
- [Module 67: AI Prediction Data](#module-67-ai-prediction-data)
  - [63. ai_predictions](#63-ai_predictions)
- [Appendix A: Cross-Table Relationship Map](#appendix-a-cross-table-relationship-map)
- [Appendix B: Global Conventions](#appendix-b-global-conventions)

---

# Module 39–41: Notifications & Activity

---

## 39. 
otifications

### Purpose

Stores every notification dispatched within AssetFlow — system-generated alerts, assignment notices, approval requests, SLA warnings, and custom broadcast messages.

### Business Requirement

Users must receive timely, filterable notifications for events relevant to their role and responsibilities. Notifications must persist after dismissal so admins can audit communication history. Each notification links back to the originating entity so users can navigate directly to the relevant record.

### Description

The 
otifications table is the central notification queue. Every row represents a single notification delivered (or queued for delivery) to a single user. Notifications are created by the application layer whenever a trigger event occurs (asset assigned, maintenance due, approval requested, etc.). Delivery channel (in-app, email, push) is tracked per notification so the system can report on delivery status independently.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier for the notification. |
| organization_id | UUID | NOT NULL | — | FK → organizations.id ON DELETE CASCADE | Organization that owns this notification. |
| ecipient_user_id | UUID | NOT NULL | — | FK → users.id ON DELETE CASCADE | User who should receive this notification. |
| sender_user_id | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who triggered the notification, if human-initiated. NULL for system-generated. |
| 
otification_type | VARCHAR(50) | NOT NULL | — | CHECK (notification_type IN ('assignment','approval_request','approval_result','maintenance_due','maintenance_overdue','sla_warning','sla_breach','ticket_update','asset_return_due','bulk_action_complete','system_announcement','custom')) | Categorizes the notification for filtering and preference matching. |
| 	itle | VARCHAR(255) | NOT NULL | — | — | Short headline shown in the notification bell/panel. |
| message | TEXT | NOT NULL | — | — | Full body of the notification. May contain plain text or safe HTML subset. |
| entity_type | VARCHAR(50) | NULL | NULL | — | The domain entity type that triggered this notification (e.g. sset, 	icket, maintenance_order, equest). NULL for system announcements. |
| entity_id | UUID | NULL | NULL | — | Primary key of the referenced entity. NULL for system announcements. |
| ction_url | VARCHAR(512) | NULL | NULL | — | Deep-link path the user is taken to when clicking the notification (e.g. /assets/a1b2c3d4). |
| priority | VARCHAR(20) | NOT NULL | 'normal' | CHECK (priority IN ('low','normal','high','urgent')) | Controls visual styling and sort order. |
| is_read | BOOLEAN | NOT NULL | alse | — | Whether the recipient has viewed the notification. |
| ead_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp when the notification was marked as read. |
| is_dismissed | BOOLEAN | NOT NULL | alse | — | Whether the recipient dismissed it from the UI (hidden from active list but not deleted). |
| dismissed_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp when dismissed. |
| email_sent | BOOLEAN | NOT NULL | alse | — | Whether an email counterpart was dispatched. |
| email_sent_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of email dispatch. |
| push_sent | BOOLEAN | NOT NULL | alse | — | Whether a push notification was dispatched. |
| push_sent_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of push dispatch. |
| metadata | JSONB | NULL | '{}'::jsonb | — | Arbitrary extra data (e.g. maintenance due date, approver name). Kept flexible for different notification types. |
| expires_at | TIMESTAMPTZ | NULL | NULL | — | After this time the notification is automatically pruned from active queries. |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who soft-deleted. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |

### Indexes

`sql
CREATE INDEX idx_notifications_org ON notifications (organization_id);
CREATE INDEX idx_notifications_recipient ON notifications (recipient_user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_recipient_type ON notifications (recipient_user_id, notification_type, created_at DESC);
CREATE INDEX idx_notifications_entity ON notifications (entity_type, entity_id);
CREATE INDEX idx_notifications_sender ON notifications (sender_user_id);
CREATE INDEX idx_notifications_unread ON notifications (recipient_user_id, created_at DESC) WHERE is_read = false AND is_deleted = false;
CREATE INDEX idx_notifications_priority ON notifications (priority, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_notifications_expires ON notifications (expires_at) WHERE expires_at IS NOT NULL AND is_deleted = false;
CREATE INDEX idx_notifications_created ON notifications (created_at DESC);
`

### Example Record

``json
{
  "id": "b7e2d3c4-1111-4aaa-b111-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "recipient_user_id": "a1b2c3d4-0000-4000-8000-000000000010",
  "sender_user_id": "a1b2c3d4-0000-4000-8000-000000000020",
  "notification_type": "assignment",
  "title": "Asset Assigned to You",
  "message": "Dell Latitude 5540 (INV-2025-00432) has been assigned to you by Rajesh Kumar.",
  "entity_type": "asset",
  "entity_id": "a1b2c3d4-0000-4000-8000-000000000501",
  "action_url": "/assets/a1b2c3d4-0000-4000-8000-000000000501",
  "priority": "normal",
  "is_read": false,
  "read_at": null,
  "is_dismissed": false,
  "dismissed_at": null,
  "email_sent": true,
  "email_sent_at": "2025-07-12T10:05:30Z",
  "push_sent": false,
  "push_sent_at": null,
  "metadata": {
    "asset_tag": "INV-2025-00432",
    "asset_name": "Dell Latitude 5540",
    "assigned_by_name": "Rajesh Kumar"
  },
  "expires_at": "2025-08-12T10:00:00Z",
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-07-12T10:00:00Z",
  "updated_at": "2025-07-12T10:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| ecipient_required | ecipient_user_id must never be NULL. Every notification must have a recipient. |
| entity_pair | If entity_type is set, entity_id must also be set (and vice versa). |
| ction_url_format | If set, must begin with / and be a valid relative URI path. |
| ead_requires_timestamp | If is_read = true, ead_at should be set (application-layer enforced). |
| expires_after_creation | expires_at, if set, must be after created_at. |
| 	itle_max_length | 	itle must not exceed 255 characters. |

### Business Rules

1. **Preference-gated creation:** Before inserting a notification, the application must check 
otification_preferences for the recipient; if the preference for that 
otification_type and channel is disabled, skip creation.
2. **Batch deduplication:** When a bulk action generates identical notifications for the same user, they must be coalesced into a single notification with an updated message (e.g. "3 assets assigned to you").
3. **Auto-prune:** A scheduled job deletes rows where expires_at < NOW() AND is_deleted = false after 90 days (configurable via system_settings).
4. **Read-all API:** The endpoint PATCH /notifications/read-all sets is_read = true and ead_at = NOW() for all unread notifications of a user.
5. **Unread count cache:** The application must maintain a cached unread count per user (Redis recommended) and invalidate on INSERT/UPDATE.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One | Notification belongs to an organization. |
| users (recipient) | Many-to-One | The user receiving the notification. |
| users (sender) | Many-to-One (optional) | The user who triggered the notification. |
| ssets | Many-to-One (via entity) | When entity_type = 'asset'. |
| 	ickets | Many-to-One (via entity) | When entity_type = 'ticket'. |
| maintenance_orders | Many-to-One (via entity) | When entity_type = 'maintenance_order'. |

### Cascade Rules

- **Organization deleted:** All notifications for that organization are CASCADE deleted.
- **Recipient user deleted:** All notifications addressed to that user are CASCADE deleted.
- **Sender user deleted:** sender_user_id is SET NULL (notification preserved).

### Soft Delete Behavior

Soft-deleted notifications are excluded from all default queries (WHERE is_deleted = false). Admins can retrieve them via an admin-only endpoint. A background job permanently removes soft-deleted notifications after 30 days.

### Future Expansion

- Real-time WebSocket delivery via a 
otification_channels bridge table.
- Group notifications (e.g. "all users in Department X").
- Scheduled/batch notification templates.
- i18n support: store a locale column and render 	itle/message from translation keys.

### Performance Notes

- The composite index on (recipient_user_id, is_read, created_at DESC) is the most critical index — it powers the notification bell query.
- Consider materialized views for unread counts on high-volume deployments.
- Partitioning by created_at (monthly) is recommended for organizations with >1M notifications/month.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/notifications | GET | List notifications for current user with pagination, filters (type, read status, priority). |
| /api/notifications/unread-count | GET | Return integer count of unread notifications. |
| /api/notifications/:id/read | PATCH | Mark a single notification as read. |
| /api/notifications/read-all | PATCH | Mark all unread notifications as read. |
| /api/notifications/:id/dismiss | PATCH | Mark a notification as dismissed. |
| /api/notifications/:id | DELETE | Soft-delete a notification. |

---
## 40. 
otification_preferences

### Purpose

Per-user, per-notification-type configuration controlling which delivery channels are active for each user.

### Business Requirement

Users must be able to opt in or out of specific notification categories across channels (in-app, email, push). Defaults should be settable at the organization level but overridable per user. This prevents notification fatigue and ensures compliance with communication policies.

### Description

Each row represents a single user's preference for a specific notification type on a specific delivery channel. The table acts as a matrix: for every (user, notification_type) combination, there are up to three rows (in-app, email, push). Organization-level defaults are stored with user_id = NULL.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| organization_id | UUID | NOT NULL | — | FK → organizations.id ON DELETE CASCADE | Organization scope. |
| user_id | UUID | NULL | NULL | FK → users.id ON DELETE CASCADE | Specific user. NULL means this row is the organization-wide default. |
| 
otification_type | VARCHAR(50) | NOT NULL | — | CHECK (notification_type IN ('assignment','approval_request','approval_result','maintenance_due','maintenance_overdue','sla_warning','sla_breach','ticket_update','asset_return_due','bulk_action_complete','system_announcement','custom')) | The type of notification this preference governs. |
| channel | VARCHAR(20) | NOT NULL | — | CHECK (channel IN ('in_app','email','push')) | Delivery channel. |
| is_enabled | BOOLEAN | NOT NULL | 	rue | — | Whether this channel is active for this user+type. |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who soft-deleted. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |

### Indexes

``sql
CREATE UNIQUE INDEX uq_notification_prefs_user_type_channel
  ON notification_preferences (organization_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), notification_type, channel)
  WHERE is_deleted = false;

CREATE INDEX idx_notification_prefs_org ON notification_preferences (organization_id);
CREATE INDEX idx_notification_prefs_user ON notification_preferences (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_notification_prefs_org_default ON notification_preferences (organization_id, notification_type, channel) WHERE user_id IS NULL AND is_deleted = false;
``

### Example Record

``json
{
  "id": "c8f3e4d5-2222-4bbb-c222-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "user_id": "a1b2c3d4-0000-4000-8000-000000000010",
  "notification_type": "maintenance_overdue",
  "channel": "email",
  "is_enabled": true,
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-01-15T08:30:00Z",
  "updated_at": "2025-06-20T14:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| unique_user_type_channel | No duplicate (organization_id, user_id, notification_type, channel) rows where is_deleted = false. |
| user_or_default | A row is either a user-specific preference (user_id IS NOT NULL) or an org default (user_id IS NULL), not both in the same unique scope. |

### Business Rules

1. **Default seeding:** When a new organization is created, the system seeds default preferences for all notification types and channels (all enabled by default).
2. **User override precedence:** When checking whether to deliver a notification, user-specific preferences (user_id IS NOT NULL) take precedence over org defaults (user_id IS NULL).
3. **Admin management:** Organization admins can set org-wide defaults. Individual users can only modify their own preferences.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One | Preference belongs to an organization. |
| users | Many-to-One (optional) | Specific user preference, or NULL for org default. |

### Cascade Rules

- **Organization deleted:** All preferences for that org are CASCADE deleted.
- **User deleted:** All user-specific preferences are CASCADE deleted. Org defaults are unaffected.

### Soft Delete Behavior

Soft-deleted rows are ignored by preference lookups. Unique constraints are partial (WHERE is_deleted = false) to allow re-creation after soft delete.

### Future Expansion

- Notification frequency settings (e.g. daily digest instead of real-time).
- Quiet hours configuration (time windows where push/email are suppressed).
- Channel-specific settings (e.g. email address overrides, push device tokens).

### Performance Notes

- The table is small (rows = users x types x channels) and fits in memory. No partitioning needed.
- Cache the resolved preference matrix per user in the application layer (invalidate on UPDATE).

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/notification-preferences | GET | Get current user's preferences. |
| /api/notification-preferences | PUT | Bulk-update current user's preferences. |
| /api/admin/notification-preferences/defaults | GET/PUT | Org admin: get/set org-wide defaults. |

---
## 41. ctivity_logs

### Purpose

Immutable, append-only audit trail capturing every meaningful action performed across the entire AssetFlow system — who did what, to which entity, when, from where, with what device, and what changed.

### Business Requirement

Regulatory compliance (ISO 27001, SOC 2, internal audits) requires a tamper-proof log of all data mutations. The system must support forensic investigation, debugging, compliance reporting, and user accountability. Every create, update, delete, login, export, and approval must be recorded with full before/after snapshots. This is the single most critical audit table in the entire schema.

### Description

ctivity_logs is the universal audit ledger. It is **append-only** — no UPDATE or DELETE operations are permitted at the application or database level (enforced via PostgreSQL trigger). Every row captures the complete context of a single action: the acting user, their session, IP address, browser/OS fingerprint, the entity affected (polymorphic via entity_type/entity_id), the action performed, full old and new value snapshots as JSONB, geolocation, and processing metadata. This table is designed for regulatory-grade audit trails and will grow continuously.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier for this log entry. |
| organization_id | UUID | NOT NULL | — | FK → organizations.id ON DELETE CASCADE | Organization scope. |
| user_id | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who performed the action. NULL for system/automated actions. |
| session_id | UUID | NULL | NULL | FK → user_sessions.id ON DELETE SET NULL | The user session during which the action occurred. |
| ction | VARCHAR(50) | NOT NULL | — | CHECK (action IN ('create','update','delete','restore','view','login','logout','login_failed','password_change','password_reset','export','import','approve','reject','assign','unassign','transfer','checkout','checkin','reserve','cancel_reservation','escalate','comment','attach','bulk_create','bulk_update','bulk_delete','bulk_export','generate_report','system_action','api_call','permission_change','role_change','settings_change','notification_sent','workflow_trigger','ai_prediction','custom')) | The action performed. Comprehensive enumeration of all trackable operations. |
| entity_type | VARCHAR(50) | NOT NULL | — | — | Domain entity type affected (e.g. sset, user, 	icket, maintenance_order, equest, category, organization, ole, setting). |
| entity_id | UUID | NULL | NULL | — | Primary key of the affected entity. NULL for cross-entity or system-level actions. |
| entity_display_name | VARCHAR(255) | NULL | NULL | — | Human-readable label of the affected entity at time of action (e.g. "Dell Latitude 5540 — INV-2025-00432"). Denormalized for fast audit report rendering. |
| old_values | JSONB | NULL | NULL | — | Full snapshot of changed fields before the mutation. Only populated for update, delete, and state-change actions. Example: {"status": {"old": "available", "new": "assigned"}}. |
| 
ew_values | JSONB | NULL | NULL | — | Full snapshot of changed fields after the mutation. Only populated for create, update, and state-change actions. |
| ull_snapshot | JSONB | NULL | NULL | — | Complete entity record snapshot at time of action. Enabled only for critical entities (configurable). Provides point-in-time reconstruction. |
| description | TEXT | NULL | NULL | — | Human-readable description of the action (e.g. "Asset assigned to John Doe from Warehouse A to Department Engineering"). |
| ip_address | INET | NULL | NULL | — | IPv4 or IPv6 address of the client. |
| user_agent | TEXT | NULL | NULL | — | Raw User-Agent header from the HTTP request. |
| rowser | VARCHAR(100) | NULL | NULL | — | Parsed browser name and version (e.g. "Chrome 126.0"). |
| os | VARCHAR(100) | NULL | NULL | — | Parsed operating system (e.g. "Windows 11"). |
| device_type | VARCHAR(30) | NULL | NULL | CHECK (device_type IS NULL OR device_type IN ('desktop','mobile','tablet','server','api','unknown')) | Device category. |
| latitude | DECIMAL(10, 8) | NULL | NULL | — | GPS latitude if available (from mobile app or IoT device). |
| longitude | DECIMAL(11, 8) | NULL | NULL | — | GPS longitude if available. |
| geo_accuracy_meters | INTEGER | NULL | NULL | — | Accuracy of the geolocation fix in meters. |
| equest_method | VARCHAR(10) | NULL | NULL | CHECK (request_method IS NULL OR request_method IN ('GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS')) | HTTP method of the originating request. |
| equest_url | VARCHAR(1024) | NULL | NULL | — | Full URL of the originating request. |
| equest_body_summary | TEXT | NULL | NULL | — | Sanitized summary of the request body (secrets/redacted). Max 1KB. |
| esponse_status | SMALLINT | NULL | NULL | — | HTTP response status code. |
| execution_time_ms | INTEGER | NULL | NULL | — | Server-side execution time in milliseconds. |
| error_message | TEXT | NULL | NULL | — | Error message if the action failed. NULL for successful actions. |
| 	race_id | VARCHAR(64) | NULL | NULL | — | Distributed tracing ID (OpenTelemetry / Jaeger). |
| span_id | VARCHAR(32) | NULL | NULL | — | Span ID within the trace. |
| correlation_id | UUID | NULL | NULL | — | Groups related log entries across a single user-initiated workflow (e.g. a multi-step asset transfer). |
| 	ags | TEXT[] | NULL | '{}` | — | Array of string tags for filtering (e.g. {'compliance','critical','audit'}). |
| metadata | JSONB | NULL | '{}'::jsonb | — | Arbitrary structured data specific to the action type (e.g. maintenance duration, approval comments, export format). |
| is_system_action | BOOLEAN | NOT NULL | alse | — | True if the action was performed by the system (cron job, automated workflow, integration). |
| atch_id | UUID | NULL | NULL | — | Groups log entries created in a single batch/bulk operation. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Timestamp of the action (immutable — never updated). |
### Indexes

``sql
-- Primary audit query: who did what, when
CREATE INDEX idx_activity_logs_org_created ON activity_logs (organization_id, created_at DESC);

-- User activity timeline
CREATE INDEX idx_activity_logs_user ON activity_logs (user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Entity history: all actions on a specific record
CREATE INDEX idx_activity_logs_entity ON activity_logs (entity_type, entity_id, created_at DESC);

-- Action-based filtering
CREATE INDEX idx_activity_logs_action ON activity_logs (organization_id, action, created_at DESC);

-- Compliance reporting: filter by entity type
CREATE INDEX idx_activity_logs_entity_type ON activity_logs (organization_id, entity_type, created_at DESC);

-- Failed actions for security monitoring
CREATE INDEX idx_activity_logs_errors ON activity_logs (organization_id, action, created_at DESC) WHERE error_message IS NOT NULL;

-- Login audit
CREATE INDEX idx_activity_logs_logins ON activity_logs (user_id, created_at DESC) WHERE action IN ('login', 'logout', 'login_failed');

-- Correlation for workflow tracing
CREATE INDEX idx_activity_logs_correlation ON activity_logs (correlation_id) WHERE correlation_id IS NOT NULL;

-- Batch operation lookup
CREATE INDEX idx_activity_logs_batch ON activity_logs (batch_id) WHERE batch_id IS NOT NULL;

-- Trace integration
CREATE INDEX idx_activity_logs_trace ON activity_logs (trace_id) WHERE trace_id IS NOT NULL;

-- IP-based security lookups
CREATE INDEX idx_activity_logs_ip ON activity_logs (ip_address, created_at DESC) WHERE ip_address IS NOT NULL;

-- Time-based partition pruning (if partitioned by created_at)
CREATE INDEX idx_activity_logs_created ON activity_logs (created_at DESC);

-- Tags search (GIN for array containment)
CREATE INDEX idx_activity_logs_tags ON activity_logs USING GIN (tags) WHERE tags != '{}';
``

### Example Record

``json
{
  "id": "d9a4b5e6-3333-4ccc-d333-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "user_id": "a1b2c3d4-0000-4000-8000-000000000020",
  "session_id": "e1f2a3b4-4444-4ddd-e444-000000000001",
  "action": "update",
  "entity_type": "asset",
  "entity_id": "a1b2c3d4-0000-4000-8000-000000000501",
  "entity_display_name": "Dell Latitude 5540 — INV-2025-00432",
  "old_values": {
    "status": "available",
    "assigned_to_id": null,
    "current_location_id": "a1b2c3d4-0000-4000-8000-000000000701"
  },
  "new_values": {
    "status": "assigned",
    "assigned_to_id": "a1b2c3d4-0000-4000-8000-000000000010",
    "current_location_id": "a1b2c3d4-0000-4000-8000-000000000702"
  },
  "full_snapshot": null,
  "description": "Asset assigned to Priya Sharma. Location changed from Warehouse A to Engineering Floor 3.",
  "ip_address": "192.168.1.105",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
  "browser": "Chrome 126.0",
  "os": "Windows 11",
  "device_type": "desktop",
  "latitude": 28.61390000,
  "longitude": 77.20900000,
  "geo_accuracy_meters": null,
  "request_method": "PATCH",
  "request_url": "/api/assets/a1b2c3d4-0000-4000-8000-000000000501/assign",
  "request_body_summary": "{\"assigned_to_id\": \"...\", \"location_id\": \"...\"}",
  "response_status": 200,
  "execution_time_ms": 45,
  "error_message": null,
  "trace_id": "abc123def456ghi789jkl012mno345pq",
  "span_id": "span123456",
  "correlation_id": "f1a2b3c4-5555-4eee-f555-000000000001",
  "tags": ["asset_management", "assignment"],
  "metadata": {
    "previous_assignment_duration_days": 120,
    "assignment_type": "permanent"
  },
  "is_system_action": false,
  "batch_id": null,
  "created_at": "2025-07-12T10:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| ction_required | ction must never be NULL. |
| entity_type_required | entity_type must never be NULL (even for system actions, use 'system' as the entity type). |
| ppend_only | **No UPDATE or DELETE operations** are permitted on this table. Enforced via PostgreSQL trigger 	rg_activity_logs_immutable. |
| old_new_for_update | For ction = 'update', at least one of old_values or 
ew_values should be non-NULL. |
| create_new_values | For ction = 'create', 
ew_values should be populated with the created record. |
| delete_old_values | For ction = 'delete', old_values should contain the deleted record snapshot. |
| ip_format | ip_address must be a valid IPv4 or IPv6 address if set. |
| execution_positive | execution_time_ms must be >= 0 if set. |

### Business Rules

1. **Immutable rows:** The PostgreSQL trigger 	rg_activity_logs_immutable prevents any UPDATE or DELETE:

``sql
CREATE OR REPLACE FUNCTION fn_activity_logs_immutable()
RETURNS TRIGGER AS 
BEGIN
  RAISE EXCEPTION 'activity_logs is append-only. UPDATE and DELETE are prohibited.';
  RETURN NULL;
END;
 LANGUAGE plpgsql;

CREATE TRIGGER trg_activity_logs_immutable
  BEFORE UPDATE OR DELETE ON activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION fn_activity_logs_immutable();
``

2. **Bulk operation logging:** Bulk actions create one ctivity_logs row per affected entity with a shared atch_id. A summary row with ction = 'bulk_update' is also created.

3. **Sensitive data redaction:** Fields marked as sensitive in the entity schema (passwords, tokens, SSNs) must be replaced with [REDACTED] in old_values, 
ew_values, equest_body_summary, and ull_snapshot.

4. **Full snapshot sampling:** The ull_snapshot column is only populated for configurable entity types (default: user, ole, setting, organization) to control storage growth.

5. **Retention:** Raw logs are retained for 7 years (configurable via system_settings). After retention, they are archived to cold storage before deletion.

6. **Async writing:** Log writes must be non-blocking. The application writes to a buffer (in-memory queue or Kafka topic) and flushes to PostgreSQL asynchronously. This prevents audit logging from slowing down user-facing operations.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One | Log belongs to an organization. |
| users (actor) | Many-to-One (optional) | The user who performed the action. NULL for system actions. |
| user_sessions | Many-to-One (optional) | The session context. |
| All other tables | Polymorphic (via entity_type/entity_id) | Any entity in the system can be the target of a log entry. |

### Cascade Rules

- **Organization deleted:** All activity logs are CASCADE deleted (compliance note: export before org deletion is mandatory).
- **User deleted:** user_id is SET NULL (log preserved for audit continuity).
- **Session deleted:** session_id is SET NULL (log preserved).

### Soft Delete Behavior

**Not applicable.** This table does not use soft delete. It is append-only and immutable by design.

### Future Expansion

- **Log shipping to SIEM:** Export to Splunk, ELK, or Datadog via change data capture (CDC).
- **Blockchain anchoring:** Periodic hash-chain verification for tamper detection.
- **ML-powered anomaly detection:** Feed ctivity_logs into an ML pipeline to detect unusual access patterns.
- **User activity dashboards:** Real-time activity feeds for managers.
- **Compliance export API:** Generate SOC 2 / ISO 27001 audit reports from this table.

### Performance Notes

- **Partitioning:** Mandatory for production. Partition by created_at using monthly range partitions. Retention policy drops old partitions.
- **Write throughput:** Target 10,000+ inserts/second. Use batch inserts (every 100ms or 100 rows).
- **Storage:** Expect ~1KB per row average. At 10,000 actions/day, ~3.6GB/year.
- **Read performance:** The most common query pattern is (organization_id, entity_type, entity_id, created_at DESC) — the composite index covers this.
- **Consider TimescaleDB** hypertable extension for automatic partitioning and time-based compression.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/activity-logs | GET | Paginated, filterable log viewer (admin + manager roles). |
| /api/activity-logs/entity/:type/:id | GET | History of all actions on a specific entity. |
| /api/activity-logs/user/:id | GET | Activity timeline for a specific user. |
| /api/activity-logs/export | GET | Export logs as CSV/PDF for compliance. |
| /api/activity-logs/live | WebSocket | Real-time activity feed (filtered by user permissions). |

---
# Module 42–47: Reports & System

---

## 42. eport_metadata

### Purpose

Stores definitions, configurations, and execution history for all built-in and custom reports in AssetFlow.

### Business Requirement

Users must be able to generate, schedule, and export various reports (asset inventory, maintenance history, utilization, depreciation, compliance). Report definitions must be versioned, shareable, and parameterized. Execution history must be retained for audit and caching purposes.

### Description

Each row defines a single report type with its parameters, layout, data source query, and access controls. A separate execution log tracks when reports were generated, by whom, with what parameters, and the output location.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| organization_id | UUID | NOT NULL | — | FK → organizations.id ON DELETE CASCADE | Organization scope. |
| eport_code | VARCHAR(50) | NOT NULL | — | UNIQUE (organization_id, report_code) | Machine-readable code (e.g. ASSET_INVENTORY, MAINTENANCE_HISTORY). |
| 
ame | VARCHAR(255) | NOT NULL | — | — | Display name. |
| description | TEXT | NULL | NULL | — | What this report shows. |
| category | VARCHAR(50) | NOT NULL | — | CHECK (category IN ('inventory','maintenance','financial','compliance','utilization','custom','audit','hr')) | Report category for grouping. |
| eport_type | VARCHAR(20) | NOT NULL | 'tabular' | CHECK (report_type IN ('tabular','chart','dashboard','pdf_letter','export')) | Output format type. |
| data_source | TEXT | NOT NULL | — | — | SQL query template or Prisma query key that fetches the report data. |
| parameters_schema | JSONB | NOT NULL | '{}'::jsonb | — | JSON Schema defining accepted parameters (e.g. date range, asset category filter). |
| default_parameters | JSONB | NOT NULL | '{}'::jsonb | — | Default parameter values. |
| columns_config | JSONB | NOT NULL | '[]'::jsonb | — | Array of column definitions: {key, label, type, width, format, sortable, align}. |
| layout_config | JSONB | NOT NULL | '{}'::jsonb | — | Chart type, colors, grouping, pivot settings. |
| ccess_roles | TEXT[] | NOT NULL | '{}` | — | Array of role names allowed to run this report. Empty means all authenticated users. |
| is_system | BOOLEAN | NOT NULL | alse | — | True for built-in reports that cannot be deleted. |
| is_active | BOOLEAN | NOT NULL | 	rue | — | False to hide from the report catalog without deleting. |
| is_scheduled | BOOLEAN | NOT NULL | alse | — | Whether this report has a recurring schedule. |
| schedule_cron | VARCHAR(100) | NULL | NULL | — | Cron expression for scheduled runs (e.g.   9 * * 1 = every Monday 9 AM). |
| schedule_recipients | TEXT[] | NULL | '{}` | — | Email addresses to send the report to when scheduled. |
| last_generated_at | TIMESTAMPTZ | NULL | NULL | — | When this report was last generated. |
| generation_count | INTEGER | NOT NULL |   | — | Total number of times this report has been generated. |
| ersion | INTEGER | NOT NULL | 1 | — | Schema version for migration tracking. |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who soft-deleted. |
| created_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who created this report definition. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |

### Indexes

``sql
CREATE UNIQUE INDEX uq_report_metadata_org_code ON report_metadata (organization_id, report_code) WHERE is_deleted = false;
CREATE INDEX idx_report_metadata_org ON report_metadata (organization_id, category, name);
CREATE INDEX idx_report_metadata_category ON report_metadata (organization_id, category) WHERE is_active = true AND is_deleted = false;
CREATE INDEX idx_report_metadata_scheduled ON report_metadata (is_scheduled, schedule_cron) WHERE is_scheduled = true AND is_active = true AND is_deleted = false;
``

### Example Record

``json
{
  "id": "e0b5c6f7-4444-4ddd-e444-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "report_code": "ASSET_INVENTORY",
  "name": "Asset Inventory Report",
  "description": "Complete inventory of all assets with status, location, and assignee.",
  "category": "inventory",
  "report_type": "tabular",
  "data_source": "report_asset_inventory_query",
  "parameters_schema": {
    "type": "object",
    "properties": {
      "start_date": {"type": "string", "format": "date"},
      "end_date": {"type": "string", "format": "date"},
      "category_id": {"type": "string", "format": "uuid"},
      "status": {"type": "string", "enum": ["available","assigned","maintenance","retired"]}
    }
  },
  "default_parameters": {
    "start_date": "{{current_fiscal_year_start}}",
    "end_date": "{{current_date}}"
  },
  "columns_config": [
    {"key": "asset_tag", "label": "Asset Tag", "type": "string", "width": 120, "sortable": true},
    {"key": "name", "label": "Asset Name", "type": "string", "width": 200, "sortable": true},
    {"key": "category", "label": "Category", "type": "string", "width": 150},
    {"key": "status", "label": "Status", "type": "badge", "width": 100},
    {"key": "assigned_to", "label": "Assigned To", "type": "string", "width": 150}
  ],
  "layout_config": {"orientation": "landscape", "page_size": "A4"},
  "access_roles": ["admin", "manager", "auditor"],
  "is_system": true,
  "is_active": true,
  "is_scheduled": true,
  "schedule_cron": "0 9 1 * *",
  "schedule_recipients": ["finance@company.com"],
  "last_generated_at": "2025-07-01T09:00:00Z",
  "generation_count": 24,
  "version": 3,
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_by": "a1b2c3d4-0000-4000-8000-000000000001",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-06-15T12:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| unique_org_code | eport_code must be unique within an organization. |
| parameters_valid_json | parameters_schema must be valid JSON Schema. |
| cron_valid | schedule_cron, if set, must be a valid 5-field cron expression. |
| schedule_requires_recipients | If is_scheduled = true, schedule_recipients must be non-empty. |

### Business Rules

1. System reports (is_system = true) cannot be deleted or have their eport_code changed.
2. Custom reports created by users inherit the creator's role permissions.
3. Report execution creates a row in a eport_executions child table (for history).

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One | Report belongs to an organization. |
| users (creator) | Many-to-One (optional) | User who defined this report. |

### Cascade Rules

- **Organization deleted:** All report definitions are CASCADE deleted.
- **Creator deleted:** created_by is SET NULL.

### Soft Delete Behavior

Standard soft delete. Hidden from the report catalog but preserved for historical execution records.

### Future Expansion

- Collaborative report editing with version history.
- Embedded report widgets on dashboards.
- Report sharing across organizations (templates marketplace).

### Performance Notes

- Small table — no partitioning needed.
- data_source queries should be indexed independently in the application layer.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/reports | GET | List available reports for current user. |
| /api/reports/:id/execute | POST | Execute a report with parameters. Returns data + metadata. |
| /api/reports/:id/export | POST | Export report as PDF/CSV/Excel. |
| /api/reports | POST | Create a custom report (admin). |
| /api/reports/:id | PUT | Update report definition (admin). |
| /api/reports/:id | DELETE | Soft-delete custom report. |

---
## 43. dashboard_widgets

### Purpose

Stores user-configurable dashboard widget layouts, types, data sources, and display preferences.

### Business Requirement

Each user should be able to customize their personal dashboard by adding, removing, resizing, and reordering widgets. Widgets display real-time data from various sources (asset counts, maintenance alerts, utilization charts, activity feeds). Default layouts must be provided per role.

### Description

Each row represents one widget instance on a user's dashboard. The widget_type determines rendering, data_config specifies the data source and parameters, and position_config stores the grid layout coordinates. Shared/role-based defaults use user_id = NULL.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| organization_id | UUID | NOT NULL | — | FK → organizations.id ON DELETE CASCADE | Organization scope. |
| user_id | UUID | NULL | NULL | FK → users.id ON DELETE CASCADE | Widget owner. NULL for role-based defaults. |
| ole_id | UUID | NULL | NULL | FK → roles.id ON DELETE CASCADE | Role this widget default applies to (only when user_id is NULL). |
| widget_type | VARCHAR(50) | NOT NULL | — | CHECK (widget_type IN ('stat_card','bar_chart','line_chart','pie_chart','doughnut_chart','area_chart','table','list','activity_feed','gauge','heatmap','calendar','map','donut_progress','kpi_ticker','custom')) | Determines the rendering component. |
| 	itle | VARCHAR(100) | NOT NULL | — | — | Widget header title. |
| data_config | JSONB | NOT NULL | '{}'::jsonb | — | Data source configuration: {endpoint, query_params, refresh_interval_seconds, aggregation}. |
| position_config | JSONB | NOT NULL | '{}'::jsonb | — | Grid layout: {x, y, w, h, minW, minH} (grid units). |
| style_config | JSONB | NOT NULL | '{}'::jsonb | — | Visual config: {color_scheme, icon, show_header, show_legend, decimal_places}. |
| ilters | JSONB | NULL | '{}'::jsonb | — | Persistent filter state for this widget instance. |
| efresh_interval_seconds | INTEGER | NOT NULL | 300 | — | Auto-refresh interval in seconds. Minimum 30. |
| is_visible | BOOLEAN | NOT NULL | 	rue | — | Whether the widget is currently shown (users can hide without deleting). |
| sort_order | INTEGER | NOT NULL |   | — | Display order on the dashboard. |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who soft-deleted. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |

### Indexes

``sql
CREATE INDEX idx_dashboard_widgets_user ON dashboard_widgets (user_id, sort_order) WHERE user_id IS NOT NULL AND is_deleted = false;
CREATE INDEX idx_dashboard_widgets_role_default ON dashboard_widgets (role_id) WHERE user_id IS NULL AND role_id IS NOT NULL AND is_deleted = false;
CREATE INDEX idx_dashboard_widgets_org ON dashboard_widgets (organization_id);
``

### Example Record

``json
{
  "id": "f1a2b3c4-5555-4eee-f555-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "user_id": "a1b2c3d4-0000-4000-8000-000000000010",
  "role_id": null,
  "widget_type": "stat_card",
  "title": "Total Assets",
  "data_config": {
    "endpoint": "/api/dashboard/stats/asset-count",
    "query_params": {"status": "all"},
    "refresh_interval_seconds": 120
  },
  "position_config": {"x": 0, "y": 0, "w": 3, "h": 2, "minW": 2, "minH": 1},
  "style_config": {"color_scheme": "blue", "icon": "database", "show_header": false},
  "filters": {},
  "refresh_interval_seconds": 120,
  "is_visible": true,
  "sort_order": 1,
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-07-01T08:00:00Z",
  "updated_at": "2025-07-12T10:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| position_positive | position_config.x, y, w, h must be >= 0. w and h must be >= 1. |
| efresh_minimum | efresh_interval_seconds must be >= 30. |
| user_or_role | Exactly one of user_id or ole_id should be set (not both, not neither — except org-level defaults which set both to NULL). |

### Business Rules

1. When a new user is created, the system clones role-based default widgets (where ole_id = user.role_id) as personal widgets for that user.
2. Users can rearrange, resize, and toggle visibility of their own widgets.
3. Maximum 20 active widgets per user.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One | Dashboard belongs to an organization. |
| users | Many-to-One (optional) | Personal widget, or NULL for defaults. |
| oles | Many-to-One (optional) | Role-based default widget. |

### Cascade Rules

- **Organization deleted:** CASCADE delete all widgets.
- **User deleted:** CASCADE delete all personal widgets.
- **Role deleted:** CASCADE delete all role-default widgets.

### Soft Delete Behavior

Standard soft delete. Hidden from dashboard but preserved.

### Future Expansion

- Widget marketplace: share widget configs across users.
- Embed external data sources (iframe/SVG widgets).
- Drag-and-drop real-time collaboration on dashboards.

### Performance Notes

- Small table per user. Load eagerly when a user's dashboard is requested.
- Cache widget data responses in Redis with TTL matching efresh_interval_seconds.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/dashboard/widgets | GET | Get current user's widget layout. |
| /api/dashboard/widgets | POST | Add a new widget to user's dashboard. |
| /api/dashboard/widgets/:id | PUT | Update widget config/position. |
| /api/dashboard/widgets/:id | DELETE | Remove widget from dashboard. |
| /api/dashboard/widgets/reorder | PUT | Batch update sort_order for all widgets. |

---
## 44. email_templates

### Purpose

Centralized repository of all transactional and notification email templates with handlebars-style templating, localization support, and version history.

### Business Requirement

All outgoing emails must use approved, branded templates. Templates must support dynamic content insertion, multiple locales, preview before send, and version control. Admins must be able to edit templates without code deployment.

### Description

Each row stores a complete email template including subject, HTML body, plain-text fallback, and metadata. Templates are referenced by 	emplate_key from application code. Template variables use {{variable_name}} syntax and are resolved at send time.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| organization_id | UUID | NOT NULL | — | FK → organizations.id ON DELETE CASCADE | Organization scope. |
| 	emplate_key | VARCHAR(100) | NOT NULL | — | UNIQUE (organization_id, template_key) | Machine-readable key (e.g. sset_assigned, maintenance_reminder, password_reset). |
| 
ame | VARCHAR(255) | NOT NULL | — | — | Human-readable name. |
| category | VARCHAR(50) | NOT NULL | — | CHECK (category IN ('notification','transactional','marketing','system','compliance')) | Template category. |
| subject | VARCHAR(500) | NOT NULL | — | — | Email subject line with {{variables}}. |
| html_body | TEXT | NOT NULL | — | — | Full HTML email body. Supports {{variables}} and conditional blocks. |
| plain_body | TEXT | NOT NULL | — | — | Plain-text fallback for email clients that don't render HTML. |
| preview_text | VARCHAR(255) | NULL | NULL | — | Preheader text shown in email client previews. |
| rom_name | VARCHAR(100) | NULL | NULL | — | Override sender display name. NULL uses org default. |
| rom_email | VARCHAR(255) | NULL | NULL | — | Override sender email address. NULL uses org default. |
| eply_to | VARCHAR(255) | NULL | NULL | — | Reply-To address. |
| ariables_schema | JSONB | NOT NULL | '[]'::jsonb | — | Array of {name, type, required, default, description} defining expected template variables. |
| locale | VARCHAR(10) | NOT NULL | 'en' | — | ISO 639-1 language code for this template version. |
| ersion | INTEGER | NOT NULL | 1 | — | Template version. Incremented on each edit. |
| is_active | BOOLEAN | NOT NULL | 	rue | — | Whether this template version is the active one. |
| is_system | BOOLEAN | NOT NULL | alse | — | True for built-in templates that cannot be deleted. |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who soft-deleted. |
| created_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who created this template. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |

### Indexes

``sql
CREATE UNIQUE INDEX uq_email_templates_org_key_locale ON email_templates (organization_id, template_key, locale) WHERE is_deleted = false;
CREATE INDEX idx_email_templates_org ON email_templates (organization_id, category);
CREATE INDEX idx_email_templates_key ON email_templates (organization_id, template_key) WHERE is_active = true AND is_deleted = false;
``

### Example Record

``json
{
  "id": "a2b3c4d5-6666-4fff-a666-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "template_key": "asset_assigned",
  "name": "Asset Assignment Notification",
  "category": "notification",
  "subject": "Asset Assigned: {{asset_name}} ({{asset_tag}})",
  "html_body": "<html><body><h2>Hello {{recipient_name}},</h2><p>You have been assigned <strong>{{asset_name}}</strong> ({{asset_tag}}) by {{assigned_by_name}}.</p><p><a href=\"{{action_url}}\">View Asset</a></p></body></html>",
  "plain_body": "Hello {{recipient_name}},\n\nYou have been assigned {{asset_name}} ({{asset_tag}}) by {{assigned_by_name}}.\n\nView Asset: {{action_url}}",
  "preview_text": "You've been assigned a new asset",
  "from_name": "AssetFlow",
  "from_email": null,
  "reply_to": null,
  "variables_schema": [
    {"name": "recipient_name", "type": "string", "required": true, "default": null, "description": "Recipient's full name"},
    {"name": "asset_name", "type": "string", "required": true, "default": null, "description": "Asset display name"},
    {"name": "asset_tag", "type": "string", "required": true, "default": null, "description": "Asset tag number"},
    {"name": "assigned_by_name", "type": "string", "required": true, "default": null, "description": "Assigner's name"},
    {"name": "action_url", "type": "string", "required": true, "default": null, "description": "Deep link to asset"}
  ],
  "locale": "en",
  "version": 2,
  "is_active": true,
  "is_system": true,
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_by": "a1b2c3d4-0000-4000-8000-000000000001",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-06-01T12:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| unique_org_key_locale | (organization_id, template_key, locale) must be unique among active non-deleted rows. |
| html_and_plain_required | Both html_body and plain_body must be non-empty. |
| ariables_consistent | Variables used in subject and ody should be declared in ariables_schema. |

### Business Rules

1. Active template is determined by is_active = true AND locale = requested_locale. Fallback to locale = 'en'.
2. System templates ship with the application and are seeded during migration.
3. Editing an active template creates a new version (old version set to is_active = false).

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One | Template belongs to an organization. |
| users | Many-to-One (optional) | Creator. |

### Cascade Rules

- **Organization deleted:** CASCADE delete all templates.
- **Creator deleted:** SET NULL on created_by.

### Soft Delete Behavior

Standard soft delete. Template is hidden from the editor but historical emails may still reference it.

### Future Expansion

- Template editor with live preview (WYSIWYG).
- A/B testing of subject lines.
- Drag-and-drop email builder.
- Multi-locale template management UI.

### Performance Notes

- Very small table. No partitioning needed.
- Cache active templates in memory (Redis) with invalidation on UPDATE.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/email-templates | GET | List templates (admin). |
| /api/email-templates/:key/preview | POST | Render template with sample data. |
| /api/email-templates | POST | Create new template (admin). |
| /api/email-templates/:id | PUT | Update template (creates new version). |
| /api/email-templates/:id | DELETE | Soft-delete template. |
| /api/email-templates/:id/activate | POST | Set as active version. |

---
## 45. system_settings

### Purpose

Key-value configuration store for all runtime-adjustable system settings, feature flags, and organization-level preferences.

### Business Requirement

System administrators must be able to modify application behavior without code deployment. Settings include feature toggles, integration endpoints, notification defaults, retention policies, UI preferences, and more. Settings must be type-safe, auditable, and scoped to organizations.

### Description

Each row is a single configuration key with its typed value. The setting_type column enables the application to parse values correctly. Settings are loaded into memory at startup and cached with a TTL. Changes are logged to ctivity_logs.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| organization_id | UUID | NULL | NULL | FK → organizations.id ON DELETE CASCADE | Organization scope. NULL for global/system settings. |
| setting_key | VARCHAR(150) | NOT NULL | — | UNIQUE (organization_id, setting_key) | Dot-notation key (e.g. 
otification.email.retention_days, eature.iot.enabled). |
| setting_value | TEXT | NOT NULL | — | — | String-serialized value. Parsed according to setting_type. |
| setting_type | VARCHAR(20) | NOT NULL | 'string' | CHECK (setting_type IN ('string','integer','boolean','float','json','encrypted','date','datetime')) | Data type for correct parsing. |
| category | VARCHAR(50) | NOT NULL | 'general' | — | Logical grouping for the admin UI (e.g. general, security, integrations, 
otifications, eatures). |
| description | TEXT | NULL | NULL | — | Human-readable description of what this setting controls. |
| default_value | TEXT | NULL | NULL | — | The default value. Used for reset-to-default functionality. |
| min_value | TEXT | NULL | NULL | — | Minimum allowed value (for numeric types). |
| max_value | TEXT | NULL | NULL | — | Maximum allowed value (for numeric types). |
| llowed_values | TEXT[] | NULL | NULL | — | Enumerated allowed values. NULL means any value within type constraints. |
| equires_restart | BOOLEAN | NOT NULL | alse | — | True if changing this setting requires an application restart to take effect. |
| is_sensitive | BOOLEAN | NOT NULL | alse | — | True if the value should be masked in the admin UI (e.g. API keys, passwords). |
| is_readonly | BOOLEAN | NOT NULL | alse | — | True if this setting cannot be modified via the admin UI. |
| is_system | BOOLEAN | NOT NULL | alse | — | True for core system settings that are always present. |
| ersion | INTEGER | NOT NULL | 1 | — | Optimistic locking version. |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who soft-deleted. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |
| updated_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who last changed this setting. |

### Indexes

``sql
CREATE UNIQUE INDEX uq_system_settings_org_key ON system_settings (COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), setting_key) WHERE is_deleted = false;
CREATE INDEX idx_system_settings_org ON system_settings (organization_id, category) WHERE is_deleted = false;
CREATE INDEX idx_system_settings_category ON system_settings (category) WHERE organization_id IS NULL AND is_deleted = false;
``

### Example Record

``json
{
  "id": "b3c4d5e6-7777-4000-b777-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "setting_key": "notification.retention_days",
  "setting_value": "90",
  "setting_type": "integer",
  "category": "notifications",
  "description": "Number of days to retain notifications before auto-pruning.",
  "default_value": "90",
  "min_value": "1",
  "max_value": "365",
  "allowed_values": null,
  "requires_restart": false,
  "is_sensitive": false,
  "is_readonly": false,
  "is_system": true,
  "version": 1,
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "updated_by": null
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| unique_org_key | (organization_id, setting_key) must be unique among non-deleted rows. |
| 	ype_coercion | setting_value must be parseable as setting_type. |
| ange_check | If min_value/max_value are set, numeric values must fall within range. |
| enum_check | If llowed_values is set, value must be in the list. |
| eadonly_immutable | If is_readonly = true, UPDATE must be rejected (application-layer). |

### Business Rules

1. **Override hierarchy:** Organization settings override global defaults. If organization_id = NULL, the row is a global default.
2. **Cache invalidation:** Any UPDATE must trigger a cache invalidation event (via Redis pub/sub).
3. **Audit:** All setting changes are logged to ctivity_logs with old_values and 
ew_values.
4. **Sensitive values:** is_sensitive = true settings are encrypted at rest (application-layer AES-256) and masked in API responses.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One (optional) | Org-specific setting, or NULL for global. |
| users | Many-to-One (optional) | Last user who modified. |

### Cascade Rules

- **Organization deleted:** CASCADE delete all org-specific settings. Global defaults (org_id = NULL) are unaffected.

### Soft Delete Behavior

Standard soft delete. Deleted settings revert to default behavior.

### Future Expansion

- Settings UI with type-aware editors (color pickers, cron builders, JSON editors).
- Settings import/export for org migration.
- Change approval workflow for critical settings.

### Performance Notes

- Entire table should be cached in Redis at startup. Invalidate on UPDATE.
- Very small table (< 1000 rows even for large deployments). No partitioning needed.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/system-settings | GET | List all settings (admin). Sensitive values masked. |
| /api/system-settings/:key | GET | Get a single setting by key. |
| /api/system-settings/:key | PUT | Update a setting value (admin). |
| /api/system-settings/:key/reset | POST | Reset a setting to its default value. |
| /api/system-settings/bulk | PUT | Batch-update multiple settings. |

---
## 46. lookup_tables

### Purpose

Generic key-value lookup store for small reference datasets that don't warrant a dedicated table — currency codes, unit-of-measure lists, priority labels, and similar enumerations.

### Business Requirement

The system needs many small, rarely-changing reference lists (currencies, measurement units, priority labels, condition grades, etc.). Creating a separate table for each would bloat the schema. A single generic lookup table with a category discriminator keeps the schema clean while allowing per-organization customization.

### Description

Each row is a single lookup entry within a named category. Categories are namespaced by organization_id (NULL for global/system defaults). Entries are ordered by sort_order and can be enabled/disabled without deletion. The application caches all active lookups in memory.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| organization_id | UUID | NULL | NULL | FK → organizations.id ON DELETE CASCADE | Organization scope. NULL for global defaults. |
| category | VARCHAR(50) | NOT NULL | — | — | Logical group (e.g. currency, unit_of_measure, priority, condition_grade, sset_lifecycle_status). |
| code | VARCHAR(50) | NOT NULL | — | UNIQUE (organization_id, category, code) | Machine-readable code (e.g. USD, kg, high). |
| label | VARCHAR(150) | NOT NULL | — | — | Human-readable display label (e.g. "US Dollar", "Kilograms", "High Priority"). |
| description | TEXT | NULL | NULL | — | Optional description or tooltip. |
| color | VARCHAR(7) | NULL | NULL | — | Hex color code for UI badge rendering (e.g. #FF5733). |
| icon | VARCHAR(50) | NULL | NULL | — | Optional icon name for UI display. |
| sort_order | INTEGER | NOT NULL |   | — | Display ordering within the category. |
| is_active | BOOLEAN | NOT NULL | 	rue | — | Whether this entry is available for selection. |
| is_system | BOOLEAN | NOT NULL | alse | — | True for entries that cannot be deleted. |
| parent_code | VARCHAR(50) | NULL | NULL | — | Self-referencing parent for hierarchical lookups (e.g. sub-categories). |
| metadata | JSONB | NULL | '{}'::jsonb | — | Extra data associated with this entry (e.g. exchange rate for currencies). |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who soft-deleted. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |

### Indexes

``sql
CREATE UNIQUE INDEX uq_lookup_tables_org_cat_code ON lookup_tables (COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), category, code) WHERE is_deleted = false;
CREATE INDEX idx_lookup_tables_category ON lookup_tables (category, sort_order) WHERE is_active = true AND is_deleted = false;
CREATE INDEX idx_lookup_tables_org ON lookup_tables (organization_id) WHERE organization_id IS NOT NULL;
``

### Example Record

``json
{
  "id": "c4d5e6f7-8888-4111-c888-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "category": "currency",
  "code": "USD",
  "label": "US Dollar",
  "description": "United States Dollar",
  "color": null,
  "icon": "dollar-sign",
  "sort_order": 1,
  "is_active": true,
  "is_system": false,
  "parent_code": null,
  "metadata": {"symbol": "$", "decimal_places": 2},
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| unique_org_cat_code | (organization_id, category, code) must be unique among non-deleted rows. |
| color_format | color, if set, must match ^#[0-9A-Fa-f]{6}$. |
| parent_valid | parent_code, if set, must reference an existing active entry in the same category. |

### Business Rules

1. System entries (is_system = true) ship with the application and cannot be deleted.
2. Organization admins can add custom entries or override labels for system entries.
3. When an entry is referenced by other tables, deactivation is preferred over deletion.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One (optional) | Org-specific entry, or NULL for global. |
| lookup_tables (self) | Self-referencing | parent_code for hierarchical lookups. |

### Cascade Rules

- **Organization deleted:** CASCADE delete all org-specific entries.

### Soft Delete Behavior

Standard soft delete. Inactive entries are hidden from selection dropdowns but preserved for historical data integrity.

### Future Expansion

- Hierarchical tree view for categories with deep nesting.
- Lookup entry versioning and change history.
- Import/export of lookup catalogs.

### Performance Notes

- Entire table fits in memory (< 5000 rows). Cache in Redis with category-based keys.
- No partitioning needed.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/lookups/:category | GET | Get all active entries for a category. |
| /api/lookups | POST | Create a new lookup entry (admin). |
| /api/lookups/:id | PUT | Update a lookup entry (admin). |
| /api/lookups/:id | DELETE | Soft-delete a lookup entry (admin). |
| /api/lookups/bulk/:category | POST | Bulk-create entries for a category. |

---

## 47. master_status_tables

### Purpose

Canonical source of truth for all lifecycle states and transitions used across the system — asset statuses, ticket states, maintenance phases, request workflows, and approval stages.

### Business Requirement

Different entity types have different lifecycle state machines. AssetFlow must support configurable state machines where admins can define valid states, allowed transitions, visual properties, and automation triggers for each entity type. This replaces hardcoded status enums and allows per-organization customization.

### Description

Each row defines a single state within an entity type's lifecycle. The companion 	ransitions JSONB column on the entity type row (or in metadata) defines which states can transition to which other states, and what conditions/gates apply. States are ordered, color-coded, and can trigger notifications or automation on entry/exit.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| organization_id | UUID | NULL | NULL | FK → organizations.id ON DELETE CASCADE | Organization scope. NULL for global defaults. |
| entity_type | VARCHAR(50) | NOT NULL | — | — | The domain entity this status applies to (e.g. sset, 	icket, maintenance_order, equest, pproval). |
| status_code | VARCHAR(50) | NOT NULL | — | UNIQUE (organization_id, entity_type, status_code) | Machine-readable code (e.g. vailable, in_maintenance, pending_approval). |
| status_name | VARCHAR(100) | NOT NULL | — | — | Human-readable label (e.g. "Available", "In Maintenance"). |
| description | TEXT | NULL | NULL | — | Description of when this status applies. |
| color | VARCHAR(7) | NOT NULL | '#6B7280' | — | Hex color for UI badge rendering. |
| icon | VARCHAR(50) | NULL | NULL | — | Icon name for status display. |
| sort_order | INTEGER | NOT NULL |   | — | Display ordering within the entity type. |
| is_initial | BOOLEAN | NOT NULL | alse | — | True if this is the default status when a new entity is created. Exactly one per entity_type. |
| is_terminal | BOOLEAN | NOT NULL | alse | — | True if this is a final/end state (e.g. etired, closed, cancelled). |
| is_active | BOOLEAN | NOT NULL | 	rue | — | Whether this status is available for selection. |
| is_system | BOOLEAN | NOT NULL | alse | — | True for statuses that cannot be deleted. |
| llowed_roles | TEXT[] | NOT NULL | '{}` | — | Roles allowed to transition INTO this status. Empty means any role. |
| equires_approval | BOOLEAN | NOT NULL | alse | — | Whether transitioning INTO this status requires an approval step. |
| pprover_roles | TEXT[] | NULL | '{}` | — | Roles that can approve transitions into this status. |
| sla_hours | INTEGER | NULL | NULL | — | Maximum hours an entity should remain in this status before escalation. NULL = no SLA. |
| 
otification_on_entry | TEXT[] | NULL | '{}` | — | Notification types to fire when an entity enters this status. |
| utomation_hooks | JSONB | NULL | '{}'::jsonb | — | Webhook/function references triggered on entry/exit (e.g. {"on_entry": ["send_email", "update_field"], "on_exit": ["clear_cache"]}). |
| metadata | JSONB | NULL | '{}'::jsonb | — | Additional configuration for this status. |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who soft-deleted. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |

### Indexes

``sql
CREATE UNIQUE INDEX uq_master_status_org_entity_code ON master_status_tables (COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), entity_type, status_code) WHERE is_deleted = false;
CREATE INDEX idx_master_status_entity ON master_status_tables (entity_type, sort_order) WHERE is_active = true AND is_deleted = false;
CREATE INDEX idx_master_status_org ON master_status_tables (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_master_status_initial ON master_status_tables (entity_type) WHERE is_initial = true AND is_active = true AND is_deleted = false;
``

### Example Record

``json
{
  "id": "d5e6f7a8-9999-4222-d999-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "entity_type": "asset",
  "status_code": "in_maintenance",
  "status_name": "In Maintenance",
  "description": "Asset is currently undergoing scheduled or unscheduled maintenance.",
  "color": "#F59E0B",
  "icon": "wrench",
  "sort_order": 3,
  "is_initial": false,
  "is_terminal": false,
  "is_active": true,
  "is_system": true,
  "allowed_roles": ["admin", "manager", "technician"],
  "requires_approval": false,
  "approver_roles": null,
  "sla_hours": 72,
  "notification_on_entry": ["maintenance_started"],
  "automation_hooks": {
    "on_entry": ["pause_depreciation", "notify_assignee"],
    "on_exit": ["resume_depreciation"]
  },
  "metadata": {},
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| unique_org_entity_code | (organization_id, entity_type, status_code) must be unique among non-deleted rows. |
| one_initial_per_entity | For each (organization_id, entity_type), at most one status can have is_initial = true. |
| color_format | color must match ^#[0-9A-Fa-f]{6}$. |
| 	erminal_no_transition | If is_terminal = true, no other status should list this as a valid transition target (application-layer). |
| sla_positive | sla_hours must be > 0 if set. |

### Business Rules

1. **State machine validation:** Before allowing a status transition, the application must verify the transition is defined in the entity's state machine configuration (stored in metadata.transitions or a dedicated transitions table).
2. **Approval gating:** If equires_approval = true, the transition goes to a pending_approval intermediate state until an approver acts.
3. **SLA monitoring:** A background job scans entities in statuses with sla_hours set and triggers escalations when time limits are exceeded.
4. **System statuses:** Built-in statuses (e.g. vailable, ssigned, etired) ship with the application and cannot be removed.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One (optional) | Org-specific status, or NULL for global. |
| ssets | Referenced by | ssets.status stores the status_code for this entity type. |
| 	ickets | Referenced by | 	ickets.status stores the status_code for this entity type. |
| maintenance_orders | Referenced by | maintenance_orders.status stores the status_code. |
| equests | Referenced by | equests.status stores the status_code. |

### Cascade Rules

- **Organization deleted:** CASCADE delete all org-specific statuses.

### Soft Delete Behavior

Standard soft delete. Deleted statuses cannot be assigned to new entities but historical records referencing them are preserved.

### Future Expansion

- Visual state machine designer (drag-and-drop UI).
- Per-entity-type transition rules table (status_transitions).
- Conditional transitions based on entity attributes.
- Status history tracking per entity (separate entity_status_history table).

### Performance Notes

- Very small table (< 100 rows). Cache in memory.
- No partitioning needed.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/statuses/:entityType | GET | Get all active statuses for an entity type. |
| /api/statuses/:entityType/transitions | GET | Get valid transitions from each status. |
| /api/statuses | POST | Create a new status (admin). |
| /api/statuses/:id | PUT | Update status configuration (admin). |
| /api/statuses/:id | DELETE | Soft-delete a status (admin). |

---
# Module 48–53: Location & Calendar

---

## 48. countries

### Purpose

Reference table of all countries with ISO codes, regional metadata, and localization defaults.

### Business Requirement

AssetFlow supports multi-country deployments. Country data drives address normalization, tax calculations, regulatory compliance rules, holiday calendars, and timezone defaults. The table must be pre-seeded with all UN-recognized countries and kept up-to-date with ISO 3166-1 changes.

### Description

Each row represents a single country. This is a reference/lookup table that is pre-seeded during database initialization and should rarely be modified. Country codes are used as foreign key references in states, cities, and address fields across the system.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| iso_alpha2 | CHAR(2) | NOT NULL | — | UNIQUE | ISO 3166-1 alpha-2 code (e.g. IN, US, GB). |
| iso_alpha3 | CHAR(3) | NOT NULL | — | UNIQUE | ISO 3166-1 alpha-3 code (e.g. IND, USA, GBR). |
| iso_numeric | CHAR(3) | NOT NULL | — | UNIQUE | ISO 3166-1 numeric code (e.g. 356, 840, 826). |
| 
ame | VARCHAR(150) | NOT NULL | — | — | Full country name in English (e.g. "India", "United States of America"). |
| official_name | VARCHAR(255) | NULL | NULL | — | Official country name (e.g. "Republic of India"). |
| common_name | VARCHAR(100) | NULL | NULL | — | Short common name (e.g. "India", "America"). |
| egion | VARCHAR(50) | NULL | NULL | — | UN geoscheme region (e.g. Southern Asia, Northern America). |
| sub_region | VARCHAR(50) | NULL | NULL | — | UN geoscheme sub-region (e.g. South-Eastern Asia). |
| capital | VARCHAR(100) | NULL | NULL | — | Capital city name. |
| currency_code | CHAR(3) | NULL | NULL | — | ISO 4217 currency code (e.g. INR, USD). |
| currency_name | VARCHAR(100) | NULL | NULL | — | Currency name (e.g. "Indian Rupee"). |
| currency_symbol | VARCHAR(10) | NULL | NULL | — | Currency symbol (e.g. "₹", "$"). |
| phone_code | VARCHAR(20) | NULL | NULL | — | International dialing code (e.g. "+91", "+1"). |
| phone_format | VARCHAR(50) | NULL | NULL | — | Expected phone number format pattern. |
| 	ld | VARCHAR(10) | NULL | NULL | — | Top-level domain (e.g. .in, .us). |
| languages | TEXT[] | NULL | '{en}' | — | Primary languages spoken (ISO 639-1 codes). |
| default_locale | VARCHAR(10) | NOT NULL | 'en' | — | Default locale code for this country. |
| default_timezone | VARCHAR(50) | NOT NULL | 'UTC' | — | IANA timezone name (e.g. Asia/Kolkata, America/New_York). |
| date_format | VARCHAR(20) | NOT NULL | 'YYYY-MM-DD' | — | Preferred date display format. |
| 	ime_format | VARCHAR(10) | NOT NULL | '24h' | — | Preferred time format (12h or 24h). |
| 
umber_decimal_separator | CHAR(1) | NOT NULL | '.' | — | Decimal separator character. |
| 
umber_group_separator | CHAR(1) | NOT NULL | ',' | — | Thousands/group separator character. |
| lag_emoji | VARCHAR(10) | NULL | NULL | — | Flag emoji (e.g. "🇮🇳"). |
| is_active | BOOLEAN | NOT NULL | 	rue | — | Whether this country is available for selection. |
| sort_order | INTEGER | NOT NULL |   | — | Display ordering (alphabetical by default). |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |

### Indexes

``sql
CREATE INDEX idx_countries_name ON countries (name);
CREATE INDEX idx_countries_region ON countries (region, sub_region, name);
CREATE INDEX idx_countries_active ON countries (sort_order) WHERE is_active = true;
CREATE INDEX idx_countries_currency ON countries (currency_code) WHERE currency_code IS NOT NULL;
``

### Example Record

``json
{
  "id": "e6f7a8b9-1111-4333-e111-000000000001",
  "iso_alpha2": "IN",
  "iso_alpha3": "IND",
  "iso_numeric": "356",
  "name": "India",
  "official_name": "Republic of India",
  "common_name": "India",
  "region": "Southern Asia",
  "sub_region": "Southern Asia",
  "capital": "New Delhi",
  "currency_code": "INR",
  "currency_name": "Indian Rupee",
  "currency_symbol": "₹",
  "phone_code": "+91",
  "phone_format": "XXXXX-XXXXX",
  "tld": ".in",
  "languages": ["en", "hi"],
  "default_locale": "en",
  "default_timezone": "Asia/Kolkata",
  "date_format": "DD/MM/YYYY",
  "time_format": "12h",
  "number_decimal_separator": ".",
  "number_group_separator": ",",
  "flag_emoji": "🇮🇳",
  "is_active": true,
  "sort_order": 89,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| iso_alpha2_unique | iso_alpha2 must be globally unique. |
| iso_alpha3_unique | iso_alpha3 must be globally unique. |
| iso_numeric_unique | iso_numeric must be globally unique. |
| 	imezone_valid | default_timezone must be a valid IANA timezone identifier. |
| locale_valid | default_locale must be a valid ISO 639-1 code. |

### Business Rules

1. **Pre-seeded:** All 249 UN-recognized countries are seeded during database migration.
2. **Read-only in production:** Countries should generally not be modified or deleted in production.
3. **Cascading defaults:** When a new organization specifies a country, locale, timezone, and currency defaults are auto-populated from this table.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| states | One-to-Many | A country has many states/provinces. |
| cities | One-to-Many (via states) | Cities belong to states within a country. |
| organizations | Referenced by | organizations.country_id links to this table. |

### Cascade Rules

- Countries are never CASCADE deleted. If a country must be deactivated, set is_active = false.

### Soft Delete Behavior

Not applicable. Countries are never deleted — only deactivated.

### Future Expansion

- EU VAT rate data per country.
- Country-specific compliance rules engine.
- Address validation integration per country.

### Performance Notes

- Fixed-size reference table (~250 rows). Cache in memory permanently.
- No partitioning needed.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/geo/countries | GET | List all active countries. |
| /api/geo/countries/:code | GET | Get country details by ISO code. |
| /api/geo/countries/:code/states | GET | Get states for a country. |

---

## 49. states

### Purpose

Reference table of states, provinces, territories, and administrative divisions within countries.

### Business Requirement

Address forms need state/province selection that is country-aware. State data also drives regional compliance rules, tax zones, and shipping calculations.

### Description

Each row represents a first-level administrative division (state, province, territory) within a country. The country_id foreign key links to countries. States are pre-seeded for major countries and can be added by admins for others.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| country_id | UUID | NOT NULL | — | FK → countries.id ON DELETE CASCADE | Parent country. |
| iso_code | VARCHAR(20) | NOT NULL | — | UNIQUE (country_id, iso_code) | ISO 3166-2 subdivision code (e.g. IN-MH, US-CA). |
| 
ame | VARCHAR(150) | NOT NULL | — | — | Full state name (e.g. "Maharashtra", "California"). |
| short_name | VARCHAR(50) | NULL | NULL | — | Abbreviated name (e.g. "MH", "CA"). |
| 	ype | VARCHAR(50) | NULL | NULL | — | Administrative type (e.g. state, province, 	erritory, county). |
| capital | VARCHAR(100) | NULL | NULL | — | State capital city name. |
| 	imezone | VARCHAR(50) | NULL | NULL | — | IANA timezone if different from country default. |
| phone_code | VARCHAR(20) | NULL | NULL | — | Area/regional dialing code if applicable. |
| is_active | BOOLEAN | NOT NULL | 	rue | — | Whether this state is available for selection. |
| sort_order | INTEGER | NOT NULL |   | — | Display ordering within the country. |
| metadata | JSONB | NULL | '{}'::jsonb | — | Additional data (e.g. postal code patterns, tax rates). |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |

### Indexes

``sql
CREATE UNIQUE INDEX uq_states_country_iso ON states (country_id, iso_code);
CREATE INDEX idx_states_country ON states (country_id, sort_order) WHERE is_active = true;
CREATE INDEX idx_states_name ON states (name);
``

### Example Record

``json
{
  "id": "f7a8b9c0-2222-4444-f222-000000000001",
  "country_id": "e6f7a8b9-1111-4333-e111-000000000001",
  "iso_code": "IN-MH",
  "name": "Maharashtra",
  "short_name": "MH",
  "type": "state",
  "capital": "Mumbai",
  "timezone": "Asia/Kolkata",
  "phone_code": "022",
  "is_active": true,
  "sort_order": 21,
  "metadata": {"postal_code_pattern": "######"},
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| unique_country_iso | (country_id, iso_code) must be unique. |
| country_required | country_id must not be NULL. |

### Business Rules

1. Pre-seeded for countries with >10 states. Admins can add states for smaller countries.
2. States inherit default timezone and locale from their parent country unless overridden.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| countries | Many-to-One | State belongs to a country. |
| cities | One-to-Many | State has many cities. |

### Cascade Rules

- **Country deleted:** CASCADE delete all states for that country.

### Soft Delete Behavior

Not applicable. States are deactivated, not deleted.

### Future Expansion

- Postal code validation per state.
- Tax zone mapping per state.

### Performance Notes

- Small reference table (< 5000 rows). Cache in memory.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/geo/countries/:code/states | GET | List states for a country. |
| /api/geo/states/:id | GET | Get state details. |

---

## 50. cities

### Purpose

Reference table of cities within states, used for address normalization and location selection.

### Business Requirement

Asset locations, warehouse addresses, and employee offices need city-level granularity. City data drives shipping calculations, regional compliance, and location-based asset tracking.

### Description

Each row represents a city within a state. The table maintains a country → state → city hierarchy. Cities are pre-seeded for major metropolitan areas and can be added by users.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| state_id | UUID | NOT NULL | — | FK → states.id ON DELETE CASCADE | Parent state. |
| country_id | UUID | NOT NULL | — | FK → countries.id ON DELETE CASCADE | Denormalized country reference for fast filtering. |
| 
ame | VARCHAR(150) | NOT NULL | — | — | City name (e.g. "Mumbai", "San Francisco"). |
| short_name | VARCHAR(50) | NULL | NULL | — | Abbreviated/common name. |
| postal_code | VARCHAR(20) | NULL | NULL | — | Primary postal/ZIP code for the city. |
| latitude | DECIMAL(10, 8) | NULL | NULL | — | City center latitude. |
| longitude | DECIMAL(11, 8) | NULL | NULL | — | City center longitude. |
| 	imezone | VARCHAR(50) | NULL | NULL | — | IANA timezone if different from state/country. |
| population | INTEGER | NULL | NULL | — | Approximate population for reference. |
| is_major | BOOLEAN | NOT NULL | alse | — | True for major metropolitan areas (prioritized in autocomplete). |
| is_active | BOOLEAN | NOT NULL | 	rue | — | Whether this city is available for selection. |
| sort_order | INTEGER | NOT NULL |   | — | Display ordering. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |

### Indexes

``sql
CREATE INDEX idx_cities_state ON cities (state_id, sort_order) WHERE is_active = true;
CREATE INDEX idx_cities_country ON cities (country_id, name);
CREATE INDEX idx_cities_name ON cities (name) WHERE is_active = true;
CREATE INDEX idx_cities_major ON cities (country_id, name) WHERE is_major = true AND is_active = true;
CREATE INDEX idx_cities_geo ON cities (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
``

### Example Record

``json
{
  "id": "a8b9c0d1-3333-4555-a333-000000000001",
  "state_id": "f7a8b9c0-2222-4444-f222-000000000001",
  "country_id": "e6f7a8b9-1111-4333-e111-000000000001",
  "name": "Mumbai",
  "short_name": "BOM",
  "postal_code": "400001",
  "latitude": 19.07600000,
  "longitude": 72.87770000,
  "timezone": "Asia/Kolkata",
  "population": 20411000,
  "is_major": true,
  "is_active": true,
  "sort_order": 1,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| state_required | state_id must not be NULL. |
| country_required | country_id must not be NULL (denormalized). |
| coordinates_valid | If set, latitude must be between -90 and 90, longitude between -180 and 180. |

### Business Rules

1. country_id is denormalized for query performance — it must match the country of the referenced state_id.
2. Major cities (is_major = true) are prioritized in address autocomplete dropdowns.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| states | Many-to-One | City belongs to a state. |
| countries | Many-to-One | Denormalized country reference. |
| locations | Referenced by | locations.city_id links here. |

### Cascade Rules

- **State deleted:** CASCADE delete all cities for that state.
- **Country deleted:** CASCADE delete all cities for that country.

### Soft Delete Behavior

Not applicable. Cities are deactivated, not deleted.

### Future Expansion

- Geocoding integration for automatic city detection from coordinates.
- Postal code range validation per city.

### Performance Notes

- Moderate reference table (< 100,000 rows). Consider caching major cities only.
- latitude/longitude index enables proximity searches for nearby locations.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/geo/states/:id/cities | GET | List cities for a state. |
| /api/geo/cities/search | GET | Autocomplete city search by name. |
| /api/geo/cities/nearby | GET | Find cities near given coordinates. |

---

## 51. holiday_calendar

### Purpose

Stores public holidays, company-specific non-working days, and regional observances for scheduling, SLA calculations, and maintenance window planning.

### Business Requirement

SLA calculations, maintenance scheduling, and asset availability predictions must account for non-working days. Different regions have different public holidays. Organizations may also define company-specific holidays (e.g. annual shutdowns). The system must automatically exclude holidays from SLA timers and working-hour calculations.

### Description

Each row represents a single holiday entry for a specific date, scoped to a country, state, or organization. Recurring holidays (e.g. "Independence Day" on August 15 each year) use the ecurrence field. The system checks this table when calculating SLA deadlines and available maintenance windows.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| organization_id | UUID | NULL | NULL | FK → organizations.id ON DELETE CASCADE | Organization scope. NULL for national/regional holidays. |
| country_id | UUID | NULL | NULL | FK → countries.id ON DELETE SET NULL | Country this holiday applies to. |
| state_id | UUID | NULL | NULL | FK → states.id ON DELETE SET NULL | State/province for regional holidays. NULL means country-wide. |
| 
ame | VARCHAR(200) | NOT NULL | — | — | Holiday name (e.g. "Independence Day", "Diwali"). |
| description | TEXT | NULL | NULL | — | Description or cultural context. |
| holiday_date | DATE | NOT NULL | — | — | The specific date of the holiday. |
| holiday_type | VARCHAR(30) | NOT NULL | — | CHECK (holiday_type IN ('public','regional','company','optional','religious')) | Classification of the holiday. |
| is_recurring | BOOLEAN | NOT NULL | 	rue | — | Whether this holiday repeats annually on the same date. |
| ecurrence_rule | VARCHAR(100) | NULL | NULL | — | iCal RRULE string for complex recurrences (e.g. FREQ=YEARLY;BYMONTH=8;BYMONTHDAY=15). |
| is_active | BOOLEAN | NOT NULL | 	rue | — | Whether this holiday is currently observed. |
| is_optional | BOOLEAN | NOT NULL | alse | — | True if employees can choose to work on this day. |
| metadata | JSONB | NULL | '{}'::jsonb | — | Additional data (e.g. {"replacement_day": "2025-08-18"}). |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |
| created_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who added this holiday. |

### Indexes

``sql
CREATE INDEX idx_holiday_date ON holiday_calendar (holiday_date) WHERE is_active = true;
CREATE INDEX idx_holiday_country ON holiday_calendar (country_id, holiday_date) WHERE is_active = true;
CREATE INDEX idx_holiday_state ON holiday_calendar (state_id, holiday_date) WHERE state_id IS NOT NULL AND is_active = true;
CREATE INDEX idx_holiday_org ON holiday_calendar (organization_id, holiday_date) WHERE organization_id IS NOT NULL AND is_active = true;
CREATE INDEX idx_holiday_type ON holiday_calendar (holiday_type, holiday_date) WHERE is_active = true;
``

### Example Record

``json
{
  "id": "b9c0d1e2-4444-5666-b444-000000000001",
  "organization_id": null,
  "country_id": "e6f7a8b9-1111-4333-e111-000000000001",
  "state_id": null,
  "name": "Independence Day",
  "description": "National holiday celebrating India's independence.",
  "holiday_date": "2025-08-15",
  "holiday_type": "public",
  "is_recurring": true,
  "recurrence_rule": "FREQ=YEARLY;BYMONTH=8;BYMONTHDAY=15",
  "is_active": true,
  "is_optional": false,
  "metadata": {},
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "created_by": null
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| date_required | holiday_date must not be NULL. |
| 	ype_valid | holiday_type must be one of the CHECK enum values. |
| rule_valid | ecurrence_rule, if set, must be a valid iCal RRULE string. |

### Business Rules

1. **SLA exclusion:** When calculating SLA deadlines, the system must skip dates where is_active = true AND (country_id = org.country_id OR state_id = org.state_id OR organization_id = org.id).
2. **Hierarchy:** Organization holidays override national holidays. If an org declares a date as working, national holidays are ignored for that org.
3. **Seeding:** National holidays are pre-seeded during migration. Org admins can add company-specific holidays.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One (optional) | Company-specific holiday. |
| countries | Many-to-One (optional) | National holiday scope. |
| states | Many-to-One (optional) | Regional holiday scope. |

### Cascade Rules

- **Organization deleted:** CASCADE delete company holidays.
- **Country deleted:** SET NULL on country_id.

### Soft Delete Behavior

Holidays are deactivated (is_active = false), not soft-deleted.

### Future Expansion

- Holiday substitution/replacement day management.
- Multi-day holiday periods (e.g. Christmas break).
- Integration with Google Calendar / Outlook for holiday sync.

### Performance Notes

- Small table (< 5000 rows). Cache all active holidays per country in memory.
- Query pattern: "Is date X a holiday for org Y?" → check org holidays, then state holidays, then country holidays.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/holidays | GET | List holidays for current user's org/country. |
| /api/holidays/check/:date | GET | Check if a specific date is a holiday. |
| /api/holidays | POST | Create a company holiday (admin). |
| /api/holidays/:id | PUT | Update a holiday. |
| /api/holidays/:id | DELETE | Deactivate a holiday. |

---

## 52. working_hours

### Purpose

Defines standard working hours, shift schedules, and time-off policies per organization, department, or location for accurate SLA and utilization calculations.

### Business Requirement

SLA calculations and maintenance window scheduling depend on knowing when people and facilities are available. Different departments, locations, or shifts may have different working hours. The system must use these definitions to calculate realistic deadlines and avoid scheduling maintenance during non-working hours.

### Description

Each row defines a working-hours template. The schedule JSONB column contains the detailed weekly schedule with start/end times per day. Templates can be assigned to organizations, departments, or specific locations. The system references this table when calculating SLA durations, scheduling maintenance, and computing utilization metrics.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| organization_id | UUID | NOT NULL | — | FK → organizations.id ON DELETE CASCADE | Organization scope. |
| 
ame | VARCHAR(100) | NOT NULL | — | — | Template name (e.g. "Standard 9-5", "Night Shift", "24/7 Operations"). |
| description | TEXT | NULL | NULL | — | Description of the schedule. |
| schedule | JSONB | NOT NULL | — | — | Detailed weekly schedule (see schema below). |
| 	imezone | VARCHAR(50) | NOT NULL | 'UTC' | — | IANA timezone for this schedule. |
| working_days_per_week | SMALLINT | NOT NULL | 5 | — | Number of working days per week. |
| hours_per_day | DECIMAL(4, 2) | NOT NULL | 8.00 | — | Standard working hours per day. |
| hours_per_week | DECIMAL(5, 2) | NOT NULL | 40.00 | — | Standard working hours per week. |
| lunch_break_minutes | INTEGER | NOT NULL | 60 | — | Standard lunch break duration in minutes. |
| is_default | BOOLEAN | NOT NULL | alse | — | Whether this is the default schedule for the organization. |
| is_active | BOOLEAN | NOT NULL | 	rue | — | Whether this schedule is currently in use. |
| pplies_to_type | VARCHAR(30) | NOT NULL | 'organization' | CHECK (applies_to_type IN ('organization','department','location','team')) | What entity this schedule applies to. |
| pplies_to_id | UUID | NULL | NULL | — | ID of the entity this schedule applies to (department, location, team). NULL for org-wide. |
| metadata | JSONB | NULL | '{}'::jsonb | — | Extra configuration (e.g. overtime rules, flex-time settings). |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who soft-deleted. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |

**Schedule JSONB Schema:**

``json
{
  "monday":    {"enabled": true,  "start": "09:00", "end": "18:00"},
  "tuesday":   {"enabled": true,  "start": "09:00", "end": "18:00"},
  "wednesday": {"enabled": true,  "start": "09:00", "end": "18:00"},
  "thursday":  {"enabled": true,  "start": "09:00", "end": "18:00"},
  "friday":    {"enabled": true,  "start": "09:00", "end": "18:00"},
  "saturday":  {"enabled": false, "start": null,    "end": null},
  "sunday":    {"enabled": false, "start": null,    "end": null}
}
``

### Indexes

``sql
CREATE INDEX idx_working_hours_org ON working_hours (organization_id, is_default) WHERE is_active = true AND is_deleted = false;
CREATE INDEX idx_working_hours_applies ON working_hours (applies_to_type, applies_to_id) WHERE is_active = true AND is_deleted = false;
``

### Example Record

``json
{
  "id": "c0d1e2f3-5555-6777-c555-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "name": "Standard Business Hours",
  "description": "Monday to Friday, 9 AM to 6 PM IST.",
  "schedule": {
    "monday":    {"enabled": true,  "start": "09:00", "end": "18:00"},
    "tuesday":   {"enabled": true,  "start": "09:00", "end": "18:00"},
    "wednesday": {"enabled": true,  "start": "09:00", "end": "18:00"},
    "thursday":  {"enabled": true,  "start": "09:00", "end": "18:00"},
    "friday":    {"enabled": true,  "start": "09:00", "end": "18:00"},
    "saturday":  {"enabled": false, "start": null,    "end": null},
    "sunday":    {"enabled": false, "start": null,    "end": null}
  },
  "timezone": "Asia/Kolkata",
  "working_days_per_week": 5,
  "hours_per_day": 9.00,
  "hours_per_week": 45.00,
  "lunch_break_minutes": 60,
  "is_default": true,
  "is_active": true,
  "applies_to_type": "organization",
  "applies_to_id": null,
  "metadata": {"overtime_multiplier": 1.5, "flex_time_minutes": 30},
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| 	imezone_valid | 	imezone must be a valid IANA timezone identifier. |
| schedule_valid_json | schedule must contain entries for all 7 days of the week. |
| hours_consistent | hours_per_week should approximately equal hours_per_day * working_days_per_week. |
| lunch_positive | lunch_break_minutes must be >= 0. |
| one_default_per_org | At most one default schedule per organization. |

### Business Rules

1. **Default fallback:** If no specific schedule applies to a department/location, the org default schedule is used.
2. **SLA calculation:** SLA timers only count time within working hours + exclude holidays.
3. **Maintenance windows:** Scheduled maintenance must fall within working hours unless explicitly overridden.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One | Schedule belongs to an organization. |
| departments | Referenced by (optional) | pplies_to_type = 'department'. |
| locations | Referenced by (optional) | pplies_to_type = 'location'. |

### Cascade Rules

- **Organization deleted:** CASCADE delete all working hours templates.

### Soft Delete Behavior

Standard soft delete. Deleted templates are excluded from schedule lookups.

### Future Expansion

- Shift rotation management (A/B/C shifts).
- Seasonal schedule variations.
- Integration with attendance/time-tracking systems.
- Per-employee schedule overrides.

### Performance Notes

- Small table per organization. Cache in Redis.
- No partitioning needed.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/working-hours | GET | Get working hours for current user's org/department. |
| /api/working-hours | POST | Create a working hours template (admin). |
| /api/working-hours/:id | PUT | Update a template. |
| /api/working-hours/:id | DELETE | Soft-delete a template. |
| /api/working-hours/calculate | POST | Calculate working time between two timestamps. |

---
## 53. ile_storage

### Purpose

Centralized file attachment management supporting images, PDFs, documents, videos, and future cloud storage backends with metadata, access control, and versioning.

### Business Requirement

Assets, tickets, maintenance orders, requests, and other entities need file attachments (photos, documents, PDFs, scanned receipts, videos). The system must store files securely, support multiple storage backends (local, S3, Azure Blob), track file metadata, control access, and support versioning. This table manages the metadata; actual file bytes are stored in the configured backend.

### Description

Each row represents a single file stored in the system. The storage_backend column determines where the actual bytes reside (local disk, AWS S3, Azure Blob Storage, GCS, or a future cloud provider). The ile_path stores the logical path in the storage backend. File metadata (size, MIME type, dimensions, checksum) is stored here for fast querying without touching the storage backend. Files are soft-deleted to support version history and undo.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| organization_id | UUID | NOT NULL | — | FK → organizations.id ON DELETE CASCADE | Organization that owns this file. |
| uploaded_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who uploaded this file. |
| ile_name | VARCHAR(255) | NOT NULL | — | — | Original filename as uploaded (e.g. invoice_july_2025.pdf). |
| ile_name_normalized | VARCHAR(255) | NOT NULL | — | — | Sanitized filename with timestamps for storage uniqueness (e.g. invoice_july_2025_20250712_100000.pdf). |
| ile_path | VARCHAR(1024) | NOT NULL | — | — | Logical storage path (e.g. org-a1b2/2025/07/file.pdf or S3 key). |
| ile_url | VARCHAR(2048) | NULL | NULL | — | Public/temporary access URL (for pre-signed S3 URLs or CDN links). |
| storage_backend | VARCHAR(30) | NOT NULL | 'local' | CHECK (storage_backend IN ('local','aws_s3','azure_blob','gcs','backblaze_b2','digital_ocean_spaces','cloudflare_r2','minio','custom')) | Where the file bytes are stored. |
| storage_bucket | VARCHAR(100) | NULL | NULL | — | Bucket/container name for cloud backends. |
| storage_region | VARCHAR(50) | NULL | NULL | — | Cloud storage region (e.g. us-east-1). |
| mime_type | VARCHAR(255) | NOT NULL | — | — | MIME type (e.g. pplication/pdf, image/jpeg, ideo/mp4). |
| ile_category | VARCHAR(30) | NOT NULL | 'document' | CHECK (file_category IN ('image','document','video','audio','spreadsheet','presentation','archive','code','other')) | High-level file category for UI grouping and processing logic. |
| ile_size_bytes | BIGINT | NOT NULL | — | — | File size in bytes. |
| ile_size_human | VARCHAR(20) | NOT NULL | — | — | Human-readable size (e.g. "2.4 MB", "156 KB"). |
| checksum_md5 | CHAR(32) | NULL | NULL | — | MD5 checksum for integrity verification. |
| checksum_sha256 | CHAR(64) | NULL | NULL | — | SHA-256 checksum for integrity verification. |
| width | INTEGER | NULL | NULL | — | Image/video width in pixels (if applicable). |
| height | INTEGER | NULL | NULL | — | Image/video height in pixels (if applicable). |
| duration_seconds | DECIMAL(10, 3) | NULL | NULL | — | Video/audio duration in seconds (if applicable). |
| 	humbnail_path | VARCHAR(1024) | NULL | NULL | — | Path to auto-generated thumbnail (for images/videos). |
| 	humbnail_medium_path | VARCHAR(1024) | NULL | NULL | — | Path to medium-size thumbnail. |
| 	humbnail_large_path | VARCHAR(1024) | NULL | NULL | — | Path to large-size thumbnail. |
| entity_type | VARCHAR(50) | NULL | NULL | — | Polymorphic entity type this file is attached to (e.g. sset, 	icket, maintenance_order). |
| entity_id | UUID | NULL | NULL | — | Primary key of the attached entity. |
| ttachment_type | VARCHAR(50) | NOT NULL | 'attachment' | CHECK (attachment_type IN ('attachment','profile_photo','asset_photo','asset_document','invoice','receipt','contract','manual','certificate','report','evidence','thumbnail','logo','signature')) | Semantic role of this file attachment. |
| description | TEXT | NULL | NULL | — | User-provided description of the file content. |
| 	ags | TEXT[] | NULL | '{}` | — | User-provided tags for organizing files. |
| ersion | INTEGER | NOT NULL | 1 | — | Version number for file versioning. |
| parent_file_id | UUID | NULL | NULL | FK → file_storage.id ON DELETE SET NULL | For versioned files: ID of the original file. NULL for the first version. |
| is_public | BOOLEAN | NOT NULL | alse | — | Whether this file is publicly accessible (via CDN or direct URL). |
| ccess_level | VARCHAR(20) | NOT NULL | 'private' | CHECK (access_level IN ('private','internal','restricted','public')) | Access control level. |
| llowed_user_ids | UUID[] | NULL | '{}` | — | For ccess_level = 'restricted': specific user IDs who can access. |
| expires_at | TIMESTAMPTZ | NULL | NULL | — | When the file should be auto-deleted (e.g. temporary uploads). |
| content_type | VARCHAR(100) | NULL | NULL | — | Content disposition hint (e.g. inline for images, ttachment for PDFs). |
| metadata | JSONB | NULL | '{}'::jsonb | — | Extra file metadata: EXIF data for images, PDF page count, video codec info, etc. |
| is_virus_scanned | BOOLEAN | NOT NULL | alse | — | Whether the file has been virus-scanned. |
| irus_scan_result | VARCHAR(20) | NULL | NULL | CHECK (virus_scan_result IS NULL OR virus_scan_result IN ('clean','infected','error','pending')) | Result of virus scan. |
| irus_scanned_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of last virus scan. |
| download_count | INTEGER | NOT NULL |   | — | Number of times this file has been downloaded. |
| last_accessed_at | TIMESTAMPTZ | NULL | NULL | — | Last time this file was accessed/downloaded. |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who soft-deleted. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp (upload time). |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |

### Indexes

``sql
-- Primary file listing for an entity
CREATE INDEX idx_file_storage_entity ON file_storage (entity_type, entity_id, created_at DESC) WHERE is_deleted = false;

-- Organization file browser
CREATE INDEX idx_file_storage_org ON file_storage (organization_id, file_category, created_at DESC) WHERE is_deleted = false;

-- Upload history per user
CREATE INDEX idx_file_storage_uploader ON file_storage (uploaded_by, created_at DESC) WHERE uploaded_by IS NOT NULL AND is_deleted = false;

-- Version history
CREATE INDEX idx_file_storage_version ON file_storage (parent_file_id, version) WHERE parent_file_id IS NOT NULL;

-- File type filtering
CREATE INDEX idx_file_storage_mime ON file_storage (organization_id, mime_type) WHERE is_deleted = false;

-- File category filtering
CREATE INDEX idx_file_storage_category ON file_storage (organization_id, file_category, created_at DESC) WHERE is_deleted = false;

-- Attachment type filtering
CREATE INDEX idx_file_storage_attachment_type ON file_storage (attachment_type, entity_type, entity_id) WHERE is_deleted = false;

-- Expiration cleanup
CREATE INDEX idx_file_storage_expires ON file_storage (expires_at) WHERE expires_at IS NOT NULL AND is_deleted = false;

-- Virus scan queue
CREATE INDEX idx_file_storage_scan_queue ON file_storage (is_virus_scanned, created_at) WHERE is_virus_scanned = false AND is_deleted = false;

-- Public files
CREATE INDEX idx_file_storage_public ON file_storage (organization_id, file_category) WHERE is_public = true AND is_deleted = false;

-- Download analytics
CREATE INDEX idx_file_storage_downloads ON file_storage (download_count DESC) WHERE is_deleted = false;

-- Storage backend migration queries
CREATE INDEX idx_file_storage_backend ON file_storage (storage_backend, storage_bucket) WHERE is_deleted = false;

-- Tags search
CREATE INDEX idx_file_storage_tags ON file_storage USING GIN (tags) WHERE tags != '{}' AND is_deleted = false;
``

### Example Record

``json
{
  "id": "d1e2f3a4-6666-7888-d666-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "uploaded_by": "a1b2c3d4-0000-4000-8000-000000000010",
  "file_name": "dell_latitude_photo.jpg",
  "file_name_normalized": "dell_latitude_photo_20250712_100000.jpg",
  "file_path": "org-a1b2/2025/07/assets/a1b2c3d4/dell_latitude_photo_20250712_100000.jpg",
  "file_url": "https://cdn.example.com/org-a1b2/2025/07/assets/...?X-Amz-Signature=...",
  "storage_backend": "aws_s3",
  "storage_bucket": "assetflow-files-prod",
  "storage_region": "ap-south-1",
  "mime_type": "image/jpeg",
  "file_category": "image",
  "file_size_bytes": 2516582,
  "file_size_human": "2.4 MB",
  "checksum_md5": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  "checksum_sha256": "abc123def456abc123def456abc123def456abc123def456abc123def456abc1",
  "width": 4032,
  "height": 3024,
  "duration_seconds": null,
  "thumbnail_path": "org-a1b2/2025/07/assets/a1b2c3d4/thumbs/dell_latitude_photo_20250712_100000_sm.jpg",
  "thumbnail_medium_path": "org-a1b2/2025/07/assets/a1b2c3d4/thumbs/dell_latitude_photo_20250712_100000_md.jpg",
  "thumbnail_large_path": "org-a1b2/2025/07/assets/a1b2c3d4/thumbs/dell_latitude_photo_20250712_100000_lg.jpg",
  "entity_type": "asset",
  "entity_id": "a1b2c3d4-0000-4000-8000-000000000501",
  "attachment_type": "asset_photo",
  "description": "Front photo of Dell Latitude 5540 laptop assigned to Engineering.",
  "tags": ["laptop", "dell", "engineering", "front-view"],
  "version": 1,
  "parent_file_id": null,
  "is_public": false,
  "access_level": "private",
  "allowed_user_ids": null,
  "expires_at": null,
  "content_type": "inline",
  "metadata": {
    "exif": {
      "camera": "iPhone 15 Pro",
      "date_taken": "2025-07-12T09:45:00Z",
      "gps": {"lat": 28.6139, "lon": 77.2090}
    }
  },
  "is_virus_scanned": true,
  "virus_scan_result": "clean",
  "virus_scanned_at": "2025-07-12T10:01:00Z",
  "download_count": 3,
  "last_accessed_at": "2025-07-12T11:30:00Z",
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-07-12T10:00:00Z",
  "updated_at": "2025-07-12T10:01:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| ile_name_required | ile_name must not be empty. |
| ile_size_positive | ile_size_bytes must be > 0. |
| checksum_format | checksum_md5 must be 32 hex chars. checksum_sha256 must be 64 hex chars. |
| dimensions_positive | width and height must be > 0 if set. |
| duration_positive | duration_seconds must be > 0 if set. |
| ersion_positive | ersion must be >= 1. |
| parent_exists | parent_file_id, if set, must reference an existing non-deleted file. |
| entity_pair | If entity_type is set, entity_id must also be set (and vice versa). |
| expiry_after_creation | expires_at, if set, must be after created_at. |
| max_file_size | File size must not exceed the configured maximum (default 100MB for documents, 500MB for video). Enforced at application layer. |

### Business Rules

1. **Virus scanning:** All uploaded files must pass through a virus scan before being served. Files with irus_scan_result = 'infected' are quarantined and an alert is raised.
2. **Version management:** When a file is replaced, the old version is kept with is_deleted = true and linked via parent_file_id. Only the latest version is served by default.
3. **Thumbnail generation:** For images, the system auto-generates small (150px), medium (400px), and large (800px) thumbnails.
4. **Expiry cleanup:** A background job deletes files where expires_at < NOW() and removes the bytes from storage.
5. **Orphan cleanup:** Files with no referencing entity (entity_type IS NULL AND entity_id IS NULL) older than 30 days are flagged for review.
6. **CDN integration:** For cloud backends, ile_url is a pre-signed URL with configurable TTL (default 1 hour).

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One | File belongs to an organization. |
| users | Many-to-One (optional) | User who uploaded. |
| ile_storage (self) | Self-referencing | parent_file_id for file versioning. |
| ssets | Many-to-One (via entity) | When entity_type = 'asset'. |
| 	ickets | Many-to-One (via entity) | When entity_type = 'ticket'. |
| maintenance_orders | Many-to-One (via entity) | When entity_type = 'maintenance_order'. |

### Cascade Rules

- **Organization deleted:** CASCADE delete all files. Actual bytes in storage must be cleaned up by a background job before or after.
- **Uploader deleted:** uploaded_by is SET NULL.
- **Parent file deleted:** parent_file_id is SET NULL (child versions preserved).

### Soft Delete Behavior

Soft-deleted files are excluded from listing queries. The actual bytes in storage are NOT immediately deleted — a background job removes them after 30 days to support undo operations.

### Future Expansion

- **Cloud storage migration:** Migrate files between backends (e.g. local → S3) with zero downtime.
- **File collaboration:** Real-time collaborative document editing.
- **AI-powered tagging:** Auto-tag images using computer vision.
- **Watermarking:** Auto-apply watermarks to sensitive documents.
- **Encryption at rest:** Server-side encryption for cloud storage backends.
- **File streaming:** Progressive download for large video files.
- **Access audit trail:** Track who accessed/downloaded each file.

### Performance Notes

- **Storage backend abstraction:** The application layer must abstract storage operations behind a FileStorageService interface to support multiple backends.
- **CDN caching:** Serve thumbnails and public files via CDN with aggressive cache headers.
- **Thumbnail serving:** Serve thumbnails from a separate, highly-cached endpoint.
- **Large file uploads:** Use multipart/chunked upload for files > 10MB. Client-side pre-signing for cloud backends.
- **Partitioning:** Consider partitioning by created_at for organizations with > 1M files/year.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/files/upload | POST | Upload a new file (multipart/form-data). |
| /api/files/:id | GET | Get file metadata. |
| /api/files/:id/download | GET | Download the file (redirect to pre-signed URL). |
| /api/files/:id | DELETE | Soft-delete a file. |
| /api/files/:id/versions | GET | Get version history. |
| /api/files/entity/:type/:id | GET | Get all files attached to an entity. |
| /api/files/:id/thumbnail/:size | GET | Get a thumbnail (sm/md/lg). |
| /api/files/bulk-upload | POST | Upload multiple files at once. |

---
# Module 54–57: Tags & Attributes

---

## 54. 	ags

### Purpose

Reusable, hierarchical tags for labeling and categorizing assets, tickets, and other entities across the system.

### Business Requirement

Users need a flexible tagging system to create custom labels beyond the rigid category/hierarchy structure. Tags enable ad-hoc grouping (e.g. "Q3-audit", "needs-replacement", "vendor-x"), cross-cutting filters, and search. Tags must be manageable, mergeable, and support color-coding for visual distinction.

### Description

Each row represents a single tag definition. Tags are organization-scoped and can be organized into tag groups for structured browsing. They are applied to entities via the sset_tags junction table (and similar junction tables for other entity types). Tags support hierarchical nesting via parent_id.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| organization_id | UUID | NOT NULL | — | FK → organizations.id ON DELETE CASCADE | Organization scope. |
| 
ame | VARCHAR(100) | NOT NULL | — | UNIQUE (organization_id, name) | Tag display name (e.g. "Needs Replacement", "Q3-Audit"). |
| slug | VARCHAR(100) | NOT NULL | — | UNIQUE (organization_id, slug) | URL-safe slug (e.g. "needs-replacement", "q3-audit"). |
| description | TEXT | NULL | NULL | — | Description of what this tag represents. |
| color | VARCHAR(7) | NULL | NULL | — | Hex color code for badge rendering (e.g. #EF4444). |
| icon | VARCHAR(50) | NULL | NULL | — | Icon name for UI display. |
| 	ag_group | VARCHAR(50) | NULL | NULL | — | Logical grouping for the tag browser (e.g. "Priority", "Location", "Department"). |
| parent_id | UUID | NULL | NULL | FK → tags.id ON DELETE SET NULL | Parent tag for hierarchical nesting. |
| path | TEXT | NULL | NULL | — | Materialized path for fast tree queries (e.g. "/it-equipment/laptops/dell"). |
| depth | INTEGER | NOT NULL |   | — | Nesting depth (0 = root tag). |
| usage_count | INTEGER | NOT NULL |   | — | Denormalized count of entities using this tag. Updated via trigger or application. |
| is_system | BOOLEAN | NOT NULL | alse | — | True for tags that cannot be renamed or deleted. |
| is_active | BOOLEAN | NOT NULL | 	rue | — | Whether this tag is available for use. |
| created_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who created this tag. |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who soft-deleted. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |

### Indexes

``sql
CREATE UNIQUE INDEX uq_tags_org_name ON tags (organization_id, name) WHERE is_deleted = false;
CREATE UNIQUE INDEX uq_tags_org_slug ON tags (organization_id, slug) WHERE is_deleted = false;
CREATE INDEX idx_tags_org ON tags (organization_id, tag_group, name) WHERE is_active = true AND is_deleted = false;
CREATE INDEX idx_tags_parent ON tags (parent_id) WHERE parent_id IS NOT NULL AND is_deleted = false;
CREATE INDEX idx_tags_group ON tags (organization_id, tag_group) WHERE tag_group IS NOT NULL AND is_deleted = false;
CREATE INDEX idx_tags_usage ON tags (organization_id, usage_count DESC) WHERE is_deleted = false;
CREATE INDEX idx_tags_name_search ON tags USING GIN (to_tsvector('english', name)) WHERE is_deleted = false;
``

### Example Record

``json
{
  "id": "e2f3a4b5-7777-8999-e777-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "name": "Needs Replacement",
  "slug": "needs-replacement",
  "description": "Asset is malfunctioning and needs to be replaced.",
  "color": "#EF4444",
  "icon": "alert-triangle",
  "tag_group": "Condition",
  "parent_id": null,
  "path": "/needs-replacement",
  "depth": 0,
  "usage_count": 23,
  "is_system": false,
  "is_active": true,
  "created_by": "a1b2c3d4-0000-4000-8000-000000000010",
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-03-15T10:00:00Z",
  "updated_at": "2025-07-12T10:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| unique_org_name | (organization_id, name) must be unique among non-deleted rows. |
| unique_org_slug | (organization_id, slug) must be unique among non-deleted rows. |
| slug_format | slug must match ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$. |
| color_format | color, if set, must match ^#[0-9A-Fa-f]{6}$. |
| parent_no_cycle | parent_id must not create a circular reference (application-layer). |
| depth_consistent | depth should equal parent.depth + 1 (application-layer). |
| path_consistent | path should be parent.path + '/' + slug (application-layer). |

### Business Rules

1. **Auto-creation:** When a user types a new tag name during asset editing, the tag is automatically created.
2. **Usage count maintenance:** usage_count is maintained by triggers on junction tables (sset_tags, etc.) or by periodic reconciliation jobs.
3. **Tag merging:** Admins can merge tags — all references from the source tag are moved to the target, and the source is soft-deleted.
4. **Slug auto-generation:** The slug is auto-generated from 
ame using a transliteration library.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One | Tag belongs to an organization. |
| 	ags (self) | Self-referencing | parent_id for hierarchical tags. |
| sset_tags | One-to-Many | Junction table linking tags to assets. |
| users | Many-to-One (optional) | Creator. |

### Cascade Rules

- **Organization deleted:** CASCADE delete all tags.
- **Parent tag deleted:** parent_id is SET NULL (child tags become root tags).

### Soft Delete Behavior

Standard soft delete. Deleted tags are hidden from the tag picker but preserved on existing entity associations.

### Future Expansion

- Tag-based saved searches / filters.
- Tag analytics dashboard (most used, trending).
- AI-suggested tags based on asset descriptions.
- Tag permissions (restrict certain tags to certain roles).

### Performance Notes

- Moderate table (< 50,000 rows per org). Full-text search on name uses GIN index.
- usage_count denormalization avoids expensive COUNT queries.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/tags | GET | List tags with filtering (group, search, sort). |
| /api/tags/tree | GET | Get tag hierarchy as a tree structure. |
| /api/tags/popular | GET | Get tags sorted by usage_count. |
| /api/tags | POST | Create a new tag. |
| /api/tags/:id | PUT | Update tag properties. |
| /api/tags/:id | DELETE | Soft-delete a tag. |
| /api/tags/merge | POST | Merge two tags (admin). |

---

## 55. sset_tags

### Purpose

Many-to-many junction table linking assets to tags, with metadata about who applied each tag and when.

### Business Requirement

Assets need to be tagged with multiple tags for flexible categorization and filtering. The association itself carries metadata (who applied the tag, when, and why). This table enables the many-to-many relationship between assets and tags.

### Description

Each row represents a single tag applied to a single asset. A tag can be applied to many assets, and an asset can have many tags. The pplied_by and pplied_at columns provide audit context for the tagging action.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| sset_id | UUID | NOT NULL | — | FK → assets.id ON DELETE CASCADE | The asset being tagged. |
| 	ag_id | UUID | NOT NULL | — | FK → tags.id ON DELETE CASCADE | The tag being applied. |
| organization_id | UUID | NOT NULL | — | FK → organizations.id ON DELETE CASCADE | Denormalized org for fast filtering. |
| pplied_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who applied this tag. |
| pplied_at | TIMESTAMPTZ | NOT NULL | NOW() | — | When the tag was applied. |
| context | VARCHAR(100) | NULL | NULL | — | Context of the tagging (e.g. manual, ulk_import, uto_tag, workflow). |
| 
otes | TEXT | NULL | NULL | — | Optional note about why this tag was applied. |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who removed the tag. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |

### Indexes

``sql
CREATE UNIQUE INDEX uq_asset_tags_asset_tag ON asset_tags (asset_id, tag_id) WHERE is_deleted = false;
CREATE INDEX idx_asset_tags_asset ON asset_tags (asset_id) WHERE is_deleted = false;
CREATE INDEX idx_asset_tags_tag ON asset_tags (tag_id, applied_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_asset_tags_org ON asset_tags (organization_id, tag_id) WHERE is_deleted = false;
CREATE INDEX idx_asset_tags_applied_by ON asset_tags (applied_by) WHERE applied_by IS NOT NULL;
``

### Example Record

``json
{
  "id": "f3a4b5c6-8888-9000-f888-000000000001",
  "asset_id": "a1b2c3d4-0000-4000-8000-000000000501",
  "tag_id": "e2f3a4b5-7777-8999-e777-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "applied_by": "a1b2c3d4-0000-4000-8000-000000000010",
  "applied_at": "2025-07-12T10:00:00Z",
  "context": "manual",
  "notes": "Observed screen flickering during inspection.",
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-07-12T10:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| unique_asset_tag | (asset_id, tag_id) must be unique among non-deleted rows. |
| sset_required | sset_id must not be NULL. |
| 	ag_required | 	ag_id must not be NULL. |

### Business Rules

1. **Usage count update:** On INSERT, increment 	ags.usage_count for the referenced tag. On DELETE (soft), decrement.
2. **Bulk tagging:** The bulk tag API accepts an array of asset IDs and a tag ID, creating multiple rows in a single transaction.
3. **Auto-tagging rules:** The system can auto-apply tags based on configurable rules (e.g. tag "fragile" when category.name = 'Glassware').

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| ssets | Many-to-One | Tag applied to this asset. |
| 	ags | Many-to-One | The tag being applied. |
| organizations | Many-to-One | Denormalized org scope. |
| users | Many-to-One (optional) | User who applied the tag. |

### Cascade Rules

- **Asset deleted:** CASCADE delete all tag associations.
- **Tag deleted:** CASCADE delete all associations (tag removed from all assets).
- **Organization deleted:** CASCADE delete all associations.

### Soft Delete Behavior

Standard soft delete. Removing a tag from an asset is a soft delete of the junction row.

### Future Expansion

- Tag weight/priority per asset.
- Tag expiry (auto-remove tags after N days).
- Tag-based automation rules engine.

### Performance Notes

- Junction table. Size = total tags across all assets. Index on (tag_id, is_deleted) powers the "assets with this tag" query.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/assets/:id/tags | GET | Get all tags on an asset. |
| /api/assets/:id/tags | POST | Add tags to an asset. |
| /api/assets/:id/tags/:tagId | DELETE | Remove a tag from an asset. |
| /api/tags/:id/assets | GET | Get all assets with this tag. |
| /api/tags/bulk-apply | POST | Apply a tag to multiple assets. |

---

## 56. sset_labels

### Purpose

Physical label/plate data for assets — QR codes, barcodes, RFID labels, and printed asset tags that are physically attached to equipment.

### Business Requirement

Organizations print and attach physical labels to assets for identification, inventory counting, and check-in/check-out scanning. This table tracks the physical label metadata: which label is attached to which asset, the label's serial/number, format, print status, and scan history.

### Description

Each row represents a physical label associated with an asset. An asset can have multiple labels over its lifetime (e.g. replacement after damage). Labels have a label_type (QR code, barcode, RFID, NFC) and a unique label_number that is scanned during inventory and check-in/check-out operations.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| sset_id | UUID | NOT NULL | — | FK → assets.id ON DELETE CASCADE | The asset this label is attached to. |
| organization_id | UUID | NOT NULL | — | FK → organizations.id ON DELETE CASCADE | Organization scope. |
| label_type | VARCHAR(30) | NOT NULL | 'qr_code' | CHECK (label_type IN ('qr_code','barcode_128','barcode_39','rfid','nfc','custom')) | Type of physical label. |
| label_number | VARCHAR(100) | NOT NULL | — | UNIQUE (organization_id, label_number) | Unique number printed on the label (e.g. INV-2025-00432). |
| label_format | VARCHAR(20) | NOT NULL | 'standard' | CHECK (label_format IN ('standard','compact','large','custom')) | Print format/size. |
| label_data | TEXT | NULL | NULL | — | Encoded data for the label (e.g. URL, JSON payload). |
| qr_data | TEXT | NULL | NULL | — | Data encoded in QR code (typically a URL like https://assetflow.app/scan/INV-2025-00432). |
| is_active | BOOLEAN | NOT NULL | 	rue | — | Whether this label is currently attached to the asset. |
| is_printed | BOOLEAN | NOT NULL | alse | — | Whether the label has been physically printed. |
| print_count | INTEGER | NOT NULL |   | — | Number of times this label has been printed. |
| last_printed_at | TIMESTAMPTZ | NULL | NULL | — | Last print timestamp. |
| last_scanned_at | TIMESTAMPTZ | NULL | NULL | — | Last time this label was scanned. |
| scan_count | INTEGER | NOT NULL |   | — | Total scan count. |
| ttached_at | TIMESTAMPTZ | NOT NULL | NOW() | — | When this label was first attached to the asset. |
| detached_at | TIMESTAMPTZ | NULL | NULL | — | When this label was removed/replaced (NULL if still active). |
| detach_reason | VARCHAR(50) | NULL | NULL | CHECK (detach_reason IS NULL OR detach_reason IN ('damaged','lost','replaced','upgraded')) | Why the label was detached. |
| serial_number | VARCHAR(100) | NULL | NULL | — | Manufacturer serial number if different from label_number. |
| 
otes | TEXT | NULL | NULL | — | Additional notes about this label. |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who soft-deleted. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |
| created_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who created this label record. |

### Indexes

``sql
CREATE UNIQUE INDEX uq_asset_labels_org_number ON asset_labels (organization_id, label_number) WHERE is_deleted = false;
CREATE INDEX idx_asset_labels_asset ON asset_labels (asset_id, is_active) WHERE is_deleted = false;
CREATE INDEX idx_asset_labels_scan ON asset_labels (organization_id, label_number) WHERE is_active = true;
CREATE INDEX idx_asset_labels_active ON asset_labels (organization_id, label_type) WHERE is_active = true AND is_deleted = false;
CREATE INDEX idx_asset_labels_print_queue ON asset_labels (is_printed, created_at) WHERE is_printed = false AND is_active = true AND is_deleted = false;
``

### Example Record

``json
{
  "id": "a4b5c6d7-9999-0111-a999-000000000001",
  "asset_id": "a1b2c3d4-0000-4000-8000-000000000501",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "label_type": "qr_code",
  "label_number": "INV-2025-00432",
  "label_format": "standard",
  "label_data": "INV-2025-00432|Dell Latitude 5540|Engineering",
  "qr_data": "https://assetflow.example.com/scan/INV-2025-00432",
  "is_active": true,
  "is_printed": true,
  "print_count": 2,
  "last_printed_at": "2025-07-10T14:30:00Z",
  "last_scanned_at": "2025-07-12T09:15:00Z",
  "scan_count": 15,
  "attached_at": "2025-03-01T10:00:00Z",
  "detached_at": null,
  "detach_reason": null,
  "serial_number": "DL-5540-2024-78901",
  "notes": "Label placed on rear panel of laptop.",
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-03-01T10:00:00Z",
  "updated_at": "2025-07-12T09:15:00Z",
  "created_by": "a1b2c3d4-0000-4000-8000-000000000010"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| unique_org_label_number | (organization_id, label_number) must be unique among non-deleted rows. |
| label_number_format | label_number must match the org's label numbering pattern. |
| detach_requires_reason | If detached_at is set, detach_reason should also be set. |
| scan_count_positive | scan_count must be >= 0. |

### Business Rules

1. **Auto-generation:** When an asset is created, a label record is auto-generated with the next available label number from the org's sequence.
2. **Scan logging:** Every QR/barcode scan increments scan_count and updates last_scanned_at. Scans also create ctivity_logs entries.
3. **Label replacement:** When a label is damaged, the old label is marked as detached and a new label is created with a new label_number.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| ssets | Many-to-One | Label attached to this asset. |
| organizations | Many-to-One | Label belongs to an organization. |
| users | Many-to-One (optional) | Creator. |

### Cascade Rules

- **Asset deleted:** CASCADE delete all label records.
- **Organization deleted:** CASCADE delete all labels.

### Soft Delete Behavior

Standard soft delete. Deleted labels are excluded from scan lookups.

### Future Expansion

- Label template designer (drag-and-drop).
- Batch printing queue with printer integration.
- NFC label support for tap-to-scan.
- Label analytics (most scanned assets, scan heatmaps).

### Performance Notes

- Moderate table. Index on (organization_id, label_number) powers the scan lookup (must be fast).

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/labels/scan/:labelNumber | GET | Look up asset by scanning a label. |
| /api/assets/:id/labels | GET | Get all labels for an asset. |
| /api/labels/print/:id | POST | Mark label as printed. |
| /api/labels/batch-print | POST | Queue multiple labels for printing. |

---

## 57. custom_attributes

### Purpose

Dynamic, user-defined attribute schema for entities — allows organizations to extend the data model with custom fields without code changes.

### Business Requirement

Every organization has unique data requirements (e.g. "Department Code", "Warranty Provider", "Insurance Value", "Color", "RAM Size"). These attributes cannot be hardcoded into the schema. The system must allow admins to define custom attributes for any entity type, specify their data type, validation rules, and display order, and then capture values for each entity instance.

### Description

This table stores the **attribute definitions** — the schema. Each row defines one custom attribute (field) that can be added to an entity type. The actual **values** for each entity instance are stored in a separate custom_attribute_values table (or as a JSONB blob on the entity itself, depending on the chosen strategy). This separation keeps the schema flexible while maintaining type safety.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| organization_id | UUID | NOT NULL | — | FK → organizations.id ON DELETE CASCADE | Organization scope. |
| entity_type | VARCHAR(50) | NOT NULL | — | — | Entity type this attribute applies to (e.g. sset, 	icket, location). |
| ttribute_key | VARCHAR(100) | NOT NULL | — | UNIQUE (organization_id, entity_type, attribute_key) | Machine-readable key (e.g. warranty_provider, am_size_gb). |
| ttribute_name | VARCHAR(150) | NOT NULL | — | — | Human-readable label (e.g. "Warranty Provider", "RAM Size (GB)"). |
| description | TEXT | NULL | NULL | — | Help text shown alongside the field. |
| data_type | VARCHAR(20) | NOT NULL | — | CHECK (data_type IN ('string','text','integer','float','boolean','date','datetime','select','multi_select','url','email','phone','file','color','json')) | The data type determines the input control and validation. |
| default_value | TEXT | NULL | NULL | — | Default value for new entities. |
| placeholder | VARCHAR(200) | NULL | NULL | — | Placeholder text for the input field. |
| help_text | TEXT | NULL | NULL | — | Extended help text (shown as tooltip). |
| alidation_rules | JSONB | NULL | '{}'::jsonb | — | Type-specific validation: {"min": 0, "max": 100, "pattern": "^[A-Z]{2}-\\d{4}$", "min_length": 1, "max_length": 255}. |
| options | JSONB | NULL | '[]'::jsonb | — | For select/multi_select types: array of {value, label, color, sort_order}. |
| sort_order | INTEGER | NOT NULL |   | — | Display order in the entity form. |
| section | VARCHAR(100) | NULL | NULL | — | Form section grouping (e.g. "Hardware Specs", "Warranty Info"). |
| is_required | BOOLEAN | NOT NULL | alse | — | Whether a value must be provided. |
| is_searchable | BOOLEAN | NOT NULL | alse | — | Whether this attribute appears in search results and filters. |
| is_filterable | BOOLEAN | NOT NULL | alse | — | Whether this attribute can be used as a filter in list views. |
| is_visible_in_list | BOOLEAN | NOT NULL | alse | — | Whether this attribute is shown as a column in list/table views. |
| is_visible_in_detail | BOOLEAN | NOT NULL | 	rue | — | Whether this attribute is shown in the entity detail view. |
| is_system | BOOLEAN | NOT NULL | alse | — | True for attributes that cannot be renamed or deleted. |
| is_active | BOOLEAN | NOT NULL | 	rue | — | Whether this attribute is available for use. |
| max_values | INTEGER | NULL | NULL | — | For multi_select: maximum number of selections allowed. |
| ile_types | TEXT[] | NULL | '{}` | — | For ile type: allowed MIME type patterns (e.g. {'image/*', 'application/pdf'}). |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who soft-deleted. |
| created_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who created this attribute. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |

### Indexes

``sql
CREATE UNIQUE INDEX uq_custom_attrs_org_entity_key ON custom_attributes (organization_id, entity_type, attribute_key) WHERE is_deleted = false;
CREATE INDEX idx_custom_attrs_entity ON custom_attributes (organization_id, entity_type, sort_order) WHERE is_active = true AND is_deleted = false;
CREATE INDEX idx_custom_attrs_searchable ON custom_attributes (entity_type, is_searchable) WHERE is_searchable = true AND is_active = true AND is_deleted = false;
``

### Example Record

``json
{
  "id": "b5c6d7e8-aaaa-2222-baaa-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "entity_type": "asset",
  "attribute_key": "warranty_expiry",
  "attribute_name": "Warranty Expiry Date",
  "description": "Date when the manufacturer warranty expires.",
  "data_type": "date",
  "default_value": null,
  "placeholder": "Select date",
  "help_text": "Enter the warranty expiry date as shown on the purchase invoice.",
  "validation_rules": {"min": "2020-01-01", "max": "2035-12-31"},
  "options": null,
  "sort_order": 15,
  "section": "Warranty Info",
  "is_required": false,
  "is_searchable": true,
  "is_filterable": true,
  "is_visible_in_list": true,
  "is_visible_in_detail": true,
  "is_system": false,
  "is_active": true,
  "max_values": null,
  "file_types": null,
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_by": "a1b2c3d4-0000-4000-8000-000000000001",
  "created_at": "2025-04-10T10:00:00Z",
  "updated_at": "2025-04-10T10:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| unique_org_entity_key | (organization_id, entity_type, attribute_key) must be unique among non-deleted rows. |
| data_type_valid | data_type must be one of the CHECK enum values. |
| options_for_select | If data_type IN ('select', 'multi_select'), options must be a non-empty array. |
| ile_types_for_file | If data_type = 'file', ile_types should be set. |
| alidation_rules_valid_json | alidation_rules must be valid JSON matching the data type's schema. |

### Business Rules

1. **Dynamic forms:** The application renders entity forms dynamically based on active custom attributes for that entity type.
2. **Value storage:** Custom attribute values are stored in a custom_attribute_values junction table with columns (entity_type, entity_id, attribute_id, value_string, value_json).
3. **Search indexing:** Attributes with is_searchable = true are indexed in a full-text search index (Elasticsearch or PostgreSQL GIN).
4. **Migration:** When an attribute is deleted, existing values are preserved but hidden. When reactivated, values reappear.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One | Attribute belongs to an organization. |
| custom_attribute_values | One-to-Many | Actual values for this attribute across entities. |
| users | Many-to-One (optional) | Creator. |

### Cascade Rules

- **Organization deleted:** CASCADE delete all custom attributes and their values.
- **Attribute deleted:** CASCADE delete all values for that attribute.

### Soft Delete Behavior

Standard soft delete. Deleted attributes are hidden from forms but values are preserved.

### Future Expansion

- Formula/calculated attributes (computed from other attributes).
- Attribute groups/sections with conditional visibility.
- Attribute versioning (track changes to attribute definitions).
- Import/export of attribute schemas across organizations.
- AI-powered attribute suggestions based on entity descriptions.

### Performance Notes

- Small table (< 500 attributes per org). Cache attribute definitions in memory.
- The custom_attribute_values table may grow large — consider JSONB column on entities as an alternative for low-cardinality attributes.
- For search-heavy use cases, index searchable attributes in Elasticsearch.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/custom-attributes/:entityType | GET | Get all active attributes for an entity type. |
| /api/custom-attributes | POST | Create a new attribute definition (admin). |
| /api/custom-attributes/:id | PUT | Update attribute definition (admin). |
| /api/custom-attributes/:id | DELETE | Soft-delete an attribute (admin). |
| /api/custom-attributes/:id/reorder | PUT | Update sort_order for an attribute. |

---
# Module 58â€“66: Security & Future

---

## 58. `api_tokens`

### Purpose

Stores API access tokens for programmatic integrations, mobile apps, third-party connectors, and service-to-service authentication.

### Business Requirement

AssetFlow must support API integrations with external systems (ERP, HRIS, procurement, IoT platforms). Each integration requires a scoped, revocable token with rate limiting, expiry, and audit capabilities. Tokens must follow security best practices: hashed storage, minimal scope, rotation support, and instant revocation.

### Description

Each row represents an API token (also called API key or PAT â€” Personal Access Token). The actual token value is NEVER stored in plaintext â€” only a SHA-256 hash of the token is persisted. The plaintext token is shown to the user exactly once at creation time. Tokens have granular scopes (permissions), rate limits, and expiry dates. All API calls authenticated with a token are logged in `activity_logs`.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | `PRIMARY KEY` | Unique identifier. |
| `organization_id` | `UUID` | NOT NULL | â€” | `FK â†’ organizations.id ON DELETE CASCADE` | Organization this token belongs to. |
| `user_id` | `UUID` | NOT NULL | â€” | `FK â†’ users.id ON DELETE CASCADE` | User who created this token. |
| `name` | `VARCHAR(100)` | NOT NULL | â€” | â€” | Descriptive name (e.g. "ERP Integration", "Mobile App"). |
| `token_prefix` | `VARCHAR(10)` | NOT NULL | â€” | â€” | First 8 chars of the token for identification (e.g. `af_live_`). |
| `token_hash` | `CHAR(64)` | NOT NULL | â€” | `UNIQUE` | SHA-256 hash of the full token. Used for authentication lookup. |
| `token_type` | `VARCHAR(20)` | NOT NULL | `'personal'` | `CHECK (token_type IN ('personal','service','oauth','integration','webhook'))` | Type of token. |
| `scopes` | `TEXT[]` | NOT NULL | â€” | â€” | Granular permissions (e.g. `{'assets:read', 'assets:write', 'tickets:read'}`). |
| `rate_limit` | `INTEGER` | NOT NULL | `1000` | â€” | Maximum API calls per hour. |
| `rate_limit_window` | `VARCHAR(10)` | NOT NULL | `'hour'` | `CHECK (rate_limit_window IN ('second','minute','hour','day'))` | Time window for rate limiting. |
| `rate_limit_current` | `INTEGER` | NOT NULL | `0` | â€” | Current count in the current window. |
| `rate_limit_reset_at` | `TIMESTAMPTZ` | NULL | NULL | â€” | When the rate limit counter resets. |
| `ip_whitelist` | `TEXT[]` | NULL | `'{}`` | â€” | Allowed source IPs. Empty means any IP is allowed. |
| `expires_at` | `TIMESTAMPTZ` | NULL | NULL | â€” | Token expiry. NULL = no expiry (not recommended). |
| `last_used_at` | `TIMESTAMPTZ` | NULL | NULL | â€” | When this token was last used. |
| `last_used_ip` | `INET` | NULL | NULL | â€” | IP address of the last API call. |
| `use_count` | `INTEGER` | NOT NULL | `0` | â€” | Total number of API calls made with this token. |
| `is_active` | `BOOLEAN` | NOT NULL | `true` | â€” | Whether this token is currently valid. |
| `revoked_at` | `TIMESTAMPTZ` | NULL | NULL | â€” | When the token was revoked. |
| `revoked_by` | `UUID` | NULL | NULL | `FK â†’ users.id ON DELETE SET NULL` | User who revoked this token. |
| `revoke_reason` | `TEXT` | NULL | NULL | â€” | Reason for revocation (for audit). |
| `metadata` | `JSONB` | NULL | `'{}'::jsonb` | â€” | Extra data (e.g. `{"integration": "sap_erp"}`). |
| `is_deleted` | `BOOLEAN` | NOT NULL | `false` | â€” | Soft-delete flag. |
| `deleted_at` | `TIMESTAMPTZ` | NULL | NULL | â€” | Timestamp of soft delete. |
| `deleted_by` | `UUID` | NULL | NULL | `FK â†’ users.id ON DELETE SET NULL` | User who soft-deleted. |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | â€” | Row creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | â€” | Last modification timestamp. |

### Indexes

````sql
CREATE UNIQUE INDEX uq_api_tokens_hash ON api_tokens (token_hash) WHERE is_deleted = false;
CREATE INDEX idx_api_tokens_org ON api_tokens (organization_id, is_active) WHERE is_deleted = false;
CREATE INDEX idx_api_tokens_user ON api_tokens (user_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_api_tokens_active ON api_tokens (token_hash) WHERE is_active = true AND is_deleted = false;
CREATE INDEX idx_api_tokens_expiry ON api_tokens (expires_at) WHERE expires_at IS NOT NULL AND is_active = true AND is_deleted = false;
CREATE INDEX idx_api_tokens_rate_limit ON api_tokens (rate_limit_reset_at) WHERE rate_limit_current > 0;
````

### Example Record

````json
{
  "id": "c6d7e8f9-bbbb-3333-cbbb-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "user_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "name": "SAP ERP Integration",
  "token_prefix": "af_live_",
  "token_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "token_type": "integration",
  "scopes": ["assets:read", "assets:write", "maintenance:read", "maintenance:write"],
  "rate_limit": 5000,
  "rate_limit_window": "hour",
  "rate_limit_current": 234,
  "rate_limit_reset_at": "2025-07-12T11:00:00Z",
  "ip_whitelist": ["10.0.0.0/8", "192.168.1.0/24"],
  "expires_at": "2026-01-12T00:00:00Z",
  "last_used_at": "2025-07-12T10:45:00Z",
  "last_used_ip": "10.0.1.50",
  "use_count": 15234,
  "is_active": true,
  "revoked_at": null,
  "revoked_by": null,
  "revoke_reason": null,
  "metadata": {"integration": "sap_erp", "environment": "production"},
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-07-12T10:45:00Z"
}
````

### Validation Rules

| Rule | Description |
|------|-------------|
| `token_hash_unique` | `token_hash` must be globally unique. |
| `scopes_not_empty` | `scopes` must contain at least one value. |
| `rate_limit_positive` | `rate_limit` must be > 0. |
| `expiry_after_creation` | `expires_at`, if set, must be after `created_at`. |
| `ip_whitelist_valid` | Each entry in `ip_whitelist` must be a valid IP or CIDR range. |

### Business Rules

1. **One-time display:** The plaintext token is returned exactly once in the creation response.
2. **Hash-based lookup:** Authentication works by hashing the incoming token and looking up `token_hash`.
3. **Scope enforcement:** Before executing an API action, the system checks that the token's `scopes` include the required permission.
4. **Rate limiting:** The `rate_limit_current` counter is incremented on each API call. When it exceeds `rate_limit`, the API returns `429 Too Many Requests`.
5. **Auto-expiry:** A background job deactivates tokens where `expires_at < NOW()`.
6. **Instant revocation:** Setting `is_active = false` immediately invalidates the token.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| `organizations` | Many-to-One | Token belongs to an organization. |
| `users` | Many-to-One | Token creator/owner. |

### Cascade Rules

- **Organization deleted:** CASCADE delete all tokens.
- **User deleted:** CASCADE delete all tokens created by that user.

### Soft Delete Behavior

Standard soft delete. Revoked/deleted tokens are excluded from active token lookups.

### Future Expansion

- OAuth 2.0 authorization flow.
- Token scopes management UI.
- Token usage analytics dashboard.
- Short-lived tokens with auto-refresh.
- Mutual TLS (mTLS) certificate-based authentication.

### Performance Notes

- Small table (< 10,000 rows per org). The `token_hash` index is critical for auth performance.
- Rate limit counters should use Redis for atomic increments; the DB column is updated periodically.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tokens` | GET | List current user's tokens. |
| `/api/tokens` | POST | Create a new token (returns plaintext once). |
| `/api/tokens/:id` | DELETE | Revoke a token. |
| `/api/tokens/:id` | PATCH | Update token name or scopes. |

---

## 59. `future_iot_sensors`

### Purpose

Registry of IoT sensors and devices deployed across facilities for real-time asset monitoring, environmental sensing, and predictive maintenance.

### Business Requirement

When IoT integration is activated, the system must register and manage a fleet of sensors (temperature, humidity, vibration, GPS, RFID readers, barcode scanners). Each sensor has metadata, configuration, calibration status, and a communication protocol.

### Description

Each row represents a single IoT sensor/device registered in the system. This table is the device registry â€” it stores static metadata. Time-series readings from sensors are stored in `future_iot_readings`. The table is designed to be production-ready when IoT features are activated, with no schema changes required.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | `PRIMARY KEY` | Unique identifier. |
| `organization_id` | `UUID` | NOT NULL | â€” | `FK â†’ organizations.id ON DELETE CASCADE` | Organization that owns this sensor. |
| `sensor_name` | `VARCHAR(150)` | NOT NULL | â€” | â€” | Human-readable name (e.g. "Warehouse A - Temp Sensor 3"). |
| `sensor_code` | `VARCHAR(50)` | NOT NULL | â€” | `UNIQUE (organization_id, sensor_code)` | Machine-readable identifier (e.g. `TEMP-WH-A-003`). |
| `sensor_type` | `VARCHAR(30)` | NOT NULL | â€” | `CHECK (sensor_type IN ('temperature','humidity','vibration','pressure','gps','rfid_reader','barcode_scanner','camera','smoke','co2','motion','proximity','light','noise','power_meter','custom'))` | Type of sensor/measurement. |
| `protocol` | `VARCHAR(30)` | NOT NULL | â€” | `CHECK (protocol IN ('mqtt','http_rest','coap','bluetooth_le','zigbee','lora','wifi','ethernet','serial','nb_iot','custom'))` | Communication protocol. |
| `manufacturer` | `VARCHAR(100)` | NULL | NULL | â€” | Sensor manufacturer. |
| `model` | `VARCHAR(100)` | NULL | NULL | â€” | Sensor model number. |
| `firmware_version` | `VARCHAR(50)` | NULL | NULL | â€” | Current firmware version. |
| `serial_number` | `VARCHAR(100)` | NULL | NULL | `UNIQUE` | Manufacturer serial number. |
| `mac_address` | `MACADDR` | NULL | NULL | `UNIQUE` | Network MAC address. |
| `endpoint_url` | `VARCHAR(512)` | NULL | NULL | â€” | MQTT topic or REST endpoint for data ingestion. |
| `api_key` | `VARCHAR(255)` | NULL | NULL | â€” | Encrypted authentication key for the sensor. |
| `location_id` | `UUID` | NULL | NULL | `FK â†’ locations.id ON DELETE SET NULL` | Physical location where the sensor is deployed. |
| `asset_id` | `UUID` | NULL | NULL | `FK â†’ assets.id ON DELETE SET NULL` | Asset this sensor is monitoring. |
| `department_id` | `UUID` | NULL | NULL | `FK â†’ departments.id ON DELETE SET NULL` | Department responsible for this sensor. |
| `installation_date` | `DATE` | NULL | NULL | â€” | When the sensor was installed. |
| `warranty_expiry` | `DATE` | NULL | NULL | â€” | Sensor warranty expiry date. |
| `calibration_date` | `DATE` | NULL | NULL | â€” | Last calibration date. |
| `calibration_due` | `DATE` | NULL | NULL | â€” | Next calibration due date. |
| `calibration_interval_days` | `INTEGER` | NULL | `365` | â€” | Days between calibrations. |
| `measurement_unit` | `VARCHAR(20)` | NULL | NULL | â€” | Unit of measurement (e.g. `Â°C`, `%RH`, `mm/s`). |
| `min_threshold` | `DECIMAL(10, 4)` | NULL | NULL | â€” | Minimum acceptable reading. |
| `max_threshold` | `DECIMAL(10, 4)` | NULL | NULL | â€” | Maximum acceptable reading. |
| `reading_interval_seconds` | `INTEGER` | NOT NULL | `60` | â€” | How often the sensor sends readings. |
| `battery_level` | `SMALLINT` | NULL | NULL | â€” | Current battery level (0-100). |
| `signal_strength` | `INTEGER` | NULL | NULL | â€” | Network signal strength (RSSI in dBm). |
| `status` | `VARCHAR(20)` | NOT NULL | `'active'` | `CHECK (status IN ('active','inactive','maintenance','decommissioned','offline','error'))` | Current operational status. |
| `last_reading_at` | `TIMESTAMPTZ` | NULL | NULL | â€” | Timestamp of the most recent reading. |
| `last_heartbeat_at` | `TIMESTAMPTZ` | NULL | NULL | â€” | Most recent heartbeat/keepalive. |
| `metadata` | `JSONB` | NULL | `'{}'::jsonb` | â€” | Sensor-specific configuration. |
| `is_deleted` | `BOOLEAN` | NOT NULL | `false` | â€” | Soft-delete flag. |
| `deleted_at` | `TIMESTAMPTZ` | NULL | NULL | â€” | Timestamp of soft delete. |
| `deleted_by` | `UUID` | NULL | NULL | `FK â†’ users.id ON DELETE SET NULL` | User who soft-deleted. |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | â€” | Row creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | â€” | Last modification timestamp. |

### Indexes

````sql
CREATE UNIQUE INDEX uq_iot_sensors_org_code ON future_iot_sensors (organization_id, sensor_code) WHERE is_deleted = false;
CREATE INDEX idx_iot_sensors_org ON future_iot_sensors (organization_id, sensor_type, status);
CREATE INDEX idx_iot_sensors_location ON future_iot_sensors (location_id) WHERE location_id IS NOT NULL AND is_deleted = false;
CREATE INDEX idx_iot_sensors_asset ON future_iot_sensors (asset_id) WHERE asset_id IS NOT NULL AND is_deleted = false;
CREATE INDEX idx_iot_sensors_status ON future_iot_sensors (organization_id, status) WHERE is_deleted = false;
CREATE INDEX idx_iot_sensors_calibration ON future_iot_sensors (calibration_due) WHERE calibration_due IS NOT NULL AND status = 'active' AND is_deleted = false;
CREATE INDEX idx_iot_sensors_offline ON future_iot_sensors (last_heartbeat_at) WHERE status = 'active' AND is_deleted = false;
````

### Example Record

````json
{
  "id": "d7e8f9a0-cccc-4444-dccc-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "sensor_name": "Warehouse A - Temperature Sensor 3",
  "sensor_code": "TEMP-WH-A-003",
  "sensor_type": "temperature",
  "protocol": "mqtt",
  "manufacturer": "Sensirion",
  "model": "SHT40",
  "firmware_version": "2.1.4",
  "serial_number": "SH-2025-98765",
  "mac_address": "AA:BB:CC:DD:EE:03",
  "endpoint_url": "mqtt://iot.assetflow.example.com/sensors/TEMP-WH-A-003/data",
  "api_key": null,
  "location_id": "a1b2c3d4-0000-4000-8000-000000000701",
  "asset_id": null,
  "department_id": "a1b2c3d4-0000-4000-8000-000000000901",
  "installation_date": "2025-03-15",
  "warranty_expiry": "2027-03-15",
  "calibration_date": "2025-03-15",
  "calibration_due": "2026-03-15",
  "calibration_interval_days": 365,
  "measurement_unit": "Â°C",
  "min_threshold": 5.0000,
  "max_threshold": 40.0000,
  "reading_interval_seconds": 30,
  "battery_level": null,
  "signal_strength": -45,
  "status": "active",
  "last_reading_at": "2025-07-12T10:59:30Z",
  "last_heartbeat_at": "2025-07-12T10:59:30Z",
  "metadata": {"accuracy": "Â±0.2Â°C", "range": "-40Â°C to 125Â°C"},
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-03-15T10:00:00Z",
  "updated_at": "2025-07-12T10:59:30Z"
}
````

### Validation Rules

| Rule | Description |
|------|-------------|
| `unique_org_code` | `(organization_id, sensor_code)` must be unique. |
| `serial_unique` | `serial_number` must be globally unique if set. |
| `thresholds_valid` | If both min and max thresholds are set, `min < max`. |
| `calibration_dates_valid` | `calibration_due` must be after `calibration_date` if both are set. |

### Business Rules

1. **Auto-registration:** Sensors can self-register via MQTT/REST API.
2. **Offline detection:** A background job checks `last_heartbeat_at` and marks sensors as `offline` if no heartbeat received within 3x reading_interval_seconds.
3. **Threshold alerts:** When a reading exceeds thresholds, the system creates an alert notification.
4. **Calibration reminders:** The system sends notifications when `calibration_due` is approaching.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| `organizations` | Many-to-One | Sensor belongs to an organization. |
| `locations` | Many-to-One (optional) | Physical deployment location. |
| `assets` | Many-to-One (optional) | Asset being monitored. |
| `departments` | Many-to-One (optional) | Responsible department. |
| `future_iot_readings` | One-to-Many | Time-series readings from this sensor. |

### Cascade Rules

- **Organization deleted:** CASCADE delete all sensors.
- **Location deleted:** SET NULL on `location_id`.
- **Asset deleted:** SET NULL on `asset_id`.

### Soft Delete Behavior

Standard soft delete. Decommissioned sensors are soft-deleted to preserve historical readings.

### Future Expansion

- Sensor group/fleet management.
- Remote firmware update scheduling.
- Predictive maintenance model training from sensor data.
- Multi-tenant sensor sharing.

### Performance Notes

- Moderate table (< 100,000 sensors per org).
- Calibration due date index powers the reminder cron job.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/iot/sensors` | GET | List sensors with filtering. |
| `/api/iot/sensors/:id` | GET | Get sensor details. |
| `/api/iot/sensors` | POST | Register a new sensor. |
| `/api/iot/sensors/:id` | PUT | Update sensor config. |
| `/api/iot/sensors/:id` | DELETE | Decommission a sensor. |

---

## 60. `future_iot_readings`

### Purpose

Time-series storage for IoT sensor readings â€” temperature, humidity, vibration, and all other sensor measurements, optimized for high-throughput writes and time-range queries.

### Business Requirement

IoT sensors generate continuous data streams that must be ingested, stored, and queried efficiently. The system must support high write throughput (thousands of readings per second), time-range queries for dashboards and analytics, aggregation for reports, and retention policies for storage management.

### Description

Each row represents a single reading from a single sensor at a specific timestamp. This table is designed for append-only writes and time-range reads. It should be partitioned by time (monthly) in production.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | `PRIMARY KEY` | Unique identifier. |
| `sensor_id` | `UUID` | NOT NULL | â€” | `FK â†’ future_iot_sensors.id ON DELETE CASCADE` | Source sensor. |
| `organization_id` | `UUID` | NOT NULL | â€” | `FK â†’ organizations.id ON DELETE CASCADE` | Denormalized for partition pruning. |
| `reading_timestamp` | `TIMESTAMPTZ` | NOT NULL | â€” | â€” | When the reading was taken. |
| `ingested_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | â€” | When the reading was ingested by AssetFlow. |
| `value_numeric` | `DECIMAL(15, 6)` | NULL | NULL | â€” | Numeric measurement value. |
| `value_string` | `VARCHAR(255)` | NULL | NULL | â€” | String value for non-numeric sensors. |
| `value_boolean` | `BOOLEAN` | NULL | NULL | â€” | Boolean value for binary sensors. |
| `value_json` | `JSONB` | NULL | NULL | â€” | Complex multi-value readings. |
| `unit` | `VARCHAR(20)` | NULL | NULL | â€” | Unit of measurement. |
| `quality_score` | `SMALLINT` | NULL | NULL | â€” | Data quality score (0-100). |
| `is_valid` | `BOOLEAN` | NOT NULL | `true` | â€” | Whether the reading passed validation. |
| `validation_errors` | `TEXT[]` | NULL | `'{}`` | â€” | Validation error codes. |
| `battery_level` | `SMALLINT` | NULL | NULL | â€” | Sensor battery level at time of reading. |
| `signal_strength` | `INTEGER` | NULL | NULL | â€” | Signal strength (RSSI) at time of reading. |
| `sequence_number` | `BIGINT` | NULL | NULL | â€” | Sensor-side sequence number for deduplication. |
| `batch_id` | `UUID` | NULL | NULL | â€” | Groups readings from the same ingestion batch. |
| `metadata` | `JSONB` | NULL | `'{}'::jsonb` | â€” | Extra data. |

### Indexes

````sql
CREATE INDEX idx_iot_readings_sensor_time ON future_iot_readings (sensor_id, reading_timestamp DESC);
CREATE INDEX idx_iot_readings_org_time ON future_iot_readings (organization_id, reading_timestamp DESC);
CREATE INDEX idx_iot_readings_valid ON future_iot_readings (sensor_id, is_valid, reading_timestamp DESC) WHERE is_valid = false;
CREATE INDEX idx_iot_readings_batch ON future_iot_readings (batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_iot_readings_sequence ON future_iot_readings (sensor_id, sequence_number) WHERE sequence_number IS NOT NULL;
````

### Example Record

````json
{
  "id": "e8f9a0b1-dddd-5555-eddd-000000000001",
  "sensor_id": "d7e8f9a0-cccc-4444-dccc-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "reading_timestamp": "2025-07-12T10:59:30Z",
  "ingested_at": "2025-07-12T10:59:31Z",
  "value_numeric": 23.450000,
  "value_string": null,
  "value_boolean": null,
  "value_json": null,
  "unit": "Â°C",
  "quality_score": 98,
  "is_valid": true,
  "validation_errors": [],
  "battery_level": null,
  "signal_strength": -45,
  "sequence_number": 1523456,
  "batch_id": "f9a0b1c2-eeee-6666-fee0-000000000001",
  "metadata": {}
}
````

### Validation Rules

| Rule | Description |
|------|-------------|
| `sensor_required` | `sensor_id` must not be NULL. |
| `timestamp_required` | `reading_timestamp` must not be NULL. |
| `at_least_one_value` | At least one value column must be non-NULL. |
| `sequence_unique_per_sensor` | `sequence_number` must be unique per `sensor_id`. |

### Business Rules

1. **Append-only:** No UPDATE or DELETE operations (enforce via trigger like `activity_logs`).
2. **Retention:** Readings older than the configured retention period are archived to cold storage.
3. **Downsampling:** A background job creates hourly/daily aggregated summaries.
4. **Anomaly detection:** Readings that exceed thresholds trigger alert workflows.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| `future_iot_sensors` | Many-to-One | Source sensor. |
| `organizations` | Many-to-One | Denormalized org scope. |

### Cascade Rules

- **Sensor deleted:** CASCADE delete all readings.
- **Organization deleted:** CASCADE delete all readings.

### Soft Delete Behavior

**Not applicable.** Append-only table. Old data is purged by retention policies.

### Future Expansion

- TimescaleDB hypertable for automatic partitioning and compression.
- Continuous aggregates for real-time dashboards.
- Edge computing: pre-process readings on gateway before ingestion.

### Performance Notes

- **Write throughput:** Target 50,000+ inserts/second. Use batch inserts.
- **Partitioning:** Mandatory. Partition by `reading_timestamp` (monthly).
- **Storage:** ~200 bytes per row. At 1000 sensors x 1 reading/minute = ~52M rows/year.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/iot/readings` | POST | Ingest readings (used by sensors/gateways). |
| `/api/iot/sensors/:id/readings` | GET | Get readings with time range and aggregation. |
| `/api/iot/readings/aggregate` | GET | Get aggregated data over time buckets. |

---

## 61. uture_rfid_tags

### Purpose

Registry of RFID tags attached to assets for automated inventory tracking, check-in/check-out, and location monitoring via RFID readers.

### Business Requirement

RFID-tagged assets can be automatically inventoried by walking through a facility with an RFID reader, eliminating manual scanning. The system must track which RFID tags are assigned to which assets, their read history, and support bulk operations for RFID-based workflows.

### Description

Each row represents an RFID tag that has been associated with an asset. The epc (Electronic Product Code) is the unique identifier encoded on the physical tag. RFID readers in the facility detect tags and report their presence, creating a location history for each asset.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| organization_id | UUID | NOT NULL | — | FK → organizations.id ON DELETE CASCADE | Organization scope. |
| sset_id | UUID | NOT NULL | — | FK → assets.id ON DELETE CASCADE | The asset this RFID tag is attached to. |
| epc | VARCHAR(64) | NOT NULL | — | UNIQUE (organization_id, epc) | Electronic Product Code — the unique ID on the physical RFID tag. |
| 	id | VARCHAR(64) | NULL | NULL | — | Tag ID (manufacturer-assigned). |
| 	ag_type | VARCHAR(20) | NOT NULL | 'uhf' | CHECK (tag_type IN ('uhf','hf','lf','passive','active','semi_passive')) | RFID technology type. |
| 	ag_memory | JSONB | NULL | '{}'::jsonb | — | Data stored on the tag's memory banks (EPC, TID, user memory). |
| requency | VARCHAR(20) | NULL | NULL | — | Operating frequency (e.g. 860-960 MHz for UHF, 13.56 MHz for HF). |
| ead_range_meters | DECIMAL(5, 2) | NULL | NULL | — | Maximum read range in meters. |
| is_active | BOOLEAN | NOT NULL | 	rue | — | Whether this RFID tag is currently in use. |
| last_read_at | TIMESTAMPTZ | NULL | NULL | — | When this tag was last detected by a reader. |
| last_reader_id | UUID | NULL | NULL | FK → future_iot_sensors.id ON DELETE SET NULL | Last RFID reader that detected this tag. |
| ead_count | INTEGER | NOT NULL |   | — | Total number of times this tag has been read. |
| ttached_at | TIMESTAMPTZ | NOT NULL | NOW() | — | When this tag was assigned to the asset. |
| detached_at | TIMESTAMPTZ | NULL | NULL | — | When this tag was removed from the asset. |
| status | VARCHAR(20) | NOT NULL | 'active' | CHECK (status IN ('active','inactive','lost','damaged','retired')) | Tag lifecycle status. |
| 
otes | TEXT | NULL | NULL | — | Additional notes about this tag. |
| metadata | JSONB | NULL | '{}'::jsonb | — | Extra tag data (e.g. manufacturer, purchase date, cost). |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who soft-deleted. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Row creation timestamp. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |

### Indexes

``sql
CREATE UNIQUE INDEX uq_rfid_tags_org_epc ON future_rfid_tags (organization_id, epc) WHERE is_deleted = false;
CREATE INDEX idx_rfid_tags_asset ON future_rfid_tags (asset_id, status) WHERE is_deleted = false;
CREATE INDEX idx_rfid_tags_status ON future_rfid_tags (organization_id, status) WHERE is_deleted = false;
CREATE INDEX idx_rfid_tags_last_read ON future_rfid_tags (last_read_at DESC) WHERE status = 'active';
CREATE INDEX idx_rfid_tags_reader ON future_rfid_tags (last_reader_id) WHERE last_reader_id IS NOT NULL AND status = 'active';
``

### Example Record

``json
{
  "id": "a0b1c2d3-ffff-7777-aaaa-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "asset_id": "a1b2c3d4-0000-4000-8000-000000000501",
  "epc": "E2801160200020F184390B6D",
  "tid": "E2801160200020F184390B6D00000001",
  "tag_type": "uhf",
  "tag_memory": {"epc_bank": "E2801160200020F184390B6D", "user_memory": "INV-2025-00432"},
  "frequency": "860-960 MHz",
  "read_range_meters": 8.50,
  "is_active": true,
  "last_read_at": "2025-07-12T10:30:00Z",
  "last_reader_id": "d7e8f9a0-cccc-4444-dccc-000000000001",
  "read_count": 847,
  "attached_at": "2025-03-01T10:00:00Z",
  "detached_at": null,
  "status": "active",
  "notes": "Attached to rear panel of Dell Latitude 5540.",
  "metadata": {"manufacturer": "Impinj", "model": "Monza R6", "cost": ".15"},
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-03-01T10:00:00Z",
  "updated_at": "2025-07-12T10:30:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| unique_org_epc | (organization_id, epc) must be unique. |
| epc_format | epc must match ^[0-9A-Fa-f]+$ and be 24 characters (96-bit EPC). |
| ead_range_positive | ead_range_meters must be > 0 if set. |

### Business Rules

1. **Auto-assignment:** When an RFID tag is read for the first time near an asset with a matching barcode/QR scan, the system suggests auto-assignment.
2. **Bulk inventory:** RFID readers detect all tags in range. The system compares detected tags against expected locations to identify misplaced assets.
3. **Movement tracking:** Each RFID read creates a location log entry, enabling asset movement heatmaps.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One | Tag belongs to an organization. |
| ssets | Many-to-One | Tag attached to this asset. |
| uture_iot_sensors | Many-to-One (optional) | Last reader that detected this tag. |

### Cascade Rules

- **Asset deleted:** CASCADE delete all RFID tag records.
- **Organization deleted:** CASCADE delete all tags.

### Soft Delete Behavior

Standard soft delete. Retired/lost tags are preserved for historical inventory records.

### Future Expansion

- RFID read event stream (high-volume, time-series).
- Geofencing: alert when tagged asset leaves designated area.
- RFID-based automated check-in/check-out.
- Integration with RFID middleware platforms.

### Performance Notes

- Moderate table (< 100,000 tags per org).
- EPC index must be optimized for fast lookup during real-time reads.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/rfid/tags | GET | List RFID tags. |
| /api/rfid/tags/:id | GET | Get tag details. |
| /api/rfid/tags | POST | Register an RFID tag. |
| /api/rfid/inventory/scan | POST | Submit scan results (list of detected EPCs). |
| /api/rfid/inventory/missing | GET | Get assets whose tags were not detected in last scan. |

---
## 62. uture_barcode_scans

### Purpose

Log of all barcode/QR code scan events for audit trails, check-in/check-out tracking, and inventory verification.

### Business Requirement

Every time a barcode or QR code is scanned (via mobile app, handheld scanner, or kiosk), the system must record the scan event with full context: who scanned, what was scanned, where, when, and what action resulted. This table provides the audit trail for all scan-based operations.

### Description

Each row represents a single scan event. Unlike uture_rfid_tags which is a tag registry, this table captures the scanning **action**. It records the scan source (mobile, kiosk, handheld), the decoded value, the resolution result (which entity was matched), and the resulting action (check-in, check-out, lookup, etc.).

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| organization_id | UUID | NOT NULL | — | FK → organizations.id ON DELETE CASCADE | Organization scope. |
| user_id | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who performed the scan. NULL for automated/kiosk scans. |
| scanned_value | VARCHAR(500) | NOT NULL | — | — | Raw decoded value from the barcode/QR code. |
| scan_type | VARCHAR(20) | NOT NULL | — | CHECK (scan_type IN ('barcode','qr_code','nfc','manual_entry')) | Type of scan. |
| scan_source | VARCHAR(30) | NOT NULL | — | CHECK (scan_source IN ('mobile_app','handheld_scanner','kiosk','webcam','rfid_reader','api','automation')) | Device or method used to scan. |
| matched_entity_type | VARCHAR(50) | NULL | NULL | — | Entity type matched from the scanned value. |
| matched_entity_id | UUID | NULL | NULL | — | Entity ID matched from the scanned value. |
| ction_performed | VARCHAR(50) | NULL | NULL | — | Action triggered by the scan (e.g. check_in, check_out, lookup, inventory_count). |
| ction_result | VARCHAR(20) | NULL | NULL | CHECK (action_result IS NULL OR action_result IN ('success','failed','cancelled','pending')) | Result of the triggered action. |
| ction_error | TEXT | NULL | NULL | — | Error message if the action failed. |
| location_id | UUID | NULL | NULL | FK → locations.id ON DELETE SET NULL | Location where the scan occurred. |
| latitude | DECIMAL(10, 8) | NULL | NULL | — | GPS latitude of the scan. |
| longitude | DECIMAL(11, 8) | NULL | NULL | — | GPS longitude of the scan. |
| device_info | JSONB | NULL | '{}'::jsonb | — | Device details: {"device_model": "iPhone 15", "os": "iOS 18", "app_version": "2.1.0"}. |
| scan_duration_ms | INTEGER | NULL | NULL | — | Time from scan trigger to decode completion in milliseconds. |
| image_path | VARCHAR(1024) | NULL | NULL | — | Path to captured image of the scan (for verification). |
| ip_address | INET | NULL | NULL | — | IP address of the scanning device. |
| 
otes | TEXT | NULL | NULL | — | User-provided notes during scan. |
| metadata | JSONB | NULL | '{}'::jsonb | — | Extra scan context data. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | When the scan occurred. |

### Indexes

``sql
CREATE INDEX idx_barcode_scans_org_time ON future_barcode_scans (organization_id, created_at DESC);
CREATE INDEX idx_barcode_scans_user ON future_barcode_scans (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_barcode_scans_entity ON future_barcode_scans (matched_entity_type, matched_entity_id) WHERE matched_entity_type IS NOT NULL;
CREATE INDEX idx_barcode_scans_action ON future_barcode_scans (organization_id, action_performed, created_at DESC) WHERE action_performed IS NOT NULL;
CREATE INDEX idx_barcode_scans_value ON future_barcode_scans (scanned_value);
CREATE INDEX idx_barcode_scans_source ON future_barcode_scans (organization_id, scan_source, created_at DESC);
CREATE INDEX idx_barcode_scans_location ON future_barcode_scans (location_id, created_at DESC) WHERE location_id IS NOT NULL;
``

### Example Record

``json
{
  "id": "b1c2d3e4-gggg-8888-bbbb-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "user_id": "a1b2c3d4-0000-4000-8000-000000000010",
  "scanned_value": "INV-2025-00432",
  "scan_type": "qr_code",
  "scan_source": "mobile_app",
  "matched_entity_type": "asset",
  "matched_entity_id": "a1b2c3d4-0000-4000-8000-000000000501",
  "action_performed": "check_out",
  "action_result": "success",
  "action_error": null,
  "location_id": "a1b2c3d4-0000-4000-8000-000000000702",
  "latitude": 28.61390000,
  "longitude": 77.20900000,
  "device_info": {"device_model": "iPhone 15", "os": "iOS 18.0", "app_version": "2.1.0"},
  "scan_duration_ms": 120,
  "image_path": null,
  "ip_address": "192.168.1.105",
  "notes": "Checked out to Engineering Floor 3.",
  "metadata": {"checkout_duration_days": 7, "return_date": "2025-07-19"},
  "created_at": "2025-07-12T10:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| scanned_value_required | scanned_value must not be empty. |
| entity_pair | If matched_entity_type is set, matched_entity_id must also be set. |
| esult_for_action | If ction_performed is set, ction_result should also be set. |
| coordinates_valid | If set, latitude/longitude must be valid coordinates. |

### Business Rules

1. **Every scan is logged:** No scan event should be silently discarded. Failed lookups are logged with ction_result = 'failed'.
2. **Deduplication:** Rapid consecutive scans of the same value within 5 seconds by the same user are deduplicated (application-layer).
3. **Inventory reconciliation:** A background job compares recent scan history against expected asset locations to identify discrepancies.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One | Scan belongs to an organization. |
| users | Many-to-One (optional) | User who scanned. |
| locations | Many-to-One (optional) | Location where scan occurred. |
| ssets | Many-to-One (via entity) | When matched_entity_type = 'asset'. |

### Cascade Rules

- **Organization deleted:** CASCADE delete all scan records.
- **User deleted:** SET NULL on user_id.

### Soft Delete Behavior

**Not applicable.** Scan logs are append-only. They are retained per the data retention policy and archived, not soft-deleted.

### Future Expansion

- Real-time scan event streaming via WebSocket.
- Scan analytics dashboard (most scanned assets, peak scan times).
- Offline scan queue (scan locally, sync when online).
- Multi-scan workflows (scan multiple items in sequence for bulk operations).

### Performance Notes

- High write volume in active deployments. Consider partitioning by created_at.
- The scanned_value index supports the lookup query but may need a trigram index for partial/fuzzy matching.

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/scans | POST | Log a scan event. |
| /api/scans/:value/resolve | GET | Resolve a scanned value to its entity. |
| /api/scans/history | GET | Get scan history with filters. |
| /api/scans/analytics | GET | Get scan analytics data. |

---
# Module 67: AI Prediction Data

---

## 63. i_predictions

### Purpose

Stores predictions generated by AI/ML models for asset maintenance forecasting, failure prediction, utilization optimization, and lifecycle management.

### Business Requirement

AssetFlow's predictive analytics engine uses machine learning models to forecast asset failures, predict maintenance needs, optimize asset utilization, and estimate remaining useful life. Each prediction must be stored with its model version, confidence score, input features, and actionable recommendations so that users can review, approve, or dismiss AI-generated suggestions.

### Description

Each row represents a single prediction generated by an AI model. The prediction is linked to the entity it concerns (polymorphic), tagged with the model version that produced it, and includes confidence scores, recommended actions, and the feature data used as input. Over time, prediction accuracy is tracked by comparing predictions against actual outcomes, enabling model performance monitoring and retraining triggers.

### Columns

| Column | Data Type | Nullable | Default | Constraints | Description |
|--------|-----------|----------|---------|-------------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | Unique identifier. |
| organization_id | UUID | NOT NULL | — | FK → organizations.id ON DELETE CASCADE | Organization scope. |
| entity_type | VARCHAR(50) | NOT NULL | — | — | Entity type this prediction concerns (e.g. sset, maintenance_order, component). |
| entity_id | UUID | NOT NULL | — | — | Primary key of the predicted entity. |
| prediction_type | VARCHAR(50) | NOT NULL | — | CHECK (prediction_type IN ('failure_prediction','maintenance_scheduling','remaining_useful_life','utilization_forecast','cost_projection','anomaly_detection','replacement_timing','energy_optimization','demand_forecast','custom')) | Type of prediction. |
| model_name | VARCHAR(100) | NOT NULL | — | — | Name of the ML model (e.g. maintenance_forecaster_v2). |
| model_version | VARCHAR(50) | NOT NULL | — | — | Version of the model (e.g. 2.1.0, 2025-Q2). |
| model_id | UUID | NULL | NULL | FK → ai_models.id ON DELETE SET NULL | Reference to the AI model registry (if an i_models table exists). |
| confidence_score | DECIMAL(5, 4) | NOT NULL | — | — | Model confidence (0.0000 to 1.0000). |
| confidence_level | VARCHAR(20) | NOT NULL | — | CHECK (confidence_level IN ('very_low','low','medium','high','very_high')) | Human-readable confidence bucket. |
| predicted_value | JSONB | NOT NULL | — | — | The predicted value or outcome (format depends on prediction_type). |
| predicted_date | DATE | NULL | NULL | — | The date this prediction concerns (e.g. predicted failure date). |
| predicted_range_start | DATE | NULL | NULL | — | Start of the prediction range (for range predictions). |
| predicted_range_end | DATE | NULL | NULL | — | End of the prediction range. |
| input_features | JSONB | NOT NULL | — | — | Feature data used as input to the model. Stored for reproducibility and debugging. |
| eature_importance | JSONB | NULL | NULL | — | Per-feature importance scores for explainability. |
| ecommended_actions | JSONB | NOT NULL | '[]'::jsonb | — | Array of recommended actions with priority, description, cost, and downtime estimates. |
| estimated_cost_impact | DECIMAL(12, 2) | NULL | NULL | — | Estimated financial impact of the predicted event. |
| estimated_downtime_hours | DECIMAL(6, 2) | NULL | NULL | — | Estimated downtime if the predicted event occurs. |
| isk_score | DECIMAL(5, 4) | NULL | NULL | — | Composite risk score (0-1) combining probability and impact. |
| status | VARCHAR(20) | NOT NULL | 'active' | CHECK (status IN ('active','reviewed','approved','dismissed','expired','acted_upon','failed')) | User action status on this prediction. |
| eviewed_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who reviewed this prediction. |
| eviewed_at | TIMESTAMPTZ | NULL | NULL | — | When the prediction was reviewed. |
| eview_notes | TEXT | NULL | NULL | — | Notes from the reviewer. |
| ction_taken | VARCHAR(50) | NULL | NULL | — | Action taken based on the prediction (e.g. maintenance_scheduled). |
| ction_taken_at | TIMESTAMPTZ | NULL | NULL | — | When the action was taken. |
| ctual_outcome | JSONB | NULL | NULL | — | The actual event that occurred (populated later for model accuracy tracking). |
| ctual_outcome_date | DATE | NULL | NULL | — | When the actual event occurred. |
| was_accurate | BOOLEAN | NULL | NULL | — | Whether the prediction matched the actual outcome. NULL until outcome is known. |
| ccuracy_score | DECIMAL(5, 4) | NULL | NULL | — | Quantified accuracy of this prediction (0-1). |
| expires_at | TIMESTAMPTZ | NULL | NULL | — | When this prediction becomes stale and should be re-evaluated. |
| superseded_by | UUID | NULL | NULL | FK → ai_predictions.id ON DELETE SET NULL | If a newer prediction replaces this one, link to the new one. |
| is_deleted | BOOLEAN | NOT NULL | alse | — | Soft-delete flag. |
| deleted_at | TIMESTAMPTZ | NULL | NULL | — | Timestamp of soft delete. |
| deleted_by | UUID | NULL | NULL | FK → users.id ON DELETE SET NULL | User who soft-deleted. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | — | When the prediction was generated. |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | — | Last modification timestamp. |
### Indexes

``sql
-- Primary: all predictions for an entity
CREATE INDEX idx_ai_predictions_entity ON ai_predictions (entity_type, entity_id, created_at DESC);

-- Organization predictions with type filter
CREATE INDEX idx_ai_predictions_org_type ON ai_predictions (organization_id, prediction_type, status, created_at DESC);

-- Active predictions needing review
CREATE INDEX idx_ai_predictions_active ON ai_predictions (organization_id, prediction_type, confidence_level, created_at DESC) WHERE status = 'active' AND is_deleted = false;

-- High-confidence predictions for dashboard
CREATE INDEX idx_ai_predictions_high_conf ON ai_predictions (organization_id, confidence_score DESC) WHERE status = 'active' AND confidence_score >= 0.8 AND is_deleted = false;

-- Expiration processing
CREATE INDEX idx_ai_predictions_expires ON ai_predictions (expires_at) WHERE expires_at IS NOT NULL AND status = 'active' AND is_deleted = false;

-- Model performance tracking
CREATE INDEX idx_ai_predictions_model ON ai_predictions (model_name, model_version, was_accurate) WHERE was_accurate IS NOT NULL;

-- Accuracy analysis
CREATE INDEX idx_ai_predictions_accuracy ON ai_predictions (prediction_type, was_accurate, created_at DESC) WHERE was_accurate IS NOT NULL;

-- Superseded chain
CREATE INDEX idx_ai_predictions_superseded ON ai_predictions (superseded_by) WHERE superseded_by IS NOT NULL;

-- Risk-based prioritization
CREATE INDEX idx_ai_predictions_risk ON ai_predictions (organization_id, risk_score DESC) WHERE status = 'active' AND risk_score IS NOT NULL AND is_deleted = false;
``

### Example Record

``json
{
  "id": "c2d3e4f5-hhhh-9999-cccc-000000000001",
  "organization_id": "a1b2c3d4-0000-4000-8000-000000000001",
  "entity_type": "asset",
  "entity_id": "a1b2c3d4-0000-4000-8000-000000000501",
  "prediction_type": "failure_prediction",
  "model_name": "failure_predictor_xgboost",
  "model_version": "2.1.0",
  "model_id": null,
  "confidence_score": 0.8734,
  "confidence_level": "high",
  "predicted_value": {
    "will_fail": true,
    "failure_mode": "battery_degradation",
    "probability": 0.8734,
    "mean_time_to_failure_hours": 720
  },
  "predicted_date": "2025-09-12",
  "predicted_range_start": "2025-08-28",
  "predicted_range_end": "2025-09-25",
  "input_features": {
    "battery_cycles": 847,
    "battery_health_pct": 62,
    "avg_temperature_c": 38.5,
    "operating_hours": 12450,
    "vibration_rms": 0.45,
    "age_days": 540,
    "last_maintenance_days_ago": 120,
    "power_cycles_daily": 3.2,
    "environmental_stress": "high"
  },
  "feature_importance": {
    "battery_health_pct": 0.32,
    "battery_cycles": 0.25,
    "operating_hours": 0.18,
    "avg_temperature_c": 0.12,
    "vibration_rms": 0.08,
    "age_days": 0.05
  },
  "recommended_actions": [
    {
      "action": "schedule_battery_replacement",
      "priority": "high",
      "description": "Replace battery within 30 days to prevent unexpected failure.",
      "estimated_cost": 2800.00,
      "estimated_downtime_hours": 4
    },
    {
      "action": "reduce_operating_hours",
      "priority": "medium",
      "description": "Reduce daily operating hours to slow degradation.",
      "estimated_cost": 0,
      "estimated_downtime_hours": 0
    }
  ],
  "estimated_cost_impact": 15000.00,
  "estimated_downtime_hours": 24.00,
  "risk_score": 0.7800,
  "status": "active",
  "reviewed_by": null,
  "reviewed_at": null,
  "review_notes": null,
  "action_taken": null,
  "action_taken_at": null,
  "actual_outcome": null,
  "actual_outcome_date": null,
  "was_accurate": null,
  "accuracy_score": null,
  "expires_at": "2025-08-12T00:00:00Z",
  "superseded_by": null,
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-07-12T10:00:00Z",
  "updated_at": "2025-07-12T10:00:00Z"
}
``

### Validation Rules

| Rule | Description |
|------|-------------|
| confidence_range | confidence_score must be between 0.0000 and 1.0000. |
| entity_required | entity_type and entity_id must both be non-NULL. |
| date_range_valid | predicted_range_start must be <= predicted_range_end if both are set. |
| predicted_date_in_range | predicted_date should fall within predicted_range_start and predicted_range_end if all three are set. |
| superseded_different | superseded_by must not reference the same row (no self-referencing). |
| eview_requires_user | If status is in ('reviewed','approved','dismissed'), eviewed_by and eviewed_at should be set. |
| ctual_outcome_consistency | If ctual_outcome is set, ctual_outcome_date and was_accurate should also be set. |
| isk_range | isk_score must be between 0.0000 and 1.0000 if set. |

### Business Rules

1. **Auto-generation:** Predictions are generated by a scheduled ML pipeline (cron or event-triggered). New predictions may supersede older ones for the same entity.
2. **Superseding:** When a newer prediction is generated for the same entity + type, the older prediction's status is set to expired and superseded_by points to the new one.
3. **Review workflow:** Predictions with confidence_score >= 0.7 are surfaced in the dashboard for human review. Users can approve (trigger action), dismiss (with reason), or mark as reviewed.
4. **Accuracy tracking:** After the predicted date passes, the system checks actual outcomes and populates was_accurate and ccuracy_score. This data feeds model retraining.
5. **Expiration:** Predictions expire after expires_at and are excluded from active dashboards.
6. **Action integration:** Approved predictions can automatically create maintenance orders, purchase requests, or alerts via workflow automation.

### Relationships

| Related Table | Relationship | Description |
|---------------|-------------|-------------|
| organizations | Many-to-One | Prediction belongs to an organization. |
| ssets | Many-to-One (via entity) | When entity_type = 'asset'. |
| maintenance_orders | Many-to-One (via entity) | When entity_type = 'maintenance_order'. |
| users (reviewer) | Many-to-One (optional) | User who reviewed this prediction. |
| i_predictions (self) | Self-referencing | superseded_by links to the newer prediction. |

### Cascade Rules

- **Organization deleted:** CASCADE delete all predictions.
- **Reviewer deleted:** SET NULL on eviewed_by.
- **Superseded prediction deleted:** SET NULL on superseded_by.

### Soft Delete Behavior

Standard soft delete. Deleted predictions are excluded from dashboards but preserved for model accuracy analysis.

### Future Expansion

- **Model registry table** (i_models): versioned model metadata, training data references, performance metrics.
- **Feature store integration:** Link input_features to a feature store for model reproducibility.
- **A/B testing:** Run multiple models simultaneously and compare accuracy.
- **Real-time predictions:** Stream predictions via WebSocket for live dashboards.
- **Prediction explanations:** Natural language explanations of why a prediction was made.
- **Federated learning:** Train models across organizations without sharing raw data.
- **Custom model upload:** Allow orgs to deploy their own trained models.

### Performance Notes

- **Growth rate:** ~100-10,000 predictions per org per day depending on asset count and model frequency.
- **Partitioning:** Recommend partitioning by created_at (monthly) for production.
- **Index strategy:** The (entity_type, entity_id, created_at DESC) index powers the entity prediction history.
- **Storage:** ~2KB per row average (input_features and recommended_actions are the largest columns).

### API Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/ai/predictions | GET | List predictions with filtering (type, status, confidence, entity). |
| /api/ai/predictions/:id | GET | Get prediction details with feature importance. |
| /api/ai/predictions/entity/:type/:id | GET | Get prediction history for an entity. |
| /api/ai/predictions/:id/review | PATCH | Mark prediction as reviewed with notes. |
| /api/ai/predictions/:id/approve | POST | Approve prediction and trigger recommended action. |
| /api/ai/predictions/:id/dismiss | POST | Dismiss prediction with reason. |
| /api/ai/predictions/accuracy | GET | Get model accuracy metrics. |
| /api/ai/predictions/high-risk | GET | Get high-risk predictions requiring attention. |
| /api/ai/predictions/generate | POST | Manually trigger prediction generation for an entity. |

---
# Appendix A: Cross-Table Relationship Map

Below is a summary of cross-table relationships introduced in this document (Modules 39-67):

| Source Table | Target Table | Relationship | FK Column | Cascade |
|-------------|-------------|-------------|-----------|---------|
| 
otifications | organizations | Many-to-One | organization_id | CASCADE |
| 
otifications | users (recipient) | Many-to-One | ecipient_user_id | CASCADE |
| 
otifications | users (sender) | Many-to-One | sender_user_id | SET NULL |
| 
otification_preferences | organizations | Many-to-One | organization_id | CASCADE |
| 
otification_preferences | users | Many-to-One (optional) | user_id | CASCADE |
| ctivity_logs | organizations | Many-to-One | organization_id | CASCADE |
| ctivity_logs | users | Many-to-One (optional) | user_id | SET NULL |
| ctivity_logs | user_sessions | Many-to-One (optional) | session_id | SET NULL |
| eport_metadata | organizations | Many-to-One | organization_id | CASCADE |
| dashboard_widgets | organizations | Many-to-One | organization_id | CASCADE |
| dashboard_widgets | users | Many-to-One (optional) | user_id | CASCADE |
| dashboard_widgets | oles | Many-to-One (optional) | ole_id | CASCADE |
| email_templates | organizations | Many-to-One | organization_id | CASCADE |
| system_settings | organizations | Many-to-One (optional) | organization_id | CASCADE |
| lookup_tables | organizations | Many-to-One (optional) | organization_id | CASCADE |
| master_status_tables | organizations | Many-to-One (optional) | organization_id | CASCADE |
| states | countries | Many-to-One | country_id | CASCADE |
| cities | states | Many-to-One | state_id | CASCADE |
| cities | countries | Many-to-One | country_id | CASCADE |
| holiday_calendar | organizations | Many-to-One (optional) | organization_id | CASCADE |
| holiday_calendar | countries | Many-to-One (optional) | country_id | SET NULL |
| holiday_calendar | states | Many-to-One (optional) | state_id | SET NULL |
| working_hours | organizations | Many-to-One | organization_id | CASCADE |
| ile_storage | organizations | Many-to-One | organization_id | CASCADE |
| ile_storage | users | Many-to-One (optional) | uploaded_by | SET NULL |
| ile_storage | ile_storage (self) | Self-referencing | parent_file_id | SET NULL |
| 	ags | organizations | Many-to-One | organization_id | CASCADE |
| 	ags | 	ags (self) | Self-referencing | parent_id | SET NULL |
| sset_tags | ssets | Many-to-One | sset_id | CASCADE |
| sset_tags | 	ags | Many-to-One | 	ag_id | CASCADE |
| sset_labels | ssets | Many-to-One | sset_id | CASCADE |
| custom_attributes | organizations | Many-to-One | organization_id | CASCADE |
| pi_tokens | organizations | Many-to-One | organization_id | CASCADE |
| pi_tokens | users | Many-to-One | user_id | CASCADE |
| uture_iot_sensors | organizations | Many-to-One | organization_id | CASCADE |
| uture_iot_sensors | locations | Many-to-One (optional) | location_id | SET NULL |
| uture_iot_sensors | ssets | Many-to-One (optional) | sset_id | SET NULL |
| uture_iot_readings | uture_iot_sensors | Many-to-One | sensor_id | CASCADE |
| uture_rfid_tags | organizations | Many-to-One | organization_id | CASCADE |
| uture_rfid_tags | ssets | Many-to-One | sset_id | CASCADE |
| uture_barcode_scans | organizations | Many-to-One | organization_id | CASCADE |
| uture_barcode_scans | users | Many-to-One (optional) | user_id | SET NULL |
| i_predictions | organizations | Many-to-One | organization_id | CASCADE |
| i_predictions | users | Many-to-One (optional) | eviewed_by | SET NULL |
| i_predictions | i_predictions (self) | Self-referencing | superseded_by | SET NULL |

---

# Appendix B: Global Conventions

## UUID Primary Keys

All tables use UUID as the primary key type, generated via gen_random_uuid() (PostgreSQL 13+). This ensures globally unique identifiers across distributed systems and avoids sequential ID exposure.

## Soft Delete Pattern

Most tables implement soft delete via three columns:

| Column | Type | Purpose |
|--------|------|---------|
| is_deleted | BOOLEAN | Flag for soft-deleted rows. |
| deleted_at | TIMESTAMPTZ | When the row was soft-deleted. |
| deleted_by | UUID (FK to users) | Who soft-deleted the row. |

All default queries include WHERE is_deleted = false. Admin queries can override this with ?includeDeleted=true.

**Exceptions (append-only, no soft delete):**
- ctivity_logs
- uture_iot_readings
- uture_barcode_scans

**Exceptions (deactivated, not deleted):**
- countries, states, cities

## Audit Columns

Every mutable table includes:

| Column | Type | Purpose |
|--------|------|---------|
| created_at | TIMESTAMPTZ | Row creation timestamp (immutable). |
| updated_at | TIMESTAMPTZ | Last modification timestamp (auto-updated via trigger). |

Some tables also include created_by and updated_by FK columns linking to users.

## Organization Scoping

Nearly every table includes organization_id (FK to organizations) for multi-tenant data isolation. All queries must include this filter. PostgreSQL Row-Level Security (RLS) policies can enforce this at the database level.

## JSONB Flexible Columns

Tables use JSONB columns for:
- metadata: Extensible key-value data without schema changes.
- config / data_config / position_config: Complex structured configuration.
- input_features / predicted_value: ML model inputs and outputs.
- alidation_rules / parameters_schema: Schema definitions for dynamic fields.

JSONB columns are indexed with GIN indexes when frequent querying is needed.

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Table names | snake_case, plural | ctivity_logs, 
otification_preferences |
| Column names | snake_case | organization_id, is_active, created_at |
| Index names | idx_{table}_{columns} | idx_notifications_recipient |
| Unique index names | uq_{table}_{columns} | uq_tags_org_name |
| FK constraint names | k_{table}_{column} | Auto-generated by Prisma |
| CHECK constraint names | chk_{table}_{column} | Auto-generated or named |

## Index Naming Convention

- Regular indexes: idx_{table_name}_{description}
- Unique indexes: uq_{table_name}_{description}
- Partial indexes: Include filter in name, e.g. idx_table_active
- GIN indexes: Include _gin suffix, e.g. idx_table_tags_gin

---

> **Document Version:** 3.0
> **Last Updated:** 2025-07-12
> **Modules Covered:** 39-67 (Notifications, Activity, Reports, System, Location, Calendar, Tags, Attributes, Security, Future IoT/RFID/Barcode, AI Predictions)
> **Total Tables Documented:** 28 tables
