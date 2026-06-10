# Sistema de Gestión de Caja — Prueba Técnica Viamatica

Solución full stack para la gestión de caja de una empresa de servicios de internet.

| Capa | Tecnología |
|---|---|
| Backend | Node.js 22 + Express + **Sequelize (ORM)** + JWT + Swagger |
| Base de datos | PostgreSQL 16 (+ función `fn_cambiar_servicio` en PL/pgSQL) |
| Frontend | Angular (standalone components, lazy loading) + Bootstrap 5 |
| Despliegue | Docker / Docker Compose |

**Estructura del repositorio**

```
prueba-tecnica-kenny-rodriguez/
├── Backend/              → API REST (incluye sql/, postman/ y datos-ejemplo/)
├── Frontend/             → Aplicación Angular
├── docker-compose.yml    → Orquesta BD + Backend + Frontend
├── README.md
└── .gitignore
```

**Arquitectura del backend: Onion (cebolla)**

```
Backend/src/
├── domain/          → Entidades del negocio (modelos Sequelize)
├── application/     → Lógica de negocio y validaciones (servicios)
├── infrastructure/  → Acceso a datos: seed + función SQL
├── interfaces/      → Rutas HTTP y middlewares (JWT, roles)
└── config/          → Conexión a BD y especificación Swagger
```

---

## Requisitos

- Node.js LTS (v20+) y npm
- Angular CLI (`npm install -g @angular/cli`)
- PostgreSQL 16 **o** Docker Desktop
- Postman (para importar la colección)

---

## Opción A — Ejecutar en local (desarrollo)

### 1. Base de datos

Crear una base llamada `cajadb` en PostgreSQL (con pgAdmin: clic derecho en
*Databases → Create → Database*). Usuario/clave por defecto: `postgres / postgres123`
(se pueden cambiar en `Backend/.env`).

> No hay que crear tablas ni datos: el backend crea todo al arrancar
> (tablas vía ORM, función SQL y datos iniciales vía seed).

### 2. Backend

```bash
cd Backend
npm install
npm run dev
```

- API: http://localhost:3000
- **Swagger: http://localhost:3000/api-docs**

### 3. Frontend

El frontend se genera con tu CLI y se le copia el código de `frontend-src/`.
**Sigue los pasos de [`frontend-src/PASOS.md`](frontend-src/PASOS.md)** (5-10 min). Resumen:

```bash
cd Frontend
ng new frontend --directory=. --style=css --ssr=false --skip-git   # responder "No" a zoneless
# PowerShell:
Copy-Item -Recurse -Force ..\frontend-src\* .
npm install xlsx
ng serve
```

- App: http://localhost:4200

## Opción B — Ejecutar con Docker (entrega)

Con el frontend ya armado (Opción A, paso 3), desde la raíz del repo:

