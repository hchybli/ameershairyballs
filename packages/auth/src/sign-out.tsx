import { useAuth } from "./context";

export function SignOutButton({ className }: { className?: string }) {
  const { signOut } = useAuth();

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className={
        className ??
        "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      }
    >
      Sign out
    </button>
  );
}
