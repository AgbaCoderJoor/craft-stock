"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import api from "@/lib/api";

interface UserRecord {
  user_id: number;
  name: string;
  email: string;
  role: { role_name: string };
  created_at: string;
}

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role_name: "admin" | "store_manager" | "production_staff" | "viewer";
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  store_manager: "Store Manager",
  production_staff: "Production Staff",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  store_manager: "bg-blue-100 text-blue-800",
  production_staff: "bg-green-100 text-green-800",
  viewer: "bg-gray-100 text-gray-800",
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, setValue, reset, formState: { isSubmitting } } = useForm<RegisterForm>();

  const { data: users = [], isLoading } = useQuery<UserRecord[]>({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/auth/users")).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: RegisterForm) => api.post("/auth/register", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User created"); setOpen(false); reset(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create user"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User removed"); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to remove user"),
  });

  const columns = useMemo<ColumnDef<UserRecord>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
    },
    {
      id: "role",
      header: "Role",
      accessorFn: (row) => row.role.role_name,
      cell: ({ row }) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${ROLE_COLORS[row.original.role.role_name] ?? "bg-gray-100 text-gray-800"}`}>
          {ROLE_LABELS[row.original.role.role_name] ?? row.original.role.role_name}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(row.original.user_id)}>
          Remove
        </Button>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Users</h2>
          <p className="text-sm text-muted-foreground mt-1">Admin-only — manage who has access to CraftStock.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => { reset(); setShowPassword(false); setOpen(true); }}>Add User</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          searchKey="name"
          searchPlaceholder="Search users…"
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input {...register("name", { required: true })} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" {...register("email", { required: true })} placeholder="jane@example.com" />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  {...register("password", { required: true, minLength: 8 })}
                  placeholder="Min 8 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="relative flex items-center justify-center w-4 h-4">
                    <Eye
                      className={`absolute transition-all duration-200 w-4 h-4 ${
                        showPassword ? "opacity-100 scale-100" : "opacity-0 scale-75"
                      }`}
                    />
                    <EyeOff
                      className={`absolute transition-all duration-200 w-4 h-4 ${
                        showPassword ? "opacity-0 scale-75" : "opacity-100 scale-100"
                      }`}
                    />
                  </span>
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select onValueChange={(v) => setValue("role_name", v as RegisterForm["role_name"])}>
                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — Full access</SelectItem>
                  <SelectItem value="store_manager">Store Manager — Materials, movements, goods</SelectItem>
                  <SelectItem value="production_staff">Production Staff — Create movements, view materials</SelectItem>
                  <SelectItem value="viewer">Viewer — Read-only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create User"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
