"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ExamFile } from "@/lib/notion";
import { updateFileAction, deleteFileAction, type MetaInput } from "@/app/dashboard/actions";
import { SEMESTERS, EXAM_TYPES, VISIBILITY_LABELS, type FileVisibility } from "@/lib/constants";

export function FileManagePanel({ file }: { file: ExamFile }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState<MetaInput>({
    title: file.title,
    subject: file.subject,
    grade: file.grade,
    year: file.year ? String(file.year) : "",
    semester: file.semester,
    examType: file.examType,
    tags: file.tags.join(", "),
    description: file.description,
    visibility: file.visibility,
  });

  function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await updateFileAction(file.id, form);
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setMsg(`수정 실패: ${res.error}`);
      }
    });
  }

  function changeVisibility(v: FileVisibility) {
    const next = { ...form, visibility: v };
    setForm(next);
    startTransition(async () => {
      const res = await updateFileAction(file.id, next);
      setMsg(res.ok ? "공개범위를 변경했습니다." : `오류: ${res.error}`);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm("이 자료를 삭제할까요? (Notion에서 보관 처리됩니다)")) return;
    startTransition(async () => {
      const res = await deleteFileAction(file.id);
      if (res.ok) router.push("/dashboard");
      else setMsg(`삭제 실패: ${res.error}`);
    });
  }

  return (
    <div className="card space-y-5 p-5">
      <h2 className="font-semibold">관리</h2>

      <div>
        <label className="label">공개범위</label>
        <div className="space-y-2">
          {(Object.keys(VISIBILITY_LABELS) as FileVisibility[]).map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="visibility"
                checked={form.visibility === v}
                onChange={() => changeVisibility(v)}
                disabled={pending}
              />
              {VISIBILITY_LABELS[v]}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          지금은 개인용이라 표시만 됩니다. 나중에 멤버를 추가하면 이 값으로 공유가 적용됩니다.
        </p>
      </div>

      <hr className="border-slate-100" />

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
              <select className="input" value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}>
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
            <button className="btn-primary flex-1" onClick={save} disabled={pending}>저장</button>
            <button className="btn-secondary flex-1" onClick={() => setEditing(false)} disabled={pending}>취소</button>
          </div>
        </div>
      ) : (
        <button className="btn-secondary w-full" onClick={() => setEditing(true)}>분류 정보 수정</button>
      )}

      {msg && <p className="text-xs text-slate-500">{msg}</p>}

      <hr className="border-slate-100" />

      <button className="btn-danger w-full" onClick={remove} disabled={pending}>자료 삭제</button>
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
