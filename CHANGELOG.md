# Changelog

Todos los cambios notables del proyecto LMS SSOMA DMH serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [2.0.0] - 2025-10-17

### Agregado - Dashboards Diferenciados por Rol (Octubre 17, 2025)

- **Dashboard Ejecutivo para ADMIN/SUPERADMIN** (`/admin/dashboard`)
  - 📊 4 KPIs principales: Colaboradores activos, Cursos publicados, Cumplimiento general (%), Alertas críticas
  - 📈 Gráfico de cumplimiento por área (BarChart con comportamiento interactivo)
  - 🥧 Distribución de estados de cursos (PieChart: Borrador, Publicado, Archivado)
  - 📉 Tendencia de inscripciones últimos 6 meses (LineChart)
  - 🏆 Top 5 áreas por cumplimiento con badges de rendimiento (verde/amarillo/rojo)
  - 🚨 Sección crítica: Alerta visual si hay alertas sin resolver
  - 👥 Colaboradores críticos: Top 5 con más alertas sin resolver
  - 🎯 Accesos rápidos: Gestión de colaboradores, cursos, reportes, inscripciones
  - Ubicación: `src/app/admin/dashboard/page.tsx` (345 líneas)
  - Servicio KPIs: `src/lib/admin-kpis.ts` (189 líneas)
  - Build: Ruta precompilada (○) en 7.2s, 73 rutas totales

- **Login Inteligente con Redirección por Rol**
  - Cambio en `src/app/(public)/login/page.tsx`
  - Detecta rol de usuario tras autenticación exitosa
  - Fetch dinámico de sesión para obtener rol
  - Redirecciona ADMIN/SUPERADMIN → `/admin/dashboard`
  - Redirecciona COLLABORATOR → `/dashboard`
  - Flujo fluido sin pasos adicionales

- **Agregado - Reorganización de Rutas y Arquitectura de Route Groups (Octubre 17, 2025)

- **Landing Page en la raíz (/)** - Diseño completamente renovado
  - Página pública accesible sin autenticación
  - Hero section con gradiente y CTAs destacados
  - Sección de características con 6 módulos: Cursos, Certificación, Reportes, Control, Alertas, Gestión de Equipo
  - Sección de beneficios con 4 ventajas principales
  - Sección de call-to-action con enlace de contacto
  - Footer con 4 columnas de enlaces y contacto
  - Diseño responsive mobile-first
  - Ubicación: `src/app/page.tsx`

- **Reorganización de rutas con Next.js Route Groups** - Arquitectura mejorada
  - **Grupo público `(public)/`**:
    - Layout sin sidebar, header ni footer (limpio y minimalista)
    - Rutas públicas: `/login`, `/register`
    - Ubicación: `src/app/(public)/`
  
  - **Grupo autenticado `(authenticated)/`**:
    - Layout con SidebarProvider, AppSidebar, AppHeader, AppFooter
    - Dashboard movido a `/dashboard` (antes en raíz `/`)
    - Todas las rutas protegidas por autenticación
    - Sidebar visible en todas las páginas de este grupo
    - Ubicación: `src/app/(authenticated)/`
  
  - **Layout jerárquico optimizado**:
    - Root layout (`src/app/layout.tsx`): SessionProvider + Toaster (mínimo)
    - Public layout: Passthrough mínimo (sin componentes extra)
    - Authenticated layout: SidebarProvider + componentes de navegación
    - Beneficios: Flexibilidad de layout, reutilización de componentes, mejor mantenibilidad

- **Dashboard reorganizado** - Movido a `/dashboard`
  - Ahora ubicado en `src/app/(authenticated)/dashboard/page.tsx`
  - KPIs dinámicos extraídos de base de datos
  - 4 tarjetas KPI: Completados, En progreso, Por vencer, Alertas
  - Gráfico de área con tendencia mensual de 6 meses
  - Card de próximos vencimientos con severidad
  - Quick links a funcionalidades clave
  - Barra de progreso del usuario
  - Saludo personalizado con avatar e iniciales
  - Accesible solo para usuarios autenticados

- **Pages/Rutas eliminadas (limpieza de estructura)**:
  - Eliminado: `src/app/dashboard/` (antiguo)
  - Eliminado: `src/app/login/` (movido a `(public)`)
  - Eliminado: `src/app/register/` (movido a `(public)`)
  - Eliminado: `src/app/(public)/landing/` (movido a raíz)
  - Eliminado: `src/app/(authenticated)/page.tsx` (conflicto resuelto)
  - Resultado: No hay duplicados, rutas limpias y organizadas

### Cambiado - Redirección post-login inteligente (Octubre 17, 2025)

- **Login detecta rol y redirige apropiadamente**
  - Cambio en `src/app/(public)/login/page.tsx`
  - Obtiene rol desde sesión tras autenticación exitosa
  - ADMIN/SUPERADMIN → `/admin/dashboard`
  - COLLABORATOR → `/dashboard`
  - UX mejorada sin pasos adicionales

- **Root layout simplificado** (`src/app/layout.tsx`)
  - Antes: SessionProvider + Toaster + SidebarProvider + componentes de navegación
  - Ahora: SessionProvider + Toaster solamente
  - Razón: Permite layouts diferentes por grupo de rutas

- **Login page sin sidebar** (`src/app/(public)/login/page.tsx`)
  - Diseño 2-columnas: formulario a la izquierda, imagen a la derecha
  - Sin componentes de navegación (sidebar/header/footer)
  - Tema limpio y enfocado en autenticación
  - Responsive: single column en mobile, 2-columns en desktop

- **Register page sin sidebar** (`src/app/(public)/register/page.tsx`)
  - Formulario de registro centrado en card
  - Sin componentes de navegación
  - Campos: nombre, email, contraseña
  - Integración con API de registro

### Técnico - Migraciones de Archivo y Build (Octubre 17, 2025)

- **Reorganización de estructura**:
  - Copiar landing de `(public)/landing/page.tsx` → `page.tsx` (raíz)
  - Crear layouts para cada grupo de rutas
  - Crear layout para `(authenticated)` con sidebar
  - Eliminar todas las páginas duplicadas

- **Build exitoso**:
  - Compilación: ✓ Exitosa en 8.4 segundos
  - Rutas generadas: 72 páginas totales
  - Errores críticos: Ninguno
  - Warnings: Solo ESLint no-blocking (no-explicit-any, img elements, unused imports)
  - Migraciones Prisma: Sin cambios pendientes

- **Validación de rutas**:
  - Verificado: `/` accesible sin autenticación (landing)
  - Verificado: `/login` accesible sin autenticación (sin sidebar)
  - Verificado: `/register` accesible sin autenticación (sin sidebar)
  - Verificado: `/dashboard` requiere autenticación (con sidebar)
  - Verificado: Todas las rutas bajo `(authenticated)` incluyen sidebar

### Beneficios de la Reorganización

