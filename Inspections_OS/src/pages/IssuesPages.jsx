import { Link, useParams } from "react-router-dom";
import ScreenSemantics from "@/components/ScreenSemantics";
import EvidenceTray from "@/components/ui/EvidenceTray";
import ActionButton from "@/components/ui/ActionButton";
import {
  useIssueDetailQuery,
  useIssuesListQuery,
  useIssueStatusMutation,
  useOverdueIssuesQuery,
  useVerificationIssuesQuery,
} from "@/lib/hooks/useControlPlaneQueries";
import { GuardedAction, recordPermissionAuditEvent } from "@/lib/permissionGuards.jsx";
import { PERMISSION_ACTIONS } from "@/lib/authRbac";
import { useMockSession } from "@/lib/mockSession.jsx";

function IssuesTable({ rows }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Issue</th>
          <th>Status</th>
          <th>Owner</th>
          <th>Due</th>
          <th>Run</th>
          <th>Stage Link</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((issue) => (
          <tr key={issue.id}>
            <td>
              <Link to={`/issues/${issue.id}`}>{issue.code || issue.id}</Link>
            </td>
            <td>{issue.normalizedStatus}</td>
            <td>{issue.owner || "unassigned"}</td>
            <td>{issue.dueAt || "none"}</td>
            <td>{issue.runId || "n/a"}</td>
            <td>{issue.runId ? <Link to={`/inspections/${issue.runId}`}>Run detail</Link> : "n/a"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function IssuesListPage() {
  const { data: rows = [] } = useIssuesListQuery();
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Issues</h2>
        <p className="subtitle">All issue records with run and stage linkage.</p>
      </div>
      <div className="card">
        <IssuesTable rows={rows} />
      </div>
      <ScreenSemantics
        whatIsThis="Issue management index."
        stageState="Issue lifecycle statuses."
        missing="Verification evidence on closeout paths."
        whyItMatters="Unverified issue closure breaks defensibility."
        resolvesBy="Capture evidence and close with authorized role."
        whatNext="Open issue detail for verification workflow."
        sourceReference="Issue status vocabulary + closeout policy."
      />
    </div>
  );
}

export function IssuesOverduePage() {
  const { data: rows = [] } = useOverdueIssuesQuery();
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Overdue Issues</h2>
      </div>
      <div className="card">
        <IssuesTable rows={rows} />
      </div>
      <ScreenSemantics
        whatIsThis="Overdue issue queue."
        stageState="Overdue issues requiring escalation."
        missing="Owner assignment and closeout evidence."
        whyItMatters="Overdue unresolved issues block operational readiness."
        resolvesBy="Assign owner and complete verification closeout."
        whatNext="Advance issue to in_verification then closed."
        sourceReference="due-state + issue lifecycle policy."
      />
    </div>
  );
}

export function IssuesVerificationPage() {
  const { data: rows = [] } = useVerificationIssuesQuery();
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Verification Needed Issues</h2>
      </div>
      <div className="card">
        <IssuesTable rows={rows} />
      </div>
      <ScreenSemantics
        whatIsThis="Issue verification queue."
        stageState="Open and in_verification issue states."
        missing="Verification evidence and reviewer confirmation."
        whyItMatters="Evidence-backed closure is required for compliance defensibility."
        resolvesBy="Close issue through verified evidence path."
        whatNext="Open issue detail and perform closeout action."
        sourceReference="close_issue_with_verification RBAC action."
      />
    </div>
  );
}

export function IssueDetailPage() {
  const { issueId = "" } = useParams();
  const { currentUser } = useMockSession();
  const { data: issue } = useIssueDetailQuery(issueId);
  const mutation = useIssueStatusMutation();

  if (!issue) return <p className="small">Issue not found.</p>;
  const runId = issue.runId || null;

  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Issue Detail</h2>
        <p className="small">
          Issue: {issue.id} | Code: {issue.code || "n/a"} | Status: {issue.normalizedStatus}
        </p>
      </div>
      <div className="card">
        <div className="label">Closeout evidence</div>
        <EvidenceTray
          attachments={issue.evidenceAttachments || []}
          signatures={issue.signatures || []}
          linkedForms={issue.linkedForms || []}
          sourceReferences={
            issue.sourceReferences || [
              {
                id: "source_context",
                label: "Issue source context",
                verificationStatus: "verified-indirect",
              },
            ]
          }
          missingMarkers={issue.closeoutMissing || []}
        />
      </div>
      <div className="card">
        <div className="row wrap">
          <GuardedAction
            action={PERMISSION_ACTIONS.closeIssueWithVerification}
            scope={{ projectId: issue.projectId, policy: { allowInspectorIssueClose: false } }}
            render={({ allowed, decision }) => (
              <ActionButton
                variant="primary"
                disabled={!allowed}
                onClick={() => {
                  mutation.mutate({ issueId: issue.id, status: "closed" });
                  recordPermissionAuditEvent({
                    action: PERMISSION_ACTIONS.closeIssueWithVerification,
                    decision,
                    actorId: currentUser.id,
                    projectId: issue.projectId,
                    details: { issueId: issue.id, nextStatus: "closed" },
                  });
                }}
              >
                Close Issue With Verification
              </ActionButton>
            )}
          />
          {runId ? (
            <Link className="btn" to={`/inspections/${runId}`}>
              Open Originating Run
            </Link>
          ) : null}
        </div>
      </div>
      <ScreenSemantics
        whatIsThis="Issue detail with closeout evidence."
        stageState={`Issue status: ${issue.normalizedStatus}`}
        missing={(issue.closeoutMissing || []).join(", ") || "No missing closeout evidence markers."}
        whyItMatters="Issue closure must be evidence-backed to maintain compliance traceability."
        resolvesBy="Attach evidence/signature and use closeout action."
        whatNext="Run-level review and project audit update."
        sourceReference="Issue closeout verification policy."
      />
    </div>
  );
}
