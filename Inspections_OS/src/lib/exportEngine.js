import {
  createContentHash,
  createEvidenceId,
  createManifestId,
  createPacketId,
} from "@/lib/ids";
import { localDb } from "@/lib/localDb";
import { buildWizardPlan } from "@/lib/wizardAbstractionService";

/**
 * @param {import("@/contracts/types").GateEvaluation} evaluation
 */
function resolveManifestSourceEntries(evaluation) {
  const sourceIds = evaluation.sourceRecordIdsUsed || [];
  return sourceIds
    .map((sourceRecordId) => localDb.getSourceRecordById(sourceRecordId))
    .filter(Boolean)
    .map((src) => ({
      sourceRecordId: src.id,
      title: src.title,
      packetRole: src.packetRole,
      verificationStatus: src.verificationStatus,
      fingerprintHash: src.fingerprintHash,
      verifiedAt: src.verifiedAt,
      lastSeenAt: src.lastSeenAt,
      stale: src.stale,
    }));
}

/**
 * @param {ReturnType<typeof resolveManifestSourceEntries>} sourceEntries
 */
function buildBasisDisclosures(sourceEntries) {
  const nuanceStatuses = new Set(["verified-indirect", "inferred-direct", "gap-note"]);
  const staleSources = sourceEntries.filter((entry) => entry.stale);
  return sourceEntries
    .filter((entry) => nuanceStatuses.has(entry.verificationStatus))
    .map((entry) => ({
      sourceRecordId: entry.sourceRecordId,
      title: entry.title,
      verificationStatus: entry.verificationStatus,
      note: `Source basis is ${entry.verificationStatus} and should be disclosed in export defensibility records.`,
    }))
    .concat(
      staleSources.map((entry) => ({
        sourceRecordId: entry.sourceRecordId,
        title: entry.title,
        verificationStatus: entry.verificationStatus,
        note: "Source record appears stale and should be refreshed before submission.",
      }))
    );
}

/**
 * @param {import("@/contracts/types").TransitionAttempt | null} transitionAttempt
 * @param {import("@/contracts/types").GateBlocker} blocker
 */
function getWaiverDetails(transitionAttempt, blocker) {
  if (!transitionAttempt) {
    return {
      waived: false,
      waiverReason: null,
      transitionAttemptId: null,
    };
  }

  const appliesToBlocker = (transitionAttempt.blockerCodes || []).includes(blocker.code);
  const waived =
    transitionAttempt.action === "waive" &&
    transitionAttempt.allowed &&
    appliesToBlocker;

  return {
    waived,
    waiverReason: waived ? transitionAttempt.waiverReason : null,
    transitionAttemptId: transitionAttempt.attemptId || null,
  };
}

/**
 * @param {import("@/contracts/types").TransitionAttempt | null} transitionAttempt
 * @param {import("@/contracts/types").GateEvaluation} evaluation
 */
function buildWaiverSection(transitionAttempt, evaluation) {
  const waivedBlockerCodes =
    transitionAttempt?.action === "waive" && transitionAttempt.allowed
      ? (transitionAttempt.blockerCodes || []).slice()
      : [];

  return {
    transitionAttemptId: transitionAttempt?.attemptId || null,
    action: transitionAttempt?.action || null,
    allowed: Boolean(transitionAttempt?.allowed),
    reason: transitionAttempt?.reason || null,
    waiverReason: transitionAttempt?.waiverReason || null,
    waivedBlockerCodes,
    blockerCodesAtEvaluation: (evaluation.blockers || []).map((item) => item.code),
  };
}

/**
 * @param {ReadonlyArray<Record<string, unknown>>} attachments
 */
function normalizeEvidenceItems(attachments) {
  return attachments
    .map((attachment, index) => {
      const kind = typeof attachment.kind === "string" ? attachment.kind : "file";
      const tag = typeof attachment.tag === "string" ? attachment.tag : null;
      const durableRef =
        typeof attachment.durableRef === "string"
          ? attachment.durableRef
          : typeof attachment.url === "string"
          ? attachment.url
          : `local://${kind}/${index + 1}`;
      const hashSource = JSON.stringify({ kind, tag, durableRef, attachment });
      const hash =
        typeof attachment.hash === "string"
          ? attachment.hash
          : createContentHash(hashSource, "evh");

      return {
        evidenceId:
          typeof attachment.evidenceId === "string"
            ? attachment.evidenceId
            : createEvidenceId(),
        kind,
        tag,
        durableRef,
        hash,
        order: index + 1,
      };
    })
    .sort((a, b) => a.order - b.order);
}

