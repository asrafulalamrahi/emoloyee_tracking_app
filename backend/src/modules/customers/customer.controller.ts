import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CustomerService } from './customer.service';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  findAll() { return this.customerService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.customerService.findOne(id); }

  @Post()
  create(@Body() dto: any) { return this.customerService.create(dto); }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.customerService.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.customerService.remove(id); }
}
