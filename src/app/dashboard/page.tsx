import Link from "next/link";
import { queryFiles, type FileFilters, type ExamFile } from "@/lib/notion";
import { FilterBar } from "@/components/FilterBar";
import { FileCard } from "@/components/FileCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: FileFilters;
}) {
  let files: ExamFile[];
  let error: string | null = null;
  try {
    files = await queryFiles(searchParams);
  } catch (e) {
    error = (e as Error).message;
    files = [];
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">자료 목록</h1>
          <p className="text-sm text-slate-500">총 {files.length}개</p>
        </div>
        <Link href="/dashboard/upload" className="btn-primary">+ 업로드</Link>
      </div>

      <FilterBar />

      {error ? (
        <div className="card p-6 text-sm text-red-600">
          <p className="font-medium">Notion 연결에 문제가 있습니다.</p>
          <p className="mt-1 text-slate-600">{error}</p>
          <p className="mt-2 text-xs text-slate-400">
            NOTION_TOKEN / NOTION_FILES_DB_ID 환경변수와, DB를 integration에 공유했는지 확인하세요.
          </p>
        </div>
      ) : files.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <p className="text-slate-500">아직 올린 자료가 없습니다.</p>
          <Link href="/dashboard/upload" className="btn-primary">첫 자료 업로드하기</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((f) => (
            <FileCard key={f.id} file={f} />
          ))}
        </div>
      )}
    </div>
  );
}
