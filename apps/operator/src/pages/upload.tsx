import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, SignOutButton } from "@backstop/auth";
import { callEdgeFunctionAuthed, formatEdgeError } from "@backstop/api-client";
import { AppShell, Button, Card } from "@backstop/ui";

export function UploadPage() {
  const navigate = useNavigate();
  const { session, supabase } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }
    if (!session) {
      setError("Session expired — sign out and sign in again.");
      return;
    }

    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("clinic_id", session.clinicId);

    try {
      const res = await callEdgeFunctionAuthed(supabase, "ingest-claims", {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(formatEdgeError(res.status, data));
        return;
      }

      setMessage(data.message ?? "Upload complete.");
      navigate("/", {
        replace: true,
        state: { refreshedAt: Date.now(), uploadMessage: data.message },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed — check console.");
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
      actions={<SignOutButton />}
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
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setError(null);
            }}
            className="block w-full text-sm"
          />
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Uploading…" : "Upload & run scrub"}
          </Button>
          {error && <p className="text-sm text-red-700">{error}</p>}
          {message && <p className="text-sm text-green-800">{message}</p>}
          {loading && <p className="text-sm text-muted-foreground">Running scrub rules…</p>}
        </form>
      </Card>
    </AppShell>
  );
}
