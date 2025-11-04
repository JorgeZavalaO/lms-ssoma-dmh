"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, CheckCircle2, AlertCircle } from "lucide-react"

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
      setMsg({ type: "ok", text: "Rol actualizado exitosamente" })
      onChanged?.()
      setTimeout(() => setOpen(false), 400)
    } else {
      setMsg({ type: "err", text: "No se pudo actualizar el rol" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          disabled={disabled} 
          title={disabled ? "No tiene usuario vinculado" : "Cambiar rol"}
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Rol</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Cambiar Rol
          </DialogTitle>
        </DialogHeader>

        {disabled ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-600">
                El colaborador no tiene usuario vinculado. Vincula un usuario para cambiar el rol.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">Colaborador</label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-900 font-medium">{collaborator.fullName}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">Nuevo Rol</label>
              <Select value={role} onValueChange={(v: Role) => setRole(v)}>
                <SelectTrigger className="border-slate-200 focus:border-emerald-500">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COLLABORATOR">
                    <span className="font-medium">COLLABORATOR</span>
                    <span className="text-xs text-slate-500 ml-2">Usuario estándar</span>
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    <span className="font-medium">ADMIN</span>
                    <span className="text-xs text-slate-500 ml-2">Administrador</span>
                  </SelectItem>
                  <SelectItem value="SUPERADMIN">
                    <span className="font-medium">SUPERADMIN</span>
                    <span className="text-xs text-slate-500 ml-2">Administrador supremo</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {msg && (
              <div className={`flex items-start gap-3 p-3 rounded-lg ${
                msg.type === "ok" 
                  ? "bg-emerald-50 border border-emerald-200" 
                  : "bg-red-50 border border-red-200"
              }`}>
                {msg.type === "ok" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <span className={`text-sm font-medium ${
                  msg.type === "ok" ? "text-emerald-700" : "text-red-700"
                }`}>
                  {msg.text}
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={submit} 
            disabled={loading || !role || disabled}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />}
            {loading ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
