import { Controller, Get, Post, Put, Delete, Body, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(@Query('employeeId') employeeId?: string) { return this.notificationService.findAll(employeeId); }

  @Post()
  create(@Body() dto: any) { return this.notificationService.create(dto); }

  @Put('read-all')
  markAllRead() { return this.notificationService.markAllRead(); }

  @Delete('clear')
  clearAll() { return this.notificationService.clearAll(); }
}
