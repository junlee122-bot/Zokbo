"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { FileTypeBadge, UploadIcon, XIcon } from "@/components/icons";
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
  const toast = useToast();
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

  const tooBig = file && file.size > MAX_UPLOAD_BYTES;
  const overFree = file && file.size > FREE_TIER_WARN_BYTES && !tooBig;

  function pick(f: File | null) {
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast("파일을 먼저 선택하세요.", "error");
    if (tooBig) return toast(`파일이 너무 큽니다(최대 ${MAX_UPLOAD_BYTES / 1024 / 1024}MB).`, "error");

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
      toast("업로드 완료!", "success");
      router.push(`/dashboard/files/${json.id}`);
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* 드롭존 */}
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
      >
        {file ? (
          <div className="card flex items-center gap-4 p-4">
            <FileTypeBadge mime={file.type || null} fileName={file.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-800">{file.name}</p>
              <p className="text-sm text-slate-400">{formatBytes(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="btn-ghost h-9 w-9 p-0"
              aria-label="파일 제거"
            >
              <XIcon width={18} height={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
              dragOver ? "border-brand-400 bg-brand-50" : "border-slate-300 bg-white hover:border-brand-300 hover:bg-slate-50"
            }`}
          >
            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${dragOver ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-400"}`}>
              <UploadIcon width={26} height={26} />
            </span>
            <span className="font-semibold text-slate-700">파일을 끌어다 놓거나 클릭해 선택</span>
            <span className="text-xs text-slate-400">PDF · 이미지 · 한글 · 워드 · PPT · 엑셀 등</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.hwp,.hwpx,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,image/*,application/pdf"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </div>

      {overFree && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
          <span>⚠️</span>
          <p>5MB를 넘습니다. Notion <b>무료 워크스페이스</b>는 파일당 5MB까지만 허용해 업로드가 거부될 수 있어요. (유료 플랜이면 무시)</p>
        </div>
      )}
      {tooBig && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          이 파일은 {MAX_UPLOAD_BYTES / 1024 / 1024}MB를 넘어 업로드할 수 없습니다.
        </div>
      )}

      {/* 메타 */}
      <div className="card space-y-5 p-5">
        <div>
          <label className="label">제목 *</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="자료 제목" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="과목"><input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="수학" /></Field>
          <Field label="학년"><input className="input" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="고2" /></Field>
          <Field label="연도"><input className="input" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2025" /></Field>
          <Field label="학기">
            <select className="input" value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="">선택</option>
              {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="시험종류">
            <select className="input" value={examType} onChange={(e) => setExamType(e.target.value)}>
              <option value="">선택</option>
              {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="공개범위">
            <select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value as FileVisibility)}>
              {(Object.keys(VISIBILITY_LABELS) as FileVisibility[]).map((v) => (
                <option key={v} value={v}>{VISIBILITY_LABELS[v]}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="태그 (쉼표로 구분)">
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="미적분, 내신, 어려움" />
        </Field>
        <Field label="설명">
          <textarea className="input min-h-[84px] resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="메모 (선택)" />
        </Field>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1" disabled={busy || !!tooBig}>
          {busy ? (
            <>
              <Spinner /> 업로드 중…
            </>
          ) : (
            <>
              <UploadIcon width={18} height={18} /> 업로드
            </>
          )}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()} disabled={busy}>
          취소
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}
