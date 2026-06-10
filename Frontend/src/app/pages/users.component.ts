import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { MessageService } from '../core/ui.services';

// Interfaz de usuario Administrador (y creación para Gestor):
// - Crear usuarios (gestor crea pendientes de aprobación)
// - Actualizar campos y estado
// - Aprobar usuarios pendientes (admin)
// - CARGA MASIVA desde Excel (.xlsx o .csv) con la librería SheetJS
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <h3 class="mb-4"><i class="bi bi-people me-2"></i>Gestión de Usuarios</h3>

  <div class="row g-3">
    <!-- Crear usuario -->
    <div class="col-md-4">
      <div class="card p-3">
        <h6>Nuevo usuario</h6>
        <p class="text-muted small" *ngIf="auth.hasRole('GESTOR')">
          Los usuarios que crees quedarán <b>pendientes de aprobación</b> por un administrador.
        </p>
        <input class="form-control mb-1" placeholder="Usuario (8-20, letras y un número)" [(ngModel)]="nuevo.username" name="nusername">
        <small class="text-danger d-block mb-1" *ngIf="nuevo.username && !usernameValido()">8 a 20 caracteres, letras y al menos un número, sin especiales</small>
        <input class="form-control mb-1" placeholder="Correo" [(ngModel)]="nuevo.email" name="nemail">
        <input type="password" class="form-control mb-1" placeholder="Contraseña" [(ngModel)]="nuevo.password" name="npassword">
        <small class="text-danger d-block mb-1" *ngIf="nuevo.password && !passValida()">Mín. 8, máx. 30, una mayúscula y un número</small>
        <select class="form-select mb-2" [(ngModel)]="nuevo.rol_rolid" name="nrol">
          <option [ngValue]="null">-- Rol --</option>
          <option *ngFor="let r of roles" [ngValue]="r.rolid">{{ r.rolname }}</option>
        </select>
        <button class="btn btn-primary" (click)="crear()"><i class="bi bi-plus-lg me-1"></i>Crear</button>

        <!-- Carga masiva (solo admin) -->
        <div class="border-top mt-3 pt-3" *ngIf="auth.hasRole('ADMINISTRADOR')">
          <h6>Carga masiva (.xlsx o .csv)</h6>
          <p class="text-muted small mb-1">Columnas: username, email, password, rol_rolid (2=GESTOR, 3=CAJERO)</p>
          <input type="file" class="form-control form-control-sm" accept=".xlsx,.csv" (change)="cargarArchivo($event)">
          <div class="small mt-2" *ngIf="resultadoCarga">
            <span class="text-success d-block">Creados: {{ resultadoCarga.creados?.length || 0 }}</span>
            <span class="text-danger d-block" *ngFor="let e of resultadoCarga.errores">Fila {{ e.fila }}: {{ e.mensaje }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de usuarios -->
    <div class="col-md-8">
      <div class="card p-3">
        <div class="d-flex align-items-center mb-2">
          <h6 class="me-auto mb-0">Usuarios</h6>
          <select class="form-select form-select-sm w-auto" [(ngModel)]="filtroEstado" name="festado" (change)="cargar()">
            <option value="">Todos los estados</option>
            <option *ngFor="let s of estados" [value]="s.statusid">{{ s.description }}</option>
          </select>
        </div>
        <table class="table table-sm align-middle">
          <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let u of usuarios">
              <ng-container *ngIf="editando?.userid !== u.userid; else filaEdicion">
                <td>{{ u.username }}</td>
                <td>{{ u.email }}</td>
                <td>{{ u.Rol?.rolname }}</td>
                <td><span class="badge" [ngClass]="badge(u.userstatus_statusid)">{{ u.UserStatus?.description }}</span></td>
                <td class="text-end" style="min-width:160px">
                  <button class="btn btn-success btn-sm me-1" *ngIf="u.userstatus_statusid === 'PEN' && auth.hasRole('ADMINISTRADOR')"
                          title="Aprobar" (click)="aprobar(u)"><i class="bi bi-check-lg"></i></button>
                  <button class="btn btn-outline-primary btn-sm me-1" *ngIf="auth.hasRole('ADMINISTRADOR')"
                          title="Editar" (click)="editar(u)"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-outline-danger btn-sm" *ngIf="auth.hasRole('ADMINISTRADOR')"
                          title="Eliminar" (click)="eliminar(u)"><i class="bi bi-trash"></i></button>
                </td>
              </ng-container>
              <ng-template #filaEdicion>
                <td>{{ u.username }}</td>
                <td><input class="form-control form-control-sm" [(ngModel)]="editando.email" name="eemail"></td>
                <td>{{ u.Rol?.rolname }}</td>
                <td>
                  <select class="form-select form-select-sm" [(ngModel)]="editando.userstatus_statusid" name="eestado">
                    <option *ngFor="let s of estados" [value]="s.statusid">{{ s.description }}</option>
                  </select>
                </td>
                <td class="text-end" style="min-width:160px">
                  <button class="btn btn-primary btn-sm me-1" (click)="guardarEdicion()"><i class="bi bi-check-lg"></i></button>
                  <button class="btn btn-secondary btn-sm" (click)="editando = null"><i class="bi bi-x-lg"></i></button>
                </td>
              </ng-template>
            </tr>
            <tr *ngIf="!usuarios.length"><td colspan="5" class="text-muted">Sin usuarios</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `
})
export class UsersComponent implements OnInit {
  usuarios: any[] = [];
  roles: any[] = [];
  estados: any[] = [];
  filtroEstado = '';
  nuevo: any = { username: '', email: '', password: '', rol_rolid: null };
  editando: any = null;
  resultadoCarga: any = null;

  constructor(private api: ApiService, public auth: AuthService, private msg: MessageService) {}

  ngOnInit() {
    // Solo se pueden crear GESTORES (2) y CAJEROS (3)
    this.api.getRoles().subscribe(r => this.roles = r.filter(x => x.rolid !== 1));
    this.api.getUserStatuses().subscribe(s => this.estados = s);
    this.cargar();
  }

  cargar() {
    const params: any = {};
    if (this.filtroEstado) params.status = this.filtroEstado;
    this.api.getUsers(params).subscribe(u => this.usuarios = u);
  }

  usernameValido() { return /^[A-Za-z0-9]{8,20}$/.test(this.nuevo.username) && /[A-Za-z]/.test(this.nuevo.username) && /\d/.test(this.nuevo.username); }
  passValida() { return /^(?=.*\d)(?=.*[A-Z]).{8,30}$/.test(this.nuevo.password); }

  crear() {
    if (!this.usernameValido() || !this.passValida() || !this.nuevo.email || !this.nuevo.rol_rolid) {
      this.msg.error('Revise los datos del formulario');
      return;
    }
    this.api.createUser(this.nuevo).subscribe(() => {
      this.msg.success(this.auth.hasRole('GESTOR') ? 'Usuario creado, pendiente de aprobación' : 'Usuario creado correctamente');
      this.nuevo = { username: '', email: '', password: '', rol_rolid: null };
      this.cargar();
    });
  }

  aprobar(u: any) {
    this.api.approveUser(u.userid).subscribe(() => { this.msg.success('Usuario aprobado'); this.cargar(); });
  }

  editar(u: any) {
    this.editando = { userid: u.userid, email: u.email, userstatus_statusid: u.userstatus_statusid };
  }

  guardarEdicion() {
    this.api.updateUser(this.editando.userid, this.editando).subscribe(() => {
      this.msg.success('Usuario actualizado');
      this.editando = null;
      this.cargar();
    });
  }

  eliminar(u: any) {
    if (!confirm(`¿Eliminar al usuario ${u.username}?`)) return;
    this.api.deleteUser(u.userid).subscribe(() => { this.msg.success('Usuario eliminado'); this.cargar(); });
  }

  badge(s: string) {
    return { 'bg-success': s === 'ACT', 'bg-secondary': s === 'INA', 'bg-danger': s === 'BLO', 'bg-warning text-dark': s === 'PEN' };
  }

  // Carga masiva: lee el .xlsx/.csv en el navegador y envía el lote al backend
  cargarArchivo(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const filas: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if (!filas.length) { this.msg.error('El archivo está vacío'); return; }
      this.api.bulkUsers(filas).subscribe(res => {
        this.resultadoCarga = res;
        this.msg.success(`Carga masiva: ${res.creados?.length || 0} usuarios creados`);
        this.cargar();
      });
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  }
}
