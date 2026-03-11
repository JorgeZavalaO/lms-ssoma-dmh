# Changelog

Todos los cambios notables del proyecto LMS SSOMA DMH serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [2.2.6] - 2026-03-11

### Agregado - Repositorio de Archivos V3

- ✅ **Ciclo de vida persistente para archivos**
  - Nuevo enum `FileLifecycleStatus` con estados `ACTIVE`, `DISABLED` y `DELETED`
  - `FileRepository` ahora guarda motivo y trazabilidad de deshabilitado y eliminación
  - Migración aditiva: `20260311160438_add_file_lifecycle_management`

- ✅ **Deshabilitado seguro antes del borrado**
  - Nuevo flujo operativo para deshabilitar archivos con motivo obligatorio
  - Reactivación disponible para devolver el archivo a circulación
  - `/api/files` deja de exponer archivos deshabilitados o eliminados en listados operativos

- ✅ **Eliminación física protegida del blob**
  - Nuevo endpoint `DELETE /api/admin/files/[id]`
  - Solo permite borrar si el archivo está deshabilitado y no se detectan referencias directas ni heurísticas
  - El registro queda conservado como auditoría histórica tras eliminar el blob

- ✅ **UI/UX V3 en `/admin/files`**
  - Nueva columna de ciclo de vida con badges visuales
  - Filtro por estado operativo (`activos`, `deshabilitados`, `eliminados`)
  - Acciones seguras desde el detalle: deshabilitar, reactivar y eliminar blob
  - Bloqueos visibles en pantalla cuando todavía existen dependencias detectadas

- ✅ **Export y métricas extendidas**
  - Exportación ahora incluye ciclo de vida, elegibilidad de borrado y motivos registrados
  - Nuevos KPIs para activos, deshabilitados, eliminados y archivos ya eliminables

### Seguridad Operativa

- ✅ Se mantiene el enfoque conservador para producción:
  - sin reset de base de datos
  - con migración aditiva compatible con datos existentes
  - eliminación física bloqueada ante cualquier referencia detectable
  - trazabilidad persistente incluso después del borrado del blob

### Técnico

- **Archivos nuevos**:
  1. `src/components/admin/files/file-lifecycle-badge.tsx`
  2. `src/components/admin/files/file-lifecycle-actions.tsx`

- **Archivos actualizados**:
  1. `prisma/schema.prisma`
  2. `src/lib/file-inventory.ts`
  3. `src/app/api/files/route.ts`
  4. `src/app/api/admin/files/route.ts`
  5. `src/app/api/admin/files/[id]/route.ts`
  6. `src/app/api/admin/files/export/route.ts`
  7. `src/app/(authenticated)/admin/files/page.tsx`
  8. `src/app/(authenticated)/admin/files/table.tsx`
  9. `src/components/admin/files/file-detail-dialog.tsx`
  10. `README.md`
  11. `CHANGELOG.md`

### Validación prevista

- `pnpm lint`
- `pnpm test`
- `pnpm build`

## [2.2.5] - 2026-03-11

### Agregado - Repositorio de Archivos V2

- ✅ **Priorización operativa de revisión**
  - Cada archivo del inventario ahora clasifica su revisión como `HIGH`, `MEDIUM` o `LOW`
  - La prioridad considera estado de uso, antigüedad del archivo y si parece ser una versión reemplazada
  - Se agrega recomendación operativa por archivo para auditoría manual

- ✅ **Nuevas métricas V2 en `/admin/files`**
  - Candidatos de revisión
  - Peso sin uso detectado
  - Peso heurístico pendiente de validación

- ✅ **Exportación segura del inventario**
  - Nuevo endpoint `GET /api/admin/files/export`
  - Exportación en `CSV` y `XLSX`
  - Respeta filtros activos del módulo (`q`, `fileType`, `usageState`, `tag`)
  - Excel con hojas `Resumen` e `Inventario`

- ✅ **Mejoras UI/UX de V2**
  - Nueva columna de revisión con badges de prioridad
  - Botón rápido `Candidatos` para filtrar archivos sin uso detectado
  - Botones de exportación directa desde la toolbar
  - Detalle del archivo enriquecido con prioridad, recomendación y días desde carga

### Seguridad Operativa

- ✅ Se mantiene el enfoque no destructivo:
  - sin migraciones Prisma
  - sin soft-delete persistente
  - sin eliminación física de blobs
  - sin cambios de datos productivos

### Técnico

- **Archivos nuevos**:
  1. `src/app/api/admin/files/export/route.ts`
  2. `src/components/admin/files/file-review-badge.tsx`

- **Archivos actualizados**:
  1. `src/lib/file-inventory.ts`
  2. `src/app/(authenticated)/admin/files/table.tsx`
  3. `src/components/admin/files/file-detail-dialog.tsx`
  4. `README.md`
  5. `CHANGELOG.md`

### Validación prevista

- `pnpm lint`
- `pnpm test`
- `pnpm build`

## [2.2.4] - 2026-03-11

### Agregado - Repositorio de Archivos V1 con Trazabilidad Segura

- ✅ **Nuevo módulo admin `/admin/files`**
  - Página administrativa para inventariar archivos subidos al blob
  - Tabla con búsqueda, paginación y filtros por tipo, estado de uso y etiqueta
  - KPIs operativos: total, uso directo, sin uso detectado y detecciones heurísticas
  - Acciones seguras: ver detalle, abrir archivo y copiar URL

- ✅ **Nueva capa de inventario enriquecido**
  - Servicio `src/lib/file-inventory.ts` para consolidar metadata y referencias detectadas
  - Clasificación de uso en tres estados:
    - `IN_USE` → referencias directas confirmadas
    - `HEURISTIC_ONLY` → coincidencias embebidas o indirectas
    - `UNUSED` → sin referencias detectadas
  - Resumen contextual con curso, unidad y lección cuando existe relación visible

- ✅ **Trazabilidad directa e heurística**
  - Detección directa contra `Lesson.fileUrl`
  - Detección directa contra `CertificationRecord.pdfUrl` y `CertificationRecord.certificateUrl`
  - Detección heurística dentro de `lesson.htmlContent`
  - Detección heurística dentro de `interactiveActivity.htmlContent`
  - Etiquetado explícito de nivel de confianza en la UI para evitar decisiones riesgosas

- ✅ **API admin nueva para inventario**
  - `GET /api/admin/files` → listado enriquecido con filtros y paginación
  - `GET /api/admin/files/[id]` → detalle contextual completo del archivo
  - Ambas rutas protegidas para `ADMIN` y `SUPERADMIN`

- ✅ **Integración visual y navegación**
  - Nuevo acceso en sidebar: **Repositorio de Archivos**
  - Breadcrumb e iconografía añadidos en `AppHeader`
  - Enlace rápido añadido en footer
  - Quick link agregado al dashboard ejecutivo admin

### Seguridad Operativa

- ✅ **Sin migraciones Prisma**
  - No se modificó `prisma/schema.prisma`
  - No se generaron migraciones nuevas

