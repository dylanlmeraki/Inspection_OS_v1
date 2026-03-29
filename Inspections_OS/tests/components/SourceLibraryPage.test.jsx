/* @vitest-environment jsdom */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import SourceLibraryPage from "@/pages/SourceLibraryPage";
import { localDb } from "@/lib/localDb";

function renderWithQuery(ui) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SourceLibraryPage", () => {
  beforeEach(() => {
    localDb.resetForTests();
  });

  it("renders source freshness summary and stale flags", async () => {
    renderWithQuery(<SourceLibraryPage />);

    await waitFor(() => {
      expect(screen.getByText("SMARTS Notice of Termination Guide")).toBeInTheDocument();
    });

    expect(screen.getByText(/Total sources:\s*8/)).toBeInTheDocument();
    expect(screen.getByText(/Stale:\s*1/)).toBeInTheDocument();
    expect(screen.getAllByText("yes").length).toBeGreaterThan(0);
  });
});
