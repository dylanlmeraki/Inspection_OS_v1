import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateIssueMutationContracts } from "@/lib/dashboardInvalidation";
import { localDb } from "@/lib/localDb";
import { queryKeys } from "@/lib/queryKeys";

export function useProjectsQuery() {
  return useQuery({
    queryKey: queryKeys.projects(),
    queryFn: () => localDb.listProjects(),
  });
}

export function useRunsQuery() {
  return useQuery({
    queryKey: queryKeys.runs(),
    queryFn: () => localDb.listRuns(),
  });
}

export function useIssuesQuery() {
  return useQuery({
    queryKey: queryKeys.issues(),
    queryFn: () => localDb.listIssues(),
  });
}

export function useExportsQuery() {
  return useQuery({
    queryKey: queryKeys.exports(),
    queryFn: () => localDb.listExports(),
  });
}

export function useManifestsQuery() {
  return useQuery({
    queryKey: queryKeys.manifests(),
    queryFn: () => localDb.listManifests(),
  });
}

/**
 * @param {string} projectId
 */
export function useVaultSlotsQuery(projectId) {
  return useQuery({
    queryKey: queryKeys.vaultSlots(projectId),
    queryFn: () => {
      const project = localDb.getProject(projectId);
      const slots = [];
      if (project?.activePrograms?.includes("swppp_cgp")) {
        slots.push("swppp_prd_set", "swppp_eauthorization", "swppp_wdid_posting");
      }
      if (project?.activePrograms?.includes("special_inspections")) {
        slots.push("special_cover_packet");
      }
      return slots;
    },
    enabled: Boolean(projectId),
  });
}

/**
 * @typedef {{
 *  projectId: string
 *  runId: string
 *  code: string
 *  message: string
 * }} CreateIssueVariables
 */

/**
 * @returns {import("@tanstack/react-query").UseMutationResult<Record<string, unknown>, Error, CreateIssueVariables>}
 */
export function useCreateIssueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables) =>
      localDb.createIssue({
        projectId: variables.projectId,
        runId: variables.runId,
        code: variables.code,
        message: variables.message,
      }),
    onSuccess: async (_data, variables) => {
      await invalidateIssueMutationContracts(queryClient, variables.projectId);
    },
  });
}
