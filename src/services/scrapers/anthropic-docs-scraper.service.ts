import { chromium, Browser, Page } from 'playwright';
import { logger } from '@/utils/logger';
import { cache } from '@/lib/redis';

export interface AnthropicModelData {
  modelId: string;
  modelName: string;
  description?: string;
  contextWindow: number;
  maxOutputTokens: number;
  inputPrice: number;  // per 1M tokens
  outputPrice: number; // per 1M tokens
  capabilities: string[];
  releasedAt?: Date;
  dataSource: 'structured' | 'dom' | 'api';
  confidence: number;
  scrapedAt: Date;
  sourceUrl: string;
}

export class AnthropicDocsScraper {
  private browser: Browser | null = null;
  private readonly DOCS_URL = 'https://docs.anthropic.com/claude/docs/models-overview';
  private readonly API_DOCS_URL = 'https://docs.anthropic.com/claude/reference/models';

  /**
   * Main entry point for scraping Anthropic docs
   */
  async scrapeModels(): Promise<AnthropicModelData[]> {
    const cacheKey = 'anthropic:scraped-models';
    const cached = await cache.get<AnthropicModelData[]>(cacheKey);

    // Use cache if less than 1 hour old
    if (cached && cached[0]?.scrapedAt &&
        new Date(cached[0].scrapedAt).getTime() > Date.now() - 3600000) {
      logger.info('Using cached Anthropic model data');
      return cached;
    }

    try {
      // 1. Try Playwright to get __NEXT_DATA__
      const playwrightData = await this.scrapeWithPlaywright();
      if (playwrightData && playwrightData.length > 0) {
        await cache.set(cacheKey, playwrightData, 3600);
        return playwrightData;
      }

      // 2. Try to fetch and parse HTML
      const htmlData = await this.scrapeFromHTML();
      if (htmlData && htmlData.length > 0) {
        await cache.set(cacheKey, htmlData, 3600);
        return htmlData;
      }

      throw new Error('Unable to fetch Anthropic models from any source');
    } catch (error) {
      logger.error('Failed to scrape Anthropic docs:', error);
      throw error;
    }
  }

