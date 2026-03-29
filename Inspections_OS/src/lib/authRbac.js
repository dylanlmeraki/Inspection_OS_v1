import { localDb } from "@/lib/localDb";

export const ORG_ROLES = Object.freeze([
  "org_owner",
  "org_admin",
  "compliance_admin",
  "operations_admin",
]);

export const PROJECT_ROLES = Object.freeze([
  "project_manager",
  "reviewer",
  "inspector",
  "coordinator",
]);

export const RESTRICTED_ROLES = Object.freeze([
  "external_reviewer",
  "read_only_stakeholder",
]);

export const PERMISSION_ACTIONS = Object.freeze({
  viewDashboard: "view_dashboard",
  viewProjectWorkspace: "view_project_workspace",
  submitInspectionRun: "submit_inspection_run",
  approveReturnRun: "approve_return_run",
  createEditIssue: "create_edit_issue",
  closeIssueWithVerification: "close_issue_with_verification",
  attemptStageAdvancement: "attempt_stage_advancement",
  waiveBlocker: "waive_blocker",
  editPacketCadenceRules: "edit_packet_cadence_rules",
  editTemplates: "edit_templates",
  supersedeVerifySource: "supersede_verify_source",
  triggerExternalShareExport: "trigger_external_share_export",
  manageUsersRolesOrgSettings: "manage_users_roles_org_settings",
});

/**
 * @param {string | null | undefined} role
 */
function hasOrgAdminPower(role) {
  return role === "org_owner" || role === "org_admin";
}

/**
 * @param {string | null | undefined} userId
 * @param {string | null | undefined} projectId
 */
function getMembership(userId, projectId) {
  if (!userId || !projectId) return null;
  return (
    localDb
      .listProjectMemberships(projectId)
      .find((item) => item.userId === userId) || null
  );
}

/**
 * @param {string | null | undefined} userId
 */
function listMemberships(userId) {
  if (!userId) return [];
  return localDb.listProjectMemberships().filter((item) => item.userId === userId);
}

/**
 * @param {{
 *   actor: { userId: string, orgRole: string | null }
 *   action: string
 *   scope?: {
 *     projectId?: string | null
 *     dashboardSection?: string
 *     policy?: Record<string, boolean>
 *   }
 * }} input
 * @returns {{
 *   result: string
 *   reason: string
 *   membership: Record<string, unknown> | null
 * }}
 */
