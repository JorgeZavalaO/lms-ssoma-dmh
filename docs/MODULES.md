# 📚 Módulos del Sistema

Este documento describe todos los módulos implementados en el LMS SSOMA DMH.

## Índice Rápido

- **Módulo K**: Certificados (Emisión y Verificación Pública)
- **Módulo J**: Reportes (Áreas, Curso, Cumplimiento)
- **Módulo I**: Notificaciones y Recordatorios
- **Módulo H**: Progreso y Cumplimiento
- **Módulo F**: Evaluaciones Automatizadas
- **Módulo E**: Inscripciones y Accesos
- **Módulo D**: Contenidos Interactivos
- **Módulo C**: Catálogo de Cursos
- **Módulo B**: Asignaciones y Rutas
- **Módulo A**: Usuarios y Autenticación

---

## 📜 Módulo K: Certificados (Emisión y Verificación Pública)

Estado: ✅ **100% Completado**

Sistema completo de emisión automática de certificados PDF con códigos de verificación únicos y QR codes, más verificación pública sin autenticación.

### K1. Emisión Automática de Certificados

**Propósito**: Generar certificados PDF profesionales al aprobar cursos.

**Características**:
- **Plantilla Profesional**:
  - Diseño landscape (A4 horizontal) con bordes dobles
  - Marca de agua "SSOMA" en segundo plano
  - Información completa: nombre, DNI, curso, nota, horas
  - QR code para verificación rápida
  - Código de verificación único de 16 caracteres
  - Número de certificado único
  - Fecha de emisión y vencimiento
  - Firma digital del responsable de SSOMA

- **Generación de PDF**:
  - Tecnología: `@react-pdf/renderer` 4.3.1
  - Estilos CSS-in-JS con StyleSheet
  - Renderizado server-side con `renderToBuffer()`
  - Template en React: `certificate-template.tsx`

- **Códigos de Verificación**:
  - Generación con `crypto.randomBytes(8)` → 16 chars hex uppercase
  - Únicos por certificado (índice único en BD)
  - QR code apunta a `/verify/[code]`
  - Espacio de búsqueda: 2^64 combinaciones

- **Almacenamiento**:
  - `pdfUrl`: URL del PDF generado
  - `verificationCode`: Código único indexado
  - `qrCode`: QR en base64
  - `pdfMetadata`: { size, generatedAt }

**API Endpoints**:
```
POST /api/certificates/generate
  Body: { certificationId: string }
  Auth: Solo ADMIN
  Response: { success, certificateId, verificationCode, pdfUrl }

GET /api/certificates/[id]/download
  Params: id (certification ID)
  Auth: Autenticado
  Response: PDF file con headers de descarga

GET /api/certificates
  Query: collaboratorId, courseId, isValid, hasVerificationCode, startDate, endDate
  Auth: Solo ADMIN
  Response: { certificates: Array, total: number }
```

**Flujo de Generación**:
1. Admin solicita generación desde `/admin/certificates`
2. POST a `/api/certificates/generate`
3. `getCertificateData()` obtiene datos del certificado
4. Genera `verificationCode` si no existe
5. Genera QR code con URL de verificación
6. Guarda código y QR en base de datos
7. `CertificateTemplate({ data })` crea estructura
8. `renderToBuffer()` genera PDF
9. Retorna PDF para descarga

**Archivo**: `src/lib/certificates.ts` (240 líneas)

---

### K2. Verificación Pública de Certificados

**Propósito**: Permitir verificación de autenticidad por terceros sin autenticación.

**Características**:
- **Acceso Público**:
  - Ruta: `/verify/[code]`
  - Sin autenticación requerida
  - Accesible por QR scan o ingreso manual

- **Estados Visuales**:
  - ✅ Verde: Certificado válido y vigente
  - ⚠️ Amarillo/Naranja: Certificado expirado
  - ❌ Rojo: Certificado no encontrado/inválido

- **Información Pública Mostrada** (datos mínimos):
  - Número de certificado
  - Nombre del colaborador (sin datos sensibles)
  - Nombre del curso
  - Fecha de emisión
  - Fecha de vencimiento (si aplica)
  - Duración del curso (horas)
  - Calificación obtenida (%)
  - Estado de validez actual

- **Validación de Vigencia**:
  - Verifica `isValid = true` en base de datos
  - Verifica `expiresAt >= now()` si aplica
  - Badge visual con estado del certificado

