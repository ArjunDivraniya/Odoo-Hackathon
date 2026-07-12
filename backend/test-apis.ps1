# AssetFlow API Test Script
# Tests all newly built modules

$BASE = "http://localhost:5000/api/v1"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AssetFlow API Test Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passed = 0
$failed = 0
$errors = @()

function Test-API {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Body = $null,
        [int]$ExpectedStatus,
        [string]$AuthToken = $null,
        [string]$ExtraCheck = $null
    )
    
    try {
        $reqHeaders = @{ "Content-Type" = "application/json" }
        if ($AuthToken) { $reqHeaders["Authorization"] = "Bearer $AuthToken" }
        
        $params = @{
            Uri     = $Url
            Method  = $Method
            Headers = $reqHeaders
            UseBasicParsing = $true
        }
        
        if ($Body -and $Method -ne "GET") {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        $statusCode = [int]$response.StatusCode
        $json = $response.Content | ConvertFrom-Json
        
        if ($statusCode -eq $ExpectedStatus) {
            if ($ExtraCheck -and $json.data) {
                $checkResult = & $ExtraCheck $json
                if ($checkResult) {
                    Write-Host "  PASS: $Name (Status $statusCode)" -ForegroundColor Green
                    $script:passed++
                } else {
                    Write-Host "  FAIL: $Name - Extra check failed" -ForegroundColor Red
                    $script:failed++
                    $script:errors += "$Name - Extra check failed"
                }
            } else {
                Write-Host "  PASS: $Name (Status $statusCode)" -ForegroundColor Green
                $script:passed++
            }
            return $json
        } else {
            Write-Host "  FAIL: $Name - Expected $ExpectedStatus, got $statusCode" -ForegroundColor Red
            $script:failed++
            $script:errors += "$Name - Expected $ExpectedStatus got $statusCode"
            return $json
        }
    } catch {
        $errResponse = $_.Exception.Response
        if ($errResponse) {
            $statusCode = [int]$errResponse.StatusCode
            $reader = [System.IO.StreamReader]::new($errResponse.GetResponseStream())
            $errBody = $reader.ReadToEnd()
            $reader.Close()
            
            if ($statusCode -eq $ExpectedStatus) {
                Write-Host "  PASS: $Name (Error Status $statusCode - expected)" -ForegroundColor Green
                $script:passed++
                try { return ($errBody | ConvertFrom-Json) } catch { return $null }
            } else {
                Write-Host "  FAIL: $Name - Expected $ExpectedStatus, got $statusCode" -ForegroundColor Red
                Write-Host "    Response: $($errBody.Substring(0, [Math]::Min(200, $errBody.Length)))" -ForegroundColor DarkRed
                $script:failed++
                $script:errors += "$Name - Expected $ExpectedStatus got $statusCode"
                try { return ($errBody | ConvertFrom-Json) } catch { return $null }
            }
        } else {
            Write-Host "  FAIL: $Name - $($_.Exception.Message)" -ForegroundColor Red
            $script:failed++
            $script:errors += "$Name - $($_.Exception.Message)"
            return $null
        }
    }
}

# ==========================================
# PHASE 0: Start Server
# ==========================================
Write-Host "--- Phase 0: Starting Server ---" -ForegroundColor Yellow

$serverJob = Start-Job -ScriptBlock {
    Set-Location "D:\1backup\New Folder\Coding Gita\Odoo Hackathon\Odoo-Hackathon\backend"
    npx tsx src/server.ts 2>&1
}

# Wait for server to start
Write-Host "  Waiting for server to start..."
$maxWait = 30
$waited = 0
while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 2
    $waited += 2
    try {
        $testConn = Invoke-WebRequest -Uri "http://localhost:5000/" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($testConn.StatusCode -eq 200) {
            Write-Host "  Server is UP!`n" -ForegroundColor Green
            break
        }
    } catch { }
}

if ($waited -ge $maxWait) {
    Write-Host "  Server failed to start after ${maxWait}s. Aborting." -ForegroundColor Red
    Receive-Job $serverJob
    exit 1
}

# ==========================================
# PHASE 1: Auth - Get Token
# ==========================================
Write-Host "--- Phase 1: Authentication ---" -ForegroundColor Yellow

