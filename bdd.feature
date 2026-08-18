# ============================================================
# BDD — Sistema de Registro a Eventos Corporativos
# Formato: Gherkin (Given / When / Then)
# Versión: 1.0  |  Fecha: 09 de agosto de 2026
# ============================================================

# ────────────────────────────────────────────────────────────
# MÓDULO 1: GESTIÓN DE EVENTOS (Administrador)
# ────────────────────────────────────────────────────────────

Feature: Gestión de Eventos

  Background:
    Given que el usuario ha iniciado sesión con perfil "Administrador"

  # RF-01 — Creación de evento
  Scenario: Crear un evento con todos los campos obligatorios
    When el administrador completa el formulario de creación de evento con:
      | campo                      | valor                          |
      | Nombre                     | Feria de Innovación 2026       |
      | Fecha del evento           | 15/09/2026                     |
      | Ciudad                     | Cochabamba                     |
      | Iniciales de ciudad        | CB                             |
      | Fecha inicio de registro   | 01/08/2026                     |
      | Fecha cierre de registro   | 10/09/2026                     |
      | Permitir acompañante       | Sí                             |
    And hace clic en "Guardar evento"
    Then el sistema crea el evento exitosamente
    And el evento aparece en el listado de eventos activos con estado "Próximo"

  Scenario: Crear un evento con múltiples ciudades y fechas
    When el administrador crea un evento con las siguientes ciudades y fechas:
      | ciudad        | iniciales | fecha del evento |
      | Cochabamba    | CB        | 15/09/2026       |
      | Santa Cruz    | SC        | 16/09/2026       |
      | La Paz        | LP        | 17/09/2026       |
    Then el formulario de registro público muestra un selector de ciudad
    And muestra un selector de fecha del evento

  Scenario: Intentar crear un evento sin nombre
    When el administrador intenta guardar un evento sin completar el campo "Nombre"
    Then el sistema muestra el mensaje de error "El nombre del evento es obligatorio"
    And el evento no es creado

  Scenario: Subir una imagen referencial al crear un evento
    When el administrador adjunta un archivo de imagen válido al campo "Imagen referencial"
    And guarda el evento
    Then la imagen queda asociada al evento
    And se muestra en el formulario de registro público y en el dashboard

  # RF-02 — Eventos simultáneos
  Scenario: Administrar múltiples eventos activos en simultáneo
    Given que existen los eventos activos "Feria de Innovación 2026" y "Lanzamiento de Producto Q3"
    When el administrador accede al listado de eventos
    Then ambos eventos aparecen en el listado de forma independiente
    And cada evento muestra sus propias métricas sin interferencia del otro

  # RF-03 — Estados del evento
  Scenario Outline: El estado del evento cambia según las fechas configuradas
    Given que existe el evento "<evento>" con inicio de registro "<inicio_reg>" y cierre "<cierre_reg>" y fecha de evento "<fecha_evento>"
    When la fecha actual es "<fecha_actual>"
    Then el estado del evento es "<estado>"

    Examples:
      | evento   | inicio_reg | cierre_reg | fecha_evento | fecha_actual | estado   |
      | Evento A | 10/09/2026 | 30/09/2026 | 05/10/2026   | 05/09/2026   | Próximo  |
      | Evento B | 01/08/2026 | 10/09/2026 | 05/10/2026   | 20/08/2026   | Abierto  |
      | Evento C | 01/08/2026 | 10/09/2026 | 05/10/2026   | 15/09/2026   | Cerrado  |
      | Evento D | 01/08/2026 | 10/09/2026 | 05/10/2026   | 05/10/2026   | En curso |

  # RF-04 — Marcar evento como Concluido
  Scenario: Administrador marca un evento como concluido
    Given que existe el evento "Feria de Innovación 2026" en estado "En curso"
    When el administrador selecciona la opción "Marcar como concluido"
    And confirma la acción
    Then el evento pasa al estado "Concluido"
    And el evento aparece en el apartado "Eventos Concluidos"
    And los datos del evento siguen siendo accesibles para consulta y exportación
    And el evento no acepta nuevos registros ni cambios de estado de asistencia

  # RF-05 — Extensión del período de registro
  Scenario: Administrador extiende la fecha de cierre de registro
    Given que el evento "Feria de Innovación 2026" tiene cierre de registro el "10/09/2026"
    And existen 150 invitados pre-registrados
    When el administrador cambia la fecha de cierre de registro a "20/09/2026"
    Then la nueva fecha de cierre queda guardada como "20/09/2026"
    And los 150 registros previos permanecen intactos sin ninguna modificación


