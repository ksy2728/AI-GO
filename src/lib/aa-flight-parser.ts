/**
 * Next.js Flight Stream Parser for Artificial Analysis
 *
 * Parses self.__next_f.push([segmentId, "FlightData"]) chunks
 * that AA now uses instead of __NEXT_DATA__
 */

import { load } from 'cheerio'

export interface AAModel {
  model_name?: string;
  name?: string;
  organization?: string;
  provider?: string;
  quality_index?: number;
  intelligence_score?: number;
  tokens_per_second?: number;
  output_speed?: number;
  price_per_million_input_tokens?: number;
  price_per_million_output_tokens?: number;
  input_price?: number;
  output_price?: number;
  context_window?: number;
  context_length?: number;
  rank?: number;
  category?: string;
}

interface FlightChunk {
  segmentId: string;
  data: string;
}

export class AAFlightParser {
  private lastSuccessTime: Date | null = null;

  /**
   * Extract all Flight chunks from HTML
   * Matches: self.__next_f.push([1, "..."])
   */
  private extractFlightChunks(html: string): FlightChunk[] {
    const chunks: FlightChunk[] = [];

    // Match self.__next_f.push([...]) patterns
    // Using a more lenient regex to handle various formatting
    const regex = /self\.__next_f\.push\(\s*\[([^\]]+)\]\s*\)/g;

    let match;
    let chunkCount = 0;

    while ((match = regex.exec(html)) !== null) {
      try {
        // Parse the array content: [segmentId, "data"]
        const arrayContent = `[${match[1]}]`;
        const parsed = JSON.parse(arrayContent);

        if (Array.isArray(parsed) && parsed.length >= 2) {
          chunks.push({
            segmentId: String(parsed[0]),
            data: String(parsed[1])
          });
          chunkCount++;
        }
      } catch {
        // Some chunks might not be valid JSON, skip them
        continue;
      }
    }