- ✅ **Separación clara** entre áreas públicas y autenticadas
- ✅ **Flexibilidad de layouts** sin cambios en URLs
- ✅ **Mejor rendimiento** (cada grupo tiene su layout óptimo)
- ✅ **Mantenibilidad mejorada** (lógica centralizada en layouts)
- ✅ **UX consistente** (componentes reutilizables por contexto)
- ✅ **Escalabilidad** (fácil agregar nuevas áreas con layouts diferentes)

---

## [Unreleased]

### Agregado - Portal del Colaborador (Octubre 17, 2025)

- **Módulo de Evaluaciones para Colaboradores**:
  - Nueva página `/app/evaluations` con vista de todas las evaluaciones asignadas
  - 4 tabs de navegación: Disponibles, En Progreso, Aprobadas, Historial
  - Stat cards con información: Total, En Progreso, Aprobadas, Historial
  - Tarjetas de evaluación con: nombre, descripción, estado, intentos disponibles
  - Badges semánticos por estado (azul, amarillo, verde, gris)
  - Filtros por estado y búsqueda por nombre
  - Integración con archivo: `src/app/evaluations/page.tsx` (300+ líneas)
  - Componente reutilizable: `src/components/client-evaluations-view.tsx`
  - Build exitoso: 115 rutas generadas

- **Módulo de Certificados para Colaboradores**:
  - Nueva página `/app/my-certificates` para gestión de certificados personales
  - 3 tabs de navegación: Vigentes, Vencidos, Historial Completo
  - Stat cards: Total, Vigentes, Por Vencer, Vencidos
  - Validación de vigencia con umbral de 30 días:
    - 🟢 Vigente: Válido y expira en +30 días
    - 🟡 Por Vencer: Expira en 7-30 días
    - 🔴 Vencido: Expirado (<7 días desde vencimiento)
  - Tarjetas de certificado con: curso, versión, fecha emisión, estado
  - Acciones: Descargar PDF, Verificar (link público), Ver QR
  - Dialog modal para mostrar QR code
  - Integración con archivo: `src/app/my-certificates/page.tsx` (462 líneas)
  - Componente: `src/components/certificates-view.tsx`
  - Build exitoso: 117 rutas generadas

- **Módulo de Perfil para Colaboradores**:
  - Nueva página `/app/profile` para visualización de datos personales y organizacionales
  - Avatar personalizad con iniciales del colaborador
  - Sección de Información Personal: nombre, DNI, email, área, puesto, sede
  - Sección de Información Organizacional: ubicación del puesto, jefe directo
  - Modo edición: email editable, otros campos de solo lectura
  - Stat cards: ID Usuario, ID Colaborador, Antigüedad
  - Badge de estado: Activo/Inactivo
  - Integración con archivo: `src/app/profile/page.tsx` (325 líneas)
  - Build exitoso: 117 rutas generadas

- **Módulo de Notificaciones - Ampliación Octubre 2025**:
  - **Nueva página `/app/notifications/preferences`** (360 líneas):
    - Control granular de preferencias de notificaciones por tipo
    - 8 tipos de notificación configurables: Cursos, Evaluaciones, Certificados, Recordatorios, Gestión, Anuncios, Recordatorios Personales, Actualizaciones del Sistema
    - 2 canales por tipo: Email y En-App (cada uno con switch independiente)
    - 3 secciones organizadas: Cursos, Evaluaciones, Gestión de Equipo
    - Información sobre canales: correo electrónico, notificación en app, ambos
    - Advertencia informativa sobre notificaciones críticas (siempre activadas)
    - Botón "Guardar Cambios" que aparece solo cuando hay cambios pendientes
    - API endpoints: GET/PUT `/api/notification-preferences`
    - Estados: loading, saving, hasChanges
    - Toasts con confirmación de guardado exitoso
    - Build exitoso: 117 rutas generadas

  - **Mejoras a `/app/notifications/page.tsx`**:
    - Adición de 4 stat cards: Total, No Leídas, Leídas, Archivadas
    - Botón "Preferencias" que enlaza a `/notifications/preferences`
    - Función `getTypeIcon()` con iconos específicos por tipo de notificación
    - Iconografía: Bell (azul), Clock (naranja), AlertCircle (rojo), CheckCircle2 (verde), etc.
    - Mejora visual con renderización de iconos en cada notificación

- **Componente NotificationBadge en Sidebar**:
  - Nuevo componente `/src/components/notifications-badge.tsx` (41 líneas)
  - Badge rojo destructive con contador de notificaciones no leídas
  - Ubicación: lado derecho del ítem "Notificaciones" en sidebar (ml-auto)
  - Funcionalidades:
    - Carga inicial del contador al montar el componente
    - Auto-refresh automático cada 10 segundos (setInterval 10000ms)
    - Event listeners personalizados para actualizaciones instantáneas ("notificationUpdate")
    - Auto-oculta cuando el contador es 0
    - Muestra "99+" para contadores mayores a 99
  - API: GET `/api/notifications/unread-count`
  - Integración en `/src/components/sidebar/app-sidebar.tsx`
  - Estructura: Flex layout con NotificationsBadge posicionada a la derecha
  - Build exitoso: 117 rutas generadas

- **Actualización del Sidebar**:
  - Ampliación de links de navegación para colaboradores: 5 opciones totales
    - Cursos
    - Evaluaciones (NEW)
    - Certificados (NEW)
    - Notificaciones (con badge en tiempo real)
    - Perfil (NEW)
  - Integración visual consistente con shadcn/ui
  - Responsive design en mobile

### Cambiado - Documentación (Octubre 17, 2025)

- Documentación consolidada: solo `README.md` y `CHANGELOG.md` permanecen en la raíz; el resto se movió a `docs/`.
- `docs/README_DOCS.md` reescrito como índice conciso por perfiles de usuario.
- `docs/DOCUMENTATION_MANAGEMENT.md` actualizado (versión 1.1) con historial de reorganizaciones y lista vigente de archivos.
- Eliminados resúmenes transitorios (`DOCUMENTATION_REORGANIZATION_SUMMARY.md`, `DOCUMENTATION_CHANGES_SUMMARY.md`, `FINAL_SUMMARY.md`) tras integrar su contenido en los documentos permanentes.
- Limpieza de duplicados heredados (`DATOS_PRUEBA.md`, `SOLUCION_CURSOS_COLABORADOR.md`, `CORRECCION_PARAMS_ASYNC.md`, `VISTA_CURSO_COLABORADOR.md`).

---

## Unreleased

### Agregado