# ────────────────────────────────────────────────────────────
# MÓDULO 2: FORMULARIO DE REGISTRO PÚBLICO
# ────────────────────────────────────────────────────────────

Feature: Formulario de Registro Público

  # RF-06 — Acceso al formulario
  Scenario: Invitado accede al formulario durante el período de registro
    Given que el evento "Feria de Innovación 2026" tiene el período de registro activo
    When el invitado abre el enlace público del formulario
    Then el sistema muestra el formulario de registro completo
    And la interfaz es usable desde un dispositivo móvil

  Scenario: Invitado intenta registrarse antes del período de registro
    Given que el evento "Feria de Innovación 2026" tiene inicio de registro el "01/09/2026"
    And la fecha actual es "20/08/2026"
    When el invitado abre el enlace público del formulario
    Then el sistema muestra el mensaje "El registro para este evento aún no está disponible"
    And muestra la fecha de inicio de registro "01/09/2026"
    And no muestra el formulario de registro

  Scenario: Invitado intenta registrarse después del cierre de registro
    Given que el evento "Feria de Innovación 2026" tiene cierre de registro el "10/09/2026"
    And la fecha actual es "15/09/2026"
    When el invitado abre el enlace público del formulario
    Then el sistema muestra el mensaje "El período de registro para este evento ha concluido"
    And no muestra el formulario de registro

  # RF-07 — Campos del formulario
  Scenario: Invitado completa el formulario con todos los campos requeridos (evento de una sola ciudad y fecha)
    Given que el evento "Feria de Innovación 2026" tiene una sola ciudad y una sola fecha
    When el invitado completa el formulario con:
      | campo                       | valor            |
      | Nombre completo             | Juan Pérez López |
      | Número de celular           | 70012345         |
      | Código de cliente           | CLI-9981         |
      | Consentimiento de datos     | marcado          |
    And hace clic en "Registrarme"
    Then el sistema registra al invitado exitosamente
    And genera y muestra un código único al invitado

  Scenario: Formulario muestra selector de ciudad cuando el evento tiene múltiples ciudades
    Given que el evento "Lanzamiento Nacional" tiene las ciudades "Cochabamba", "Santa Cruz" y "La Paz"
    When el invitado abre el formulario de registro
    Then el formulario muestra el campo selector "Ciudad del evento"
    And las opciones disponibles son "Cochabamba", "Santa Cruz" y "La Paz"

  Scenario: Formulario muestra selector de fecha cuando el evento tiene múltiples fechas
    Given que el evento "Lanzamiento Nacional" tiene las fechas "15/09/2026" en Cochabamba y "16/09/2026" en Santa Cruz
    When el invitado abre el formulario de registro
    Then el formulario muestra el campo selector "Fecha del evento"

  # RF-07 — Validaciones de campos obligatorios
  Scenario Outline: El formulario no se envía si falta un campo obligatorio
    Given que el invitado tiene el formulario visible
    When intenta enviar el formulario sin completar el campo "<campo_faltante>"
    Then el sistema muestra el mensaje de error "<mensaje_error>"
    And el formulario no se envía

    Examples:
      | campo_faltante          | mensaje_error                                    |
      | Nombre completo         | El nombre completo es obligatorio                |
      | Número de celular       | El número de celular es obligatorio              |
      | Código de cliente       | El código de cliente es obligatorio              |
      | Consentimiento de datos | Debe aceptar el uso de datos para continuar      |

  # RN-01 — Prevención de duplicados
  Scenario: El sistema rechaza un registro duplicado por número de celular
    Given que el invitado "Ana Mamani" con celular "71122334" ya está registrado en el evento "Feria de Innovación 2026"
    When otro invitado intenta registrarse en el mismo evento con el celular "71122334"
    Then el sistema muestra el mensaje "Este número de celular ya está registrado en el evento"
    And no crea un nuevo registro

  Scenario: El sistema rechaza un registro duplicado por nombre completo
    Given que el invitado "Carlos Rodríguez Vega" ya está registrado en el evento "Feria de Innovación 2026"
    When otro invitado intenta registrarse con el nombre "Carlos Rodríguez Vega" en el mismo evento
    Then el sistema muestra el mensaje "Este nombre ya está registrado en el evento"
    And no crea un nuevo registro

  Scenario: El sistema permite el mismo código de cliente para diferentes invitados
    Given que el invitado "Ana Mamani" ya está registrada con código de cliente "CLI-500" en el evento "Feria de Innovación 2026"
    When "Pedro Torres" intenta registrarse con el mismo código de cliente "CLI-500" en el mismo evento
    And usa un nombre completo y número de celular distintos
    Then el sistema registra a "Pedro Torres" exitosamente
    And le asigna un código único diferente al de "Ana Mamani"

  # RF-09 — Pantalla de confirmación
  Scenario: El sistema muestra pantalla de éxito tras el registro (con botón de acompañante activo)
    Given que el administrador ha activado la opción "Permitir acompañante" en el evento
    When el invitado "Juan Pérez López" completa y envía el formulario para la ciudad "Cochabamba"
    Then el sistema muestra la pantalla de confirmación con:
      | dato              | valor            |
      | Nombre            | Juan Pérez López |
      | Código asignado   | CB001            |
      | Ciudad            | Cochabamba       |
    And la pantalla muestra el botón "Registrar acompañante"

  Scenario: La pantalla de éxito no muestra el botón de acompañante si la opción está desactivada
    Given que el administrador ha desactivado la opción "Permitir acompañante" en el evento
    When el invitado completa y envía el formulario exitosamente
    Then la pantalla de confirmación no muestra el botón "Registrar acompañante"

  # RF-10 — Flujo de registro de acompañante
  Scenario: Invitado registra a un acompañante desde la pantalla de confirmación
    Given que el invitado "Juan Pérez López" acaba de completar su registro
    And la pantalla de confirmación muestra el botón "Registrar acompañante"
    When el invitado hace clic en "Registrar acompañante"
    Then el sistema muestra un nuevo formulario de registro vacío para el mismo evento
    And el nuevo formulario mantiene preseleccionada la misma ciudad y fecha


