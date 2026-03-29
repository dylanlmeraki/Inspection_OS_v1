import { describe, expect, it } from "vitest";
import {
  loadExportCenterRoute,
  loadExportEngineRuntime,
  loadPdfRendererRuntime,
  prefetchExportCenterRoute,
  prefetchExportRuntime,
} from "@/lib/exportRuntimeLoader";

describe("export runtime loader", () => {
  it("caches dynamic imports for export route, export engine, and pdf runtime", async () => {
    const firstRoute = loadExportCenterRoute();
    const secondRoute = loadExportCenterRoute();
    expect(firstRoute).toBe(secondRoute);
    await firstRoute;

    const firstEngine = loadExportEngineRuntime();
    const secondEngine = loadExportEngineRuntime();
    expect(firstEngine).toBe(secondEngine);
    await firstEngine;

    const firstPdf = loadPdfRendererRuntime();
    const secondPdf = loadPdfRendererRuntime();
    expect(firstPdf).toBe(secondPdf);
    await firstPdf;
  });

  it("supports prefetch calls without throwing", async () => {
    expect(() => prefetchExportCenterRoute()).not.toThrow();
    expect(() => prefetchExportRuntime()).not.toThrow();
    expect(() => prefetchExportRuntime({ includePdf: true })).not.toThrow();
  });
});

