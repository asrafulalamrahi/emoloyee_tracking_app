import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class GeofenceService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.client.geofence.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const g = await this.prisma.client.geofence.findUnique({ where: { id } });
    if (!g) throw new NotFoundException('Geofence not found');
    return g;
  }

  async create(dto: any) {
    return this.prisma.client.geofence.create({
      data: {
        name: dto.name,
        type: dto.type || 'CIRCLE',
        centerLat: dto.centerLat,
        centerLng: dto.centerLng,
        radius: dto.radius,
        polygonPath: dto.polygonPath,
        status: dto.status || 'ACTIVE',
        targetTeams: dto.targetTeams || [],
      },
    });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.client.geofence.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        centerLat: dto.centerLat,
        centerLng: dto.centerLng,
        radius: dto.radius,
        polygonPath: dto.polygonPath,
        status: dto.status,
        targetTeams: dto.targetTeams,
        enterCount: dto.enterCount,
        exitCount: dto.exitCount,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.client.geofence.delete({ where: { id } });
    return { success: true };
  }
}
