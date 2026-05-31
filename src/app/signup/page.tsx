import Link from "next/link";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand-600">Zokbo</h1>
          <p className="mt-2 text-sm text-slate-500">
            관리자에게 <b>초대받은 이메일</b>로만 가입할 수 있습니다.
          </p>
        </div>

        <div className="card p-6">
          <SignupForm />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
