import { expect, test } from "@playwright/test"

test("homepage links to login and signup", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "WealthPilot" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Get started" })).toBeVisible()
})

test("unauthenticated visitors are redirected away from the dashboard", async ({
  page,
}) => {
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/login/)
})

test("login form validates required fields", async ({ page }) => {
  await page.goto("/login")
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page.getByText(/invalid email/i)).toBeVisible()
})
