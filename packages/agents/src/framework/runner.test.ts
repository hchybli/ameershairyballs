import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { createToolRegistry, listToolsForLlm, raiseFlagTool } from "@backstop/tools";
import { scrubRulesAgentDefinition } from "../scrub/scrub-agent.ts";
import { MODEL_IDS } from "./types.ts";

describe("agent framework", () => {
  it("registers all five fleet tools", () => {
    const registry = createToolRegistry();
    assert.equal(registry.size, 5);
    assert.ok(registry.has("query_claims"));
    assert.ok(registry.has("query_payer_intelligence"));
    assert.ok(registry.has("query_eligibility"));
    assert.ok(registry.has("raise_flag"));
    assert.ok(registry.has("emit_event"));
  });

  it("lists tools for LLM with schemas", () => {
    const tools = listToolsForLlm();
    assert.equal(tools.length, 5);
    assert.ok(tools.every((t) => t.input_schema.type === "object"));
  });

  it("scrub agent is rules mode with raise_flag tool", () => {
    assert.equal(scrubRulesAgentDefinition.mode, "rules");
    assert.deepEqual(scrubRulesAgentDefinition.tools, ["raise_flag"]);
  });

  it("maps model aliases to Anthropic ids", () => {
    assert.ok(MODEL_IDS.sonnet.startsWith("claude-"));
    assert.ok(MODEL_IDS.haiku.startsWith("claude-"));
  });

  it("raise_flag tool schema requires core fields", () => {
    assert.ok(raiseFlagTool.parameters.required?.includes("external_claim_id"));
    assert.ok(raiseFlagTool.parameters.required?.includes("reason"));
  });
});
