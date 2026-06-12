"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This link is missing its verification token.");
      return;
    }
    api
      .post("/auth/verify-email", { token })
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message ?? "Email verified — you can now sign in");
      })
      .catch((err: unknown) => {
        setStatus("error");
        setMessage(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "This link is invalid or has expired"
        );
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[hsl(174,10%,96%)]">
      <div className="w-full max-w-sm bg-white rounded-lg border border-gray-200 p-8 text-center space-y-4">
        <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center mx-auto">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {status === "verifying" && "Verifying…"}
          {status === "success" && "You're all set!"}
          {status === "error" && "Verification failed"}
        </h2>
        <p className="text-sm text-muted-foreground">{message}</p>
        {status !== "verifying" && (
          <Link href="/login" className="text-sm text-primary font-medium hover:underline block">
            Go to sign in
          </Link>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
