import { test, expect } from "@playwright/test";

test.describe("Navigation — unauthenticated", () => {
  test("home page shows login and register links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /login/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /register/i })).toBeVisible();
  });

  test("home page demo updates mastery using the app's rules", async ({ page }) => {
    await page.goto("/");
    const map = page.getByRole("figure", { name: "Interactive knowledge map demo" });

    await map.getByRole("button", { name: "Answer a question" }).click();
    await map.getByText("You recognise the material").click();
    await map.getByRole("button", { name: "Submit answer" }).click();
    await expect(map.getByRole("heading", { name: "Illusion of Knowing: 38% to 57%" })).toBeVisible();
    await expect(map.getByText("no longer holding back Teaching to Learn")).toBeVisible();

    await map.getByRole("button", { name: "Reset the map" }).click();
    await map.getByRole("button", { name: "Answer a question" }).click();
    await map.getByRole("button", { name: "Reveal hint 1" }).click();
    await map.getByText("You recognise the material").click();
    await map.getByRole("button", { name: "Submit answer" }).click();
    await expect(map.getByRole("heading", { name: "Illusion of Knowing: 38% to 49%" })).toBeVisible();
    await expect(map.getByText("still holding back Teaching to Learn")).toBeVisible();
  });

  test("home page tour shows every screenshot for both roles", async ({ page }) => {
    await page.goto("/");

    for (const [role, stepCount] of [["Teachers", 4], ["Students", 5]]) {
      await page.getByRole("tab", { name: role, exact: true }).click();
      const steps = page.getByRole("tablist", { name: `${role} walkthrough steps` }).getByRole("tab");
      await expect(steps).toHaveCount(stepCount);

      for (let index = 0; index < stepCount; index += 1) {
        await steps.nth(index).click();
        const screenshot = page.locator('.tour-shot[data-active="true"] img');
        await screenshot.scrollIntoViewIfNeeded();
        await expect(screenshot).toHaveJSProperty("complete", true);
        expect(await screenshot.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
      }
    }
  });

  test("home page tour zooms to a note and back out", async ({ page }) => {
    await page.goto("/");
    const note = page.locator(".tour-note").first();

    await note.click();
    await expect(note).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Show the whole screen" }).click();
    await expect(note).toHaveAttribute("aria-pressed", "false");
  });

  test("navbar links open the matching side of the tour", async ({ page }) => {
    await page.goto("/");
    const navigation = page.getByRole("navigation", { name: "Main navigation" });

    await navigation.getByRole("link", { name: "For Students" }).click();
    await expect(page.getByRole("tab", { name: "Students", exact: true })).toHaveAttribute("aria-selected", "true");
    await navigation.getByRole("link", { name: "For Teachers" }).click();
    await expect(page.getByRole("tab", { name: "Teachers", exact: true })).toHaveAttribute("aria-selected", "true");
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
