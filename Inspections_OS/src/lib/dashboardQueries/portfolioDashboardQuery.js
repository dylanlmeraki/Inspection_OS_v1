import { localDb } from "@/lib/localDb";
import {
  buildDashboardEnvelope,
  dashboardContractIds,
} from "@/lib/dashboardContracts";

/**
 * @returns {import("@/contracts/types").PortfolioDashboardEnvelope}
 */
export function getPortfolioDashboardQuery() {
  const projects = localDb.listProjects();
  const runs = localDb.listRuns();
  const issues = localDb.listIssues();
  const sources = localDb.listSourceRecords();

  const topProjects = projects
    .map((project) => ({
      projectId: project.id,
      projectName: project.name,
      runCount: runs.filter((run) => run.projectId === project.id).length,
      openIssueCount: issues.filter(
        (issue) => issue.projectId === project.id && issue.status !== "closed"
      ).length,
    }))
    .sort((left, right) => right.runCount - left.runCount || left.projectId.localeCompare(right.projectId))
    .slice(0, 5);

  const payload = {
    summary: {
      projectCount: projects.length,
      activeRunCount: runs.filter((run) => run.status === "submitted").length,
      blockedRunCount: runs.filter((run) => run.status !== "submitted").length,
      staleSourceCount: sources.filter((source) => source.stale).length,
    },
    topProjects,
  };

  return buildDashboardEnvelope(dashboardContractIds.portfolio, payload);
}