- **Módulo K - Certificados - COMPLETADO**:
  - **K1. Emisión Automática de Certificados PDF**:
    - Generación automática de certificados al aprobar cursos
    - Plantilla PDF profesional con @react-pdf/renderer:
      - Diseño landscape (A4 horizontal) con bordes dobles
      - Marca de agua "SSOMA" en segundo plano
      - Información completa: nombre, DNI, curso, nota, horas
      - QR code para verificación rápida
      - Código de verificación único de 16 caracteres
      - Número de certificado único
      - Fecha de emisión y vencimiento
      - Firma digital del responsable de SSOMA
    
    - API endpoints:
      - `POST /api/certificates/generate` - Genera PDF para una certificación
      - `GET /api/certificates/[id]/download` - Descarga PDF del certificado
      - `GET /api/certificates` - Lista certificados con filtros
    
    - Códigos de verificación únicos:
      - Generación con crypto.randomBytes (16 hex chars)
      - Únicos por certificado en base de datos
      - QR code apunta a `/verify/[code]`
    
    - Almacenamiento en base de datos:
      - URL del PDF generado
      - QR code en base64
      - Metadata (tamaño, fecha de generación)
      - Código de verificación indexado
  
  - **K2. Verificación Pública de Certificados**:
    - Página pública `/verify/[code]` sin autenticación
    - Verificación instantánea por código o escaneo QR
    - Diseño responsivo con estados visuales:
      - Verde: Certificado válido y vigente
      - Amarillo/Naranja: Certificado expirado
      - Rojo: Certificado no encontrado/inválido
    
    - Información pública mostrada:
      - Número de certificado
      - Nombre del colaborador (sin datos sensibles)
      - Nombre del curso
      - Fecha de emisión
      - Fecha de vencimiento (si aplica)
      - Duración del curso (horas)
      - Calificación obtenida (%)
      - Estado de validez actual
    
    - Validación de vigencia:
      - Verifica campo `isValid` en base de datos
      - Verifica fecha de expiración vs fecha actual
      - Badge visual con estado del certificado
    
    - API endpoint:
      - `GET /api/certificates/verify/[code]` - Verificación pública
  
  - **Página de Administración de Certificados**:
    - `/admin/certificates` - Panel de gestión
    - Listado completo de certificados emitidos
    - Tabla con información detallada
    - Acciones disponibles:
      - Generar PDF si no existe
      - Descargar PDF generado
      - Ver página de verificación pública
    - Filtros por colaborador, curso, estado de validez
    - Badges de estado (válido/inválido)
  
  - **Prisma Schema**:
    - Extensión del modelo `CertificationRecord`:
      - `pdfUrl String?` - URL del PDF generado
      - `verificationCode String? @unique` - Código único de verificación
      - `qrCode String?` - QR code en base64
      - `pdfMetadata Json?` - Metadata del PDF
    - Migración: `20251017060346_add_certificate_pdf_fields`
  
  - **Dependencias**:
    - `@react-pdf/renderer@4.3.1` - Generación de PDFs desde React
    - `qrcode@1.5.4` - Generación de códigos QR
    - `@types/qrcode@1.5.5` - Tipos para TypeScript
  
  - **Utilidades**:
    - `src/lib/certificates.ts` - Lógica de generación y verificación
    - `src/components/certificates/certificate-template.tsx` - Template PDF
    - `src/validations/certificates.ts` - Schemas Zod
  
  - **Seguridad**:
    - Generación de códigos únicos con crypto
    - Índice único en verificationCode
    - Verificación pública sin exponer datos sensibles
    - Solo admins pueden generar certificados
  
  - **UX/UI**:
    - Diseño profesional con gradientes y bordes
    - Estados visuales claros (verde/amarillo/rojo)
    - Responsive design para móviles
    - Iconos de Lucide React
    - Componentes shadcn/ui

- **Módulo J - Reportes (Áreas, Curso, Cumplimiento) - COMPLETADO**:
  - **J1. Dashboard Ejecutivo**:
    - KPIs en tiempo real:
      - % cumplimiento por área con gráficos de barras
      - Vencimientos próximos (7 y 30 días) con alertas visuales
      - Cursos más críticos con contadores de vencimientos
      - Intentos/promedios de evaluaciones
      - Tasa de aprobación y puntaje promedio
      - Usuarios activos en los últimos 30 días
    
    - Gráficos interactivos (recharts + shadcn/ui chart):
      - Cumplimiento por área (BarChart)
      - Distribución de alertas por estado (PieChart)
      - Tendencia de inscripciones (AreaChart)
      - Tendencia de completaciones (LineChart)
    
    - Filtros temporales: 7, 30, 90 días o todo el tiempo
    - Filtros por área y sede
    - Top 5 cursos críticos con desglose de vencimientos
    - 3 paneles de métricas adicionales
  
  - **J2. Reporte por Área**:
    - Listado detallado de colaboradores con estado por curso
    - Tabla con columnas: DNI, Nombre, Área, Puesto, Curso, Estado, Progreso, Calificación
    - Filtros avanzados:
      - Por área, sede, puesto
      - Por estado (ACTIVE, COMPLETED, IN_PROGRESS, EXPIRED, FAILED)
      - Por curso específico
      - Rango de fechas de inscripción
    - Badges de estado con colores semánticos
    - Contador de registros encontrados
    - Botón de exportación XLSX/CSV/PDF
    - API: `GET /api/reports/area` con filtros opcionales
  
  - **J3. Reporte por Curso**:
    - Selector de curso con generación bajo demanda
    - Estadísticas completas del curso:
      - Total de inscritos
      - Tasa de completación (%)
      - Tasa de aprobación (%)
      - Puntaje promedio
      - Tiempo promedio de completación
    - Gráfico de distribución de calificaciones (5 rangos: 0-20, 21-40, 41-60, 61-80, 81-100)
    - Gráfico circular de distribución de estados
    - Información de versión activa del curso
    - API: `GET /api/reports/course?courseId=...`
  
  - **J4. Reporte de Cumplimiento Legal/SSOMA**:
    - Matriz de cumplimiento con cursos obligatorios
    - Semáforo de vigencia (verde/amarillo/rojo):
      - Verde (✓): Cumple (vigente)
      - Amarillo (⏱): Por vencer ≤30 días
      - Rojo (⚠): Vencido o no inscrito
    - Contador de días hasta vencimiento
    - Resumen ejecutivo: Total colaboradores, Cumplen, Por vencer, Vencidos
    - Filtros por área, sede, puesto
    - Leyenda de iconos y estados
    - Tabla expandible con scroll horizontal
    - API: `GET /api/reports/compliance`
  
  - **J5. Trazabilidad de Evaluaciones**:
    - Historial completo de intentos de evaluación
    - Campos de auditoría:
      - Fecha y hora exacta (timestamp)
      - DNI y nombre del colaborador
      - Curso y evaluación realizados
      - Duración del intento (minutos y segundos)
      - Calificación obtenida
      - Estado del intento (COMPLETED, IN_PROGRESS, ABANDONED)
      - Cantidad de respuestas
      - Dirección IP aproximada
      - User Agent (navegador)
    - Búsqueda en tiempo real por DNI, nombre o curso
    - Contador de registros totales vs filtrados
    - Exportación CSV para auditorías
    - Información de retención y privacidad
    - API: `GET /api/reports/audit-trail` con múltiples filtros
  
  - **Modelos de datos (Prisma)**:
    - `Report`: Reportes generados con metadata y archivos
    - `ReportSchedule`: Programación de reportes recurrentes (DAILY, WEEKLY, MONTHLY, QUARTERLY, CUSTOM)
    - `ReportExecution`: Historial de ejecuciones programadas
    - `KPISnapshot`: Snapshots periódicos de KPIs para análisis histórico
    - Enums: `ReportType`, `ReportFormat`, `ScheduleFrequency`
  
  - **APIs de reportes (`src/app/api/reports/`)**:
    - `GET /api/reports/dashboard` - KPIs ejecutivos con filtros temporales y organizacionales
    - `GET /api/reports/area` - Reporte por área con filtros avanzados
    - `GET /api/reports/course` - Estadísticas detalladas por curso
    - `GET /api/reports/compliance` - Matriz de cumplimiento SSOMA
    - `GET /api/reports/audit-trail` - Trazabilidad de evaluaciones
  
  - **Servicios de negocio (`src/lib/reports.ts`)**:
    - `getDashboardKPIs()` - Calcula todos los KPIs en tiempo real
    - `getAreaReport()` - Genera reporte por área con joins optimizados
    - `getCourseReport()` - Estadísticas de curso con distribuciones
    - `getComplianceReport()` - Matriz de cumplimiento con semáforo
    - `getAuditTrail()` - Historial de intentos con metad

