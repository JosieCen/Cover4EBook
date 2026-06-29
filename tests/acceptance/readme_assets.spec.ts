import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";

const readmeAssetRoot = resolve("assets", "readme");
const fixtureRoot = resolve("tests", "fixtures", "readme_assets");
const secretGardenMood =
  "hidden garden, ivy-covered walls, antique key, old manor, soft spring light, mysterious but hopeful children's literature atmosphere.";

function assetPath(fileName: string) {
  return resolve(readmeAssetRoot, fileName);
}

function fixturePath(fileName: string) {
  return resolve(fixtureRoot, fileName);
}

async function openStudio(page: Page) {
  await page.goto("/");
  await page.getByTestId("preview-stage").waitFor();
  await expect(page).toHaveTitle(/Cover4EBook Studio/);
}

async function fillBookMetadata(page: Page) {
  await page.getByTestId("book-title-input").fill("The Secret Garden");
  await page.getByTestId("book-author-input").fill("Frances Hodgson Burnett");
}

async function uploadSecretGardenArtwork(page: Page, fileName: string) {
  await page.getByTestId("cover-source-mode").getByRole("button", { name: /Upload background/i }).click();
  await page.getByTestId("upload-background-input").setInputFiles(fixturePath(fileName));
  await expect(page.getByText(/Background ready/i)).toBeVisible();
  await expect(page.getByTestId("preview-stage-state")).toHaveText("preview-ready");
  await page.waitForTimeout(250);
}

async function applyTypography(
  page: Page,
  options: {
    titleColor: string;
    authorColor: string;
    layoutLabel: "Stacked Center" | "Low Center" | "Top Band" | "Author Forward";
    authorUppercase: boolean;
    titleFont: string;
    authorFont: string;
  },
) {
  await page.getByTestId("title-text-input").fill("The Secret\nGarden");
  await page.getByTestId("author-text-input").fill("Frances Hodgson Burnett");
  await page.getByRole("combobox", { name: "Font" }).nth(0).selectOption({ label: options.titleFont });
  await page.getByRole("combobox", { name: "Font" }).nth(1).selectOption({ label: options.authorFont });
  await page.getByTestId("title-color-input").fill(options.titleColor);
  await page.getByTestId("author-color-input").fill(options.authorColor);
  await page.getByRole("button", { name: new RegExp(options.layoutLabel, "i") }).click();

  const authorUppercaseToggle = page.getByRole("checkbox", { name: "Uppercase" }).nth(1);
  if ((await authorUppercaseToggle.isChecked()) !== options.authorUppercase) {
    await authorUppercaseToggle.click();
  }
}

