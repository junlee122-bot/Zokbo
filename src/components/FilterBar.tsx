"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SEMESTERS, EXAM_TYPES } from "@/lib/constants";
import { SearchIcon, FilterIcon, XIcon, ChevronDown } from "@/components/icons";

const META_KEYS = ["subject", "grade", "year", "semester", "exam_type"] as const;
const META_LABEL: Record<string, string> = {
  subject: "과목",
  grade: "학년",
  year: "연도",
  semester: "학기",
  exam_type: "시험종류",
};

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const activeMeta = META_KEYS.filter((k) => params.get(k));
  const [open, setOpen] = useState(activeMeta.length > 0);

  useEffect(() => {
    const t = setTimeout(() => update("q", q, true), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function update(key: string, value: string, replace = false) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const url = `${pathname}?${next.toString()}`;
    replace ? router.replace(url) : router.push(url);
  }

  function clearAll() {
    setQ("");
    router.push(pathname);
  }

  const hasAny = !!params.get("q") || activeMeta.length > 0;

  return (
    <div className="mb-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width={18} height={18} />
          <input
            className="input pl-10"
            placeholder="제목 · 과목 · 키워드 · 태그 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="검색어 지우기"
            >
              <XIcon width={16} height={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`btn-secondary shrink-0 ${open ? "border-brand-300 bg-brand-50 text-brand-700" : ""}`}
        >
          <FilterIcon width={18} height={18} />
          <span className="hidden sm:inline">필터</span>
          {activeMeta.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
              {activeMeta.length}
            </span>
          )}
          <ChevronDown width={15} height={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="mt-2 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft animate-fade-in sm:grid-cols-3 lg:grid-cols-5">
          <Text k="subject" placeholder="예: 수학" params={params} onCommit={update} />
          <Text k="grade" placeholder="예: 고2" params={params} onCommit={update} />
          <Text k="year" placeholder="2025" type="number" params={params} onCommit={update} />
          <Select k="semester" options={SEMESTERS} params={params} onCommit={update} />
          <Select k="exam_type" options={EXAM_TYPES} params={params} onCommit={update} />
        </div>
      )}

      {hasAny && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {params.get("q") && (
            <Tag onRemove={() => setQ("")}>검색: {params.get("q")}</Tag>
          )}
          {activeMeta.map((k) => (
            <Tag key={k} onRemove={() => update(k, "")}>
              {META_LABEL[k]}: {params.get(k)}
            </Tag>
          ))}
          <button onClick={clearAll} className="text-xs font-medium text-slate-400 hover:text-slate-600">
            전체 초기화
          </button>
        </div>
      )}
    </div>
  );
}

function Text({
  k,
  placeholder,
  type = "text",
  params,
  onCommit,
}: {
  k: string;
  placeholder: string;
  type?: string;
  params: URLSearchParams;
  onCommit: (k: string, v: string) => void;
}) {
  return (
    <div>
      <label className="label">{META_LABEL[k]}</label>
      <input
        className="input"
        type={type}
        placeholder={placeholder}
        defaultValue={params.get(k) ?? ""}
        onBlur={(e) => onCommit(k, e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onCommit(k, (e.target as HTMLInputElement).value)}
      />
    </div>
  );
}

function Select({
  k,
  options,
  params,
  onCommit,
}: {
  k: string;
  options: readonly string[];
  params: URLSearchParams;
  onCommit: (k: string, v: string) => void;
}) {
  return (
    <div>
      <label className="label">{META_LABEL[k]}</label>
      <select className="input" defaultValue={params.get(k) ?? ""} onChange={(e) => onCommit(k, e.target.value)}>
        <option value="">전체</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function Tag({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
      {children}
      <button onClick={onRemove} className="text-brand-400 hover:text-brand-700" aria-label="제거">
        <XIcon width={13} height={13} />
      </button>
    </span>
  );
}
