const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  try {
    // Create company
    const company = await prisma.company.upsert({
      where: { slug: "test-corp" },
      update: {},
      create: {
        name: "Test Corporation",
        slug: "test-corp",
        email: "info@testcorp.com",
        phone: "+1-555-0100",
        isActive: true,
        currency: "USD",
        timezone: "UTC",
      },
    });
    console.log("Company:", company.id);

    // Create user with hashed password
    const passwordHash = await bcrypt.hash("TestPass123!", 10);
    const user = await prisma.user.upsert({
      where: { email: "test@assetflow.com" },
      update: {
        status: "ACTIVE",
        emailVerified: true,
        passwordHash,
      },
      create: {
        email: "test@assetflow.com",
        passwordHash,
        firstName: "Test",
        lastName: "Admin",
        status: "ACTIVE",
        emailVerified: true,
      },
    });
    console.log("User:", user.id);

    // Create employee profile
    const profile = await prisma.employeeProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        companyId: company.id,
        employeeId: "EMP-001",
        jobTitle: "System Administrator",
        employmentType: "FULL_TIME",
        status: "ACTIVE",
        hireDate: new Date(),
      },
    });
    console.log("Profile:", profile.id);

    // Create admin role if not exists
    const role = await prisma.role.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: {
        name: "ADMIN",
        description: "System Administrator",
        type: "SYSTEM",
        isDefault: false,
        isActive: true,
      },
    });
    console.log("Role:", role.id);

    // Assign role to user
    const existingUR = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: role.id, companyId: company.id },
    });
    if (!existingUR) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          companyId: company.id,
          isActive: true,
        },
      });
    }
    console.log("UserRole assigned");

    console.log(JSON.stringify({ companyId: company.id, userId: user.id, roleId: role.id }));
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
