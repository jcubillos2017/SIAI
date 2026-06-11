# SIAI — Sistema Integral Activos de Información

Sistema de inventario para activos TI (computadores, y en el futuro monitores, scanners, etc.) con panel de administración para intranet.

---

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

```
siai/
├── backend/      # API FastAPI (Python)
└── frontend/     # SPA React + Vite (TypeScript)
```

---

## Requisitos previos

| Herramienta | Versión mínima | Notas |
|---|---|---|
| Git | cualquiera | para clonar el repositorio |
| Node.js | 18+ (recomendado 20+) | para el frontend |
| Python | 3.11+ | 3.13 funciona en Windows |
| MongoDB | 6+ | local o servidor interno |

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/TU_REPO.git siai
cd siai
```

---

## 2. Configurar y levantar el Backend

### 2.1 Crear entorno virtual e instalar dependencias

```powershell
cd backend

python -m venv .venv

# Activar en Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# Activar en Linux / Mac
# source .venv/bin/activate

python -m pip install -U pip
python -m pip install -r requirements.txt
```

### 2.2 Variables de entorno

```powershell
# Windows
copy .env.example .env

# Linux / Mac
# cp .env.example .env
```

Editar `backend/.env` con los valores del entorno:

```env
PROJECT_NAME=SIAI
API_V1_STR=/api/v1

MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=siai

# Obligatorio: clave larga y aleatoria (mínimo 32 caracteres)
SECRET_KEY=CAMBIA_ESTA_LLAVE_LARGA_Y_ALEATORIA
ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Orígenes permitidos (separados por coma)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> ⚠️ `backend/.env` **no se sube a git**. Solo `backend/.env.example` está versionado.

### 2.3 Levantar el backend

```powershell
uvicorn app.main:app --reload --port 8000
```

- API disponible en: `http://127.0.0.1:8000`
- Documentación Swagger: `http://127.0.0.1:8000/docs`

### 2.4 Crear el usuario Administrador (primer uso)

En una segunda terminal **con el mismo venv activo**:

```powershell
python -m scripts.create_admin
```

> El sistema permite un único administrador. No se puede crear desde la UI.

---

## 3. Configurar y levantar el Frontend

```powershell
cd frontend
npm install
npm run dev
```

- Frontend disponible en: `http://localhost:5173`

El frontend usa un proxy de Vite que redirige `/api` → `http://127.0.0.1:8000`, por lo que no es necesario configurar URLs manualmente.

---

## Módulos

### Módulo 1 — Autenticación y Usuarios (Admin)

- Login con JWT
- Gestión de usuarios (DataGrid): crear, bloquear/desbloquear, reset de contraseña, eliminar
- Cambio de contraseña propio y por admin
- Al cambiar/resetear contraseña se revocan todos los refresh tokens del usuario

### Módulo 2 — Importaciones

- Descarga de plantilla Excel (autenticada)
- Previsualización: tabla de primeras filas + tabla de errores (fila / campo / mensaje)
- Importación con resumen (creados / actualizados / errores)

**Columnas de la plantilla de Computadores:**

| Columna | Requerido |
|---|---|
| Código Inventario | ✅ |
| Nombre Equipo | ✅ |
| Numero de Serie | ✅ |
| Marca | — |
| Modelo | — |
| Memoria | — |
| Tipo de Equipo | — |
| Procesador | — |
| Tarjeta Video | — |
| Disco Duro | — |
| Tipo de Adquisicion (Compra/Arriendo) | — |

### Módulo 3 — Inventario (Computadores)

- Listado con búsqueda avanzada y paginación server-side
- Detalle del equipo (doble clic en fila)
- CRUD completo (solo Admin): crear, editar, eliminar
- Detección de equipos en línea (ping / barrido de red)

---

## Seguridad

- JWT Access Token (60 min) + Refresh Token (7 días)
- Revocación de refresh tokens al resetear o cambiar contraseña
- Bloqueo de cuentas (`is_active=false`)
- Admin único, creado solo por script
- Variables sensibles fuera de git (`.env`)

---

## Roadmap

- [ ] Auditoría: registrar quién creó / editó / borró / importó
- [ ] Soporte para Monitores y Scanners (misma arquitectura)
- [ ] Integración con Active Directory / LDAP (guardar GUID en Mongo)

---

## Git — comandos típicos

```bash
git status
git add .
git commit -m "feat: descripción del cambio"
git push
```

> Se recomienda mantener el repositorio **privado** mientras el proyecto esté en construcción.
