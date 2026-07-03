import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async logLocation(
    @Body()
    dto: {
      employeeId: string;
      lat: number;
      lng: number;
      batteryLevel?: number;
      platform?: string;
      deviceName?: string;
      isGpsEnabled?: boolean;
      locationPermission?: string;
    },
  ) {
    return this.locationService.logLocation(dto);
  }

  @Get('live')
  async getLive() {
    return this.locationService.getLatestLocations();
  }

  @Get('history/:employeeId')
  async getHistory(
    @Param('employeeId') employeeId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.locationService.getHistory(employeeId, parsedLimit);
  }
}
