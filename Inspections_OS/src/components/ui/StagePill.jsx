const LABELS = {
  not_started: "Not Started",
  draft: "Draft",
  in_progress: "In Progress",
  submitted: "Submitted",
  under_review: "Under Review",
  blocked: "Blocked",
  approved: "Approved",
  returned: "Returned",
  complete: "Complete",
  waived: "Waived",
};

export default function StagePill({ status }) {
  return <span className={`stage-pill stage-${status}`}>{LABELS[status] || status}</span>;
}

