import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Certification } from "./types"

interface RecertifyCertificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  certification: Certification | null
  onConfirm: () => void
  processing: boolean
}

export function RecertifyCertificationDialog({
  open,
  onOpenChange,
  certification,
  onConfirm,
  processing,
}: RecertifyCertificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recertificar</DialogTitle>
          <DialogDescription>
            Se generará una nueva certificación para {certification?.collaborator.firstName}{" "}
            {certification?.collaborator.lastName} en el curso {certification?.course.name}.
            {certification?.course.validityMonths && (
              <span className="mt-2 block">
                La nueva certificación será válida por {certification.course.validityMonths} meses.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={processing}>
            {processing ? "Procesando..." : "Confirmar Recertificación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
