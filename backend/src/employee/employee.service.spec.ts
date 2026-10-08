import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { Employee } from './employee.entity';

describe('EmployeeService', () => {
  let service: EmployeeService;

  const mockRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: getRepositoryToken(Employee),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    jest.clearAllMocks();
  });

  // ─── findAll ──────────────────────────────────────────────

  it('findAll() should return all employees from repository', async () => {
    const fakeEmployees = [
      { id: 1, firstName: 'Ali', lastName: 'Ben Salah' },
      { id: 2, firstName: 'Fatma', lastName: 'Tounsi' },
    ];
    mockRepo.find.mockResolvedValue(fakeEmployees);

    const result = await service.findAll();
    expect(result).toEqual(fakeEmployees);
    expect(mockRepo.find).toHaveBeenCalledTimes(1);
  });

  it('findAll() should return empty array when no employees exist', async () => {
    mockRepo.find.mockResolvedValue([]);
    const result = await service.findAll();
    expect(result).toEqual([]);
  });

  // ─── findOne ──────────────────────────────────────────────

  it('findOne() should return an employee by id', async () => {
    const emp = { id: 1, firstName: 'Ali' };
    mockRepo.findOneBy.mockResolvedValue(emp);

    const result = await service.findOne(1);
    expect(result).toEqual(emp);
    expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });

  it('findOne() should return null if not found', async () => {
    mockRepo.findOneBy.mockResolvedValue(null);
    const result = await service.findOne(999);
    expect(result).toBeNull();
  });

  // ─── findByEmail ──────────────────────────────────────────

  it('findByEmail() should return employee matching email', async () => {
    const emp = { id: 1, email: 'ali@test.com' };
    mockRepo.findOneBy.mockResolvedValue(emp);

    const result = await service.findByEmail('ali@test.com');
    expect(result).toEqual(emp);
    expect(mockRepo.findOneBy).toHaveBeenCalledWith({ email: 'ali@test.com' });
  });

  it('findByEmail() should return null if email not found', async () => {
    mockRepo.findOneBy.mockResolvedValue(null);
    const result = await service.findByEmail('nope@test.com');
    expect(result).toBeNull();
  });

  // ─── create ───────────────────────────────────────────────

  it('create() should save valid employee', async () => {
    const newEmp = { firstName: 'Ali', salary: 50000 };
    const saved = { id: 1, ...newEmp };
    mockRepo.save.mockResolvedValue(saved);

    const result = await service.create(newEmp);
    expect(result).toEqual(saved);
    expect(mockRepo.save).toHaveBeenCalledWith(newEmp);
  });

  // ─── validateSalary ───────────────────────────────────────

  it('validateSalary() should throw if salary is missing', () => {
    expect(() => service.validateSalary(undefined as any))
      .toThrow(BadRequestException);
  });

  it('validateSalary() should throw if salary is negative', () => {
    expect(() => service.validateSalary(-100))
      .toThrow(BadRequestException);
  });

  it('validateSalary() should throw if salary is zero', () => {
    expect(() => service.validateSalary(0))
      .toThrow(BadRequestException);
  });

  it('validateSalary() should throw if salary exceeds 1,000,000', () => {
    expect(() => service.validateSalary(1000001))
      .toThrow(BadRequestException);
  });

  it('validateSalary() should accept valid salary', () => {
    expect(() => service.validateSalary(50000)).not.toThrow();
  });

  // ─── update ───────────────────────────────────────────────

  it('update() should update and return the employee', async () => {
    const updated = { id: 1, firstName: 'New', salary: 60000 };
    mockRepo.update.mockResolvedValue({ affected: 1 });
    mockRepo.findOneBy.mockResolvedValue(updated);

    const result = await service.update(1, { firstName: 'New', salary: 60000 });
    expect(result).toEqual(updated);
    expect(mockRepo.update).toHaveBeenCalledWith(1, { firstName: 'New', salary: 60000 });
  });

  it('update() should reject negative salary', async () => {
    await expect(service.update(1, { salary: -500 }))
      .rejects.toThrow(BadRequestException);
  });

  // ─── remove ───────────────────────────────────────────────

  it('remove() should delete existing employee', async () => {
    const emp = { id: 1, firstName: 'Ali' };
    mockRepo.findOneBy.mockResolvedValue(emp);
    mockRepo.remove.mockResolvedValue(emp);

    const result = await service.remove(1);
    expect(result).toEqual(emp);
    expect(mockRepo.remove).toHaveBeenCalledWith(emp);
  });

  it('remove() should throw NotFoundException if not found', async () => {
    mockRepo.findOneBy.mockResolvedValue(null);
    await expect(service.remove(999)).rejects.toThrow(NotFoundException);
  });

  // ─── getStatistics ────────────────────────────────────────

  it('getStatistics() should return zeros if no employees', async () => {
    mockRepo.find.mockResolvedValue([]);
    const stats = await service.getStatistics();
    expect(stats).toEqual({ count: 0, averageSalary: 0, totalSalary: 0 });
  });

  it('getStatistics() should compute count, average, and total correctly', async () => {
    mockRepo.find.mockResolvedValue([
      { id: 1, salary: 50000 },
      { id: 2, salary: 60000 },
      { id: 3, salary: 70000 },
    ]);
    const stats = await service.getStatistics();
    expect(stats.count).toBe(3);
    expect(stats.totalSalary).toBe(180000);
    expect(stats.averageSalary).toBe(60000);
  });

  it('getStatistics() should round average to 2 decimals', async () => {
    mockRepo.find.mockResolvedValue([
      { id: 1, salary: 33333 },
      { id: 2, salary: 66666 },
      { id: 3, salary: 99999 },
    ]);
    const stats = await service.getStatistics();
    // total = 199998, count = 3, avg = 66666 → already integer
    // Let's do a case that gives decimals:
    mockRepo.find.mockResolvedValue([
      { id: 1, salary: 100 },
      { id: 2, salary: 100 },
      { id: 3, salary: 101 },
    ]);
    const stats2 = await service.getStatistics();
    // total = 301, count = 3, avg = 100.333... → rounds to 100.33
    expect(stats2.averageSalary).toBe(100.33);
  });
});