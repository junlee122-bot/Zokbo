import Link from "next/link";
import { queryFiles, type FileFilters, type ExamFile } from "@/lib/notion";
import { FilterBar } from "@/components/FilterBar";
import { FileCard } from "@/components/FileCard";
import { PlusIcon, InboxIcon, UploadIcon } from "@/components/icons";

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

  const filtered = !!(searchParams.q || searchParams.subject || searchParams.grade || searchParams.year || searchParams.semester || searchParams.exam_type);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">자료 목록</h1>
          <p className="mt-1 text-sm text-slate-500">
            보관 중인 시험지·학습자료 <span className="font-semibold text-slate-700">{files.length}</span>개
          </p>
        </div>
        <Link href="/dashboard/upload" className="btn-primary">
          <PlusIcon width={18} height={18} />
          업로드
        </Link>
      </div>

      <FilterBar />

      {error ? (
        <div className="card border-red-200 bg-red-50/50 p-6 text-sm">
          <p className="font-semibold text-red-700">Notion 연결에 문제가 있습니다.</p>
          <p className="mt-1 text-red-600">{error}</p>
          <p className="mt-2 text-xs text-slate-500">
            NOTION_TOKEN / NOTION_FILES_DB_ID 환경변수와, DB를 integration에 공유했는지 확인하세요.
          </p>
        </div>
      ) : files.length === 0 ? (
        <EmptyState filtered={filtered} />
      ) : (
        <div className="grid grid-cols-1 gap-4 animate-fade-in sm:grid-cols-2 lg:grid-cols-3">
          {files.map((f) => (
            <FileCard key={f.id} file={f} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <InboxIcon width={30} height={30} />
      </div>
      {filtered ? (
        <>
          <p className="text-slate-600">조건에 맞는 자료가 없어요.</p>
          <Link href="/dashboard" className="btn-secondary">필터 초기화</Link>
        </>
      ) : (
        <>
          <div>
            <p className="font-semibold text-slate-700">아직 올린 자료가 없어요</p>
            <p className="mt-1 text-sm text-slate-400">첫 시험지를 올려 보관소를 채워보세요.</p>
          </div>
          <Link href="/dashboard/upload" className="btn-primary">
            <UploadIcon width={18} height={18} />
            첫 자료 업로드
          </Link>
        </>
      )}
    </div>
  );
}
