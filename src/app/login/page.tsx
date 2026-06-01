import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-xl font-black text-white shadow-lift">
            Z
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Zokbo</h1>
          <p className="mt-1 text-sm text-slate-500">개인 시험지·학습자료 보관소</p>
        </div>

        <div className="card p-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          비밀번호로 보호되는 개인용 아카이브입니다.
        </p>
      </div>
    </main>
  );
}
