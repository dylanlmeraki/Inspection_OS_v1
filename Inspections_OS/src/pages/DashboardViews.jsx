import { Link } from "react-router-dom";
import ScreenSemantics from "@/components/ScreenSemantics";
import DueStateChip from "@/components/ui/DueStateChip";
import VerificationBadge from "@/components/ui/VerificationBadge";
import {
  useComplianceDashboardQuery,
  useInspectionOpsDashboardQuery,
  usePortfolioDashboardQuery,
  useSourceFreshnessQuery,
} from "@/lib/hooks/useDashboardQueries";
import { usePortfolioDrilldownsQuery } from "@/lib/hooks/useControlPlaneQueries";

function EmptyState({ message }) {
  return <p className="small">{message}</p>;
}

export function DashboardPortfolioPage() {
  const { data: portfolio } = usePortfolioDashboardQuery();
  const { data: drilldownsData } = usePortfolioDrilldownsQuery();
  const drilldowns = drilldownsData || {
    blockedProjects: [],
    overdueInspections: [],
    overdueIssues: [],
    exportFailures: [],
  };
  const topProjects = portfolio?.payload?.topProjects || [];
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Portfolio Dashboard</h2>
        <p className="subtitle">
          Portfolio summary with deterministic drill-down routes for blocked projects and overdue
          operations.
        </p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="label">Top projects</div>
          {topProjects.length === 0 ? (
            <EmptyState message="No projects available." />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Runs</th>
                  <th>Open issues</th>
                </tr>
              </thead>
              <tbody>
                {topProjects.map((row) => (
                  <tr key={row.projectId}>
                    <td>
                      <Link to={`/projects/${row.projectId}/overview`}>{row.projectName}</Link>
                    </td>
                    <td>{row.runCount}</td>
                    <td>{row.openIssueCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="label">Drill-down widgets</div>
          <div className="list">
            <Link className="list-item" to="/projects?filter=blocked">
              Blocked projects ({drilldowns.blockedProjects?.length || 0})
            </Link>
            <Link className="list-item" to="/inspections?due=overdue">
              Overdue inspections ({drilldowns.overdueInspections?.length || 0})
            </Link>
            <Link className="list-item" to="/issues/overdue">
              Overdue issues ({drilldowns.overdueIssues?.length || 0})
            </Link>
            <Link className="list-item" to="/exports?status=failed">
              Failed exports ({drilldowns.exportFailures?.length || 0})
            </Link>
          </div>
        </div>
      </div>

      <ScreenSemantics
        whatIsThis="Portfolio-level control-plane summary."
        stageState="Multi-project mixed states."
        missing="Rows with blockers, overdue due states, and failed exports."
        whyItMatters="Portfolio actions must originate from row-level defensible context."
        resolvesBy="Navigate each widget to filtered operational routes."
        whatNext="Open project workspace or inspection queue."
        sourceReference="dashboard.portfolio.v1 + portfolio drilldown query."
      />
    </div>
  );
}

export function DashboardOperationsPage() {
  const { data: ops } = useInspectionOpsDashboardQuery();
  const stages = ops?.payload?.stages || [];
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Operations Dashboard</h2>
        <p className="subtitle">Inspection ops queue with stage-level drill-down links.</p>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Stage</th>
              <th>Runs</th>
              <th>Blocked</th>
              <th>Pass</th>
              <th>Drill-down</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage) => (
              <tr key={stage.stageCode}>
                <td>{stage.stageCode}</td>
                <td>{stage.runCount}</td>
                <td>{stage.blockedCount}</td>
                <td>{stage.passCount}</td>
                <td>
                  <Link to={`/inspections?stage=${encodeURIComponent(stage.stageCode)}`}>
                    Open stage runs
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScreenSemantics
        whatIsThis="Inspection operations dashboard for run-stage throughput."
        stageState="Queue states by stage code."
        missing="Blocked or returned runs requiring reviewer action."
        whyItMatters="Throughput without blocker context leads to unsafe approvals."
        resolvesBy="Review queue and run detail transitions."
        whatNext="Submit, return, or approve from inspection detail."
        sourceReference="dashboard.inspection_ops.v1."
      />
    </div>
  );
}

export function DashboardCompliancePage() {
  const { data: compliance } = useComplianceDashboardQuery();
  const unresolvedRuns = compliance?.payload?.unresolvedRuns || [];
  const { data: freshness } = useSourceFreshnessQuery();
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Compliance Dashboard</h2>
        <p className="subtitle">
          Blockers, waiver attempts, and source freshness with explicit nuance badges.
        </p>
      </div>
      <div className="grid grid-2">
        <div className="card">
          <div className="label">Unresolved runs</div>
          {unresolvedRuns.length === 0 ? (
            <EmptyState message="No unresolved runs." />
          ) : (
            <div className="list">
              {unresolvedRuns.map((row) => (
                <div key={row.runId} className="list-item">
                  <strong>{row.runId}</strong>
                  <p className="small">
                    Stage: {row.stageCode} | Blockers: {row.blockerCodes.join(", ")}
                  </p>
                  <Link to={`/inspections/${row.runId}`}>Open run detail</Link>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div className="label">Source freshness</div>
          <div className="list">
            {(freshness?.payload?.rows || []).slice(0, 8).map((row) => (
              <div key={row.id} className="list-item">
                <div className="row wrap">
                  <strong>{row.title}</strong>
                  <VerificationBadge value={row.stale ? "stale" : row.verificationStatus} />
                </div>
                <p className="small">
                  lastSeenAt: {row.lastSeenAt} {row.stale ? <DueStateChip state="overdue" /> : null}
                </p>
              </div>
            ))}
          </div>
          <Link className="btn" to="/sources/forms">
            Open source library
          </Link>
        </div>
      </div>
      <ScreenSemantics
        whatIsThis="Compliance posture and defensibility dashboard."
        stageState="Blocker/warning/waiver and source freshness."
        missing="Directly verified basis and unresolved blocker evidence."
        whyItMatters="Indirect or stale basis must remain visible for submissions."
        resolvesBy="Run review, source verification, and manifest disclosure."
        whatNext="Open issues verification queue and source detail."
        sourceReference="dashboard.compliance.v1 + dashboard.source_freshness.v1."
      />
    </div>
  );
}

export function DashboardMyWorkPage() {
  const { data: drilldownsData } = usePortfolioDrilldownsQuery();
  const drilldowns = drilldownsData || {
    blockedProjects: [],
    overdueInspections: [],
    overdueIssues: [],
    exportFailures: [],
  };
  const myRows = [
    ...(drilldowns.overdueInspections || []).slice(0, 3),
    ...(drilldowns.overdueIssues || []).slice(0, 3),
  ];
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">My Work</h2>
        <p className="subtitle">
          Personal queue view used for inspectors and coordinators with limited dashboard scope.
        </p>
      </div>
      <div className="card">
        <div className="label">Priority queue</div>
        {myRows.length === 0 ? (
          <EmptyState message="No assigned priority rows in fixture state." />
        ) : (
          <div className="list">
            {myRows.map((row) => (
              <div key={row.id} className="list-item">
                <strong>{row.id}</strong>
                <p className="small">
                  Project: {row.projectName || row.projectId} | Stage: {row.stageCode || "n/a"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <ScreenSemantics
        whatIsThis="User-scoped operational queue."
        stageState="Limited dashboard state for non-admin users."
        missing="Pending actions that block submission or review."
        whyItMatters="Prevents inspectors from acting outside scope."
        resolvesBy="Open run and issue routes with route/action guards."
        whatNext="Submit run drafts or request reviewer action."
        sourceReference="RBAC policy for view_dashboard + submit_inspection_run."
      />
    </div>
  );
}
