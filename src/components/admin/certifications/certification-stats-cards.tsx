import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CertificationStats } from "./types"

interface CertificationStatsCardsProps {
  stats: CertificationStats
}

export function CertificationStatsCards({ stats }: CertificationStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="border-emerald-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Vigentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-emerald-600">{stats.valid}</div>
          <p className="text-xs text-muted-foreground mt-1">Válidas actualmente</p>
        </CardContent>
      </Card>

      <Card className="border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Por Vencer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-amber-600">{stats.expiringSoon}</div>
          <p className="text-xs text-muted-foreground mt-1">En 30 días</p>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Vencidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-red-600">{stats.expired}</div>
          <p className="text-xs text-muted-foreground mt-1">Requieren recertificación</p>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Revocadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-slate-600">{stats.revoked}</div>
          <p className="text-xs text-muted-foreground mt-1">Certificados anulados</p>
        </CardContent>
      </Card>
    </div>
  )
}
