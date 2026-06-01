import Link from "next/link";
import { notFound } from "next/navigation";
import { getFile } from "@/lib/notion";
import { VISIBILITY_LABELS, isPreviewable } from "@/lib/constants";
import { FileViewer } from "@/components/FileViewer";
import { FileManagePanel } from "@/components/FileManagePanel";

export const dynamic = "force-dynamic";

export default async function FileDetailPage({ params }: { params: { id: string } }) {
  const file = await getFile(params.id);
  if (!file) notFound();

  return (
    <div>
      <Link href="/dashboard" className="mb-4 inline-block text-sm text-slate-500 hover:underline">
        ← 목록으로
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
              previewable={isPreviewable(file.mime)}
              hasFile={!!file.fileName}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold">분류 정보</h2>
            <dl className="space-y-2 text-sm">
              <Row label="과목" value={file.subject} />
              <Row label="학년" value={file.grade} />
              <Row label="연도" value={file.year ? `${file.year}년` : null} />
              <Row label="학기" value={file.semester} />
              <Row label="시험종류" value={file.examType} />
              <Row label="파일명" value={file.fileName} />
              <Row label="등록일" value={new Date(file.createdAt).toLocaleString("ko-KR")} />
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

          <FileManagePanel file={file} />
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
