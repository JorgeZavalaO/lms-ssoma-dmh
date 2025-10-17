"use client"

import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export function AppFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Información de la empresa */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">LMS SSOMA DMH</h3>
            <p className="text-sm text-muted-foreground">
              Sistema de Gestión de Aprendizaje para Seguridad, Salud Ocupacional y Medio Ambiente.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                  Administración
                </Link>
              </li>
              <li>
                <Link href="/admin/collaborators" className="text-muted-foreground hover:text-foreground transition-colors">
                  Colaboradores
                </Link>
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Recursos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Documentación
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Soporte
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Ayuda
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Contacto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Email: soporte@dmh.com</li>
              <li>Tel: +51 XXX XXX XXX</li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Copyright */}
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <p>© {currentYear} DMH. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground transition-colors">
              Términos de Servicio
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
