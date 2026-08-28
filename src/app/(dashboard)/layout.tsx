import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { RefreshOnNavigation } from "@/components/layout/RefreshOnNavigation";
import { ProtectedArea } from "@/components/auth/ProtectedArea";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedArea><RefreshOnNavigation /><div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <main className="min-w-0 flex-1 overflow-x-hidden">

        <Topbar />

        <div className="min-w-0 p-4 md:p-8">
          {children}
        </div>

      </main>

    </div></ProtectedArea>
  );
}
