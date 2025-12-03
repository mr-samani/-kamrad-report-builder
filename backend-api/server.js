const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Cache برای بهبود عملکرد
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقیقه

// Pool برای browser instances
let browserPool = [];
const MAX_BROWSERS = 3;

/**
 * ایجاد یا گرفتن browser instance از pool
 */
async function getBrowser() {
  if (browserPool.length > 0) {
    return browserPool.pop();
  }

  return await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });
}

/**
 * برگرداندن browser به pool
 */
function releaseBrowser(browser) {
  if (browserPool.length < MAX_BROWSERS) {
    browserPool.push(browser);
  } else {
    browser.close();
  }
}

/**
 * Endpoint اصلی برای رندر کردن صفحات
 */
app.post('/api/render', async (req, res) => {
  // console.log(req.query);
  const { url, waitForSelector, waitTime = 3000 } = req.body;
  //const { url, waitForSelector, waitTime = 30000 } = req.query;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL الزامی است',
    });
  }

  // بررسی cache
  const cacheKey = `${url}_${waitForSelector}_${waitTime}`;
  const cachedResult = cache.get(cacheKey);

  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
    console.log('Returning from cache:', url);
    return res.json(cachedResult.data);
  }

  let browser;
  let page;

  try {
    console.log('Rendering:', url);
    browser = await getBrowser();
    page = await browser.newPage();

    // تنظیمات page
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // بلاک کردن منابع غیر ضروری برای سرعت بیشتر
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // رفتن به صفحه
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // منتظر ماندن برای selector خاص (اختیاری)
    if (waitForSelector) {
      try {
        await page.waitForSelector(waitForSelector, {
          timeout: waitTime,
        });
      } catch (e) {
        console.warn(`Selector ${waitForSelector} not found, continuing...`);
      }
    } else {
      // منتظر ماندن عمومی برای رندر شدن
      // await page.waitForTimeout(waitTime);
      await page.waitForResponse(url, {
        timeout: waitTime,
      });
    }

    // گرفتن HTML رندر شده
    const html = await page.content();

    // ذخیره در cache
    const result = {
      success: true,
      html: html,
      url: url,
    };

    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    res.json(result);
    // res.contentType('html');
    // res.set(result);
  } catch (error) {
    console.error('Error rendering page:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    if (page) await page.close();
    if (browser) releaseBrowser(browser);
  }
});

/**
 * Endpoint برای گرفتن HTML و یک selector خاص
 */
app.post('/api/render-selector', async (req, res) => {
  const { url, querySelector, waitTime = 3000 } = req.body;

  if (!url || !querySelector) {
    return res.status(400).json({
      success: false,
      error: 'URL و querySelector الزامی هستند',
    });
  }

  let browser;
  let page;

  try {
    browser = await getBrowser();
    page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // منتظر selector
    await page.waitForSelector(querySelector, {
      timeout: waitTime,
    });

    // گرفتن HTML المنت خاص
    const elementHtml = await page.$eval(querySelector, (el) => el.outerHTML);

    // گرفتن استایل‌های computed
    const styles = await page.$eval(querySelector, (el) => {
      const computed = window.getComputedStyle(el);
      const styleObj = {};
      for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        styleObj[prop] = computed.getPropertyValue(prop);
      }
      return styleObj;
    });

    res.json({
      success: true,
      html: elementHtml,
      styles: styles,
      url: url,
    });
  } catch (error) {
    console.error('Error rendering selector:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    if (page) await page.close();
    if (browser) releaseBrowser(browser);
  }
});

/**
 * Endpoint برای اسکرین‌شات (bonus!)
 */
app.post('/api/screenshot', async (req, res) => {
  const { url, selector, fullPage = false } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL الزامی است',
    });
  }

  let browser;
  let page;

  try {
    browser = await getBrowser();
    page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    let screenshotBuffer;

    if (selector) {
      const element = await page.$(selector);
      if (element) {
        screenshotBuffer = await element.screenshot();
      } else {
        throw new Error('Selector پیدا نشد');
      }
    } else {
      screenshotBuffer = await page.screenshot({ fullPage });
    }

    res.set('Content-Type', 'image/png');
    res.send(screenshotBuffer);
  } catch (error) {
    console.error('Error taking screenshot:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    if (page) await page.close();
    if (browser) releaseBrowser(browser);
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    browsers: browserPool.length,
    cache: cache.size,
  });
});

/**
 * پاک کردن cache
 */
app.post('/api/clear-cache', (req, res) => {
  cache.clear();
  res.json({
    success: true,
    message: 'Cache cleared',
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing browsers...');
  await Promise.all(browserPool.map((browser) => browser.close()));
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 SPA Renderer API running on port ${PORT}`);
  console.log(`📝 Endpoints:`);
  console.log(`     Render fullpage: POST /api/render`);
  console.log(`     Render special selector: POST /api/render-selector`);
  console.log(`     Take screenshot: POST /api/screenshot`);
  console.log(`     Check Server status: GET  /health`);
});
