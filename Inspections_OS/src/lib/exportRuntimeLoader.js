/** @type {Promise<typeof import("@/pages/ExportCenterPage")> | null} */
let exportCenterRoutePromise = null;
/** @type {Promise<typeof import("@/lib/exportEngine")> | null} */
let exportEnginePromise = null;
/** @type {Promise<typeof import("@/lib/pdfRenderer")> | null} */
let pdfRendererPromise = null;

function safePrefetch(promise) {
  promise?.catch(() => {});
}

export function loadExportCenterRoute() {
  if (!exportCenterRoutePromise) {
    exportCenterRoutePromise = import("@/pages/ExportCenterPage");
  }
  return exportCenterRoutePromise;
}

export function loadExportEngineRuntime() {
  if (!exportEnginePromise) {
    exportEnginePromise = import("@/lib/exportEngine");
  }
  return exportEnginePromise;
}

export function loadPdfRendererRuntime() {
  if (!pdfRendererPromise) {
    pdfRendererPromise = import("@/lib/pdfRenderer");
  }
  return pdfRendererPromise;
}

/**
 * @param {{ includePdf?: boolean }} options
 */
export function prefetchExportRuntime(options = {}) {
  const includePdf = Boolean(options.includePdf);
  safePrefetch(loadExportEngineRuntime());
  if (includePdf) {
    safePrefetch(loadPdfRendererRuntime());
  }
}

export function prefetchExportCenterRoute() {
  safePrefetch(loadExportCenterRoute());
}

