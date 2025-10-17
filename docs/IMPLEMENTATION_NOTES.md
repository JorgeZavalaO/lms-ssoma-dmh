# 🔧 Notas de Implementación

Detalles técnicos, arquitectura y decisiones de diseño.

## Estructura del Proyecto

```
src/
├─ app/
│  ├─ admin/                    # Páginas de administración
│  │  ├─ courses/
│  │  ├─ enrollments/
│  │  ├─ enrollment-rules/
│  │  ├─ learning-paths/
│  │  ├─ collaborators/
│  │  ├─ areas/
│  │  ├─ sites/
│  │  └─ positions/
│  ├─ api/                      # Endpoints RESTful
│  └─ auth/                     # Páginas de autenticación
├─ components/
│  ├─ ui/                       # Componentes shadcn/ui
│  ├─ admin/                    # Componentes administrativos
│  └─ sidebar/
├─ lib/
│  ├─ prisma.ts                # Cliente Prisma singleton
│  ├─ enrollment.ts            # Lógica de inscripciones (E1)
│  ├─ utils.ts                 # Utilidades generales
│  └─ auth.ts                  # Configuración NextAuth
├─ validations/                # Schemas Zod
└─ public/                      # Archivos estáticos

prisma/
├─ schema.prisma               # Definición de base de datos
└─ migrations/                 # Historial de migraciones
```

---

## Base de Datos - Prisma

### Configuración

**Archivo**: `prisma/schema.prisma`

- Provider: PostgreSQL
- Migración: `prisma migrate dev`
- Generación: `prisma generate` (automático)

### Enums Principales

```typescript
enum Role { SUPERADMIN, ADMIN, COLLABORATOR }
enum CollaboratorStatus { ACTIVE, INACTIVE }
enum CourseStatus { DRAFT, PUBLISHED, ARCHIVED }
enum CourseModality { ASYNCHRONOUS, SYNCHRONOUS, BLENDED }
enum EnrollmentStatus { PENDING, ACTIVE, COMPLETED, CANCELLED }
enum EnrollmentType { AUTOMATIC, MANUAL }
enum LessonType { VIDEO, PDF, PPT, HTML, SCORM }
enum FileType { PDF, PPT, IMAGE, VIDEO, DOCUMENT, OTHER }
```

### Relaciones Clave

**Cascada Delete**:
- `Course → Unit → Lesson → LessonProgress` (RESTRICT course delete)
- `Course → Enrollment` (CASCADE)
- `Course → EnrollmentRule` (CASCADE)

**Unique Constraints**:
- `Enrollment`: `[courseId, collaboratorId]`
- `CourseVersion`: `[courseId, version]`
- `LearningPathCourse`: `[pathId, courseId]`
- `Position`: `[name, areaId]`

---

## Autenticación y Autorización

### NextAuth v5

**Archivo**: `src/auth.ts`

```typescript
// Providers configurables
// JWT strategy
// Callbacks: authorized, jwt, session
// Secret en .env.local
```

### Roles

| Rol | Permisos |
|-----|----------|
| SUPERADMIN | Todo |
| ADMIN | Gestión de contenido |
| COLLABORATOR | Solo lectura de cursos asignados |

### Pattern de Verificación

```typescript
const session = await auth()
if (!session?.user || session.user.role !== "ADMIN") {
  return NextResponse.json({ error: "No autorizado" }, { status: 403 })
}
```

---

## Validación de Datos

### Zod Schemas

**Ubicación**: `src/validations/`

```typescript
// Cada módulo tiene su validación
enrollment.ts      // E1, E2
content.ts         // D
course.ts          // C
learning-path.ts   // B
collaborator.ts    // A
```

### Pattern

```typescript
const Schema = z.object({
  field: z.string().min(1),
  // ...
})

type SchemaType = z.infer<typeof Schema>

// En endpoint:
const validated = Schema.parse(body)
```

---

## Módulo E: Inscripciones - Detalles Técnicos

### E1: Asignación Automática

**Archivo**: `src/lib/enrollment.ts`

