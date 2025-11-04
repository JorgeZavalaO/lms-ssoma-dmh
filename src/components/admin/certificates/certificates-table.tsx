import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Download, Eye, FileText, RefreshCw, Search, XCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Certificate, CertificateValidityFilter } from "./types"

interface CertificatesTableProps {
  certificates: Certificate[]
  filteredCertificates: Certificate[]
  loading: boolean
  searchTerm: string
  onSearchTermChange: (term: string) => void
  validFilter: CertificateValidityFilter
  onValidFilterChange: (value: CertificateValidityFilter) => void
  onGenerate: (certificateId: string) => void
  onDownload: (certificateId: string) => void
  onVerify: (verificationCode: string) => void
  processing: boolean
}

export function CertificatesTable({
  certificates,
  filteredCertificates,
  loading,
  searchTerm,
  onSearchTermChange,
  validFilter,
  onValidFilterChange,
  onGenerate,
  onDownload,
  onVerify,
  processing,
}: CertificatesTableProps) {
  const hasCertificates = certificates.length > 0
  const hasFiltersApplied = searchTerm.trim().length > 0 || validFilter !== "all"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Certificados</CardTitle>
        <CardDescription>Administra los certificados emitidos a colaboradores</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por certificado, colaborador o curso..."
                  value={searchTerm}
                  onChange={(event) => onSearchTermChange(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={validFilter} onValueChange={(value) => onValidFilterChange(value as CertificateValidityFilter)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="valid">Válidos</SelectItem>
                <SelectItem value="invalid">Inválidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Certificado</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
                    <p className="text-sm text-muted-foreground">Cargando certificados...</p>
                  </TableCell>
                </TableRow>
              ) : filteredCertificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <FileText className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {hasCertificates && hasFiltersApplied
                        ? "No hay certificados con los filtros aplicados"
                        : "No hay certificados emitidos"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCertificates.map((certificate) => (
                  <TableRow key={certificate.id}>
                    <TableCell className="font-mono text-sm">{certificate.certificateNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{certificate.collaboratorName}</p>
                        <p className="text-xs text-muted-foreground">DNI: {certificate.collaboratorDni}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{certificate.courseName}</TableCell>
                    <TableCell>
                      {format(new Date(certificate.issuedAt), "dd/MM/yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={certificate.isValid ? "default" : "destructive"}
                        className={certificate.isValid ? "bg-emerald-600" : ""}
                      >
                        {certificate.isValid ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Válido
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Inválido
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!certificate.verificationCode && (
                          <Button
                            size="sm"
                            onClick={() => onGenerate(certificate.id)}
                            variant="ghost"
                            disabled={processing}
                            title="Generar certificado"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        {certificate.verificationCode && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => onDownload(certificate.id)}
                              variant="ghost"
                              disabled={processing}
                              title="Descargar PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => onVerify(certificate.verificationCode!)}
                              variant="ghost"
                              disabled={processing}
                              title="Verificar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
