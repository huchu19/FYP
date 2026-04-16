import { test, expect } from "@playwright/test";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

test.use({ storageState: "e2e/.auth/student.json" });

test.describe("Student journey", () => {
  test("dashboard loads with stats and classrooms sections", async ({ page }) => {
    await page.goto("/student");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible({ timeout: 10_000 });
    // Stat cards use uppercase labels
    await expect(page.locator("text=Classrooms").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /my classrooms/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /join a classroom/i })).toBeVisible();
  });

  test("join with invalid code shows error", async ({ page }) => {
    await page.goto("/student");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible({ timeout: 10_000 });
    const joinInput = page.getByPlaceholder("e.g. PHYS-ABC");
    await joinInput.fill("INVALID-CODE-999");
    await page.getByRole("button", { name: /^join$/i }).click();

    const errorMsg = page.locator("[class*='text-red']");
    await expect(errorMsg).toBeVisible({ timeout: 5_000 });
  });

  test("join classroom by code shows success", async ({ page }) => {
    // Create a classroom as teacher via API
    const ts = Date.now();
    const teacherEmail = `st_teacher_${ts}@test.com`;
    const classroomCode = `J${ts.toString().slice(-6)}`;

    // Register teacher
    const regRes = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "St Teacher", email: teacherEmail, password: "TestPass123!", role: "teacher" }),
    });
    expect(regRes.ok || regRes.status === 409).toBeTruthy();

    // Login teacher to get token
    const loginRes = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: teacherEmail, password: "TestPass123!" }),
    });
    expect(loginRes.ok).toBeTruthy();
    const { access_token } = await loginRes.json();

    // Create classroom as teacher
    const createRes = await fetch(`${API}/classrooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${access_token}` },
      body: JSON.stringify({ name: "Joinable Class", code: classroomCode, description: "A class to join" }),
    });
    expect(createRes.ok).toBeTruthy();

    // Now join as student via UI
    await page.goto("/student");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible({ timeout: 10_000 });
    const joinInput = page.getByPlaceholder("e.g. PHYS-ABC");
    await joinInput.fill(classroomCode);
    await page.getByRole("button", { name: /^join$/i }).click();

    // Check for success message or the classroom name appearing
    await expect(page.getByText(/joined joinable class/i)).toBeVisible({ timeout: 10_000 });
  });

  test("badges section shows earned badges", async ({ page }) => {
    await page.goto("/student");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible({ timeout: 10_000 });
    // Page always shows badges (demo or real)
    await expect(page.getByText(/badges earned/i)).toBeVisible();
    // At least one badge pill should be visible
    await expect(page.locator(".rounded-full", { hasText: /learner|ace|streak|top/i }).first()).toBeVisible();
  });
});