/**
 * @param {import("@/contracts/types").GateEvaluation} evaluation
 */
function buildOmissionDisclosures(evaluation) {
  return evaluation.requirements
    .filter((item) => !item.met)
    .map((item) => `${item.type}:${item.key}`);
}

/**
 * @param {ReturnType<import("@/lib/wizardAbstractionService").buildWizardPlan>} plan
 * @param {import("@/contracts/types").GateEvaluation} evaluation
 */
function buildAssemblyGraph(plan, evaluation) {
  const requiredSections = ["cover_sheet", "gate_summary", "verification_manifest"];
  const optionalSections = ["supporting_evidence", "issue_log"];
  const blockerSections =
    evaluation.status === "blocked"
      ? ["blocker_disclosure", "waiver_disclosure"]
      : [];

  return {
    requiredSections,
    optionalSections,
    blockerSections,
    manifestAppendixSections: ["manifest_source_entries", "evidence_inventory"],
    omissionDisclosures: buildOmissionDisclosures(evaluation),
  };
}

/**
 * @param {{
 *  exportJobId: string
 *  plan: ReturnType<import("@/lib/wizardAbstractionService").buildWizardPlan>
 *  evaluation: import("@/contracts/types").GateEvaluation
 *  run: Record<string, unknown>
 *  transitionAttempt?: import("@/contracts/types").TransitionAttempt | null
 *  attachments?: ReadonlyArray<Record<string, unknown>>
 * }} input
 */
export function buildVerificationManifest({
  exportJobId,
  plan,
  evaluation,
  run,
  transitionAttempt = null,
  attachments = [],
}) {
  const evidenceItems = normalizeEvidenceItems(attachments);
  const sourceEntries = resolveManifestSourceEntries(evaluation);

  return {
    manifestId: createManifestId(),
    exportJobId,
    ruleSnapshotId: evaluation.ruleSnapshotId,
    jurisdictionKey: plan.context.jurisdictionKey,
    countyGroup: plan.context.countyGroup,
    inspectionTypeCode: plan.context.inspectionTypeCode,
    stageCode: plan.context.workflowStageCode,
    sourceEntries,
    evidenceInventory: {
      attachedDocuments: run.attachedDocuments || [],
      evidenceItems,
      attachmentCount: evidenceItems.length,
    },
    assemblyGraph: buildAssemblyGraph(plan, evaluation),
    basisDisclosures: buildBasisDisclosures(sourceEntries),
    waiverSection: buildWaiverSection(transitionAttempt, evaluation),
    exceptions: evaluation.blockers.map((blocker) => {
      const waiverDetails = getWaiverDetails(transitionAttempt, blocker);
      return {
        code: blocker.code,
        message: blocker.message,
        packetRole: blocker.packetRole,
        severity: blocker.severity,
        ...waiverDetails,
      };
    }),
  };
}

/**
 * @param {{
 *  plan: ReturnType<import("@/lib/wizardAbstractionService").buildWizardPlan>
 *  evaluation: import("@/contracts/types").GateEvaluation
 *  run: Record<string, unknown>
 *  manifest: import("@/contracts/types").VerificationManifest
 * }} input
 */
export function buildPacketModel({ plan, evaluation, run, manifest }) {
  const waivedExceptions = manifest.exceptions.filter((item) => item.waived);
  return {
    packetId: createPacketId(),
    packetClass: plan.packetClass,
    title: `${plan.program.name} - ${plan.stage.name}`,
    projectName: plan.project.name,
    runId: run.id,
    generatedAt: new Date().toISOString(),
    evaluation,
    manifest,
    answers: run.answers,
    waiverSummary: {
      transitionAttemptId: manifest.waiverSection?.transitionAttemptId || null,
      waiverAction: manifest.waiverSection?.action || null,
      waiverAllowed: Boolean(manifest.waiverSection?.allowed),
      waiverReason: manifest.waiverSection?.waiverReason || null,
      waivedExceptionCodes: waivedExceptions.map((item) => item.code),
      waiverReasons: waivedExceptions.map((item) => item.waiverReason).filter(Boolean),
    },
  };
}

