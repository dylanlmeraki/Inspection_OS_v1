import { localDb } from "@/lib/localDb";
import {
  normalizeExportStatus,
  normalizeIssueStatus,
  normalizeRunStatus,
} from "@/lib/statusVocabulary";

function asDateMillis(value) {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function deriveDueState(dueAt) {
  if (!dueAt) return "no_due_date";
  const now = Date.now();
  const due = asDateMillis(dueAt);
  if (due === null) return "no_due_date";
  const day = 24 * 60 * 60 * 1000;
  if (due < now) return "overdue";
  if (due < now + day) return "due_today";
  if (due < now + day * 3) return "due_soon";
  return "scheduled";
}

/**
 * @param {{ status?: string, stageCode?: string, projectId?: string }} [filters]
 */
export function listRunsQuery(filters = {}) {
  return localDb
    .listRuns()
    .filter((run) =>
      filters.projectId ? run.projectId === filters.projectId : true
    )
    .filter((run) =>
      filters.status ? normalizeRunStatus(run.status) === filters.status : true
    )
    .filter((run) => (filters.stageCode ? run.stageCode === filters.stageCode : true))
    .map((run) => ({
      ...run,
      normalizedStatus: normalizeRunStatus(run.status),
      dueState: deriveDueState(run.dueAt),
    }));
}

export function listReviewQueueQuery() {
  return listRunsQuery().filter((run) =>
    ["submitted", "under_review", "returned", "blocked"].includes(
      run.normalizedStatus
    )
  );
}

export function listRecurringCadenceQuery() {
  const cadence = localDb.listCadenceRules();
  const runs = listRunsQuery();
  return cadence.map((rule) => ({
    ...rule,
    relatedRuns: runs.filter(
      (run) =>
        run.programKey === rule.programKey &&
        run.inspectionTypeCode === rule.inspectionTypeCode
    ),
  }));
}

/**
 * @param {{ status?: string, projectId?: string }} [filters]
 */
export function listIssuesQuery(filters = {}) {
  return localDb
    .listIssues()
    .filter((issue) =>
      filters.projectId ? issue.projectId === filters.projectId : true
    )
    .map((issue) => ({
      ...issue,
      normalizedStatus: normalizeIssueStatus(issue.status),
      dueState: deriveDueState(issue.dueAt),
    }))
    .filter((issue) =>
      filters.status ? issue.normalizedStatus === filters.status : true
    );
}

export function listOverdueIssuesQuery() {
  return listIssuesQuery().filter((issue) => issue.dueState === "overdue");
}

export function listVerificationIssuesQuery() {
  return listIssuesQuery().filter(
    (issue) =>
      issue.normalizedStatus === "in_verification" ||
      issue.normalizedStatus === "open"
  );
}

/**
 * @param {string} issueId
 */
export function getIssueDetailQuery(issueId) {
  const issue = localDb.getIssue(issueId);
  if (!issue) return null;
  return {
    ...issue,
    normalizedStatus: normalizeIssueStatus(issue.status),
    run: issue.runId ? localDb.getRun(issue.runId) : null,
  };
}

/**
 * @param {string} projectId
 */
export function getProjectWorkspaceQuery(projectId) {
  const project = localDb.getProject(projectId);
  if (!project) return null;
  const runs = listRunsQuery({ projectId });
  const issues = listIssuesQuery({ projectId });
  const exports = localDb
    .listExports()
    .filter((row) => row.workflowRunId && runs.some((run) => run.id === row.workflowRunId))
    .map((row) => ({ ...row, normalizedStatus: normalizeExportStatus(row.status) }));
  const evaluations = localDb
    .listStageGateEvaluations()
    .filter((item) => item.context?.projectId === projectId);
  const memberships = localDb.listProjectMemberships(projectId);
  const users = localDb.listUsers();
  const activity = localDb.listProjectActivity(projectId);
  const sourceRecords = localDb.listSourceRecords();
  const sourceStatusCounts = sourceRecords.reduce((acc, row) => {
    acc[row.verificationStatus] = (acc[row.verificationStatus] || 0) + 1;
    return acc;
  }, {});
  const latestRun = runs[0] || null;

  const programCards = (project.activePrograms || []).map((programKey) => {
    const programRuns = runs.filter((run) => run.programKey === programKey);
    const programEvaluations = evaluations.filter(
      (row) => row.context?.programFamilyKey === programKey
    );
    const currentEval = programEvaluations[0]?.evaluation || null;
    const packetCompleteness =
      currentEval?.status === "pass"
        ? "complete"
        : currentEval?.blockers?.length
        ? "blocked"
        : "unknown";
    return {
      programKey,
      currentStage: programRuns[0]?.stageCode || "not_started",
      gateStatus: currentEval?.status || "not_started",
      packetCompleteness,
      lastRunId: programRuns[0]?.id || null,
      nextDue: programRuns[0]?.dueAt || null,
      verificationDistribution: sourceStatusCounts,
    };
  });

  const unresolvedBlockers = evaluations.flatMap((row) =>
    (row.evaluation?.blockers || []).map((blocker) => ({
      ...blocker,
      stageCode: row.context?.workflowStageCode || "unknown",
    }))
  );

  const requiredVaultSlots = project.activePrograms.includes("swppp_cgp")
    ? ["swppp_prd_set", "swppp_eauthorization", "swppp_wdid_posting"]
    : project.activePrograms.includes("special_inspections")
    ? ["special_cover_packet"]
    : [];

  return {
    project,
    summary: {
      runCount: runs.length,
      issueCount: issues.length,
      openIssueCount: issues.filter((item) => item.normalizedStatus !== "closed").length,
      exportCount: exports.length,
      blockerCount: unresolvedBlockers.length,
      currentBlockers: unresolvedBlockers,
      latestRunId: latestRun?.id || null,
    },
    programCards,
    inspections: runs,
    issues,
    documents: {
      requiredSlots: requiredVaultSlots,
      optionalSlots: ["field_notes", "agency_correspondence"],
      missingRequiredSlots: requiredVaultSlots.filter((slot) =>
        !runs.some((run) => (run.attachedDocuments || []).includes(slot))
      ),
      sourceReferences: sourceRecords,
    },
    exports,
    team: memberships.map((membership) => ({
      ...membership,
      user: users.find((user) => user.id === membership.userId) || null,
    })),
    audit: activity,
  };
}

export function listProjectsWorkspaceQuery() {
  const projects = localDb.listProjects();
  return projects.map((project) => {
    const workspace = getProjectWorkspaceQuery(project.id);
    return {
      project,
      summary: workspace?.summary || null,
    };
  });
}

export function listTemplateFamiliesQuery() {
  return localDb.listTemplateFamilies();
}

/**
 * @param {string} templateFamilyId
 */
export function getTemplateFamilyQuery(templateFamilyId) {
  const family = localDb.getTemplateFamily(templateFamilyId);
  if (!family) return null;
  return {
    family,
    versions: localDb.listTemplateVersions(templateFamilyId),
  };
}

/**
 * @param {string} templateVersionId
 */
export function getTemplateVersionQuery(templateVersionId) {
  return localDb.getTemplateVersion(templateVersionId);
}

export function listRulePacketQuery() {
  return localDb.listPacketRules();
}

export function listRuleCadenceQuery() {
  return localDb.listCadenceRules();
}

export function listRuleSnapshotsQuery() {
  return localDb.listRuleSnapshots();
}

export function listRulePreviewsQuery() {
  return localDb.listRulePreviews();
}

export function getAdminOverviewQuery() {
  return {
    organizations: localDb.listOrganizations(),
    users: localDb.listUsers(),
    memberships: localDb.listProjectMemberships(),
    integrations: localDb.listAdminIntegrations(),
    permissionAudits: localDb.listPermissionAudits(),
  };
}

export function getPortfolioDrilldownsQuery() {
  const projects = listProjectsWorkspaceQuery();
  const runs = listRunsQuery();
  const issues = listIssuesQuery();
  const exports = localDb.listExports();
  return {
    blockedProjects: projects.filter((item) => (item.summary?.blockerCount || 0) > 0),
    overdueInspections: runs.filter((item) => item.dueState === "overdue"),
    overdueIssues: issues.filter((item) => item.dueState === "overdue"),
    exportFailures: exports.filter((item) => normalizeExportStatus(item.status) === "failed"),
  };
}

