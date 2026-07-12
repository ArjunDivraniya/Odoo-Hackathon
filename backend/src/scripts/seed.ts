import dotenv from "dotenv";
dotenv.config();

import { UserStatus, RoleType, PermissionType } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";

const DEFAULT_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

async function main() {
  console.log("Database seeding started...");

  // 1. Seed 4 Companies (Min 3-4 data entries)
  const companiesToSeed = [
    { id: DEFAULT_COMPANY_ID, name: "AssetFlow Corporation", slug: "assetflow-corp", legalName: "AssetFlow Solutions Inc.", email: "info@assetflow.com" },
    { id: "00000000-0000-0000-0000-000000000001", name: "Tech Innovations", slug: "tech-innovations", legalName: "Tech Innovations Ltd.", email: "info@techin.com" },
    { id: "00000000-0000-0000-0000-000000000002", name: "Global Trading Corp", slug: "global-trading", legalName: "Global Trading International", email: "info@globaltrade.com" },
    { id: "00000000-0000-0000-0000-000000000003", name: "Finance Corporation", slug: "finance-corp", legalName: "Finance Corp Inc.", email: "info@financecorp.com" },
  ];

  const seededCompanies = [];
  for (const c of companiesToSeed) {
    const comp = await prisma.company.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        legalName: c.legalName,
        email: c.email,
        phone: "+15550199",
        timezone: "UTC",
        currency: "USD",
        isActive: true,
      },
    });
    seededCompanies.push(comp);
  }
  console.log(`${seededCompanies.length} companies seeded successfully.`);

  // 2. Seed 4 Offices for Default Company (Min 3-4 data entries)
  const officesToSeed = [
    { name: "New York HQ", code: "NY-01", isHq: true },
    { name: "London Branch", code: "LN-02", isHq: false },
    { name: "Tokyo Hub", code: "TK-03", isHq: false },
    { name: "Paris Lab", code: "PR-04", isHq: false },
  ];

  const seededOffices = [];
  for (const o of officesToSeed) {
    const office = await prisma.office.upsert({
      where: {
        companyId_code: {
          companyId: DEFAULT_COMPANY_ID,
          code: o.code,
        },
      },
      update: {},
      create: {
        companyId: DEFAULT_COMPANY_ID,
        name: o.name,
        code: o.code,
        isHq: o.isHq,
        isActive: true,
        maxCapacity: 100,
      },
    });
    seededOffices.push(office);
  }
  console.log(`${seededOffices.length} offices seeded successfully.`);

  // 3. Seed 4 Buildings for NY HQ (Min 3-4 data entries)
  const nyOfficeId = seededOffices[0].id;
  const buildingsToSeed = [
    { name: "Building NY-A", code: "BLD-A" },
    { name: "Building NY-B", code: "BLD-B" },
    { name: "Building NY-C", code: "BLD-C" },
    { name: "Building NY-D", code: "BLD-D" },
  ];

  const seededBuildings = [];
  for (const b of buildingsToSeed) {
    const building = await prisma.building.upsert({
      where: {
        officeId_code: {
          officeId: nyOfficeId,
          code: b.code,
        },
      },
      update: {},
      create: {
        companyId: DEFAULT_COMPANY_ID,
        officeId: nyOfficeId,
        name: b.name,
        code: b.code,
        totalFloors: 5,
        isActive: true,
      },
    });
    seededBuildings.push(building);
  }
  console.log(`${seededBuildings.length} buildings seeded successfully.`);

  // 4. Seed 4 Floors for Building NY-A (Min 3-4 data entries)
  const buildingId = seededBuildings[0].id;
  const floorsToSeed = [
    { name: "Ground Floor", levelNumber: 0 },
    { name: "First Floor", levelNumber: 1 },
    { name: "Second Floor", levelNumber: 2 },
    { name: "Third Floor", levelNumber: 3 },
  ];

  const seededFloors = [];
  for (const f of floorsToSeed) {
    const floor = await prisma.floor.upsert({
      where: {
        buildingId_levelNumber: {
          buildingId,
          levelNumber: f.levelNumber,
        },
      },
      update: {},
      create: {
        companyId: DEFAULT_COMPANY_ID,
        buildingId,
        name: f.name,
        levelNumber: f.levelNumber,
        isActive: true,
      },
    });
    seededFloors.push(floor);
  }
  console.log(`${seededFloors.length} floors seeded successfully.`);

  // 5. Seed 4 Locations for Floor 1 (Min 3-4 data entries)
  const floorId = seededFloors[1].id;
  const locationsToSeed = [
    { name: "Conference Room Alpha", code: "CONF-A", locationType: "MEETING_ROOM" },
    { name: "Meeting Room Beta", code: "MEET-B", locationType: "MEETING_ROOM" },
    { name: "Quiet Zone 01", code: "QZ-01", locationType: "QUIET_ZONE" },
    { name: "Desk Block Delta", code: "DESK-D", locationType: "DESK_CLUSTER" },
  ];

  const seededLocations = [];
  for (const l of locationsToSeed) {
    const location = await prisma.location.upsert({
      where: {
        floorId_code: {
          floorId,
          code: l.code,
        },
      },
      update: {},
      create: {
        companyId: DEFAULT_COMPANY_ID,
        floorId,
        name: l.name,
        code: l.code,
        locationType: l.locationType,
        isBookable: true,
        isActive: true,
      },
    });
    seededLocations.push(location);
  }
  console.log(`${seededLocations.length} locations seeded successfully.`);

  // 6. Seed 4 Departments (Min 3-4 data entries)
  const departmentsToSeed = [
    { name: "Executive", code: "EXEC", parentId: null },
    { name: "Engineering", code: "ENG", parentId: "EXEC" },
    { name: "Human Resources", code: "HR", parentId: "EXEC" },
    { name: "Marketing", code: "MKT", parentId: "EXEC" },
  ];

  const seededDepartments: Record<string, any> = {};
  for (const d of departmentsToSeed) {
    // Check if parentId maps to a previously seeded department
    let parentUuid: string | null = null;
    if (d.parentId && seededDepartments[d.parentId]) {
      parentUuid = seededDepartments[d.parentId].id;
    }

    // Try finding first
    let dept = await prisma.department.findFirst({
      where: { companyId: DEFAULT_COMPANY_ID, code: d.code, deletedAt: null },
    });

    if (!dept) {
      dept = await prisma.$transaction(async (tx) => {
        const newDept = await tx.department.create({
          data: {
            companyId: DEFAULT_COMPANY_ID,
            name: d.name,
            code: d.code,
            parentId: parentUuid,
            status: "ACTIVE",
          },
        });

        // Closure table entry
        await tx.departmentHierarchy.create({
          data: { ancestorId: newDept.id, descendantId: newDept.id, depth: 0 },
        });

        if (parentUuid) {
          const parentAncestors = await tx.departmentHierarchy.findMany({
            where: { descendantId: parentUuid },
          });
          for (const ancestorRow of parentAncestors) {
            await tx.departmentHierarchy.create({
              data: {
                ancestorId: ancestorRow.ancestorId,
                descendantId: newDept.id,
                depth: ancestorRow.depth + 1,
              },
            });
          }
        }
        return newDept;
      });
    }
    seededDepartments[d.code] = dept;
  }
  console.log("Departments seeded successfully.");

  // 7. Seed System Roles
  const rolesToSeed = [
    { name: "ADMIN", description: "System Administrator with full access", isDefault: false, type: RoleType.SYSTEM },
    { name: "ASSET_MANAGER", description: "Manages assets, categories, audits and reports", isDefault: false, type: RoleType.SYSTEM },
    { name: "DEPARTMENT_HEAD", description: "Department head managing allocations and staff within a department", isDefault: false, type: RoleType.SYSTEM },
    { name: "EMPLOYEE", description: "Standard employee who can request and use assets", isDefault: true, type: RoleType.SYSTEM },
    { name: "AUDITOR", description: "Audit officer to verify physical asset locations", isDefault: false, type: RoleType.SYSTEM },
    { name: "TECHNICIAN", description: "Maintenance engineer to repair assets", isDefault: false, type: RoleType.SYSTEM },
  ];

  const seededRoles: Record<string, any> = {};
  for (const r of rolesToSeed) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description, isDefault: r.isDefault, type: r.type },
      create: {
        name: r.name,
        description: r.description,
        isDefault: r.isDefault,
        type: r.type,
        companyId: DEFAULT_COMPANY_ID,
      },
    });
    seededRoles[r.name] = role;
  }
  console.log("System roles seeded successfully.");

  // 8. Seed Permissions
  const modules = ["user", "role", "permission", "company", "office", "building", "floor", "location", "department", "employee", "asset", "booking", "maintenance", "audit"];
  const actions = ["create", "read", "update", "delete"];
  const seededPermissions = [];

  for (const mod of modules) {
    for (const act of actions) {
      const slug = `${mod}:${act}`;
      const name = slug.replace(/:/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      const perm = await prisma.permission.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          name,
          module: mod,
          action: act,
          type: PermissionType.MODULE,
        },
      });
      seededPermissions.push(perm);
    }
  }
  console.log(`${seededPermissions.length} permissions seeded successfully.`);

  // Map all permissions to the ADMIN role
  const adminRole = seededRoles["ADMIN"];
  for (const perm of seededPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log("All permissions mapped to ADMIN role.");

  // 9. Seed the 6 requested users in sequence with same password
  const passwordHash = await bcrypt.hash("Pass@12345", 10);
  const usersToSeed = [
    { email: "priy.mavani.01@gmail.com", firstName: "Priy", lastName: "Mavani One", roleName: "DEPARTMENT_HEAD", deptCode: "ENG" },
    { email: "priymavani001@gmail.com", firstName: "Priy", lastName: "Mavani Two", roleName: "EMPLOYEE", deptCode: "ENG" },
    { email: "priy.mavani.cg@gmail.com", firstName: "Priy", lastName: "Mavani Three", roleName: "ADMIN", deptCode: "EXEC" },
    { email: "priymavani002@gmail.com", firstName: "Priy", lastName: "Mavani Four", roleName: "AUDITOR", deptCode: "HR" },
    { email: "priymavani2025@gmail.com", firstName: "Priy", lastName: "Mavani Five", roleName: "ASSET_MANAGER", deptCode: "EXEC" },
    { email: "mavanipriy2025@gmail.com", firstName: "Priy", lastName: "Mavani Six", roleName: "TECHNICIAN", deptCode: "ENG" },
  ];

  const seededUsers = [];
  for (let i = 0; i < usersToSeed.length; i++) {
    const u = usersToSeed[i];
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    // Map User to Role
    const role = seededRoles[u.roleName];
    const existingUr = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: role.id, companyId: DEFAULT_COMPANY_ID },
    });

    if (!existingUr) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          companyId: DEFAULT_COMPANY_ID,
          isActive: true,
        },
      });
    }

    // Map to EmployeeProfile (Min 3-4 data entries check)
    const existingProfile = await prisma.employeeProfile.findFirst({
      where: { userId: user.id },
    });

    if (!existingProfile) {
      const dept = seededDepartments[u.deptCode];
      await prisma.employeeProfile.create({
        data: {
          userId: user.id,
          companyId: DEFAULT_COMPANY_ID,
          employeeId: `EMP-2026-00${i + 1}`,
          jobTitle: `${u.roleName} Specialist`,
          jobLevel: "L3",
          employmentType: "FULL_TIME",
          status: "ACTIVE",
          hireDate: new Date("2026-01-15"),
          officeId: nyOfficeId,
          departmentId: dept.id,
        },
      });
    }

    seededUsers.push(user);
  }

  console.log(`${seededUsers.length} users and profiles seeded successfully in correct sequence.`);
  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