export async function renderPacketPdf(packet) {
  const { renderPacketPdfBlob } = await import("@/lib/pdfRenderer");
  return renderPacketPdfBlob(packet);
}

function resolveTransitionAttempt(input, run) {
  if (input.transitionAttemptId) {
    return localDb.getTransitionAttempt(input.transitionAttemptId);
  }
  if (run?.id) {
    return localDb.listTransitionAttemptsByRun(run.id)[0] || null;
  }
  return null;
}

/**
 * @param {{
 *  plan?: ReturnType<import("@/lib/wizardAbstractionService").buildWizardPlan>
 *  evaluation?: import("@/contracts/types").GateEvaluation
 *  run?: Record<string, unknown>
 *  runId?: string
 *  stageGateEvaluationId?: string
 *  transitionAttemptId?: string
 *  attachments?: ReadonlyArray<Record<string, unknown>>
 * }} input
 */
function normalizeExportInput(input) {
  const run = input.run || (input.runId ? localDb.getRun(input.runId) : null);
  const stageEvaluation = input.stageGateEvaluationId
    ? localDb.getStageGateEvaluation(input.stageGateEvaluationId)
    : null;

  if (!run) {
    throw new Error("Export requires a workflow run");
  }

  const plan =
    input.plan ||
    buildWizardPlan({
      projectId: run.projectId,
      programKey: run.programKey,
      inspectionTypeCode: run.inspectionTypeCode,
      stageCode: run.stageCode,
      mode: run.mode,
    });

  const evaluation = input.evaluation || stageEvaluation?.evaluation;
  if (!evaluation) {
    throw new Error("Export requires a gate evaluation payload");
  }

  const transitionAttempt = resolveTransitionAttempt(input, run);

  return {
    plan,
    run,
    evaluation,
    stageGateEvaluationId: stageEvaluation?.id || input.stageGateEvaluationId || null,
    transitionAttemptId: transitionAttempt?.attemptId || null,
    transitionAttempt,
    attachments: input.attachments || run.attachments || [],
  };
}

/**
 * @param {{
 *  plan?: ReturnType<import("@/lib/wizardAbstractionService").buildWizardPlan>
 *  evaluation?: import("@/contracts/types").GateEvaluation
 *  run?: Record<string, unknown>
 *  runId?: string
 *  stageGateEvaluationId?: string
 *  transitionAttemptId?: string
 *  attachments?: ReadonlyArray<Record<string, unknown>>
 * }} input
 */
export async function createExportJob(input) {
  const {
    plan,
    evaluation,
    run,
    stageGateEvaluationId,
    transitionAttemptId,
    transitionAttempt,
    attachments,
  } = normalizeExportInput(input);

  const exportRecord = localDb.createExport({
    workflowRunId: run.id,
    stageGateEvaluationId,
    transitionAttemptId,
    packetClass: plan.packetClass,
    title: `${plan.program.name} - ${plan.stage.name}`,
    ruleSnapshotId: evaluation.ruleSnapshotId,
    sourceRecordIdsUsed: evaluation.sourceRecordIdsUsed,
  });

  const manifest = buildVerificationManifest({
    exportJobId: exportRecord.id,
    plan,
    evaluation,
    run,
    transitionAttempt,
    attachments,
  });

  const manifestRecord = localDb.createManifest(manifest);

  const manifestSourceEntries = localDb.createManifestSourceEntries(
    manifest.sourceEntries.map((entry) => ({
      manifestId: manifestRecord.id,
      exportJobId: exportRecord.id,
      ...entry,
    }))
  );

  const linkedExport = localDb.updateExport(exportRecord.id, {
    manifestId: manifestRecord.id,
  });

  const packet = buildPacketModel({
    plan,
    evaluation,
    run,
    manifest: {
      ...manifestRecord,
      sourceEntries: manifestSourceEntries,
    },
  });

  return {
    packet,
    manifestRecord: { ...manifestRecord, sourceEntries: manifestSourceEntries },
    exportRecord: linkedExport || exportRecord,
  };
}
