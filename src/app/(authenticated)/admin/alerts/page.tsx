import { ClientAlerts } from "./client-alerts"

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string }>
}) {
  const params = await searchParams

  return (
    <div className="p-6 space-y-4">
      <ClientAlerts initialSeverity={params.severity || "all"} />
    </div>
    
  )
}