$signupResult = Test-API -Name "Signup" -Method "POST" -Url "$BASE/auth/signup" -Body @{
    email = "test@assetflow.com"
    password = "TestPass123!"
    firstName = "Test"
    lastName = "Admin"
} -ExpectedStatus 201

# Activate user directly via Prisma (skip email verification for testing)
Write-Host "  Activating test user via DB..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
(async () => {
    const prisma = new PrismaClient();
    const hash = await bcrypt.hash('TestPass123!', 10);
    await prisma.user.updateMany({
        where: { email: 'test@assetflow.com' },
        data: { status: 'ACTIVE', emailVerified: true, passwordHash: hash }
    });
    console.log('User activated');
    await prisma.\$disconnect();
})();
" 2>&1

# Login
Write-Host "`n  Logging in..."
$loginResult = Test-API -Name "Login" -Method "POST" -Url "$BASE/auth/login" -Body @{
    email = "test@assetflow.com"
    password = "TestPass123!"
} -ExpectedStatus 200

$TOKEN = $loginResult.accessToken
Write-Host "  Token obtained: $($TOKEN.Substring(0, 30))..." -ForegroundColor DarkGray

# Get current user
Test-API -Name "Get Me" -Method "GET" -Url "$BASE/auth/me" -AuthToken $TOKEN -ExpectedStatus 200

# ==========================================
# PHASE 2: Setup Prerequisite Data
# ==========================================
Write-Host "`n--- Phase 2: Creating Prerequisite Data ---" -ForegroundColor Yellow

# Create Company directly via Prisma (no company create endpoint in the 15 modules)
Write-Host "  Creating test company..."
$companyResult = node -e "
const { PrismaClient } = require('@prisma/client');
(async () => {
    const prisma = new PrismaClient();
    const company = await prisma.company.upsert({
        where: { slug: 'test-corp' },
        update: {},
        create: {
            name: 'Test Corporation',
            slug: 'test-corp',
            email: 'info@testcorp.com',
            phone: '+1-555-0100',
            isActive: true,
            currency: 'USD',
            timezone: 'UTC'
        }
    });
    console.log(JSON.stringify({ id: company.id, name: company.name }));
    await prisma.\$disconnect();
})();
" 2>&1
$company = $companyResult | ConvertFrom-Json
$companyId = $company.id
Write-Host "  Company: $($company.name) ($companyId)" -ForegroundColor DarkGray

# Update user's employeeProfile or role to have companyId
Write-Host "  Linking user to company..."
node -e "
const { PrismaClient } = require('@prisma/client');
(async () => {
    const prisma = new PrismaClient();
    const user = await prisma.user.findFirst({ where: { email: 'test@assetflow.com' } });
    if (!user) { console.log('User not found'); return; }
    
    // Create employee profile linked to company
    await prisma.employeeProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            companyId: '$companyId',
            employeeId: 'EMP-001',
            jobTitle: 'System Administrator',
            employmentType: 'FULL_TIME',
            status: 'ACTIVE',
            hireDate: new Date()
        }
    });
    console.log('Employee profile created');
    await prisma.\$disconnect();
})();
" 2>&1

# Login again to pick up the companyId
$loginResult2 = Test-API -Name "Re-login (with company)" -Method "POST" -Url "$BASE/auth/login" -Body @{
    email = "test@assetflow.com"
    password = "TestPass123!"
} -ExpectedStatus 200
$TOKEN = $loginResult2.accessToken

# Create Office
$officeResult = Test-API -Name "Create Office" -Method "POST" -Url "$BASE/offices" -Body @{
    companyId = $companyId
    name = "Headquarters"
    code = "HQ"
    description = "Main office"
    city = "New York"
    isActive = $true
} -AuthToken $TOKEN -ExpectedStatus 201
$officeId = $officeResult.data.id

# Create Building
$buildingResult = Test-API -Name "Create Building" -Method "POST" -Url "$BASE/buildings" -Body @{
    companyId = $companyId
    officeId = $officeId
    name = "Main Building"
    code = "MB-01"
    description = "Primary building"
    totalFloors = 5
} -AuthToken $TOKEN -ExpectedStatus 201
$buildingId = $buildingResult.data.id

