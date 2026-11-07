import { CONTENT_SIGNAL } from "@/lib/discovery";

export function GET() {
  return Response.json(
    { status: "ok" },
    { headers: { "Content-Signal": CONTENT_SIGNAL, "Cache-Control": "public, max-age=300" } },
  );
}
