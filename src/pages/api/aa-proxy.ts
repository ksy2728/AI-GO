import { NextApiRequest, NextApiResponse } from 'next';
import * as cheerio from 'cheerio';
import { cache } from '@/lib/redis';
import { AAFlightParser } from '@/lib/aa-flight-parser';

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

    console.log('🔄 Fetching AA data...');
    const startTime = Date.now();

    // Try API first if token is available
    const apiToken = process.env.artificialanalysis_API_TOKEN;
    if (apiToken) {
      try {
        console.log('📡 Trying AA API v2...');
        const apiResponse = await fetch('https://artificialanalysis.ai/api/v2/data/llms/models', {
          method: 'GET',
          headers: {
            'x-api-key': apiToken,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(30000)
        });

        if (apiResponse.ok) {
          const apiData = await apiResponse.json();

          // Parse API response structure: { status: 200, data: [...] }
          if (apiData.status === 200 && Array.isArray(apiData.data)) {
            const models: AAModelData[] = apiData.data.map((model: any) => ({
              id: normalizeModelId(model.slug || model.name),
              name: model.name,
              provider: model.model_creator?.slug || inferProvider(model.name),
              intelligenceScore: parseFloat(String(model.evaluations?.artificial_analysis_intelligence_index || 0)),
              outputSpeed: parseFloat(String(model.median_output_tokens_per_second || 0)),
              price: {
                input: parseFloat(String(model.pricing?.price_1m_input_tokens || 0)),
                output: parseFloat(String(model.pricing?.price_1m_output_tokens || 0)),
              },
              rank: 0,
              category: 'general',
              lastUpdated: new Date(),
            })).filter((m: AAModelData) => m.name && m.intelligenceScore > 0);

            console.log(`✅ Parsed ${models.length} models from API in ${Date.now() - startTime}ms`);

            if (models.length > 0) {
              // Cache for 1 hour
              await cache.set(cacheKey, models, 3600);
              return res.status(200).json(models);
            }
          }
        } else {
          console.warn(`⚠️ AA API returned ${apiResponse.status}, falling back to scraping`);
        }
      } catch (apiError) {
        console.warn('⚠️ AA API failed, falling back to scraping:', apiError);
      }
    }

    // Fallback to HTML scraping
    console.log('📄 Falling back to HTML scraping...');
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
    console.log(`📦 Received HTML: ${html.length} bytes`);

    // Use Flight parser (handles new streaming format)
    const parser = new AAFlightParser();
    let rawModels = parser.parseModels(html);

    // Fallback to table parser if Flight parser returns nothing
    if (rawModels.length === 0) {
      console.warn('⚠️ Flight parser returned 0 models, trying table fallback');
      rawModels = parser.parseTableFallback(html);
    }

    // If still nothing, return error
    if (rawModels.length === 0) {
      console.error('❌ All parsers returned 0 models', {
        htmlLength: html.length,
        htmlPreview: html.substring(0, 500)
      });
      throw new Error('Failed to parse AA data: All parsers returned 0 models');
    }

    // Convert to our API format
    const models: AAModelData[] = rawModels.map((model, index) => ({
      id: parser.normalizeModelId(model.model_name || model.name || ''),
      name: model.model_name || model.name || '',
      provider: model.organization || model.provider || inferProvider(model.model_name || model.name || ''),
      intelligenceScore: parseFloat(String(model.quality_index || model.intelligence_score || 0)),
      outputSpeed: parseFloat(String(model.tokens_per_second || model.output_speed || 0)),
      price: {
        input: parseFloat(String(model.price_per_million_input_tokens || model.input_price || 0)),
        output: parseFloat(String(model.price_per_million_output_tokens || model.output_price || 0)),
      },
      rank: model.rank || index + 1,
      category: model.category || 'general',
      lastUpdated: new Date(),
    })).filter(m => m.name && m.intelligenceScore > 0);

    console.log(`✅ Parsed ${models.length} models in ${Date.now() - startTime}ms`);

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
    .replace(/[.\s]+/g, '-')      // Convert dots and spaces to hyphens
    .replace(/[^a-z0-9-]/g, '')   // Remove non-alphanumeric except hyphens
    .replace(/-+/g, '-')          // Collapse multiple hyphens
    .replace(/^-|-$/g, '');       // Trim leading/trailing hyphens
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