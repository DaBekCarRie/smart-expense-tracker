"use client";

import { useState, useEffect, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/api/auth";
import { useTranslation } from "@/lib/i18n/LanguageContext";

function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) setError(t.error);
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!token) { setError(t.error); setIsLoading(false); return; }
    if (newPassword.length < 8) { setError(t.error); setIsLoading(false); return; }
    if (newPassword !== confirmPassword) { setError(t.error); setIsLoading(false); return; }

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || t.error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-paper rounded-doodle shadow-doodle border-doodle p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-black tracking-wide">{t.resetPasswordTitle}</h1>
      </div>

      {success ? (
        <div className="space-y-4 text-center">
          <div className="rounded-doodle bg-[#e1f5fe] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-4 text-sm font-bold text-black text-left">
            <p className="font-bold">{t.success}</p>
            <p className="text-xs text-gray-700 mt-1">{t.resetPasswordSuccess}</p>
          </div>
          <Link
            href="/login"
            className="inline-block rounded-doodle bg-pastel-blue px-6 py-2 text-base font-bold text-black shadow-doodle border-doodle hover:bg-blue-300 transition-all"
          >
            {t.loginSubmit}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-bold text-black mb-1">
              {t.resetPasswordNewPassword}
            </label>
            <input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-doodle-input border-doodle-input bg-paper px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-[#fffdf0] disabled:opacity-50 font-sans"
              disabled={isLoading || !token}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-bold text-black mb-1">
              {t.resetPasswordConfirmPassword}
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-doodle-input border-doodle-input bg-paper px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-[#fffdf0] disabled:opacity-50 font-sans"
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
            {isLoading ? t.loading : t.resetPasswordSubmit}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="bg-paper rounded-doodle shadow-doodle border-doodle p-8 text-center">
            <p className="font-bold">{t.loading}</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
