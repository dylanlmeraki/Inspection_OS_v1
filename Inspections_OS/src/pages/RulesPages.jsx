import ScreenSemantics from "@/components/ScreenSemantics";
import ActionButton from "@/components/ui/ActionButton";
import {
  useRulesCadenceQuery,
  useRulesPacketQuery,
  useRulesPreviewsQuery,
  useRulesSnapshotsQuery,
} from "@/lib/hooks/useControlPlaneQueries";
import { GuardedAction, recordPermissionAuditEvent } from "@/lib/permissionGuards.jsx";
import { PERMISSION_ACTIONS } from "@/lib/authRbac";
import { localDb } from "@/lib/localDb";
import { useMockSession } from "@/lib/mockSession.jsx";

function RuleTable({ rows, columns }) {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {columns.map((col) => (
              <td key={`${row.id}:${col.key}`}>{col.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EditRuleAction({ ruleId }) {
  const { currentUser } = useMockSession();
  const projectId = localDb.listProjects()[0]?.id || "proj_unknown";
  return (
    <GuardedAction
      action={PERMISSION_ACTIONS.editPacketCadenceRules}
      scope={{ projectId }}
      render={({ allowed, decision }) => (
        <ActionButton
          disabled={!allowed}
          onClick={() => {
            const rule = localDb.getPacketRule(ruleId);
            if (!rule) return;
            localDb.upsertPacketRule({
              ...rule,
              priority: (rule.priority || 0) + 1,
            });
            recordPermissionAuditEvent({
              action: PERMISSION_ACTIONS.editPacketCadenceRules,
              decision,
              actorId: currentUser.id,
              projectId,
              details: {
                eventType: "edit_rules",
                ruleId,
              },
            });
          }}
        >
          Edit Rule
        </ActionButton>
      )}
    />
  );
}

export function RulesIndexPage() {
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Rules</h2>
        <p className="subtitle">
          Packet, cadence, snapshots, and previews for rule-basis transparency.
        </p>
      </div>
      <ScreenSemantics
        whatIsThis="Rules control-plane index."
        stageState="Rule governance surfaces."
        missing="Rule-basis edits without audit and precedence trace."
        whyItMatters="Gate/export defensibility depends on deterministic rule basis."
        resolvesBy="Edit through guarded actions and preserve trace metadata."
        whatNext="Use packet/cadence/snapshot/preview routes."
        sourceReference="Rule precedence model + edit_packet_cadence_rules."
      />
    </div>
  );
}

export function RulesPacketPage() {
  const { data: rows = [] } = useRulesPacketQuery();
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Packet Rules</h2>
      </div>
      <div className="card">
        <RuleTable
          rows={rows}
          columns={[
            { key: "id", label: "Rule", render: (row) => row.id },
            { key: "scopeLevel", label: "Scope", render: (row) => `${row.scopeLevel}:${row.scopeKey}` },
            { key: "priority", label: "Priority", render: (row) => row.priority },
            { key: "merge", label: "Merge", render: (row) => row.mergeStrategy || "replace" },
            {
              key: "action",
              label: "Action",
              render: (row) => <EditRuleAction ruleId={row.id} />,
            },
          ]}
        />
      </div>
      <ScreenSemantics
        whatIsThis="Packet rule registry."
        stageState="Active rule precedence and merge strategies."
        missing="Effective windows and supersede coverage gaps."
        whyItMatters="Rule selection errors can alter gate decisions."
        resolvesBy="Review precedence and edit through guarded path."
        whatNext="Validate via rule preview and snapshots."
        sourceReference="Packet rules + precedence sorting."
      />
    </div>
  );
}

export function RulesCadencePage() {
  const { data: rows = [] } = useRulesCadenceQuery();
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Cadence Rules</h2>
      </div>
      <div className="card">
        <RuleTable
          rows={rows}
          columns={[
            { key: "id", label: "Rule", render: (row) => row.id },
            { key: "program", label: "Program", render: (row) => row.programKey },
            { key: "stage", label: "Stage", render: (row) => row.stageCode },
            { key: "cadence", label: "Cadence", render: (row) => row.cadence },
            { key: "interval", label: "Interval", render: (row) => row.intervalDays },
          ]}
        />
      </div>
      <ScreenSemantics
        whatIsThis="Cadence rule list."
        stageState="Recurring timing policies."
        missing="Missed or stale cadence scheduling."
        whyItMatters="Timing obligations are compliance requirements."
        resolvesBy="Adjust cadence rules and review recurring queue."
        whatNext="Run recurring inspection checks."
        sourceReference="Cadence rule records."
      />
    </div>
  );
}

export function RulesSnapshotsPage() {
  const { data: rows = [] } = useRulesSnapshotsQuery();
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Rule Snapshots</h2>
      </div>
      <div className="card">
        <RuleTable
          rows={rows}
          columns={[
            { key: "id", label: "Snapshot", render: (row) => row.id },
            { key: "jurisdiction", label: "Jurisdiction", render: (row) => row.context?.jurisdictionKey || "n/a" },
            { key: "program", label: "Program", render: (row) => row.context?.programFamilyKey || "n/a" },
            { key: "generatedAt", label: "Generated", render: (row) => row.generatedAt || row.createdAt || "n/a" },
          ]}
        />
      </div>
      <ScreenSemantics
        whatIsThis="Rule snapshot history."
        stageState="Durable snapshot IDs for replayable evaluations."
        missing="Snapshots for some run paths may not exist yet."
        whyItMatters="Snapshots anchor repeatability and audit replay."
        resolvesBy="Persist snapshots during gate/export flow."
        whatNext="Reference snapshot IDs in manifest and export detail."
        sourceReference="Rule snapshot persistence contract."
      />
    </div>
  );
}

export function RulesPreviewsPage() {
  const { data: rows = [] } = useRulesPreviewsQuery();
  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Rule Previews</h2>
      </div>
      <div className="card">
        <RuleTable
          rows={rows}
          columns={[
            { key: "id", label: "Preview", render: (row) => row.id },
            { key: "ruleId", label: "Rule", render: (row) => row.ruleId },
            { key: "context", label: "Context", render: (row) => row.previewContext },
            { key: "result", label: "Result", render: (row) => row.result },
            { key: "computed", label: "Computed", render: (row) => row.lastComputedAt },
          ]}
        />
      </div>
      <ScreenSemantics
        whatIsThis="Rule evaluation previews."
        stageState="Preview outcomes by context path."
        missing="Previews for full jurisdiction matrix."
        whyItMatters="Previews catch precedence errors before production usage."
        resolvesBy="Expand preview fixtures and regression tests."
        whatNext="Run route-driven scenario checks."
        sourceReference="Rule preview artifacts."
      />
    </div>
  );
}
