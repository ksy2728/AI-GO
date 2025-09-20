import { NextApiRequest, NextApiResponse } from 'next';
import * as cheerio from 'cheerio';
import { cache } from '@/lib/redis';

export interface AAModelData {
  id: string;
  name: string;
  provider: string;
  intelligenceScore: number;
  outputSpeed: number;
  price: {
    input: number;
    output: number;
  };
  rank?: number;
  category?: string;
  lastUpdated: Date;
}

/**
 * Server-side proxy for Artificial Analysis data
 * Scrapes the leaderboard and returns real intelligence scores
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check cache first
    const cacheKey = 'aa:leaderboard:data';
    const cached = await cache.get<AAModelData[]>(cacheKey);

    if (cached && cached.length > 0) {
      console.log('📦 Returning cached AA data');
      return res.status(200).json(cached);
    }

    // Fetch the leaderboard page
    console.log('🔄 Fetching AA leaderboard...');
    const response = await fetch('https://artificialanalysis.ai/leaderboards/models', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch AA data: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const models: AAModelData[] = [];

    // Try to find the data in different formats
    // Method 1: Look for JSON-LD structured data
    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const data = JSON.parse($(elem).html() || '{}');
        if (data['@type'] === 'Table' || data.itemListElement) {
          // Parse structured data
          console.log('Found structured data');
        }
      } catch (e) {
        // Not JSON-LD
      }
    });

    // Method 2: Look for data in script tags
    $('script').each((_, elem) => {
      const scriptContent = $(elem).html() || '';

      // Look for __NEXT_DATA__ or similar
      if (scriptContent.includes('__NEXT_DATA__')) {
        try {
          const match = scriptContent.match(/__NEXT_DATA__\s*=\s*({.*?})\s*;?\s*$/s);
          if (match) {
            const nextData = JSON.parse(match[1]);
            const pageProps = nextData?.props?.pageProps;

            if (pageProps?.models || pageProps?.leaderboard) {
              const modelList = pageProps.models || pageProps.leaderboard;

              modelList.forEach((model: any) => {
                if (model.model_name && model.quality_index !== undefined) {
                  models.push({
                    id: normalizeModelId(model.model_name),
                    name: model.model_name,
                    provider: model.organization || inferProvider(model.model_name),
                    intelligenceScore: parseFloat(model.quality_index) || 0,
                    outputSpeed: parseFloat(model.tokens_per_second) || 0,
                    price: {
                      input: parseFloat(model.price_per_million_input_tokens) || 0,
                      output: parseFloat(model.price_per_million_output_tokens) || 0,
                    },
                    rank: model.rank || models.length + 1,
                    category: model.category || 'general',
                    lastUpdated: new Date(),
                  });
                }
              });
            }
          }
        } catch (e) {
          console.error('Failed to parse NEXT_DATA:', e);
        }
      }

      // Look for window.__INITIAL_STATE__ or similar
      if (scriptContent.includes('window.__INITIAL_STATE__') ||
          scriptContent.includes('window.__DATA__')) {
        try {
          const match = scriptContent.match(/window\.__(?:INITIAL_STATE__|DATA__)\s*=\s*({.*?});/s);
          if (match) {
            const data = JSON.parse(match[1]);

            if (data.models || data.leaderboard?.models) {
              const modelList = data.models || data.leaderboard.models;

              modelList.forEach((model: any) => {
                if (model.name && model.intelligence_score !== undefined) {
                  models.push({
                    id: normalizeModelId(model.name),
                    name: model.name,
                    provider: model.provider || inferProvider(model.name),
                    intelligenceScore: parseFloat(model.intelligence_score),
                    outputSpeed: parseFloat(model.output_speed || model.speed || 0),
                    price: {
                      input: parseFloat(model.input_price || model.price?.input || 0),
                      output: parseFloat(model.output_price || model.price?.output || 0),
                    },
                    rank: model.rank || models.length + 1,
                    category: model.category || 'general',
                    lastUpdated: new Date(),
                  });
                }
              });
            }
          }
        } catch (e) {
          console.error('Failed to parse INITIAL_STATE:', e);
        }
      }
    });

    // Method 3: Parse table directly
    if (models.length === 0) {
      console.log('Parsing HTML table directly...');

      // Try different table selectors
      const tableSelectors = [
        'table.leaderboard',
        'table[data-testid="leaderboard-table"]',
        'div.leaderboard table',
        'main table',
        'table',
      ];

      for (const selector of tableSelectors) {
        const table = $(selector).first();
        if (table.length > 0) {
          const headers: string[] = [];
          table.find('thead th, thead td').each((_, elem) => {
            headers.push($(elem).text().toLowerCase().trim());
          });

          // Find column indices
          const modelIdx = headers.findIndex(h => h.includes('model') || h.includes('name'));
          const scoreIdx = headers.findIndex(h => h.includes('quality') || h.includes('intelligence') || h.includes('score'));
          const speedIdx = headers.findIndex(h => h.includes('speed') || h.includes('tokens'));
          const inputPriceIdx = headers.findIndex(h => h.includes('input') && h.includes('price'));
          const outputPriceIdx = headers.findIndex(h => h.includes('output') && h.includes('price'));

          table.find('tbody tr').each((_, row) => {
            const cells = $(row).find('td');

            if (modelIdx >= 0 && scoreIdx >= 0) {
              const modelName = $(cells[modelIdx]).text().trim();
              const score = parseFloat($(cells[scoreIdx]).text().replace(/[^\d.]/g, ''));

              if (modelName && !isNaN(score)) {
                models.push({
                  id: normalizeModelId(modelName),
                  name: modelName,
                  provider: inferProvider(modelName),
                  intelligenceScore: score,
                  outputSpeed: speedIdx >= 0 ? parseFloat($(cells[speedIdx]).text().replace(/[^\d.]/g, '')) || 0 : 0,
                  price: {
                    input: inputPriceIdx >= 0 ? parseFloat($(cells[inputPriceIdx]).text().replace(/[^\d.]/g, '')) || 0 : 0,
                    output: outputPriceIdx >= 0 ? parseFloat($(cells[outputPriceIdx]).text().replace(/[^\d.]/g, '')) || 0 : 0,
                  },
                  rank: models.length + 1,
                  category: 'general',
                  lastUpdated: new Date(),
                });
              }
            }
          });

          if (models.length > 0) break;
        }
      }
    }

    console.log(`✅ Scraped ${models.length} models from AA`);

    if (models.length > 0) {
      // Cache for 1 hour
      await cache.set(cacheKey, models, 3600);
    }

    return res.status(200).json(models);

  } catch (error: any) {
    console.error('AA proxy error:', error);
    return res.status(500).json({
      error: 'Failed to fetch AA data',
      details: error.message
    });
  }
}

function normalizeModelId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s-]+/g, '-')
    .replace(/[^a-z0-9.-]/g, '')
    .trim();
}

function inferProvider(name: string): string {
  const nameLower = name.toLowerCase();

  if (nameLower.includes('gpt') || nameLower.includes('openai')) return 'openai';
  if (nameLower.includes('claude') || nameLower.includes('anthropic')) return 'anthropic';
  if (nameLower.includes('gemini') || nameLower.includes('google')) return 'google';
  if (nameLower.includes('llama') || nameLower.includes('meta')) return 'meta';
  if (nameLower.includes('mistral')) return 'mistral';
  if (nameLower.includes('cohere')) return 'cohere';

  return 'unknown';
}