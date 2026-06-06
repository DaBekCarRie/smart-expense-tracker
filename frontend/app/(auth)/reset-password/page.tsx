"use client";

import { useState, useEffect, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/api/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Reset token is missing from URL.");
    }
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!token) {
      setError("Reset token is missing. Cannot reset password.");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Failed to reset password. Token may have expired.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-doodle shadow-doodle border-doodle p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-black tracking-wide">
          New Password
        </h1>
        <p className="mt-1 text-sm text-gray-600 font-bold">
          Enter your new security credentials
        </p>
      </div>

      {success ? (
        <div className="space-y-4 text-center">
          <div className="rounded-doodle bg-[#e1f5fe] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-4 text-sm font-bold text-black text-left">
            <p className="font-bold">Password Reset Successful!</p>
            <p className="text-xs text-gray-700 mt-1">
              Your password has been updated. Redirecting to login in 3 seconds...
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block rounded-doodle bg-pastel-blue px-6 py-2 text-base font-bold text-black shadow-doodle border-doodle hover:bg-blue-300 transition-all"
          >
            Go to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-bold text-black mb-1"
            >
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-doodle-input border-doodle-input bg-white px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-[#fffdf0] disabled:opacity-50 font-sans"
              disabled={isLoading || !token}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-bold text-black mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-doodle-input border-doodle-input bg-white px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-[#fffdf0] disabled:opacity-50 font-sans"
              disabled={isLoading || !token}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded-doodle bg-pastel-pink border-doodle shadow-doodle-sm px-4 py-3 text-sm font-bold text-black">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full rounded-doodle bg-pastel-blue px-4 py-2.5 text-base font-bold text-black shadow-doodle border-doodle hover:bg-blue-300 hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? "Saving password…" : "Reset Password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="bg-white rounded-doodle shadow-doodle border-doodle p-8 text-center">
            <p className="font-bold">Loading reset parameters...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
