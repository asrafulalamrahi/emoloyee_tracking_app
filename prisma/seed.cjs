"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// prisma/seed.ts
var import_client = require("@prisma/client");
var bcrypt = __toESM(require("bcrypt"), 1);
var prisma = new import_client.PrismaClient();
async function main() {
  console.log("Seeding Database...");
  const company = await prisma.company.create({
    data: {
      name: "MetroLogix Enterprise",
      email: "admin@metrologix.com",
      phone: "+1 (555) 123-4567",
      address: "500 Sansome St, San Francisco, CA"
    }
  });
  const branch = await prisma.branch.create({
    data: {
      name: "SF Headquarters",
      address: "500 Sansome St, San Francisco, CA",
      lat: 37.7946,
      lng: -122.4014,
      companyId: company.id
    }
  });
  const dept = await prisma.department.create({
    data: {
      name: "Operations",
      companyId: company.id
    }
  });
  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.employee.create({
    data: {
      email: "admin@metrologix.com",
      passwordHash,
      name: "System Admin",
      role: "SUPER_ADMIN",
      companyId: company.id,
      branchId: branch.id,
      departmentId: dept.id,
      status: "ONLINE"
    }
  });
  console.log("Seed Complete. Admin created:", admin.email);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
