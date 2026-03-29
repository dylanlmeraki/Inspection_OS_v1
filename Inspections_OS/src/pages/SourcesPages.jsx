import { Link, useParams } from "react-router-dom";
import ScreenSemantics from "@/components/ScreenSemantics";
import VerificationBadge from "@/components/ui/VerificationBadge";
import ActionButton from "@/components/ui/ActionButton";
import { useSourceFreshnessQuery } from "@/lib/hooks/useDashboardQueries";
import { localDb } from "@/lib/localDb";
import { GuardedAction, recordPermissionAuditEvent } from "@/lib/permissionGuards.jsx";
import { PERMISSION_ACTIONS } from "@/lib/authRbac";
import { useMockSession } from "@/lib/mockSession.jsx";

export function SourceFormsPage() {
  const { data } = useSourceFreshnessQuery();
  const rows = data?.payload?.rows || [];
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Forms Source Library</h2>
        <p className="subtitle">Source forms with freshness and verification nuance.</p>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Packet Role</th>
              <th>Status</th>
              <th>Freshness</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.title}</td>
                <td>{row.packetRole}</td>
                <td>
                  <VerificationBadge value={row.verificationStatus} />
                </td>
                <td>{row.stale ? "stale" : "fresh"}</td>
                <td>
                  <Link to={`/sources/${row.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScreenSemantics
        whatIsThis="Source forms listing."
        stageState="Source verification and freshness."
        missing="Direct mirror or refreshed verification for stale entries."
        whyItMatters="Source basis quality directly affects manifest defensibility."
        resolvesBy="Verify or supersede source records."
        whatNext="Open source detail and perform guarded source actions."
        sourceReference="Source status vocabulary + freshness fields."
      />
    </div>
  );
}

export function SourceDetailPage() {
  const { sourceRecordId = "" } = useParams();
  const source = localDb.getSourceRecordById(sourceRecordId);
  const { currentUser } = useMockSession();
  if (!source) return <p className="small">Source not found.</p>;

  const projectId = localDb.listProjects()[0]?.id || "proj_unknown";

  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Source Detail</h2>
        <p className="small">
          Source <span className="code">{source.id}</span> | {source.title}
        </p>
        <p className="small">Fingerprint: {source.fingerprintHash}</p>
        <p className="small">
          Verified at: {source.verifiedAt} | Last seen: {source.lastSeenAt}
        </p>
      </div>
      <div className="card">
        <div className="row wrap">
          <GuardedAction
            action={PERMISSION_ACTIONS.supersedeVerifySource}
            scope={{ projectId }}
            render={({ allowed, decision }) => (
              <>
                <ActionButton
                  disabled={!allowed}
                  onClick={() => {
                    localDb.updateSourceRecord(source.id, {
                      verifiedAt: new Date().toISOString(),
                      lastSeenAt: new Date().toISOString(),
                      stale: false,
                      verificationStatus: "verified-direct",
                    });
                    recordPermissionAuditEvent({
                      action: PERMISSION_ACTIONS.supersedeVerifySource,
                      decision,
                      actorId: currentUser.id,
                      projectId,
                      details: { sourceRecordId: source.id, eventType: "verify_source" },
                    });
                  }}
                >
                  Verify Source
                </ActionButton>
                <ActionButton
                  variant="warn"
                  disabled={!allowed}
                  onClick={() => {
                    localDb.updateSourceRecord(source.id, {
                      verificationStatus: "superseded",
                      stale: true,
                    });
                    recordPermissionAuditEvent({
                      action: PERMISSION_ACTIONS.supersedeVerifySource,
                      decision,
                      actorId: currentUser.id,
                      projectId,
                      details: { sourceRecordId: source.id, eventType: "supersede_source" },
                    });
                  }}
                >
                  Supersede Source
                </ActionButton>
              </>
            )}
          />
        </div>
      </div>
      <ScreenSemantics
        whatIsThis="Source record detail and provenance controls."
        stageState={`Status: ${source.verificationStatus}${source.stale ? " (stale)" : ""}`}
        missing={source.stale ? "Fresh verification timestamp." : "No critical freshness gap."}
        whyItMatters="Stale/superseded sources must be visible for defensibility."
        resolvesBy="Run verify/supersede actions with compliance authority."
        whatNext="Re-evaluate rules and regenerate manifest if source changed."
        sourceReference="supersede_verify_source RBAC action."
      />
    </div>
  );
}
