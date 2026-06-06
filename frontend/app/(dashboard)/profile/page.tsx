"use client";

import { useState, useEffect, type FormEvent } from "react";
import { getMe, updateProfile } from "@/lib/api/auth";
import type { User } from "@/types";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then((data) => {
        setUser(data);
        setName(data.name);
      })
      .catch((err) => {
        setError("Failed to load user profile.");
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
      setError("Name cannot be empty.");
      return;
    }

    if (newPassword || currentPassword || confirmPassword) {
      if (!currentPassword) {
        setError("Current password is required to change password.");
        return;
      }
      if (newPassword.length < 8) {
        setError("New password must be at least 8 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New password and confirm password do not match.");
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
      setSuccess("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to update profile.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  if (isPageLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center bg-[#f2ede0]">
        <div className="text-center">
          <div className="text-xl font-bold animate-pulse">Loading Profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 bg-[#f2ede0] overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-black mb-8 tracking-wide font-sans">
          Profile Settings
        </h1>

        <div className="bg-[#faf8f5] rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-bold text-black mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full rounded-doodle-input border-doodle-input bg-[#f0ebd9] px-3 py-2 text-sm disabled:opacity-75 cursor-not-allowed font-sans text-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500 font-bold">Email cannot be changed.</p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-black mb-1">
                Display Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-doodle-input border-doodle-input bg-white px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-[#fffdf0] disabled:opacity-50 font-sans"
                disabled={isLoading}
              />
            </div>

            <hr className="border-t-2 border-dashed border-black my-8" />

            {/* Change Password Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-black">Change Password</h3>
              <p className="text-xs text-gray-600 font-bold mb-4">
                Leave these fields blank if you do not want to change your password.
              </p>

              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-bold text-black mb-1"
                >
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-doodle-input border-doodle-input bg-white px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-[#fffdf0] disabled:opacity-50 font-sans"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

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
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-doodle-input border-doodle-input bg-white px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-[#fffdf0] disabled:opacity-50 font-sans"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-bold text-black mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-doodle-input border-doodle-input bg-white px-3 py-2 text-sm shadow-doodle-sm transition-colors focus:outline-none focus:ring-0 focus:bg-[#fffdf0] disabled:opacity-50 font-sans"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
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
              {isLoading ? "Saving changes…" : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
