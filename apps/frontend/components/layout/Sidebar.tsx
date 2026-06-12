"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { clearToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { getVisibleNavItems, ROLE_LABELS } from "@/lib/permissions";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function Sidebar({ className, onClose }: { className?: string; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, business } = useCurrentUser();

  const visibleNavItems = getVisibleNavItems(user?.role ?? "");

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // proceed anyway
    } finally {
      qc.clear();
      clearToken();
      router.push("/login");
    }
  };

  return (
    <aside className={cn("w-64 h-dvh overflow-y-auto bg-[hsl(174,60%,18%)] flex flex-col", className)}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm leading-tight">CraftStock</p>
            {business?.name && (
              <p className="text-[hsl(174,30%,70%)] text-[10px] leading-tight truncate">{business.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1.5 text-[hsl(174,20%,75%)] hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-[hsl(174,20%,75%)] hover:bg-white/10 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 pb-4 space-y-2 border-t border-white/10 pt-3">
        {user?.name && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-[hsl(174,20%,65%)]">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-[hsl(174,20%,70%)] hover:text-white hover:bg-white/10 text-sm"
          onClick={handleLogout}
        >
          Log out
        </Button>
      </div>
    </aside>
  );
}
