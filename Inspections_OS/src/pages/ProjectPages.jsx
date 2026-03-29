import { Link, NavLink, useParams, useSearchParams } from "react-router-dom";
import ScreenSemantics from "@/components/ScreenSemantics";
import AmbiguityNoteBlock from "@/components/ui/AmbiguityNoteBlock";
import BlockerCard from "@/components/ui/BlockerCard";
import LifecycleTimeline from "@/components/ui/LifecycleTimeline";
import PacketCompletenessMeter from "@/components/ui/PacketCompletenessMeter";
import RequirementChecklist from "@/components/ui/RequirementChecklist";
import DueStateChip from "@/components/ui/DueStateChip";
import VerificationBadge from "@/components/ui/VerificationBadge";
import EvidenceTray from "@/components/ui/EvidenceTray";
import ManifestReferenceCard from "@/components/ui/ManifestReferenceCard";
import ActionButton from "@/components/ui/ActionButton";
import {
  useProjectWorkspaceQuery,
  useProjectsWorkspaceQuery,
} from "@/lib/hooks/useControlPlaneQueries";
import { GuardedAction, recordPermissionAuditEvent } from "@/lib/permissionGuards.jsx";
import { PERMISSION_ACTIONS } from "@/lib/authRbac";
import { useMockSession } from "@/lib/mockSession.jsx";
import { localDb } from "@/lib/localDb";
import { normalizeRunStatus } from "@/lib/statusVocabulary";

const PROJECT_TAB_ITEMS = [
  { to: "overview", label: "Overview" },
  { to: "programs", label: "Programs" },
  { to: "inspections", label: "Inspections" },
  { to: "issues", label: "Issues" },
  { to: "documents", label: "Documents" },
  { to: "exports", label: "Exports" },
  { to: "team", label: "Team" },
  { to: "audit", label: "Audit" },
];

/**
 * @param {string} value
 * @returns {"complete"|"complete-with-waivers"|"incomplete"|"blocked"|"unknown"}
 */
function normalizePacketCompleteness(value) {
  if (value === "complete") return "complete";
  if (value === "complete-with-waivers") return "complete-with-waivers";
  if (value === "incomplete") return "incomplete";
  if (value === "blocked") return "blocked";
  return "unknown";
}

function useWorkspace() {
  const { projectId = "" } = useParams();
  const { data } = useProjectWorkspaceQuery(projectId);
  return {
    projectId,
    workspace: data,
  };
}

export function ProjectsIndexPage() {
  const { data: rows = [] } = useProjectsWorkspaceQuery();
  const [searchParams] = useSearchParams();
  const blockedOnly = searchParams.get("filter") === "blocked";
  const filteredRows = blockedOnly
    ? rows.filter((row) => (row.summary?.blockerCount || 0) > 0)
    : rows;

  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Projects</h2>
        <p className="subtitle">
          Portfolio list with direct jump to project workspace surfaces.
        </p>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Runs</th>
              <th>Open Issues</th>
              <th>Blockers</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.project.id}>
                <td>{row.project.name}</td>
                <td>{row.summary?.runCount || 0}</td>
                <td>{row.summary?.openIssueCount || 0}</td>
                <td>{row.summary?.blockerCount || 0}</td>
                <td>
                  <Link to={`/projects/${row.project.id}/overview`}>Workspace</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScreenSemantics
        whatIsThis="Project portfolio list."
        stageState="Cross-project lifecycle summary."
        missing="Project rows with blockers and overdue states."
        whyItMatters="Gate and export defensibility are managed per project context."
        resolvesBy="Open project workspace tabs."
        whatNext="Inspect programs, runs, issues, and exports."
        sourceReference="Project workspace aggregate query contract."
      />
    </div>
  );
}

export function ProjectWorkspaceLandingPage() {
  const { projectId } = useParams();
  return (
    <div className="card">
      <p className="small">
        Open the project workspace tabs for <span className="code">{projectId}</span>.
      </p>
      <Link className="btn" to="overview">
        Go to Overview
      </Link>
    </div>
  );
}

