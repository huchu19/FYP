import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import AppFrame from "@/components/layout/AppFrame";
import WakingNotice from "@/components/layout/WakingNotice";

export const metadata = {
  title: "EduNexus",
  description: "AI-powered adaptive learning platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--bg-surface)] text-[var(--text-primary)] antialiased">
        <ThemeProvider>
          <AuthProvider>
            <AppFrame>{children}</AppFrame>
            <WakingNotice />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
