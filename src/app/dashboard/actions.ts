"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/constants";
import type { FileVisibility } from "@/lib/database.types";

interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * 파일 공개 범위 설정.
 *   - 'specific' 이면 sharedWith 목록으로 file_shares 를 재구성.
 *   - 그 외(all/private)면 기존 공유 레코드 제거.
 * RLS 가 소유자/관리자만 수정 가능하도록 강제하므로 여기선 호출만.
 */
export async function setVisibility(
  fileId: string,
  visibility: FileVisibility,
  sharedWith: string[] = []
): Promise<ActionResult> {
  const supabase = createClient();

  const { error: updErr } = await supabase
    .from("files")
    .update({ visibility })
    .eq("id", fileId);
  if (updErr) return { ok: false, error: updErr.message };

  // 기존 공유 비우기
  const { error: delErr } = await supabase
    .from("file_shares")
    .delete()
    .eq("file_id", fileId);
  if (delErr) return { ok: false, error: delErr.message };

  if (visibility === "specific" && sharedWith.length > 0) {
    const rows = sharedWith.map((uid) => ({ file_id: fileId, shared_with: uid }));
    const { error: insErr } = await supabase.from("file_shares").insert(rows);
    if (insErr) return { ok: false, error: insErr.message };
  }

  revalidatePath(`/dashboard/files/${fileId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/** 메타정보 수정 (소유자/관리자만 — RLS 강제). */
export async function updateFileMeta(
  fileId: string,
  meta: {
    title: string;
    subject: string;
    grade: string;
    year: string;
    semester: string;
    exam_type: string;
    tags: string;
    description: string;
  }
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("files")
    .update({
      title: meta.title.trim(),
      subject: meta.subject.trim() || null,
      grade: meta.grade.trim() || null,
      year: meta.year && /^\d+$/.test(meta.year) ? Number(meta.year) : null,
      semester: meta.semester || null,
      exam_type: meta.exam_type || null,
      tags: meta.tags.split(",").map((t) => t.trim()).filter(Boolean),
      description: meta.description.trim() || null,
    })
    .eq("id", fileId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/files/${fileId}`);
  return { ok: true };
}

/** 파일 삭제: Storage 객체 + DB 행. */
export async function deleteFile(fileId: string): Promise<ActionResult> {
  const supabase = createClient();

  const { data: file } = await supabase
    .from("files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (!file) return { ok: false, error: "파일을 찾을 수 없거나 권한이 없습니다." };

  // Storage 먼저 제거 (실패해도 DB 행은 지움 — 고아 객체는 관리자가 정리)
  await supabase.storage.from(STORAGE_BUCKET).remove([file.storage_path]);

  const { error } = await supabase.from("files").delete().eq("id", fileId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}