```typescript
export async function applyAutoEnrollmentRules(
  collaboratorId: string
): Promise<Enrollment[]> {
  // 1. Obtiene perfil del colaborador (sede, área, puesto)
  // 2. Busca reglas E1 que coincidan
  // 3. Para cada regla coincidente:
  //    - Intenta crear inscripción
  //    - Si existe, actualiza
  //    - Si no, crea nueva
  // 4. Retorna todas las inscripciones creadas
}
```

**Llamado en**:
- `POST /api/collaborators` - Al crear
- `PUT /api/collaborators/[id]` - Al actualizar perfil

---

### E2.1: Inscripción Individual

**Endpoint**: `POST /api/enrollments`

```typescript
// Valida: curso + mínimo 1 colaborador
// Para cada colaborador:
//   - Crea/actualiza inscripción (MANUAL)
//   - Status: PENDING
// Retorna lista de inscripciones creadas
```

**Validación**:
```typescript
ManualEnrollmentSchema = z.object({
  courseId: z.string(),
  collaboratorIds: z.array(z.string()).min(1),
  notes: z.string().optional()
})
```

---

### E2.2: Inscripción Masiva

**Endpoint**: `POST /api/enrollments/bulk`

```typescript
// Valida: curso + al menos 1 filtro
// Construye WHERE clause dinámicamente
// Busca colaboradores coincidentes
// Crea inscripciones en transacción Prisma
```

**Validación**:
```typescript
BulkEnrollmentSchema = z.object({
  courseId: z.string(),
  filters: z.object({
    siteIds: z.array(z.string()).optional(),
    areaIds: z.array(z.string()).optional(),
    positionIds: z.array(z.string()).optional()
  }).refine(
    // Al menos 1 filtro
  ),
  notes: z.string().optional()
})
```

**Transacción**:
```typescript
await prisma.$transaction(
  collaborators.map(c =>
    prisma.enrollment.upsert({
      where: { courseId_collaboratorId: {...} },
      update: { status: "ACTIVE", notes },
      create: { ... }
    })
  )
)
```

**Garantías**:
- ✅ ACID (todo o nada)
- ✅ Upsert (sin duplicados)
- ✅ Atomic (sin partial updates)

---

## Módulo D: Contenidos - Detalles Técnicos

### D1: Estructura de Lecciones

**Orden Jerárquico**:
```
Course
└─ Units (ordenado por `order`)
   └─ Lessons (ordenado por `order` dentro de unit)
      └─ LessonProgress (por colaborador)
```

### Tipos de Lección

| Tipo | Almacenamiento | Validación |
|------|---|---|
| VIDEO | videoUrl | URL válida (YouTube/Vimeo) |
| PDF | fileUrl | URL a Blob con MIME 'pdf' |
| PPT | fileUrl | URL a Blob con MIME 'ppt' |
| HTML | htmlContent | string en DB, renderizado en UI |
| SCORM | fileUrl | URL a paquete SCORM |

### Tracking de Progreso

```typescript
// Actualización de progreso
PUT /api/lessons/[lessonId]/progress
{
  viewPercentage: 0-100,
  completed: boolean
}

// Lógica: si viewPercentage >= threshold → completed = true
```

---

### D2: Archivos con Vercel Blob

**Configuración**:
```env
BLOB_READ_WRITE_TOKEN=...
```

**Upload**:
```typescript
// FormData multipart
// Archivo → Vercel Blob
// Retorna URL pública
// Almacena metadata en BD
```

**Versionado**:
```typescript
// Nuevo upload:
// 1. Copia versión anterior en previousVersionId
// 2. Incrementa version
// 3. Almacena nueva URL
// Historial completo en BD
```

---

## Módulo C: Cursos - Versionado

### Automatización

Cada `PUT /api/courses/[id]` con cambios crea versión automática:

```typescript
// Si hay cambios significativos:
// 1. Copia curso actual a CourseVersion
// 2. Incrementa version
// 3. Actualiza curso
// 4. Guarda metadata (createdBy, timestamp)
```

### Historial

Todas las versiones quedan guardadas sin perder datos previos.

---

## Componentes UI - shadcn/ui

### Patrón Cliente/Servidor

