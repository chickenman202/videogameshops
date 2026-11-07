import { CONTENT_SIGNAL } from "@/lib/discovery";
import { mcpServerCard } from "@/lib/mcp";

export const revalidate = 86400;

export function GET() {
  return Response.json(mcpServerCard(), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Signal": CONTENT_SIGNAL,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
