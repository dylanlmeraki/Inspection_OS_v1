import { beforeEach, describe, expect, it } from "vitest";
import {
  dashboardContractIds,
  parseComplianceDashboardEnvelope,
  parseExportCenterDashboardEnvelope,
  parseInspectionOpsDashboardEnvelope,
  parsePortfolioDashboardEnvelope,
  parseProjectDashboardEnvelope,
  parseSourceFreshnessDashboardEnvelope,
} from "@/lib/dashboardContracts";
import {
  getComplianceDashboardQuery,
  getExportCenterQuery,
  getInspectionOpsDashboardQuery,
  getPortfolioDashboardQuery,
  getProjectDashboardQuery,
  getSourceFreshnessQuery,
} from "@/lib/dashboardQueries";
import { localDb } from "@/lib/localDb";

describe("dashboard query contracts", () => {
  beforeEach(() => {
    localDb.resetForTests();
  });

  it("returns stable project, ops, compliance, export, and source contract shapes", () => {
    const portfolioDashboard = getPortfolioDashboardQuery();
    const projectDashboard = getProjectDashboardQuery();
    const opsDashboard = getInspectionOpsDashboardQuery();
    const complianceDashboard = getComplianceDashboardQuery();
    const exportCenter = getExportCenterQuery();
    const sourceFreshness = getSourceFreshnessQuery();

    expect(parsePortfolioDashboardEnvelope(portfolioDashboard).contract).toBe(
      dashboardContractIds.portfolio
    );
    expect(parseProjectDashboardEnvelope(projectDashboard).contract).toBe(
      dashboardContractIds.project
    );
    expect(parseInspectionOpsDashboardEnvelope(opsDashboard).contract).toBe(
      dashboardContractIds.inspectionOps
    );
    expect(parseComplianceDashboardEnvelope(complianceDashboard).contract).toBe(
      dashboardContractIds.compliance
    );
    expect(parseExportCenterDashboardEnvelope(exportCenter).contract).toBe(
      dashboardContractIds.exportCenter
    );
    expect(parseSourceFreshnessDashboardEnvelope(sourceFreshness).contract).toBe(
      dashboardContractIds.sourceFreshness
    );
    expect(sourceFreshness.payload.summary.stale).toBe(1);
  });
});
