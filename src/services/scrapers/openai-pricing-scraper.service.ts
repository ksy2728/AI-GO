import { chromium, Browser, Page } from 'playwright';
import { logger } from '@/utils/logger';
import { cache } from '@/lib/redis';

export interface OpenAIPricingData {
  modelId: string;
  modelName: string;
  inputPrice: number;  // per 1M tokens
  outputPrice: number; // per 1M tokens
  contextWindow?: number;
  trainingCutoff?: string;
  capabilities?: string[];
  dataSource: 'structured' | 'dom' | 'api';
  confidence: number;
  scrapedAt: Date;
  sourceUrl: string;
}

export class OpenAIPricingScraper {
  private browser: Browser | null = null;
  private readonly PRICING_URL = 'https://openai.com/pricing';
  private readonly API_PRICING_URL = 'https://openai.com/api/pricing/';

  /**
   * Main entry point for scraping OpenAI pricing
   */
  async scrapePricing(): Promise<OpenAIPricingData[]> {
    const cacheKey = 'openai:scraped-pricing';
    const cached = await cache.get<OpenAIPricingData[]>(cacheKey);

    // Use cache if less than 1 hour old
    if (cached && cached[0]?.scrapedAt &&
        new Date(cached[0].scrapedAt).getTime() > Date.now() - 3600000) {
      logger.info('Using cached OpenAI pricing data');
      return cached;
    }

    try {
      // 1. Try to fetch structured data first
      const structuredData = await this.fetchStructuredData();
      if (structuredData && structuredData.length > 0) {
        await cache.set(cacheKey, structuredData, 3600); // Cache for 1 hour
        return structuredData;
      }

      // 2. Fallback to Playwright scraping
      const scrapedData = await this.scrapeWithPlaywright();
      if (scrapedData && scrapedData.length > 0) {
        await cache.set(cacheKey, scrapedData, 3600);
        return scrapedData;
      }

      // 3. Last resort: use API endpoint if available
      const apiData = await this.fetchFromAPI();
      if (apiData && apiData.length > 0) {
        await cache.set(cacheKey, apiData, 3600);
        return apiData;
      }

      throw new Error('Unable to fetch OpenAI pricing from any source');
    } catch (error) {
      logger.error('Failed to scrape OpenAI pricing:', error);
      throw error;
    }
  }

