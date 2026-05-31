"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { SEMESTERS, EXAM_TYPES } from "@/lib/constants";

/** 과목·키워드·태그·메타로 필터링. URL 쿼리스트링을 갱신해 서버 재조회. */
export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");

  // 검색어 디바운스
  useEffect(() => {
    const t = setTimeout(() => {
      update("q", q, true);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function update(key: string, value: string, replace = false) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const url = `${pathname}?${next.toString()}`;
    if (replace) router.replace(url);
    else router.push(url);
  }

  return (
    <div className="card mb-6 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-6">
      <div className="col-span-2 lg:col-span-2">
        <label className="label">검색</label>
        <input
          className="input"
          placeholder="제목·과목·키워드"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div>
        <label className="label">과목</label>
        <input
          className="input"
          placeholder="예: 수학"
          defaultValue={params.get("subject") ?? ""}
          onBlur={(e) => update("subject", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && update("subject", (e.target as HTMLInputElement).value)}
        />
      </div>

      <div>
        <label className="label">학년</label>
        <input
          className="input"
          placeholder="예: 고2"
          defaultValue={params.get("grade") ?? ""}
          onBlur={(e) => update("grade", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && update("grade", (e.target as HTMLInputElement).value)}
        />
      </div>

      <div>
        <label className="label">연도</label>
        <input
          className="input"
          type="number"
          placeholder="2025"
          defaultValue={params.get("year") ?? ""}
          onBlur={(e) => update("year", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && update("year", (e.target as HTMLInputElement).value)}
        />
      </div>

      <div>
        <label className="label">학기</label>
        <select
          className="input"
          defaultValue={params.get("semester") ?? ""}
          onChange={(e) => update("semester", e.target.value)}
        >
          <option value="">전체</option>
          {SEMESTERS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">시험종류</label>
        <select
          className="input"
          defaultValue={params.get("exam_type") ?? ""}
          onChange={(e) => update("exam_type", e.target.value)}
        >
          <option value="">전체</option>
          {EXAM_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
