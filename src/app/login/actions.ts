"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  timingSafeEqual,
} from "@/lib/session";

function secret(): string {
  return process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
}

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.APP_PASSWORD || "";

  if (!expected) {
    return { error: "서버에 APP_PASSWORD 가 설정되지 않았습니다. .env.local 을 확인하세요." };
  }
  if (!timingSafeEqual(password, expected)) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }

  const token = await createSessionToken(secret());
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}
