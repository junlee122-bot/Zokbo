"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";

interface ActionResult {
  ok: boolean;
  error?: string;
}

/** 현재 사용자가 관리자인지 확인. 아니면 throw. */
async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") throw new Error("forbidden");
}

/**
 * 이메일 초대 등록.
 *   - invites 테이블에 추가 → 해당 이메일로만 /signup 가입 허용.
 *   - 서비스 롤 키가 있으면 Supabase 초대 메일도 발송(선택).
 */
export async function createInvite(
  email: string,
  role: UserRole
): Promise<ActionResult> {
  await assertAdmin();
  const supabase = createClient();

  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
    return { ok: false, error: "올바른 이메일 형식이 아닙니다." };
  }

  const { error } = await supabase
    .from("invites")
    .upsert({ email: clean, role }, { onConflict: "email" });
  if (error) return { ok: false, error: error.message };

  // (선택) 초대 메일 발송 — 서비스 롤 키가 설정된 경우에만
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.inviteUserByEmail(clean, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback`,
      });
    } catch {
      // 메일 발송 실패는 치명적이지 않음 — invites 등록은 이미 성공.
    }
  }

  revalidatePath("/dashboard/admin");
  return { ok: true };
}

export async function deleteInvite(id: string): Promise<ActionResult> {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("invites").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/admin");
  return { ok: true };
}

/** 멤버 역할 변경. */
export async function updateMemberRole(
  userId: string,
  role: UserRole
): Promise<ActionResult> {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/admin");
  return { ok: true };
}

/**
 * 멤버 삭제. auth 사용자까지 지우려면 서비스 롤 키 필요.
 * (profiles 는 on delete cascade 로 함께 제거됨)
 */
export async function deleteMember(userId: string): Promise<ActionResult> {
  await assertAdmin();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      error: "멤버 완전 삭제에는 SUPABASE_SERVICE_ROLE_KEY 설정이 필요합니다.",
    };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  revalidatePath("/dashboard/admin");
  return { ok: true };
}
