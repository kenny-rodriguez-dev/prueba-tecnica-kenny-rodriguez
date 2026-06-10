import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';

// Dashboard (SOLO ADMINISTRADOR):
// - Indicadores de usuarios (sesión activa/inactiva, bloqueados...)
// - Indicadores de cajas, cajeros y gestores con filtros de fecha
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <h3 class="mb-4"><i class="bi bi-bar-chart me-2"></i>Dashboard</h3>

  <!-- Indicadores de usuarios -->
  <h6 class="text-muted">Indicadores de usuarios</h6>
  <div class="row g-3 mb-4" *ngIf="usuarios">
    <div class="col-6 col-md-2" *ngFor="let c of cards">
      <div class="card p-3 text-center">
        <i class="bi {{ c.icon }} fs-4 {{ c.color }}"></i>
        <div class="fs-3">{{ usuarios[c.key] }}</div>
        <small class="text-muted">{{ c.label }}</small>
      </div>
    </div>
  </div>

  <!-- Resumen con filtros de fecha -->
  <div class="card p-3">
    <div class="d-flex flex-wrap align-items-end gap-2 mb-3">
      <h6 class="text-muted me-auto mb-0">Cajas, cajeros y gestores</h6>
      <div>
        <label class="form-label small mb-0">Desde</label>
        <input type="date" class="form-control form-control-sm" [(ngModel)]="from" name="from">
      </div>
      <div>
        <label class="form-label small mb-0">Hasta</label>
        <input type="date" class="form-control form-control-sm" [(ngModel)]="to" name="to">
      </div>
      <button class="btn btn-primary btn-sm" (click)="cargarResumen()"><i class="bi bi-funnel me-1"></i>Filtrar</button>
    </div>

    <div class="row g-3" *ngIf="resumen">
      <div class="col-12">
        <span class="badge bg-primary me-2">Total turnos: {{ resumen.totalTurnos }}</span>
        <span class="badge bg-success">Atendidos: {{ resumen.totalAtendidos }}</span>
      </div>
      <div class="col-md-4" *ngFor="let g of grupos">
        <h6>{{ g.titulo }}</h6>
        <table class="table table-sm">
          <thead><tr><th>{{ g.col }}</th><th>Turnos</th><th>Atendidos</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of resumen[g.key]">
              <td>{{ r.nombre }}</td><td>{{ r.total }}</td><td>{{ r.atendidos }}</td>
            </tr>
            <tr *ngIf="!resumen[g.key].length"><td colspan="3" class="text-muted">Sin datos en el rango</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `
})
export class DashboardComponent implements OnInit {
  usuarios: any = null;
  resumen: any = null;
  from = '';
  to = '';

  cards = [
    { key: 'total', label: 'Total', icon: 'bi-people', color: 'text-primary' },
    { key: 'sesionActiva', label: 'Sesión activa', icon: 'bi-person-check', color: 'text-success' },
    { key: 'sesionInactiva', label: 'Sesión inactiva', icon: 'bi-person-dash', color: 'text-secondary' },
    { key: 'bloqueados', label: 'Bloqueados', icon: 'bi-person-lock', color: 'text-danger' },
    { key: 'activos', label: 'Activos', icon: 'bi-check-circle', color: 'text-success' },
    { key: 'pendientesAprobacion', label: 'Pendientes', icon: 'bi-hourglass-split', color: 'text-warning' }
  ];

  grupos = [
    { key: 'porCaja', titulo: 'Por caja', col: 'Caja' },
    { key: 'porCajero', titulo: 'Por cajero', col: 'Cajero' },
    { key: 'porGestor', titulo: 'Por gestor', col: 'Gestor' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getDashboardUsers().subscribe(d => this.usuarios = d);
    this.cargarResumen();
  }

  cargarResumen() {
    const params: any = {};
    if (this.from) params.from = this.from;
    if (this.to) params.to = this.to;
    this.api.getDashboardSummary(params).subscribe(r => this.resumen = r);
  }
}
