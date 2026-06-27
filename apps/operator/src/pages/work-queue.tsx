import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout, SeverityBadge } from "../components/ui";
import type { QueueRow } from "../types";

export function WorkQueuePage() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/queue")
      .then((r) => r.json())
      .then((data) => setRows(data.rows ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Work queue</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} claim(s) with open flags
          </p>
        </div>
        <Link
          to="/upload"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Upload CSV
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-6 text-sm text-muted-foreground">
          No open flags.{" "}
          <Link to="/upload" className="underline">
            Upload claims CSV
          </Link>{" "}
          to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Patient</th>
                <th className="px-3 py-2">Payer</th>
                <th className="px-3 py-2 text-right">$</th>
                <th className="px-3 py-2">Top flag</th>
                <th className="px-3 py-2">Flags</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.externalClaimId} className="border-b hover:bg-muted/20">
                  <td className="px-3 py-2">
                    {row.topSeverity && <SeverityBadge severity={row.topSeverity} />}
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/claims/${row.externalClaimId}`} className="font-medium underline">
                      {row.patientRef}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{row.payerName}</td>
                  <td className="px-3 py-2 text-right">${row.feeTotal.toFixed(0)}</td>
                  <td className="max-w-xs truncate px-3 py-2 text-muted-foreground">
                    {row.topFlagType?.replace(/_/g, " ")}
                  </td>
                  <td className="px-3 py-2">{row.flagsOpen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
