"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  ArrowRightIcon,
  BookIcon,
  BrainIcon,
  ChartIcon,
  ChevronLeftIcon,
  ClockIcon,
  EditIcon,
  FileIcon,
  GridIcon,
  LogoutIcon,
  MoonIcon,
  PlusIcon,
  SparkIcon,
  SunIcon,
  UsersIcon,
} from "@/components/layout/icons";

const SIDEBAR_KEY = "edunexus_sidebar_collapsed";

function getTeacherGroups(pathname) {
  const classroomMatch = pathname.match(/^\/teacher\/classrooms\/([^/]+)/);
  const classroomId = classroomMatch?.[1];
  const activeClassroomId = classroomId && classroomId !== "new" ? classroomId : null;
  const lessonMatch = pathname.match(/^\/teacher\/classrooms\/[^/]+\/lessons\/([^/]+)/);
  const quizMatch = pathname.match(/^\/teacher\/classrooms\/[^/]+\/quizzes\/([^/]+)/);

  const groups = [
    {
      items: [
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
      ],
    },
  ];

  if (activeClassroomId) {
    const classroomItems = [
      {
        href: `/teacher/classrooms/${activeClassroomId}`,
        label: "Classroom",
        icon: UsersIcon,
        active: /^\/teacher\/classrooms\/[^/]+$/.test(pathname),
      },
      {
        href: `/teacher/classrooms/${activeClassroomId}/edit`,
        label: "Edit",
        icon: EditIcon,
        active: /\/edit$/.test(pathname),
        indent: true,
      },
      {
        href: `/teacher/classrooms/${activeClassroomId}/lessons/new`,
        label: "AI Studio",
        icon: SparkIcon,
        active: /\/lessons\/new$/.test(pathname),
        indent: true,
      },
      {
        href: `/teacher/classrooms/${activeClassroomId}/knowledge-graph`,
        label: "Knowledge Graph",
        icon: BrainIcon,
        active: /\/knowledge-graph$/.test(pathname),
        indent: true,
      },
    ];

    if (lessonMatch && lessonMatch[1] !== "new") {
      classroomItems.push({
        href: `/teacher/classrooms/${activeClassroomId}/lessons/${lessonMatch[1]}`,
        label: "Lesson",
        icon: BookIcon,
        active: /\/lessons\/[^/]+$/.test(pathname) && !/\/lessons\/new$/.test(pathname),
        indent: true,
      });
    }

    if (quizMatch && quizMatch[1] !== "new") {
      classroomItems.push({
        href: `/teacher/classrooms/${activeClassroomId}/quizzes/${quizMatch[1]}`,
        label: "Quiz",
        icon: FileIcon,
        active: /\/quizzes\/[^/]+$/.test(pathname) && !/\/quizzes\/new$/.test(pathname),
        indent: true,
      });
    }

    groups.push({ groupLabel: "In Classroom", items: classroomItems });
  }

  return groups;
}

function getStudentGroups(pathname) {
  const classroomMatch = pathname.match(/^\/student\/classrooms\/([^/]+)/);
  const classroomId = classroomMatch?.[1];
  const lessonMatch = pathname.match(/^\/student\/classrooms\/[^/]+\/lessons\/([^/]+)/);
  const quizMatch = pathname.match(/^\/student\/classrooms\/[^/]+\/quizzes\/([^/]+)/);
  const teachMatch = pathname.match(/^\/student\/classrooms\/([^/]+)\/teach/);

  const groups = [
    {
      items: [
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
      ],
    },
  ];

  if (classroomId) {
    const classroomItems = [
      {
        href: `/student/classrooms/${classroomId}`,
        label: "My Class",
        icon: UsersIcon,
        active: new RegExp(`^/student/classrooms/${classroomId}$`).test(pathname),
      },
      {
        href: `/student/classrooms/${classroomId}/knowledge-graph`,
        label: "Knowledge Map",
        icon: BrainIcon,
        active: /\/knowledge-graph$/.test(pathname),
        indent: true,
      },
    ];

    if (teachMatch) {
      classroomItems.push({
        href: `/student/classrooms/${classroomId}/teach`,
        label: "Teach Mode",
        icon: SparkIcon,
        active: pathname.startsWith(`/student/classrooms/${classroomId}/teach`),
        indent: true,
      });
    }

    if (lessonMatch) {
      classroomItems.push({
        href: `/student/classrooms/${classroomId}/lessons/${lessonMatch[1]}`,
        label: "Lesson",
        icon: BookIcon,
        active: /\/lessons\/[^/]+$/.test(pathname),
        indent: true,
      });
    }

    if (quizMatch) {
      classroomItems.push({
        href: `/student/classrooms/${classroomId}/quizzes/${quizMatch[1]}`,
        label: "Quiz",
        icon: FileIcon,
        active: /\/quizzes\/[^/]+$/.test(pathname),
        indent: true,
      });
    }

    groups.push({ groupLabel: "In Classroom", items: classroomItems });
  }

  return groups;
}

