# Documento de Requerimientos del Sistema
## Sistema de Registro a Eventos Corporativos

**Versión:** 1.0  
**Fecha:** 09 de agosto de 2026  
**Estado:** Borrador

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Alcance del Sistema](#2-alcance-del-sistema)
3. [Perfiles de Usuario](#3-perfiles-de-usuario)
4. [Requerimientos Funcionales](#4-requerimientos-funcionales)
   - 4.1 [Gestión de Eventos](#41-gestión-de-eventos)
   - 4.2 [Formulario de Registro Público](#42-formulario-de-registro-público)
   - 4.3 [Generación de Códigos Únicos](#43-generación-de-códigos-únicos)
   - 4.4 [Dashboard Principal](#44-dashboard-principal)
   - 4.5 [Control de Asistencia (Día del Evento)](#45-control-de-asistencia-día-del-evento)
   - 4.6 [Visualización en Vivo](#46-visualización-en-vivo)
   - 4.7 [Gestión de Usuarios y Perfiles](#47-gestión-de-usuarios-y-perfiles)
   - 4.8 [Exportación de Datos](#48-exportación-de-datos)
   - 4.9 [Configuraciones del Administrador](#49-configuraciones-del-administrador)
5. [Requerimientos No Funcionales](#5-requerimientos-no-funcionales)
   - 5.1 [Rendimiento y Concurrencia](#51-rendimiento-y-concurrencia)
   - 5.2 [Disponibilidad](#52-disponibilidad)
   - 5.3 [Seguridad y Privacidad de Datos](#53-seguridad-y-privacidad-de-datos)
   - 5.4 [Usabilidad y Accesibilidad](#54-usabilidad-y-accesibilidad)
   - 5.5 [Tiempo Real](#55-tiempo-real)
6. [Reglas de Negocio](#6-reglas-de-negocio)
7. [Glosario](#7-glosario)

---

## 1. Introducción

### 1.1 Propósito

Este documento describe los requerimientos funcionales y no funcionales del **Sistema de Registro a Eventos Corporativos**, una plataforma web destinada a gestionar el ciclo completo de un evento corporativo: desde la configuración y pre-registro de invitados hasta el control de asistencia en tiempo real el día del evento.

### 1.2 Contexto del Problema

Los eventos corporativos con asistencia distribuida en múltiples ciudades requieren un mecanismo centralizado que permita:

- El pre-registro de invitados antes del evento.
- El control de asistencia el día del evento, incluyendo registro de última hora.
- El seguimiento en tiempo real del estado del evento por parte de jefaturas y gerencias.
- La administración segura de datos personales de los asistentes.

### 1.3 Objetivos del Sistema

- Permitir la creación y configuración de múltiples eventos simultáneos.
- Proveer un flujo de registro público simple y optimizado para dispositivos móviles.
- Garantizar la unicidad de los códigos de asistente por ciudad, incluso bajo concurrencia.
- Ofrecer visibilidad en tiempo real del estado del evento a perfiles de solo lectura.
- Proteger los datos personales de los invitados mediante control de acceso y consentimiento explícito.

---

## 2. Alcance del Sistema

El sistema comprende los siguientes módulos:

| Módulo | Descripción |
|---|---|
| **Gestión de Eventos** | Creación, configuración y ciclo de vida de eventos |
| **Registro Público** | Formulario de pre-registro accesible por invitados |
| **Control de Asistencia** | Herramientas para operadores el día del evento |
| **Dashboard Administrativo** | Resumen de métricas y estado del evento |
| **Visualización en Vivo** | Vista de solo lectura para jefaturas y gerencias |
| **Gestión de Usuarios** | Administración de perfiles del sistema |
| **Exportación** | Descarga de datos en formatos CSV/XLSX |

**Fuera de alcance:** integración con sistemas de pago, envío de invitaciones por correo/SMS, o integración con plataformas de videoconferencia.

---

## 3. Perfiles de Usuario

El sistema define tres perfiles de acceso con capacidades diferenciadas:

### 3.1 Administrador

Perfil con acceso total al sistema. Responsable de la configuración y supervisión general.

**Capacidades:**
- Crear, editar y eliminar eventos.
- Configurar todos los parámetros de un evento (ver sección 4.1).
- Crear, editar y eliminar perfiles de cualquier tipo (Administrador, Control de Asistencia, Visualización en Vivo).
- Visualizar el dashboard completo del evento.
- Descargar los datos del evento en formato CSV o XLSX.
- Marcar un evento como "Concluido".
- Extender la fecha de registro sin afectar los registros existentes.
- Activar o desactivar la opción de registrar acompañantes en el formulario de registro.

### 3.2 Control de Asistencia

Perfil operativo para uso el día del evento. Puede haber múltiples operadores activos simultáneamente, incluso en la misma ciudad.

**Capacidades:**
- Buscar invitados pre-registrados por código único, nombre o número de celular.
- Cambiar el estado de un invitado de "Registrado" a "Presente".
- Registrar nuevos invitados el día del evento que no realizaron pre-registro.
- Ver en tiempo real los cambios realizados por otros operadores del mismo evento.

**Restricciones:**
- No puede crear ni modificar eventos.
- No puede crear ni modificar perfiles de usuario.
- No puede exportar datos.

### 3.3 Visualización en Vivo

Perfil de solo lectura pensado para jefaturas y gerencias que requieren seguimiento del evento en tiempo real.

**Capacidades:**
- Ver, por ciudad, la cantidad de invitados registrados (pre-registro).
- Ver, por ciudad, la cantidad de invitados presentes (marcados el día del evento).
- Ver, por ciudad, la cantidad de nuevos registros realizados el día del evento.
- Todos los datos se actualizan en tiempo real.

**Restricciones:**
- No puede realizar ninguna acción de escritura.
- No puede acceder a datos personales detallados de los invitados.

---

## 4. Requerimientos Funcionales

### 4.1 Gestión de Eventos

#### RF-01 — Creación de Evento

El Administrador debe poder crear un nuevo evento con los siguientes campos configurables:

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| Nombre del evento | Texto | Sí | Título identificador del evento |
| Fecha(s) del evento | Fecha(s) | Sí | Una o varias fechas de realización |
| Ciudad(es) | Texto | Sí | Una o varias ciudades sede |
| Descripción breve | Texto largo | No | Resumen descriptivo del evento |
| Imagen referencial | Archivo de imagen | No | Imagen de portada o banner del evento |
| Fecha de inicio de registro | Fecha | Sí | Desde cuándo los invitados pueden registrarse |
| Fecha de cierre de registro | Fecha | Sí | Hasta cuándo los invitados pueden registrarse |
| Permitir registro de acompañante | Booleano | Sí | Activa el botón opcional al finalizar el registro |

#### RF-02 — Eventos Simultáneos

El sistema debe soportar múltiples eventos activos al mismo tiempo, sin interferencia entre ellos. Cada evento tiene su propio conjunto de invitados, códigos, operadores y configuraciones.

#### RF-03 — Estados del Evento

Un evento puede tener los siguientes estados:

- **Próximo:** el período de registro aún no ha comenzado.
- **Abierto:** dentro del período de registro activo.
- **Cerrado:** fuera del período de registro, pero el evento aún no ha concluido.
- **En curso:** el día del evento está activo.
- **Concluido:** el Administrador lo ha marcado manualmente como finalizado.

#### RF-04 — Evento Concluido

El Administrador puede marcar manualmente un evento como "Concluido". Los eventos en este estado pasan a un apartado diferenciado de "Eventos Concluidos" o "Pasados" en la interfaz administrativa. Los datos del evento deben mantenerse íntegros y consultables.

#### RF-05 — Extensión del Período de Registro

El Administrador puede modificar la fecha de cierre de registro de un evento activo. Esta acción no debe afectar, modificar ni eliminar los registros de invitados ya existentes al momento de la extensión.

---

### 4.2 Formulario de Registro Público

#### RF-06 — Acceso al Formulario

El formulario de registro debe ser accesible públicamente (sin necesidad de cuenta) mediante un enlace único por evento. La interfaz debe estar optimizada para dispositivos móviles.

#### RF-07 — Campos del Formulario

El formulario debe recabar los siguientes datos del invitado:

| Campo | Tipo | Obligatorio | Condición |
|---|---|---|---|
| Nombre completo | Texto | Sí | Siempre |
| Número de celular | Número telefónico | Sí | Siempre |
| Código de cliente | Texto/Número | Sí | Siempre |
| Ciudad del evento | Selector | Sí | Solo si el evento tiene múltiples ciudades |
| Fecha del evento | Selector | Sí | Solo si el evento tiene múltiples fechas |
| Consentimiento de uso de datos | Casilla de verificación | Sí | Siempre (debe ser explícito) |

#### RF-08 — Validación de Período de Registro

Si el invitado intenta acceder al formulario fuera del período de registro configurado (antes de la fecha de inicio o después de la fecha de cierre), el sistema debe mostrar un mensaje informativo claro que indique que el registro no está disponible en ese momento, incluyendo, si corresponde, las fechas del período de registro.

#### RF-09 — Pantalla de Confirmación

Una vez completado y enviado el formulario exitosamente, el sistema debe mostrar una pantalla de éxito con:

- Nombre completo del invitado.
- Código único asignado.
- Ciudad y fecha del evento seleccionados.
- Botón opcional "Registrar acompañante" (solo visible si el Administrador ha activado esta opción en la configuración del evento).

#### RF-10 — Registro de Acompañante

Al hacer clic en el botón "Registrar acompañante", el sistema debe redirigir al usuario a un nuevo formulario de registro vacío para el mismo evento, permitiendo completar el registro de otra persona.

---

### 4.3 Generación de Códigos Únicos

#### RF-11 — Código de Pre-registro

Al completar el formulario de pre-registro, el sistema debe generar y asignar automáticamente un código único al invitado con el siguiente formato:

```
[INICIALES_CIUDAD][NÚMERO_CORRELATIVO]
```

**Ejemplos:**
- `CB001`, `CB002`, `CB003` → invitados pre-registrados en Cochabamba.
- `SC001`, `SC002`, `SC003` → invitados pre-registrados en Santa Cruz.
- `LP001`, `LP002` → invitados pre-registrados en La Paz.

El número correlativo debe seguir el orden cronológico de registro dentro de cada ciudad y evento. El código debe mostrarse en la pantalla de confirmación.

#### RF-12 — Código de Registro en Evento

Los invitados registrados directamente el día del evento (sin pre-registro previo) deben recibir un código con formato diferenciado:

```
Evento-[INICIALES_CIUDAD][NÚMERO_CORRELATIVO]
```

**Ejemplos:**
- `Evento-CB001`, `Evento-CB002` → registrados en evento en Cochabamba.
- `Evento-SC001`, `Evento-SC002` → registrados en evento en Santa Cruz.

El correlativo de códigos "Evento-" es independiente del correlativo de pre-registro.

#### RF-13 — Unicidad y Concurrencia de Códigos

La generación de códigos debe garantizar unicidad absoluta, incluso cuando dos registros ocurran simultáneamente en la misma ciudad desde puestos de control distintos. Dos invitados no pueden recibir el mismo código bajo ninguna circunstancia. El sistema debe implementar un mecanismo de bloqueo o transacción atómica para garantizar esto.

---

### 4.4 Dashboard Principal

#### RF-14 — Resumen del Evento

La pantalla principal del área administrativa debe mostrar un dashboard con las siguientes métricas por evento:

- Total de invitados pre-registrados.
- Desglose de registros por ciudad.
- Total de invitados presentes el día del evento.
- Total de nuevos registros realizados el día del evento.
- Estado actual del evento.
- Días restantes para el cierre de registro (si aplica).

#### RF-15 — Listado de Asistentes

El listado de asistentes de un evento debe incluir una etiqueta visual que distinga claramente entre:

- **Pre-registrado:** invitado que realizó su registro antes del evento.
- **Registrado en evento:** invitado registrado directamente el día del evento por un operador.

---

### 4.5 Control de Asistencia (Día del Evento)

#### RF-16 — Búsqueda de Invitados

El perfil de Control de Asistencia debe contar con un buscador que permita encontrar a un invitado pre-registrado mediante cualquiera de los siguientes criterios:

- Código único (pre-registro o evento).
- Nombre completo (búsqueda parcial o completa).
- Número de celular.

Los resultados deben mostrarse de forma inmediata conforme el operador escribe (búsqueda en tiempo real o con latencia mínima).

#### RF-17 — Marcado de Asistencia

Una vez localizado el invitado, el operador debe poder cambiar su estado de **"Registrado"** a **"Presente"** mediante una acción confirmada. Este cambio debe reflejarse inmediatamente en la vista de todos los operadores y perfiles conectados al mismo evento.

#### RF-18 — Registro de Nuevos Invitados el Día del Evento

El operador de Control de Asistencia debe poder registrar a un nuevo invitado que no realizó pre-registro. El formulario de registro en este caso debe solicitar los mismos datos que el formulario público (sección 4.2), y el sistema debe asignar automáticamente un código con formato "Evento-" (ver RF-12).

#### RF-19 — Sincronización entre Operadores

Toda acción realizada por cualquier operador de Control de Asistencia (marcado de presencia, nuevo registro) debe reflejarse en tiempo real en la interfaz de todos los demás operadores y perfiles de Visualización en Vivo conectados al mismo evento. Esto aplica incluso si varios operadores trabajan en la misma ciudad simultáneamente.

---

### 4.6 Visualización en Vivo

#### RF-20 — Panel de Seguimiento en Tiempo Real

El perfil de Visualización en Vivo debe tener acceso a un panel de solo lectura que muestre, para cada ciudad del evento:

| Métrica | Descripción |
|---|---|
| Invitados registrados | Total de pre-registros |
| Invitados presentes | Total marcados como "Presente" el día del evento |
| Registros en evento | Total de nuevos registros realizados el día del evento |

Todos los valores deben actualizarse en tiempo real sin necesidad de recargar la página.

---

### 4.7 Gestión de Usuarios y Perfiles

#### RF-21 — Creación de Perfiles por el Administrador

El Administrador debe poder crear múltiples perfiles de usuario de cualquier tipo:

- Múltiples perfiles de **Administrador**.
- Múltiples perfiles de **Control de Asistencia**.
- Múltiples perfiles de **Visualización en Vivo**.

Cada perfil debe tener, como mínimo: nombre, correo electrónico y contraseña.

#### RF-22 — Asignación de Perfiles a Eventos

El Administrador debe poder asignar perfiles de Control de Asistencia y Visualización en Vivo a uno o más eventos específicos. Un operador de Control de Asistencia o Visualización en Vivo solo puede acceder y operar en los eventos que el Administrador le haya asignado explícitamente; no tiene visibilidad sobre el resto de los eventos del sistema.

#### RF-23 — Edición y Eliminación de Perfiles

El Administrador puede editar los datos de cualquier perfil y eliminar perfiles que ya no sean necesarios, sin afectar los registros o datos históricos del evento.

---

### 4.8 Exportación de Datos

#### RF-24 — Descarga de Datos del Evento

El Administrador debe poder exportar el listado completo de invitados de un evento en los siguientes formatos:

- **CSV** (valores separados por comas).
- **XLSX** (libro de Microsoft Excel).

El archivo exportado debe incluir, como mínimo: nombre completo, número de celular, código de cliente, código único asignado, ciudad, fecha del evento, tipo de registro (Pre-registrado / Registrado en evento), estado (Registrado / Presente) y fecha y hora de registro.

---

### 4.9 Configuraciones del Administrador

A continuación se resume el conjunto completo de opciones configurables por el Administrador a nivel de evento:

| Configuración | Descripción | RF Relacionado |
|---|---|---|
| Nombre del evento | Título identificador | RF-01 |
| Fecha(s) del evento | Días de realización | RF-01 |
| Ciudad(es) | Sedes del evento | RF-01 |
| Descripción breve | Texto descriptivo | RF-01 |
| Imagen referencial | Imagen de portada | RF-01 |
| Período de registro | Fecha inicio y fin del pre-registro | RF-01, RF-08 |
| Botón de acompañante | Activar/desactivar en formulario | RF-01, RF-09, RF-10 |
| Marcar como concluido | Cierre manual del evento | RF-04 |
| Extender fecha de registro | Ampliar el cierre sin afectar registros | RF-05 |

---

## 5. Requerimientos No Funcionales

### 5.1 Rendimiento y Concurrencia

**RNF-01:** El sistema debe soportar múltiples operadores de Control de Asistencia y Visualización en Vivo conectados simultáneamente al mismo evento sin degradación perceptible del servicio.

**RNF-02:** La generación de códigos únicos debe realizarse mediante operaciones atómicas (por ejemplo, transacciones de base de datos con bloqueo optimista o pesimista) para garantizar que dos registros simultáneos nunca produzcan el mismo código, independientemente del número de operadores activos.

**RNF-03:** El tiempo de respuesta para el registro de un invitado (desde el envío del formulario hasta la visualización del código en pantalla) no debe superar los 3 segundos bajo condiciones normales de carga.

### 5.2 Disponibilidad

**RNF-04:** El sistema debe tener una disponibilidad mínima del 99.5% durante el período activo de un evento (desde 24 horas antes hasta 24 horas después de la fecha del evento).

**RNF-05:** El sistema debe manejar errores de conectividad de forma elegante, mostrando mensajes informativos al usuario en lugar de pantallas de error genéricas.

### 5.3 Seguridad y Privacidad de Datos

**RNF-06:** El acceso a las interfaces administrativas (Administrador, Control de Asistencia, Visualización en Vivo) debe estar protegido mediante autenticación por credenciales (usuario y contraseña).

**RNF-07:** Las contraseñas de los usuarios deben almacenarse con hash mediante un algoritmo seguro (bcrypt o equivalente). Nunca deben almacenarse en texto plano.

**RNF-08:** La comunicación entre el cliente y el servidor debe realizarse mediante HTTPS en todo momento.

**RNF-09:** Los datos personales de los invitados (nombre, celular, código de cliente) deben ser accesibles únicamente por los perfiles Administrador y Control de Asistencia. El perfil de Visualización en Vivo no debe tener acceso a datos individuales de los invitados.

**RNF-10:** El formulario de registro público debe incluir una casilla de consentimiento explícito e informado para el tratamiento de datos personales, de acuerdo con los principios de protección de datos. El registro no podrá completarse sin marcar dicho consentimiento.

**RNF-11:** El sistema debe implementar control de acceso basado en roles (RBAC) para garantizar que cada perfil solo pueda acceder a las funcionalidades que le corresponden.

### 5.4 Usabilidad y Accesibilidad

**RNF-12:** La interfaz del formulario de registro público debe estar diseñada con enfoque **mobile-first**, dado que la mayoría de los invitados accederá desde dispositivos móviles. Debe ser completamente funcional en pantallas de 360px de ancho o superior.

**RNF-13:** Los textos, botones y campos del formulario público deben ser legibles y utilizables sin necesidad de hacer zoom en dispositivos móviles estándar.

**RNF-14:** La interfaz de Control de Asistencia debe ser simple y eficiente para uso operativo intensivo, minimizando la cantidad de pasos para marcar la asistencia de un invitado.

**RNF-15:** El sistema debe mostrar retroalimentación visual inmediata ante cualquier acción del usuario (confirmaciones, errores de validación, estados de carga).

### 5.5 Tiempo Real

**RNF-16:** Las actualizaciones de estado (nuevo registro, marcado de presencia) deben propagarse a todos los clientes conectados al mismo evento en un tiempo máximo de 2 segundos. Se recomienda el uso de WebSockets o Server-Sent Events (SSE) para implementar esta funcionalidad.

**RNF-17:** El panel de Visualización en Vivo debe mostrar siempre datos actualizados sin necesidad de que el usuario recargue la página manualmente.

---

## 6. Reglas de Negocio

| ID | Regla |
|---|---|
| **RN-01** | Un invitado no puede registrarse dos veces en el mismo evento. El sistema debe detectar y prevenir duplicados usando el **nombre completo** y el **número de celular** como campos únicos por evento. El código de cliente no es un campo único y puede repetirse entre distintos invitados. |
| **RN-02** | Los códigos de pre-registro (`CB001`) y de registro en evento (`Evento-CB001`) son series independientes. Cada una comienza en 001 para cada ciudad y evento. |
| **RN-03** | El correlativo del código se asigna en el orden estricto de llegada del registro. Dos registros simultáneos deben serializar la asignación; no puede haber dos invitados con el mismo código en la misma ciudad y evento. |
| **RN-04** | Un invitado marcado como "Presente" no puede volver al estado "Registrado". El cambio de estado es unidireccional. |
| **RN-05** | Solo el Administrador puede extender la fecha de cierre de registro. Dicha extensión no modifica, elimina ni altera ningún registro existente. |
| **RN-06** | Un evento marcado como "Concluido" pasa al apartado de eventos pasados y no puede recibir nuevos registros ni cambios de estado de asistencia. Sus datos permanecen accesibles para consulta y exportación. |
| **RN-07** | El formulario de registro no puede enviarse si el campo de consentimiento de datos no ha sido marcado explícitamente. |
| **RN-08** | El botón "Registrar acompañante" en la pantalla de confirmación solo se muestra si el Administrador ha activado esta opción en la configuración del evento. |
| **RN-09** | Un perfil de Control de Asistencia puede operar en cualquier ciudad del evento al que esté asignado; no está restringido a una ciudad específica. |
| **RN-10** | Las iniciales de ciudad para la generación de códigos deben definirse al momento de crear el evento para garantizar consistencia (ej. "CB" para Cochabamba, "SC" para Santa Cruz, "LP" para La Paz). |

---

## 7. Glosario

| Término | Definición |
|---|---|
| **Pre-registro** | Proceso por el cual un invitado llena el formulario público antes del día del evento. |
| **Registro en evento** | Proceso por el cual un operador registra a un invitado directamente el día del evento. |
| **Código único** | Identificador alfanumérico generado automáticamente por el sistema para cada invitado, diferenciado por tipo de registro y ciudad. |
| **Control de Asistencia** | Perfil operativo encargado de gestionar la asistencia el día del evento. |
| **Visualización en Vivo** | Perfil de solo lectura para seguimiento en tiempo real del evento. |
| **Estado "Registrado"** | Estado inicial de un invitado que completó el pre-registro. |
| **Estado "Presente"** | Estado de un invitado que fue verificado y marcado por un operador el día del evento. |
| **Dashboard** | Pantalla de resumen con métricas clave del evento. |
| **RBAC** | Control de Acceso Basado en Roles (Role-Based Access Control). |
| **Mobile-first** | Enfoque de diseño que prioriza la experiencia en dispositivos móviles. |
| **Evento Concluido** | Evento marcado manualmente por el Administrador como finalizado, movido al apartado de eventos pasados. |
| **Período de registro** | Rango de fechas durante el cual los invitados pueden completar el formulario de pre-registro. |

---

*Documento generado para el proyecto de Sistema de Registro a Eventos Corporativos — v1.0*
