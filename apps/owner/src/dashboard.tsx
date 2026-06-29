import { useEffect, useMemo, useState } from "react";
import { useAuth, SignOutButton } from "@backstop/auth";
import { callEdgeFunctionAuthed, formatEdgeError } from "@backstop/api-client";
import { AppShell, Card, MetricTile } from "@backstop/ui";

interface KpiResponse {
  cleanClaimRate: number;
  claimsIngested: number;
  claimsClean: number;
  claimsWithOpenFlags: number;
  denialRate: number;
  outcomesRecorded: number;
  outcomesDenied: number;
  dollarsRecovered: number;
  payerScorecards: Array<{
    payerName: string;
    sampleSize: number;
    denialRate: number;
    downcodeFrequency: number;
    avgDaysToPay: number | null;
    avgPaidAmount: number | null;
    topDenialReasons: string[];
    cdtCodesTracked: number;
  }>;
  drillDown: Array<{
    externalClaimId: string;
    patientRef: string;
    payerName: string;
    flagsOpen: number;
    clean: boolean;
    lastEvent: string;
  }>;
}

type TileFilter = "all" | "dirty" | "denials";

export function DashboardPage() {
  const { supabase, session, loading: authLoading } = useAuth();
  const [kpi, setKpi] = useState<KpiResponse | null>(null);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadOk, setUploadOk] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TileFilter>("dirty");

  async function loadKpi() {
    try {
      const res = await callEdgeFunctionAuthed(supabase, "analytics-kpi");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setKpiError(formatEdgeError(res.status, err as { error?: string }));
        return;
      }

      setKpiError(null);
      setKpi(await res.json());
    } catch (err) {
      setKpiError(err instanceof Error ? err.message : "Dashboard load failed");
    }
  }

  useEffect(() => {
    if (authLoading || !session) {
      return;
    }
    loadKpi().finally(() => setLoading(false));
  }, [supabase, session, authLoading]);

  async function uploadOutcomes(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadMessage(null);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setUploadOk(false);
      setUploadMessage("Choose a CSV file first.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await callEdgeFunctionAuthed(supabase, "ingest-outcomes", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      setUploadOk(res.ok);
      setUploadMessage(
        res.ok
          ? (data.message ?? "Outcomes recorded.")
          : formatEdgeError(res.status, data),
      );
      if (res.ok) {
        await loadKpi();
      }
      fileInput.value = "";
    } catch (err) {
      setUploadOk(false);
      setUploadMessage(err instanceof Error ? err.message : "Upload failed — check console.");
    } finally {
      setUploading(false);
    }
  }

  const tableRows = useMemo(() => {
    if (!kpi) return [];
    if (filter === "dirty") return kpi.drillDown;
    if (filter === "denials") {
      return kpi.drillDown.filter((r) => r.lastEvent === "flag.raised");
    }
    return kpi.drillDown;
  }, [kpi, filter]);

  return (
    <AppShell
      title="Backstop Owner"
      nav={[{ href: "/", label: "Dashboard", active: true }]}
      actions={<SignOutButton />}
    >
      <div>
        <h1 className="text-2xl font-semibold text-[color:var(--bs-navy)]">Command center</h1>
        <p className="text-sm text-muted-foreground">Synthetic demo · tenant-scoped via RLS</p>
      </div>

      {kpiError && (
        <Card className="mt-4 border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {kpiError}
          <button type="button" onClick={() => void loadKpi()} className="ml-2 font-medium underline">
            Retry
          </button>
        </Card>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <MetricTile
              hero
              label="Dollars recovered"
              value={`$${(kpi?.dollarsRecovered ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              hint={`${kpi?.outcomesRecorded ?? 0} outcomes recorded`}
              tone="success"
              onClick={() => setFilter("all")}
            />
            <MetricTile
              label="Clean-claim rate"
              value={`${kpi?.cleanClaimRate ?? 0}%`}
              hint={`${kpi?.claimsClean ?? 0} / ${kpi?.claimsIngested ?? 0} passed gate`}
              tone={(kpi?.cleanClaimRate ?? 0) >= 80 ? "success" : "warn"}
              onClick={() => setFilter("dirty")}
            />
            <MetricTile
              label="Denial rate"
              value={`${kpi?.denialRate ?? 0}%`}
              hint={`${kpi?.outcomesDenied ?? 0} denied of ${kpi?.outcomesRecorded ?? 0}`}
              tone={(kpi?.denialRate ?? 0) > 25 ? "danger" : "default"}
              onClick={() => setFilter("denials")}
            />
          </div>

          <Card className="mt-8 overflow-hidden">
            <div className="border-b px-4 py-3">
              <h2 className="font-medium text-[color:var(--bs-navy)]">
                {filter === "dirty" ? "Claims below target" : "Drill-down"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {kpi?.claimsWithOpenFlags ?? 0} with open flags · tap a KPI tile to filter
              </p>
            </div>
            {tableRows.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No rows for this filter.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Claim</th>
                      <th className="px-4 py-2">Patient</th>
                      <th className="px-4 py-2">Payer</th>
                      <th className="px-4 py-2 text-right">Flags</th>
                      <th className="px-4 py-2">Last event</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row) => (
                      <tr key={row.externalClaimId} className="border-b hover:bg-muted/20">
                        <td className="px-4 py-2 font-mono text-xs">{row.externalClaimId}</td>
                        <td className="px-4 py-2">{row.patientRef}</td>
                        <td className="px-4 py-2">{row.payerName}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{row.flagsOpen}</td>
                        <td className="px-4 py-2 text-muted-foreground">{row.lastEvent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {(kpi?.payerScorecards.length ?? 0) > 0 && (
            <Card className="mt-8 overflow-hidden">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium text-[color:var(--bs-navy)]">Payer scorecard</h2>
                <p className="text-xs text-muted-foreground">From payer_intelligence moat · tenant RLS</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Payer</th>
                      <th className="px-4 py-2 text-right">Denial %</th>
                      <th className="px-4 py-2 text-right">Downcode %</th>
                      <th className="px-4 py-2 text-right">Days to pay</th>
                      <th className="px-4 py-2">Top denial codes</th>
                      <th className="px-4 py-2 text-right">CDTs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpi?.payerScorecards.map((payer) => (
                      <tr key={payer.payerName} className="border-b hover:bg-muted/20">
                        <td className="px-4 py-2 font-medium">{payer.payerName}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{payer.denialRate}%</td>
                        <td className="px-4 py-2 text-right tabular-nums">{payer.downcodeFrequency}%</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {payer.avgDaysToPay != null ? payer.avgDaysToPay : "—"}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {payer.topDenialReasons.length > 0
                            ? payer.topDenialReasons.join(", ")
                            : "—"}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{payer.cdtCodesTracked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <Card className="mt-8 p-4">
        <form onSubmit={uploadOutcomes}>
          <h2 className="font-medium text-[color:var(--bs-navy)]">Upload payer outcomes (835 CSV)</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input type="file" name="file" accept=".csv" className="text-sm" />
            <button
              type="submit"
              disabled={uploading}
              className="min-h-11 rounded-md bg-[color:var(--bs-navy)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Record outcomes"}
            </button>
          </div>
          {uploading && <p className="mt-2 text-sm text-muted-foreground">Recording outcomes…</p>}
          {uploadMessage && (
            <p className={`mt-2 text-sm ${uploadOk ? "text-muted-foreground" : "text-red-700"}`}>
              {uploadMessage}
            </p>
          )}
        </form>
      </Card>
    </AppShell>
  );
}
