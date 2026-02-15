"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

const CHANNEL_OPTIONS = [
  "Website",
  "Google Business Profile",
  "Email",
  "SMS",
  "Social DMs",
  "Paid Ads",
];

const LANE_OPTIONS = [
  { value: "lane1", label: "Lane 1 - No website (Digital Receptionist)" },
  { value: "lane2", label: "Lane 2 - Outdated site (Digital Employee)" },
  { value: "lane3", label: "Lane 3 - Restaurants (Reputation Engine)" },
];

const PACKAGE_OPTIONS = [
  {
    id: "makeover",
    name: "One-Time Makeover",
    summary: "8-week build + launch sprint for immediate transformation.",
  },
  {
    id: "retainer",
    name: "Monthly Retainer",
    summary: "Ongoing optimization and execution with a 3-month minimum.",
  },
] as const;

interface GuidedFlowResponse {
  playbookId: string;
  runId: string;
  artifacts: {
    recommendedPlaybook: string;
    thirtyDayPlan: string;
    proposalDraft: string;
    renderedProposal: string;
  };
  selectedPackage: {
    id: string;
    name: string;
    term: string;
    upfrontPrice: string;
    monthlyPrice: string;
  };
}

export default function GuidedFlowPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [summary, setSummary] = useState("");
  const [lane, setLane] = useState<"lane1" | "lane2" | "lane3">("lane1");
  const [channels, setChannels] = useState<string[]>(["Website"]);
  const [leads, setLeads] = useState("25");
  const [appointments, setAppointments] = useState("10");
  const [revenue, setRevenue] = useState("20000");
  const [goalNotes, setGoalNotes] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<
    "makeover" | "retainer"
  >("makeover");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GuidedFlowResponse | null>(null);

  function toggleChannel(channel: string) {
    setChannels((current) => {
      if (current.includes(channel)) {
        return current.filter((c) => c !== channel);
      }
      return [...current, channel];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/guided-flow`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessProfile: {
              name: businessName,
              industry,
              location,
              website,
              summary,
            },
            lane,
            channels,
            monthlyGoals: {
              leads: Number(leads),
              appointments: Number(appointments),
              revenue: Number(revenue),
              notes: goalNotes,
            },
            selectedPackageId,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to run guided flow");
      }

      setResult(data as GuidedFlowResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to run guided flow",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border bg-card p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold">Guided Sales Flow</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Capture client context and auto-generate a lane playbook, 30-day
            plan, and proposal draft while creating a linked run.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <h2 className="font-semibold">1) Business Profile</h2>
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
            />
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Website (optional)"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2"
              rows={3}
              placeholder="Current challenges and context"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold">2) Lane + Channels</h2>
            <select
              className="w-full rounded-md border bg-background px-3 py-2"
              value={lane}
              onChange={(e) =>
                setLane(e.target.value as "lane1" | "lane2" | "lane3")
              }
            >
              {LANE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              {CHANNEL_OPTIONS.map((channel) => (
                <label
                  key={channel}
                  className="flex items-center gap-2 rounded-md border p-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={channels.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                  />
                  {channel}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold">3) Monthly Goals</h2>
            <div className="grid grid-cols-3 gap-2">
              <input
                className="rounded-md border bg-background px-3 py-2"
                type="number"
                min={0}
                placeholder="Leads"
                value={leads}
                onChange={(e) => setLeads(e.target.value)}
              />
              <input
                className="rounded-md border bg-background px-3 py-2"
                type="number"
                min={0}
                placeholder="Appointments"
                value={appointments}
                onChange={(e) => setAppointments(e.target.value)}
              />
              <input
                className="rounded-md border bg-background px-3 py-2"
                type="number"
                min={0}
                placeholder="Revenue"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
              />
            </div>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2"
              rows={2}
              placeholder="Goal notes (optional)"
              value={goalNotes}
              onChange={(e) => setGoalNotes(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold">4) Pricing Package</h2>
            <div className="grid gap-2">
              {PACKAGE_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className="rounded-md border p-3 text-sm"
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="package"
                      checked={selectedPackageId === option.id}
                      onChange={() => setSelectedPackageId(option.id)}
                    />
                    <div>
                      <p className="font-medium">{option.name}</p>
                      <p className="text-muted-foreground">{option.summary}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            disabled={isLoading || channels.length === 0}
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
          >
            {isLoading
              ? "Generating deliverables…"
              : "Generate Deliverables + Create Run"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold">Wizard Output</h2>
        {!result ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Generated artifacts and package terms will appear here after submit.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-md bg-muted p-3 text-sm">
              <p>
                <strong>Selected Package:</strong> {result.selectedPackage.name}
              </p>
              <p>Term: {result.selectedPackage.term}</p>
              <p>
                Upfront: {result.selectedPackage.upfrontPrice} · Recurring:{" "}
                {result.selectedPackage.monthlyPrice}
              </p>
            </div>

            <article>
              <h3 className="font-medium">Recommended Lane Playbook</h3>
              <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                {result.artifacts.recommendedPlaybook}
              </pre>
            </article>

            <article>
              <h3 className="font-medium">30-Day Plan</h3>
              <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                {result.artifacts.thirtyDayPlan}
              </pre>
            </article>

            <article>
              <h3 className="font-medium">Proposal Draft (Rendered)</h3>
              <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                {result.artifacts.renderedProposal}
              </pre>
            </article>

            <div className="flex gap-2 pt-2">
              <Link
                href={`/workspaces/${workspaceId}/playbooks/${result.playbookId}`}
                className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
              >
                Open Playbook
              </Link>
              <Link
                href={`/workspaces/${workspaceId}/runs/${result.runId}`}
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Open Linked Run
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
