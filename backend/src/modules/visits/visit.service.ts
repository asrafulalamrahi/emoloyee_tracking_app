import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class VisitService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(employeeId?: string) {
    return this.prisma.client.visit.findMany({
      where: employeeId ? { employeeId } : undefined,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const v = await this.prisma.client.visit.findUnique({ where: { id }, include: { customer: true } });
    if (!v) throw new NotFoundException('Visit not found');
    return v;
  }

  async create(dto: any) {
    return this.prisma.client.visit.create({ data: dto, include: { customer: true } });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.client.visit.update({ where: { id }, data: dto, include: { customer: true } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.client.visit.delete({ where: { id } });
    return { success: true };
  }
}
