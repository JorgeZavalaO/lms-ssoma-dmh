import { describe, expect, it } from "vitest"
import {
  CLEAN_TEST_DATA_CONFIRMATION,
  getDestructiveMaintenanceStatus,
  isDestructiveMaintenanceEnabled,
  isEmailDeliveryEnabled,
  isValidDangerousConfirmation,
} from "../../src/lib/operational-safety"

describe("operational safety helpers", () => {
  it("blocks destructive maintenance in production-like environments", () => {
    expect(
      isDestructiveMaintenanceEnabled({
        NODE_ENV: "production",
        ALLOW_SUPERADMIN_DESTRUCTIVE_ACTIONS: "true",
      } as NodeJS.ProcessEnv)
    ).toBe(false)
  })

  it("allows destructive maintenance only with explicit flag in non-production", () => {
    const status = getDestructiveMaintenanceStatus({
      APP_ENV: "staging",
      ALLOW_SUPERADMIN_DESTRUCTIVE_ACTIONS: "true",
    } as NodeJS.ProcessEnv)

    expect(status.enabled).toBe(true)
    expect(status.stage).toBe("staging")
  })

  it("validates the destructive confirmation phrase strictly", () => {
    expect(isValidDangerousConfirmation(CLEAN_TEST_DATA_CONFIRMATION)).toBe(true)
    expect(isValidDangerousConfirmation("ELIMINAR")).toBe(false)
  })

  it("keeps email delivery disabled by default until a provider is configured", () => {
    expect(isEmailDeliveryEnabled({} as NodeJS.ProcessEnv)).toBe(false)
    expect(
      isEmailDeliveryEnabled({
        EMAIL_NOTIFICATIONS_ENABLED: "true",
      } as NodeJS.ProcessEnv)
    ).toBe(true)
  })
})