export function evaluatePermission(input) {
  const scope = input.scope || {};
  const policy = scope.policy || {};
  const memberships = listMemberships(input.actor.userId);
  const membership = scope.projectId
    ? getMembership(input.actor.userId, scope.projectId || null)
    : null;
  const orgRole = input.actor.orgRole;
  const projectRole = membership?.projectRole || null;
  const hasScopedMembership = Boolean(membership);
  const hasProjectRole = (roles) => {
    if (scope.projectId) return roles.includes(String(projectRole));
    return memberships.some((item) => roles.includes(String(item.projectRole)));
  };
  const anyMembershipCanWaive = memberships.some((item) => Boolean(item.canWaive));

  const allow = (reason = "allowed") => ({
    result: "allowed",
    reason,
    membership,
  });
  const denyRole = (reason) => ({
    result: "denied_role",
    reason,
    membership,
  });
  const denyScope = (reason) => ({
    result: "denied_scope",
    reason,
    membership,
  });
  const denyPolicy = (reason) => ({
    result: "denied_policy",
    reason,
    membership,
  });
  const denyMembership = (reason) => ({
    result: "denied_membership",
    reason,
    membership,
  });

  switch (input.action) {
    case PERMISSION_ACTIONS.viewDashboard: {
      const dashboardSection = scope.dashboardSection || "root";
      if (
        hasOrgAdminPower(orgRole) ||
        orgRole === "compliance_admin" ||
        orgRole === "operations_admin"
      ) {
        return allow("Org role may view dashboard.");
      }
      if (hasProjectRole(["project_manager", "reviewer", "coordinator"])) {
        return allow("Project role may view dashboard.");
      }
      if (hasProjectRole(["inspector"])) {
        if (dashboardSection === "my_work" || dashboardSection === "root") {
          return allow("Inspector may view limited my-work dashboard.");
        }
        return denyScope("Inspector dashboard scope is limited to my-work.");
      }
      if (hasProjectRole(["external_reviewer"]))
        return denyRole("External reviewer cannot view dashboard.");
      if (hasProjectRole(["read_only_stakeholder"])) {
        if (policy.allowReadOnlyDashboard) {
          return allow("Read-only stakeholder granted dashboard access.");
        }
        return denyScope("Read-only stakeholder dashboard requires explicit grant.");
      }
      return denyRole("Role cannot view dashboard.");
    }
    case PERMISSION_ACTIONS.viewProjectWorkspace: {
      if (ORG_ROLES.includes(String(orgRole)))
        return allow("Org role may view project workspace.");
      if (hasProjectRole(["project_manager", "reviewer", "inspector", "coordinator"])) {
        return allow("Project member may view project workspace.");
      }
      if (hasProjectRole(["external_reviewer"])) {
        if (policy.allowExternalProjectAccess)
          return allow("External reviewer granted project access.");
        return denyScope("External reviewer has no explicit project grant.");
      }
      if (hasProjectRole(["read_only_stakeholder"])) {
        if (policy.allowReadOnlyProjectAccess)
          return allow("Read-only stakeholder granted project access.");
        return denyScope("Read-only stakeholder has no explicit project grant.");
      }
      if (scope.projectId && !hasScopedMembership) {
        return denyMembership("Project membership required.");
      }
      return denyRole("Role cannot view project workspace.");
    }
    case PERMISSION_ACTIONS.submitInspectionRun: {
      if (ORG_ROLES.includes(String(orgRole))) return allow("Org role may submit run.");
      if (hasProjectRole(["inspector", "reviewer", "project_manager", "coordinator"])) {
        return allow("Project role may submit run.");
      }
      if (scope.projectId && !hasScopedMembership) {
        return denyMembership("Project membership required.");
      }
      return denyRole("Role cannot submit inspection run.");
    }
    case PERMISSION_ACTIONS.approveReturnRun: {
      if (
        hasOrgAdminPower(orgRole) ||
        orgRole === "compliance_admin" ||
        orgRole === "operations_admin"
      ) {
        return allow("Org/compliance/operations role may approve or return run.");
      }
      if (hasProjectRole(["reviewer", "project_manager"])) {
        return allow("Reviewer/project manager may approve or return run.");
      }
      if (scope.projectId && !hasScopedMembership) {
        return denyMembership("Project membership required.");
      }
      return denyRole("Role cannot approve or return run.");
    }
    case PERMISSION_ACTIONS.createEditIssue: {
      if (ORG_ROLES.includes(String(orgRole)))
        return allow("Org role may create or edit issue.");
      if (hasProjectRole(["inspector", "reviewer", "coordinator", "project_manager"])) {
        return allow("Project role may create or edit issue.");
      }
      if (scope.projectId && !hasScopedMembership) {
        return denyMembership("Project membership required.");
      }
      return denyRole("Role cannot create/edit issues.");
    }
    case PERMISSION_ACTIONS.closeIssueWithVerification: {
      if (
        hasOrgAdminPower(orgRole) ||
        orgRole === "compliance_admin" ||
        orgRole === "operations_admin"
      ) {
        return allow("Org/compliance/operations role may close issue with evidence.");
      }
      if (hasProjectRole(["reviewer", "project_manager"])) {
        return allow("Reviewer/project manager may close issue with evidence.");
      }
      if (hasProjectRole(["inspector"])) {
        if (policy.allowInspectorIssueClose)
          return allow("Inspector allowed by project policy.");
        return denyPolicy(
          "Inspector closeout requires explicit project policy."
        );
      }
      if (scope.projectId && !hasScopedMembership) {
        return denyMembership("Project membership required.");
      }
      return denyRole("Role cannot close issue with verification evidence.");
    }
    case PERMISSION_ACTIONS.attemptStageAdvancement: {
      if (ORG_ROLES.includes(String(orgRole)))
        return allow("Org role may attempt stage advancement.");
      if (hasProjectRole(["inspector", "reviewer", "project_manager"])) {
        return allow("Project role may attempt stage advancement.");
      }
      if (scope.projectId && !hasScopedMembership) {
        return denyMembership("Project membership required.");
      }
      return denyRole("Role cannot attempt stage advancement.");
    }
    case PERMISSION_ACTIONS.waiveBlocker: {
      if (hasOrgAdminPower(orgRole) || orgRole === "compliance_admin") {
        return allow("Compliance/org role may waive blocker.");
      }
      if (hasProjectRole(["project_manager"])) {
        const hasWaiverAuthority = scope.projectId
          ? Boolean(membership?.canWaive)
          : anyMembershipCanWaive;
        if (policy.allowProjectManagerWaive || hasWaiverAuthority) {
          return allow("Project manager has explicit waiver authority.");
        }
        return denyPolicy("Project manager waiver authority is not enabled.");
      }
      if (scope.projectId && !hasScopedMembership) {
        return denyMembership("Project membership required.");
      }
      return denyRole("Role cannot waive blocker.");
    }
    case PERMISSION_ACTIONS.editPacketCadenceRules: {
      if (hasOrgAdminPower(orgRole) || orgRole === "compliance_admin")
        return allow("Role may edit rules.");
      return denyRole("Only compliance/org admin roles may edit rules.");
    }
    case PERMISSION_ACTIONS.editTemplates: {
      if (hasOrgAdminPower(orgRole) || orgRole === "compliance_admin")
        return allow("Role may edit templates.");
      if (orgRole === "operations_admin") {
        if (policy.allowOperationsTemplatePublish)
          return allow("Operations admin allowed by policy.");
        return denyPolicy(
          "Operations admin may draft only unless publish policy is enabled."
        );
      }
      return denyRole("Role cannot edit templates.");
    }
    case PERMISSION_ACTIONS.supersedeVerifySource: {
      if (hasOrgAdminPower(orgRole) || orgRole === "compliance_admin")
        return allow("Role may supersede/verify source.");
      return denyRole(
        "Only compliance/org admin roles may supersede/verify source."
      );
    }
    case PERMISSION_ACTIONS.triggerExternalShareExport: {
      if (hasOrgAdminPower(orgRole) || orgRole === "compliance_admin")
        return allow("Role may share exports externally.");
      if (hasProjectRole(["reviewer", "project_manager"]))
        return allow("Role may share exports externally.");
      if (scope.projectId && !hasScopedMembership) {
        return denyMembership("Project membership required.");
      }
      return denyRole("Role cannot trigger external export sharing.");
    }
    case PERMISSION_ACTIONS.manageUsersRolesOrgSettings: {
      if (hasOrgAdminPower(orgRole))
        return allow("Org owner/admin may manage users, roles, and settings.");
      if (orgRole === "compliance_admin" && policy.allowComplianceScopeSettings) {
        return allow("Compliance admin has scoped admin settings permission.");
      }
      return denyRole("Role cannot manage users/roles/org settings.");
    }
    default:
      return denyScope(`Unknown permission action: ${input.action}`);
  }
}
