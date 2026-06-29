import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./context";
import { roleAllowed, type BackstopRole } from "./session";

interface RequireRoleProps {
  allowed: readonly BackstopRole[];
  loginPath?: string;
  unauthorizedPath?: string;
  children: ReactNode;
}

export function RequireRole({
  allowed,
  loginPath = "/login",
  unauthorizedPath = "/unauthorized",
  children,
}: RequireRoleProps) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  if (!session) {
    return <Navigate to={loginPath} replace />;
  }

  if (!roleAllowed(session.role, allowed)) {
    return <Navigate to={unauthorizedPath} replace />;
  }

  return <>{children}</>;
}

export function RequireAuth({
  loginPath = "/login",
  children,
}: {
  loginPath?: string;
  children: ReactNode;
}) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  if (!session) {
    return <Navigate to={loginPath} replace />;
  }

  return <>{children}</>;
}
