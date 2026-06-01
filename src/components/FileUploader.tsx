"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  SEMESTERS,
  EXAM_TYPES,
  VISIBILITY_LABELS,
  FREE_TIER_WARN_BYTES,
  MAX_UPLOAD_BYTES,
  formatBytes,
  type FileVisibility,
} from "@/lib/constants";

export function FileUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [examType, setExamType] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<FileVisibility>("private");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooBig = file && file.size > MAX_UPLOAD_BYTES;
  const overFree = file && file.size > FREE_TIER_WARN_BYTES && !tooBig;

  function pick(f: File | null) {
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) return setError("파일을 선택하세요.");
    if (tooBig) return setError(`파일이 너무 큽니다(최대 ${MAX_UPLOAD_BYTES / 1024 / 1024}MB).`);

    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title);
    fd.append("subject", subject);
    fd.append("grade", grade);
    fd.append("year", year);
    fd.append("semester", semester);
    fd.append("examType", examType);
    fd.append("tags", tags);
    fd.append("description", description);
    fd.append("visibility", visibility);

    try {
      const res = await fetch("/api/files", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "업로드 실패");
      router.push(`/dashboard/files/${json.id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={`card flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-10 text-center ${
          dragOver ? "border-brand-500 bg-brand-50" : "border-slate-300"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.hwp,.hwpx,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,image/*,application/pdf"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <p className="font-medium text-slate-700">{file.name}</p>
            <p className="text-sm text-slate-400">{formatBytes(file.size)}</p>
            <span className="text-xs text-brand-600">다른 파일로 바꾸려면 클릭</span>
          </>
        ) : (
          <>
            <p className="font-medium text-slate-600">파일을 끌어다 놓거나 클릭해 선택</p>
            <p className="text-xs text-slate-400">PDF · 이미지 · 한글/워드 등</p>
          </>
        )}
      </div>

      {overFree && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          ⚠️ 5MB를 넘습니다. Notion <b>무료 워크스페이스</b>는 파일당 5MB까지만 허용해 업로드가 거부될 수 있어요.
          (유료 플랜이면 무시하세요.)
        </p>
      )}
      {tooBig && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          이 파일은 {MAX_UPLOAD_BYTES / 1024 / 1024}MB를 넘어 업로드할 수 없습니다.
        </p>
      )}

      <div>
        <label className="label">제목 *</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <label className="label">과목</label>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="수학" />
        </div>
        <div>
          <label className="label">학년</label>
          <input className="input" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="고2" />
        </div>
        <div>
          <label className="label">연도</label>
          <input className="input" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2025" />
        </div>
        <div>
          <label className="label">학기</label>
          <select className="input" value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">선택</option>
            {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">시험종류</label>
          <select className="input" value={examType} onChange={(e) => setExamType(e.target.value)}>
            <option value="">선택</option>
            {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">공개범위</label>
          <select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value as FileVisibility)}>
            {(Object.keys(VISIBILITY_LABELS) as FileVisibility[]).map((v) => (
              <option key={v} value={v}>{VISIBILITY_LABELS[v]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">태그 (쉼표로 구분)</label>
        <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="미적분, 내신, 어려움" />
      </div>

      <div>
        <label className="label">설명</label>
        <textarea className="input min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={busy || !!tooBig}>
          {busy ? "업로드 중…" : "업로드"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()} disabled={busy}>
          취소
        </button>
      </div>
    </form>
  );
}
