const http = require("http");

const BASE = "http://localhost:5000/api/v1";
let TOKEN = null;
let COMPANY_ID = null;
let OFFICE_ID = null;
let BUILDING_ID = null;
let DEPT_ID = null;
let CATEGORY_ID = null;
let SUB_CATEGORY_ID = null;
let ASSET_ID = null;
let ASSET2_ID = null;
let IMAGE_ID = null;
let DOC_ID = null;
let QR_CODE = null;
let ALLOC_ID = null;
let RETURN_ID = null;
let OFFICE2_ID = null;
let TRANSFER_ID = null;
let RESOURCE_ID = null;
let BOOKING_ID = null;
let BOOKING2_ID = null;
let USER_ID = null;

let passed = 0;
let failed = 0;
const errors = [];

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      method,
      hostname: "localhost",
      port: 5000,
      path: url.pathname + url.search,
      headers: { "Content-Type": "application/json" },
    };
    if (TOKEN) options.headers["Authorization"] = `Bearer ${TOKEN}`;

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, method, path, body, expectedStatus) {
  try {
    const res = await request(method, path, body);
    const status = res.status;
    const ok = status === expectedStatus;
    const emoji = ok ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
    console.log(`  ${emoji}: ${name} (Status ${status}${ok ? "" : `, expected ${expectedStatus}`})`);
    if (!ok) {
      errors.push(`${name}: Expected ${expectedStatus}, got ${status}`);
      if (res.body && res.body.message) console.log(`    Error: ${res.body.message}`);
    }
    if (ok) passed++; else failed++;
    return res;
  } catch (e) {
    console.log(`  \x1b[31mFAIL\x1b[0m: ${name} - ${e.message}`);
    errors.push(`${name}: ${e.message}`);
    failed++;
    return null;
  }
}

function assert(condition, msg) {
  if (!condition) {
    console.log(`    \x1b[31mASSERT FAILED\x1b[0m: ${msg}`);
    errors.push(`ASSERT: ${msg}`);
  }
  return condition;
}

