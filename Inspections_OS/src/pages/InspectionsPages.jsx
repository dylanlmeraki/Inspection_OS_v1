import { Link, useParams, useSearchParams } from "react-router-dom";
import ScreenSemantics from "@/components/ScreenSemantics";
import ActionButton from "@/components/ui/ActionButton";
import BlockerCard from "@/components/ui/BlockerCard";
import DueStateChip from "@/components/ui/DueStateChip";
import RequirementChecklist from "@/components/ui/RequirementChecklist";
import AmbiguityNoteBlock from "@/components/ui/AmbiguityNoteBlock";
import {
  useInspectionsListQuery,
  useReviewQueueQuery,
  useRecurringCadenceQuery,
  useRunTransitionMutation,
} from "@/lib/hooks/useControlPlaneQueries";
import { localDb } from "@/lib/localDb";
import { GuardedAction, recordPermissionAuditEvent } from "@/lib/permissionGuards.jsx";
import { PERMISSION_ACTIONS } from "@/lib/authRbac";
import { useMockSession } from "@/lib/mockSession.jsx";

function getRunBlockers(runId) {
  const evaluation = localDb.listStageGateEvaluations().find((item) => item.runId === runId);
  return evaluation?.evaluation?.blockers || [];
}

function getRunRequirements(runId) {
  const evaluation = localDb.listStageGateEvaluations().find((item) => item.runId === runId);
  return evaluation?.evaluation?.requirements || [];
}

