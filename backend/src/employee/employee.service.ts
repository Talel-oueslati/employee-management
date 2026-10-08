import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private repo: Repository<Employee>,
  ) {}

  findAll() { return this.repo.find(); }
  findOne(id: number) { return this.repo.findOneBy({ id }); }
  create(data: Partial<Employee>) { return this.repo.save(data); }

  async update(id: number, data: Partial<Employee>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    const emp = await this.findOne(id);
    if (!emp) throw new NotFoundException();
    return this.repo.remove(emp);
  }
}