import { describe, expect, it } from "vitest"
import { UserReportFiltersSchema } from "../../src/validations/reports"

describe("Module J - User report validations", () => {
  it("aplica paginación por defecto", () => {
    const result = UserReportFiltersSchema.safeParse({
      q: "ana",
      status: "PASSED",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(20)
    }
  })

  it("coacciona page y pageSize desde query params", () => {
    const result = UserReportFiltersSchema.safeParse({
      page: "2",
      pageSize: "50",
      startDate: "2026-05-01",
      endDate: "2026-05-14",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it("rechaza estados no soportados", () => {
    const result = UserReportFiltersSchema.safeParse({
      status: "COMPLETED",
    })

    expect(result.success).toBe(false)
  })

  it("rechaza fechas inválidas", () => {
    const result = UserReportFiltersSchema.safeParse({
      startDate: "no-es-fecha",
    })

    expect(result.success).toBe(false)
  })

  it("limita pageSize a 100", () => {
    const result = UserReportFiltersSchema.safeParse({
      pageSize: "101",
    })

    expect(result.success).toBe(false)
  })
})
