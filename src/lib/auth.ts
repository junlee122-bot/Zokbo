import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";

/**
 * 현재 로그인 사용자의 프로필을 반환. 없으면 로그인으로 리다이렉트.
 * 서버 컴포넌트/액션에서 사용.
 */
export async function requireProfile(): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // auth 사용자는 있으나 profile 이 없는 경우(트리거 실패 등) → 로그아웃 유도
  if (!profile) redirect("/login?error=no-profile");

  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard?error=forbidden");
  return profile;
}
