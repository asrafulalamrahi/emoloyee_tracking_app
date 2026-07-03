import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database for simplified MVP...');

  // 1. Reset Database tables safely (clearing children first)
  console.log('Clearing old data...');
  await prisma.gPSLocation.deleteMany({});
  await prisma.device.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create default Admin
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@metrologix.com',
      passwordHash: adminPasswordHash,
      name: 'System Admin',
      role: 'ADMIN',
    },
  });
  console.log('Admin user created:', admin.email);

  // 3. Create initial Employees (Riders & Merchandisers)
  const employeePasswordHash = await bcrypt.hash('rider123', 10);
  
  const employeesData = [
    {
      name: 'John Rider',
      email: 'rider1@metrologix.com',
      employeeCode: 'EMP-001',
      role: 'RIDER',
      phone: '+1 (555) 101-2002',
      status: 'ONLINE',
      lastLat: 37.7749,
      lastLng: -122.4194,
      lastLocationUpdate: new Date(),
    },
    {
      name: 'Sarah Connor',
      email: 'sarah@metrologix.com',
      employeeCode: 'EMP-002',
      role: 'RIDER',
      phone: '+1 (555) 202-3003',
      status: 'ONLINE',
      lastLat: 37.7858,
      lastLng: -122.4008,
      lastLocationUpdate: new Date(),
    },
    {
      name: 'Clara Merchandiser',
      email: 'merch1@metrologix.com',
      employeeCode: 'EMP-003',
      role: 'MERCHANDISER',
      phone: '+1 (555) 303-4004',
      status: 'OFFLINE',
      lastLat: 37.7599,
      lastLng: -122.4346,
      lastLocationUpdate: new Date(),
    },
  ];

  for (const empData of employeesData) {
    const emp = await prisma.employee.create({
      data: {
        name: empData.name,
        email: empData.email,
        employeeCode: empData.employeeCode,
        passwordHash: employeePasswordHash,
        role: empData.role,
        phone: empData.phone,
        status: empData.status,
        lastLat: empData.lastLat,
        lastLng: empData.lastLng,
        lastLocationUpdate: empData.lastLocationUpdate,
      },
    });
    console.log(`Employee created: ${emp.name} (${emp.role})`);

    // Create a device associated with the employee
    await prisma.device.create({
      data: {
        employeeId: emp.id,
        platform: 'Android',
        deviceName: `${emp.name}'s Pixel 8`,
        batteryLevel: 85,
        isGpsEnabled: true,
        locationPermission: 'GRANTED',
      },
    });

    // Log their starting GPS location in the GPSLocations history table
    await prisma.gPSLocation.create({
      data: {
        employeeId: emp.id,
        lat: empData.lastLat,
        lng: empData.lastLng,
        batteryLevel: 85,
        timestamp: new Date(),
      },
    });
  }

  console.log('Seed Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
