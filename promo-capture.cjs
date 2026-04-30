const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function startStaticServer(root) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://127.0.0.1");
      const decodedPath = decodeURIComponent(url.pathname);
      const relative = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
      const filePath = path.resolve(root, relative);
      if (filePath !== root && !filePath.startsWith(root + path.sep)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      const data = await fs.readFile(filePath);
      res.writeHead(200, { "content-type": MIME[path.extname(filePath)] || "application/octet-stream" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function waitForSettled(page) {
  await page.waitForLoadState("load", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1400);
}

async function main() {
  const root = __dirname;
  const outDir = path.join(root, "promo-ppt", "images");
  await fs.mkdir(outDir, { recursive: true });

  const { server, origin } = await startStaticServer(root);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const url = `${origin}/index.html`;
  await page.goto(url);
  await waitForSettled(page);
  await page.waitForSelector(".home-container, .mode-selection, .mode-card", { timeout: 10000 }).catch(() => {});
  await page.screenshot({ path: path.join(outDir, "01-home.png"), fullPage: false });

  const cards = page.locator(".mode-card");
  if ((await cards.count()) > 0) {
    await cards.nth(0).click();
    await waitForSettled(page);
  } else {
    await page.goto(`${url}#/pages/game/qinglu`);
    await waitForSettled(page);
  }
  await page.screenshot({ path: path.join(outDir, "02-age-gate.png"), fullPage: false });
  const understood = page.getByText("已知悉");
  if ((await understood.count()) > 0) {
    await understood.click();
    await waitForSettled(page);
  }
  await page.screenshot({ path: path.join(outDir, "03-board.png"), fullPage: false });

  await browser.close();
  server.close();
  console.log(
    JSON.stringify(
      {
        ok: consoleErrors.length === 0 && pageErrors.length === 0,
        origin,
        title: await fs.readFile(path.join(root, "index.html"), "utf8").then((text) => text.match(/<title>(.*?)<\/title>/)?.[1]),
        consoleErrors,
        pageErrors,
        images: [
          path.join(outDir, "01-home.png"),
          path.join(outDir, "02-age-gate.png"),
          path.join(outDir, "03-board.png"),
        ],
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
