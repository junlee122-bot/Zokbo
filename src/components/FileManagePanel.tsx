"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FileRow, FileVisibility } from "@/lib/database.types";
import { setVisibility, updateFileMeta, deleteFile } from "@/app/dashboard/actions";
import { SEMESTERS, EXAM_TYPES } from "@/lib/constants";

type Member = { id: string; label: string };

export function FileManagePanel({
  file,
  members,
  initialSharedWith,
}: {
  file: FileRow;
  members: Member[];
  initialSharedWith: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // ---- 공유 설정 상태 ----
  const [visibility, setVis] = useState<FileVisibility>(file.visibility);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSharedWith));
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function saveShare() {
    setShareMsg(null);
    startTransition(async () => {
      const res = await setVisibility(file.id, visibility, Array.from(selected));
      setShareMsg(res.ok ? "공유 설정을 저장했습니다." : `오류: ${res.error}`);
      router.refresh();
    });
  }

  // ---- 메타 수정 상태 ----
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: file.title,
    subject: file.subject ?? "",
    grade: file.grade ?? "",
    year: file.year ? String(file.year) : "",
    semester: file.semester ?? "",
    exam_type: file.exam_type ?? "",
    tags: file.tags.join(", "),
    description: file.description ?? "",
  });

  function saveMeta() {
    startTransition(async () => {
      const res = await updateFileMeta(file.id, form);
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        alert(`수정 실패: ${res.error}`);
      }
    });
  }

  function remove() {
    if (!confirm("이 파일을 삭제할까요? 되돌릴 수 없습니다.")) return;
    startTransition(async () => {
      const res = await deleteFile(file.id);
      if (res.ok) router.push("/dashboard");
      else alert(`삭제 실패: ${res.error}`);
    });
  }

  return (
    <div className="card space-y-5 p-5">
      <h2 className="font-semibold">관리</h2>

      {/* 공유 설정 */}
      <div>
        <label className="label">공개 범위</label>
        <div className="space-y-2">
          {(["private", "all", "specific"] as FileVisibility[]).map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="visibility"
                checked={visibility === v}
                onChange={() => setVis(v)}
              />
              {v === "private" && "비공개 (나와 관리자만)"}
              {v === "all" && "전체 멤버에게 공유"}
              {v === "specific" && "특정 멤버에게만 공유"}
            </label>
          ))}
        </div>

        {visibility === "specific" && (
          <div className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {members.length === 0 && (
              <p className="p-2 text-xs text-slate-400">공유할 다른 멤버가 없습니다.</p>
            )}
            {members.map((m) => (
              <label key={m.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selected.has(m.id)}
                  onChange={() => toggle(m.id)}
                />
                <span className="truncate">{m.label}</span>
              </label>
            ))}
          </div>
        )}

        <button className="btn-primary mt-3 w-full" onClick={saveShare} disabled={pending}>
          공유 설정 저장
        </button>
        {shareMsg && <p className="mt-2 text-xs text-slate-500">{shareMsg}</p>}
      </div>

      <hr className="border-slate-100" />

      {/* 메타 수정 */}
      {editing ? (
        <div className="space-y-3">
          <Field label="제목">
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="과목">
              <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </Field>
            <Field label="학년">
              <input className="input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
            </Field>
            <Field label="연도">
              <input className="input" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            </Field>
            <Field label="학기">
              <select className="input" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                <option value="">선택</option>
                {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="시험종류">
              <select className="input" value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })}>
                <option value="">선택</option>
                {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="태그 (쉼표 구분)">
            <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </Field>
          <Field label="설명">
            <textarea className="input min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={saveMeta} disabled={pending}>저장</button>
            <button className="btn-secondary flex-1" onClick={() => setEditing(false)} disabled={pending}>취소</button>
          </div>
        </div>
      ) : (
        <button className="btn-secondary w-full" onClick={() => setEditing(true)}>
          분류 정보 수정
        </button>
      )}

      <hr className="border-slate-100" />

      <button className="btn-danger w-full" onClick={remove} disabled={pending}>
        파일 삭제
      </button>
    </div>
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
