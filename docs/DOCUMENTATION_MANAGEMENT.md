# Gestión de Documentación - Guía de Organización

Documento para gestionar y mantener actualizada la documentación del proyecto LMS SSOMA DMH.

**Última actualización**: Octubre 17, 2025  
**Versión**: 1.1

---

## 📚 Estructura de Documentación

### Raíz del Proyecto

Archivos generales y de referencia rápida:

| Archivo | Propósito | Audiencia | Frecuencia |
|---------|-----------|-----------|-----------|
| `README.md` | Descripción general, stack, inicio rápido | Todos | Mensual |
| `CHANGELOG.md` | Historial de cambios y versiones | Todos | Por release |
| `package.json` | Dependencias y scripts | Developers | Por cambio |
| `tsconfig.json` | Configuración TypeScript | Developers | Ocasional |

### Carpeta `/docs`

Documentación detallada y técnica:

| Archivo | Propósito | Audiencia | Tamaño |
|---------|-----------|-----------|--------|
| `README_DOCS.md` | Índice y navegación general | Todos | Media (~600 líneas) |
| `MODULES.md` | Descripción de módulos A-K y sus features | Dev, PM | Grande (>800 líneas) |
| `API_REFERENCE.md` | Referencia de endpoints REST | Backend | Grande (>700 líneas) |
| `IMPLEMENTATION_NOTES.md` | Decisiones arquitectónicas y patrones | Arquitectura | Media |
| `MODULE_K_STATUS.md` | Estado detallado del módulo de Certificados | Equipo | Grande |
| `MODULE_J_STATUS.md` | Estado detallado del módulo de Reportes | Equipo | Grande |
| `MODULE_I_STATUS.md` | Estado detallado del módulo de Notificaciones | Equipo | Media |
| `MODULE_F_STATUS.md` | Estado detallado del módulo de Evaluaciones | Equipo | Media |
| `COLLABORATOR_FEATURES.md` | Guía del Portal del Colaborador | Usuarios, Soporte | Media |
| `TEST_DATA.md` | Datos de prueba y escenarios QA | QA, Dev | Grande (>250 líneas) |
| `TROUBLESHOOTING.md` | Problemas frecuentes y soluciones técnicas | Soporte, Dev | Media |
| `DOCUMENTATION_MANAGEMENT.md` | Esta guía de mantenimiento | Team | Media |

---

## 📝 Archivos Consolidados (Eliminados)

Estos archivos fueron consolidados en `/docs` y eliminados de la raíz:

- ~~`DATOS_PRUEBA.md`~~ → `docs/TEST_DATA.md` (Oct 17, 2025)
- ~~`SOLUCION_CURSOS_COLABORADOR.md`~~ → `docs/TROUBLESHOOTING.md` (Oct 17, 2025)
- ~~`CORRECCION_PARAMS_ASYNC.md`~~ → `docs/TROUBLESHOOTING.md` (Oct 17, 2025)
- ~~`VISTA_CURSO_COLABORADOR.md`~~ → `docs/COLLABORATOR_FEATURES.md` (Oct 17, 2025)
- ~~`DOCUMENTATION_REORGANIZATION_SUMMARY.md`~~ → contenido integrado en esta guía (Oct 17, 2025)
- ~~`DOCUMENTATION_CHANGES_SUMMARY.md`~~ → contenido integrado en esta guía (Oct 17, 2025)
- ~~`FINAL_SUMMARY.md`~~ → contenido integrado en esta guía (Oct 17, 2025)

---

## 🔄 Flujo de Actualización

### Cuándo Actualizar Cada Documento

#### `README.md` (Principal)
**Cuándo**: Cada vez que se complete un módulo o feature importante  
**Qué**: Agregar sección en "Características Principales"  
**Ejemplo**: Cuando se termina módulo de Evaluaciones  
```markdown
### 📝 Módulo de Evaluaciones
- 4 tabs: Disponibles, En Progreso, Aprobadas, Historial
- Sistema de reintentos
- ...
```

#### `CHANGELOG.md`
**Cuándo**: Antes de cada release/merge a main  
**Qué**: 
- Nueva sección `## [Versión X.Y.Z] - YYYY-MM-DD`
- Subsecciones: Agregado, Cambiado, Corregido, Eliminado, Deprecated
- Cada change con descripción técnica
**Ejemplo**:
```markdown
## [1.0.0] - 2025-10-17

### Agregado
- Módulo de Evaluaciones (4 tabs, 300 líneas)
- API endpoints: GET/POST /api/evaluations

### Corregido
- Bug en validación de async params
```