# ────────────────────────────────────────────────────────────
# MÓDULO 3: GENERACIÓN DE CÓDIGOS ÚNICOS
# ────────────────────────────────────────────────────────────

Feature: Generación de Códigos Únicos

  # RF-11 — Código de pre-registro
  Scenario: El sistema asigna códigos correlativos por ciudad para pre-registros
    Given que el evento "Feria de Innovación 2026" no tiene invitados registrados en "Cochabamba"
    When se registran tres invitados en "Cochabamba" en orden cronológico
    Then el primer invitado recibe el código "CB001"
    And el segundo invitado recibe el código "CB002"
    And el tercer invitado recibe el código "CB003"

  Scenario: Los correlativos de código son independientes por ciudad
    Given que el evento "Lanzamiento Nacional" tiene registrados:
      | invitado     | ciudad     | código |
      | Invitado A   | Cochabamba | CB001  |
      | Invitado B   | Cochabamba | CB002  |
    When un nuevo invitado se registra en "Santa Cruz"
    Then el nuevo invitado recibe el código "SC001"
    And los códigos de Cochabamba no se ven afectados

  Scenario Outline: El código usa las iniciales definidas para cada ciudad
    Given que el evento "Lanzamiento Nacional" incluye la ciudad "<ciudad>" con iniciales "<iniciales>"
    When un invitado se registra como primero en dicha ciudad
    Then el código asignado es "<codigo_esperado>"

    Examples:
      | ciudad      | iniciales | codigo_esperado |
      | Cochabamba  | CB        | CB001           |
      | Santa Cruz  | SC        | SC001           |
      | La Paz      | LP        | LP001           |

  # RF-12 — Código de registro en evento
  Scenario: El operador registra a un nuevo invitado el día del evento y recibe código con prefijo "Evento-"
    Given que el operador "Operador1" está gestionando el evento "Feria de Innovación 2026" en "Cochabamba"
    When el operador registra a "María Flores" como nueva invitada el día del evento
    Then el sistema asigna el código "Evento-CB001" a "María Flores"
    And su tipo de registro queda marcado como "Registrado en evento"

  Scenario: Los correlativos de pre-registro y de evento son independientes
    Given que el evento ya tiene pre-registrados "CB001", "CB002" y "CB003" en Cochabamba
    When el operador registra al primer nuevo invitado del día del evento en Cochabamba
    Then el código asignado es "Evento-CB001"
    And los códigos de pre-registro no se ven afectados

  # RF-13 — Unicidad bajo concurrencia
  Scenario: Dos registros simultáneos en la misma ciudad reciben códigos distintos
    Given que el evento "Feria de Innovación 2026" tiene el último código asignado en Cochabamba como "CB010"
    When dos invitados envían el formulario de registro exactamente al mismo tiempo en "Cochabamba"
    Then un invitado recibe el código "CB011"
    And el otro invitado recibe el código "CB012"
    And ningún código se repite

  Scenario: Dos operadores distintos registran nuevos invitados simultáneamente en la misma ciudad
    Given que los operadores "Operador1" y "Operador2" están activos en "Cochabamba" para el mismo evento
    And el último código de evento asignado en Cochabamba es "Evento-CB005"
    When ambos operadores registran un nuevo invitado exactamente al mismo tiempo
    Then un invitado recibe el código "Evento-CB006"
    And el otro invitado recibe el código "Evento-CB007"
    And ningún código se repite


