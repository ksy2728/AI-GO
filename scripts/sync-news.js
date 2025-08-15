#!/usr/bin/env node

/**
 * News Auto-Collection Script
 * Fetches latest AI news from multiple sources and updates news-data.json
 * 
 * Usage: node scripts/sync-news.js
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { URL } = require('url');

// News sources configuration
const NEWS_SOURCES = [
  {
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    type: 'rss',
    category: 'release'
  },
  {
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/ai/feed/',
    type: 'rss', 
    category: 'market'
  },
  {
    name: 'MIT Technology Review AI',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
    type: 'rss',
    category: 'research'
  },
  {
    name: 'AI News',
    url: 'https://www.artificialintelligence-news.com/feed/',
    type: 'rss',
    category: 'market'
  },
  {
    name: 'OpenAI Blog',
    url: 'https://openai.com/blog/rss.xml',
    type: 'rss',
    category: 'release'
  },
  {
    name: 'Google AI Blog',
    url: 'https://ai.googleblog.com/feeds/posts/default',
    type: 'rss',
    category: 'release'
  },
  {
    name: 'Microsoft AI Blog',
    url: 'https://blogs.microsoft.com/ai/feed/',
    type: 'rss',
    category: 'release'
  }
];

// Keywords for AI news filtering
const AI_KEYWORDS = [
  'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning',
  'gpt', 'llm', 'language model', 'openai', 'anthropic', 'claude', 'gemini',
  'chatgpt', 'neural network', 'transformer', 'generative ai', 'ai model',
  'computer vision', 'nlp', 'natural language', 'automation', 'robotics'
];

// Categories mapping
const CATEGORY_KEYWORDS = {
  'release': ['launch', 'release', 'announce', 'unveil', 'introduce', 'debuts'],
  'funding': ['funding', 'investment', 'raises', 'series', 'valuation', 'ipo'],
  'partnership': ['partnership', 'collaboration', 'alliance', 'merge', 'acquire'],
  'regulation': ['regulation', 'policy', 'law', 'compliance', 'government', 'eu act'],
  'research': ['research', 'study', 'paper', 'breakthrough', 'discovery', 'academic'],
  'market': ['market', 'industry', 'trend', 'competition', 'business', 'revenue']
};

class NewsCollector {
  constructor() {
    this.articles = [];
    this.duplicateChecker = new Set();
  }

  /**
   * Fetch content from URL with error handling
   */
  async fetchUrl(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'AI-Server-Information/1.0 (News Collector)',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        timeout: timeout
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  /**
   * Parse RSS feed content
   */
  parseRSSFeed(xmlContent, source) {
    const articles = [];
    
    try {
      // Simple regex-based RSS parsing (basic but effective)
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
      const titleRegex = /<title[^>]*>([\s\S]*?)<\/title>/i;
      const linkRegex = /<link[^>]*>([\s\S]*?)<\/link>/i;
      const descRegex = /<description[^>]*>([\s\S]*?)<\/description>/i;
      const pubDateRegex = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i;
      const authorRegex = /<(?:author|dc:creator)[^>]*>([\s\S]*?)<\/(?:author|dc:creator)>/i;

      let match;
      while ((match = itemRegex.exec(xmlContent)) !== null) {
        const itemContent = match[1];
        
        const title = this.extractText(titleRegex.exec(itemContent)?.[1] || '');
        const link = this.extractText(linkRegex.exec(itemContent)?.[1] || '');
        const description = this.extractText(descRegex.exec(itemContent)?.[1] || '');
        const pubDate = this.extractText(pubDateRegex.exec(itemContent)?.[1] || '');
        const author = this.extractText(authorRegex.exec(itemContent)?.[1] || source.name);

        if (title && this.isAIRelated(title, description)) {
          const article = {
            title: title.substring(0, 150),
            link: link,
            description: description.substring(0, 300),
            pubDate: this.parseDate(pubDate),
            author: author,
            source: source.name,
            category: this.categorizeArticle(title, description, source.category)
          };

          // Check for duplicates
          const articleHash = this.generateArticleHash(article);
          if (!this.duplicateChecker.has(articleHash)) {
            this.duplicateChecker.add(articleHash);
            articles.push(article);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error parsing RSS feed from ${source.name}:`, error.message);
    }

    return articles;
  }

  /**
   * Extract text content and clean HTML
   */
  extractText(html) {
    return html
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * Check if article is AI-related
   */
  isAIRelated(title, description) {
    const content = (title + ' ' + description).toLowerCase();
    return AI_KEYWORDS.some(keyword => content.includes(keyword));
  }

  /**
   * Categorize article based on keywords
   */
  categorizeArticle(title, description, defaultCategory) {
    const content = (title + ' ' + description).toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return category;
      }
    }
    
    return defaultCategory;
  }

  /**
   * Generate unique hash for duplicate detection
   */
  generateArticleHash(article) {
    return Buffer.from(article.title + article.link).toString('base64').substring(0, 16);
  }

  /**
   * Parse date string to ISO format
   */
  parseDate(dateStr) {
    try {
      if (!dateStr) return new Date().toISOString();
      
      // Handle various date formats
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return new Date().toISOString();
      }
      
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Collect news from all sources
   */
  async collectNews() {
    console.log('🔄 Starting news collection from', NEWS_SOURCES.length, 'sources...\n');

    for (const source of NEWS_SOURCES) {
      try {
        console.log(`📡 Fetching from ${source.name}...`);
        
        const content = await this.fetchUrl(source.url);
        const articles = this.parseRSSFeed(content, source);
        
        this.articles.push(...articles);
        console.log(`✅ Found ${articles.length} AI-related articles from ${source.name}`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.warn(`⚠️ Failed to fetch from ${source.name}:`, error.message);
        continue;
      }
    }

    console.log(`\n📊 Total articles collected: ${this.articles.length}`);
    return this.articles;
  }

  /**
   * Transform articles to match our data format
   */
  transformArticles(articles) {
    return articles
      .filter(article => article.title && article.link)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 20) // Keep top 20 most recent
      .map((article, index) => ({
        id: this.generateId(article.title),
        title: article.title,
        summary: this.generateSummary(article.description),
        content: article.description,
        source: article.source,
        author: article.author,
        publishedAt: article.pubDate,
        category: article.category,
        tags: this.generateTags(article.title, article.description),
        url: article.link,
        readTime: Math.max(3, Math.ceil(article.description.length / 200)),
        views: Math.floor(Math.random() * 50000) + 5000 // Simulated views
      }));
  }

  /**
   * Generate ID from title
   */
  generateId(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Generate summary from description
   */
  generateSummary(description) {
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 2).join('. ').trim().substring(0, 200) + '.';
  }

  /**
   * Generate tags from content
   */
  generateTags(title, description) {
    const content = (title + ' ' + description).toLowerCase();
    const tags = [];
    
    // Add AI-related tags
    AI_KEYWORDS.forEach(keyword => {
      if (content.includes(keyword) && !tags.includes(keyword)) {
        tags.push(keyword);
      }
    });

    // Add company tags
    const companies = ['OpenAI', 'Google', 'Microsoft', 'Meta', 'Anthropic', 'Apple'];
    companies.forEach(company => {
      if (content.includes(company.toLowerCase()) && !tags.includes(company)) {
        tags.push(company);
      }
    });

    return tags.slice(0, 5);
  }
}

/**
 * Update news data file
 */
async function updateNewsData(articles) {
  try {
    const filePath = path.join(__dirname, '..', 'data', 'news-data.json');
    
    // Read existing data to preserve structure
    let existingData = {
      articles: [],
      lastUpdated: new Date().toISOString(),
      version: "1.0"
    };
    
    try {
      const existingContent = await fs.readFile(filePath, 'utf-8');
      existingData = JSON.parse(existingContent);
    } catch (error) {
      console.log('📝 Creating new news data file...');
    }

    // Update with new articles
    const updatedData = {
      ...existingData,
      articles: articles,
      lastUpdated: new Date().toISOString(),
      totalArticles: articles.length,
      sources: [...new Set(articles.map(a => a.source))],
      categories: [...new Set(articles.map(a => a.category))]
    };

    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
    console.log('✅ News data updated successfully!');
    console.log(`📁 File: ${filePath}`);
    console.log(`📊 Articles: ${articles.length}`);
    
    return updatedData;
  } catch (error) {
    console.error('❌ Error updating news data:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 AI News Auto-Collection System\n');
    
    const collector = new NewsCollector();
    const rawArticles = await collector.collectNews();
    
    if (rawArticles.length === 0) {
      console.warn('⚠️ No articles collected. Check news sources and internet connection.');
      return;
    }

    const transformedArticles = collector.transformArticles(rawArticles);
    await updateNewsData(transformedArticles);
    
    console.log('\n🎉 News collection completed successfully!');
    console.log('📝 Next steps:');
    console.log('  - Review the updated news-data.json file');
    console.log('  - Test the /api/v1/news endpoint');
    console.log('  - Deploy changes to production');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { NewsCollector, updateNewsData };