atos de auditoría
    - `createKPISnapshot()` - Crea snapshot histórico de KPIs
  
  - **Validaciones Zod (`src/validations/reports.ts`)**:
    - DashboardFiltersSchema, AreaReportFiltersSchema
    - CourseReportFiltersSchema, ComplianceReportFiltersSchema
    - AuditTrailFiltersSchema, ExportReportSchema
    - CreateReportScheduleSchema, UpdateReportScheduleSchema
  
  - **UI con shadcn/ui moderno**:
    - Componente `chart` instalado para gráficos
    - Cards con KPIs y métricas visuales
    - Tablas responsivas con scroll horizontal
    - Badges y iconos semánticos (lucide-react)
    - Selectores de rango temporal
    - Filtros dinámicos con estado React
    - Botones de exportación preparados
  
  - **Características adicionales**:
    - Integración con recharts para visualizaciones
    - date-fns para manejo de fechas y formatos
    - Soporte para exportación XLSX/CSV/PDF (preparado)
    - Cálculos de tendencias de 30 días
    - Agrupaciones por fecha para gráficos temporales
    - Porcentajes y promedios calculados en tiempo real
  
  - **Documentación**:
    - `docs/MODULE_J_STATUS.md`: Estado completo del módulo
    - Actualización de MODULES.md, README_DOCS.md, API_REFERENCE.md

- **Módulo I - Notificaciones y Recordatorios - COMPLETADO**:
  - **I1. Notificaciones por Email y Bandeja de Entrada**:
    - Sistema de plantillas de notificación (`NotificationTemplate`):
      - 8 tipos de evento: NEW_ENROLLMENT, REMINDER_30_DAYS, REMINDER_7_DAYS, REMINDER_1_DAY, COURSE_FAILED, CERTIFICATE_READY, RECERTIFICATION_DUE, TEAM_SUMMARY
      - Soporte para HTML y texto plano
      - Sistema de variables dinámicas: `{{collaboratorName}}`, `{{courseName}}`, `{{expirationDate}}`, etc.
      - 3 canales: EMAIL, IN_APP, BOTH
      - 4 niveles de prioridad: LOW, MEDIUM, HIGH, URGENT
      - Edición de plantillas en tiempo real (admin)
      - Activación/desactivación por tipo
    
    - Notificaciones individuales (`Notification`):
      - Bandeja de entrada interna con HTML enriquecido
      - Estados: isRead, isArchived con timestamps
      - Metadata JSON personalizable por tipo
      - Relación con colaborador y curso (opcional)
      - Priorización visual por urgencia
    
    - Preferencias de usuario (`NotificationPreference`):
      - Opt-in/opt-out por tipo de notificación
      - Control granular: email e in-app independientes
      - Valores por defecto configurables
    
    - Registro de envíos (`NotificationLog`):
      - Historial de envíos masivos con contador
      - Auditoría de remesas con timestamp
      - Vinculación con plantilla utilizada
    
    - APIs de plantillas (admin):
      - `GET/POST /api/notification-templates` - Listar y crear plantillas
      - `GET/PUT/DELETE /api/notification-templates/[id]` - Gestión individual
    
    - APIs de notificaciones:
      - `GET/POST /api/notifications` - Listar (paginado) y crear
      - `GET/PUT/DELETE /api/notifications/[id]` - Gestión individual
      - `POST /api/notifications/mark-all-read` - Marcar todas como leídas
      - `GET /api/notifications/unread-count` - Contador en tiempo real
    
    - APIs de preferencias:
      - `GET/PUT /api/notification-preferences` - Configuración de usuario
    
    - Componentes UI:
      - `NotificationBell`: Campana con badge de contador + dropdown de últimas 10
      - `/notifications`: Página completa con tabs (Todas/No leídas/Archivadas)
      - `/admin/notification-templates`: Editor de plantillas con preview HTML
  
  - **I2. Recordatorios para Gerentes y Expiraciones**:
    - Generación automática de recordatorios:
      - Recordatorios de expiración (30, 7, 1 días antes del vencimiento)
      - Resumen semanal para gerentes de área con estadísticas del equipo
      - Prevención de duplicados con ventana de tiempo
    
    - API de generación:
      - `POST /api/notifications/generate` con tipos:
        - `expiration-reminders` (days: 30/7/1)
        - `team-summary` (managerId requerido)
      - Retorna log con cantidad de notificaciones generadas
    
    - Servicios de negocio (`src/lib/notifications.ts`):
      - `createNotification()` - Crear notificación individual
      - `createNotificationFromTemplate()` - Crear desde plantilla con variables
      - `generateExpirationReminders()` - Job de recordatorios automáticos
      - `generateTeamSummary()` - Resumen para gerente con métricas
      - `markNotificationAsRead()`, `markAllNotificationsAsRead()`
      - `archiveNotification()`
      - `getUnreadNotifications()`, `countUnreadNotifications()`
    
    - Validaciones Zod (`src/validations/notifications.ts`):
      - CreateNotificationTemplateSchema, UpdateNotificationTemplateSchema
      - CreateNotificationSchema, UpdateNotificationSchema
      - UpdateNotificationPreferenceSchema
      - SendBulkNotificationSchema
      - GenerateExpirationRemindersSchema, GenerateTeamSummarySchema
  
  - **Características adicionales**:
    - Actualización automática del contador de notificaciones cada 30s
    - Renderizado seguro de HTML en notificaciones
    - Badges visuales por tipo de evento y prioridad
    - Eliminación lógica (archivo) y física (delete)
    - Sistema preparado para integración con servicios de email (Resend/SendGrid/AWS SES)
  
  - **Documentación**:
    - `docs/MODULE_I_STATUS.md`: Estado completo del módulo (600+ líneas)
    - `docs/MODULES.md`: Documentación técnica actualizada
    - `docs/README_DOCS.md`: Guía de integración y navegación
    - `docs/API_REFERENCE.md`: 11 nuevos endpoints documentados

