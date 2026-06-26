import { ClaimUpload } from "@/components/claim-upload";
import { SiteNav } from "@/components/site-nav";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <SiteNav />
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Backstop · Phase 1</p>
        <h1 className="text-3xl font-semibold tracking-tight">Claim ingest & pre-submission check</h1>
        <p className="text-muted-foreground">
          Upload a synthetic claims CSV. Backstop parses each line, runs rule checks, auto-fixes
          safe items, and flags the rest for one-tap approval.
        </p>
      </header>

      <ClaimUpload />
    </main>
  );
}
