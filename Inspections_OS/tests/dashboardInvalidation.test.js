import { describe, expect, it, vi } from "vitest";
import {
  getIssueMutationInvalidationKeys,
  getRunExportInvalidationKeys,
  invalidateIssueMutationContracts,
  invalidateRunExportContracts,
} from "@/lib/dashboardInvalidation";
import { queryKeys } from "@/lib/queryKeys";

describe("dashboard invalidation utility", () => {
  it("returns issue mutation invalidation keys with scoped vault slots", () => {
    const keys = getIssueMutationInvalidationKeys("proj_123");
    expect(keys).toEqual([
      queryKeys.issues(),
      queryKeys.dashboardProject(),
      queryKeys.dashboardCompliance(),
      queryKeys.vaultSlots("proj_123"),
    ]);
  });

  it("returns run/export invalidation keys for all dashboard contracts", () => {
    const keys = getRunExportInvalidationKeys();
    expect(keys).toEqual([
      queryKeys.runs(),
      queryKeys.exports(),
      queryKeys.manifests(),
      queryKeys.dashboardPortfolio(),
      queryKeys.dashboardProject(),
      queryKeys.dashboardOps(),
      queryKeys.dashboardCompliance(),
      queryKeys.dashboardExportCenter(),
    ]);
  });

  it("invalidates issue mutation keys through query client", async () => {
    const invalidateQueries = vi.fn(() => Promise.resolve());
    const queryClient = { invalidateQueries };

    await invalidateIssueMutationContracts(queryClient, "proj_123");

    expect(invalidateQueries).toHaveBeenCalledTimes(4);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.issues() });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboardCompliance(),
    });
  });

  it("invalidates run/export keys through query client", async () => {
    const invalidateQueries = vi.fn(() => Promise.resolve());
    const queryClient = { invalidateQueries };

    await invalidateRunExportContracts(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(8);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboardExportCenter(),
    });
  });
});
