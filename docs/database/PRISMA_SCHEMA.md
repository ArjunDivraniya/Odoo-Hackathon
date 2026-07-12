# AssetFlow Enterprise Asset Management System - Prisma Schema

> Complete production-ready Prisma schema for the AssetFlow platform.
> PostgreSQL datasource with full relational modeling.

## Complete Schema

```prisma
// ============================================================================
// AssetFlow Enterprise Asset Management System
// Production-ready Prisma Schema
// ============================================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// ENUMS
// ============================================================================

enum AssetStatus {
  AVAILABLE
  ALLOCATED
  UNDER_MAINTENANCE
  RESERVED
  TRANSFERRED
  LOST
  STOLEN
  DISPOSED
  RETIRED
  DAMAGED
}

enum AllocationStatus {
  PENDING
  APPROVED
  ACTIVE
  RETURNED
  OVERDUE
  CANCELLED
  REJECTED
}

enum BookingStatus {
  PENDING
  CONFIRMED
  ACTIVE
  COMPLETED
  CANCELLED
  NO_SHOW
  OVERDUE
}

enum MaintenanceStatus {
  REQUESTED
  APPROVED
  IN_PROGRESS
  ON_HOLD
  COMPLETED
  VERIFIED
  REJECTED
  CANCELLED
}

enum AuditStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  REVIEWING
  CLOSED
  CANCELLED
}

enum EmployeeStatus {
  ACTIVE
  ON_LEAVE
  SUSPENDED
  TERMINATED
  RESIGNED
  RETIRED
}

enum DepartmentStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  LOCKED
  PENDING_VERIFICATION
}

enum NotificationStatus {
  UNREAD
  READ
  ARCHIVED
  DISMISSED
}

enum PriorityLevel {
  LOW
  MEDIUM
  HIGH
  URGENT
  CRITICAL
}

enum AssetCondition {
  EXCELLENT
  GOOD
  FAIR
  POOR
  NEEDS_REPAIR
  NON_FUNCTIONAL
}

enum TransferStatus {
  REQUESTED
  APPROVED
  IN_TRANSIT
  RECEIVED
  COMPLETED
  REJECTED
  CANCELLED
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  ESCALATED
  CANCELLED
}

enum RoleType {
  SYSTEM
  CUSTOM
  TEMPLATE
}

enum PermissionType {
  MODULE
  ACTION
  FIELD
  RECORD
}

// ============================================================================
// AUTH & USER MANAGEMENT
// ============================================================================

/// Core user account model. Stores authentication credentials and profile info.
/// Every employee and admin has a User record linked to their EmployeeProfile.
model User {
  id                String         @id @default(uuid()) @db.Uuid
  email             String         @unique @db.VarChar(255)
  passwordHash      String         @map("password_hash") @db.VarChar(255)
  firstName         String         @map("first_name") @db.VarChar(100)
  lastName          String         @map("last_name") @db.VarChar(100)
  phone             String?        @db.VarChar(20)
  avatarUrl         String?        @map("avatar_url") @db.VarChar(500)
  status            UserStatus     @default(PENDING_VERIFICATION)
  emailVerified     Boolean        @default(false) @map("email_verified")
  phoneVerified     Boolean        @default(false) @map("phone_verified")
  mfaEnabled        Boolean        @default(false) @map("mfa_enabled")
  mfaSecret         String?        @map("mfa_secret") @db.VarChar(255)
  lastLoginAt       DateTime?      @map("last_login_at")
  lastLoginIp       String?        @map("last_login_ip") @db.VarChar(45)
  failedLoginCount  Int            @default(0) @map("failed_login_count")
  lockedUntil       DateTime?      @map("locked_until")
  passwordChangedAt DateTime?      @map("password_changed_at")
  createdBy         String?        @map("created_by") @db.Uuid
  updatedBy         String?        @map("updated_by") @db.Uuid
  createdAt         DateTime       @default(now()) @map("created_at")
  updatedAt         DateTime       @updatedAt @map("updated_at")
  deletedAt         DateTime?      @map("deleted_at")

  // Relations
  employeeProfile   EmployeeProfile?
  roles             UserRole[]
  sessions          Session[]
  refreshTokens     RefreshToken[]
  loginHistories    LoginHistory[]
  passwordResets    PasswordReset[]
  emailVerifications EmailVerification[]
  otpCodes          OtpCode[]
  deviceHistories   DeviceHistory[]
  notifications     Notification[]
  notificationPrefs NotificationPreference[]
  activityLogs      ActivityLog[]
  createdAssets     Asset[]           @relation("AssetCreator")
  updatedAssets     Asset[]           @relation("AssetUpdater")
  allocations       AssetAllocation[] @relation("AllocationUser")
  approvalRequests  ApprovalRequest[]
  auditAssignments  AuditAssignment[]
  maintenanceRequests MaintenanceRequest[]
  transferRequests  TransferRequest[]
  createdByDepartments Department[]  @relation("DeptCreatedBy")
  updatedByDepartments Department[]  @relation("DeptUpdatedBy")
  refreshTokensHistory RefreshToken[]
  apiTokens         ApiToken[]

  @@index([email])
  @@index([status])
  @@index([createdAt])
  @@map("users")
}

/// Role definitions for RBAC. System roles are seeded, custom roles are created by admins.
model Role {
  id          String     @id @default(uuid()) @db.Uuid
  name        String     @unique @db.VarChar(100)
  description String?    @db.Text
  type        RoleType   @default(CUSTOM)
  isDefault   Boolean    @default(false) @map("is_default")
  isActive    Boolean    @default(true) @map("is_active")
  companyId   String?    @map("company_id") @db.Uuid
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  // Relations
  company         Company?           @relation(fields: [companyId], references: [id])
  users           UserRole[]
  permissions     RolePermission[]
  createdByUsers  User[]             @relation("RoleCreator")

  @@index([companyId])
  @@index([type])
  @@map("roles")
}

/// Granular permissions for fine-grained access control per module/action/field.
model Permission {
  id          String         @id @default(uuid()) @db.Uuid
  module      String         @db.VarChar(100)
  action      String         @db.VarChar(100)
  field       String?        @db.VarChar(100)
  record      String?        @db.VarChar(100)
  type        PermissionType @default(MODULE)
  description String?        @db.Text
  createdAt   DateTime       @default(now()) @map("created_at")

  // Relations
  roles       RolePermission[]

  @@unique([module, action, field, type])
  @@index([module])
  @@map("permissions")
}

/// Junction table linking Users to Roles (many-to-many).
model UserRole {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  roleId    String    @map("role_id") @db.Uuid
  companyId String?   @map("company_id") @db.Uuid
  assignedAt DateTime @default(now()) @map("assigned_at")
  assignedBy String?  @map("assigned_by") @db.Uuid
  expiresAt DateTime? @map("expires_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId, companyId])
  @@index([userId])
  @@index([roleId])
  @@map("user_roles")
}

/// Junction table linking Roles to Permissions (many-to-many).
model RolePermission {
  id           String   @id @default(uuid()) @db.Uuid
  roleId       String   @map("role_id") @db.Uuid
  permissionId String   @map("permission_id") @db.Uuid
  createdAt    DateTime @default(now()) @map("created_at")

  // Relations
  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@map("role_permissions")
}

/// Active user sessions for session management and revocation.
model Session {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  token          String   @unique @db.VarChar(500)
  ipAddress      String?  @map("ip_address") @db.VarChar(45)
  userAgent      String?  @map("user_agent") @db.Text
  lastActiveAt   DateTime @default(now()) @map("last_active_at")
  expiresAt      DateTime @map("expires_at")
  isActive       Boolean  @default(true) @map("is_active")
  createdAt      DateTime @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("sessions")
}

/// Refresh tokens for JWT token rotation strategy.
model RefreshToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  token     String   @unique @db.VarChar(500)
  ipAddress String?  @map("ip_address") @db.VarChar(45)
  userAgent String?  @map("user_agent") @db.Text
  expiresAt DateTime @map("expires_at")
  revokedAt DateTime? @map("revoked_at")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("refresh_tokens")
}

/// Audit trail for login attempts (successful and failed).
model LoginHistory {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  ipAddress   String    @map("ip_address") @db.VarChar(45)
  userAgent   String?   @map("user_agent") @db.Text
  success     Boolean   @default(true)
  failureReason String? @map("failure_reason") @db.VarChar(255)
  location    String?   @db.VarChar(255)
  loginAt     DateTime  @default(now()) @map("login_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([loginAt])
  @@index([ipAddress])
  @@map("login_histories")
}

/// Password reset tokens and their usage status.
model PasswordReset {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  token     String    @unique @db.VarChar(500)
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  ipAddress String?   @map("ip_address") @db.VarChar(45)
  createdAt DateTime  @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("password_resets")
}

/// Email verification tokens for new account activation.
model EmailVerification {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  token     String    @unique @db.VarChar(500)
  email     String    @db.VarChar(255)
  expiresAt DateTime  @map("expires_at")
  verifiedAt DateTime? @map("verified_at")
  createdAt DateTime  @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("email_verifications")
}

/// One-time password codes for MFA and verification flows.
model OtpCode {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  code      String    @db.VarChar(10)
  purpose   String    @db.VarChar(50)
  expiresAt DateTime  @map("expires_at")
  attempts  Int       @default(0)
  verifiedAt DateTime? @map("verified_at")
  ipAddress String?   @map("ip_address") @db.VarChar(45)
  createdAt DateTime  @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([code, purpose])
  @@map("otp_codes")
}

/// Device history tracking for login anomaly detection and device management.
model DeviceHistory {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  deviceFingerprint String @map("device_fingerprint") @db.VarChar(255)
  deviceName   String?  @map("device_name") @db.VarChar(255)
  deviceType   String?  @map("device_type") @db.VarChar(50)
  ipAddress    String?  @map("ip_address") @db.VarChar(45)
  lastSeenAt   DateTime @default(now()) @map("last_seen_at")
  isTrusted    Boolean  @default(false) @map("is_trusted")
  createdAt    DateTime @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, deviceFingerprint])
  @@index([userId])
  @@map("device_histories")
}

// ============================================================================
// ORGANIZATION
// ============================================================================

/// Top-level company entity. Multi-tenant isolation is based on this.
model Company {
  id           String    @id @default(uuid()) @db.Uuid
  name         String    @db.VarChar(200)
  slug         String    @unique @db.VarChar(200)
  legalName    String?   @map("legal_name") @db.VarChar(200)
  taxId        String?   @map("tax_id") @db.VarChar(50)
  registrationNumber String? @map("registration_number") @db.VarChar(100)
  logoUrl      String?   @map("logo_url") @db.VarChar(500)
  website      String?   @db.VarChar(500)
  email        String?   @db.VarChar(255)
  phone        String?   @db.VarChar(20)
  address      String?   @db.Text
  city         String?   @db.VarChar(100)
  state        String?   @db.VarChar(100)
  country      String?   @db.VarChar(100)
  postalCode   String?   @map("postal_code") @db.VarChar(20)
  timezone     String    @default("UTC") @db.VarChar(50)
  currency     String    @default("USD") @db.VarChar(3)
  isActive     Boolean   @default(true) @map("is_active")
  settings     Json?     @db.Json
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  // Relations
  roles          Role[]
  offices        Office[]
  buildings      Building[]
  floors         Floor[]
  locations      Location[]
  departments    Department[]
  assets         Asset[]
  employees      EmployeeProfile[]
  auditCycles    AuditCycle[]
  apiTokens      ApiToken[]
  lookupTables   LookupTable[]
  masterStatuses MasterStatusTable[]
  holidayCalendars HolidayCalendar[]
  workingHours   WorkingHour[]
  fileStorages   FileStorage[]
  systemSettings SystemSetting[]
  reportMetadata ReportMetadata[]
  emailTemplates EmailTemplate[]

  @@index([slug])
  @@index([isActive])
  @@index([createdAt])
  @@map("companies")
}

/// Physical office locations within a company.
model Office {
  id          String          @id @default(uuid()) @db.Uuid
  companyId   String          @map("company_id") @db.Uuid
  name        String          @db.VarChar(200)
  code        String?         @db.VarChar(20)
  address     String?         @db.Text
  city        String?         @db.VarChar(100)
  state       String?         @db.VarChar(100)
  country     String?         @db.VarChar(100)
  postalCode  String?         @map("postal_code") @db.VarChar(20)
  phone       String?         @db.VarChar(20)
  email       String?         @db.VarChar(255)
  timezone    String?         @db.VarChar(50)
  isHeadquarters Boolean     @default(false) @map("is_headquarters")
  isActive    Boolean         @default(true) @map("is_active")
  latitude    Float?          @db.Decimal(10, 8)
  longitude   Float?          @db.Decimal(11, 8)
  createdAt   DateTime        @default(now()) @map("created_at")
  updatedAt   DateTime        @updatedAt @map("updated_at")

  // Relations
  company   Company    @relation(fields: [companyId], references: [id], onDelete: Cascade)
  buildings Building[]
  assets    Asset[]
  employees EmployeeProfile[]

  @@unique([companyId, code])
  @@index([companyId])
  @@map("offices")
}

/// Buildings within an office.
model Building {
  id          String    @id @default(uuid()) @db.Uuid
  companyId   String    @map("company_id") @db.Uuid
  officeId    String    @map("office_id") @db.Uuid
  name        String    @db.VarChar(200)
  code        String?   @db.VarChar(20)
  description String?   @db.Text
  totalFloors Int?      @map("total_floors")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  company Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  office  Office   @relation(fields: [officeId], references: [id], onDelete: Cascade)
  floors  Floor[]
  assets  Asset[]

  @@unique([officeId, code])
  @@index([officeId])
  @@index([companyId])
  @@map("buildings")
}

/// Floors within a building.
model Floor {
  id          String    @id @default(uuid()) @db.Uuid
  companyId   String    @map("company_id") @db.Uuid
  buildingId  String    @map("building_id") @db.Uuid
  name        String    @db.VarChar(200)
  floorNumber Int       @map("floor_number")
  description String?   @db.Text
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  company  Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  building Building @relation(fields: [buildingId], references: [id], onDelete: Cascade)
  locations Location[]
  assets   Asset[]

  @@unique([buildingId, floorNumber])
  @@index([buildingId])
  @@map("floors")
}

/// Granular physical location tracking (room, shelf, desk, etc.).
model Location {
  id          String    @id @default(uuid()) @db.Uuid
  companyId   String    @map("company_id") @db.Uuid
  floorId     String?   @map("floor_id") @db.Uuid
  name        String    @db.VarChar(200)
  code        String?   @db.VarChar(50)
  description String?   @db.Text
  type        String?   @db.VarChar(50)
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  floor   Floor?  @relation(fields: [floorId], references: [id], onDelete: SetNull)
  assets  Asset[]

  @@index([companyId])
  @@index([floorId])
  @@map("locations")
}

/// Organizational departments with hierarchical structure.
model Department {
  id              String           @id @default(uuid()) @db.Uuid
  companyId       String           @map("company_id") @db.Uuid
  parentId        String?          @map("parent_id") @db.Uuid
  name            String           @db.VarChar(200)
  code            String?          @db.VarChar(50)
  description     String?          @db.Text
  status          DepartmentStatus @default(ACTIVE)
  managerId       String?          @map("manager_id") @db.Uuid
  budget          Float?           @db.Decimal(15, 2)
  costCenter      String?          @map("cost_center") @db.VarChar(50)
  createdBy       String?          @map("created_by") @db.Uuid
  updatedBy       String?          @map("updated_by") @db.Uuid
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")
  deletedAt       DateTime?        @map("deleted_at")

  // Relations
  company         Company              @relation(fields: [companyId], references: [id], onDelete: Cascade)
  parent          Department?          @relation("DeptHierarchy", fields: [parentId], references: [id])
  children        Department[]         @relation("DeptHierarchy")
  creator         User?                @relation("DeptCreatedBy", fields: [createdBy], references: [id])
  updater         User?                @relation("DeptUpdatedBy", fields: [updatedBy], references: [id])
  employees       EmployeeProfile[]
  hierarchies     DepartmentHierarchy[]
  assets          Asset[]

  @@unique([companyId, code])
  @@index([companyId])
  @@index([parentId])
  @@map("departments")
}

/// Department hierarchy tracking for org-chart relationships.
model DepartmentHierarchy {
  id              String   @id @default(uuid()) @db.Uuid
  ancestorId      String   @map("ancestor_id") @db.Uuid
  descendantId    String   @map("descendant_id") @db.Uuid
  depth           Int      @default(0)
  createdAt       DateTime @default(now()) @map("created_at")

  // Relations
  ancestor   Department @relation(fields: [ancestorId], references: [id], onDelete: Cascade)
  descendant Department @relation(fields: [descendantId], references: [id], onDelete: Cascade)

  @@unique([ancestorId, descendantId])
  @@index([ancestorId])
  @@index([descendantId])
  @@map("department_hierarchies")
}

/// Employee profiles linked to users with organizational data.
model EmployeeProfile {
  id            String        @id @default(uuid()) @db.Uuid
  userId        String        @unique @map("user_id") @db.Uuid
  companyId     String        @map("company_id") @db.Uuid
  officeId      String?       @map("office_id") @db.Uuid
  departmentId  String?       @map("department_id") @db.Uuid
  employeeCode  String        @unique @map("employee_code") @db.VarChar(50)
  jobTitle      String?       @map("job_title") @db.VarChar(200)
  designation   String?       @db.VarChar(200)
  employmentType String?      @map("employment_type") @db.VarChar(50)
  status        EmployeeStatus @default(ACTIVE)
  dateOfJoining DateTime?     @map("date_of_joining")
  dateOfExit    DateTime?     @map("date_of_exit")
  reportingToId String?       @map("reporting_to_id") @db.Uuid
  dateOfBirth   DateTime?     @map("date_of_birth")
  gender        String?       @db.VarChar(20)
  bloodGroup    String?       @map("blood_group") @db.VarChar(5)
  address       String?       @db.Text
  emergencyContactName  String? @map("emergency_contact_name") @db.VarChar(200)
  emergencyContactPhone String? @map("emergency_contact_phone") @db.VarChar(20)
  bankName      String?       @map("bank_name") @db.VarChar(200)
  bankAccountNumber String?  @map("bank_account_number") @db.VarChar(50)
  taxId         String?       @map("tax_id") @db.VarChar(50)
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  // Relations
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  company      Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  office       Office?      @relation(fields: [officeId], references: [id], onDelete: SetNull)
  department   Department?  @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  allocations  AssetAllocation[]
  bookings     ResourceBooking[]
  auditResults AuditResult[]

  @@index([companyId])
  @@index([departmentId])
  @@index([officeId])
  @@index([employeeCode])
  @@index([status])
  @@map("employee_profiles")
}

// ============================================================================
// ASSETS
// ============================================================================

/// Hierarchical asset categorization (e.g., IT > Laptops > MacBooks).
model AssetCategory {
  id          String    @id @default(uuid()) @db.Uuid
  parentId    String?   @map("parent_id") @db.Uuid
  name        String    @db.VarChar(200)
  code        String?   @db.VarChar(50)
  description String?   @db.Text
  icon        String?   @db.VarChar(100)
  isActive    Boolean   @default(true) @map("is_active")
  sortOrder   Int       @default(0) @map("sort_order")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  parent         AssetCategory?       @relation("CategoryTree", fields: [parentId], references: [id])
  children       AssetCategory[]      @relation("CategoryTree")
  customFields   CategoryCustomField[]
  assets         Asset[]

  @@unique([parentId, name])
  @@index([parentId])
  @@index([name])
  @@map("asset_categories")
}

/// Custom field definitions per category for flexible asset metadata.
model CategoryCustomField {
  id           String    @id @default(uuid()) @db.Uuid
  categoryId   String    @map("category_id") @db.Uuid
  name         String    @db.VarChar(100)
  label        String    @db.VarChar(200)
  type         String    @db.VarChar(50)
  defaultValue String?   @map("default_value") @db.Text
  options      Json?     @db.Json
  isRequired   Boolean   @default(false) @map("is_required")
  isActive     Boolean   @default(true) @map("is_active")
  sortOrder    Int       @default(0) @map("sort_order")
  createdAt    DateTime  @default(now()) @map("created_at")

  // Relations
  category AssetCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([categoryId, name])
  @@index([categoryId])
  @@map("category_custom_fields")
}

/// Core asset record. The central entity of the entire system.
model Asset {
  id               String        @id @default(uuid()) @db.Uuid
  assetTag         String        @unique @map("asset_tag") @db.VarChar(100)
  serialNumber     String?       @unique @map("serial_number") @db.VarChar(200)
  name             String        @db.VarChar(300)
  description      String?       @db.Text
  companyId        String        @map("company_id") @db.Uuid
  categoryId       String        @map("category_id") @db.Uuid
  officeId         String?       @map("office_id") @db.Uuid
  buildingId       String?       @map("building_id") @db.Uuid
  floorId          String?       @map("floor_id") @db.Uuid
  locationId       String?       @map("location_id") @db.Uuid
  departmentId     String?       @map("department_id") @db.Uuid
  status           AssetStatus   @default(AVAILABLE)
  condition        AssetCondition @default(GOOD)
  purchaseDate     DateTime?     @map("purchase_date")
  purchasePrice    Float?        @map("purchase_price") @db.Decimal(15, 2)
  currentValue     Float?        @map("current_value") @db.Decimal(15, 2)
  depreciationRate Float?        @map("depreciation_rate") @db.Decimal(5, 2)
  warrantyExpiry   DateTime?     @map("warranty_expiry")
  insuranceExpiry  DateTime?     @map("insurance_expiry")
  manufacturer     String?       @db.VarChar(200)
  model            String?       @db.VarChar(200)
  brand            String?       @db.VarChar(200)
  color            String?       @db.VarChar(50)
  specifications   Json?         @db.Json
  customAttributes Json?         @map("custom_attributes") @db.Json
  qrCodeData       String?       @unique @map("qr_code_data") @db.VarChar(500)
  barcodeData      String?       @unique @map("barcode_data") @db.VarChar(500)
  isActive         Boolean       @default(true) @map("is_active")
  disposalDate     DateTime?     @map("disposal_date")
  disposalValue    Float?        @map("disposal_value") @db.Decimal(15, 2)
  disposalReason   String?       @map("disposal_reason") @db.Text
  createdBy        String?       @map("created_by") @db.Uuid
  updatedBy        String?       @map("updated_by") @db.Uuid
  createdAt        DateTime      @default(now()) @map("created_at")
  updatedAt        DateTime      @updatedAt @map("updated_at")
  deletedAt        DateTime?     @map("deleted_at")

  // Relations
  company          Company          @relation(fields: [companyId], references: [id], onDelete: Cascade)
  category         AssetCategory    @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  office           Office?          @relation(fields: [officeId], references: [id], onDelete: SetNull)
  building         Building?        @relation(fields: [buildingId], references: [id], onDelete: SetNull)
  floor            Floor?           @relation(fields: [floorId], references: [id], onDelete: SetNull)
  location         Location?        @relation(fields: [locationId], references: [id], onDelete: SetNull)
  department       Department?      @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  creator          User?            @relation("AssetCreator", fields: [createdBy], references: [id])
  updater          User?            @relation("AssetUpdater", fields: [updatedBy], references: [id])
  images           AssetImage[]
  documents        AssetDocument[]
  qrCode           AssetQrCode?
  statusHistory    AssetStatusHistory[]
  allocations      AssetAllocation[]
  returns          AssetReturn[]
  tags             AssetTag[]
  labels           AssetLabel[]
  maintenanceRequests MaintenanceRequest[]
  transferRequests TransferRequest[]
  audits           AuditResult[]
  iotSensor        FutureIotSensor?
  rfidTag          FutureRfidTag?
  barcodeScans     FutureBarcodeScan[]
  aiPredictions    AiPrediction[]
  bookingResources SharedResource?

  @@index([companyId])
  @@index([categoryId])
  @@index([status])
  @@index([condition])
  @@index([officeId])
  @@index([departmentId])
  @@index([locationId])
  @@index([createdAt])
  @@index([purchaseDate])
  @@map("assets")
}

/// Image attachments for assets.
model AssetImage {
  id         String   @id @default(uuid()) @db.Uuid
  assetId    String   @map("asset_id") @db.Uuid
  url        String   @db.VarChar(500)
  fileName   String   @map("file_name") @db.VarChar(255)
  fileSize   Int?     @map("file_size")
  mimeType   String?  @map("mime_type") @db.VarChar(100)
  isPrimary  Boolean  @default(false) @map("is_primary")
  caption    String?  @db.VarChar(500)
  sortOrder  Int      @default(0) @map("sort_order")
  uploadedBy String?  @map("uploaded_by") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at")

  // Relations
  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)

  @@index([assetId])
  @@map("asset_images")
}

/// Document attachments for assets (invoices, warranty cards, etc.).
model AssetDocument {
  id         String   @id @default(uuid()) @db.Uuid
  assetId    String   @map("asset_id") @db.Uuid
  url        String   @db.VarChar(500)
  fileName   String   @map("file_name") @db.VarChar(255)
  fileSize   Int?     @map("file_size")
  mimeType   String?  @map("mime_type") @db.VarChar(100)
  documentType String? @map("document_type") @db.VarChar(50)
  description String?  @db.Text
  uploadedBy String?  @map("uploaded_by") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at")

  // Relations
  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)

  @@index([assetId])
  @@map("asset_documents")
}

/// QR code records for asset identification and quick-lookup.
model AssetQrCode {
  id        String   @id @default(uuid()) @db.Uuid
  assetId   String   @unique @map("asset_id") @db.Uuid
  code      String   @unique @db.VarChar(255)
  qrImageUrl String? @map("qr_image_url") @db.VarChar(500)
  isActive  Boolean  @default(true) @map("is_active")
  scannedCount Int   @default(0) @map("scanned_count")
  lastScannedAt DateTime? @map("last_scanned_at")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)

  @@index([code])
  @@map("asset_qr_codes")
}

/// Status change audit trail for every asset.
model AssetStatusHistory {
  id          String       @id @default(uuid()) @db.Uuid
  assetId     String       @map("asset_id") @db.Uuid
  fromStatus  AssetStatus? @map("from_status")
  toStatus    AssetStatus  @map("to_status")
  reason      String?      @db.Text
  changedBy   String?      @map("changed_by") @db.Uuid
  changedAt   DateTime     @default(now()) @map("changed_at")

  // Relations
  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)

  @@index([assetId])
  @@index([changedAt])
  @@map("asset_status_history")
}

/// Asset allocation records tracking who has which asset.
model AssetAllocation {
  id           String           @id @default(uuid()) @db.Uuid
  assetId      String           @map("asset_id") @db.Uuid
  userId       String           @map("user_id") @db.Uuid
  employeeId   String?          @map("employee_id") @db.Uuid
  allocatedBy  String?          @map("allocated_by") @db.Uuid
  allocatedAt  DateTime         @default(now()) @map("allocated_at")
  expectedReturnDate DateTime?  @map("expected_return_date")
  actualReturnDate   DateTime?  @map("actual_return_date")
  status       AllocationStatus @default(PENDING)
  purpose      String?          @db.Text
  notes        String?          @db.Text
  approvedBy   String?          @map("approved_by") @db.Uuid
  approvedAt   DateTime?        @map("approved_at")
  createdAt    DateTime         @default(now()) @map("created_at")
  updatedAt    DateTime         @updatedAt @map("updated_at")

  // Relations
  asset    Asset         @relation(fields: [assetId], references: [id], onDelete: Cascade)
  user     User          @relation("AllocationUser", fields: [userId], references: [id], onDelete: Restrict)
  history  AllocationHistory[]
  return   AssetReturn?

  @@index([assetId])
  @@index([userId])
  @@index([status])
  @@index([allocatedAt])
  @@index([expectedReturnDate])
  @@map("asset_allocations")
}

/// Historical log of allocation changes for audit purposes.
model AllocationHistory {
  id            String           @id @default(uuid()) @db.Uuid
  allocationId  String           @map("allocation_id") @db.Uuid
  fromStatus    AllocationStatus? @map("from_status")
  toStatus      AllocationStatus  @map("to_status")
  notes         String?          @db.Text
  changedBy     String?          @map("changed_by") @db.Uuid
  changedAt     DateTime         @default(now()) @map("changed_at")

  // Relations
  allocation AssetAllocation @relation(fields: [allocationId], references: [id], onDelete: Cascade)

  @@index([allocationId])
  @@index([changedAt])
  @@map("allocation_history")
}

/// Asset return records tracking when assets are returned.
model AssetReturn {
  id            String    @id @default(uuid()) @db.Uuid
  allocationId  String    @unique @map("allocation_id") @db.Uuid
  assetId       String    @map("asset_id") @db.Uuid
  returnedBy    String?   @map("returned_by") @db.Uuid
  returnedAt    DateTime  @default(now()) @map("returned_at")
  condition     AssetCondition @default(GOOD)
  notes         String?   @db.Text
  inspectedBy   String?   @map("inspected_by") @db.Uuid
  inspectedAt   DateTime? @map("inspected_at")
  createdAt     DateTime  @default(now()) @map("created_at")

  // Relations
  allocation AssetAllocation @relation(fields: [allocationId], references: [id], onDelete: Cascade)
  asset      Asset           @relation(fields: [assetId], references: [id], onDelete: Cascade)

  @@index([assetId])
  @@index([returnedAt])
  @@map("asset_returns")
}

/// Inter-office/inter-department asset transfer requests.
model TransferRequest {
  id               String         @id @default(uuid()) @db.Uuid
  assetId          String         @map("asset_id") @db.Uuid
  fromCompanyId    String?        @map("from_company_id") @db.Uuid
  toCompanyId      String?        @map("to_company_id") @db.Uuid
  fromOfficeId     String?        @map("from_office_id") @db.Uuid
  toOfficeId       String?        @map("to_office_id") @db.Uuid
  fromDepartmentId String?        @map("from_department_id") @db.Uuid
  toDepartmentId   String?        @map("to_department_id") @db.Uuid
  fromLocationId   String?        @map("from_location_id") @db.Uuid
  toLocationId     String?        @map("to_location_id") @db.Uuid
  requestedBy      String         @map("requested_by") @db.Uuid
  status           TransferStatus @default(REQUESTED)
  priority         PriorityLevel  @default(MEDIUM)
  reason           String?        @db.Text
  expectedDate     DateTime?      @map("expected_date")
  approvedBy       String?        @map("approved_by") @db.Uuid
  approvedAt       DateTime?      @map("approved_at")
  receivedBy       String?        @map("received_by") @db.Uuid
  receivedAt       DateTime?      @map("received_at")
  completedAt      DateTime?      @map("completed_at")
  notes            String?        @db.Text
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")

  // Relations
  asset         Asset          @relation(fields: [assetId], references: [id], onDelete: Cascade)
  history       TransferHistory[]

  @@index([assetId])
  @@index([requestedBy])
  @@index([status])
  @@index([fromOfficeId])
  @@index([toOfficeId])
  @@index([createdAt])
  @@map("transfer_requests")
}

/// Transfer status change history.
model TransferHistory {
  id              String         @id @default(uuid()) @db.Uuid
  transferId      String         @map("transfer_id") @db.Uuid
  fromStatus      TransferStatus? @map("from_status")
  toStatus        TransferStatus  @map("to_status")
  notes           String?        @db.Text
  changedBy       String?        @map("changed_by") @db.Uuid
  changedAt       DateTime       @default(now()) @map("changed_at")

  // Relations
  transfer TransferRequest @relation(fields: [transferId], references: [id], onDelete: Cascade)

  @@index([transferId])
  @@index([changedAt])
  @@map("transfer_history")
}

// ============================================================================
// SHARED RESOURCES & BOOKINGS
// ============================================================================

/// Bookable shared resources (meeting rooms, projectors, vehicles, etc.).
model SharedResource {
  id            String         @id @default(uuid()) @db.Uuid
  companyId     String         @map("company_id") @db.Uuid
  assetId       String?        @unique @map("asset_id") @db.Uuid
  name          String         @db.VarChar(200)
  description   String?        @db.Text
  resourceType  String         @map("resource_type") @db.VarChar(50)
  capacity      Int?
  location      String?        @db.VarChar(300)
  officeId      String?        @map("office_id") @db.Uuid
  isActive      Boolean        @default(true) @map("is_active")
  isBookable    Boolean        @default(true) @map("is_bookable")
  requiresApproval Boolean     @default(false) @map("requires_approval")
  maxBookingDuration Int?      @map("max_booking_duration")
  rules         Json?          @db.Json
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")

  // Relations
  asset       Asset?              @relation(fields: [assetId], references: [id], onDelete: SetNull)
  bookings    ResourceBooking[]

  @@index([companyId])
  @@index([resourceType])
  @@index([officeId])
  @@map("shared_resources")
}

/// Resource booking records for shared resource scheduling.
model ResourceBooking {
  id             String        @id @default(uuid()) @db.Uuid
  resourceId     String        @map("resource_id") @db.Uuid
  userId         String        @map("user_id") @db.Uuid
  employeeId     String?       @map("employee_id") @db.Uuid
  title          String        @db.VarChar(300)
  description    String?       @db.Text
  startDateTime  DateTime      @map("start_date_time")
  endDateTime    DateTime      @map("end_date_time")
  status         BookingStatus @default(PENDING)
  priority       PriorityLevel @default(MEDIUM)
  isRecurring    Boolean       @default(false) @map("is_recurring")
  recurrenceRule String?       @map("recurrence_rule") @db.Text
  attendeesCount Int           @default(0) @map("attendees_count")
  approvedBy     String?       @map("approved_by") @db.Uuid
  approvedAt     DateTime?     @map("approved_at")
  cancelledAt    DateTime?     @map("cancelled_at")
  cancelReason   String?       @map("cancel_reason") @db.Text
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  // Relations
  resource     SharedResource      @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  user         User                @relation(fields: [userId], references: [id], onDelete: Restrict)
  participants BookingParticipant[]
  history      BookingHistory[]

  @@index([resourceId])
  @@index([userId])
  @@index([status])
  @@index([startDateTime])
  @@index([endDateTime])
  @@index([resourceId, startDateTime, endDateTime])
  @@map("resource_bookings")
}

/// Participants in a resource booking.
model BookingParticipant {
  id        String   @id @default(uuid()) @db.Uuid
  bookingId String   @map("booking_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  status    String   @default("INVITED") @db.VarChar(50)
  respondedAt DateTime? @map("responded_at")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  booking ResourceBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@unique([bookingId, userId])
  @@index([bookingId])
  @@index([userId])
  @@map("booking_participants")
}

/// Booking status change history for audit trail.
model BookingHistory {
  id         String        @id @default(uuid()) @db.Uuid
  bookingId  String        @map("booking_id") @db.Uuid
  fromStatus BookingStatus? @map("from_status")
  toStatus   BookingStatus  @map("to_status")
  notes      String?       @db.Text
  changedBy  String?       @map("changed_by") @db.Uuid
  changedAt  DateTime      @default(now()) @map("changed_at")

  // Relations
  booking ResourceBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([bookingId])
  @@index([changedAt])
  @@map("booking_history")
}

// ============================================================================
// MAINTENANCE
// ============================================================================

/// Maintenance request records for asset upkeep and repairs.
model MaintenanceRequest {
  id            String            @id @default(uuid()) @db.Uuid
  assetId       String            @map("asset_id") @db.Uuid
  requestedBy   String            @map("requested_by") @db.Uuid
  title         String            @db.VarChar(300)
  description   String?           @db.Text
  status        MaintenanceStatus @default(REQUESTED)
  priority      PriorityLevel     @default(MEDIUM)
  type          String?           @db.VarChar(50)
  estimatedCost Float?            @map("estimated_cost") @db.Decimal(15, 2)
  actualCost    Float?            @map("actual_cost") @db.Decimal(15, 2)
  scheduledDate DateTime?         @map("scheduled_date")
  startedAt     DateTime?         @map("started_at")
  completedAt   DateTime?         @map("completed_at")
  approvedBy    String?           @map("approved_by") @db.Uuid
  approvedAt    DateTime?         @map("approved_at")
  verifiedBy    String?           @map("verified_by") @db.Uuid
  verifiedAt    DateTime?         @map("verified_at")
  rejectionReason String?         @map("rejection_reason") @db.Text
  notes         String?           @db.Text
  createdAt     DateTime          @default(now()) @map("created_at")
  updatedAt     DateTime          @updatedAt @map("updated_at")

  // Relations
  asset          Asset                  @relation(fields: [assetId], references: [id], onDelete: Cascade)
  requestor      User                   @relation(fields: [requestedBy], references: [id], onDelete: Restrict)
  attachments    MaintenanceAttachment[]
  statusHistory  MaintenanceStatusHistory[]
  technicians    TechnicianAssignment[]

  @@index([assetId])
  @@index([requestedBy])
  @@index([status])
  @@index([priority])
  @@index([scheduledDate])
  @@index([createdAt])
  @@map("maintenance_requests")
}

/// File attachments for maintenance requests.
model MaintenanceAttachment {
  id             String   @id @default(uuid()) @db.Uuid
  maintenanceId  String   @map("maintenance_id") @db.Uuid
  url            String   @db.VarChar(500)
  fileName       String   @map("file_name") @db.VarChar(255)
  fileSize       Int?     @map("file_size")
  mimeType       String?  @map("mime_type") @db.VarChar(100)
  uploadedBy     String?  @map("uploaded_by") @db.Uuid
  createdAt      DateTime @default(now()) @map("created_at")

  // Relations
  maintenance MaintenanceRequest @relation(fields: [maintenanceId], references: [id], onDelete: Cascade)

  @@index([maintenanceId])
  @@map("maintenance_attachments")
}

/// Maintenance status change history for full audit trail.
model MaintenanceStatusHistory {
  id            String            @id @default(uuid()) @db.Uuid
  maintenanceId String            @map("maintenance_id") @db.Uuid
  fromStatus    MaintenanceStatus? @map("from_status")
  toStatus      MaintenanceStatus  @map("to_status")
  notes         String?           @db.Text
  changedBy     String?           @map("changed_by") @db.Uuid
  changedAt     DateTime          @default(now()) @map("changed_at")

  // Relations
  maintenance MaintenanceRequest @relation(fields: [maintenanceId], references: [id], onDelete: Cascade)

  @@index([maintenanceId])
  @@index([changedAt])
  @@map("maintenance_status_history")
}

/// Technician assignments for maintenance work orders.
model TechnicianAssignment {
  id             String   @id @default(uuid()) @db.Uuid
  maintenanceId  String   @map("maintenance_id") @db.Uuid
  technicianName String   @map("technician_name") @db.VarChar(200)
  technicianContact String? @map("technician_contact") @db.VarChar(255)
  assignedRole   String?  @map("assigned_role") @db.VarChar(50)
  assignedAt     DateTime @default(now()) @map("assigned_at")
  completedAt    DateTime? @map("completed_at")
  notes          String?  @db.Text
  createdAt      DateTime @default(now()) @map("created_at")

  // Relations
  maintenance MaintenanceRequest @relation(fields: [maintenanceId], references: [id], onDelete: Cascade)

  @@index([maintenanceId])
  @@map("technician_assignments")
}

// ============================================================================
// AUDIT
// ============================================================================

/// Audit cycles defining periodic asset verification schedules.
model AuditCycle {
  id          String     @id @default(uuid()) @db.Uuid
  companyId   String     @map("company_id") @db.Uuid
  name        String     @db.VarChar(200)
  description String?    @db.Text
  startDate   DateTime   @map("start_date")
  endDate     DateTime   @map("end_date")
  status      AuditStatus @default(SCHEDULED)
  createdBy   String?    @map("created_by") @db.Uuid
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  // Relations
  company     Company          @relation(fields: [companyId], references: [id], onDelete: Cascade)
  assignments AuditAssignment[]
  results     AuditResult[]

  @@index([companyId])
  @@index([status])
  @@index([startDate, endDate])
  @@map("audit_cycles")
}

/// Audit assignments linking auditors to audit cycles.
model AuditAssignment {
  id          String   @id @default(uuid()) @db.Uuid
  cycleId     String   @map("cycle_id") @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  assignedAt  DateTime @default(now()) @map("assigned_at")
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  cycle AuditCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  user  User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([cycleId, userId])
  @@index([cycleId])
  @@index([userId])
  @@map("audit_assignments")
}

/// Individual audit findings per asset within a cycle.
model AuditResult {
  id              String    @id @default(uuid()) @db.Uuid
  cycleId         String    @map("cycle_id") @db.Uuid
  assetId         String    @map("asset_id") @db.Uuid
  employeeId      String?   @map("employee_id") @db.Uuid
  status          AuditStatus @default(IN_PROGRESS)
  isMatch         Boolean?  @map("is_match")
  condition       AssetCondition?
  locationFound   String?   @map("location_found") @db.VarChar(300)
  notes           String?   @db.Text
  discrepancyFound Boolean @default(false) @map("discrepancy_found")
  auditedAt       DateTime? @map("audited_at")
  verifiedBy      String?   @map("verified_by") @db.Uuid
  verifiedAt      DateTime? @map("verified_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  cycle      AuditCycle          @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  asset      Asset               @relation(fields: [assetId], references: [id], onDelete: Cascade)
  discrepancies AuditDiscrepancy[]

  @@unique([cycleId, assetId])
  @@index([cycleId])
  @@index([assetId])
  @@index([status])
  @@map("audit_results")
}

/// Discrepancies found during audits requiring resolution.
model AuditDiscrepancy {
  id              String   @id @default(uuid()) @db.Uuid
  resultId        String   @map("result_id") @db.Uuid
  type            String   @db.VarChar(50)
  description     String   @db.Text
  severity        PriorityLevel @default(MEDIUM)
  resolved        Boolean  @default(false)
  resolution      String?  @db.Text
  resolvedBy      String?  @map("resolved_by") @db.Uuid
  resolvedAt      DateTime? @map("resolved_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  result AuditResult @relation(fields: [resultId], references: [id], onDelete: Cascade)

  @@index([resultId])
  @@index([resolved])
  @@index([severity])
  @@map("audit_discrepancies")
}

// ============================================================================
// NOTIFICATIONS & ACTIVITY LOGGING
// ============================================================================

/// Notification records for in-app alerts and messages.
model Notification {
  id          String           @id @default(uuid()) @db.Uuid
  userId      String           @map("user_id") @db.Uuid
  title       String           @db.VarChar(300)
  message     String           @db.Text
  type        String           @db.VarChar(50)
  status      NotificationStatus @default(UNREAD)
  priority    PriorityLevel    @default(MEDIUM)
  entityType  String?          @map("entity_type") @db.VarChar(50)
  entityId    String?          @map("entity_id") @db.Uuid
  actionUrl   String?          @map("action_url") @db.VarChar(500)
  metadata    Json?            @db.Json
  readAt      DateTime?        @map("read_at")
  expiresAt   DateTime?        @map("expires_at")
  createdAt   DateTime         @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([type])
  @@index([createdAt])
  @@index([userId, status])
  @@map("notifications")
}

/// User notification preferences for controlling alert delivery.
model NotificationPreference {
  id                String    @id @default(uuid()) @db.Uuid
  userId            String    @map("user_id") @db.Uuid
  notificationType  String    @map("notification_type") @db.VarChar(50)
  inAppEnabled      Boolean   @default(true) @map("in_app_enabled")
  emailEnabled      Boolean   @default(true) @map("email_enabled")
  smsEnabled        Boolean   @default(false) @map("sms_enabled")
  pushEnabled       Boolean   @default(false) @map("push_enabled")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, notificationType])
  @@index([userId])
  @@map("notification_preferences")
}

/// Comprehensive activity log for all system actions and audit trail.
model ActivityLog {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String?   @map("user_id") @db.Uuid
  action      String    @db.VarChar(100)
  entityType  String    @map("entity_type") @db.VarChar(50)
  entityId    String?   @map("entity_id") @db.Uuid
  oldValue    Json?     @map("old_value") @db.Json
  newValue    Json?     @map("new_value") @db.Json
  ipAddress   String?   @map("ip_address") @db.VarChar(45)
  userAgent   String?   @map("user_agent") @db.Text
  metadata    Json?     @db.Json
  createdAt   DateTime  @default(now()) @map("created_at")

  // Relations
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("activity_logs")
}

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

/// Custom report definitions saved by users.
model ReportMetadata {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  name        String   @db.VarChar(200)
  description String?  @db.Text
  reportType  String   @map("report_type") @db.VarChar(50)
  config      Json     @db.Json
  isPublic    Boolean  @default(false) @map("is_public")
  createdBy   String?  @map("created_by") @db.Uuid
  lastRunAt   DateTime? @map("last_run_at")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@index([companyId])
  @@index([reportType])
  @@map("report_metadata")
}

/// Dashboard widget configurations per user or globally.
model DashboardWidget {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String?  @map("user_id") @db.Uuid
  widgetType  String   @map("widget_type") @db.VarChar(50)
  title       String   @db.VarChar(200)
  config      Json     @db.Json
  position    Int      @default(0)
  isVisible   Boolean  @default(true) @map("is_visible")
  size        String?  @db.VarChar(50)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([userId])
  @@index([widgetType])
  @@map("dashboard_widgets")
}

/// Email template definitions for system-generated emails.
model EmailTemplate {
  id         String    @id @default(uuid()) @db.Uuid
  companyId  String?   @map("company_id") @db.Uuid
  name       String    @db.VarChar(200)
  subject    String    @db.VarChar(500)
  bodyHtml   String    @map("body_html") @db.Text
  bodyText   String?   @map("body_text") @db.Text
  variables  Json?     @db.Json
  isActive   Boolean   @default(true) @map("is_active")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  // Relations
  company Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)

  @@unique([companyId, name])
  @@index([companyId])
  @@map("email_templates")
}

/// Global and company-level system settings.
model SystemSetting {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String?  @map("company_id") @db.Uuid
  key         String   @db.VarChar(200)
  value       Json     @db.Json
  description String?  @db.Text
  isEncrypted Boolean  @default(false) @map("is_encrypted")
  category    String?  @db.VarChar(100)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  company Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)

  @@unique([companyId, key])
  @@index([companyId])
  @@index([key])
  @@map("system_settings")
}

/// Dropdown/lookup value definitions for standardizing form inputs.
model LookupTable {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String?  @map("company_id") @db.Uuid
  category    String   @db.VarChar(100)
  code        String   @db.VarChar(100)
  label       String   @db.VarChar(200)
  description String?  @db.Text
  sortOrder   Int      @default(0) @map("sort_order")
  isActive    Boolean  @default(true) @map("is_active")
  metadata    Json?    @db.Json
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  company Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)

  @@unique([companyId, category, code])
  @@index([companyId])
  @@index([category])
  @@map("lookup_tables")
}

/// Master status configuration for customizable workflow states.
model MasterStatusTable {
  id          String    @id @default(uuid()) @db.Uuid
  companyId   String?   @map("company_id") @db.Uuid
  entity      String    @db.VarChar(50)
  status      String    @db.VarChar(50)
  label       String    @db.VarChar(200)
  color       String?   @db.VarChar(20)
  icon        String?   @db.VarChar(100)
  sortOrder   Int       @default(0) @map("sort_order")
  isActive    Boolean   @default(true) @map("is_active")
  isDefault   Boolean   @default(false) @map("is_default")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  company Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)

  @@unique([companyId, entity, status])
  @@index([companyId])
  @@index([entity])
  @@map("master_status_tables")
}

// ============================================================================
// LOCATION REFERENCE DATA
// ============================================================================

/// Country reference data.
model Country {
  id        String  @id @default(uuid()) @db.Uuid
  name      String  @db.VarChar(200)
  code      String  @unique @db.VarChar(10)
  phoneCode String? @map("phone_code") @db.VarChar(10)
  currency  String? @db.VarChar(3)
  isActive  Boolean @default(true) @map("is_active")

  states    State[]

  @@index([code])
  @@map("countries")
}

/// State/province reference data.
model State {
  id        String  @id @default(uuid()) @db.Uuid
  countryId String  @map("country_id") @db.Uuid
  name      String  @db.VarChar(200)
  code      String? @db.VarChar(10)
  isActive  Boolean @default(true) @map("is_active")

  // Relations
  country Country @relation(fields: [countryId], references: [id], onDelete: Cascade)
  cities  City[]

  @@unique([countryId, name])
  @@index([countryId])
  @@map("states")
}

/// City reference data.
model City {
  id        String  @id @default(uuid()) @db.Uuid
  stateId   String  @map("state_id") @db.Uuid
  name      String  @db.VarChar(200)
  postalCode String? @map("postal_code") @db.VarChar(20)
  latitude  Float?  @db.Decimal(10, 8)
  longitude Float?  @db.Decimal(11, 8)
  isActive  Boolean @default(true) @map("is_active")

  // Relations
  state State @relation(fields: [stateId], references: [id], onDelete: Cascade)

  @@index([stateId])
  @@map("cities")
}

/// Company-specific holiday calendars.
model HolidayCalendar {
  id          String    @id @default(uuid()) @db.Uuid
  companyId   String    @map("company_id") @db.Uuid
  name        String    @db.VarChar(200)
  date        DateTime  @db.Date
  description String?   @db.Text
  isRecurring Boolean   @default(false) @map("is_recurring")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")

  // Relations
  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@index([companyId])
  @@index([date])
  @@map("holiday_calendars")
}

/// Company working hours configuration.
model WorkingHour {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  dayOfWeek   Int      @map("day_of_week")
  startTime   String   @map("start_time") @db.VarChar(5)
  endTime     String   @map("end_time") @db.VarChar(5)
  isBreak     Boolean  @default(false) @map("is_break")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([companyId, dayOfWeek, isBreak])
  @@index([companyId])
  @@map("working_hours")
}

/// File storage tracking for uploaded files.
model FileStorage {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String?  @map("company_id") @db.Uuid
  fileName    String   @map("file_name") @db.VarChar(255)
  originalName String  @map("original_name") @db.VarChar(255)
  mimeType    String   @map("mime_type") @db.VarChar(100)
  fileSize    Int      @map("file_size")
  filePath    String   @map("file_path") @db.VarChar(1000)
  fileUrl     String   @map("file_url") @db.VarChar(1000)
  checksum    String?  @db.VarChar(64)
  uploadedBy  String?  @map("uploaded_by") @db.Uuid
  entityType  String?  @map("entity_type") @db.VarChar(50)
  entityId    String?  @map("entity_id") @db.Uuid
  isDeleted   Boolean  @default(false) @map("is_deleted")
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  company Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)

  @@index([companyId])
  @@index([entityType, entityId])
  @@index([uploadedBy])
  @@map("file_storages")
}

// ============================================================================
// TAGS & LABELS
// ============================================================================

/// Reusable tags for flexible asset classification.
model Tag {
  id        String   @id @default(uuid()) @db.Uuid
  name      String   @unique @db.VarChar(100)
  color     String?  @db.VarChar(20)
  createdAt DateTime @default(now()) @map("created_at")

  assets    AssetTag[]

  @@index([name])
  @@map("tags")
}

/// Junction table linking assets to tags (many-to-many).
model AssetTag {
  id        String   @id @default(uuid()) @db.Uuid
  assetId   String   @map("asset_id") @db.Uuid
  tagId     String   @map("tag_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)
  tag   Tag   @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([assetId, tagId])
  @@index([assetId])
  @@index([tagId])
  @@map("asset_tags")
}

/// Asset labels for classification/batch grouping (e.g., "Critical Infrastructure").
model AssetLabel {
  id          String   @id @default(uuid()) @db.Uuid
  assetId     String   @map("asset_id") @db.Uuid
  name        String   @db.VarChar(100)
  color       String?  @db.VarChar(20)
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)

  @@index([assetId])
  @@map("asset_labels")
}

/// Custom key-value attributes for assets without schema changes.
model CustomAttribute {
  id        String   @id @default(uuid()) @db.Uuid
  assetId   String   @map("asset_id") @db.Uuid
  key       String   @db.VarChar(100)
  value     String   @db.Text
  valueType String   @default("string") @map("value_type") @db.VarChar(50)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([assetId, key])
  @@index([assetId])
  @@map("custom_attributes")
}

// ============================================================================
// SECURITY
// ============================================================================

/// API tokens for programmatic access and integrations.
model ApiToken {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  companyId   String?   @map("company_id") @db.Uuid
  name        String    @db.VarChar(200)
  tokenHash   String    @unique @map("token_hash") @db.VarChar(255)
  prefix      String    @db.VarChar(10)
  scopes      Json?     @db.Json
  isActive    Boolean   @default(true) @map("is_active")
  expiresAt   DateTime? @map("expires_at")
  lastUsedAt  DateTime? @map("last_used_at")
  lastUsedIp  String?   @map("last_used_ip") @db.VarChar(45)
  revokedAt   DateTime? @map("revoked_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  // Relations
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  company Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([companyId])
  @@index([tokenHash])
  @@index([isActive])
  @@map("api_tokens")
}

// ============================================================================
// FUTURE: IoT & RFID
// ============================================================================

/// IoT sensor definitions deployed on assets for real-time monitoring.
model FutureIotSensor {
  id          String    @id @default(uuid()) @db.Uuid
  assetId     String    @unique @map("asset_id") @db.Uuid
  sensorType  String    @map("sensor_type") @db.VarChar(100)
  model       String?   @db.VarChar(200)
  firmware    String?   @db.VarChar(100)
  isActive    Boolean   @default(true) @map("is_active")
  lastPingAt  DateTime? @map("last_ping_at")
  config      Json?     @db.Json
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  asset   Asset            @relation(fields: [assetId], references: [id], onDelete: Cascade)
  readings FutureIotReading[]

  @@index([sensorType])
  @@index([isActive])
  @@map("future_iot_sensors")
}

/// IoT sensor readings time-series data.
model FutureIotReading {
  id          String   @id @default(uuid()) @db.Uuid
  sensorId    String   @map("sensor_id") @db.Uuid
  metricName  String   @map("metric_name") @db.VarChar(100)
  value       Float
  unit        String?  @db.VarChar(20)
  isAnomaly   Boolean  @default(false) @map("is_anomaly")
  recordedAt  DateTime @default(now()) @map("recorded_at")
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  sensor FutureIotSensor @relation(fields: [sensorId], references: [id], onDelete: Cascade)

  @@index([sensorId])
  @@index([recordedAt])
  @@index([sensorId, metricName, recordedAt])
  @@map("future_iot_readings")
}

/// RFID tag definitions for asset tracking.
model FutureRfidTag {
  id          String    @id @default(uuid()) @db.Uuid
  assetId     String    @unique @map("asset_id") @db.Uuid
  tagEpc      String    @unique @map("tag_epc") @db.VarChar(100)
  tagType     String?   @map("tag_type") @db.VarChar(50)
  frequency   String?   @db.VarChar(20)
  isActive    Boolean   @default(true) @map("is_active")
  lastReadAt  DateTime? @map("last_read_at")
  lastReaderId String?  @map("last_reader_id") @db.VarChar(100)
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)

  @@index([tagEpc])
  @@index([isActive])
  @@map("future_rfid_tags")
}

/// Barcode scan events for asset tracking.
model FutureBarcodeScan {
  id          String   @id @default(uuid()) @db.Uuid
  assetId     String   @map("asset_id") @db.Uuid
  barcodeData String   @map("barcode_data") @db.VarChar(500)
  scannerId   String?  @map("scanner_id") @db.VarChar(100)
  scannedBy   String?  @map("scanned_by") @db.Uuid
  location    String?  @db.VarChar(300)
  scanType    String?  @map("scan_type") @db.VarChar(50)
  scannedAt   DateTime @default(now()) @map("scanned_at")
  metadata    Json?    @db.Json

  // Relations
  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)

  @@index([assetId])
  @@index([barcodeData])
  @@index([scannedAt])
  @@map("future_barcode_scans")
}

// ============================================================================
// AI & ANALYTICS
// ============================================================================

/// AI prediction records for asset lifecycle analytics and insights.
model AiPrediction {
  id            String    @id @default(uuid()) @db.Uuid
  assetId       String?   @map("asset_id") @db.Uuid
  predictionType String   @map("prediction_type") @db.VarChar(100)
  modelVersion  String?   @map("model_version") @db.VarChar(50)
  confidence    Float?    @db.Decimal(5, 4)
  inputFeatures Json?     @map("input_features") @db.Json
  outputResult  Json?     @map("output_result") @db.Json
  predictedValue Float?   @map("predicted_value")
  predictedDate DateTime? @map("predicted_date")
  actualValue   Float?    @map("actual_value")
  actualDate    DateTime? @map("actual_date")
  isActive      Boolean   @default(true) @map("is_active")
  generatedAt   DateTime  @default(now()) @map("generated_at")
  createdAt     DateTime  @default(now()) @map("created_at")

  // Relations
  asset Asset? @relation(fields: [assetId], references: [id], onDelete: SetNull)

  @@index([assetId])
  @@index([predictionType])
  @@index([generatedAt])
  @@index([isActive])
  @@map("ai_predictions")
}

// ============================================================================
// APPROVAL REQUESTS (Cross-cutting concern)
// ============================================================================

/// Generic approval workflow requests used across allocations, transfers, etc.
model ApprovalRequest {
  id            String         @id @default(uuid()) @db.Uuid
  entityType    String         @map("entity_type") @db.VarChar(50)
  entityId      String         @map("entity_id") @db.Uuid
  requestedBy   String         @map("requested_by") @db.Uuid
  approvedBy    String?        @map("approved_by") @db.Uuid
  status        ApprovalStatus @default(PENDING)
  priority      PriorityLevel  @default(MEDIUM)
  comments      String?        @db.Text
  rejectionReason String?      @map("rejection_reason") @db.Text
  requestedAt   DateTime       @default(now()) @map("requested_at")
  respondedAt   DateTime?      @map("responded_at")
  expiresAt     DateTime?      @map("expires_at")
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")

  // Relations
  requestor User @relation(fields: [requestedBy], references: [id], onDelete: Restrict)

  @@index([entityType, entityId])
  @@index([requestedBy])
  @@index([approvedBy])
  @@index([status])
  @@index([createdAt])
  @@map("approval_requests")
}
```

