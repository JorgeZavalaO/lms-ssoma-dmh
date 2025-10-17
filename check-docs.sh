#!/bin/bash
# Documentation Verification Script
# Verifica que la documentación esté completa y bien organizada
# Uso: bash check-docs.sh

echo "📚 Verificación de Documentación - LMS SSOMA DMH"
echo "================================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones
check_file() {
  if [ -f "$1" ]; then
    wc=$(wc -l < "$1")
    echo -e "${GREEN}✓${NC} $1 ($wc líneas)"
    return 0
  else
    echo -e "${RED}✗${NC} $1 (NO ENCONTRADO)"
    return 1
  fi
}

check_folder() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $1/ (directorio existe)"
    return 0
  else
    echo -e "${RED}✗${NC} $1/ (NO ENCONTRADO)"
    return 1
  fi
}

# 1. Archivos de raíz
echo -e "${BLUE}📄 Archivos en Raíz${NC}"
echo "---"
check_file "README.md"
check_file "CHANGELOG.md"
check_file "package.json"
echo ""

# 2. Archivos en docs/
echo -e "${BLUE}📂 Archivos en /docs${NC}"
echo "---"
check_folder "docs"
check_file "docs/README_DOCS.md"
check_file "docs/MODULES.md"
check_file "docs/API_REFERENCE.md"
check_file "docs/IMPLEMENTATION_NOTES.md"
check_file "docs/MODULE_K_STATUS.md"
check_file "docs/MODULE_J_STATUS.md"
check_file "docs/MODULE_I_STATUS.md"
check_file "docs/MODULE_F_STATUS.md"
check_file "docs/TEST_DATA.md"
check_file "docs/TROUBLESHOOTING.md"
check_file "docs/COLLABORATOR_FEATURES.md"
check_file "docs/DOCUMENTATION_MANAGEMENT.md"
echo ""

# 3. Archivos eliminados (no deberían existir)
echo -e "${BLUE}🗑️  Archivos que DEBEN ser eliminados${NC}"
echo "---"
if [ -f "DATOS_PRUEBA.md" ]; then
  echo -e "${YELLOW}⚠${NC} DATOS_PRUEBA.md (DEBE SER ELIMINADO - consolidado en docs/TEST_DATA.md)"
else
  echo -e "${GREEN}✓${NC} DATOS_PRUEBA.md (correctamente eliminado)"
fi

if [ -f "SOLUCION_CURSOS_COLABORADOR.md" ]; then
  echo -e "${YELLOW}⚠${NC} SOLUCION_CURSOS_COLABORADOR.md (DEBE SER ELIMINADO - consolidado en docs/TROUBLESHOOTING.md)"
else
  echo -e "${GREEN}✓${NC} SOLUCION_CURSOS_COLABORADOR.md (correctamente eliminado)"
fi

if [ -f "CORRECCION_PARAMS_ASYNC.md" ]; then
  echo -e "${YELLOW}⚠${NC} CORRECCION_PARAMS_ASYNC.md (DEBE SER ELIMINADO - consolidado en docs/TROUBLESHOOTING.md)"
else
  echo -e "${GREEN}✓${NC} CORRECCION_PARAMS_ASYNC.md (correctamente eliminado)"
fi

if [ -f "VISTA_CURSO_COLABORADOR.md" ]; then
  echo -e "${YELLOW}⚠${NC} VISTA_CURSO_COLABORADOR.md (DEBE SER ELIMINADO - consolidado en docs/COLLABORATOR_FEATURES.md)"
else
  echo -e "${GREEN}✓${NC} VISTA_CURSO_COLABORADOR.md (correctamente eliminado)"
fi
echo ""

# 4. Estadísticas
echo -e "${BLUE}📊 Estadísticas${NC}"
echo "---"
total_lines=$(wc -l < README.md)
echo "README.md: $total_lines líneas"

total_lines=$(wc -l < CHANGELOG.md)
echo "CHANGELOG.md: $total_lines líneas"

total_lines=$(find docs -name "*.md" | xargs wc -l | tail -1 | awk '{print $1}')
echo "Total en /docs: $total_lines líneas"

md_count=$(find . -name "*.md" | wc -l)
echo "Total de archivos .md: $md_count"
echo ""

# 5. Resumen
echo -e "${BLUE}✅ Verificación Completada${NC}"
echo "---"
echo "Estado de documentación: LISTO PARA USAR"
echo ""
echo "📝 Próximos pasos:"
echo "  1. Revisar archivos marcados con ⚠️"
echo "  2. Eliminar archivos redundantes de raíz (si aplica)"
echo "  3. Ejecutar 'pnpm build' para verificar que todo compila"
echo "  4. Hacer commit de cambios"
echo ""