- **Módulo H - Progreso y Cumplimiento - COMPLETADO**:
  - **H1. Tracking de Avance**:
    - Progreso de cursos (`CourseProgress`):
      - Porcentaje de avance (0-100%)
      - Tiempo empleado en minutos
      - Última actividad registrada
      - Fechas de tracking: inicio, completado, aprobado, desaprobado, vencido, certificado, exonerado
      - 6 estados: NOT_STARTED, IN_PROGRESS, PASSED, FAILED, EXPIRED, EXEMPTED
      - Transiciones automáticas basadas en porcentaje (100% → IN_PROGRESS, quiz aprobado → PASSED)
      - Fecha de expiración auto-calculada según vigencia del curso
    
    - Progreso de lecciones (reutiliza `LessonProgress`):
      - Porcentaje de visualización
      - Marcado de completado automático por threshold
      - Última fecha de visualización
      - Actualización automática del progreso del curso al completar lecciones
    
    - Progreso de rutas de aprendizaje (`LearningPathProgress`):
      - Cursos completados vs totales
      - Porcentaje de avance general
      - Cálculo automático en tiempo real
      - Fecha de inicio y completado
    
    - APIs de progreso:
      - `GET/POST /api/progress/courses` - Listar e inicializar progreso de cursos
      - `GET/PUT/DELETE /api/progress/courses/[id]` - Gestión individual
      - `PUT /api/progress/lessons/[lessonId]` - Actualizar progreso de lección
      - `GET/POST /api/progress/paths` - Progreso de rutas (cálculo dinámico)
  
  - **H2. Cumplimiento por Vigencia**:
    - Certificaciones (`CertificationRecord`):
      - Número de certificado único auto-generado
      - Fecha de emisión y expiración
      - Validez temporal con flag `isValid`
      - Cadena de recertificación: `previousCertId` y `nextCerts[]`
      - Revocación con razón y auditoría (`revokedAt`, `revokedBy`, `revocationReason`)
      - Almacenamiento de datos del certificado en JSON
      - URL del certificado PDF (para descarga)
    
    - Sistema de alertas (`ProgressAlert`):
      - 4 tipos de alerta: EXPIRING_SOON (30 días), EXPIRED, RECERTIFICATION (60 días), OVERDUE
      - 3 niveles de severidad: 1=info, 2=warning, 3=critical
      - Título, mensaje y metadata configurable
      - Estados: `isRead`, `isDismissed` con timestamps
      - Fecha de vencimiento (`dueDate`) para ordenar prioridades
    
    - Generación automática de alertas:
      - Job manual: `POST /api/progress/alerts/generate`
      - Escaneo de cursos próximos a vencer (30 días antes)
      - Detección de cursos vencidos (auto-cambia estado a EXPIRED)
      - Alertas de recertificación (60 días antes de expirar certificación)
      - Prevención de duplicados (7-30 días entre alertas)
    
    - APIs de certificaciones:
      - `GET/POST /api/progress/certifications` - Listar y emitir certificaciones
      - `GET /api/progress/certifications/[id]` - Obtener con historial completo
      - `POST /api/progress/certifications/[id]/revoke` - Revocar certificación
      - `POST /api/progress/certifications/[id]/recertify` - Crear recertificación vinculada
    
    - APIs de alertas:
      - `GET/POST /api/progress/alerts` - Listar y crear alertas manuales
      - `PUT /api/progress/alerts/[id]/read` - Marcar como leída
      - `PUT /api/progress/alerts/[id]/dismiss` - Descartar alerta
      - `POST /api/progress/alerts/generate` - Generar alertas automáticas
  
  - **H3. Gestión de Estados**:
    - Enum `ProgressStatus`: NOT_STARTED, IN_PROGRESS, PASSED, FAILED, EXPIRED, EXEMPTED
    - Cambio manual de estado (admin): `ChangeProgressStatusSchema`
    - Exoneración de colaboradores:
      - Endpoint: `POST /api/progress/courses/[id]/exempt`
      - Requiere justificación (`exemptionReason`)
      - Auditoría con `exemptedBy` userId
      - Cambio automático de estado a EXEMPTED
    - Auditoría completa de cambios:
      - Fecha de cada transición de estado
      - Usuario responsable (en exoneraciones y cambios manuales)
      - Razón documentada
  
  - **Validaciones Zod** (`src/validations/progress.ts`):
    - `UpdateCourseProgressSchema`: progreso 0-100%, timeSpent, status
    - `UpdateLessonProgressSchema`: isCompleted, timeSpent, score
    - `CreateCertificationSchema`: courseProgressId, expiresAt, isRecertification
    - `RevokeCertificationSchema`: revocationReason obligatorio
    - `CreateProgressAlertSchema`: tipo, severidad, título, mensaje, metadata
    - `ExemptCollaboratorSchema`: exemptionReason obligatorio
    - `ChangeProgressStatusSchema`: status + fechas correspondientes
  
  - **Migraciones de Base de Datos**:
    - Migración: `20251016215732_add_module_h_progress_and_compliance`
    - Tablas: `course_progress`, `certification_records`, `progress_alerts`, `learning_path_progress`
    - Enums: `ProgressStatus`, `AlertType`
    - Índices: collaboratorId, courseId, status, expiresAt, isValid, type, isRead
    - Relaciones bidireccionales con Collaborator, Course, Enrollment, LearningPath

  - **Características técnicas**:
    - Auto-cálculo de fecha de expiración basada en vigencia del curso
    - Auto-generación de números de certificado únicos
    - Cálculo en tiempo real de progreso de rutas (sin almacenar)
    - Actualización automática de progreso de curso al completar lecciones
    - Validación de límites de intentos en quizzes antes de permitir progreso
    - Sistema de cadena de certificación para rastrear recertificaciones
    - Detección automática de certificados/cursos expirados
    - Prevención de spam de alertas con ventanas de tiempo configurables
    - Transacciones ACID para operaciones de progreso críticas

