"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import api from "@/lib/api";
import type { FinishedGood } from "@/types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { canCreateFinishedGood, canEditFinishedGood } from "@/lib/permissions";

interface GoodForm {
  name: string;
  sku: string;
  size?: string;
  quantity_produced?: number;
  quantity_sold?: number;
  current_quantity?: number;
  production_date?: string;
}

export default function FinishedGoodsPage() {
  const qc = useQueryClient();
  const { role } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinishedGood | null>(null);

  const { data: goods = [], isLoading } = useQuery<FinishedGood[]>({
    queryKey: ["finished-goods"],
    queryFn: async () => (await api.get("/finished-goods")).data,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<GoodForm>();

  const createMutation = useMutation({
    mutationFn: (data: GoodForm) => api.post("/finished-goods", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finished-goods"] }); toast.success("Finished good added"); setOpen(false); reset(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GoodForm> }) => api.patch(`/finished-goods/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finished-goods"] }); toast.success("Updated"); setOpen(false); setEditing(null); reset(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed"),
  });

  const openCreate = () => { setEditing(null); reset({}); setOpen(true); };
  const openEdit = (g: FinishedGood) => {
    setEditing(g);
    reset({ name: g.name, sku: g.sku, size: g.size ?? "", quantity_produced: g.quantity_produced, quantity_sold: g.quantity_sold, current_quantity: g.current_quantity });
    setOpen(true);
  };

  const onSubmit = (data: GoodForm) => {
    if (editing) updateMutation.mutate({ id: editing.finished_id, data });
    else createMutation.mutate(data);
  };

  const columns = useMemo<ColumnDef<FinishedGood>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.sku}</span>,
    },
    {
      accessorKey: "size",
      header: "Size",
      cell: ({ row }) => row.original.size ?? "—",
    },
    {
      accessorKey: "quantity_produced",
      header: "Produced",
      cell: ({ row }) => <span className="text-right block">{row.original.quantity_produced}</span>,
    },
    {
      accessorKey: "quantity_sold",
      header: "Sold",
      cell: ({ row }) => <span className="text-right block">{row.original.quantity_sold}</span>,
    },
    {
      accessorKey: "current_quantity",
      header: "In Stock",
      cell: ({ row }) => <span className="text-right block font-semibold">{row.original.current_quantity}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        canEditFinishedGood(role ?? "") ? (
          <Button size="sm" variant="outline" onClick={() => openEdit(row.original)}>Edit</Button>
        ) : null,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [role]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Finished Goods</h2>
          <p className="text-sm text-muted-foreground mt-1">{goods.length} product type{goods.length !== 1 ? "s" : ""}</p>
        </div>
        {canCreateFinishedGood(role ?? "") && <Button className="w-full sm:w-auto" onClick={openCreate}>Add Finished Good</Button>}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          data={goods}
          searchKey="name"
          searchPlaceholder="Search finished goods…"
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Finished Good" : "Add Finished Good"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input {...register("name", { required: true })} />
              </div>
              <div className="space-y-1">
                <Label>SKU</Label>
                <Input {...register("sku", { required: true })} />
              </div>
              <div className="space-y-1">
                <Label>Size</Label>
                <Input {...register("size")} />
              </div>
              <div className="space-y-1">
                <Label>Qty Produced</Label>
                <Input type="number" {...register("quantity_produced", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label>Qty Sold</Label>
                <Input type="number" {...register("quantity_sold", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label>Current Qty</Label>
                <Input type="number" {...register("current_quantity", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Production Date</Label>
                <Input type="date" {...register("production_date")} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {editing ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
