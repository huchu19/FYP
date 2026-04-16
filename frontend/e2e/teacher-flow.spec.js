import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/teacher.json" });

test.describe("Teacher journey", () => {
  test("dashboard loads and shows classrooms section", async ({ page }) => {
    await page.goto("/teacher");
    await expect(page.getByRole("heading", { name: /teacher home/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("heading", { name: /classrooms/i })).toBeVisible();
  });

  test("create a classroom", async ({ page }) => {
    const classroomName = `Physics ${Date.now()}`;
    const classroomCode = `P${Date.now().toString().slice(-6)}`;

    await page.goto("/teacher/classrooms/new");
    await expect(page.getByRole("heading", { name: /create classroom/i })).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder("Physics 101").fill(classroomName);
    await page.getByPlaceholder("PHYS-101").fill(classroomCode);
    await page.getByPlaceholder("Intro to mechanics and waves").fill("A test classroom");
    await page.getByRole("button", { name: /create classroom/i }).click();

    await page.waitForURL("**/teacher/classrooms/*", { timeout: 10_000 });
    await expect(page.getByText(classroomName)).toBeVisible();
    await expect(page.getByText(classroomCode)).toBeVisible();
  });

  test("view classroom details shows code and description", async ({ page }) => {
    const classroomName = `Details ${Date.now()}`;
    const classroomCode = `D${Date.now().toString().slice(-6)}`;

    await page.goto("/teacher/classrooms/new");
    await page.getByPlaceholder("Physics 101").fill(classroomName);
    await page.getByPlaceholder("PHYS-101").fill(classroomCode);
    await page.getByPlaceholder("Intro to mechanics and waves").fill("Description test");
    await page.getByRole("button", { name: /create classroom/i }).click();
    await page.waitForURL("**/teacher/classrooms/*", { timeout: 10_000 });

    await expect(page.getByText(classroomCode)).toBeVisible();
    await expect(page.getByText("Description test")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lessons" })).toBeVisible();
  });

  test("created classroom is accessible from its detail page", async ({ page }) => {
    const classroomName = `Access ${Date.now()}`;
    const classroomCode = `X${Date.now().toString().slice(-6)}`;

    await page.goto("/teacher/classrooms/new");
    await page.getByPlaceholder("Physics 101").fill(classroomName);
    await page.getByPlaceholder("PHYS-101").fill(classroomCode);
    await page.getByRole("button", { name: /create classroom/i }).click();
    await page.waitForURL("**/teacher/classrooms/*", { timeout: 10_000 });

    // Verify detail page shows the classroom
    await expect(page.getByText(classroomName)).toBeVisible();
    await expect(page.getByText(classroomCode)).toBeVisible();

    // Verify navigating back to dashboard shows classrooms section
    await page.goto("/teacher");
    await expect(page.getByRole("heading", { name: /classrooms/i })).toBeVisible({ timeout: 10_000 });
  });

  test("new lesson page loads and has form fields", async ({ page }) => {
    const classroomCode = `L${Date.now().toString().slice(-6)}`;
    await page.goto("/teacher/classrooms/new");
    await page.getByPlaceholder("Physics 101").fill("Lesson Test Class");
    await page.getByPlaceholder("PHYS-101").fill(classroomCode);
    await page.getByRole("button", { name: /create classroom/i }).click();
    await page.waitForURL("**/teacher/classrooms/*", { timeout: 10_000 });

    // Navigate to new lesson
    await page.getByRole("link", { name: /\+ new/i }).click();
    await page.waitForURL("**/lessons/new", { timeout: 5_000 });

    await expect(page.getByRole("heading", { name: /new lesson/i })).toBeVisible();
    await expect(page.getByLabel(/prompt/i)).toBeVisible();
    await expect(page.getByLabel(/audience/i)).toBeVisible();
    await expect(page.getByLabel(/length/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /generate lesson/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible();
  });
});