# ────────────────────────────────────────────────────────────
# MÓDULO 4: DASHBOARD PRINCIPAL
# ────────────────────────────────────────────────────────────

Feature: Dashboard Principal

  Background:
    Given que el usuario ha iniciado sesión con perfil "Administrador"

  # RF-14 — Resumen del evento
  Scenario: El dashboard muestra métricas correctas de un evento activo
    Given que el evento "Feria de Innovación 2026" tiene los siguientes datos:
      | métrica                            | valor |
      | Pre-registros totales              | 200   |
      | Pre-registros en Cochabamba        | 120   |
      | Pre-registros en Santa Cruz        | 80    |
      | Presentes el día del evento        | 95    |
      | Nuevos registros el día del evento | 15    |
    When el administrador accede al dashboard del evento
    Then el dashboard muestra todos los valores correctamente por ciudad y en total

  Scenario: El dashboard muestra los días restantes para el cierre de registro
    Given que el evento "Feria de Innovación 2026" cierra el registro el "10/09/2026"
    And la fecha actual es "01/09/2026"
    When el administrador accede al dashboard del evento
    Then el dashboard muestra "9 días restantes para el cierre de registro"

  Scenario: El dashboard indica cuando el registro ya está cerrado
    Given que el cierre de registro del evento fue el "10/09/2026"
    And la fecha actual es "15/09/2026"
    When el administrador accede al dashboard del evento
    Then el dashboard muestra el indicador "Registro cerrado"

  # RF-15 — Etiquetas visuales en el listado de asistentes
  Scenario: El listado de asistentes distingue visualmente el tipo de registro
    Given que el evento "Feria de Innovación 2026" tiene invitados de ambos tipos
    When el administrador accede al listado completo de asistentes
    Then los invitados con pre-registro muestran la etiqueta "Pre-registrado"
    And los invitados registrados el día del evento muestran la etiqueta "Registrado en evento"


# ────────────────────────────────────────────────────────────
# MÓDULO 5: CONTROL DE ASISTENCIA (DÍA DEL EVENTO)
# ────────────────────────────────────────────────────────────

