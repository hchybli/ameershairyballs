"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/site-nav";

interface DashboardData {
  claimsIngested: number;
  linesIngested: number;
  flagsOpen: number;
  flagsTotal: number;
  autoFixesApplied: number;
  dollarsFlagged: number;
  outcomesRecorded: number;
  paidCount: number;
  deniedCount: number;
  downcodedCount: number;
  denialRate: number;
  totalPaid: number;
  dollarsRecovered: number;
  topFlagTypes: { type: string; count: number }[];
  recentOutcomes: {
    externalClaimId: string;
    result: string;
    paidAmount: number;
    remarkCode: string | null;
    remarkText: string | null;
    observedAt: string;
  }[];
  claimsWithoutOutcomes: string[];
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [outcomeFile, setOutcomeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadOutcomes() {
    if (!outcomeFile) {
      setError("Choose an outcomes CSV first.");
      return;
    }
    setUploading(true);
    setError(null);
    setMessage(null);
    setWarnings([]);

    const formData = new FormData();
    formData.append("file", outcomeFile);

    try {
      const res = await fetch("/api/outcomes", { method: "POST", body: formData });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Upload failed.");
        return;
      }
      setMessage(body.message);
      setWarnings(body.warnings ?? []);
      await load();
    } catch {
      setError("Network error.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <SiteNav />

      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Backstop · Phase 2</p>
        <h1 className="text-3xl font-semibold tracking-tight">Billing dashboard</h1>
        <p className="text-muted-foreground">
          Flagged, fixed, paid, and money recovered — from ingested claims and payer outcomes.
        </p>
      </header>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Claims ingested" value={String(data.claimsIngested)} />
            <MetricCard label="Open flags" value={String(data.flagsOpen)} />
            <MetricCard label="$ flagged" value={`$${data.dollarsFlagged.toFixed(0)}`} />
            <MetricCard label="Auto-fixes" value={String(data.autoFixesApplied)} />
            <MetricCard label="Outcomes recorded" value={String(data.outcomesRecorded)} />
            <MetricCard label="Paid" value={String(data.paidCount)} />
            <MetricCard
              label="Denial rate"
              value={data.outcomesRecorded > 0 ? `${(data.denialRate * 100).toFixed(0)}%` : "—"}
            />
            <MetricCard label="Total $ paid" value={`$${data.totalPaid.toFixed(0)}`} />
            <MetricCard label="Denied" value={String(data.deniedCount)} />
            <MetricCard label="Downcoded" value={String(data.downcodedCount)} />
            <MetricCard label="$ recovered" value={`$${data.dollarsRecovered.toFixed(0)}`} />
          </div>

          {data.claimsWithoutOutcomes.length > 0 && data.claimsIngested > 0 && (
            <p className="text-sm text-muted-foreground">
              Awaiting outcomes:{" "}
              <span className="font-mono">{data.claimsWithoutOutcomes.join(", ")}</span>
            </p>
          )}

          {data.topFlagTypes.length > 0 && (
            <section className="rounded-lg border p-4">
              <h2 className="font-semibold">Top flag types</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {data.topFlagTypes.map(({ type, count }) => (
                  <li key={type} className="flex justify-between">
                    <span className="font-mono text-xs">{type.replace(/_/g, " ")}</span>
                    <span>{count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-3 rounded-lg border p-4">
            <h2 className="font-semibold">Upload payer outcomes (835/ERA)</h2>
            <p className="text-sm text-muted-foreground">
              Simplified CSV for now — try{" "}
              <code className="rounded bg-muted px-1">data/synthetic/sample-outcomes.csv</code>
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              className="block text-sm"
              onChange={(e) => setOutcomeFile(e.target.files?.[0] ?? null)}
            />
            <Button disabled={uploading} onClick={uploadOutcomes}>
              {uploading ? "Uploading…" : "Record outcomes"}
            </Button>
            {message && <p className="text-sm text-green-700">{message}</p>}
            {warnings.length > 0 && (
              <ul className="list-inside list-disc text-sm text-amber-700">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </section>

          {data.recentOutcomes.length > 0 && (
            <section className="rounded-lg border p-4">
              <h2 className="mb-3 font-semibold">Recent outcomes</h2>
              <ul className="space-y-2 text-sm">
                {data.recentOutcomes.map((o, i) => (
                  <li key={`${o.externalClaimId}-${i}`} className="rounded border p-3">
                    <p className="font-medium">
                      {o.externalClaimId}{" "}
                      <span className="font-normal text-muted-foreground">· {o.result}</span>
                    </p>
                    <p>${o.paidAmount.toFixed(2)} paid</p>
                    {o.remarkCode && (
                      <p className="text-xs text-muted-foreground">
                        {o.remarkCode}: {o.remarkText}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.claimsIngested === 0 && (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No claims yet —{" "}
              <a href="/" className="underline">
                ingest claims
              </a>{" "}
              first, then upload outcomes here.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
