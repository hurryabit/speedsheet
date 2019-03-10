"use strict";
const puppeteer = require("puppeteer");
const { spawn } = require('child_process');

const port = 7777;
let server;
let browser;

beforeAll(async () => {
  let env = process.env;
  let args = [];
  if (env.NO_CHROME_SANDBOX === "1") {
    process.stderr.write("\x1b[31m\x1b[1mDisabling Chrome sandbox. This is DANGEROUS!\x1b[0m");
    args = ["--no-sandbox"];
  }
  env.ROCKET_PORT = port;
  server = spawn("cargo", ["run"], {
    env: env,
    stdio: "inherit",
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
  browser = await puppeteer.launch({ args: args })
    .catch((error) => {
      console.error(error);
      Promise.reject(error);
    });
});

afterAll(() => {
  browser.close();
  server.kill("SIGTERM");
});

async function setCell(page, coord, formula) {
    const id = "#" + coord;
    await page.waitForSelector(id);
    await page.click(id);
    const uiCoord = await page.evaluate(() => document.activeElement.id);
    expect(uiCoord).toEqual(coord);
    await page.keyboard.press("Enter");
    await page.keyboard.type(new String(formula));
    await page.keyboard.press("Enter");
}

test("1+2", async () => {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}`);

    await setCell(page, "A1", 1);
    await setCell(page, "A3", "A1+A2");
    await setCell(page, "A2", 2);

    await page.waitForSelector("#A3");
    const valueA3 = await page.$eval("#A3", (td) => td.innerHTML);
    expect(valueA3).toEqual("3");
});
