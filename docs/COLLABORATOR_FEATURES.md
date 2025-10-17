# Portal del Colaborador - Características y Guía de Uso

Documento de referencia para las funcionalidades del portal de autoservicio del colaborador en el LMS SSOMA DMH.

**Última actualización:** Octubre 17, 2025  
**Versión:** 1.0

---

## 📑 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Navegación Principal](#navegación-principal)
3. [Mis Cursos](#mis-cursos)
4. [Evaluaciones](#evaluaciones)
5. [Certificados](#certificados)
6. [Notificaciones](#notificaciones)
7. [Perfil](#perfil)
8. [Troubleshooting](#troubleshooting)

---

## Introducción

El Portal del Colaborador es el espacio personal donde cada usuario puede:
- Ver sus cursos asignados y seguimiento de progreso
- Realizar evaluaciones y ver resultados
- Descargar y verificar certificados
- Gestionar preferencias de notificaciones
- Actualizar información personal

### Acceso

Los colaboradores acceden al portal mediante:
1. Login en `/` con credenciales
2. Selección de rol "COLLABORATOR" si aplica
3. Redirección automática al dashboard o perfil

### Roles y Permisos

- **COLLABORATOR**: Acceso completo a su propio portafolio
  - No puede ver datos de otros colaboradores
  - No puede administrar cursos o evaluaciones
  - Puede descargar sus certificados
  - Puede personalizar preferencias de notificaciones

---

## Navegación Principal

### Sidebar del Colaborador

La navegación lateral muestra 5 secciones principales:

```
├── 📚 Cursos
├── 📝 Evaluaciones
├── 🏆 Certificados
├── 🔔 Notificaciones [Con contador en tiempo real]
└── 👤 Perfil
```

#### Contador de Notificaciones

- **Ubicación**: Esquina superior derecha de "Notificaciones" en sidebar
- **Diseño**: Badge rojo destructive
- **Comportamiento**:
  - Muestra el número de notificaciones no leídas
  - Se actualiza automáticamente cada 10 segundos
  - Se oculta cuando no hay notificaciones (= 0)
  - Muestra "99+" para conteos > 99
  - Responde a eventos en tiempo real

---

## Mis Cursos

**Ruta**: `/app/cursos` (requerida: sesión activa)

### Descripción

Visualización centralizada de todos los cursos asignados al colaborador con seguimiento de progreso.

### Interfaz

#### Estructura de Pestañas

1. **Disponibles**
   - Cursos listos para iniciar
   - Botón: "Iniciar Curso"
   - Condición: Sin haber comenzado

2. **En Progreso**
   - Cursos con avance parcial
   - Botón: "Continuar"
   - Muestra: % de completado, última actividad
   - Condición: 0% < progreso < 100%

3. **Completados**
   - Cursos finalizados exitosamente
   - Botón: "Ver Resultados" (si tiene evaluación)
   - Muestra: Nota final, fecha de completado
   - Condición: Progreso = 100% o PASSED

4. **Historial**
   - Todos los cursos del colaborador
   - Timeline histórica
   - Incluye cursos desaprobados, vencidos

#### Tarjetas de Curso

Cada tarjeta muestra:
- **Nombre**: Título del curso
- **Descripción**: Resumen breve
- **Progreso Visual**: Barra de progreso con porcentaje
- **Estado**: Badge (disponible/en curso/completado/vencido)
- **Duración**: Horas de contenido
- **Última actividad**: "Hace 2 horas", "Ayer"
- **Acción principal**: Botón contextual (Iniciar/Continuar/Ver Resultados)

#### Stat Cards

Información agregada:
- **Total de Cursos**: N cursos asignados
- **En Progreso**: N cursos iniciados
- **Completados**: N cursos finalizados
- **Tasa de Completación**: X%

### Estados del Curso

| Estado | Descripción | Acción |
|--------|-------------|--------|
| DISPONIBLE | Listo para iniciar | Iniciar |
| EN_PROGRESO | Iniciado, con avance | Continuar |
| COMPLETADO | Finalizado exitosamente | Ver Resultados |
| DESAPROBADO | No cumplió requisitos mínimos | Reintentar (si aplica) |
| VENCIDO | Fecha de vigencia superada | Solicitar extensión |

### Flujo de Usuario

```
1. Colaborador accede a "Mis Cursos"
2. Visualiza cursos por estado
3. Selecciona un curso disponible
4. Hace clic en "Iniciar Curso"
5. Sistema lo redirige a la página del curso
6. Colaborador accede a lecciones, videos, documentos
7. Sistema registra progreso automáticamente
8. Al completar el 100%, genera notificación
```

---

## Evaluaciones

**Ruta**: `/app/evaluations` (requerida: sesión activa)

### Descripción

Gestión centralizada de evaluaciones, quizzes y exámenes del colaborador.

### Interfaz

#### Estructura de Pestañas

1. **Disponibles**
   - Evaluaciones pendientes de realizar
   - Muestra: Tiempo límite, intentos disponibles, nota mínima
   - Botón: "Realizar Evaluación"

2. **En Progreso**
   - Evaluaciones iniciadas pero no enviadas
   - Timer visible (si tiene límite de tiempo)
   - Muestra: Preguntas respondidas / Total
   - Botón: "Continuar"

3. **Aprobadas**
   - Evaluaciones con resultado exitoso
   - Muestra: Nota, retroalimentación, fecha
   - Botón: "Ver Detalle"

4. **Historial**
   - Todas las evaluaciones realizadas
   - Incluye desaprobadas
   - Timeline histórica con fechas

#### Stat Cards

- **Total**: Cantidad total de evaluaciones
- **En Progreso**: Evaluaciones iniciadas sin enviar
- **Aprobadas**: Evaluaciones con nota exitosa
- **Historial**: Todas las realizadas (incluyendo desaprobadas)

### Estados de Evaluación

| Estado | Descripción |
|--------|-------------|
| DISPONIBLE | Lista para iniciar, requiere click |
| EN_PROGRESO | Iniciada, respondiendo preguntas |
| ENVIADA | Completada, en espera de calificación |
| CALIFICADA | Calificación automática completada |
| APROBADA | Score >= nota mínima (✅) |
| DESAPROBADA | Score < nota mínima (❌) |

### Flujo de Evaluación

```
1. Colaborador ve evaluación en tab "Disponibles"
2. Hace clic en "Realizar Evaluación"
3. Sistema presenta preguntas una por una (o todas)
4. Colaborador responde cada pregunta
5. Timer cuenta regresivo (si aplica)
6. Colaborador envía evaluación
7. Sistema califica automáticamente
8. Se muestra resultado con:
   - Nota final (porcentaje)
   - Retroalimentación detallada
   - Explicación de respuestas correctas
   - Opción de reintento (si está disponible)
```

### Configuración de Evaluación

Cada evaluación puede tener:
- **Tiempo Límite**: 30 min, 60 min, sin límite
- **Intentos Máximos**: 1, 2, 3 o ilimitados
- **Nota Mínima**: 60%, 70%, 80%, etc.
- **Aleatorización**: Preguntas y opciones desordenadas por intento
- **Políticas de Visualización**: Ver respuestas correctas después, feedback inmediato, etc.

### Remediación

Si un colaborador desaprueba:
1. Puede acceder a contenido de refuerzo (si está configurado)
2. El sistema puede bloquear reintento hasta completar refuerzo
3. Después del refuerzo, puede reintentar la evaluación
4. Máximo de intentos se respeta

---

## Certificados

**Ruta**: `/app/my-certificates` (requerida: sesión activa)

### Descripción

Gestión y descarga de certificados obtenidos, con validación de vigencia.

### Interfaz

#### Estructura de Pestañas

1. **Vigentes**
   - 🟢 Certificados válidos y activos
   - Condición: Hoy <= Fecha Vencimiento + 30 días
   - Botón: Descargar PDF, Verificar (QR), Ver Público

2. **Por Vencer** 
   - 🟡 Certificados que vencen en menos de 30 días
   - Condición: 7 días <= Días Restantes <= 30 días
   - Alerta visual sobre próximo vencimiento
   - Sugerencia de recertificación

3. **Vencidos**
   - 🔴 Certificados expirados
   - Condición: Hoy > Fecha Vencimiento + 7 días
   - Opción: Solicitar recertificación
   - Historial de certificados anteriores

4. **Historial Completo**
   - Todos los certificados emitidos
   - Orden cronológico descendente
   - Filtros por curso, año, estado

#### Tarjetas de Certificado

Información mostrada:
- **Curso**: Nombre del curso que certifica
- **Versión**: Versionado del contenido
- **Fecha de Emisión**: Cuándo se generó
- **Fecha de Vencimiento**: Cuándo expira
- **Vigencia**: Badge visual (Vigente/Por Vencer/Vencido)
- **Acciones**: 
  - 📥 Descargar PDF
  - 🔗 Link Público (compartible)
  - 🔍 Ver QR (en modal)

#### Stat Cards

- **Total**: Cantidad total de certificados
- **Vigentes**: 🟢 Válidos y activos
- **Por Vencer**: 🟡 Próximos a expirar (< 30 días)
- **Vencidos**: 🔴 Expirados

### Validación de Vigencia

Sistema automático con umbrales de 30 días:

```
Hoy + 30 días
    ├─ Vigente (>30 días restantes) ✅ 🟢
    ├─ Por Vencer (7-30 días restantes) ⚠️  🟡
    └─ Vencido (<7 días o ya expirado) ❌ 🔴
```

### Descarga de Certificado PDF

**Formato**: A4 Landscape (horizontal)

**Contenido**:
```
┌─────────────────────────────────┐
│    CERTIFICADO DE APROBACIÓN    │
│                                 │
│  Colaborador: Juan Pérez García │
│  DNI: 12.345.678-X              │
│  Curso: "Seguridad en Altura"   │
│  Nota: 92%                      │
│  Horas: 40                      │
│                                 │
│  Emitido: 15 Oct 2025           │
│  Expira: 15 Oct 2027            │
│                                 │
│  [QR Code 300x300]              │
│  Verificar: www.site/verify/... │
│                                 │
│  Código: 4A7F2B8C9D1E5F3A       │
│  Firma: SSOMA Director          │
└─────────────────────────────────┘
```

**Características**:
- Marca de agua "SSOMA" en segundo plano
- Bordes dobles decorativos
- QR code para verificación rápida
- Código de verificación único de 16 caracteres
- Información completa (DNI, nota, horas, fechas)
- Descargar archivo local para guardar o imprimir

### Verificación Pública

**Acceso**: Sin autenticación requerida  
**URL**: `www.site/verify/[codigo-verificacion]`

Cualquier persona puede verificar un certificado:
1. Ingresando código manualmente
2. Escaneando código QR
3. Resultado: Estado (válido/expirado/no encontrado)

**Información Pública** (datos mostrados):
- Nombre del certificado
- Nombre del colaborador
- Curso
- Fecha de emisión y vencimiento
- Estado de validez
- Nota (puntuación)

**Información NO Pública** (datos no mostrados):
- DNI del colaborador
- Email
- Datos organizacionales
- Historial completo

---

## Notificaciones

**Ruta**: `/app/notifications` (requerida: sesión activa)  
**Preferencias**: `/app/notifications/preferences`

### Descripción

Centro unificado de notificaciones con bandeja interna y control de preferencias.

### Interfaz Principal

#### Estructura de Pestañas

1. **Todas**
   - Todas las notificaciones recibidas
   - Orden: Más recientes primero
   - Muestra: Leídas y no leídas

2. **No Leídas**
   - Solo notificaciones sin leer
   - Contador (también en sidebar)
   - Acción rápida: Marcar como leída

3. **Archivadas**
   - Notificaciones movidas a archivo
   - Recuperable si es necesario
   - Acción: Desarchivar

#### Tarjetas de Notificación

Cada notificación muestra:
- **Ícono**: Por tipo de notificación (🔔 Curso, ⏰ Recordatorio, ⚠️ Alerta)
- **Título**: Asunto de la notificación
- **Descripción**: Detalle breve
- **Fecha**: Cuándo se envió ("Hace 5 min", "Ayer")
- **Estado de Lectura**: Indicador visual (punto azul si no leído)
- **Acciones**: Marcar leída, archivar, eliminar
- **Prioridad**: Badge si es crítica (rojo) o importante (naranja)

#### Stat Cards

Información agregada en tiempo real:
- **Total**: Cantidad total de notificaciones
- **No Leídas**: 🔵 Notificaciones sin leer (actualizadas cada 10s)
- **Leídas**: ✓ Notificaciones ya consultadas
- **Archivadas**: 📦 Notificaciones guardadas

#### Botones de Acción

- **Marcar todas como leídas**: Limpia el contador
- **Preferencias**: Enlace a `/notifications/preferences`

### Tipos de Notificación

El sistema envía 8 tipos diferentes de notificaciones:

| Tipo | Ícono | Color | Descripción |
|------|-------|-------|-------------|
| COURSE_ASSIGNED | 📚 | Azul | Nuevo curso asignado |
| COURSE_REMINDER_30 | ⏰ | Naranja | Curso vence en 30 días |
| COURSE_REMINDER_7 | ⏰ | Rojo | Curso vence en 7 días |
| COURSE_REMINDER_1 | ⏰ | Rojo | Curso vence mañana |
| QUIZ_RESULT | 📊 | Verde | Resultado de evaluación |
| CERTIFICATE_READY | 🏆 | Oro | Certificado disponible |
| RECERT_REQUIRED | ⚠️ | Rojo | Recertificación necesaria |
| SYSTEM_ANNOUNCEMENT | 📢 | Gris | Anuncio del sistema |

### Contador en Tiempo Real

**Ubicación**: Sidebar, lado derecho de "Notificaciones"

**Características**:
- Badge rojo destructive
- Número de notificaciones NO LEÍDAS
- Se actualiza cada 10 segundos automáticamente
- Responde a eventos en tiempo real
- Se oculta cuando no hay notificaciones (= 0)
- Muestra "99+" para conteos > 99

**Tecnología**:
- Fetch a `/api/notifications/unread-count`
- setInterval cada 10,000ms
- Event listeners personalizados ("notificationUpdate")
- Auto-refresh sin recarga de página

### Preferencias de Notificaciones

**Acceso**: `/app/notifications/preferences`

#### Configuración Granular

Cada tipo de notificación tiene 2 canales configurables:

| Canal | Ícono | Descripción |
|-------|-------|-------------|
| 📧 Email | Correo electrónico | Entrega a buzón de correo |
| 📱 En-App | Notificación en-app | Bandeja interna del portal |

#### Secciones de Preferencias

**1. Cursos** (Asignaciones, Recordatorios, Vencimientos)
- COURSE_ASSIGNED: Nuevo curso asignado
- COURSE_REMINDER_30: Recordatorio 30 días antes
- COURSE_REMINDER_7: Recordatorio 7 días antes
- COURSE_REMINDER_1: Recordatorio 1 día antes

**2. Evaluaciones** (Recordatorios, Resultados)
- QUIZ_REMINDER: Evaluación disponible
- QUIZ_RESULT: Resultado de evaluación completada
- QUIZ_PASSED: Evaluación aprobada
- QUIZ_FAILED: Evaluación desaprobada

**3. Gestión de Equipo** (Para jefes de área)
- TEAM_SUMMARY: Resumen semanal de equipo
- TEAM_ALERT: Alerta de vencimiento en equipo

#### Switches por Canal

Para cada notificación:
```
┌─ Tipo de Notificación ─────────────────────┐
│ Descripción de qué es...                   │
│ ☑️ Email  │  ☐ En-App                     │
└────────────────────────────────────────────┘
```

Cada switch es independiente:
- Puedo recibir por email pero NO en-app
- Puedo recibir por ambos canales
- Puedo desactivar completamente

#### Advertencia de Notificaciones Críticas

Mensaje informativo (azul):
```
ℹ️ Las notificaciones críticas (vencimientos inmediatos)
   siempre se envían independiente de estas preferencias
```

#### Guardado de Cambios

- Botón "Guardar Cambios" aparece solo si hay cambios
- Confirmación con toast/notificación
- Cambios se aplican inmediatamente
- API: PUT `/api/notification-preferences`

### Flujo de Notificación

```
1. Sistema genera evento (ej: curso vence en 30 días)
2. Verifica preferencias del colaborador
3. Si EMAIL habilitado → Envía email
4. Si EN_APP habilitado → Crea entrada en bandeja
5. Incrementa contador de no leídas
6. Emite evento personalizado "notificationUpdate"
7. Sidebar muestra contador actualizado
8. Colaborador ve badge rojo con número
```

---

## Perfil

**Ruta**: `/app/profile` (requerida: sesión activa)

### Descripción

Visualización y edición de información personal y organizacional del colaborador.

### Interfaz

#### Avatar

- Imagen circular con iniciales
- Genera iniciales automáticas del nombre
- Foto de perfil (si está disponible)
- Tamaño: 120x120px en desktop

#### Información Personal

**Sección**: Editable (parcialmente)

Campos mostrados:
- **Nombre**: Texto completo (si editable)
- **DNI**: Número de identificación (solo lectura)
- **Email**: Correo electrónico (editable)
- **Teléfono**: Número de contacto (si disponible)
- **Ubicación**: Sede/Oficina

Permisos:
- Email: ✏️ Editable
- DNI: 🔒 Solo lectura (datos legales)
- Nombre: 🔒 Solo lectura (cambio por RRHH)
- Teléfono: Según política

#### Información Organizacional

**Sección**: Solo lectura (administrado por RRHH)

Campos mostrados:
- **Área**: Departamento/Sección
- **Puesto**: Cargo o posición
- **Sede**: Ubicación de trabajo
- **Jefe Directo**: Nombre del supervisor
- **Antigüedad**: Tiempo en la empresa
- **Estado**: Activo/Inactivo

Nota: Cambios en esta sección solo por administrador

#### Stat Cards

Información resumida:
- **ID Usuario**: UUID del usuario en el sistema
- **ID Colaborador**: Identificador único del colaborador
- **Antigüedad**: "2 años, 3 meses" o días desde incorporación
- **Estado**: Badge (Activo ✅ / Inactivo ❌)

#### Modo Edición

**Activación**: Botón "Editar" en header

**Cambios permitidos**:
- Email: Campo input normal
- Otros campos: Deshabilitados (solo lectura)

**Acciones**:
- "Guardar Cambios": Guarda email editado
- "Cancelar": Descarta cambios sin guardar
- Confirmación con toast de éxito/error

### Flujo de Usuario

```
1. Colaborador accede a "Perfil"
2. Ve información personal y organizacional
3. Si quiere editar email:
   - Hace clic en "Editar"
   - Modifica email
   - Hace clic en "Guardar Cambios"
4. Sistema valida email
5. Guarda cambio en BD
6. Muestra confirmación: "Email actualizado correctamente"
7. Vuelve a modo de solo lectura
```

### Datos Mostrados vs No Mostrados

**SÍ se muestran**:
- Nombre completo
- DNI
- Email
- Teléfono (si disponible)
- Área y puesto
- Sede/Ubicación
- Jefe directo
- Antigüedad
- Estado (Activo/Inactivo)

**NO se muestran**:
- Contraseña (nunca)
- Salario o información salarial
- Notas privadas de RRHH
- Historial completo de cambios

### Edición desde Sidebar

El colaborador también puede:
1. Hacer clic en su avatar en la parte superior del sidebar
2. Acceder a su perfil desde ahí
3. O acceder directamente desde el menú "Perfil"

---

## Troubleshooting

### Problemas Comunes

#### "No puedo ver mis cursos asignados"

**Síntomas**: Tab "Mis Cursos" aparece vacío

**Causas posibles**:
1. No hay cursos asignados a tu usuario
2. Están asignados pero no publicados
3. Problema de sesión/autenticación

**Soluciones**:
1. Contactar a tu supervisor o RRHH
2. Verificar que tu sesión está activa (revisar sidebar)
3. Cerrar sesión y volver a ingresar

**Contacto**: IT Support - [email de soporte]

---

#### "No veo el contador de notificaciones"

**Síntomas**: Badge no aparece o siempre muestra 0

**Causas posibles**:
1. JavaScript deshabilitado en navegador
2. Problemas de conexión a internet
3. Cache del navegador anticuado

**Soluciones**:
1. Verificar que JavaScript está habilitado (F12 > Console)
2. Recargar página (Ctrl+F5 para limpiar cache)
3. Probar en navegador privado/incógnito
4. Verificar conexión a internet

**Contacto**: IT Support

---

#### "No puedo descargar mi certificado"

**Síntomas**: Botón "Descargar" no responde

**Causas posibles**:
1. Certificado aún no generado
2. Problema de navegador (bloqueador de pop-ups)
3. Problema de permisos

**Soluciones**:
1. Esperar 5 minutos y recargar (PDF se genera de manera asíncrona)
2. Desabilitar bloqueadores de pop-ups para este sitio
3. Probar con otro navegador
4. Verificar espacio de almacenamiento en PC

**Contacto**: IT Support

---

#### "No recibo notificaciones por email"

**Síntomas**: Las notificaciones aparecen en-app pero no llegan emails

**Causas posibles**:
1. Email deshabilitado en preferencias
2. Email incorrecto en perfil
3. Email cayendo en spam
4. Problema de configuración SMTP

**Soluciones**:
1. Ir a Notificaciones > Preferencias
2. Verificar que Email está habilitado para ese tipo
3. Revisar carpeta de Spam/Correo no deseado
4. Verificar email en Perfil
5. Contactar a IT

**Contacto**: IT Support - [email de soporte]

---

#### "Evaluación no se guarda"

**Síntomas**: Respondo preguntas pero al enviar me dice error

**Causas posibles**:
1. Tiempo límite expirado
2. Problema de conexión a internet
3. Sesión expirada
4. Evaluación tiene problema técnico

**Soluciones**:
1. Revisar timer (si hay límite de tiempo)
2. Verificar conexión (F12 > Network)
3. Recargar y intentar de nuevo
4. Contactar a soporte urgente

**Contacto**: IT Support - [email de soporte]

---

### Contacto y Soporte

**Email de Soporte**: support@ssoma-dmh.local  
**Teléfono**: +56 2 XXXX XXXX  
**Horario**: Lunes-Viernes 9:00-17:00  
**Tiempo de Respuesta**: < 24 horas

---

## Apéndices

### Versiones de Navegadores Soportados

- Chrome 120+
- Firefox 121+
- Safari 17+
- Edge 120+
- Mobile: iOS Safari 17+, Chrome Android 120+

### Requerimientos de Sistema

- JavaScript habilitado
- Cookies habilitadas
- Conexión a internet > 1 Mbps
- Resolución mínima: 320px (mobile)

### Privacidad y Seguridad

- Los datos personales están protegidos por HTTPS
- Solo tú puedes ver tu información
- Las certificaciones se pueden verificar públicamente (sin datos sensibles)
- Los certificados se almacenan encriptados
- Política de privacidad: [link a política]

---

**Documento generado**: October 17, 2025  
**Próxima revisión**: January 17, 2026  
**Mantenedor**: DMH IT Team
