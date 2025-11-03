"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  BookOpen,
  CheckCircle2,
  Award,
  TrendingUp,
  Shield,
  Zap,
  Users,
  ArrowRight,
} from "lucide-react"

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirigir al dashboard si ya está autenticado
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  // Mostrar loading mientras verifica la sesión
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (status === "authenticated") {
    return null // Ya está redirigiendo
  }
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-muted/50">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-6xl mx-auto h-16 flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
              <Shield className="size-4" />
            </div>
            <span>SSOMA DMH</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">
              Características
            </a>
            <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground">
              Beneficios
            </a>
            <a href="#cta" className="text-sm text-muted-foreground hover:text-foreground">
              Contacto
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Ingresar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container max-w-6xl mx-auto px-6 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Plataforma Integral de{" "}
                  <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Formación y Cumplimiento SSOMA
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Gestiona, capacita y certifica a tu equipo en seguridad, salud ocupacional y medio
                  ambiente. Garantiza el cumplimiento normativo con precisión.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button size="lg" className="gap-2">
                    Iniciar Sesión <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg">
                    Conocer más
                  </Button>
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm text-muted-foreground">Acceso 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm text-muted-foreground">Trazabilidad completa</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm text-muted-foreground">Certificados automáticos</span>
                </div>
              </div>
            </div>

            <div className="relative h-96 md:h-full bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=600&fit=crop"
                alt="Seguridad y cumplimiento"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-y border-border py-20 md:py-28 bg-muted/30">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Características principales</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Una suite completa de herramientas para gestionar tu programa de formación SSOMA
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: BookOpen,
                  title: "Cursos en línea",
                  description: "Plataforma e-learning con contenido interactivo y personalizable",
                },
                {
                  icon: Award,
                  title: "Certificación digital",
                  description: "Genera certificados verificables con QR y códigos únicos",
                },
                {
                  icon: TrendingUp,
                  title: "Reportes avanzados",
                  description: "Analítica completa de avance, cumplimiento y alertas",
                },
                {
                  icon: Shield,
                  title: "Control de acceso",
                  description: "Autenticación segura con roles y permisos granulares",
                },
                {
                  icon: Zap,
                  title: "Alertas automáticas",
                  description: "Notificaciones de vencimiento y recordatorios inteligentes",
                },
                {
                  icon: Users,
                  title: "Gestión de equipos",
                  description: "Administra colaboradores, áreas, puestos y sitios",
                },
              ].map((feature, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-6 space-y-3 hover:shadow-lg transition">
                  <feature.icon className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-20 md:py-28">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Por qué elegirnos?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Confían en nosotros empresas líderes en seguridad ocupacional
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                {[
                  { title: "Cumplimiento normativo", desc: "Alineado con estándares SSOMA y legislación vigente" },
                  { title: "Escalable", desc: "Desde pequeños equipos hasta organizaciones multinacionales" },
                  { title: "Soporte 24/7", desc: "Equipo técnico disponible para asistencia" },
                  { title: "Integración fácil", desc: "Conecta con tus sistemas existentes" },
                ].map((benefit, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-primary mt-0.5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{benefit.title}</h4>
                      <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=600&fit=crop"
                  alt="Beneficios"
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="border-t border-border py-20 md:py-28 bg-muted/30">
          <div className="container max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para transformar tu programa SSOMA?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Comienza hoy con acceso a todas las características. Sin tarjeta de crédito requerida.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  Ingresar a la plataforma <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="mailto:support@ssoma-dmh.local">
                <Button variant="outline" size="lg">
                  Contactar soporte
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 py-12">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Características</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Acerca de</a></li>
                <li><a href="#" className="hover:text-foreground">Contacto</a></li>
                <li><a href="#" className="hover:text-foreground">Carreras</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacidad</a></li>
                <li><a href="#" className="hover:text-foreground">Términos</a></li>
                <li><a href="#" className="hover:text-foreground">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <p className="text-sm text-muted-foreground">
                Email: support@ssoma-dmh.local<br />
                Slack: #dmh-docs
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex items-center justify-between text-sm text-muted-foreground">
            <p>&copy; 2025 SSOMA DMH. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-foreground">Twitter</a>
              <a href="#" className="hover:text-foreground">LinkedIn</a>
              <a href="#" className="hover:text-foreground">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
