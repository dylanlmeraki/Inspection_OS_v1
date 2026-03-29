# Inspection.OS Control-Plane Handoff

This is a cleanroom Vite/React handoff package for the **wizard -> abstraction layer -> gate manager -> transition -> export/manifest** path, plus the next control-plane tranche surfaces (projects, inspections, issues, templates, rules, admin).

## Included
- local seed-backed project/program/stage model
- wizard abstraction service
- gate evaluation engine
- transition engine with waiver-aware records
- verification-manifest aware export engine
- PDF packet generation using jsPDF
- auth-ready route/action RBAC skeleton with mock session switching
- control-plane route map for dashboard/project/inspection/issue/export/source/template/rule/admin surfaces
- unit/integration tests for wizard, gate, export, contracts, RBAC, and core UI seams

## Quick start (new engineer, local only)
No Base44 or hosted platform setup is required.

```bash
npm ci
npm run build
npm run lint
npm run typecheck
npm run test
npm run check:bundle
npm run dev
```

Then open `http://localhost:5173/dashboard`.

Local session switching:
- use the `Session` picker in the app shell header to test different org/project roles.
- default user is `Perry Project Manager`.

## Design boundary
This package is focused on the handoff-ready wizard/gate/export infrastructure only. It uses a local repository pattern (`src/lib/localDb.js`) so you can later swap in a real backend without changing the UI contracts.

`/wizard` remains available for backward-compatible flow testing, but it is intentionally hidden from primary navigation.

## What to inspect first
- `src/components/WizardRunner.jsx`: canonical wizard -> gate -> transition -> export control surface
- `src/lib/wizardAbstractionService.js`: project/jurisdiction/program/inspection/stage resolution
- `src/lib/gateEngine.js`: deterministic rule evaluation and blocker/warning outcome
- `src/lib/transitionEngine.js`: transition attempt creation and waiver persistence
- `src/lib/exportEngine.js`: export job + verification manifest + source/evidence basis
- `src/lib/localDb.js`: local repository abstraction boundary
- `src/contracts/types.js`: shared seam payload contracts
- `src/App.jsx` + `src/lib/routeRegistry.js`: control-plane routes and guarded access model
- `src/lib/authRbac.js` + `src/lib/permissionGuards.jsx`: RBAC matrix and action/route guard enforcement

## P2 hardening now included
- normalized id/hash helpers in `src/lib/ids.js`
- standardized evidence/export/manifest/source-entry id generation
- stable content hashing for manifest/evidence rows
- source freshness metadata (`verifiedAt`, `lastSeenAt`, `stale`) surfaced in Source Library and manifests

## Sprint hardening now included
- deterministic layered rule resolution with explicit scope precedence (`statewide`, `regional`, `county`, `city`, `project`, `tenant-ready`)
- rule effective windows (`effectiveFrom` / `effectiveTo`) and explicit supersede behavior
- merge strategies (`replace`, `append`, `merge_union`) with deterministic ordering
- rule-resolution trace output (`winningRuleIds`, `supersededRuleIds`, `winnerByMergeKey`, per-rule trace reasons)
- transition attempt linkage into export jobs and verification manifest exceptions
- waiver reason propagation through transition record, audit event, manifest, and packet summary
- export PDF renderer lazy-loaded from the main export orchestration path
- dashboard-facing query contracts in explicit modules:
  `src/lib/dashboardQueries/portfolioDashboardQuery.js`
  `src/lib/dashboardQueries/projectDashboardQuery.js`
  `src/lib/dashboardQueries/inspectionOpsDashboardQuery.js`
  `src/lib/dashboardQueries/complianceDashboardQuery.js`
  `src/lib/dashboardQueries/exportCenterDashboardQuery.js`
  `src/lib/dashboardQueries/sourceFreshnessDashboardQuery.js`
- strict versioned dashboard envelopes + runtime validation in `src/lib/dashboardContracts.js`
- centralized dashboard invalidation utility in `src/lib/dashboardInvalidation.js`
- export runtime prefetch + cached lazy imports in `src/lib/exportRuntimeLoader.js`
- design-facing dashboard contract reference in `DASHBOARD_CONTRACTS.md`
- control-plane UX primitives in `src/components/ui/`:
  - `LifecycleTimeline`
  - `StagePill`
  - `BlockerCard`
  - `RequirementChecklist`
  - `EvidenceTray`
  - `VerificationBadge`
  - `PacketCompletenessMeter`
  - `ManifestReferenceCard`
  - `DueStateChip`
  - `AmbiguityNoteBlock`
- canonical state vocabulary + adapters in `src/lib/statusVocabulary.js`

## Control-plane routes
Implemented route map:
- `/dashboard`, `/dashboard/portfolio`, `/dashboard/operations`, `/dashboard/compliance`, `/dashboard/my-work`
- `/projects`, `/projects/:projectId`, `/projects/:projectId/{overview|programs|inspections|issues|documents|exports|team|audit}`
- `/inspections`, `/inspections/review-queue`, `/inspections/recurring`, `/inspections/calendar`, `/inspections/:runId`
- `/issues`, `/issues/overdue`, `/issues/verification`, `/issues/:issueId`
- `/exports`, `/exports/manifests`, `/exports/:exportId`
- `/sources`, `/sources/forms`, `/sources/:sourceRecordId`
- `/templates`, `/templates/families`, `/templates/:templateFamilyId`, `/templates/:templateFamilyId/versions/:templateVersionId`
- `/rules`, `/rules/packet`, `/rules/cadence`, `/rules/snapshots`, `/rules/previews`
- `/admin`, `/admin/organizations`, `/admin/users`, `/admin/roles`, `/admin/settings`, `/admin/integrations`

## Final packaging checklist
Before shipping the handoff bundle, remove generated artifacts:
- `node_modules/`
- `dist/`
- any local logs/render scratch output
