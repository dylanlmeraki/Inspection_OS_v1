import { useExportCenterQuery } from "@/lib/hooks/useDashboardQueries";
import { Link } from "react-router-dom";
import ScreenSemantics from "@/components/ScreenSemantics";
import ManifestReferenceCard from "@/components/ui/ManifestReferenceCard";

export default function ExportCenterPage() {
  const { data } = useExportCenterQuery();
  const exports = data?.payload?.exports || [];
  const manifests = data?.payload?.manifests || [];

  return (
    <div>
      <h1 className="title">Export Center</h1>
      <p className="subtitle">
        Manifest-backed export jobs created by the cleanroom export engine.
      </p>
      <p className="small">
        Contract: <span className="code">{data?.contract || "pending"}</span>
      </p>
      <div className="row wrap" style={{ marginBottom: 12 }}>
        <Link className="btn" to="/exports/manifests">
          Manifest Index
        </Link>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="label">Export jobs</div>
          {exports.length === 0 ? (
            <p className="small">No exports yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Packet</th>
                  <th>Rule Snapshot</th>
                  <th>Transition</th>
                </tr>
              </thead>
              <tbody>
                {exports.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <Link to={`/exports/${exp.id}`}>{exp.title}</Link>
                    </td>
                    <td>{exp.packetClass}</td>
                    <td>
                      <span className="code">{exp.ruleSnapshotId}</span>
                    </td>
                    <td>
                      <span className="code">{exp.transitionAttemptId || "none"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="label">Verification manifests</div>
          {manifests.length === 0 ? (
            <p className="small">No manifests yet.</p>
          ) : (
            manifests.map((manifest) => {
              const waivedList = manifest.waivedExceptions.length
                ? manifest.waivedExceptions
                    .map((item) =>
                      item.waiverReason ? `${item.code} (${item.waiverReason})` : item.code
                    )
                    .join("; ")
                : "none";
              return (
                <div className="list-item" key={manifest.id}>
                  <ManifestReferenceCard
                    exportId={manifest.exportJobId || "unknown_export"}
                    manifestId={manifest.id}
                    ruleSnapshotId={manifest.ruleSnapshotId || "n/a"}
                    sourceEntryCount={manifest.sourceTitles.length}
                    evidenceCount={0}
                    exceptionCount={manifest.waivedExceptions.length}
                    waivedCount={manifest.waivedExceptions.length}
                    generatedBy="local_user"
                    generatedAt={new Date().toISOString()}
                  />
                  <div className="small">Sources: {manifest.sourceTitles.join("; ")}</div>
                  <div className="small">
                    Basis statuses: {manifest.basisStatuses.join(", ") || "verified-direct only"}
                  </div>
                  <div className="small">
                    Waiver action: {manifest.waiverAction || "none"} · Allowed:{" "}
                    {manifest.waiverAllowed ? "yes" : "no"}
                  </div>
                  {manifest.waiverReason ? (
                    <div className="small">Waiver reason: {manifest.waiverReason}</div>
                  ) : null}
                  <div className="small">Waived exceptions: {waivedList}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <ScreenSemantics
        whatIsThis="Export center for packet and manifest outputs."
        stageState="Export job and manifest status."
        missing="Exception and basis disclosures where not direct."
        whyItMatters="Defensible exports require explicit provenance and nuance visibility."
        resolvesBy="Generate manifest-linked export and retain waiver disclosures."
        whatNext="Open export detail or manifest index."
        sourceReference="dashboard.export_center.v1 contract."
      />
    </div>
  );
}
