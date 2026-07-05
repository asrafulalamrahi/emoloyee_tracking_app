import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database for Abul Khair Group location tracker...');

  // Reset database safely
  console.log('Clearing old data...');
  await prisma.gPSLocation.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.visit.deleteMany({});
  await prisma.device.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.geofence.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create default Admin
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@abulkhairgroup.com',
      passwordHash: adminPasswordHash,
      name: 'System Admin',
      role: 'ADMIN',
    },
  });
  console.log('Admin user created:', admin.email);

  // 2. Create default Employees
  const employeePasswordHash = await bcrypt.hash('rider123', 10);
  
  const employeesData = [
    {
      id: 'emp_new_1',
      name: 'Md. Asif Rahman',
      email: 'asif@abulkhairgroup.com',
      employeeCode: 'EMP-000',
      role: 'Trainee Officer',
      phone: '01712345678',
      status: 'OFFLINE',
      lastLat: 0.0,
      lastLng: 0.0,
      department: 'HR',
      designation: 'Trainee',
      branch: 'Chittagong',
      factory: 'Steel Plant',
      region: 'Chattogram',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      qrCode: 'AKG-EMP-EMP-000',
    },
    {
      id: 'emp_1',
      name: 'Tanvir Ahmed',
      email: 'tanvir@abulkhairgroup.com',
      employeeCode: 'EMP-001',
      role: 'Delivery Rider',
      phone: '01812345678',
      status: 'ONLINE',
      lastLat: 22.3255,
      lastLng: 91.8105,
      department: 'Logistics',
      designation: 'Rider',
      branch: 'Chittagong',
      factory: 'Cement Plant',
      region: 'Chattogram',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      qrCode: 'AKG-EMP-EMP-001',
    },
    {
      id: 'emp_2',
      name: 'Sadia Karim',
      email: 'sadia@abulkhairgroup.com',
      employeeCode: 'EMP-002',
      role: 'Senior Sales Executive',
      phone: '01912345678',
      status: 'ONLINE',
      lastLat: 23.7945,
      lastLng: 90.4075,
      department: 'Sales',
      designation: 'Sales Rep',
      branch: 'Dhaka',
      factory: 'Foods Plant',
      region: 'Dhaka',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      qrCode: 'AKG-EMP-EMP-002',
    },
  ];

  for (const empData of employeesData) {
    const emp = await prisma.employee.create({
      data: {
        id: empData.id,
        name: empData.name,
        email: empData.email,
        employeeCode: empData.employeeCode,
        passwordHash: employeePasswordHash,
        role: empData.role,
        phone: empData.phone,
        status: empData.status,
        lastLat: empData.lastLat,
        lastLng: empData.lastLng,
        lastLocationUpdate: new Date(),
        department: empData.department,
        designation: empData.designation,
        branch: empData.branch,
        factory: empData.factory,
        region: empData.region,
        photoUrl: empData.photoUrl,
        qrCode: empData.qrCode,
      },
    });
    console.log(`Employee created: ${emp.name} (${emp.role})`);

    // Create a device associated with the employee
    await prisma.device.create({
      data: {
        employeeId: emp.id,
        platform: 'Android',
        deviceName: `${emp.name}'s Device`,
        batteryLevel: 85,
        isGpsEnabled: true,
        locationPermission: 'GRANTED',
      },
    });

    // Log their starting GPS location in the GPSLocations history table
    if (empData.lastLat !== 0) {
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
