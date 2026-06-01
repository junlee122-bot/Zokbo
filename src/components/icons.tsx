import type { SVGProps } from "react";

type Icon = (p: SVGProps<SVGSVGElement>) => JSX.Element;

const base = (children: React.ReactNode): Icon =>
  function I(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        width={20}
        height={20}
        {...props}
      >
        {children}
      </svg>
    );
  };

export const SearchIcon = base(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </>
);
export const UploadIcon = base(
  <>
    <path d="M12 16V4m0 0 4 4m-4-4L8 8" />
    <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
  </>
);
export const DownloadIcon = base(
  <>
    <path d="M12 4v12m0 0 4-4m-4 4-4-4" />
    <path d="M5 18v0a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v0" />
  </>
);
export const TrashIcon = base(
  <>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
  </>
);
export const EditIcon = base(
  <>
    <path d="M4 20h4L18 10l-4-4L4 16v4Z" />
    <path d="m13 7 4 4" />
  </>
);
export const PlusIcon = base(<path d="M12 5v14M5 12h14" />);
export const XIcon = base(<path d="M6 6l12 12M18 6 6 18" />);
export const CheckIcon = base(<path d="M5 12.5 10 17l9-10" />);
export const LockIcon = base(
  <>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </>
);
export const FilterIcon = base(<path d="M4 6h16M7 12h10M10 18h4" />);
export const ChevronDown = base(<path d="m6 9 6 6 6-6" />);
export const ArrowLeft = base(<path d="M19 12H5m0 0 6-6m-6 6 6 6" />);
export const GlobeIcon = base(
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M4 12h16M12 4c2.5 2.5 2.5 13 0 16M12 4c-2.5 2.5-2.5 13 0 16" />
  </>
);
export const UsersIcon = base(
  <>
    <circle cx="9" cy="9" r="3" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M16 6.5a3 3 0 0 1 0 5.5M20.5 19a5.5 5.5 0 0 0-4-5.3" />
  </>
);
export const SparkIcon = base(
  <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3L12 3Z" />
);
export const InboxIcon = base(
  <>
    <path d="M4 13h4l1.5 3h5L16 13h4" />
    <path d="M5 13 7 5h10l2 8v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4Z" />
  </>
);

/** 파일 형식별 색/라벨 + 문서 아이콘. */
export function fileKind(mime: string | null, fileName: string | null) {
  const ext = (fileName?.split(".").pop() || "").toLowerCase();
  const is = (m: string) => mime?.includes(m);
  if (is("pdf") || ext === "pdf") return { label: "PDF", cls: "bg-red-50 text-red-600 ring-red-100" };
  if (mime?.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(ext))
    return { label: "IMG", cls: "bg-emerald-50 text-emerald-600 ring-emerald-100" };
  if (["doc", "docx"].includes(ext) || is("word"))
    return { label: "DOC", cls: "bg-blue-50 text-blue-600 ring-blue-100" };
  if (["xls", "xlsx"].includes(ext) || is("sheet") || is("excel"))
    return { label: "XLS", cls: "bg-green-50 text-green-700 ring-green-100" };
  if (["ppt", "pptx"].includes(ext) || is("presentation"))
    return { label: "PPT", cls: "bg-orange-50 text-orange-600 ring-orange-100" };
  if (["hwp", "hwpx"].includes(ext) || is("hwp"))
    return { label: "HWP", cls: "bg-cyan-50 text-cyan-700 ring-cyan-100" };
  if (["zip", "rar", "7z"].includes(ext)) return { label: "ZIP", cls: "bg-amber-50 text-amber-700 ring-amber-100" };
  return { label: ext ? ext.toUpperCase().slice(0, 4) : "FILE", cls: "bg-slate-100 text-slate-500 ring-slate-200" };
}

/** 큼직한 파일 타입 배지(목록 카드/드롭존용). */
export function FileTypeBadge({
  mime,
  fileName,
  size = "md",
}: {
  mime: string | null;
  fileName: string | null;
  size?: "md" | "lg";
}) {
  const k = fileKind(mime, fileName);
  const dim = size === "lg" ? "h-14 w-12 text-sm" : "h-11 w-9 text-[11px]";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg font-bold ring-1 ${k.cls} ${dim}`}
    >
      {k.label}
    </div>
  );
}
