import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { VISIBILITY_LABELS, formatBytes, isPreviewable } from "@/lib/constants";
import { FileViewer } from "@/components/FileViewer";
import { FileManagePanel } from "@/components/FileManagePanel";

export const dynamic = "force-dynamic";

export default async function FileDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: file } = await supabase
    .from("files")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!file) notFound();

  const canManage = file.owner_id === profile.id || profile.role === "admin";

  // 올린이 라벨
  const { data: owner } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", file.owner_id)
    .single();

  // 관리 권한자에게만: 멤버 목록 + 현재 공유 대상
  let members: { id: string; label: string }[] = [];
  let sharedWith: string[] = [];
  if (canManage) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .neq("id", file.owner_id);
    members = (profiles ?? []).map((p) => ({
      id: p.id,
      label: p.full_name ? `${p.full_name} (${p.email})` : p.email,
    }));

    const { data: shares } = await supabase
      .from("file_shares")
      .select("shared_with")
      .eq("file_id", file.id);
    sharedWith = (shares ?? []).map((s) => s.shared_with);
  }

  return (
    <div>
      <Link href="/dashboard" className="mb-4 inline-block text-sm text-slate-500 hover:underline">
        ← 목록으로
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 본문: 미리보기 */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold">{file.title}</h1>
              <span className="badge shrink-0 bg-slate-100 text-slate-600">
                {VISIBILITY_LABELS[file.visibility]}
              </span>
            </div>

            <FileViewer
              fileId={file.id}
              previewable={isPreviewable(file.mime_type)}
              mime={file.mime_type}
              fileName={file.file_name}
            />
          </div>
        </div>

        {/* 사이드: 메타 + 관리 */}
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold">분류 정보</h2>
            <dl className="space-y-2 text-sm">
              <Row label="과목" value={file.subject} />
              <Row label="학년" value={file.grade} />
              <Row label="연도" value={file.year ? `${file.year}년` : null} />
              <Row label="학기" value={file.semester} />
              <Row label="시험종류" value={file.exam_type} />
              <Row label="파일명" value={file.file_name} />
              <Row label="크기" value={formatBytes(file.size_bytes)} />
              <Row label="올린이" value={owner?.full_name || owner?.email || "-"} />
              <Row
                label="등록일"
                value={new Date(file.created_at).toLocaleString("ko-KR")}
              />
            </dl>

            {file.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {file.tags.map((t) => (
                  <span key={t} className="badge bg-brand-50 text-brand-700">#{t}</span>
                ))}
              </div>
            )}

            {file.description && (
              <p className="mt-3 whitespace-pre-wrap border-t border-slate-100 pt-3 text-sm text-slate-600">
                {file.description}
              </p>
            )}
          </div>

          {canManage && (
            <FileManagePanel
              file={file}
              members={members}
              initialSharedWith={sharedWith}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-700">{value}</dd>
    </div>
  );
}
