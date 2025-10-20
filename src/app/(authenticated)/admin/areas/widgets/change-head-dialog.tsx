"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { UserCog, Loader2, User } from "lucide-react"

type Area = { id: string; name: string }
type CollabOption = { id: string; fullName: string; dni: string }

export function ChangeHeadDialog({ area }: { area: Area }) {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")
  const [options, setOptions] = React.useState<CollabOption[]>([])
  const [selected, setSelected] = React.useState<string>("")
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [msg, setMsg] = React.useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Debounced search
  React.useEffect(() => {
    if (!open) return
    const id = setTimeout(async () => {
      if (!q) { setOptions([]); return }
      setLoading(true); setMsg(null)
      const res = await fetch(`/api/collaborators?page=1&pageSize=20&q=${encodeURIComponent(q)}`, { cache: "no-store" })
      setLoading(false)
      if (!res.ok) { setMsg({ type: "err", text: "Error al buscar" }); return }
      const json = await res.json()
      setOptions(json.items)
    }, 350)
    return () => clearTimeout(id)
  }, [q, open])

  async function submit() {
    if (!selected) return
    setSaving(true); setMsg(null)
    const res = await fetch(`/api/areas/${area.id}/head`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collaboratorId: selected }),
    })
    setSaving(false)
    if (res.ok) {
      setMsg({ type: "ok", text: "Jefe asignado" })
      setTimeout(() => setOpen(false), 450)
    } else {
      setMsg({ type: "err", text: "No se pudo asignar" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" title="Cambiar jefe">
          <UserCog className="size-4" /> Jefe
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Asignar jefe a {area.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Input
              placeholder="Buscar colaborador por nombre, DNI o email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Buscar colaborador"
            />
            {loading && <Loader2 className="size-4 animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />}
          </div>

          <div className="max-h-64 overflow-auto rounded border">
            {options.length === 0 && !loading && q ? (
              <div className="p-4 text-sm text-muted-foreground">Sin resultados para “{q}”.</div>
            ) : options.length === 0 && !q ? (
              <div className="p-4 text-sm text-muted-foreground">Escribe para buscar colaboradores…</div>
            ) : (
              options.map((o) => (
                <label key={o.id} className="flex items-center gap-3 p-2 border-b cursor-pointer hover:bg-accent/40">
                  <input
                    type="radio"
                    name="head"
                    value={o.id}
                    checked={selected === o.id}
                    onChange={() => setSelected(o.id)}
                    aria-label={`Seleccionar ${o.fullName}`}
                  />
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-full bg-muted grid place-items-center">
                      <User className="size-4 text-muted-foreground" />
                    </div>
                    <div className="text-sm leading-tight">
                      <div className="font-medium">{o.fullName}</div>
                      <div className="text-xs text-muted-foreground">{o.dni}</div>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>

          {msg && (
            <div className={`text-xs ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{msg.text}</div>
          )}

          <Button onClick={submit} className="w-full" disabled={!selected || saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
