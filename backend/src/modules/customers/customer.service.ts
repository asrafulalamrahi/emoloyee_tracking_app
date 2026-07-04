import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CustomerService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.client.customer.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const c = await this.prisma.client.customer.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async create(dto: any) {
    return this.prisma.client.customer.create({ data: dto });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.client.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.client.customer.delete({ where: { id } });
    return { success: true };
  }
}
