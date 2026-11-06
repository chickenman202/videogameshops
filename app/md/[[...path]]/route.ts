import { markdownHeaders, renderMarkdown } from "@/lib/markdown-page";

export const revalidate = 86400;

type Params = { params: Promise<{ path?: string[] }> };

export async function GET(request: Request, context: Params) {
  const { path } = await context.params;
  const htmlPath = path && path.length > 0 ? `/${path.join("/")}` : "/";
  const search = new URL(request.url).searchParams;
  const document = await renderMarkdown(htmlPath, search);
  return new Response(document.body, { status: document.status, headers: markdownHeaders(document) });
}
