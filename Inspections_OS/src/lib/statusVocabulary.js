export const RUN_STATUSES = Object.freeze([
  "draft",
  "in_progress",
  "submitted",
  "under_review",
  "approved",
  "returned",
  "blocked",
  "complete",
  "canceled",
]);

export const ISSUE_STATUSES = Object.freeze([
  "open",
  "in_verification",
  "overdue",
  "resolved",
  "closed",
  "waived",
]);

export const EXPORT_STATUSES = Object.freeze([
  "draft",
  "queued",
  "generating",
  "completed",
  "failed",
  "shared",
  "archived",
]);

export const SOURCE_STATUSES = Object.freeze([
  "verified-direct",
  "verified-indirect",
  "inferred-direct",
  "gap-note",
  "stale",
  "superseded",
]);

export const TRANSITION_RESULTS = Object.freeze(["pass", "warn", "fail", "waived"]);

export const PERMISSION_RESULTS = Object.freeze([
  "allowed",
  "denied_role",
  "denied_scope",
  "denied_policy",
  "denied_membership",
]);

/**
 * @param {string | null | undefined} value
 */
export function normalizeRunStatus(value) {
  if (value === "pass") return "approved";
  if (value === "blocked") return "blocked";
  if (value === "completed") return "complete";
  if (RUN_STATUSES.includes(String(value))) return String(value);
  return "draft";
}

/**
 * @param {string | null | undefined} value
 */
export function normalizeIssueStatus(value) {
  if (ISSUE_STATUSES.includes(String(value))) return String(value);
  if (value === "open") return "open";
  return "open";
}

/**
 * @param {string | null | undefined} value
 */
export function normalizeExportStatus(value) {
  if (value === "completed") return "completed";
  if (value === "pending") return "queued";
  if (EXPORT_STATUSES.includes(String(value))) return String(value);
  return "draft";
}

/**
 * @param {string | null | undefined} value
 */
export function normalizeSourceStatus(value) {
  if (SOURCE_STATUSES.includes(String(value))) return String(value);
  return "gap-note";
}

/**
 * @param {"pass"|"blocked"} evaluationStatus
 * @param {boolean} hasWarnings
 * @param {boolean} waived
 */
export function deriveTransitionResult(evaluationStatus, hasWarnings, waived) {
  if (waived) return "waived";
  if (evaluationStatus === "blocked") return "fail";
  if (hasWarnings) return "warn";
  return "pass";
}

