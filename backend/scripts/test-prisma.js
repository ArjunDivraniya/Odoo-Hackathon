require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

prisma.user.findFirst({ where: { email: 'test@assetflow.com' } }).then(u => {
  console.log('Found:', u ? u.email : 'null');
  console.log('Status:', u ? u.status : 'N/A');
  return prisma.$disconnect();
}).catch(e => {
  console.error('Error:', e.message.substring(0, 500));
  return prisma.$disconnect();
});
