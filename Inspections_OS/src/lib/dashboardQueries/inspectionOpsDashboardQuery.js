import { localDb } from "@/lib/localDb";
import {
  buildDashboardEnvelope,
  dashboardContractIds,
} from "@/lib/dashboardContracts";

/**
 * @returns {import("@/contracts/types").InspectionOpsDashboardEnvelope}
 */
export function getInspectionOpsDashboardQuery() {
  const runs = localDb.listRuns();
  const evaluations = localDb.listStageGateEvaluations();
  const stageRollups = new Map();

  evaluations.forEach((row) => {
    const stageCode = row.context?.workflowStageCode || row.context?.stageCode || "unknown_stage";
    const existing = stageRollups.get(stageCode) || {
      stageCode,
      runCount: 0,
      blockedCount: 0,
      passCount: 0,
    };
    existing.runCount += 1;
    if (row.evaluation?.status === "blocked") existing.blockedCount += 1;
    if (row.evaluation?.status === "pass") existing.passCount += 1;
    stageRollups.set(stageCode, existing);
  });

  const payload = {
    summary: {
      submittedRuns: runs.filter((run) => run.status === "submitted").length,
      draftRuns: runs.filter((run) => run.status !== "submitted").length,
      blockedEvaluations: evaluations.filter((item) => item.evaluation?.status === "blocked")
        .length,
      passEvaluations: evaluations.filter((item) => item.evaluation?.status === "pass").length,
    },
    stages: [...stageRollups.values()].sort((a, b) => a.stageCode.localeCompare(b.stageCode)),
  };

  return buildDashboardEnvelope(dashboardContractIds.inspectionOps, payload);
}
