import dotenv from "dotenv";
dotenv.config();

import { UserStatus, RoleType, PermissionType } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";

const DEFAULT_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

async function main() {
  console.log("Database seeding started...");

  // 1. Seed Default Company
  const company = await prisma.company.upsert({
    where: { id: DEFAULT_COMPANY_ID },
    update: {},
    create: {
      id: DEFAULT_COMPANY_ID,
      name: "AssetFlow Corporation",
      slug: "assetflow-corp",
      legalName: "AssetFlow Solutions Inc.",
      email: "info@assetflow.com",
      phone: "+15550199",
      timezone: "UTC",
      currency: "USD",
      isActive: true,
    },
  });
  console.log(`Default company seeded: ${company.name}`);

  // 2. Seed System Roles
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
  console.log("System roles seeded successfully");

  // 3. Seed Permissions
  const permissionsToSeed = [
    // Users
    { module: "user", action: "create", type: PermissionType.MODULE, description: "Create users" },
    { module: "user", action: "read", type: PermissionType.MODULE, description: "Read users" },
    { module: "user", action: "update", type: PermissionType.MODULE, description: "Update users" },
    { module: "user", action: "delete", type: PermissionType.MODULE, description: "Delete users" },

    // Roles
    { module: "role", action: "create", type: PermissionType.MODULE, description: "Create roles" },
    { module: "role", action: "read", type: PermissionType.MODULE, description: "Read roles" },
    { module: "role", action: "update", type: PermissionType.MODULE, description: "Update roles" },
    { module: "role", action: "delete", type: PermissionType.MODULE, description: "Delete roles" },
    { module: "role", action: "assign", type: PermissionType.MODULE, description: "Assign roles to users" },

    // Permissions
    { module: "permission", action: "create", type: PermissionType.MODULE, description: "Create permissions" },
    { module: "permission", action: "read", type: PermissionType.MODULE, description: "Read permissions" },
    { module: "permission", action: "update", type: PermissionType.MODULE, description: "Update permissions" },
    { module: "permission", action: "delete", type: PermissionType.MODULE, description: "Delete permissions" },

    // Company
    { module: "company", action: "create", type: PermissionType.MODULE, description: "Create companies" },
    { module: "company", action: "read", type: PermissionType.MODULE, description: "Read companies" },
    { module: "company", action: "update", type: PermissionType.MODULE, description: "Update companies" },
    { module: "company", action: "delete", type: PermissionType.MODULE, description: "Delete companies" },

    // Office
    { module: "office", action: "create", type: PermissionType.MODULE, description: "Create offices" },
    { module: "office", action: "read", type: PermissionType.MODULE, description: "Read offices" },
    { module: "office", action: "update", type: PermissionType.MODULE, description: "Update offices" },
    { module: "office", action: "delete", type: PermissionType.MODULE, description: "Delete offices" },

    // Building
    { module: "building", action: "create", type: PermissionType.MODULE, description: "Create buildings" },
    { module: "building", action: "read", type: PermissionType.MODULE, description: "Read buildings" },
    { module: "building", action: "update", type: PermissionType.MODULE, description: "Update buildings" },
    { module: "building", action: "delete", type: PermissionType.MODULE, description: "Delete buildings" },

    // Floor
    { module: "floor", action: "create", type: PermissionType.MODULE, description: "Create floors" },
    { module: "floor", action: "read", type: PermissionType.MODULE, description: "Read floors" },
    { module: "floor", action: "update", type: PermissionType.MODULE, description: "Update floors" },
    { module: "floor", action: "delete", type: PermissionType.MODULE, description: "Delete floors" },

    // Location
    { module: "location", action: "create", type: PermissionType.MODULE, description: "Create locations" },
    { module: "location", action: "read", type: PermissionType.MODULE, description: "Read locations" },
    { module: "location", action: "update", type: PermissionType.MODULE, description: "Update locations" },
    { module: "location", action: "delete", type: PermissionType.MODULE, description: "Delete locations" },

    // Department
    { module: "department", action: "create", type: PermissionType.MODULE, description: "Create departments" },
    { module: "department", action: "read", type: PermissionType.MODULE, description: "Read departments" },
    { module: "department", action: "update", type: PermissionType.MODULE, description: "Update departments" },
    { module: "department", action: "delete", type: PermissionType.MODULE, description: "Delete departments" },

    // Employee
    { module: "employee", action: "create", type: PermissionType.MODULE, description: "Create employees" },
    { module: "employee", action: "read", type: PermissionType.MODULE, description: "Read employees" },
    { module: "employee", action: "update", type: PermissionType.MODULE, description: "Update employees" },
    { module: "employee", action: "delete", type: PermissionType.MODULE, description: "Delete employees" },
  ];

  const seededPermissions = [];
  for (const p of permissionsToSeed) {
    const slug = `${p.module}:${p.action}`;
    const name = slug.replace(/:/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const perm = await prisma.permission.upsert({
      where: { slug },
      update: { description: p.description },
      create: {
        name,
        slug,
        module: p.module,
        action: p.action,
        type: p.type,
        description: p.description,
      },
    });
    seededPermissions.push(perm);
  }
  console.log(`${seededPermissions.length} permissions seeded`);

  // 4. Map all permissions to the ADMIN Role
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
  console.log("All permissions mapped to ADMIN role");

  // 5. Seed Superadmin User
  const adminEmail = "admin@assetflow.com";
  const passwordHash = await bcrypt.hash("Admin@123456", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: "System",
      lastName: "Administrator",
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });
  console.log(`Superadmin user seeded: ${adminUser.email}`);

  // 6. Map Superadmin User to ADMIN Role for default company context
  const existingUr = await prisma.userRole.findFirst({
    where: {
      userId: adminUser.id,
      roleId: adminRole.id,
      companyId: DEFAULT_COMPANY_ID,
    },
  });

  if (existingUr) {
    await prisma.userRole.update({
      where: { id: existingUr.id },
      data: { isActive: true },
    });
  } else {
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
        companyId: DEFAULT_COMPANY_ID,
        isActive: true,
      },
    });
  }
  console.log("Superadmin user mapped to ADMIN role.");

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
