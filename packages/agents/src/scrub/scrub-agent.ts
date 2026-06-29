import { scrubClaimsWithAutoFix } from "../scrub/engine.ts";
import type { ParsedClaim } from "@backstop/core";
import type { BackstopServiceClient } from "@backstop/db";
import { replay } from "@backstop/events";
import { raiseFlagTool, type ToolContext } from "@backstop/tools";
import type { AgentDefinition, AgentRunInput, AgentRunOutput } from "../framework/types.ts";

export const SCRUB_RULES_AGENT_ID = "scrub_rules";

export const scrubRulesAgentDefinition: AgentDefinition = {
  id: SCRUB_RULES_AGENT_ID,
  name: "Scrub rules agent",
  description: "Deterministic CDT scrub rules — extends Phase 1 rules engine via tools.",
  model: "haiku",
  systemPrompt: "",
  tools: ["raise_flag"],
  mode: "rules",
  runRules: async () => {
    throw new Error("scrubRulesAgentDefinition.runRules requires runScrubRulesAgent()");
  },
};

export interface RunScrubRulesInput {
  claims: ParsedClaim[];
  clinicIdByExternalId: Map<string, string>;
}

export async function runScrubRulesAgent(
  db: BackstopServiceClient,
  auth: { tenantId: string; userId: string | null },
  input: RunScrubRulesInput,
): Promise<AgentRunOutput & { event_ids: string[] }> {
  const { flags } = scrubClaimsWithAutoFix(input.claims);
  const toolCalls: AgentRunOutput["toolCalls"] = [];
  const eventIds: string[] = [];
  let eventsCreated = 0;

  for (const flag of flags) {
    const clinicId = input.clinicIdByExternalId.get(flag.externalClaimId);
    if (!clinicId) continue;

    const ctx: ToolContext = {
      db,
      tenantId: auth.tenantId,
      clinicId,
      actorId: auth.userId,
      agentId: SCRUB_RULES_AGENT_ID,
    };

    const result = await raiseFlagTool.execute(ctx, {
      external_claim_id: flag.externalClaimId,
      line_index: flag.lineIndex >= 0 ? flag.lineIndex : null,
      cdt_code: flag.cdtCode,
      flag_type: flag.type,
      severity: flag.severity,
      dollar_impact: flag.dollarImpact,
      reason: flag.reason,
      suggested_fix: flag.suggestedFix ?? null,
      raised_by: "scrub_agent",
      rule_id: flag.type,
    });

    toolCalls.push({
      tool: "raise_flag",
      args: { external_claim_id: flag.externalClaimId, flag_type: flag.type },
      result,
    });
    eventIds.push(result.event_id);
    if (result.created) {
      eventsCreated += 1;
    }
  }

  await replay(db);

  return {
    summary: `Scrub raised ${eventsCreated} new flag(s) from ${flags.length} finding(s).`,
    toolCalls,
    eventsCreated,
    event_ids: eventIds,
  };
}
