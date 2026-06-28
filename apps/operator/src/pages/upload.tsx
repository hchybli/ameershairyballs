import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@backstop/auth";
import { callEdgeFunction } from "@backstop/api-client";
import { AppShell, Button, Card } from "@backstop/ui";

export function UploadPage() {
  const navigate = useNavigate();
  const { session, supabaseSession } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !session || !supabaseSession?.access_token) return;

    setLoading(true);
    setMessage(null);
    const form = new FormData();
    form.append("file", file);
    form.append("clinic_id", session.clinicId);

    try {
      const res = await callEdgeFunction(supabaseSession.access_token, "ingest-claims", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Upload failed");
        return;
      }
      setMessage(data.message);
      setTimeout(() => navigate("/"), 800);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Backstop Operator"
      nav={[
        { href: "/", label: "Work queue" },
        { href: "/upload", label: "Upload CSV", active: true },
      ]}
    >
      <Link to="/" className="text-sm text-muted-foreground hover:underline">
        ← Work queue
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-[color:var(--bs-navy)]">Upload claims CSV</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Dentrix export or synthetic sample from <code>data/synthetic/sample-claims.csv</code>
      </p>

      <Card className="mt-6 p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          <Button type="submit" variant="primary" disabled={!file || loading}>
            {loading ? "Uploading…" : "Upload & run scrub"}
          </Button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </form>
      </Card>
    </AppShell>
  );
}
