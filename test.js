require('./backend/node_modules/dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'admin@metrologix.com' } });
    console.log("User:", user);
  } catch (e) {
    console.error("Prisma error:", e);
  }
}
main();
