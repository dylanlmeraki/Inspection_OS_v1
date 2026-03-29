import { uid } from "@/lib/ids";

function getValue(objectValue, path) {
  return path
    .split(".")
    .reduce((accumulator, key) => (accumulator == null ? undefined : accumulator[key]), objectValue);
}

function stableHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function canonicalizeArray(values) {
  return (Array.isArray(values) ? values.slice() : [])
    .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
    .sort((left, right) => left.localeCompare(right));
}

function canonicalizeRulesForSnapshot(rules) {
  return (Array.isArray(rules) ? rules : [])
    .map((rule) => ({
      id: rule.id,
      scopeLevel: rule.scopeLevel || null,
      scopeKey: rule.scopeKey || null,
      priority: rule.priority ?? null,
      mergeKey: rule.mergeKey || null,
      mergeStrategy: rule.mergeStrategy || "replace",
      severity: rule.severity || "blocker",
      blockerCode: rule.blockerCode || null,
      packetRole: rule.packetRole || null,
      effectiveFrom: rule.effectiveFrom || null,
      effectiveTo: rule.effectiveTo || null,
      supersedes: canonicalizeArray(rule.supersedes),
      requiredFields: canonicalizeArray(rule.requiredFields),
      requiredQuestions: canonicalizeArray(rule.requiredQuestions),
      requiredDocuments: canonicalizeArray(rule.requiredDocuments),
      requiredSourceRecordIds: canonicalizeArray(rule.requiredSourceRecordIds),
      requiredAttachments: canonicalizeArray(rule.requiredAttachments),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function canonicalizeSourcesForSnapshot(sourceRecords) {
  return (Array.isArray(sourceRecords) ? sourceRecords : [])
    .map((source) => ({
      id: source.id,
      verificationStatus: source.verificationStatus || null,
      fingerprintHash: source.fingerprintHash || null,
      verifiedAt: source.verifiedAt || null,
      lastSeenAt: source.lastSeenAt || null,
      stale: Boolean(source.stale),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function createRuleSnapshotId(plan) {
  const serialized = JSON.stringify({
    context: {
      jurisdictionKey: plan.context.jurisdictionKey,
      countyGroup: plan.context.countyGroup,
      projectId: plan.context.projectId,
      programFamilyKey: plan.context.programFamilyKey,
      inspectionTypeCode: plan.context.inspectionTypeCode,
      workflowStageCode: plan.context.workflowStageCode,
      evaluationDate: plan.context.evaluationDate || null,
    },
    rules: canonicalizeRulesForSnapshot(plan.rules),
    sourceRecords: canonicalizeSourcesForSnapshot(plan.sourceRecords),
  });
  return `rs_${stableHash(serialized)}`;
}

function evaluateValuePresence(value) {
  return value !== undefined && value !== null && value !== "" && value !== false;
}

function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value;
}

function buildRequirementKey(type, key) {
  return `${type}:${key}`;
}

function toRequiredQuestionMet(value) {
  return value === true || value === "yes" || value === "confirmed";
}

/**
 * @param {Array<Record<string, unknown>>} rules
 * @param {"requiredFields"|"requiredQuestions"|"requiredDocuments"} key
 */
function buildRequirementSeverityMap(rules, key) {
  const severityByKey = new Map();
  (rules || []).forEach((rule) => {
    const severity = rule.severity === "warning" ? "warning" : "blocker";
    const requirementKeys = Array.isArray(rule[key]) ? rule[key] : [];
    requirementKeys.forEach((item) => {
      if (typeof item !== "string") return;
      const existing = severityByKey.get(item);
      if (existing === "blocker" || severity === "blocker") {
        severityByKey.set(item, "blocker");
      } else {
        severityByKey.set(item, "warning");
      }
    });
  });
  return severityByKey;
}

/**
 * @param {import("@/contracts/types").GateRequirement[]} requirements
 */
function createRequirementMap(requirements) {
  const map = new Map();
  requirements.forEach((item) => {
    map.set(buildRequirementKey(item.type, item.key), item);
  });
  return map;
}

/**
 * @param {{
 *   plan: ReturnType<import("@/lib/wizardAbstractionService").buildWizardPlan>
 *   answers?: Record<string, unknown>
 *   attachedDocuments?: readonly string[]
 *   attachments?: ReadonlyArray<Record<string, unknown>>
 * }} input
 * @returns {import("@/contracts/types").GateEvaluation}
 */
export function evaluateGate({
  plan,
  answers = {},
  attachedDocuments = [],
  attachments = [],
}) {
  const answerRecord = asRecord(answers);

  const merged = {
    ...plan.project,
    site: { ...(plan.project.site || {}), ...asRecord(answerRecord.site) },
    swppp: { ...(plan.project.swppp || {}), ...asRecord(answerRecord.swppp) },
    specialInspections: {
      ...(plan.project.specialInspections || {}),
      ...asRecord(answerRecord.specialInspections),
    },
    opening: { ...asRecord(answerRecord.opening) },
    closeout: { ...asRecord(answerRecord.closeout) },
  };

  /** @type {import("@/contracts/types").GateRequirement[]} */
  const requirements = [];
  /** @type {import("@/contracts/types").GateBlocker[]} */
  const blockers = [];
  /** @type {import("@/contracts/types").GateBlocker[]} */
  const warnings = [];
  const fieldSeverityMap = buildRequirementSeverityMap(plan.rules, "requiredFields");
  const questionSeverityMap = buildRequirementSeverityMap(plan.rules, "requiredQuestions");
  const documentSeverityMap = buildRequirementSeverityMap(plan.rules, "requiredDocuments");

  for (const key of plan.requiredFieldKeys) {
    const value = getValue(merged, key);
    const met = evaluateValuePresence(value);
    const severity = fieldSeverityMap.get(key) || "blocker";
    requirements.push({
      type: "field",
      key,
      met,
      severity,
      message: met ? `${key} provided` : `${key} is required`,
    });
  }

  for (const key of plan.requiredQuestionKeys) {
    const value = getValue(merged, key);
    const met = toRequiredQuestionMet(value);
    const severity = questionSeverityMap.get(key) || "blocker";
    requirements.push({
      type: "question",
      key,
      met,
      severity,
      message: met ? `${key} confirmed` : `${key} must be confirmed`,
    });
  }

  for (const key of plan.requiredDocumentKeys) {
    const met = attachedDocuments.includes(key);
    const severity = documentSeverityMap.get(key) || "blocker";
    requirements.push({
      type: "document",
      key,
      met,
      severity,
      message: met ? `${key} attached` : `${key} is required`,
    });
  }

  const requirementMap = createRequirementMap(requirements);

  for (const rule of plan.rules) {
    const unmetForRule = [];

    for (const fieldKey of rule.requiredFields || []) {
      const requirement = requirementMap.get(buildRequirementKey("field", fieldKey));
      if (requirement && !requirement.met) {
        unmetForRule.push(requirement);
      }
    }

    for (const questionKey of rule.requiredQuestions || []) {
      const requirement = requirementMap.get(buildRequirementKey("question", questionKey));
      if (requirement && !requirement.met) {
        unmetForRule.push(requirement);
      }
    }

    for (const documentKey of rule.requiredDocuments || []) {
      const requirement = requirementMap.get(buildRequirementKey("document", documentKey));
      if (requirement && !requirement.met) {
        unmetForRule.push(requirement);
      }
    }

    for (const attachmentRule of rule.requiredAttachments || []) {
      const matching = attachments.filter(
        (attachment) =>
          attachment.kind === attachmentRule.kind &&
          (!attachmentRule.tag || attachment.tag === attachmentRule.tag)
      );
      const met = matching.length >= (attachmentRule.minimum || 1);
      requirements.push({
        type: "attachment",
        key: `${attachmentRule.kind}:${attachmentRule.tag || "any"}`,
        met,
        severity: rule.severity === "warning" ? "warning" : "blocker",
        message: met
          ? "Attachment rule satisfied"
          : `Need ${attachmentRule.minimum || 1}+ ${attachmentRule.kind} attachment(s)`,
      });
      if (!met) {
        unmetForRule.push({
          type: "attachment",
          key: `${attachmentRule.kind}:${attachmentRule.tag || "any"}`,
          met,
          message: `Need ${attachmentRule.minimum || 1}+ ${attachmentRule.kind} attachment(s)`,
          severity: rule.severity === "warning" ? "warning" : "blocker",
        });
      }
    }

    if (!unmetForRule.length) continue;

    const severity = rule.severity === "warning" ? "warning" : "blocker";
    /** @type {import("@/contracts/types").GateBlocker} */
    const entry = {
      code: rule.blockerCode || `RULE_${uid("rule")}`,
      message: rule.message,
      packetRole: rule.packetRole,
      sourceRecordIds: rule.requiredSourceRecordIds || [],
      waiverAllowed: Boolean(rule["waiverAllowed"] ?? false),
      severity: /** @type {import("@/contracts/types").GateSeverity} */ (severity),
    };

    if (entry.severity === "warning") warnings.push(entry);
    else blockers.push(entry);
  }

  const uniqueBlockers = Array.from(new Map(blockers.map((item) => [item.code, item])).values());
  const uniqueWarnings = Array.from(new Map(warnings.map((item) => [item.code, item])).values());
  const waiverEligible =
    uniqueBlockers.length > 0 && uniqueBlockers.every((item) => item.waiverAllowed);

  return {
    status: uniqueBlockers.length ? "blocked" : "pass",
    requirements,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    metCount: requirements.filter((item) => item.met).length,
    unmetCount: requirements.filter((item) => !item.met).length,
    ruleSnapshotId: createRuleSnapshotId(plan),
    ruleIdsUsed: plan.rules.map((rule) => rule.id),
    sourceRecordIdsUsed: plan.sourceRecordIds,
    waiverEligible,
  };
}
