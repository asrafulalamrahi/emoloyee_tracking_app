import { Controller, Get, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

@Controller('seed')
export class SeedController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  async seed() {
    try {
      console.log('Seeding Database via Controller...');
      
      // 1. Reset tables safely
      await this.prisma.client.gPSLocation.deleteMany({});
      await this.prisma.client.device.deleteMany({});
      await this.prisma.client.employee.deleteMany({});
      await this.prisma.client.user.deleteMany({});

      // 2. Create Admin
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      const admin = await this.prisma.client.user.create({
        data: {
          email: 'admin@metrologix.com',
          passwordHash: adminPasswordHash,
          name: 'System Admin',
          role: 'ADMIN',
        },
      });

      // 3. Create initial Employees (Riders & Merchandisers)
      const employeePasswordHash = await bcrypt.hash('rider123', 10);

      const employeesData = [
        {
          name: 'John Doe',
          email: 'john@metrologix.com',
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
          name: 'Mike Ross',
          email: 'mike@metrologix.com',
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
        const emp = await this.prisma.client.employee.create({
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

        // Associated Device
        await this.prisma.client.device.create({
          data: {
            employeeId: emp.id,
            platform: 'Android',
            deviceName: `${emp.name}'s Pixel 8`,
            batteryLevel: 85,
            isGpsEnabled: true,
            locationPermission: 'GRANTED',
          },
        });

        // Associated location history
        await this.prisma.client.gPSLocation.create({
          data: {
            employeeId: emp.id,
            lat: empData.lastLat,
            lng: empData.lastLng,
            batteryLevel: 85,
            timestamp: new Date(),
          },
        });
      }

      return {
        status: 'success',
        message: 'Database seeded successfully with MVP test accounts',
        adminAccount: {
          email: admin.email,
          role: admin.role,
        },
      };
    } catch (e: any) {
      return { status: 'error', error: e.message, stack: e.stack };
    }
  }
}
