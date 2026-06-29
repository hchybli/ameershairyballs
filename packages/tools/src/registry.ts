import type { ToolContext, ToolDefinition } from "./types.ts";
import { emitEventTool } from "./tools/emit-event.ts";
import { queryClaimsTool } from "./tools/query-claims.ts";
import { queryEligibilityTool } from "./tools/query-eligibility.ts";
import { queryPayerIntelligenceTool } from "./tools/query-payer-intelligence.ts";
import { raiseFlagTool } from "./tools/raise-flag.ts";

export const TOOL_DEFINITIONS = [
  queryClaimsTool,
  queryPayerIntelligenceTool,
  queryEligibilityTool,
  raiseFlagTool,
  emitEventTool,
] as ToolDefinition[];

export type ToolName =
  | "query_claims"
  | "query_payer_intelligence"
  | "query_eligibility"
  | "raise_flag"
  | "emit_event";

export function createToolRegistry(): Map<string, ToolDefinition> {
  return new Map(TOOL_DEFINITIONS.map((tool) => [tool.name, tool]));
}

export async function executeTool(
  ctx: ToolContext,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const tool = createToolRegistry().get(name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return tool.execute(ctx, args);
}

export function listToolsForLlm(): Array<{
  name: string;
  description: string;
  input_schema: ToolDefinition["parameters"];
}> {
  return TOOL_DEFINITIONS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));
}
