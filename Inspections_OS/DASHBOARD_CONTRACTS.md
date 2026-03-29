# Dashboard Query Contracts (v1)

This document is the design-facing reference for dashboard contracts consumed by the UI layer.

## Envelope
All dashboard hooks return this strict envelope:

- `contract`: versioned contract id (`dashboard.<surface>.v1`)
- `generatedAt`: ISO timestamp
- `payload`: typed contract payload for that surface

Future shape changes must increment the contract id to `v2` (or higher).

## Contract IDs
- `dashboard.portfolio.v1`
- `dashboard.project.v1`
- `dashboard.inspection_ops.v1`
- `dashboard.compliance.v1`
- `dashboard.export_center.v1`
- `dashboard.source_freshness.v1`

## Field Dictionary
### `dashboard.portfolio.v1`
- `summary.projectCount`: total projects
- `summary.activeRunCount`: submitted runs
- `summary.blockedRunCount`: non-submitted runs
- `summary.staleSourceCount`: stale source records
- `topProjects[]`: top five by run volume with open issue count

### `dashboard.project.v1`
- `summary`: global counts (`projectCount`, `runCount`, `openIssueCount`, `exportCount`)
- `projects[]`:
  - `projectId`, `projectName`, `jurisdictionKey`
  - `activeProgramCount`, `runCount`, `openIssueCount`
  - `lastRunAt` (nullable ISO timestamp)

### `dashboard.inspection_ops.v1`
- `summary.submittedRuns`, `summary.draftRuns`
- `summary.blockedEvaluations`, `summary.passEvaluations`
- `stages[]`:
  - `stageCode`
  - `runCount`, `blockedCount`, `passCount`

### `dashboard.compliance.v1`
- `summary.warningCount`, `summary.blockerCount`
- `summary.waiverAttemptCount`
- `summary.staleSourceCount`
- `unresolvedRuns[]`:
  - `runId`, `stageCode`, `blockerCodes[]`

### `dashboard.export_center.v1`
- `exports[]`: export job rows used for export tables
- `manifests[]`:
  - `id`, `stageCode`, `jurisdictionKey`, `inspectionTypeCode`
  - `sourceTitles[]`
  - `basisStatuses[]` (`verified-direct`, `verified-indirect`, `inferred-direct`, `gap-note`)
  - `waiverAction`, `waiverAllowed`, `waiverReason`
  - `waivedExceptions[]` (`code`, `waiverReason`)

### `dashboard.source_freshness.v1`
- `summary.total`, `summary.stale`
- `rows[]`:
  - `id`, `title`, `packetRole`
  - `verificationStatus`
  - `fingerprintHash`
  - `verifiedAt`, `lastSeenAt`
  - `stale`

## Semantic Notes for UX
- Chips/status for verification basis should map from `basisStatuses` and `verificationStatus`.
- Caution/warning states should use:
  - blocked/warning counts from compliance + ops summaries
  - stale source counts from portfolio/compliance/source freshness
- Waiver indicators should use manifest-level fields:
  - `waiverAction`
  - `waiverAllowed`
  - `waiverReason`
  - `waivedExceptions`

## Safe-To-Design vs Internal
- Safe-to-design:
  - all `payload` fields documented above
  - `contract` and `generatedAt` display (optional)
- Internal/debug-only (do not design against):
  - React Query cache internals
  - local repository implementation details in `localDb`
  - raw rule-evaluation trace internals not included in dashboard contracts

