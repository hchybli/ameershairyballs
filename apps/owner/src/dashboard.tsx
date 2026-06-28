import { useEffect, useState } from "react";
import { useAuth } from "@backstop/auth";
import { callEdgeFunction } from "@backstop/api-client";

interface KpiResponse {
  metric: string;
  cleanClaimRate: number;
  claimsIngested: number;
  claimsClean: number;
  claimsWithOpenFlags: number;
  drillDown: Array<{
    externalClaimId: string;
    patientRef: string;
    payerName: string;
    flagsOpen: number;
    clean: boolean;
    lastEvent: string;
  }>;
}

export function DashboardPage() {
  const { supabaseSession } = useAuth();
  const [kpi, setKpi] = useState<KpiResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-4 py-3 font-semibold">Backstop Owner</div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Clean-claim rate — last 30 days (demo)</p>

        {loading ? (
          <p className="mt-6 text-sm">Loading…</p>
        ) : (
          <>
            <div className="mt-6 rounded-xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">Clean-claim rate</p>
              <p className="text-5xl font-semibold">{kpi?.cleanClaimRate ?? 0}%</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {kpi?.claimsIngested ?? 0} claims ingested · {kpi?.claimsClean ?? 0} passed
                gate · {kpi?.claimsWithOpenFlags ?? 0} with open flags
              </p>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium">Claims below target</h2>
              {kpi?.drillDown.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">All claims are clean.</p>
              ) : (
                <table className="mt-3 w-full text-left text-sm">
                  <thead className="border-b text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2">Claim</th>
                      <th className="py-2">Patient</th>
                      <th className="py-2">Payer</th>
                      <th className="py-2">Flags</th>
                      <th className="py-2">Last event</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpi?.drillDown.map((row) => (
                      <tr key={row.externalClaimId} className="border-b">
                        <td className="py-2 font-mono text-xs">{row.externalClaimId}</td>
                        <td className="py-2">{row.patientRef}</td>
                        <td className="py-2">{row.payerName}</td>
                        <td className="py-2">{row.flagsOpen}</td>
                        <td className="py-2 text-muted-foreground">{row.lastEvent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        <form onSubmit={uploadOutcomes} className="mt-10 rounded-lg border p-4">
          <h2 className="font-medium">Upload payer outcomes (835 CSV)</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input type="file" name="file" accept=".csv" className="text-sm" />
            <button
              type="submit"
              className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
            >
              Record outcomes
            </button>
          </div>
          {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
        </form>
      </main>
    </div>
  );
}