#### `docs/MODULES.md`
**Cuándo**: Al completar o cambiar un módulo  
**Qué**: Actualizar sección del módulo con estado actual  
**Estructura**:
```markdown
## Módulo X - Nombre

### Estado: ✅ COMPLETADO / 🔄 EN DESARROLLO

### Descripción
...

### Features
- Feature 1
- Feature 2

### Endpoints
- GET /api/...
- POST /api/...

### Archivos Principales
- `src/app/module/page.tsx`
- `src/lib/module.ts`
```

#### `docs/API_REFERENCE.md`
**Cuándo**: Cada nuevo endpoint creado  
**Qué**:
- Método HTTP (GET, POST, PUT, DELETE)
- Ruta y parámetros
- Entrada (request body/params)
- Salida (response schema)
- Errores posibles
- Permisos requeridos
**Ejemplo**:
```markdown
### GET /api/evaluations

**Descripción**: Obtiene lista de evaluaciones del usuario

**Parámetros**:
- `status` (query): AVAILABLE, IN_PROGRESS, COMPLETED

**Response**:
```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "status": "AVAILABLE"
    }
  ]
}
```

**Errores**:
- 401 Unauthorized
- 403 Forbidden
```

#### `docs/IMPLEMENTATION_NOTES.md`
**Cuándo**: Al tomar decisiones arquitectónicas importantes  
**Qué**:
- Decisión tomada
- Razón por la cual
- Alternativas consideradas
- Trade-offs
**Ejemplo**:
```markdown
## Decision: Async Params en Next.js 15

**Decisión**: Usar `params: Promise<{}>` para params dinámicas

**Razón**: Next.js 15 requiere este patrón para validación en tiempo de compilación

**Alternativas**:
1. Props anidado (anterior) - menos performance
2. URL directa - menos seguridad

**Trade-offs**:
- ✅ Mejor performance
- ✅ Mejor tipado
- ❌ Requiere await en layouts
```

#### `docs/MODULE_K_STATUS.md` (y J, I)
**Cuándo**: Semanal o cuando hay cambios significativos  
**Qué**:
- Estado actual del módulo
- % de completitud
- Bugs conocidos
- Próximos pasos
- Líneas de código
- Endpoints
- Dependencias

#### `docs/TEST_DATA.md`
**Cuándo**: Al agregar nuevas rutas de prueba o test data  
**Qué**:
- Nuevos usuarios de prueba
- Escenarios de testing
- Estructura de datos
- Scripts SQL si aplica

#### `docs/TROUBLESHOOTING.md`
**Cuándo**: Cada vez que se encuentra/resuelve un problema común  
**Qué**:
- Descripción del problema
- Síntomas
- Causa raíz
- Solución paso a paso
- Comandos si aplica

#### `docs/COLLABORATOR_FEATURES.md`
**Cuándo**: Cuando se agrega feature nueva para usuarios  
**Qué**:
- Descripción de la feature
- Cómo usarla
- Screenshots descriptions
- Flujos de usuario
- Troubleshooting

#### `docs/README_DOCS.md`
**Cuándo**: Cuando cambia la estructura de la documentación  
**Qué**:
- Índice de documentos
- Descripción breve de cada uno
- A quién va dirigido
- Links de navegación

---

## 📋 Checklist de Actualización

Cuando completes una feature importante, verifica:

```
Feature: [Nombre Feature]
Fecha: [Fecha]
Desarrollador: [Nombre]

Documentación:
[ ] README.md - Sección agregada/actualizada
[ ] CHANGELOG.md - Entrada en "[Unreleased]"
[ ] docs/MODULES.md - Módulo correspondiente actualizado
[ ] docs/API_REFERENCE.md - Endpoints documentados (si aplica)
[ ] docs/IMPLEMENTATION_NOTES.md - Decisiones arquitectónicas registradas
[ ] docs/COLLABORATOR_FEATURES.md - Feature en guía de usuario (si aplica)
[ ] docs/MODULE_X_STATUS.md - Status file actualizado (si aplica)
[ ] TypeScript - Sin errores (pnpm tsc --noEmit)
[ ] Build - Exitoso (pnpm build)
[ ] Lint - Sin warnings críticos (pnpm lint)

Código:
[ ] JSDoc comments en funciones públicas
[ ] Types/Interfaces bien definidos
[ ] Validaciones con Zod (si es API)
[ ] Error handling completo
[ ] Tests unitarios (si aplica)

Revisión:
[ ] Code review completado
[ ] Documentación revisada
[ ] No hay conflictos
```

---

## 🎯 Estándares de Documentación

### Formato Markdown

- Usar encabezados jerárquicos (H1 → H2 → H3)
- Listas con `-` o números ordenados
- Código en bloques `` ``` ``
- Links internos: `[Texto](../ruta/archivo.md)`
- Emojis para visual (📚 Módulos, 🔔 Notificaciones, etc.)

### Código en Documentación

```markdown
# Bloque de código con lenguaje especificado
\`\`\`typescript
interface User {
  id: string
  name: string
}
\`\`\`
```

