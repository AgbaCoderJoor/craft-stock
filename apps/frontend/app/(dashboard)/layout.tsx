import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[hsl(174,10%,96%)]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto max-w-full">{children}</main>
    </div>
  );
}
