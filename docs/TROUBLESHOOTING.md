# 🔧 Troubleshooting - LMS SSOMA DMH

## Problemas Comunes y Soluciones

### 1. ✅ Solución: Colaboradores no ven cursos asignados

#### Problema Identificado
Cuando un SUPERADMIN asignaba cursos a colaboradores, estos no podían verlos al iniciar sesión en su cuenta.

#### Causa Raíz
1. **Sesión sin `collaboratorId`**: La sesión de NextAuth no incluía el `collaboratorId` del usuario autenticado
2. **API sin filtrar**: El endpoint `/api/enrollments` devolvía todas las inscripciones sin filtrar por el colaborador actual
3. **Interfaz incorrecta**: El componente `client-my-courses.tsx` usaba nombres de campos incorrectos (`enrollmentDate` en lugar de `enrolledAt`, `IN_PROGRESS` en lugar de `ACTIVE`, etc.)

#### Cambios Realizados

**1. Actualización de tipos de sesión** (`src/types/next-auth.d.ts`)
```typescript
declare module "next-auth" {
  interface User {
    role: "SUPERADMIN" | "ADMIN" | "COLLABORATOR"
    collaboratorId?: string | null  // ← AGREGADO
  }
  interface Session {
    user: {
      id: string
      role: "SUPERADMIN" | "ADMIN" | "COLLABORATOR"
      collaboratorId?: string | null  // ← AGREGADO
    } & DefaultSession["user"]
  }
}
```

**2. Actualización de callbacks de autenticación** (`src/auth.ts`)
```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id
      token.role = user.role
      // ← AGREGADO: Obtener collaboratorId al crear el token
      if (user.role === "COLLABORATOR") {
        const userWithCollaborator = await prisma.user.findUnique({
          where: { id: user.id },
          select: { collaboratorId: true },
        })
        token.collaboratorId = userWithCollaborator?.collaboratorId
      }
    }
    return token
  },
  async session({ session, token }) {
    session.user.id = token.id as string
    session.user.role = token.role as any
    session.user.collaboratorId = token.collaboratorId as string  // ← AGREGADO
    return session
  },
}
```

**3. Filtrado en API** (`src/app/api/enrollments/route.ts`)
```typescript
// GET: Filtrar por colaborador actual si es COLLABORATOR
const enrollments = await prisma.enrollment.findMany({
  where: {
    ...(session.user.role === "COLLABORATOR" 
      ? { collaboratorId: session.user.collaboratorId } 
      : {}),
    // ... resto de filtros
  },
})
```

**4. Campos correctos en componente** (`src/app/my-courses/client-my-courses.tsx`)
```typescript
// ANTES (❌ Incorrecto):
enrollments.map(e => e.enrollmentDate)  // No existe
e.status === "IN_PROGRESS"              // Debería ser "ACTIVE"

// DESPUÉS (✅ Correcto):
enrollments.map(e => e.enrolledAt)      // Campo correcto
e.status === "ACTIVE"                   // Enum correcto
```

#### Resultado
✅ Colaboradores ahora ven todos sus cursos asignados
✅ Las inscripciones se filtran por usuario correctamente
✅ Los estados se muestran con los valores correctos

---

### 2. ✅ Corrección: Next.js 15 - Params Async

#### Problema
En Next.js 15, los `params` en rutas dinámicas deben ser "awaited" antes de acceder a sus propiedades.

**Errores reportados:**
```
Error: Route "/courses/[courseId]/lessons/[lessonId]" used `params.courseId`. 
`params` should be awaited before using its properties.
```

#### Solución Aplicada

**Antes (❌ Error):**
```typescript
interface LessonPageProps {
  params: {
    courseId: string
    lessonId: string
  }
}

export default async function LessonPage({ params }: LessonPageProps) {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      courseId: params.courseId,  // ❌ Error: params no awaited
      //...
    },
  })
  
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },  // ❌ Error
  })
}
```

**Después (✅ Correcto):**
```typescript
interface LessonPageProps {
  params: Promise<{  // ← Cambio: Promise wrapper
    courseId: string
    lessonId: string
  }>
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params  // ← Cambio: await y destructuring
  
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      courseId,  // ✅ Ahora se puede usar directamente
      //...
    },
  })
  
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },  // ✅ Correcto
  })
}
```

