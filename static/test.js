"use strict";
const puppeteer = require("puppeteer");

let browser;

beforeAll(async () => {
  browser = await puppeteer.launch();
});

afterAll(() => {
  browser.close();
});

async function setCell(page, coord, formula) {
    const id = "#" + coord;
    await page.waitForSelector(id);
    await page.click(id);
    const uiCoord = await page.$eval("#coord", (coordInput) => coordInput.value);
    expect(uiCoord).toEqual(coord);
    await page.keyboard.press("Enter");
    await page.keyboard.type(new String(formula));
    await page.keyboard.press("Enter");
}

test("1+2", async () => {
    const page = await browser.newPage();
    await page.goto("http://localhost:8000");

    await setCell(page, "A1", 1);
    await setCell(page, "A3", "A1+A2");
    await setCell(page, "A2", 2);

    await page.waitForSelector("#A3");
    const valueA3 = await page.$eval("#A3", (td) => td.innerHTML);
    expect(valueA3).toEqual("3");
});
