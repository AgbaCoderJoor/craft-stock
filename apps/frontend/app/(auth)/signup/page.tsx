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

const SignupSchema = z
  .object({
    business_name: z.string().min(2, "Business name must be at least 2 characters"),
    name: z.string().min(1, "Your name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type SignupForm = z.infer<typeof SignupSchema>;

export default function SignupPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({ resolver: zodResolver(SignupSchema) });

  const onSubmit = async (data: SignupForm) => {
    try {
      const res = await api.post("/auth/signup", {
        business_name: data.business_name,
        name: data.name,
        email: data.email,
        password: data.password,
      });
      setSubmittedEmail(data.email);
      setDevLink(res.data.dev_link ?? null);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not create your account — please try again";
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

        {submittedEmail ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              We sent a verification link to <strong>{submittedEmail}</strong>. Click it to activate
              your business, then sign in.
            </p>
            {devLink && (
              <p className="text-xs text-muted-foreground break-all">
                Dev mode:{" "}
                <a href={devLink} className="text-primary underline">
                  open verification link
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
              <h2 className="text-2xl font-bold text-gray-900">Create your business</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Start managing your inventory in minutes.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="business_name" className="text-sm font-medium text-gray-700">
                  Business name
                </Label>
                <Input
                  id="business_name"
                  placeholder="Larah's Crafts"
                  className="h-10 bg-gray-50 border-gray-200 focus:bg-white"
                  {...register("business_name")}
                />
                {errors.business_name && (
                  <p className="text-xs text-destructive">{errors.business_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Your name
                </Label>
                <Input
                  id="name"
                  placeholder="Jane Doe"
                  className="h-10 bg-gray-50 border-gray-200 focus:bg-white"
                  {...register("name")}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

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

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
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
                  Confirm password
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
                {isSubmitting ? "Creating…" : "Create business"}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-6">
              Already have an account?{" "}
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
