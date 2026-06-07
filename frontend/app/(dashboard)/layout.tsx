"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getMe, logout } from "@/lib/api/auth";
import type { User } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonOverlay } from "@/components/ui/LoadingStates";

const NAV_LINKS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg
        className="w-5 h-5 flex-shrink-0 text-black"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    href: "/expenses",
    label: "Expenses",
    icon: (
      <svg
        className="w-5 h-5 flex-shrink-0 text-black"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: (
      <svg
        className="w-5 h-5 flex-shrink-0 text-black"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
  {
    href: "/shopping",
    label: "Shopping List",
    icon: (
      <svg
        className="w-5 h-5 flex-shrink-0 text-black"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    href: "/categories",
    label: "Categories",
    icon: (
      <svg
        className="w-5 h-5 flex-shrink-0 text-black"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg
        className="w-5 h-5 flex-shrink-0 text-black"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) {
          router.push("/login");
        }
      });

    const handleProfileUpdate = () => {
      console.log("Profile updated, fetching latest info...");
      getMe().then(setUser).catch(() => {});
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [router]);

  if (!user) {
    return <SkeletonOverlay />;
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // proceed regardless
    }
    router.push("/login");
  }

  const getLinkLabel = (href: string) => {
    switch (href) {
      case "/dashboard": return t.navDashboard;
      case "/expenses": return t.navExpenses;
      case "/inventory": return t.navInventory;
      case "/shopping": return t.navShopping;
      case "/categories": return t.navCategories;
      case "/profile": return t.navProfile;
      default: return "";
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-paper">
      {/* Logo / branding */}
      <div className="flex items-center justify-between px-4 py-5 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-doodle bg-pastel-blue border-doodle shadow-doodle-sm flex items-center justify-center">
            <svg
              className="w-4 h-4 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="font-bold text-black tracking-wide text-lg">{t.appName}</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        {NAV_LINKS.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-doodle text-base font-bold transition-all border-2 ${
                isActive
                  ? "bg-pastel-blue text-black border-black shadow-doodle-sm translate-y-[2px]"
                  : "text-gray-700 border-transparent hover:bg-paper hover:border-black hover:text-black hover:shadow-doodle-sm hover:translate-y-[-2px]"
              }`}
            >
              {link.icon}
              {getLinkLabel(link.href)}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t-2 border-black px-4 py-4 bg-paper">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-doodle bg-pastel-yellow border-2 border-black flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-black">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="flex-1 min-w-0 text-base font-bold text-black tracking-wide truncate">
              {user.name}
            </p>
            <button
              onClick={handleLogout}
              title={t.signOut}
              className="flex items-center justify-center p-1.5 rounded-doodle text-black border-2 border-transparent hover:border-black hover:bg-paper hover:shadow-doodle-sm transition-all flex-shrink-0"
            >
              <svg
                className="w-4 h-4 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="flex-1 h-3 bg-gray-200 rounded w-3/4" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-transparent">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 lg:w-64 flex-col bg-paper border-r-2 border-black flex-shrink-0 shadow-doodle">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 w-64 bg-paper shadow-xl border-r-2 border-black">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-2 bg-paper border-b-2 border-black shadow-doodle-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-doodle border-2 border-transparent hover:border-black hover:bg-paper text-black transition-colors"
            aria-label="Open menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="font-bold text-black text-lg tracking-wide">
            {t.appName}
          </span>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
