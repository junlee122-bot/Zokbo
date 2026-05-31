import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET, SIGNED_URL_TTL } from "@/lib/constants";

/**
 * 권한 검증 후 signed URL 발급.
 *   - 파일 메타는 files RLS 로 보호되므로, 행을 읽을 수 있다는 것 자체가
 *     "이 사용자가 접근 가능"하다는 의미.
 *   - ?download=1 이면 다운로드 disposition, 아니면 인라인(미리보기).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // RLS 가 접근 가능한 파일만 반환 → 못 보면 null
  const { data: file } = await supabase
    .from("files")
    .select("storage_path, file_name")
    .eq("id", params.id)
    .single();

  if (!file) {
    return NextResponse.json({ error: "not found or no access" }, { status: 404 });
  }

  const download = request.nextUrl.searchParams.get("download") === "1";

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(file.storage_path, SIGNED_URL_TTL, {
      download: download ? file.file_name : false,
    });

  if (error || !data) {
    return NextResponse.json({ error: "failed to sign url" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
