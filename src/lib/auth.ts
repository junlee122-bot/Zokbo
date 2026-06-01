import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

function secret(): string {
  return process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
}

/** 로그인 여부 확인(서버). */
export async function isAuthenticated(): Promise<boolean> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, secret());
}

/** 보호 페이지 진입 가드 — 미로그인 시 /login 으로. */
export async function requireSession(): Promise<void> {
  if (!(await isAuthenticated())) redirect("/login");
}

/** 파일 소유자로 기록할 이름(개인 프로젝트 기본값). 추후 멀티유저 시 교체. */
export function ownerName(): string {
  return process.env.OWNER_NAME || "나";
}
