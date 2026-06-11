import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { LoadingService, MessageService } from '../core/ui.services';

// Layout principal: sidebar con el MENÚ CARGADO DESDE LA BASE DE DATOS SEGÚN EL ROL
// Responsivo: en pantallas pequeñas el menú se oculta; el botón ☰ lo abre
// y desaparece mientras el menú está abierto (se cierra con la ✕, tocando fuera o al navegar)
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <!-- Botón de menú: solo en pantallas pequeñas y solo cuando el menú está cerrado -->
  <button class="btn btn-dark d-md-none hamburger" *ngIf="!sidebarAbierto"
          (click)="sidebarAbierto = true" aria-label="Abrir menú">
    <i class="bi bi-list fs-4"></i>
  </button>

  <div class="d-flex">
    <!-- Sidebar -->
    <aside class="sidebar p-3 d-flex flex-column" [class.open]="sidebarAbierto">
      <div class="d-flex align-items-start justify-content-between mb-3">
        <div>
          <h5 class="text-white mb-1"><i class="bi bi-router me-2"></i>NetCaja</h5>
          <small class="text-secondary">Sistema de Gestión de Caja</small>
        </div>
        <!-- Cerrar (solo móvil) -->
        <button class="btn btn-link text-secondary p-0 d-md-none" (click)="sidebarAbierto = false" aria-label="Cerrar menú">
          <i class="bi bi-x-lg fs-5"></i>
        </button>
      </div>

      <nav class="flex-grow-1">
        <a *ngFor="let item of menu" [routerLink]="item.route" routerLinkActive="active"
           class="mb-1" (click)="sidebarAbierto = false">
          <i class="bi {{ item.icon }} me-2"></i>{{ item.label }}
        </a>
      </nav>

      <div class="border-top border-secondary pt-3">
        <div class="text-white small">{{ auth.user()?.username }}</div>
        <div class="text-secondary small mb-2">{{ auth.user()?.rolname }}</div>
        <button class="btn btn-outline-light btn-sm w-100" (click)="salir()">
          <i class="bi bi-box-arrow-right me-1"></i>Cerrar sesión
        </button>
      </div>
    </aside>

    <!-- Fondo oscuro al abrir el menú en pantallas pequeñas -->
    <div class="sidebar-backdrop d-md-none" *ngIf="sidebarAbierto" (click)="sidebarAbierto = false"></div>

    <!-- Contenido -->
    <main class="flex-grow-1 p-3 p-md-4 main-content" style="min-height:100vh">
      <router-outlet></router-outlet>
    </main>
  </div>

  <!-- Loading global (requisito del PDF) -->
  <div class="loading-overlay" *ngIf="loading.visible()">
    <div class="spinner-border text-primary" style="width:3rem;height:3rem"></div>
  </div>

  <!-- Mensajes de éxito / error (requisito del PDF) -->
  <div class="app-toast" *ngIf="msg.message() as m">
    <div class="alert alert-{{ m.type }} alert-dismissible shadow mb-0">
      {{ m.text }}
      <button type="button" class="btn-close" (click)="msg.clear()"></button>
    </div>
  </div>
  `
})
export class LayoutComponent implements OnInit {
  menu: any[] = [];
  sidebarAbierto = false;

  constructor(
    private api: ApiService,
    private router: Router,
    public auth: AuthService,
    public loading: LoadingService,
    public msg: MessageService
  ) {}

  ngOnInit() {
    // El menú se obtiene del backend, que lo lee de la BD según el rol del JWT
    this.api.getMenu().subscribe(data => this.menu = data);
  }

  salir() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
