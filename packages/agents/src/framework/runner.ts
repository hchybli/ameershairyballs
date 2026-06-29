import type { BackstopServiceClient } from "@backstop/db";
import { executeTool, listToolsForLlm, type ToolCallRecord, type ToolContext } from "@backstop/tools";
import { createAnthropicClient } from "./anthropic.ts";
import {
  MODEL_IDS,
  type AgentDefinition,
  type AgentRunInput,
  type AgentRunOutput,
  type AgentRunnerDeps,
  type AnthropicClient,
  type LlmTextBlock,
  type LlmToolUseBlock,
} from "./types.ts";

export class AgentRunner {
  private readonly anthropic: AnthropicClient | null;
  private readonly maxRounds: number;

  constructor(private readonly db: BackstopServiceClient, deps: AgentRunnerDeps = {}) {
    this.anthropic = deps.anthropic ?? createAnthropicClient();
    this.maxRounds = deps.maxToolRounds ?? 8;
  }

  async run(agent: AgentDefinition, input: AgentRunInput): Promise<AgentRunOutput> {
    if (agent.mode === "rules") {
      if (!agent.runRules) {
        throw new Error(`Agent ${agent.id} is rules mode but has no runRules handler`);
      }
      return agent.runRules(input);
    }

    if (!this.anthropic) {
      throw new Error(
        `Agent ${agent.id} requires ANTHROPIC_API_KEY (LLM mode). Use rules mode or configure the key server-side.`,
      );
    }

    const ctx: ToolContext = {
      db: this.db,
      tenantId: input.tenantId,
      clinicId: input.clinicId,
      actorId: input.actorId,
      agentId: agent.id,
    };

    const allowed = new Set(agent.tools);
    const tools = listToolsForLlm().filter((t) => allowed.has(t.name));
    const toolCalls: ToolCallRecord[] = [];
    let eventsCreated = 0;
    const messages = [
      {
        role: "user" as const,
        content: JSON.stringify(input.payload),
      },
    ];

    for (let round = 0; round < this.maxRounds; round += 1) {
      const response = await this.anthropic.complete({
        model: MODEL_IDS[agent.model],
        system: agent.systemPrompt,
        messages,
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema as unknown as Record<string, unknown>,
        })),
      });

      const textParts = response.content.filter((b): b is LlmTextBlock => b.type === "text");
      const toolUses = response.content.filter((b): b is LlmToolUseBlock => b.type === "tool_use");

      if (toolUses.length === 0 || response.stop_reason === "end_turn") {
        return {
          summary: textParts.map((b) => b.text).join("\n") || "Agent completed.",
          toolCalls,
          eventsCreated,
        };
      }

      for (const toolUse of toolUses) {
        const result = await executeTool(ctx, toolUse.name, toolUse.input);
        toolCalls.push({ tool: toolUse.name, args: toolUse.input, result });
        if (
          toolUse.name === "raise_flag" ||
          toolUse.name === "emit_event"
        ) {
          const r = result as { created?: boolean };
          if (r.created) {
            eventsCreated += 1;
          }
        }
      }

      messages.push({
        role: "user",
        content: JSON.stringify({ tool_results: toolCalls.slice(-toolUses.length) }),
      });
    }

    return {
      summary: "Agent stopped after max tool rounds.",
      toolCalls,
      eventsCreated,
    };
  }
}
