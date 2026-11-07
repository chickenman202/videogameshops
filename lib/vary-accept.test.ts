import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { varyWithAccept } from "./vary-accept";

describe("varyWithAccept", () => {
  it("adds Accept beside the router list and Accept-Encoding", () => {
    const value = varyWithAccept("rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding");
    const tokens = value.split(",").map((part) => part.trim());
    assert.ok(tokens.includes("Accept"));
    assert.ok(tokens.includes("Accept-Encoding"));
    assert.equal(tokens.filter((token) => token === "Accept").length, 1);
  });

  it("leaves a header that already varies on Accept", () => {
    assert.equal(varyWithAccept("Accept"), "Accept");
    assert.equal(varyWithAccept("accept, Accept-Encoding"), "accept, Accept-Encoding");
  });

  it("collapses a repeated Accept token", () => {
    assert.equal(varyWithAccept("rsc, Accept, Accept"), "rsc, Accept");
  });
});