export function InspectionsListPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || undefined;
  const stageCode = searchParams.get("stage") || undefined;
  const due = searchParams.get("due") || undefined;
  const { data: runs = [] } = useInspectionsListQuery({ status, stageCode });
  const rows = due ? runs.filter((item) => item.dueState === due) : runs;

  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Inspections</h2>
        <p className="subtitle">All workflow runs with status, stage, due, and review linkage.</p>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Run</th>
              <th>Project</th>
              <th>Status</th>
              <th>Stage</th>
              <th>Due</th>
              <th>Queue</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((run) => (
              <tr key={run.id}>
                <td>{run.id}</td>
                <td>
                  <Link to={`/projects/${run.projectId}/inspections`}>{run.projectName}</Link>
                </td>
                <td>{run.normalizedStatus}</td>
                <td>{run.stageCode}</td>
                <td>
                  <DueStateChip state={run.dueState} />
                </td>
                <td>
                  {["submitted", "under_review", "returned", "blocked"].includes(run.normalizedStatus)
                    ? "review-queue"
                    : "field"}
                </td>
                <td>
                  <Link to={`/inspections/${run.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScreenSemantics
        whatIsThis="Operations run list."
        stageState="Run status + stage status + due state."
        missing="Rows blocked by unmet requirements."
        whyItMatters="Run transitions control stage progression and export eligibility."
        resolvesBy="Open run detail and complete transition actions."
        whatNext="Submit or route to review queue."
        sourceReference="workflow_run + stage evaluation."
      />
    </div>
  );
}

export function InspectionReviewQueuePage() {
  const { data: rows = [] } = useReviewQueueQuery();
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Inspection Review Queue</h2>
        <p className="subtitle">Submitted, under-review, returned, and blocked runs.</p>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Run</th>
              <th>Status</th>
              <th>Stage</th>
              <th>Due</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((run) => (
              <tr key={run.id}>
                <td>{run.id}</td>
                <td>{run.normalizedStatus}</td>
                <td>{run.stageCode}</td>
                <td>
                  <DueStateChip state={run.dueState} />
                </td>
                <td>
                  <Link to={`/inspections/${run.id}`}>Review</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScreenSemantics
        whatIsThis="Reviewer queue."
        stageState="Runs awaiting reviewer action."
        missing="Required artifacts or unresolved blockers."
        whyItMatters="Approvals without blocker awareness are non-defensible."
        resolvesBy="Open run detail and use blocker-aware transitions."
        whatNext="Approve, return, or request remediation."
        sourceReference="approve_return_run RBAC policy."
      />
    </div>
  );
}

export function InspectionRecurringPage() {
  const { data: rows = [] } = useRecurringCadenceQuery();
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Recurring Cadence</h2>
        <p className="subtitle">Cadence-grouped inspections and related runs.</p>
      </div>
      <div className="grid">
        {rows.map((row) => (
          <div key={row.id} className="card">
            <strong>{row.id}</strong>
            <p className="small">
              Program: {row.programKey} | Stage: {row.stageCode} | cadence: {row.cadence}
            </p>
            <p className="small">Interval days: {row.intervalDays}</p>
            <p className="small">Related runs: {row.relatedRuns.length}</p>
          </div>
        ))}
      </div>
      <ScreenSemantics
        whatIsThis="Recurring inspection cadence view."
        stageState="Recurring schedule grouped by rule."
        missing="Missed cadence and overdue follow-up runs."
        whyItMatters="Cadence compliance is part of inspection defensibility."
        resolvesBy="Create/submit follow-up runs."
        whatNext="Review overdue and blocked recurring runs."
        sourceReference="cadence rules."
      />
    </div>
  );
}

export function InspectionCalendarPage() {
  const { data: runs = [] } = useInspectionsListQuery();
  const grouped = runs.reduce((acc, run) => {
    const key = run.dueAt ? run.dueAt.slice(0, 10) : "no_due_date";
    if (!acc[key]) acc[key] = [];
    acc[key].push(run);
    return acc;
  }, {});
  const entries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Inspection Calendar</h2>
        <p className="subtitle">Date-bucketed inspection runs for field planning.</p>
      </div>
      <div className="card">
        {entries.map(([day, rows]) => (
          <div key={day} className="list-item">
            <strong>{day}</strong>
            <p className="small">{rows.length} runs</p>
          </div>
        ))}
      </div>
      <ScreenSemantics
        whatIsThis="Calendar-oriented run scheduling surface."
        stageState="Scheduled vs no due date coverage."
        missing="Runs without valid due date or overdue scheduling."
        whyItMatters="Scheduling controls timely stage progression."
        resolvesBy="Assign due dates and route overdue runs."
        whatNext="Open run detail for queue action."
        sourceReference="Due-state vocabulary."
      />
    </div>
  );
}

export function InspectionRunDetailPage() {
  const { runId = "" } = useParams();
  const { data: runs = [] } = useInspectionsListQuery();
  const run = runs.find((item) => item.id === runId) || localDb.getRun(runId);
  const blockers = getRunBlockers(runId);
  const requirements = getRunRequirements(runId);
  const transitionMutation = useRunTransitionMutation();
  const { currentUser } = useMockSession();

  if (!run) {
    return <p className="small">Run not found.</p>;
  }

  const transition = (status, action, decision) => {
    transitionMutation.mutate({
      runId,
      status,
      actorId: currentUser.id,
      action,
      projectId: run.projectId,
    });
    recordPermissionAuditEvent({
      action,
      actorId: currentUser.id,
      projectId: run.projectId,
      decision,
      details: { runId, nextStatus: status },
    });
  };

  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Inspection Run Detail</h2>
        <p className="small">
          Run: {run.id} | Project: {run.projectName} | Stage: {run.stageCode}
        </p>
      </div>
      <div className="grid grid-2">
        <div className="card">
        <div className="label">Transition controls</div>
        <div className="row wrap">
            <GuardedAction
              action={PERMISSION_ACTIONS.submitInspectionRun}
              scope={{ projectId: run.projectId }}
              render={({ allowed, decision }) => (
                <ActionButton
                  disabled={!allowed}
                  onClick={() =>
                    transition("submitted", PERMISSION_ACTIONS.submitInspectionRun, decision)
                  }
                >
                  Submit
                </ActionButton>
              )}
            />
            <GuardedAction
              action={PERMISSION_ACTIONS.approveReturnRun}
              scope={{ projectId: run.projectId }}
              render={({ allowed, decision }) => (
                <>
                  <ActionButton
                    disabled={!allowed}
                    onClick={() =>
                      transition("returned", PERMISSION_ACTIONS.approveReturnRun, decision)
                    }
                  >
                    Return
                  </ActionButton>
                  <ActionButton
                    variant="primary"
                    disabled={!allowed || blockers.length > 0}
                    onClick={() =>
                      transition("approved", PERMISSION_ACTIONS.approveReturnRun, decision)
                    }
                  >
                    Approve
                  </ActionButton>
                </>
              )}
            />
            <GuardedAction
              action={PERMISSION_ACTIONS.waiveBlocker}
              scope={{
                projectId: run.projectId,
                policy: { allowProjectManagerWaive: true },
              }}
              render={({ allowed, decision }) => (
                <ActionButton
                  variant="warn"
                  disabled={!allowed || blockers.length === 0}
                  onClick={() => {
                    recordPermissionAuditEvent({
                      action: PERMISSION_ACTIONS.waiveBlocker,
                      actorId: currentUser.id,
                      projectId: run.projectId,
                      decision,
                      details: {
                        runId,
                        blockerCodes: blockers.map((item) => item.code),
                        eventType: "waive_blocker",
                      },
                    });
                  }}
                >
                  Waive Blocker
                </ActionButton>
              )}
            />
          </div>
        </div>
        <div className="card">
          <div className="label">Requirement checklist</div>
          <RequirementChecklist
            groups={[
              {
                key: "field_data",
                title: "Field/Data Requirements",
                items: requirements
                  .filter((item) => item.type === "field")
                  .map((item) => ({ key: item.key, met: item.met, note: item.message })),
              },
              {
                key: "document_artifact",
                title: "Document/Artifact Requirements",
                items: requirements
                  .filter((item) => item.type === "document" || item.type === "attachment")
                  .map((item) => ({ key: item.key, met: item.met, note: item.message })),
              },
            ]}
          />
        </div>
      </div>
      {blockers.length > 0 ? (
        <div className="grid">
          {blockers.map((blocker) => (
            <BlockerCard
              key={blocker.code}
              title={blocker.code}
              severity={blocker.severity}
              unmetRequirement={blocker.message}
              whyRequired="Stage transition policy requires resolution."
              ruleSource={blocker.packetRole}
              resolvingArtifact="Attach missing artifact or update run data."
              verificationStatus="verified-direct"
              waiverAvailable={blocker.waiverAllowed}
              owner="Reviewer"
              nextAction="Return run or request completion."
            />
          ))}
        </div>
      ) : null}
      <AmbiguityNoteBlock
        title="Blocker-aware review workflow"
        reason={
          blockers.length > 0
            ? "Run cannot be approved while blockers remain unresolved."
            : "No blockers currently prevent approval."
        }
        sourceRule="Stage gate evaluation result."
        fixAction="Resolve blocker requirements before approval."
      />
      <ScreenSemantics
        whatIsThis="Run detail with blocker-aware transition workflow."
        stageState={`Current run status: ${run.normalizedStatus || run.status}`}
        missing={blockers.length ? `${blockers.length} blockers unresolved` : "No blockers"}
        whyItMatters="Approvals must honor gate requirements and reviewer authority."
        resolvesBy="Submit, return, or approve through guarded actions."
        whatNext="Advance stage and export when gate passes."
        sourceReference="Transition policy + stage gate payload."
      />
    </div>
  );
}
