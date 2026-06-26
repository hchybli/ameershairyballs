"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClaimFlagsPanel } from "@/components/claim-flags";
import type { IngestResponse } from "@/lib/types";

export function ClaimUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [clinicName, setClinicName] = useState("Synthetic Demo Clinic");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  async function handleSubmit(save: boolean) {
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("clinicName", clinicName);
    formData.append("save", String(save));

    try {
      const res = await fetch("/api/ingest", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      setResult(data as IngestResponse);
    } catch {
      setError("Network error — is the dev server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="space-y-2">
        <label htmlFor="clinic" className="text-sm font-medium">
          Clinic name
        </label>
        <input
          id="clinic"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="csv" className="text-sm font-medium">
          Claims CSV
        </label>
        <input
          id="csv"
          type="file"
          accept=".csv,text/csv"
          className="block w-full text-sm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground">
          Try <code className="rounded bg-muted px-1">data/synthetic/sample-claims.csv</code>
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button disabled={loading} onClick={() => handleSubmit(false)}>
          {loading ? "Checking…" : "Ingest & check claims"}
        </Button>
        <Button disabled={loading} onClick={() => handleSubmit(true)} variant="outline">
          {loading ? "Working…" : "Save to database"}
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4 text-sm">
            <p className="font-medium">{result.message}</p>
            <p className="mt-1 text-muted-foreground">
              {result.claimsIngested} claim(s) · {result.linesIngested} line(s) · mode:{" "}
              <span className="font-mono">{result.mode}</span>
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-amber-600">
                {result.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Pre-submission flags</h2>
            <ClaimFlagsPanel
              flags={result.scrub.flags}
              autoFixes={result.autoFixes}
              summary={result.scrub.summary}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Next:{" "}
            <Link href="/dashboard" className="font-medium text-foreground underline">
              open the dashboard
            </Link>{" "}
            and upload <code className="rounded bg-muted px-1">sample-outcomes.csv</code>.
          </p>

          <Button variant="ghost" size="sm" onClick={() => setShowRaw((v) => !v)}>
            {showRaw ? "Hide" : "Show"} parsed JSON
          </Button>
          {showRaw && (
            <pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-xs">
              {JSON.stringify(result.claims, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