#### Aplicación General
Esta corrección se aplica a **todos** los routes dinámicos en Next.js 15:
- `/courses/[courseId]`
- `/courses/[courseId]/lessons/[lessonId]`
- `/courses/[courseId]/quiz/[quizId]`
- `/admin/courses/[id]/content`
- `/admin/areas/[id]`
- `/admin/positions/[id]`
- `/admin/sites/[id]`
- `/verify/[code]`
- Y cualquier otra ruta dinámica

#### Checklist para Nuevas Rutas
```typescript
// ✅ Siempre usar este patrón:
interface PageProps {
  params: Promise<{
    // tus params aquí
  }>
}

export default async function Page({ params }: PageProps) {
  const { param1, param2 } = await params
  // usar param1, param2 directamente
}
```

#### Resultado
✅ Todas las rutas dinámicas funcionan correctamente en Next.js 15
✅ Sin warnings de "params should be awaited"
✅ Patrón consistente en toda la aplicación

---

## Build y Compilación

### Issue: Linting Warnings

El build genera algunos warnings de ESLint que son intencionales:

```
Warning: React Hook useEffect has a missing dependency: 'loadAlerts'
Warning: Unexpected any. Specify a different type.
Warning: X is defined but never used
```

**Por qué ocurren:**
- Algunos imports se usan indirectamente (ej: componentes importados pero pasados como JSX)
- Algunas variables `any` son necesarias para compatibilidad con librerías externas
- ESLint es sensible pero el código funciona correctamente

**Acción:**
✅ Los warnings se pueden ignorar - el build sigue siendo exitoso (✓ Compiled successfully)

---

## Performance

### Actualizaciones de Notificaciones
El contador de notificaciones no leídas se actualiza cada 10 segundos. Si necesitas más frecuencia:

```typescript
// En src/components/notifications-badge.tsx
const interval = setInterval(loadUnreadCount, 10000)  // ← Cambiar este valor (ms)
```

Recomendaciones:
- 5000ms (5s): Mayor precisión, más carga de servidor
- 10000ms (10s): Balance recomendado
- 30000ms (30s): Menor carga, menos precisión

---

## Preguntas Frecuentes

### P: ¿Cómo resetear la base de datos?
**R:** Ejecuta:
```bash
pnpm prisma migrate reset --force
# Luego (si existe seed):
# pnpm db:seed
```

### P: ¿Cómo generar tipos de Prisma manualmente?
**R:** Ejecuta:
```bash
pnpm prisma generate
```

### P: ¿Cómo acceder a Prisma Studio?
**R:** Ejecuta:
```bash
pnpm prisma studio
```
Luego abre http://localhost:5555

### P: ¿El contador de notificaciones no se actualiza?
**R:** Verifica:
1. Hay una nueva notificación creada en la BD
2. El endpoint `/api/notifications/unread-count` responde
3. La sesión está activa (comprueba `session.user.collaboratorId`)
4. El componente está montado (verifica console.log en browser)

### P: ¿Cómo crear un nuevo endpoint de API?
**R:** Patrón recomendado:
```typescript
// src/app/api/nuevo-endpoint/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  // Validación de rol si es necesario
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  
  try {
    const data = await prisma.model.findMany()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error desconocido" }, { status: 500 })
  }
}
```

---

## Logs Útiles

### Ver logs de autenticación
```typescript
// En src/auth.ts, agrega console.log en callbacks:
callbacks: {
  async jwt({ token, user }) {
    console.log("JWT callback - token:", token)
    console.log("JWT callback - user:", user)
    // ...
  },
}
```

### Ver datos de sesión en cliente
```typescript
// En cualquier "use client" component:
import { useSession } from "next-auth/react"

export function MyComponent() {
  const { data: session } = useSession()
  console.log("Session data:", session)
  return <div>{session?.user?.name}</div>
}
```

### Ver queries de Prisma
```typescript
// En .env:
DATABASE_URL="...?schema=public"
# Agrega al final:
# Habilita logs de Prisma
```

---

## Contacto y Reportes

Si encuentras un problema:
1. Revisa esta guía de troubleshooting
2. Consulta la documentación en `docs/`
3. Revisa los logs del navegador (DevTools > Console)
4. Revisa los logs del servidor (terminal donde corre `pnpm dev`)
5. Crea un issue con detalles: error exact, pasos para reproducir, screenshots

---

**Última actualización**: Octubre 17, 2025
**Versión Next.js**: 15.5.5
**Versión Node.js**: 18+ recomendado
