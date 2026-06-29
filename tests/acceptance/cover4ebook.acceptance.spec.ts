import { expect, test, type Page } from "@playwright/test";

const screenshotRoot = "output/playwright/screenshots";

async function dragResizeHandle(page: Page, testId: string, deltaX: number, deltaY: number) {
  const handle = page.getByTestId(testId);
  const box = await handle.boundingBox();
  if (!box) {
    throw new Error(`Resize handle ${testId} is not visible.`);
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 12 });
  await page.mouse.up();
}

function uploadFixture() {
  return {
    name: "upload_fallback_cover.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAIAAAB7GkOtAAAFgElEQVR4nO3VMQEAIAzAMMC/5yFjRxMFPXpm5gBA1w4A4EwAANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIANABAIA9A2ZowABg0jgLwAAAABJRU5ErkJggg==",
      "base64",
    ),
  };
}

async function warmGenerateCoverRoute(page: Page) {
  const response = await page.request.post("http://127.0.0.1:3100/api/generate-cover", {
    data: {
      title: "Warm Route",
      author: "Warm Route",
      sourceMode: "story_mood",
      sourceText:
        "A quick warm-up request so the development API route is compiled before the visual acceptance flow begins.",
      artDirectionPresetId: "woodcut_noir",
      customStylePrompt: "",
      variantCount: 1,
    },
  });

  expect(response.ok()).toBe(true);
}

test.describe("Cover4EBook browser acceptance", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addInitScript(() => {
      window.localStorage.clear();
      window.indexedDB.deleteDatabase("cover4ebook_studio");
    });
    await warmGenerateCoverRoute(page);
    await page.goto("/");
    await page.getByTestId("preview-stage").waitFor();
  });

  test("captures homepage, generated, edited, and export states", async ({ page }) => {
    await expect(page).toHaveTitle(/Cover4EBook Studio/);
    await page.screenshot({ path: `${screenshotRoot}/home_page.png`, fullPage: true });

    await page.getByTestId("book-title-input").fill("The Last Lighthouse");
    await page.getByTestId("book-author-input").fill("Evelyn Marlowe");
    await page.getByTestId("source-text-input").fill(
      "Melancholic, windswept, and hopeful. A lone lighthouse faces a storm-bound sea, with resilience and human warmth at the center.",
    );

    await page.getByTestId("generate-covers-button").click();
    await expect(page.locator("[data-testid^='variant-card-']")).toHaveCount(3);
    await expect(page.getByTestId("preview-stage-state")).toHaveText("preview-ready");
    await page.screenshot({ path: `${screenshotRoot}/generation_page.png`, fullPage: true });

    await page.getByTestId("title-text-input").fill("The\nLighthouse\nArchive");
    await page.getByTestId("author-text-input").fill("Evelyn\nMarlowe");
    await page.getByTestId("title-color-input").fill("#d4a24e");
    await page.getByTestId("preview-title-layer").click();
    await dragResizeHandle(page, "preview-title-resize", 56, 42);
    await page.screenshot({ path: `${screenshotRoot}/editing_page.png`, fullPage: true });

    await page.getByTestId("export-format-pdf").click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-cover-button").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/the_last_lighthouse|cover_export/i);
    await page.screenshot({ path: `${screenshotRoot}/export_page.png`, fullPage: true });
  });

  test("keeps upload fallback mode working without the API", async ({ page }) => {
    await page.getByTestId("cover-source-mode").getByRole("button", { name: /Upload background/i }).click();
    await page.getByTestId("upload-background-input").setInputFiles(uploadFixture());
    await expect(page.getByText(/Background ready/i)).toBeVisible();
    await expect(page.getByTestId("preview-stage-state")).toHaveText("preview-ready");
    await page.screenshot({ path: `${screenshotRoot}/upload_background_page.png`, fullPage: true });
  });
});
