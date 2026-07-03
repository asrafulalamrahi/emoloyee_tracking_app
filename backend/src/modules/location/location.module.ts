import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { LocationGateway } from './location.gateway';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [LocationController],
  providers: [LocationService, LocationGateway, PrismaService],
  exports: [LocationService, LocationGateway],
})
export class LocationModule {}
