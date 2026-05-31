import type { UserRole, FileVisibility } from "@/lib/database.types";

export const STORAGE_BUCKET = "exam-files";

/** 다운로드/미리보기 signed URL 유효시간(초). */
export const SIGNED_URL_TTL = 60 * 10; // 10분

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "관리자",
  uploader: "업로더",
  viewer: "열람자",
};

export const VISIBILITY_LABELS: Record<FileVisibility, string> = {
  private: "비공개",
  all: "전체 멤버",
  specific: "특정 멤버",
};

export const SEMESTERS = ["1학기", "2학기", "여름", "겨울"] as const;
export const EXAM_TYPES = ["중간고사", "기말고사", "수행평가", "모의고사", "기타"] as const;

/** 미리보기 가능한 MIME 타입(브라우저 인라인). 그 외는 다운로드만. */
export function isPreviewable(mime: string | null | undefined): boolean {
  if (!mime) return false;
  return mime === "application/pdf" || mime.startsWith("image/");
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes && bytes !== 0) return "-";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
