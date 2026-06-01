import Link from "next/link";
import { logout } from "@/app/login/actions";

export function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold text-brand-600">
            Zokbo
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink href="/dashboard">자료 목록</NavLink>
            <NavLink href="/dashboard/upload">업로드</NavLink>
          </nav>
        </div>

        <form action={logout}>
          <button className="btn-secondary" type="submit">잠그기</button>
        </form>
      </div>
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
