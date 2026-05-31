"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      // 가입 트리거가 초대 없음 예외를 던지면 여기로 들어옴
      const invite = /invite/i.test(error.message);
      setError(
        invite
          ? "초대되지 않은 이메일입니다. 관리자에게 초대를 요청하세요."
          : error.message
      );
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
    } else {
      // 이메일 확인이 켜진 프로젝트의 경우
      setMessage("확인 메일을 보냈습니다. 메일의 링크를 눌러 가입을 완료하세요.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">이름</label>
        <input
          id="name"
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="email">초대받은 이메일</label>
        <input
          id="email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">비밀번호 (6자 이상)</label>
        <input
          id="password"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "가입 중…" : "가입하기"}
      </button>
    </form>
  );
}
