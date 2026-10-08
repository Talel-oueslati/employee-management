import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';


describe('Employee API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // ⚙️ Utilise la DB de test (employees_test)
  beforeAll(async () => {
    process.env.DB_NAME = 'employees_test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    dataSource = app.get(DataSource);
  });

  // 🧹 Nettoie la DB entre les tests
  beforeEach(async () => {
    await dataSource.query('DELETE FROM employees');
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Health check ─────────────────────────────────────────

  describe('GET /api/health', () => {
    it('should return ok status', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect({ status: 'ok' });
    });
  });

  // ─── Create ───────────────────────────────────────────────

  describe('POST /api/employees', () => {
    it('should create a new employee', async () => {
      const newEmp = {
        firstName: 'Ali',
        lastName: 'Ben Salah',
        email: 'ali@test.com',
        position: 'Developer',
        salary: 50000,
      };

      const res = await request(app.getHttpServer())
        .post('/api/employees')
        .send(newEmp)
        .expect(201);

      expect(res.body.firstName).toBe('Ali');
      expect(res.body.email).toBe('ali@test.com');
      expect(res.body.id).toBeDefined();
    });

    it('should reject negative salary', async () => {
      await request(app.getHttpServer())
        .post('/api/employees')
        .send({
          firstName: 'Bad',
          lastName: 'Employee',
          email: 'bad@test.com',
          position: 'Dev',
          salary: -500,
        })
        .expect(400);
    });

    it('should reject duplicate email', async () => {
      const emp = {
        firstName: 'First',
        lastName: 'User',
        email: 'dup@test.com',
        position: 'Dev',
        salary: 50000,
      };

      await request(app.getHttpServer()).post('/api/employees').send(emp).expect(201);

      // 2nd attempt with same email should fail (unique constraint)
      await request(app.getHttpServer()).post('/api/employees').send(emp).expect(500);
    });
  });

  // ─── Read ─────────────────────────────────────────────────

  describe('GET /api/employees', () => {
    it('should return empty array initially', () => {
      return request(app.getHttpServer())
        .get('/api/employees')
        .expect(200)
        .expect([]);
    });

    it('should return created employees', async () => {
      await request(app.getHttpServer())
        .post('/api/employees')
        .send({
          firstName: 'Ali',
          lastName: 'Test',
          email: 'ali2@test.com',
          position: 'Dev',
          salary: 50000,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/employees')
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].firstName).toBe('Ali');
    });

    it('should return employee by id', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/employees')
        .send({
          firstName: 'Fatma',
          lastName: 'Test',
          email: 'fatma@test.com',
          position: 'Manager',
          salary: 70000,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/api/employees/${created.body.id}`)
        .expect(200);

      expect(res.body.firstName).toBe('Fatma');
    });

    it('should return 404 or null for non-existent id', async () => {
      const res = await request(app.getHttpServer()).get('/api/employees/99999');
      // NestJS returns 200 with empty body if findOneBy returns null
      expect([200, 404]).toContain(res.status);
    });
  });

  // ─── Search by email ──────────────────────────────────────

  describe('GET /api/employees/email/:email', () => {
    it('should find employee by email', async () => {
      await request(app.getHttpServer())
        .post('/api/employees')
        .send({
          firstName: 'Search',
          lastName: 'Me',
          email: 'findme@test.com',
          position: 'Dev',
          salary: 50000,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/employees/email/findme@test.com')
        .expect(200);

      expect(res.body.email).toBe('findme@test.com');
    });
  });

  // ─── Stats ────────────────────────────────────────────────

  describe('GET /api/employees/stats', () => {
    it('should return zeros when no employees', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/employees/stats')
        .expect(200);

      expect(res.body).toEqual({ count: 0, averageSalary: 0, totalSalary: 0 });
    });

    it('should compute stats correctly', async () => {
      const employees = [
        { firstName: 'A', lastName: 'A', email: 'a@t.com', position: 'D', salary: 50000 },
        { firstName: 'B', lastName: 'B', email: 'b@t.com', position: 'D', salary: 60000 },
        { firstName: 'C', lastName: 'C', email: 'c@t.com', position: 'D', salary: 70000 },
      ];

      for (const emp of employees) {
        await request(app.getHttpServer()).post('/api/employees').send(emp).expect(201);
      }

      const res = await request(app.getHttpServer())
        .get('/api/employees/stats')
        .expect(200);

      expect(res.body.count).toBe(3);
      expect(res.body.totalSalary).toBe(180000);
      expect(res.body.averageSalary).toBe(60000);
    });
  });

  // ─── Update ───────────────────────────────────────────────

  describe('PUT /api/employees/:id', () => {
    it('should update an existing employee', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/employees')
        .send({
          firstName: 'Old',
          lastName: 'Name',
          email: 'old@test.com',
          position: 'Dev',
          salary: 50000,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .put(`/api/employees/${created.body.id}`)
        .send({ firstName: 'New', salary: 60000 })
        .expect(200);

      expect(res.body.firstName).toBe('New');
      expect(Number(res.body.salary)).toBe(60000);
    });

    it('should reject update with negative salary', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/employees')
        .send({
          firstName: 'Update',
          lastName: 'Test',
          email: 'upd@test.com',
          position: 'Dev',
          salary: 50000,
        })
        .expect(201);

      await request(app.getHttpServer())
        .put(`/api/employees/${created.body.id}`)
        .send({ salary: -1000 })
        .expect(400);
    });
  });

  // ─── Delete ───────────────────────────────────────────────

  describe('DELETE /api/employees/:id', () => {
    it('should delete an existing employee', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/employees')
        .send({
          firstName: 'To',
          lastName: 'Delete',
          email: 'del@test.com',
          position: 'Dev',
          salary: 50000,
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/employees/${created.body.id}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/api/employees')
        .expect(200);

      expect(res.body.length).toBe(0);
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .delete('/api/employees/99999')
        .expect(404);
    });
  });
});