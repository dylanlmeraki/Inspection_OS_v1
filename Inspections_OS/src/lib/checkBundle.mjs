import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, "dist");
const manifestPath = path.join(distDir, ".vite", "manifest.json");
const mainChunkBudgetBytes = Number(process.env.MAIN_CHUNK_BUDGET_BYTES || 300 * 1024);

function findManifestEntry(manifest, pattern) {
  return Object.entries(manifest).find(([key]) => pattern.test(key));
}

function findRuntimeEntry(manifestEntries, matcher) {
  return manifestEntries.find(([key, value]) => matcher(key, value));
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function fileSize(filePath) {
  const stats = await fs.stat(filePath);
  return stats.size;
}

async function fileContains(filePath, pattern) {
  const text = await fs.readFile(filePath, "utf8");
  return pattern.test(text);
}

async function run() {
  const manifest = await readJson(manifestPath);
  const manifestEntries = Object.entries(manifest);
  const mainEntry =
    manifestEntries.find(([, value]) => value?.isEntry) ||
    findManifestEntry(manifest, /src\/main\.jsx$/);

  if (!mainEntry) {
    throw new Error("Could not locate main application entry in Vite manifest.");
  }

  const [, mainValue] = mainEntry;
  const mainChunkPath = path.join(distDir, mainValue.file);
  const mainChunkSize = await fileSize(mainChunkPath);

  if (mainChunkSize > mainChunkBudgetBytes) {
    throw new Error(
      `Main chunk size ${mainChunkSize} bytes exceeds budget ${mainChunkBudgetBytes} bytes.`
    );
  }

  const mainContainsJspdf = await fileContains(mainChunkPath, /jspdf/i);
  if (mainContainsJspdf) {
    throw new Error("Main chunk contains jspdf symbols. PDF runtime split boundary regressed.");
  }

  const exportCenterEntry = findRuntimeEntry(
    manifestEntries,
    (key, value) =>
      /ExportCenterPage\.jsx$/.test(key) ||
      key.includes("ExportCenterPage") ||
      value?.name === "export-center-route" ||
      value?.src?.includes("ExportCenterPage.jsx")
  );
  if (!exportCenterEntry) {
    throw new Error("Export center route chunk missing (expected lazy route boundary).");
  }

  const exportEngineEntry = findRuntimeEntry(
    manifestEntries,
    (key, value) =>
      /exportEngine\.js$/.test(key) ||
      key.includes("exportEngine") ||
      value?.name === "export-runtime" ||
      value?.src?.includes("exportEngine.js")
  );
  if (!exportEngineEntry) {
    throw new Error("Export engine chunk missing (expected action boundary split).");
  }

  const pdfRendererEntry = findRuntimeEntry(
    manifestEntries,
    (key, value) =>
      /pdfRenderer\.js$/.test(key) ||
      key.includes("pdfRenderer") ||
      value?.name === "pdf-runtime" ||
      value?.name === "pdfRenderer" ||
      value?.src?.includes("pdfRenderer.js")
  );
  if (!pdfRendererEntry) {
    throw new Error("PDF renderer chunk missing (expected PDF boundary split).");
  }

  const runtimeFiles = [
    exportCenterEntry[1].file,
    exportEngineEntry[1].file,
    pdfRendererEntry[1].file,
  ];

  const duplicateMain = runtimeFiles.find((file) => file === mainValue.file);
  if (duplicateMain) {
    throw new Error("Export/PDF runtime is bundled into main chunk; split boundary regressed.");
  }

  const runtimeKeys = [exportCenterEntry[0], exportEngineEntry[0], pdfRendererEntry[0]];
  const eagerlyImportedRuntime = runtimeKeys.filter((key) => (mainValue.imports || []).includes(key));
  if (eagerlyImportedRuntime.length > 0) {
    throw new Error(
      `Main entry eagerly imports export runtime chunks: ${eagerlyImportedRuntime.join(", ")}`
    );
  }

  const exportEnginePath = path.join(distDir, exportEngineEntry[1].file);
  const exportEngineContainsJspdf = await fileContains(exportEnginePath, /jspdf/i);
  if (exportEngineContainsJspdf) {
    throw new Error(
      "Export engine chunk contains jspdf symbols. PDF renderer should stay in a dedicated chunk."
    );
  }

  console.log("Bundle contract checks passed.");
  console.log(`Main chunk: ${mainValue.file} (${mainChunkSize} bytes)`);
  console.log(`Export route chunk: ${exportCenterEntry[1].file}`);
  console.log(`Export engine chunk: ${exportEngineEntry[1].file}`);
  console.log(`PDF chunk: ${pdfRendererEntry[1].file}`);
}

run().catch((error) => {
  console.error("Bundle contract checks failed.");
  console.error(error.message);
  process.exitCode = 1;
});
