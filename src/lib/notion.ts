// 주의: 이 모듈은 서버 전용입니다(NOTION_TOKEN 사용). 클라이언트 컴포넌트에서 import 하지 마세요.
import { NOTION_VERSION, PROPS, guessMime, type FileVisibility } from "@/lib/constants";

const API = "https://api.notion.com/v1";

function token(): string {
  const t = process.env.NOTION_TOKEN;
  if (!t) throw new Error("NOTION_TOKEN 환경변수가 설정되지 않았습니다.");
  return t;
}

function dbId(): string {
  const id = process.env.NOTION_FILES_DB_ID;
  if (!id) throw new Error("NOTION_FILES_DB_ID 환경변수가 설정되지 않았습니다.");
  return id;
}

// Notion API 2025-09-03+ 에서는 데이터베이스가 "data source" 를 가지며,
// 쿼리/생성은 data source 기준입니다. DB ID 로부터 한 번 조회해 캐시합니다.
let cachedDataSourceId: string | null = null;
async function dataSourceId(): Promise<string> {
  if (cachedDataSourceId) return cachedDataSourceId;
  const db = await notion<{ data_sources?: { id: string }[] }>(`/databases/${dbId()}`);
  const ds = db.data_sources?.[0]?.id;
  if (!ds) {
    throw new Error("데이터 소스를 찾을 수 없습니다. NOTION_FILES_DB_ID 를 확인하세요.");
  }
  cachedDataSourceId = ds;
  return ds;
}

/** JSON Notion API 호출. */
async function notion<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || `Notion API 오류 (${res.status})`);
  }
  return json as T;
}

// ---------------------------------------------------------------------------
// 정규화된 파일 모델
// ---------------------------------------------------------------------------
export interface ExamFile {
  id: string;
  title: string;
  subject: string;
  grade: string;
  year: number | null;
  semester: string;
  examType: string;
  tags: string[];
  visibility: FileVisibility;
  owner: string;
  description: string;
  fileName: string | null;
  /** 만료형 임시 URL (Notion 발급, 약 1시간). 읽을 때마다 새로 받습니다. */
  fileUrl: string | null;
  mime: string | null;
  createdAt: string;
}

export interface FileMeta {
  title: string;
  subject: string;
  grade: string;
  year: string;
  semester: string;
  examType: string;
  tags: string[];
  description: string;
  visibility: FileVisibility;
}

// ---------------------------------------------------------------------------
// 속성 읽기 헬퍼
// ---------------------------------------------------------------------------
const titleText = (p: any) => (p?.title ?? []).map((t: any) => t.plain_text).join("");
const richText = (p: any) => (p?.rich_text ?? []).map((t: any) => t.plain_text).join("");
const selectName = (p: any) => p?.select?.name ?? "";
const multiNames = (p: any) => (p?.multi_select ?? []).map((s: any) => s.name);

function readFile(p: any): { name: string | null; url: string | null } {
  const item = (p?.files ?? [])[0];
  if (!item) return { name: null, url: null };
  const url = item.type === "file" ? item.file?.url : item.external?.url;
  return { name: item.name ?? null, url: url ?? null };
}

function mapPage(page: any): ExamFile {
  const props = page.properties ?? {};
  const { name: fileName, url: fileUrl } = readFile(props[PROPS.file]);
  const vis = (selectName(props[PROPS.visibility]) || "private") as FileVisibility;
  return {
    id: page.id,
    title: titleText(props[PROPS.title]) || "(제목 없음)",
    subject: richText(props[PROPS.subject]),
    grade: richText(props[PROPS.grade]),
    year: props[PROPS.year]?.number ?? null,
    semester: selectName(props[PROPS.semester]),
    examType: selectName(props[PROPS.examType]),
    tags: multiNames(props[PROPS.tags]),
    visibility: ["private", "all", "specific"].includes(vis) ? vis : "private",
    owner: richText(props[PROPS.owner]),
    description: richText(props[PROPS.description]),
    fileName,
    fileUrl,
    mime: fileName ? guessMime(fileName) : null,
    createdAt: page.created_time,
  };
}

// ---------------------------------------------------------------------------
// 속성 쓰기 헬퍼 (create/update 공용)
// ---------------------------------------------------------------------------
function metaToProperties(meta: FileMeta) {
  const props: Record<string, any> = {
    [PROPS.title]: { title: [{ text: { content: meta.title.slice(0, 2000) } }] },
    [PROPS.subject]: { rich_text: meta.subject ? [{ text: { content: meta.subject } }] : [] },
    [PROPS.grade]: { rich_text: meta.grade ? [{ text: { content: meta.grade } }] : [] },
    [PROPS.year]: { number: meta.year && /^\d+$/.test(meta.year) ? Number(meta.year) : null },
    [PROPS.semester]: { select: meta.semester ? { name: meta.semester } : null },
    [PROPS.examType]: { select: meta.examType ? { name: meta.examType } : null },
    [PROPS.tags]: { multi_select: meta.tags.map((name) => ({ name })) },
    [PROPS.visibility]: { select: { name: meta.visibility } },
    [PROPS.description]: {
      rich_text: meta.description ? [{ text: { content: meta.description.slice(0, 2000) } }] : [],
    },
  };
  return props;
}

