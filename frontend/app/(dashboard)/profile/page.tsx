"use client";

import { useState, useEffect, type FormEvent } from "react";
import { getMe, updateProfile } from "@/lib/api/auth";
import type { User } from "@/types";
import type { Locale } from "@/lib/i18n/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Skeleton } from "@/components/ui/skeleton";

function ProfileSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-6 md:p-10 bg-[#f2ede0] overflow-y-auto min-h-screen animate-fadeIn">
      <div className="max-w-5xl mx-auto space-y-8">
        <Skeleton className="h-9 w-40 mb-8" />

        <div className="bg-[#faf8f5] rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 space-y-6">
          {/* Name Field Skeleton */}
          <div>
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-10 w-full rounded-doodle-input" />
          </div>

          <hr className="border-t-2 border-dashed border-black my-8" />

          {/* Change Password Header & Toggle Button Skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-32 rounded-doodle" />
          </div>

          {/* Save Button Skeleton */}
          <Skeleton className="h-11 w-full rounded-doodle mt-4" />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { t, locale, setLocale } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [pendingLocale, setPendingLocale] = useState<Locale>(locale);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    getMe()
      .then((data) => {
        setUser(data);
        setName(data.name);
      })
      .catch((err) => {
        setError(t.error);
        console.error(err);
      })
      .finally(() => {
        setIsPageLoading(false);
      });
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic Validation
    if (!name.trim()) {
      setError(t.required);
      return;
    }

    if (newPassword || currentPassword || confirmPassword) {
      if (!currentPassword) {
        setError(t.profileCurrentPassword + " " + t.required);
        return;
      }
      if (newPassword.length < 8) {
        setError(t.error);
        return;
      }
      if (newPassword !== confirmPassword) {
        setError(t.error);
        return;
      }
    }

    setIsLoading(true);
    try {
      const updated = await updateProfile({
        name,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      });
      setUser(updated);
      setLocale(pendingLocale);
      setSuccess(t.profileUpdated);
      window.dispatchEvent(new Event("profile-updated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || t.error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isPageLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="flex-1 p-6 md:p-10 bg-[#f2ede0] overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-black mb-8 tracking-wide font-sans">
          {t.profileTitle}
        </h1>

        <div className="bg-[#faf8f5] rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-black mb-1">
                {t.profileDisplayName}
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-doodle-input border-doodle-input bg-paper px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-[#fffdf0] disabled:opacity-50 font-sans"
                disabled={isLoading}
              />
            </div>

            <hr className="border-t-2 border-dashed border-black my-8" />

            {/* Language Preference */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-black">{t.selectLanguage}</label>
              <LanguageSwitcher value={pendingLocale} onChange={setPendingLocale} />
            </div>

            <hr className="border-t-2 border-dashed border-black my-8" />

            {/* Change Password Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-black">{t.profileChangePasswordTitle}</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSection((v) => {
                      if (v) {
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }
                      return !v;
                    });
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-doodle border-2 border-black bg-paper hover:bg-pastel-blue transition-colors shadow-doodle-sm"
                >
                  {showPasswordSection ? t.profileCancelPasswordChange : t.profileChangePasswordToggle}
                </button>
              </div>

              {showPasswordSection && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-bold text-black mb-1">
                      {t.profileCurrentPassword}
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-doodle-input border-doodle-input bg-paper px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-[#fffdf0] disabled:opacity-50 font-sans"
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-bold text-black mb-1">
                      {t.profileNewPassword}
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-doodle-input border-doodle-input bg-paper px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-[#fffdf0] disabled:opacity-50 font-sans"
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-bold text-black mb-1">
                      {t.profileConfirmPassword}
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-doodle-input border-doodle-input bg-paper px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-[#fffdf0] disabled:opacity-50 font-sans"
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Notification */}
            {error && (
              <div className="rounded-doodle bg-pastel-pink border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-3 text-sm font-bold text-black">
                {error}
              </div>
            )}

            {/* Success Notification */}
            {success && (
              <div className="rounded-doodle bg-[#e1f5fe] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-3 text-sm font-bold text-black">
                {success}
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-doodle bg-pastel-blue px-4 py-3 text-base font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:bg-blue-300 hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? t.profileSaving : t.profileSave}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
