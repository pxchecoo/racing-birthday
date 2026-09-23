import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const endpoint = "**/rest/v1/birthday_rsvps*";
test("responsive layouts, assets, navigation and accessibility", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  for (const width of [320, 375, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("");
    await expect(page.locator("h1")).toContainText("START YOUR");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator(".helmet")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    ).toBe(true);
  }
  await page.getByRole("link", { name: "Count me in" }).click();
  await expect(page).toHaveURL(/#rsvp$/);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  expect(errors).toEqual([]);
});
test("calendar download and map link are accurate", async ({ page }) => {
  await page.goto("");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add to calendar" }).click();
  expect((await download).suggestedFilename()).toBe(
    "racing-birthday-october-24.ics",
  );
  await expect(
    page.getByRole("link", { name: "Get directions" }),
  ).toHaveAttribute("href", /google.com\/maps\/search\/\?api=1&query=Avenida/);
});
test("attendance posts once without requesting private data, then confirms", async ({
  page,
}) => {
  const requests: { method: string; body: unknown }[] = [];
  await page.route(endpoint, async (route) => {
    requests.push({
      method: route.request().method(),
      body: route.request().postDataJSON(),
    });
    await new Promise((r) => setTimeout(r, 250));
    await route.fulfill({ status: 201, body: "" });
  });
  await page.goto("");
  await page.getByLabel("Your name").fill("Test Driver");
  await page.getByRole("button", { name: "Add a guest" }).click();
  await page.getByRole("button", { name: "Add a guest" }).click();
  await page.getByLabel("Leave a message").fill("See you there!");
  await page.getByRole("button", { name: "Confirm RSVP" }).click();
  await expect(
    page.getByRole("button", { name: "Saving your place" }),
  ).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("starting grid");
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({
    method: "POST",
    body: {
      name: "Test Driver",
      attending: true,
      guest_count: 2,
      message: "See you there!",
    },
  });
});
test("decline hides fields and stores no guests or message", async ({
  page,
}) => {
  let body: unknown;
  await page.route(endpoint, async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 201, body: "" });
  });
  await page.goto("");
  await page.getByLabel("Your name").fill("Test Decline");
  await page.getByRole("button", { name: "Add a guest" }).click();
  await page.getByRole("radio", { name: "Can’t make it" }).check();
  await expect(page.getByLabel("Leave a message")).toBeHidden();
  await page.getByRole("button", { name: "Confirm RSVP" }).click();
  await expect(page.getByRole("status")).toContainText("We’ll miss you");
  expect(body).toMatchObject({
    attending: false,
    guest_count: 0,
    message: null,
  });
});
test("server errors preserve input and retry uses the same id", async ({
  page,
}) => {
  const ids: string[] = [];
  await page.route(endpoint, async (route) => {
    ids.push(route.request().postDataJSON().id);
    await route.fulfill(
      ids.length === 1
        ? {
            status: 403,
            contentType: "application/json",
            body: JSON.stringify({ code: "42501", message: "denied" }),
          }
        : { status: 201, body: "" },
    );
  });
  await page.goto("");
  await page.getByLabel("Your name").fill("Retry Driver");
  await page.getByRole("button", { name: "Confirm RSVP" }).click();
  await expect(page.getByRole("alert")).toContainText("couldn’t save");
  await expect(page.getByLabel("Your name")).toHaveValue("Retry Driver");
  await page.getByRole("button", { name: "Confirm RSVP" }).click();
  await expect(page.getByRole("status")).toContainText("starting grid");
  expect(ids[0]).toBe(ids[1]);
});
