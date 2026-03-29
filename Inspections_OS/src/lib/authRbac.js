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
  const membership = getMembership(input.actor.userId, scope.projectId || null);
  const orgRole = input.actor.orgRole;
  const projectRole = membership?.projectRole || null;

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
      if (["project_manager", "reviewer", "coordinator"].includes(String(projectRole))) {
        return allow("Project role may view dashboard.");
      }
      if (projectRole === "inspector") {
        if (dashboardSection === "my_work" || dashboardSection === "root") {
          return allow("Inspector may view limited my-work dashboard.");
        }
        return denyScope("Inspector dashboard scope is limited to my-work.");
      }
      if (projectRole === "external_reviewer")
        return denyRole("External reviewer cannot view dashboard.");
      if (projectRole === "read_only_stakeholder" && policy.allowReadOnlyDashboard) {
        return allow("Read-only stakeholder granted dashboard access.");
      }
      return denyRole("Role cannot view dashboard.");
    }
    case PERMISSION_ACTIONS.viewProjectWorkspace: {
      if (ORG_ROLES.includes(String(orgRole)))
        return allow("Org role may view project workspace.");
      if (
        projectRole &&
        projectRole !== "read_only_stakeholder" &&
        projectRole !== "external_reviewer"
      ) {
        return allow("Project member may view project workspace.");
      }
      if (projectRole === "external_reviewer") {
        if (policy.allowExternalProjectAccess)
          return allow("External reviewer granted project access.");
        return denyScope("External reviewer has no explicit project grant.");
      }
      if (projectRole === "read_only_stakeholder") {
        if (policy.allowReadOnlyProjectAccess)
          return allow("Read-only stakeholder granted project access.");
        return denyScope("Read-only stakeholder has no explicit project grant.");
      }
      return denyMembership("Project membership required.");
    }
    case PERMISSION_ACTIONS.submitInspectionRun: {
      if (ORG_ROLES.includes(String(orgRole))) return allow("Org role may submit run.");
      if (
        ["inspector", "reviewer", "project_manager", "coordinator"].includes(
          String(projectRole)
        )
      ) {
        return allow("Project role may submit run.");
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
      if (["reviewer", "project_manager"].includes(String(projectRole))) {
        return allow("Reviewer/project manager may approve or return run.");
      }
      return denyRole("Role cannot approve or return run.");
    }
    case PERMISSION_ACTIONS.createEditIssue: {
      if (ORG_ROLES.includes(String(orgRole)))
        return allow("Org role may create or edit issue.");
      if (
        ["inspector", "reviewer", "coordinator", "project_manager"].includes(
          String(projectRole)
        )
      ) {
        return allow("Project role may create or edit issue.");
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
      if (["reviewer", "project_manager"].includes(String(projectRole))) {
        return allow("Reviewer/project manager may close issue with evidence.");
      }
      if (projectRole === "inspector") {
        if (policy.allowInspectorIssueClose)
          return allow("Inspector allowed by project policy.");
        return denyPolicy(
          "Inspector closeout requires explicit project policy."
        );
      }
      return denyRole("Role cannot close issue with verification evidence.");
    }
    case PERMISSION_ACTIONS.attemptStageAdvancement: {
      if (ORG_ROLES.includes(String(orgRole)))
        return allow("Org role may attempt stage advancement.");
      if (["inspector", "reviewer", "project_manager"].includes(String(projectRole))) {
        return allow("Project role may attempt stage advancement.");
      }
      return denyRole("Role cannot attempt stage advancement.");
    }
    case PERMISSION_ACTIONS.waiveBlocker: {
      if (hasOrgAdminPower(orgRole) || orgRole === "compliance_admin") {
        return allow("Compliance/org role may waive blocker.");
      }
      if (projectRole === "project_manager") {
        if (policy.allowProjectManagerWaive || membership?.canWaive) {
          return allow("Project manager has explicit waiver authority.");
        }
        return denyPolicy("Project manager waiver authority is not enabled.");
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
      if (["reviewer", "project_manager"].includes(String(projectRole)))
        return allow("Role may share exports externally.");
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
