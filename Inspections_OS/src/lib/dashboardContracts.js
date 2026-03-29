import { z } from "zod";

const isoTimestampSchema = z.string().datetime({ offset: true });

const verificationStatusSchema = z.enum([
  "verified-direct",
  "verified-indirect",
  "inferred-direct",
  "gap-note",
]);

const waiverActionSchema = z.enum(["advance", "waive", "save_draft"]).nullable();

export const dashboardEnvelopeBaseSchema = z
  .object({
    contract: z.string().min(1),
    generatedAt: isoTimestampSchema,
    payload: z.unknown(),
  })
  .strict();

export const dashboardContractIds = Object.freeze({
  portfolio: "dashboard.portfolio.v1",
  project: "dashboard.project.v1",
  inspectionOps: "dashboard.inspection_ops.v1",
  compliance: "dashboard.compliance.v1",
  exportCenter: "dashboard.export_center.v1",
  sourceFreshness: "dashboard.source_freshness.v1",
});

export const portfolioDashboardPayloadSchema = z
  .object({
    summary: z
      .object({
        projectCount: z.number().int().nonnegative(),
        activeRunCount: z.number().int().nonnegative(),
        blockedRunCount: z.number().int().nonnegative(),
        staleSourceCount: z.number().int().nonnegative(),
      })
      .strict(),
    topProjects: z.array(
      z
        .object({
          projectId: z.string().min(1),
          projectName: z.string().min(1),
          runCount: z.number().int().nonnegative(),
          openIssueCount: z.number().int().nonnegative(),
        })
        .strict()
    ),
  })
  .strict();

export const projectDashboardPayloadSchema = z
  .object({
    summary: z
      .object({
        projectCount: z.number().int().nonnegative(),
        runCount: z.number().int().nonnegative(),
        openIssueCount: z.number().int().nonnegative(),
        exportCount: z.number().int().nonnegative(),
      })
      .strict(),
    projects: z.array(
      z
        .object({
          projectId: z.string().min(1),
          projectName: z.string().min(1),
          jurisdictionKey: z.string().min(1),
          activeProgramCount: z.number().int().nonnegative(),
          runCount: z.number().int().nonnegative(),
          openIssueCount: z.number().int().nonnegative(),
          lastRunAt: z.string().datetime({ offset: true }).nullable(),
        })
        .strict()
    ),
  })
  .strict();

export const inspectionOpsDashboardPayloadSchema = z
  .object({
    summary: z
      .object({
        submittedRuns: z.number().int().nonnegative(),
        draftRuns: z.number().int().nonnegative(),
        blockedEvaluations: z.number().int().nonnegative(),
        passEvaluations: z.number().int().nonnegative(),
      })
      .strict(),
    stages: z.array(
      z
        .object({
          stageCode: z.string().min(1),
          runCount: z.number().int().nonnegative(),
          blockedCount: z.number().int().nonnegative(),
          passCount: z.number().int().nonnegative(),
        })
        .strict()
    ),
  })
  .strict();

export const complianceDashboardPayloadSchema = z
  .object({
    summary: z
      .object({
        warningCount: z.number().int().nonnegative(),
        blockerCount: z.number().int().nonnegative(),
        waiverAttemptCount: z.number().int().nonnegative(),
        staleSourceCount: z.number().int().nonnegative(),
      })
      .strict(),
    unresolvedRuns: z.array(
      z
        .object({
          runId: z.string().min(1),
          stageCode: z.string().min(1),
          blockerCodes: z.array(z.string().min(1)),
        })
        .strict()
    ),
  })
  .strict();

export const exportCenterDashboardPayloadSchema = z
  .object({
    exports: z.array(
      z
        .object({
          id: z.string().min(1),
          workflowRunId: z.string().min(1),
          stageGateEvaluationId: z.string().nullable().optional(),
          transitionAttemptId: z.string().nullable().optional(),
          packetClass: z.string().min(1),
          title: z.string().min(1),
          ruleSnapshotId: z.string().min(1),
          sourceRecordIdsUsed: z.array(z.string().min(1)).optional(),
          manifestId: z.string().min(1),
          createdAt: z.string().datetime({ offset: true }),
          status: z.enum(["completed", "failed", "pending"]),
        })
        .strict()
    ),
    manifests: z.array(
      z
        .object({
          id: z.string().min(1),
          stageCode: z.string().min(1),
          jurisdictionKey: z.string().min(1),
          inspectionTypeCode: z.string().min(1),
          sourceTitles: z.array(z.string()),
          basisStatuses: z.array(verificationStatusSchema),
          waiverAction: waiverActionSchema.optional(),
          waiverAllowed: z.boolean().optional(),
          waiverReason: z.string().nullable().optional(),
          waivedExceptions: z.array(
            z
              .object({
                code: z.string().min(1),
                waiverReason: z.string().nullable(),
              })
              .strict()
          ),
        })
        .strict()
    ),
  })
  .strict();

