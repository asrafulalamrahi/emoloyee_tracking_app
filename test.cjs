const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:../dev.db' } } });

async function main() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'admin@metrologix.com' } });
    console.log("User:", user);
  } catch (e) {
    console.error("Prisma error:", e);
  }
}
main();
