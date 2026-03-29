import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import ControlPlaneLayout from "@/components/ControlPlaneLayout";
import { GuardedRoute } from "@/lib/permissionGuards.jsx";
import { PERMISSION_ACTIONS } from "@/lib/authRbac";
import {
  loadExportCenterRoute,
  prefetchExportCenterRoute,
  prefetchExportRuntime,
} from "@/lib/exportRuntimeLoader";

const WizardPage = lazy(() => import("@/pages/WizardPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ExportCenterPage = lazy(() => loadExportCenterRoute());
const SourceLibraryPage = lazy(() => import("@/pages/SourceLibraryPage"));

const lazyNamed = (importer, exportName) =>
  lazy(() => importer().then((mod) => ({ default: mod[exportName] })));

const importDashboardViews = () => import("@/pages/DashboardViews");
const DashboardPortfolioPage = lazyNamed(importDashboardViews, "DashboardPortfolioPage");
const DashboardOperationsPage = lazyNamed(importDashboardViews, "DashboardOperationsPage");
const DashboardCompliancePage = lazyNamed(importDashboardViews, "DashboardCompliancePage");
const DashboardMyWorkPage = lazyNamed(importDashboardViews, "DashboardMyWorkPage");

const importProjectPages = () => import("@/pages/ProjectPages");
const ProjectsIndexPage = lazyNamed(importProjectPages, "ProjectsIndexPage");
const ProjectWorkspaceLandingPage = lazyNamed(importProjectPages, "ProjectWorkspaceLandingPage");
const ProjectOverviewPage = lazyNamed(importProjectPages, "ProjectOverviewPage");
const ProjectProgramsPage = lazyNamed(importProjectPages, "ProjectProgramsPage");
const ProjectInspectionsPage = lazyNamed(importProjectPages, "ProjectInspectionsPage");
const ProjectIssuesPage = lazyNamed(importProjectPages, "ProjectIssuesPage");
const ProjectDocumentsPage = lazyNamed(importProjectPages, "ProjectDocumentsPage");
const ProjectExportsPage = lazyNamed(importProjectPages, "ProjectExportsPage");
const ProjectTeamPage = lazyNamed(importProjectPages, "ProjectTeamPage");
const ProjectAuditPage = lazyNamed(importProjectPages, "ProjectAuditPage");

const importInspectionsPages = () => import("@/pages/InspectionsPages");
const InspectionsListPage = lazyNamed(importInspectionsPages, "InspectionsListPage");
const InspectionReviewQueuePage = lazyNamed(importInspectionsPages, "InspectionReviewQueuePage");
const InspectionRecurringPage = lazyNamed(importInspectionsPages, "InspectionRecurringPage");
const InspectionCalendarPage = lazyNamed(importInspectionsPages, "InspectionCalendarPage");
const InspectionRunDetailPage = lazyNamed(importInspectionsPages, "InspectionRunDetailPage");

const importIssuesPages = () => import("@/pages/IssuesPages");
const IssuesListPage = lazyNamed(importIssuesPages, "IssuesListPage");
const IssuesOverduePage = lazyNamed(importIssuesPages, "IssuesOverduePage");
const IssuesVerificationPage = lazyNamed(importIssuesPages, "IssuesVerificationPage");
const IssueDetailPage = lazyNamed(importIssuesPages, "IssueDetailPage");

const importSourcesPages = () => import("@/pages/SourcesPages");
const SourceFormsPage = lazyNamed(importSourcesPages, "SourceFormsPage");
const SourceDetailPage = lazyNamed(importSourcesPages, "SourceDetailPage");

const importTemplatesPages = () => import("@/pages/TemplatesPages");
const TemplatesIndexPage = lazyNamed(importTemplatesPages, "TemplatesIndexPage");
const TemplateFamilyDetailPage = lazyNamed(importTemplatesPages, "TemplateFamilyDetailPage");
const TemplateVersionDetailPage = lazyNamed(importTemplatesPages, "TemplateVersionDetailPage");

const importRulesPages = () => import("@/pages/RulesPages");
const RulesIndexPage = lazyNamed(importRulesPages, "RulesIndexPage");
const RulesPacketPage = lazyNamed(importRulesPages, "RulesPacketPage");
const RulesCadencePage = lazyNamed(importRulesPages, "RulesCadencePage");
const RulesSnapshotsPage = lazyNamed(importRulesPages, "RulesSnapshotsPage");
const RulesPreviewsPage = lazyNamed(importRulesPages, "RulesPreviewsPage");

const importAdminPages = () => import("@/pages/AdminPages");
const AdminIndexPage = lazyNamed(importAdminPages, "AdminIndexPage");
const AdminOrganizationsPage = lazyNamed(importAdminPages, "AdminOrganizationsPage");
const AdminUsersPage = lazyNamed(importAdminPages, "AdminUsersPage");
const AdminRolesPage = lazyNamed(importAdminPages, "AdminRolesPage");
const AdminSettingsPage = lazyNamed(importAdminPages, "AdminSettingsPage");
const AdminIntegrationsPage = lazyNamed(importAdminPages, "AdminIntegrationsPage");

const importExportsPages = () => import("@/pages/ExportsPages");
const ExportsManifestsPage = lazyNamed(importExportsPages, "ExportsManifestsPage");
const ExportDetailPage = lazyNamed(importExportsPages, "ExportDetailPage");

function ProjectScopedRoute({ action, children }) {
  const { projectId = "" } = useParams();
  return (
    <GuardedRoute action={action} scope={{ projectId }}>
      {children}
    </GuardedRoute>
  );
}

function RunScopedRoute({ action, children }) {
  const { runId = "" } = useParams();
  return (
    <GuardedRoute action={action} scope={{ runId }}>
      {children}
    </GuardedRoute>
  );
}

function RouteFallback() {
  return <div className="card">Loading…</div>;
}

export default function App() {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const runtimeWindow = window;

    if (typeof runtimeWindow.requestIdleCallback === "function") {
      const idleId = runtimeWindow.requestIdleCallback(() => {
        prefetchExportCenterRoute();
        prefetchExportRuntime();
      });
      return () => {
        if (typeof runtimeWindow.cancelIdleCallback === "function") {
          runtimeWindow.cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = setTimeout(() => {
      prefetchExportCenterRoute();
      prefetchExportRuntime();
    }, 450);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/" element={<ControlPlaneLayout />}>
          <Route
            path="/dashboard"
            element={
              <GuardedRoute
                action={PERMISSION_ACTIONS.viewDashboard}
                scope={{ dashboardSection: "root" }}
              >
                <DashboardPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/dashboard/portfolio"
            element={
              <GuardedRoute
                action={PERMISSION_ACTIONS.viewDashboard}
                scope={{ dashboardSection: "portfolio" }}
              >
                <DashboardPortfolioPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/dashboard/operations"
            element={
              <GuardedRoute
                action={PERMISSION_ACTIONS.viewDashboard}
                scope={{ dashboardSection: "operations" }}
              >
                <DashboardOperationsPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/dashboard/compliance"
            element={
              <GuardedRoute
                action={PERMISSION_ACTIONS.viewDashboard}
                scope={{ dashboardSection: "compliance" }}
              >
                <DashboardCompliancePage />
              </GuardedRoute>
            }
          />
          <Route
            path="/dashboard/my-work"
            element={
              <GuardedRoute
                action={PERMISSION_ACTIONS.viewDashboard}
                scope={{ dashboardSection: "my_work" }}
              >
                <DashboardMyWorkPage />
              </GuardedRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.viewProjectWorkspace}>
                <ProjectsIndexPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <ProjectScopedRoute action={PERMISSION_ACTIONS.viewProjectWorkspace}>
                <ProjectWorkspaceLandingPage />
              </ProjectScopedRoute>
            }
          />
          <Route
            path="/projects/:projectId/overview"
            element={
              <ProjectScopedRoute action={PERMISSION_ACTIONS.viewProjectWorkspace}>
                <ProjectOverviewPage />
              </ProjectScopedRoute>
            }
          />
          <Route
            path="/projects/:projectId/programs"
            element={
              <ProjectScopedRoute action={PERMISSION_ACTIONS.viewProjectWorkspace}>
                <ProjectProgramsPage />
              </ProjectScopedRoute>
            }
          />
          <Route
            path="/projects/:projectId/inspections"
            element={
              <ProjectScopedRoute action={PERMISSION_ACTIONS.viewProjectWorkspace}>
                <ProjectInspectionsPage />
              </ProjectScopedRoute>
            }
          />
          <Route
            path="/projects/:projectId/issues"
            element={
              <ProjectScopedRoute action={PERMISSION_ACTIONS.viewProjectWorkspace}>
                <ProjectIssuesPage />
              </ProjectScopedRoute>
            }
          />
          <Route
            path="/projects/:projectId/documents"
            element={
              <ProjectScopedRoute action={PERMISSION_ACTIONS.viewProjectWorkspace}>
                <ProjectDocumentsPage />
              </ProjectScopedRoute>
            }
          />
          <Route
            path="/projects/:projectId/exports"
            element={
              <ProjectScopedRoute action={PERMISSION_ACTIONS.viewProjectWorkspace}>
                <ProjectExportsPage />
              </ProjectScopedRoute>
            }
          />
          <Route
            path="/projects/:projectId/team"
            element={
              <ProjectScopedRoute action={PERMISSION_ACTIONS.viewProjectWorkspace}>
                <ProjectTeamPage />
              </ProjectScopedRoute>
            }
          />
          <Route
            path="/projects/:projectId/audit"
            element={
              <ProjectScopedRoute action={PERMISSION_ACTIONS.viewProjectWorkspace}>
                <ProjectAuditPage />
              </ProjectScopedRoute>
            }
          />

          <Route
            path="/inspections"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.submitInspectionRun}>
                <InspectionsListPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/inspections/review-queue"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.approveReturnRun}>
                <InspectionReviewQueuePage />
              </GuardedRoute>
            }
          />
          <Route
            path="/inspections/recurring"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.submitInspectionRun}>
                <InspectionRecurringPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/inspections/calendar"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.submitInspectionRun}>
                <InspectionCalendarPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/inspections/:runId"
            element={
              <RunScopedRoute action={PERMISSION_ACTIONS.viewProjectWorkspace}>
                <InspectionRunDetailPage />
              </RunScopedRoute>
            }
          />

          <Route
            path="/issues"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.createEditIssue}>
                <IssuesListPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/issues/overdue"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.createEditIssue}>
                <IssuesOverduePage />
              </GuardedRoute>
            }
          />
          <Route
            path="/issues/verification"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.closeIssueWithVerification}>
                <IssuesVerificationPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/issues/:issueId"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.createEditIssue}>
                <IssueDetailPage />
              </GuardedRoute>
            }
          />

          <Route
            path="/exports"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.triggerExternalShareExport}>
                <ExportCenterPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/exports/manifests"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.triggerExternalShareExport}>
                <ExportsManifestsPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/exports/:exportId"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.triggerExternalShareExport}>
                <ExportDetailPage />
              </GuardedRoute>
            }
          />

          <Route
            path="/sources"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.viewProjectWorkspace}>
                <SourceLibraryPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/sources/forms"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.viewProjectWorkspace}>
                <SourceFormsPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/sources/:sourceRecordId"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.viewProjectWorkspace}>
                <SourceDetailPage />
              </GuardedRoute>
            }
          />

          <Route
            path="/templates"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.editTemplates}>
                <TemplatesIndexPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/templates/families"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.editTemplates}>
                <TemplatesIndexPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/templates/:templateFamilyId"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.editTemplates}>
                <TemplateFamilyDetailPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/templates/:templateFamilyId/versions/:templateVersionId"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.editTemplates}>
                <TemplateVersionDetailPage />
              </GuardedRoute>
            }
          />

          <Route
            path="/rules"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.editPacketCadenceRules}>
                <RulesIndexPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/rules/packet"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.editPacketCadenceRules}>
                <RulesPacketPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/rules/cadence"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.editPacketCadenceRules}>
                <RulesCadencePage />
              </GuardedRoute>
            }
          />
          <Route
            path="/rules/snapshots"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.editPacketCadenceRules}>
                <RulesSnapshotsPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/rules/previews"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.editPacketCadenceRules}>
                <RulesPreviewsPage />
              </GuardedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.manageUsersRolesOrgSettings}>
                <AdminIndexPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/admin/organizations"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.manageUsersRolesOrgSettings}>
                <AdminOrganizationsPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.manageUsersRolesOrgSettings}>
                <AdminUsersPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.manageUsersRolesOrgSettings}>
                <AdminRolesPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.manageUsersRolesOrgSettings}>
                <AdminSettingsPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/admin/integrations"
            element={
              <GuardedRoute action={PERMISSION_ACTIONS.manageUsersRolesOrgSettings}>
                <AdminIntegrationsPage />
              </GuardedRoute>
            }
          />
        </Route>

        <Route path="/wizard" element={<WizardPage />} />
      </Routes>
    </Suspense>
  );
}