  /**
   * Try to fetch structured data from the page
   */
  private async fetchStructuredData(): Promise<OpenAIPricingData[] | null> {
    try {
      const response = await fetch(this.PRICING_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Look for JSON-LD structured data
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
      if (jsonLdMatch) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1]);
          return this.parseJsonLd(jsonLd);
        } catch (e) {
          logger.warn('Failed to parse JSON-LD:', e);
        }
      }

      // Look for __NEXT_DATA__ (Next.js sites)
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
      if (nextDataMatch) {
        try {
          const nextData = JSON.parse(nextDataMatch[1]);
          return this.parseNextData(nextData);
        } catch (e) {
          logger.warn('Failed to parse __NEXT_DATA__:', e);
        }
      }

      return null;
    } catch (error) {
      logger.warn('Failed to fetch structured data:', error);
      return null;
    }
  }

  /**
   * Scrape using Playwright for dynamic content
   */
  private async scrapeWithPlaywright(): Promise<OpenAIPricingData[] | null> {
    let page: Page | null = null;

    try {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      page = await this.browser.newPage();
      await page.goto(this.PRICING_URL, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for pricing table to load
      await page.waitForSelector('[data-pricing-table], .pricing-table, table', {
        timeout: 10000
      }).catch(() => null);

      // Extract pricing data from the page
      const pricingData = await page.evaluate(() => {
        const data: any[] = [];

        // Try to find pricing data in window object
        if ((window as any).__PRICING_DATA__) {
          return (window as any).__PRICING_DATA__;
        }

        // Parse pricing tables
        const tables = document.querySelectorAll('table, [role="table"]');
        tables.forEach(table => {
          const rows = table.querySelectorAll('tr, [role="row"]');
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, [role="cell"]');
            if (cells.length >= 3) {
              const modelName = cells[0]?.textContent?.trim();
              const inputPrice = cells[1]?.textContent?.trim();
              const outputPrice = cells[2]?.textContent?.trim();

              if (modelName && inputPrice && outputPrice) {
                data.push({
                  modelName,
                  inputPrice,
                  outputPrice
                });
              }
            }
          });
        });

        return data;
      });

      return this.transformScrapedData(pricingData, 'dom');
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
   * Fetch from API endpoint if available
   */
  private async fetchFromAPI(): Promise<OpenAIPricingData[] | null> {
    try {
      const response = await fetch(this.API_PRICING_URL, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AI-Server-Info/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      return this.transformAPIData(data);
    } catch (error) {
      logger.warn('API fetch failed:', error);
      return null;
    }
  }

  /**
   * Parse JSON-LD structured data
   */
  private parseJsonLd(jsonLd: any): OpenAIPricingData[] | null {
    try {
      const models: OpenAIPricingData[] = [];

      // Parse based on JSON-LD structure
      // This will vary based on actual structure
      if (jsonLd['@type'] === 'Product' || jsonLd['@type'] === 'Service') {
        // Extract pricing info
        const offers = jsonLd.offers || jsonLd.makesOffer || [];
        offers.forEach((offer: any) => {
          if (offer.price && offer.name) {
            models.push(this.createPricingData(offer, 'structured'));
          }
        });
      }

      return models.length > 0 ? models : null;
    } catch (error) {
      logger.error('Failed to parse JSON-LD:', error);
      return null;
    }
  }

  /**
   * Parse Next.js __NEXT_DATA__
   */
  private parseNextData(nextData: any): OpenAIPricingData[] | null {
    try {
      const models: OpenAIPricingData[] = [];
      const pageProps = nextData?.props?.pageProps;

      if (pageProps?.pricing || pageProps?.models) {
        const pricingData = pageProps.pricing || pageProps.models;

        Object.entries(pricingData).forEach(([modelId, info]: [string, any]) => {
          if (info.price || (info.input && info.output)) {
            models.push({
              modelId: modelId,
              modelName: info.name || modelId,
              inputPrice: this.parsePrice(info.input || info.inputPrice),
              outputPrice: this.parsePrice(info.output || info.outputPrice),
              contextWindow: info.contextWindow || info.context,
              capabilities: info.capabilities || [],
              dataSource: 'structured',
              confidence: 0.95,
              scrapedAt: new Date(),
              sourceUrl: this.PRICING_URL
            });
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
   * Transform scraped DOM data
   */
  private transformScrapedData(rawData: any[], source: 'dom' | 'api'): OpenAIPricingData[] {
    return rawData.map(item => ({
      modelId: this.extractModelId(item.modelName),
      modelName: item.modelName,
      inputPrice: this.parsePrice(item.inputPrice),
      outputPrice: this.parsePrice(item.outputPrice),
      contextWindow: item.contextWindow || this.inferContextWindow(item.modelName),
      capabilities: this.inferCapabilities(item.modelName),
      dataSource: source,
      confidence: source === 'api' ? 0.9 : 0.7,
      scrapedAt: new Date(),
      sourceUrl: this.PRICING_URL
    }));
  }

  /**
   * Transform API data
   */
  private transformAPIData(apiData: any): OpenAIPricingData[] {
    const models: OpenAIPricingData[] = [];

    if (Array.isArray(apiData)) {
      apiData.forEach(model => {
        models.push({
          modelId: model.id || model.model_id,
          modelName: model.name || model.model_name,
          inputPrice: model.pricing?.prompt || model.input_price,
          outputPrice: model.pricing?.completion || model.output_price,
          contextWindow: model.context_length || model.context_window,
          capabilities: model.capabilities || [],
          dataSource: 'api',
          confidence: 0.95,
          scrapedAt: new Date(),
          sourceUrl: this.API_PRICING_URL
        });
      });
    }

    return models;
  }

  /**
   * Helper: Extract model ID from name
   */
  private extractModelId(modelName: string): string {
    return modelName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Helper: Parse price string to number
   */
  private parsePrice(priceStr: any): number {
    if (typeof priceStr === 'number') return priceStr;

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
   * Helper: Infer context window from model name
   */
  private inferContextWindow(modelName: string): number {
    const name = modelName.toLowerCase();

    if (name.includes('gpt-4-turbo') || name.includes('gpt-4-1106')) return 128000;
    if (name.includes('gpt-4-32k')) return 32768;
    if (name.includes('gpt-4')) return 8192;
    if (name.includes('gpt-3.5-turbo-16k')) return 16384;
    if (name.includes('gpt-3.5')) return 4096;

    return 8192; // Default
  }

  /**
   * Helper: Infer capabilities from model name
   */
  private inferCapabilities(modelName: string): string[] {
    const capabilities: string[] = ['chat', 'completion'];
    const name = modelName.toLowerCase();

    if (name.includes('gpt-4')) {
      capabilities.push('advanced-reasoning', 'code-generation');
    }

    if (name.includes('vision')) {
      capabilities.push('vision', 'image-analysis');
    }

    if (name.includes('turbo')) {
      capabilities.push('fast-response');
    }

    return capabilities;
  }

  /**
   * Helper: Create pricing data object
   */
  private createPricingData(rawData: any, source: 'structured' | 'dom' | 'api'): OpenAIPricingData {
    return {
      modelId: rawData.modelId || this.extractModelId(rawData.name),
      modelName: rawData.name,
      inputPrice: this.parsePrice(rawData.inputPrice || rawData.price),
      outputPrice: this.parsePrice(rawData.outputPrice || rawData.price),
      contextWindow: rawData.contextWindow,
      capabilities: rawData.capabilities || [],
      dataSource: source,
      confidence: source === 'structured' ? 0.95 : 0.7,
      scrapedAt: new Date(),
      sourceUrl: this.PRICING_URL
    };
  }
}