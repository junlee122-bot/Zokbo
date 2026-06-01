"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ExamFile } from "@/lib/notion";
import { useToast } from "@/components/Toast";
import { updateFileAction, deleteFileAction, type MetaInput } from "@/app/dashboard/actions";
import { SEMESTERS, EXAM_TYPES, VISIBILITY_LABELS, type FileVisibility } from "@/lib/constants";
import { EditIcon, TrashIcon, LockIcon, GlobeIcon, UsersIcon } from "@/components/icons";

const VIS_ICON = { private: LockIcon, all: GlobeIcon, specific: UsersIcon };

export function FileManagePanel({ file }: { file: ExamFile }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

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
    startTransition(async () => {
      const res = await updateFileAction(file.id, form);
      if (res.ok) {
        setEditing(false);
        toast("수정했습니다.", "success");
        router.refresh();
      } else toast(`수정 실패: ${res.error}`, "error");
    });
  }

  function changeVisibility(v: FileVisibility) {
    const next = { ...form, visibility: v };
    setForm(next);
    startTransition(async () => {
      const res = await updateFileAction(file.id, next);
      if (res.ok) {
        toast(`공개범위를 '${VISIBILITY_LABELS[v]}'로 변경했습니다.`, "success");
        router.refresh();
      } else toast(`오류: ${res.error}`, "error");
    });
  }

  function remove() {
    if (!confirm("이 자료를 삭제할까요? (Notion 휴지통으로 이동됩니다)")) return;
    startTransition(async () => {
      const res = await deleteFileAction(file.id);
      if (res.ok) {
        toast("삭제했습니다.", "success");
        router.push("/dashboard");
      } else toast(`삭제 실패: ${res.error}`, "error");
    });
  }

  return (
    <div className="card space-y-6 p-5">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">관리</h2>

      {/* 공개범위 세그먼트 */}
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">공개범위</p>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100/80 p-1">
          {(Object.keys(VISIBILITY_LABELS) as FileVisibility[]).map((v) => {
            const Icon = VIS_ICON[v];
            const active = form.visibility === v;
            return (
              <button
                key={v}
                onClick={() => !active && changeVisibility(v)}
                disabled={pending}
                className={`flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium transition-all ${
                  active ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon width={16} height={16} />
                {VISIBILITY_LABELS[v]}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          지금은 개인용이라 표시만 됩니다. 나중에 멤버를 추가하면 이 값으로 공유가 적용됩니다.
        </p>
      </div>

      {/* 수정 / 삭제 */}
      {editing ? (
        <div className="space-y-3 border-t border-slate-100 pt-5">
          <Field label="제목"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="과목"><input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
            <Field label="학년"><input className="input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} /></Field>
            <Field label="연도"><input className="input" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></Field>
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
          <Field label="태그 (쉼표 구분)"><input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Field>
          <Field label="설명"><textarea className="input min-h-[64px] resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={save} disabled={pending}>저장</button>
            <button className="btn-secondary flex-1" onClick={() => setEditing(false)} disabled={pending}>취소</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 border-t border-slate-100 pt-5">
          <button className="btn-secondary flex-1" onClick={() => setEditing(true)}>
            <EditIcon width={17} height={17} /> 수정
          </button>
          <button className="btn-soft-danger" onClick={remove} disabled={pending} aria-label="자료 삭제">
            <TrashIcon width={17} height={17} /> 삭제
          </button>
        </div>
      )}
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