- ✅ **Sin acciones destructivas en V1**
  - No elimina archivos del blob
  - No modifica referencias existentes en cursos o lecciones
  - Diseñado como módulo de auditoría para producción

### Documentación

- README actualizado con:
  - Descripción del nuevo módulo `/admin/files`
  - Variables de entorno relevantes para blob
  - Nuevos endpoints admin del inventario
  - Resumen de la V1 segura para producción

### Técnico

- **Archivos nuevos**:
  1. `src/lib/file-inventory.ts`
  2. `src/app/api/admin/files/route.ts`
  3. `src/app/api/admin/files/[id]/route.ts`
  4. `src/app/(authenticated)/admin/files/page.tsx`
  5. `src/app/(authenticated)/admin/files/table.tsx`
  6. `src/components/admin/files/file-usage-badge.tsx`
  7. `src/components/admin/files/file-detail-dialog.tsx`

- **Archivos actualizados**:
  1. `src/components/sidebar/app-sidebar.tsx`
  2. `src/components/layout/app-header.tsx`
  3. `src/components/layout/app-footer.tsx`
  4. `src/app/(authenticated)/admin/dashboard/admin-dashboard-client.tsx`
  5. `README.md`
  6. `CHANGELOG.md`

- **Validación prevista**:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`

## [2.2.3] - 2025-12-01

### Agregado - Sistema de Templates de Colaboradores con Gestión de Contraseñas

- ✅ **Email opcional en creación de colaboradores**
  - Email convertido a opcional en schema Zod (`z.string().email().optional().or(z.literal(""))`)
  - Refine rule 1: Si hay password, email es obligatorio
  - Refine rule 2: Si createUser=true y hay email, password es obligatorio
  - Email placeholder automático: `${dni}@noemail.local` para colaboradores sin cuenta
  - Usuario creado solo si email y password válidos están presentes
  - Validación condicional en cliente y servidor

- ✅ **Campo Password agregado al template Excel**
  - Template expandido de 8 a 9 columnas totales
  - Headers: DNI, Nombres, Email, **Password (nuevo)**, Area, Puesto, Sede, Estado, FechaIngreso
  - 3 ejemplos incluidos en template:
    - 2 ejemplos con email + password (para crear usuarios)
    - 1 ejemplo sin email/password (colaborador sin cuenta)
  - Hoja "Instrucciones" expandida con 12 filas explicativas:
    - Documentación de campo Email: "Condicional", "OBLIGATORIO si se proporciona Password"
    - Documentación de campo Password: "Condicional", "Requiere Email. Dejar vacío si no necesita cuenta"
    - Notas importantes sobre relación entre Email y Password
  - Anchos de columna ajustados para incluir Password (15 wch)

- ✅ **Import con creación automática de usuarios**
  - Lectura de columnas Email y Password del archivo Excel
  - Import estático de bcrypt: `import bcrypt from "bcryptjs"`
  - Hash seguro de contraseñas: `await bcrypt.hash(password, 10)`
  - Lógica condicional de creación de usuario:
    ```typescript
    if (data.email && data.email.length > 0 && data.password && data.password.length >= 6) {
      const hashedPassword = await bcrypt.hash(data.password, 10)
      collaboratorData.user = {
        create: {
          email: data.email,
          hashedPassword,
          role: "COLLABORATOR",
        }
      }
    }
    ```
  - Validación de password mínimo 6 caracteres
  - Email placeholder si no se proporciona: `${dni}@noemail.local`

- ✅ **Export con formato reimportable**
  - Nueva estructura de 2 hojas en Excel:
    - **Hoja 1 "Para Reimportar"**: 9 columnas con códigos (area.code, site.code)
    - **Hoja 2 "Datos Detallados"**: 11 columnas con nombres completos + códigos
  - Columna Password agregada (vacía por seguridad)
  - Filtrado de emails generados internamente:
    ```typescript
    c.email && !c.email.includes('@noemail.local') ? c.email : ""
    ```
  - Export CSV actualizado con misma estructura que hoja 1
  - Anchos de columna optimizados para legibilidad

- ✅ **API de colaboradores actualizada**
  - Endpoint `/api/collaborators/route.ts` modificado:
    - Email con fallback: `email: data.email || \`${data.dni}@noemail.local\``
    - Validación para creación de usuario: `if (data.createUser !== false && data.email && data.email.length > 0)`
  - Endpoint `/api/collaborators/import/route.ts` modificado:
    - Import de bcrypt agregado
    - Lectura de Password del Excel
    - Creación condicional de usuario con hash
  - Endpoint `/api/collaborators/export/route.ts` modificado:
    - 2 hojas con códigos para reimportación
    - Filtrado de emails placeholder
  - Endpoint `/api/collaborators/template/route.ts` modificado:
    - 9 columnas incluyendo Password
    - Hoja de instrucciones expandida

### Cambiado

- **Validaciones de colaboradores** (`src/validations/collaborators.ts`):
  - Email de obligatorio a opcional
  - Password agregado como campo opcional con validación mínima
  - 2 refine rules para interdependencia email-password

- **Schema Prisma** (`prisma/schema.prisma`):
  - Comentario actualizado en campo email: "Email único (puede ser generado internamente si no se proporciona)"
  - Sin cambios estructurales (campo sigue siendo único a nivel DB)

### Corregido

- **Error de compilación**: `require()` style import forbidden
  - Solución: Cambiado de `const bcrypt = require("bcryptjs")` a `import bcrypt from "bcryptjs"`
  - Ubicación: `/app/api/collaborators/import/route.ts`

- **Error de tipos TypeScript**: `Type 'string | undefined' is not assignable to type 'string'`
  - Problema: Email opcional pero Prisma espera string
  - Solución 1: Email con fallback `|| \`${dni}@noemail.local\``
  - Solución 2: Validación adicional antes de crear usuario
  - Ubicación: `/app/api/collaborators/route.ts` línea 104

### Técnico

- **Archivos modificados** (8 archivos en total):
  1. `src/validations/collaborators.ts` - Schema con refine rules
  2. `src/app/api/collaborators/template/route.ts` - Template 9 columnas + instrucciones
  3. `src/app/api/collaborators/import/route.ts` - Import con bcrypt
  4. `src/app/api/collaborators/export/route.ts` - Export 2 hojas con filtrado
  5. `src/app/api/collaborators/route.ts` - Email fallback + validación usuario
  6. `prisma/schema.prisma` - Comentario actualizado
  7. `README.md` - Documentación actualizada
  8. `CHANGELOG.md` - Historial de cambios

- **Dependencias**:
  - `bcryptjs`: Ya existente, ahora usado en import
  - `xlsx` (SheetJS): Ya existente para Excel
  - `zod`: Ya existente para validaciones

- **Build exitoso**:
  - Compilación: ✓ 7.4 segundos
  - Rutas generadas: 77 páginas
  - Errores TypeScript: 0
  - Warnings: Solo pre-existentes ESLint (no nuevos)
  - Correcciones aplicadas: 3 (require import, tipo undefined, validación condicional)

### Beneficios de la Implementación

