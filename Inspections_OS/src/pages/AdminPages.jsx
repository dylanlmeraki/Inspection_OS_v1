import ScreenSemantics from "@/components/ScreenSemantics";
import ActionButton from "@/components/ui/ActionButton";
import { useAdminOverviewQuery } from "@/lib/hooks/useControlPlaneQueries";
import { GuardedAction, recordPermissionAuditEvent } from "@/lib/permissionGuards.jsx";
import { PERMISSION_ACTIONS } from "@/lib/authRbac";
import { localDb } from "@/lib/localDb";
import { useMockSession } from "@/lib/mockSession.jsx";

function AdminTable({ rows, columns }) {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {columns.map((col) => (
              <td key={`${row.id}:${col.key}`}>{col.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function AdminIndexPage() {
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Admin</h2>
        <p className="subtitle">Organization, user, role, settings, and integration controls.</p>
      </div>
      <ScreenSemantics
        whatIsThis="Admin control-plane index."
        stageState="Organization governance state."
        missing="Explicit permission results on sensitive admin actions."
        whyItMatters="Unauthorized admin changes can invalidate compliance operations."
        resolvesBy="Use guarded actions with permission audit hooks."
        whatNext="Operate org/users/roles/settings/integrations routes."
        sourceReference="manage_users_roles_org_settings RBAC action."
      />
    </div>
  );
}

export function AdminOrganizationsPage() {
  const { data } = useAdminOverviewQuery();
  const rows = data?.organizations || [];
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Organizations</h2>
      </div>
      <div className="card">
        <AdminTable
          rows={rows}
          columns={[
            { key: "name", label: "Name", render: (row) => row.name },
            { key: "tenantKey", label: "Tenant", render: (row) => row.tenantKey },
            { key: "region", label: "Region", render: (row) => row.region },
          ]}
        />
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const { data } = useAdminOverviewQuery();
  const rows = data?.users || [];
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Users</h2>
      </div>
      <div className="card">
        <AdminTable
          rows={rows}
          columns={[
            { key: "name", label: "Name", render: (row) => row.name },
            { key: "email", label: "Email", render: (row) => row.email },
            { key: "orgRole", label: "Org Role", render: (row) => row.orgRole || "none" },
          ]}
        />
      </div>
    </div>
  );
}

export function AdminRolesPage() {
  const { data } = useAdminOverviewQuery();
  const memberships = data?.memberships || [];
  const rows = memberships.map((member) => ({
    ...member,
    id: member.id,
  }));
  const { currentUser } = useMockSession();
  const projectId = localDb.listProjects()[0]?.id || "proj_unknown";
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Roles</h2>
      </div>
      <div className="card">
        <AdminTable
          rows={rows}
          columns={[
            { key: "project", label: "Project", render: (row) => row.projectId },
            { key: "user", label: "User", render: (row) => row.userId },
            { key: "role", label: "Role", render: (row) => row.projectRole },
            { key: "waive", label: "Waive", render: (row) => (row.canWaive ? "yes" : "no") },
            {
              key: "action",
              label: "Action",
              render: (row) => (
                <GuardedAction
                  action={PERMISSION_ACTIONS.manageUsersRolesOrgSettings}
                  scope={{ projectId }}
                  render={({ allowed, decision }) => (
                    <ActionButton
                      disabled={!allowed}
                      onClick={() => {
                        localDb.upsertProjectMembership({
                          ...row,
                          canWaive: !row.canWaive,
                        });
                        recordPermissionAuditEvent({
                          action: PERMISSION_ACTIONS.manageUsersRolesOrgSettings,
                          decision,
                          actorId: currentUser.id,
                          projectId,
                          details: {
                            eventType: "change_project_role",
                            membershipId: row.id,
                            previousCanWaive: row.canWaive,
                            nextCanWaive: !row.canWaive,
                          },
                        });
                      }}
                    >
                      Toggle Waive Authority
                    </ActionButton>
                  )}
                />
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

export function AdminSettingsPage() {
  const { currentUser } = useMockSession();
  const projectId = localDb.listProjects()[0]?.id || "proj_unknown";
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Settings</h2>
      </div>
      <div className="card">
        <GuardedAction
          action={PERMISSION_ACTIONS.manageUsersRolesOrgSettings}
          scope={{ projectId, policy: { allowComplianceScopeSettings: true } }}
          render={({ allowed, decision }) => (
            <ActionButton
              disabled={!allowed}
              onClick={() => {
                recordPermissionAuditEvent({
                  action: PERMISSION_ACTIONS.manageUsersRolesOrgSettings,
                  decision,
                  actorId: currentUser.id,
                  projectId,
                  details: { eventType: "update_org_settings" },
                });
              }}
            >
              Save Org Setting (Mock)
            </ActionButton>
          )}
        />
      </div>
      <ScreenSemantics
        whatIsThis="Organization settings panel."
        stageState="Admin-level configuration state."
        missing="Scoped settings authority for non-owner roles."
        whyItMatters="Org-level changes have wide operational impact."
        resolvesBy="Use RBAC-guarded settings actions and audits."
        whatNext="Review permission audit timeline."
        sourceReference="manage_users_roles_org_settings policy."
      />
    </div>
  );
}

export function AdminIntegrationsPage() {
  const { data } = useAdminOverviewQuery();
  const { currentUser } = useMockSession();
  const rows = data?.integrations || [];
  const projectId = localDb.listProjects()[0]?.id || "proj_unknown";
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Integrations</h2>
      </div>
      <div className="card">
        <AdminTable
          rows={rows}
          columns={[
            { key: "type", label: "Type", render: (row) => row.type },
            { key: "status", label: "Status", render: (row) => row.status },
            { key: "target", label: "Target", render: (row) => row.target },
            {
              key: "action",
              label: "Action",
              render: (row) => (
                <GuardedAction
                  action={PERMISSION_ACTIONS.manageUsersRolesOrgSettings}
                  scope={{ projectId }}
                  render={({ allowed, decision }) => (
                    <ActionButton
                      disabled={!allowed}
                      onClick={() => {
                        localDb.updateAdminIntegration(row.id, { enabled: !row.enabled });
                        recordPermissionAuditEvent({
                          action: PERMISSION_ACTIONS.manageUsersRolesOrgSettings,
                          decision,
                          actorId: currentUser.id,
                          projectId,
                          details: {
                            eventType: "update_integration",
                            integrationId: row.id,
                            enabled: !row.enabled,
                          },
                        });
                      }}
                    >
                      {row.enabled ? "Disable" : "Enable"}
                    </ActionButton>
                  )}
                />
              ),
            },
          ]}
        />
      </div>
      <ScreenSemantics
        whatIsThis="Integration management panel."
        stageState="Integration enabled/disabled states."
        missing="Permission-backed change history."
        whyItMatters="Integration side effects may change export/audit behavior."
        resolvesBy="Use guarded updates and audit hooks."
        whatNext="Validate integration state in audit events."
        sourceReference="manage_users_roles_org_settings + integration records."
      />
    </div>
  );
}
