import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONTENT_SIGNAL, markdownPath, prefersMarkdown, robotsTxt, splitMarkdownSuffix } from "./discovery";
import { mcpResponse } from "./mcp";
import { renderMarkdown } from "./markdown-page";
import { searchPublicShops } from "./shops-api";
import { loadCatalog } from "./catalog";
import { SITE_URL } from "./site";

describe("content negotiation", () => {
  it("prefers markdown only when text/markdown wins", () => {
    assert.equal(prefersMarkdown("text/markdown"), true);
    assert.equal(prefersMarkdown("text/markdown, text/html;q=0.5"), true);
    assert.equal(prefersMarkdown("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"), false);
    assert.equal(prefersMarkdown("text/html, text/markdown"), false);
    assert.equal(prefersMarkdown(null), false);
  });

  it("maps /index.md onto the HTML path", () => {
    assert.deepEqual(splitMarkdownSuffix("/index.md"), { htmlPath: "/", isMarkdownUrl: true });
    assert.deepEqual(splitMarkdownSuffix("/directory/countries/fr/index.md"), {
      htmlPath: "/directory/countries/fr",
      isMarkdownUrl: true,
    });
    assert.equal(markdownPath("/"), "/index.md");
    assert.equal(markdownPath("/directory/countries/fr"), "/directory/countries/fr/index.md");
  });
});

describe("robots content signals", () => {
  it("allows answer bots and marks training as no without blocking them", () => {
    const text = robotsTxt(SITE_URL);
    assert.match(text, new RegExp(`Content-Signal: ${CONTENT_SIGNAL}`));
    assert.match(text, /User-agent: Googlebot/);
    assert.match(text, /User-agent: Claude-SearchBot/);
    assert.match(text, /User-agent: ChatGPT-User/);
    assert.match(text, /User-agent: Perplexity-User/);
    assert.equal(text.includes("User-agent: GPTBot"), false);
    assert.equal(text.includes("User-agent: ClaudeBot"), false);
    assert.match(text, new RegExp(`Sitemap: ${SITE_URL}/sitemap.xml`));
    assert.match(text, /Allow: \/api\/shops/);
  });
});

describe("markdown documents", () => {
  it("returns home, France, and a thin shop for the markdown URL and for Accept", async () => {
    const home = await renderMarkdown("/");
    const homeByIndex = await renderMarkdown(splitMarkdownSuffix("/index.md").htmlPath);
    assert.equal(home.status, 200);
    assert.equal(home.body, homeByIndex.body);
    assert.match(home.body, /Find physical video game stores by country, region, and city/);
    assert.equal(/\b(lorem|sample site|demo|this version)\b/i.test(home.body), false);

    const france = await renderMarkdown("/directory/countries/fr");
    const franceByIndex = await renderMarkdown(splitMarkdownSuffix("/directory/countries/fr/index.md").htmlPath);
    assert.equal(france.status, 200);
    assert.equal(france.body, franceByIndex.body);
    assert.match(france.body, /# France Video Game Stores/);
    assert.match(france.body, /https:\/\/videogameshops\.com\/directory\/countries\/fr/);

    const shop = await renderMarkdown("/store/esports-bauseli-la-massana-ad");
    assert.equal(shop.status, 200);
    assert.match(shop.body, /# Esports Bauseli/);
    assert.equal(shop.body.includes("streetAddress"), false);
    assert.equal(/^## Hours/m.test(shop.body), false);
    assert.equal(shop.index, false);
    assert.equal(prefersMarkdown("text/markdown"), true);
  });
});

describe("public shop search", () => {
  it("returns name, place, and URL for indexable shops only", async () => {
    const catalog = await loadCatalog();
    assert.equal(catalog.ok, true);
    if (!catalog.ok) return;
    const shops = searchPublicShops(catalog.stores, { country: "fr", q: "game", limit: 5 });
    assert.ok(shops.length > 0);
    assert.ok(shops.length <= 5);
    for (const shop of shops) {
      assert.equal(typeof shop.name, "string");
      assert.match(shop.url, /^https:\/\/videogameshops\.com\/store\//);
      assert.equal("phone" in shop, false);
      assert.equal("address" in shop, false);
    }
  });
});

describe("mcp search tool", () => {
  it("answers initialize and search_shops", async () => {
    const denied = await mcpResponse(new Request("https://videogameshops.com/mcp", { method: "GET" }));
    assert.equal(denied.status, 405);

    const init = await mcpResponse(
      new Request("https://videogameshops.com/mcp", {
        method: "POST",
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } }),
      }),
    );
    const initBody = (await init.json()) as { result: { protocolVersion: string } };
    assert.equal(initBody.result.protocolVersion, "2025-03-26");

    const call = await mcpResponse(
      new Request("https://videogameshops.com/mcp", {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: { name: "search_shops", arguments: { country: "fr", limit: 3 } },
        }),
      }),
    );
    const callBody = (await call.json()) as { result: { content: { text: string }[] } };
    const parsed = JSON.parse(callBody.result.content[0]?.text ?? "{}") as { shops: { url: string }[] };
    assert.ok(parsed.shops.length > 0);
    assert.match(parsed.shops[0]?.url ?? "", /^https:\/\/videogameshops\.com\/store\//);
  });
});
