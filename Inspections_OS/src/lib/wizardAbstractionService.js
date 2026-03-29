import {
  PACKET_RULES,
  PROGRAMS,
  TEMPLATE_LIBRARY,
  WORKFLOWS,
} from "@/domain/seedData";
import { localDb } from "@/lib/localDb";

const EMPTY_TEMPLATE = {
  title: "Untitled Template",
  fields: [],
  questions: [],
  documents: [],
  prompts: [],
};

const getProgram = (key) => PROGRAMS.find((program) => program.key === key);
const getWorkflow = (key) => WORKFLOWS[key];

const SCOPE_PRECEDENCE = {
  tenant: 6,
  project: 5,
  city: 4,
  county: 3,
  regional: 2,
  statewide: 1,
};

const DEFAULT_SCOPE_PRIORITY = {
  tenant: 1000,
  project: 900,
  city: 700,
  county: 500,
  regional: 300,
  statewide: 100,
};

function normalizeScopeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueArray(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseIsoToMillis(value) {
  if (!value) return null;
  const milliseconds = Date.parse(value);
  return Number.isNaN(milliseconds) ? null : milliseconds;
}

function inferLegacyScope(rule) {
  if (rule.scopeLevel && rule.scopeKey) {
    return {
      scopeLevel: rule.scopeLevel,
      scopeKey: rule.scopeKey,
      priority: rule.priority ?? DEFAULT_SCOPE_PRIORITY[rule.scopeLevel] ?? 0,
    };
  }

  if (rule.jurisdictionKey === "ca_statewide") {
    return {
      scopeLevel: "statewide",
      scopeKey: "ca_statewide",
      priority: DEFAULT_SCOPE_PRIORITY.statewide,
    };
  }

  if (String(rule.jurisdictionKey || "").includes("_county")) {
    return {
      scopeLevel: "county",
      scopeKey: rule.jurisdictionKey,
      priority: DEFAULT_SCOPE_PRIORITY.county,
    };
  }

  return {
    scopeLevel: "city",
    scopeKey: rule.jurisdictionKey,
    priority: DEFAULT_SCOPE_PRIORITY.city,
  };
}

function normalizeRule(rule) {
  const legacyScope = inferLegacyScope(rule);
  return {
    ...rule,
    ...legacyScope,
    mergeStrategy: rule.mergeStrategy || "replace",
    supersedes: asArray(rule.supersedes),
    effectiveFrom: rule.effectiveFrom || null,
    effectiveTo: rule.effectiveTo || null,
  };
}

function buildScopeSet(...values) {
  const out = new Set();
  values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .forEach((value) => {
      out.add(value);
      out.add(normalizeScopeKey(value));
    });
  return out;
}

function buildContextScopes(context) {
  const normalizedCounty = normalizeScopeKey(context.countyGroup);
  const countyFromJurisdiction = String(context.jurisdictionKey || "").includes("_county")
    ? context.jurisdictionKey
    : null;
  const cityFromJurisdiction = countyFromJurisdiction ? null : context.jurisdictionKey;

  return {
    tenant: buildScopeSet(context.tenantKey),
    project: buildScopeSet(context.projectId),
    city: buildScopeSet(cityFromJurisdiction, context.cityKey),
    county: buildScopeSet(countyFromJurisdiction, context.countyKey, normalizedCounty),
    regional: buildScopeSet(context.regionalKeys || []),
    statewide: buildScopeSet("ca_statewide"),
  };
}

function ruleMatchesScope(rule, contextScopes) {
  const normalizedScopeKey = normalizeScopeKey(rule.scopeKey);

  if (rule.scopeLevel === "tenant") {
    return contextScopes.tenant.has(rule.scopeKey) || contextScopes.tenant.has(normalizedScopeKey);
  }
  if (rule.scopeLevel === "project") {
    return contextScopes.project.has(rule.scopeKey) || contextScopes.project.has(normalizedScopeKey);
  }
  if (rule.scopeLevel === "city") {
    return contextScopes.city.has(rule.scopeKey) || contextScopes.city.has(normalizedScopeKey);
  }
  if (rule.scopeLevel === "county") {
    return (
      contextScopes.county.has(rule.scopeKey) ||
      contextScopes.county.has(normalizedScopeKey)
    );
  }
  if (rule.scopeLevel === "regional") {
    return (
      contextScopes.regional.has(rule.scopeKey) ||
      contextScopes.regional.has(normalizedScopeKey)
    );
  }
  if (rule.scopeLevel === "statewide") {
    return contextScopes.statewide.has(rule.scopeKey) || contextScopes.statewide.has(normalizedScopeKey);
  }

  return false;
}

function ruleIsEffective(rule, evaluationTimestamp) {
  const startsAt = parseIsoToMillis(rule.effectiveFrom);
  const endsAt = parseIsoToMillis(rule.effectiveTo);
  if (startsAt !== null && evaluationTimestamp < startsAt) return false;
  if (endsAt !== null && evaluationTimestamp > endsAt) return false;
  return true;
}

function compareRulePrecedence(left, right) {
  if (right.priority !== left.priority) {
    return right.priority - left.priority;
  }
  const leftScope = SCOPE_PRECEDENCE[left.scopeLevel] ?? 0;
  const rightScope = SCOPE_PRECEDENCE[right.scopeLevel] ?? 0;
  if (rightScope !== leftScope) {
    return rightScope - leftScope;
  }
  const leftEffectiveFrom = parseIsoToMillis(left.effectiveFrom) ?? 0;
  const rightEffectiveFrom = parseIsoToMillis(right.effectiveFrom) ?? 0;
  if (rightEffectiveFrom !== leftEffectiveFrom) {
    return rightEffectiveFrom - leftEffectiveFrom;
  }
  return left.id.localeCompare(right.id);
}

function mergeRuleUnion(primaryRule, secondaryRule) {
  return {
    ...primaryRule,
    requiredFields: uniqueArray([
      ...asArray(primaryRule.requiredFields),
      ...asArray(secondaryRule.requiredFields),
    ]),
    requiredQuestions: uniqueArray([
      ...asArray(primaryRule.requiredQuestions),
      ...asArray(secondaryRule.requiredQuestions),
    ]),
    requiredDocuments: uniqueArray([
      ...asArray(primaryRule.requiredDocuments),
      ...asArray(secondaryRule.requiredDocuments),
    ]),
    requiredSourceRecordIds: uniqueArray([
      ...asArray(primaryRule.requiredSourceRecordIds),
      ...asArray(secondaryRule.requiredSourceRecordIds),
    ]),
    requiredAttachments: uniqueArray(
      [...asArray(primaryRule.requiredAttachments), ...asArray(secondaryRule.requiredAttachments)].map(
        (item) => JSON.stringify(item)
      )
    ).map((item) => JSON.parse(item)),
    supersedes: uniqueArray([
      ...asArray(primaryRule.supersedes),
      ...asArray(secondaryRule.supersedes),
    ]),
    severity:
      primaryRule.severity === "blocker" || secondaryRule.severity === "blocker"
        ? "blocker"
        : "warning",
    waiverAllowed:
      Boolean(primaryRule.waiverAllowed) && Boolean(secondaryRule.waiverAllowed),
    mergeStrategy: "merge_union",
  };
}

function buildMergeKey(rule) {
  return (
    rule.mergeKey ||
    `${rule.programKey}:${rule.inspectionTypeCode}:${rule.stageCode}:${rule.blockerCode || rule.id}`
  );
}

function toTraceEntry(rule, evaluationTimestamp) {
  return {
    ruleId: rule.id,
    scopeLevel: rule.scopeLevel,
    scopeKey: rule.scopeKey,
    priority: rule.priority,
    mergeKey: buildMergeKey(rule),
    mergeStrategy: rule.mergeStrategy,
    effectiveFrom: rule.effectiveFrom,
    effectiveTo: rule.effectiveTo,
    evaluationDate: new Date(evaluationTimestamp).toISOString(),
    status: "candidate",
    reason: "Rule matched program/type/stage",
    winnerRuleId: null,
    supersededRuleIds: [],
  };
}

function stripRuleInternals(rule) {
  const clean = { ...rule };
  delete clean.__scopeMatched;
  delete clean.__effective;
  delete clean.__mergeKey;
  return clean;
}

function getRuleResolutionForContext(context) {
  const contextScopes = buildContextScopes(context);
  const evaluationTimestamp = parseIsoToMillis(context.evaluationDate) ?? Date.now();
  const candidates = PACKET_RULES
    .filter(
      (rule) =>
        rule.programKey === context.programFamilyKey &&
        rule.inspectionTypeCode === context.inspectionTypeCode &&
        rule.stageCode === context.workflowStageCode
    )
    .map((rule) => normalizeRule(rule))
    .map((rule) => ({
      ...rule,
      __scopeMatched: ruleMatchesScope(rule, contextScopes),
      __effective: ruleIsEffective(rule, evaluationTimestamp),
      __mergeKey: buildMergeKey(rule),
    }));

  /** @type {Map<string, ReturnType<typeof toTraceEntry>>} */
  const traceByRuleId = new Map();
  const activeCandidates = candidates
    .filter((rule) => {
      traceByRuleId.set(rule.id, toTraceEntry(rule, evaluationTimestamp));
      if (!rule.__scopeMatched) {
        traceByRuleId.set(rule.id, {
          ...traceByRuleId.get(rule.id),
          status: "filtered_scope_miss",
          reason: "Scope did not match resolved wizard context",
        });
        return false;
      }
      if (!rule.__effective) {
        traceByRuleId.set(rule.id, {
          ...traceByRuleId.get(rule.id),
          status: "filtered_inactive_window",
          reason: "Rule was outside effectiveFrom/effectiveTo for evaluation date",
        });
        return false;
      }
      traceByRuleId.set(rule.id, {
        ...traceByRuleId.get(rule.id),
        status: "candidate_active",
        reason: "Rule is active for scope and evaluation date",
      });
      return true;
    })
    .sort(compareRulePrecedence);

  const mergedRules = [];
  const resolvedRuleIds = new Set();
  const suppressedRuleIds = new Set();
  const winnerByMergeKey = new Map();

  for (const rule of activeCandidates) {
    if (suppressedRuleIds.has(rule.id)) {
      traceByRuleId.set(rule.id, {
        ...traceByRuleId.get(rule.id),
        status: "ignored_superseded",
        reason: "Rule was superseded by a higher-precedence winner",
      });
      continue;
    }

    const traceEntry = traceByRuleId.get(rule.id);
    rule.supersedes.forEach((supersededId) => {
      if (!resolvedRuleIds.has(supersededId)) {
        suppressedRuleIds.add(supersededId);
      }
    });
    traceByRuleId.set(rule.id, {
      ...traceEntry,
      supersededRuleIds: rule.supersedes.slice(),
    });

    const existingIndex = winnerByMergeKey.get(rule.__mergeKey);
    if (existingIndex === undefined) {
      mergedRules.push(rule);
      winnerByMergeKey.set(rule.__mergeKey, mergedRules.length - 1);
      resolvedRuleIds.add(rule.id);
      traceByRuleId.set(rule.id, {
        ...traceByRuleId.get(rule.id),
        status: "selected_winner",
        reason: "Highest-precedence active rule for merge key",
      });
      continue;
    }

    if (rule.mergeStrategy === "append") {
      mergedRules.push(rule);
      resolvedRuleIds.add(rule.id);
      traceByRuleId.set(rule.id, {
        ...traceByRuleId.get(rule.id),
        status: "selected_appended",
        reason: "mergeStrategy=append keeps this rule in addition to winner",
        winnerRuleId: mergedRules[existingIndex]?.id || null,
      });
      continue;
    }

    if (rule.mergeStrategy === "merge_union") {
      mergedRules[existingIndex] = mergeRuleUnion(mergedRules[existingIndex], rule);
      traceByRuleId.set(rule.id, {
        ...traceByRuleId.get(rule.id),
        status: "merged_into_winner",
        reason: "mergeStrategy=merge_union merged requirements into winner",
        winnerRuleId: mergedRules[existingIndex]?.id || null,
      });
      continue;
    }

    traceByRuleId.set(rule.id, {
      ...traceByRuleId.get(rule.id),
      status: "ignored_replaced_by_winner",
      reason: "mergeStrategy=replace and a higher-precedence winner already exists",
      winnerRuleId: mergedRules[existingIndex]?.id || null,
    });
  }

  const winningRules = mergedRules
    .filter((rule) => !suppressedRuleIds.has(rule.id))
    .map(stripRuleInternals);

  return {
    rules: winningRules,
    winningRuleIds: winningRules.map((rule) => rule.id),
    supersededRuleIds: [...suppressedRuleIds],
    winnerByMergeKey: Object.fromEntries(
      [...winnerByMergeKey.entries()].map(([mergeKey, index]) => [mergeKey, mergedRules[index].id])
    ),
    trace: [...traceByRuleId.values()].sort((a, b) => a.ruleId.localeCompare(b.ruleId)),
  };
}

function getPacketClass(stageCode) {
  if (stageCode.includes("closeout")) return "closeout_packet";
  if (stageCode.includes("not_")) return "closeout_packet";
  return "inspection_packet";
}

/**
 * @param {{
 *   projectId: string
 *   programKey: string
 *   inspectionTypeCode: string
 *   stageCode: string
 *   evaluationDate?: string
 * }} selection
 * @returns {import("@/contracts/types").WizardSelectionContext}
 */
export function resolveWizardContext(selection) {
  const project = localDb.getProject(selection.projectId);
  const program = getProgram(selection.programKey);
  const workflow = getWorkflow(selection.programKey);
  const stage = workflow?.stages.find((item) => item.code === selection.stageCode);
  const inspectionType = workflow?.inspectionTypes.find(
    (item) => item.code === selection.inspectionTypeCode
  );

  if (!project || !program || !workflow || !stage || !inspectionType) {
    throw new Error("Invalid wizard selection");
  }

  return {
    projectId: project.id,
    projectName: project.name,
    jurisdictionKey: project.jurisdictionKey,
    countyGroup: project.countyGroup,
    countyKey: normalizeScopeKey(project.countyGroup),
    cityKey: String(project.jurisdictionKey || "").includes("_county")
      ? null
      : project.jurisdictionKey,
    regionalKeys: ["bay_area"],
    tenantKey: project.tenantKey || null,
    programFamilyKey: program.key,
    inspectionTypeCode: inspectionType.code,
    workflowStageCode: stage.code,
    evaluationDate: selection.evaluationDate || new Date().toISOString(),
  };
}

export function listWizardOptions() {
  return localDb.listProjects().map((project) => ({
    project,
    availablePrograms: project.activePrograms
      .map((key) => {
        const program = getProgram(key);
        const workflow = getWorkflow(key);
        if (!program || !workflow) return null;
        return {
          ...program,
          stages: workflow.stages,
          inspectionTypes: workflow.inspectionTypes,
        };
      })
      .filter(Boolean),
  }));
}

/**
 * @param {import("@/contracts/types").WizardSelectionContext} context
 */
export function resolveRuleSetForContext(context) {
  return getRuleResolutionForContext(context);
}

/**
 * @param {{
 *   projectId: string
 *   programKey: string
 *   inspectionTypeCode: string
 *   stageCode: string
 *   mode?: "mobile"|"desktop"
 *   evaluationDate?: string
 * }} input
 */
export function buildWizardPlan(input) {
  const mode = input.mode ?? "mobile";
  const context = resolveWizardContext(input);
  const project = localDb.getProject(context.projectId);
  const program = getProgram(context.programFamilyKey);
  const workflow = getWorkflow(context.programFamilyKey);
  const stage = workflow?.stages.find(
    (item) => item.code === context.workflowStageCode
  );
  const inspectionType = workflow?.inspectionTypes.find(
    (item) => item.code === context.inspectionTypeCode
  );
  if (!project || !program || !workflow || !stage || !inspectionType) {
    throw new Error("Invalid wizard selection");
  }

  const ruleResolution = getRuleResolutionForContext(context);
  const rules = ruleResolution.rules;
  const template = TEMPLATE_LIBRARY[context.workflowStageCode] || {
    ...EMPTY_TEMPLATE,
    title: stage.name,
  };

  const sourceRecordIds = [
    ...new Set(rules.flatMap((rule) => rule.requiredSourceRecordIds || [])),
  ];
  const sourceRecords = localDb.listSourceRecords().filter((src) =>
    sourceRecordIds.includes(src.id)
  );

  return {
    mode,
    context,
    project,
    program,
    inspectionType,
    stage,
    template,
    rules,
    ruleResolution,
    sourceRecords,
    requiredFieldKeys: [
      ...new Set([
        ...(template.fields || []).filter((item) => item.required).map((item) => item.key),
        ...rules.flatMap((rule) => rule.requiredFields || []),
      ]),
    ],
    requiredQuestionKeys: [
      ...new Set([
        ...(template.questions || [])
          .filter((item) => item.required)
          .map((item) => item.key),
        ...rules.flatMap((rule) => rule.requiredQuestions || []),
      ]),
    ],
    requiredDocumentKeys: [
      ...new Set([
        ...(template.documents || [])
          .filter((item) => item.required)
          .map((item) => item.key),
        ...rules.flatMap((rule) => rule.requiredDocuments || []),
      ]),
    ],
    sourceRecordIds,
    packetClass: getPacketClass(stage.code),
  };
}
