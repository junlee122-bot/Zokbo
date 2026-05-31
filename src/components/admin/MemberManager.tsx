"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile, UserRole } from "@/lib/database.types";
import { ROLE_LABELS } from "@/lib/constants";
import { updateMemberRole, deleteMember } from "@/app/dashboard/admin/actions";

export function MemberManager({
  members,
  currentUserId,
}: {
  members: Profile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changeRole(userId: string, role: UserRole) {
    startTransition(async () => {
      const res = await updateMemberRole(userId, role);
      if (!res.ok) alert(`역할 변경 실패: ${res.error}`);
      router.refresh();
    });
  }

  function remove(m: Profile) {
    if (!confirm(`${m.email} 멤버를 삭제할까요? 이 사용자의 파일도 함께 삭제됩니다.`)) return;
    startTransition(async () => {
      const res = await deleteMember(m.id);
      if (!res.ok) alert(`삭제 실패: ${res.error}`);
      router.refresh();
    });
  }

  return (
    <section className="card p-5">
      <h2 className="mb-4 font-semibold">멤버</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2">이름 / 이메일</th>
              <th className="py-2">역할</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const isSelf = m.id === currentUserId;
              return (
                <tr key={m.id} className="border-b border-slate-100">
                  <td className="py-2">
                    <div className="font-medium text-slate-700">
                      {m.full_name || "(이름 없음)"} {isSelf && <span className="text-xs text-brand-600">(나)</span>}
                    </div>
                    <div className="text-xs text-slate-400">{m.email}</div>
                  </td>
                  <td className="py-2">
                    <select
                      className="input w-32"
                      value={m.role}
                      disabled={isSelf || pending}
                      onChange={(e) => changeRole(m.id, e.target.value as UserRole)}
                    >
                      <option value="admin">{ROLE_LABELS.admin}</option>
                      <option value="uploader">{ROLE_LABELS.uploader}</option>
                      <option value="viewer">{ROLE_LABELS.viewer}</option>
                    </select>
                  </td>
                  <td className="py-2 text-right">
                    {!isSelf && (
                      <button
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => remove(m)}
                        disabled={pending}
                      >
                        삭제
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        멤버 완전 삭제(로그인 계정 제거)는 서버에 <code>SUPABASE_SERVICE_ROLE_KEY</code>가 설정되어야 동작합니다.
      </p>
    </section>
  );
}
