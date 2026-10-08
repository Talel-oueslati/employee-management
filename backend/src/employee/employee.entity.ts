import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  position: string;

  @Column('decimal', { precision: 10, scale: 2 })
  salary: number;
}