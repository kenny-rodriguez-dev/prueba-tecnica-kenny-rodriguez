import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { MessageService } from '../core/ui.services';

// Interfaz de asignación de turnos (GESTOR) + vista/atención de turnos (CAJERO)
// - El gestor asigna cajeros a las cajas (máx 2 por caja)
// - El gestor crea turnos por caja; la descripción (AC0001...) se autogenera
// - El cajero atiende sus turnos (el backend valida que la caja no esté en uso por otro)
@Component({
  selector: 'app-turns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <h3 class="mb-4"><i class="bi bi-ticket-perforated me-2"></i>Turnos</h3>

  <div class="row g-3">
    <!-- Panel del gestor -->
    <div class="col-md-4" *ngIf="auth.hasRole('GESTOR', 'ADMINISTRADOR')">
      <div class="card p-3 mb-3">
        <h6>Asignar cajero a caja <small class="text-muted">(máx. 2 por caja)</small></h6>
        <select class="form-select mb-1" [(ngModel)]="asignacion.cashid" name="acash">
          <option [ngValue]="null">-- Caja --</option>
          <option *ngFor="let c of cajas" [ngValue]="c.cashid">{{ c.cashdescription }}</option>
        </select>
        <select class="form-select mb-2" [(ngModel)]="asignacion.userid" name="auser">
          <option [ngValue]="null">-- Cajero --</option>
          <option *ngFor="let u of cajeros" [ngValue]="u.userid">{{ u.username }}</option>
        </select>
        <button class="btn btn-outline-primary" (click)="asignar()"><i class="bi bi-link-45deg me-1"></i>Asignar</button>

        <div class="mt-3 small">
          <div *ngFor="let c of cajas" class="mb-1">
            <b>{{ c.cashdescription }}:</b>
            <span *ngFor="let u of c.Users; let last = last"> {{ u.username }}<span *ngIf="!last">,</span></span>
            <span class="text-muted" *ngIf="!c.Users?.length"> sin cajeros</span>
          </div>
        </div>
      </div>

      <div class="card p-3">
        <h6>Nuevo turno</h6>
        <select class="form-select mb-1" [(ngModel)]="nuevo.cash_cashid" name="tcash">
          <option [ngValue]="null">-- Caja --</option>
          <option *ngFor="let c of cajas" [ngValue]="c.cashid">{{ c.cashdescription }}</option>
        </select>
        <select class="form-select mb-1" [(ngModel)]="nuevo.cajero_userid" name="tcajero">
          <option [ngValue]="null">-- Cajero --</option>
          <option *ngFor="let u of cajeros" [ngValue]="u.userid">{{ u.username }}</option>
        </select>
        <select class="form-select mb-2" [(ngModel)]="nuevo.attentiontypeid" name="ttipo">
          <option [ngValue]="null">-- Tipo de atención --</option>
          <option *ngFor="let t of tipos" [ngValue]="t.attentiontypeid">{{ t.attentiontypeid }} - {{ t.description }}</option>
        </select>
        <button class="btn btn-primary" (click)="crearTurno()"><i class="bi bi-plus-lg me-1"></i>Crear turno</button>
      </div>
    </div>

    <!-- Lista de turnos de hoy -->
    <div class="col" [class.col-md-8]="auth.hasRole('GESTOR', 'ADMINISTRADOR')">
      <div class="card p-3">
        <h6>Turnos de hoy</h6>
        <table class="table table-sm align-middle">
          <thead><tr><th>Turno</th><th>Caja</th><th>Cajero</th><th>Gestor</th><th>Tipo</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let t of turnos">
              <td><b>{{ t.description }}</b></td>
              <td>{{ t.Cash?.cashdescription }}</td>
              <td>{{ t.cajero?.username }}</td>
              <td>{{ t.gestor?.username }}</td>
              <td>{{ t.AttentionType?.description }}</td>
              <td>
                <span class="badge"
                      [ngClass]="{ 'bg-warning text-dark': t.status === 'PEN', 'bg-success': t.status === 'ATE', 'bg-secondary': t.status === 'CAN' }">
                  {{ t.status }}
                </span>
              </td>
              <td class="text-end">
                <button class="btn btn-success btn-sm me-1"
                        *ngIf="t.status === 'PEN' && auth.hasRole('CAJERO') && t.cajero_userid === auth.user()?.userid"
                        (click)="atender(t)">
                  <i class="bi bi-check2-circle me-1"></i>Atender
                </button>
                <button class="btn btn-outline-danger btn-sm"
                        *ngIf="auth.hasRole('GESTOR', 'ADMINISTRADOR')" title="Eliminar"
                        (click)="eliminar(t)"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
            <tr *ngIf="!turnos.length"><td colspan="7" class="text-muted">No hay turnos hoy</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `
})
export class TurnsComponent implements OnInit {
  turnos: any[] = [];
  cajas: any[] = [];
  cajeros: any[] = [];
  tipos: any[] = [];
  asignacion: any = { cashid: null, userid: null };
  nuevo: any = { cash_cashid: null, cajero_userid: null, attentiontypeid: null };

  constructor(private api: ApiService, public auth: AuthService, private msg: MessageService) {}

  ngOnInit() {
    this.cargarTurnos();
    this.api.getCashes().subscribe(c => this.cajas = c);
    if (this.auth.hasRole('GESTOR', 'ADMINISTRADOR')) {
      this.api.getCajeros().subscribe(u => this.cajeros = u);
      this.api.getAttentionTypes().subscribe(t => this.tipos = t);
    }
  }

  cargarTurnos() { this.api.getTurns({ hoy: true }).subscribe(t => this.turnos = t); }

  asignar() {
    if (!this.asignacion.cashid || !this.asignacion.userid) { this.msg.error('Seleccione caja y cajero'); return; }
    this.api.assignCajero(this.asignacion.cashid, this.asignacion.userid).subscribe(() => {
      this.msg.success('Cajero asignado a la caja');
      this.api.getCashes().subscribe(c => this.cajas = c);
    });
  }

  crearTurno() {
    if (!this.nuevo.cash_cashid || !this.nuevo.cajero_userid || !this.nuevo.attentiontypeid) {
      this.msg.error('Complete caja, cajero y tipo de atención');
      return;
    }
    this.api.createTurn(this.nuevo).subscribe(t => {
      this.msg.success(`Turno ${t.description} creado`);
      this.cargarTurnos();
    });
  }

  atender(t: any) {
    this.api.attendTurn(t.turnid).subscribe(() => {
      this.msg.success(`Turno ${t.description} atendido`);
      this.cargarTurnos();
    });
  }

  eliminar(t: any) {
    if (!confirm(`¿Eliminar el turno ${t.description}?`)) return;
    this.api.deleteTurn(t.turnid).subscribe(() => { this.msg.success('Turno eliminado'); this.cargarTurnos(); });
  }
}
