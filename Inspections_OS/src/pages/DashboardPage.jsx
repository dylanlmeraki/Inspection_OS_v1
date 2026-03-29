import { Link } from "react-router-dom";
import ScreenSemantics from "@/components/ScreenSemantics";
import {
  useComplianceDashboardQuery,
  useInspectionOpsDashboardQuery,
  usePortfolioDashboardQuery,
  useProjectDashboardQuery,
} from "@/lib/hooks/useDashboardQueries";

export default function DashboardPage() {
  const { data: portfolioDashboard } = usePortfolioDashboardQuery();
  const { data: projectDashboard } = useProjectDashboardQuery();
  const { data: opsDashboard } = useInspectionOpsDashboardQuery();
  const { data: complianceDashboard } = useComplianceDashboardQuery();

  const summary = projectDashboard?.payload?.summary || {
    projectCount: 0,
    runCount: 0,
    openIssueCount: 0,
    exportCount: 0,
  };
  const opsSummary = opsDashboard?.payload?.summary || {
    submittedRuns: 0,
    blockedEvaluations: 0,
  };
  const complianceSummary = complianceDashboard?.payload?.summary || {
    warningCount: 0,
    blockerCount: 0,
    waiverAttemptCount: 0,
    staleSourceCount: 0,
  };

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="card">
        <h2 className="title">Control-Plane Dashboard</h2>
        <p className="subtitle">
          Operational launchpad for Projects, Inspection Ops, Compliance, and My Work.
        </p>
        <div className="row wrap">
          <Link className="btn" to="/dashboard/portfolio">
            Portfolio Dashboard
          </Link>
          <Link className="btn" to="/dashboard/operations">
            Operations Dashboard
          </Link>
          <Link className="btn" to="/dashboard/compliance">
            Compliance Dashboard
          </Link>
          <Link className="btn" to="/dashboard/my-work">
            My Work Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="label">Project Dashboard Summary Contract</div>
          <table className="table">
            <tbody>
              <tr>
                <td>Projects</td>
                <td>{summary.projectCount}</td>
              </tr>
              <tr>
                <td>Runs</td>
                <td>{summary.runCount}</td>
              </tr>
              <tr>
                <td>Open Issues</td>
                <td>{summary.openIssueCount}</td>
              </tr>
              <tr>
                <td>Exports</td>
                <td>{summary.exportCount}</td>
              </tr>
            </tbody>
          </table>
          <p className="small">
            Contract: <span className="code">{projectDashboard?.contract || "pending"}</span>
          </p>
        </div>

        <div className="card">
          <div className="label">Inspection Ops Dashboard Contract</div>
          <p className="small">
            Submitted runs: {opsSummary.submittedRuns} | Blocked evaluations:{" "}
            {opsSummary.blockedEvaluations}
          </p>
          <p className="small">
            Contract: <span className="code">{opsDashboard?.contract || "pending"}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="label">Portfolio Dashboard Contract</div>
          <p className="small">
            Projects: {portfolioDashboard?.payload?.summary?.projectCount || 0} | Active runs:{" "}
            {portfolioDashboard?.payload?.summary?.activeRunCount || 0}
          </p>
          <p className="small">
            Blocked runs: {portfolioDashboard?.payload?.summary?.blockedRunCount || 0} | Stale
            sources: {portfolioDashboard?.payload?.summary?.staleSourceCount || 0}
          </p>
          <p className="small">
            Contract: <span className="code">{portfolioDashboard?.contract || "pending"}</span>
          </p>
        </div>
        <div className="card">
          <div className="label">Compliance Dashboard Contract</div>
          <p className="small">
            Warnings: {complianceSummary.warningCount} | Blockers: {complianceSummary.blockerCount}
          </p>
          <p className="small">
            Waivers: {complianceSummary.waiverAttemptCount} | Stale sources:{" "}
            {complianceSummary.staleSourceCount}
          </p>
          <p className="small">
            Contract: <span className="code">{complianceDashboard?.contract || "pending"}</span>
          </p>
        </div>
      </div>

      <ScreenSemantics
        whatIsThis="Control-plane entry dashboard for portfolio, operations, and compliance."
        stageState="Program-level and run-level mixed state overview."
        missing="Drill into filtered list routes for exact missing artifacts."
        whyItMatters="Avoids decision-making on aggregate counts without operational rows."
        resolvesBy="Open portfolio/operations/compliance widgets to filtered tables."
        whatNext="Move into project workspace, run review queue, or issue verification."
        sourceReference="Dashboard contract envelopes v1."
      />
    </div>
  );
}
