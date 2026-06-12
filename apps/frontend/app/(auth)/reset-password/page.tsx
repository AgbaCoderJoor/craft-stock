"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

const ResetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ResetForm = z.infer<typeof ResetSchema>;

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({ resolver: zodResolver(ResetSchema) });

  const onSubmit = async (data: ResetForm) => {
    try {
      await api.post("/auth/reset-password", { token, password: data.password });
      setDone(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not reset your password — please try again";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[hsl(174,10%,96%)]">
      <div className="w-full max-w-sm bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-lg">CraftStock</span>
        </div>

        {done ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Password updated</h2>
            <p className="text-sm text-muted-foreground">
              Your password has been changed. You can now sign in with it.
            </p>
            <Link href="/login" className="text-sm text-primary font-medium hover:underline block">
              Go to sign in
            </Link>
          </div>
        ) : !token ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Invalid link</h2>
            <p className="text-sm text-muted-foreground">
              This link is missing its reset token. Request a new one below.
            </p>
            <Link href="/forgot-password" className="text-sm text-primary font-medium hover:underline block">
              Request a new link
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Choose a new password</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter and confirm your new password.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  New password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="h-10 bg-gray-50 border-gray-200 focus:bg-white"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm_password" className="text-sm font-medium text-gray-700">
                  Confirm new password
                </Label>
                <Input
                  id="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="h-10 bg-gray-50 border-gray-200 focus:bg-white"
                  {...register("confirm_password")}
                />
                {errors.confirm_password && (
                  <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-10 text-sm font-medium" disabled={isSubmitting}>
                {isSubmitting ? "Updating…" : "Update password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