function BrandMark({ role }) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] ${
        role === "teacher"
          ? "bg-[var(--color-teacher)] text-white"
          : "bg-[var(--color-accent)] text-[var(--button-text)]"
      }`}
    >
      <BookIcon className="h-5 w-5" />
    </div>
  );
}

export default function DashboardFrame({ role, children, banner }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isCollapsed, setIsCollapsed] = useState(() =>
    typeof window !== "undefined" && window.localStorage.getItem(SIDEBAR_KEY) === "true"
  );

  function toggleSidebar() {
    const next = !isCollapsed;
    setIsCollapsed(next);
    window.localStorage.setItem(SIDEBAR_KEY, String(next));
  }

  const groups = role === "teacher" ? getTeacherGroups(pathname) : getStudentGroups(pathname);
  const accentClass =
    role === "teacher"
      ? "text-[var(--color-teacher)] bg-[var(--color-teacher-soft)] border-[var(--color-teacher)]/20"
      : "text-[var(--color-accent)] bg-[var(--color-accent-soft)] border-[var(--color-accent)]/18";

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="h-screen overflow-hidden" data-role={role}>
      <div className="flex h-full flex-col bg-[var(--bg-shell)]">
        {banner && <div className="shrink-0">{banner}</div>}
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        <aside
          className={`w-full border-b border-[var(--border-card)] bg-[var(--bg-sidebar)] lg:border-b-0 lg:border-r lg:transition-[width] lg:duration-200 lg:ease-in-out ${
            isCollapsed ? "lg:w-16" : "lg:w-[18.5rem]"
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-card)] px-4 py-5">
              <Link href="/" className="flex items-center gap-3 overflow-hidden">
                <BrandMark role={role} />
                {!isCollapsed && (
                  <p className="truncate font-display text-[1.7rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                    EduNexus
                  </p>
                )}
              </Link>
              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-[0.7rem] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-list)] hover:text-[var(--text-heading)] lg:flex"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <ChevronLeftIcon
                  className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Role badge */}
            {!isCollapsed && (
              <div className="px-5 py-4">
                <span className={`inline-flex rounded-[0.7rem] border px-3 py-1 text-sm font-medium ${accentClass}`}>
                  {role === "teacher" ? "Teacher" : "Student"}
                </span>
              </div>
            )}

            {/* Nav — scrollable, sticky-bottom-safe */}
            <nav className={`flex-1 overflow-y-auto min-h-0 px-3 pb-4 ${!isCollapsed ? "space-y-1" : "space-y-1 pt-2"}`}>
              {groups.map((group, i) => (
                <div key={i}>
                  {!isCollapsed && group.groupLabel && (
                    <div className="sidebar-group-label">{group.groupLabel}</div>
                  )}
                  {group.items.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        title={isCollapsed ? link.label : undefined}
                        className={`dashboard-nav-link ${link.active ? "dashboard-nav-link-active" : ""} ${
                          role === "teacher" ? "dashboard-nav-teacher" : "dashboard-nav-student"
                        }${link.indent && !isCollapsed ? " sidebar-nav-indented" : ""}${
                          isCollapsed ? " sidebar-nav-collapsed" : ""
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span>{link.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Bottom — always visible (shrink-0) */}
            <div className="shrink-0 border-t border-[var(--border-card)] px-4 py-4">
              {isCollapsed ? (
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    className="dashboard-tool-button"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                  </button>
                  <Link href="/" className="dashboard-tool-button" title="Home" aria-label="Home">
                    <ArrowRightIcon className="h-4 w-4 rotate-180" />
                  </Link>
                  <button
                    type="button"
                    className="dashboard-tool-button"
                    onClick={handleLogout}
                    title="Logout"
                    aria-label="Logout"
                  >
                    <LogoutIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
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
                    <button
                      type="button"
                      className="dashboard-tool-button flex-1 justify-center gap-2"
                      onClick={handleLogout}
                    >
                      <LogoutIcon className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>

        <div
          className={`flex-1 overflow-y-auto ${
            role === "teacher" ? "bg-[var(--teacher-surface)]" : "bg-[var(--student-surface)]"
          }`}
        >
          <div className="mx-auto w-full max-w-[96rem] px-5 py-6 md:px-8 lg:px-10 lg:py-8">
            {children}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
