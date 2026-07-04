import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AttendanceService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(employeeId?: string) {
    return this.prisma.client.attendance.findMany({
      where: employeeId ? { employeeId } : undefined,
      orderBy: { date: 'desc' },
    });
  }

  async clockIn(dto: { employeeId: string; date: string; lat?: number; lng?: number }) {
    const today = dto.date || new Date().toISOString().split('T')[0];
    const existing = await this.prisma.client.attendance.findUnique({
      where: { employeeId_date: { employeeId: dto.employeeId, date: today } },
    });
    if (existing) return existing;

    const now = new Date();
    const hour = now.getHours();
    const status = hour > 9 || (hour === 9 && now.getMinutes() > 0) ? 'LATE' : 'PRESENT';

    return this.prisma.client.attendance.create({
      data: {
        employeeId: dto.employeeId,
        date: today,
        clockIn: now,
        status,
        workingHours: 0,
        overtime: 0,
        validatedByGeofence: true,
      },
    });
  }

  async clockOut(employeeId: string, date: string) {
    const log = await this.prisma.client.attendance.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });
    if (!log) throw new NotFoundException('Attendance log not found');

    const now = new Date();
    const clockIn = new Date(log.clockIn);
    const workingHours = Math.round(((now.getTime() - clockIn.getTime()) / 3_600_000) * 10) / 10;
    const overtime = Math.max(0, workingHours - 8);

    return this.prisma.client.attendance.update({
      where: { employeeId_date: { employeeId, date } },
      data: { clockOut: now, workingHours, overtime },
    });
  }

  async update(id: string, dto: any) {
    return this.prisma.client.attendance.update({ where: { id }, data: dto });
  }
}
