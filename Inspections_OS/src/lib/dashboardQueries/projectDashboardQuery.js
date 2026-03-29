import { localDb } from "@/lib/localDb";
import {
  buildDashboardEnvelope,
  dashboardContractIds,
} from "@/lib/dashboardContracts";

/**
 * @returns {import("@/contracts/types").ProjectDashboardEnvelope}
 */
export function getProjectDashboardQuery() {
  const projects = localDb.listProjects();
  const runs = localDb.listRuns();
  const issues = localDb.listIssues();
  const exports = localDb.listExports();

  const projectRows = projects.map((project) => {
    const projectRuns = runs.filter((run) => run.projectId === project.id);
    const openIssueCount = issues.filter(
      (issue) => issue.projectId === project.id && issue.status !== "closed"
    ).length;

    return {
      projectId: project.id,
      projectName: project.name,
      jurisdictionKey: project.jurisdictionKey,
      activeProgramCount: (project.activePrograms || []).length,
      runCount: projectRuns.length,
      openIssueCount,
      lastRunAt: projectRuns[0]?.createdAt || null,
    };
  });

  const payload = {
    summary: {
      projectCount: projects.length,
      runCount: runs.length,
      openIssueCount: issues.filter((issue) => issue.status !== "closed").length,
      exportCount: exports.length,
    },
    projects: projectRows,
  };

  return buildDashboardEnvelope(dashboardContractIds.project, payload);
}