- **Módulo F - Evaluaciones Automatizadas - COMPLETADO**:
  - **F1. Banco de Preguntas**:
    - 5 tipos de preguntas soportados:
      - `SINGLE_CHOICE`: Opción múltiple (una correcta)
      - `MULTIPLE_CHOICE`: Opción múltiple (varias correctas)
      - `TRUE_FALSE`: Verdadero/Falso
      - `ORDER`: Ordenar elementos
      - `FILL_BLANK`: Completar espacios en blanco
    - Metadatos: tema, dificultad (1-10), índice de discriminación
    - Feedback configurable por respuesta correcta/incorrecta
    - Explicaciones detalladas por pregunta
    - Gestión de opciones de respuesta con orden
    - API CRUD completa: GET/POST `/api/questions`, GET/PUT/DELETE `/api/questions/[id]`
    - UI de administración con tabla y modal de creación/edición
    - Validación multi-capa con Zod schemas
    - Componentes shadcn/ui: Dialog, Table, Badge, Checkbox, Select
  
  - **F2. Cuestionarios**:
    - Parámetros configurables:
      - Tiempo límite (minutos)
      - Número máximo de intentos
      - Nota mínima para aprobar (%)
      - Aleatorización de preguntas y opciones
      - Cantidad de preguntas por intento (pool aleatorio)
    - Políticas de visualización:
      - Mostrar/ocultar respuestas correctas
      - Mostrar/ocultar feedback
      - Mostrar puntuación inmediatamente
    - Estados: DRAFT, PUBLISHED, ARCHIVED
    - Relación muchos a muchos con preguntas (QuizQuestion)
    - API: GET/POST `/api/quizzes`, GET/PUT/DELETE `/api/quizzes/[id]`
  
  - **F3. Intentos y Calificación Automática**:
    - Inicio de intento: POST `/api/quizzes/[id]/attempt`
    - Validación de límite de intentos
    - Validación de estado del quiz (solo PUBLISHED)
    - Aleatorización si está configurado
    - Selección de subset de preguntas si está configurado
    - Envío de respuestas: POST `/api/attempts/[id]/submit`
    - Calificación automática según tipo de pregunta
    - Cálculo de score, puntos y estado (PASSED/FAILED)
    - Tracking de tiempo empleado
    - Ver resultado: GET `/api/attempts/[id]`
  
  - **F4. Reintentos y Remediación**:
    - Flag `requiresRemediation` si no aprueba
    - Bloqueo de reintento hasta completar contenido de refuerzo
    - Endpoint: POST `/api/attempts/[id]/remediation`
    - Marcado de remediación como completada
  
  - **F5. Banco de Reactivos por Versión**:
    - Relación `courseVersionId` en Questions
    - Pool de preguntas específico por versión de curso
    - Métricas: dificultad, discriminación (preparado para análisis)
  
  - **Validaciones Zod**:
    - `CreateQuestionSchema`: validación de estructura según tipo
    - `CreateQuizSchema`: validación de parámetros de configuración
    - `SubmitQuizAttemptSchema`: validación de respuestas
    - `CompleteRemediationSchema`: validación de finalización de remediación
  
  - **Componentes shadcn/ui agregados**:
    - RadioGroup, Checkbox, Progress, Alert, Badge, Label, Select, Textarea, Switch, Separator
  
  - **Migraciones de Base de Datos**:
    - Migración `20251016210427_add_module_f_evaluations`
    - Tablas: Question, QuestionOption, Quiz, QuizQuestion, QuizAttempt
    - Enums: QuestionType, QuizStatus, AttemptStatus
    - Índices y constraints para performance y consistencia

- **Módulo E - Inscripción Masiva por Filtros (E2.2) - COMPLETADO**:
  - Endpoint `POST /api/enrollments/bulk` para inscripción masiva
  - Filtros combinables: sede, área, puesto (al menos 1 obligatorio)
  - Validación con Zod schema `BulkEnrollmentSchema`
  - Procesamiento en transacción ACID (Prisma)
  - Upsert automático para evitar duplicados
  - Modal UI `EnrollBulkDialog` con checkboxes organizados
  - Grid 2 columnas para filtros (compacto y profesional)
  - Validación cliente-servidor (multi-capa)
  - Toast notifications para feedback
  - Auto-actualización de tabla tras inscripción masiva
  - Integración completa con módulo E
  - Documentación técnica y ejemplos de uso

- **Reorganización de Documentación**:
  - Consolidación de 10 archivos en 3 documentos bien estructurados
  - `docs/MODULES.md` - Descripción de todos los módulos (E, D, C, B, A)
  - `docs/API_REFERENCE.md` - Referencia técnica de todos los endpoints
  - `docs/IMPLEMENTATION_NOTES.md` - Detalles de arquitectura y decisiones
  - Eliminación de documentación redundante
  - Índice actualizado en README.md

- **Módulo D - Contenidos Interactivos** (Unidades, Lecciones, Archivos y Actividades)
  - **D1. Lecciones y Unidades**:
    - CRUD completo de unidades didácticas por curso
    - CRUD completo de lecciones con 5 tipos de contenido:
      - VIDEO: embebidos de YouTube/Vimeo
      - PDF: documentos descargables
      - PPT: presentaciones
      - HTML: contenido HTML personalizado
      - SCORM: paquetes SCORM estándar
    - Orden libre y configurable de unidades y lecciones
    - Sistema de completado por porcentaje de vista (configurable por lección)
    - Threshold de completado personalizable (por defecto 80%)
    - Duración estimada por lección
    - Progreso de aprendizaje por estudiante
    - Tracking automático de % visto y fecha de completado
    - Interfaz con Accordion de shadcn para navegación jerárquica

  - **D2. Repositorio de Archivos**:
    - Almacenamiento seguro con Vercel Blob
    - Límite de 10MB por archivo
    - Sistema de versionado de archivos
    - Etiquetas (tags) para organización y búsqueda
    - 6 tipos de archivo: PDF, PPT, IMAGE, VIDEO, DOCUMENT, OTHER
    - Metadatos completos: nombre, descripción, tamaño, MIME type
    - Historial de versiones con referencia a versión anterior
    - API de subida con FormData multipart

  - **D3. Actividades Interactivas**:
    - Creación de actividades con contenido HTML
    - Integración con componentes shadcn para interactividad
    - Sistema de intentos con registro completo
    - Respuestas en formato JSON flexible
    - Puntuación opcional por intento
    - Límite configurable de intentos (opcional)
    - Asociación con cursos
    - Timestamps de inicio y completado

- **APIs RESTful del Módulo D**:
  - Unidades: `GET/POST /api/courses/[id]/units`, `GET/PUT/DELETE /api/units/[id]`
  - Lecciones: `GET/POST /api/units/[id]/lessons`, `GET/PUT/DELETE /api/lessons/[id]`
  - Progreso: `GET/PUT /api/lessons/[id]/progress` (tracking automático)
  - Archivos: `GET/POST /api/files` (con filtros por tipo y tags)
  - Actividades: `GET/POST /api/activities` (con filtros por curso)

### Agregado (Módulo E - Inscripciones y Accesos)
- **E1. Asignación automática por perfil**:
  - Reglas de inscripción basadas en sede/área/puesto
  - Las reglas se almacenan en `EnrollmentRule` y pueden ser activadas/desactivadas
  - Al crear o editar un colaborador se aplican las reglas activas que coincidan con su sede/área/puesto (implementado en `src/lib/enrollment.ts`)
  - Inscripciones automáticas se registran como `Enrollment` con `type = AUTOMATIC` y referencian la regla aplicante
  - Las inscripciones automáticas se cancelan o actualizan si el perfil del colaborador cambia
  - UI de administración en `/admin/enrollment-rules` con tabla y modales CRUD

- **E2. Inscripción manual**:
  - Endpoints para crear inscripciones individuales y masivas (`/api/enrollments`, `/api/enrollments/bulk`)
  - Inscripción masiva por filtros (sede/área/puesto) y por selección de colaboradores
  - Estado y metadata de inscripciones: `PENDING`, `ACTIVE`, `COMPLETED`, `CANCELLED`, `enrolledBy`, `notes`
  - Validaciones Zod en `src/validations/enrollment.ts`
  - UI de gestión en `/admin/enrollments` con tabla, filtros y modales de inscripción
  - Botón "Inscribir" integrado en tabla de cursos para acceso rápido
  - Modal de inscripción con búsqueda y selección múltiple de colaboradores

