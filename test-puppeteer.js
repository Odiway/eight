// Quick test to check if Puppeteer is working
const puppeteer = require('puppeteer');

async function testPuppeteer() {
  console.log('Testing Puppeteer...');
  
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
    });

    console.log('Creating new page...');
    const page = await browser.newPage();

    console.log('Setting content...');
    await page.setContent('<html><body><h1>Test PDF</h1></body></html>');

    console.log('Generating PDF...');
    const pdf = await page.pdf({ format: 'A4' });

    console.log('PDF generated successfully! Size:', pdf.length, 'bytes');

    await browser.close();
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Puppeteer test failed:', error);
  }
}

testPuppeteer();