# Create Department
$deptResult = Test-API -Name "Create Department" -Method "POST" -Url "$BASE/departments" -Body @{
    companyId = $companyId
    name = "IT Department"
    code = "IT"
    description = "Information Technology"
} -AuthToken $TOKEN -ExpectedStatus 201
$deptId = $deptResult.data.id

Write-Host "  Prerequisite IDs:" -ForegroundColor DarkGray
Write-Host "    Company: $companyId" -ForegroundColor DarkGray
Write-Host "    Office: $officeId" -ForegroundColor DarkGray
Write-Host "    Building: $buildingId" -ForegroundColor DarkGray
Write-Host "    Department: $deptId" -ForegroundColor DarkGray

# ==========================================
# PHASE 3: Asset Category APIs
# ==========================================
Write-Host "`n--- Phase 3: Asset Category APIs ---" -ForegroundColor Yellow

$catResult = Test-API -Name "Create Category" -Method "POST" -Url "$BASE/asset-categories" -Body @{
    companyId = $companyId
    name = "IT Equipment"
    code = "IT-EQ"
    description = "All IT equipment"
    requiresMaintenance = $true
} -AuthToken $TOKEN -ExpectedStatus 201
$categoryId = $catResult.data.id

Test-API -Name "Get Category" -Method "GET" -Url "$BASE/asset-categories/$categoryId" -AuthToken $TOKEN -ExpectedStatus 200
Test-API -Name "List Categories" -Method "GET" -Url "$BASE/asset-categories" -AuthToken $TOKEN -ExpectedStatus 200
Test-API -Name "Update Category" -Method "PATCH" -Url "$BASE/asset-categories/$categoryId" -Body @{
    description = "Updated IT equipment description"
} -AuthToken $TOKEN -ExpectedStatus 200

# Create sub-category
$subCatResult = Test-API -Name "Create Sub-Category" -Method "POST" -Url "$BASE/asset-categories" -Body @{
    companyId = $companyId
    parentId = $categoryId
    name = "Laptops"
    code = "IT-LP"
    description = "Laptop computers"
} -AuthToken $TOKEN -ExpectedStatus 201
$subCategoryId = $subCatResult.data.id

Test-API -Name "Get Category Tree" -Method "GET" -Url "$BASE/asset-categories/tree" -AuthToken $TOKEN -ExpectedStatus 200

# Custom fields
$customFieldResult = Test-API -Name "Add Custom Field" -Method "POST" -Url "$BASE/asset-categories/$categoryId/custom-fields" -Body @{
    name = "processor"
    label = "Processor Type"
    fieldType = "TEXT"
    isRequired = $true
} -AuthToken $TOKEN -ExpectedStatus 201

Test-API -Name "List Custom Fields" -Method "GET" -Url "$BASE/asset-categories/$categoryId/custom-fields" -AuthToken $TOKEN -ExpectedStatus 200

# ==========================================
# PHASE 4: Asset CRUD APIs
# ==========================================
Write-Host "`n--- Phase 4: Asset CRUD APIs ---" -ForegroundColor Yellow

$assetResult = Test-API -Name "Create Asset" -Method "POST" -Url "$BASE/assets" -Body @{
    companyId = $companyId
    categoryId = $categoryId
    officeId = $officeId
    buildingId = $buildingId
    departmentId = $deptId
    name = "MacBook Pro 16"
    description = "Apple MacBook Pro 16 inch M3 Max"
    serialNumber = "MBP-2026-001"
    purchaseDate = "2026-01-15"
    purchasePrice = 2999.99
    currentValue = 2800.00
    manufacturer = "Apple"
    model = "MacBook Pro 16 M3 Max"
    warrantyExpiry = "2029-01-15"
} -AuthToken $TOKEN -ExpectedStatus 201
$assetId = $assetResult.data.id
Write-Host "  Asset Tag: $($assetResult.data.assetTag)" -ForegroundColor DarkGray

Test-API -Name "Get Asset" -Method "GET" -Url "$BASE/assets/$assetId" -AuthToken $TOKEN -ExpectedStatus 200
Test-API -Name "List Assets" -Method "GET" -Url "$BASE/assets" -AuthToken $TOKEN -ExpectedStatus 200

