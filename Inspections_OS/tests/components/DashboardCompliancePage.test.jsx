/* @vitest-environment jsdom */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { DashboardCompliancePage } from "@/pages/DashboardViews";
import { localDb } from "@/lib/localDb";

function renderWithProviders(ui) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("DashboardCompliancePage", () => {
  beforeEach(() => {
    localDb.resetForTests();
  });

  it("renders source freshness nuance in operational dashboard context", async () => {
    renderWithProviders(<DashboardCompliancePage />);
    expect(screen.getByText(/Compliance Dashboard/)).toBeInTheDocument();
    expect(screen.getByText(/Source freshness/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("SMARTS Notice of Termination Guide")).toBeInTheDocument();
    });
    expect(screen.getByText("SMARTS Notice of Termination Guide")).toBeInTheDocument();
    expect(screen.getAllByText("stale").length).toBeGreaterThan(0);
  });
});
