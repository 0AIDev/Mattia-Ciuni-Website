import { test, expect } from "@playwright/test";

const foreground = {
  light: "rgb(22, 22, 22)",
  dark: "rgb(255, 255, 255)",
} as const;
const paragraphForeground = {
  light: "rgb(38, 38, 38)",
  dark: "rgb(255, 255, 255)",
} as const;
const secondaryForeground = {
  light: "rgb(104, 104, 104)",
  dark: "rgb(255, 255, 255)",
} as const;

for (const theme of ["light", "dark"] as const) {
  test(`${theme} mode keeps public text and controls readable`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/");

    if (theme === "dark") await expect(page.locator("html")).toHaveClass(/(^| )dark( |$)/);
    else await expect(page.locator("html")).not.toHaveClass(/(^| )dark( |$)/);
    await expect(page.locator("body")).toHaveCSS("color", foreground[theme]);
    await expect(page.locator("h1")).toHaveCSS("color", foreground[theme]);
    await page.screenshot({ path: testInfo.outputPath(`home-${theme}.png`), fullPage: true });

    await page.goto("/thoughts/");
    const backButton = page.getByRole("button", { name: "Go back" });
    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveCSS("color", foreground[theme]);
    await expect(backButton.locator("svg")).toHaveCSS("color", foreground[theme]);
    await page.screenshot({ path: testInfo.outputPath(`back-button-${theme}.png`), fullPage: false });
  });
}

test("theme toggle switches the whole page without a reload", async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  const toggle = page.locator('button[aria-label="Theme"], button[aria-label="Switch to dark mode"]').first();
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-label", "Switch to dark mode");
  await toggle.click();

  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("body")).toHaveCSS("color", foreground.dark);
  await page.screenshot({ path: testInfo.outputPath("home-toggle-dark.png"), fullPage: true });
});

for (const theme of ["light", "dark"] as const) {
  test(`${theme} careers application modal is readable`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/careers/agent-runtime-founding-engineer/apply/");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("h1")).toHaveCSS("color", foreground[theme]);
    await expect(dialog.locator("p").first()).toHaveCSS("color", paragraphForeground[theme]);
    await expect(dialog.getByLabel("Close application")).toHaveCSS("color", secondaryForeground[theme]);
    await page.screenshot({ path: testInfo.outputPath(`application-modal-${theme}.png`), fullPage: false });
  });
}
