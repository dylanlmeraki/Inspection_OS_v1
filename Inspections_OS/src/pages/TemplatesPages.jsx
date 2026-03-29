import { Link, useParams } from "react-router-dom";
import ScreenSemantics from "@/components/ScreenSemantics";
import ActionButton from "@/components/ui/ActionButton";
import {
  useTemplateFamiliesQuery,
  useTemplateFamilyDetailQuery,
  useTemplateVersionDetailQuery,
} from "@/lib/hooks/useControlPlaneQueries";
import { GuardedAction, recordPermissionAuditEvent } from "@/lib/permissionGuards.jsx";
import { PERMISSION_ACTIONS } from "@/lib/authRbac";
import { useMockSession } from "@/lib/mockSession.jsx";
import { localDb } from "@/lib/localDb";

export function TemplatesIndexPage() {
  const { data: families = [] } = useTemplateFamiliesQuery();
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Templates</h2>
        <p className="subtitle">Template families and version governance surfaces.</p>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Family</th>
              <th>Program</th>
              <th>Status</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {families.map((family) => (
              <tr key={family.id}>
                <td>{family.name}</td>
                <td>{family.programKey}</td>
                <td>{family.status}</td>
                <td>
                  <Link to={`/templates/${family.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScreenSemantics
        whatIsThis="Template family index."
        stageState="Draft/published template governance."
        missing="Explicit publish action audit for new versions."
        whyItMatters="Template drift can break wizard/gate input contracts."
        resolvesBy="Publish versions through guarded actions."
        whatNext="Review family and version detail pages."
        sourceReference="edit_templates RBAC policy."
      />
    </div>
  );
}

export function TemplateFamilyDetailPage() {
  const { templateFamilyId = "" } = useParams();
  const { data } = useTemplateFamilyDetailQuery(templateFamilyId);
  if (!data) return <p className="small">Template family not found.</p>;

  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">{data.family.name}</h2>
        <p className="small">
          Program: {data.family.programKey} | Status: {data.family.status}
        </p>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Version</th>
              <th>Status</th>
              <th>Published At</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {data.versions.map((version) => (
              <tr key={version.id}>
                <td>{version.version}</td>
                <td>{version.status}</td>
                <td>{version.publishedAt || "n/a"}</td>
                <td>
                  <Link to={`/templates/${templateFamilyId}/versions/${version.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScreenSemantics
        whatIsThis="Template family detail."
        stageState="Versioned family lifecycle."
        missing="Version-level publish governance records."
        whyItMatters="Family/version changes affect wizard output structure."
        resolvesBy="Use publish action on version detail."
        whatNext="Publish new compliant version."
        sourceReference="Template family/version records."
      />
    </div>
  );
}

export function TemplateVersionDetailPage() {
  const { templateVersionId = "" } = useParams();
  const { data: version } = useTemplateVersionDetailQuery(templateVersionId);
  const { currentUser } = useMockSession();
  if (!version) return <p className="small">Template version not found.</p>;
  const projectId = localDb.listProjects()[0]?.id || "proj_unknown";

  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Template Version Detail</h2>
        <p className="small">
          Version: {version.version} | Status: {version.status}
        </p>
        <p className="small">{version.changelog}</p>
      </div>
      <div className="card">
        <GuardedAction
          action={PERMISSION_ACTIONS.editTemplates}
          scope={{ projectId, policy: { allowOperationsTemplatePublish: false } }}
          render={({ allowed, decision }) => (
            <ActionButton
              variant="primary"
              disabled={!allowed}
              onClick={() => {
                const published = localDb.createTemplateVersion({
                  ...version,
                  id: `${version.id}_pub`,
                  status: "published",
                  publishedAt: new Date().toISOString(),
                });
                recordPermissionAuditEvent({
                  action: PERMISSION_ACTIONS.editTemplates,
                  decision,
                  actorId: currentUser.id,
                  projectId,
                  details: {
                    eventType: "publish_template_version",
                    fromVersionId: version.id,
                    publishedVersionId: published.id,
                  },
                });
              }}
            >
              Publish Template Version
            </ActionButton>
          )}
        />
      </div>
      <ScreenSemantics
        whatIsThis="Template version governance surface."
        stageState={`Template status: ${version.status}`}
        missing="Publish authorization and audit event."
        whyItMatters="Published template versions define downstream wizard contract shapes."
        resolvesBy="Publish through guarded action."
        whatNext="Refresh template family listings."
        sourceReference="publish template version audit hook."
      />
    </div>
  );
}
