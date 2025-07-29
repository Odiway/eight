// Test the updated PDF system with Vercel Chromium
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

async function testVercelPuppeteer() {
  console.log('Testing Vercel-compatible Puppeteer setup...');
  
  try {
    console.log('Launching browser with Chromium...');
    const browser = await puppeteer.launch({
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: { width: 1200, height: 1600 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    console.log('Creating new page...');
    const page = await browser.newPage();

    console.log('Setting content...');
    await page.setContent(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1565c0; }
          </style>
        </head>
        <body>
          <h1>Vercel PDF Test</h1>
          <p>This is a test of the Vercel-compatible PDF generation system.</p>
          <p>Turkish characters: ğüşıöçĞÜŞİÖÇ</p>
        </body>
      </html>
    `, { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('Generating PDF...');
    const pdf = await page.pdf({ format: 'A4', printBackground: true });

    console.log('PDF generated successfully! Size:', pdf.length, 'bytes');

    await browser.close();
    console.log('Vercel Puppeteer test completed successfully!');
  } catch (error) {
    console.error('Vercel Puppeteer test failed:', error);
  }
}

testVercelPuppeteer();
