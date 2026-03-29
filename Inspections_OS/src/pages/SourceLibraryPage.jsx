import { useSourceFreshnessQuery } from "@/lib/hooks/useDashboardQueries";
import { Link } from "react-router-dom";

export default function SourceLibraryPage() {
  const { data } = useSourceFreshnessQuery();
  const sources = data?.payload?.rows || [];

  return (
    <div>
      <h1 className="title">Source Library</h1>
      <p className="subtitle">
        Official-source anchors used by the wizard abstraction, gate evaluation, and export manifest.
      </p>
      <p className="small">
        Total sources: {data?.payload?.summary?.total || 0} · Stale:{" "}
        {data?.payload?.summary?.stale || 0}
      </p>
      <p className="small">
        Contract: <span className="code">{data?.contract || "pending"}</span>
      </p>
      <div className="row wrap" style={{ marginBottom: 10 }}>
        <Link className="btn" to="/sources/forms">
          Forms View
        </Link>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Packet Role</th>
            <th>Verification</th>
            <th>Fingerprint</th>
            <th>Verified At</th>
            <th>Last Seen</th>
            <th>Stale</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((src) => (
            <tr key={src.id}>
              <td>{src.title}</td>
              <td>{src.packetRole}</td>
              <td>{src.verificationStatus}</td>
              <td>
                <span className="code">{src.fingerprintHash}</span>
              </td>
              <td>{src.verifiedAt}</td>
              <td>{src.lastSeenAt}</td>
              <td>{src.stale ? 'yes' : 'no'}</td>
              <td>
                <Link to={`/sources/${src.id}`}>Open</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
