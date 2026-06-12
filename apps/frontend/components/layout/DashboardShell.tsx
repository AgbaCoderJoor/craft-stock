"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { business } = useCurrentUser();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh bg-[hsl(174,10%,96%)]">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        className={cn(
          "fixed inset-y-0 left-0 z-50 -translate-x-full transition-transform duration-200 ease-in-out",
          "lg:static lg:translate-x-0 lg:transition-none",
          open && "translate-x-0"
        )}
        onClose={() => setOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-[hsl(174,60%,18%)] px-4 py-3 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="rounded-md p-1.5 text-white hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-[10px]">C</span>
            </div>
            <span className="text-white font-bold text-sm">CraftStock</span>
            {business?.name && (
              <span className="text-[hsl(174,30%,70%)] text-xs truncate">· {business.name}</span>
            )}
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
