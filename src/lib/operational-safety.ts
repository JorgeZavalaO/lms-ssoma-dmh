const PRODUCTION_STAGES = new Set(["production", "prod"])
const NON_PRODUCTION_STAGES = new Set([
  "development",
  "dev",
  "test",
  "testing",
  "staging",
  "stage",
  "preview",
])

export const CLEAN_TEST_DATA_CONFIRMATION = "ELIMINAR TODO EL SISTEMA"

function normalizeStage(value?: string | null) {
  return value?.trim().toLowerCase() || null
}

export function resolveRuntimeStage(env: NodeJS.ProcessEnv = process.env) {
  return (
    normalizeStage(env.APP_ENV) ??
    normalizeStage(env.VERCEL_ENV) ??
    normalizeStage(env.NODE_ENV) ??
    "development"
  )
}

export function isProductionRuntime(env: NodeJS.ProcessEnv = process.env) {
  const stage = resolveRuntimeStage(env)
  if (NON_PRODUCTION_STAGES.has(stage)) return false
  return PRODUCTION_STAGES.has(stage)
}

export function isDestructiveMaintenanceEnabled(
  env: NodeJS.ProcessEnv = process.env
) {
  return (
    env.ALLOW_SUPERADMIN_DESTRUCTIVE_ACTIONS === "true" &&
    !isProductionRuntime(env)
  )
}

export function getDestructiveMaintenanceStatus(
  env: NodeJS.ProcessEnv = process.env
) {
  const stage = resolveRuntimeStage(env)
  const enabled = isDestructiveMaintenanceEnabled(env)

  if (enabled) {
    return {
      enabled: true,
      stage,
      reason: null,
    }
  }

  const reason = isProductionRuntime(env)
    ? "Las acciones destructivas estan bloqueadas en entornos de produccion."
    : "Habilita ALLOW_SUPERADMIN_DESTRUCTIVE_ACTIONS=true para permitir esta herramienta."

  return {
    enabled: false,
    stage,
    reason,
  }
}

export function isValidDangerousConfirmation(input?: string | null) {
  return (input ?? "").trim() === CLEAN_TEST_DATA_CONFIRMATION
}

export function isEmailDeliveryEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.EMAIL_NOTIFICATIONS_ENABLED === "true"
}
