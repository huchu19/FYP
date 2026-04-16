import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import AppFrame from "@/components/layout/AppFrame";

export const metadata = {
  title: "EduNexus",
  description: "AI-powered adaptive learning platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationMismatch>
      <body className="min-h-screen bg-[var(--bg-surface)] text-[var(--text-primary)] antialiased">
        <ThemeProvider>
          <AuthProvider>
            <AppFrame>{children}</AppFrame>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