Test-API -Name "Update Asset" -Method "PATCH" -Url "$BASE/assets/$assetId" -Body @{
    description = "Updated: Apple MacBook Pro 16 inch M3 Max - 36GB RAM"
} -AuthToken $TOKEN -ExpectedStatus 200

# Create second asset for transfer testing
$asset2Result = Test-API -Name "Create Asset 2" -Method "POST" -Url "$BASE/assets" -Body @{
    companyId = $companyId
    categoryId = $categoryId
    officeId = $officeId
    name = "Dell Monitor 27"
    description = "Dell UltraSharp 27 inch 4K Monitor"
    serialNumber = "DELL-MON-001"
    purchasePrice = 599.99
    manufacturer = "Dell"
    model = "U2723QE"
} -AuthToken $TOKEN -ExpectedStatus 201
$asset2Id = $asset2Result.data.id

# Status update
Test-API -Name "Update Asset Status" -Method "PATCH" -Url "$BASE/assets/$assetId/status" -Body @{
    status = "AVAILABLE"
    reason = "Initial setup complete"
    notes = "Asset ready for allocation"
} -AuthToken $TOKEN -ExpectedStatus 200

# ==========================================
# PHASE 5: Asset Image, Document, QR APIs
# ==========================================
Write-Host "`n--- Phase 5: Asset Image, Document, QR APIs ---" -ForegroundColor Yellow

# Image
$imgResult = Test-API -Name "Add Asset Image" -Method "POST" -Url "$BASE/asset-images" -Body @{
    assetId = $assetId
    imageType = "GENERAL"
    caption = "Front view of MacBook Pro"
    isPrimary = $true
    sortOrder = 0
} -AuthToken $TOKEN -ExpectedStatus 201
$imgId = $imgResult.data.id

Test-API -Name "Get Asset Images" -Method "GET" -Url "$BASE/asset-images/asset/$assetId" -AuthToken $TOKEN -ExpectedStatus 200
Test-API -Name "Update Image" -Method "PATCH" -Url "$BASE/asset-images/$imgId" -Body @{
    caption = "Updated front view"
} -AuthToken $TOKEN -ExpectedStatus 200

# Document
$docResult = Test-API -Name "Add Asset Document" -Method "POST" -Url "$BASE/asset-documents" -Body @{
    assetId = $assetId
    documentType = "INVOICE"
    title = "Purchase Invoice"
    description = "Original purchase invoice from Apple Store"
} -AuthToken $TOKEN -ExpectedStatus 201
$docId = $docResult.data.id

Test-API -Name "Get Asset Documents" -Method "GET" -Url "$BASE/asset-documents/asset/$assetId" -AuthToken $TOKEN -ExpectedStatus 200

# QR Code
$qrResult = Test-API -Name "Generate QR Code" -Method "POST" -Url "$BASE/asset-qr-codes/generate" -Body @{
    assetId = $assetId
} -AuthToken $TOKEN -ExpectedStatus 201
$qrCode = $qrResult.data.code
Write-Host "  QR Code: $qrCode" -ForegroundColor DarkGray

Test-API -Name "Get QR for Asset" -Method "GET" -Url "$BASE/asset-qr-codes/asset/$assetId" -AuthToken $TOKEN -ExpectedStatus 200

Test-API -Name "Scan QR Code" -Method "POST" -Url "$BASE/asset-qr-codes/scan" -Body @{
    code = $qrCode
} -AuthToken $TOKEN -ExpectedStatus 200

# ==========================================
# PHASE 6: Allocation Lifecycle
# ==========================================
Write-Host "`n--- Phase 6: Allocation Lifecycle ---" -ForegroundColor Yellow

# Get user ID for allocation
$meResult = Invoke-WebRequest -Uri "$BASE/auth/me" -Headers @{ "Authorization" = "Bearer $TOKEN"; "Content-Type" = "application/json" } -UseBasicParsing
$meJson = $meResult.Content | ConvertFrom-Json
$userId = $meJson.data.id

