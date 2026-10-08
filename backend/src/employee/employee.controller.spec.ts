import { Test } from '@nestjs/testing';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let service: EmployeeService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        { provide: EmployeeService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
    service = module.get<EmployeeService>(EmployeeService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll() should delegate to service', async () => {
    mockService.findAll.mockResolvedValue([{ id: 1 }]);
    const result = await controller.findAll();
    expect(result).toEqual([{ id: 1 }]);
    expect(mockService.findAll).toHaveBeenCalled();
  });

  it('findOne() should delegate to service', async () => {
    mockService.findOne.mockResolvedValue({ id: 1 });
    const result = await controller.findOne(1);
    expect(result).toEqual({ id: 1 });
    expect(mockService.findOne).toHaveBeenCalledWith(1);
  });

  it('findByEmail() should delegate to service', async () => {
    mockService.findByEmail.mockResolvedValue({ id: 1, email: 'a@b.com' });
    const result = await controller.findByEmail('a@b.com');
    expect(result).toEqual({ id: 1, email: 'a@b.com' });
    expect(mockService.findByEmail).toHaveBeenCalledWith('a@b.com');
  });

  it('create() should delegate to service', async () => {
    const body = { firstName: 'Ali', salary: 50000 };
    mockService.create.mockResolvedValue({ id: 1, ...body });
    const result = await controller.create(body);
    expect(result).toEqual({ id: 1, ...body });
  });

  it('getStats() should delegate to service', async () => {
    mockService.getStatistics.mockResolvedValue({ count: 3, averageSalary: 50000, totalSalary: 150000 });
    const result = await controller.getStats();
    expect(result.count).toBe(3);
  });
});