export const sourceFreshnessDashboardPayloadSchema = z
  .object({
    summary: z
      .object({
        total: z.number().int().nonnegative(),
        stale: z.number().int().nonnegative(),
      })
      .strict(),
    rows: z.array(
      z
        .object({
          id: z.string().min(1),
          title: z.string().min(1),
          packetRole: z.string().min(1),
          verificationStatus: verificationStatusSchema,
          fingerprintHash: z.string().min(1),
          verifiedAt: z.string().datetime({ offset: true }),
          lastSeenAt: z.string().datetime({ offset: true }),
          stale: z.boolean(),
        })
        .strict()
    ),
  })
  .strict();

function makeEnvelopeSchema(contract, payloadSchema) {
  return dashboardEnvelopeBaseSchema.extend({
    contract: z.literal(contract),
    payload: payloadSchema,
  });
}

export const portfolioDashboardEnvelopeSchema = makeEnvelopeSchema(
  dashboardContractIds.portfolio,
  portfolioDashboardPayloadSchema
);

export const projectDashboardEnvelopeSchema = makeEnvelopeSchema(
  dashboardContractIds.project,
  projectDashboardPayloadSchema
);

export const inspectionOpsDashboardEnvelopeSchema = makeEnvelopeSchema(
  dashboardContractIds.inspectionOps,
  inspectionOpsDashboardPayloadSchema
);

export const complianceDashboardEnvelopeSchema = makeEnvelopeSchema(
  dashboardContractIds.compliance,
  complianceDashboardPayloadSchema
);

export const exportCenterDashboardEnvelopeSchema = makeEnvelopeSchema(
  dashboardContractIds.exportCenter,
  exportCenterDashboardPayloadSchema
);

export const sourceFreshnessDashboardEnvelopeSchema = makeEnvelopeSchema(
  dashboardContractIds.sourceFreshness,
  sourceFreshnessDashboardPayloadSchema
);

const envelopeSchemas = Object.freeze({
  [dashboardContractIds.portfolio]: portfolioDashboardEnvelopeSchema,
  [dashboardContractIds.project]: projectDashboardEnvelopeSchema,
  [dashboardContractIds.inspectionOps]: inspectionOpsDashboardEnvelopeSchema,
  [dashboardContractIds.compliance]: complianceDashboardEnvelopeSchema,
  [dashboardContractIds.exportCenter]: exportCenterDashboardEnvelopeSchema,
  [dashboardContractIds.sourceFreshness]: sourceFreshnessDashboardEnvelopeSchema,
});

/**
 * @param {keyof typeof dashboardContractIds} contractName
 */
export function getDashboardContractId(contractName) {
  return dashboardContractIds[contractName];
}

/**
 * @param {string} contract
 * @param {unknown} payload
 */
export function buildDashboardEnvelope(contract, payload) {
  const schema = envelopeSchemas[contract];
  if (!schema) {
    throw new Error(`Unknown dashboard contract: ${contract}`);
  }
  return schema.parse({
    contract,
    generatedAt: new Date().toISOString(),
    payload,
  });
}

/**
 * @param {string} contract
 * @param {unknown} value
 */
export function parseDashboardContractEnvelope(contract, value) {
  const schema = envelopeSchemas[contract];
  if (!schema) {
    throw new Error(`Unknown dashboard contract: ${contract}`);
  }
  return schema.parse(value);
}

/**
 * @param {unknown} value
 */
export function parsePortfolioDashboardEnvelope(value) {
  return parseDashboardContractEnvelope(dashboardContractIds.portfolio, value);
}

/**
 * @param {unknown} value
 */
export function parseProjectDashboardEnvelope(value) {
  return parseDashboardContractEnvelope(dashboardContractIds.project, value);
}

/**
 * @param {unknown} value
 */
export function parseInspectionOpsDashboardEnvelope(value) {
  return parseDashboardContractEnvelope(dashboardContractIds.inspectionOps, value);
}

/**
 * @param {unknown} value
 */
export function parseComplianceDashboardEnvelope(value) {
  return parseDashboardContractEnvelope(dashboardContractIds.compliance, value);
}

/**
 * @param {unknown} value
 */
export function parseExportCenterDashboardEnvelope(value) {
  return parseDashboardContractEnvelope(dashboardContractIds.exportCenter, value);
}

/**
 * @param {unknown} value
 */
export function parseSourceFreshnessDashboardEnvelope(value) {
  return parseDashboardContractEnvelope(dashboardContractIds.sourceFreshness, value);
}
