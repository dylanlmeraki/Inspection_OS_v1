/* @vitest-environment jsdom */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import ExportCenterPage from "@/pages/ExportCenterPage";
import { buildWizardPlan } from "@/lib/wizardAbstractionService";
import { evaluateGate } from "@/lib/gateEngine";
import { createExportJob } from "@/lib/exportEngine";
import { localDb } from "@/lib/localDb";
import { createTransitionAttempt } from "@/lib/transitionEngine";
import { wizardScenarios } from "../fixtures/wizardScenarios";

function renderWithQuery(ui) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ExportCenterPage", () => {
  beforeEach(() => {
    localDb.resetForTests();
  });

  it("renders manifest preview rows with basis statuses and waiver disclosures", async () => {
    const plan = buildWizardPlan(wizardScenarios.contraCostaPrePermit.selection);
    const baseEvaluation = evaluateGate({
      plan,
      answers: wizardScenarios.contraCostaPrePermit.answersBlocked,
      attachedDocuments: [],
      attachments: [],
    });
    const evaluation = {
      ...baseEvaluation,
      blockers: baseEvaluation.blockers.map((item) => ({ ...item, waiverAllowed: true })),
      waiverEligible: true,
    };
    const run = localDb.createRun({
      projectId: plan.context.projectId,
      projectName: plan.context.projectName,
      programKey: plan.context.programFamilyKey,
      inspectionTypeCode: plan.context.inspectionTypeCode,
      stageCode: plan.context.workflowStageCode,
      mode: "desktop",
      answers: wizardScenarios.contraCostaPrePermit.answersBlocked,
      attachedDocuments: [],
      attachments: [],
      status: "draft",
    });
    const stageGateEvaluation = localDb.createStageGateEvaluation({
      runId: run.id,
      context: plan.context,
      evaluation,
      ruleSnapshotId: evaluation.ruleSnapshotId,
      sourceRecordIdsUsed: evaluation.sourceRecordIdsUsed,
    });
    const transitionAttempt = localDb.createTransitionAttempt(
      createTransitionAttempt({
        runId: run.id,
        context: plan.context,
        evaluation,
        action: "waive",
        waiverReason: "AHJ confirmed manual bridge approval",
      })
    );

    await createExportJob({
      runId: run.id,
      stageGateEvaluationId: stageGateEvaluation.id,
      transitionAttemptId: transitionAttempt.attemptId,
      attachments: [],
    });

    renderWithQuery(<ExportCenterPage />);

    await waitFor(() => {
      expect(screen.getByText(/CONTRA_RECOGNIZED_AGENCY_REQUIRED/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Basis statuses:/)).toBeInTheDocument();
    expect(screen.getByText(/Waiver action:/)).toBeInTheDocument();
    expect(screen.getByText(/Waived exceptions:/)).toBeInTheDocument();
    expect(
      screen.getByText(/CONTRA_RECOGNIZED_AGENCY_REQUIRED \(AHJ confirmed manual bridge approval\)/)
    ).toBeInTheDocument();
  });
});
