import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminOverviewQuery,
  getIssueDetailQuery,
  getPortfolioDrilldownsQuery,
  getProjectWorkspaceQuery,
  getTemplateFamilyQuery,
  getTemplateVersionQuery,
  listIssuesQuery,
  listOverdueIssuesQuery,
  listProjectsWorkspaceQuery,
  listRecurringCadenceQuery,
  listReviewQueueQuery,
  listRuleCadenceQuery,
  listRulePacketQuery,
  listRulePreviewsQuery,
  listRuleSnapshotsQuery,
  listRunsQuery,
  listTemplateFamiliesQuery,
  listVerificationIssuesQuery,
} from "@/lib/controlPlaneQueries";
import { recordPermissionAuditEvent, usePermissionDecision } from "@/lib/permissionGuards.jsx";
import { localDb } from "@/lib/localDb";
import { queryKeys } from "@/lib/queryKeys";

export function useProjectsWorkspaceQuery() {
  return useQuery({
    queryKey: queryKeys.projectsWorkspace(),
    queryFn: () => listProjectsWorkspaceQuery(),
  });
}

/**
 * @param {string} projectId
 */
export function useProjectWorkspaceQuery(projectId) {
  return useQuery({
    queryKey: queryKeys.projectWorkspace(projectId),
    queryFn: () => getProjectWorkspaceQuery(projectId),
    enabled: Boolean(projectId),
  });
}

/**
 * @param {{ status?: string, stageCode?: string, projectId?: string }} [filters]
 */
export function useInspectionsListQuery(filters = {}) {
  return useQuery({
    queryKey: queryKeys.inspectionsList(filters),
    queryFn: () => listRunsQuery(filters),
  });
}

export function useReviewQueueQuery() {
  return useQuery({
    queryKey: queryKeys.inspectionsReviewQueue(),
    queryFn: () => listReviewQueueQuery(),
  });
}

export function useRecurringCadenceQuery() {
  return useQuery({
    queryKey: queryKeys.inspectionsRecurring(),
    queryFn: () => listRecurringCadenceQuery(),
  });
}

/**
 * @param {{ status?: string, projectId?: string }} [filters]
 */
export function useIssuesListQuery(filters = {}) {
  return useQuery({
    queryKey: queryKeys.issuesList(filters),
    queryFn: () => listIssuesQuery(filters),
  });
}

export function useOverdueIssuesQuery() {
  return useQuery({
    queryKey: queryKeys.issuesOverdue(),
    queryFn: () => listOverdueIssuesQuery(),
  });
}

export function useVerificationIssuesQuery() {
  return useQuery({
    queryKey: queryKeys.issuesVerification(),
    queryFn: () => listVerificationIssuesQuery(),
  });
}

/**
 * @param {string} issueId
 */
export function useIssueDetailQuery(issueId) {
  return useQuery({
    queryKey: queryKeys.issueDetail(issueId),
    queryFn: () => getIssueDetailQuery(issueId),
    enabled: Boolean(issueId),
  });
}

export function useTemplateFamiliesQuery() {
  return useQuery({
    queryKey: queryKeys.templatesFamilies(),
    queryFn: () => listTemplateFamiliesQuery(),
  });
}

/**
 * @param {string} templateFamilyId
 */
export function useTemplateFamilyDetailQuery(templateFamilyId) {
  return useQuery({
    queryKey: queryKeys.templateFamilyDetail(templateFamilyId),
    queryFn: () => getTemplateFamilyQuery(templateFamilyId),
    enabled: Boolean(templateFamilyId),
  });
}

/**
 * @param {string} templateVersionId
 */
export function useTemplateVersionDetailQuery(templateVersionId) {
  return useQuery({
    queryKey: queryKeys.templateVersionDetail(templateVersionId),
    queryFn: () => getTemplateVersionQuery(templateVersionId),
    enabled: Boolean(templateVersionId),
  });
}

export function useRulesPacketQuery() {
  return useQuery({
    queryKey: queryKeys.rulesPacket(),
    queryFn: () => listRulePacketQuery(),
  });
}

export function useRulesCadenceQuery() {
  return useQuery({
    queryKey: queryKeys.rulesCadence(),
    queryFn: () => listRuleCadenceQuery(),
  });
}

export function useRulesSnapshotsQuery() {
  return useQuery({
    queryKey: queryKeys.rulesSnapshots(),
    queryFn: () => listRuleSnapshotsQuery(),
  });
}

export function useRulesPreviewsQuery() {
  return useQuery({
    queryKey: queryKeys.rulesPreviews(),
    queryFn: () => listRulePreviewsQuery(),
  });
}

export function useAdminOverviewQuery() {
  return useQuery({
    queryKey: queryKeys.adminOverview(),
    queryFn: () => getAdminOverviewQuery(),
  });
}

export function usePortfolioDrilldownsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardPortfolioDrilldowns(),
    queryFn: () => getPortfolioDrilldownsQuery(),
  });
}

export function useRunTransitionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    /**
     * @param {{ runId: string, status: string, actorId: string, action: string, projectId: string }} variables
     */
    mutationFn: (variables) => {
      const nextRun = localDb.updateRun(variables.runId, { status: variables.status });
      if (!nextRun) {
        throw new Error("Run not found");
      }
      recordPermissionAuditEvent({
        action: variables.action,
        actorId: variables.actorId,
        projectId: variables.projectId,
        decision: { result: "allowed", reason: "Transition action executed." },
        details: { runId: variables.runId, status: variables.status },
      });
      return nextRun;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.inspectionsReviewQueue() });
      await queryClient.invalidateQueries({ queryKey: ["inspections", "list"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.projectsWorkspace() });
    },
  });
}

export function useIssueStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    /**
     * @param {{ issueId: string, status: string }} variables
     */
    mutationFn: (variables) => {
      const next = localDb.updateIssue(variables.issueId, { status: variables.status });
      if (!next) {
        throw new Error("Issue not found");
      }
      return next;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.issueDetail(variables.issueId) });
      await queryClient.invalidateQueries({ queryKey: ["issues", "list"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.issuesOverdue() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.issuesVerification() });
    },
  });
}

/**
 * @param {string} action
 * @param {{ projectId?: string | null, policy?: Record<string, boolean> }} [scope]
 */
export function usePermissionForAction(action, scope = {}) {
  return usePermissionDecision(action, scope);
}
