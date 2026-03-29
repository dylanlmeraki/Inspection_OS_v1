import {
  ADMIN_INTEGRATIONS,
  ORGANIZATIONS,
  PACKET_RULES,
  PROJECT_ACTIVITY_SEED,
  PROJECT_MEMBERSHIPS,
  PROJECTS,
  RECURRING_CADENCE_RULES,
  RULE_PREVIEWS,
  SOURCE_RECORDS,
  TEMPLATE_FAMILIES,
  TEMPLATE_VERSIONS,
  USERS,
} from '@/domain/seedData';
import {
  createContentHash,
  createExportJobId,
  createManifestId,
  createManifestSourceEntryId,
  resetIdState,
  uid,
} from '@/lib/ids';

const STALE_WINDOW_DAYS = 120;

function isStaleTimestamp(lastSeenAt) {
  const timestamp = Date.parse(lastSeenAt);
  if (Number.isNaN(timestamp)) return true;
  const ageDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  return ageDays > STALE_WINDOW_DAYS;
}

function withSourceFreshness(sourceRecord) {
  const verifiedAt = sourceRecord.verifiedAt || '2026-01-15T00:00:00.000Z';
  const lastSeenAt = sourceRecord.lastSeenAt || verifiedAt;
  return {
    ...sourceRecord,
    verifiedAt,
    lastSeenAt,
    stale: typeof sourceRecord.stale === 'boolean' ? sourceRecord.stale : isStaleTimestamp(lastSeenAt),
  };
}

function hydrateSourceRecords(records) {
  return records.map(withSourceFreshness);
}

const memory = {
  projects: structuredClone(PROJECTS),
  organizations: structuredClone(ORGANIZATIONS),
  users: structuredClone(USERS),
  projectMemberships: structuredClone(PROJECT_MEMBERSHIPS),
  runs: [],
  issues: [],
  exports: [],
  manifests: [],
  manifestSourceEntries: [],
  stageGateEvaluations: [],
  transitionAttempts: [],
  ruleSnapshots: [],
  sourceRecords: hydrateSourceRecords(structuredClone(SOURCE_RECORDS)),
  templateFamilies: structuredClone(TEMPLATE_FAMILIES),
  templateVersions: structuredClone(TEMPLATE_VERSIONS),
  packetRules: structuredClone(PACKET_RULES),
  cadenceRules: structuredClone(RECURRING_CADENCE_RULES),
  rulePreviews: structuredClone(RULE_PREVIEWS),
  adminIntegrations: structuredClone(ADMIN_INTEGRATIONS),
  projectActivity: structuredClone(PROJECT_ACTIVITY_SEED),
  permissionAudits: [],
};

