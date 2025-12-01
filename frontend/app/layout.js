import "./globals.css";
import Navbar from "../components/layout/Navbar";

export const metadata = {
  title: "EduNexus",
  description: "AI-powered adaptive learning platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-6">
          <Navbar />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
