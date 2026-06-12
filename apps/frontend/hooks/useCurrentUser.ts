"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";
import type { User } from "@/types";

export function useCurrentUser() {
  // localStorage is unavailable during SSR — read the token only after mount
  // so the first client render matches the server HTML (avoids hydration mismatch)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const tokenPayload = mounted ? getUser() : null;

  const query = useQuery<User>({
    queryKey: ["current-user"],
    queryFn: async () => (await api.get<User>("/auth/me")).data,
    initialData: tokenPayload
      ? { user_id: tokenPayload.user_id, name: "", email: tokenPayload.email, role: tokenPayload.role, created_at: "" }
      : undefined,
    staleTime: 1000 * 60 * 5,
    enabled: !!tokenPayload,
  });

  return {
    user: query.data ?? null,
    role: query.data?.role ?? tokenPayload?.role ?? null,
    business: query.data?.business ?? null,
  };
}
