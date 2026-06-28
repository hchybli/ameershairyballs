import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createBrowserClient } from "@backstop/db";
import { parseAppMetadata, type BackstopSession } from "./session";

interface AuthContextValue {
  session: BackstopSession | null;
  supabaseSession: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function sessionFromUser(user: User | null): BackstopSession | null {
  if (!user) {
    return null;
  }

  const meta = parseAppMetadata(user.app_metadata);
  if (!meta) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    tenantId: meta.tenantId,
    clinicId: meta.clinicId,
    role: meta.role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [session, setSession] = useState<BackstopSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }
      setSupabaseSession(data.session);
      setSession(sessionFromUser(data.session?.user ?? null));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSupabaseSession(nextSession);
      setSession(sessionFromUser(nextSession?.user ?? null));
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      supabaseSession,
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, supabaseSession, loading, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function useTenant(): Pick<BackstopSession, "tenantId" | "clinicId" | "role"> | null {
  const { session } = useAuth();
  if (!session) {
    return null;
  }
  return {
    tenantId: session.tenantId,
    clinicId: session.clinicId,
    role: session.role,
  };
}
