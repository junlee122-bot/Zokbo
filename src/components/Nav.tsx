import Link from "next/link";
import type { Profile } from "@/lib/database.types";
import { ROLE_LABELS } from "@/lib/constants";

export function Nav({ profile }: { profile: Profile }) {
  const canUpload = profile.role === "admin" || profile.role === "uploader";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold text-brand-600">
            Zokbo
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink href="/dashboard">내 파일</NavLink>
            <NavLink href="/dashboard/shared">공유받은 파일</NavLink>
            {canUpload && <NavLink href="/dashboard/upload">업로드</NavLink>}
            {profile.role === "admin" && <NavLink href="/dashboard/admin">관리</NavLink>}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium text-slate-700">
              {profile.full_name || profile.email}
            </div>
            <div className="text-xs text-slate-400">{ROLE_LABELS[profile.role]}</div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="btn-secondary" type="submit">로그아웃</button>
          </form>
        </div>
      </div>

      {/* 모바일 네비 */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 sm:hidden">
        <NavLink href="/dashboard">내 파일</NavLink>
        <NavLink href="/dashboard/shared">공유받은</NavLink>
        {canUpload && <NavLink href="/dashboard/upload">업로드</NavLink>}
        {profile.role === "admin" && <NavLink href="/dashboard/admin">관리</NavLink>}
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </Link>
  );
}
