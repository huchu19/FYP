"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  ArrowRightIcon,
  BookIcon,
  BrainIcon,
  ChartIcon,
  ClockIcon,
  FileIcon,
  GridIcon,
  LogoutIcon,
  MoonIcon,
  PlusIcon,
  SparkIcon,
  SunIcon,
  UsersIcon,
} from "@/components/layout/icons";

function getTeacherLinks(pathname) {
  const classroomMatch = pathname.match(/^\/teacher\/classrooms\/([^/]+)/);
  const classroomId = classroomMatch?.[1];
  const activeClassroomId = classroomId && classroomId !== "new" ? classroomId : null;

  const links = [
    {
      href: "/teacher",
      label: "Dashboard",
      icon: GridIcon,
      active: pathname === "/teacher",
    },
    {
      href: "/teacher/classrooms/new",
      label: "New Classroom",
      icon: PlusIcon,
      active: pathname === "/teacher/classrooms/new",
    },
  ];

  if (activeClassroomId) {
    links.push(
      {
        href: `/teacher/classrooms/${activeClassroomId}`,
        label: "Classroom",
        icon: UsersIcon,
        active: /^\/teacher\/classrooms\/[^/]+$/.test(pathname),
      },
      {
        href: `/teacher/classrooms/${activeClassroomId}/lessons/new`,
        label: "AI Studio",
        icon: SparkIcon,
        active: /\/lessons\/new$/.test(pathname),
      },
      {
        href: `/teacher/classrooms/${activeClassroomId}/knowledge-graph`,
        label: "Knowledge Graph",
        icon: BrainIcon,
        active: /\/knowledge-graph$/.test(pathname),
      },
    );
  }

  return links;
}

function getStudentLinks(pathname) {
  const classroomMatch = pathname.match(/^\/student\/classrooms\/([^/]+)/);
  const classroomId = classroomMatch?.[1];
  const lessonMatch = pathname.match(/^\/student\/classrooms\/[^/]+\/lessons\/([^/]+)/);
  const quizMatch = pathname.match(/^\/student\/classrooms\/[^/]+\/quizzes\/([^/]+)/);

  const links = [
    {
      href: "/student",
      label: "Dashboard",
      icon: GridIcon,
      active: pathname === "/student",
    },
    {
      href: "/student/progress",
      label: "Progress",
      icon: ChartIcon,
      active: pathname.startsWith("/student/progress"),
    },
  ];

  if (classroomId) {
    links.push({
      href: `/student/classrooms/${classroomId}`,
      label: "My Class",
      icon: UsersIcon,
      active: new RegExp(`^/student/classrooms/${classroomId}$`).test(pathname),
    });
    links.push({
      href: `/student/classrooms/${classroomId}/knowledge-graph`,
      label: "Knowledge Map",
      icon: BrainIcon,
      active: /\/knowledge-graph$/.test(pathname),
    });
  }

  if (lessonMatch && classroomId) {
    links.push({
      href: `/student/classrooms/${classroomId}/lessons/${lessonMatch[1]}`,
      label: "Lesson",
      icon: BookIcon,
      active: /\/lessons\/[^/]+$/.test(pathname),
    });
  }

  if (quizMatch && classroomId) {
    links.push({
      href: `/student/classrooms/${classroomId}/quizzes/${quizMatch[1]}`,
      label: "Quiz",
      icon: FileIcon,
      active: /\/quizzes\/[^/]+$/.test(pathname),
    });
  }

  return links;
}

function BrandMark({ role }) {
  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-[0.9rem] ${
        role === "teacher"
          ? "bg-[var(--color-primary)] text-[var(--button-text)]"
          : "bg-[var(--color-accent)] text-[var(--button-text)]"
      }`}
    >
      <BookIcon className="h-5 w-5" />
    </div>
  );
}

export default function DashboardFrame({ role, children }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const links = role === "teacher" ? getTeacherLinks(pathname) : getStudentLinks(pathname);
  const accentClass = role === "teacher"
    ? "text-[var(--color-primary)] bg-[var(--color-primary-soft)] border-[var(--color-primary)]/16"
    : "text-[var(--color-accent)] bg-[var(--color-accent-soft)] border-[var(--color-accent)]/18";

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen p-4 sm:p-5 lg:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[124rem] flex-col overflow-hidden rounded-[2rem] border border-[var(--border-card)] bg-[var(--bg-shell)] shadow-[var(--shadow-shell)] lg:flex-row">
        <aside className="w-full border-b border-[var(--border-card)] bg-[var(--bg-sidebar)] lg:w-[18.5rem] lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col">
            <div className="border-b border-[var(--border-card)] px-5 py-5">
              <Link href="/" className="flex items-center gap-3">
                <BrandMark role={role} />
                <div>
                  <p className="font-display text-[1.7rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                    EduNexus
                  </p>
                </div>
              </Link>
            </div>

            <div className="px-5 py-4">
              <span className={`inline-flex rounded-[0.7rem] border px-3 py-1 text-sm font-medium ${accentClass}`}>
                {role === "teacher" ? "Teacher" : "Student"}
              </span>
            </div>

            <nav className="flex-1 space-y-1 px-3 pb-4">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`dashboard-nav-link ${link.active ? "dashboard-nav-link-active" : ""} ${
                      role === "teacher" ? "dashboard-nav-teacher" : "dashboard-nav-student"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-[var(--border-card)] px-4 py-4">
              <div className="rounded-[1rem] border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--text-faint)]">
                  Active profile
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-heading)]">
                  {user?.name || (role === "teacher" ? "Teacher workspace" : "Student workspace")}
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {role === "teacher" ? "Curriculum studio ready" : "Learning cockpit ready"}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  className="dashboard-tool-button"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                </button>
                <Link href="/" className="dashboard-tool-button flex-1 justify-center gap-2">
                  <ArrowRightIcon className="h-4 w-4 rotate-180" />
                  Home
                </Link>
                <button type="button" className="dashboard-tool-button flex-1 justify-center gap-2" onClick={handleLogout}>
                  <LogoutIcon className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div
          className={`flex-1 ${
            role === "teacher" ? "bg-[var(--teacher-surface)]" : "bg-[var(--student-surface)]"
          }`}
        >
          <div className="mx-auto w-full max-w-[96rem] px-5 py-6 md:px-8 lg:px-10 lg:py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