**API Endpoint**:
```
GET /api/certificates/verify/[code]
  Params: code (16 chars hex)
  Auth: Ninguna (público)
  Response: {
    valid: boolean,
    certificate: {
      certificateNumber, collaboratorName, courseName,
      issuedAt, expiresAt, courseHours, score, isValid
    }
  }
```

**Flujo de Verificación**:
1. Usuario escanea QR o ingresa código
2. Navegador abre `/verify/[code]`
3. GET a `/api/certificates/verify/[code]`
4. `verifyCertificate(code)` busca en BD
5. Valida `isValid && !isExpired`
6. Retorna datos públicos
7. Muestra página con estado visual

**Archivo**: `src/app/verify/[code]/page.tsx` (240 líneas)

---

### Página de Administración

**Ruta**: `/admin/certificates`

**Funcionalidades**:
- Listado de todos los certificados emitidos
- Tabla con: N° Certificado, Colaborador, Curso, Emisión, Estado
- Acciones disponibles:
  - **Generar**: Crea PDF si no existe código
  - **Descargar**: Descarga certificado generado
  - **Verificar**: Abre página de verificación pública
- Filtros por colaborador, curso, estado de validez
- Badges de estado (válido/inválido)

**Archivo**: `src/app/admin/certificates/page.tsx` (210 líneas)

---

### Schema de Base de Datos

**Extensión de `CertificationRecord`**:
```prisma
model CertificationRecord {
  // ... campos existentes ...
  pdfUrl            String?        // URL del PDF generado
  verificationCode  String?  @unique // Código único
  qrCode            String?        // QR en base64
  pdfMetadata       Json?          // { size, generatedAt }
}
```

**Migración**: `20251017060346_add_certificate_pdf_fields`

---

### Dependencias

**Producción**:
- `@react-pdf/renderer@4.3.1` - Generación de PDFs desde React
- `qrcode@1.5.4` - Generación de códigos QR

**Desarrollo**:
- `@types/qrcode@1.5.5` - Tipos TypeScript

---

### Seguridad

**Códigos Únicos**:
- Generación con `crypto.randomBytes` (seguro)
- Índice único en base de datos
- 16 caracteres hexadecimales (2^64 combinaciones)

**Datos Públicos**:
- Solo información mínima necesaria
- No expone email, dirección, teléfono, IDs internos
- Datos académicos contextuales únicamente

**Autorización**:
- Generación: Solo `ADMIN`
- Descarga: Usuarios autenticados
- Verificación: Público (by design)

---

### Métricas

**Líneas de Código**: 1,220 líneas totales
- `certificates.ts`: 240 líneas (service)
- `certificate-template.tsx`: 260 líneas (component)
- API routes: 235 líneas (4 endpoints)
- Pages: 450 líneas (2 páginas)
- Validations: 35 líneas (schemas)

**Archivos Creados**: 9 archivos
- 1 service layer
- 1 component (template PDF)
- 4 API routes
- 2 páginas (admin + verify)
- 1 validation file

---

## 📊 Módulo J: Reportes (Áreas, Curso, Cumplimiento)

Estado: ✅ **100% Completado**

Sistema completo de reportes analíticos, dashboards ejecutivos y matrices de cumplimiento SSOMA con visualizaciones interactivas.

### J1. Dashboard Ejecutivo

**Propósito**: Panel de control con KPIs en tiempo real para dirección ejecutiva.

**KPIs Principales**:
- Colaboradores activos vs total
- % Cumplimiento general por área
- Tasa de aprobación y promedio de evaluaciones
- Alertas críticas (vencidos + próximos 7/30 días)

**Visualizaciones**:
- Gráfico de barras: Cumplimiento por área
- Gráfico circular: Distribución de alertas por estado
- Gráfico de área: Tendencia de inscripciones (30 días)
- Gráfico de líneas: Tendencia de completaciones (30 días)
- Top 5 cursos críticos con contadores

**Filtros**: Rango temporal (7, 30, 90 días, todo), área, sede

**Endpoint**: `GET /api/reports/dashboard`

### J2. Reporte por Área

**Propósito**: Listado detallado de colaboradores con estado por curso.

**Columnas**:
- DNI, Nombre completo, Área, Puesto
- Curso asignado, Estado, Progreso (%), Calificación

**Filtros Avanzados**:
- Por área, sede, puesto, estado del curso
- Por curso específico, rango de fechas de inscripción

**Exportación**: XLSX, CSV, PDF (preparado)

**Endpoint**: `GET /api/reports/area`

### J3. Reporte por Curso

**Propósito**: Estadísticas detalladas de un curso específico.

