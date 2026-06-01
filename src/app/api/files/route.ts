import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { ownerName } from "@/lib/auth";
import {
  createFileUpload,
  sendFileBytes,
  createFilePage,
  type FileMeta,
} from "@/lib/notion";
import { MAX_UPLOAD_BYTES, guessMime, type FileVisibility } from "@/lib/constants";

export const runtime = "nodejs";

async function authed(): Promise<boolean> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, process.env.SESSION_SECRET || "dev-insecure-secret-change-me");
}

export async function POST(request: NextRequest) {
  if (!(await authed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `파일이 너무 큽니다(최대 ${MAX_UPLOAD_BYTES / 1024 / 1024}MB).` },
      { status: 413 }
    );
  }

  const str = (k: string) => String(form.get(k) ?? "").trim();
  const vis = (str("visibility") || "private") as FileVisibility;
  const meta: FileMeta = {
    title: str("title") || file.name,
    subject: str("subject"),
    grade: str("grade"),
    year: str("year"),
    semester: str("semester"),
    examType: str("examType"),
    tags: str("tags").split(",").map((t) => t.trim()).filter(Boolean),
    description: str("description"),
    visibility: ["private", "all", "specific"].includes(vis) ? vis : "private",
  };

  try {
    const contentType = file.type || guessMime(file.name);
    const uploadId = await createFileUpload(file.name, contentType);
    await sendFileBytes(uploadId, file, file.name);
    const pageId = await createFilePage(meta, uploadId, file.name, ownerName());
    return NextResponse.json({ id: pageId });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
