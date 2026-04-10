import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const RESULTS_DIR = path.resolve(ROOT, "sdd/99_toolchain/02_exactness/results");

test("FRT_005 signup type retains public structure and layout rhythm", async ({ page }) => {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  await page.goto("/signup", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "회원가입 유형 선택" })).toBeVisible();
  await expect(page.getByText("Template를 어떤 역할로 이용하실 건가요?")).toBeVisible();
  await expect(page.getByRole("link", { name: "로그인", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "회원가입", exact: true })).toBeVisible();

  const cards = page.locator("article[data-signup-type]");
  await expect(cards).toHaveCount(2);

  const sellerCard = page.locator('article[data-signup-type="seller"]');
  const dealerCard = page.locator('article[data-signup-type="dealer"]');

  await expect(sellerCard.getByRole("heading", { name: "판매자로 가입하기" })).toBeVisible();
  await expect(dealerCard.getByRole("heading", { name: "딜러로 가입하기" })).toBeVisible();
  await expect(sellerCard.getByText("차량번호 자동 조회")).toBeVisible();
  await expect(dealerCard.getByText("국내·국제 매물 입찰 가능")).toBeVisible();
  await expect(dealerCard.getByText("딜러 계정은 관리자 승인 후 활성화됩니다.")).toBeVisible();
  await expect(page.getByRole("link", { name: "로그인하기" })).toBeVisible();

  const boxes = await cards.evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
  );

  expect(boxes[0]).toBeTruthy();
  expect(boxes[1]).toBeTruthy();
  expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThanOrEqual(8);
  expect(Math.abs(boxes[0].width - boxes[1].width)).toBeLessThanOrEqual(24);

  const gap = boxes[1].x - (boxes[0].x + boxes[0].width);
  expect(gap).toBeGreaterThanOrEqual(12);
  expect(gap).toBeLessThanOrEqual(48);

  await page.screenshot({
    path: path.resolve(RESULTS_DIR, "frt-005-signup-type-playwright.png"),
    fullPage: true,
  });
});
