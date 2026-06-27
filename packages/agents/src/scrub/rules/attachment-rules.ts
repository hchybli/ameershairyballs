import type { AttachmentKind } from "@backstop/core";
import { isCrownCode } from "./cdt-catalog.js";

export interface AttachmentRule {
  cdtCode: string;
  required: AttachmentKind[];
  note: string;
}

/** Base attachment requirements by CDT (all payers). */
const BASE_ATTACHMENT_RULES: AttachmentRule[] = [
  {
    cdtCode: "D4341",
    required: ["perio_chart", "radiograph", "narrative"],
    note: "SRP (4+ teeth) — perio charting, radiographs, and narrative are commonly required.",
  },
  {
    cdtCode: "D4342",
    required: ["perio_chart", "radiograph", "narrative"],
    note: "SRP (1–3 teeth) — perio charting, radiographs, and narrative are commonly required.",
  },
  {
    cdtCode: "D4910",
    required: ["perio_chart"],
    note: "Perio maintenance — chart showing prior SRP history is commonly required.",
  },
  {
    cdtCode: "D2950",
    required: ["radiograph", "narrative"],
    note: "Core buildup — pre-op radiograph and narrative supporting medical necessity.",
  },
  {
    cdtCode: "D2740",
    required: ["radiograph"],
    note: "Crown — pre-op radiograph commonly required.",
  },
  {
    cdtCode: "D9999",
    required: ["narrative"],
    note: "By-report procedure — narrative is required.",
  },
];

/** Payer-specific additions (v1 starter pack: Delta, MetLife, Cigna). */
const PAYER_ATTACHMENT_OVERRIDES: Record<
  string,
  { cdtCode: string; extra: AttachmentKind[]; note: string }[]
> = {
  "delta dental": [
    {
      cdtCode: "D2740",
      extra: ["narrative"],
      note: "Delta often requires a narrative when billing a crown over an existing restoration.",
    },
  ],
  "metlife dental": [],
  "cigna dental": [
    {
      cdtCode: "D4341",
      extra: ["narrative"],
      note: "Cigna frequently requests detailed narrative for SRP claims.",
    },
  ],
};

function normalizePayer(name: string): string {
  return name.trim().toLowerCase();
}

export function getRequiredAttachments(
  cdtCode: string,
  payerName: string,
): { required: AttachmentKind[]; note: string } | null {
  const base = BASE_ATTACHMENT_RULES.find((r) => r.cdtCode === cdtCode);
  const crown = isCrownCode(cdtCode) && !base;

  if (!base && !crown) {
    return null;
  }

  const required = new Set<AttachmentKind>(base?.required ?? ["radiograph"]);
  let note = base?.note ?? "Crown — radiograph commonly required.";

  const payerRules = PAYER_ATTACHMENT_OVERRIDES[normalizePayer(payerName)] ?? [];
  for (const override of payerRules) {
    if (override.cdtCode === cdtCode || (isCrownCode(cdtCode) && override.cdtCode === "D2740")) {
      override.extra.forEach((a) => required.add(a));
      note = `${note} ${override.note}`;
    }
  }

  return { required: Array.from(required), note };
}

export function attachmentLabel(kind: AttachmentKind): string {
  const labels: Record<AttachmentKind, string> = {
    radiograph: "Radiograph / X-ray",
    perio_chart: "Periodontal chart",
    narrative: "Clinical narrative",
  };
  return labels[kind];
}
