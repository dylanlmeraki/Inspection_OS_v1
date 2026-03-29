import { beforeEach, describe, expect, it } from "vitest";
import {
  dashboardContractIds,
  parseComplianceDashboardEnvelope,
  parseExportCenterDashboardEnvelope,
  parseInspectionOpsDashboardEnvelope,
  parsePortfolioDashboardEnvelope,
  parseProjectDashboardEnvelope,
  parseSourceFreshnessDashboardEnvelope,
} from "@/lib/dashboardContracts";
import {
  getComplianceDashboardQuery,
  getExportCenterQuery,
  getInspectionOpsDashboardQuery,
  getPortfolioDashboardQuery,
  getProjectDashboardQuery,
  getSourceFreshnessQuery,
} from "@/lib/dashboardQueries";
import { localDb } from "@/lib/localDb";

const contractCases = [
  {
    name: "portfolio",
    id: dashboardContractIds.portfolio,
    getEnvelope: getPortfolioDashboardQuery,
    parseEnvelope: parsePortfolioDashboardEnvelope,
    breakPayload: (envelope) => ({
      ...envelope,
      payload: { ...envelope.payload, topProjects: "invalid" },
    }),
  },
  {
    name: "project",
    id: dashboardContractIds.project,
    getEnvelope: getProjectDashboardQuery,
    parseEnvelope: parseProjectDashboardEnvelope,
    breakPayload: (envelope) => ({
      ...envelope,
      payload: { ...envelope.payload, projects: [{}] },
    }),
  },
  {
    name: "inspection ops",
    id: dashboardContractIds.inspectionOps,
    getEnvelope: getInspectionOpsDashboardQuery,
    parseEnvelope: parseInspectionOpsDashboardEnvelope,
    breakPayload: (envelope) => ({
      ...envelope,
      payload: { ...envelope.payload, summary: {} },
    }),
  },
  {
    name: "compliance",
    id: dashboardContractIds.compliance,
    getEnvelope: getComplianceDashboardQuery,
    parseEnvelope: parseComplianceDashboardEnvelope,
    breakPayload: (envelope) => ({
      ...envelope,
      payload: { ...envelope.payload, unresolvedRuns: [{ stageCode: "x" }] },
    }),
  },
  {
    name: "export center",
    id: dashboardContractIds.exportCenter,
    getEnvelope: getExportCenterQuery,
    parseEnvelope: parseExportCenterDashboardEnvelope,
    breakPayload: (envelope) => ({
      ...envelope,
      payload: { ...envelope.payload, manifests: [{ id: "x" }] },
    }),
  },
  {
    name: "source freshness",
    id: dashboardContractIds.sourceFreshness,
    getEnvelope: getSourceFreshnessQuery,
    parseEnvelope: parseSourceFreshnessDashboardEnvelope,
    breakPayload: (envelope) => ({
      ...envelope,
      payload: { ...envelope.payload, rows: [{ id: "x" }] },
    }),
  },
];

describe("dashboard contract schema validation", () => {
  beforeEach(() => {
    localDb.resetForTests();
  });

  it("accepts valid envelopes and enforces contract version ids", () => {
    for (const item of contractCases) {
      const envelope = item.getEnvelope();
      const parsed = item.parseEnvelope(envelope);
      expect(parsed.contract).toBe(item.id);
      expect(parsed.generatedAt).toMatch(/T/);
      expect(parsed.payload).toBeDefined();
    }
  });

  it("rejects malformed payloads for all six contracts", () => {
    for (const item of contractCases) {
      const envelope = item.getEnvelope();
      const malformed = item.breakPayload(envelope);
      expect(() => item.parseEnvelope(malformed)).toThrow();
    }
  });

  it("rejects invalid generatedAt timestamps for all six contracts", () => {
    for (const item of contractCases) {
      const envelope = item.getEnvelope();
      expect(() =>
        item.parseEnvelope({
          ...envelope,
          generatedAt: "not-an-iso-time",
        })
      ).toThrow();
    }
  });

  it("rejects wrong version contract ids for all six contracts", () => {
    for (const item of contractCases) {
      const envelope = item.getEnvelope();
      expect(() =>
        item.parseEnvelope({
          ...envelope,
          contract: `${item.id}.future`,
        })
      ).toThrow();
    }
  });
});

