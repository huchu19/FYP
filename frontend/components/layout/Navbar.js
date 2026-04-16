"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import { navLink } from "@/lib/styles";
import {
  ArrowRightIcon,
  BookIcon,
  MoonIcon,
  SunIcon,
} from "@/components/layout/icons";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  function handleLogout() {
    logout();
    router.push("/");
  }

  const marketingLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#teachers", label: "For Teachers" },
    { href: "/#students", label: "For Students" },
  ];
  const dashboardHref = user?.role === "teacher" ? "/teacher" : "/student";

  return (
    <header className="sticky top-4 z-50 rounded-[1.8rem] border border-[var(--border-card)] bg-[var(--bg-shell)] shadow-[var(--shadow-shell)] backdrop-blur-md">
      <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[0.9rem] bg-[var(--color-primary)] text-[var(--button-text)] shadow-[var(--shadow-soft)]">
              <BookIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-[1.85rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                EduNexus
              </p>
            </div>
          </Link>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <nav
            aria-label="Main navigation"
            className="flex flex-wrap items-center gap-1 rounded-[1rem] border border-[var(--border-card)] bg-[var(--bg-card)] p-1"
          >
            {marketingLinks.map((link) => (
              <Link
                key={link.href}
                className={`${navLink} ${
                  pathname === "/" && link.href === "/#features"
                    ? "text-[var(--text-heading)]"
                    : ""
                }`}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[0.9rem] border border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-heading)]"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </button>

            {!loading && user ? (
              <>
                <Link
                  className="inline-flex items-center gap-2 rounded-[0.9rem] border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-medium text-[var(--text-heading)] transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-list)]"
                  href={dashboardHref}
                >
                  Dashboard
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center rounded-[0.9rem] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-[var(--button-text)] shadow-[var(--shadow-primary)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-primary-hover)]"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  className="inline-flex items-center rounded-[0.9rem] px-4 py-2.5 text-sm font-medium text-[var(--text-heading)] transition hover:bg-[var(--bg-list)]"
                  href="/login"
                >
                  Sign In
                </Link>
                <Link
                  className="inline-flex items-center rounded-[0.9rem] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-[var(--button-text)] shadow-[var(--shadow-primary)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-primary-hover)]"
                  href="/register"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