- **APIs RESTful del Módulo E**:
  - Reglas: `GET/POST /api/enrollment-rules`, `GET/PUT/DELETE /api/enrollment-rules/[id]`
  - Inscripciones: `GET/POST /api/enrollments`, `GET/PUT/DELETE /api/enrollments/[id]`
  - Inscripción masiva: `POST /api/enrollments/bulk`

- **Actualización del Schema de Prisma**:
  - Enum `EnrollmentStatus`: PENDING, ACTIVE, COMPLETED, CANCELLED
  - Enum `EnrollmentType`: AUTOMATIC, MANUAL
  - Modelo `EnrollmentRule`: courseId, siteId, areaId, positionId, isActive
  - Modelo `Enrollment`: tipo, estado, progreso, fechas, metadata
  - Relaciones: Course → enrollmentRules/enrollments, Collaborator → enrollments

- **Componentes UI del Módulo E**:
  - Página `/admin/enrollment-rules` con tabla de reglas y modales CRUD
  - Página `/admin/enrollments` con tabla de inscripciones y filtros
  - Modal `EnrollToCourseDialog` para inscripción rápida desde tabla de cursos
  - Selectores de sede/área/puesto para filtros de reglas
  - Checkbox multi-select de colaboradores con búsqueda
  - Integración en sidebar bajo sección "Administración"

- **Integración con módulos existentes**:
  - Hook en `/api/collaborators` para aplicar reglas automáticas al crear colaborador
  - Servicio `applyAutoEnrollmentRules()` y `removeInvalidAutoEnrollments()` en `src/lib/enrollment.ts`
  - Botón "Inscribir" agregado a tabla de cursos- **Componentes UI del Módulo D**:
  - Página de gestión de contenidos: `/admin/courses/[id]/content`
  - Accordion expandible/colapsable para unidades
  - Modales de unidades: crear, editar, eliminar
  - Modales de lecciones: crear, editar, eliminar (con campos condicionales)
  - Badges de tipo de lección con iconos (Video, PDF, PPT, HTML, SCORM)
  - Botón "Contenido" en tabla de cursos para acceso rápido
  - Componentes shadcn nuevos: Accordion, Progress

- **Actualización del Schema de Prisma**:
  - Enum `LessonType`: VIDEO, PDF, PPT, HTML, SCORM
  - Enum `FileType`: PDF, PPT, IMAGE, VIDEO, DOCUMENT, OTHER
  - Modelo `Unit`: título, descripción, orden, relación con Course
  - Modelo `Lesson`: título, tipo, orden, URLs, HTML, threshold, duración
  - Modelo `LessonProgress`: % visto, completado, timestamps, unique por lección+colaborador
  - Modelo `FileRepository`: Blob URL, metadatos, tags, versionado
  - Modelo `InteractiveActivity`: HTML content, intentos máximos, relación con curso
  - Modelo `ActivityAttempt`: respuestas JSON, puntuación, timestamps
  - Migración: `20251016174618_add_content_module`

- **Validaciones Zod centralizadas** (`src/validations/content.ts`):
  - Schemas para unidades, lecciones, progreso, archivos y actividades
  - Validación de URLs opcionales para videos y archivos
  - Validación de threshold 0-100%
  - Tipos TypeScript generados automáticamente

- **Integración con Vercel Blob**:
  - Dependencia `@vercel/blob@2.0.0` instalada
  - Upload con acceso público
  - Uso mínimo para no exceder límites

### Cambiado
- **Tabla de cursos**: agregado botón "Contenido" para gestión de unidades/lecciones
- **Schema de Prisma**: Course extendido con relación `units`

### Técnico
- Componentes cliente/servidor separados para optimal performance
- Refresh automático de listas tras operaciones CRUD
- Validación de roles (ADMIN/SUPERADMIN) en todos los endpoints de contenido
- Manejo seguro de colaboratorId desde sesión con query adicional
- Campos condicionales en formularios según tipo de lección
- API de progreso con upsert para crear/actualizar en una operación
- Cálculo automático de completado basado en threshold

---

### Agregado (Módulo C - Catálogo de Cursos)
- **Módulo completo de Catálogo de Cursos** (`/admin/courses`)
  - CRUD completo con estados: BORRADOR, PUBLICADO, ARCHIVADO
  - Modalidades: Asíncrono, Síncrono, Mixto
  - Campos: código, nombre, objetivo, duración, modalidad, vigencia (meses), requisitos
  - Versionado automático: crea nueva versión al hacer cambios significativos
  - Historial de versiones completo sin perder datos previos
  - Visualización de todas las versiones con detalles
  - APIs RESTful: `GET/POST /api/courses`, `PUT/DELETE /api/courses/[id]`
  - Validaciones Zod centralizadas (`src/validations/courses.ts`)
  - Tabla interactiva con filtros por estado usando Tabs
  - Badges de estado con colores distintivos
  - Modales CRUD con formularios completos
  - Protección de eliminación: valida asignaciones activas
  - Conteo de versiones, asignaciones y rutas en tabla

- **Módulo completo de Rutas de Aprendizaje** (`/admin/learning-paths`)
  - CRUD completo con estados: BORRADOR, PUBLICADO, ARCHIVADO
  - Modalidades: Asíncrono, Síncrono, Mixto
  - Campos: código, nombre, objetivo, duración, modalidad, vigencia (meses), requisitos
  - Versionado automático: crea nueva versión al hacer cambios significativos
  - Historial de versiones completo sin perder datos previos
  - Visualización de todas las versiones con detalles
  - APIs RESTful: `GET/POST /api/courses`, `PUT/DELETE /api/courses/[id]`
  - Validaciones Zod centralizadas (`src/validations/courses.ts`)
  - Tabla interactiva con filtros por estado usando Tabs
  - Badges de estado con colores distintivos
  - Modales CRUD con formularios completos
  - Protección de eliminación: valida asignaciones activas
  - Conteo de versiones, asignaciones y rutas en tabla

- **Módulo completo de Rutas de Aprendizaje** (`/admin/learning-paths`)
  - CRUD completo de itinerarios de aprendizaje
  - Gestión de cursos dentro de rutas con ordenamiento
  - Sistema de prerequisitos entre cursos
  - Cursos obligatorios y opcionales (switch)
  - Cálculo automático de duración total del itinerario
  - Visualización de secuencia y dependencias
  - APIs RESTful: `GET/POST /api/learning-paths`, `PUT/DELETE /api/learning-paths/[id]`
  - API de gestión de cursos: `POST/DELETE /api/learning-paths/[id]/courses`
  - Modal avanzado de gestión de cursos en ruta
  - Validaciones de prerequisitos y orden
  - Badges indicadores de estado y métricas

