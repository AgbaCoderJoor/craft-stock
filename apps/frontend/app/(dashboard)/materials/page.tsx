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
import { DataTable } from "@/components/ui/data-table";
import api from "@/lib/api";
import type { Material } from "@/types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { canCreateMaterial, canEditMaterial, canDeleteMaterial, canInputCostPrice } from "@/lib/permissions";

interface MaterialForm {
  name: string;
  category: string;
  supplier?: string;
  cost_price: number;
  quantity_available: number;
  minimum_stock: number;
  batch_number?: string;
}

export default function MaterialsPage() {
  const qc = useQueryClient();
  const { role } = useCurrentUser();
  const showCost = canInputCostPrice(role ?? "");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["materials"],
    queryFn: async () => (await api.get("/materials")).data,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<MaterialForm>();

  const createMutation = useMutation({
    mutationFn: (data: MaterialForm) => api.post("/materials", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["materials"] }); toast.success("Material created"); setOpen(false); reset(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MaterialForm> }) => api.patch(`/materials/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["materials"] }); toast.success("Material updated"); setOpen(false); setEditing(null); reset(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/materials/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["materials"] }); toast.success("Material deleted"); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to delete"),
  });

  const openCreate = () => { setEditing(null); reset({}); setOpen(true); };
  const openEdit = (m: Material) => {
    setEditing(m);
    reset({ name: m.name, category: m.category, supplier: m.supplier ?? "", cost_price: Number(m.cost_price), quantity_available: Number(m.quantity_available), minimum_stock: Number(m.minimum_stock), batch_number: m.batch_number ?? "" });
    setOpen(true);
  };

  const onSubmit = (data: MaterialForm) => {
    if (editing) updateMutation.mutate({ id: editing.material_id, data });
    else createMutation.mutate(data);
  };

  const columns = useMemo<ColumnDef<Material>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    { accessorKey: "category", header: "Category" },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.supplier ?? "—"}</span>,
    },
    ...(showCost ? [{
      accessorKey: "cost_price",
      header: "Cost",
      cell: ({ row }: { row: { original: Material } }) => (
        <span className="text-right block">₦{Number(row.original.cost_price).toLocaleString()}</span>
      ),
    } satisfies ColumnDef<Material>] : []),
    {
      accessorKey: "quantity_available",
      header: "Qty",
      cell: ({ row }) => <span className="text-right block">{row.original.quantity_available}</span>,
    },
    {
      accessorKey: "minimum_stock",
      header: "Min",
      cell: ({ row }) => <span className="text-right block">{row.original.minimum_stock}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const isLow = Number(row.original.quantity_available) <= Number(row.original.minimum_stock);
        return <Badge variant={isLow ? "destructive" : "secondary"}>{isLow ? "Low" : "OK"}</Badge>;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          {canEditMaterial(role ?? "") && (
            <Button size="sm" variant="outline" onClick={() => openEdit(row.original)}>Edit</Button>
          )}
          {canDeleteMaterial(role ?? "") && (
            <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(row.original.material_id)}>Delete</Button>
          )}
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [role, showCost]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Materials</h2>
          <p className="text-sm text-muted-foreground mt-1">{materials.length} material{materials.length !== 1 ? "s" : ""} in inventory</p>
        </div>
        {canCreateMaterial(role ?? "") && <Button className="w-full sm:w-auto" onClick={openCreate}>Add Material</Button>}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          data={materials}
          searchKey="name"
          searchPlaceholder="Search materials…"
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Material" : "Add Material"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input {...register("name", { required: true })} />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Input {...register("category", { required: true })} />
              </div>
              <div className="space-y-1">
                <Label>Supplier</Label>
                <Input {...register("supplier")} />
              </div>
              {showCost && (
                <div className="space-y-1">
                  <Label>Cost Price</Label>
                  <Input type="number" step="0.01" {...register("cost_price", { valueAsNumber: true, required: showCost })} />
                </div>
              )}
              <div className="space-y-1">
                <Label>Qty Available</Label>
                <Input type="number" step="0.01" {...register("quantity_available", { valueAsNumber: true, required: true })} />
              </div>
              <div className="space-y-1">
                <Label>Min Stock</Label>
                <Input type="number" step="0.01" {...register("minimum_stock", { valueAsNumber: true, required: true })} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Batch Number</Label>
                <Input {...register("batch_number")} />
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
