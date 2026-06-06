"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
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
            <h1 className="text-3xl font-bold text-black tracking-wide">{t.loginTitle}</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-black mb-1">
                {t.loginEmail}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-doodle border-doodle bg-paper px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-paper disabled:opacity-50 font-sans"
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-bold text-black">
                  {t.loginPassword}
                </label>
                <Link href="/forgot-password" className="text-xs font-bold text-gray-600 hover:text-black hover:underline decoration-2">
                  {t.loginForgotPassword}
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-doodle border-doodle bg-paper px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-paper disabled:opacity-50 font-sans"
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
              {isLoading ? t.loading : t.loginSubmit}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 font-bold">
            {t.loginNoAccount}{" "}
            <Link href="/register" className="font-bold text-black hover:underline decoration-2">
              {t.loginRegister}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