async function run() {
  console.log("\n\x1b[36m========================================\x1b[0m");
  console.log("\x1b[36m  AssetFlow API Test Suite\x1b[0m");
  console.log("\x1b[36m========================================\x1b[0m\n");

  // ============ PHASE 1: LOGIN ============
  console.log("\x1b[33m--- Phase 1: Authentication ---\x1b[0m");

  let res = await test("Login", "POST", "/auth/login", {
    email: "test@assetflow.com",
    password: "TestPass123!",
  }, 200);

  if (res && res.body && res.body.data) {
    TOKEN = res.body.data.accessToken;
    console.log(`    Token: ${TOKEN ? TOKEN.substring(0, 30) + "..." : "MISSING"}`);
  } else {
    console.log("  \x1b[31mCannot proceed without token. Aborting.\x1b[0m");
    return;
  }

  res = await test("Get Me", "GET", "/auth/me", null, 200);
  if (res && res.body && res.body.data) {
    USER_ID = res.body.data.id;
    COMPANY_ID = res.body.data.companyId;
    console.log(`    User: ${USER_ID}`);
    console.log(`    Company: ${COMPANY_ID}`);
  }

  // ============ PHASE 2: OFFICE, BUILDING, DEPT ============
  console.log("\n\x1b[33m--- Phase 2: Prerequisite Data ---\x1b[0m");

  res = await test("Create Office", "POST", "/offices", {
    companyId: COMPANY_ID,
    name: "Headquarters",
    code: "HQ",
    description: "Main office",
    city: "New York",
  }, 201);
  if (res && res.body && res.body.data) OFFICE_ID = res.body.data.id;

  res = await test("Create Building", "POST", "/buildings", {
    companyId: COMPANY_ID,
    officeId: OFFICE_ID,
    name: "Main Building",
    code: "MB-01",
    totalFloors: 5,
  }, 201);
  if (res && res.body && res.body.data) BUILDING_ID = res.body.data.id;

  res = await test("Create Department", "POST", "/departments", {
    companyId: COMPANY_ID,
    name: "IT Department",
    code: "IT",
  }, 201);
  if (res && res.body && res.body.data) DEPT_ID = res.body.data.id;

  // ============ PHASE 3: ASSET CATEGORIES ============
  console.log("\n\x1b[33m--- Phase 3: Asset Category APIs ---\x1b[0m");

  res = await test("Create Category", "POST", "/asset-categories", {
    companyId: COMPANY_ID,
    name: "IT Equipment",
    code: "IT-EQ",
    description: "All IT equipment",
  }, 201);
  if (res && res.body && res.body.data) CATEGORY_ID = res.body.data.id;

  res = await test("Get Category", "GET", `/asset-categories/${CATEGORY_ID}`, null, 200);
  assert(res && res.body && res.body.data && res.body.data.name === "IT Equipment", "Category name should be IT Equipment");

  res = await test("List Categories", "GET", "/asset-categories", null, 200);
  assert(res && res.body && Array.isArray(res.body.data), "Should return array of categories");

  res = await test("Update Category", "PATCH", `/asset-categories/${CATEGORY_ID}`, {
    description: "Updated IT equipment",
  }, 200);

  res = await test("Create Sub-Category", "POST", "/asset-categories", {
    companyId: COMPANY_ID,
    parentId: CATEGORY_ID,
    name: "Laptops",
    code: "IT-LP",
  }, 201);
  if (res && res.body && res.body.data) SUB_CATEGORY_ID = res.body.data.id;

  res = await test("Get Category Tree", "GET", "/asset-categories/tree", null, 200);
  assert(res && res.body && Array.isArray(res.body.data), "Should return tree");

  // Custom Fields
  res = await test("Add Custom Field", "POST", `/asset-categories/${CATEGORY_ID}/custom-fields`, {
    name: "processor",
    label: "Processor Type",
    fieldType: "TEXT",
    isRequired: true,
  }, 201);

  res = await test("List Custom Fields", "GET", `/asset-categories/${CATEGORY_ID}/custom-fields`, null, 200);

  // Duplicate code should fail
  res = await test("Duplicate Category Code (expect 409)", "POST", "/asset-categories", {
    companyId: COMPANY_ID,
    name: "Duplicate",
    code: "IT-EQ",
  }, 409);

  // ============ PHASE 4: ASSET CRUD ============
  console.log("\n\x1b[33m--- Phase 4: Asset CRUD APIs ---\x1b[0m");

  res = await test("Create Asset", "POST", "/assets", {
    companyId: COMPANY_ID,
    categoryId: CATEGORY_ID,
    officeId: OFFICE_ID,
    buildingId: BUILDING_ID,
    departmentId: DEPT_ID,
    name: "MacBook Pro 16",
    description: "Apple MacBook Pro 16 inch M3 Max",
    serialNumber: "MBP-2026-001",
    purchaseDate: "2026-01-15",
    purchasePrice: 2999.99,
    currentValue: 2800.00,
    manufacturer: "Apple",
    model: "MacBook Pro 16 M3 Max",
  }, 201);
  if (res && res.body && res.body.data) {
    ASSET_ID = res.body.data.id;
    console.log(`    Asset Tag: ${res.body.data.assetTag}`);
    assert(res.body.data.assetTag && res.body.data.assetTag.startsWith("AST-"), "Asset tag should start with AST-");
    assert(res.body.data.status === "AVAILABLE", "Default status should be AVAILABLE");
  }

  res = await test("Get Asset", "GET", `/assets/${ASSET_ID}`, null, 200);
  assert(res && res.body && res.body.data && res.body.data.name === "MacBook Pro 16", "Asset name correct");

  res = await test("List Assets", "GET", "/assets", null, 200);
  assert(res && res.body && res.body.data && Array.isArray(res.body.data.data), "Should return paginated data");

  res = await test("List Assets (search)", "GET", "/assets?search=MacBook", null, 200);

  res = await test("Update Asset", "PATCH", `/assets/${ASSET_ID}`, {
    description: "Updated: MacBook Pro 16 M3 Max 36GB",
  }, 200);

  // Second asset for transfer testing
  res = await test("Create Asset 2", "POST", "/assets", {
    companyId: COMPANY_ID,
    categoryId: CATEGORY_ID,
    officeId: OFFICE_ID,
    name: "Dell Monitor 27",
    serialNumber: "DELL-MON-001",
    purchasePrice: 599.99,
    manufacturer: "Dell",
    model: "U2723QE",
  }, 201);
  if (res && res.body && res.body.data) ASSET2_ID = res.body.data.id;

  // Status update
  res = await test("Update Asset Status", "PATCH", `/assets/${ASSET_ID}/status`, {
    status: "AVAILABLE",
    reason: "Ready for allocation",
  }, 200);

  // ============ PHASE 5: IMAGE, DOCUMENT, QR ============
  console.log("\n\x1b[33m--- Phase 5: Asset Image, Document, QR ---\x1b[0m");

  res = await test("Add Asset Image", "POST", "/asset-images", {
    assetId: ASSET_ID,
    imageType: "GENERAL",
    caption: "Front view",
    isPrimary: true,
  }, 201);
  if (res && res.body && res.body.data) IMAGE_ID = res.body.data.id;

  res = await test("Get Asset Images", "GET", `/asset-images/asset/${ASSET_ID}`, null, 200);

  res = await test("Update Image", "PATCH", `/asset-images/${IMAGE_ID}`, {
    caption: "Updated front view",
  }, 200);

  res = await test("Set Primary Image", "PATCH", `/asset-images/${IMAGE_ID}/primary`, null, 200);

  // Document
  res = await test("Add Asset Document", "POST", "/asset-documents", {
    assetId: ASSET_ID,
    documentType: "INVOICE",
    title: "Purchase Invoice",
    description: "Original invoice from Apple",
  }, 201);
  if (res && res.body && res.body.data) DOC_ID = res.body.data.id;

  res = await test("Get Asset Documents", "GET", `/asset-documents/asset/${ASSET_ID}`, null, 200);

  // QR Code
  res = await test("Generate QR Code", "POST", "/asset-qr-codes/generate", {
    assetId: ASSET_ID,
  }, 201);
  if (res && res.body && res.body.data) {
    QR_CODE = res.body.data.code;
    console.log(`    QR Code: ${QR_CODE}`);
  }

  res = await test("Get QR for Asset", "GET", `/asset-qr-codes/asset/${ASSET_ID}`, null, 200);

  res = await test("Scan QR Code", "POST", "/asset-qr-codes/scan", {
    code: QR_CODE,
  }, 200);

  // ============ PHASE 6: ALLOCATION LIFECYCLE ============
  console.log("\n\x1b[33m--- Phase 6: Allocation Lifecycle ---\x1b[0m");

  res = await test("Create Allocation", "POST", "/allocations", {
    assetId: ASSET_ID,
    employeeId: USER_ID,
    expectedReturnDate: "2026-12-31",
    purpose: "Development work",
    notes: "Frontend development project",
  }, 201);
  if (res && res.body && res.body.data) {
    ALLOC_ID = res.body.data.id;
    assert(res.body.data.status === "PENDING", "Default status should be PENDING");
  }

  res = await test("Get Allocation", "GET", `/allocations/${ALLOC_ID}`, null, 200);

  res = await test("List Allocations", "GET", "/allocations", null, 200);

  res = await test("Approve Allocation", "PATCH", `/allocations/${ALLOC_ID}/approve`, {
    approved: true,
  }, 200);

  res = await test("Activate Allocation", "PATCH", `/allocations/${ALLOC_ID}/activate`, null, 200);

  // Check asset is now ALLOCATED
  res = await test("Check Asset ALLOCATED", "GET", `/assets/${ASSET_ID}`, null, 200);
  if (res && res.body && res.body.data) {
    assert(res.body.data.status === "ALLOCATED", `Asset status should be ALLOCATED, got ${res.body.data.status}`);
  }

  res = await test("List Allocations by Employee", "GET", `/allocations/employee/${USER_ID}`, null, 200);

  // ============ PHASE 7: RETURN ============
  console.log("\n\x1b[33m--- Phase 7: Return APIs ---\x1b[0m");

  res = await test("Create Return", "POST", "/returns", {
    allocationId: ALLOC_ID,
    condition: "GOOD",
    notes: "Returned in good condition",
    requiresRepair: false,
  }, 201);
  if (res && res.body && res.body.data) RETURN_ID = res.body.data.id;

  res = await test("Get Return", "GET", `/returns/${RETURN_ID}`, null, 200);

  res = await test("List Returns", "GET", "/returns", null, 200);

  res = await test("Verify Return", "PATCH", `/returns/${RETURN_ID}/verify`, {
    verified: true,
    notes: "Condition verified",
  }, 200);

  // Check asset is AVAILABLE again
  res = await test("Check Asset AVAILABLE after return", "GET", `/assets/${ASSET_ID}`, null, 200);
  if (res && res.body && res.body.data) {
    assert(res.body.data.status === "AVAILABLE", `Asset should be AVAILABLE, got ${res.body.data.status}`);
  }

  // ============ PHASE 8: TRANSFER ============
  console.log("\n\x1b[33m--- Phase 8: Transfer APIs ---\x1b[0m");

  res = await test("Create Office 2", "POST", "/offices", {
    companyId: COMPANY_ID,
    name: "Branch Office",
    code: "BR-01",
    city: "Boston",
  }, 201);
  if (res && res.body && res.body.data) OFFICE2_ID = res.body.data.id;

  res = await test("Create Transfer", "POST", "/transfers", {
    companyId: COMPANY_ID,
    assetId: ASSET2_ID,
    fromOfficeId: OFFICE_ID,
    toOfficeId: OFFICE2_ID,
    priority: "MEDIUM",
    reason: "Need at branch office",
  }, 201);
  if (res && res.body && res.body.data) TRANSFER_ID = res.body.data.id;

  res = await test("Get Transfer", "GET", `/transfers/${TRANSFER_ID}`, null, 200);

  res = await test("List Transfers", "GET", "/transfers", null, 200);

  res = await test("Approve Transfer", "PATCH", `/transfers/${TRANSFER_ID}/approve`, {
    approved: true,
    shippingCarrier: "FedEx",
    shippingTracking: "FX-123",
  }, 200);

  res = await test("Receive Transfer", "PATCH", `/transfers/${TRANSFER_ID}/receive`, {
    conditionAfter: "GOOD",
    notes: "Received in good condition",
  }, 200);

  // ============ PHASE 9: RESOURCE & BOOKING ============
  console.log("\n\x1b[33m--- Phase 9: Resource & Booking APIs ---\x1b[0m");

  res = await test("Create Resource", "POST", "/resources", {
    companyId: COMPANY_ID,
    name: "Conference Room A",
    description: "Large meeting room",
    resourceType: "MEETING_ROOM",
    capacity: 20,
    officeId: OFFICE_ID,
    isBookable: true,
  }, 201);
  if (res && res.body && res.body.data) RESOURCE_ID = res.body.data.id;

  res = await test("Get Resource", "GET", `/resources/${RESOURCE_ID}`, null, 200);

  res = await test("List Resources", "GET", "/resources", null, 200);

  res = await test("Update Resource", "PATCH", `/resources/${RESOURCE_ID}`, {
    description: "Updated: Large meeting room with whiteboard",
  }, 200);

  // Booking
  res = await test("Create Booking", "POST", "/bookings", {
    resourceId: RESOURCE_ID,
    title: "Sprint Planning",
    description: "Q3 sprint planning",
    startTime: "2026-07-15T10:00:00Z",
    endTime: "2026-07-15T12:00:00Z",
    attendeeCount: 8,
  }, 201);
  if (res && res.body && res.body.data) BOOKING_ID = res.body.data.id;

  res = await test("Get Booking", "GET", `/bookings/${BOOKING_ID}`, null, 200);

  res = await test("List Bookings", "GET", "/bookings", null, 200);

  res = await test("Confirm Booking", "PATCH", `/bookings/${BOOKING_ID}/confirm`, null, 200);

  res = await test("Check-in Booking", "PATCH", `/bookings/${BOOKING_ID}/check-in`, null, 200);

  res = await test("Complete Booking", "PATCH", `/bookings/${BOOKING_ID}/complete`, null, 200);

  // Create and cancel booking
  res = await test("Create Booking 2", "POST", "/bookings", {
    resourceId: RESOURCE_ID,
    title: "Team Standup",
    startTime: "2026-07-16T09:00:00Z",
    endTime: "2026-07-16T09:30:00Z",
    attendeeCount: 5,
  }, 201);
  if (res && res.body && res.body.data) BOOKING2_ID = res.body.data.id;

  res = await test("Cancel Booking", "PATCH", `/bookings/${BOOKING2_ID}/cancel`, {
    cancellationReason: "Postponed",
  }, 200);

  // ============ SUMMARY ============
  console.log("\n\x1b[36m========================================\x1b[0m");
  console.log("\x1b[36m  TEST RESULTS SUMMARY\x1b[0m");
  console.log("\x1b[36m========================================\x1b[0m");
  console.log(`  \x1b[32mPassed: ${passed}\x1b[0m`);
  console.log(`  \x1b[${failed > 0 ? "31" : "32"}mFailed: ${failed}\x1b[0m`);
  if (errors.length > 0) {
    console.log("\n  Failed tests:");
    errors.forEach((e) => console.log(`    \x1b[31m- ${e}\x1b[0m`));
  }
  console.log("\n\x1b[36m========================================\x1b[0m\n");
}

run().catch(console.error);
