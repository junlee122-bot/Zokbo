"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { UploadIcon, InboxIcon, LockIcon } from "@/components/icons";

const LINKS = [
  { href: "/dashboard", label: "자료 목록", icon: InboxIcon, exact: true },
  { href: "/dashboard/upload", label: "업로드", icon: UploadIcon, exact: false },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-black text-white shadow-sm">
              Z
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">Zokbo</span>
          </Link>

          <nav className="flex items-center gap-1">
            {LINKS.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon width={17} height={17} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <form action={logout}>
          <button type="submit" className="btn-ghost px-3 py-1.5 text-sm">
            <LockIcon width={16} height={16} />
            <span className="hidden sm:inline">잠그기</span>
          </button>
        </form>
      </div>
    </header>
  );
}
