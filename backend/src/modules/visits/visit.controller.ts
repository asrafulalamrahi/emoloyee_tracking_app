import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { VisitService } from './visit.service';

@Controller('visits')
export class VisitController {
  constructor(private readonly visitService: VisitService) {}

  @Get()
  findAll(@Query('employeeId') employeeId?: string) { return this.visitService.findAll(employeeId); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.visitService.findOne(id); }

  @Post()
  create(@Body() dto: any) { return this.visitService.create(dto); }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.visitService.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.visitService.remove(id); }
}
