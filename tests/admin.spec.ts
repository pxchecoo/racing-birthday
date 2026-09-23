import { test, expect, type BrowserContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const testPassword = "only-a-mocked-test-password";
const testToken = "a".repeat(64);
const original = {
  id: 1,
  event_date: "2026-10-24",
  event_time: "15:00:00",
  updated_at: "2026-09-23T12:00:00Z",
};
const responses = [
  {
    id: "2",
    name: "Second Driver",
    attending: false,
    guest_count: 0,
    message: null,
    created_at: "2026-10-02T19:00:00Z",
  },
  {
    id: "1",
    name: "First Driver",
    attending: true,
    guest_count: 2,
    message: "See you at the starting line!",
    created_at: "2026-10-01T19:00:00Z",
  },
];
async function mockControl(context: BrowserContext, empty = false) {
  let active = false;
  let settings = { ...original };
  let saveCount = 0;
  await context.route("**/rest/v1/event_settings*", (route) =>
    route.fulfill({ json: [settings] }),
  );
  await context.route("**/functions/v1/race-control", async (route) => {
    const body = route.request().postDataJSON();
    if (body.action === "login") {
      if (body.password !== testPassword)
        return route.fulfill({
          json: { ok: false, error: "Incorrect password." },
        });
      active = true;
      return route.fulfill({
        json: {
          ok: true,
          session: {
            token: testToken,
            expires_at: new Date(Date.now() + 14400000).toISOString(),
          },
        },
      });
    }
    if (!active || route.request().headers()["x-admin-token"] !== testToken)
      return route.fulfill({
        status: 401,
        json: { error: "Your session has expired. Please sign in again." },
      });
    if (body.action === "logout") {
      active = false;
      return route.fulfill({ json: { ok: true } });
    }
    if (body.action === "save_settings") {
      await new Promise((resolve) => setTimeout(resolve, 200));
      settings = {
        ...settings,
        event_date: body.event_date,
        event_time: body.event_time + ":00",
        updated_at: new Date().toISOString(),
      };
      saveCount++;
      return route.fulfill({ json: { ok: true, settings } });
    }
    return route.fulfill({
      json: { ok: true, settings, responses: empty ? [] : responses },
    });
  });
  return { saved: () => saveCount };
}
async function login(page: import("@playwright/test").Page) {
  await page.getByLabel("Password", { exact: true }).fill(testPassword);
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Event Settings" }),
  ).toBeVisible();
}
test("direct admin URL, wrong password, session refresh, statistics and logout", async ({
  page,
  context,
}) => {
  await mockControl(context);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("admin/");
  await page.getByLabel("Password", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Incorrect password.");
  await login(page);
  await expect(
    page
      .locator(".admin-stat")
      .filter({ hasText: "Total Guests" })
      .locator("dd"),
  ).toHaveText("3");
  await expect(
    page
      .locator(".admin-stat")
      .filter({ hasText: "Total Responses" })
      .locator("dd"),
  ).toHaveText("2");
  await expect(page.locator(".admin-table tbody tr").first()).toContainText(
    "Second Driver",
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "RSVP Responses" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Refresh", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Log Out" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("race-control-session-v1"),
    ),
  ).toBeNull();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Race Control", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("date/time changes update an already open invitation, countdown and calendar without reloading", async ({
  page,
  context,
}) => {
  const mock = await mockControl(context);
  const invitation = await context.newPage();
  await invitation.goto("");
  await expect(invitation.locator(".hero-bottom")).toContainText(
    "October 24, 2026",
  );
  const before = await invitation.getByRole("timer").getAttribute("aria-label");
  await page.goto("admin/");
  await login(page);
  await page.getByLabel("Date", { exact: true }).fill("2026-11-04");
  await page.getByLabel("Time", { exact: true }).fill("18:45");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(
    page.getByRole("button", { name: "Saving…", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("status")).toContainText(
    "Event updated successfully",
  );
  await expect(invitation.locator(".hero-bottom")).toContainText(
    "November 4, 2026",
  );
  await expect(invitation.locator(".hero-bottom")).toContainText("6:45 PM");
  await expect(invitation.locator(".time-row")).toContainText("6:45 PM");
  await expect(invitation.locator(".marquee-strip")).toContainText(
    "NOVEMBER 4",
  );
  expect(
    await invitation.getByRole("timer").getAttribute("aria-label"),
  ).not.toBe(before);
  const download = invitation.waitForEvent("download");
  await invitation.getByRole("button", { name: "Add to calendar" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("racing-birthday-november-4.ics");
  const stream = await file.createReadStream();
  let content = "";
  for await (const chunk of stream!) content += chunk;
  expect(content).toContain("DTSTART:20261104T224500Z");
  expect(mock.saved()).toBe(1);
  await invitation.close();
});
test("mobile login and response cards are accessible without horizontal overflow", async ({
  page,
  context,
}) => {
  await mockControl(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("admin/");
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await login(page);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".admin-response-cards")).toBeVisible();
  await expect(page.locator(".admin-table-desktop")).toBeHidden();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test("empty state and fabricated client session never bypass authorization", async ({
  page,
  context,
}) => {
  await mockControl(context, true);
  await page.goto("admin/");
  await page.evaluate(() =>
    sessionStorage.setItem(
      "race-control-session-v1",
      JSON.stringify({
        token: "b".repeat(64),
        expires_at: new Date(Date.now() + 60000).toISOString(),
      }),
    ),
  );
  await page.reload();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Your session has expired. Please sign in again."),
  ).toBeVisible();
  await login(page);
  await expect(
    page.getByRole("heading", { name: "No responses yet" }),
  ).toBeVisible();
});
