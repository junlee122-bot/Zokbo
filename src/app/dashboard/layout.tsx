import { Nav } from "@/components/Nav";
import { ToastProvider } from "@/components/Toast";
import { requireSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  return (
    <ToastProvider>
      <div className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
