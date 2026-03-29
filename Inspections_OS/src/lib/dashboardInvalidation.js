import { queryKeys } from "@/lib/queryKeys";

/**
 * @typedef {{
 *   invalidateQueries: (input: { queryKey: ReadonlyArray<unknown> }) => Promise<unknown>
 * }} QueryInvalidator
 */

/**
 * @param {QueryInvalidator} queryClient
 * @param {ReadonlyArray<ReadonlyArray<unknown>>} keys
 */
async function invalidateByKeys(queryClient, keys) {
  await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

/**
 * @param {string | null | undefined} projectId
 */
export function getIssueMutationInvalidationKeys(projectId) {
  const keys = [
    queryKeys.issues(),
    queryKeys.dashboardProject(),
    queryKeys.dashboardCompliance(),
  ];
  if (projectId) {
    keys.push(queryKeys.vaultSlots(projectId));
  }
  return keys;
}

export function getRunExportInvalidationKeys() {
  return [
    queryKeys.runs(),
    queryKeys.exports(),
    queryKeys.manifests(),
    queryKeys.dashboardPortfolio(),
    queryKeys.dashboardProject(),
    queryKeys.dashboardOps(),
    queryKeys.dashboardCompliance(),
    queryKeys.dashboardExportCenter(),
  ];
}

/**
 * @param {QueryInvalidator} queryClient
 * @param {string | null | undefined} projectId
 */
export async function invalidateIssueMutationContracts(queryClient, projectId) {
  await invalidateByKeys(queryClient, getIssueMutationInvalidationKeys(projectId));
}

/**
 * @param {QueryInvalidator} queryClient
 */
export async function invalidateRunExportContracts(queryClient) {
  await invalidateByKeys(queryClient, getRunExportInvalidationKeys());
}
