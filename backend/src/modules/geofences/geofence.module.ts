import { Module } from '@nestjs/common';
import { GeofenceController } from './geofence.controller';
import { GeofenceService } from './geofence.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [GeofenceController],
  providers: [GeofenceService, PrismaService],
  exports: [GeofenceService],
})
export class GeofenceModule {}
