import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Certification } from "./types"

interface RevokeCertificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  certification: Certification | null
  reason: string
  onReasonChange: (reason: string) => void
  onConfirm: () => void
  processing: boolean
}

export function RevokeCertificationDialog({
  open,
  onOpenChange,
  certification,
  reason,
  onReasonChange,
  onConfirm,
  processing,
}: RevokeCertificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revocar Certificación</DialogTitle>
          <DialogDescription>
            Esta acción revocará permanentemente la certificación de {certification?.collaborator.firstName}{" "}
            {certification?.collaborator.lastName} para el curso {certification?.course.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="revocation-reason">Motivo de Revocación *</Label>
            <Textarea
              id="revocation-reason"
              placeholder="Describe el motivo por el cual se revoca esta certificación..."
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={processing || reason.trim().length === 0}>
            {processing ? "Revocando..." : "Revocar Certificación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
