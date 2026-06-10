"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import api from "@/lib/api";
import type { AuditLog } from "@/types";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-yellow-100 text-yellow-800",
  DELETE: "bg-red-100 text-red-800",
  APPROVE: "bg-blue-100 text-blue-800",
  CONFIRM: "bg-purple-100 text-purple-800",
  LOGOUT: "bg-gray-100 text-gray-700",
};

export default function AuditLogsPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => (await api.get("/audit-logs?limit=200")).data,
  });

  const logs: AuditLog[] = response?.logs ?? [];

  const columns = useMemo<ColumnDef<AuditLog>[]>(() => [
    {
      accessorKey: "created_at",
      header: "Time",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      id: "user",
      header: "User",
      accessorFn: (row) => row.user.name,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.user.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.user.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${ACTION_COLORS[row.original.action] ?? "bg-gray-100 text-gray-800"}`}>
          {row.original.action}
        </span>
      ),
    },
    {
      accessorKey: "table_name",
      header: "Table",
      cell: ({ row }) => <Badge variant="outline">{row.original.table_name}</Badge>,
    },
    {
      accessorKey: "record_id",
      header: "Record ID",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-right block">{row.original.record_id}</span>
      ),
    },
  ], []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Audit Logs</h2>
        <p className="text-sm text-muted-foreground mt-1">Read-only record of all system mutations.</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          searchKey="action"
          searchPlaceholder="Filter by action…"
          pageSize={20}
          dateKey="created_at"
        />
      )}
    </div>
  );
}
