import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { createToolRegistry } from "./registry.ts";

describe("@backstop/tools contracts", () => {
  it("tool names are unique", () => {
    const registry = createToolRegistry();
    const names = [...registry.keys()];
    assert.equal(new Set(names).size, names.length);
  });

  it("emit_event allowlists agent event types", async () => {
    const emitTool = registryGet("emit_event");
    assert.ok(emitTool);

    let threw = false;
    try {
      await emitTool.execute(
        {
          db: {} as never,
          tenantId: "t",
          clinicId: "c",
          actorId: null,
          agentId: "test",
        },
        { type: "claim.ingested", payload: {} },
      );
    } catch (err) {
      threw = true;
      assert.match(String(err), /not allowlisted/);
    }
    assert.ok(threw);
  });
});

function registryGet(name: string) {
  return createToolRegistry().get(name);
}
