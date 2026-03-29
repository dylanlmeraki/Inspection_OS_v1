/* @vitest-environment jsdom */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";
import App from "@/App";
import { localDb } from "@/lib/localDb";
import { MockSessionProvider } from "@/lib/mockSession.jsx";

function renderAppAt(pathname) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MockSessionProvider>
        <MemoryRouter initialEntries={[pathname]}>
          <App />
        </MemoryRouter>
      </MockSessionProvider>
    </QueryClientProvider>
  );
}

describe("App route guards", () => {
  beforeEach(() => {
    localDb.resetForTests();
  });

  test("default project manager can access core guarded list routes", async () => {
    const dashboardView = renderAppAt("/dashboard");
    expect(
      await screen.findByRole("heading", { name: "Control-Plane Dashboard" })
    ).toBeInTheDocument();
    dashboardView.unmount();

    const projectsView = renderAppAt("/projects");
    expect(await screen.findByRole("heading", { name: "Projects" })).toBeInTheDocument();
    projectsView.unmount();

    const inspectionsView = renderAppAt("/inspections");
    expect(await screen.findByRole("heading", { name: "Inspections" })).toBeInTheDocument();
    inspectionsView.unmount();

    const exportsView = renderAppAt("/exports");
    expect(await screen.findByRole("heading", { name: "Export Center" })).toBeInTheDocument();
    exportsView.unmount();
  });
});
