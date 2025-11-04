import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CertificateStats } from "./types"

interface CertificateStatsCardsProps {
  stats: CertificateStats
}

export function CertificateStatsCards({ stats }: CertificateStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{stats.total}</div>
          <p className="text-xs text-muted-foreground mt-1">Certificados emitidos</p>
        </CardContent>
      </Card>

      <Card className="border-emerald-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Válidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-emerald-600">{stats.valid}</div>
          <p className="text-xs text-muted-foreground mt-1">En vigencia</p>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Inválidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-red-600">{stats.invalid}</div>
          <p className="text-xs text-muted-foreground mt-1">Revocados o expirados</p>
        </CardContent>
      </Card>

      <Card className="border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Por Vencer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-amber-600">{stats.expiring}</div>
          <p className="text-xs text-muted-foreground mt-1">Próximos 30 días</p>
        </CardContent>
      </Card>
    </div>
  )
}