**Métricas**:
- Total inscritos, Tasa de completación (%)
- Tasa de aprobación (%), Promedio de calificación
- Tiempo promedio de completación (minutos)

**Análisis**:
- Distribución de calificaciones en 5 rangos (0-20, 21-40, etc.)
- Distribución de estados (PASSED, IN_PROGRESS, FAILED, EXPIRED)
- Información de versión activa del curso

**Endpoint**: `GET /api/reports/course?courseId=...`

### J4. Reporte de Cumplimiento Legal/SSOMA

**Propósito**: Matriz de cumplimiento de cursos obligatorios con semáforo de vigencia.

**Semáforo**:
- 🟢 **Verde (COMPLIANT)**: Curso vigente y al día
- 🟡 **Amarillo (EXPIRING_SOON)**: Vence en ≤30 días
- 🔴 **Rojo (EXPIRED/NOT_ENROLLED)**: Vencido o no inscrito

**Matriz**:
- Filas: Colaboradores (nombre, área, puesto)
- Columnas: Cursos obligatorios (con validityMonths)
- Celdas: Icono + días hasta vencimiento

**Resumen**: Total colaboradores, Cumplen, Por vencer, Vencidos

**Endpoint**: `GET /api/reports/compliance`

### J5. Trazabilidad de Evaluaciones

**Propósito**: Historial completo de intentos de evaluación para auditorías.

**Campos de Auditoría**:
- Timestamp exacto (fecha y hora)
- DNI y nombre del colaborador
- Curso y evaluación
- Duración del intento (minutos y segundos)
- Calificación obtenida, Estado (COMPLETED/IN_PROGRESS/ABANDONED)
- Cantidad de respuestas registradas
- Dirección IP aproximada, User Agent

**Búsqueda**: Por DNI, nombre de colaborador o curso en tiempo real

**Información**: Política de retención y privacidad de datos

**Endpoint**: `GET /api/reports/audit-trail`

---

**Modelos de Datos**:
```prisma
Report           // Reportes generados con metadata
ReportSchedule   // Programación recurrente (DAILY/WEEKLY/etc)
ReportExecution  // Historial de ejecuciones programadas
KPISnapshot      // Snapshots históricos para análisis
```

**Enums**:
- `ReportType`: DASHBOARD, AREA, COURSE, COMPLIANCE, AUDIT_TRAIL
- `ReportFormat`: JSON, XLSX, CSV, PDF
- `ScheduleFrequency`: DAILY, WEEKLY, MONTHLY, QUARTERLY, CUSTOM

**APIs**:
- `GET /api/reports/dashboard` - KPIs ejecutivos
- `GET /api/reports/area` - Reporte por área
- `GET /api/reports/course` - Estadísticas por curso
- `GET /api/reports/compliance` - Matriz de cumplimiento
- `GET /api/reports/audit-trail` - Trazabilidad

**Servicios** (`src/lib/reports.ts`):
- `getDashboardKPIs()` - Calcula todos los KPIs en tiempo real
- `getAreaReport()` - Genera reporte por área
- `getCourseReport()` - Estadísticas de curso
- `getComplianceReport()` - Matriz con semáforo
- `getAuditTrail()` - Historial de intentos
- `createKPISnapshot()` - Snapshot histórico

**Componentes UI**:
- `src/app/reports/dashboard/page.tsx` - Dashboard con recharts
- `src/app/reports/area/page.tsx` - Tabla con filtros
- `src/app/reports/course/page.tsx` - Estadísticas y gráficos
- `src/app/reports/compliance/page.tsx` - Matriz semáforo
- `src/app/reports/audit-trail/page.tsx` - Historial auditoría

**Validaciones** (`src/validations/reports.ts`):
- DashboardFiltersSchema, AreaReportFiltersSchema
- CourseReportFiltersSchema, ComplianceReportFiltersSchema
- AuditTrailFiltersSchema, ExportReportSchema

**Dependencias**:
- `recharts` - Gráficos interactivos (BarChart, PieChart, AreaChart, LineChart)
- `date-fns` - Manejo de fechas y formatos
- shadcn/ui `chart` component - Wrapper con theming

**Migración**: `20251017051442_add_reports_module`

---

## 📬 Módulo I: Notificaciones y Recordatorios

Estado: ✅ **100% Completado**

Sistema completo de notificaciones por email y bandeja interna con plantillas editables y preferencias personalizables.

### I1. Email y Bandeja Interna

**Propósito**: Notificar eventos importantes y recordatorios automáticos.

