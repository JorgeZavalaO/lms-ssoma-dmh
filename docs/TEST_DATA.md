# 🧪 Datos de Prueba - LMS SSOMA DMH

## 🚀 Servidor de Desarrollo

El servidor está corriendo en: **http://localhost:3000**

---

## 👤 Usuarios de Prueba

### 🔐 Superadministrador
- **Email**: `admin@ssoma.com`
- **Password**: `password123`
- **Acceso**: Completo a todos los módulos administrativos

### 👨‍💼 Administrador/Especialista SSOMA
- **Email**: `roberto.sanchez@empresa.com`
- **Password**: `password123`
- **Rol**: ADMIN
- **Acceso**: Gestión de cursos, inscripciones, reportes

### 👷 Colaboradores (Rol: COLLABORATOR)

#### Juan Mamani Quispe (Curso Completado ✅)
- **Email**: `juan.mamani@empresa.com`
- **Password**: `password123`
- **Puesto**: Operador
- **Estado**: Curso "Inducción SSOMA" completado y aprobado (90%)
- **Certificación**: Válida hasta 15/09/2025
- **Notificación**: Certificado listo para descargar

#### Ana Flores Medina (En Progreso 📝)
- **Email**: `ana.flores@empresa.com`
- **Password**: `password123`
- **Puesto**: Operador
- **Estado**: Curso "Inducción SSOMA" al 45% de progreso
- **Evaluación**: Reprobó primer intento (45%), puede reintentar
- **Notificación**: Nueva asignación de curso

#### María Gonzales Torres (En Progreso 📝)
- **Email**: `maria.gonzales@empresa.com`
- **Password**: `password123`
- **Puesto**: Supervisor
- **Estado**: Curso "Uso de EPP" al 60% de progreso

#### Carlos Rodríguez Pérez (Completado ✅)
- **Email**: `carlos.rodriguez@empresa.com`
- **Password**: `password123`
- **Puesto**: Gerente
- **Estado**: Curso "Uso de EPP" completado (100%)
- **Evaluación**: Aprobado con 100%

#### Patricia Huamán Castro (Certificación por Vencer ⚠️)
- **Email**: `patricia.huaman@empresa.com`
- **Password**: `password123`
- **Puesto**: Inspector de Seguridad
- **Estado**: Curso "Primeros Auxilios" completado
- **Certificación**: Vence el 20/11/2025 (1 mes)
- **Alerta**: Notificación de vencimiento próximo

#### Otros Colaboradores
- **Luis Ramírez**: `luis.ramirez@empresa.com` - Curso pendiente
- **Carmen López**: `carmen.lopez@empresa.com` - Sin cursos asignados
- **Pedro Vargas**: `pedro.vargas@empresa.com` - Sin cursos asignados

---

## 📚 Estructura de Datos Creados

### 🏢 Organización
- **3 Sedes**: Lima Central, Arequipa Sur, Cusco Operaciones
- **5 Áreas**: Operaciones, Seguridad y Salud, Mantenimiento, RRHH, Administración
- **8 Puestos**: Gerente, Supervisor, Operador, Especialista SSOMA, Inspector, Técnico, Analista, Asistente

### 📖 Cursos Publicados
1. **Inducción en Seguridad y Salud Ocupacional** (SSOMA-001)
   - Duración: 4 horas
   - Vigencia: 12 meses
   - 2 unidades, 5 lecciones
   - Evaluación: 5 preguntas (70% para aprobar)
   - Inscripciones: Juan (completado), Ana (en progreso)

2. **Uso Correcto de Equipos de Protección Personal** (SSOMA-002)
   - Duración: 3 horas
   - Vigencia: 12 meses
   - 1 unidad, 3 lecciones
   - Evaluación: 3 preguntas (70% para aprobar)
   - Inscripciones: Carlos (completado), María (en progreso)

3. **Trabajo Seguro en Altura** (SSOMA-003)
   - Duración: 6 horas
   - Modalidad: Blended
   - Inscripciones: Luis (pendiente)

