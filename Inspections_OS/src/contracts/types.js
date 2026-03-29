/**
 * Shared seam contracts for the Wizard -> Gate -> Transition -> Export path.
 * We keep these focused on boundary payloads where defects are highest-impact.
 */

/**
 * @typedef {"verified-direct"|"verified-indirect"|"inferred-direct"|"gap-note"} VerificationStatus
 */

/**
 * @typedef {"blocker"|"warning"} GateSeverity
 */

/**
 * @typedef {{
 *   projectId: string
 *   projectName: string
 *   jurisdictionKey: string
 *   countyGroup: string
 *   countyKey?: string
 *   cityKey?: string | null
 *   regionalKeys?: string[]
 *   tenantKey?: string | null
 *   programFamilyKey: string
 *   inspectionTypeCode: string
 *   workflowStageCode: string
 *   evaluationDate?: string
 * }} WizardSelectionContext
 */

/**
 * @typedef {{
 *   evidenceId: string
 *   kind: string
 *   tag: string | null
 *   durableRef: string
 *   hash: string
 *   order: number
 * }} EvidenceItem
 */

/**
 * @typedef {{
 *   sourceRecordId: string
 *   title: string
 *   packetRole: string
 *   verificationStatus: VerificationStatus
 *   fingerprintHash: string
 *   verifiedAt?: string
 *   lastSeenAt?: string
 *   stale?: boolean
 * }} ManifestSourceEntry
 */

/**
 * @typedef {{
 *   type: "field"|"question"|"document"|"attachment"
 *   key: string
 *   met: boolean
 *   message: string
 *   severity: GateSeverity
 * }} GateRequirement
 */

/**
 * @typedef {{
 *   code: string
 *   message: string
 *   packetRole: string
 *   sourceRecordIds: string[]
 *   waiverAllowed: boolean
 *   severity: GateSeverity
 * }} GateBlocker
 */

/**
 * @typedef {{
 *   status: "pass"|"blocked"
 *   requirements: GateRequirement[]
 *   blockers: GateBlocker[]
 *   warnings: GateBlocker[]
 *   metCount: number
 *   unmetCount: number
 *   ruleSnapshotId: string
 *   ruleIdsUsed: string[]
 *   sourceRecordIdsUsed: string[]
 *   waiverEligible?: boolean
 * }} GateEvaluation
 */

/**
 * @typedef {{
 *   attemptId: string
 *   runId: string
 *   context: WizardSelectionContext
 *   evaluationStatus: GateEvaluation["status"]
 *   blockerCodes: string[]
 *   action: "advance"|"waive"|"save_draft"
 *   waiverReason: string | null
 *   allowed: boolean
 *   reason: string
 *   createdAt: string
 * }} TransitionAttempt
 */

/**
 * @typedef {{
 *   id: string
 *   context: WizardSelectionContext
 *   ruleIds: string[]
 *   sourceRecordIds: string[]
 *   generatedAt: string
 *   createdAt?: string
 * }} RuleSnapshot
 */

/**
 * @typedef {{
 *   id: string
 *   exportJobId: string
 *   ruleSnapshotId: string
 *   jurisdictionKey: string
 *   countyGroup: string
 *   inspectionTypeCode: string
 *   stageCode: string
 *   sourceEntries: ManifestSourceEntry[]
 *   evidenceInventory: {
 *     attachedDocuments: string[]
 *     evidenceItems: EvidenceItem[]
 *     attachmentCount: number
 *   }
 *   assemblyGraph: {
 *     requiredSections: string[]
 *     optionalSections: string[]
 *     blockerSections: string[]
 *     manifestAppendixSections: string[]
 *     omissionDisclosures: string[]
 *   }
 *   basisDisclosures: Array<{
 *     sourceRecordId: string
 *     title: string
 *     verificationStatus: VerificationStatus
 *     note: string
 *   }>
 *   waiverSection?: {
 *     transitionAttemptId: string | null
 *     action: "advance"|"waive"|"save_draft"|null
 *     allowed: boolean
 *     reason: string | null
 *     waiverReason: string | null
 *     waivedBlockerCodes: string[]
 *     blockerCodesAtEvaluation?: string[]
 *   }
 *   exceptions: Array<{
 *     code: string
 *     message: string
 *     packetRole: string
 *     severity?: GateSeverity
 *     waived?: boolean
 *     waiverReason?: string | null
 *     transitionAttemptId?: string | null
 *   }>
 *   createdAt: string
 * }} VerificationManifest
 */

/**
 * @typedef {{
 *   id: string
 *   workflowRunId: string
 *   stageGateEvaluationId?: string | null
 *   packetClass: string
 *   title: string
 *   ruleSnapshotId: string
 *   sourceRecordIdsUsed?: string[]
 *   transitionAttemptId?: string | null
 *   manifestId: string
 *   createdAt: string
 *   status: "completed"|"failed"|"pending"
 * }} ExportJob
 */

