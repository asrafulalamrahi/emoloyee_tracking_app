import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(dto: any) {
    const existing = await this.prisma.client.employee.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Employee with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password || 'rider123', 10);

    const employee = await this.prisma.client.employee.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role || 'RIDER',
        phone: dto.phone,
        passwordHash,
        status: 'OFFLINE',
      },
    });

    // Automatically create a blank device entry for the new employee
    await this.prisma.client.device.create({
      data: {
        employeeId: employee.id,
        deviceName: `${dto.name}'s Device`,
        platform: 'Android',
        isGpsEnabled: true,
      },
    });

    const { passwordHash: _, ...result } = employee;
    return result;
  }

  async findAll() {
    return this.prisma.client.employee.findMany({
      include: {
        device: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.client.employee.findUnique({
      where: { id },
      include: {
        device: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const { passwordHash: _, ...result } = employee;
    return result;
  }

  async update(id: string, dto: any) {
    const employee = await this.prisma.client.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const updateData: any = {
      email: dto.email,
      name: dto.name,
      role: dto.role,
      phone: dto.phone,
      status: dto.status,
    };

    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.client.employee.update({
      where: { id },
      data: updateData,
    });

    // Update corresponding device if parameters provided
    if (dto.deviceName || dto.platform !== undefined) {
      await this.prisma.client.device.update({
        where: { employeeId: id },
        data: {
          deviceName: dto.deviceName,
          platform: dto.platform,
        },
      });
    }

    const { passwordHash: _, ...result } = updated;
    return result;
  }

  async remove(id: string) {
    const employee = await this.prisma.client.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.prisma.client.employee.delete({
      where: { id },
    });

    return { success: true, message: 'Employee deleted successfully' };
  }
}
