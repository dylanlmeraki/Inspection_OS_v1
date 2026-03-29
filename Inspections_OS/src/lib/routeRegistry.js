import { PERMISSION_ACTIONS } from "@/lib/authRbac";

export const CONTROL_PLANE_ROUTES = [
  { path: "/dashboard", title: "Dashboard", guardAction: PERMISSION_ACTIONS.viewDashboard, breadcrumbBase: "Dashboard", drilldownSource: "dashboard_root" },
  { path: "/dashboard/portfolio", title: "Portfolio", guardAction: PERMISSION_ACTIONS.viewDashboard, breadcrumbBase: "Dashboard", drilldownSource: "portfolio_widgets" },
  { path: "/dashboard/operations", title: "Operations", guardAction: PERMISSION_ACTIONS.viewDashboard, breadcrumbBase: "Dashboard", drilldownSource: "operations_widgets" },
  { path: "/dashboard/compliance", title: "Compliance", guardAction: PERMISSION_ACTIONS.viewDashboard, breadcrumbBase: "Dashboard", drilldownSource: "compliance_widgets" },
  { path: "/dashboard/my-work", title: "My Work", guardAction: PERMISSION_ACTIONS.viewDashboard, breadcrumbBase: "Dashboard", drilldownSource: "my_work_widgets" },

  { path: "/projects", title: "Projects", guardAction: PERMISSION_ACTIONS.viewProjectWorkspace, breadcrumbBase: "Projects", drilldownSource: "projects_index" },
  { path: "/projects/:projectId", title: "Project Workspace", guardAction: PERMISSION_ACTIONS.viewProjectWorkspace, breadcrumbBase: "Projects", drilldownSource: "project_workspace" },
  { path: "/projects/:projectId/overview", title: "Overview", guardAction: PERMISSION_ACTIONS.viewProjectWorkspace, breadcrumbBase: "Projects", drilldownSource: "project_overview" },
  { path: "/projects/:projectId/programs", title: "Programs", guardAction: PERMISSION_ACTIONS.viewProjectWorkspace, breadcrumbBase: "Projects", drilldownSource: "project_programs" },
  { path: "/projects/:projectId/inspections", title: "Inspections", guardAction: PERMISSION_ACTIONS.viewProjectWorkspace, breadcrumbBase: "Projects", drilldownSource: "project_inspections" },
  { path: "/projects/:projectId/issues", title: "Issues", guardAction: PERMISSION_ACTIONS.viewProjectWorkspace, breadcrumbBase: "Projects", drilldownSource: "project_issues" },
  { path: "/projects/:projectId/documents", title: "Documents", guardAction: PERMISSION_ACTIONS.viewProjectWorkspace, breadcrumbBase: "Projects", drilldownSource: "project_documents" },
  { path: "/projects/:projectId/exports", title: "Exports", guardAction: PERMISSION_ACTIONS.viewProjectWorkspace, breadcrumbBase: "Projects", drilldownSource: "project_exports" },
  { path: "/projects/:projectId/team", title: "Team", guardAction: PERMISSION_ACTIONS.viewProjectWorkspace, breadcrumbBase: "Projects", drilldownSource: "project_team" },
  { path: "/projects/:projectId/audit", title: "Audit", guardAction: PERMISSION_ACTIONS.viewProjectWorkspace, breadcrumbBase: "Projects", drilldownSource: "project_audit" },

  { path: "/inspections", title: "Inspections", guardAction: PERMISSION_ACTIONS.submitInspectionRun, breadcrumbBase: "Inspections", drilldownSource: "inspections_all" },
  { path: "/inspections/review-queue", title: "Review Queue", guardAction: PERMISSION_ACTIONS.approveReturnRun, breadcrumbBase: "Inspections", drilldownSource: "inspections_review_queue" },
  { path: "/inspections/recurring", title: "Recurring", guardAction: PERMISSION_ACTIONS.submitInspectionRun, breadcrumbBase: "Inspections", drilldownSource: "inspections_recurring" },
  { path: "/inspections/calendar", title: "Calendar", guardAction: PERMISSION_ACTIONS.submitInspectionRun, breadcrumbBase: "Inspections", drilldownSource: "inspections_calendar" },
  { path: "/inspections/:runId", title: "Run Detail", guardAction: PERMISSION_ACTIONS.viewProjectWorkspace, breadcrumbBase: "Inspections", drilldownSource: "inspection_run_detail" },

  { path: "/issues", title: "Issues", guardAction: PERMISSION_ACTIONS.createEditIssue, breadcrumbBase: "Issues", drilldownSource: "issues_all" },
  { path: "/issues/overdue", title: "Overdue Issues", guardAction: PERMISSION_ACTIONS.createEditIssue, breadcrumbBase: "Issues", drilldownSource: "issues_overdue" },
  { path: "/issues/verification", title: "Verification Queue", guardAction: PERMISSION_ACTIONS.closeIssueWithVerification, breadcrumbBase: "Issues", drilldownSource: "issues_verification" },
  { path: "/issues/:issueId", title: "Issue Detail", guardAction: PERMISSION_ACTIONS.createEditIssue, breadcrumbBase: "Issues", drilldownSource: "issue_detail" },

  { path: "/exports", title: "Exports", guardAction: PERMISSION_ACTIONS.triggerExternalShareExport, breadcrumbBase: "Exports", drilldownSource: "exports_all" },
  { path: "/exports/manifests", title: "Manifests", guardAction: PERMISSION_ACTIONS.triggerExternalShareExport, breadcrumbBase: "Exports", drilldownSource: "exports_manifests" },
  { path: "/exports/:exportId", title: "Export Detail", guardAction: PERMISSION_ACTIONS.triggerExternalShareExport, breadcrumbBase: "Exports", drilldownSource: "export_detail" },

  { path: "/sources", title: "Sources", guardAction: PERMISSION_ACTIONS.viewProjectWorkspace, breadcrumbBase: "Sources", drilldownSource: "sources_all" },
  { path: "/sources/forms", title: "Forms Library", guardAction: PERMISSION_ACTIONS.viewProjectWorkspace, breadcrumbBase: "Sources", drilldownSource: "sources_forms" },
  { path: "/sources/:sourceRecordId", title: "Source Detail", guardAction: PERMISSION_ACTIONS.viewProjectWorkspace, breadcrumbBase: "Sources", drilldownSource: "source_detail" },

  { path: "/templates", title: "Templates", guardAction: PERMISSION_ACTIONS.editTemplates, breadcrumbBase: "Templates", drilldownSource: "templates_all" },
  { path: "/templates/families", title: "Template Families", guardAction: PERMISSION_ACTIONS.editTemplates, breadcrumbBase: "Templates", drilldownSource: "templates_families" },
  { path: "/templates/:templateFamilyId", title: "Template Family", guardAction: PERMISSION_ACTIONS.editTemplates, breadcrumbBase: "Templates", drilldownSource: "template_family_detail" },
  { path: "/templates/:templateFamilyId/versions/:templateVersionId", title: "Template Version", guardAction: PERMISSION_ACTIONS.editTemplates, breadcrumbBase: "Templates", drilldownSource: "template_version_detail" },

  { path: "/rules", title: "Rules", guardAction: PERMISSION_ACTIONS.editPacketCadenceRules, breadcrumbBase: "Rules", drilldownSource: "rules_all" },
  { path: "/rules/packet", title: "Packet Rules", guardAction: PERMISSION_ACTIONS.editPacketCadenceRules, breadcrumbBase: "Rules", drilldownSource: "rules_packet" },
  { path: "/rules/cadence", title: "Cadence Rules", guardAction: PERMISSION_ACTIONS.editPacketCadenceRules, breadcrumbBase: "Rules", drilldownSource: "rules_cadence" },
  { path: "/rules/snapshots", title: "Rule Snapshots", guardAction: PERMISSION_ACTIONS.editPacketCadenceRules, breadcrumbBase: "Rules", drilldownSource: "rules_snapshots" },
  { path: "/rules/previews", title: "Rule Previews", guardAction: PERMISSION_ACTIONS.editPacketCadenceRules, breadcrumbBase: "Rules", drilldownSource: "rules_previews" },

  { path: "/admin", title: "Admin", guardAction: PERMISSION_ACTIONS.manageUsersRolesOrgSettings, breadcrumbBase: "Admin", drilldownSource: "admin_index" },
  { path: "/admin/organizations", title: "Organizations", guardAction: PERMISSION_ACTIONS.manageUsersRolesOrgSettings, breadcrumbBase: "Admin", drilldownSource: "admin_organizations" },
  { path: "/admin/users", title: "Users", guardAction: PERMISSION_ACTIONS.manageUsersRolesOrgSettings, breadcrumbBase: "Admin", drilldownSource: "admin_users" },
  { path: "/admin/roles", title: "Roles", guardAction: PERMISSION_ACTIONS.manageUsersRolesOrgSettings, breadcrumbBase: "Admin", drilldownSource: "admin_roles" },
  { path: "/admin/settings", title: "Settings", guardAction: PERMISSION_ACTIONS.manageUsersRolesOrgSettings, breadcrumbBase: "Admin", drilldownSource: "admin_settings" },
  { path: "/admin/integrations", title: "Integrations", guardAction: PERMISSION_ACTIONS.manageUsersRolesOrgSettings, breadcrumbBase: "Admin", drilldownSource: "admin_integrations" },
];

export const PRIMARY_NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/projects", label: "Projects" },
  { to: "/inspections", label: "Inspections" },
  { to: "/issues", label: "Issues" },
  { to: "/exports", label: "Exports" },
  { to: "/sources", label: "Sources" },
  { to: "/templates", label: "Templates" },
  { to: "/rules", label: "Rules" },
  { to: "/admin", label: "Admin" },
];

/**
 * @param {string} pathname
 */
export function findRouteMeta(pathname) {
  const exact = CONTROL_PLANE_ROUTES.find((item) => item.path === pathname);
  if (exact) return exact;
  return (
    CONTROL_PLANE_ROUTES.find((item) =>
      item.path.includes(":")
        ? pathname.startsWith(item.path.split("/:")[0])
        : false
    ) || null
  );
}