Feature: Control de Asistencia

  Background:
    Given que el usuario ha iniciado sesión con perfil "Control de Asistencia"
    And el operador tiene asignado el evento "Feria de Innovación 2026"

  # RF-16 — Búsqueda de invitados
  Scenario: Operador encuentra un invitado buscando por código único
    Given que el invitado "Juan Pérez López" tiene el código "CB005"
    When el operador escribe "CB005" en el buscador
    Then el sistema muestra a "Juan Pérez López" con estado "Registrado"

  Scenario: Operador encuentra un invitado buscando por nombre parcial
    Given que existen invitados con nombres que contienen "Pérez" en el evento
    When el operador escribe "Pérez" en el buscador
    Then el sistema muestra todos los invitados cuyo nombre contiene "Pérez"

  Scenario: Operador encuentra un invitado buscando por número de celular
    Given que el invitado "Ana Mamani" tiene el celular "71122334"
    When el operador escribe "71122334" en el buscador
    Then el sistema muestra a "Ana Mamani" con su código y estado

  Scenario: El buscador no retorna resultados cuando no hay coincidencias
    When el operador busca "XYZ999" y no existe ningún invitado con ese valor
    Then el sistema muestra el mensaje "No se encontraron invitados con ese criterio de búsqueda"

  # RF-17 — Marcado de asistencia
  Scenario: Operador marca la asistencia de un invitado pre-registrado
    Given que el invitado "Juan Pérez López" tiene estado "Registrado"
    When el operador selecciona a "Juan Pérez López" en los resultados de búsqueda
    And hace clic en "Marcar como presente"
    And confirma la acción
    Then el estado del invitado cambia a "Presente"
    And el cambio se refleja inmediatamente en la vista de todos los operadores conectados

  # RN-04 — El cambio de estado es unidireccional
  Scenario: Un invitado marcado como presente no puede volver al estado registrado
    Given que el invitado "Juan Pérez López" tiene estado "Presente"
    When el operador accede al perfil de "Juan Pérez López"
    Then el sistema no muestra la opción de cambiar el estado a "Registrado"

  # RF-18 — Registro de nuevos invitados el día del evento
  Scenario: Operador registra un nuevo invitado que no realizó pre-registro
    When el operador selecciona la opción "Registrar nuevo invitado"
    And completa el formulario con:
      | campo                   | valor            |
      | Nombre completo         | María Flores     |
      | Número de celular       | 72233445         |
      | Código de cliente       | CLI-1234         |
      | Ciudad                  | Cochabamba       |
      | Consentimiento de datos | marcado          |
    And hace clic en "Registrar"
    Then el sistema crea el registro de "María Flores"
    And le asigna el código "Evento-CB001" (o el siguiente correlativo disponible)
    And el estado queda como "Presente"
    And el tipo de registro queda marcado como "Registrado en evento"

  # RF-19 — Sincronización entre operadores
  Scenario: Los cambios de un operador se reflejan en tiempo real para los demás operadores
    Given que los operadores "Operador1" y "Operador2" están activos en el mismo evento
    When "Operador1" marca como "Presente" al invitado "Carlos Torres" (código "CB010")
    Then "Operador2" ve el estado de "Carlos Torres" actualizado a "Presente" sin recargar la página
    And el perfil "Visualización en Vivo" también refleja el cambio de inmediato

  Scenario: Operador intenta buscar un evento que no le fue asignado
    Given que el operador "Operador1" solo tiene asignado el evento "Feria de Innovación 2026"
    When intenta acceder al evento "Lanzamiento de Producto Q3"
    Then el sistema muestra el mensaje "No tienes acceso a este evento"
    And no muestra ningún dato del evento "Lanzamiento de Producto Q3"

# ────────────────────────────────────────────────────────────
# MÓDULO 6: VISUALIZACIÓN EN VIVO
# ────────────────────────────────────────────────────────────

