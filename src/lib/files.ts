import { createClient } from "@/lib/supabase/server";
import type { FileRow } from "@/lib/database.types";

export interface FileFilters {
  q?: string;
  subject?: string;
  grade?: string;
  year?: string;
  semester?: string;
  exam_type?: string;
}

export type FileScope = "mine" | "shared";

/**
 * RLS 가 이미 "내가 볼 수 있는 파일"만 반환하므로, 여기서는 소유 여부와
 * 메타 필터만 추가로 적용합니다.
 *   - mine   : 내가 올린 파일
 *   - shared : 남이 올렸고 나에게 노출된 파일(전체공유 + 나에게 특정공유)
 */
export async function queryFiles(
  scope: FileScope,
  userId: string,
  filters: FileFilters
): Promise<FileRow[]> {
  const supabase = createClient();
  let query = supabase.from("files").select("*").order("created_at", { ascending: false });

  if (scope === "mine") query = query.eq("owner_id", userId);
  else query = query.neq("owner_id", userId);

  if (filters.subject) query = query.ilike("subject", `%${filters.subject}%`);
  if (filters.grade) query = query.ilike("grade", `%${filters.grade}%`);
  if (filters.semester) query = query.eq("semester", filters.semester);
  if (filters.exam_type) query = query.eq("exam_type", filters.exam_type);
  if (filters.year && /^\d+$/.test(filters.year)) {
    query = query.eq("year", Number(filters.year));
  }

  if (filters.q) {
    const term = filters.q.replace(/[%,]/g, " ").trim();
    if (term) {
      // 제목·과목·설명 부분일치 OR 태그 포함
      query = query.or(
        `title.ilike.%${term}%,subject.ilike.%${term}%,description.ilike.%${term}%,tags.cs.{${term}}`
      );
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
