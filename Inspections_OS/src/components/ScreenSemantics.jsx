/**
 * @param {{
 *   whatIsThis: string
 *   stageState: string
 *   missing: string
 *   whyItMatters: string
 *   resolvesBy: string
 *   whatNext: string
 *   sourceReference: string
 }} props
 */
export default function ScreenSemantics({
  whatIsThis,
  stageState,
  missing,
  whyItMatters,
  resolvesBy,
  whatNext,
  sourceReference,
}) {
  return (
    <div className="card semantics-card">
      <div className="label">Screen Semantics</div>
      <p className="small">
        <strong>What this is:</strong> {whatIsThis}
      </p>
      <p className="small">
        <strong>Current stage/state:</strong> {stageState}
      </p>
      <p className="small">
        <strong>What is missing:</strong> {missing}
      </p>
      <p className="small">
        <strong>Why it matters:</strong> {whyItMatters}
      </p>
      <p className="small">
        <strong>What resolves it:</strong> {resolvesBy}
      </p>
      <p className="small">
        <strong>What happens next:</strong> {whatNext}
      </p>
      <p className="small">
        <strong>Source rule/policy:</strong> {sourceReference}
      </p>
    </div>
  );
}

