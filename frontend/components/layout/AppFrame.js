"use client";

import { usePathname } from "next/navigation";

import Navbar from "@/components/layout/Navbar";

export default function AppFrame({ children }) {
  const pathname = usePathname() || "/";
  const isDashboard = pathname.startsWith("/teacher") || pathname.startsWith("/student");
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isDashboard) {
    return (
      <>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-50 focus:rounded-[0.9rem] focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--button-text)]"
        >
          Skip to main content
        </a>
        <main id="main-content" className="min-h-screen" role="main">
          {children}
        </main>
      </>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[96rem] flex-col px-4 py-4 sm:px-5 lg:px-6">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-50 focus:rounded-[0.9rem] focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--button-text)]"
      >
        Skip to main content
      </a>
      {!isAuth && <Navbar />}
      <main
        id="main-content"
        className={isAuth ? "flex flex-1 items-stretch py-2" : "relative flex-1 pb-10 pt-6 sm:pt-8"}
        role="main"
      >
        {children}
      </main>
    </div>
  );
}
