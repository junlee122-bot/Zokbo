import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { getFile } from "@/lib/notion";

export const runtime = "nodejs";

/**
 * 파일 바이트를 서버에서 받아 스트리밍(Notion URL 노출 방지).
 *   - 기본: attachment(다운로드)
 *   - ?inline=1: inline(미리보기용) — <img>/<iframe> 에서 직접 src 로 사용
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token, process.env.SESSION_SECRET || "dev-insecure-secret-change-me"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const file = await getFile(params.id);
  if (!file || !file.fileUrl) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const upstream = await fetch(file.fileUrl, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "파일을 가져오지 못했습니다." }, { status: 502 });
  }

  const inline = new URL(req.url).searchParams.get("inline") === "1";
  const name = file.fileName || "download";
  const headers = new Headers();
  headers.set("Content-Type", file.mime || upstream.headers.get("content-type") || "application/octet-stream");
  headers.set(
    "Content-Disposition",
    `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(name)}`
  );
  headers.set("Cache-Control", "private, max-age=300");
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);

  return new NextResponse(upstream.body, { headers });
}
