import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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

  // 🟢 Ce test VA RÉUSSIR
  it('should return all employees from repository', async () => {
    const fakeEmployees = [
      { id: 1, firstName: 'Ali', lastName: 'Ben Salah' },
      { id: 2, firstName: 'Fatma', lastName: 'Tounsi' },
    ];
    mockRepo.find.mockResolvedValue(fakeEmployees);

    const result = await service.findAll();
    expect(result).toEqual(fakeEmployees);
    expect(mockRepo.find).toHaveBeenCalled();
  });

  // 🔴 CE TEST VA ÉCHOUER VOLONTAIREMENT (pour voir Jenkins réagir)
  it('FAILING TEST — should prove Jenkins catches bugs', async () => {
    mockRepo.find.mockResolvedValue([]);
    const result = await service.findAll();

    // ⚠️ Assertion fausse volontaire : on dit qu'on attend 999 employés
    // Alors que la vraie valeur est 0 → ce test VA ÉCHOUER
    expect(result.length).toBe(999);
  });
});