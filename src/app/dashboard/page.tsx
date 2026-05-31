import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { queryFiles, type FileFilters } from "@/lib/files";
import { FilterBar } from "@/components/FilterBar";
import { FileCard } from "@/components/FileCard";

export const dynamic = "force-dynamic";

export default async function MyFilesPage({
  searchParams,
}: {
  searchParams: FileFilters;
}) {
  const profile = await requireProfile();
  const files = await queryFiles("mine", profile.id, searchParams);
  const canUpload = profile.role === "admin" || profile.role === "uploader";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">내 파일</h1>
          <p className="text-sm text-slate-500">내가 올린 자료 — 총 {files.length}개</p>
        </div>
        {canUpload && (
          <Link href="/dashboard/upload" className="btn-primary">+ 업로드</Link>
        )}
      </div>

      <FilterBar />

      {files.length === 0 ? (
        <EmptyState canUpload={canUpload} />
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

function EmptyState({ canUpload }: { canUpload: boolean }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-12 text-center">
      <p className="text-slate-500">아직 올린 파일이 없습니다.</p>
      {canUpload && (
        <Link href="/dashboard/upload" className="btn-primary">첫 파일 업로드하기</Link>
      )}
    </div>
  );
}
