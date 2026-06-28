import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@backstop/auth";
import { callEdgeFunction } from "@backstop/api-client";
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
  const { supabaseSession } = useAuth();
  const [kpi, setKpi] = useState<KpiResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TileFilter>("dirty");

  async function loadKpi() {
    const token = supabaseSession?.access_token;
    if (!token) return;

    const res = await callEdgeFunction(token, "analytics-kpi");
    if (res.ok) {
      setKpi(await res.json());
    }
  }

  useEffect(() => {
    loadKpi().finally(() => setLoading(false));
  }, [supabaseSession?.access_token]);

  async function uploadOutcomes(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = supabaseSession?.access_token;
    if (!token) return;

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append("file", file);
    const res = await callEdgeFunction(token, "ingest-outcomes", { method: "POST", body });
    const data = await res.json();
    setMessage(data.message ?? data.error);
    await loadKpi();
    fileInput.value = "";
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
    <AppShell title="Backstop Owner" nav={[{ href: "/", label: "Dashboard", active: true }]}>
      <div>
        <h1 className="text-2xl font-semibold text-[color:var(--bs-navy)]">Command center</h1>
        <p className="text-sm text-muted-foreground">Synthetic demo · tenant-scoped via RLS</p>
      </div>

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
        </>
      )}

      <Card className="mt-8 p-4">
        <form onSubmit={uploadOutcomes}>
          <h2 className="font-medium text-[color:var(--bs-navy)]">Upload payer outcomes (835 CSV)</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input type="file" name="file" accept=".csv" className="text-sm" />
            <button
              type="submit"
              className="min-h-11 rounded-md bg-[color:var(--bs-navy)] px-4 py-2 text-sm font-medium text-white"
            >
              Record outcomes
            </button>
          </div>
          {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
        </form>
      </Card>
    </AppShell>
  );
}
