// 한 곳에서 관리하는 상수 — Notion DB 속성명, 라벨, 제한 등.

/** Notion API 버전 헤더 (파일 업로드 API 지원 버전). */
export const NOTION_VERSION = "2026-03-11";

/**
 * Notion Files 데이터베이스의 "속성 이름".
 * setup-notion 스크립트가 이 이름으로 DB를 만듭니다.
 * 이미 만든 DB가 있다면 이름만 여기에 맞추거나, 이 값을 DB에 맞춰 바꾸세요.
 */
export const PROPS = {
  title: "제목",
  subject: "과목",
  grade: "학년",
  year: "연도",
  semester: "학기",
  examType: "시험종류",
  tags: "태그",
  visibility: "공개범위",
  owner: "소유자",
  description: "설명",
  file: "파일",
} as const;

/** 무료 워크스페이스 권장 상한(경고용). 단일 업로드 하드 상한은 20MB. */
export const FREE_TIER_WARN_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export type FileVisibility = "private" | "all" | "specific";

export const VISIBILITY_LABELS: Record<FileVisibility, string> = {
  private: "비공개",
  all: "전체 공유",
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

/** 확장자로 대략적인 MIME 추정 (Notion이 content_type 검증 시 사용). */
export function guessMime(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    hwp: "application/x-hwp",
    hwpx: "application/haansofthwpx",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
    zip: "application/zip",
  };
  return map[ext] ?? "application/octet-stream";
}