export function ProjectWorkspaceTabs() {
  const { projectId } = useParams();
  return (
    <div className="project-tab-nav">
      {PROJECT_TAB_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={`/projects/${projectId}/${item.to}`}
          className={({ isActive }) => (isActive ? "tab-link active-tab-link" : "tab-link")}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export function ProjectOverviewPage() {
  const { workspace } = useWorkspace();
  if (!workspace) return <p className="small">Project not found.</p>;

  const blockerCards = workspace.summary.currentBlockers || [];
  return (
    <div className="grid">
      <ProjectWorkspaceTabs />
      <div className="card">
        <h2 className="title">{workspace.project.name}</h2>
        <p className="small">
          Jurisdiction: {workspace.project.jurisdictionKey} | County Group:{" "}
          {workspace.project.countyGroup}
        </p>
        <p className="small">
          Active programs: {(workspace.project.activePrograms || []).join(", ") || "none"}
        </p>
      </div>
      <div className="grid grid-2">
        <div className="card">
          <div className="label">Summary metrics</div>
          <p className="small">Runs: {workspace.summary.runCount}</p>
          <p className="small">Issues: {workspace.summary.issueCount}</p>
          <p className="small">Exports: {workspace.summary.exportCount}</p>
          <p className="small">Current blockers: {workspace.summary.blockerCount}</p>
        </div>
        <div className="card">
          <div className="label">Recent activity</div>
          <div className="list">
            {workspace.audit.slice(0, 5).map((item) => (
              <div key={item.id} className="list-item">
                <strong>{item.type}</strong>
                <p className="small">{item.summary}</p>
                <p className="small">{item.occurredAt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {blockerCards.length > 0 ? (
        <div className="grid">
          {blockerCards.map((item) => (
            <BlockerCard
              key={`${item.stageCode}-${item.code}`}
              title={item.code}
              severity={item.severity || "blocker"}
              unmetRequirement={item.message}
              whyRequired="Gate requirement unresolved at current stage."
              ruleSource={item.packetRole}
              resolvingArtifact="Attach required artifact or update field payload."
              verificationStatus="verified-direct"
              waiverAvailable={Boolean(item.waiverAllowed)}
              owner="Project reviewer"
              nextAction="Resolve missing requirement or request waiver."
            />
          ))}
        </div>
      ) : null}
      <ScreenSemantics
        whatIsThis="Project overview tab."
        stageState="Program and run aggregate state."
        missing="Unresolved blockers and missing required artifacts."
        whyItMatters="Project submission readiness depends on blocker-free progression."
        resolvesBy="Use program, inspections, and documents tabs."
        whatNext="Advance or remediate by program/stage."
        sourceReference="stage_gate_evaluation + project activity timeline."
      />
    </div>
  );
}

export function ProjectProgramsPage() {
  const { workspace, projectId } = useWorkspace();
  const { currentUser } = useMockSession();
  if (!workspace) return <p className="small">Project not found.</p>;

  return (
    <div className="grid">
      <ProjectWorkspaceTabs />
      {workspace.programCards.map((card) => {
        const timelineStages = [
          { code: "not_started", label: "Not Started" },
          { code: "in_progress", label: "In Progress" },
          { code: "under_review", label: "Under Review" },
          { code: "complete", label: "Complete" },
        ];
        return (
          <div className="card" key={card.programKey}>
            <div className="row wrap">
              <h3>{card.programKey}</h3>
              <VerificationBadge value="verified-direct" />
            </div>
            <p className="small">
              Current stage: {card.currentStage} | Gate status: {card.gateStatus} | Last run:{" "}
              {card.lastRunId || "none"}
            </p>
            <p className="small">Next due: {card.nextDue || "none"}</p>
            <PacketCompletenessMeter state={normalizePacketCompleteness(card.packetCompleteness)} />
            <LifecycleTimeline
              stages={timelineStages}
              currentStage={
                card.gateStatus === "pass"
                  ? "complete"
                  : card.gateStatus === "blocked"
                  ? "under_review"
                  : "in_progress"
              }
              blockedStage={card.gateStatus === "blocked" ? "under_review" : null}
            />
            <GuardedAction
              action={PERMISSION_ACTIONS.attemptStageAdvancement}
              scope={{ projectId }}
              render={({ allowed, decision }) => (
                <div className="row wrap">
                  <ActionButton
                    variant="primary"
                    disabled={!allowed}
                    onClick={() => {
                      recordPermissionAuditEvent({
                        action: PERMISSION_ACTIONS.attemptStageAdvancement,
                        decision,
                        actorId: currentUser.id,
                        projectId,
                        details: {
                          programKey: card.programKey,
                          stage: card.currentStage,
                        },
                      });
                    }}
                  >
                    Stage Advancement CTA
                  </ActionButton>
                  {!allowed ? <p className="small">Denied: {decision.reason}</p> : null}
                </div>
              )}
            />
          </div>
        );
      })}
      <ScreenSemantics
        whatIsThis="Program-level gate and lifecycle status."
        stageState="Current stage and gate status per active program."
        missing="Unmet gate requirements and packet gaps."
        whyItMatters="Stage advancement must be policy- and gate-validated."
        resolvesBy="Resolve blockers or authorized waiver."
        whatNext="Create or review inspection runs."
        sourceReference="Gate evaluation + transition policy."
      />
    </div>
  );
}

export function ProjectInspectionsPage() {
  const { workspace } = useWorkspace();
  const [searchParams] = useSearchParams();
  if (!workspace) return <p className="small">Project not found.</p>;

  const statusFilter = searchParams.get("status");
  const stageFilter = searchParams.get("stage");
  const dueFilter = searchParams.get("due");
  const rows = workspace.inspections
    .filter((run) => (statusFilter ? normalizeRunStatus(run.status) === statusFilter : true))
    .filter((run) => (stageFilter ? run.stageCode === stageFilter : true))
    .filter((run) => (dueFilter ? run.dueState === dueFilter : true));

  return (
    <div className="grid">
      <ProjectWorkspaceTabs />
      <div className="card">
        <div className="label">Runs</div>
        <table className="table">
          <thead>
            <tr>
              <th>Run</th>
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
                <td>{run.normalizedStatus}</td>
                <td>{run.stageCode}</td>
                <td>
                  <DueStateChip state={run.dueState} />
                </td>
                <td>
                  {["submitted", "under_review"].includes(run.normalizedStatus)
                    ? "reviewer"
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
        whatIsThis="Project inspection run list."
        stageState="Run status, stage status, and due state."
        missing="Overdue and blocked runs."
        whyItMatters="Run transitions drive gate and export defensibility."
        resolvesBy="Review queue and run detail transitions."
        whatNext="Submit, return, approve, or request evidence."
        sourceReference="workflow_run + stage_gate_evaluation."
      />
    </div>
  );
}

export function ProjectIssuesPage() {
  const { workspace } = useWorkspace();
  if (!workspace) return <p className="small">Project not found.</p>;

  return (
    <div className="grid">
      <ProjectWorkspaceTabs />
      <div className="card">
        <div className="label">Issues</div>
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Due</th>
              <th>Run</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {workspace.issues.map((issue) => (
              <tr key={issue.id}>
                <td>
                  <Link to={`/issues/${issue.id}`}>{issue.code || issue.id}</Link>
                </td>
                <td>{issue.normalizedStatus}</td>
                <td>{issue.owner || "unassigned"}</td>
                <td>{issue.dueAt || "none"}</td>
                <td>{issue.runId || "n/a"}</td>
                <td>{issue.severity || "blocker-linked"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScreenSemantics
        whatIsThis="Project issue management tab."
        stageState="Open, overdue, and verification-needed issue states."
        missing="Closure evidence or verification state."
        whyItMatters="Issue closure affects run and export defensibility."
        resolvesBy="Attach closeout evidence and verify."
        whatNext="Close issue or escalate to reviewer."
        sourceReference="Issue lifecycle and verification policy."
      />
    </div>
  );
}

export function ProjectDocumentsPage() {
  const { workspace } = useWorkspace();
  if (!workspace) return <p className="small">Project not found.</p>;

  const sourceReferences = workspace.documents.sourceReferences.map((source) => ({
    id: source.id,
    label: source.title,
    verificationStatus: source.verificationStatus,
    stale: source.stale,
  }));
  const requiredItems = workspace.documents.requiredSlots.map((item) => ({
    key: item,
    met: !workspace.documents.missingRequiredSlots.includes(item),
  }));

  return (
    <div className="grid">
      <ProjectWorkspaceTabs />
      <div className="card">
        <div className="label">Document Vault Slots</div>
        <p className="small">
          Required: {workspace.documents.requiredSlots.join(", ") || "none"} | Optional:{" "}
          {workspace.documents.optionalSlots.join(", ") || "none"}
        </p>
        <p className="small">
          Missing required artifacts: {workspace.documents.missingRequiredSlots.join(", ") || "none"}
        </p>
      </div>
      <RequirementChecklist
        groups={[
          {
            key: "document_artifact",
            title: "Document/Artifact Requirements",
            items: requiredItems,
          },
          {
            key: "source_verification",
            title: "Source Verification Requirements",
            items: sourceReferences.map((item) => ({
              key: item.label,
              met: item.verificationStatus === "verified-direct" && !item.stale,
              note: `${item.verificationStatus}${item.stale ? " (stale)" : ""}`,
            })),
          },
        ]}
      />
      <EvidenceTray
        attachments={[]}
        signatures={[]}
        linkedForms={workspace.documents.requiredSlots.map((item) => ({ id: item, label: item }))}
        sourceReferences={sourceReferences}
        missingMarkers={workspace.documents.missingRequiredSlots}
      />
      <ScreenSemantics
        whatIsThis="Project document vault and source reference panel."
        stageState="Required vs optional slot fulfillment."
        missing="Required artifacts and stale source records."
        whyItMatters="Missing artifacts block stage advancement and packet defensibility."
        resolvesBy="Upload required documents and refresh stale source references."
        whatNext="Re-run gate evaluation and submit run."
        sourceReference="Vault slot obligations + source freshness metadata."
      />
    </div>
  );
}

export function ProjectExportsPage() {
  const { workspace, projectId } = useWorkspace();
  const { currentUser } = useMockSession();
  if (!workspace) return <p className="small">Project not found.</p>;

  return (
    <div className="grid">
      <ProjectWorkspaceTabs />
      <div className="grid grid-2">
        <div className="card">
          <div className="label">Export jobs</div>
          {workspace.exports.length === 0 ? (
            <p className="small">No export jobs yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Export</th>
                  <th>Status</th>
                  <th>Packet</th>
                  <th>Manifest</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {workspace.exports.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link to={`/exports/${row.id}`}>{row.id}</Link>
                    </td>
                    <td>{row.normalizedStatus}</td>
                    <td>{row.packetClass}</td>
                    <td>{row.manifestId || "pending"}</td>
                    <td>
                      <GuardedAction
                        action={PERMISSION_ACTIONS.triggerExternalShareExport}
                        scope={{ projectId }}
                        render={({ allowed, decision }) => (
                          <ActionButton
                            disabled={!allowed}
                            onClick={() => {
                              recordPermissionAuditEvent({
                                action: PERMISSION_ACTIONS.triggerExternalShareExport,
                                decision,
                                actorId: currentUser.id,
                                projectId,
                                details: { exportId: row.id },
                              });
                            }}
                          >
                            External Share
                          </ActionButton>
                        )}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <div className="label">Waived / omitted disclosure</div>
          <p className="small">
            Packet completeness and manifest exception disclosures are required for every export.
          </p>
          <ul className="small">
            <li>Waived blocker codes and reasons</li>
            <li>Omitted/missing required artifacts</li>
            <li>Indirect or inferred basis statuses</li>
          </ul>
        </div>
      </div>
      <ScreenSemantics
        whatIsThis="Project export management tab."
        stageState="Export lifecycle and packet defensibility state."
        missing="Waiver and omission disclosures where applicable."
        whyItMatters="External packet submission must reflect exact rule/source basis."
        resolvesBy="Generate manifest-linked export and disclose exceptions."
        whatNext="Share/archive with authorized roles only."
        sourceReference="Export job + verification manifest linkage."
      />
    </div>
  );
}

export function ProjectTeamPage() {
  const { workspace, projectId } = useWorkspace();
  const { currentUser } = useMockSession();
  if (!workspace) return <p className="small">Project not found.</p>;

  return (
    <div className="grid">
      <ProjectWorkspaceTabs />
      <div className="card">
        <div className="label">Project members and authority</div>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Review Authority</th>
              <th>Waiver Authority</th>
              <th>Assignments</th>
            </tr>
          </thead>
          <tbody>
            {workspace.team.map((member) => (
              <tr key={member.id}>
                <td>{member.user?.name || member.userId}</td>
                <td>{member.projectRole}</td>
                <td>{member.canReview ? "yes" : "no"}</td>
                <td>{member.canWaive ? "yes" : "no"}</td>
                <td>
                  <GuardedAction
                    action={PERMISSION_ACTIONS.manageUsersRolesOrgSettings}
                    scope={{ projectId }}
                    render={({ allowed, decision }) => (
                      <ActionButton
                        disabled={!allowed}
                        onClick={() => {
                          const nextRole =
                            member.projectRole === "coordinator"
                              ? "reviewer"
                              : "coordinator";
                          localDb.upsertProjectMembership({
                            ...member,
                            projectRole: nextRole,
                          });
                          recordPermissionAuditEvent({
                            action: PERMISSION_ACTIONS.manageUsersRolesOrgSettings,
                            decision,
                            actorId: currentUser.id,
                            projectId,
                            details: {
                              changedUserId: member.userId,
                              previousRole: member.projectRole,
                              nextRole,
                              eventType: "project_role_changed",
                            },
                          });
                        }}
                      >
                        Change Role
                      </ActionButton>
                    )}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScreenSemantics
        whatIsThis="Project team and authority matrix."
        stageState="Role membership and scoped authority."
        missing="Missing reviewer/waiver authority for critical actions."
        whyItMatters="Unauthorized transitions and waivers undermine defensibility."
        resolvesBy="Adjust role assignments through guarded admin actions."
        whatNext="Re-attempt blocked action with proper authority."
        sourceReference="RBAC matrix + project membership policy."
      />
    </div>
  );
}

export function ProjectAuditPage() {
  const { workspace, projectId } = useWorkspace();
  if (!workspace) return <p className="small">Project not found.</p>;
  const permissionAudits = localDb
    .listPermissionAudits()
    .filter((item) => item.projectId === projectId);

  return (
    <div className="grid">
      <ProjectWorkspaceTabs />
      <div className="card">
        <div className="label">Append-only timeline</div>
        <div className="list">
          {workspace.audit.map((item) => (
            <div className="list-item" key={item.id}>
              <strong>{item.type}</strong>
              <p className="small">{item.summary}</p>
              <p className="small">{item.occurredAt}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="label">Permission-sensitive actions</div>
        <div className="list">
          {permissionAudits.map((item) => (
            <div className="list-item" key={item.id}>
              <strong>{item.action}</strong>
              <p className="small">
                {item.result} | {item.reason}
              </p>
              <p className="small">{item.occurredAt}</p>
            </div>
          ))}
        </div>
      </div>
      <ScreenSemantics
        whatIsThis="Project-level append-only audit timeline."
        stageState="Run/transition/export and policy-change history."
        missing="Events without actor/reason/source context."
        whyItMatters="Audit trace is required for regulatory and QA defensibility."
        resolvesBy="Emit structured audit events on sensitive actions."
        whatNext="Review and export audit records."
        sourceReference="Audit event + permission audit schemas."
      />
      <AmbiguityNoteBlock
        title="County/city policy split"
        reason="Jurisdiction logic may rely on county and city overlays simultaneously."
        sourceRule="Rule precedence + scope matching."
        fixAction="Verify route decisions against rule trace and source records."
        responsibleActor="Compliance admin"
      />
    </div>
  );
}

export function ProjectExportsManifestPreview({ manifest }) {
  if (!manifest) return null;
  const evidenceCount = manifest.evidenceInventory?.attachmentCount || 0;
  return (
    <ManifestReferenceCard
      exportId={manifest.exportJobId}
      manifestId={manifest.id}
      ruleSnapshotId={manifest.ruleSnapshotId}
      sourceEntryCount={(manifest.sourceEntries || []).length}
      evidenceCount={evidenceCount}
      exceptionCount={(manifest.exceptions || []).length}
      waivedCount={(manifest.exceptions || []).filter((item) => item.waived).length}
      generatedBy="local_user"
      generatedAt={manifest.createdAt}
    />
  );
}
