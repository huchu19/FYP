import { test, expect } from "@playwright/test";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

test.describe("Authentication flows", () => {
  test("register a new teacher and redirect to /teacher", async ({ page }) => {
    const email = `reg_teacher_${Date.now()}@test.com`;

    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill("New Teacher");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("••••••••").fill("TestPass123!");
    // Role defaults to "teacher"
    await page.getByRole("button", { name: /create account/i }).click();

    await page.waitForURL("**/teacher", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/teacher/);
  });

  test("register a new student and redirect to /student", async ({ page }) => {
    const email = `reg_student_${Date.now()}@test.com`;

    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill("New Student");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("••••••••").fill("TestPass123!");
    await page.getByRole("combobox").selectOption("student");
    await page.getByRole("button", { name: /create account/i }).click();

    await page.waitForURL("**/student", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/student/);
  });

  test("login with valid credentials", async ({ page }) => {
    const email = `login_${Date.now()}@test.com`;
    await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Login User", email, password: "TestPass123!", role: "teacher" }),
    });

    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("••••••••").fill("TestPass123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("**/teacher", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/teacher/);
  });

  test("login with wrong password shows error", async ({ page }) => {
    const email = `wrong_${Date.now()}@test.com`;
    await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Wrong Pass", email, password: "TestPass123!", role: "teacher" }),
    });

    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("••••••••").fill("WrongPassword!");
    await page.getByRole("button", { name: /sign in/i }).click();

    const errorMsg = page.locator("[class*='text-red']");
    await expect(errorMsg).toBeVisible({ timeout: 5_000 });
  });

  test("logout clears session", async ({ page }) => {
    const email = `logout_${Date.now()}@test.com`;
    await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Logout User", email, password: "TestPass123!", role: "teacher" }),
    });

    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("••••••••").fill("TestPass123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/teacher", { timeout: 10_000 });

    // Logout — lands on /login due to teacher layout guard
    await page.getByRole("button", { name: /logout/i }).click();
    await page.waitForURL("**/login", { timeout: 5_000 });

    // Verify user is logged out — login page visible
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});