### Tablas

```markdown
| Encabezado 1 | Encabezado 2 |
|--------------|--------------|
| Dato         | Dato         |
```

### Links Internos

```markdown
[Ver API Reference](../API_REFERENCE.md)
[Módulo K](./MODULES.md#módulo-k---certificados)
```

---

## 🔗 Referencias Cruzadas

### De README.md a docs/

- Características detalladas en `docs/MODULES.md`
- API endpoints en `docs/API_REFERENCE.md`
- Stack técnico en `docs/IMPLEMENTATION_NOTES.md`
- Features del usuario en `docs/COLLABORATOR_FEATURES.md`

### De docs/MODULES.md a otros

- Información de testing en `docs/TEST_DATA.md`
- Problemas conocidos en `docs/TROUBLESHOOTING.md`
- Status detallado en `docs/MODULE_X_STATUS.md`

### De docs/API_REFERENCE.md a otros

- Implementación en `src/app/api/...`
- Tests en `__tests__/api/...`
- Validaciones en `src/validations/...`

---

## � Historial de Reorganizaciones

### Octubre 17, 2025

- Se consolidaron todos los documentos de referencia en la carpeta `docs/`.
- La raíz del repositorio conserva únicamente `README.md` y `CHANGELOG.md` como documentación.
- Se crearon los archivos `docs/COLLABORATOR_FEATURES.md` y `docs/DOCUMENTATION_MANAGEMENT.md` para centralizar información del portal del colaborador y del proceso de mantenimiento.
- Los resúmenes transitorios de reorganización se integraron en este documento y en `docs/README_DOCS.md`.
- Se actualizó `docs/README_DOCS.md` como índice oficial de navegación para cualquier rol.

---

## �📊 Métrica: Cobertura de Documentación

**Score de Cobertura**: (Documentos Actualizados / Documentos Totales) × 100

**Documentos Core** (deben estar siempre actualizados):
1. README.md
2. CHANGELOG.md
3. docs/MODULES.md
4. docs/API_REFERENCE.md

**Documentos Suplementarios** (actualizar regularmente):
5. docs/MODULE_X_STATUS.md (por módulo)
6. docs/IMPLEMENTATION_NOTES.md
7. docs/COLLABORATOR_FEATURES.md

**Documentos de Referencia** (actualizar según necesidad):
8. docs/TEST_DATA.md
9. docs/TROUBLESHOOTING.md
10. docs/README_DOCS.md

**Objetivo**: Mantener Score >= 80%

---

## 🚀 Herramientas Útiles

### Generación de Índice de Contenidos

Agregar al inicio de documentos largos:
```markdown
## 📑 Tabla de Contenidos

1. [Sección 1](#sección-1)
2. [Sección 2](#sección-2)
   - [Subsección 2.1](#subsección-21)
3. [Sección 3](#sección-3)
```

### Búsqueda de Documentos

```bash
# Buscar en todos los .md
grep -r "término" docs/

# Contar palabras de un documento
wc -w docs/API_REFERENCE.md

# Listar documentos por tamaño
ls -lS docs/*.md
```

### Validación de Links

```bash
# Verificar links (herramienta externa)
# npm install -g markdown-link-check
markdown-link-check README.md
```

---

## 📅 Calendario de Revisión

| Mes | Documentos a Revisar |
|-----|----------------------|
| Enero | README.md, MODULES.md, API_REFERENCE.md |
| Abril | MODULE_STATUS.md files, CHANGELOG.md |
| Julio | COLLABORATOR_FEATURES.md, TROUBLESHOOTING.md |
| Octubre | Todos (revisión anual) |

---

## 📞 Responsables

| Documento | Responsable | Backup |
|-----------|------------|--------|
| README.md | Project Manager | Tech Lead |
| CHANGELOG.md | Release Manager | Tech Lead |
| docs/MODULES.md | Tech Lead | Senior Dev |
| docs/API_REFERENCE.md | Backend Lead | Senior Dev |
| docs/MODULE_X_STATUS.md | Feature Owner | Team |
| docs/COLLABORATOR_FEATURES.md | UX/PM | Support |
| docs/TROUBLESHOOTING.md | Support Lead | QA |

---

## ✅ Validación Pre-Commit

Antes de hacer commit, verifica:

```bash
# 1. Documentación principal actualizada
git status docs/ README.md CHANGELOG.md

# 2. No hay markdown inválido
# grep -E "^\[.*\]\(" **/*.md | grep -v "^\[.*\]\(http"

# 3. Links internos válidos
ls -R docs/

# 4. Tablas bien formateadas
# Verificar manualmente en editor
```

---

**Documento mantenido por**: DMH Documentation Team  
**Última actualización**: October 17, 2025  
**Próxima revisión**: January 17, 2026
