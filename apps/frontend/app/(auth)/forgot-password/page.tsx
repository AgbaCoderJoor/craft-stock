"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

const ForgotSchema = z.object({
  email: z.string().email("Invalid email"),
});

type ForgotForm = z.infer<typeof ForgotSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(ForgotSchema) });

  const onSubmit = async (data: ForgotForm) => {
    try {
      const res = await api.post("/auth/forgot-password", data);
      setSent(true);
      setDevLink(res.data.dev_link ?? null);
    } catch {
      toast.error("Something went wrong — please try again");
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

        {sent ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              If that account exists, a password reset link has been sent to its email. The link
              expires in 1 hour.
            </p>
            {devLink && (
              <p className="text-xs text-muted-foreground break-all">
                Dev mode:{" "}
                <a href={devLink} className="text-primary underline">
                  open reset link
                </a>
              </p>
            )}
            <Link href="/login" className="text-sm text-primary font-medium hover:underline block">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Forgot your password?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-10 bg-gray-50 border-gray-200 focus:bg-white"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <Button type="submit" className="w-full h-10 text-sm font-medium" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Send reset link"}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-6">
              Remembered it?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
