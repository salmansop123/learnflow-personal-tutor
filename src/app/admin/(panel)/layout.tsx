import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-panel min-h-screen bg-slate-100 text-slate-900">
      <AdminSidebar adminEmail={session.email} />
      <div className="pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <h1 className="text-sm font-semibold text-slate-900">
            LearnFlow Admin Panel
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-800">
              {session.email}
            </span>
            <span className="rounded bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Admin
            </span>
          </div>
        </header>
        <main className="p-6 text-slate-900">{children}</main>
      </div>
    </div>
  );
}