export const localDb = {
  listProjects: () => structuredClone(memory.projects),
  getProject: (id) => structuredClone(memory.projects.find((p) => p.id === id)),
  listOrganizations: () => structuredClone(memory.organizations),
  listUsers: () => structuredClone(memory.users),
  getUser: (id) => structuredClone(memory.users.find((user) => user.id === id)),
  listProjectMemberships(projectId = null) {
    const rows = projectId
      ? memory.projectMemberships.filter((item) => item.projectId === projectId)
      : memory.projectMemberships;
    return structuredClone(rows);
  },
  upsertProjectMembership(record) {
    const idx = memory.projectMemberships.findIndex((item) => item.id === record.id);
    if (idx < 0) {
      memory.projectMemberships.unshift(record);
      return structuredClone(record);
    }
    memory.projectMemberships[idx] = { ...memory.projectMemberships[idx], ...record };
    return structuredClone(memory.projectMemberships[idx]);
  },
  listSourceRecords: () => structuredClone(memory.sourceRecords),
  getSourceRecordById: (id) => structuredClone(memory.sourceRecords.find((item) => item.id === id)),
  createRun(run) {
    const r = { id: uid('run'), createdAt: new Date().toISOString(), status: 'draft', ...run };
    memory.runs.unshift(r);
    return structuredClone(r);
  },
  getRun: (id) => structuredClone(memory.runs.find((item) => item.id === id)),
  updateRun(id, patch) {
    const idx = memory.runs.findIndex((item) => item.id === id);
    if (idx < 0) return null;
    memory.runs[idx] = { ...memory.runs[idx], ...patch };
    return structuredClone(memory.runs[idx]);
  },
  listRuns: () => structuredClone(memory.runs),
  createIssue(issue) {
    const i = { id: uid('issue'), createdAt: new Date().toISOString(), status: 'open', ...issue };
    memory.issues.unshift(i);
    return structuredClone(i);
  },
  getIssue: (id) => structuredClone(memory.issues.find((item) => item.id === id)),
  updateIssue(id, patch) {
    const idx = memory.issues.findIndex((item) => item.id === id);
    if (idx < 0) return null;
    memory.issues[idx] = { ...memory.issues[idx], ...patch };
    return structuredClone(memory.issues[idx]);
  },
  listIssues: () => structuredClone(memory.issues),
  createExport(exp) {
    const e = {
      id: createExportJobId(),
      createdAt: new Date().toISOString(),
      status: 'completed',
      manifestId: null,
      ...exp,
    };
    memory.exports.unshift(e);
    return structuredClone(e);
  },
  getExport: (id) => structuredClone(memory.exports.find((item) => item.id === id)),
  updateExport(id, patch) {
    const idx = memory.exports.findIndex((item) => item.id === id);
    if (idx < 0) return null;
    memory.exports[idx] = { ...memory.exports[idx], ...patch };
    return structuredClone(memory.exports[idx]);
  },
  listExports: () => structuredClone(memory.exports),
  createManifest(man) {
    const m = { id: createManifestId(), createdAt: new Date().toISOString(), ...man };
    memory.manifests.unshift(m);
    return structuredClone(m);
  },
  getManifest: (id) => structuredClone(memory.manifests.find((item) => item.id === id)),
  listManifests: () => structuredClone(memory.manifests),
  createManifestSourceEntries(entries) {
    const persisted = entries.map((entry) => ({
      id: createManifestSourceEntryId(),
      entryHash: entry.entryHash || createContentHash(entry, 'mse'),
      createdAt: new Date().toISOString(),
      ...entry,
    }));
    memory.manifestSourceEntries.unshift(...persisted);
    return structuredClone(persisted);
  },
  listManifestSourceEntries(manifestId = null) {
    const rows = manifestId
      ? memory.manifestSourceEntries.filter((item) => item.manifestId === manifestId)
      : memory.manifestSourceEntries;
    return structuredClone(rows);
  },
  createStageGateEvaluation(record) {
    const row = { id: uid('eval'), createdAt: new Date().toISOString(), ...record };
    memory.stageGateEvaluations.unshift(row);
    return structuredClone(row);
  },
  getStageGateEvaluation: (id) =>
    structuredClone(memory.stageGateEvaluations.find((item) => item.id === id)),
  listStageGateEvaluations: () => structuredClone(memory.stageGateEvaluations),
  createTransitionAttempt(record) {
    const createdAt = record.createdAt || new Date().toISOString();
    const transitionId = record.attemptId || record.id || uid('transition');
    const row = {
      ...record,
      id: transitionId,
      attemptId: transitionId,
      createdAt,
    };
    memory.transitionAttempts.unshift(row);
    return structuredClone(row);
  },
  getTransitionAttempt: (id) =>
    structuredClone(
      memory.transitionAttempts.find(
        (item) => item.id === id || item.attemptId === id
      )
    ),
  listTransitionAttemptsByRun(runId) {
    return structuredClone(memory.transitionAttempts.filter((item) => item.runId === runId));
  },
  listTransitionAttempts: () => structuredClone(memory.transitionAttempts),
  listTemplateFamilies: () => structuredClone(memory.templateFamilies),
  getTemplateFamily: (id) =>
    structuredClone(memory.templateFamilies.find((item) => item.id === id)),
  listTemplateVersions(templateFamilyId = null) {
    const rows = templateFamilyId
      ? memory.templateVersions.filter((item) => item.templateFamilyId === templateFamilyId)
      : memory.templateVersions;
    return structuredClone(rows);
  },
  getTemplateVersion: (id) =>
    structuredClone(memory.templateVersions.find((item) => item.id === id)),
  createTemplateVersion(record) {
    const row = {
      id: record.id || uid("template_version"),
      createdAt: new Date().toISOString(),
      ...record,
    };
    memory.templateVersions.unshift(row);
    return structuredClone(row);
  },
  listPacketRules: () => structuredClone(memory.packetRules),
  getPacketRule: (id) => structuredClone(memory.packetRules.find((item) => item.id === id)),
  upsertPacketRule(record) {
    const idx = memory.packetRules.findIndex((item) => item.id === record.id);
    if (idx < 0) {
      memory.packetRules.unshift(record);
      return structuredClone(record);
    }
    memory.packetRules[idx] = { ...memory.packetRules[idx], ...record };
    return structuredClone(memory.packetRules[idx]);
  },
  listCadenceRules: () => structuredClone(memory.cadenceRules),
  upsertCadenceRule(record) {
    const idx = memory.cadenceRules.findIndex((item) => item.id === record.id);
    if (idx < 0) {
      memory.cadenceRules.unshift(record);
      return structuredClone(record);
    }
    memory.cadenceRules[idx] = { ...memory.cadenceRules[idx], ...record };
    return structuredClone(memory.cadenceRules[idx]);
  },
  listRulePreviews: () => structuredClone(memory.rulePreviews),
  listAdminIntegrations: () => structuredClone(memory.adminIntegrations),
  updateAdminIntegration(id, patch) {
    const idx = memory.adminIntegrations.findIndex((item) => item.id === id);
    if (idx < 0) return null;
    memory.adminIntegrations[idx] = { ...memory.adminIntegrations[idx], ...patch };
    return structuredClone(memory.adminIntegrations[idx]);
  },
  listProjectActivity(projectId = null) {
    const rows = projectId
      ? memory.projectActivity.filter((item) => item.projectId === projectId)
      : memory.projectActivity;
    return structuredClone(rows);
  },
  createProjectActivity(record) {
    const row = { id: record.id || uid("activity"), occurredAt: new Date().toISOString(), ...record };
    memory.projectActivity.unshift(row);
    return structuredClone(row);
  },
  listPermissionAudits: () => structuredClone(memory.permissionAudits),
  createPermissionAudit(record) {
    const row = {
      id: record.id || uid("permission_audit"),
      occurredAt: new Date().toISOString(),
      ...record,
    };
    memory.permissionAudits.unshift(row);
    return structuredClone(row);
  },
  updateSourceRecord(id, patch) {
    const index = memory.sourceRecords.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const next = withSourceFreshness({
      ...memory.sourceRecords[index],
      ...patch,
    });
    memory.sourceRecords[index] = next;
    return structuredClone(next);
  },
  upsertRuleSnapshot(snapshot) {
    const index = memory.ruleSnapshots.findIndex((item) => item.id === snapshot.id);
    if (index === -1) {
      memory.ruleSnapshots.unshift({
        createdAt: new Date().toISOString(),
        ...snapshot,
      });
    } else {
      memory.ruleSnapshots[index] = {
        ...memory.ruleSnapshots[index],
        ...snapshot,
      };
    }
    const item = memory.ruleSnapshots.find((entry) => entry.id === snapshot.id);
    return structuredClone(item);
  },
  getRuleSnapshot: (id) => structuredClone(memory.ruleSnapshots.find((item) => item.id === id)),
  listRuleSnapshots: () => structuredClone(memory.ruleSnapshots),
  resetForTests() {
    resetIdState();
    memory.projects = structuredClone(PROJECTS);
    memory.organizations = structuredClone(ORGANIZATIONS);
    memory.users = structuredClone(USERS);
    memory.projectMemberships = structuredClone(PROJECT_MEMBERSHIPS);
    memory.sourceRecords = hydrateSourceRecords(structuredClone(SOURCE_RECORDS));
    memory.runs = [];
    memory.issues = [];
    memory.exports = [];
    memory.manifests = [];
    memory.manifestSourceEntries = [];
    memory.stageGateEvaluations = [];
    memory.transitionAttempts = [];
    memory.ruleSnapshots = [];
    memory.templateFamilies = structuredClone(TEMPLATE_FAMILIES);
    memory.templateVersions = structuredClone(TEMPLATE_VERSIONS);
    memory.packetRules = structuredClone(PACKET_RULES);
    memory.cadenceRules = structuredClone(RECURRING_CADENCE_RULES);
    memory.rulePreviews = structuredClone(RULE_PREVIEWS);
    memory.adminIntegrations = structuredClone(ADMIN_INTEGRATIONS);
    memory.projectActivity = structuredClone(PROJECT_ACTIVITY_SEED);
    memory.permissionAudits = [];
  },
};