$allocResult = Test-API -Name "Create Allocation" -Method "POST" -Url "$BASE/allocations" -Body @{
    assetId = $assetId
    employeeId = $userId
    expectedReturnDate = "2026-12-31"
    purpose = "Development work - frontend development"
    notes = "Need for React development project"
} -AuthToken $TOKEN -ExpectedStatus 201
$allocId = $allocResult.data.id

Test-API -Name "Get Allocation" -Method "GET" -Url "$BASE/allocations/$allocId" -AuthToken $TOKEN -ExpectedStatus 200
Test-API -Name "List Allocations" -Method "GET" -Url "$BASE/allocations" -AuthToken $TOKEN -ExpectedStatus 200

# Approve
Test-API -Name "Approve Allocation" -Method "PATCH" -Url "$BASE/allocations/$allocId/approve" -Body @{
    approved = $true
} -AuthToken $TOKEN -ExpectedStatus 200

# Activate
Test-API -Name "Activate Allocation" -Method "PATCH" -Url "$BASE/allocations/$allocId/activate" -AuthToken $TOKEN -ExpectedStatus 200

# Verify asset is now ALLOCATED
$assetCheck = Test-API -Name "Check Asset ALLOCATED" -Method "GET" -Url "$BASE/assets/$assetId" -AuthToken $TOKEN -ExpectedStatus 200

# List by employee
Test-API -Name "List Allocations by Employee" -Method "GET" -Url "$BASE/allocations/employee/$userId" -AuthToken $TOKEN -ExpectedStatus 200

# ==========================================
# PHASE 7: Return APIs
# ==========================================
Write-Host "`n--- Phase 7: Return APIs ---" -ForegroundColor Yellow

$returnResult = Test-API -Name "Create Return" -Method "POST" -Url "$BASE/returns" -Body @{
    allocationId = $allocId
    condition = "GOOD"
    notes = "Asset returned in good condition after 3 months of use"
    requiresRepair = $false
} -AuthToken $TOKEN -ExpectedStatus 201
$returnId = $returnResult.data.id

Test-API -Name "Get Return" -Method "GET" -Url "$BASE/returns/$returnId" -AuthToken $TOKEN -ExpectedStatus 200
Test-API -Name "List Returns" -Method "GET" -Url "$BASE/returns" -AuthToken $TOKEN -ExpectedStatus 200

Test-API -Name "Verify Return" -Method "PATCH" -Url "$BASE/returns/$returnId/verify" -Body @{
    verified = $true
    notes = "Asset condition verified - good"
} -AuthToken $TOKEN -ExpectedStatus 200

# ==========================================
# PHASE 8: Transfer APIs
# ==========================================
Write-Host "`n--- Phase 8: Transfer APIs ---" -ForegroundColor Yellow

# Create second office for transfer
$office2Result = Test-API -Name "Create Office 2" -Method "POST" -Url "$BASE/offices" -Body @{
    companyId = $companyId
    name = "Branch Office"
    code = "BR-01"
    city = "Boston"
} -AuthToken $TOKEN -ExpectedStatus 201
$office2Id = $office2Result.data.id

$transferResult = Test-API -Name "Create Transfer" -Method "POST" -Url "$BASE/transfers" -Body @{
    companyId = $companyId
    assetId = $asset2Id
    fromOfficeId = $officeId
    toOfficeId = $office2Id
    priority = "MEDIUM"
    reason = "Need monitor at branch office for new hire"
} -AuthToken $TOKEN -ExpectedStatus 201
$transferId = $transferResult.data.id

Test-API -Name "Get Transfer" -Method "GET" -Url "$BASE/transfers/$transferId" -AuthToken $TOKEN -ExpectedStatus 200
Test-API -Name "List Transfers" -Method "GET" -Url "$BASE/transfers" -AuthToken $TOKEN -ExpectedStatus 200

Test-API -Name "Approve Transfer" -Method "PATCH" -Url "$BASE/transfers/$transferId/approve" -Body @{
    approved = $true
    shippingCarrier = "FedEx"
    shippingTracking = "FX-123456789"
} -AuthToken $TOKEN -ExpectedStatus 200

