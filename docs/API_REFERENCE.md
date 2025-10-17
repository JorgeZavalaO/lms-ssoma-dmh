# 🔌 Referencia de API

Documentación de todos los endpoints del LMS SSOMA DMH.

## Tabla de Contenidos

- [Autenticación](#autenticación)
- [Notificaciones (I)](#módulo-i-notificaciones)
- [Colaboradores](#colaboradores)
- [Organización](#organización)
- [Cursos (C)](#módulo-c-cursos)
- [Contenidos (D)](#módulo-d-contenidos)
- [Rutas (B)](#módulo-b-rutas)
- [Inscripciones (E)](#módulo-e-inscripciones)
- [Evaluaciones (F)](#módulo-f-evaluaciones)

---

## Autenticación

### Login
```
POST /api/auth/[...nextauth]
```

### Register
```
POST /api/register
```

### Get User Role
```
GET /api/users/[id]/role
```

### Update User Role
```
PUT /api/users/[id]/role
Authorization: Requerido (ADMIN/SUPERADMIN)
```

---

## Módulo I: Notificaciones

### 📧 Plantillas de Notificación

#### Listar Plantillas
```
GET /api/notification-templates
Authorization: ADMIN/SUPERADMIN
```

**Response**:
```json
[{
  "id": "string",
  "type": "NEW_ENROLLMENT | REMINDER_30_DAYS | REMINDER_7_DAYS | REMINDER_1_DAY | COURSE_FAILED | CERTIFICATE_READY | RECERTIFICATION_DUE | TEAM_SUMMARY",
  "name": "string",
  "subject": "string",
  "htmlBody": "string",
  "textBody": "string",
  "channel": "EMAIL | IN_APP | BOTH",
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "isActive": true,
  "createdAt": "ISO DateTime",
  "updatedAt": "ISO DateTime",
  "updatedBy": "userId"
}]
```

---

#### Crear Plantilla
```
POST /api/notification-templates
Authorization: ADMIN/SUPERADMIN
Content-Type: application/json

{
  "type": "NEW_ENROLLMENT",
  "name": "Bienvenida al Curso",
  "subject": "Bienvenido a {{courseName}}",
  "htmlBody": "<p>Hola {{collaboratorName}}, ...</p>",
  "textBody": "Hola {{collaboratorName}}, ...",
  "channel": "BOTH",
  "priority": "MEDIUM",
  "isActive": true
}
```

**Variables disponibles**:
- `{{collaboratorName}}`, `{{collaboratorEmail}}`
- `{{courseName}}`, `{{courseCode}}`
- `{{expirationDate}}`, `{{daysRemaining}}`
- `{{attemptScore}}`, `{{passingScore}}`
- `{{certificateUrl}}`
- `{{managerName}}`, `{{areaName}}`
- `{{totalCollaborators}}`, `{{expiringCount}}`

---

#### Obtener Plantilla
```
GET /api/notification-templates/[id]
Authorization: ADMIN/SUPERADMIN
```

---

#### Actualizar Plantilla
```
PUT /api/notification-templates/[id]
Authorization: ADMIN/SUPERADMIN
Content-Type: application/json

{
  "name": "string (opcional)",
  "subject": "string (opcional)",
  "htmlBody": "string (opcional)",
  "textBody": "string (opcional)",
  "channel": "EMAIL | IN_APP | BOTH (opcional)",
  "priority": "LOW | MEDIUM | HIGH | URGENT (opcional)",
  "isActive": true (opcional)
}
```

---

#### Eliminar Plantilla
```
DELETE /api/notification-templates/[id]
Authorization: ADMIN/SUPERADMIN
```

---

### 🔔 Notificaciones

#### Listar Notificaciones del Usuario
```
GET /api/notifications
Query: 
  - page (default: 1)
  - pageSize (default: 20)
  - isRead (true/false, opcional)
  - isArchived (true/false, opcional)
```

**Response**:
```json
{
  "notifications": [{
    "id": "string",
    "type": "NEW_ENROLLMENT",
    "title": "string",
    "message": "string",
    "htmlContent": "string (opcional)",
    "priority": "MEDIUM",
    "isRead": false,
    "isArchived": false,
    "metadata": { ... },
    "createdAt": "ISO DateTime"
  }],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

---

#### Crear Notificación
```
POST /api/notifications
Authorization: ADMIN/SUPERADMIN
Content-Type: application/json

{
  "collaboratorId": "string",
  "type": "NEW_ENROLLMENT",
  "title": "string",
  "message": "string",
  "htmlContent": "string (opcional)",
  "channel": "BOTH",
  "priority": "MEDIUM",
  "metadata": { ... }
}
```

---

#### Obtener Notificación
```
GET /api/notifications/[id]
```

---

#### Marcar como Leída
```
PUT /api/notifications/[id]
Content-Type: application/json

{
  "isRead": true
}
```

---

#### Archivar Notificación
```
PUT /api/notifications/[id]
Content-Type: application/json

{
  "isArchived": true
}
```

---

#### Eliminar Notificación
```
DELETE /api/notifications/[id]
```

---

#### Marcar Todas como Leídas
```
POST /api/notifications/mark-all-read
```

---

#### Contar No Leídas
```
GET /api/notifications/unread-count
```

**Response**:
```json
{
  "count": 5
}
```

---

#### Generar Recordatorios Automáticos
```
POST /api/notifications/generate
Authorization: ADMIN/SUPERADMIN
Content-Type: application/json

{
  "type": "expiration-reminders" | "team-summary",
  "days": 30 | 7 | 1 (solo para expiration-reminders),
  "managerId": "string" (solo para team-summary)
}
```

**Response**:
```json
{
  "success": true,
  "count": 15,
  "logId": "string"
}
```

---

### ⚙️ Preferencias de Notificación

#### Obtener Preferencias
```
GET /api/notification-preferences
```

**Response**:
```json
[{
  "id": "string",
  "notificationType": "NEW_ENROLLMENT",
  "emailEnabled": true,
  "inAppEnabled": true
}]
```

---

#### Actualizar Preferencias
```
PUT /api/notification-preferences
Content-Type: application/json

{
  "preferences": [{
    "notificationType": "NEW_ENROLLMENT",
    "emailEnabled": true,
    "inAppEnabled": false
  }]
}
```

---

## Colaboradores

### Listar Colaboradores
```
GET /api/collaborators
Query: status (opcional)
```

**Response**:
```json
[{
  "id": "string",
  "dni": "string",
  "fullName": "string",
  "email": "string",
  "site": { "id", "name" },
  "area": { "id", "name" },
  "position": { "id", "name" },
  "status": "ACTIVE | INACTIVE"
}]
```

---

### Crear Colaborador
```
POST /api/collaborators
Authorization: ADMIN/SUPERADMIN
Content-Type: application/json

{
  "dni": "string",
  "fullName": "string",
  "email": "string",
  "siteId": "string (opcional)",
  "areaId": "string (opcional)",
  "positionId": "string (opcional)",
  "entryDate": "ISO DateTime"
}
```

**Efecto Secundario**: Aplica automáticamente reglas E1 (E.1)

---

### Obtener Colaborador
```
GET /api/collaborators/[id]
```

---

### Actualizar Colaborador
```
PUT /api/collaborators/[id]
Authorization: ADMIN/SUPERADMIN
```

**Efecto Secundario**: Re-aplica reglas E1 si cambió sede/área/puesto

---

### Eliminar Colaborador
```
DELETE /api/collaborators/[id]
Authorization: ADMIN/SUPERADMIN
```

---

### Importar Colaboradores (CSV/XLSX)
```
POST /api/collaborators/import
Authorization: ADMIN/SUPERADMIN
Content-Type: multipart/form-data

{
  "file": File
}
```

**Formato CSV**:
```
DNI,FullName,Email,Site,Area,Position,EntryDate
12345678,Juan Pérez,juan@example.com,Sede Central,Admin,Gerente,2025-01-01
```

---

### Descargar Template
```
GET /api/collaborators/template
```

---

## Organización

### Áreas

**Listar**
```
GET /api/areas
```

**Crear**
```
POST /api/areas
{
  "name": "string",
  "code": "string (unique)"
}
```

**Actualizar**
```
PUT /api/areas/[id]
```

**Asignar Jefe de Área**
```
PUT /api/areas/[id]/head
{
  "collaboratorId": "string"
}
```

---

### Puestos

**Listar**
```
GET /api/positions
```

**Crear**
```
POST /api/positions
{
  "name": "string",
  "areaId": "string"
}
```

**Actualizar**
```
PUT /api/positions/[id]
```

---

### Sedes

**Listar**
```
GET /api/sites
```

**Crear**
```
POST /api/sites
{
  "name": "string",
  "code": "string (unique)"
}
```

**Actualizar**
```
PUT /api/sites/[id]
```

---

## Cursos

### Listar Cursos
```
GET /api/courses
Query: status (DRAFT, PUBLISHED, ARCHIVED)
```

---

### Crear Curso
```
POST /api/courses
Authorization: ADMIN/SUPERADMIN
{
  "code": "string (unique)",
  "name": "string",
  "description": "string (opcional)",
  "objective": "string (opcional)",
  "duration": "number (horas)",
  "modality": "ASYNCHRONOUS | SYNCHRONOUS | BLENDED",
  "validity": "number (meses)",
  "requirements": "string (opcional)"
}
```

---

### Obtener Curso
```
GET /api/courses/[id]
```

---

### Actualizar Curso
```
PUT /api/courses/[id]
Authorization: ADMIN/SUPERADMIN
```

**Nota**: Crea versión automáticamente si hay cambios

---

### Cursos Asignados al Usuario
```
GET /api/courses/assigned
```

---

### Asignar Curso a Colaboradores
```
POST /api/courses/[courseId]/assign
Authorization: ADMIN/SUPERADMIN
{
  "collaboratorIds": ["id1", "id2"]
}
```

---

## Módulo D: Contenidos

### Unidades

**Crear Unidad**
```
POST /api/courses/[courseId]/units
{
  "title": "string",
  "description": "string (opcional)",
  "order": "number"
}
```

**Obtener Unidad**
```
GET /api/units/[unitId]
```

**Actualizar**
```
PUT /api/units/[unitId]
```

---

### Lecciones

**Crear Lección**
```
POST /api/units/[unitId]/lessons
{
  "title": "string",
  "type": "VIDEO | PDF | PPT | HTML | SCORM",
  "order": "number",
  "videoUrl": "string (si VIDEO)",
  "fileUrl": "string (si PDF/PPT/SCORM)",
  "htmlContent": "string (si HTML)",
  "completionThreshold": "number (0-100, default 80)",
  "duration": "number (minutos, opcional)"
}
```

**Obtener**
```
GET /api/lessons/[lessonId]
```

---

### Progreso de Lecciones

**Obtener Progreso**
```
GET /api/lessons/[lessonId]/progress
```

**Actualizar Progreso**
```
PUT /api/lessons/[lessonId]/progress
{
  "viewPercentage": "number (0-100)",
  "completed": "boolean"
}
```

---

### Archivos

**Subir Archivo**
```
POST /api/files
Authorization: ADMIN/SUPERADMIN
Content-Type: multipart/form-data
{
  "file": File (max 10MB),
  "name": "string",
  "description": "string (opcional)",
  "fileType": "PDF | PPT | IMAGE | VIDEO | DOCUMENT | OTHER",
  "tags": "string[] (opcional)"
}
```

**Listar Archivos**
```
GET /api/files
Query: 
  - type (opcional)
  - tags (opcional, separado por comas)
  - search (opcional)
```

---

### Actividades Interactivas

**Crear Actividad**
```
POST /api/activities
Authorization: ADMIN/SUPERADMIN
{
  "title": "string",
  "description": "string (opcional)",
  "htmlContent": "string (HTML con componentes)",
  "maxAttempts": "number (opcional)",
  "courseId": "string (opcional)"
}
```

**Listar**
```
GET /api/activities
Query: courseId (opcional)
```

---

## Módulo B: Rutas

### Listar Rutas
```
GET /api/learning-paths
```

---

### Crear Ruta
```
POST /api/learning-paths
Authorization: ADMIN/SUPERADMIN
{
  "code": "string (unique)",
  "name": "string",
  "description": "string (opcional)"
}
```

---

### Agregar Curso a Ruta
```
POST /api/learning-paths/[pathId]/courses
{
  "courseId": "string",
  "order": "number",
  "isRequired": "boolean",
  "prerequisiteId": "string (opcional)"
}
```

---

### Listar Cursos en Ruta
```
GET /api/learning-paths/[pathId]/courses
```

---

## Módulo E: Inscripciones

### E1: Reglas de Inscripción Automática

**Listar Reglas**
```
GET /api/enrollment-rules
```

---

**Crear Regla**
```
POST /api/enrollment-rules
Authorization: ADMIN/SUPERADMIN
{
  "courseId": "string",
  "siteId": "string (opcional)",
  "areaId": "string (opcional)",
  "positionId": "string (opcional)"
}
```

**Al menos 1 criterio es obligatorio**

---

**Obtener Regla**
```
GET /api/enrollment-rules/[id]
```

---

**Actualizar Regla**
```
PUT /api/enrollment-rules/[id]
Authorization: ADMIN/SUPERADMIN
{
  "isActive": "boolean (opcional)"
}
```

---

**Eliminar Regla**
```
DELETE /api/enrollment-rules/[id]
Authorization: ADMIN/SUPERADMIN
```

---

### E2: Inscripciones Manuales

**Listar Inscripciones**
```
GET /api/enrollments
Query: courseId (opcional), type (MANUAL/AUTOMATIC)
```

**Response**:
```json
{
  "id": "string",
  "courseId": "string",
  "collaboratorId": "string",
  "type": "MANUAL | AUTOMATIC",
  "status": "PENDING | ACTIVE | COMPLETED | CANCELLED",
  "enrolledAt": "ISO DateTime",
  "enrolledBy": "string",
  "notes": "string (opcional)",
  "progressPercent": "number"
}
```

---

**Crear Inscripción Individual**
```
POST /api/enrollments
Authorization: ADMIN/SUPERADMIN
{
  "courseId": "string",
  "collaboratorIds": ["id1", "id2"],
  "notes": "string (opcional)"
}
```

---

**Crear Inscripción Masiva (por Filtros)**
```
POST /api/enrollments/bulk
Authorization: ADMIN/SUPERADMIN
{
  "courseId": "string",
  "filters": {
    "siteIds": ["id1"] (opcional),
    "areaIds": ["id2"] (opcional),
    "positionIds": ["id3"] (opcional)
  },
  "notes": "string (opcional)"
}
```

**Al menos 1 filtro es obligatorio**

**Response (201)**:
```json
{
  "message": "28 colaboradores inscritos exitosamente",
  "enrollments": [...]
}
```

---

**Obtener Inscripción**
```
GET /api/enrollments/[id]
```

---

**Actualizar Inscripción**
```
PUT /api/enrollments/[id]
Authorization: ADMIN/SUPERADMIN
{
  "status": "PENDING | ACTIVE | COMPLETED | CANCELLED",
  "progressPercent": "number (0-100)",
  "notes": "string (opcional)"
}
```

---

**Eliminar Inscripción**
```
DELETE /api/enrollments/[id]
Authorization: ADMIN/SUPERADMIN
```

---

## Códigos de Error

| Código | Descripción |
|--------|------------|
| 200 | OK |
| 201 | Creado |
| 400 | Bad Request (validación falla) |
| 401 | No autenticado |
| 403 | No autorizado |
| 404 | No encontrado |
| 500 | Error del servidor |

---

## Headers Requeridos

```
Content-Type: application/json
Authorization: Bearer {token} (en endpoints privados)
```

---

## Rate Limiting

No implementado actualmente. Sujeto a cambios en producción.

---

## Versionado de API

Actualmente v1 (sin prefijo de versión). Los cambios breaking se documentarán aquí.

---

Última actualización: 2025-10-16
