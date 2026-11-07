import { CONTENT_SIGNAL } from "@/lib/discovery";
import { shopsOpenApi } from "@/lib/shops-api";

export const revalidate = 86400;

export function GET() {
  return Response.json(shopsOpenApi(), {
    headers: {
      "Content-Signal": CONTENT_SIGNAL,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
