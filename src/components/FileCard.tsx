import Link from "next/link";
import type { ExamFile } from "@/lib/notion";
import { VISIBILITY_LABELS } from "@/lib/constants";

const VIS_BADGE: Record<string, string> = {
  private: "bg-slate-100 text-slate-600",
  all: "bg-green-100 text-green-700",
  specific: "bg-amber-100 text-amber-700",
};

export function FileCard({ file }: { file: ExamFile }) {
  return (
    <Link
      href={`/dashboard/files/${file.id}`}
      className="card block p-4 transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 font-semibold text-slate-800">{file.title}</h3>
        <span className={`badge shrink-0 ${VIS_BADGE[file.visibility]}`}>
          {VISIBILITY_LABELS[file.visibility]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-slate-500">
        {file.subject && <Meta>{file.subject}</Meta>}
        {file.grade && <Meta>{file.grade}</Meta>}
        {file.year && <Meta>{file.year}년</Meta>}
        {file.semester && <Meta>{file.semester}</Meta>}
        {file.examType && <Meta>{file.examType}</Meta>}
      </div>

      {file.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {file.tags.map((t) => (
            <span key={t} className="badge bg-brand-50 text-brand-700">#{t}</span>
          ))}
        </div>
      )}

      {file.fileName && (
        <div className="mt-3 truncate text-xs text-slate-400">{file.fileName}</div>
      )}
    </Link>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-slate-100 px-1.5 py-0.5">{children}</span>;
}