// ---------------------------------------------------------------------------
// 공개 함수
// ---------------------------------------------------------------------------
export interface FileFilters {
  q?: string;
  subject?: string;
  grade?: string;
  year?: string;
  semester?: string;
  examType?: string;
}

/** DB 의 모든 파일을 가져와(페이지네이션) 메타 필터를 적용. */
export async function queryFiles(filters: FileFilters = {}): Promise<ExamFile[]> {
  const results: any[] = [];
  let cursor: string | undefined = undefined;
  const dsId = await dataSourceId();

  do {
    const body: any = {
      page_size: 100,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    };
    if (cursor) body.start_cursor = cursor;
    const data = await notion<{ results: any[]; has_more: boolean; next_cursor: string | null }>(
      `/data_sources/${dsId}/query`,
      { method: "POST", body: JSON.stringify(body) }
    );
    results.push(...data.results);
    cursor = data.has_more ? data.next_cursor ?? undefined : undefined;
  } while (cursor);

  let files = results.map(mapPage);

  const norm = (s: string) => s.toLowerCase();
  if (filters.subject) files = files.filter((f) => norm(f.subject).includes(norm(filters.subject!)));
  if (filters.grade) files = files.filter((f) => norm(f.grade).includes(norm(filters.grade!)));
  if (filters.semester) files = files.filter((f) => f.semester === filters.semester);
  if (filters.examType) files = files.filter((f) => f.examType === filters.examType);
  if (filters.year && /^\d+$/.test(filters.year)) {
    files = files.filter((f) => f.year === Number(filters.year));
  }
  if (filters.q) {
    const q = norm(filters.q.trim());
    if (q) {
      files = files.filter(
        (f) =>
          norm(f.title).includes(q) ||
          norm(f.subject).includes(q) ||
          norm(f.description).includes(q) ||
          f.tags.some((t) => norm(t).includes(q))
      );
    }
  }
  return files;
}

/** 단일 파일 조회(없으면 null). fileUrl 은 호출 시점의 신선한 임시 URL. */
export async function getFile(id: string): Promise<ExamFile | null> {
  try {
    const page = await notion(`/pages/${id}`);
    if ((page as any).in_trash || (page as any).archived) return null;
    return mapPage(page);
  } catch {
    return null;
  }
}

/** 메타 + 업로드된 파일을 첨부해 새 페이지 생성. 생성된 page id 반환. */
export async function createFilePage(
  meta: FileMeta,
  fileUploadId: string,
  fileName: string,
  owner: string
): Promise<string> {
  const properties = metaToProperties(meta);
  properties[PROPS.owner] = { rich_text: owner ? [{ text: { content: owner } }] : [] };
  properties[PROPS.file] = {
    files: [{ type: "file_upload", file_upload: { id: fileUploadId }, name: fileName }],
  };
  const page = await notion<{ id: string }>(`/pages`, {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "data_source_id", data_source_id: await dataSourceId() },
      properties,
    }),
  });
  return page.id;
}

/** 메타정보 수정(파일은 그대로). */
export async function updateFileMeta(id: string, meta: FileMeta): Promise<void> {
  await notion(`/pages/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ properties: metaToProperties(meta) }),
  });
}

/** 파일 페이지 삭제(휴지통 이동). */
export async function deleteFilePage(id: string): Promise<void> {
  await notion(`/pages/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ in_trash: true }),
  });
}

// ---------------------------------------------------------------------------
// 파일 업로드 (2단계: 업로드 객체 생성 → 바이트 전송)
// ---------------------------------------------------------------------------
export async function createFileUpload(
  fileName: string,
  contentType: string
): Promise<string> {
  const data = await notion<{ id: string }>(`/file_uploads`, {
    method: "POST",
    body: JSON.stringify({
      mode: "single_part",
      filename: fileName,
      content_type: contentType,
    }),
  });
  return data.id;
}

export async function sendFileBytes(
  uploadId: string,
  bytes: Blob,
  fileName: string
): Promise<void> {
  const form = new FormData();
  form.append("file", bytes, fileName);
  // multipart: Content-Type 헤더를 직접 지정하지 않음(경계 자동 설정).
  const res = await fetch(`${API}/file_uploads/${uploadId}/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Notion-Version": NOTION_VERSION,
    },
    body: form,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as any)?.message || `파일 전송 실패 (${res.status})`);
  }
}