**Eventos Soportados**:
- `NEW_ENROLLMENT`: Nueva asignación de curso
- `REMINDER_30_DAYS`: Recordatorio 30 días antes de vencimiento
- `REMINDER_7_DAYS`: Recordatorio 7 días antes de vencimiento
- `REMINDER_1_DAY`: Recordatorio 1 día antes de vencimiento
- `COURSE_FAILED`: Desaprobación de curso
- `CERTIFICATE_READY`: Certificado disponible
- `RECERTIFICATION_DUE`: Recertificación próxima
- `TEAM_SUMMARY`: Resumen semanal para jefes

**Características**:
- Plantillas editables con variables dinámicas (`{{collaboratorName}}`, `{{courseName}}`, etc.)
- Canales configurables: EMAIL, IN_APP, BOTH
- Prioridades: LOW, MEDIUM, HIGH, URGENT
- Preferencias opt-in/out por tipo de notificación
- Bandeja interna con marcadores de leído/archivado
- Contador de notificaciones no leídas en tiempo real

**Modelos**:
- `NotificationTemplate`: Plantillas editables por tipo
- `Notification`: Notificaciones individuales
- `NotificationPreference`: Preferencias de usuario
- `NotificationLog`: Histórico de envíos masivos

### I2. Recordatorios al Jefe

**Propósito**: Resumen semanal de pendientes del equipo para jefes de área.

**Características**:
- Generación automática de resúmenes por área
- Estadísticas del equipo: total colaboradores, cursos pendientes
- Alertas de cursos próximos a vencer (7 días)
- Envío programable por área o sede
- Formato HTML y texto plano

**Funcionalidades**:
- Generación manual desde admin
- Programación automática (preparado para cron jobs)
- Filtros por área/sede específica
- Log de envíos con métricas de éxito/fallo

### Endpoints del Módulo I

**Plantillas**:
```
GET    /api/notification-templates           - Listar plantillas
POST   /api/notification-templates           - Crear plantilla
GET    /api/notification-templates/[id]      - Obtener plantilla
PUT    /api/notification-templates/[id]      - Actualizar plantilla
DELETE /api/notification-templates/[id]      - Eliminar plantilla
```

**Notificaciones**:
```
GET    /api/notifications                    - Listar notificaciones
GET    /api/notifications/[id]               - Obtener notificación
PATCH  /api/notifications/[id]               - Marcar leída/archivada
DELETE /api/notifications/[id]               - Eliminar notificación
GET    /api/notifications/unread-count       - Contador no leídas
POST   /api/notifications/mark-all-read      - Marcar todas leídas
```

**Generación Automática**:
```
POST   /api/notifications/generate           - Generar recordatorios vencimiento
PUT    /api/notifications/generate           - Generar resumen equipo
```

**Preferencias**:
```
GET    /api/notification-preferences         - Obtener preferencias
PUT    /api/notification-preferences         - Actualizar preferencia
```

### Componentes UI

**Archivo**: `src/components/notifications/notification-bell.tsx`
- Icono de campana con badge de contador
- Dropdown con últimas 10 notificaciones
- Marcar como leída al hacer clic
- Link a página completa de notificaciones
- Actualización automática cada 30 segundos

**Páginas**:
- `/notifications`: Vista completa con tabs (Todas/No Leídas/Archivadas)
- `/admin/notification-templates`: Gestión de plantillas (Admin/SuperAdmin)

### Validaciones

**Archivo**: `src/validations/notifications.ts`

Schemas:
- `CreateNotificationTemplateSchema`: Validación de plantillas
- `UpdateNotificationTemplateSchema`: Actualización parcial
- `CreateNotificationSchema`: Notificación individual
- `UpdateNotificationSchema`: Actualizar estado
- `UpdateNotificationPreferenceSchema`: Preferencias
- `SendBulkNotificationSchema`: Envío masivo
- `GenerateExpirationRemindersSchema`: Recordatorios vencimiento
- `GenerateTeamSummarySchema`: Resumen para jefes

### Servicio de Notificaciones

**Archivo**: `src/lib/notifications.ts`

Funciones principales:
- `createNotification()`: Crear notificación individual
- `createNotificationFromTemplate()`: Crear desde plantilla con variables
- `generateExpirationReminders()`: Generar recordatorios de vencimiento
- `generateTeamSummary()`: Generar resumen para jefes
- `markNotificationAsRead()`: Marcar como leída
- `markAllNotificationsAsRead()`: Marcar todas
- `archiveNotification()`: Archivar
- `getUnreadNotifications()`: Obtener no leídas
- `countUnreadNotifications()`: Contar no leídas