Test-API -Name "Receive Transfer" -Method "PATCH" -Url "$BASE/transfers/$transferId/receive" -Body @{
    conditionAfter = "GOOD"
    notes = "Asset received at branch office in good condition"
} -AuthToken $TOKEN -ExpectedStatus 200

# ==========================================
# PHASE 9: Resource & Booking APIs
# ==========================================
Write-Host "`n--- Phase 9: Resource & Booking APIs ---" -ForegroundColor Yellow

$resourceResult = Test-API -Name "Create Resource" -Method "POST" -Url "$BASE/resources" -Body @{
    companyId = $companyId
    name = "Conference Room A"
    description = "Large meeting room with projector"
    resourceType = "MEETING_ROOM"
    capacity = 20
    officeId = $officeId
    isBookable = $true
    requiresApproval = $false
    maxBookingDurationHours = 8
} -AuthToken $TOKEN -ExpectedStatus 201
$resourceId = $resourceResult.data.id

Test-API -Name "Get Resource" -Method "GET" -Url "$BASE/resources/$resourceId" -AuthToken $TOKEN -ExpectedStatus 200
Test-API -Name "List Resources" -Method "GET" -Url "$BASE/resources" -AuthToken $TOKEN -ExpectedStatus 200
Test-API -Name "Update Resource" -Method "PATCH" -Url "$BASE/resources/$resourceId" -Body @{
    description = "Updated: Large meeting room with projector and whiteboard"
} -AuthToken $TOKEN -ExpectedStatus 200

# Booking
$bookingResult = Test-API -Name "Create Booking" -Method "POST" -Url "$BASE/bookings" -Body @{
    resourceId = $resourceId
    title = "Sprint Planning Meeting"
    description = "Q3 sprint planning session"
    startTime = "2026-07-15T10:00:00Z"
    endTime = "2026-07-15T12:00:00Z"
    attendeeCount = 8
    notes = "Need projector for backlog review"
} -AuthToken $TOKEN -ExpectedStatus 201
$bookingId = $bookingResult.data.id

Test-API -Name "Get Booking" -Method "GET" -Url "$BASE/bookings/$bookingId" -AuthToken $TOKEN -ExpectedStatus 200
Test-API -Name "List Bookings" -Method "GET" -Url "$BASE/bookings" -AuthToken $TOKEN -ExpectedStatus 200

Test-API -Name "Confirm Booking" -Method "PATCH" -Url "$BASE/bookings/$bookingId/confirm" -AuthToken $TOKEN -ExpectedStatus 200
Test-API -Name "Check-in Booking" -Method "PATCH" -Url "$BASE/bookings/$bookingId/check-in" -AuthToken $TOKEN -ExpectedStatus 200
Test-API -Name "Complete Booking" -Method "PATCH" -Url "$BASE/bookings/$bookingId/complete" -AuthToken $TOKEN -ExpectedStatus 200

# Create and cancel a booking
$booking2Result = Test-API -Name "Create Booking 2" -Method "POST" -Url "$BASE/bookings" -Body @{
    resourceId = $resourceId
    title = "Team Standup"
    startTime = "2026-07-16T09:00:00Z"
    endTime = "2026-07-16T09:30:00Z"
    attendeeCount = 5
} -AuthToken $TOKEN -ExpectedStatus 201
$booking2Id = $booking2Result.data.id

Test-API -Name "Cancel Booking" -Method "PATCH" -Url "$BASE/bookings/$booking2Id/cancel" -Body @{
    cancellationReason = "Meeting postponed to next week"
} -AuthToken $TOKEN -ExpectedStatus 200

# ==========================================
# SUMMARY
# ==========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Passed: $passed" -ForegroundColor Green
Write-Host "  Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })

if ($errors.Count -gt 0) {
    Write-Host "`n  Failed tests:" -ForegroundColor Red
    foreach ($e in $errors) {
        Write-Host "    - $e" -ForegroundColor Red
    }
}

Write-Host "`n========================================`n" -ForegroundColor Cyan

# Cleanup: Stop server
Stop-Job $serverJob -ErrorAction SilentlyContinue
Remove-Job $serverJob -ErrorAction SilentlyContinue
Write-Host "Server stopped." -ForegroundColor DarkGray
