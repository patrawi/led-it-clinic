import puppeteer from "puppeteer";
import http from "https";
import dotenv from "dotenv";
dotenv.config();

async function notify_message(message) {
  const content = message.join("\n") ? "" : "ไม่มีงานใหม่";
  const currentDate = new Date().toLocaleString("th-TH");

  const form = new FormData();
  form.set("message", `${currentDate} ${content}`);
  const res = await fetch("https://notify-api.line.me/api/notify", {
    body: form,
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TOKEN}`,
    },
  });
  if (res.status !== 200) {
    console.error(res);
  }
}
(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto(process.env.LED_URL);

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });
  await page.type('input[name="User"]', process.env.USERNAME);
  await page.type('input[name="Password"]', process.env.PASSWORD);
  const captchaImageElements = await page.$$(".portfolio-item2 div");

  // Get the CAPTCHA characters.
  const captchaCharacters = [];
  for (const captchaImageElement of captchaImageElements) {
    // Get the CAPTCHA character from the image element's class name.
    const data = await (
      await captchaImageElement.getProperty("className")
    ).jsonValue();
    const captchaCharacter = data.split("ch")[1];

    captchaCharacters.push(captchaCharacter);
  }
  await page.type('input[name="characters"]', captchaCharacters.join(""));
  await page.click('input[name="Action"]');
  // Wait and click on first result
  const searchResultSelector = "#alertsDropdown > .fa-bell";
  await page.waitForSelector(searchResultSelector);
  await page.click(searchResultSelector);

  const content = ".textdes";
  const jobs = [];
  const data = await page.$$(content);
  for (const e of data) {
    const text = await page.evaluate((el) => el.textContent, e);
    jobs.push(text.split(" ").join(""));
  }
  try {
    await notify_message(jobs);
  } catch (e) {
    console.error(e);
  }
  await browser.close();
})();
