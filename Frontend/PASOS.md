# PASOS PARA ARMAR EL FRONTEND (5-10 minutos)

El frontend se arma en 3 pasos: generar el proyecto con Angular CLI,
copiar estos archivos encima, e instalar una librería.

> **¿Por qué así?** El proyecto base lo genera tu versión del CLI
> (`angular.json`, `tsconfig`, etc. quedan correctos para tu versión)
> y esta carpeta solo aporta el código de la aplicación.

---

## Paso 1 — Generar el proyecto base

Abre una terminal **dentro de tu carpeta `Frontend` (vacía)** y ejecuta:

```bash
ng new frontend --directory=. --style=css --ssr=false --skip-git
```

Respuestas si pregunta algo:
- **"Do you want to create a 'zoneless' application...?"** → **No** (importante)
- Cualquier otra pregunta → Enter (valor por defecto)

> Si no tienes Angular CLI: `npm install -g @angular/cli`

## Paso 2 — Copiar estos archivos encima del proyecto

Desde la carpeta `Frontend`, ejecuta:

**PowerShell (Windows):**
```powershell
Copy-Item -Recurse -Force ..\frontend-src\* .
```

**Git Bash / Linux / Mac:**
```bash
cp -r ../frontend-src/* .
```

Esto sobreescribe `src/main.ts`, `src/index.html`, `src/styles.css` y agrega
todo el código en `src/app/` (más el `Dockerfile` y `nginx.conf`).

Di **sí** si pregunta por sobreescribir archivos.

## Paso 3 — Instalar la librería de Excel (carga masiva)

```bash
npm install xlsx
```

## Paso 4 — Ejecutar

```bash
ng serve
```

Abre http://localhost:4200 (el backend debe estar corriendo en el puerto 3000).

---

## Notas

- Al compilar puede salir un **warning** de que `xlsx` es un módulo CommonJS.
  Es solo una advertencia, no un error; puedes ignorarla.
- Los archivos `app.ts` / `app.component.ts` que generó el CLI quedan sin uso
  (nuestro `main.ts` arranca con `app.root.ts`). No hace falta borrarlos.
- Cuando el frontend funcione, puedes **borrar la carpeta `frontend-src`**
  (ya está en el `.gitignore` para que no se suba al repo).
