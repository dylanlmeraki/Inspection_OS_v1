import VerificationBadge from "@/components/ui/VerificationBadge";

/**
 * @param {{
 *   attachments: Array<{ id: string, label: string }>
 *   signatures: Array<{ id: string, label: string }>
 *   linkedForms: Array<{ id: string, label: string }>
 *   sourceReferences: Array<{ id: string, label: string, verificationStatus: string, stale?: boolean }>
 *   missingMarkers: string[]
 }} props
 */
export default function EvidenceTray({
  attachments,
  signatures,
  linkedForms,
  sourceReferences,
  missingMarkers,
}) {
  return (
    <div className="card">
      <div className="label">Evidence Tray</div>
      <div className="small">
        Attachments: {attachments.length} · Signatures: {signatures.length} · Linked forms:{" "}
        {linkedForms.length}
      </div>
      <div className="list" style={{ marginTop: 10 }}>
        {attachments.map((item) => (
          <div key={item.id} className="list-item">
            <strong>Attachment:</strong> {item.label}
          </div>
        ))}
        {signatures.map((item) => (
          <div key={item.id} className="list-item">
            <strong>Signature:</strong> {item.label}
          </div>
        ))}
        {linkedForms.map((item) => (
          <div key={item.id} className="list-item">
            <strong>Form:</strong> {item.label}
          </div>
        ))}
      </div>
      <div className="list" style={{ marginTop: 10 }}>
        {sourceReferences.map((source) => (
          <div key={source.id} className="list-item">
            <div className="row wrap">
              <strong>{source.label}</strong>
              <VerificationBadge value={source.stale ? "stale" : source.verificationStatus} />
            </div>
          </div>
        ))}
      </div>
      {missingMarkers.length > 0 ? (
        <div className="card caution-card" style={{ marginTop: 10 }}>
          <div className="label">Missing Evidence Markers</div>
          <ul className="small">
            {missingMarkers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