```bash
docker compose up --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:4200 |
| API + Swagger | http://localhost:3000/api-docs |
| PostgreSQL | localhost:5432 (cajadb / postgres / postgres123) |

---

## Usuarios de demostración

| Rol | Usuario | Contraseña |
|---|---|---|
| ADMINISTRADOR | `admin1234` | `Admin1234` |
| GESTOR | `gestor123` | `Gestor123` |
| CAJERO | `cajero123` | `Cajero123` |

El cajero demo ya está asignado a la **CAJA 1**.

---

## Postman

Importar `Backend/postman/Viamatica.postman_collection.json`. Al ejecutar
**Auth → Login**, el token JWT se guarda solo y el resto de peticiones lo usan.
Hay logins separados para admin, gestor y cajero (para probar los permisos por rol).

---

## Cumplimiento de requisitos de la prueba

### Backend (API REST)

| Requisito | Dónde está |
|---|---|
| CRUD usuarios; admin crea activos, gestor crea pendientes de aprobación | `application/user.service.js` |
| Username 8-20, letras + un número, sin especiales, único | `user.service.js` (`USERNAME_RE`) |
| Password 8-30, una mayúscula y un número | `auth.service.js` (`PASS_RE`) |
| Bloqueo de sesión a los 3 intentos fallidos | `auth.service.js` (login) |
| CRUD clientes; identificación 10-13 dígitos única, registro único, búsqueda por identificación | `client.service.js` |
| Dirección y referencia 20-100 caracteres; teléfono ≥10 dígitos iniciando con 09 | `client.service.js` |
| CRUD turnos; descripción 2 letras + 4 números según tipo de atención (AC0001, PS0001) | `turn.service.js` (`generarDescripcion`) |
| CRUD contratos: cambio de servicio (VIG→SUS + nuevo REN **manteniendo fecha fin**) | función SQL + `contract.service.js` |
| Cancelación actualiza estado y fecha fin; cambio de forma de pago | `contract.service.js` |
| Máx. 2 usuarios por caja y no pueden operar a la vez | `turn.service.js` (`asignarCajero`, `abrirCaja`, `atender`) |
| Arquitectura DDD/Onion | estructura de `Backend/src` |
| **Eliminaciones lógicas** | campo `deleted` en todos los servicios |
| **Swagger** | `config/swagger.js` → `/api-docs` |
| **ORM (obligatorio)** | Sequelize en `domain/models.js` |
| **≥1 Stored Procedure o Función** | `fn_cambiar_servicio` (`Backend/sql/funciones.sql`, se crea sola en `infrastructure/seed.js`) |

### Frontend (Angular)

| Requisito | Dónde está |
|---|---|
| Login con validación previa al servicio y recuperación de contraseña | `pages/login.component.ts` |
| Bienvenida: datos del usuario + turnos atendidos hoy según rol + pendientes (gestor) | `pages/welcome.component.ts` |
| Dashboard SOLO ADMIN: indicadores de usuarios y de cajas/cajeros/gestores con filtros de fecha | `pages/dashboard.component.ts` |
| Interfaz admin: actualizar usuarios/estado + **carga masiva .xlsx/.csv** | `pages/users.component.ts` |
| Asignación de turnos (gestor) y atención (cajero) | `pages/turns.component.ts` |
| Procesos de caja SOLO CAJERO: contratar, pagos, cambio de servicio, cambio de pago, cancelar | `pages/caja.component.ts` |
| Mantenimiento de clientes SOLO CAJERO + carga masiva | `pages/clients.component.ts` |
| **Menú (sidebar) cargado desde la BD según el rol** | `layout/layout.component.ts` + `GET /api/menu` |
| Desarrollo modularizado + rutas + lazy loading | `app.routes.ts` |
| Protección de rutas por sesión y rol | `core/auth.guard.ts` |
| Interceptor (JWT + loading + errores + expiración) | `core/auth.interceptor.ts` |
| Mensajes de error/éxito y pantalla de carga | `core/ui.services.ts` + layout |
| Plantilla de diseño | Bootstrap 5 + Bootstrap Icons |

### Entregables

| Entregable | Dónde está |
|---|---|
| Dockerización backend + frontend + BD comunicados | `docker-compose.yml` |
| Repositorio con carpetas Backend y Frontend | estructura del repo |
| Script de funciones/SP | `Backend/sql/funciones.sql` |
| Colección Postman (CRUDs, login, registro) | `Backend/postman/Viamatica.postman_collection.json` |

---

## Flujo de prueba sugerido (en la app)

1. **Admin** (`admin1234`): ver Dashboard, crear un usuario cajero, probar la
   carga masiva con `Backend/datos-ejemplo/usuarios.csv`.
2. **Gestor** (`gestor123`): crear un usuario (queda *pendiente*), verlo en
   Bienvenida; en Turnos asignar el cajero a una caja y crear turnos.
3. **Admin**: aprobar el usuario pendiente (botón ✓ en Usuarios).
4. **Cajero** (`cajero123`): en Clientes registrar uno (o carga masiva con
   `Backend/datos-ejemplo/clientes.csv`); en Caja abrir la CAJA 1, buscar el cliente
   por identificación, contratar un servicio, registrar un pago, **cambiar el
   servicio** (se ve VIG→SUS + nuevo REN con la misma fecha fin) y atender
   su turno en Turnos.
5. Probar el **bloqueo**: cerrar sesión y fallar la contraseña 3 veces;
   desbloquear como admin (editar usuario → estado ACT).

## Solución de problemas

- **El backend no conecta a la BD**: verificar credenciales en `Backend/.env`
  y que la base `cajadb` exista. El backend reintenta 10 veces.
- **Reiniciar los datos en Docker**: `docker compose down -v` (borra el
  volumen) y volver a levantar.
- **Puerto ocupado**: cambiar el mapeo en `docker-compose.yml` o liberar el
  puerto (3000/4200/5432).
- **Warning de CommonJS por `xlsx` al compilar Angular**: es solo una
  advertencia, no afecta.
