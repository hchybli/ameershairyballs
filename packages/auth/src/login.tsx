import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./context";

export function LoginPage({ title = "Sign in" }: { title?: string }) {
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
    }
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-[color:var(--bs-navy)]">{title}</h1>
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-foreground"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-foreground"
          />
        </label>
        {error ? <p className="text-sm text-[color:var(--bs-danger)]">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-11 rounded-md bg-[color:var(--bs-navy)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export function UnauthorizedPage() {
  const { signOut, session } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-lg font-semibold text-[color:var(--bs-navy)]">Access denied</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {session
          ? `Your role (${session.role}) cannot access this application.`
          : "You are not signed in."}
      </p>
      <button
        type="button"
        onClick={() => signOut()}
        className="min-h-11 rounded-md border border-border bg-white px-4 py-2 text-sm text-foreground hover:bg-muted"
      >
        Sign out
      </button>
    </div>
  );
}
