import { localDb } from "@/lib/localDb";
import {
  buildDashboardEnvelope,
  dashboardContractIds,
} from "@/lib/dashboardContracts";

/**
 * @returns {import("@/contracts/types").ComplianceDashboardEnvelope}
 */
export function getComplianceDashboardQuery() {
  const evaluations = localDb.listStageGateEvaluations();
  const transitionAttempts = localDb.listTransitionAttempts();
  const sourceRecords = localDb.listSourceRecords();

  const payload = {
    summary: {
      warningCount: evaluations.reduce(
        (count, row) => count + (row.evaluation?.warnings?.length || 0),
        0
      ),
      blockerCount: evaluations.reduce(
        (count, row) => count + (row.evaluation?.blockers?.length || 0),
        0
      ),
      waiverAttemptCount: transitionAttempts.filter((item) => item.action === "waive").length,
      staleSourceCount: sourceRecords.filter((item) => item.stale).length,
    },
    unresolvedRuns: evaluations
      .filter((item) => item.evaluation?.status === "blocked")
      .map((item) => ({
        runId: item.runId,
        stageCode: item.context?.workflowStageCode || "unknown_stage",
        blockerCodes: (item.evaluation?.blockers || []).map((blocker) => blocker.code),
      })),
  };

  return buildDashboardEnvelope(dashboardContractIds.compliance, payload);
}
