import { beforeEach, describe, expect, it } from "vitest";
import { buildWizardPlan } from "@/lib/wizardAbstractionService";
import { evaluateGate } from "@/lib/gateEngine";
import { createExportJob } from "@/lib/exportEngine";
import { localDb } from "@/lib/localDb";
import { createTransitionAttempt } from "@/lib/transitionEngine";
import { wizardScenarios } from "./fixtures/wizardScenarios";
import { getProjectWorkspaceQuery } from "@/lib/controlPlaneQueries";

describe("local end-to-end seam", () => {
  beforeEach(() => {
    localDb.resetForTests();
  });

  it("runs project -> plan -> answers -> gate -> transition -> export -> manifest deterministically", async () => {
    const plan = buildWizardPlan(wizardScenarios.marinPrePermit.selection);
    const evaluation = evaluateGate({
      plan,
      answers: wizardScenarios.marinPrePermit.answersBlocked,
      attachedDocuments: [],
      attachments: [],
    });
    expect(evaluation.status).toBe("blocked");
    expect(evaluation.blockers.map((item) => item.code)).toContain("MARIN_TRIGGER_ACK_REQUIRED");

    const run = localDb.createRun({
      projectId: plan.context.projectId,
      projectName: plan.context.projectName,
      programKey: plan.context.programFamilyKey,
      inspectionTypeCode: plan.context.inspectionTypeCode,
      stageCode: plan.context.workflowStageCode,
      mode: "desktop",
      answers: wizardScenarios.marinPrePermit.answersBlocked,
      attachedDocuments: [],
      attachments: [],
      status: "draft",
    });

    localDb.upsertRuleSnapshot({
      id: evaluation.ruleSnapshotId,
      context: plan.context,
      ruleIds: evaluation.ruleIdsUsed,
      sourceRecordIds: evaluation.sourceRecordIdsUsed,
      generatedAt: new Date().toISOString(),
    });

    const stageGateEvaluation = localDb.createStageGateEvaluation({
      runId: run.id,
      context: plan.context,
      evaluation,
      ruleSnapshotId: evaluation.ruleSnapshotId,
      sourceRecordIdsUsed: evaluation.sourceRecordIdsUsed,
    });
    const transitionAttempt = createTransitionAttempt({
      runId: run.id,
      context: plan.context,
      evaluation,
      action: "save_draft",
    });
    const transitionRecord = localDb.createTransitionAttempt(transitionAttempt);

    const { exportRecord, manifestRecord } = await createExportJob({
      runId: run.id,
      stageGateEvaluationId: stageGateEvaluation.id,
      attachments: [{ kind: "photo", tag: "field", durableRef: "file://field.jpg" }],
      transitionAttemptId: transitionRecord.attemptId,
    });

    const persistedTransition = localDb.getTransitionAttempt(transitionRecord.attemptId);
    const manifestSourceRows = localDb.listManifestSourceEntries(manifestRecord.id);

    expect(plan.template.title).toBe("Special Inspections Pre-Permit Packet");
    expect(persistedTransition?.runId).toBe(run.id);
    expect(persistedTransition?.action).toBe("save_draft");
    expect(exportRecord.workflowRunId).toBe(run.id);
    expect(exportRecord.stageGateEvaluationId).toBe(stageGateEvaluation.id);
    expect(exportRecord.transitionAttemptId).toBe(transitionRecord.attemptId);
    expect(manifestRecord.ruleSnapshotId).toBe(evaluation.ruleSnapshotId);
    expect(manifestSourceRows).toHaveLength(evaluation.sourceRecordIdsUsed.length);
    expect(manifestRecord.sourceEntries.map((item) => item.sourceRecordId)).toEqual(
      evaluation.sourceRecordIdsUsed
    );
    expect(manifestRecord.basisDisclosures.some((item) => item.verificationStatus === "verified-indirect")).toBe(
      true
    );
    expect(manifestRecord.evidenceInventory.attachmentCount).toBe(1);
    expect(manifestRecord.exceptions.some((item) => item.code === "MARIN_TRIGGER_ACK_REQUIRED")).toBe(
      true
    );

    const workspace = getProjectWorkspaceQuery(plan.context.projectId);
    expect(workspace.exports.some((item) => item.id === exportRecord.id)).toBe(true);
    expect(workspace.summary.runCount).toBeGreaterThan(0);
  });
});
