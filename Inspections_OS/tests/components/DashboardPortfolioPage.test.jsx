/* @vitest-environment jsdom */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { DashboardPortfolioPage } from "@/pages/DashboardViews";
import { localDb } from "@/lib/localDb";

function renderWithProviders(ui) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("DashboardPortfolioPage", () => {
  beforeEach(() => {
    localDb.resetForTests();
  });

  it("renders drill-down links to filtered operational routes", async () => {
    renderWithProviders(<DashboardPortfolioPage />);
    expect(screen.getByText(/Drill-down widgets/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Blocked projects/ })).toHaveAttribute(
      "href",
      "/projects?filter=blocked"
    );
    expect(screen.getByRole("link", { name: /Overdue inspections/ })).toHaveAttribute(
      "href",
      "/inspections?due=overdue"
    );
    expect(screen.getByRole("link", { name: /Overdue issues/ })).toHaveAttribute(
      "href",
      "/issues/overdue"
    );
  });
});
