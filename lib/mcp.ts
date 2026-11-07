import { loadCatalog } from "@/lib/catalog";
import { searchPublicShops } from "@/lib/shops-api";
import { SITE_URL } from "@/lib/site";

const PROTOCOL_VERSIONS = ["2024-11-05", "2025-03-26", "2025-06-18", "2026-07-28"];

export function mcpServerCard() {
  return {
    name: "com.videogameshops/directory",
    title: "videogameshops directory search",
    version: "1.0.0",
    description: "Search the public videogameshops directory of physical video game stores.",
    remotes: [
      {
        type: "streamable-http",
        url: `${SITE_URL}/mcp`,
        supportedProtocolVersions: PROTOCOL_VERSIONS,
      },
    ],
  };
}

type Rpc = { jsonrpc?: string; id?: number | string | null; method?: string; params?: { name?: string; arguments?: Record<string, unknown>; protocolVersion?: string } };

export async function mcpResponse(request: Request): Promise<Response> {
  if (request.method === "GET" || request.method === "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "POST" } });
  }
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });

  let body: Rpc;
  try {
    body = (await request.json()) as Rpc;
  } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 });
  }

  if (body.method === "notifications/initialized") {
    return new Response(null, { status: 202 });
  }

  const id = body.id ?? null;
  if (body.method === "initialize") {
    const requested = body.params?.protocolVersion;
    const protocolVersion = requested && PROTOCOL_VERSIONS.includes(requested) ? requested : "2025-03-26";
    return Response.json({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion,
        capabilities: { tools: {} },
        serverInfo: { name: "videogameshops", version: "1.0.0" },
      },
    });
  }

  if (body.method === "tools/list") {
    return Response.json({
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "search_shops",
            description: "Search indexable physical video game stores by name, city, region, or country.",
            inputSchema: {
              type: "object",
              properties: {
                q: { type: "string" },
                country: { type: "string", description: "ISO code, slug, or English country name." },
                limit: { type: "integer", minimum: 1, maximum: 50 },
              },
              additionalProperties: false,
            },
          },
        ],
      },
    });
  }

  if (body.method === "tools/call" && body.params?.name === "search_shops") {
    const catalog = await loadCatalog();
    if (!catalog.ok) {
      return Response.json({
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: "The store list could not be loaded." }], isError: true },
      });
    }
    const args = body.params.arguments ?? {};
    const shops = searchPublicShops(catalog.stores, {
      q: typeof args.q === "string" ? args.q : "",
      country: typeof args.country === "string" ? args.country : "",
      limit: typeof args.limit === "number" ? args.limit : 20,
    });
    return Response.json({
      jsonrpc: "2.0",
      id,
      result: { content: [{ type: "text", text: JSON.stringify({ shops }) }] },
    });
  }

  if (body.method === "ping") {
    return Response.json({ jsonrpc: "2.0", id, result: {} });
  }

  return Response.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
}
