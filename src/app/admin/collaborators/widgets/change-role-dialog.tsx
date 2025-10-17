"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield } from "lucide-react"

type Role = "SUPERADMIN" | "ADMIN" | "COLLABORATOR"
type Row = { id: string; fullName: string; user?: { id: string, role: Role } | null }

export function ChangeRoleDialog({ collaborator, onChanged }: { collaborator: Row, onChanged?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [role, setRole] = React.useState<Role | "">(collaborator.user?.role ?? "")
  const [loading, setLoading] = React.useState(false)
  const [msg, setMsg] = React.useState<{ type: "ok" | "err"; text: string } | null>(null)
  const disabled = !collaborator.user?.id

  async function submit() {
    if (!collaborator.user?.id || !role) return
    setLoading(true); setMsg(null)
    const res = await fetch(`/api/users/${collaborator.user.id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    setLoading(false)
    if (res.ok) {
      setMsg({ type: "ok", text: "Rol actualizado" })
      onChanged?.()
      setTimeout(() => setOpen(false), 400)
    } else {
      setMsg({ type: "err", text: "No se pudo actualizar" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span>
          <Button size="sm" variant="outline" disabled={disabled} title={disabled ? "No tiene usuario vinculado" : "Cambiar rol"}>
            <Shield className="size-4" /> Rol
          </Button>
        </span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar rol</DialogTitle>
        </DialogHeader>

        {disabled ? (
          <div className="text-sm text-muted-foreground">El colaborador no tiene usuario vinculado.</div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm">Colaborador: <b>{collaborator.fullName}</b></div>
            <Select value={role} onValueChange={(v: Role) => setRole(v)}>
              <SelectTrigger aria-label="Selecciona un rol"><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="COLLABORATOR">COLLABORATOR</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
              </SelectContent>
            </Select>
            {msg && (
              <div className={`text-xs ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{msg.text}</div>
            )}
            <Button onClick={submit} className="w-full" disabled={loading || !role}>
              {loading ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
