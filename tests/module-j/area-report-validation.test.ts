import { describe, expect, it } from "vitest";
import { AreaReportFiltersSchema } from "../../src/validations/reports";

describe("Module J - Area report validations", () => {
  it("acepta collaboratorId como filtro de usuario", () => {
    const result = AreaReportFiltersSchema.safeParse({
      collaboratorId: "collab-123",
      areaId: "area-1",
      status: "PASSED",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collaboratorId).toBe("collab-123");
      expect(result.data.areaId).toBe("area-1");
    }
  });

  it("mantiene compatibilidad sin collaboratorId", () => {
    const result = AreaReportFiltersSchema.safeParse({
      areaId: "area-1",
      siteId: "site-1",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collaboratorId).toBeUndefined();
    }
  });
});
