import type { AnthropicClient, LlmRequest } from "./types.ts";

/**
 * Server-side Anthropic client (fetch). Returns null when ANTHROPIC_API_KEY is unset.
 * Never import this from browser bundles.
 */
export function createAnthropicClient(apiKey?: string): AnthropicClient | null {
  const key = apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return null;
  }

  return {
    async complete(request: LlmRequest) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: request.max_tokens ?? 1024,
          system: request.system,
          messages: request.messages,
          tools: request.tools,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Anthropic API error ${res.status}: ${body}`);
      }

      const data = (await res.json()) as {
        stop_reason: "end_turn" | "tool_use";
        content: Array<
          | { type: "text"; text: string }
          | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
        >;
      };

      return {
        stop_reason: data.stop_reason,
        content: data.content,
      };
    },
  };
}
