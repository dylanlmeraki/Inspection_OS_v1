import { getPortfolioDashboardQuery as getPortfolioDashboardQueryImpl } from "@/lib/dashboardQueries/portfolioDashboardQuery";
import { getProjectDashboardQuery as getProjectDashboardQueryImpl } from "@/lib/dashboardQueries/projectDashboardQuery";
import { getInspectionOpsDashboardQuery as getInspectionOpsDashboardQueryImpl } from "@/lib/dashboardQueries/inspectionOpsDashboardQuery";
import { getComplianceDashboardQuery as getComplianceDashboardQueryImpl } from "@/lib/dashboardQueries/complianceDashboardQuery";
import { getExportCenterDashboardQuery as getExportCenterDashboardQueryImpl } from "@/lib/dashboardQueries/exportCenterDashboardQuery";
import { getSourceFreshnessDashboardQuery as getSourceFreshnessDashboardQueryImpl } from "@/lib/dashboardQueries/sourceFreshnessDashboardQuery";

/**
 * @returns {import("@/contracts/types").PortfolioDashboardEnvelope}
 */
export function getPortfolioDashboardQuery() {
  return getPortfolioDashboardQueryImpl();
}

/**
 * @returns {import("@/contracts/types").ProjectDashboardEnvelope}
 */
export function getProjectDashboardQuery() {
  return getProjectDashboardQueryImpl();
}

/**
 * @returns {import("@/contracts/types").InspectionOpsDashboardEnvelope}
 */
export function getInspectionOpsDashboardQuery() {
  return getInspectionOpsDashboardQueryImpl();
}

/**
 * @returns {import("@/contracts/types").ComplianceDashboardEnvelope}
 */
export function getComplianceDashboardQuery() {
  return getComplianceDashboardQueryImpl();
}

/**
 * @returns {import("@/contracts/types").ExportCenterQueryEnvelope}
 */
export function getExportCenterQuery() {
  return getExportCenterDashboardQueryImpl();
}

/**
 * @returns {import("@/contracts/types").SourceFreshnessQueryEnvelope}
 */
export function getSourceFreshnessQuery() {
  return getSourceFreshnessDashboardQueryImpl();
}
