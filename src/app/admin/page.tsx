import { auth } from "@/auth";

export default async function AdminPage() {
  const session = await auth();
  return (
    <div className="p-6 space-y-2">
      <h1 className="text-2xl font-bold">Panel de Administración</h1>
      <p className="text-sm text-muted-foreground">Hola {session?.user?.email}. Gestiona colaboradores, áreas y puestos.</p>
    </div>
  )
}
