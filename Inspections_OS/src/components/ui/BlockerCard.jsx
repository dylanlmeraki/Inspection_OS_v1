import StagePill from "@/components/ui/StagePill";
import VerificationBadge from "@/components/ui/VerificationBadge";

/**
 * @param {{
 *   title: string
 *   severity: "blocker"|"warning"
 *   unmetRequirement: string
 *   whyRequired: string
 *   ruleSource: string
 *   resolvingArtifact: string
 *   verificationStatus: string
 *   waiverAvailable: boolean
 *   owner: string
 *   nextAction: string
 }} props
 */
export default function BlockerCard({
  title,
  severity,
  unmetRequirement,
  whyRequired,
  ruleSource,
  resolvingArtifact,
  verificationStatus,
  waiverAvailable,
  owner,
  nextAction,
}) {
  return (
    <div className="blocker-card">
      <div className="row wrap blocker-card-header">
        <strong>{title}</strong>
        <StagePill status={severity === "blocker" ? "blocked" : "under_review"} />
        <VerificationBadge value={verificationStatus} />
      </div>
      <p className="small">
        <strong>Unmet requirement:</strong> {unmetRequirement}
      </p>
      <p className="small">
        <strong>Why required:</strong> {whyRequired}
      </p>
      <p className="small">
        <strong>Rule source:</strong> {ruleSource}
      </p>
      <p className="small">
        <strong>Resolving artifact:</strong> {resolvingArtifact}
      </p>
      <p className="small">
        <strong>Waiver available:</strong> {waiverAvailable ? "yes" : "no"}
      </p>
      <p className="small">
        <strong>Owner:</strong> {owner}
      </p>
      <p className="small">
        <strong>Next action:</strong> {nextAction}
      </p>
    </div>
  );
}