4. **Primeros Auxilios Básicos** (SSOMA-004)
   - Duración: 8 horas
   - Vigencia: 24 meses
   - Modalidad: Sincrónica
   - Inscripciones: Patricia (completado, por vencer)

5. **Manejo Seguro de Sustancias Químicas** (SSOMA-005)
   - Duración: 5 horas
   - Vigencia: 12 meses
   - Sin inscripciones

### 📋 Reglas de Inscripción Automática
- Todos los **Operadores** → Inducción SSOMA
- Todo el **Área de Operaciones** → Uso de EPP
- Todo el **Área de Mantenimiento** → Trabajo en Altura

---

## 🎯 Funcionalidades a Probar

### 🔹 Como Superadmin (admin@ssoma.com)

#### Módulo A - Estructura Organizacional
- Ver listado de sedes, áreas y puestos
- Crear nuevas sedes/áreas/puestos
- Ver colaboradores por área

#### Módulo B - Colaboradores
- Ver listado completo de colaboradores
- Filtrar por sede/área/puesto/estado
- Crear nuevo colaborador
- Ver historial de asignaciones

#### Módulo C - Cursos
- Ver catálogo de 5 cursos publicados
- Crear nuevo curso
- Gestionar versiones de cursos
- Ver matriz de asignación (áreas/puestos/sedes)

#### Módulo D - Contenidos
- Ver unidades y lecciones del curso Inducción SSOMA
- Agregar nuevas lecciones (VIDEO, PDF, HTML)
- Ver repositorio de archivos

#### Módulo E - Inscripciones
- Ver 6 inscripciones activas con estados variados
- Inscribir manualmente a colaboradores
- Ver reglas de inscripción automática
- Filtrar por curso/estado

#### Módulo F - Evaluaciones
- Ver 2 quizzes creados con preguntas
- Ver banco de preguntas (8 preguntas tipo SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE)
- Ver 3 intentos de evaluación con resultados
- Ver distribución de puntajes

#### Módulo H - Progreso y Cumplimiento
- Ver progreso de colaboradores por curso
- Ver certificaciones emitidas (3 certificados)
- Ver alertas de vencimiento
- Dashboard de cumplimiento por área

#### Módulo I - Notificaciones
- Ver plantillas de notificación (3 tipos)
- Ver notificaciones enviadas
- Editar contenido de plantillas

#### Módulo J - Reportes
- **Dashboard Ejecutivo**: KPIs, gráficos de cumplimiento, alertas
- **Reporte por Área**: Estado de cada colaborador por curso
- **Reporte por Curso**: Estadísticas de Inducción SSOMA y EPP
- **Cumplimiento SSOMA**: Matriz de cumplimiento con semáforo
- **Trazabilidad**: Ver los 3 intentos de evaluación registrados

#### Módulo K - Certificados
- Ver lista de certificados emitidos
- Generar PDF de certificado
- Ver código QR de verificación
- Probar verificación pública de certificado

---

### 🔹 Como Colaborador (juan.mamani@empresa.com)

#### Vista de Colaborador
- **Dashboard**: Ver cursos asignados
- **Mis Cursos**: Ver curso completado con progreso 100%
- **Certificados**: Descargar certificado de Inducción SSOMA
- **Notificaciones**: Ver notificación de certificado listo
- **Progreso**: Ver historial de actividad

#### Vista de Colaborador en Progreso (ana.flores@empresa.com)
- **Mis Cursos**: Ver curso al 45%
- **Lecciones**: Continuar desde última lección
- **Evaluación**: Ver resultado de intento fallido (45%)
- **Reintentar**: Realizar segundo intento de evaluación
- **Notificaciones**: Ver aviso de nueva asignación

#### Vista con Alerta (patricia.huaman@empresa.com)
- **Alertas**: Ver notificación de certificación por vencer
- **Certificados**: Ver fecha de expiración (20/11/2025)
- **Recertificación**: Ver cursos disponibles para renovar

---

