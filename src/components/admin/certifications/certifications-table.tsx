import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Award, RefreshCw, RotateCcw, Search, XCircle } from "lucide-react"
import { differenceInDays, format } from "date-fns"
import { es } from "date-fns/locale"
import type {
  Certification,
  CertificationStatus,
  CertificationStatusFilter,
} from "./types"
import { certificationStatusConfig } from "./types"

interface CertificationsTableProps {
  certifications: Certification[]
  filteredCertifications: Certification[]
  loading: boolean
  searchTerm: string
  onSearchTermChange: (term: string) => void
  statusFilter: CertificationStatusFilter
  onStatusFilterChange: (value: CertificationStatusFilter) => void
  getCertificationStatus: (certification: Certification) => CertificationStatus
  onRequestRecertify: (certification: Certification) => void
  onRequestRevoke: (certification: Certification) => void
}

export function CertificationsTable({
  certifications,
  filteredCertifications,
  loading,
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  getCertificationStatus,
  onRequestRecertify,
  onRequestRevoke,
}: CertificationsTableProps) {
  const hasCertifications = certifications.length > 0
  const hasFiltersApplied = searchTerm.trim().length > 0 || statusFilter !== "all"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Certificaciones</CardTitle>
        <CardDescription>Historial completo de certificados emitidos, vencidos y recertificados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por colaborador, email o curso..."
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as CertificationStatusFilter)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="valid">Vigente</SelectItem>
              <SelectItem value="expiring">Por Vencer</SelectItem>
              <SelectItem value="expired">Vencida</SelectItem>
              <SelectItem value="revoked">Revocada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Emisión</TableHead>
                <TableHead>Fecha Vencimiento</TableHead>
                <TableHead>Días Restantes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
                    <p className="text-sm text-muted-foreground">Cargando certificaciones...</p>
                  </TableCell>
                </TableRow>
              ) : filteredCertifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    <Award className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {hasCertifications && hasFiltersApplied
                        ? "No se encontraron certificaciones con los filtros aplicados"
                        : "No hay certificaciones emitidas todavía"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCertifications.map((certification) => {
                  const status = getCertificationStatus(certification)
                  const config = certificationStatusConfig[status]
                  const daysRemaining = certification.expiresAt
                    ? differenceInDays(new Date(certification.expiresAt), new Date())
                    : null

                  return (
                    <TableRow key={certification.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {certification.collaborator.firstName} {certification.collaborator.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">{certification.collaborator.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{certification.course.name}</div>
                          <div className="text-xs text-muted-foreground">{certification.course.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={config.badge}>
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(certification.issuedAt), "dd/MM/yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        {certification.expiresAt ? (
                          format(new Date(certification.expiresAt), "dd/MM/yyyy", { locale: es })
                        ) : (
                          <span className="text-muted-foreground">Sin vencimiento</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {daysRemaining !== null ? (
                          <span
                            className={
                              daysRemaining < 0
                                ? "font-medium text-red-600"
                                : daysRemaining <= 30
                                ? "font-medium text-yellow-600"
                                : ""
                            }
                          >
                            {daysRemaining < 0
                              ? `Vencida hace ${Math.abs(daysRemaining)} días`
                              : `${daysRemaining} días`}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!certification.revokedAt && (
                            <>
                              {status === "expired" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onRequestRecertify(certification)}
                                >
                                  <RotateCcw className="mr-1 h-4 w-4" />
                                  Recertificar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onRequestRevoke(certification)}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Revocar
                              </Button>
                            </>
                          )}
                          {certification.revokedAt && (
                            <span className="text-xs text-muted-foreground">
                              Revocada el {format(new Date(certification.revokedAt), "dd/MM/yyyy", { locale: es })}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