- **Actualización del Schema de Prisma**
  - Enum `CourseStatus`: DRAFT, PUBLISHED, ARCHIVED
  - Enum `CourseModality`: ASYNCHRONOUS, SYNCHRONOUS, BLENDED
  - Modelo `Course` extendido: objective, duration, modality, validity, requirements, status, currentVersion
  - Modelo `CourseVersion`: versionado completo con timestamps y createdBy
  - Modelo `LearningPath`: code, name, description, status
  - Modelo `LearningPathCourse`: order, isRequired, prerequisiteId con auto-relación
  - Relación cursos → rutas de aprendizaje
  - Migración exitosa: `20251016171059_add_course_catalog_module`

- **Componentes UI nuevos con shadcn**
  - Badge: estados visuales con colores
  - Tabs: navegación por estados de curso
  - Textarea: campos de texto largo
  - Switch: toggle de cursos obligatorios
  - Modales de cursos: crear, editar, eliminar, ver versiones
  - Modales de rutas: crear, editar, eliminar, gestionar cursos

- **Sidebar actualizado**
  - Enlaces a "Cursos" y "Rutas de Aprendizaje" en sección Administración
  - Navegación organizada por módulos

### Cambiado
- **Validaciones de cursos**: esquemas extendidos con nuevos campos y enums
- **ESLint**: reglas de `@typescript-eslint/no-explicit-any` y similares cambiadas a "warn"

### Técnico
- Todas las APIs con autenticación y validación de roles
- Versionado automático detecta cambios en: name, objective, duration, modality, validity
- Prerequisitos implementados con auto-relación en `LearningPathCourse`
- Tipos TypeScript corregidos para DataTable genérico
- Warnings de ESLint documentados (tipos `any` en modales)

---

### Agregado (Anterior)
- **Módulo completo de Sedes** (`/admin/sites`)
  - APIs RESTful: `GET/POST /api/sites`, `PUT/DELETE /api/sites/[id]`
  - Validaciones Zod centralizadas (`src/validations/sites.ts`)
  - Página principal con carga server-side (`src/app/admin/sites/page.tsx`)
  - Tabla interactiva con DataTable (`src/app/admin/sites/table.tsx`)
  - Modales CRUD: Crear, Editar, Eliminar (`src/components/admin/site-modals.tsx`)
  - Sidebar actualizado con enlace "Sedes" en sección Administración
  - Protección de eliminación: valida que no haya colaboradores asignados
  - Conteo de colaboradores por sede en tabla
  - Manejo de errores con toast notifications
  - Patrón consistente con módulos de colaboradores/áreas/puestos

- **Sidebar reorganizado en carpeta dedicada** (`src/components/sidebar/`)
  - Componentes: `app-sidebar.tsx`, `nav-user.tsx`, `team-switcher.tsx`
  - Barrel export (`index.ts`) para imports simplificados
  - Tooltips en enlaces para mejor UX en modo colapsado
  - Condicionalidad por rol (ADMIN/SUPERADMIN ven enlaces de administración)
  - NavUser con datos reales de sesión y botón "Cerrar sesión"

- **Header global con breadcrumbs dinámicos** (`src/components/app-header.tsx`)
  - Breadcrumbs automáticos basados en ruta actual
  - Mapeo de rutas a nombres en español
  - SidebarTrigger integrado para abrir/cerrar sidebar
  - Responsive y adaptable

- **Footer profesional** (`src/components/app-footer.tsx`)
  - Grid responsive (4 columnas → 1 en mobile)
  - Enlaces rápidos, recursos, contacto
  - Copyright dinámico
  - Términos de servicio y política de privacidad

- **Layout global mejorado** (`src/app/layout.tsx`)
  - SidebarProvider a nivel raíz
  - Header y footer consistentes en todas las páginas
  - Estructura unificada para toda la aplicación

### Cambiado
- **Sidebar UX/UI mejorado**
  - Header responsivo: muestra "LMS SSOMA" expandido, "LS" en modo icon
  - Eliminada superposición de texto en modo colapsado
  - Uso de `group-data-[collapsible=icon]:hidden` para ocultar contenido correctamente

- **Dashboard simplificado** (`src/app/dashboard/page.tsx`)
  - Eliminado SidebarProvider duplicado
  - Componente más limpio y simple
  - Solo renderiza contenido específico del dashboard

- **Home page limpiada** (`src/app/page.tsx`)
  - Eliminado SidebarTrigger redundante (ahora en header)
  - Estructura simplificada

### Corregido
- **Duplicación de sidebar** al entrar al dashboard
- **Breadcrumbs** ahora disponibles en todas las páginas (antes solo en dashboard)
- **SidebarTrigger** centralizado en header (eliminadas instancias duplicadas)
- **Imports** actualizados a nueva estructura de carpeta sidebar
- **TypeScript errors** en NavUser (tipos de image/avatar)
- **ESLint warnings** por imports no usados

### Eliminado
- Archivos antiguos de sidebar fuera de carpeta dedicada
- `sidebar-wrapper.tsx` (ya no necesario)
- Componentes de ejemplo no usados (`nav-main.tsx`, `nav-projects.tsx` en root)
- SidebarProvider duplicado en páginas individuales

---

## Notas Técnicas

### Estructura de Carpetas Actualizada
```
src/
├── components/
│   ├── sidebar/              ← Nueva carpeta organizada
│   │   ├── app-sidebar.tsx
│   │   ├── nav-user.tsx
│   │   ├── team-switcher.tsx
│   │   └── index.ts
│   ├── app-header.tsx        ← Nuevo
│   ├── app-footer.tsx        ← Nuevo
│   └── ui/
├── app/
│   ├── layout.tsx            ← Actualizado con header/footer
│   ├── page.tsx              ← Limpiado
│   └── dashboard/
│       └── page.tsx          ← Limpiado (sin duplicación)
```

### Dependencias
- Next.js 15.5.5 (Turbopack)
- NextAuth v5 beta
- Prisma v6.x
- shadcn/ui components
- Tailwind CSS

---

## [Próximas Mejoras Planificadas]

### Alta Prioridad
- [ ] Re-habilitar PrismaAdapter en NextAuth (resolver conflicto de versiones)
- [ ] Implementar middleware de protección de rutas más robusto
- [ ] Añadir más rutas al mapeo de breadcrumbs (rutas dinámicas)

### Media Prioridad
- [ ] Selector de tema (dark/light mode)
- [ ] Búsqueda global en header
- [ ] Notificaciones en tiempo real
- [ ] Perfil de usuario completo

### Baja Prioridad
- [ ] Animaciones suavizadas en transiciones
- [ ] Temas personalizables por empresa
- [ ] Newsletter en footer
- [ ] Redes sociales en footer

---

## Convenciones de Commits

Este proyecto sigue [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva característica
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (sin cambio de código)
- `refactor:` Refactorización de código
- `test:` Añadir o modificar tests
- `chore:` Cambios en build, configuración, etc.

---

## Mantenedores

- Equipo de desarrollo DMH

## Licencia

Propietario - DMH © 2025
