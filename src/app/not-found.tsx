import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-black text-brand-200">404</p>
      <h1 className="text-lg font-bold text-slate-800">페이지를 찾을 수 없어요</h1>
      <p className="text-sm text-slate-500">삭제되었거나 접근 권한이 없는 자료일 수 있습니다.</p>
      <Link href="/dashboard" className="btn-primary mt-2">목록으로 돌아가기</Link>
    </main>
  );
}