- ✅ **Flexibilidad**: Colaboradores con o sin cuenta de acceso
- ✅ **Seguridad**: Hash bcrypt de contraseñas, validación en múltiples capas
- ✅ **UX mejorada**: Template con ejemplos e instrucciones claras
- ✅ **Reimportación fácil**: Export con códigos para reimportar sin pérdida de datos
- ✅ **Gestión masiva**: Creación de usuarios en lote con importación Excel
- ✅ **Validación robusta**: Email y password interdependientes con mensajes claros
- ✅ **Compatibilidad**: Sistema funciona con colaboradores existentes

---

## [2.2.0] - 2025-11-04

### Mejora UI - Módulo de Colaboradores + Descarga Excel

- ✅ **Módulo de Colaboradores rediseñado**
  - Header mejorado: icono Users, título 3xl, descripción clara con `ml-8` alineación.
  - Paleta minimalista aplicada: slate (neutral), emerald (primary), blue (secondary), amber/red (warnings).

- ✅ **Componentes reutilizables creados**
  - Nueva carpeta: `src/components/admin/collaborators/`
  - `CollaboratorPill`: Badge con colores minimalista (default/success/warning/danger).
  - `ExportCollaboratorsButton`: Botón con spinner para descargar Excel.
  - Exports centralizados en `index.ts` para mejor mantenimiento.

- ✅ **Tabla de colaboradores mejorada**
  - Colores de texto: `text-slate-900` (primario), `text-slate-600` (secundario).
  - Email con link clickable en color emerald-600.
  - Pills con bordes subtiles y fondos coloreados:
    * ACTIVE: `bg-emerald-50 text-emerald-700 border-emerald-200`
    * INACTIVE: `bg-amber-50 text-amber-700 border-amber-200`
    * Rol SUPERADMIN: rojo, ADMIN: ámbar, COLLABORATOR: gris
  - Botones "Rol" con icono Shield y label responsivo.

- ✅ **Dialog "Cambiar Rol" rediseñado**
  - Header con icono Shield (emerald-600).
  - Campo colaborador en fondo gris claro (`bg-slate-50 border-slate-200`).
  - Select minimalista: `focus:border-emerald-500`.
  - Estados con iconos (CheckCircle2 ✓, AlertCircle ⚠).
  - Footer con botones Cancel/Submit (CTA en emerald-600).

- ✅ **Descarga Excel implementada**
  - Endpoint: `/api/collaborators/export?format=xlsx|csv`
  - Traer todos los colaboradores sin paginación.
  - Columnas: DNI, Nombre, Email, Estado, Fecha Entrada, Área, Puesto, Sede, Rol.
  - Archivos auto-nombrados: `colaboradores_YYYY-MM-DD.xlsx`.
  - Botón "Descargar Excel" en header derecho con loading spinner.
  - Soporte dual: XLSX (con lib `xlsx`) y CSV.

- ✅ **Build validado**: Compilación exitosa en 9.8s, 79 páginas (+1 export), 0 errores.

## [2.1.9] - 2025-11-04

### Mejora UI - Diálogos y Módulo de Contenido

- ✅ **Dialog "Editar Curso" rediseñado**
  - Aplicada estética minimalista igual que el dialog crear (iconos, secciones agrupadas, colores emerald).
  - Secciones lógicas: Identificación, Nombre, Objetivo, Descripción, Configuración, Requisitos.
  - Spinner animado en botón submit.

- ✅ **Dialog "Inscribir Colaboradores" mejorado**
  - Nuevo diseño consistente con minimalista.
  - Header con icono Users y nombre del curso destacado.
  - Búsqueda con indicador de carga integrado.
  - Lista en fondo sutil (`bg-slate-50/30`) con mejor contraste.
  - Sección Notas con icono MessageSquare.
  - Botón CTA dinámico mostrando cantidad seleccionada.

- ✅ **Módulo de Contenido (Unidades/Lecciones) refactor**
  - Header mejorado: icono BookOpen, título 3xl, descripción clara, card informativa con tips.
  - Badges coloreados: Unidades (emerald-50/700), Lecciones (blue-50/700).
  - Cards vacías mejoradas: dashed borders, iconos grandes, spacing consistente.
  - Mejor spacing vertical (`space-y-8`), text truncation, flexbox improvements.
  - Componentes SortableUnit y SortableLesson actualizados con paleta minimalista.

- ✅ **Build validado**: Compilación exitosa en 8.9s, 78 páginas, 0 errores.

## [2.1.8] - 2025-11-04

### Mejora UI - Dialog Crear Curso

- ✅ **Dialog rediseñado con estética minimalista**
  - Bordes sutiles (`border-slate-200`), colores emerald para CTA (`bg-emerald-600`).
  - Iconos descriptivos en cada sección (BookOpen, FileText, Users, Clock, AlertCircle, CheckCircle2).
  - Mejor legibilidad y escaneo visual del formulario.

- ✅ **Organización mejorada de campos**
  - Sección "Estado" con indicadores visuales (puntos de color para Draft/Published/Archived).
  - Sección "Configuración de Tiempo" agrupa Duración, Modalidad y Vigencia bajo un header común.
  - Requisitos Previos en sección aparte con descripción clara.

- ✅ **UX mejorada en interacciones**
  - Placeholder y Labels con ejemplos concretos ("Ej: Seguridad Industrial Avanzada").
  - Spinner animado en botón submit durante creación.
  - Botón Cancelar ahora visible en footer.

- ✅ **Build validado**: Compilación exitosa, 78 páginas, 0 errores.

## [2.1.7] - 2025-11-04

### Agregado / Corregido - Módulo de Certificaciones

- ✅ **API: Transformación y compatibilidad**
  - `GET /api/progress/certifications` ahora devuelve un objeto envuelto `{ certifications: [...] }` y transforma los datos para el cliente:
    - `collaborator.fullName` se divide en `firstName` y `lastName`.
    - `course.validity` se expone como `course.validityMonths`.
  - Se aplicó la misma transformación en los endpoints:
    - `POST /api/progress/certifications/[id]/recertify` → respuesta transformada y wrapped
    - `POST /api/progress/certifications/[id]/revoke` → respuesta transformada y wrapped
  - Beneficio: compatibilidad con el cliente y patrón uniforme de respuesta en los módulos de progreso/alerts.

- ✅ **Admin UI: Refactor y mejoras UX**
  - Nuevo componente `ClientCertifications` (`src/app/(authenticated)/admin/certifications/client-certifications.tsx`) que reemplaza lógica inline en `page.tsx`.
  - Añade: stats cards (total/válidos/invalidos/por vencer), búsqueda, filtros por estado, acciones (generar, descargar, verificar), estados de carga y mensajes con `sonner`.
  - Estética minimalista: bordes de cards coloreados (emerald/amber/red/slate), tipografía `font-semibold` y spacing estandarizado.

- ✅ **Public Verify Page**
  - `src/app/(public)/verify/[code]/page.tsx` rediseñada con estilo minimalista (bg-slate-50, cards con border-slate-200, badges sobrios) y mejor presentación de la información pública mínima del certificado.

