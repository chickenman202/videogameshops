import { ServerResponse } from "node:http";
import { varyWithAccept } from "@/lib/vary-accept";

/**
 * Next sets Vary to its router headers with setHeader, which replaces any
 * Accept value from proxy or next.config. HTML on this site can also be
 * markdown, so Accept has to stay on that list beside Accept-Encoding.
 */
function varyTokens(value: unknown): Set<string> {
  return new Set(
    String(value ?? "")
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function registerNodeVary() {
  const originalSet = ServerResponse.prototype.setHeader;
  ServerResponse.prototype.setHeader = function (name, value) {
    if (typeof name === "string" && name.toLowerCase() === "vary") {
      return originalSet.call(this, name, varyWithAccept(value));
    }
    return originalSet.call(this, name, value);
  };

  const originalAppend = ServerResponse.prototype.appendHeader;
  ServerResponse.prototype.appendHeader = function (name, value) {
    if (typeof name === "string" && name.toLowerCase() === "vary") {
      const present = varyTokens(this.getHeader("vary"));
      const novel = String(value)
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part && !present.has(part.toLowerCase()));
      if (novel.length === 0) return this;
      return originalAppend.call(this, name, novel.join(", "));
    }
    return originalAppend.call(this, name, value);
  };
}

registerNodeVary();
