import Link from "next/link";
import type { ExamFile } from "@/lib/notion";
import { VISIBILITY_LABELS } from "@/lib/constants";
import { FileTypeBadge, LockIcon, GlobeIcon, UsersIcon } from "@/components/icons";

const VIS_META: Record<string, { cls: string; Icon: typeof LockIcon }> = {
  private: { cls: "bg-slate-100 text-slate-500", Icon: LockIcon },
  all: { cls: "bg-emerald-50 text-emerald-600", Icon: GlobeIcon },
  specific: { cls: "bg-amber-50 text-amber-600", Icon: UsersIcon },
};

export function FileCard({ file }: { file: ExamFile }) {
  const vis = VIS_META[file.visibility];
  return (
    <Link
      href={`/dashboard/files/${file.id}`}
      className="group card flex flex-col p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
    >
      <div className="flex items-start gap-3">
        <FileTypeBadge mime={file.mime} fileName={file.fileName} />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold leading-snug text-slate-800 group-hover:text-brand-700">
            {file.title}
          </h3>
          {file.fileName && (
            <p className="mt-0.5 truncate text-xs text-slate-400">{file.fileName}</p>
          )}
        </div>
        <span className={`badge shrink-0 ${vis.cls}`}>
          <vis.Icon width={12} height={12} />
          {VISIBILITY_LABELS[file.visibility]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {file.subject && <Meta>{file.subject}</Meta>}
        {file.grade && <Meta>{file.grade}</Meta>}
        {file.year && <Meta>{file.year}년</Meta>}
        {file.semester && <Meta>{file.semester}</Meta>}
        {file.examType && <Meta>{file.examType}</Meta>}
      </div>

      {file.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {file.tags.slice(0, 4).map((t) => (
            <span key={t} className="text-xs font-medium text-brand-500">
              #{t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return <span className="chip">{children}</span>;
}
