import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { GeofenceService } from './geofence.service';

@Controller('geofences')
export class GeofenceController {
  constructor(private readonly geofenceService: GeofenceService) {}

  @Get()
  findAll() { return this.geofenceService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.geofenceService.findOne(id); }

  @Post()
  create(@Body() dto: any) { return this.geofenceService.create(dto); }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.geofenceService.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.geofenceService.remove(id); }
}
