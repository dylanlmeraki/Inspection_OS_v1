import StagePill from "@/components/ui/StagePill";

/**
 * @param {{
 *   stages: Array<{ code: string, label: string }>
 *   currentStage: string | null
 *   completedStages?: string[]
 *   blockedStage?: string | null
 *   requestedTransition?: string | null
 *   waiverStage?: string | null
 }} props
 */
export default function LifecycleTimeline({
  stages,
  currentStage,
  completedStages = [],
  blockedStage = null,
  requestedTransition = null,
  waiverStage = null,
}) {
  const completed = new Set(completedStages);
  return (
    <div className="lifecycle-timeline">
      {stages.map((stage) => {
        const isCurrent = currentStage === stage.code;
        const isBlocked = blockedStage === stage.code;
        const isCompleted = completed.has(stage.code);
        const isRequested = requestedTransition === stage.code;
        const isWaived = waiverStage === stage.code;
        const status = isWaived
          ? "waived"
          : isBlocked
          ? "blocked"
          : isCurrent
          ? "in_progress"
          : isCompleted
          ? "complete"
          : "not_started";

        return (
          <div key={stage.code} className="lifecycle-timeline-row">
            <div className="lifecycle-timeline-meta">
              <strong>{stage.label}</strong>
              <span className="small">{stage.code}</span>
            </div>
            <div className="row wrap">
              <StagePill status={status} />
              {isRequested ? <span className="small">Requested transition</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

