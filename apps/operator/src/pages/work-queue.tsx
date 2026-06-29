import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, SignOutButton } from "@backstop/auth";
import { fetchWorkQueue } from "@backstop/handlers/browser";
import type { QueueRow } from "@backstop/core";
import { AppShell, Button, Card, SeverityBadge } from "@backstop/ui";

export function WorkQueuePage() {
  const { session, supabase } = useAuth();
  const location = useLocation();
  const uploadNotice = (location.state as { uploadMessage?: string } | null)?.uploadMessage;
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setError(null);
    setLoading(true);
    try {
      const data = await fetchWorkQueue(supabase);
      setRows(data);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Failed to load work queue");
    } finally {
      setLoading(false);
    }
  }, [session, supabase]);

  useEffect(() => {
    void load();
  }, [load, location.key]);

  return (
    <AppShell
      title="Backstop Operator"
      nav={[
        { href: "/", label: "Work queue", active: true },
        { href: "/upload", label: "Upload CSV" },
      ]}
      actions={<SignOutButton />}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[color:var(--bs-navy)]">Work queue</h1>
          <p className="text-sm text-muted-foreground">
            Ranked by dollar impact × urgency · {rows.length} claim(s)
          </p>
        </div>
        <Link to="/upload">
          <Button variant="primary">Upload CSV</Button>
        </Link>
      </div>

      {uploadNotice && (
        <Card className="mb-4 border-green-200 bg-green-50 p-4 text-sm text-green-900">{uploadNotice}</Card>
      )}

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <button type="button" onClick={() => void load()} className="ml-2 font-medium underline">
            Retry
          </button>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">
          No open flags.{" "}
          <Link to="/upload" className="font-medium text-[color:var(--bs-terracotta)] underline">
            Upload claims CSV
          </Link>{" "}
          to get started.
        </Card>
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {rows.map((row) => (
              <Link key={row.externalClaimId} to={`/claims/${row.externalClaimId}`}>
                <Card className="p-4 transition active:scale-[0.99]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[color:var(--bs-navy)]">{row.patientRef}</p>
                      <p className="text-xs text-muted-foreground">{row.payerName}</p>
                    </div>
                    {row.topSeverity && <SeverityBadge severity={row.topSeverity} />}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="tabular-nums font-medium text-[color:var(--bs-terracotta)]">
                      ${row.dollarImpactAtRisk.toFixed(0)} at risk
                    </span>
                    <span className="text-muted-foreground">{row.flagsOpen} flag(s)</span>
                  </div>
                  {row.topFlagReason && (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{row.topFlagReason}</p>
                  )}
                </Card>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-border bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Severity</th>
                  <th className="px-3 py-2">Patient</th>
                  <th className="px-3 py-2">Payer</th>
                  <th className="px-3 py-2 text-right">$ impact</th>
                  <th className="px-3 py-2">Top flag</th>
                  <th className="px-3 py-2 text-right">Flags</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.externalClaimId} className="border-b hover:bg-muted/20">
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">
                      {Math.round(row.priorityScore)}
                    </td>
                    <td className="px-3 py-2">
                      {row.topSeverity && <SeverityBadge severity={row.topSeverity} />}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        to={`/claims/${row.externalClaimId}`}
                        className="font-medium text-[color:var(--bs-navy)] underline-offset-2 hover:underline"
                      >
                        {row.patientRef}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{row.payerName}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">
                      ${row.dollarImpactAtRisk.toFixed(0)}
                    </td>
                    <td className="max-w-xs truncate px-3 py-2 text-muted-foreground">
                      {row.topFlagReason ?? row.topFlagType?.replace(/_/g, " ")}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.flagsOpen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}