### Integración con Eventos

Eventos que disparan notificaciones automáticas:
1. **Nueva Inscripción** → `NEW_ENROLLMENT`
2. **Curso Desaprobado** → `COURSE_FAILED`
3. **Certificado Generado** → `CERTIFICATE_READY`
4. **Curso Próximo a Vencer** → `REMINDER_30_DAYS`, `REMINDER_7_DAYS`, `REMINDER_1_DAY`
5. **Recertificación Próxima** → `RECERTIFICATION_DUE`

### Programación de Recordatorios

**Recomendación**: Configurar cron jobs o Vercel Cron para ejecutar:

```typescript
// Recordatorios de vencimiento
// Ejecutar diariamente a las 8:00 AM
POST /api/notifications/generate
{
  "daysBeforeExpiration": 30,
  "notificationType": "REMINDER_30_DAYS"
}

// Resumen semanal para jefes
// Ejecutar cada lunes a las 9:00 AM
PUT /api/notifications/generate
{
  "sendEmail": true
}
```

### Variables Disponibles en Plantillas

- `{{collaboratorName}}`: Nombre del colaborador
- `{{courseName}}`: Nombre del curso
- `{{courseCode}}`: Código del curso
- `{{dueDate}}`: Fecha de vencimiento
- `{{daysRemaining}}`: Días restantes
- `{{score}}`: Puntuación obtenida
- `{{certificateNumber}}`: Número de certificado

---

## 📊 Módulo H: Progreso y Cumplimiento

Estado: ✅ **100% Completado**

### E1: Asignación Automática por Perfil

**Propósito**: Inscribir automáticamente colaboradores en cursos según su sede/área/puesto.

**Componentes**:
- Modelo `EnrollmentRule`: Define criterios (courseId, siteId, areaId, positionId)
- Servicio `applyAutoEnrollmentRules()`: Busca reglas coincidentes y crea inscripciones
- UI: `/admin/enrollment-rules` - Gestión CRUD de reglas

**Endpoints**:
```
GET    /api/enrollment-rules          - Listar todas las reglas
POST   /api/enrollment-rules          - Crear nueva regla
GET    /api/enrollment-rules/[id]     - Obtener regla específica
PUT    /api/enrollment-rules/[id]     - Actualizar regla
DELETE /api/enrollment-rules/[id]     - Eliminar regla
```

**Archivo**: `src/app/api/enrollment-rules/route.ts`

---

### E2.1: Inscripción Individual Manual

**Propósito**: Inscribir uno o más colaboradores específicos en un curso.

**Componentes**:
- Modal: `EnrollIndividualDialog`
- Selección múltiple de colaboradores
- Validación: curso + mínimo 1 colaborador

**Endpoint**:
```
POST /api/enrollments
{
  "courseId": "string",
  "collaboratorIds": ["id1", "id2"],
  "notes": "string (opcional)"
}
```

**Archivo**: `src/app/api/enrollments/route.ts`

---

### E2.2: Inscripción Masiva por Filtros

**Propósito**: Inscribir múltiples colaboradores usando criterios de sede/área/puesto.

**Componentes**:
- Modal: `EnrollBulkDialog` (checkboxes de filtros)
- Validación: curso + mínimo 1 filtro
- Transacciones ACID para consistencia

**Endpoint**:
```
POST /api/enrollments/bulk
{
  "courseId": "string",
  "filters": {
    "siteIds": ["id1"],
    "areaIds": ["id2"],
    "positionIds": ["id3"]
  },
  "notes": "string (opcional)"
}
```

**Características**:
- Upsert: evita duplicados
- Transacción: todo o nada
- Retorna cantidad inscrita

**Archivo**: `src/app/api/enrollments/bulk/route.ts`

---

### E2: Gestión de Inscripciones

**UI**: `/admin/enrollments`
- Tabla de inscripciones con filtros
- Estados: PENDING, ACTIVE, COMPLETED, CANCELLED
- Tipos: MANUAL, AUTOMATIC
- Eliminar inscripciones individuales

**Endpoints de Inscripciones**:
```
GET    /api/enrollments               - Listar todas
POST   /api/enrollments               - Crear individual/masiva
GET    /api/enrollments/[id]          - Obtener una
PUT    /api/enrollments/[id]          - Actualizar
DELETE /api/enrollments/[id]          - Eliminar
POST   /api/enrollments/bulk          - Masiva por filtros
```

---

### Validaciones Zod

**Archivo**: `src/validations/enrollment.ts`

