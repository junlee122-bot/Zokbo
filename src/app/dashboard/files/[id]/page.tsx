import Link from "next/link";
import { notFound } from "next/navigation";
import { getFile } from "@/lib/notion";
import { VISIBILITY_LABELS, isPreviewable } from "@/lib/constants";
import { FileViewer } from "@/components/FileViewer";
import { FileManagePanel } from "@/components/FileManagePanel";
import { ArrowLeft, FileTypeBadge, LockIcon, GlobeIcon, UsersIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const VIS_META: Record<string, { cls: string; Icon: typeof LockIcon }> = {
  private: { cls: "bg-slate-100 text-slate-500", Icon: LockIcon },
  all: { cls: "bg-emerald-50 text-emerald-600", Icon: GlobeIcon },
  specific: { cls: "bg-amber-50 text-amber-600", Icon: UsersIcon },
};

export default async function FileDetailPage({ params }: { params: { id: string } }) {
  const file = await getFile(params.id);
  if (!file) notFound();

  const vis = VIS_META[file.visibility];

  return (
    <div>
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800">
        <ArrowLeft width={16} height={16} /> 목록으로
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card p-5">
            <div className="mb-4 flex items-start gap-3">
              <FileTypeBadge mime={file.mime} fileName={file.fileName} size="lg" />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-extrabold leading-tight text-slate-900">{file.title}</h1>
                {file.fileName && <p className="mt-1 truncate text-sm text-slate-400">{file.fileName}</p>}
              </div>
              <span className={`badge shrink-0 ${vis.cls}`}>
                <vis.Icon width={12} height={12} />
                {VISIBILITY_LABELS[file.visibility]}
              </span>
            </div>
            <FileViewer
              fileId={file.id}
              previewable={isPreviewable(file.mime)}
              hasFile={!!file.fileName}
              mime={file.mime}
              fileName={file.fileName}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">분류 정보</h2>
            <dl className="space-y-2.5 text-sm">
              <Row label="과목" value={file.subject} />
              <Row label="학년" value={file.grade} />
              <Row label="연도" value={file.year ? `${file.year}년` : null} />
              <Row label="학기" value={file.semester} />
              <Row label="시험종류" value={file.examType} />
              <Row label="등록일" value={new Date(file.createdAt).toLocaleDateString("ko-KR")} />
            </dl>

            {file.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {file.tags.map((t) => (
                  <span key={t} className="badge bg-brand-50 text-brand-700">#{t}</span>
                ))}
              </div>
            )}

            {file.description && (
              <p className="mt-4 whitespace-pre-wrap border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600">
                {file.description}
              </p>
            )}
          </div>

          <FileManagePanel file={file} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-700">{value}</dd>
    </div>
  );
}
