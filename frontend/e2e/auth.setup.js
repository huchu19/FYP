/**
 * Auth setup — runs once before all other tests.
 *
 * Registers a teacher and student account via the backend API, then logs each
 * in through the UI so the JWT ends up in localStorage. The resulting browser
 * state is saved to .auth/*.json so every subsequent test can start already
 * authenticated.
 */
import { test as setup, expect } from "@playwright/test";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const TEACHER = {
  name: "Test Teacher",
  email: `teacher_${Date.now()}@test.com`,
  password: "TestPass123!",
  role: "teacher",
};

const STUDENT = {
  name: "Test Student",
  email: `student_${Date.now()}@test.com`,
  password: "TestPass123!",
  role: "student",
};

async function registerViaApi(user) {
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok && res.status !== 409) {
    throw new Error(`Registration failed for ${user.email}: ${res.status}`);
  }
}

async function loginThroughUI(page, email, password, expectedPath) {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(`**${expectedPath}`, { timeout: 10_000 });
  await expect(page).toHaveURL(new RegExp(expectedPath));
}

setup("create teacher auth state", async ({ page }) => {
  await registerViaApi(TEACHER);
  await loginThroughUI(page, TEACHER.email, TEACHER.password, "/teacher");
  await page.context().storageState({ path: "e2e/.auth/teacher.json" });
});

setup("create student auth state", async ({ page }) => {
  await registerViaApi(STUDENT);
  await loginThroughUI(page, STUDENT.email, STUDENT.password, "/student");
  await page.context().storageState({ path: "e2e/.auth/student.json" });
});
