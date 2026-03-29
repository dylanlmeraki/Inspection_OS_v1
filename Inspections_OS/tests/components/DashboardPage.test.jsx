/* @vitest-environment jsdom */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import DashboardPage from "@/pages/DashboardPage";
import { localDb } from "@/lib/localDb";

function renderWithQuery(ui) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    localDb.resetForTests();
  });

  it("renders dashboard contract payload values", async () => {
    renderWithQuery(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard\.portfolio\.v1/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Project Dashboard Summary Contract/)).toBeInTheDocument();
    expect(screen.getByText(/Inspection Ops Dashboard Contract/)).toBeInTheDocument();
    expect(screen.getByText(/Compliance Dashboard Contract/)).toBeInTheDocument();
    expect(screen.getByText(/dashboard\.portfolio\.v1/)).toBeInTheDocument();
  });
});
