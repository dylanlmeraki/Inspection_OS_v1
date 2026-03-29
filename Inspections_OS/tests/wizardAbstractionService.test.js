import { describe, expect, it } from "vitest";
import { buildWizardPlan, listWizardOptions } from "@/lib/wizardAbstractionService";
import { wizardScenarios } from "./fixtures/wizardScenarios";

describe("wizardAbstractionService", () => {
  it("resolves project, jurisdiction, program family, inspection type, and workflow stage explicitly", () => {
    const plan = buildWizardPlan(wizardScenarios.contraCostaPrePermit.selection);

    expect(plan.context.projectId).toBe("proj_contra_001");
    expect(plan.context.jurisdictionKey).toBe("contra_costa_county");
    expect(plan.context.programFamilyKey).toBe("special_inspections");
    expect(plan.context.inspectionTypeCode).toBe("special.cbc17");
    expect(plan.context.workflowStageCode).toBe("special.pre_permit");
  });

  it("lists deterministic wizard options without backend dependencies", () => {
    const options = listWizardOptions();
    const projectOption = options.find((item) => item.project.id === "proj_sf_001");

    expect(options.length).toBeGreaterThan(0);
    expect(projectOption?.availablePrograms.length).toBeGreaterThan(0);
    expect(projectOption?.availablePrograms[0]).toHaveProperty("stages");
    expect(projectOption?.availablePrograms[0]).toHaveProperty("inspectionTypes");
  });

  it("includes only source records resolved by the selected rule path", () => {
    const plan = buildWizardPlan(wizardScenarios.marinPrePermit.selection);
    expect(plan.sourceRecords.some((item) => item.id === "src_marin_trigger")).toBe(true);
    expect(plan.sourceRecords.some((item) => item.id === "src_contra_agencies")).toBe(false);
  });

  it("applies layered scope precedence (tenant > project > city > county > regional > statewide)", () => {
    const plan = buildWizardPlan(wizardScenarios.contraCostaPrePermit.selection);
    const contraRules = plan.rules.filter((item) => item.blockerCode === "CONTRA_RECOGNIZED_AGENCY_REQUIRED");

    expect(contraRules).toHaveLength(1);
    expect(contraRules[0].scopeLevel).toBe("project");
    expect(contraRules[0].id).toBe("rule_special_contra_project_override");
  });

  it("excludes rules outside effective windows to keep local resolution deterministic", () => {
    const plan = buildWizardPlan(wizardScenarios.contraCostaPrePermit.selection);
    expect(plan.rules.some((item) => item.id === "rule_special_contra_legacy_expired")).toBe(false);
  });

  it("resolves regional-to-city overlap with deterministic merge precedence", () => {
    const plan = buildWizardPlan({
      projectId: "proj_sf_001",
      programKey: "dust_control",
      inspectionTypeCode: "dust.sf_construction",
      stageCode: "dust.applicability",
      mode: "mobile",
    });
    const dustRules = plan.rules.filter((item) => item.mergeKey === "dust_applicability_site_facts");

    expect(dustRules).toHaveLength(1);
    expect(dustRules[0].id).toBe("rule_dust_sf");
    expect(dustRules[0].scopeLevel).toBe("city");
  });

  it("returns rule-resolution trace showing winners, superseded rules, and inactive-window filtering", () => {
    const plan = buildWizardPlan(wizardScenarios.contraCostaPrePermit.selection);
    const resolution = plan.ruleResolution;
    const traceByRuleId = new Map(resolution.trace.map((item) => [item.ruleId, item]));

    expect(resolution.winnerByMergeKey.special_agency_selection_requirement).toBe(
      "rule_special_contra_project_override"
    );
    expect(resolution.winningRuleIds).toContain("rule_special_contra_project_override");
    expect(resolution.supersededRuleIds).toContain("rule_special_contra");
    expect(traceByRuleId.get("rule_special_contra")?.status).toBe("ignored_superseded");
    expect(traceByRuleId.get("rule_special_contra_legacy_expired")?.status).toBe(
      "filtered_inactive_window"
    );
  });
});
