import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private repo: Repository<Employee>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string) {
    return this.repo.findOneBy({ email });
  }

  create(data: Partial<Employee>) {
    this.validateSalary(data.salary);
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<Employee>) {
    if (data.salary !== undefined) {
      this.validateSalary(data.salary);
    }
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    const emp = await this.findOne(id);
    if (!emp) throw new NotFoundException(`Employee ${id} not found`);
    return this.repo.remove(emp);
  }

  // ─── Business logic ───────────────────────────────────────

  validateSalary(salary: number): void {
    if (salary === undefined || salary === null) {
      throw new BadRequestException('Salary is required');
    }
    if (salary <= 0) {
      throw new BadRequestException('Salary must be positive');
    }
    if (salary > 1000000) {
      throw new BadRequestException('Salary must be less than 1,000,000');
    }
  }

  async getStatistics() {
    const employees = await this.repo.find();
    if (employees.length === 0) {
      return { count: 0, averageSalary: 0, totalSalary: 0 };
    }
    const totalSalary = employees.reduce((sum, e) => sum + Number(e.salary), 0);
    const averageSalary = totalSalary / employees.length;
    return {
      count: employees.length,
      averageSalary: Math.round(averageSalary * 100) / 100,
      totalSalary,
    };
  }
}