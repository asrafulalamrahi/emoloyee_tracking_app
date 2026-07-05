require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const employee = await prisma.employee.findUnique({ where: { email: 'david@metrologix.com' } });
    if (employee) {
      const updated = await prisma.employee.update({
        where: { id: employee.id },
        data: { employeeCode: 'EMP-004' }
      });
      console.log("Updated employee:", updated);
    } else {
      console.log("Employee not found");
    }
  } catch (e) {
    console.error("Prisma error:", e);
  }
}
main();
