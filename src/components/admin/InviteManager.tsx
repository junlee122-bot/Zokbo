"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Invite, UserRole } from "@/lib/database.types";
import { ROLE_LABELS } from "@/lib/constants";
import { createInvite, deleteInvite } from "@/app/dashboard/admin/actions";

export function InviteManager({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("uploader");
  const [error, setError] = useState<string | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createInvite(email, role);
      if (res.ok) {
        setEmail("");
        router.refresh();
      } else {
        setError(res.error ?? "초대 실패");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteInvite(id);
      router.refresh();
    });
  }

  return (
    <section className="card p-5">
      <h2 className="mb-1 font-semibold">초대</h2>
      <p className="mb-4 text-sm text-slate-500">
        등록한 이메일만 가입할 수 있습니다. (공개 가입 차단)
      </p>

      <form onSubmit={add} className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          className="input flex-1"
          type="email"
          placeholder="invite@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <select className="input sm:w-40" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          <option value="uploader">업로더</option>
          <option value="viewer">열람자</option>
          <option value="admin">관리자</option>
        </select>
        <button className="btn-primary sm:w-32" disabled={pending}>초대 등록</button>
      </form>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2">이메일</th>
              <th className="py-2">역할</th>
              <th className="py-2">상태</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {invites.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-slate-400">등록된 초대가 없습니다.</td></tr>
            )}
            {invites.map((inv) => (
              <tr key={inv.id} className="border-b border-slate-100">
                <td className="py-2">{inv.email}</td>
                <td className="py-2">{ROLE_LABELS[inv.role]}</td>
                <td className="py-2">
                  {inv.accepted_at ? (
                    <span className="badge bg-green-100 text-green-700">가입완료</span>
                  ) : (
                    <span className="badge bg-amber-100 text-amber-700">대기중</span>
                  )}
                </td>
                <td className="py-2 text-right">
                  <button
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => remove(inv.id)}
                    disabled={pending}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
