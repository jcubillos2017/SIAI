# SIAI — Sistema Integral Activos de Información

Sistema de inventario para activos TI (computadores, y en el futuro monitores/scanners/etc.) con panel de administración para intranet.

## Stack

**Frontend**
- TypeScript + React + Vite
- React Router
- TanStack Query (React Query)
- MUI (Material UI) + DataGrid
- React Hook Form + Zod

**Backend**
- Python + FastAPI
- MongoDB (Motor + Beanie)
- JWT Access Token + Refresh Token (con revocación)
- Hashing de passwords: bcrypt (con pre-hash SHA-256)

---

## Estructura del repositorio


--------------------------------------------------------------------------------------------------------------------------------------------------------------------

siai/
backend/
frontend/

---------------------------------------------------------------------------------------------------------------------------------------------------------------------

## Requisitos

- Node.js 18+ (recomendado 20+)
- Python 3.11+ (en Windows funciona con 3.13, según tu instalación)
- MongoDB (local o servidor interno)
- Git

---

## Backend (FastAPI)

### 1) Crear entorno e instalar dependencias

```bash
cd backend

python -m venv .venv
# Windows
.\.venv\Scripts\Activate.ps1
# Linux/Mac
# source .venv/bin/activate

python -m pip install -U pip
python -m pip install -r requirements.txt

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

2) Variables de entorno

copy .env.example .env
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

Edita backend/.env:

MONGODB_URI

MONGODB_DB

SECRET_KEY (obligatorio: largo/aleatorio)

CORS_ORIGINS (frontend local)

⚠️ backend/.env no se sube a git. Solo backend/.env.example.

3) Levantar backend
uvicorn app.main:app --reload --port 8000

Swagger:

http://127.0.0.1:8000/docs

4) Crear Admin (único)

En otra terminal (mismo venv):

python -m scripts.create_admin

El sistema permite solo un administrador.

Frontend (React + Vite)
1) Instalar dependencias y levantar
cd frontend
npm install
npm run dev

Frontend:

http://localhost:5173

El frontend usa proxy hacia el backend (/api -> http://127.0.0.1:8000).

Módulos
Módulo 1 — Usuarios (Admin)

Login

Gestión de usuarios (DataGrid):

Crear usuario (rol user)

Bloquear / Desbloquear

Reset password (password temporal)

Cambiar contraseña (admin)

Eliminar usuario

/users/me entrega rol + módulos permitidos

Nota: Al cambiar/resetear password se revocan refresh tokens.

Módulo 2 — Importaciones

Descarga de plantilla (autenticada)

Previsualización:

Tabla preview (primeras filas)

Tabla de errores con filtros (fila/campo/mensaje)

Importación (commit) con resumen (created/updated/errors)

Plantilla Computadores (columnas):

Código Inventario

Nombre Equipo

Numero de Serie

Marca

Modelo

Memoria

Tipo de Equipo

Procesador

Tarjeta Video

Disco Duro

Tipo de Adquisicion (Compra/Arriendo)

Módulo 3 — Inventario (Computadores)

Listado + búsqueda + paginación server

Detalle (doble click)

CRUD completo (Admin):

Crear computador manual

Editar / actualizar

Eliminar

Seguridad (resumen)

JWT Access Token + Refresh Token

Revocación de refresh tokens por usuario al:

Reset password

Change password

Set password (admin)

Bloqueo (is_active=false)

Admin único (no se crea desde UI)

Variables sensibles fuera de git (.env)

GitHub / Git
Recomendación

Repositorio privado mientras esté en construcción.

Comandos típicos
git status
git add .
git commit -m "Update: módulo inventario + importaciones"
git push
Roadmap corto

Auditoría: registrar acciones (quién creó/editó/borró/importó)

Soporte para Monitores/Scanners (misma arquitectura: import + inventario + CRUD)

Integración con AD/LDAPS (guardar GUID en Mongo)


---

## Ahora, para subirlo a GitHub (privado)
1) Crea repo **Private** en GitHub (web).
2) En tu PC:

```powershell
cd D:\Project\siai
git add README.md
git commit -m "Add README"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main

Si ya tenías remoto agregado, solo:

git push

Si quieres, también te creo un CONTRIBUTING.md y un CHANGELOG.md simple para que el proyecto se vea súper profesional (aunque sea privado).

