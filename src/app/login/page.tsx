import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand-600">Zokbo</h1>
          <p className="mt-2 text-sm text-slate-500">개인 시험지·학습자료 보관소</p>
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
