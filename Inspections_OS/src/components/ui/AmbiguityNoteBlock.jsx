/**
 * @param {{
 *   title: string
 *   reason: string
 *   sourceRule: string
 *   fixAction: string
 *   responsibleActor?: string | null
 }} props
 */
export default function AmbiguityNoteBlock({
  title,
  reason,
  sourceRule,
  fixAction,
  responsibleActor = null,
}) {
  return (
    <div className="ambiguity-note">
      <strong>{title}</strong>
      <p className="small">{reason}</p>
      <p className="small">
        <strong>Source rule/policy:</strong> {sourceRule}
      </p>
      <p className="small">
        <strong>Fix action:</strong> {fixAction}
      </p>
      {responsibleActor ? (
        <p className="small">
          <strong>Responsible actor:</strong> {responsibleActor}
        </p>
      ) : null}
    </div>
  );
}

