import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ProtectedArea } from "@/components/auth/ProtectedArea";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedArea><div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <main className="flex-1">

        <Topbar />

        <div className="p-4 md:p-8">
          {children}
        </div>

      </main>

    </div></ProtectedArea>
  );
}
