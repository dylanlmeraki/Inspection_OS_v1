/* eslint-disable react-refresh/only-export-components */
import { Navigate, useLocation } from "react-router-dom";
import { logAuditEvent } from "@/lib/auditLogger";
import { evaluatePermission } from "@/lib/authRbac";
import { localDb } from "@/lib/localDb";
import { useMockSession } from "@/lib/mockSession.jsx";

/**
 * @param {string} action
 * @param {{
 *   projectId?: string | null
 *   runId?: string | null
 *   issueId?: string | null
 *   exportId?: string | null
 *   dashboardSection?: string
 *   policy?: Record<string, boolean>
 * }} [scope]
 */
export function usePermissionDecision(action, scope = {}) {
  const { currentUser } = useMockSession();
  const actor = {
    userId: currentUser?.id || "",
    orgRole: currentUser?.orgRole || null,
  };
  return evaluatePermission({ actor, action, scope });
}

/**
 * @param {{
 *   action: string
 *   decision: { result: string, reason: string }
 *   actorId: string
 *   projectId: string
 *   details?: Record<string, unknown>
 * }} input
 */
export function recordPermissionAuditEvent(input) {
  localDb.createPermissionAudit({
    action: input.action,
    result: input.decision.result,
    reason: input.decision.reason,
    projectId: input.projectId,
    details: input.details || {},
  });

  logAuditEvent({
    eventType: "permission_checked",
    actorId: input.actorId,
    projectId: input.projectId,
    details: {
      action: input.action,
      result: input.decision.result,
      reason: input.decision.reason,
      ...(input.details || {}),
    },
  });
}

export function GuardedRoute({
  action,
  scope = {},
  fallbackPath = "/dashboard/my-work",
  children,
}) {
  const location = useLocation();
  const decision = usePermissionDecision(action, scope);

  if (decision.result !== "allowed") {
    return (
      <Navigate
        to={fallbackPath}
        replace
        state={{
          deniedAction: action,
          deniedReason: decision.reason,
          deniedCode: decision.result,
          from: location.pathname,
        }}
      />
    );
  }
  return children;
}

/**
 * @param {{
 *   action: string
 *   scope?: {
 *     projectId?: string | null
 *     runId?: string | null
 *     issueId?: string | null
 *     exportId?: string | null
 *     dashboardSection?: string
 *     policy?: Record<string, boolean>
 *   }
 *   onDenied?: (decision: { result: string, reason: string }) => void
 *   children?: import("react").ReactNode
 *   render?: (input: { allowed: boolean, decision: { result: string, reason: string } }) => import("react").ReactNode
 * }} props
 */
export function GuardedAction({
  action,
  scope = {},
  onDenied,
  children,
  render,
}) {
  const decision = usePermissionDecision(action, scope);
  if (decision.result !== "allowed") {
    if (typeof onDenied === "function") {
      onDenied(decision);
    }
  }

  if (typeof render === "function") {
    return render({
      allowed: decision.result === "allowed",
      decision,
    });
  }

  return children;
}