- ✅ **Correcciones y limpieza**
  - Eliminación de imports no usados y eliminación de `any` innecesarios en el componente cliente.
  - Mejora de manejo de errores con toasts en `loadCertifications`, `handleGenerate`, etc.

- ✅ **Build validado**: Compilación exitosa tras cambios (78 páginas, 0 errores). Se mantienen warnings ESLint preexistentes.

## [2.1.6] - 2025-11-03

### Agregado - Mejoras en Gestión de Colaboradores

- **Validación de Contraseña Condicional en Creación de Colaboradores**:
  - Password field es requerida solo cuando `createUser=true` en diálogo de creación
  - Implementado mediante `.refine()` en Zod schema validando ambas condiciones
  - Validación manual cliente-side antes de Zod para evitar errores en pasos intermedios
  - Mensaje de error claro: "La contraseña debe tener mínimo 6 caracteres" solo cuando se valida
  - Resolución de ZodError que aparecía al navegar entre pasos sin completar password

- **Reestructuración UX del Diálogo de Creación de Colaboradores**:
  - Flujo lineal de 3 pasos: Información básica → Organización → Datos de cuenta
  - Botones contextuales: "Siguiente" en pasos 1-2, "Crear Colaborador" solo en paso 3
  - Validación clara: Solo se habilita submit en paso 3 (cuando password field es visible)
  - Navigation simplificada: No hay saltos condicionales entre pasos, solo progressión lineal
  - Field `createUser` mostrado solo en paso 3 para claridad del flujo
  - Mejor UX: El error de password solo aparece cuando efectivamente se intenta crear usuario

- **Importación de Colaboradores como Modal Dialog**:
  - Eliminada página separada `/admin/collaborators/import`
  - Import ahora se abre como dialog modal desde botón "Importar" en tabla de colaboradores
  - Usuarios permanecen en página de colaboradores, sin navegación innecesaria
  - Interfaz de drag-and-drop mejorada dentro del modal
  - Resultados de importación mostrados inline en el dialog

- **Interface de Drag-and-Drop para Importación**:
  - Área interactiva para soltar archivos con feedback visual
  - Selector de archivos tradicional como alternativa (click)
  - Soportados formatos: .xlsx, .xls, .csv
  - Botón de upload deshabilitado hasta seleccionar archivo
  - Indicador de loading durante la subida
  - Botones de descarga de plantillas (XLSX/CSV) disponibles en dialog

- **Resultados de Importación Inline**:
  - Después de upload exitoso se muestran resultados en 3 tarjetas:
    - Colaboradores creados (count + icono)
    - Colaboradores actualizados (count + icono)
    - Filas omitidas (count + icono)
  - Tabla expandible con errores detallados:
    - Número de fila del archivo
    - Mensaje de error específico
    - Scroll horizontal para muchos errores
  - Dialog se cierra automáticamente 2 segundos después de importación exitosa
  - Toast notification con confirmación de proceso

- **Auto-Refresh Automático de Tabla**:
  - Callback `onImported()` triggered tras importación exitosa
  - Tabla de colaboradores se recarga automáticamente sin manual refresh
  - Nuevos colaboradores aparecen inmediatamente
  - Paginación reinicia a página 1
  - Estados y filtros se preservan

### Técnico

- **Archivos modificados principales**:
  - `src/validations/collaborators.ts`: Schema con `.refine()` para validación condicional de password
  - `src/components/admin/collaborator-modals.tsx`:
    - Adición de `ImportCollaboratorsDialog` component (~140 líneas nuevas)
    - Tipos: `ImportCollaboratorsDialogProps`, `ImportResult`
    - Features: Drag-drop, file input, upload handler, results display, error table
    - States: file, result, loading, drag, fileInputRef
    - Handlers: handleUpload, handleClose, drag events
  - `src/app/(authenticated)/admin/collaborators/table.tsx`:
    - Importación agregada: `ImportCollaboratorsDialog`
    - Reemplazo de botón Link-based: `<Link><Button>Importar</Button></Link>` → `<ImportCollaboratorsDialog onImported={() => load()} />`
    - Limpieza de imports: Removidos `Upload` (icon) y `Link` (component)

- **Component ImportCollaboratorsDialog**:
  - Props: `{ onImported?: () => void }`
  - Estados internos: file (File | null), result (ImportResult | null), loading, drag, fileInputRef
  - Drag-drop zone con visual feedback (background color on hover)
  - File input con filtro `.xlsx, .xls, .csv`
  - Upload button con disabled state y loading indicator
  - Template download buttons (XLSX, CSV) para referencia
  - Results grid: 3 cards mostrando created/updated/skipped
  - Error table: Scrollable con detalles de fallos
  - Auto-close: setTimeout(2000) después de resultado exitoso
  - FormData upload a `/api/collaborators/import`
  - Response interface: `{ created, updated, skipped, errors: [{row, message}] }`

- **Dependencies**:
  - Ninguna nueva (usa componentes shadcn/ui existentes)
  - Reutiliza FormData API, fetch API, Dialog component

- **Build exitoso**:
  - Compilación: ✓ 7.4 segundos
  - Rutas generadas: 78 páginas
  - Errores TypeScript: 0
  - Warnings: Solo pre-existentes ESLint (no nuevos)

### Beneficios de la Implementación

- ✅ **Mejor UX**: Validación inteligente de password, flujo claro en diálogo
- ✅ **Eficiencia**: Import sin abandonar página actual
- ✅ **Feedback visual**: Drag-drop intuitivo, resultados inline
- ✅ **User-friendly**: Plantillas descargarles, error details, auto-refresh
- ✅ **Robustez**: Validación en cliente y servidor, manejo de errores completo
- ✅ **Performance**: Build validado, 0 regresiones

---

## [2.1.5] - 2025-11-03

### Agregado - Reestructuración Administrativa y Mejoras UX

- **Reestructuración de /admin como Carpeta Organizacional**:
  - Eliminada página visible `/admin/page.tsx` para evitar ruta accesible
  - `/admin` ahora funciona como carpeta organizacional para paneles administrativos
  - Todas las referencias actualizadas: footer y breadcrumbs apuntan a `/admin/dashboard`
  - Middleware ya protegía rutas `/admin/*`, ahora sin página raíz visible
  - Arquitectura más limpia: `/admin/dashboard`, `/admin/courses`, `/admin/collaborators`, etc.

- **Breadcrumbs Inteligentes con Redirecciones**:
  - "Inicio" en breadcrumbs ahora redirige a `/dashboard` en lugar de `/`
  - Segmento `/admin` omitido en breadcrumbs para navegación más limpia
  - Lógica condicional: `if (currentPath === "/admin") return` para saltar segmento
  - Mapeo de rutas actualizado con `/admin/dashboard` incluido

- **Redirecciones Automáticas para Usuarios Autenticados**:
  - Página raíz `/` redirige a `/dashboard` si usuario está autenticado
  - `/login` y `/register` redirigen a `/dashboard` si usuario ya tiene sesión
  - Hook `useSession` + `useEffect` para detección automática
  - Mejor UX: evita páginas innecesarias para usuarios logueados