## 🧪 Casos de Prueba Sugeridos

### 1. Flujo Completo de Colaborador
1. Login como Ana Flores
2. Ver curso asignado "Inducción SSOMA"
3. Ver lecciones disponibles
4. Completar lecciones pendientes
5. Realizar evaluación (segundo intento)
6. Aprobar con >70%
7. Ver certificado generado

### 2. Flujo Administrativo
1. Login como admin
2. Crear nuevo colaborador
3. Asignar curso manualmente
4. Ver inscripción creada
5. Generar reporte de área
6. Exportar datos

### 3. Verificación de Certificado
1. Obtener código de verificación de Juan Mamani
2. Ir a página pública de verificación
3. Ingresar código
4. Ver información del certificado
5. Escanear QR code

### 4. Gestión de Alertas
1. Login como admin
2. Ver dashboard de cumplimiento
3. Identificar certificaciones por vencer
4. Ver alerta de Patricia (vence en 1 mes)
5. Enviar recordatorio

### 5. Reportes y Análisis
1. Ir a Reportes > Dashboard
2. Ver KPIs: colaboradores activos, cursos, cumplimiento
3. Ver gráficos de tendencias
4. Ir a Reportes > Por Área
5. Filtrar por área "Operaciones"
6. Ver matriz de progreso
7. Exportar a Excel

---

## 📊 Datos Clave para Reportes

### Cumplimiento General
- **Total Colaboradores Activos**: 10
- **Total Cursos Publicados**: 5
- **Total Inscripciones**: 6
- **Tasa de Completación**: 50% (3 de 6 completados)

### Por Estado
- ✅ **Completados**: 3 inscripciones
- 📝 **En Progreso**: 2 inscripciones
- ⏸️ **Pendientes**: 1 inscripción

### Certificaciones
- **Activas**: 3 certificaciones
- **Por Vencer (30 días)**: 1 (Patricia - Primeros Auxilios)
- **Vencidas**: 0

### Evaluaciones
- **Intentos Totales**: 3
- **Aprobados**: 2 (Juan 90%, Carlos 100%)
- **Reprobados**: 1 (Ana 45%)
- **Promedio General**: 78.3%

---

## 🔄 Regenerar Datos

Si necesitas resetear los datos:

```bash
pnpm db:seed
```

Esto eliminará todos los datos existentes y volverá a crear la estructura completa.

---

## 📝 Notas Importantes

1. **Contraseña Universal**: Todos los usuarios tienen la contraseña `password123`
2. **Fechas**: Los datos están configurados con fechas realistas (2024-2025)
3. **Vigencias**: Las certificaciones tienen fechas de expiración reales para probar alertas
4. **Roles**: 
   - SUPERADMIN: Acceso total
   - ADMIN: Gestión de cursos y reportes
   - COLLABORATOR: Solo vista de colaborador

5. **URLs Importantes**:
   - Login: http://localhost:3000
   - Dashboard Admin: http://localhost:3000/admin
   - Mis Cursos: http://localhost:3000/courses
   - Reportes: http://localhost:3000/reports
   - Verificación Pública: http://localhost:3000/verify

---

## 🎨 Experiencia del Colaborador

### Juan Mamani (Curso Completado)
✅ Puede ver su certificado
✅ Puede descargar PDF con QR
✅ Ve su progreso al 100%
✅ Ve notificación de certificado listo
✅ Puede compartir código de verificación

### Ana Flores (En Progreso)
📝 Ve su progreso al 45%
❌ Ve resultado de evaluación reprobada
🔄 Puede reintentar la evaluación
📚 Puede continuar con lecciones
📬 Ve notificación de nuevo curso asignado

### Patricia Huamán (Alerta de Vencimiento)
⚠️ Ve alerta de certificación por vencer
📅 Ve fecha de expiración: 20/11/2025
🔔 Recibió notificación de recordatorio
🔄 Puede iniciar proceso de recertificación

---

¡Disfruta explorando el sistema LMS SSOMA DMH! 🚀
