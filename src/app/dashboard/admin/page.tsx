import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InviteManager } from "@/components/admin/InviteManager";
import { MemberManager } from "@/components/admin/MemberManager";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = await requireAdmin();
  const supabase = createClient();

  const [{ data: invites }, { data: members }] = await Promise.all([
    supabase.from("invites").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">관리</h1>
        <p className="text-sm text-slate-500">멤버 초대 및 역할 관리</p>
      </div>

      <InviteManager invites={invites ?? []} />
      <MemberManager members={members ?? []} currentUserId={me.id} />
    </div>
  );
}
