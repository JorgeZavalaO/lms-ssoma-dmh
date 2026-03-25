import { describe, expect, it } from "vitest"
import { GenerateExpirationRemindersSchema } from "../../src/validations/notifications"

describe("Module I - Notification validations", () => {
  it("allows inferring notification type from the day window", () => {
    const result = GenerateExpirationRemindersSchema.safeParse({
      daysBeforeExpiration: 7,
      sendEmail: true,
      sendInApp: false,
    })

    expect(result.success).toBe(true)
  })

  it("rejects reminder generation with all channels disabled", () => {
    const result = GenerateExpirationRemindersSchema.safeParse({
      daysBeforeExpiration: 7,
      sendEmail: false,
      sendInApp: false,
    })

    expect(result.success).toBe(false)
  })
})
