# LMS SSOMA DMH

Sistema de Gestión de Aprendizaje (LMS) para Seguridad, Salud Ocupacional y Medio Ambiente de DMH.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC)](https://tailwindcss.com/)

---

## 📋 Descripción

LMS SSOMA DMH es una plataforma web moderna para la gestión integral de capacitaciones, colaboradores y recursos relacionados con Seguridad, Salud Ocupacional y Medio Ambiente. El sistema permite administrar usuarios, asignar cursos, gestionar áreas y puestos, y realizar seguimiento del progreso de capacitaciones.

## 🆕 Últimas Actualizaciones

### v2.1.6 - Mejoras en Gestión de Colaboradores (3 Nov 2025)
- ✅ **Validación de Contraseña Condicional**: Password requerida solo cuando `createUser=true` en diálogo de creación
- ✅ **Reestructuración UX del Diálogo**: Flujo lineal 3-pasos (info → organización → cuenta) con validación clara
- ✅ **Botones Contextuales**: "Siguiente" en pasos 1-2, "Crear Colaborador" solo en paso 3 con submit
- ✅ **Import Masivo como Modal Dialog**: Importación de CSV/XLSX sin navegar a página separada
- ✅ **Drag-and-Drop en Import**: Área interactiva para soltar archivos + selector de archivos
- ✅ **Resultados de Importación Inline**: Muestra created/updated/skipped counts y tabla de errores
- ✅ **Auto-Refresh de Tabla**: Actualización automática de lista de colaboradores tras importación exitosa
- ✅ **Build Validado**: Compilación exitosa 7.4s, 78 páginas, 0 errores

**Beneficio clave**: Experiencia de usuario mejorada con validación inteligente, flujo claro en diálogo y importación modal sin abandonar la página actual.

### v2.1.5 - Reestructuración Administrativa y Mejoras UX (3 Nov 2025)
- ✅ **Reestructuración de /admin**: Eliminada página visible `/admin`, ahora es carpeta organizacional para paneles administrativos
- ✅ **Breadcrumbs inteligentes**: "Inicio" redirige a dashboard, omite segmento `/admin` en navegación
- ✅ **Redirecciones autenticadas**: Usuarios logueados redirigidos automáticamente desde páginas públicas
- ✅ **Ordenamiento automático**: Unidades y lecciones con orden secuencial automático al crear
- ✅ **Drag-and-drop completo**: Reordenamiento visual de unidades y lecciones con @dnd-kit
- ✅ **Corrección de errores**: Hidratación SSR, reordenamiento API, y validaciones de estado
- ✅ **Reportes Excel mejorados**: Notas de exámenes en puntos en lugar de porcentaje
- ✅ **Sistema de asistencia**: Tracking automático de asistencia al completar cursos 100%
- ✅ **Horas estandarizadas**: Ajuste automático de tiempo a duración oficial del curso

**Beneficio clave**: Arquitectura más limpia con /admin como carpeta organizacional, mejor UX con drag-and-drop, y reportes precisos con horas oficiales.

### v2.1.4 - Sistema de Asistencia y Horas (31 Oct 2025)
- ✅ **Tracking automático de asistencia**: Marca asistencia cuando los colaboradores completan 100% de un curso
- ⏱️ **Ajuste de horas estandarizado**: Al completar, reemplaza tiempo acumulado con duración oficial del curso
- 📊 **Reportes Excel mejorados**: Nuevas columnas "Asistencia" (Sí/No) y "Horas" (estandarizadas)
- 📈 **Cumplimiento SSOMA preciso**: Garantiza reportes con horas oficiales, no tiempos parciales

**Beneficio clave**: Si un curso es de 2 horas y un colaborador lo completa en 1.5h, el sistema registra 2h exactas para cumplimiento oficial.

## ✨ Características Principales

### 🔐 Autenticación y Autorización
- Sistema de login seguro con NextAuth v5
- Roles de usuario: SUPERADMIN, ADMIN, COLLABORATOR
- Protección de rutas por rol
- Sesiones JWT

### 👥 Gestión de Colaboradores
- CRUD completo de colaboradores
- Importación masiva (CSV/XLSX)
- Asignación a áreas, sedes y puestos
- Historial de cambios
- Cambio de roles por administrador

### 📚 Gestión de Cursos
- CRUD completo de cursos con estados (BORRADOR, PUBLICADO, ARCHIVADO)
- **Códigos automáticos** siguiendo patrón `CRS-XXX` (generados automáticamente al crear cursos)
- Versionado automático de cursos con historial completo
- Campos: nombre, objetivo, duración, modalidad, vigencia, requisitos
- Modalidades: Asíncrono, Síncrono, Mixto
- Asignación de cursos a colaboradores
- Seguimiento de estado (PENDING, IN_PROGRESS, COMPLETED)
- API para consultas de cursos asignados

### 🛤️ Rutas de Aprendizaje
- Creación de itinerarios de cursos estructurados
- Definición de prerequisitos entre cursos
- Ordenamiento secuencial de cursos
- Cursos obligatorios y opcionales
- Cálculo de duración total del itinerario
- Gestión visual de dependencias

- Enforzamiento de prerrequisitos en servidor: si el curso pertenece a una ruta asignada y el prerrequisito no está cumplido, el acceso se bloquea y se redirige a `/my-learning-paths`.

Nota técnica: la verificación de acceso está centralizada en `src/lib/access.ts` mediante `checkCoursePrerequisites(collaboratorId, courseId)` y se aplica en las páginas de curso, lección y cuestionario bajo `src/app/(authenticated)/courses/...`.

### 📖 Contenidos y Lecciones (Módulo D)
- **Unidades Didácticas**: Organización de contenido en unidades
- **Lecciones Multimedia**: 
  - Videos embebidos (YouTube/Vimeo)
  - Documentos PDF/PPT con visor
  - Contenido HTML interactivo
  - Paquetes SCORM
- **Progreso de Aprendizaje**: 
  - Seguimiento automático de % visto
  - Marcado de completado configurable
  - Historial de visualizaciones
  - Anti-salto en servidor: el endpoint de progreso limita aumentos desproporcionados basados en tiempo de reproducción real y duración del recurso (tolerancia hasta 1.6x). El cliente envía `timeDeltaSeconds` y `duration` para validación.
  - No-Video: botón "Marcar como Completada" disponible tras 3 minutos de actividad real en el recurso (PDF/PPT/HTML/SCORM). Al presionarlo, el cliente envía `manualComplete: true` y el servidor fuerza el completado si la lección no es VIDEO, respetando el `completionThreshold` configurado.
- **Repositorio de Archivos**:
  - Almacenamiento seguro con Vercel Blob
  - Versionado de archivos
  - Sistema de etiquetas
  - Límites de tamaño
- **Actividades Interactivas**:
  - Contenido HTML con componentes shadcn
  - Registro de intentos
  - Puntuación opcional

### 🎯 Inscripciones y Accesos (Módulo E)
- **Asignación Automática por Perfil (E1)**:
  - Reglas de inscripción basadas en sede/área/puesto
  - Aplicación automática al crear/editar colaboradores
  - Gestión de reglas activas/inactivas
  - Cancelación automática al cambiar perfil
- **Inscripción Manual (E2)**:
  - Inscripción individual de colaboradores
  - Inscripción masiva por selección múltiple
  - Inscripción masiva por filtros (sede/área/puesto)
  - Gestión de notas y seguimiento
  - Control de estado: PENDING, ACTIVE, COMPLETED, CANCELLED
  - Seguimiento de progreso por colaborador

Nota técnica: el módulo E incluye APIs RESTful para gestión de reglas (`/api/enrollment-rules`) e inscripciones (`/api/enrollments`), utilidades en `src/lib/enrollment.ts` y validaciones en `src/validations/enrollment.ts`.

### 📝 Evaluaciones Automatizadas (Módulo F)
- **Banco de Preguntas (F1)**:
  - 5 tipos de preguntas: Opción única, Opción múltiple, Verdadero/Falso, Ordenar, Completar
  - Metadatos: tema, dificultad, índice de discriminación
  - Feedback personalizado por respuesta
  - Explicaciones detalladas
  - API CRUD completa con validaciones
  - UI profesional con shadcn/ui
- **Cuestionarios (F2)**:
  - Configuración avanzada: tiempo límite, intentos máximos, nota mínima
  - Aleatorización de preguntas y opciones
  - Pool de preguntas por intento
  - Políticas de visualización configurables
  - Estados: BORRADOR, PUBLICADO, ARCHIVADO
  - **UI Mejorada:** Diseño minimalista y profesional con paleta de colores sobria, indicadores visuales de puntuación (badge + barra de progreso), selección sin bucles de actualización.
- **Calificación Automática (F3)**:
  - Inicio y envío de intentos con validaciones
  - Calificación automática según tipo de pregunta
  - Cálculo de score, puntos y tiempo empleado
  - Estados: EN_PROGRESO, ENVIADO, CALIFICADO, APROBADO, REPROBADO
  - Vista de resultados con feedback
- **Reintentos y Remediación (F3.1)**:
  - Bloqueo de reintento si no aprueba
  - Contenido de refuerzo antes de reintentar
  - Marcado de remediación completada
- **Banco por Versión (F4)**:
  - Pool de preguntas específico por versión de curso
  - Métricas de dificultad y discriminación

Nota técnica: el módulo F incluye 8 endpoints REST, validaciones Zod en `src/validations/quiz.ts`, y 10+ componentes shadcn/ui para experiencia profesional. El formulario de cuestionarios implementa selección eficiente sin bucles de React mediante `onCheckedChange` y `stopPropagation`.

### 📊 Progreso y Cumplimiento (Módulo H)
- **Tracking de Avance (H1)**:
  - Progreso por curso: porcentaje, tiempo empleado, última actividad
  - **Sistema de Asistencia Automática**: marca `attended = true` cuando el curso alcanza 100% de completado
  - **Ajuste de Horas Estandarizado**: al completar 100%, reemplaza `timeSpent` con la duración configurada del curso
    - Ejemplo: Si acumula 1.5h pero el curso está configurado como 2h → reporta 2h exactas
    - Garantiza reportes de cumplimiento SSOMA con horas oficiales
  - Progreso por lección: visualizaciones, completado automático
  - Progreso por ruta de aprendizaje: cursos completados/totales
  - Estados: NO_INICIADO, EN_PROGRESO, APROBADO, DESAPROBADO, VENCIDO, EXONERADO
  - Cálculo automático basado en lecciones y quizzes
- **Cumplimiento por Vigencia (H2)**:
  - Cursos con fecha de caducidad configurable
  - Certificaciones con validez temporal
  - Cadena de recertificación (certificación → recertificación)
  - Revocación de certificaciones con razón
  - Sistema de alertas multi-nivel (info, warning, critical)
  - Alertas automáticas: cursos próximos a vencer (30 días), vencidos, recertificación requerida (60 días)
- **Gestión de Estados (H3)**:
  - Transiciones automáticas de estado según progreso
  - Exoneración de colaboradores con justificación
  - Cambio manual de estado (admin)
  - Fechas de tracking: inicio, completado, aprobado, desaprobado, vencido, certificado, exonerado
  - Auditoría de cambios de estado

Nota técnica: el módulo H incluye 15 endpoints REST en `/api/progress`, validaciones en `src/validations/progress.ts`, 5 modelos Prisma (CourseProgress, CertificationRecord, ProgressAlert, LearningPathProgress + LessonProgress reutilizado), 2 enums (ProgressStatus, AlertType), y sistema de alertas automáticas con job manual.

### 🔔 Notificaciones y Recordatorios (Módulo I)
- **Email y Bandeja Interna (I1)**:
  - 8 tipos de eventos: nueva inscripción, recordatorios (30/7/1 días), desaprobación, certificado listo, recertificación próxima, resumen de equipo
  - Plantillas editables con 20+ variables dinámicas
  - Canales configurables: EMAIL, IN_APP, BOTH
  - Sistema de preferencias opt-in/out por tipo de notificación
  - Bandeja interna con estados (leído/no leído/archivado)
  - Contador en tiempo real de notificaciones no leídas
  - Componente NotificationBell con icono de campana
  - UI moderna con shadcn/ui
- **Recordatorios al Jefe (I2)**:
  - Resumen semanal automático de pendientes del equipo
  - Estadísticas agregadas por área/sede
  - Detección de cursos próximos a vencer (30/7 días)
  - Generación programable mediante cron job
  - Dashboard de equipo para jefes
  - Filtros por colaborador y rango de fechas

Nota técnica: el módulo I incluye 11 endpoints REST en `/api/notification-templates`, `/api/notifications`, `/api/notification-preferences`, validaciones en `src/validations/notification.ts`, 4 modelos Prisma (NotificationTemplate, Notification, NotificationPreference, NotificationLog), 3 enums (NotificationEvent, NotificationChannel, NotificationStatus), servicio completo en `src/lib/notifications.ts` con funciones para envío por email/in-app y generación de resúmenes.

### � Certificados (Emisión y Verificación Pública) (Módulo K)
- **Emisión Automática de Certificados PDF (K1)**:
  - Generación profesional con `@react-pdf/renderer` en diseño landscape (A4 horizontal)
  - Plantilla con bordes dobles, marca de agua "SSOMA", y layout estructurado
  - Información completa: nombre colaborador, DNI, curso, nota (%), horas, fecha emisión/vencimiento
  - Código de verificación único de 16 caracteres (hex uppercase, crypto.randomBytes)
  - QR code para verificación rápida (300x300px, apunta a /verify/[code])
  - Número de certificado único indexado en base de datos
  - Firma digital del responsable de SSOMA
  - Renderizado server-side con `renderToBuffer()`, descarga on-demand
  - API: POST `/api/certificates/generate` (solo ADMIN), GET `/api/certificates/[id]/download`
- **Verificación Pública (K2)**:
  - Página pública `/verify/[code]` accesible sin autenticación
  - Verificación instantánea por código manual o escaneo QR
  - Estados visuales claros: ✅ Verde (válido), ⚠️ Amarillo (expirado), ❌ Rojo (no encontrado)
  - Información pública mínima (sin datos sensibles): certificateNumber, colaboratorName, courseName, issuedAt, expiresAt, courseHours, score, isValid
  - Validación de vigencia: campo `isValid` + fecha de expiración vs fecha actual
  - Diseño responsivo mobile-first con gradientes y badges semánticos
  - API: GET `/api/certificates/verify/[code]` (endpoint público)
- **Administración de Certificados**:
  - Panel `/admin/certificates` para gestión (solo ADMIN)
  - Listado completo de certificados emitidos con tabla
  - Columnas: N° Certificado, Colaborador (nombre + DNI), Curso, Emisión, Estado (badge válido/inválido)
  - Acciones: Generar PDF (si no existe), Descargar PDF, Ver página de verificación pública
  - Filtros por colaborador, curso, estado de validez, rango de fechas
  - API: GET `/api/certificates` con query params para filtros
- **Almacenamiento y Seguridad**:
  - Prisma schema extendido: `pdfUrl String?`, `verificationCode String? @unique`, `qrCode String?`, `pdfMetadata Json?`
  - Migración: `20251017060346_add_certificate_pdf_fields`
  - Códigos únicos con índice para evitar duplicados
  - Generación segura con crypto (2^64 combinaciones)
  - Solo expone datos públicos mínimos en verificación
  - Autorización: generación solo ADMIN, descarga autenticado, verificación público

Nota técnica: el módulo K incluye 4 endpoints REST en `/api/certificates/*`, validaciones en `src/validations/certificates.ts`, extensión del modelo `CertificationRecord` con 4 campos nuevos, servicio en `src/lib/certificates.ts` con 6 funciones (240 líneas), componente template en `src/components/certificates/certificate-template.tsx` (260 líneas), 2 páginas (admin + verify), dependencias: @react-pdf/renderer 4.3.1, qrcode 1.5.4, total 1220 líneas de código.

### 📊 Reportes (Áreas, Curso, Cumplimiento) (Módulo J)
- **Dashboard Ejecutivo (J1)**:
  - 15+ KPIs en tiempo real: % cumplimiento, alertas críticas, intentos promedio, tasa de aprobación, NPS
  - 4 visualizaciones interactivas con recharts: compliance por área (BarChart), distribución de alertas (PieChart), tendencia de inscripciones (AreaChart), tendencia de completados (LineChart)
  - Filtros temporales (7/30/90 días/todo) y organizacionales (área/sede)
  - Top 5 cursos críticos con contadores de vencidos/próximos
  - Indicadores de tendencia (↑/↓) comparando periodos
  - Auto-refresh al cambiar filtros
- **Reporte por Área (J2)**:
  - Tabla con 8 columnas: DNI, nombre, área, posición, curso, estado, progreso %, score
  - Filtros avanzados: área, sede, posición, estado, curso, rango de fechas
  - Badges semánticos por estado con colores
  - Contador de registros
  - **Exportación Excel Mejorada**:
    - 3 hojas: Resumen (KPIs), Colaboradores (overview), Detalle Cursos (información completa)
    - **Nueva columna "Asistencia"**: Muestra "Sí"/"No" según `attended` field
    - **Nueva columna "Horas"**: Tiempo estandarizado (usa duración oficial si completado, sino calcula desde `timeSpent`)
    - **Nueva columna "Nota (%)"**: Mejor calificación obtenida en los exámenes del curso (mejor intento con score)
    - Columnas adicionales: DNI, nombre, curso, estado, progreso %, fecha completado, expiración, días hasta vencer
    - Endpoint: `/api/reports/export-collaborators-excel`
- **Reporte por Curso (J3)**:
  - Estadísticas completas: inscritos, % completado, % aprobación + promedio, tiempo promedio
  - Gráfico de distribución de scores (5 rangos: 0-40, 41-60, 61-80, 81-90, 91-100)
  - Gráfico de distribución de estados con colores semánticos
  - Selector de curso con flujo de 2 pasos
  - Exportación PDF preparada
- **Reporte de Cumplimiento Legal/SSOMA (J4)**:
  - Matriz de colaboradores × cursos obligatorios
  - Semáforo de tráfico: 🟢 Cumple (>30 días), 🟡 Por vencer (7-30 días), 🔴 Vencido (<7 días o sin certificar)
  - Indicadores de días hasta vencimiento
  - Resumen con métricas: total, cumpliendo, por vencer, vencidos
  - Scroll horizontal para muchos cursos
  - Leyenda explicativa del semáforo
- **Trazabilidad de Evaluaciones (J5)**:
  - Búsqueda en tiempo real (DNI/nombre/curso)
  - Tabla de auditoría con 10 columnas: timestamp, DNI, nombre, curso, quiz, duración (formato Xm Ys), score, estado, respuestas, IP
  - Información de retención y privacidad
  - Exportación CSV preparada
  - Auditoría completa para compliance

Nota técnica: el módulo J incluye 5 endpoints REST en `/api/reports/*`, validaciones en `src/validations/reports.ts`, 4 modelos Prisma (Report, ReportSchedule, ReportExecution, KPISnapshot), 3 enums (ReportType, ReportFormat, ScheduleFrequency), servicio con 6 funciones (600+ líneas) en `src/lib/reports.ts`, dependencias: recharts 2.x, date-fns 3.x, shadcn/ui chart component.

### 🏠 Landing Page y Reorganización de Rutas (Octubre 2025 - v2.0)
- **Landing Page en Raíz (`/`)**: Página de presentación pública con hero, features, benefits, CTA y footer
  - Accesible sin autenticación
  - Diseño profesional con gradientes y grid responsivo
  - Botones de CTA apuntando a /login y #features
  - Arquitectura: `src/app/page.tsx`

- **Reorganización con Route Groups**:
  - `/(public)/` - Rutas públicas sin sidebar: `/login`, `/register`
  - `/(authenticated)/` - Rutas protegidas con sidebar y header: todos los módulos admin
  - Dashboard movido a `/dashboard` (con sidebar y KPIs dinámicos)
  - Layout raíz simplificado a solo SessionProvider + Toaster

- **Beneficios Arquitectónicos**:
  - Separación clara de concerns: público vs autenticado
  - Diferentes layouts por grupo de rutas
  - Sidebar visible solo en rutas autenticadas
  - Mejor organización del código
  - Escalable para agregar más grupos (ej: `/super-admin/`)

### 👥 Portal del Colaborador (Octubre 2025)
- **Mis Cursos**: Visualización de cursos asignados con progreso detallado
  - Tabs: Disponibles, En Progreso, Completados, Historial
  - Tarjetas con: nombre curso, progreso %, estado, acciones
  - Botones: Iniciar, Continuar, Ver Resultados
  - Filtros por curso y estado

- **Evaluaciones**: Gestión centralizada de evaluaciones
  - Bandeja de evaluaciones activas: tiempo límite, intentos disponibles, nota mínima
  - Pantalla de examen integrada
  - Resultados con: nota, retroalimentación, opción de remediación/reintento
  - 4 tabs: Disponibles, En Progreso, Aprobadas, Historial
  - Stat cards: Total, En Progreso, Aprobadas, Historial

- **Certificados**: Gestión de certificaciones obtenidas
  - Listado con: curso, versión, fecha emisión, vigencia (badge: vigente/por vencer/vencido)
  - Acciones: Descargar PDF, Verificar (link público/QR)
  - Histórico de certificados (incluye vencidos)
  - 3 tabs: Vigentes, Vencidos, Historial Completo
  - Stat cards: Total, Vigentes, Por Vencer, Vencidos
  - Validación de fechas con umbrales de 30 días

- **Notificaciones**: Centro de notificaciones integrado
  - Bandeja interna: asignaciones nuevas, recordatorios de vencimiento (30/7/1 días), resultado de evaluaciones, certificado disponible
  - Preferencias granulares (opt-in por tipo de notificación)
  - Contador en tiempo real en sidebar (badge rojo destructive)
  - Auto-refresh cada 10 segundos
  - Event listeners para actualizaciones instantáneas
  - 3 tabs: Todas, No Leídas, Archivadas
  - Stat cards: Total, No Leídas, Leídas, Archivadas
  - 8 tipos de notificación configurables: Cursos, Evaluaciones, Certificados, Recordatorios, Gestión, Anuncios

- **Perfil**: Datos personales y organizacionales
  - Información Personal (solo lectura o editable según política): nombre, DNI, email, área, puesto, sede
  - Información Organizacional: sede, área, puesto (administrado por RRHH)
  - Estado: Activo/Inactivo
  - Estadísticas: ID Usuario, ID Colaborador, Antigüedad
  - Avatar personalizadas con iniciales

Nota técnica: Portal completamente integrado con navegación en sidebar (5 links: Cursos, Evaluaciones, Certificados, Notificaciones, Perfil), contador de notificaciones en tiempo real, acceso filtrado por sesión del usuario, validaciones de rol COLLABORATOR. Build exitoso: 77 rutas (optimizado tras consolidación).

### 📊 Consolidación de Reportes y Optimización (Octubre 2025)
- **Consolidación de Excel Export en Dashboard Ejecutivo**:
  - Movida funcionalidad de descarga Excel desde `/reports/collaborators` al Dashboard Ejecutivo (`/reports/dashboard`)
  - Eliminación de página redundante `/reports/collaborators` (reducción de 79 a 77 rutas)
  - Unificación de funcionalidad: un solo lugar para descargar reportes de colaboradores
  - Mejora de UX: descarga directa desde dashboard sin navegación adicional

- **Renombrado de Endpoint para Claridad**:
  - `/api/reports/collaborators-progress` → `/api/reports/export-collaborators-excel`
  - Nombre refleja mejor la función: genera archivo Excel, no solo consulta datos JSON
  - Arquitectura más clara: endpoints de exportación vs endpoints de consulta
  - Mantiene funcionalidad completa: 3 hojas (Resumen, Colaboradores, Detalle Cursos)

- **Corrección de Bugs en Dashboard Ejecutivo**:
  - **Cálculos corregidos**: 5 errores de división por cero con fallbacks `|| 1`
  - **Precedencia de operadores**: Corregida en cálculos de alertas y cursos críticos
  - **Progreso invertido**: Barra de progreso ahora muestra `completionRate` en lugar de `100 - completionRate`
  - **Botones funcionales**: Implementados handlers para "Ver detalles" (navega a `/admin/courses/${courseId}/content`)
  - **Estado de carga**: Botón de descarga Excel muestra `disabled={refreshing}` durante proceso

- **Tracking de Progreso para Contenido No-Video**:
  - **ContentProgressTracker**: Componente para PDF/PPT/HTML/SCORM con polling de 30s
  - **Anti-spam validación**: Cliente (no rollback) + Servidor (Math.max validation)
  - **Detección de actividad**: Visibility API + auto-pause (2min inactividad) + throttling
  - **Complementa YouTubePlayer**: Video (2s polling, ≥5% threshold) + Documentos (30s polling)

- **Optimización de Build y Arquitectura**:
  - Build exitoso: 77 rutas generadas, compilación en 14.8s, sin errores críticos
  - ESLint: Solo warnings pre-existentes (no nuevos errores)
  - Eliminación de código redundante: 2 rutas eliminadas, arquitectura más limpia
  - Mantenimiento de APIs de progreso: `/api/progress/courses`, `/api/progress/paths`, etc.

Nota técnica: Consolidación reduce complejidad manteniendo funcionalidad completa. Excel export genera 3-sheet workbook con KPIs, colaboradores y detalle de cursos. Dashboard Ejecutivo ahora centraliza reportes y exportaciones.

### 🏢 Administración
- Gestión de áreas con jefes de área
- Gestión de puestos de trabajo
- Gestión de sedes
- Dashboard con métricas

### 🎨 Interfaz de Usuario
Nota: muchos componentes de la interfaz se generaron y organizaron usando el flujo MCP de `shadcn/ui` para mantener un estilo moderno, consistente y profesional entre los distintos módulos (modales, formularios, badges y layouts).

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15.5.5** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **shadcn/ui** - Componentes de UI
- **Lucide React** - Iconos

### Backend
- **Next.js API Routes** - Endpoints RESTful
- **NextAuth v5** - Autenticación
- **Prisma** - ORM para base de datos
- **PostgreSQL** - Base de datos relacional
- **Zod** - Validación de esquemas

### Herramientas
- **Turbopack** - Bundler rápido
- **ESLint** - Linting
- **pnpm** - Gestor de paquetes
- **Vitest** - Pruebas unitarias (lógica de anti-salto cubierta)

---

## � Documentación

- `docs/README_DOCS.md`: índice de navegación y mapa de archivos.
- `docs/DOCUMENTATION_MANAGEMENT.md`: políticas de mantenimiento, responsables y checklist.
- `docs/COLLABORATOR_FEATURES.md`: guía completa del Portal del Colaborador.
- `docs/TROUBLESHOOTING.md`: resolución de problemas frecuentes.

> Solo se mantienen `README.md` y `CHANGELOG.md` en la raíz; el resto de documentación vive en `docs/`.

---

## �🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- pnpm (recomendado) o npm
- PostgreSQL 14+

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd lms-ssoma-dmh
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**
   
   Crear archivo `.env` en la raíz del proyecto:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/lms_ssoma"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

4. **Configurar base de datos**
   ```bash
   # Ejecutar migraciones
   pnpm prisma migrate dev
   
   # (Opcional) Seed inicial
   pnpm prisma db seed
   ```

5. **Iniciar servidor de desarrollo**
   ```bash
   pnpm dev
   ```

6. **Abrir en navegador**
   
   Ir a [http://localhost:3000](http://localhost:3000)

---

## 📁 Estructura del Proyecto

```
lms-ssoma-dmh/
├── prisma/
│   ├── schema.prisma          # Modelo de datos
│   └── migrations/            # Migraciones de BD
├── public/                    # Archivos estáticos
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # Landing page (público, raíz /)
│   │   ├── layout.tsx         # Layout global (SessionProvider)
│   │   ├── (public)/          # Route group: rutas públicas
│   │   │   ├── layout.tsx     # Layout sin sidebar
│   │   │   ├── login/page.tsx # Login con 2-column grid
│   │   │   └── register/page.tsx # Registro
│   │   ├── (authenticated)/   # Route group: rutas autenticadas
│   │   │   ├── layout.tsx     # Layout con sidebar
│   │   │   └── dashboard/page.tsx # Dashboard KPIs (/dashboard)
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Endpoints de autenticación
│   │   │   ├── collaborators/ # CRUD colaboradores
│   │   │   ├── courses/       # CRUD cursos
│   │   │   ├── learning-paths/# CRUD rutas de aprendizaje
│   │   │   ├── units/         # CRUD unidades
│   │   │   ├── lessons/       # CRUD lecciones
│   │   │   ├── files/         # Repositorio de archivos
│   │   │   ├── activities/    # Actividades interactivas
│   │   │   ├── areas/         # CRUD áreas
│   │   │   ├── positions/     # CRUD puestos
│   │   │   └── sites/         # CRUD sedes
│   │   ├── admin/             # Páginas de administración
│   │   │   ├── collaborators/ # Admin colaboradores
│   │   │   ├── courses/       # Admin cursos
│   │   │   │   └── [id]/content/ # Contenidos del curso
│   │   │   ├── learning-paths/# Admin rutas
│   │   │   ├── areas/         # Admin áreas
│   │   │   ├── positions/     # Admin puestos
│   │   │   └── sites/         # Admin sedes
│   │   ├── dashboard/         # Dashboard
│   │   ├── login/             # Página de login
│   │   └── register/          # Página de registro
│   ├── components/
│   │   ├── sidebar/           # Componentes del sidebar
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── nav-user.tsx
│   │   │   └── index.ts
│   │   ├── ui/                # Componentes shadcn/ui
│   │   ├── app-header.tsx     # Header global
│   │   ├── app-footer.tsx     # Footer global
│   │   └── data-table.tsx     # Tabla reutilizable
│   ├── lib/
│   │   ├── prisma.ts          # Cliente Prisma
│   │   └── utils.ts           # Utilidades
│   ├── validations/           # Esquemas Zod
│   ├── types/                 # Tipos TypeScript
│   └── auth.ts                # Configuración NextAuth
├── .env                       # Variables de entorno
├── components.json            # Config shadcn/ui
├── next.config.ts             # Config Next.js
├── tsconfig.json              # Config TypeScript
├── tailwind.config.ts         # Config Tailwind
├── package.json
├── CHANGELOG.md               # Historial de cambios
└── README.md                  # Este archivo
```

---

## 🔑 Variables de Entorno

Crear un archivo `.env` con las siguientes variables:

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/lms_ssoma"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-un-secret-seguro-aqui"

# (Opcional) Configuración adicional
NODE_ENV="development"
```

---

## 📜 Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Iniciar servidor de desarrollo (Turbopack)

# Build
pnpm build            # Crear build de producción
pnpm start            # Iniciar servidor de producción

# Database
pnpm prisma studio    # Abrir Prisma Studio (UI para BD)
pnpm prisma generate  # Generar cliente Prisma
pnpm prisma migrate dev    # Ejecutar migraciones en dev
pnpm prisma migrate deploy # Ejecutar migraciones en prod

# Linting
pnpm lint             # Ejecutar ESLint

# Tests
pnpm test            # Ejecutar pruebas unitarias (Vitest)
```

---

## 🔐 Roles y Permisos

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **SUPERADMIN** | Administrador total del sistema | Acceso completo a todas las funcionalidades |
| **ADMIN** | Administrador de empresa/área | Gestión de colaboradores, cursos, áreas |
| **COLLABORATOR** | Usuario final | Ver cursos asignados, completar capacitaciones |

---

## 🗄️ Modelo de Datos Principal

```prisma
User                  # Usuarios del sistema
├── Collaborator      # Colaboradores de la empresa
│   ├── Site          # Sedes/ubicaciones
│   ├── Area          # Áreas de trabajo
│   │   └── AreaHead  # Jefes de área
│   ├── Position      # Puestos de trabajo
│   ├── CollaboratorHistory  # Historial de cambios
│   ├── CourseAssignment     # Cursos asignados (deprecado, usar Enrollment)
│   ├── Enrollment    # Inscripciones E1/E2
│   ├── CourseProgress       # Progreso H1
│   ├── CertificationRecord  # Certificaciones H2
│   └── ProgressAlert        # Alertas H2
├── Course            # Catálogo de cursos
│   ├── CourseVersion # Historial de versiones
│   ├── CourseAssignments    # Asignaciones (deprecado)
│   ├── Enrollment    # Inscripciones vigentes
│   ├── Unit          # Unidades didácticas
│   │   └── Lesson    # Lecciones (VIDEO, PDF, PPT, HTML, SCORM)
│   │       └── LessonProgress  # Progreso de lecciones H1
│   ├── Quiz          # Cuestionarios F2
│   │   ├── Question  # Preguntas F1
│   │   └── QuizAttempt       # Intentos F3
│   ├── CourseProgress       # Progreso de cursos H1
│   ├── CertificationRecord  # Certificaciones H2
│   └── ProgressAlert        # Alertas H2
├── LearningPath      # Rutas de aprendizaje
│   ├── LearningPathCourse   # Cursos en ruta con prerequisitos
│   └── LearningPathProgress # Progreso de rutas H1
├── FileRepository    # Repositorio de archivos versionados
├── InteractiveActivity      # Actividades interactivas
│   └── ActivityAttempt      # Intentos de actividades
└── EnrollmentRule    # Reglas de inscripción automática E1
```

---

## 🌐 API Endpoints

### Autenticación
- `POST /api/auth/signin` - Iniciar sesión
- `POST /api/auth/signout` - Cerrar sesión
- `POST /api/register` - Registro de usuario

### Colaboradores
- `GET /api/collaborators` - Listar colaboradores (paginado)
- `POST /api/collaborators` - Crear colaborador
- `GET /api/collaborators/:id` - Obtener colaborador
- `PUT /api/collaborators/:id` - Actualizar colaborador
- `DELETE /api/collaborators/:id` - Eliminar colaborador
- `POST /api/collaborators/import` - Importar desde CSV/XLSX
- `GET /api/collaborators/template` - Descargar plantilla

### Cursos
- `GET /api/courses` - Listar cursos (filtros por estado)
- `POST /api/courses` - Crear curso (crea versión 1 automáticamente)
- `GET /api/courses/:id` - Obtener curso con versiones
- `PUT /api/courses/:id` - Actualizar curso (versionado automático)
- `DELETE /api/courses/:id` - Eliminar curso
- `POST /api/courses/:id/assign` - Asignar curso a colaboradores
- `GET /api/courses/assigned` - Cursos asignados de un colaborador

### Rutas de Aprendizaje
- `GET /api/learning-paths` - Listar rutas
- `POST /api/learning-paths` - Crear ruta
- `GET /api/learning-paths/:id` - Obtener ruta con cursos
- `PUT /api/learning-paths/:id` - Actualizar ruta
- `DELETE /api/learning-paths/:id` - Eliminar ruta
- `POST /api/learning-paths/:id/courses` - Agregar curso a ruta
- `DELETE /api/learning-paths/:id/courses` - Quitar curso de ruta

### Contenidos (Módulo D)
- `GET /api/courses/:id/units` - Listar unidades de un curso
- `POST /api/courses/:id/units` - Crear unidad
- `GET /api/units/:id` - Obtener unidad
- `PUT /api/units/:id` - Actualizar unidad
- `DELETE /api/units/:id` - Eliminar unidad
- `GET /api/units/:id/lessons` - Listar lecciones de una unidad
- `POST /api/units/:id/lessons` - Crear lección
- `GET /api/lessons/:id` - Obtener lección
- `PUT /api/lessons/:id` - Actualizar lección
- `DELETE /api/lessons/:id` - Eliminar lección
- `GET /api/lessons/:id/progress` - Obtener progreso de lección
- `PUT /api/lessons/:id/progress` - Actualizar progreso de lección
- `GET /api/files` - Listar archivos (con filtros)
- `POST /api/files` - Subir archivo
- `GET /api/activities` - Listar actividades interactivas
- `POST /api/activities` - Crear actividad

### Inscripciones (Módulo E)
- `GET /api/enrollment-rules` - Listar reglas de inscripción
- `POST /api/enrollment-rules` - Crear regla (aplica automáticamente)
- `GET /api/enrollment-rules/:id` - Obtener regla
- `PUT /api/enrollment-rules/:id` - Actualizar regla (activar/desactivar)
- `DELETE /api/enrollment-rules/:id` - Eliminar regla (cancela inscripciones)
- `GET /api/enrollments` - Listar inscripciones (con filtros)
- `POST /api/enrollments` - Inscripción manual individual/múltiple
- `POST /api/enrollments/bulk` - Inscripción masiva por filtros
- `GET /api/enrollments/:id` - Obtener inscripción
- `PUT /api/enrollments/:id` - Actualizar inscripción
- `DELETE /api/enrollments/:id` - Eliminar inscripción

### Progreso y Cumplimiento (Módulo H)
- `GET /api/progress/courses` - Listar progreso de cursos (con filtros)
- `POST /api/progress/courses` - Inicializar progreso de curso
- `GET /api/progress/courses/:id` - Obtener progreso de curso
- `PUT /api/progress/courses/:id` - Actualizar progreso de curso
- `DELETE /api/progress/courses/:id` - Eliminar progreso (admin)
- `POST /api/progress/courses/:id/exempt` - Exonerar colaborador (admin)
- `GET /api/progress/certifications` - Listar certificaciones
- `POST /api/progress/certifications` - Emitir certificación (admin)
- `GET /api/progress/certifications/:id` - Obtener certificación con historial
- `POST /api/progress/certifications/:id/revoke` - Revocar certificación (admin)
- `POST /api/progress/certifications/:id/recertify` - Crear recertificación (admin)
- `GET /api/progress/alerts` - Listar alertas de cumplimiento
- `POST /api/progress/alerts` - Crear alerta manual (admin)
- `PUT /api/progress/alerts/:id/read` - Marcar alerta como leída
- `PUT /api/progress/alerts/:id/dismiss` - Descartar alerta
- `POST /api/progress/alerts/generate` - Generar alertas automáticas (cron/admin)
- `PUT /api/lessons/:id/progress` - Actualizar progreso de lección (oficial)
  - Nota: el endpoint anterior `/api/progress/lessons/:lessonId` fue deprecado y ahora responde 410 Gone.
- `GET /api/progress/paths` - Obtener progreso de rutas de aprendizaje
- `POST /api/progress/paths` - Crear/actualizar progreso de ruta

### Áreas
- `GET /api/areas` - Listar áreas
- `POST /api/areas` - Crear área
- `POST /api/areas/:id/head` - Asignar jefe de área

### Puestos
- `GET /api/positions` - Listar puestos
- `POST /api/positions` - Crear puesto

---

## 🎨 Componentes UI Principales

### Sidebar
- Componente colapsible responsive
- Navegación condicional por rol
- Integración con NextAuth para datos de usuario
- Tooltips en modo icon

### Header
- Breadcrumbs dinámicos basados en ruta
- SidebarTrigger para mobile
- Separador visual

### Footer
- Grid responsive (4 columnas)
- Enlaces rápidos, recursos, contacto
- Copyright dinámico

### DataTable
- Tabla reutilizable con paginación
- Búsqueda integrada
- Ordenamiento de columnas

---

## � Documentación

La documentación completa se organiza en tres archivos principales en la carpeta `docs/`:

### 1. **[docs/MODULES.md](./docs/MODULES.md)** - Descripción de Módulos
Descripción funcional de todos los módulos del sistema (10 módulos completos):
- Módulo K: Certificados (Emisión y Verificación Pública) ⭐ **NUEVO**
- Módulo J: Reportes (Áreas, Curso, Cumplimiento)
- Módulo I: Notificaciones y Recordatorios
- Módulo H: Progreso y Cumplimiento
- Módulo F: Evaluaciones Automatizadas
- Módulo E: Inscripciones y Accesos
- Módulo D: Contenidos Interactivos
- Módulo C: Catálogo de Cursos
- Módulo B: Rutas de Aprendizaje
- Módulo A: Usuarios y Autenticación

**Úsalo para**: Entender qué hace cada módulo y sus características principales.

### 2. **[docs/API_REFERENCE.md](./docs/API_REFERENCE.md)** - Referencia de API
Referencia técnica completa de 99+ endpoints REST:
- Módulo K: Certificados (4 endpoints) ⭐ **NUEVO**
- Módulo J: Reportes (5 endpoints)
- Módulo I: Notificaciones (11 endpoints)
- Módulo H: Progreso (15 endpoints)
- Módulo F: Evaluaciones (8 endpoints)
- Todos los módulos anteriores
- Códigos de error y headers
- Ejemplos de request/response

**Úsalo para**: Integración con la API, request/response examples, debugging.

### 3. **[docs/IMPLEMENTATION_NOTES.md](./docs/IMPLEMENTATION_NOTES.md)** - Notas Técnicas
Detalles de implementación, arquitectura y decisiones técnicas:
- Estructura del proyecto
- Base de datos y Prisma (39+ modelos)
- Autenticación y validación
- Cada módulo en profundidad
- Performance y security
- Troubleshooting

**Úsalo para**: Entender la arquitectura, contribuir al código, debugging.

### 4. **[docs/MODULE_K_STATUS.md](./docs/MODULE_K_STATUS.md)** - Estado Módulo K ⭐ **NUEVO**
Estado completo del Módulo K - Certificados:
- Emisión automática de certificados PDF con @react-pdf/renderer
- Plantilla profesional landscape con bordes dobles y marca de agua
- Código de verificación único (16 chars hex) + QR code
- Verificación pública sin autenticación en `/verify/[code]`
- Estados visuales claros (verde/amarillo/rojo)
- Panel de administración con listado y acciones
- 4 endpoints REST (3 protegidos, 1 público)
- Servicio con 6 funciones (240 líneas)
- Componente template (260 líneas)
- Total 1,220 líneas de código

### 5. **[docs/MODULE_J_STATUS.md](./docs/MODULE_J_STATUS.md)** - Estado Módulo J
Estado completo del Módulo J - Reportes:
- Dashboard ejecutivo con 15+ KPIs y 4 gráficos interactivos
- Reportes por área, curso, cumplimiento
- Matriz de cumplimiento con semáforo (🟢🟡🔴)
- Trazabilidad de evaluaciones con auditoría
- 5 endpoints REST + 6 servicios (600+ líneas)
- 4 modelos Prisma + 3 enums
- Integración con recharts, date-fns, shadcn/ui

**Úsalo para**: Entender a fondo el sistema de reportes y analítica.

### 6. **[docs/MODULE_I_STATUS.md](./docs/MODULE_I_STATUS.md)** - Estado Módulo I
Estado completo del Módulo I - Notificaciones:
- Sistema de notificaciones email e in-app
- 8 tipos de eventos configurables
- Plantillas editables con 20+ variables
- Recordatorios al jefe con resumen de equipo
- 11 endpoints REST completos

**Úsalo para**: Entender a fondo el sistema de notificaciones.

### 7. **[docs/README_DOCS.md](./docs/README_DOCS.md)** - Guía de Documentación
Índice y guía de navegación de toda la documentación:
- Estado de módulos (10/10 completados ✅)
- Estructura de documentación
- Estadísticas del sistema
- Cómo navegar la documentación

**Úsalo para**: Punto de entrada a toda la documentación del proyecto.

---

### Cambio Reciente: Módulo K - Certificados (Octubre 2025)

Se completó el **Módulo K de Certificados** con emisión automática y verificación pública:
- Generación de certificados PDF profesionales con @react-pdf/renderer
- Códigos de verificación únicos + QR codes para autenticidad
- Página de verificación pública sin autenticación (`/verify/[code]`)
- Panel de administración con listado, generación y descarga
- Plantilla landscape con diseño profesional (bordes dobles, marca de agua)
- 4 endpoints REST: generate, download, list, verify (1 público)
- Ver detalles en [docs/MODULE_K_STATUS.md](./docs/MODULE_K_STATUS.md)

### Cambio Previo: Módulo J - Reportes (Octubre 2025)

Se completó el **Módulo J de Reportes** con analítica avanzada:
- Dashboard ejecutivo con KPIs en tiempo real
- 5 tipos de reportes: Dashboard, Área, Curso, Cumplimiento, Auditoría
- Visualizaciones con recharts (BarChart, PieChart, AreaChart, LineChart)
- Matriz de cumplimiento con semáforo de tráfico
- Trazabilidad completa de evaluaciones con IP y timestamps
- Ver detalles en [docs/MODULE_J_STATUS.md](./docs/MODULE_J_STATUS.md)

### Cambio Previo: Inscripción Masiva (E2.2)

Se completó la funcionalidad de **inscripción masiva por filtros** en enero 2025:
- Endpoint `POST /api/enrollments/bulk` con transacciones ACID
- Modal UI `EnrollBulkDialog` con filtros de sede/área/puesto
- Validación Zod multi-capa (cliente + servidor)
- Ver detalles en [docs/MODULES.md#e22-inscripción-masiva-por-filtros](./docs/MODULES.md#e22-inscripción-masiva-por-filtros)

---

## �📝 Convenciones de Código

### TypeScript
- Usar tipos explícitos siempre que sea posible
- Evitar `any`, usar `unknown` si es necesario
- Interfaces para objetos, types para uniones

### Componentes
- Server components por defecto
- `"use client"` solo cuando sea necesario
- Extraer lógica compleja a hooks personalizados

### Estilos
- Tailwind CSS para estilos
- Componentes shadcn/ui para UI consistente
- Evitar CSS personalizado cuando sea posible

### Validación
- Zod para validación de esquemas
- Schemas en `src/validations/`
- Reutilizar schemas entre cliente y servidor

---

## 🚧 Desarrollo

### Agregar una nueva página

1. Crear archivo en `src/app/nueva-ruta/page.tsx`
2. Agregar ruta al mapeo de breadcrumbs en `app-header.tsx`
3. (Opcional) Agregar link en sidebar si es necesario

### Agregar un nuevo endpoint API

1. Crear archivo en `src/app/api/nuevo-endpoint/route.ts`
2. Crear schema de validación en `src/validations/`
3. Implementar handlers GET/POST/PUT/DELETE según necesidad

### Agregar un componente shadcn/ui

```bash
pnpm dlx shadcn@latest add [component-name]
```

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

Ver [CHANGELOG.md](./CHANGELOG.md) para historial de cambios.

---

## 📄 Licencia

Propietario - DMH © 2025. Todos los derechos reservados.

---

## 📝 Historial de Versiones

Para ver el historial completo de cambios, consulta [CHANGELOG.md](./CHANGELOG.md).

### Versiones Recientes
- **v2.1.5** (3 Nov 2025) - Reestructuración administrativa y mejoras UX
- **v2.1.4** (31 Oct 2025) - Sistema de asistencia y horas estandarizadas
- **v2.1.3** (31 Oct 2025) - Mejoras UX/UI en cuestionarios y corrección de bucles React
- **v2.1.2** (29 Oct 2025) - Anti-salto en progreso y completado manual para no-video
- **v2.1.1** (29 Oct 2025) - Enforzamiento de prerrequisitos en servidor
- **v2.1.0** (27 Oct 2025) - Consolidación de reportes y optimización arquitectónica

---

## 🆘 Soporte

Para soporte y preguntas:
- Email: soporte@dmh.com
- Documentación interna: [Enlace pendiente]

---

## 🙏 Reconocimientos

- [Next.js](https://nextjs.org/) - Framework React
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Prisma](https://www.prisma.io/) - ORM
- [NextAuth](https://next-auth.js.org/) - Autenticación
