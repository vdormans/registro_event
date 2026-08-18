# Sistema de Registro a Eventos Corporativos

Plataforma web para gestionar el ciclo completo de eventos corporativos: pre-registro de invitados, control de asistencia en tiempo real y visualización en vivo para jefaturas.

---

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 18.x o superior |
| npm | 9.x o superior |
| PostgreSQL | 14.x o superior |

---

## Puesta en marcha

### 1. Clonar y configurar variables de entorno

```bash
# Desde la raíz del proyecto
cp .env.example backend/.env
```

Edita `backend/.env` y configura al menos:

```env
DATABASE_URL="postgresql://TU_USUARIO:TU_PASSWORD@localhost:5432/registro_eventos"
JWT_SECRET="un-secreto-largo-y-aleatorio"
JWT_REFRESH_SECRET="otro-secreto-distinto"
```

### 2. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Preparar la base de datos

```bash
cd backend

# Crear tablas
npx prisma migrate dev --name init

# Crear administrador inicial
npm run db:seed
```

El seed crea el usuario `admin@empresa.com` / `Admin1234!` (configurable en `.env`).

### 4. Arrancar el proyecto

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Escucha en http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Escucha en http://localhost:5173
```

---

## Acceso al sistema

| URL | Descripción |
|---|---|
| `http://localhost:5173/login` | Panel de administración |
| `http://localhost:5173/registro/{eventoId}` | Formulario público de invitados |
| `http://localhost:3001/health` | Health check del backend |
| `http://localhost:3001/api/v1` | API REST base |

**Credenciales del administrador inicial:**
- Correo: `admin@empresa.com`
- Contraseña: `Admin1234!`

---

## Estructura del proyecto

```
Registro_Evento/
├── backend/                   # Node.js + Express + Prisma + Socket.IO
│   ├── prisma/
│   │   ├── schema.prisma      # Esquema de BD (6 modelos)
│   │   └── seed.ts            # Admin inicial
│   └── src/
│       ├── domain/            # Entidades, enums, interfaces, servicios de dominio
│       ├── application/       # Casos de uso (auth, eventos, invitados, usuarios, exportación)
│       ├── infrastructure/    # Repositorios Prisma, WebSocket gateway, almacenamiento
│       ├── presentation/      # Controllers, middlewares, rutas Express
│       └── server.ts          # Punto de entrada
│
├── frontend/                  # React 18 + Vite + TypeScript + Tailwind
│   └── src/
│       ├── api/               # Cliente axios + endpoints
│       ├── context/           # AuthContext
│       ├── hooks/             # useSocket (Socket.IO)
│       ├── components/        # Navbar, AppLayout, ProtectedRoute, EventoForm
│       ├── pages/
│       │   ├── auth/          # LoginPage
│       │   ├── app/           # Dashboard, Eventos, Invitados, Asistencia, Vivo, Usuarios
│       │   └── publico/       # RegistroPublico, Confirmacion
│       └── types/             # Tipos TypeScript compartidos
│
├── requerimientos.md          # Especificación de requerimientos
├── bdd.feature                # Escenarios BDD en Gherkin
└── sdd.md                     # Documento de diseño del sistema
```

---

## Perfiles de usuario

| Perfil | Capacidades |
|---|---|
| **Administrador** | Gestión completa: eventos, usuarios, exportación, métricas |
| **Control de Asistencia** | Buscar invitados, marcar presentes, registrar nuevos el día del evento |
| **Visualización en Vivo** | Panel de solo lectura con métricas en tiempo real por ciudad |

---

## Comandos útiles

```bash
# Backend
npm run db:studio        # Prisma Studio (explorador visual de BD)
npm run db:migrate       # Aplicar migraciones en desarrollo
npm run db:seed          # Recrear administrador inicial
npm run lint             # ESLint
npm run format           # Prettier

# Frontend
npm run build            # Build de producción
npm run lint             # ESLint
```

---

## Notas de producción

- Configurar HTTPS (nginx / caddy delante del backend)
- Cambiar todos los secretos de JWT en `.env`
- Configurar `BCRYPT_SALT_ROUNDS=12` mínimo
- Ejecutar `npx prisma migrate deploy` (no `dev`) en producción
- Configurar backups automáticos de PostgreSQL