Feature: Visualización en Vivo

  Background:
    Given que el usuario ha iniciado sesión con perfil "Visualización en Vivo"
    And el perfil tiene asignado el evento "Feria de Innovación 2026"

  # RF-20 — Panel en tiempo real
  Scenario: El panel muestra las métricas por ciudad en tiempo real
    Given que el evento "Feria de Innovación 2026" tiene los siguientes datos actuales:
      | ciudad      | pre-registrados | presentes | registrados en evento |
      | Cochabamba  | 120             | 85        | 10                    |
      | Santa Cruz  | 80              | 60        | 5                     |
    When el perfil accede al panel de Visualización en Vivo
    Then el panel muestra las métricas de cada ciudad correctamente

  Scenario: El panel se actualiza automáticamente al registrar una nueva presencia
    Given que el panel de Visualización en Vivo está abierto
    And Cochabamba muestra 85 presentes
    When un operador marca a un nuevo invitado como "Presente" en Cochabamba
    Then el panel actualiza automáticamente el contador de Cochabamba a 86 sin recargar la página

  Scenario: El perfil de Visualización en Vivo no puede realizar ninguna acción de escritura
    When el perfil intenta marcar un invitado como "Presente"
    Then el sistema no muestra ninguna opción de escritura o modificación
    And todos los controles del panel son de solo lectura

  Scenario: El perfil de Visualización en Vivo no puede ver datos personales individuales
    When el perfil intenta acceder al listado detallado de invitados con datos personales
    Then el sistema no muestra nombres, celulares ni códigos de cliente individuales
    And solo muestra métricas agregadas por ciudad

  Scenario: Visualización en Vivo no puede acceder a eventos no asignados
    Given que el perfil solo tiene asignado el evento "Feria de Innovación 2026"
    When intenta acceder al evento "Lanzamiento de Producto Q3"
    Then el sistema muestra el mensaje "No tienes acceso a este evento"


# ────────────────────────────────────────────────────────────
# MÓDULO 7: GESTIÓN DE USUARIOS Y PERFILES
# ────────────────────────────────────────────────────────────

Feature: Gestión de Usuarios y Perfiles

  Background:
    Given que el usuario ha iniciado sesión con perfil "Administrador"

  # RF-21 — Creación de perfiles
  Scenario Outline: El administrador crea un perfil de usuario de cualquier tipo
    When el administrador crea un nuevo perfil con:
      | campo              | valor         |
      | Nombre             | <nombre>      |
      | Correo electrónico | <correo>      |
      | Contraseña         | <contraseña>  |
      | Tipo de perfil     | <tipo>        |
    Then el perfil "<nombre>" queda creado con el rol "<tipo>"
    And el nuevo usuario puede iniciar sesión con sus credenciales

    Examples:
      | nombre        | correo                | contraseña | tipo                  |
      | Admin Junior  | admin2@empresa.com    | Segura123! | Administrador         |
      | Operador SCZ  | op.scz@empresa.com    | Segura123! | Control de Asistencia |
      | Gerente Zona  | gerente@empresa.com   | Segura123! | Visualización en Vivo |

  # RF-22 — Asignación de perfiles a eventos
  Scenario: El administrador asigna un operador a un evento específico
    Given que existe el operador "Operador SCZ" con perfil "Control de Asistencia"
    And existe el evento "Feria de Innovación 2026"
    When el administrador asigna "Operador SCZ" al evento "Feria de Innovación 2026"
    Then "Operador SCZ" puede acceder al evento "Feria de Innovación 2026"
    And no puede acceder a ningún otro evento no asignado

  Scenario: El administrador asigna un mismo operador a múltiples eventos
    Given que existe el operador "Operador1" con perfil "Control de Asistencia"
    When el administrador asigna "Operador1" a los eventos "Feria de Innovación 2026" y "Lanzamiento Q3"
    Then "Operador1" puede acceder a ambos eventos

  # RF-23 — Edición y eliminación de perfiles
  Scenario: El administrador edita los datos de un perfil existente
    Given que existe el perfil "Operador SCZ" con correo "op.scz@empresa.com"
    When el administrador cambia el correo a "nuevo.op@empresa.com"
    Then el perfil queda actualizado con el nuevo correo
    And los registros e historial del operador no se ven afectados

  Scenario: El administrador elimina un perfil sin afectar datos históricos
    Given que existe el perfil "Operador SCZ"
    And el operador realizó marcados de asistencia en eventos pasados
    When el administrador elimina el perfil "Operador SCZ"
    Then el perfil ya no puede iniciar sesión
    And los registros de asistencia marcados por ese operador permanecen intactos

  Scenario: Un perfil no administrador no puede crear ni modificar otros perfiles
    Given que el usuario tiene perfil "Control de Asistencia"
    When intenta acceder a la sección de gestión de usuarios
    Then el sistema muestra el mensaje "No tienes permiso para acceder a esta sección"