```typescript
EnrollmentRuleSchema          // Crear/actualizar regla
ManualEnrollmentSchema        // Inscripción individual
BulkEnrollmentSchema          // Inscripción masiva
UpdateEnrollmentSchema        // Actualizar inscripción
```

---

### Enums

```typescript
enum EnrollmentStatus {
  PENDING    // Recién inscrito
  ACTIVE     // Cursando
  COMPLETED  // Terminó
  CANCELLED  // Cancelado
}

enum EnrollmentType {
  AUTOMATIC  // Por regla E1
  MANUAL     // Por inscripción E2
}
```

---

## 📖 Módulo D: Contenidos Interactivos

Estado: ✅ **100% Completado**

### D1: Unidades y Lecciones

**Propósito**: Organizar contenido educativo en unidades y lecciones con multimedia.

**Modelos**:
- `Unit`: Unidad con título, descripción, orden
- `Lesson`: Lección con tipo y contenido

**Tipos de Lección**:
- VIDEO: URL YouTube/Vimeo
- PDF: Documento PDF
- PPT: Presentación PowerPoint
- HTML: Contenido HTML personalizado
- SCORM: Paquete SCORM

**Endpoints**:
```
GET    /api/courses/[courseId]/units
POST   /api/courses/[courseId]/units
GET    /api/units/[unitId]
PUT    /api/units/[unitId]
DELETE /api/units/[unitId]

GET    /api/units/[unitId]/lessons
POST   /api/units/[unitId]/lessons
GET    /api/lessons/[lessonId]
PUT    /api/lessons/[lessonId]
DELETE /api/lessons/[lessonId]
```

---

### D1: Progreso de Aprendizaje

**Propósito**: Tracking automático de % visto y completado.

**Modelo**: `LessonProgress`
- Porcentaje de vista
- Marca de completado (configurable por threshold)
- Timestamps

**Endpoint**:
```
GET    /api/lessons/[lessonId]/progress
PUT    /api/lessons/[lessonId]/progress
```

---

### D2: Repositorio de Archivos

**Propósito**: Almacenar archivos versio​nados con Vercel Blob.

**Modelo**: `FileRepository`
- URL en Blob (acceso público)
- Versionado de archivos
- Etiquetas para búsqueda
- Tipos: PDF, PPT, IMAGE, VIDEO, DOCUMENT, OTHER

**Endpoint**:
```
POST   /api/files              - Subir archivo
GET    /api/files              - Listar con filtros
```

**Límites**:
- 10MB por archivo
- Almacenamiento en Vercel Blob

---

### D3: Actividades Interactivas

**Propósito**: Crear ejercicios con contenido HTML y shadcn components.

**Modelo**: `InteractiveActivity`
- Contenido HTML personalizado
- Intentos máximos configurable
- Respuestas en JSON

**Modelo**: `ActivityAttempt`
- Registro de intentos
- Respuestas guardadas
- Puntuación opcional

**Endpoint**:
```
POST   /api/activities         - Crear
GET    /api/activities         - Listar con filtros
```

---

## 🛤️ Módulo C: Catálogo de Cursos

Estado: ✅ **100% Completado**

### Características

- **CRUD Completo**: Crear, leer, actualizar, eliminar cursos
- **Estados**: DRAFT, PUBLISHED, ARCHIVED
- **Modalidades**: ASYNCHRONOUS, SYNCHRONOUS, BLENDED
- **Campos**: Código, nombre, objetivo, duración, modalidad, vigencia, requisitos

### Versionado

Cada cambio significativo crea una nueva versión:
- Historial completo sin perder datos
- Visualización de versiones anteriores
- Rollback a versiones previas

### Endpoints

```
GET    /api/courses                   - Listar
POST   /api/courses                   - Crear
GET    /api/courses/assigned          - Cursos asignados al usuario
GET    /api/courses/[id]              - Obtener curso
PUT    /api/courses/[id]              - Actualizar
DELETE /api/courses/[id]              - Eliminar
```

---

## 🛣️ Módulo B: Rutas de Aprendizaje

Estado: ✅ **100% Completado**

### Características

- **Rutas**: Itinerarios ordenados de cursos
- **Prerequisitos**: Definir cursos que deben completarse antes
- **Cursos**: Obligatorios u opcionales
- **Orden**: Secuencia clara de aprendizaje

### Endpoints

