import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';

// Interfaz de bienvenida (requisitos del PDF):
// - Datos del usuario (TODOS)
// - Total de turnos atendidos hoy (cajero: propios, gestor: los que asignó, admin: total)
// - Para el GESTOR: usuarios creados pendientes de aprobación
@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
  <h3 class="mb-4"><i class="bi bi-house me-2"></i>Bienvenido, {{ auth.user()?.username }}</h3>

  <div class="row g-3 mb-4">
    <div class="col-md-4">
      <div class="card p-3">
        <h6 class="text-muted">Tus datos</h6>
        <div><i class="bi bi-person me-2"></i><b>Usuario:</b> {{ auth.user()?.username }}</div>
        <div><i class="bi bi-envelope me-2"></i><b>Correo:</b> {{ auth.user()?.email }}</div>
        <div><i class="bi bi-shield-check me-2"></i><b>Rol:</b> {{ auth.user()?.rolname }}</div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="card p-3 text-center">
        <h6 class="text-muted">Turnos atendidos hoy</h6>
        <div class="display-4 text-primary">{{ stats?.totalAtendidosHoy ?? 0 }}</div>
        <small class="text-muted" [ngSwitch]="auth.user()?.rolname">
          <span *ngSwitchCase="'CAJERO'">Atendidos por ti</span>
          <span *ngSwitchCase="'GESTOR'">De los turnos que asignaste</span>
          <span *ngSwitchDefault>Total del sistema</span>
        </small>
      </div>
    </div>
  </div>

  <!-- Solo GESTOR: usuarios pendientes de aprobación -->
  <div class="card p-3" *ngIf="auth.hasRole('GESTOR')">
    <h6><i class="bi bi-hourglass-split me-2"></i>Usuarios creados pendientes de aprobación</h6>
    <p class="text-muted small mb-2">Un administrador debe aprobarlos para que puedan iniciar sesión.</p>
    <table class="table table-sm mb-0" *ngIf="pendientes.length; else sinPendientes">
      <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead>
      <tbody>
        <tr *ngFor="let u of pendientes">
          <td>{{ u.username }}</td>
          <td>{{ u.email }}</td>
          <td>{{ u.Rol?.rolname }}</td>
          <td><span class="badge bg-warning text-dark">PENDIENTE</span></td>
        </tr>
      </tbody>
    </table>
    <ng-template #sinPendientes><span class="text-muted">No hay usuarios pendientes.</span></ng-template>
  </div>
  `
})
export class WelcomeComponent implements OnInit {
  stats: any = null;
  pendientes: any[] = [];

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit() {
    this.api.getTurnStats().subscribe(s => this.stats = s);
    if (this.auth.hasRole('GESTOR')) {
      this.api.getPendingUsers().subscribe(p => this.pendientes = p);
    }
  }
}
