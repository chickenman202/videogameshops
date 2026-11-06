import { CONTENT_SIGNAL } from "@/lib/discovery";
import { buildLlmsTxt } from "@/lib/markdown-page";

export const revalidate = 86400;

export async function GET() {
  const body = await buildLlmsTxt();
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Signal": CONTENT_SIGNAL,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
