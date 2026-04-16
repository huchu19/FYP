import { test, expect } from "@playwright/test";

test.describe("Navigation — unauthenticated", () => {
  test("home page shows login and register links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /login/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /register/i })).toBeVisible();
  });

  test("visiting /teacher redirects unauthenticated user to /login", async ({ page }) => {
    await page.goto("/teacher");
    await page.waitForURL("**/login", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting /student redirects unauthenticated user to /login", async ({ page }) => {
    await page.goto("/student");
    await page.waitForURL("**/login", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Navigation — teacher role", () => {
  test.use({ storageState: "e2e/.auth/teacher.json" });

  test("navbar shows Dashboard and + Classroom links", async ({ page }) => {
    await page.goto("/teacher");
    const navbar = page.locator("header");
    await expect(navbar.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(navbar.getByRole("link", { name: /\+ classroom/i })).toBeVisible();
  });

  test("navbar shows logout button", async ({ page }) => {
    await page.goto("/teacher");
    await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();
  });

  test("home page is accessible when logged in", async ({ page }) => {
    await page.goto("/");
    // Use main content h1, not the navbar h1
    await expect(page.locator("section h1")).toBeVisible();
  });
});

test.describe("Navigation — student role", () => {
  test.use({ storageState: "e2e/.auth/student.json" });

  test("navbar shows Dashboard link for student", async ({ page }) => {
    await page.goto("/student");
    const navbar = page.locator("header");
    await expect(navbar.getByRole("link", { name: /dashboard/i })).toBeVisible();
  });

  test("navbar shows logout button for student", async ({ page }) => {
    await page.goto("/student");
    await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();
  });
});
