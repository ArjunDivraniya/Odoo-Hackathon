const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    console.log("Testing user findFirst...");
    const user = await prisma.user.findFirst({ where: { email: "test@assetflow.com", deletedAt: null } });
    console.log("User found:", user ? user.email : "null");

    console.log("\nTesting session findFirst...");
    const session = await prisma.session.findFirst({ where: { id: "test", isActive: true } });
    console.log("Session:", session);
    
    console.log("\nAll good!");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
