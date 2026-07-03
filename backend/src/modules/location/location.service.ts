import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { LocationGateway } from './location.gateway';

@Injectable()
export class LocationService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly locationGateway: LocationGateway,
  ) {}

  async logLocation(dto: {
    employeeId: string;
    lat: number;
    lng: number;
    batteryLevel?: number;
    platform?: string;
    deviceName?: string;
    isGpsEnabled?: boolean;
    locationPermission?: string;
  }) {
    // 1. Verify the employee exists
    const employee = await this.prisma.client.employee.findUnique({
      where: { id: dto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${dto.employeeId} not found`);
    }

    const timestamp = new Date();

    // 2. Save coordinate history
    const gpsRecord = await this.prisma.client.gPSLocation.create({
      data: {
        employeeId: dto.employeeId,
        lat: dto.lat,
        lng: dto.lng,
        batteryLevel: dto.batteryLevel,
        timestamp,
      },
    });

    // 3. Update employee direct cache fields & set status to ONLINE
    const updatedEmployee = await this.prisma.client.employee.update({
      where: { id: dto.employeeId },
      data: {
        lastLat: dto.lat,
        lastLng: dto.lng,
        lastLocationUpdate: timestamp,
        status: 'ONLINE',
      },
    });

    // 4. Update Device metadata
    await this.prisma.client.device.upsert({
      where: { employeeId: dto.employeeId },
      update: {
        batteryLevel: dto.batteryLevel,
        platform: dto.platform,
        deviceName: dto.deviceName,
        isGpsEnabled: dto.isGpsEnabled ?? true,
        locationPermission: dto.locationPermission ?? 'GRANTED',
        lastSeen: timestamp,
      },
      create: {
        employeeId: dto.employeeId,
        batteryLevel: dto.batteryLevel,
        platform: dto.platform,
        deviceName: dto.deviceName || `${employee.name}'s Device`,
        isGpsEnabled: dto.isGpsEnabled ?? true,
        locationPermission: dto.locationPermission ?? 'GRANTED',
        lastSeen: timestamp,
      },
    });

    // 5. Broadcast real-time Socket.io update to frontend
    this.locationGateway.broadcastLocationUpdate({
      employeeId: employee.id,
      name: employee.name,
      role: employee.role,
      status: 'ONLINE',
      lat: dto.lat,
      lng: dto.lng,
      batteryLevel: dto.batteryLevel,
      timestamp: timestamp.toISOString(),
    });

    return gpsRecord;
  }

  async getLatestLocations() {
    return this.prisma.client.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        lastLat: true,
        lastLng: true,
        lastLocationUpdate: true,
        device: true,
      },
    });
  }

  async getHistory(employeeId: string, limit = 50) {
    const employee = await this.prisma.client.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee not found`);
    }

    return this.prisma.client.gPSLocation.findMany({
      where: { employeeId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}
