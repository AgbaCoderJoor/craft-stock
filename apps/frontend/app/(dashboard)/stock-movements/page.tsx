"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import api from "@/lib/api";
import type { StockMovement, Material, FinishedGood, MovementType } from "@/types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { canCreateMovement, canApproveMovementType, canConfirmMovement } from "@/lib/permissions";

interface MovementForm {
  material_id?: number;
  finished_id?: number;
  movement_type: MovementType;
  quantity: number;
  purpose?: string;
}

const BADGE_COLORS: Record<string, string> = {
  IN: "bg-green-100 text-green-800",
  OUT: "bg-red-100 text-red-800",
  ADJUSTMENT: "bg-yellow-100 text-yellow-800",
  PRODUCTION: "bg-blue-100 text-blue-800",
};

export default function StockMovementsPage() {
  const qc = useQueryClient();
  const { role } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, setValue, reset, formState: { isSubmitting } } = useForm<MovementForm>();

  const { data: response, isLoading } = useQuery({
    queryKey: ["stock-movements"],
    queryFn: async () => (await api.get("/stock-movements?limit=200")).data,
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["materials"],
    queryFn: async () => (await api.get("/materials")).data,
  });

  const { data: finishedGoods = [] } = useQuery<FinishedGood[]>({
    queryKey: ["finished-goods"],
    queryFn: async () => (await api.get("/finished-goods")).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: MovementForm) => api.post("/stock-movements", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stock-movements"] }); toast.success("Movement logged"); setOpen(false); reset(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/stock-movements/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stock-movements"] }); toast.success("Approved"); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed"),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/stock-movements/${id}/confirm`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stock-movements"] }); toast.success("Confirmed"); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed"),
  });

  const movements: StockMovement[] = response?.movements ?? [];

  const columns = useMemo<ColumnDef<StockMovement>[]>(() => [
    {
      accessorKey: "movement_date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.movement_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: "movement_type",
      header: "Type",
      cell: ({ row }) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${BADGE_COLORS[row.original.movement_type]}`}>
          {row.original.movement_type}
        </span>
      ),
    },
    {
      id: "item",
      header: "Item",
      cell: ({ row }) => row.original.material?.name ?? row.original.finished?.name ?? "—",
    },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) => <span className="text-right block">{row.original.quantity}</span>,
    },
    {
      accessorKey: "purpose",
      header: "Purpose",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.purpose ?? "—"}</span>,
    },
    {
      id: "issued_by",
      header: "Issued by",
      cell: ({ row }) => row.original.issuer.name,
    },
    {
      id: "approved",
      header: "Approved",
      cell: ({ row }) =>
        row.original.approver?.name ?? <Badge variant="outline" className="text-xs">Pending</Badge>,
    },
    {
      id: "confirmed",
      header: "Confirmed",
      cell: ({ row }) =>
        row.original.confirmer?.name ?? <Badge variant="outline" className="text-xs">Pending</Badge>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const mv = row.original;
        return (
          <div className="flex gap-1">
            {!mv.approved_by && canApproveMovementType(role ?? "", mv.movement_type) && (
              <Button size="sm" variant="outline" onClick={() => approveMutation.mutate(mv.movement_id)}>Approve</Button>
            )}
            {mv.approved_by && !mv.confirmed_by && canConfirmMovement(role ?? "") && (
              <Button size="sm" variant="outline" onClick={() => confirmMutation.mutate(mv.movement_id)}>Confirm</Button>
            )}
          </div>
        );
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [role]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Stock Movements</h2>
          <p className="text-sm text-muted-foreground mt-1">{movements.length} movement{movements.length !== 1 ? "s" : ""} recorded</p>
        </div>
        {canCreateMovement(role ?? "") && (
          <Button onClick={() => { reset(); setOpen(true); }}>Log Movement</Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <DataTable columns={columns} data={movements} pageSize={15} dateKey="movement_date" />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Stock Movement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-3">
            <div className="space-y-1">
              <Label>Movement Type</Label>
              <Select onValueChange={(v) => setValue("movement_type", v as MovementType)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(["IN", "OUT", "ADJUSTMENT", "PRODUCTION"] as MovementType[]).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Material (optional)</Label>
              <Select onValueChange={(v) => setValue("material_id", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                <SelectContent>
                  {materials.map((m) => <SelectItem key={m.material_id} value={String(m.material_id)}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Finished Good (optional)</Label>
              <Select onValueChange={(v) => setValue("finished_id", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select finished good" /></SelectTrigger>
                <SelectContent>
                  {finishedGoods.map((g) => <SelectItem key={g.finished_id} value={String(g.finished_id)}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Quantity</Label>
              <Input type="number" step="0.01" {...register("quantity", { valueAsNumber: true, required: true })} />
            </div>
            <div className="space-y-1">
              <Label>Purpose</Label>
              <Input {...register("purpose")} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>Submit</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
