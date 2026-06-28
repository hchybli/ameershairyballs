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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-600">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-600">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
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
      <h1 className="text-lg font-semibold text-slate-900">Access denied</h1>
      <p className="max-w-md text-sm text-slate-600">
        {session
          ? `Your role (${session.role}) cannot access this application.`
          : "You are not signed in."}
      </p>
      <button
        type="button"
        onClick={() => signOut()}
        className="rounded border border-slate-300 px-4 py-2 text-sm"
      >
        Sign out
      </button>
    </div>
  );
}