- **Ordenamiento Automático de Unidades y Lecciones**:
  - Campo `order` calculado automáticamente: `max(order) + 1` al crear
  - Eliminados campos manuales de orden en formularios de creación
  - API endpoints actualizados: `/api/units` y `/api/lessons` con cálculo automático
  - Backend calcula orden secuencial sin intervención del usuario

- **Sistema Completo de Drag-and-Drop con @dnd-kit**:
  - **Unidades**: Reordenamiento visual con `SortableUnit` y `DndContext`
  - **Lecciones**: Reordenamiento visual con `SortableLesson` y `DndContext` separado
  - **API de Reordenamiento**: Endpoints `/api/units/reorder` y `/api/lessons/reorder`
  - **Estrategia 2-step**: Incrementa órdenes +1000, luego asigna valores finales 1..n
  - **Validaciones**: Solo unidades del mismo curso, solo lecciones de la misma unidad
  - **SSR Seguro**: Flag `mounted` para renderizar DnD solo en cliente, fallback en servidor
  - **UI Mejorada**: Handles con `GripVertical`, feedback visual de arrastre, opacidad 0.5

- **Corrección de Errores Críticos**:
  - **Hidratación SSR**: Error `aria-describedby` resuelto con renderizado condicional
  - **Reordenamiento API**: Errores de unique constraint solucionados con transacción 2-step
  - **Button-in-Button**: Cambiados handles de `<button>` a `<div>` para HTML válido
  - **Validaciones de Estado**: Verificación de prerrequisitos en rutas de aprendizaje

- **Reportes Excel con Notas en Puntos**:
  - Columna "Nota (puntos)" en lugar de porcentaje en reportes Excel
  - Campo `pointsEarned` utilizado en lugar de `score` calculado
  - Endpoint `/api/reports/export-collaborators-excel` actualizado
  - Sin símbolo % en reportes, valores numéricos directos

### Técnico

- **Archivos modificados principales**:
  - `src/app/(authenticated)/admin/page.tsx`: Eliminado (no existe)
  - `src/components/app-header.tsx`: Breadcrumbs inteligentes con omisión de /admin
  - `src/components/app-footer.tsx`: Enlace actualizado a /admin/dashboard
  - `src/app/page.tsx`: Redirección autenticados a /dashboard
  - `src/app/(public)/login/page.tsx`: Redirección autenticados a /dashboard
  - `src/app/(public)/register/page.tsx`: Redirección autenticados a /dashboard
  - `src/app/api/units/route.ts`: Orden automático al crear unidades
  - `src/app/api/lessons/route.ts`: Orden automático al crear lecciones
  - `src/app/api/units/reorder/route.ts`: API DnD con estrategia 2-step
  - `src/app/api/lessons/reorder/route.ts`: API DnD con estrategia 2-step
  - `src/app/(authenticated)/admin/courses/[id]/content/client-content.tsx`: UI DnD completa
  - `src/app/api/reports/export-collaborators-excel/route.ts`: Notas en puntos

- **Dependencias agregadas**:
  - `@dnd-kit/core@6.3.1`
  - `@dnd-kit/sortable@10.0.0`
  - `@dnd-kit/utilities@3.2.2`

