import { useQuery } from "@tanstack/react-query";
import {
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
import { queryKeys } from "@/lib/queryKeys";

export function usePortfolioDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardPortfolio(),
    queryFn: () => parsePortfolioDashboardEnvelope(getPortfolioDashboardQuery()),
  });
}

export function useProjectDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardProject(),
    queryFn: () => parseProjectDashboardEnvelope(getProjectDashboardQuery()),
  });
}

export function useInspectionOpsDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardOps(),
    queryFn: () => parseInspectionOpsDashboardEnvelope(getInspectionOpsDashboardQuery()),
  });
}

export function useComplianceDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardCompliance(),
    queryFn: () => parseComplianceDashboardEnvelope(getComplianceDashboardQuery()),
  });
}

export function useExportCenterQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardExportCenter(),
    queryFn: () => parseExportCenterDashboardEnvelope(getExportCenterQuery()),
  });
}

export function useSourceFreshnessQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardSourceFreshness(),
    queryFn: () => parseSourceFreshnessDashboardEnvelope(getSourceFreshnessQuery()),
  });
}
