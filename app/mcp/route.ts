import { CONTENT_SIGNAL } from "@/lib/discovery";
import { mcpResponse } from "@/lib/mcp";

export const revalidate = 86400;

export async function GET() {
  const response = await mcpResponse(new Request("https://videogameshops.com/mcp", { method: "GET" }));
  response.headers.set("Content-Signal", CONTENT_SIGNAL);
  response.headers.set("X-Robots-Tag", "noindex, follow");
  return response;
}

export async function POST(request: Request) {
  const response = await mcpResponse(request);
  response.headers.set("Content-Signal", CONTENT_SIGNAL);
  response.headers.set("X-Robots-Tag", "noindex, follow");
  return response;
}
