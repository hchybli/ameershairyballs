import { ClaimUpload } from "@/components/claim-upload";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Backstop · Phase 0</p>
        <h1 className="text-3xl font-semibold tracking-tight">Claim CSV ingest</h1>
        <p className="text-muted-foreground">
          Upload a synthetic claims export. Preview parsing locally, or save to Supabase once
          your database is configured.
        </p>
      </header>

      <ClaimUpload />

      <section className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">CSV columns</p>
        <p className="mt-1 font-mono text-xs">
          external_claim_id, patient_ref, payer_name, cdt_code, fee_billed, fee_allowed, tooth,
          quadrant
        </p>
      </section>
    </main>
  );
}