/**
 * @typedef {{
 *   eventType: string
 *   actorId: string
 *   projectId: string
 *   runId?: string
 *   exportJobId?: string
 *   transitionAttemptId?: string
 *   details?: Record<string, unknown>
 *   occurredAt?: string
 * }} AuditLogInput
 */

/**
 * @typedef {{
 *   id: string
 *   eventType: string
 *   actorId: string
 *   projectId: string
 *   runId: string | null
 *   exportJobId: string | null
 *   transitionAttemptId: string | null
 *   details: Record<string, unknown>
 *   occurredAt: string
 * }} AuditLogEvent
 */

/**
 * @param {unknown} value
 * @param {string} message
 */
export function assertDefined(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * @typedef {"dashboard.portfolio.v1"|"dashboard.project.v1"|"dashboard.inspection_ops.v1"|"dashboard.compliance.v1"|"dashboard.export_center.v1"|"dashboard.source_freshness.v1"} DashboardContractId
 */

/**
 * @template TPayload
 * @template {DashboardContractId} TContract
 * @typedef {{
 *   contract: TContract
 *   generatedAt: string
 *   payload: TPayload
 * }} DashboardEnvelope
 */

/**
 * @typedef {{
 *   summary: {
 *     projectCount: number
 *     activeRunCount: number
 *     blockedRunCount: number
 *     staleSourceCount: number
 *   }
 *   topProjects: Array<{
 *     projectId: string
 *     projectName: string
 *     runCount: number
 *     openIssueCount: number
 *   }>
 * }} PortfolioDashboardQuery
 */

/**
 * @typedef {DashboardEnvelope<PortfolioDashboardQuery, "dashboard.portfolio.v1">} PortfolioDashboardEnvelope
 */

/**
 * @typedef {{
 *   summary: {
 *     projectCount: number
 *     runCount: number
 *     openIssueCount: number
 *     exportCount: number
 *   }
 *   projects: Array<{
 *     projectId: string
 *     projectName: string
 *     jurisdictionKey: string
 *     activeProgramCount: number
 *     runCount: number
 *     openIssueCount: number
 *     lastRunAt: string | null
 *   }>
 * }} ProjectDashboardQuery
 */

/**
 * @typedef {DashboardEnvelope<ProjectDashboardQuery, "dashboard.project.v1">} ProjectDashboardEnvelope
 */

/**
 * @typedef {{
 *   summary: {
 *     submittedRuns: number
 *     draftRuns: number
 *     blockedEvaluations: number
 *     passEvaluations: number
 *   }
 *   stages: Array<{
 *     stageCode: string
 *     runCount: number
 *     blockedCount: number
 *     passCount: number
 *   }>
 * }} InspectionOpsDashboardQuery
 */

/**
 * @typedef {DashboardEnvelope<InspectionOpsDashboardQuery, "dashboard.inspection_ops.v1">} InspectionOpsDashboardEnvelope
 */

/**
 * @typedef {{
 *   summary: {
 *     warningCount: number
 *     blockerCount: number
 *     waiverAttemptCount: number
 *     staleSourceCount: number
 *   }
 *   unresolvedRuns: Array<{
 *     runId: string
 *     stageCode: string
 *     blockerCodes: string[]
 *   }>
 * }} ComplianceDashboardQuery
 */

/**
 * @typedef {DashboardEnvelope<ComplianceDashboardQuery, "dashboard.compliance.v1">} ComplianceDashboardEnvelope
 */

/**
 * @typedef {{
 *   exports: Array<import("@/contracts/types").ExportJob>
 *   manifests: Array<{
 *     id: string
 *     stageCode: string
 *     jurisdictionKey: string
 *     inspectionTypeCode: string
 *     sourceTitles: string[]
 *     basisStatuses: VerificationStatus[]
 *     waiverAction?: "advance"|"waive"|"save_draft"|null
 *     waiverAllowed?: boolean
 *     waiverReason?: string | null
 *     waivedExceptions: Array<{ code: string, waiverReason: string | null }>
 *   }>
 * }} ExportCenterQuery
 */

/**
 * @typedef {DashboardEnvelope<ExportCenterQuery, "dashboard.export_center.v1">} ExportCenterQueryEnvelope
 */

/**
 * @typedef {{
 *   summary: {
 *     total: number
 *     stale: number
 *   }
 *   rows: Array<{
 *     id: string
 *     title: string
 *     packetRole: string
 *     verificationStatus: VerificationStatus
 *     fingerprintHash: string
 *     verifiedAt: string
 *     lastSeenAt: string
 *     stale: boolean
 *   }>
 * }} SourceFreshnessQuery
 */

/**
 * @typedef {DashboardEnvelope<SourceFreshnessQuery, "dashboard.source_freshness.v1">} SourceFreshnessQueryEnvelope
 */

export {};
