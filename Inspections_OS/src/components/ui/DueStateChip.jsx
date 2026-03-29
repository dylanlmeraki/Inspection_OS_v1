const LABELS = {
  due_soon: "Due Soon",
  due_today: "Due Today",
  overdue: "Overdue",
  no_due_date: "No Due Date",
  scheduled: "Scheduled",
};

export default function DueStateChip({ state }) {
  return <span className={`due-chip due-${state}`}>{LABELS[state] || state}</span>;
}

