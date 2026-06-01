"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login, type LoginState } from "./actions";
import { LockIcon } from "@/components/icons";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          확인 중…
        </>
      ) : (
        "입장"
      )}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="password">비밀번호</label>
        <div className="relative">
          <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width={18} height={18} />
          <input
            id="password"
            name="password"
            type="password"
            className="input pl-10"
            required
            autoComplete="current-password"
            autoFocus
            placeholder="••••••••"
          />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <SubmitButton />
    </form>
  );
}
