# Documento de Diseño del Sistema (SDD)
## Sistema de Registro a Eventos Corporativos

**Versión:** 1.0
**Fecha:** 09 de agosto de 2026
**Estado:** Borrador
**Referencia:** requerimientos.md v1.0 | bdd.feature v1.0

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Visión General de la Arquitectura](#2-visión-general-de-la-arquitectura)
3. [Módulos del Sistema](#3-módulos-del-sistema)
4. [Diseño de la Base de Datos](#4-diseño-de-la-base-de-datos)
5. [Diseño de la API REST](#5-diseño-de-la-api-rest)
6. [Comunicación en Tiempo Real](#6-comunicación-en-tiempo-real)
7. [Seguridad y Control de Acceso](#7-seguridad-y-control-de-acceso)
8. [Flujos Principales del Sistema](#8-flujos-principales-del-sistema)
9. [Generación de Códigos Únicos](#9-generación-de-códigos-únicos)
10. [Diseño de Interfaz de Usuario](#10-diseño-de-interfaz-de-usuario)
11. [Consideraciones de Despliegue](#11-consideraciones-de-despliegue)
12. [Decisiones de Diseño](#12-decisiones-de-diseño)

---

## 1. Introducción

### 1.1 Propósito

Este documento describe el diseño técnico del **Sistema de Registro a Eventos Corporativos**. Define la arquitectura del software, el modelo de datos, los contratos de API, los flujos funcionales y las decisiones de diseño que guiarán la implementación del sistema.

### 1.2 Alcance

El SDD cubre los siguientes módulos funcionales:

- Gestión de eventos y configuración
- Formulario de registro público (mobile-first)
- Generación atómica de códigos únicos por ciudad
- Control de asistencia en tiempo real
- Panel de visualización en vivo
- Gestión de usuarios y control de acceso basado en roles (RBAC)
- Exportación de datos (CSV/XLSX)

### 1.3 Audiencia

Este documento está dirigido a desarrolladores frontend, desarrolladores backend, arquitectos de software y líderes técnicos del proyecto.

### 1.4 Documentos Relacionados

| Documento | Descripción |
|---|---|
| `requerimientos.md` | Especificación de requerimientos funcionales y no funcionales |
| `bdd.feature` | Escenarios de comportamiento en formato Gherkin |

---

## 2. Visión General de la Arquitectura

### 2.1 Estilo Arquitectónico

El sistema adopta una arquitectura **cliente-servidor de tres capas** con soporte para comunicación en tiempo real:

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTES                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Formulario  │  │  Panel Admin │  │  Vista Vivo  │  │
│  │  Público     │  │  (SPA)       │  │  (SPA)       │  │
│  │  (mobile)    │  │              │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼────────────────┼────────────────┼────────────┘
          │  HTTPS / WSS   │                │
┌─────────▼────────────────▼────────────────▼────────────┐
│                   CAPA DE APLICACIÓN                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │              API REST (JSON)                    │   │
│  │  + Gateway de WebSockets (eventos en tiempo     │   │
│  │    real por canal de evento)                    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────── ┐
│                    CAPA DE DATOS                         │
│  ┌──────────────────┐   ┌──────────────────────────┐    │
│  │  Base de Datos   │   │  Almacenamiento de        │    │
│  │  Relacional      │   │  Archivos (imágenes)      │    │
│  │  (PostgreSQL)    │   │  (S3 / local)             │    │
│  └──────────────────┘   └──────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Decisiones Tecnológicas de Referencia

> Nota: las tecnologías específicas deben confirmarse con el equipo. Las siguientes son recomendaciones de diseño compatibles con los requerimientos del sistema.

| Capa | Tecnología Recomendada | Justificación |
|---|---|---|
| Frontend | React / Next.js | SPA con SSR para el formulario público (SEO y carga rápida en móvil) |
| Backend | Node.js + Express / NestJS | Ecosistema maduro para REST + WebSockets |
| Base de datos | PostgreSQL | Transacciones ACID necesarias para unicidad de códigos |
| Tiempo real | Socket.IO / WebSockets nativos | Propagación de eventos entre operadores y paneles |
| Almacenamiento | AWS S3 o almacenamiento local | Imágenes referenciales de eventos |
| Autenticación | JWT + refresh tokens | Sesiones stateless con renovación segura |

---

## 3. Módulos del Sistema

### 3.1 Diagrama de Módulos

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA DE REGISTRO                      │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │   Auth /     │   │  Gestión de  │   │   Gestión de   │  │
│  │   Usuarios   │   │   Eventos    │   │   Invitados    │  │
│  └──────┬───────┘   └──────┬───────┘   └───────┬────────┘  │
│         │                  │                   │           │
│  ┌──────▼───────────────────▼───────────────────▼────────┐  │
│  │              Módulo de Códigos Únicos                 │  │
│  │         (Generación atómica por ciudad/evento)        │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │                               │
│  ┌──────────────┐   ┌───────▼──────┐   ┌────────────────┐  │
│  │  Registro    │   │   Control de │   │  Visualización │  │
│  │  Público     │   │  Asistencia  │   │  en Vivo       │  │
│  └──────────────┘   └──────────────┘   └────────────────┘  │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐                        │
│  │  Dashboard   │   │  Exportación │                        │
│  │  Admin       │   │  CSV / XLSX  │                        │
│  └──────────────┘   └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Responsabilidades por Módulo

| Módulo | Responsabilidad Principal |
|---|---|
| **Auth / Usuarios** | Autenticación JWT, gestión de sesiones, CRUD de perfiles, RBAC |
| **Gestión de Eventos** | CRUD de eventos, estados, configuración, asignación de operadores |
| **Gestión de Invitados** | Registro, validación de duplicados, estados de asistencia |
| **Códigos Únicos** | Generación atómica de correlativos por ciudad y tipo de registro |
| **Registro Público** | Formulario accesible sin autenticación, validación de período |
| **Control de Asistencia** | Búsqueda, marcado de presencia, registro en evento |
| **Visualización en Vivo** | Panel agregado de solo lectura con datos en tiempo real |
| **Dashboard Admin** | Métricas consolidadas por evento y ciudad |
| **Exportación** | Generación de archivos CSV/XLSX bajo demanda |

---

## 4. Diseño de la Base de Datos

### 4.1 Modelo Entidad-Relación (descripción textual)

El modelo relacional se compone de las siguientes entidades principales:

- **Usuario** — perfiles del sistema con rol asignado
- **Evento** — configuración completa de cada evento
- **CiudadEvento** — relación entre un evento y sus ciudades sede, con iniciales
- **AsignacionOperador** — relación entre usuarios (no-admin) y los eventos que pueden gestionar
- **Invitado** — datos de cada persona registrada al evento
- **CodigoCorrelativo** — contador atómico por evento, ciudad y tipo de registro

### 4.2 Esquema de Tablas

#### Tabla: `usuarios`

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador único |
| `nombre` | VARCHAR(150) | NOT NULL | Nombre del usuario |
| `correo` | VARCHAR(255) | NOT NULL, UNIQUE | Correo de acceso |
| `password_hash` | VARCHAR(255) | NOT NULL | Hash bcrypt de la contraseña |
| `rol` | ENUM | NOT NULL | `ADMIN`, `OPERADOR`, `VISUALIZACION` |
| `activo` | BOOLEAN | DEFAULT TRUE | Estado del perfil |
| `creado_en` | TIMESTAMPTZ | NOT NULL | Fecha de creación |
| `actualizado_en` | TIMESTAMPTZ | NOT NULL | Última modificación |

#### Tabla: `eventos`

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador único |
| `nombre` | VARCHAR(255) | NOT NULL | Nombre del evento |
| `descripcion` | TEXT | | Descripción breve |
| `imagen_url` | VARCHAR(500) | | URL de imagen referencial |
| `fecha_inicio_registro` | DATE | NOT NULL | Inicio del período de registro |
| `fecha_cierre_registro` | DATE | NOT NULL | Cierre del período de registro |
| `estado` | ENUM | NOT NULL | `PROXIMO`, `ABIERTO`, `CERRADO`, `EN_CURSO`, `CONCLUIDO` |
| `permitir_acompanante` | BOOLEAN | DEFAULT FALSE | Activa el botón de acompañante |
| `creado_por` | UUID | FK → usuarios | Administrador que lo creó |
| `creado_en` | TIMESTAMPTZ | NOT NULL | Fecha de creación |
| `actualizado_en` | TIMESTAMPTZ | NOT NULL | Última modificación |

#### Tabla: `ciudades_evento`

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador único |
| `evento_id` | UUID | FK → eventos | Evento al que pertenece |
| `nombre_ciudad` | VARCHAR(100) | NOT NULL | Nombre completo (ej. "Cochabamba") |
| `iniciales` | VARCHAR(5) | NOT NULL | Iniciales para el código (ej. "CB") |
| `fecha_evento` | DATE | NOT NULL | Fecha de realización en esta ciudad |
| UNIQUE | | (`evento_id`, `iniciales`) | Las iniciales son únicas por evento |

#### Tabla: `asignaciones_operador`

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador único |
| `usuario_id` | UUID | FK → usuarios | Operador o visualizador |
| `evento_id` | UUID | FK → eventos | Evento asignado |
| `asignado_en` | TIMESTAMPTZ | NOT NULL | Fecha de asignación |
| UNIQUE | | (`usuario_id`, `evento_id`) | Sin duplicados |

#### Tabla: `invitados`

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador único |
| `evento_id` | UUID | FK → eventos | Evento al que pertenece |
| `ciudad_evento_id` | UUID | FK → ciudades_evento | Ciudad sede seleccionada |
| `nombre_completo` | VARCHAR(200) | NOT NULL | Nombre completo del invitado |
| `celular` | VARCHAR(20) | NOT NULL | Número de celular |
| `codigo_cliente` | VARCHAR(100) | NOT NULL | Código de cliente (no único) |
| `codigo_unico` | VARCHAR(30) | NOT NULL | Código asignado (ej. CB001, Evento-CB001) |
| `tipo_registro` | ENUM | NOT NULL | `PRE_REGISTRO`, `REGISTRO_EVENTO` |
| `estado` | ENUM | NOT NULL | `REGISTRADO`, `PRESENTE` |
| `consentimiento_datos` | BOOLEAN | NOT NULL | Consentimiento explícito marcado |
| `registrado_por` | UUID | FK → usuarios, NULL | NULL si fue auto-registro público |
| `registrado_en` | TIMESTAMPTZ | NOT NULL | Fecha y hora del registro |
| `marcado_presente_en` | TIMESTAMPTZ | | Cuándo fue marcado como presente |
| UNIQUE | | (`evento_id`, `nombre_completo`) | Prevención de duplicados |
| UNIQUE | | (`evento_id`, `celular`) | Prevención de duplicados |
| UNIQUE | | (`evento_id`, `codigo_unico`) | Unicidad absoluta del código |

#### Tabla: `codigos_correlativos`

Esta tabla actúa como contador atómico y es el mecanismo central para garantizar la unicidad de códigos bajo concurrencia.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador único |
| `evento_id` | UUID | FK → eventos | Evento al que pertenece |
| `ciudad_evento_id` | UUID | FK → ciudades_evento | Ciudad |
| `tipo` | ENUM | NOT NULL | `PRE_REGISTRO`, `REGISTRO_EVENTO` |
| `ultimo_correlativo` | INTEGER | NOT NULL, DEFAULT 0 | Último número asignado |
| UNIQUE | | (`evento_id`, `ciudad_evento_id`, `tipo`) | Un solo contador por combinación |

---

## 5. Diseño de la API REST

Todos los endpoints están bajo el prefijo base `/api/v1`. Las rutas protegidas requieren un token JWT válido en el encabezado `Authorization: Bearer <token>`. Los permisos se indican por rol.

### 5.1 Autenticación

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| POST | `/auth/login` | Iniciar sesión | Público |
| POST | `/auth/logout` | Cerrar sesión | Autenticado |
| POST | `/auth/refresh` | Renovar token | Autenticado |

**Body de login:**
```json
{
  "correo": "admin@empresa.com",
  "password": "contraseña"
}
```

**Respuesta exitosa:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "usuario": {
    "id": "uuid",
    "nombre": "Nombre",
    "rol": "ADMIN"
  }
}
```

### 5.2 Eventos

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/eventos` | Listar eventos activos | ADMIN, OPERADOR, VISUALIZACION |
| GET | `/eventos/concluidos` | Listar eventos concluidos | ADMIN |
| GET | `/eventos/:id` | Detalle de un evento | ADMIN, OPERADOR*, VISUALIZACION* |
| POST | `/eventos` | Crear evento | ADMIN |
| PATCH | `/eventos/:id` | Editar evento | ADMIN |
| PATCH | `/eventos/:id/concluir` | Marcar como concluido | ADMIN |
| PATCH | `/eventos/:id/extender-registro` | Extender fecha de cierre | ADMIN |
| DELETE | `/eventos/:id` | Eliminar evento | ADMIN |

> (*) Solo si el usuario tiene asignado ese evento.

**Body de creación de evento:**
```json
{
  "nombre": "Feria de Innovación 2026",
  "descripcion": "Descripción breve del evento",
  "fechaInicioRegistro": "2026-08-01",
  "fechaCierreRegistro": "2026-09-10",
  "permitirAcompanante": true,
  "ciudades": [
    { "nombreCiudad": "Cochabamba", "iniciales": "CB", "fechaEvento": "2026-09-15" },
    { "nombreCiudad": "Santa Cruz",  "iniciales": "SC", "fechaEvento": "2026-09-16" }
  ]
}
```

### 5.3 Invitados (Registro Público)

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/publico/eventos/:id` | Info pública del evento (nombre, fechas, ciudades) | Público |
| POST | `/publico/eventos/:id/registrar` | Pre-registro de invitado | Público |

**Body de pre-registro:**
```json
{
  "nombreCompleto": "Juan Pérez López",
  "celular": "70012345",
  "codigoCliente": "CLI-9981",
  "ciudadEventoId": "uuid-ciudad",
  "consentimientoDatos": true
}
```

**Respuesta exitosa:**
```json
{
  "codigoUnico": "CB001",
  "nombreCompleto": "Juan Pérez López",
  "ciudad": "Cochabamba",
  "fechaEvento": "2026-09-15",
  "tipoRegistro": "PRE_REGISTRO"
}
```

### 5.4 Invitados (Panel Administrativo y Control de Asistencia)

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/eventos/:id/invitados` | Listar invitados del evento | ADMIN, OPERADOR* |
| GET | `/eventos/:id/invitados/buscar` | Buscar por código, nombre o celular | ADMIN, OPERADOR* |
| POST | `/eventos/:id/invitados` | Registrar nuevo invitado (día del evento) | OPERADOR* |
| PATCH | `/eventos/:id/invitados/:invId/presente` | Marcar como presente | OPERADOR* |

**Query params para búsqueda:**
```
GET /eventos/:id/invitados/buscar?q=CB005
GET /eventos/:id/invitados/buscar?q=Juan+Pérez
GET /eventos/:id/invitados/buscar?q=70012345
```

### 5.5 Dashboard y Métricas

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/eventos/:id/metricas` | Métricas agregadas del evento | ADMIN, VISUALIZACION* |
| GET | `/eventos/:id/metricas/ciudades` | Métricas desglosadas por ciudad | ADMIN, VISUALIZACION* |

**Respuesta de métricas:**
```json
{
  "eventoId": "uuid",
  "totalPreRegistros": 200,
  "totalPresentes": 95,
  "totalRegistroEvento": 15,
  "diasRestantesRegistro": 9,
  "estado": "ABIERTO",
  "porCiudad": [
    {
      "ciudad": "Cochabamba",
      "iniciales": "CB",
      "preRegistros": 120,
      "presentes": 85,
      "registroEvento": 10
    },
    {
      "ciudad": "Santa Cruz",
      "iniciales": "SC",
      "preRegistros": 80,
      "presentes": 60,
      "registroEvento": 5
    }
  ]
}
```

### 5.6 Usuarios y Perfiles

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/usuarios` | Listar todos los usuarios | ADMIN |
| POST | `/usuarios` | Crear usuario | ADMIN |
| PATCH | `/usuarios/:id` | Editar usuario | ADMIN |
| DELETE | `/usuarios/:id` | Eliminar usuario | ADMIN |
| POST | `/usuarios/:id/asignar-evento` | Asignar evento a un usuario | ADMIN |
| DELETE | `/usuarios/:id/asignar-evento/:eventoId` | Quitar asignación | ADMIN |

### 5.7 Exportación

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/eventos/:id/exportar?formato=csv` | Descargar CSV | ADMIN |
| GET | `/eventos/:id/exportar?formato=xlsx` | Descargar XLSX | ADMIN |

El servidor responde con `Content-Disposition: attachment` y el tipo MIME correspondiente.

---

## 6. Comunicación en Tiempo Real

### 6.1 Mecanismo

El sistema utiliza **WebSockets** (mediante Socket.IO o WebSockets nativos) para propagar eventos en tiempo real a todos los clientes conectados al mismo evento.

Cada cliente (operador o visualizador) se une a un **canal (room) por evento** al autenticarse:

```
room: evento:{eventoId}
```

El servidor emite eventos a ese canal cuando ocurre cualquier cambio de estado.

### 6.2 Eventos de WebSocket

#### Cliente → Servidor

| Evento | Payload | Descripción |
|---|---|---|
| `join_event` | `{ eventoId }` | Suscribirse al canal del evento |
| `leave_event` | `{ eventoId }` | Abandonar el canal del evento |

#### Servidor → Cliente

| Evento | Payload | Descripción |
|---|---|---|
| `invitado_presente` | `{ invitadoId, codigoUnico, ciudad, marcadoEn }` | Un invitado fue marcado como presente |
| `nuevo_invitado` | `{ invitadoId, codigoUnico, ciudad, tipoRegistro }` | Se registró un nuevo invitado |
| `metricas_actualizadas` | `{ porCiudad: [...] }` | Snapshot actualizado de métricas por ciudad |

### 6.3 Flujo de Sincronización

```
Operador A                  Servidor                  Operador B / Vista Vivo
    │                           │                            │
    │── PATCH /presente ───────►│                            │
    │                           │── UPDATE invitado ────────►│(DB)
    │                           │── emit('invitado_presente')►│
    │◄── 200 OK ────────────────│                            │
    │                           │── emit('metricas_actualizadas')►│
    │                           │                            │ actualiza contador
```

### 6.4 Autorización en WebSockets

Al recibir `join_event`, el servidor verifica:

1. Que el token JWT del cliente sea válido.
2. Que el usuario tenga asignado el evento solicitado (para roles OPERADOR y VISUALIZACION).
3. Si la verificación falla, el servidor rechaza la suscripción y cierra la conexión.

---

## 7. Seguridad y Control de Acceso

### 7.1 Autenticación

- Se utiliza **JWT (JSON Web Token)** con dos tokens: `accessToken` (vida corta, 15-60 min) y `refreshToken` (vida larga, 7 días).
- Los tokens se transmiten únicamente sobre HTTPS.
- El `accessToken` se envía en el header `Authorization: Bearer <token>`.
- Las contraseñas se almacenan con **bcrypt** (factor de costo mínimo: 12).

### 7.2 Matriz de Permisos (RBAC)

La siguiente tabla define los permisos por recurso y rol:

| Recurso / Acción | ADMIN | OPERADOR | VISUALIZACION | Público |
|---|:---:|:---:|:---:|:---:|
| Crear / editar eventos | ✅ | ❌ | ❌ | ❌ |
| Ver listado de eventos (asignados) | ✅ | ✅ | ✅ | ❌ |
| Crear / editar usuarios | ✅ | ❌ | ❌ | ❌ |
| Asignar operadores a eventos | ✅ | ❌ | ❌ | ❌ |
| Buscar invitados | ✅ | ✅ | ❌ | ❌ |
| Ver datos personales de invitados | ✅ | ✅ | ❌ | ❌ |
| Marcar invitado como presente | ✅ | ✅ | ❌ | ❌ |
| Registrar nuevo invitado (día evento) | ✅ | ✅ | ❌ | ❌ |
| Ver métricas agregadas | ✅ | ✅ | ✅ | ❌ |
| Exportar CSV / XLSX | ✅ | ❌ | ❌ | ❌ |
| Marcar evento como concluido | ✅ | ❌ | ❌ | ❌ |
| Pre-registro público | ❌ | ❌ | ❌ | ✅ |

### 7.3 Validación de Acceso a Eventos

Para roles OPERADOR y VISUALIZACION, cada request que incluya un `eventoId` debe pasar por una capa de validación que confirme que el usuario tiene una entrada en `asignaciones_operador` para ese evento. Si no la tiene, el servidor responde `403 Forbidden`.

### 7.4 Protección de Datos Personales

- El endpoint `/eventos/:id/metricas/ciudades` no expone datos individuales; solo devuelve contadores agregados.
- El perfil VISUALIZACION no tiene acceso a ningún endpoint que retorne datos de invitados individuales.
- El consentimiento de datos (`consentimientoDatos: true`) es validado en el backend antes de crear el registro; no se puede omitir enviando el campo como `false` o ausente.

---

## 8. Flujos Principales del Sistema

### 8.1 Flujo de Pre-registro de Invitado

```
Invitado                    Frontend Público             Backend
   │                              │                         │
   │── abre enlace del evento ───►│                         │
   │                              │── GET /publico/eventos/:id ►│
   │                              │◄── datos públicos ──────│
   │                              │                         │
   │ [período activo]             │ muestra formulario      │
   │                              │                         │
   │── completa y envía form ────►│                         │
   │                              │── POST /publico/eventos/:id/registrar ►│
   │                              │        verifica período de registro    │
   │                              │        verifica duplicados (nombre/cel)│
   │                              │        genera código único (atómico)   │
   │                              │        guarda invitado                 │
   │                              │◄── { codigoUnico, nombre, ciudad } ───│
   │◄── pantalla de confirmación ─│                         │
   │    con código asignado       │                         │
```

### 8.2 Flujo de Marcado de Asistencia (Día del Evento)

```
Operador                    Frontend Admin               Backend            WebSocket
   │                              │                         │                   │
   │── busca invitado ───────────►│                         │                   │
   │                              │── GET /invitados/buscar?q=... ►│            │
   │                              │◄── resultados ──────────│                   │
   │                              │                         │                   │
   │── clic "Marcar presente" ───►│                         │                   │
   │                              │── PATCH /invitados/:id/presente ►│          │
   │                              │        verifica estado actual    │          │
   │                              │        actualiza estado a PRESENTE│         │
   │                              │        actualiza marcado_presente_en│       │
   │                              │◄── 200 OK ──────────────│                   │
   │                              │        emit('invitado_presente') ──────────►│
   │                              │        emit('metricas_actualizadas') ───────►│
   │◄── confirmación visual ──────│                         │                   │
   │                              │        Operador B y Vista Vivo reciben ─────►│
   │                              │        actualización en tiempo real          │
```

### 8.3 Flujo de Generación de Código Único (con bloqueo)

```
Backend (transacción)
   │
   ├── BEGIN TRANSACTION
   │
   ├── SELECT ... FOR UPDATE
   │   FROM codigos_correlativos
   │   WHERE evento_id = ? AND ciudad_evento_id = ? AND tipo = ?
   │   (bloqueo de fila — otros procesos esperan aquí)
   │
   ├── nuevo_correlativo = ultimo_correlativo + 1
   │
   ├── UPDATE codigos_correlativos
   │   SET ultimo_correlativo = nuevo_correlativo
   │
   ├── codigo = iniciales + LPAD(nuevo_correlativo, 3, '0')
   │   ej: "CB" + "001" = "CB001"
   │   o bien: "Evento-CB001"
   │
   ├── INSERT INTO invitados (codigo_unico = codigo, ...)
   │
   └── COMMIT
       (el bloqueo se libera — el siguiente proceso puede continuar)
```

### 8.4 Flujo de Extensión de Fecha de Registro

```
Administrador              Backend
   │                          │
   │── PATCH /extender-registro ──►│
   │   { nuevaFechaCierre: "..." } │
   │                          │── verifica que nuevaFechaCierre > fechaActual
   │                          │── UPDATE eventos SET fecha_cierre_registro = ?
   │                          │   (NO toca la tabla invitados)
   │◄── 200 OK ───────────────│
```

### 8.5 Flujo de Marcado de Evento como Concluido

```
Administrador              Backend
   │                          │
   │── PATCH /concluir ───────►│
   │                          │── UPDATE eventos SET estado = 'CONCLUIDO'
   │                          │── NO elimina registros de invitados
   │                          │── La exportación sigue disponible
   │◄── 200 OK ───────────────│
   │   El evento aparece en   │
   │   "Eventos Concluidos"   │
```

---

## 9. Generación de Códigos Únicos

### 9.1 Algoritmo

La generación de códigos es el componente más crítico del sistema en términos de concurrencia. El diseño utiliza la tabla `codigos_correlativos` como fuente de verdad y una transacción con bloqueo a nivel de fila (`SELECT FOR UPDATE`) para serializar el acceso.

**Pseudocódigo:**

```
función generarCodigo(eventoId, ciudadEventoId, tipo):
  BEGIN TRANSACTION (nivel de aislamiento: SERIALIZABLE o READ COMMITTED con FOR UPDATE)

  fila = SELECT * FROM codigos_correlativos
         WHERE evento_id = eventoId
           AND ciudad_evento_id = ciudadEventoId
           AND tipo = tipo
         FOR UPDATE  ← bloquea esta fila específica

  SI fila no existe:
    INSERT INTO codigos_correlativos (evento_id, ciudad_evento_id, tipo, ultimo_correlativo)
    VALUES (eventoId, ciudadEventoId, tipo, 0)
    fila.ultimo_correlativo = 0

  nuevoCorrelativo = fila.ultimo_correlativo + 1

  UPDATE codigos_correlativos
  SET ultimo_correlativo = nuevoCorrelativo
  WHERE id = fila.id

  iniciales = SELECT iniciales FROM ciudades_evento WHERE id = ciudadEventoId

  SI tipo = PRE_REGISTRO:
    codigo = iniciales + LPAD(nuevoCorrelativo, 3, '0')
    ej: "CB001"
  SI tipo = REGISTRO_EVENTO:
    codigo = "Evento-" + iniciales + LPAD(nuevoCorrelativo, 3, '0')
    ej: "Evento-CB001"

  COMMIT
  retornar codigo
```

### 9.2 Garantías

| Garantía | Mecanismo |
|---|---|
| No hay dos códigos iguales en la misma ciudad/evento | `SELECT FOR UPDATE` + restricción `UNIQUE` en `invitados.codigo_unico` |
| El correlativo es estrictamente creciente | Incremento atómico en `codigos_correlativos` |
| Los correlativos de pre-registro y evento son independientes | La columna `tipo` en `codigos_correlativos` los separa |
| Los correlativos de distintas ciudades son independientes | La columna `ciudad_evento_id` los separa |

### 9.3 Formato de Código

| Tipo | Formato | Ejemplo |
|---|---|---|
| Pre-registro | `{INICIALES}{NNN}` | `CB001`, `SC023`, `LP100` |
| Registro en evento | `Evento-{INICIALES}{NNN}` | `Evento-CB001`, `Evento-SC012` |

El correlativo usa padding a 3 dígitos por defecto. Si un evento supera los 999 registros en una ciudad, el sistema incrementa el contador sin truncarlo (ej. `CB1000`).

---

## 10. Diseño de Interfaz de Usuario

### 10.1 Vistas del Sistema

El sistema tiene tres contextos de interfaz diferenciados:

| Contexto | URL base | Audiencia | Dispositivo principal |
|---|---|---|---|
| Formulario público | `/registro/:eventoId` | Invitados | Móvil |
| Panel administrativo | `/admin` | Administradores y Operadores | Escritorio |
| Vista en vivo | `/vivo/:eventoId` | Gerencias / Jefaturas | Escritorio o tablet |

### 10.2 Mapa de Pantallas

#### Formulario Público (`/registro/:eventoId`)

```
┌──────────────────────────────────┐
│  [Imagen del evento]             │
│  Nombre del evento               │
│  Descripción breve               │
├──────────────────────────────────┤
│  Nombre completo         [____]  │
│  Número de celular       [____]  │
│  Código de cliente       [____]  │
│  Ciudad del evento       [▼___]  │  ← Solo si hay múltiples ciudades
│  Fecha del evento        [▼___]  │  ← Solo si hay múltiples fechas
│                                  │
│  [ ] Acepto el uso de mis datos  │
│                                  │
│  [     Registrarme     ]         │
└──────────────────────────────────┘

→ Pantalla de Confirmación:
┌──────────────────────────────────┐
│  ✅ ¡Registro exitoso!           │
│                                  │
│  Nombre:  Juan Pérez López       │
│  Código:  CB001                  │
│  Ciudad:  Cochabamba             │
│  Fecha:   15/09/2026             │
│                                  │
│  [ Registrar acompañante ]       │  ← Solo si está activo
└──────────────────────────────────┘
```

#### Panel Administrativo (`/admin`)

```
/admin/dashboard          → Listado de eventos con métricas resumen
/admin/eventos/nuevo      → Formulario de creación de evento
/admin/eventos/:id        → Detalle, edición y configuración del evento
/admin/eventos/:id/invitados  → Listado de invitados con etiquetas
/admin/usuarios           → Gestión de perfiles de usuario
/admin/usuarios/:id/asignaciones → Asignación de eventos al usuario
```

#### Control de Asistencia (`/admin/eventos/:id/asistencia`)

```
┌──────────────────────────────────────────────┐
│  Evento: Feria de Innovación 2026            │
│  Cochabamba — 15/09/2026                     │
├──────────────────────────────────────────────┤
│  🔍 [Buscar por código, nombre o celular___] │
├──────────────────────────────────────────────┤
│  Resultado:                                  │
│  ┌────────────────────────────────────────┐  │
│  │ Juan Pérez López                       │  │
│  │ Código: CB005  |  Estado: Registrado   │  │
│  │ Celular: 70012345                      │  │
│  │                  [Marcar como Presente]│  │
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│  [ + Registrar nuevo invitado ]              │
└──────────────────────────────────────────────┘
```

#### Vista en Vivo (`/vivo/:eventoId`)

```
┌──────────────────────────────────────────────────────────┐
│  Feria de Innovación 2026 — Seguimiento en vivo  🔴 LIVE │
├──────────────────────┬───────────────────────────────────┤
│  COCHABAMBA          │  SANTA CRUZ                       │
│                      │                                   │
│  Pre-registros: 120  │  Pre-registros: 80                │
│  Presentes:      85  │  Presentes:     60                │
│  Nuevos hoy:     10  │  Nuevos hoy:     5                │
├──────────────────────┴───────────────────────────────────┤
│  TOTAL  |  Pre-registros: 200  |  Presentes: 145         │
│         |  Nuevos hoy: 15                                │
└──────────────────────────────────────────────────────────┘
```

### 10.3 Principios de Diseño

- **Mobile-first:** el formulario público se diseña primero para pantallas de 360px+. Los breakpoints se amplían para tablet (768px+) y escritorio (1024px+).
- **Feedback inmediato:** todos los formularios muestran validación inline al perder el foco del campo. El estado de carga se muestra con indicadores visuales al enviar.
- **Operatividad en asistencia:** la pantalla de Control de Asistencia minimiza el número de toques/clics para marcar una asistencia. El buscador responde mientras el operador escribe.
- **Solo lectura visible:** la Vista en Vivo no muestra ningún control interactivo para evitar confusiones; es un panel de visualización puro.

---

## 11. Consideraciones de Despliegue

### 11.1 Entornos

| Entorno | Propósito | Observaciones |
|---|---|---|
| **Desarrollo** | Trabajo local del equipo | Base de datos local, sin HTTPS obligatorio |
| **Staging** | Pruebas de integración y QA | Réplica de producción con datos de prueba |
| **Producción** | Sistema en vivo | HTTPS obligatorio, backups automáticos |

### 11.2 Variables de Entorno Requeridas

El sistema requiere las siguientes variables de entorno en producción:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT |
| `JWT_REFRESH_SECRET` | Clave secreta para refresh tokens |
| `JWT_EXPIRES_IN` | Duración del access token (ej. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Duración del refresh token (ej. `7d`) |
| `STORAGE_PROVIDER` | Proveedor de almacenamiento (`local` o `s3`) |
| `S3_BUCKET` | Nombre del bucket S3 (si aplica) |
| `S3_REGION` | Región AWS (si aplica) |
| `FRONTEND_URL` | URL del frontend para configurar CORS |
| `PORT` | Puerto del servidor backend |
| `BCRYPT_SALT_ROUNDS` | Factor de costo bcrypt (mínimo: 12) |

### 11.3 Requisitos de Infraestructura

| Componente | Requerimiento Mínimo (Producción) |
|---|---|
| Servidor de aplicación | 2 vCPU, 4 GB RAM |
| Base de datos PostgreSQL | 2 vCPU, 4 GB RAM, 50 GB SSD |
| Almacenamiento de archivos | 10 GB inicial (escalable) |
| Conexiones WebSocket concurrentes | Soporte para mínimo 200 conexiones simultáneas |
| SSL/TLS | Certificado válido (Let's Encrypt o equivalente) |

### 11.4 Estrategia de Respaldo

- La base de datos debe tener **backups automáticos diarios** con retención mínima de 30 días.
- Los backups deben almacenarse en una ubicación separada del servidor de producción.
- Antes de eventos críticos, se recomienda realizar un backup manual y verificar la restauración.

---

## 12. Decisiones de Diseño

Esta sección documenta las decisiones de diseño significativas y su justificación.

### DD-01: PostgreSQL como base de datos principal

**Decisión:** Usar PostgreSQL en lugar de una base de datos NoSQL.

**Justificación:** La generación de códigos únicos requiere transacciones ACID con bloqueo a nivel de fila (`SELECT FOR UPDATE`). PostgreSQL provee esta garantía de forma nativa. Una base de datos NoSQL como MongoDB requeriría implementaciones más complejas (como operaciones findAndModify con condiciones) para lograr la misma garantía, con mayor riesgo de condiciones de carrera.

---

### DD-02: Bloqueo optimista vs. pesimista para códigos únicos

**Decisión:** Usar bloqueo **pesimista** (`SELECT FOR UPDATE`) para la generación de códigos.

**Justificación:** El bloqueo optimista (comparar y actualizar con version counter) podría generar reintentos bajo alta concurrencia, complicando el flujo. Como el bloqueo aplica solo a una fila específica por evento+ciudad+tipo, la contención es mínima y el bloqueo pesimista es seguro y más simple de implementar correctamente.

---

### DD-03: WebSockets sobre SSE para tiempo real

**Decisión:** Usar WebSockets bidireccionales en lugar de Server-Sent Events (SSE).

**Justificación:** Aunque el flujo de datos de tiempo real es principalmente servidor→cliente (compatible con SSE), los WebSockets permiten además manejar el evento `join_event` / `leave_event` para la gestión de canales y la validación de autorización al conectarse, sin necesidad de endpoints HTTP adicionales para ello.

---

### DD-04: JWT stateless con refresh token

**Decisión:** Usar JWT para autenticación en lugar de sesiones de servidor.

**Justificación:** Un sistema con múltiples instancias de servidor (para disponibilidad) no puede compartir fácilmente el estado de sesión sin una capa adicional (Redis, etc.). JWT permite que cualquier instancia valide un token sin consultar una base de datos. El `refreshToken` mitiga el riesgo de tokens de larga vida.

---

### DD-05: Estado del evento calculado vs. almacenado

**Decisión:** Almacenar el estado del evento en la base de datos, no solo calcularlo en tiempo de ejecución.

**Justificación:** El estado `CONCLUIDO` es una decisión manual del administrador que no puede derivarse de las fechas. Los demás estados (`PROXIMO`, `ABIERTO`, `CERRADO`, `EN_CURSO`) pueden calcularse desde las fechas, pero almacenarlos evita cálculos repetidos y permite hacer queries eficientes por estado. El backend es responsable de mantener la consistencia del estado.

---

### DD-06: Unicidad de nombre y celular, no de código de cliente

**Decisión:** Los campos únicos por evento son `nombre_completo` y `celular`. El `codigo_cliente` no es único.

**Justificación:** Un código de cliente puede pertenecer a una empresa o grupo de personas (ej. varios empleados de la misma empresa con el mismo código corporativo). El invitado individual se identifica por su nombre y número de celular personal.

---

*Documento generado para el proyecto de Sistema de Registro a Eventos Corporativos — SDD v1.0*
