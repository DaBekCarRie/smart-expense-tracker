"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api/auth";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email.trim()) {
      setError(t.required);
      setIsLoading(false);
      return;
    }

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.error;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
      <div className="w-full max-w-md">
        <div className="bg-paper rounded-doodle shadow-doodle border-doodle p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-black tracking-wide">
              {t.forgotPasswordTitle}
            </h1>
          </div>

          {success ? (
            <div className="space-y-6 text-center">
              <div className="rounded-doodle bg-[#e1f5fe] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-4 text-sm font-bold text-black text-left">
                <p className="font-bold mb-2">{t.success}</p>
                <p className="text-xs text-gray-700">{t.forgotPasswordSuccess}</p>
              </div>
              <Link
                href="/login"
                className="inline-block rounded-doodle bg-pastel-blue px-6 py-2.5 text-base font-bold text-black shadow-doodle border-doodle hover:bg-blue-300 hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all"
              >
                {t.forgotPasswordBackToLogin}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-black mb-1">
                  {t.forgotPasswordEmail}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-doodle-input border-doodle-input bg-paper px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-[#fffdf0] disabled:opacity-50 font-sans"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="rounded-doodle bg-pastel-pink border-doodle shadow-doodle-sm px-4 py-3 text-sm font-bold text-black">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-doodle bg-pastel-blue px-4 py-2.5 text-base font-bold text-black shadow-doodle border-doodle hover:bg-blue-300 hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? t.loading : t.forgotPasswordSubmit}
              </button>

              <div className="text-center mt-4">
                <Link
                  href="/login"
                  className="text-sm font-bold text-gray-600 hover:text-black hover:underline decoration-2"
                >
                  {t.forgotPasswordBackToLogin}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