```
GET    /api/learning-paths                 - Listar
POST   /api/learning-paths                 - Crear
GET    /api/learning-paths/[id]            - Obtener
PUT    /api/learning-paths/[id]            - Actualizar
DELETE /api/learning-paths/[id]            - Eliminar

GET    /api/learning-paths/[id]/courses    - Cursos en ruta
POST   /api/learning-paths/[id]/courses    - Agregar curso
```

---

## 👥 Módulo A: Usuarios y Autenticación

Estado: ✅ **100% Completado**

### Autenticación

- NextAuth v5 con JWT
- Proveedores: Credentials, OAuth (configurable)
- Sesiones seguras

### Roles

```
SUPERADMIN     - Acceso total
ADMIN          - Gestión de contenido
COLLABORATOR   - Acceso estudiante
```

### Endpoints

```
POST   /api/auth/[...nextauth]        - Autenticación
POST   /api/register                  - Registro
GET    /api/users/[id]/role           - Obtener rol
PUT    /api/users/[id]/role           - Cambiar rol
```

---

## 🏢 Gestión Organizacional

### Colaboradores

```
GET    /api/collaborators             - Listar
POST   /api/collaborators             - Crear
POST   /api/collaborators/import      - Importar CSV/XLSX
GET    /api/collaborators/[id]        - Obtener
PUT    /api/collaborators/[id]        - Actualizar
DELETE /api/collaborators/[id]        - Eliminar
```

**Campos**: DNI, nombre completo, email, sede, área, puesto, fecha entrada

### Áreas

```
GET    /api/areas                     - Listar
POST   /api/areas                     - Crear
GET    /api/areas/[id]                - Obtener
PUT    /api/areas/[id]                - Actualizar
DELETE /api/areas/[id]                - Eliminar
PUT    /api/areas/[id]/head           - Asignar jefe
```

### Puestos

```
GET    /api/positions                 - Listar
POST   /api/positions                 - Crear
GET    /api/positions/[id]            - Obtener
PUT    /api/positions/[id]            - Actualizar
DELETE /api/positions/[id]            - Eliminar
```

### Sedes

```
GET    /api/sites                     - Listar
POST   /api/sites                     - Crear
GET    /api/sites/[id]                - Obtener
PUT    /api/sites/[id]                - Actualizar
DELETE /api/sites/[id]                - Eliminar
```

---

## 📊 Relaciones de Datos

```
Course
├─ enrollmentRules (E1)
├─ enrollments (E2)
├─ units (D1)
├─ courseVersions (C)
└─ learningPathCourses (B)

Collaborator
├─ enrollments (E)
├─ area
├─ position
├─ site
└─ assignmentHistory

LearningPath
└─ learningPathCourses
   ├─ course
   └─ prerequisite

Unit
└─ lessons

Lesson
└─ progress

Quiz
├─ quizQuestions
└─ attempts

Question
├─ options
└─ quizQuestions

QuizAttempt
└─ quiz
```

---

## Módulo F — Evaluaciones Automatizadas

Sistema completo de evaluaciones con banco de preguntas, cuestionarios, calificación automática y remediación.

### F1. Banco de Preguntas

**Modelo**: `Question`

Tipos de preguntas soportados:
- `SINGLE_CHOICE`: Opción múltiple (una correcta)
- `MULTIPLE_CHOICE`: Opción múltiple (varias correctas)
- `TRUE_FALSE`: Verdadero/Falso
- `ORDER`: Ordenar elementos en secuencia
- `FILL_BLANK`: Completar espacios en blanco

Características:
- Metadatos: tema, dificultad (1-10), índice de discriminación
- Feedback personalizado por respuesta correcta/incorrecta
- Explicaciones detalladas para cada pregunta
- Relación con versión de curso (`courseVersionId`)
- Opciones de respuesta ordenadas (`QuestionOption`)

### F2. Cuestionarios

**Modelo**: `Quiz`

Parámetros configurables:
- `passingScore`: Nota mínima para aprobar (%)
- `maxAttempts`: Número máximo de intentos (null = ilimitado)
- `timeLimit`: Tiempo límite en minutos (null = sin límite)
- `shuffleQuestions`: Aleatorizar orden de preguntas
- `shuffleOptions`: Aleatorizar orden de opciones
- `questionsPerAttempt`: Subset de preguntas por intento

Políticas de visualización:
- `showCorrectAnswers`: Mostrar respuestas correctas tras envío
- `showFeedback`: Mostrar feedback de preguntas
- `showScoreImmediately`: Mostrar puntuación al instante

Estados:
- `DRAFT`: Borrador (editable, no disponible para estudiantes)
- `PUBLISHED`: Publicado (disponible para intentos)
- `ARCHIVED`: Archivado (histórico, no disponible)

