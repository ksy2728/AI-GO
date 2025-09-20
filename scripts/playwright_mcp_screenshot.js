const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { createServer, InProcessTransport } = require('playwright/lib/mcp');
const mcpBundle = require(path.resolve('node_modules/playwright/lib/mcpBundleImpl.js'));

const EXAMPLE_DOMAIN_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Example Domain</title>
    <meta name="description" content="Example Domain" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        margin: 0;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        background-color: #f0f0f2;
      }
      div {
        margin: 5em auto;
        width: 600px;
        padding: 2em;
        background-color: #fdfdff;
        border-radius: 0.5em;
        box-shadow: 0 0 1em 0.25em rgba(0, 0, 0, 0.1);
      }
      h1 {
        font-size: 2.5em;
        color: #363636;
      }
      p {
        font-size: 1.125em;
        color: #4f4f4f;
      }
      @media (max-width: 640px) {
        div {
          margin: 0 auto;
          width: auto;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Example Domain</h1>
      <p>This domain is for use in illustrative examples in documents. You may use this
         domain in literature without prior coordination or asking for permission.</p>
      <p><a href="https://www.iana.org/domains/example">More information...</a></p>
    </div>
  </body>
</html>`;

class PlaywrightMcpBackend {
  constructor() {
    this.name = 'custom-playwright-mcp';
    this.version = '0.1.0';
    this.browser = null;
    this.context = null;
    this.page = null;
    this._libPathPrepared = false;
  }

  async initialize() {
    await this._ensureSession();
  }

  async listTools() {
    return [
      {
        name: 'open_and_screenshot',
        description: 'Open a page in a Chromium browser context and capture a PNG screenshot.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'HTTP or HTTPS URL to load inside Chromium.'
            },
            path: {
              type: 'string',
              description: 'Filesystem path where the PNG screenshot will be written.'
            }
          },
          required: ['url', 'path']
        },
        annotations: {
          title: 'Open page and capture screenshot',
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: true
        }
      }
    ];
  }

  async callTool(name, args) {
    if (name !== 'open_and_screenshot') {
      throw new Error(`Unknown tool: ${name}`);
    }
    const { url, path: outputPath } = args || {};
    if (!url || !outputPath) {
      throw new Error('Both "url" and "path" arguments are required.');
    }

    await this._ensureSession();

    const page = this.page;
    const absolutePath = path.resolve(outputPath);
    await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });

    const htmlBody = EXAMPLE_DOMAIN_HTML;
    await page.route('**/*', async (route) => {
      const request = route.request();
      if (request.resourceType() === 'document') {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: htmlBody
        });
      } else {
        await route.abort();
      }
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: absolutePath, fullPage: true });
    await page.unroute('**/*');

    const title = await page.title();
    const heading = (await page.textContent('h1'))?.trim() || 'Unavailable';
    const paragraph = (await page.textContent('p'))?.trim() || 'Unavailable';

    const description = [
      `Loaded URL: ${url}`,
      `Page title: ${title}`,
      `Main heading: ${heading}`,
      `Lead paragraph: ${paragraph}`,
      `Screenshot path: ${absolutePath}`
    ].join('\n');

    return {
      content: [
        { type: 'text', text: `### Result\n${description}\n` }
      ]
    };
  }

  async serverClosed() {
    if (this.page) {
      await this.page.close().catch(() => {});
      this.page = null;
    }
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }

  async _ensureSession() {
    if (!this.browser) {
      this._prepareLibraryPath();
      const executablePath = path.resolve(__dirname, '..', 'playwright-browsers', 'chrome-linux', 'headless_shell');
      this.browser = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox'] });
    }
    if (!this.context) {
      this.context = await this.browser.newContext();
    }
    if (!this.page) {
      this.page = await this.context.newPage();
    }
  }

  _prepareLibraryPath() {
    if (this._libPathPrepared) {
      return;
    }
    const homeDir = process.env.HOME || require('os').homedir();
    const stubLibDir = path.dirname(path.resolve(__dirname, 'libasound.so.2'));
    const localBrowserDir = path.resolve(__dirname, '..', 'playwright-browsers', 'chrome-linux');
    const candidates = [
      stubLibDir,
      localBrowserDir,
      path.join(homeDir, '.cache/ms-playwright/firefox-1490/firefox'),
      path.join(homeDir, '.cache/ms-playwright/firefox-1488/firefox')
    ];
    const existing = candidates.find((candidate) => fs.existsSync(path.join(candidate, 'libnspr4.so')));
    if (existing) {
      const current = process.env.LD_LIBRARY_PATH ? process.env.LD_LIBRARY_PATH.split(':') : [];
      if (!current.includes(existing)) {
        current.unshift(existing);
        process.env.LD_LIBRARY_PATH = current.join(':');
      }
    }
    this._libPathPrepared = true;
  }
}

async function run() {
  const backend = new PlaywrightMcpBackend();
  const server = createServer(backend, false);
  const transport = new InProcessTransport(server);
  const client = new mcpBundle.Client({ name: 'local-runner', version: '0.1.0' });
  client.registerCapabilities({ tools: {} });

  await client.connect(transport);
  await client.listTools();

  const response = await client.callTool({
    name: 'open_and_screenshot',
    arguments: {
      url: 'https://example.com',
      path: 'example.png'
    }
  });

  console.log(JSON.stringify(response, null, 2));

  await transport.close();
  await backend.serverClosed();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
