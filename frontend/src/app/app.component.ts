import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';        // for *ngFor
import { FormsModule } from '@angular/forms';          // for [(ngModel)]
import { Employee, EmployeeService } from './employee.service';

@Component({
  selector: 'app-root',
  standalone: true,                                     // 👈 standalone
  imports: [CommonModule, FormsModule],                 // 👈 import what you use
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  employees: Employee[] = [];
  form: Employee = { firstName: '', lastName: '', email: '', position: '', salary: 0 };
  editingId: number | null = null;

  constructor(private service: EmployeeService) {}

  ngOnInit() { this.load(); }

  load() { this.service.getAll().subscribe(d => this.employees = d); }

  save() {
    if (this.editingId) {
      this.service.update(this.editingId, this.form).subscribe(() => this.reset());
    } else {
      this.service.create(this.form).subscribe(() => this.reset());
    }
  }

  edit(e: Employee) { this.form = { ...e }; this.editingId = e.id!; }

  delete(id: number) { this.service.delete(id).subscribe(() => this.load()); }

  reset() {
    this.form = { firstName: '', lastName: '', email: '', position: '', salary: 0 };
    this.editingId = null;
    this.load();
  }
}