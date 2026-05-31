import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * 서버 컴포넌트 / 라우트 핸들러 / 서버 액션용 Supabase 클라이언트.
 * 쿠키에 담긴 세션을 읽어 인증 컨텍스트(auth.uid())를 유지합니다.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서 호출되면 set 이 막힐 수 있음.
            // 세션 갱신은 미들웨어가 담당하므로 무시해도 안전.
          }
        },
      },
    }
  );
}

/**
 * 서비스 롤 클라이언트 — RLS 를 우회합니다.
 * 관리자 전용 admin API(초대 메일 발송, 사용자 삭제 등) 에만 사용하세요.
 * 절대 클라이언트로 노출 금지.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
