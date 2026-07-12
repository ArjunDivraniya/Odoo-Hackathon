# AssetFlow Enterprise Asset Management System - Business Rules

> Comprehensive business rules governing the AssetFlow platform.
> These rules define constraints, validations, and workflows enforced at the database, application, and API layers.

---

## Table of Contents

1. [Asset Lifecycle Rules](#1-asset-lifecycle-rules)
2. [Allocation Rules](#2-allocation-rules)
3. [Booking Rules](#3-booking-rules)
4. [Transfer Rules](#4-transfer-rules)
5. [Maintenance Rules](#5-maintenance-rules)
6. [Audit Rules](#6-audit-rules)
7. [Authentication Rules](#7-authentication-rules)
8. [Authorization Rules](#8-authorization-rules)
9. [Notification Rules](#9-notification-rules)
10. [Data Integrity Rules](#10-data-integrity-rules)
11. [Performance Rules](#11-performance-rules)
12. [Security Rules](#12-security-rules)

---

## 1. Asset Lifecycle Rules

### 1.1 No Simultaneous Allocation

| Field | Detail |
|-------|--------|
| **Rule** | An asset cannot be allocated to more than one person at the same time. Only one active `AssetAllocation` record (status = `ACTIVE` or `APPROVED`) may exist per asset at any given time. |
| **Justification** | Prevents double-booking of physical assets and maintains a clear chain of custody. |
| **Enforcement** | Application logic: Before creating or approving an allocation, query `AssetAllocation` for any record with `assetId = X` and `status IN (PENDING, APPROVED, ACTIVE)`. If found, reject the new allocation. |
| **Violation** | Error returned: `"Asset is already allocated or has a pending allocation request."` The requesting user receives a 409 Conflict response. |
| **Edge Cases** | - If an existing allocation is `OVERDUE`, a new allocation request can still be created but requires admin override and automatic escalation notification to the overdue assignee. |

### 1.2 Only AVAILABLE Assets Can Be Allocated

| Field | Detail |
|-------|--------|
| **Rule** | Allocation can only be initiated for assets with `status = AVAILABLE`. |
| **Justification** | Ensures the asset is physically present, operational, and not committed elsewhere. |
| **Enforcement** | Application logic: Allocation creation endpoint checks `Asset.status === AVAILABLE` before proceeding. |
| **Violation** | Error: `"Asset must be AVAILABLE to be allocated. Current status: {status}."` |
| **Edge Cases** | - `DAMAGED` assets must be repaired first. - `RETIRED` assets must be reactivated (see Rule 1.8) before allocation. |

### 1.3 Terminal States: LOST, STOLEN, DISPOSED

| Field | Detail |
|-------|--------|
| **Rule** | Assets in `LOST`, `STOLEN`, or `DISPOSED` status are in terminal states. No status changes are permitted from these states except by explicit system administrator action with documented justification. |
| **Justification** | Terminal states represent irreversible events. An asset marked LOST cannot simply be returned to AVAILABLE without formal investigation resolution. |
| **Enforcement** | Application logic: Any attempt to update the status of an asset in a terminal state is blocked unless the requesting user has the `SYSTEM_ADMIN` role and provides a mandatory `reason` field. A special `AssetStatusHistory` record is created with the admin's override note. |
| **Violation** | Error: `"Asset is in terminal state ({status}). Status changes require system administrator override with documented justification."` |
| **Edge Cases** | - A `DISPOSED` asset can have its `disposalDate`, `disposalValue`, and `disposalReason` updated after the fact without changing the terminal status. - A `LOST` asset found later goes through a resolution workflow before returning to AVAILABLE. |

### 1.4 Under Maintenance Assets Cannot Be Transferred

| Field | Detail |
|-------|--------|
| **Rule** | Assets with `status = UNDER_MAINTENANCE` cannot be transferred to another office, department, or location. |
| **Justification** | An asset undergoing repair must remain at the maintenance location for technician access. Moving it mid-maintenance would disrupt the repair workflow and lose track of the asset. |
| **Enforcement** | Application logic: Transfer request creation checks `Asset.status !== UNDER_MAINTENANCE`. |
| **Violation** | Error: `"Asset is currently under maintenance and cannot be transferred. Complete maintenance first."` |
| **Edge Cases** | - If an emergency transfer is needed (e.g., office closure), an admin can cancel the maintenance request, complete the transfer, and create a new maintenance request at the destination. |

### 1.5 Assets Under Maintenance Cannot Be Allocated

| Field | Detail |
|-------|--------|
| **Rule** | Assets with `status = UNDER_MAINTENANCE` cannot be allocated to any user. |
| **Justification** | A malfunctioning asset should not be deployed to an end user. This protects both the user (from non-functional equipment) and the asset (from further damage). |
| **Enforcement** | Application logic: Same check as Rule 1.2 — only `AVAILABLE` assets pass the allocation guard. |
| **Violation** | Error: `"Asset is currently under maintenance (status: UNDER_MAINTENANCE) and cannot be allocated."` |
| **Edge Cases** | - None. This is an absolute constraint. |

### 1.6 Disposed Assets Cannot Be Allocated or Booked

| Field | Detail |
|-------|--------|
| **Rule** | Assets with `status = DISPOSED` cannot be allocated, booked, or used as a shared resource. Any `SharedResource` record linked to a disposed asset is automatically deactivated. |
| **Justification** | A disposed asset no longer exists in the organization's inventory. Attempting to allocate or book it is a data integrity violation. |
| **Enforcement** | Application logic: Allocation and booking endpoints check asset status. Cascading deactivation of `SharedResource.isActive` when an asset is marked DISPOSED. |
| **Violation** | Error: `"Disposed assets cannot be allocated or booked."` |
| **Edge Cases** | - If the disposal is reversed by admin (see Rule 1.3), the `SharedResource` is not automatically reactivated — it requires manual reactivation. |

### 1.7 Lost Assets Cannot Be Booked

| Field | Detail |
|-------|--------|
| **Rule** | Assets with `status = LOST` cannot be booked as shared resources. If a `SharedResource` exists for a lost asset, bookings are blocked. |
| **Justification** | A lost asset's physical location is unknown. Bookings imply the asset will be available at a known time and place. |
| **Enforcement** | Application logic: Booking endpoint verifies the underlying asset (if any) is not in `LOST` status. |
| **Violation** | Error: `"Asset associated with this resource is marked as LOST. Bookings are not permitted."` |
| **Edge Cases** | - If the asset is found and returned to `AVAILABLE`, bookings can resume. |

### 1.8 Retired Assets Can Be Reactivated to AVAILABLE

| Field | Detail |
|-------|--------|
| **Rule** | Assets with `status = RETIRED` can be reactivated to `AVAILABLE` status by an authorized user (Asset Manager or Admin). This is the only permitted forward transition from RETIRED. |
| **Justification** | Retirement may be temporary (e.g., seasonal equipment stored during off-season). Reactivation avoids re-purchasing assets still in good condition. |
| **Enforcement** | Application logic: Status transition check permits `RETIRED -> AVAILABLE` when triggered by a user with `ASSET_MANAGER` or `ADMIN` role. The `condition` field must be verified and set to at least `FAIR`. |
| **Violation** | Error: `"Retired assets can only be reactivated to AVAILABLE by an Asset Manager or Admin."` |
| **Edge Cases** | - The asset's `currentValue` should be re-evaluated upon reactivation. - A mandatory `condition` check is required during reactivation. |

### 1.9 Asset Condition Must Be Verified on Return

| Field | Detail |
|-------|--------|
| **Rule** | When an asset is returned (via `AssetReturn`), the receiving party must document the asset's condition using the `AssetCondition` enum. The `inspectedBy` and `inspectedAt` fields on `AssetReturn` must be populated. |
| **Justification** | Condition tracking on return enables depreciation calculations, maintenance triggers, and dispute resolution. Without it, there is no accountability for damage that occurred during allocation. |
| **Enforcement** | Application logic: The return workflow has two steps — (1) employee initiates return, (2) asset manager/inspector verifies condition. The allocation is not marked `RETURNED` until `inspectedBy` is populated. Database constraint: `AssetReturn.inspectedBy` must not be null at finalization. |
| **Violation** | Error: `"Asset return cannot be finalized without condition inspection by an authorized inspector."` |
| **Edge Cases** | - If the condition is `NEEDS_REPAIR` or `NON_FUNCTIONAL`, the system automatically creates a `MaintenanceRequest` and transitions the asset to `UNDER_MAINTENANCE`. |

### 1.10 Asset Value Cannot Go Below Salvage Value

| Field | Detail |
|-------|--------|
| **Rule** | The `currentValue` of an asset must never be reduced below its `disposalValue` (salvage value). Depreciation calculations must respect this floor. |
| **Justification** | Salvage value represents the minimum recoverable value. Allowing the book value to fall below this would misrepresent the asset's financial status. |
| **Enforcement** | Application logic: Any depreciation calculation or manual value adjustment checks `newValue >= asset.disposalValue`. If `disposalValue` is null, no floor is applied. |
| **Violation** | Error: `"Asset value cannot be reduced below salvage value of {disposalValue}."` |
| **Edge Cases** | - If `disposalValue` is not set, the check is skipped. - Manual admin overrides can bypass this with a documented reason. |

### 1.11 Warranty Date Must Be After Purchase Date

| Field | Detail |
|-------|--------|
| **Rule** | If `warrantyExpiry` is set on an asset, it must be after `purchaseDate`. |
| **Justification** | A warranty cannot expire before the item was purchased. This prevents data entry errors. |
| **Enforcement** | Application logic: Validation on asset creation and update: `if (warrantyExpiry && purchaseDate && warrantyExpiry <= purchaseDate) reject`. |
| **Violation** | Error: `"Warranty expiry date must be after the purchase date."` |
| **Edge Cases** | - Both fields can be null. - If only one is set, no cross-validation is performed. |

---

## 2. Allocation Rules

### 2.1 One Active Allocation Per Asset

| Field | Detail |
|-------|--------|
| **Rule** | At any given time, an asset can have at most one `AssetAllocation` with `status IN (PENDING, APPROVED, ACTIVE)`. The count of such records must be 0 or 1. |
| **Justification** | Enforces the single-custody principle. Multiple simultaneous active allocations for a single physical asset are impossible. |
| **Enforcement** | Application logic: Pre-creation validation queries for existing active allocations. Database: A partial unique index on `(assetId, status)` where status is not in terminal states could reinforce this. |
| **Violation** | Error: `"Asset already has an active or pending allocation (ID: {allocationId})."` Returns 409 Conflict. |
| **Edge Cases** | - An `OVERDUE` allocation still counts as active. - A `CANCELLED` or `REJECTED` allocation does not block new ones. |

### 2.2 Employee Max Allocation Limit

| Field | Detail |
|-------|--------|
| **Rule** | An employee (identified by `EmployeeProfile`) cannot have more than their `max_allocations` limit of active assets at any time. The default limit is 5, configurable per employee or department. |
| **Justification** | Prevents hoarding of assets by individual employees and ensures fair distribution across the organization. |
| **Enforcement** | Application logic: Before creating an allocation, count the employee's `ACTIVE` allocations. Compare against the limit (from department settings or company-wide config in `SystemSetting`). |
| **Violation** | Error: `"Employee has reached the maximum allocation limit of {max} assets. Return an existing asset before requesting a new one."` |
| **Edge Cases** | - Admins can override this limit with a documented reason. - `PENDING` allocations count toward the limit to prevent race conditions. |

### 2.3 Allocation Requires Approval

| Field | Detail |
|-------|--------|
| **Rule** | Every allocation request must be approved by either the employee's department head or an Asset Manager before the status transitions from `PENDING` to `APPROVED`. The `approvedBy` and `approvedAt` fields must be populated. |
| **Justification** | Approval ensures assets are allocated for legitimate business purposes and that managers maintain visibility over departmental resource usage. |
| **Enforcement** | Application logic: The approval endpoint verifies the approver has `DEPARTMENT_HEAD` or `ASSET_MANAGER` role and belongs to the relevant department or is a company-wide asset manager. |
| **Violation** | Error: `"Allocation approval requires department head or asset manager role."` |
| **Edge Cases** | - Auto-approval can be configured in `SystemSetting` for certain asset categories (e.g., low-value consumables). - Approval can be delegated temporarily via the approval workflow. |

### 2.4 Overdue Allocation Escalation

| Field | Detail |
|-------|--------|
| **Rule** | When an allocation passes its `expectedReturnDate` and the status is still `ACTIVE`, the system automatically transitions it to `OVERDUE` and triggers escalation notifications. |
| **Justification** | Overdue assets represent lost inventory visibility. Escalation ensures timely return and accountability. |
| **Enforcement** | Scheduled job (cron) runs daily to identify `ACTIVE` allocations where `expectedReturnDate < NOW()`. Updates status to `OVERDUE`, creates notification for the assignee, and escalates to their manager. A second escalation at 2x overdue period goes to the Asset Manager. |
| **Violation** | N/A — this is an automated enforcement rule. |
| **Edge Cases** | - The assignee can request an extension before the due date, which resets `expectedReturnDate` if approved. - After 3x the expected period, a third escalation notifies the Admin and the asset is flagged for investigation. |

### 2.5 Return Requires Condition Verification

| Field | Detail |
|-------|--------|
| **Rule** | An asset return cannot be completed without a condition verification step. The `AssetReturn.inspectedBy` and `AssetReturn.inspectedAt` fields must be populated by an authorized inspector (Asset Manager or designated return officer). |
| **Justification** | (See Rule 1.9.) Ensures accountability and triggers maintenance if needed. |
| **Enforcement** | Application logic: Two-phase return — employee initiates (sets `returnedAt`), inspector verifies (sets `inspectedBy`, `inspectedAt`, and `condition`). Allocation status transitions to `RETURNED` only after both phases. |
| **Violation** | Error: `"Return cannot be finalized. Awaiting condition inspection."` |
| **Edge Cases** | - If the employee leaves the organization (status = `TERMINATED`), an automatic escalation triggers immediate return and inspection. |

### 2.6 No Past-Dated Allocations (Except Admin Retroactive)

| Field | Detail |
|-------|--------|
| **Rule** | Allocations cannot be created with an `allocatedAt` date in the past. Only users with the `ADMIN` role can create retroactive allocations with past dates. |
| **Justification** | Prevents accidental backdating that could distort historical reports. Retroactive entries are rare administrative corrections. |
| **Enforcement** | Application logic: Validate `allocatedAt >= NOW()` unless the requesting user has the `ADMIN` role. |
| **Violation** | Error: `"Allocations cannot be created for past dates. Contact an administrator for retroactive entries."` |
| **Edge Cases** | - Retroactive allocations still check for double-allocation conflicts over the past period. - Retroactive entries are flagged in `AllocationHistory` with a note. |

### 2.7 Role-Based Approval Hierarchy

| Field | Detail |
|-------|--------|
| **Rule** | The Asset Manager approves maintenance requests and allocation escalations. Admins create roles and manage system configuration. Employees cannot assign roles to themselves or others. |
| **Justification** | Separation of duties prevents self-authorization and ensures proper oversight. |
| **Enforcement** | Application logic: Role assignment endpoints verify the caller has `ADMIN` role. Role assignment to `self` is always blocked. Maintenance approval endpoints verify `ASSET_MANAGER` role. |
| **Violation** | Error: `"You do not have permission to perform this action. Required role: {role}."` or `"Cannot assign roles to yourself."` |
| **Edge Cases** | - A user with both `ADMIN` and `ASSET_MANAGER` roles can perform both functions. - Role assignment is logged in `ActivityLog` with `action = ROLE_ASSIGNED`. |

---

## 3. Booking Rules

### 3.1 No Overlapping Bookings

| Field | Detail |
|-------|--------|
| **Rule** | For any given `SharedResource`, no two bookings with `status IN (PENDING, CONFIRMED, ACTIVE)` can have overlapping time ranges. Two ranges overlap when `startA < endB AND startB < endA`. |
| **Justification** | A physical resource cannot be in two places or used by two groups simultaneously. Overlapping bookings create logistical conflicts. |
| **Enforcement** | Application logic: Before creating or confirming a booking, query `ResourceBooking` for the resource where `status IN (PENDING, CONFIRMED, ACTIVE)` and the time ranges overlap. Database: A GIST index or application-level advisory lock can enforce this at scale. |
| **Violation** | Error: `"Resource '{name}' is already booked for the requested time period. Conflicting booking ID: {id}."` Returns 409 Conflict. |
| **Edge Cases** | - Back-to-back bookings (endA == startB) are allowed — no gap is required. - Admins can override overlaps with a mandatory conflict justification note. |

### 3.2 No Past Bookings

| Field | Detail |
|-------|--------|
| **Rule** | Resource bookings cannot be created with a `startDateTime` in the past. |
| **Justification** | Bookings are forward-looking reservations. Past bookings distort resource utilization metrics and have no operational value. |
| **Enforcement** | Application logic: Validate `startDateTime >= NOW()` at booking creation. |
| **Violation** | Error: `"Bookings cannot be created for past dates."` |
| **Edge Cases** | - Admins can create retroactive bookings for audit/documentation purposes with an explicit `isRetroactive` flag. |

### 3.3 Cancellation Only Before Deadline

| Field | Detail |
|-------|--------|
| **Rule** | A booking can only be cancelled if the current time is before `startDateTime - deadline_hours`. The `deadline_hours` is configurable per resource in `SharedResource.rules` or company settings (default: 2 hours). |
| **Justification** | Last-minute cancellations waste prepared resources and prevent others from booking. A deadline buffer gives fair opportunity for waitlisted users. |
| **Enforcement** | Application logic: On cancellation, check `NOW() < startDateTime - deadlineHours`. |
| **Violation** | Error: `"Booking cannot be cancelled. The cancellation deadline ({deadline} hours before start) has passed."` |
| **Edge Cases** | - Emergency cancellations by Admin are allowed with a mandatory `cancelReason`. - `NO_SHOW` status is automatically assigned if the booking starts without check-in. |

### 3.4 Recurring Bookings Generate Child Records

| Field | Detail |
|-------|--------|
| **Rule** | When a booking has `isRecurring = true` and a `recurrenceRule` (iCalendar RRULE format), the system generates individual `ResourceBooking` child records for each occurrence. The parent record retains the recurrence definition. |
| **Justification** | Individual instances must be independently manageable (one can be cancelled without affecting others). Parent-child relationship preserves the recurrence context. |
| **Enforcement** | Application logic: On recurring booking creation, a background job generates instances up to a configurable horizon (default: 3 months). Each child has a reference to the parent via metadata. |
| **Violation** | Error: `"Invalid recurrence rule. Must be a valid iCalendar RRULE string."` |
| **Edge Cases** | - Modifying the parent recurrence rule regenerates future instances but does not alter existing confirmed children. - If a child's time slot conflicts with another booking (Rule 3.1), that specific instance is marked `CANCELLED` with reason `"Recurrence conflict"`. |

### 3.5 Resource Must Be Active

| Field | Detail |
|-------|--------|
| **Rule** | Bookings can only be created for `SharedResource` records with `isActive = true` and `isBookable = true`. |
| **Justification** | Inactive or non-bookable resources should not accept new reservations. |
| **Enforcement** | Application logic: Booking creation checks `SharedResource.isActive && SharedResource.isBookable`. |
| **Violation** | Error: `"Resource '{name}' is not currently available for booking."` |
| **Edge Cases** | - Existing bookings on a resource that becomes inactive are allowed to complete but no new bookings or extensions are permitted. |

### 3.6 Attendee Count Cannot Exceed Capacity

| Field | Detail |
|-------|--------|
| **Rule** | The `attendeesCount` on a `ResourceBooking` must not exceed the `capacity` of the associated `SharedResource`. |
| **Justification** | Physical space or equipment limits must be respected to ensure safety and usability. |
| **Enforcement** | Application logic: On booking creation/update, validate `attendeesCount <= resource.capacity`. |
| **Violation** | Error: `"Attendee count ({count}) exceeds resource capacity of {capacity}."` |
| **Edge Cases** | - If `resource.capacity` is null, no capacity check is performed (unlimited capacity resources). - `BookingParticipant` records are counted independently; `attendeesCount` is the authoritative field. |

---

## 4. Transfer Rules

### 4.1 Both Offices Must Be Active

| Field | Detail |
|-------|--------|
| **Rule** | Both the source (`fromOfficeId`) and destination (`toOfficeId`) offices must have `isActive = true` for a transfer to be initiated. |
| **Justification** | Transfers to or from inactive offices create orphaned assets with no responsible entity. |
| **Enforcement** | Application logic: Transfer creation verifies `Office.isActive` for both source and destination. |
| **Violation** | Error: `"Transfer cannot be created. Source or destination office is inactive."` |
| **Edge Cases** | - If an office is deactivated after a transfer is already `IN_TRANSIT`, the transfer continues to completion but no new transfers can be created involving that office. |

### 4.2 Destination Office Manager Approval Required

| Field | Detail |
|-------|--------|
| **Rule** | Every transfer request requires approval from the destination office's manager (`Office.managerId`) or an Asset Manager. |
| **Justification** | The receiving office must consent to accept the asset, ensuring they have capacity, need, and responsibility. |
| **Enforcement** | Application logic: Approval endpoint verifies the approver is either the destination office's manager or has the `ASSET_MANAGER` role. |
| **Violation** | Error: `"Transfer approval requires destination office manager or asset manager authorization."` |
| **Edge Cases** | - If no office manager is assigned, approval escalates to the company-level Asset Manager. |

### 4.3 Asset Must Be Available or Currently Allocated

| Field | Detail |
|-------|--------|
| **Rule** | An asset can only be transferred if its status is `AVAILABLE` or `ALLOCATED`. Other statuses (e.g., `UNDER_MAINTENANCE`, `RESERVED`, `TRANSFERRED`) block transfer creation. |
| **Justification** | Only assets that are either free or in known custody can be physically moved. Assets in other states have active workflows that must be resolved first. |
| **Enforcement** | Application logic: Transfer creation checks `Asset.status IN (AVAILABLE, ALLOCATED)`. |
| **Violation** | Error: `"Asset cannot be transferred in current status ({status}). Resolve active workflows first."` |
| **Edge Cases** | - `ALLOCATED` assets are transferred with the allocation — the assignee is notified and must return/receive at the new location. - `RESERVED` assets require cancelling the reservation first. |

### 4.4 Assets Under Maintenance Cannot Be Transferred

| Field | Detail |
|-------|--------|
| **Rule** | (Reinforcement of Rule 1.4.) Assets with `status = UNDER_MAINTENANCE` are explicitly blocked from transfer at the application layer. |
| **Justification** | Physical asset must remain accessible to technicians. |
| **Enforcement** | Application logic: Explicit check in the transfer service layer. |
| **Violation** | Error: `"Asset is under maintenance and cannot be transferred until maintenance is completed or cancelled."` |
| **Edge Cases** | - None. Absolute constraint. |

### 4.5 Condition Documentation Required

| Field | Detail |
|-------|--------|
| **Rule** | Both `conditionBefore` and `conditionAfter` must be documented for every transfer. `conditionBefore` is recorded at the source office before departure; `conditionAfter` is recorded at the destination upon receipt. |
| **Justification** | Condition tracking during transfers ensures accountability for damage that may occur in transit. |
| **Enforcement** | Application logic: The transfer workflow has three stages — (1) Request, (2) Source condition check (transitions to `IN_TRANSIT`), (3) Destination condition check (transitions to `RECEIVED` then `COMPLETED`). Both condition fields are stored in `TransferHistory` notes or `TransferRequest.notes`. |
| **Violation** | Error: `"Transfer cannot proceed to next stage without condition documentation."` |
| **Edge Cases** | - If condition degrades during transit, a `MaintenanceRequest` is auto-created at the destination office. |

### 4.6 In-Transit Assets Cannot Be Modified

| Field | Detail |
|-------|--------|
| **Rule** | Assets with an active `TransferRequest` in `IN_TRANSIT` status cannot have allocations, bookings, maintenance requests, or other transfers created against them. |
| **Justification** | An in-transit asset is in a known but intermediate state. Modifying it mid-transfer creates ambiguity about its location and custody. |
| **Enforcement** | Application logic: All asset action endpoints check for active `IN_TRANSIT` transfers before proceeding. |
| **Violation** | Error: `"Asset is currently in transit and cannot be modified. Complete or cancel the transfer first."` |
| **Edge Cases** | - The `requestedBy` user can cancel the transfer, which reverts the asset to its previous status. |

---

## 5. Maintenance Rules

### 5.1 Approval Required Before Repair Work

| Field | Detail |
|-------|--------|
| **Rule** | A `MaintenanceRequest` with `status = REQUESTED` must be approved (transitioned to `APPROVED`) before any work can begin. The `approvedBy` and `approvedAt` fields must be populated. |
| **Justification** | Prevents unauthorized or unnecessary maintenance expenditure. Approval ensures the request is legitimate and budgeted. |
| **Enforcement** | Application logic: Status transition `REQUESTED -> IN_PROGRESS` is blocked unless the current status is `APPROVED`. The approve endpoint verifies `ASSET_MANAGER` role. |
| **Violation** | Error: `"Maintenance request must be approved before work can begin."` |
| **Edge Cases** | - Emergency maintenance can be auto-approved by an Admin with a documented justification. - Approval can include a budget cap via `estimatedCost` review. |

### 5.2 Asset Manager Approves Maintenance

| Field | Detail |
|-------|--------|
| **Rule** | Only users with the `ASSET_MANAGER` role (or `ADMIN`) can approve maintenance requests. Department heads do not have maintenance approval authority. |
| **Justification** | Maintenance decisions are technical and financial in nature, requiring asset management expertise rather than departmental authority. |
| **Enforcement** | Application logic: Approval endpoint checks `user.roles INCLUDES ASSET_MANAGER OR ADMIN`. |
| **Violation** | Error: `"Maintenance approval requires Asset Manager or Admin role."` |
| **Edge Cases** | - A user with both `ASSET_MANAGER` and `DEPARTMENT_HEAD` roles can approve maintenance. - Approval is logged in `ActivityLog` with `action = MAINTENANCE_APPROVED`. |

### 5.3 Technician Must Be Assigned Before Work Starts

| Field | Detail |
|-------|--------|
| **Rule** | A `MaintenanceRequest` cannot transition from `APPROVED` to `IN_PROGRESS` unless at least one `TechnicianAssignment` record exists for the request. |
| **Justification** | Maintenance work must have an assigned responsible party for accountability, coordination, and safety. |
| **Enforcement** | Application logic: Status transition guard checks `TechnicianAssignment.count(maintenanceId) >= 1`. |
| **Violation** | Error: `"Assign at least one technician before starting maintenance work."` |
| **Edge Cases** | - External vendor technicians can be assigned by name and contact (the `TechnicianAssignment` model supports `technicianName` and `technicianContact` for external personnel). |

### 5.4 Only ACTIVE Employees Can Be Technicians

| Field | Detail |
|-------|--------|
| **Rule** | Internal technicians (those with an `EmployeeProfile`) must have `EmployeeStatus = ACTIVE`. Terminated, resigned, or retired employees cannot be assigned as technicians. |
| **Justification** | Ensures assigned technicians are currently employed and reachable. Inactive employees may lack system access or authorization. |
| **Enforcement** | Application logic: When assigning an internal technician (by `userId`), verify the linked `EmployeeProfile.status === ACTIVE`. |
| **Violation** | Error: `"Employee {name} is not active (status: {status}) and cannot be assigned as a technician."` |
| **Edge Cases** | - External technicians (no `EmployeeProfile`) bypass this check. - Employees on `ON_LEAVE` can be assigned but a warning is shown. |

### 5.5 Maintenance Cost Tracked Separately

| Field | Detail |
|-------|--------|
| **Rule** | Maintenance costs (`estimatedCost`, `actualCost`) are tracked on the `MaintenanceRequest` record, not on the `Asset` record. The asset's `currentValue` is not automatically reduced by maintenance costs. |
| **Justification** | Maintenance costs are operational expenses, not capital expenditure reductions. Mixing them would distort asset valuation and depreciation calculations. |
| **Enforcement** | Application logic: The maintenance completion workflow updates `actualCost` on the request but never modifies `Asset.currentValue`. |
| **Violation** | N/A — this is a design principle. |
| **Edge Cases** | - If maintenance results in an upgrade (increasing asset value), a separate `Asset.currentValue` adjustment can be made by an admin with documentation. |

### 5.6 Completed Maintenance Requires Verification

| Field | Detail |
|-------|--------|
| **Rule** | A `MaintenanceRequest` transitioning from `COMPLETED` to `VERIFIED` requires a different user than the one who completed the work (or at minimum, a supervisor) to verify completion. The `verifiedBy` and `verifiedAt` fields must be populated. |
| **Justification** | Independent verification prevents fraud and ensures quality of repair work. |
| **Enforcement** | Application logic: Verification endpoint checks `verifiedBy !== lastTechnicianWhoCompleted`. The verifier should have `ASSET_MANAGER` or `MAINTENANCE_SUPERVISOR` role. |
| **Violation** | Error: `"Maintenance verification must be performed by a supervisor or asset manager, not the assigned technician."` |
| **Edge Cases** | - If only one technician is available and no supervisor is present, the system allows self-verification but logs a warning in `ActivityLog`. |

### 5.7 Preventive Maintenance Auto-Generation

| Field | Detail |
|-------|--------|
| **Rule** | Preventive maintenance schedules (defined in system settings or asset category configuration) automatically generate `MaintenanceRequest` records at specified intervals (e.g., every 6 months for HVAC systems). |
| **Justification** | Preventive maintenance extends asset life and reduces unexpected failures. Manual tracking is unreliable at scale. |
| **Enforcement** | Scheduled background job scans preventive maintenance rules in `SystemSetting` or `AssetCategory` metadata and creates `MaintenanceRequest` records with `status = REQUESTED` and `type = PREVENTIVE`. |
| **Violation** | N/A — automated rule. |
| **Edge Cases** | - If an asset already has an `APPROVED` or `IN_PROGRESS` maintenance request, the preventive job skips generation. - Admins can suppress preventive maintenance for individual assets. |

---

## 6. Audit Rules

### 6.1 Audit Cycles Generate Periodic Assignments

| Field | Detail |
|-------|--------|
| **Rule** | `AuditCycle` records define periodic asset verification schedules. When an audit cycle is created or activated, `AuditAssignment` records are generated for designated auditors. |
| **Justification** | Regular audits ensure physical asset counts match system records, detecting theft, loss, and data entry errors. |
| **Enforcement** | Application logic: When an `AuditCycle` is created with `status = SCHEDULED` or transitioned to `IN_PROGRESS`, the system generates `AuditAssignment` records for each auditor in the audit team and creates `AuditResult` placeholders for all in-scope assets. |
| **Violation** | N/A — automated workflow. |
| **Edge Cases** | - Assets that are `DISPOSED` or `LOST` are excluded from new audit assignments. - Newly created assets after cycle start are added via a separate reconciliation job. |

### 6.2 Auditor Cannot Audit Own Assigned Assets

| Field | Detail |
|-------|--------|
| **Rule** | An auditor assigned via `AuditAssignment` cannot audit assets that are currently allocated to them (where `AssetAllocation.userId === AuditAssignment.userId` and status is `ACTIVE`). |
| **Justification** | Self-audit defeats the purpose of independent verification. An auditor could conceal missing assets they are responsible for. |
| **Enforcement** | Application logic: When generating `AuditResult` records, skip assets allocated to the auditor. When an auditor submits results, verify the asset was not allocated to them. |
| **Violation** | Error: `"You cannot audit assets currently allocated to yourself. Reassign this asset to another auditor."` |
| **Edge Cases** | - If an auditor is the only person in the organization with access to a particular asset (e.g., remote worker), the system flags the assignment for manager review rather than blocking it entirely. |

### 6.3 Discrepancies Require Resolution Assignment

| Field | Detail |
|-------|--------|
| **Rule** | When an `AuditResult` is submitted with `discrepancyFound = true`, an `AuditDiscrepancy` record must be created with a `type`, `description`, and `severity`. The discrepancy must be assigned to a resolver (`resolvedBy`) for investigation. |
| **Justification** | Discrepancies (missing assets, wrong location, wrong condition) require follow-up action. Without assignment, they are forgotten. |
| **Enforcement** | Application logic: Audit submission endpoint requires at least one `AuditDiscrepancy` record when `discrepancyFound = true`. The system auto-assigns to the Asset Manager unless manually specified. |
| **Violation** | Error: `"Discrepancy found but no discrepancy details provided. Document the discrepancy before submitting."` |
| **Edge Cases** | - `CRITICAL` severity discrepancies (e.g., missing high-value asset) immediately notify the Admin and create an `ApprovalRequest` for investigation authorization. |

### 6.4 Audit Results Are Immutable Once Submitted

| Field | Detail |
|-------|--------|
| **Rule** | Once an `AuditResult` has `status = COMPLETED` or `REVIEWING`, its core fields (`isMatch`, `condition`, `locationFound`, `notes`, `discrepancyFound`) cannot be modified. Only the `verifiedBy`/`verifiedAt` fields can be updated during review. |
| **Justification** | Audit results are legal/financial records. Tampering after submission undermines the integrity of the entire audit process. |
| **Enforcement** | Application logic: Update endpoints check the current status and reject modifications to core fields when `status IN (COMPLETED, REVIEWING, CLOSED)`. |
| **Violation** | Error: `"Audit results are immutable after submission. Only verification fields can be updated."` |
| **Edge Cases** | - If an error is discovered post-submission, a new `AuditResult` correction record can be created by an admin, linked to the original via metadata. |

### 6.5 Missing Assets Trigger Immediate Notification

| Field | Detail |
|-------|--------|
| **Rule** | When an `AuditResult` is submitted with `isMatch = false` or `discrepancyFound = true` and the discrepancy type is `MISSING`, the system immediately sends notifications to: (1) the Asset Manager, (2) the Admin, (3) the employee the asset is allocated to (if any). |
| **Justification** | Missing assets may indicate theft or mismanagement. Immediate notification enables rapid investigation. |
| **Enforcement** | Application logic: On audit result submission, if missing-asset criteria are met, create `Notification` records with `priority = URGENT` for all stakeholders. |
| **Violation** | N/A — automated notification. |
| **Edge Cases** | - If the asset is `LOST` already, no additional notification is sent (avoiding duplicate alerts). |

### 6.6 Audit Completion Requires All Assigned Assets Checked

| Field | Detail |
|-------|--------|
| **Rule** | An `AuditCycle` can only transition from `IN_PROGRESS` to `COMPLETED` when all `AuditResult` records within the cycle have `status IN (COMPLETED, REVIEWING, CLOSED)`. No `IN_PROGRESS` results may remain. |
| **Justification** | Partial audits provide incomplete data and can mask missing assets. Completeness ensures comprehensive coverage. |
| **Enforcement** | Application logic: Cycle completion endpoint queries `AuditResult WHERE cycleId = X AND status NOT IN (COMPLETED, REVIEWING, CLOSED)`. If any exist, reject completion. |
| **Violation** | Error: `"Audit cycle cannot be completed. {count} asset(s) have not yet been audited."` |
| **Edge Cases** | - Assets that were disposed of or lost during the cycle can be excluded via admin action. - Cycles past their `endDate` can be force-completed by an Admin with a warning notification. |

---

## 7. Authentication Rules

### 7.1 Account Lock After Max Failed Attempts

| Field | Detail |
|-------|--------|
| **Rule** | After `MAX_FAILED_ATTEMPTS` (default: 5, configurable via `SystemSetting`) consecutive failed login attempts, the user account is locked. The `User.status` is set to `LOCKED` and `User.lockedUntil` is set to `NOW() + LOCKOUT_DURATION` (default: 30 minutes). |
| **Justification** | Prevents brute-force password guessing attacks. Temporary lockout makes automated attacks impractical. |
| **Enforcement** | Application logic: On failed login, increment `User.failedLoginCount`. When threshold is reached, set `status = LOCKED` and `lockedUntil`. On successful login, reset `failedLoginCount` to 0. |
| **Violation** | Error: `"Account is temporarily locked due to too many failed login attempts. Try again after {lockedUntil}."` Returns 403 Forbidden. |
| **Edge Cases** | - Manual unlock by Admin is possible before `lockedUntil` expires. - `failedLoginCount` is reset after `lockedUntil` passes, allowing fresh attempts. - Each failed attempt is logged in `LoginHistory` with `success = false`. |

### 7.2 Refresh Token Rotation (Single-Use)

| Field | Detail |
|-------|--------|
| **Rule** | Every refresh token is single-use. When a refresh token is used to obtain a new access token, it is immediately revoked (`revokedAt` is set) and a new refresh token is issued. |
| **Justification** | Prevents token theft — if a refresh token is compromised, it can only be used once before it becomes invalid. |
| **Enforcement** | Application logic: Token refresh endpoint validates the refresh token exists, is not revoked, and has not expired. On success, sets `revokedAt` on the old record and creates a new `RefreshToken` record. |
| **Violation** | Error: `"Refresh token has already been used or is invalid. Please log in again."` Returns 401 Unauthorized. |
| **Edge Cases** | - If a refresh token is used twice (race condition or theft), the second use is rejected and all tokens for the user are revoked (force re-login). - Token family tracking can be implemented via metadata to detect reuse patterns. |

### 7.3 Password Reset Token Expiry

| Field | Detail |
|-------|--------|
| **Rule** | Password reset tokens (`PasswordReset`) expire after 1 hour from creation. Expired tokens cannot be used. Each token can only be used once (`usedAt` must be null). |
| **Justification** | Limits the window of opportunity for an attacker who intercepts a reset email. Single-use prevents replay attacks. |
| **Enforcement** | Application logic: Reset password endpoint checks `expiresAt > NOW()` and `usedAt IS NULL`. On success, sets `usedAt`. |
| **Violation** | Error: `"Password reset token has expired or already been used. Request a new one."` |
| **Edge Cases** | - Generating a new reset token invalidates all previous unused tokens for the same user. - `PasswordReset` records are retained for audit purposes but are not cleaned up immediately. |

### 7.4 OTP Expiry and Attempt Limits

| Field | Detail |
|-------|--------|
| **Rule** | OTP codes (`OtpCode`) expire after 5 minutes. Each OTP is limited to 3 verification attempts. After 3 failed attempts, the OTP is invalidated and a new one must be generated. |
| **Justification** | Prevents brute-force OTP guessing. Short expiry limits exposure window. |
| **Enforcement** | Application logic: On OTP verification, check `expiresAt > NOW()` and `attempts < 3`. On each failed attempt, increment `attempts`. When `attempts >= 3`, mark as invalid. |
| **Violation** | Error: `"OTP has expired or maximum attempts exceeded. Request a new code."` |
| **Edge Cases** | - The `attempts` counter is also visible to rate-limiting middleware to detect systematic guessing. - OTP codes are generated with cryptographically secure random number generators. |

### 7.5 New Device Verification Notification

| Field | Detail |
|-------|--------|
| **Rule** | When a user logs in from a device not previously seen (no matching `deviceFingerprint` in `DeviceHistory`), a verification notification is sent to the user's registered contact methods (email, and optionally SMS if phone is verified). |
| **Justification** | Alerts users to potential unauthorized access from unfamiliar devices. |
| **Enforcement** | Application logic: After successful login, compute device fingerprint from `userAgent` + key browser attributes. Query `DeviceHistory` for a match. If none found, create `DeviceHistory` record and send a verification notification with device details. |
| **Violation** | N/A — notification only. |
| **Edge Cases** | - First-ever login does not trigger a "new device" notification (the account itself is new). - Users can mark devices as `isTrusted` to suppress future notifications for that fingerprint. |

### 7.6 Configurable Session Timeout

| Field | Detail |
|-------|--------|
| **Rule** | Session timeout is configurable per user via `SystemSetting` or user preferences. Default timeout is 24 hours. Sessions are automatically invalidated when `expiresAt` is reached. |
| **Justification** | Different security requirements for different roles and contexts. A session timeout balances security with user convenience. |
| **Enforcement** | Application logic: Session middleware checks `Session.expiresAt > NOW()` and `Session.isActive = true` on each request. Expired sessions are marked `isActive = false`. The `lastActiveAt` field is updated on each request to support sliding expiration. |
| **Violation** | Error: `"Session expired. Please log in again."` Returns 401 Unauthorized. |
| **Edge Cases** | - Admins can force-invalidate all sessions for a user (e.g., after credential compromise). - Sliding expiration extends `expiresAt` on each activity, up to a maximum lifetime (e.g., 7 days). |

---

## 8. Authorization Rules

### 8.1 Role-Based Access Control (RBAC)

| Field | Detail |
|-------|--------|
| **Rule** | All system actions are gated by role-based permissions. Users are assigned roles via `UserRole`. Roles contain permissions via `RolePermission`. Permission checks are performed at the API middleware level and enforced at the service layer. |
| **Justification** | RBAC provides fine-grained access control that scales with organizational complexity. Prevents unauthorized data access and actions. |
| **Enforcement** | Application logic: API middleware extracts the user's roles, aggregates all permissions from `RolePermission -> Permission`, and checks if the required permission exists. Permission format: `{module}:{action}` (e.g., `asset:create`, `allocation:approve`). |
| **Violation** | Error: `"Access denied. Required permission: {permission}."` Returns 403 Forbidden. |
| **Edge Cases** | - A user with multiple roles receives the union of all permissions. - Permissions are checked hierarchically: `asset:*` grants all actions on the asset module. |

### 8.2 System Roles Cannot Be Deleted

| Field | Detail |
|-------|--------|
| **Rule** | Roles with `type = SYSTEM` are protected and cannot be deleted or have their permissions removed. System roles include: `ADMIN`, `ASSET_MANAGER`, `DEPARTMENT_HEAD`, `EMPLOYEE`, `AUDITOR`, `TECHNICIAN`. |
| **Justification** | System roles are foundational to the RBAC model. Deleting them would break permission checks across the entire system. |
| **Enforcement** | Application logic: Delete/update endpoints check `Role.type === SYSTEM` and reject with an error. |
| **Violation** | Error: `"System roles cannot be deleted or modified. Contact the system administrator."` |
| **Edge Cases** | - System role names are also protected from renaming. - New system roles can be added via database migration only, not via the application UI. |

### 8.3 Permission Changes Logged

| Field | Detail |
|-------|--------|
| **Rule** | Every change to role-permission assignments (adding or removing a `RolePermission` record) is logged in `ActivityLog` with `action = PERMISSION_CHANGED`, including the old and new state. |
| **Justification** | Permission changes are high-security events. Audit logging enables detection of unauthorized privilege escalation. |
| **Enforcement** | Application logic: The role update service writes to `ActivityLog` with `oldValue` and `newValue` JSON snapshots before and after the change. |
| **Violation** | N/A — automated logging. |
| **Edge Cases** | - Bulk permission changes (e.g., role template application) generate one `ActivityLog` entry per permission change. - `ActivityLog` entries for permission changes cannot be deleted by non-admins. |

### 8.4 Department Heads Manage Only Own Department

| Field | Detail |
|-------|--------|
| **Rule** | Users with the `DEPARTMENT_HEAD` role can only manage assets, allocations, and employees within their own department (`Department.managerId === userId`). |
| **Justification** | Limits the blast radius of each department head's authority, preventing cross-department interference. |
| **Enforcement** | Application logic: Department head endpoints verify that the target resource's `departmentId` matches the head's department. Asset manager override is available for cross-department scenarios. |
| **Violation** | Error: `"You can only manage resources within your department ({departmentName})."` |
| **Edge Cases** | - If a department head is reassigned, their permissions update automatically based on `Department.managerId`. - Company-wide Asset Managers bypass this restriction. |

### 8.5 Admin Creates Roles, Employees Cannot Assign

| Field | Detail |
|-------|--------|
| **Rule** | Only users with the `ADMIN` role can create new roles, modify role definitions, or assign roles to users. Employees cannot self-assign roles or assign roles to others. |
| **Justification** | Prevents privilege escalation. Role assignment is a high-trust operation that must be controlled centrally. |
| **Enforcement** | Application logic: Role creation and assignment endpoints require `ADMIN` role. Self-assignment (`userId === currentUser.id`) is always blocked regardless of role. |
| **Violation** | Error: `"Only administrators can create and assign roles."` or `"Cannot assign roles to yourself."` |
| **Edge Cases** | - Role assignment is logged in `ActivityLog` with `action = ROLE_ASSIGNED` or `ROLE_REVOKED`. |

### 8.6 Office-Specific Role Assignments

| Field | Detail |
|-------|--------|
| **Rule** | Role assignments via `UserRole` can be scoped to a specific company using the `companyId` field. Users only receive the permissions of their company-scoped role within that company's context. |
| **Justification** | In a multi-tenant or multi-company environment, a user might have different roles in different companies. Scoping prevents cross-company privilege leakage. |
| **Enforcement** | Application logic: Permission checks filter `UserRole` by the current request's company context (`companyId`). Cross-company access is denied even if the user has a role in another company. |
| **Violation** | Error: `"You do not have the required role for this company context."` |
| **Edge Cases** | - Global/system roles without a `companyId` grant access across all companies (admin use). - Company-specific custom roles are restricted to their company. |

---

## 9. Notification Rules

### 9.1 Notification Generation Triggers

| Field | Detail |
|-------|--------|
| **Rule** | Notifications are generated for the following events: allocation requests, allocation approvals/rejections, overdue allocations, maintenance request updates (approval, completion, verification), audit assignments, booking confirmations/cancellations, transfer status changes, and system alerts. |
| **Justification** | Users need real-time awareness of actions affecting their assets and responsibilities. |
| **Enforcement** | Application logic: Event handlers create `Notification` records with appropriate `type`, `title`, `message`, `priority`, and `entityType`/`entityId` for linking. |
| **Violation** | N/A — automated system behavior. |
| **Edge Cases** | - The system generates notifications only for status changes, not for every field update. - Duplicate notifications for the same entity are suppressed within a configurable time window (default: 1 hour). |

### 9.2 User Notification Preferences

| Field | Detail |
|-------|--------|
| **Rule** | Users can configure per-type notification preferences via `NotificationPreference`. Each preference controls delivery channels: `inAppEnabled`, `emailEnabled`, `smsEnabled`, `pushEnabled`. |
| **Justification** | Users have different communication preferences. Respecting preferences reduces notification fatigue and improves engagement. |
| **Enforcement** | Application logic: Before delivering a notification, check `NotificationPreference` for the user and notification type. Only deliver to enabled channels. |
| **Violation** | N/A — preferences control delivery, not generation. All notifications are always generated (for in-app history). |
| **Edge Cases** | - Default preferences are created for new users with all channels enabled except SMS and push. - `URGENT` and `CRITICAL` priority notifications bypass user preferences and are always delivered via all enabled channels. |

### 9.3 Quiet Hours Suppression

| Field | Detail |
|-------|--------|
| **Rule** | Non-critical notifications (priority = `LOW` or `MEDIUM`) are suppressed during the user's configured quiet hours. `HIGH`, `URGENT`, and `CRITICAL` notifications are delivered regardless. |
| **Justification** | Respects work-life balance and prevents notification overload during off-hours. Critical alerts must still reach users. |
| **Enforcement** | Application logic: When delivering notifications, check the current time against the user's quiet hours configuration (stored in `SystemSetting` or `NotificationPreference` metadata). Defer suppressed notifications and deliver them when quiet hours end. |
| **Violation** | N/A — automated suppression. |
| **Edge Cases** | - Quiet hours are timezone-aware using the user's or company's timezone. - Users can override quiet hours temporarily (e.g., on-call periods). |

### 9.4 Notification Expiry and Auto-Archive

| Field | Detail |
|-------|--------|
| **Rule** | Notifications with an `expiresAt` date that have passed are automatically transitioned to `ARCHIVED` status. A background job runs daily to archive expired notifications. |
| **Justification** | Prevents clutter in user notification feeds. Old notifications lose relevance and consume database space. |
| **Enforcement** | Scheduled background job: `UPDATE notifications SET status = 'ARCHIVED' WHERE expiresAt < NOW() AND status IN ('UNREAD', 'READ')`. |
| **Violation** | N/A — automated cleanup. |
| **Edge Cases** | - Default expiry is 30 days for `LOW` priority, 60 days for `MEDIUM`, 90 days for `HIGH`, no expiry for `URGENT`/`CRITICAL`. - Users can manually dismiss notifications (status = `DISMISSED`) before expiry. - Archived notifications remain in the database for audit trail purposes. |

---

## 10. Data Integrity Rules

### 10.1 Soft Delete on All Main Entities

| Field | Detail |
|-------|--------|
| **Rule** | All primary business entities (`Asset`, `Department`, `User`, `Company`, etc.) use soft delete via a `deletedAt` timestamp column. Physical deletion is never performed through the application. |
| **Justification** | Preserves referential integrity, enables recovery from accidental deletion, and maintains audit trail completeness. Hard deletes would cascade unexpectedly. |
| **Enforcement** | Application logic: All queries on main entities include `WHERE deletedAt IS NULL` (via Prisma middleware or global filters). The delete endpoint sets `deletedAt = NOW()` instead of issuing `DELETE`. |
| **Violation** | N/A — structural rule. |
| **Edge Cases** | - Soft-deleted entities are excluded from all user-facing queries but remain accessible to admins via a "Trash" or "Recycle Bin" feature. - Restoration sets `deletedAt = null` and logs the restoration in `ActivityLog`. |

### 10.2 History Tables Are Immutable

| Field | Detail |
|-------|--------|
| **Rule** | History/audit trail tables (`AssetStatusHistory`, `AllocationHistory`, `TransferHistory`, `BookingHistory`, `MaintenanceStatusHistory`, `LoginHistory`, `ActivityLog`) are append-only. Records can be created but never updated or deleted through the application. |
| **Justification** | History records are the system's source of truth for what happened and when. Mutation of audit trails would undermine trust in the system. |
| **Enforcement** | Application logic: History tables have no update or delete endpoints. Prisma models for history tables expose only `create` operations. Database: Consider `REVOKE UPDATE, DELETE ON history_tables FROM app_user` at the database level. |
| **Violation** | Error: `"History records are immutable and cannot be modified or deleted."` |
| **Edge Cases** | - Database administrators can perform maintenance via direct SQL with documented justification. - `ActivityLog` entries older than the retention period (configurable, default: 7 years) can be archived to cold storage. |

### 10.3 Audit Columns on Every Table

| Field | Detail |
|-------|--------|
| **Rule** | Every main business entity table includes `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, and optionally `deletedAt` columns. These are automatically populated by the application. |
| **Justification** | Provides complete traceability of who created and modified every record and when. Essential for compliance and debugging. |
| **Enforcement** | Application logic: Prisma middleware automatically sets `createdBy` from the current user context on create, and `updatedBy` on every update. `createdAt` and `updatedAt` are managed by Prisma's `@default(now())` and `@updatedAt`. |
| **Violation** | N/A — structural rule enforced by schema design. |
| **Edge Cases** | - System-created records (e.g., auto-generated notifications, preventive maintenance) set `createdBy = null` or a system user ID. - Bulk imports may set `createdBy` to a service account. |

### 10.4 Cascading Deletes Restricted

| Field | Detail |
|-------|--------|
| **Rule** | Database cascading deletes are restricted (`onDelete: Restrict`) or use `SetNull` for optional references. `Cascade` is only used for ownership relationships (e.g., `Asset` -> `AssetImage`). Soft delete is preferred over hard delete. |
| **Justification** | Uncontrolled cascading deletes can cause data loss across unrelated entities. Soft deletes prevent this entirely. |
| **Enforcement** | Prisma schema: Explicit `onDelete` annotations on all relations. `Restrict` for critical foreign keys, `Cascade` only for true child records, `SetNull` for optional references. |
| **Violation** | Database-level error: `"Foreign key constraint violated. Cannot delete record referenced by {table}."` |
| **Edge Cases** | - `Asset.categoryId` uses `Restrict` — a category cannot be deleted if assets reference it. - `AssetAllocation.userId` uses `Restrict` — an allocation cannot exist for a deleted user (must be resolved first). |

### 10.5 Unique Constraints Prevent Duplicates

| Field | Detail |
|-------|--------|
| **Rule** | Business-critical unique constraints are enforced at both the database and application level. Key uniques include: `Asset.assetTag`, `Asset.serialNumber`, `User.email`, `Role.name`, `SharedResource.assetId`, `AssetQrCode.code`, and composite uniques like `AssetCategory.(parentId, name)`, `UserRole.(userId, roleId, companyId)`, `AuditResult.(cycleId, assetId)`. |
| **Justification** | Duplicate records create confusion, misdirect updates, and break business logic. |
| **Enforcement** | Database: PostgreSQL unique indexes. Application: Prisma `@unique` and `@@unique` directives. |
| **Violation** | Database error: `"Unique constraint violation on {field}. A record with this {field} already exists."` Returns 409 Conflict. |
| **Edge Cases** | - Soft-deleted records still count toward unique constraints. To "reuse" a unique value (e.g., an asset tag), the old record must be purged or the tag modified. - `@@unique` composite constraints allow the same value in one column if the other column differs. |

### 10.6 Check Constraints Validate Data Ranges

| Field | Detail |
|-------|--------|
| **Rule** | Data range validation is enforced at both the application and database levels where possible: `purchasePrice >= 0`, `currentValue >= 0`, `depreciationRate BETWEEN 0 AND 100`, `capacity > 0` (when set), `attendeesCount >= 0`, `failedLoginCount >= 0`. |
| **Justification** | Prevents nonsensical data from entering the system (negative prices, negative capacity, etc.). |
| **Enforcement** | Application logic: Input validation on all create/update endpoints. Database: Check constraints via Prisma `@check` (when supported) or raw SQL migration. |
| **Violation** | Error: `"Field '{field}' must be within valid range ({constraint})."` |
| **Edge Cases** | - `currentValue` can be `0` (fully depreciated). - `depreciationRate` of `0` means no depreciation (valid for land or non-depreciating assets). |

---

## 11. Performance Rules

### 11.1 Index Strategy for Million-Asset Scale

| Field | Detail |
|-------|--------|
| **Rule** | The database schema includes composite and single-column indexes optimized for the most common query patterns: asset search by status/category/office, allocation lookups by user and asset, booking queries by resource and time range, audit queries by cycle and status. |
| **Justification** | At million-asset scale, unindexed queries cause full table scans, degrading response times from milliseconds to minutes. |
| **Enforcement** | Prisma schema: Explicit `@@index` directives on high-query columns. Key indexes include: `Asset.[companyId, categoryId, status, officeId, departmentId, locationId, createdAt, purchaseDate]`, `AssetAllocation.[assetId, userId, status, allocatedAt, expectedReturnDate]`, `ResourceBooking.[resourceId, startDateTime, endDateTime, (resourceId, startDateTime, endDateTime)]`. |
| **Violation** | N/A — performance rule. |
| **Edge Cases** | - Indexes slow down write operations. Balance is maintained by only indexing columns used in WHERE, JOIN, or ORDER BY clauses. - Partial indexes (PostgreSQL) can be used for status-filtered queries (e.g., `WHERE deletedAt IS NULL`). |

### 11.2 Table Partitioning for Activity Logs

| Field | Detail |
|-------|--------|
| **Rule** | The `activity_logs` table is partitioned by month on the `createdAt` column using PostgreSQL native partitioning. Each partition is a separate physical table. |
| **Justification** | `activity_logs` is the highest-volume table in the system. Partitioning enables efficient range queries, faster purging of old data, and reduced index size per partition. |
| **Enforcement** | Database: PostgreSQL declarative partitioning via migration scripts. Application: Prisma queries use `createdAt` range filters that PostgreSQL automatically routes to the correct partition. |
| **Violation** | N/A — infrastructure rule. |
| **Edge Cases** | - Future partitions are auto-created by a scheduled job. - Historical partitions older than the retention period can be detached and archived. - Queries without a `createdAt` filter scan all partitions (slower), so the application always includes a date range. |

### 11.3 Query Optimization for Common Patterns

| Field | Detail |
|-------|--------|
| **Rule** | Frequently used queries are optimized: (1) Asset listing with filters uses cursor-based pagination. (2) Dashboard aggregations use materialized views or cached summary tables. (3) Overdue allocation detection uses indexed date comparison. (4) Booking availability check uses range overlap queries with GIST or B-tree indexes. |
| **Justification** | Common patterns must be performant to maintain a responsive UI. N+1 queries and full scans degrade UX at scale. |
| **Enforcement** | Application logic: Use Prisma `include` for eager loading to prevent N+1. Use `select` to limit returned fields. Use database-level materialized views for complex aggregations. |
| **Violation** | N/A — development standard. |
| **Edge Cases** | - Materialized views are refreshed on a schedule or triggered by significant data changes. - Slow query logging (threshold: 500ms) identifies queries needing optimization. |

### 11.4 Pagination Required for List Endpoints

| Field | Detail |
|-------|--------|
| **Rule** | All API endpoints returning lists of records must support pagination. Cursor-based pagination is preferred for large datasets; offset-based pagination is acceptable for small result sets (< 10,000 records). Default page size is 25, maximum is 100. |
| **Justification** | Unbounded queries can return millions of rows, exhausting server memory and network bandwidth. Pagination ensures predictable performance. |
| **Enforcement** | Application logic: All list endpoints accept `cursor`/`offset` and `limit`/`pageSize` query parameters. Response includes `hasMore` and `nextCursor`/`nextPage` fields. |
| **Violation** | Error: `"Page size must be between 1 and 100."` |
| **Edge Cases** | - Export endpoints (CSV/Excel) use streaming/paginated background jobs rather than loading all records at once. - Count endpoints (`/assets/count`) use PostgreSQL `COUNT(*)` with the same filters but without loading rows. |

### 11.5 Bulk Operations for Mass Updates

| Field | Detail |
|-------|--------|
| **Rule** | Operations that affect multiple records (e.g., bulk asset status change, bulk allocation creation, bulk transfer) use database-level bulk operations rather than looping through individual updates. Maximum batch size is 500 records per operation. |
| **Justification** | Individual updates in a loop create N database round trips. Bulk operations reduce this to 1, improving throughput by 10-100x. |
| **Enforcement** | Application logic: Bulk endpoints use Prisma `updateMany`, `createMany`, or raw SQL `INSERT ... SELECT` / `UPDATE ... WHERE IN`. Batch size is enforced at the API level. |
| **Violation** | Error: `"Batch size exceeds maximum of 500. Split the operation into smaller batches."` |
| **Edge Cases** | - Bulk operations are wrapped in database transactions for atomicity. - If any record in the batch fails validation, the entire batch is rolled back (all-or-nothing). |

---

## 12. Security Rules

### 12.1 Passwords Stored with bcrypt

| Field | Detail |
|-------|--------|
| **Rule** | User passwords are never stored in plaintext. The `User.passwordHash` field stores a bcrypt hash with a work factor of at least 12. |
| **Justification** | bcrypt is a slow, salted hashing algorithm resistant to rainbow table and brute-force attacks. Plaintext or fast hashes (MD5, SHA-1) are unacceptable. |
| **Enforcement** | Application logic: On user creation and password change, the password is hashed using `bcrypt.hash(password, 12)` before storage. On login, `bcrypt.compare(password, hash)` is used for verification. |
| **Violation** | N/A — architectural rule. Code review and security audits verify compliance. |
| **Edge Cases** | - Password history (last 5 passwords) is checked on change to prevent reuse. - Minimum password requirements: 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character. |

### 12.2 Sensitive Data Encrypted at Rest

| Field | Detail |
|-------|--------|
| **Rule** | Sensitive data fields are encrypted at rest: `User.passwordHash`, `User.mfaSecret`, `ApiToken.tokenHash`, `SystemSetting.value` (when `isEncrypted = true`), and any fields containing PII that require regulatory compliance. |
| **Justification** | If the database is compromised, encrypted fields remain protected. Particularly important for MFA secrets and API tokens. |
| **Enforcement** | Application logic: Encryption/decryption is handled by a service layer that transparently encrypts on write and decrypts on read. `SystemSetting.isEncrypted` triggers automatic encryption for the `value` field. Database-level: PostgreSQL Transparent Data Encryption (TDE) for disk-level encryption. |
| **Violation** | N/A — architectural rule. |
| **Edge Cases** | - Encryption keys are managed via a secrets vault (e.g., AWS KMS, HashiCorp Vault), not hardcoded. - Key rotation is performed quarterly without downtime using envelope encryption. |

### 12.3 API Token Rate Limiting

| Field | Detail |
|-------|--------|
| **Rule** | API tokens are subject to rate limiting: 100 requests per minute per token for standard access, 1000 requests per minute for elevated-access tokens. Rate limits are tracked per `ApiToken.tokenHash`. |
| **Justification** | Prevents API abuse, accidental runaway scripts, and denial-of-service conditions. Protects system resources for all users. |
| **Enforcement** | Application middleware: Rate limiter uses a sliding window algorithm (Redis-backed) keyed by token hash. Returns `429 Too Many Requests` with `Retry-After` header when exceeded. |
| **Violation** | HTTP 429: `"Rate limit exceeded. Retry after {seconds} seconds."` Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`. |
| **Edge Cases** | - Authenticated user sessions have separate rate limits (200 requests/minute). - Health check endpoints (`/health`) are exempt from rate limiting. - Rate limit configuration is stored in `SystemSetting` and can be adjusted per company. |

### 12.4 IP Tracking on Login Attempts

| Field | Detail |
|-------|--------|
| **Rule** | Every login attempt (successful or failed) records the client's IP address (`UserAgent` and `IpAddress`), user agent string, and timestamp in `LoginHistory`. Suspicious patterns (multiple IPs, rapid failures) trigger security alerts. |
| **Justification** | IP tracking enables detection of credential stuffing, brute-force attacks, and unauthorized access from unexpected locations. |
| **Enforcement** | Application logic: Login endpoint creates `LoginHistory` record on every attempt. Background job analyzes patterns: >10 failures from different IPs in 5 minutes triggers an alert to the user and admin. Login from a new country triggers a verification notification. |
| **Violation** | N/A — monitoring rule. |
| **Edge Cases** | - VPN/proxy detection: If the IP geolocation changes drastically between consecutive logins (e.g., US to China in 10 minutes), a warning is triggered. - IP addresses are stored as `VARCHAR(45)` to support IPv6. |

### 12.5 Session Management with Device Fingerprinting

| Field | Detail |
|-------|--------|
| **Rule** | Each session is tied to a device fingerprint (derived from `userAgent`, screen resolution, timezone, and other browser attributes). The `DeviceHistory` table tracks all devices associated with a user. Sessions from unrecognized devices require additional verification. |
| **Justification** | Device fingerprinting detects session hijacking and unauthorized device usage. Tying sessions to known devices reduces attack surface. |
| **Enforcement** | Application logic: On session creation, compute a device fingerprint hash and store it in both `Session` (via `userAgent`) and `DeviceHistory`. On each request, verify the fingerprint matches. New fingerprints trigger a verification notification (Rule 7.5). Users can revoke all sessions from unrecognized devices. |
| **Violation** | Error: `"Session device mismatch. This session has been invalidated. Please log in again."` Returns 401 Unauthorized. |
| **Edge Cases** | - Browser updates or OS changes may alter fingerprints. The system uses a similarity threshold (80% match) rather than exact matching. - Users can manually trust a device to suppress future verification requests. - Maximum concurrent sessions per user is configurable (default: 5). Exceeding this revokes the oldest session. |

---

## Appendix: Rule Enforcement Summary

| Layer | Rules Enforced | Examples |
|-------|---------------|----------|
| **Database** | Unique constraints, check constraints, foreign key restrictions, soft delete, partitioning, indexes | 10.1, 10.5, 10.6, 11.1, 11.2 |
| **Application (Service)** | Business logic validation, workflow state machines, approval checks, notification generation | 1.1-1.11, 2.1-2.7, 3.1-3.6, 4.1-4.6, 5.1-5.7, 6.1-6.6 |
| **Application (Middleware)** | Authentication, authorization (RBAC), rate limiting, session validation | 7.1-7.6, 8.1-8.6, 12.3, 12.5 |
| **Application (Scheduled Jobs)** | Overdue detection, auto-archive, preventive maintenance, audit cycle management | 2.4, 5.7, 6.1, 9.4 |
| **Infrastructure** | Encryption at rest, table partitioning, IP tracking, device fingerprinting | 11.2, 12.2, 12.4, 12.5 |

## Appendix: Error Code Reference

| HTTP Status | Error Pattern | Rules |
|-------------|--------------|-------|
| 400 | Validation failures, invalid input | 1.10, 1.11, 3.2, 3.6, 11.4, 11.5 |
| 401 | Authentication failures, token expiry | 7.2, 7.3, 7.4, 7.6, 12.5 |
| 403 | Authorization failures, account locked | 7.1, 8.1, 8.4, 8.5 |
| 404 | Resource not found | General |
| 409 | Conflict (duplicate, already allocated) | 1.1, 2.1, 3.1, 10.5 |
| 429 | Rate limit exceeded | 12.3 |
| 500 | Server error, unexpected state | Fallback |
