import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Employee {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  salary: number;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private api = '/api/employees';
  constructor(private http: HttpClient) {}

  getAll() { return this.http.get<Employee[]>(this.api); }
  create(e: Employee) { return this.http.post<Employee>(this.api, e); }
  update(id: number, e: Employee) { return this.http.put<Employee>(`${this.api}/${id}`, e); }
  delete(id: number) { return this.http.delete(`${this.api}/${id}`); }
}