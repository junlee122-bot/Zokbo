import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { getFile } from "@/lib/notion";

export const runtime = "nodejs";

/** 미리보기용 신선한 임시 URL 발급 (Notion 발급 URL 은 약 1시간 후 만료). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token, process.env.SESSION_SECRET || "dev-insecure-secret-change-me"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const file = await getFile(params.id);
  if (!file || !file.fileUrl) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ url: file.fileUrl, fileName: file.fileName, mime: file.mime });
}
