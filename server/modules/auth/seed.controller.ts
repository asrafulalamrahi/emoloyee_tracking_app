import { Controller, Get, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

@Controller('seed')
export class SeedController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  async seed() {
    try {
      // 1. Create a Company
      const company = await this.prisma.client.company.upsert({
        where: { email: 'admin@metrologix.com' },
        update: {},
        create: {
          name: 'MetroLogix Enterprise',
          email: 'admin@metrologix.com',
          phone: '+1 (555) 123-4567',
          address: '500 Sansome St, San Francisco, CA',
        },
      });

      // 2. Create a Branch
      let branch = await this.prisma.client.branch.findFirst({ where: { companyId: company.id } });
      if (!branch) {
        branch = await this.prisma.client.branch.create({
          data: {
            name: 'SF Headquarters',
            address: '500 Sansome St, San Francisco, CA',
            lat: 37.7946,
            lng: -122.4014,
            companyId: company.id,
          },
        });
      }

      // 3. Create a Department
      let dept = await this.prisma.client.department.findFirst({ where: { companyId: company.id } });
      if (!dept) {
        dept = await this.prisma.client.department.create({
          data: {
            name: 'Operations',
            companyId: company.id,
          },
        });
      }

      // 4. Create Super Admin
      const passwordHash = await bcrypt.hash('admin123', 10);
      const admin = await this.prisma.client.employee.upsert({
        where: { email: 'admin@metrologix.com' },
        update: {},
        create: {
          email: 'admin@metrologix.com',
          passwordHash,
          name: 'System Admin',
          role: 'SUPER_ADMIN',
          companyId: company.id,
          branchId: branch.id,
          departmentId: dept.id,
          status: 'ONLINE',
        },
      });

      return { message: 'Database seeded successfully', adminEmail: admin.email };
    } catch (e: any) {
      return { error: e.message, stack: e.stack };
    }
  }
}