---

## Schema Statistics

| Category | Models | Enums |
|----------|--------|-------|
| Enums | — | 15 |
| Auth & Users | 12 | — |
| Organization | 8 | — |
| Assets | 14 | — |
| Resources | 4 | — |
| Maintenance | 4 | — |
| Audit | 4 | — |
| Notifications | 3 | — |
| System | 6 | — |
| Location | 5 | — |
| Tags | 4 | — |
| Security | 1 | — |
| Future (IoT/RFID) | 4 | — |
| AI | 1 | — |
| Approval | 1 | — |
| **Total** | **71 models** | **15 enums** |

## Key Design Decisions

1. **Multi-tenancy**: `companyId` on most models enables data isolation per organization.
2. **Soft deletes**: `deletedAt` fields preserve data integrity without physical deletion.
3. **Audit trails**: Every status-changing entity has a companion `*History` model.
4. **UUID PKs**: `@default(uuid())` on all IDs for distributed-system compatibility.
5. **Snake_case tables**: `@@map()` on all models maps PascalCase to PostgreSQL conventions.
6. **Composite indexes**: Added on high-query columns (status + date, entity + type).
7. **Cascade deletes**: Auth and child records cascade; core references use `SetNull` or `Restrict`.
8. **Json columns**: Used for flexible/schema-less data (settings, specs, ML features).
9. **Enum safety**: Prisma enums map to PostgreSQL enums for type-safe status values.
10. **Future-proofing**: IoT, RFID, barcode, and AI models are included for roadmap features.
