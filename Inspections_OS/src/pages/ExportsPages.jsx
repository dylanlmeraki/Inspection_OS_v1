import { Link, useParams, useSearchParams } from "react-router-dom";
import ScreenSemantics from "@/components/ScreenSemantics";
import ManifestReferenceCard from "@/components/ui/ManifestReferenceCard";
import AmbiguityNoteBlock from "@/components/ui/AmbiguityNoteBlock";
import ActionButton from "@/components/ui/ActionButton";
import { useExportCenterQuery } from "@/lib/hooks/useDashboardQueries";
import { GuardedAction, recordPermissionAuditEvent } from "@/lib/permissionGuards.jsx";
import { PERMISSION_ACTIONS } from "@/lib/authRbac";
import { useMockSession } from "@/lib/mockSession.jsx";
import { localDb } from "@/lib/localDb";

export function ExportsManifestsPage() {
  const { data } = useExportCenterQuery();
  const manifests = data?.payload?.manifests || [];
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Manifest Index</h2>
        <p className="subtitle">Manifest rows with basis nuance and waiver disclosure.</p>
      </div>
      <div className="grid">
        {manifests.map((manifest) => (
          <div className="card" key={manifest.id}>
            <p className="small">
              Manifest <span className="code">{manifest.id}</span> | Stage: {manifest.stageCode}
            </p>
            <p className="small">Basis: {manifest.basisStatuses.join(", ") || "verified-direct"}</p>
            <p className="small">
              Waived exceptions: {manifest.waivedExceptions.map((row) => row.code).join(", ") || "none"}
            </p>
          </div>
        ))}
      </div>
      <ScreenSemantics
        whatIsThis="Verification manifest list."
        stageState="Manifest rows by export."
        missing="Nuance disclosures and waiver reasons."
        whyItMatters="Manifest is the defensibility anchor for exports."
        resolvesBy="Ensure source entries and exception disclosures are present."
        whatNext="Open export detail or share action."
        sourceReference="verification_manifest schema."
      />
    </div>
  );
}

export function ExportDetailPage() {
  const { exportId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const projectIdFromQuery = searchParams.get("projectId");
  const { data } = useExportCenterQuery();
  const { currentUser } = useMockSession();
  const exportRow = (data?.payload?.exports || []).find((item) => item.id === exportId);
  const manifest = localDb.getManifest(exportRow?.manifestId || "");
  const sourceEntries = manifest ? localDb.listManifestSourceEntries(manifest.id) : [];
  const projectId = projectIdFromQuery || localDb.getRun(exportRow?.workflowRunId || "")?.projectId || "";

  if (!exportRow) return <p className="small">Export not found.</p>;

  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Export Detail</h2>
        <p className="small">
          Export <span className="code">{exportRow.id}</span> | Status: {exportRow.status}
        </p>
      </div>
      {manifest ? (
        <ManifestReferenceCard
          exportId={exportRow.id}
          manifestId={manifest.id}
          ruleSnapshotId={manifest.ruleSnapshotId}
          sourceEntryCount={sourceEntries.length}
          evidenceCount={manifest.evidenceInventory?.attachmentCount || 0}
          exceptionCount={(manifest.exceptions || []).length}
          waivedCount={(manifest.exceptions || []).filter((item) => item.waived).length}
          generatedBy="local_user"
          generatedAt={manifest.createdAt}
        />
      ) : (
        <p className="small">Manifest missing for export.</p>
      )}
      <div className="card">
        <div className="row wrap">
          <GuardedAction
            action={PERMISSION_ACTIONS.triggerExternalShareExport}
            scope={{ projectId }}
            render={({ allowed, decision }) => (
              <ActionButton
                disabled={!allowed}
                onClick={() => {
                  localDb.updateExport(exportRow.id, { status: "shared" });
                  recordPermissionAuditEvent({
                    action: PERMISSION_ACTIONS.triggerExternalShareExport,
                    decision,
                    actorId: currentUser.id,
                    projectId: projectId || "proj_unknown",
                    details: {
                      exportId: exportRow.id,
                      eventType: "share_export_externally",
                    },
                  });
                }}
              >
                Share Export Externally
              </ActionButton>
            )}
          />
          <ActionButton
            onClick={() => {
              localDb.updateExport(exportRow.id, { status: "archived" });
            }}
          >
            Archive Export
          </ActionButton>
          <Link className="btn" to="/exports/manifests">
            View Manifests
          </Link>
        </div>
      </div>
      <AmbiguityNoteBlock
        title="Indirect or inferred basis disclosure"
        reason="Manifest may include verified-indirect/inferred-direct entries."
        sourceRule="Basis disclosure policy."
        fixAction="Keep nuance visible in export summary and manifest."
      />
      <ScreenSemantics
        whatIsThis="Export detail and manifest linkage."
        stageState={`Export status: ${exportRow.status}`}
        missing={manifest ? "No critical linkage gaps." : "Manifest linkage missing."}
        whyItMatters="Export packets must trace exact rule snapshot and source entries."
        resolvesBy="Maintain manifest/source-entry linkage and exception disclosures."
        whatNext="Share or archive based on role permissions."
        sourceReference="trigger_external_share_export + manifest schema."
      />
    </div>
  );
}