- **Build exitoso**:
  - Compilación: ✓ Exitosa sin errores críticos
  - Rutas generadas: 78 páginas (sin /admin visible)
  - ESLint: Solo warnings pre-existentes (no nuevos errores)
  - Middleware: Protección /admin/* intacta

### Beneficios de la Implementación

- ✅ **Arquitectura más limpia**: /admin como carpeta organizacional, no página visible
- ✅ **UX mejorada**: Drag-and-drop intuitivo, redirecciones automáticas, breadcrumbs inteligentes
- ✅ **Robustez**: Corrección de errores críticos de hidratación y reordenamiento
- ✅ **Automatización**: Ordenamiento automático, asistencia tracking, horas estandarizadas
- ✅ **Precisión**: Reportes con notas en puntos, horas oficiales
- ✅ **Escalabilidad**: Sistema extensible para más funcionalidades DnD

---

## [2.1.4] - 2025-10-31

### Agregado - Sistema de Asistencia y Horas de Participación

- **Tracking Automático de Asistencia en Cursos Completados:**
  - Nuevo campo `attended Boolean @default(false)` en modelo `CourseProgress`
  - Marcado automático de asistencia cuando el progreso alcanza 100%
  - Fecha de asistencia registrada en `completedAt`
  - Lógica implementada en endpoint de progreso de lecciones

- **Ajuste de Horas según Duración Configurada:**
  - Al completar un curso (100%), el sistema reemplaza `timeSpent` con la duración configurada del curso
  - Ejemplo: Si `timeSpent` acumulado es 1.5h pero el curso está configurado como 2h, al completar se registran 2h
  - Conversión automática: `timeSpent = course.duration * 3600` (horas a segundos)
  - Garantiza horas estandarizadas para reportes de cumplimiento

- **Reporte de Excel Mejorado:**
  - Nueva columna "Asistencia" en hoja "Detalle Cursos"
  - Valores: "Sí" (attended=true) / "No" (attended=false)
  - Nueva columna "Horas" con tiempo de participación estandarizado
  - Lógica de horas: muestra duración configurada si attended=true, sino calcula desde timeSpent
  - Redondeo a 2 decimales para presentación limpia
  - Nueva columna "Nota (puntos)" con la mejor calificación obtenida en los exámenes del curso (mejor intento con pointsEarned)

- **Modificaciones en Lógica de Progreso:**
  - Endpoint `/api/lessons/[lessonId]/progress`:
    - Fetch de `course.duration` al detectar 100% de completado
    - Actualización de `attended` a `true` cuando se completa
    - Override de `timeSpent` con valor estandarizado
    - Preserva comportamiento existente para cursos en progreso

- **API de Reportes Actualizada:**
  - `/api/reports/export-collaborators-excel`:
    - Extendida consulta Prisma para incluir `course.duration`
    - Cálculo de `hoursSpent` con lógica condicional
    - Cálculo de `score` por curso a partir de `QuizAttempt` (mejor score por curso y colaborador con `pointsEarned != null`)
    - Interface `CollaboratorProgressData` extendida con campos:
      - `attended: boolean`
      - `hoursSpent: number`
      - `courseDuration: number | null`
      - `score: number | null`
    - Ancho de columnas ajustado para nuevas columnas

- **Migración de Base de Datos:**
  - Migración: `20251031220206_add_attended_to_course_progress`
  - Añadido campo `attended` a tabla `course_progress`
  - Campo opcional con valor por defecto `false`
  - Compatible con registros existentes (migración no destructiva)

### Técnico

- **Archivos modificados:**
  - `prisma/schema.prisma`: Campo `attended` en modelo `CourseProgress`
  - `src/app/api/lessons/[lessonId]/progress/route.ts`: Lógica de asistencia y ajuste de horas
  - `src/app/api/reports/export-collaborators-excel/route.ts`: Columnas y cálculos de reporte

- **Build exitoso:**
  - Compilación: ✓ Exitosa sin errores
  - Migración aplicada correctamente
  - Tests: Sin regresiones

### Beneficios de la Implementación

- ✅ **Cumplimiento estandarizado**: Horas reportadas coinciden con duración oficial del curso
- ✅ **Auditoría mejorada**: Registro claro de asistencia completada
- ✅ **Reportes precisos**: Excel muestra información consistente para cumplimiento SSOMA
- ✅ **Automatización total**: Sin intervención manual, ajuste automático al 100%
- ✅ **Retrocompatibilidad**: Cursos en progreso mantienen comportamiento original

---

## [2.1.3] - 2025-10-31

### Mejorado - UX/UI del Módulo de Cuestionarios y Corrección de Loop de React

- **Corrección de Runtime Error:** Eliminado bucle "Maximum update depth exceeded" en la selección de preguntas del formulario de cuestionarios.
  - Problema: doble toggle del Checkbox causado por handlers redundantes (onClick del contenedor + onClick del checkbox).
  - Solución: refactor a control único mediante `onCheckedChange` con `stopPropagation`.
  
- **Diseño Minimalista y Profesional:**
  - Paleta de colores sobria (escala gris neutral: `slate-50`, `slate-100`, `slate-900/30`).
  - Tipografía con jerarquía clara: labels uppercase con tracking, títulos de sección con peso semibold.
  - Espaciado generoso: `space-y-8` entre secciones, separadores gradient en lugar de líneas simples.
  - Componentes Switch y opciones de configuración con fondos sutiles y transiciones suaves.
  - Ítems de lista con color dinámico: seleccionado destaca, hover interactivo.

- **Indicadores Visuales Avanzados:**
  - Badge de puntuación dinámico: verde (20/20), rojo (exceso), gris (en construcción).
  - Barra de progreso refinada hacia meta de 20 puntos.
  - Etiqueta "Excede 20" por pregunta para avisar antes de seleccionar.
  - Mensaje contextual: "Restantes", "Exceso" o "Meta alcanzada".

- **Diálogo Más Ancho:**
  - Cambio de `max-w-4xl` a `!max-w-[1100px]` para mejor espaciado.
  - Sin impacto en otros diálogos de la aplicación.

Archivos modificados:
- `src/app/(authenticated)/admin/quizzes/quiz-form.tsx`: refactor de selección, mejoras de espaciado y tipografía, indicadores visuales.
- `src/app/(authenticated)/admin/quizzes/client-quizzes.tsx`: ampliación del ancho del diálogo.

Calidad y verificación:
- Build: PASS (Next.js 15.5.5, 7.4s). Sin errores nuevos, solo warnings previos de ESLint.
- Tests: PASS (Vitest) — 6 tests en `src/lib/progress.test.ts`, regresión cero.
- Accesibilidad: soporta light/dark mode automáticamente; labels y aria-labels preservados.

---

## [2.1.2] - 2025-10-29

### Agregado - Salvaguarda Anti-Salto en Progreso de Lecciones (Octubre 29, 2025)

- El endpoint oficial `/api/lessons/[lessonId]/progress` ahora limita incrementos de `viewPercentage` según tiempo de reproducción real.
  - Considera delta observado por servidor desde `lastViewedAt` y delta reportado por cliente (`timeDeltaSeconds`), con tolerancia de +3s y hasta 1.6x de playback.
  - Con duración conocida (`duration` en segundos), el máximo avance permitido por update es `ceil((delta/duration)*100*1.6)`; sin duración, fallback de `5%` por cada `30s` efectivos.
  - Nunca decrece progreso; nunca supera `100%`.
- El cliente de lecciones envía nuevos campos opcionales: `timeDeltaSeconds` y `duration`.
- Esquema Zod extendido: `LessonProgressSchema` acepta `timeDeltaSeconds` y `duration` (opcionales).
- Lógica extraída a función pura `capLessonProgress()` para pruebas unitarias.

Archivos relevantes:
- `src/lib/progress.ts`: nueva función `capLessonProgress(prev, requested, serverDeltaSec, clientDeltaSec, duration?)` con contrato claro.
- `src/app/api/lessons/[lessonId]/progress/route.ts`: refactor para usar `capLessonProgress` antes de persistir.
- `src/validations/content.ts`: añade `timeDeltaSeconds` y `duration` a `LessonProgressSchema`.
- `src/app/(authenticated)/courses/[courseId]/lessons/[lessonId]/client-lesson-view.tsx`: cliente envía los nuevos campos y mantiene PUT consolidado.
- `src/lib/progress.test.ts`: pruebas unitarias (Vitest) cubriendo escenarios clave.
- `vitest.config.ts`: configuración mínima con entorno node y PostCSS desactivado.

Documentación:
- `README.md`: actualizado para reflejar anti-salto, script `pnpm test`, y la ruta oficial del endpoint.

Calidad y verificación:
- Build: PASS (Next.js 15.5.5). Solo warnings previos de ESLint, sin nuevos errores.
- Tests: PASS (Vitest) — 6 tests, 1 archivo de pruebas.

### Agregado - Completado Manual en No-Video (Opción A)

- Nuevo botón en lecciones que no son video: "Marcar como Completada", visible pero deshabilitado hasta cumplir 3 minutos de actividad real en el recurso.
- Cliente envía `manualComplete: true` al endpoint oficial. El servidor, solo cuando `lesson.type !== "VIDEO"`, fuerza `completed = true` y ajusta `viewPercentage` al máximo entre el valor previo, el solicitado y el `completionThreshold` (sin aplicar capping anti-salto para esta marcación manual).
- Mantiene anti-salto intacto para lecciones de video.

Archivos relevantes:
- `src/app/(authenticated)/courses/[courseId]/lessons/[lessonId]/client-lesson-view.tsx`: botón y envío de `manualComplete` para no-video.
- `src/app/api/lessons/[lessonId]/progress/route.ts`: rama para forzar completado en no-video cuando `manualComplete` es verdadero.
- `src/validations/content.ts`: `LessonProgressSchema` extendido con campo opcional `manualComplete`.
- `README.md`: documenta el comportamiento del botón y el parámetro `manualComplete`.

Calidad y verificación:
- Build: PASS (Next.js 15.5.5) tras integrar `manualComplete`.
- Tests: PASS (Vitest) — regresión negativa no observada; la lógica anti-salto permanece cubierta por 6 pruebas unitarias.

### Cambiado - Consolidación de Endpoint de Progreso de Lecciones

- Se reafirma la ruta oficial: `PUT /api/lessons/:id/progress`.
- La ruta antigua `PUT /api/progress/lessons/:lessonId` queda deprecada y responde `410 Gone` en todas las operaciones.

---

## [2.1.1] - 2025-10-29

### Agregado - Enforzamiento de Prerrequisitos en Servidor (Octubre 29, 2025)

- Nueva verificación centralizada de prerrequisitos para cursos pertenecientes a Rutas de Aprendizaje asignadas.
- Comportamiento: si el curso está en una ruta asignada al colaborador y esa ruta define un prerrequisito no cumplido, se bloquea el acceso y se redirige a `/my-learning-paths` para brindar contexto.
- Estrategia no intrusiva: se mantienen todas las inscripciones (no se eliminan ni se impide su creación); el bloqueo es únicamente de acceso.
- Lógica consolidada para múltiples rutas: si el curso pertenece a varias rutas, se permite el acceso si al menos una ruta aplicable no exige prerrequisito o este ya está cumplido.

Archivos relevantes:
- `src/lib/access.ts`: helper `checkCoursePrerequisites(collaboratorId, courseId)` con verificación contra Enrollment y CourseProgress.
- `src/app/(authenticated)/courses/[courseId]/page.tsx`: aplica guardián antes de renderizar.
- `src/app/(authenticated)/courses/[courseId]/lessons/[lessonId]/page.tsx`: aplica guardián antes de renderizar la lección.
- `src/app/(authenticated)/courses/[courseId]/quiz/[quizId]/page.tsx`: valida publicación, asociación y aplica guardián antes de permitir intentos.

Beneficios:
- ✅ Cumplimiento de itinerarios sin alterar el proceso de inscripción.
- ✅ Experiencia guiada: redirección a la vista de rutas para entender el prerrequisito faltante.
- ✅ Mantenibilidad: una sola fuente de verdad para la política de acceso a cursos.

---

## [2.1.0] - 2025-10-27

### Agregado - Consolidación de Reportes y Optimización Arquitectónica (Octubre 27, 2025)

- **Consolidación de Excel Export en Dashboard Ejecutivo**:
  - Movida funcionalidad de descarga Excel desde `/reports/collaborators` al Dashboard Ejecutivo (`/reports/dashboard`)
  - Eliminación de página redundante `/reports/collaborators` (reducción de 79 a 77 rutas)
  - Eliminación de API redundante `/api/reports/collaborators-data`
  - Unificación de funcionalidad: descarga directa desde dashboard sin navegación adicional
  - Mejora de UX: botón con estado de carga (`disabled={refreshing}`) y tooltip descriptivo

- **Renombrado de Endpoint para Mejor Arquitectura**:
  - `/api/reports/collaborators-progress` → `/api/reports/export-collaborators-excel`
  - Nombre refleja función real: genera archivo Excel, no consulta datos JSON
  - Separación clara: endpoints de exportación vs endpoints de consulta de datos
  - Mantiene funcionalidad completa: 3 hojas Excel (Resumen KPIs, Colaboradores, Detalle Cursos)

- **Corrección Completa de Bugs en Dashboard Ejecutivo**:
  - **5 errores de cálculo corregidos**: Divisiones por cero con fallbacks `|| 1`
    - Línea ~189: Tasa de participación → `(kpis.totalCollaborators || 1)`
    - Línea ~273: Progreso de alertas → `((... || 1))` con precedencia correcta
    - Línea ~410: Inscripciones por curso → `(kpis.totalCourses || 1)`
    - Línea ~580: Progreso cursos críticos → precedencia corregida
  - **Progreso invertido corregido**: Barra muestra `completionRate` en lugar de `100 - completionRate`
  - **Botones funcionales implementados**:
    - "Ver detalles" → navega a `/admin/courses/${courseId}/content`
    - "Descargar Excel" → genera archivo con 3 sheets y descarga automática
  - **React console error resuelto**: Eliminado `indicatorClassName` prop inválido de 3 Progress components

- **Tracking de Progreso para Contenido No-Video**:
  - **ContentProgressTracker**: Componente para PDF/PPT/HTML/SCORM con polling inteligente
  - **Validación anti-spam**: Cliente (no rollback) + Servidor (Math.max validation)
  - **Detección de actividad avanzada**: Visibility API + auto-pause (2min inactividad) + throttling 30s
  - **Complementa YouTubePlayer**: Video (2s polling, ≥5% threshold) + Documentos (30s polling, actividad detectada)

- **Optimización de Build y Arquitectura**:
  - Build exitoso: 77 rutas generadas, compilación 14.8s, sin errores críticos
  - ESLint: Solo warnings pre-existentes (no nuevos errores introducidos)
  - Arquitectura limpia: Eliminadas 2 rutas redundantes, mejor mantenibilidad
  - APIs de progreso preservadas: `/api/progress/courses`, `/api/progress/paths`, `/api/progress/alerts`, etc.

### Beneficios de la Consolidación

- ✅ **Arquitectura simplificada**: Eliminadas páginas redundantes, mejor organización
- ✅ **UX mejorada**: Descarga Excel desde dashboard central, sin navegación extra
- ✅ **Código más limpio**: Endpoint renombrado refleja función real
- ✅ **Bugs corregidos**: Dashboard completamente funcional con cálculos correctos
- ✅ **Funcionalidad preservada**: Todas las APIs de progreso mantienen compatibilidad
- ✅ **Performance optimizada**: 77 rutas (vs 79), build más rápido

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

### Agregado - Mejora Completa del Diálogo de Creación de Preguntas (Octubre 27, 2025)

- **Vista previa en tiempo real** del formulario de preguntas
  - Botón togglable "Vista previa / Ocultar vista previa" en la parte superior
  - Panel lateral (en desktop) o debajo (en mobile) mostrando cómo se verá la pregunta
  - Actualización en vivo mientras se escribe (reactive preview)
  - Mostrable/ocultable con un botón tipo Eye/EyeOff

- **Interfaz mejorada del formulario**
  - Cambio a layout grid con 2 columnas: formulario + previsualización
  - Mejor organización visual y separación de contenido
  - Secciones separadas con headers claros (Información, Opciones, Retroalimentación)
  - Cards individuales para cada opción de respuesta
  - Mejora de espaciado y consistencia de estilos

- **Componentes UI mejorados**
  - Uso de `Card` component para opciones de respuesta (CardContent, CardHeader)
  - Badge componentes para mostrar estado "Correcta", "Opcional", puntos, etc.
  - Dificultad como slider en lugar de input numérico
  - Contador visual de caracteres en pregunta
  - Indicadores visuales para respuestas correctas (borde verde)

- **Vista previa inteligente**
  - **Metadatos**: Tipo de pregunta, tema, puntos, dificultad
  - **Pregunta**: Texto en tiempo real
  - **Opciones**: Visualización con círculos (opción única/múltiple) o cuadrados (otras)
  - **Respuestas correctas**: Destacadas en verde con badge "✓ Correcta"
  - **Retroalimentación**: 
    - Verde para respuestas correctas
    - Roja para respuestas incorrectas
    - Azul para explicación
  - Diseño responsivo que se adapta a pantalla

- **Mejoras de UX/DX**
  - Estados de cambio vinculados al formulario (onChange handlers)
  - Validaciones visuales con badges "Opcional" en retroalimentación
  - Tooltips en botones de movimiento (up/down para ordenar)
  - Mensajes contextuales según tipo de pregunta
  - Feedback visual en campo de dificultad (slider 1-10)

- **Estadísticas mejoradas**
  - Contador de caracteres en pregunta
  - Badge dinámico mostrando puntos asignados
  - Indicador visual de dificultad con escala 1-10
  - Badges para opcionales vs requeridas

- **Build exitoso**
  - Compilación sin errores TypeScript
  - 75 rutas generadas correctamente
  - Tamaño del bundle para /admin/questions aumentó de 8.59kB a 10.1kB (aceptable)

### Beneficios de la Implementación

- ✅ **Previsualización en vivo**: Ve cómo se verá la pregunta mientras creas
- ✅ **Better UX**: Interfaz más limpia y profesional
- ✅ **Mejor validación visual**: Entiende mejor qué campos son opcionales
- ✅ **Feedback instantáneo**: Responde a cambios sin guardar
- ✅ **Diseño responsivo**: Funciona bien en desktop y mobile
- ✅ **Accessibilidad mejorada**: Badges, tooltips y colores semánticos

---

### Agregado - Buscador en Selección de Cursos de Rutas de Aprendizaje (Octubre 27, 2025)

- **Buscador en tiempo real** para filtrar cursos en diálogo de gestión
  - Campo de búsqueda con icono de lupa (Search)
  - Búsqueda por nombre de curso (case-insensitive)
  - Búsqueda por código de curso (ej: CRS-001)
  - Botón de limpiar búsqueda (X) cuando hay texto
  - Mejora significativa de UX cuando hay muchos cursos disponibles

- **Interfaz mejorada del buscador**
  - Input con placeholder: "Buscar por nombre o código..."
  - Icono de Search en lado izquierdo (gris)
  - Botón X en lado derecho para limpiar (solo visible si hay texto)
  - Styling consistente con el resto del diálogo
  - Feedback visual en tiempo real

- **Funcionalidad de filtrado**
  - Variable de estado `searchQuery` para almacenar texto de búsqueda
  - Función `filteredCourses` que filtra lista basada en búsqueda
  - Busca en nombre y código del curso (case-insensitive)
  - Mantiene compatibilidad con selección múltiple existente
  - Mensajes distintos: "No hay cursos disponibles" vs "No se encontraron cursos"

- **Build exitoso**
  - Compilación sin errores TypeScript
  - 75 rutas generadas correctamente
  - Tamaño del bundle aumentó mínimamente (de 203kB a 203.1kB)

### Beneficios de la Implementación

- ✅ **Búsqueda eficiente**: Encuentra rápidamente cursos en lista grande
- ✅ **Mejor UX**: No necesita scrollear si hay muchos cursos
- ✅ **Case-insensitive**: Búsqueda flexible sin preocuparse por mayúsculas
- ✅ **Feedback visual claro**: Icono de búsqueda + botón limpiar
- ✅ **Mantiene funcionalidad**: Compatible con selección múltiple

---

### Agregado - Selección Múltiple de Cursos en Rutas de Aprendizaje (Octubre 27, 2025)

- **Selección múltiple de cursos** en diálogo de gestión de rutas de aprendizaje
  - Cambio de Select simple a interface de Checkboxes
  - Permite seleccionar N cursos de una sola vez
  - ScrollArea para lista larga de cursos disponibles
  - Indicador visual de cantidad de cursos seleccionados
  - Botón de "Agregar" dinámico que muestra cantidad a agregar

- **Mejoras en UX del diálogo ManageCoursesDialog**
  - Interfaz renovada con lista scrollable de cursos con checkboxes
  - Cada curso muestra: nombre, código, duración en la lista
  - Selección múltiple de cursos con un solo clic
  - Aplicación de orden, prerequisitos y requerido a todos los cursos seleccionados
  - Los órdenes se incrementan automáticamente para cada curso agregado
  - Mejor visual con hover effects y espaciado mejorado

- **Lógica de agregación mejorada**
  - Función `addCourse` ahora procesa múltiples cursos en bucle
  - Incremento automático de orden para cada curso agregado
  - Mensaje de éxito indica cantidad de cursos agregados
  - Campo "Cursos obligatorios" aplicable a todos los seleccionados
  - Reset automático de selección después de agregar

- **Componentes UI utilizados**
  - `Checkbox` para selección múltiple
  - `ScrollArea` para lista larga de cursos
  - Estados visuales mejorados con badges y contadores

- **Build exitoso**
  - Compilación sin errores TypeScript
  - 75 rutas generadas correctamente
  - Warnings son solo referencias no utilizadas (sin impacto en funcionalidad)

### Beneficios de la Implementación

- ✅ **Eficiencia mejorada**: Agregar múltiples cursos de una sola vez
- ✅ **Mejor UX**: Interfaz clara con checkboxes y lista scrollable
- ✅ **Menos clics**: Selecciona N cursos sin diálogos repetitivos
- ✅ **Configuración centralizada**: Aplica orden/prerequisitos a todos los cursos
- ✅ **Visual feedback**: Indicador de cantidad de cursos seleccionados

---

- **Generación automática de códigos de curso** siguiendo patrón `CRS-XXX`
  - Campo `code` ahora opcional en formularios de creación de cursos
  - Lógica automática en API `/api/courses` que genera códigos secuenciales
  - Patrón: `CRS-001`, `CRS-002`, `CRS-003`, etc. (incremental desde último curso)
  - Si no existen cursos previos, comienza en `CRS-001`
  - Eliminación del campo manual de código en UI para evitar errores de usuario

- **Actualización del Schema de Prisma**
  - Campo `code` en modelo `Course` ahora nullable (`String?`)
  - Migración aplicada: `make_course_code_optional`
  - Compatibilidad hacia atrás mantenida

- **Actualización de interfaces TypeScript**
  - `Course` interface actualizada a `code: string | null` en todos los archivos
  - Archivos actualizados: `client-enrollments.tsx`, `client-certificates-view.tsx`
  - Manejo seguro de valores null con operador `|| "Sin código"`

- **Mejoras en UI de creación de cursos**
  - Campo de código removido del formulario de creación/edición
  - Descripción actualizada indicando generación automática
  - Formulario más limpio y menos propenso a errores

- **Actualización de APIs y servicios**
  - `src/lib/notifications.ts`: Manejo de `courseCode` nullable
  - `src/lib/reports.ts`: Fallback "Sin código" para reportes
  - Todas las referencias a `course.code` protegidas contra null

- **Validaciones actualizadas**
  - Schema `CourseSchema` en `src/validations/courses.ts` con `code` opcional
  - Compatibilidad mantenida con cursos existentes que tienen código

- **Build exitoso y pruebas**
  - Compilación sin errores TypeScript
  - Todas las interfaces actualizadas correctamente
  - Funcionalidad probada: creación de cursos genera códigos automáticamente
  - Migración de BD aplicada exitosamente

### Beneficios de la Implementación

- ✅ **Eliminación de errores humanos**: No más códigos duplicados o mal formateados
- ✅ **Consistencia automática**: Patrón uniforme `CRS-XXX` en todos los cursos
- ✅ **UX mejorada**: Formulario más simple y rápido de completar
- ✅ **Escalabilidad**: Sistema automático que crece con la cantidad de cursos
- ✅ **Compatibilidad**: Cursos existentes mantienen sus códigos originales

---

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
