# 📚 Índice de Documentación

**Fecha de completado:** 17 de octubre de 2025  
**Última actualización:** 17 de octubre de 2025  
**Responsable:** DMH Documentation Team

---
## 🎯 Objetivos
- Mantener un índice único de la documentación activa del proyecto.
- Evitar redundancias indicando el propósito de cada archivo.
- Guiar a cada perfil del equipo hacia la información que necesita.
- Recordar la política de mantener solo `README.md` y `CHANGELOG.md` en la raíz.

> Para políticas de mantenimiento y checklists detallados consulta `docs/DOCUMENTATION_MANAGEMENT.md`.

---
## 🗂️ Mapa de Documentos

| Categoría | Archivo | Descripción | Audiencia principal |
|-----------|---------|-------------|---------------------|
| General | `README.md` | Descripción del proyecto, stack y onboarding | Todo el equipo |
| General | `CHANGELOG.md` | Historial de cambios (Keep a Changelog) | Todo el equipo |
| Índice | `docs/README_DOCS.md` | Navegación y enlaces a la documentación | Todo el equipo |
| Arquitectura & Alcance | `docs/MODULES.md` | Resumen funcional de los módulos A–K | PM, Dev |
| Arquitectura & Alcance | `docs/IMPLEMENTATION_NOTES.md` | Decisiones técnicas, patrones y convenciones | Arquitectura, Dev |
| API | `docs/API_REFERENCE.md` | Endpoints REST, payloads, errores y permisos | Backend, QA |
| Estado por módulo | `docs/MODULE_K_STATUS.md` | Certificados – estado, métricas y roadmap | Equipo de Certificados |
| Estado por módulo | `docs/MODULE_J_STATUS.md` | Reportes – estado, métricas y roadmap | Equipo de Reportes |
| Estado por módulo | `docs/MODULE_I_STATUS.md` | Notificaciones – estado, métricas y roadmap | Equipo de Notificaciones |
| Estado por módulo | `docs/MODULE_F_STATUS.md` | Evaluaciones – estado, métricas y roadmap | Equipo de Evaluaciones |
| Usuario final | `docs/COLLABORATOR_FEATURES.md` | Guía completa del Portal del Colaborador | UX, Soporte, Colaboradores |
| QA & Datos | `docs/TEST_DATA.md` | Usuarios de prueba, cursos demo y escenarios | QA, Dev |
| Soporte | `docs/TROUBLESHOOTING.md` | Problemas frecuentes y soluciones técnicas | Soporte, Dev |
| Gestión | `docs/DOCUMENTATION_MANAGEMENT.md` | Checklist, responsabilidades y métricas de documentación | Tech Lead, PM |

---
## 🧭 Navegación sugerida por perfil

- **Desarrollador/a:** `docs/MODULES.md` → `docs/API_REFERENCE.md` → `docs/IMPLEMENTATION_NOTES.md` → `docs/TROUBLESHOOTING.md`
- **Backend / Integraciones:** `docs/API_REFERENCE.md` → `docs/IMPLEMENTATION_NOTES.md` → `docs/MODULE_F_STATUS.md`
- **Product Manager / Stakeholder:** `README.md` → `docs/MODULES.md` → `docs/COLLABORATOR_FEATURES.md` → `CHANGELOG.md`
- **QA / Tester:** `docs/TEST_DATA.md` → `docs/COLLABORATOR_FEATURES.md` → `docs/TROUBLESHOOTING.md`
- **Soporte / Mesa de ayuda:** `docs/COLLABORATOR_FEATURES.md` → `docs/TROUBLESHOOTING.md` → `docs/DOCUMENTATION_MANAGEMENT.md`
- **Tech Lead / Arquitectura:** `docs/IMPLEMENTATION_NOTES.md` → `docs/MODULES.md` → `docs/DOCUMENTATION_MANAGEMENT.md` → `docs/API_REFERENCE.md`

---
## 🧾 Documentos clave

- **Core (actualizar en cada release):** `README.md`, `CHANGELOG.md`, `docs/MODULES.md`, `docs/API_REFERENCE.md`.
- **Soporte funcional:** `docs/IMPLEMENTATION_NOTES.md`, `docs/MODULE_*_STATUS.md`, `docs/COLLABORATOR_FEATURES.md`.
- **Operación y QA:** `docs/TEST_DATA.md`, `docs/TROUBLESHOOTING.md`.
- **Mantenimiento documental:** `docs/DOCUMENTATION_MANAGEMENT.md`.

Mantén al menos 80 % de estos archivos alineados con el estado actual del producto.

---
## 🛠️ Herramientas útiles

- `check-docs.sh` – Lista los archivos esperados y advierte si queda documentación fuera de `docs/`.
- `pnpm build` – Ejecuta tras cambios relevantes para confirmar que la compilación sigue correcta.

---
## 🕒 Historial reciente

- **17 de octubre de 2025:** Reorganización total de la documentación; migración completa a `docs/`; creación de `docs/COLLABORATOR_FEATURES.md` y `docs/DOCUMENTATION_MANAGEMENT.md`; actualización de `README.md` y `CHANGELOG.md`.

Para más detalles revisa la sección "Historial de Reorganizaciones" en `docs/DOCUMENTATION_MANAGEMENT.md`.

---
## 📮 Contacto

Canal interno: `#dmh-docs` (Slack)  
Correo: `support@ssoma-dmh.local`
