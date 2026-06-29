import type { ToolCallRecord } from "@backstop/tools";

export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LlmToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface LlmTextBlock {
  type: "text";
  text: string;
}

export type LlmContentBlock = LlmTextBlock | LlmToolUseBlock;

export interface LlmResponse {
  stop_reason: "end_turn" | "tool_use";
  content: LlmContentBlock[];
}

export interface LlmRequest {
  model: string;
  system: string;
  messages: LlmMessage[];
  tools: Array<{
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  }>;
  max_tokens?: number;
}

/** Injectable LLM client — server-side only; mock in tests. */
export interface AnthropicClient {
  complete(request: LlmRequest): Promise<LlmResponse>;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  model: "sonnet" | "haiku";
  systemPrompt: string;
  tools: string[];
  /** Rule-based agents bypass the LLM and call run directly. */
  mode: "rules" | "llm";
  runRules?: (input: AgentRunInput) => Promise<AgentRunOutput>;
}

export interface AgentRunInput {
  tenantId: string;
  clinicId: string;
  actorId: string | null;
  payload: Record<string, unknown>;
}

export interface AgentRunOutput {
  summary: string;
  toolCalls: ToolCallRecord[];
  eventsCreated: number;
}

export interface AgentRunnerDeps {
  anthropic?: AnthropicClient;
  maxToolRounds?: number;
}

export const MODEL_IDS = {
  sonnet: "claude-sonnet-4-20250514",
  haiku: "claude-haiku-3-5-20241022",
} as const;
