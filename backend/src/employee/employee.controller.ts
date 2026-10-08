import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { Employee } from './employee.entity';

@Controller('employees')
export class EmployeeController {
  constructor(private service: EmployeeService) {}

  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(+id); }
  @Post() create(@Body() body: Partial<Employee>) { return this.service.create(body); }
  @Put(':id') update(@Param('id') id: string, @Body() body: Partial<Employee>) {
    return this.service.update(+id, body);
  }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(+id); }
}