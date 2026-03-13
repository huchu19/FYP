import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import Navbar from "../components/layout/Navbar";

export const metadata = {
  title: "EduNexus",
  description: "AI-powered adaptive learning platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
        <AuthProvider>
          <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