# ────────────────────────────────────────────────────────────
# MÓDULO 8: EXPORTACIÓN DE DATOS
# ────────────────────────────────────────────────────────────

Feature: Exportación de Datos

  Background:
    Given que el usuario ha iniciado sesión con perfil "Administrador"

  # RF-24 — Descarga de datos
  Scenario: El administrador descarga el listado de invitados en formato CSV
    Given que el evento "Feria de Innovación 2026" tiene 200 invitados registrados
    When el administrador selecciona la opción "Exportar" y elige el formato "CSV"
    Then el sistema genera y descarga un archivo CSV con los 200 registros
    And el archivo contiene las columnas: Nombre completo, Número de celular, Código de cliente, Código único, Ciudad, Fecha del evento, Tipo de registro, Estado, Fecha y hora de registro

  Scenario: El administrador descarga el listado de invitados en formato XLSX
    Given que el evento "Feria de Innovación 2026" tiene 200 invitados registrados
    When el administrador selecciona la opción "Exportar" y elige el formato "XLSX"
    Then el sistema genera y descarga un archivo XLSX con los 200 registros
    And el archivo contiene las mismas columnas que la exportación CSV

  Scenario: La exportación incluye tanto pre-registros como registros del día del evento
    Given que el evento tiene 150 pre-registrados y 30 registrados el día del evento
    When el administrador exporta el listado completo
    Then el archivo exportado contiene 180 filas de datos
    And la columna "Tipo de registro" distingue "Pre-registrado" de "Registrado en evento"

  Scenario: Un perfil no administrador no puede exportar datos
    Given que el usuario tiene perfil "Control de Asistencia"
    When intenta acceder a la opción de exportación
    Then el sistema no muestra la opción de exportar
    And si accede por URL directa, el sistema devuelve el mensaje "No tienes permiso para realizar esta acción"

# ────────────────────────────────────────────────────────────
# MÓDULO 9: SEGURIDAD Y AUTENTICACIÓN
# ────────────────────────────────────────────────────────────

Feature: Seguridad y Autenticación

  Scenario: Un usuario accede al sistema con credenciales válidas
    Given que el usuario "admin@empresa.com" existe en el sistema con perfil "Administrador"
    When introduce su correo "admin@empresa.com" y su contraseña correcta
    And hace clic en "Iniciar sesión"
    Then el sistema le otorga acceso al panel de administración

  Scenario: El sistema rechaza credenciales inválidas
    When un usuario introduce credenciales incorrectas
    Then el sistema muestra el mensaje "Correo o contraseña incorrectos"
    And no otorga acceso al sistema

  Scenario: Un usuario no autenticado intenta acceder a una ruta protegida
    Given que el usuario no ha iniciado sesión
    When intenta acceder directamente a la URL del panel administrativo
    Then el sistema redirige al usuario a la pantalla de inicio de sesión

  Scenario: El sistema aplica control de acceso basado en roles (RBAC)
    Given que el usuario "op.scz@empresa.com" tiene perfil "Control de Asistencia"
    When intenta acceder a la sección de "Gestión de Eventos"
    Then el sistema le deniega el acceso
    And muestra el mensaje "No tienes permiso para acceder a esta sección"

  Scenario: El formulario público no puede enviarse sin consentimiento de datos
    Given que el invitado tiene el formulario visible
    When completa todos los campos pero no marca la casilla de consentimiento de datos
    And hace clic en "Registrarme"
    Then el sistema muestra el mensaje "Debe aceptar el uso de datos para continuar"
    And el formulario no se envía