test.describe.serial("README asset capture", () => {
  test.beforeAll(() => {
    mkdirSync(readmeAssetRoot, { recursive: true });
  });

  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.clear();
      window.indexedDB.deleteDatabase("cover4ebook_studio");
    });
  });

  test("captures hero and editor images from the Secret Garden demo state", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await openStudio(page);
    await fillBookMetadata(page);
    await uploadSecretGardenArtwork(page, "secret_garden_vintage_children.svg");
    await applyTypography(page, {
      titleColor: "#355236",
      authorColor: "#586147",
      layoutLabel: "Stacked Center",
      authorUppercase: false,
      titleFont: "Western Roman",
      authorFont: "Quiet Grotesk",
    });

    await page.getByTestId("preview-stage").click({ position: { x: 40, y: 40 } });
    await page.screenshot({ path: assetPath("hero.png") });

    await page.getByTestId("preview-title-layer").click();
    await page.screenshot({ path: assetPath("editor.png") });

  });

  test("captures the workflow illustration", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 840 });
    await page.setContent(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Cover4EBook Workflow</title>
          <style>
            :root {
              color-scheme: light;
              --bg: #f6efe4;
              --ink: #1d1b18;
              --muted: #6b665f;
              --panel: rgba(255, 250, 244, 0.88);
              --accent: #bf7b30;
              --line: #d9c5a8;
              --deep: #24373f;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              min-height: 100vh;
              font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
              background:
                radial-gradient(circle at top left, rgba(191, 123, 48, 0.18), transparent 32%),
                radial-gradient(circle at bottom right, rgba(36, 55, 63, 0.2), transparent 28%),
                linear-gradient(140deg, #f8f1e6 0%, #efe4d1 100%);
              color: var(--ink);
            }

            .frame {
              width: 1400px;
              height: 840px;
              padding: 56px;
            }

            .card {
              height: 100%;
              border: 1px solid rgba(36, 55, 63, 0.12);
              border-radius: 30px;
              background: var(--panel);
              box-shadow: 0 30px 60px rgba(36, 32, 25, 0.12);
              padding: 42px 42px 34px;
              display: flex;
              flex-direction: column;
              gap: 28px;
            }

            .eyebrow {
              text-transform: uppercase;
              letter-spacing: 0.22em;
              color: var(--accent);
              font-size: 13px;
              font-weight: 700;
            }

            h1 {
              margin: 0;
              font-size: 44px;
              line-height: 1.04;
              letter-spacing: -0.03em;
            }

            .subtitle {
              margin: 0;
              max-width: 760px;
              color: var(--muted);
              font-size: 18px;
              line-height: 1.5;
            }

            .steps {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 18px;
              align-items: stretch;
              margin-top: 8px;
            }

            .step {
              position: relative;
              border: 1px solid rgba(36, 55, 63, 0.1);
              border-radius: 24px;
              background: rgba(255, 255, 255, 0.72);
              padding: 24px 20px 22px;
              overflow: hidden;
            }

            .step::after {
              content: "";
              position: absolute;
              inset: auto -30px 50% auto;
              width: 60px;
              height: 2px;
              background: linear-gradient(90deg, var(--line), rgba(217, 197, 168, 0));
            }

            .step:last-child::after {
              display: none;
            }

            .step-number {
              width: 38px;
              height: 38px;
              border-radius: 999px;
              display: grid;
              place-items: center;
              background: var(--deep);
              color: #fff;
              font-size: 14px;
              font-weight: 700;
              margin-bottom: 18px;
            }

            .step h2 {
              margin: 0 0 10px;
              font-size: 22px;
              line-height: 1.1;
            }

            .step p {
              margin: 0;
              color: var(--muted);
              font-size: 15px;
              line-height: 1.55;
            }

            .footer {
              margin-top: auto;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-top: 8px;
              color: var(--muted);
              font-size: 15px;
            }

            .pill {
              border: 1px solid rgba(191, 123, 48, 0.18);
              border-radius: 999px;
              padding: 10px 16px;
              background: rgba(255, 255, 255, 0.58);
            }
          </style>
        </head>
        <body>
          <main class="frame">
            <section class="card">
              <div class="eyebrow">Cover4EBook Workflow</div>
              <h1>From story text to a finished cover file.</h1>
              <p class="subtitle">
                Build a cover for The Secret Garden from text or demo artwork, refine typography on the
                live canvas, and export a polished ebook cover without leaving the browser.
              </p>
              <div class="steps">
                <article class="step">
                  <div class="step-number">1</div>
                  <h2>Describe the book</h2>
                  <p>Start with a mood brief such as "${secretGardenMood}".</p>
                </article>
                <article class="step">
                  <div class="step-number">2</div>
                  <h2>Generate concepts</h2>
                  <p>Use AI generation or a local demo background to establish the visual direction.</p>
                </article>
                <article class="step">
                  <div class="step-number">3</div>
                  <h2>Edit typography</h2>
                  <p>Adjust title, author, font, color, alignment, position, and scale on the canvas.</p>
                </article>
                <article class="step">
                  <div class="step-number">4</div>
                  <h2>Export the result</h2>
                  <p>Download the finished cover as PNG, JPG, WebP, or PDF.</p>
                </article>
              </div>
              <div class="footer">
                <span>AI ebook cover studio for novels, ebooks, and serial fiction</span>
                <span class="pill">Prompt → Variants → Edit → Export</span>
              </div>
            </section>
          </main>
        </body>
      </html>
    `);

    await page.screenshot({ path: assetPath("workflow.png") });
  });
});
