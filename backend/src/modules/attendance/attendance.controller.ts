import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findAll(@Query('employeeId') employeeId?: string) { return this.attendanceService.findAll(employeeId); }

  @Post('clock-in')
  clockIn(@Body() dto: { employeeId: string; date: string }) { return this.attendanceService.clockIn(dto); }

  @Post('clock-out')
  clockOut(@Body() dto: { employeeId: string; date: string }) {
    return this.attendanceService.clockOut(dto.employeeId, dto.date);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.attendanceService.update(id, dto); }
}
