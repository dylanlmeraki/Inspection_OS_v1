const LABELS = {
  "verified-direct": "verified-direct",
  "verified-indirect": "verified-indirect",
  "inferred-direct": "inferred-direct",
  "gap-note": "gap-note",
  stale: "stale",
  superseded: "superseded",
};

/**
 * @param {{ status?: string, value?: string }} props
 */
export default function VerificationBadge({ status, value }) {
  const resolved = value || status || "gap-note";
  return (
    <span className={`verification-badge verification-${resolved}`}>
      {LABELS[resolved] || resolved}
    </span>
  );
}
