import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ApiService } from '../core/api.service';
import { MessageService } from '../core/ui.services';

// Interfaz de mantenimiento de clientes (SOLO CAJERO):
// - Registrar clientes (una sola vez, validado por identificación única)
// - Actualizar campos y estado
// - CARGA MASIVA desde Excel (.xlsx o .csv)
@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <h3 class="mb-4"><i class="bi bi-person-vcard me-2"></i>Mantenimiento de Clientes</h3>

  <div class="row g-3">
    <!-- Crear cliente -->
    <div class="col-md-4">
      <div class="card p-3">
        <h6>Nuevo cliente</h6>
        <input class="form-control mb-1" placeholder="Nombres" [(ngModel)]="nuevo.name" name="cname">
        <input class="form-control mb-1" placeholder="Apellidos" [(ngModel)]="nuevo.lastname" name="clastname">
        <input class="form-control mb-1" placeholder="Identificación (10-13 dígitos)" [(ngModel)]="nuevo.identification" name="cident">
        <small class="text-danger d-block mb-1" *ngIf="nuevo.identification && !identValida()">Solo números, de 10 a 13 dígitos</small>
        <input class="form-control mb-1" placeholder="Correo" [(ngModel)]="nuevo.email" name="cemail">
        <input class="form-control mb-1" placeholder="Teléfono (09..., mín. 10 dígitos)" [(ngModel)]="nuevo.phonenumber" name="cphone">
        <small class="text-danger d-block mb-1" *ngIf="nuevo.phonenumber && !telValido()">Solo números, mínimo 10 dígitos y empieza con 09</small>
        <textarea class="form-control mb-1" rows="2" placeholder="Dirección (20-100 caracteres)" [(ngModel)]="nuevo.address" name="caddr"></textarea>
        <small class="text-danger d-block mb-1" *ngIf="nuevo.address && !largoValido(nuevo.address)">Debe tener entre 20 y 100 caracteres</small>
        <textarea class="form-control mb-2" rows="2" placeholder="Referencia (20-100 caracteres)" [(ngModel)]="nuevo.referenceaddress" name="cref"></textarea>
        <small class="text-danger d-block mb-1" *ngIf="nuevo.referenceaddress && !largoValido(nuevo.referenceaddress)">Debe tener entre 20 y 100 caracteres</small>
        <button class="btn btn-primary" (click)="crear()"><i class="bi bi-plus-lg me-1"></i>Registrar</button>

        <!-- Carga masiva -->
        <div class="border-top mt-3 pt-3">
          <h6>Carga masiva (.xlsx o .csv)</h6>
          <p class="text-muted small mb-1">Columnas: name, lastname, identification, email, phonenumber, address, referenceaddress</p>
          <input type="file" class="form-control form-control-sm" accept=".xlsx,.csv" (change)="cargarArchivo($event)">
          <div class="small mt-2" *ngIf="resultadoCarga">
            <span class="text-success d-block">Creados: {{ resultadoCarga.creados?.length || 0 }}</span>
            <span class="text-danger d-block" *ngFor="let e of resultadoCarga.errores">Fila {{ e.fila }}: {{ e.mensaje }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de clientes -->
    <div class="col-md-8">
      <div class="card p-3">
        <h6>Clientes registrados</h6>
        <table class="table table-sm align-middle">
          <thead><tr><th>Identificación</th><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let c of clientes">
              <ng-container *ngIf="editando?.clientid !== c.clientid; else filaEdicion">
                <td>{{ c.identification }}</td>
                <td>{{ c.name }} {{ c.lastname }}</td>
                <td>{{ c.phonenumber }}</td>
                <td>{{ c.email }}</td>
                <td><span class="badge" [ngClass]="c.status === 'ACT' ? 'bg-success' : 'bg-secondary'">{{ c.status }}</span></td>
                <td class="text-end" style="min-width:110px">
                  <button class="btn btn-outline-primary btn-sm me-1" title="Editar" (click)="editar(c)"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-outline-danger btn-sm" title="Eliminar" (click)="eliminar(c)"><i class="bi bi-trash"></i></button>
                </td>
              </ng-container>
              <ng-template #filaEdicion>
                <td>{{ c.identification }}</td>
                <td>
                  <input class="form-control form-control-sm mb-1" [(ngModel)]="editando.name" name="ename" placeholder="Nombres">
                  <input class="form-control form-control-sm" [(ngModel)]="editando.lastname" name="elastname" placeholder="Apellidos">
                </td>
                <td><input class="form-control form-control-sm" [(ngModel)]="editando.phonenumber" name="ephone"></td>
                <td><input class="form-control form-control-sm" [(ngModel)]="editando.email" name="eemail"></td>
                <td>
                  <select class="form-select form-select-sm" [(ngModel)]="editando.status" name="estatus">
                    <option value="ACT">ACT</option>
                    <option value="INA">INA</option>
                  </select>
                </td>
                <td class="text-end" style="min-width:110px">
                  <button class="btn btn-primary btn-sm me-1" (click)="guardarEdicion()"><i class="bi bi-check-lg"></i></button>
                  <button class="btn btn-secondary btn-sm" (click)="editando = null"><i class="bi bi-x-lg"></i></button>
                </td>
              </ng-template>
            </tr>
            <tr *ngIf="!clientes.length"><td colspan="6" class="text-muted">Sin clientes registrados</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `
})
export class ClientsComponent implements OnInit {
  clientes: any[] = [];
  nuevo: any = { name: '', lastname: '', identification: '', email: '', phonenumber: '', address: '', referenceaddress: '' };
  editando: any = null;
  resultadoCarga: any = null;

  constructor(private api: ApiService, private msg: MessageService) {}

  ngOnInit() { this.cargar(); }

  cargar() { this.api.getClients().subscribe(c => this.clientes = c); }

  // Validaciones espejo de las del backend (requisitos del PDF)
  identValida() { return /^\d{10,13}$/.test(this.nuevo.identification); }
  telValido() { return /^09\d{8,}$/.test(this.nuevo.phonenumber); }
  largoValido(v: string) { return !!v && v.length >= 20 && v.length <= 100; }

  crear() {
    if (!this.nuevo.name || !this.nuevo.lastname || !this.nuevo.email ||
        !this.identValida() || !this.telValido() ||
        !this.largoValido(this.nuevo.address) || !this.largoValido(this.nuevo.referenceaddress)) {
      this.msg.error('Revise los datos del formulario');
      return;
    }
    this.api.createClient(this.nuevo).subscribe(() => {
      this.msg.success('Cliente registrado correctamente');
      this.nuevo = { name: '', lastname: '', identification: '', email: '', phonenumber: '', address: '', referenceaddress: '' };
      this.cargar();
    });
  }

  editar(c: any) {
    this.editando = {
      clientid: c.clientid, name: c.name, lastname: c.lastname,
      email: c.email, phonenumber: c.phonenumber, status: c.status
    };
  }

  guardarEdicion() {
    this.api.updateClient(this.editando.clientid, this.editando).subscribe(() => {
      this.msg.success('Cliente actualizado');
      this.editando = null;
      this.cargar();
    });
  }

  eliminar(c: any) {
    if (!confirm(`¿Eliminar al cliente ${c.name} ${c.lastname}?`)) return;
    this.api.deleteClient(c.clientid).subscribe(() => { this.msg.success('Cliente eliminado'); this.cargar(); });
  }

  // Carga masiva: lee el .xlsx/.csv en el navegador y envía el lote al backend
  cargarArchivo(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const filas: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false });
      if (!filas.length) { this.msg.error('El archivo está vacío'); return; }
      this.api.bulkClients(filas).subscribe(res => {
        this.resultadoCarga = res;
        this.msg.success(`Carga masiva: ${res.creados?.length || 0} clientes creados`);
        this.cargar();
      });
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  }
}
