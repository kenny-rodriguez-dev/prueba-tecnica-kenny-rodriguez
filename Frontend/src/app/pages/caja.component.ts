import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { MessageService } from '../core/ui.services';

// Interfaz para PROCESOS DE CAJA (SOLO CAJERO) - requisitos del PDF:
// - Abrir/cerrar caja (2 usuarios no pueden operar la misma caja a la vez)
// - Buscar cliente por identificación
// - Contratar un servicio (datos del cliente + tipo de servicio + forma de pago)
// - Pagos
// - Cambio del servicio contratado (usa la función SQL en el backend)
// - Cambio de forma de pago
// - Cancelación del contrato
@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <h3 class="mb-4"><i class="bi bi-cash-coin me-2"></i>Procesos de Caja</h3>

  <!-- Apertura / cierre de caja -->
  <div class="card p-3 mb-3">
    <h6>Mi caja</h6>
    <p class="text-muted small mb-2">Cada caja la manejan máximo 2 usuarios y no pueden operarla al mismo tiempo.</p>
    <div class="d-flex flex-wrap gap-2">
      <div *ngFor="let c of cajas" class="border rounded p-2 d-flex align-items-center gap-2">
        <b>{{ c.cashdescription }}</b>
        <span class="badge" [ngClass]="c.inuse_userid ? 'bg-danger' : 'bg-success'">
          {{ c.inuse_userid ? 'En uso' : 'Libre' }}
        </span>
        <button class="btn btn-sm btn-outline-success" (click)="abrir(c)">Abrir</button>
        <button class="btn btn-sm btn-outline-secondary" (click)="cerrar(c)">Cerrar</button>
      </div>
    </div>
  </div>

  <!-- Buscar cliente -->
  <div class="card p-3 mb-3">
    <h6>Buscar cliente por identificación</h6>
    <div class="d-flex gap-2">
      <input class="form-control" style="max-width:280px" placeholder="Ej: 0912345678"
             [(ngModel)]="identificacion" name="ident" (keyup.enter)="buscar()">
      <button class="btn btn-primary" (click)="buscar()"><i class="bi bi-search me-1"></i>Buscar</button>
    </div>
    <div class="mt-2" *ngIf="cliente">
      <span class="badge bg-primary me-2">{{ cliente.name }} {{ cliente.lastname }}</span>
      <small class="text-muted">{{ cliente.email }} · {{ cliente.phonenumber }}</small>
    </div>
  </div>

  <div class="row g-3" *ngIf="cliente">
    <!-- Contratar servicio -->
    <div class="col-md-4">
      <div class="card p-3">
        <h6>Contratar servicio de internet</h6>
        <select class="form-select mb-1" [(ngModel)]="contrato.service_serviceid" name="cserv">
          <option [ngValue]="null">-- Servicio --</option>
          <option *ngFor="let s of servicios" [ngValue]="s.serviceid">
            {{ s.servicename }} ({{ s.speed }} Mbps - \${{ s.price }})
          </option>
        </select>
        <select class="form-select mb-1" [(ngModel)]="contrato.methodpayment_methodpaymentid" name="cpago">
          <option [ngValue]="null">-- Forma de pago --</option>
          <option *ngFor="let m of formasPago" [ngValue]="m.methodpaymentid">{{ m.description }}</option>
        </select>
        <input type="number" class="form-control mb-2" placeholder="Meses (12 por defecto)" [(ngModel)]="contrato.months" name="cmeses">
        <button class="btn btn-primary" (click)="contratar()"><i class="bi bi-file-earmark-plus me-1"></i>Contratar</button>
      </div>
    </div>

    <!-- Contratos del cliente -->
    <div class="col-md-8">
      <div class="card p-3">
        <h6>Contratos del cliente</h6>
        <table class="table table-sm align-middle">
          <thead><tr><th>#</th><th>Servicio</th><th>Estado</th><th>Pago</th><th>Fin</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let c of contratos">
              <td>{{ c.contractid }}</td>
              <td>{{ c.Service?.servicename }} <small class="text-muted">({{ c.Service?.speed }} Mbps)</small></td>
              <td><span class="badge" [ngClass]="badge(c.statuscontract_statusid)">{{ c.StatusContract?.description }}</span></td>
              <td>{{ c.MethodPayment?.description }}</td>
              <td><small>{{ c.enddate | date:'dd/MM/yyyy' }}</small></td>
              <td class="text-end">
                <button class="btn btn-outline-primary btn-sm" (click)="seleccionar(c)">Gestionar</button>
              </td>
            </tr>
            <tr *ngIf="!contratos.length"><td colspan="6" class="text-muted">El cliente no tiene contratos</td></tr>
          </tbody>
        </table>

        <!-- Panel de gestión del contrato seleccionado -->
        <div class="border rounded p-3 mt-2" *ngIf="seleccionado">
          <h6 class="mb-3">Gestionar contrato #{{ seleccionado.contractid }} - {{ seleccionado.Service?.servicename }}</h6>
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label small">Registrar pago</label>
              <input type="number" class="form-control form-control-sm mb-1" placeholder="Monto" [(ngModel)]="montoPago" name="monto">
              <button class="btn btn-success btn-sm w-100" (click)="pagar()"><i class="bi bi-cash me-1"></i>Pagar</button>
            </div>
            <div class="col-md-4">
              <label class="form-label small">Cambio de servicio <i class="bi bi-info-circle" title="VIG pasa a SUS y se crea uno nuevo en REN con la misma fecha fin"></i></label>
              <select class="form-select form-select-sm mb-1" [(ngModel)]="nuevoServicio" name="nserv">
                <option [ngValue]="null">-- Nuevo servicio --</option>
                <option *ngFor="let s of servicios" [ngValue]="s.serviceid">{{ s.servicename }} ({{ s.speed }} Mbps)</option>
              </select>
              <button class="btn btn-warning btn-sm w-100" (click)="cambiarServicio()"><i class="bi bi-arrow-repeat me-1"></i>Cambiar servicio</button>
            </div>
            <div class="col-md-4">
              <label class="form-label small">Cambio de forma de pago</label>
              <select class="form-select form-select-sm mb-1" [(ngModel)]="nuevaFormaPago" name="npago">
                <option [ngValue]="null">-- Forma de pago --</option>
                <option *ngFor="let m of formasPago" [ngValue]="m.methodpaymentid">{{ m.description }}</option>
              </select>
              <button class="btn btn-info btn-sm w-100 mb-2" (click)="cambiarFormaPago()"><i class="bi bi-credit-card me-1"></i>Cambiar pago</button>
              <button class="btn btn-outline-danger btn-sm w-100" (click)="cancelarContrato()"><i class="bi bi-x-circle me-1"></i>Cancelar contrato</button>
            </div>
          </div>
        </div>

        <!-- Pagos del cliente -->
        <div class="mt-3" *ngIf="pagos.length">
          <h6>Pagos registrados</h6>
          <table class="table table-sm">
            <thead><tr><th>#</th><th>Fecha</th><th>Contrato</th><th>Monto</th></tr></thead>
            <tbody>
              <tr *ngFor="let p of pagos">
                <td>{{ p.paymentid }}</td>
                <td>{{ p.paymentdate | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ p.contract_contractid || '-' }}</td>
                <td>\${{ p.amount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  `
})
export class CajaComponent implements OnInit {
  cajas: any[] = [];
  servicios: any[] = [];
  formasPago: any[] = [];

  identificacion = '';
  cliente: any = null;
  contratos: any[] = [];
  pagos: any[] = [];

  contrato: any = { service_serviceid: null, methodpayment_methodpaymentid: null, months: null };
  seleccionado: any = null;
  montoPago: any = null;
  nuevoServicio: any = null;
  nuevaFormaPago: any = null;

  constructor(private api: ApiService, private msg: MessageService) {}

  ngOnInit() {
    this.cargarCajas();
    this.api.getServices().subscribe(s => this.servicios = s);
    this.api.getMethodPayments().subscribe(m => this.formasPago = m);
  }

  cargarCajas() { this.api.getCashes().subscribe(c => this.cajas = c); }
  abrir(c: any) { this.api.openCash(c.cashid).subscribe(r => { this.msg.success(r.message); this.cargarCajas(); }); }
  cerrar(c: any) { this.api.closeCash(c.cashid).subscribe(r => { this.msg.success(r.message); this.cargarCajas(); }); }

  buscar() {
    if (!/^\d{10,13}$/.test(this.identificacion)) { this.msg.error('La identificación debe tener de 10 a 13 dígitos'); return; }
    this.api.getClients({ identification: this.identificacion }).subscribe(c => {
      this.cliente = c;
      this.seleccionado = null;
      this.cargarContratos();
    });
  }

  cargarContratos() {
    if (!this.cliente) return;
    this.api.getContracts({ clientid: this.cliente.clientid }).subscribe(c => this.contratos = c);
    this.api.getPayments({ clientid: this.cliente.clientid }).subscribe(p => this.pagos = p);
  }

  contratar() {
    if (!this.contrato.service_serviceid || !this.contrato.methodpayment_methodpaymentid) {
      this.msg.error('Seleccione el servicio y la forma de pago');
      return;
    }
    const data: any = { ...this.contrato, client_clientid: this.cliente.clientid };
    if (!data.months) delete data.months;
    this.api.createContract(data).subscribe(() => {
      this.msg.success('Servicio contratado correctamente');
      this.contrato = { service_serviceid: null, methodpayment_methodpaymentid: null, months: null };
      this.cargarContratos();
    });
  }

  seleccionar(c: any) {
    this.seleccionado = c;
    this.montoPago = c.Service ? Number(c.Service.price) : null;
    this.nuevoServicio = null;
    this.nuevaFormaPago = null;
  }

  pagar() {
    if (!this.montoPago || this.montoPago <= 0) { this.msg.error('Ingrese un monto válido'); return; }
    this.api.createPayment({
      client_clientid: this.cliente.clientid,
      contract_contractid: this.seleccionado.contractid,
      amount: this.montoPago
    }).subscribe(() => { this.msg.success('Pago registrado'); this.cargarContratos(); });
  }

  cambiarServicio() {
    if (!this.nuevoServicio) { this.msg.error('Seleccione el nuevo servicio'); return; }
    this.api.changeService(this.seleccionado.contractid, this.nuevoServicio).subscribe(() => {
      this.msg.success('Servicio cambiado: contrato sustituido y renovación creada');
      this.seleccionado = null;
      this.cargarContratos();
    });
  }

  cambiarFormaPago() {
    if (!this.nuevaFormaPago) { this.msg.error('Seleccione la forma de pago'); return; }
    this.api.changePaymentMethod(this.seleccionado.contractid, this.nuevaFormaPago).subscribe(() => {
      this.msg.success('Forma de pago actualizada');
      this.cargarContratos();
    });
  }

  cancelarContrato() {
    if (!confirm('¿Cancelar este contrato? Se actualizará el estado y la fecha fin.')) return;
    this.api.cancelContract(this.seleccionado.contractid).subscribe(() => {
      this.msg.success('Contrato cancelado');
      this.seleccionado = null;
      this.cargarContratos();
    });
  }

  badge(s: string) {
    return { 'bg-success': s === 'VIG', 'bg-secondary': s === 'SUS', 'bg-info': s === 'REN', 'bg-danger': s === 'CAN' };
  }
}