```typescript
// page.tsx (Server Component)
export default async function Page() {
  const data = await fetchData()
  return <ClientComponent initialData={data} />
}

// client-component.tsx (Client Component)
"use client"
export function ClientComponent({ initialData }) {
  const [data, setData] = useState(initialData)
  // ...
}
```

### Componentes Utilizados

```
Dialog           # Modales
Form/Input       # Formularios
Select           # Dropdowns
Button           # Botones
Table            # Tablas
Badge            # Estados/etiquetas
Card             # Contenedores
Checkbox         # Selecciones múltiples
Textarea         # Texto largo
Alert            # Mensajes
Accordion        # Contenido colapsable
```

### Notificaciones

**Sonner Toasts**:
```typescript
import { toast } from "sonner"

toast.success("Exitoso")
toast.error("Error")
toast.info("Información")
toast.loading("Cargando...")
```

---

## Seguridad

### Validación Multi-Capa

```
1. Frontend: Validación de UX
2. Validación Zod: Type-safe
3. Autenticación: NextAuth
4. Autorización: Verificar rol
5. Prisma: Type-safe DB queries
```

### Protección CSRF

Automática con NextAuth (cookies)

### Passwords

```typescript
// Hash con bcrypt (NextAuth)
// Nunca almacenar en claro
// JWT para sesiones
```

---

## Performance

### Query Optimization

```typescript
// Usar select para traer solo campos necesarios
prisma.course.findMany({
  select: { id: true, name: true, code: true }
})

// Usar include para relaciones
prisma.course.findFirst({
  where: { id },
  include: { units: { include: { lessons: true } } }
})
```

### Caching

No implementado actualmente. Candidatos:
- Listados de cursos (30 min)
- Metadatos de colaboradores (15 min)
- Configuración de Áreas/Puestos (1 hora)

---

## Testing

### Manual

Para cada endpoint:
1. Test sin autenticación (debe fallar)
2. Test con rol incorrecto (debe fallar)
3. Test con datos válidos (debe exitoso)
4. Test con datos inválidos (debe fallar)

### Automated

No implementado. Candidatos:
- Validación de schemas
- Endpoints críticos (auth, inscripciones)
- Lógica de reglas (E1)

---

## Migraciones

### Historial

```
20251010_init                 - Schema inicial
20251016_add_module_e        - Módulo E (inscripciones)
20251016_add_content_module  - Módulo D (contenidos)
```

### Workflow

```bash
# Hacer cambio en schema.prisma
# Luego:
prisma migrate dev --name "descripcion_cambio"

# Genera:
# - Migration SQL
# - Actualiza _prisma_migrations
# - Regenera Prisma Client
```

---

## Deployment

### Producción

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://...
```

### Build

```bash
pnpm run build
# Genera .next/
# Compila TypeScript
# Optimiza JS
```

### Runtime

Next.js con Node.js runtime (no Edge para DB)

---

## Desarrollo Local

### Setup

```bash
# Instalar
pnpm install

# Variables
cp .env.example .env.local

# Migraciones
prisma migrate dev

# Dev server
pnpm dev
```

### Hot Reload

- Cambios en `src/` → recargan automáticamente
- Cambios en `prisma/schema.prisma` → `prisma generate` automático
- Cambios en `.env.local` → reiniciar servidor

---

## Troubleshooting

### Errores Comunes

**Error: "No session found"**
→ Verificar cookies de autenticación
→ Check: `http://localhost:3000/api/auth/session`

**Error: "Record not found"**
→ ID incorrecto o recurso eliminado
→ Check: Cambios en el nombre del campo en schema

**Error: "Validation error"**
→ Esquema Zod rechazó datos
→ Check: Tipos esperados en el request

---

## Roadmap Técnico

### Corto Plazo
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Cleanup de imports

### Mediano Plazo
- [ ] Caching con Redis
- [ ] Rate limiting
- [ ] WebSockets para tiempo real

### Largo Plazo
- [ ] GraphQL alternativo
- [ ] Mobile app (React Native)
- [ ] ML para recomendaciones

---

Última actualización: 2025-10-16
