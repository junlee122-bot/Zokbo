import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { queryFiles, type FileFilters } from "@/lib/files";
import { FilterBar } from "@/components/FilterBar";
import { FileCard } from "@/components/FileCard";

export const dynamic = "force-dynamic";

export default async function SharedFilesPage({
  searchParams,
}: {
  searchParams: FileFilters;
}) {
  const profile = await requireProfile();
  const files = await queryFiles("shared", profile.id, searchParams);

  // 올린이 표시용 프로필 라벨 매핑
  const supabase = createClient();
  const ownerIds = Array.from(new Set(files.map((f) => f.owner_id)));
  const labels = new Map<string, string>();
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ownerIds);
    owners?.forEach((o) => labels.set(o.id, o.full_name || o.email));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">나에게 공유된 파일</h1>
        <p className="text-sm text-slate-500">
          다른 멤버가 공유한 자료 — 총 {files.length}개
        </p>
      </div>

      <FilterBar />

      {files.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          공유받은 파일이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((f) => (
            <FileCard key={f.id} file={f} ownerLabel={labels.get(f.owner_id)} />
          ))}
        </div>
      )}
    </div>
  );
}