  /**
   * Scrape using Playwright to access __NEXT_DATA__
   */
  private async scrapeWithPlaywright(): Promise<AnthropicModelData[] | null> {
    let page: Page | null = null;

    try {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      page = await this.browser.newPage();

      // Navigate to the docs page
      await page.goto(this.DOCS_URL, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Extract __NEXT_DATA__ or other structured data
      const structuredData = await page.evaluate(() => {
        // Try __NEXT_DATA__ first
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
          try {
            return JSON.parse(nextDataScript.textContent || '{}');
          } catch (e) {
            console.error('Failed to parse __NEXT_DATA__:', e);
          }
        }

        // Try window object for data
        if ((window as any).__ANTHROPIC_MODELS__) {
          return (window as any).__ANTHROPIC_MODELS__;
        }

        // Try to extract from React props
        const reactRoot = document.querySelector('#__next') || document.querySelector('#root');
        if (reactRoot && (reactRoot as any)._reactRootContainer) {
          try {
            const fiber = (reactRoot as any)._reactRootContainer._internalRoot;
            if (fiber?.current?.memoizedProps?.pageProps) {
              return fiber.current.memoizedProps.pageProps;
            }
          } catch (e) {
            console.error('Failed to extract React props:', e);
          }
        }

        return null;
      });

      if (structuredData) {
        const models = this.parseNextData(structuredData);
        if (models && models.length > 0) {
          return models;
        }
      }

      // Fallback to DOM scraping
      const domData = await page.evaluate(() => {
        const models: any[] = [];

        // Look for model tables
        const tables = document.querySelectorAll('table, [role="table"]');
        tables.forEach(table => {
          const headers = Array.from(table.querySelectorAll('th, [role="columnheader"]'))
            .map(th => th.textContent?.trim().toLowerCase());

          const modelIndex = headers.findIndex(h => h?.includes('model'));
          const contextIndex = headers.findIndex(h => h?.includes('context'));
          const outputIndex = headers.findIndex(h => h?.includes('output'));
          const priceIndex = headers.findIndex(h => h?.includes('price') || h?.includes('cost'));

          const rows = table.querySelectorAll('tr, [role="row"]');
          rows.forEach((row, rowIndex) => {
            if (rowIndex === 0) return; // Skip header row

            const cells = row.querySelectorAll('td, [role="cell"]');
            if (cells.length > 0) {
              const modelData: any = {};

              if (modelIndex >= 0) modelData.name = cells[modelIndex]?.textContent?.trim();
              if (contextIndex >= 0) modelData.context = cells[contextIndex]?.textContent?.trim();
              if (outputIndex >= 0) modelData.output = cells[outputIndex]?.textContent?.trim();
              if (priceIndex >= 0) modelData.price = cells[priceIndex]?.textContent?.trim();

              // Look for pricing in separate columns
              cells.forEach((cell, i) => {
                const text = cell.textContent?.trim().toLowerCase() || '';
                if (text.includes('$') && text.includes('input')) {
                  modelData.inputPrice = cell.textContent?.trim();
                }
                if (text.includes('$') && text.includes('output')) {
                  modelData.outputPrice = cell.textContent?.trim();
                }
              });

              if (modelData.name) {
                models.push(modelData);
              }
            }
          });
        });

        // Look for model cards
        const cards = document.querySelectorAll('[data-model], .model-card, .model-info');
        cards.forEach(card => {
          const modelData: any = {};

          // Extract from data attributes
          if (card.hasAttribute('data-model')) {
            modelData.id = card.getAttribute('data-model');
          }

          // Extract from text content
          const title = card.querySelector('h2, h3, .title, .model-name');
          if (title) modelData.name = title.textContent?.trim();

          const description = card.querySelector('.description, .model-description, p');
          if (description) modelData.description = description.textContent?.trim();

          // Look for specs
          const specs = card.querySelectorAll('.spec, .feature, li');
          specs.forEach(spec => {
            const text = spec.textContent?.trim().toLowerCase() || '';
            if (text.includes('context') || text.includes('token')) {
              modelData.context = spec.textContent?.trim();
            }
            if (text.includes('output')) {
              modelData.output = spec.textContent?.trim();
            }
            if (text.includes('$') || text.includes('price')) {
              modelData.price = spec.textContent?.trim();
            }
          });

          if (modelData.name || modelData.id) {
            models.push(modelData);
          }
        });

        return models;
      });

      return this.transformScrapedData(domData, 'dom');
    } catch (error) {
      logger.error('Playwright scraping failed:', error);
      return null;
    } finally {
      if (page) await page.close();
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }

  /**
   * Scrape from static HTML
   */
  private async scrapeFromHTML(): Promise<AnthropicModelData[] | null> {
    try {
      const response = await fetch(this.DOCS_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Try to extract model information from HTML
      const models: AnthropicModelData[] = [];

      // Pattern for Claude model mentions
      const modelPattern = /claude-[\w\.-]+/gi;
      const matches = Array.from(html.matchAll(modelPattern));
      const uniqueModelIds = [...new Set(matches.map(m => m[0].toLowerCase()))];

      uniqueModelIds.forEach(modelId => {
        // Extract context around model mentions
        const contextPattern = new RegExp(
          `${modelId}[^<]*?(?:context|token|window)[^<]*?(\\d+[kK]?)`,
          'gi'
        );
        const contextMatch = html.match(contextPattern);

        const pricePattern = new RegExp(
          `${modelId}[^$]*?\\$([\\d.]+)[^$]*?\\$([\\d.]+)`,
          'gi'
        );
        const priceMatch = html.match(pricePattern);

        models.push({
          modelId: modelId,
          modelName: this.formatModelName(modelId),
          description: this.inferDescription(modelId),
          contextWindow: this.parseContextWindow(contextMatch?.[1]),
          maxOutputTokens: this.inferMaxOutput(modelId),
          inputPrice: this.parsePrice(priceMatch?.[1]),
          outputPrice: this.parsePrice(priceMatch?.[2]),
          capabilities: this.inferCapabilities(modelId),
          dataSource: 'dom',
          confidence: 0.6,
          scrapedAt: new Date(),
          sourceUrl: this.DOCS_URL
        });
      });

      return models.length > 0 ? models : null;
    } catch (error) {
      logger.warn('HTML scraping failed:', error);
      return null;
    }
  }

  /**
   * Parse __NEXT_DATA__ structure
   */
  private parseNextData(data: any): AnthropicModelData[] | null {
    try {
      const models: AnthropicModelData[] = [];
      const pageProps = data?.props?.pageProps;

      // Look for models in various possible locations
      const modelData = pageProps?.models ||
                       pageProps?.data?.models ||
                       pageProps?.modelData ||
                       data?.models;

      if (modelData) {
        if (Array.isArray(modelData)) {
          modelData.forEach(model => {
            models.push(this.transformModelData(model, 'structured'));
          });
        } else if (typeof modelData === 'object') {
          Object.entries(modelData).forEach(([key, value]: [string, any]) => {
            models.push(this.transformModelData({ id: key, ...value }, 'structured'));
          });
        }
      }

      // Also check for pricing data separately
      const pricingData = pageProps?.pricing || pageProps?.pricingData;
      if (pricingData && models.length > 0) {
        models.forEach(model => {
          const pricing = pricingData[model.modelId] ||
                         pricingData.find((p: any) => p.model === model.modelId);
          if (pricing) {
            model.inputPrice = this.parsePrice(pricing.input || pricing.inputPrice);
            model.outputPrice = this.parsePrice(pricing.output || pricing.outputPrice);
          }
        });
      }

      return models.length > 0 ? models : null;
    } catch (error) {
      logger.error('Failed to parse __NEXT_DATA__:', error);
      return null;
    }
  }

  /**
   * Transform scraped data to our format
   */
  private transformScrapedData(rawData: any[], source: 'dom' | 'structured'): AnthropicModelData[] {
    return rawData.map(item => this.transformModelData(item, source))
      .filter(model => model.modelId && model.modelId.includes('claude'));
  }

  /**
   * Transform individual model data
   */
  private transformModelData(item: any, source: 'dom' | 'structured'): AnthropicModelData {
    const modelId = item.id || item.modelId || this.extractModelId(item.name);

    return {
      modelId: modelId,
      modelName: item.name || this.formatModelName(modelId),
      description: item.description || this.inferDescription(modelId),
      contextWindow: this.parseContextWindow(item.context || item.contextWindow),
      maxOutputTokens: this.parseOutputTokens(item.output || item.maxOutput) || this.inferMaxOutput(modelId),
      inputPrice: this.parsePrice(item.inputPrice || item.price),
      outputPrice: this.parsePrice(item.outputPrice || item.price),
      capabilities: item.capabilities || this.inferCapabilities(modelId),
      releasedAt: item.released ? new Date(item.released) : undefined,
      dataSource: source,
      confidence: source === 'structured' ? 0.95 : 0.7,
      scrapedAt: new Date(),
      sourceUrl: this.DOCS_URL
    };
  }

  /**
   * Helper: Extract model ID from name
   */
  private extractModelId(name: string): string {
    const match = name.match(/claude-[\w\.-]+/i);
    return match ? match[0].toLowerCase() : name.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Helper: Format model name
   */
  private formatModelName(modelId: string): string {
    return modelId
      .replace(/claude-/g, 'Claude ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Helper: Infer description from model ID
   */
  private inferDescription(modelId: string): string {
    const id = modelId.toLowerCase();

    if (id.includes('opus')) return 'Most capable model for highly complex tasks';
    if (id.includes('sonnet')) return 'Balanced performance and speed';
    if (id.includes('haiku')) return 'Fastest and most compact model';
    if (id.includes('3-5')) return 'Latest generation with enhanced capabilities';
    if (id.includes('instant')) return 'Fast responses for simple tasks';

    return 'Claude AI model';
  }

  /**
   * Helper: Parse context window
   */
  private parseContextWindow(contextStr: any): number {
    if (typeof contextStr === 'number') return contextStr;
    if (!contextStr) return 200000; // Claude default

    const str = String(contextStr).toLowerCase();
    const match = str.match(/(\d+)([km]?)/);

    if (match) {
      let value = parseInt(match[1]);
      if (match[2] === 'k') value *= 1000;
      if (match[2] === 'm') value *= 1000000;
      return value;
    }

    return 200000; // Default
  }

  /**
   * Helper: Parse output tokens
   */
  private parseOutputTokens(outputStr: any): number {
    if (typeof outputStr === 'number') return outputStr;
    if (!outputStr) return 0;

    const str = String(outputStr).toLowerCase();
    const match = str.match(/(\d+)([km]?)/);

    if (match) {
      let value = parseInt(match[1]);
      if (match[2] === 'k') value *= 1000;
      return value;
    }

    return 0;
  }

  /**
   * Helper: Infer max output tokens
   */
  private inferMaxOutput(modelId: string): number {
    const id = modelId.toLowerCase();

    if (id.includes('3-5-sonnet') || id.includes('3-5-haiku')) return 8192;
    if (id.includes('opus') || id.includes('sonnet')) return 4096;
    if (id.includes('haiku')) return 4096;
    if (id.includes('instant')) return 4096;

    return 4096; // Default
  }

  /**
   * Helper: Parse price to number
   */
  private parsePrice(priceStr: any): number {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;

    const cleaned = String(priceStr)
      .replace(/[^0-9.]/g, '')
      .replace(/^\./, '0.');

    const price = parseFloat(cleaned);

    // Convert to per million tokens if needed
    if (price < 1) {
      return price * 1000; // Assuming it was per 1K tokens
    }

    return price;
  }

  /**
   * Helper: Infer capabilities
   */
  private inferCapabilities(modelId: string): string[] {
    const capabilities = ['chat', 'analysis', 'coding'];
    const id = modelId.toLowerCase();

    if (id.includes('3-5-sonnet') && id.includes('20241022')) {
      capabilities.push('computer-use', 'vision');
    } else if (id.includes('3-5-haiku') && id.includes('20241022')) {
      capabilities.push('vision');
    }

    if (id.includes('opus')) {
      capabilities.push('creative-writing', 'vision', 'complex-reasoning');
    }

    if (id.includes('sonnet') || id.includes('haiku')) {
      capabilities.push('vision');
    }

    return capabilities;
  }
}