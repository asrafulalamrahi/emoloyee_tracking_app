import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class NotificationService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(employeeId?: string) {
    return this.prisma.client.notification.findMany({
      where: employeeId ? { employeeId } : undefined,
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }

  async create(dto: any) {
    return this.prisma.client.notification.create({
      data: {
        employeeId: dto.employeeId,
        employeeName: dto.employeeName,
        type: dto.type,
        message: dto.message,
        read: dto.read || false,
      },
    });
  }

  async markAllRead() {
    await this.prisma.client.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });
    return { success: true };
  }

  async clearAll() {
    await this.prisma.client.notification.deleteMany({});
    return { success: true };
  }
}
