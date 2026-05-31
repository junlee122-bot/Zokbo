"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { STORAGE_BUCKET, SEMESTERS, EXAM_TYPES, formatBytes } from "@/lib/constants";

/** 파일명에서 스토리지 경로에 안전하지 않은 문자를 정리. */
function sanitize(name: string) {
  return name.replace(/[^\w.\-가-힣ㄱ-ㅎㅏ-ㅣ]/g, "_");
}

export function FileUploader({ userId }: { userId: string }) {
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
  const [tagsInput, setTagsInput] = useState("");
  const [description, setDescription] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick(f: File | null) {
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("파일을 선택하세요.");
      return;
    }
    setBusy(true);

    const supabase = createClient();
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const path = `${userId}/${id}/${sanitize(file.name)}`;

    // 1) Storage 업로드 (비공개 버킷)
    const { error: upErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { contentType: file.type || undefined, upsert: false });

    if (upErr) {
      setError(`업로드 실패: ${upErr.message}`);
      setBusy(false);
      return;
    }

    // 2) 메타정보 DB insert
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const { error: dbErr } = await supabase.from("files").insert({
      id,
      owner_id: userId,
      title: title.trim() || file.name,
      subject: subject.trim() || null,
      grade: grade.trim() || null,
      year: year && /^\d+$/.test(year) ? Number(year) : null,
      semester: semester || null,
      exam_type: examType || null,
      description: description.trim() || null,
      tags,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
      visibility: "private",
    });

    if (dbErr) {
      // 롤백: 올린 객체 제거
      await supabase.storage.from(STORAGE_BUCKET).remove([path]);
      setError(`저장 실패: ${dbErr.message}`);
      setBusy(false);
      return;
    }

    router.push(`/dashboard/files/${id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
      </div>

      <div>
        <label className="label">태그 (쉼표로 구분)</label>
        <input className="input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="미적분, 내신, 어려움" />
      </div>

      <div>
        <label className="label">설명</label>
        <textarea className="input min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "업로드 중…" : "업로드"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()} disabled={busy}>
          취소
        </button>
      </div>
    </form>
  );
}
