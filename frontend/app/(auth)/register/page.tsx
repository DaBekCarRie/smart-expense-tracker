"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api/auth";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t.error);
      return;
    }
    if (password.length < 8) {
      setError(t.error);
      return;
    }

    setIsLoading(true);
    try {
      await register(email, name, password);
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
            <h1 className="text-3xl font-bold text-black tracking-wide">{t.registerTitle}</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-black mb-1">
                {t.registerName}
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-doodle border-doodle bg-paper px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-paper disabled:opacity-50 font-sans"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-black mb-1">
                {t.registerEmail}
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
              <label htmlFor="password" className="block text-sm font-bold text-black mb-1">
                {t.registerPassword}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-doodle border-doodle bg-paper px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-paper disabled:opacity-50 font-sans"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-black mb-1">
                {t.registerConfirmPassword}
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              className="w-full rounded-doodle bg-pastel-yellow px-4 py-2.5 text-base font-bold text-black shadow-doodle border-doodle hover:bg-yellow-200 hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? t.loading : t.registerSubmit}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 font-bold">
            {t.registerHaveAccount}{" "}
            <Link href="/login" className="font-bold text-black hover:underline decoration-2">
              {t.registerLogin}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