    console.log(`[AA Flight Parser] Found ${chunkCount} Flight chunks`);
    return chunks;
  }

  /**
   * Extract models from FlightData string
   * Handles nested JSON fragments with keys like "$L73", "props", "models"
   */
  private extractModelsFromFlightData(flightData: string): AAModel[] {
    const models: AAModel[] = [];

    try {
      // Pattern 1: Look for "models":[...] directly in the data
      const modelsArrayRegex = /"models"\s*:\s*(\[[^\]]*?\{[^\}]*?"model_name"[^\]]*?\])/gs;
      let match;

      while ((match = modelsArrayRegex.exec(flightData)) !== null) {
        try {
          // Try to extract and parse the models array
          let modelsJson = match[1];

          // Handle escaped quotes
          modelsJson = modelsJson.replace(/\\"/g, '"');

          const parsedModels = JSON.parse(modelsJson);
          if (Array.isArray(parsedModels)) {
            models.push(...parsedModels);
          }
        } catch {
          // Continue to next match
          continue;
        }
      }

      // Pattern 2: Look for individual model objects
      if (models.length === 0) {
        const modelObjectRegex = /\{[^}]*"model_name"\s*:\s*"([^"]+)"[^}]*"quality_index"\s*:\s*([0-9.]+)[^}]*\}/g;

        while ((match = modelObjectRegex.exec(flightData)) !== null) {
          try {
            const modelObj = JSON.parse(match[0]);
            models.push(modelObj);
          } catch {
            // Try to construct object manually
            models.push({
              model_name: match[1],
              quality_index: parseFloat(match[2])
            });
          }
        }
      }

      // Pattern 3: Look for pageProps.models structure
      if (models.length === 0) {
        const pagePropsRegex = /"pageProps"\s*:\s*\{[^}]*"models"\s*:\s*(\[[^\]]+\])/gs;

        while ((match = pagePropsRegex.exec(flightData)) !== null) {
          try {
            const modelsJson = match[1].replace(/\\"/g, '"');
            const parsedModels = JSON.parse(modelsJson);

            if (Array.isArray(parsedModels)) {
              models.push(...parsedModels);
            }
          } catch {
            continue;
          }
        }
      }

    } catch (err) {
      console.warn('[AA Flight Parser] Failed to extract models from chunk:', err);
    }

    return models;
  }

  /**
   * Parse all models from HTML
   * Main entry point for the parser
   */
  public parseModels(html: string): AAModel[] {
    console.log('[AA Flight Parser] Starting parse...');

    const chunks = this.extractFlightChunks(html);
    const allModels: AAModel[] = [];
    const seenNames = new Set<string>();

    // Process each Flight chunk
    for (const chunk of chunks) {
      const models = this.extractModelsFromFlightData(chunk.data);

      // Deduplicate by model name
      for (const model of models) {
        const modelName = model.model_name || model.name;
        if (modelName && !seenNames.has(modelName)) {
          seenNames.add(modelName);
          allModels.push(model);
        }
      }
    }

    console.log(`[AA Flight Parser] Extracted ${allModels.length} unique models`);

    if (allModels.length > 0) {
      this.lastSuccessTime = new Date();

      // Log first few models for debugging
      console.log('[AA Flight Parser] Sample models:',
        allModels.slice(0, 3).map(m => m.model_name || m.name).join(', ')
      );
    }

    return allModels;
  }

  /**
   * Fallback: Parse HTML table directly
   * Used when Flight parsing fails
   */
  public parseTableFallback(html: string): AAModel[] {
    console.log('[AA Flight Parser] Using table fallback parser');

    const models: AAModel[] = [];
    const $ = load(html);

    // Try different table selectors
    const tableSelectors = [
      'table.leaderboard',
      'table[data-testid="leaderboard-table"]',
      'div.leaderboard table',
      'main table',
      'table'
    ];

    for (const selector of tableSelectors) {
      const table = $(selector).first();
      if (table.length === 0) continue;

      // Parse table headers
      const headers: string[] = [];
      table.find('thead th, thead td').each((_: any, elem: any) => {
        headers.push($(elem).text().toLowerCase().trim());
      });

      // Find column indices
      const modelIdx = headers.findIndex(h => h.includes('model') || h.includes('name'));
      const scoreIdx = headers.findIndex(h =>
        h.includes('quality') || h.includes('intelligence') || h.includes('score')
      );

      if (modelIdx < 0 || scoreIdx < 0) continue;

      // Parse rows
      table.find('tbody tr').each((_: any, row: any) => {
        const cells = $(row).find('td');

        if (cells.length > Math.max(modelIdx, scoreIdx)) {
          const modelName = $(cells[modelIdx]).text().trim();
          const scoreText = $(cells[scoreIdx]).text().replace(/[^\d.]/g, '');
          const score = parseFloat(scoreText);

          if (modelName && !isNaN(score)) {
            models.push({
              model_name: modelName,
              quality_index: score,
              organization: this.inferProvider(modelName)
            });
          }
        }
      });

      if (models.length > 0) break;
    }

    console.log(`[AA Flight Parser] Table fallback found ${models.length} models`);
    return models;
  }

  /**
   * Normalize model name to slug
   * "Claude Sonnet 4.5" → "claude-sonnet-4-5"
   */
  public normalizeModelId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[.\s]+/g, '-')      // Convert dots and spaces to hyphens
      .replace(/[^a-z0-9-]/g, '')   // Remove non-alphanumeric except hyphens
      .replace(/-+/g, '-')          // Collapse multiple hyphens
      .replace(/^-|-$/g, '');       // Trim leading/trailing hyphens
  }

  /**
   * Infer provider from model name
   */
  private inferProvider(name: string): string {
    const nameLower = name.toLowerCase();

    if (nameLower.includes('gpt') || nameLower.includes('openai')) return 'openai';
    if (nameLower.includes('claude') || nameLower.includes('anthropic')) return 'anthropic';
    if (nameLower.includes('gemini') || nameLower.includes('google')) return 'google';
    if (nameLower.includes('llama') || nameLower.includes('meta')) return 'meta';
    if (nameLower.includes('mistral')) return 'mistral';
    if (nameLower.includes('cohere')) return 'cohere';
    if (nameLower.includes('deepseek')) return 'deepseek';

    return 'other';
  }

  /**
   * Get last successful parse time
   */
  public getLastSuccessTime(): Date | null {
    return this.lastSuccessTime;
  }
}