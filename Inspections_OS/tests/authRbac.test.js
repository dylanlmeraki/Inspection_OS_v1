import { beforeEach, describe, expect, it } from "vitest";
import { evaluatePermission, PERMISSION_ACTIONS } from "@/lib/authRbac";
import { localDb } from "@/lib/localDb";

function actor(userId, orgRole = null) {
  return { userId, orgRole };
}

describe("auth RBAC matrix", () => {
  beforeEach(() => {
    localDb.resetForTests();
  });

  it("allows org_owner for all control-plane actions", () => {
    const adminActor = actor("user_owner_001", "org_owner");
    const allActions = Object.values(PERMISSION_ACTIONS);
    for (const action of allActions) {
      const decision = evaluatePermission({
        actor: adminActor,
        action,
        scope: { projectId: "proj_sf_001" },
      });
      expect(decision.result).toBe("allowed");
    }
  });

  it("enforces inspector restrictions including dashboard and waiver controls", () => {
    const inspector = actor("user_inspector_001", null);

    expect(
      evaluatePermission({
        actor: inspector,
        action: PERMISSION_ACTIONS.viewDashboard,
        scope: { projectId: "proj_sf_001", dashboardSection: "my_work" },
      }).result
    ).toBe("allowed");

    expect(
      evaluatePermission({
        actor: inspector,
        action: PERMISSION_ACTIONS.viewDashboard,
        scope: { projectId: "proj_sf_001", dashboardSection: "compliance" },
      }).result
    ).toBe("denied_scope");

    expect(
      evaluatePermission({
        actor: inspector,
        action: PERMISSION_ACTIONS.submitInspectionRun,
        scope: { projectId: "proj_sf_001" },
      }).result
    ).toBe("allowed");

    expect(
      evaluatePermission({
        actor: inspector,
        action: PERMISSION_ACTIONS.approveReturnRun,
        scope: { projectId: "proj_sf_001" },
      }).result
    ).toBe("denied_role");

    expect(
      evaluatePermission({
        actor: inspector,
        action: PERMISSION_ACTIONS.waiveBlocker,
        scope: { projectId: "proj_sf_001" },
      }).result
    ).toBe("denied_role");
  });

  it("allows project manager waiver only when policy/membership grants authority", () => {
    const pm = actor("user_pm_001", null);
    const denied = evaluatePermission({
      actor: pm,
      action: PERMISSION_ACTIONS.waiveBlocker,
      scope: { projectId: "proj_sf_001" },
    });
    expect(denied.result).toBe("denied_policy");

    const allowedViaMembership = evaluatePermission({
      actor: pm,
      action: PERMISSION_ACTIONS.waiveBlocker,
      scope: { projectId: "proj_contra_001" },
    });
    expect(allowedViaMembership.result).toBe("allowed");
  });

  it("blocks external reviewer from dashboard and submit actions without explicit grants", () => {
    const external = actor("user_external_001", null);
    expect(
      evaluatePermission({
        actor: external,
        action: PERMISSION_ACTIONS.viewDashboard,
        scope: { projectId: "proj_marin_001", dashboardSection: "my_work" },
      }).result
    ).toBe("denied_role");

    expect(
      evaluatePermission({
        actor: external,
        action: PERMISSION_ACTIONS.submitInspectionRun,
        scope: { projectId: "proj_marin_001" },
      }).result
    ).toBe("denied_role");
  });

  it("returns denied_scope for unknown actions", () => {
    const decision = evaluatePermission({
      actor: actor("user_pm_001"),
      action: "unknown_action",
      scope: { projectId: "proj_sf_001" },
    });
    expect(decision.result).toBe("denied_scope");
  });
});

