import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string; error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand-600">Zokbo</h1>
          <p className="mt-2 text-sm text-slate-500">
            초대받은 멤버 전용 시험지 자료 보관소
          </p>
        </div>

        <div className="card p-6">
          <LoginForm redirectTo={searchParams.redirectTo} />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          초대받은 이메일이 있나요?{" "}
          <Link href="/signup" className="font-medium text-brand-600 hover:underline">
            가입하기
          </Link>
        </p>
      </div>
    </main>
  );
}
