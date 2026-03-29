/* @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BlockerCard from "@/components/ui/BlockerCard";
import ManifestReferenceCard from "@/components/ui/ManifestReferenceCard";
import AmbiguityNoteBlock from "@/components/ui/AmbiguityNoteBlock";

describe("control-plane primitives", () => {
  it("renders blocker semantics with verification and waiver visibility", () => {
    render(
      <BlockerCard
        title="CONTRA_RECOGNIZED_AGENCY_REQUIRED"
        severity="blocker"
        unmetRequirement="Selected agency missing"
        whyRequired="County packet requires recognized agency."
        ruleSource="rule_special_contra"
        resolvingArtifact="special_cover_packet"
        verificationStatus="verified-direct"
        waiverAvailable={false}
        owner="Reviewer"
        nextAction="Return run"
      />
    );
    expect(screen.getByText("CONTRA_RECOGNIZED_AGENCY_REQUIRED")).toBeInTheDocument();
    expect(screen.getByText(/Waiver available:/)).toBeInTheDocument();
    expect(screen.getByText(/County packet requires recognized agency/)).toBeInTheDocument();
  });

  it("renders manifest provenance fields", () => {
    render(
      <ManifestReferenceCard
        exportId="exp_001"
        manifestId="manifest_001"
        ruleSnapshotId="rs_001"
        sourceEntryCount={4}
        evidenceCount={3}
        exceptionCount={2}
        waivedCount={1}
        generatedBy="local_user"
        generatedAt="2026-03-29T00:00:00.000Z"
      />
    );
    expect(screen.getByText("Manifest Reference")).toBeInTheDocument();
    expect(screen.getByText(/exp_001/)).toBeInTheDocument();
    expect(screen.getByText(/rs_001/)).toBeInTheDocument();
  });

  it("renders ambiguity note without hiding policy/source reason", () => {
    render(
      <AmbiguityNoteBlock
        title="County/city split requires disclosure"
        reason="No direct county packet mirror yet."
        sourceRule="rule trace + source reference only status"
        fixAction="Acquire direct mirror and re-run validation."
        responsibleActor="Compliance admin"
      />
    );
    expect(screen.getByText("County/city split requires disclosure")).toBeInTheDocument();
    expect(screen.getByText(/source reference only/)).toBeInTheDocument();
    expect(screen.getByText(/Compliance admin/)).toBeInTheDocument();
  });
});