### F3. Intentos y Calificación

**Modelo**: `QuizAttempt`

Estados de intentos:
- `IN_PROGRESS`: En progreso (iniciado, no enviado)
- `SUBMITTED`: Enviado (pendiente calificación)
- `GRADED`: Calificado
- `PASSED`: Aprobado (score >= passingScore)
- `FAILED`: Reprobado (score < passingScore)

Características:
- Tracking de tiempo empleado en segundos
- Respuestas almacenadas en JSON
- Cálculo automático de score y puntos
- Validación de límite de intentos
- Validación de remediación completada

### F4. Reintentos y Remediación

Criterios:
- Si `status === FAILED`, se marca `requiresRemediation = true`
- Bloqueo de nuevo intento hasta que `remediationCompleted = true`
- Contenido de refuerzo opcional (`remediationContent`)
- Endpoint dedicado para marcar remediación completada

### F5. Banco por Versión

Características:
- Campo `courseVersionId` en `Question` para relacionar preguntas con versiones
- Pool de preguntas específico por versión de curso
- Métricas almacenadas: `difficulty`, `discriminationIndex`
- Preparado para análisis psicométrico

### Endpoints del Módulo F

**Preguntas**:
```
GET    /api/questions                 - Listar preguntas (con filtros)
POST   /api/questions                 - Crear pregunta
GET    /api/questions/[id]            - Obtener pregunta
PUT    /api/questions/[id]            - Actualizar pregunta
DELETE /api/questions/[id]            - Eliminar pregunta
```

**Cuestionarios**:
```
GET    /api/quizzes                   - Listar cuestionarios
POST   /api/quizzes                   - Crear cuestionario
GET    /api/quizzes/[id]              - Obtener cuestionario
PUT    /api/quizzes/[id]              - Actualizar cuestionario
DELETE /api/quizzes/[id]              - Eliminar cuestionario
POST   /api/quizzes/[id]/attempt      - Iniciar intento
```

**Intentos**:
```
POST   /api/attempts/[id]/submit      - Enviar respuestas y calificar
GET    /api/attempts/[id]             - Obtener resultado de intento
POST   /api/attempts/[id]/remediation - Marcar remediación completada
```

### Validaciones del Módulo F

**Archivo**: `src/validations/quiz.ts`

Schemas:
- `QuestionTypeSchema`: Enum de tipos de pregunta
- `QuizStatusSchema`: Enum de estados de quiz
- `AttemptStatusSchema`: Enum de estados de intento
- `CreateQuestionSchema`: Validación de pregunta con opciones
  - Verifica número de opciones según tipo
  - Verifica número de respuestas correctas
- `CreateQuizSchema`: Validación de cuestionario con parámetros
- `SubmitQuizAttemptSchema`: Validación de respuestas
- `CompleteRemediationSchema`: Validación de remediación

### Enums del Módulo F

```typescript
enum QuestionType {
  SINGLE_CHOICE
  MULTIPLE_CHOICE
  TRUE_FALSE
  ORDER
  FILL_BLANK
}

enum QuizStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum AttemptStatus {
  IN_PROGRESS
  SUBMITTED
  GRADED
  PASSED
  FAILED
}
```

---

## 🔑 Resumen de Endpoints

**Total**: 68+ endpoints RESTful

- Autenticación & Usuarios: 5
- Colaboradores: 7
- Áreas: 6
- Puestos: 5
- Sedes: 5
- Cursos: 6
- Módulo C (Versiones): Incluido en cursos
- Módulo B (Rutas): 7
- Módulo D (Contenidos): 14
- Módulo E (Inscripciones): 8
- Módulo F (Evaluaciones): 8
- Administrativo: Varios

---

## 📝 Validación de Datos

**Archivo**: `src/validations/`

Todos los endpoints usan validación Zod para:
- Tipado seguro
- Errores claros
- Generación automática de tipos TypeScript

---

## 🔐 Seguridad

- ✅ Autenticación NextAuth requerida
- ✅ Autorización por rol
- ✅ Validación Zod en servidor
- ✅ CSRF protection automático
- ✅ Transacciones ACID (Prisma)
- ✅ Roles verificados en endpoints

---

## 🎨 Componentes UI (shadcn/ui)

Utilizados en toda la aplicación:
- Dialog, Form, Input, Select, Button
- Table, Badge, Card, Textarea
- Checkbox, Alert, Accordion
- Toast (Sonner)

---

Última actualización: 2025-10-16
