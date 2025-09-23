# Artificial Analysis Website Scraping Tools

This directory contains improved Playwright-based scrapers designed to accurately extract Intelligence, Speed, and Price metrics from the Artificial Analysis website (https://artificialanalysis.ai/models).

## 🎯 Overview

The scraping system uses multiple strategies to capture data with high reliability:

1. **Multi-Strategy Approach**: DOM extraction, API interception, React data extraction
2. **Network Monitoring**: Comprehensive API call interception
3. **Flexible Extraction**: Multiple selectors and patterns to adapt to website changes
4. **Data Validation**: Confidence scoring and duplicate removal
5. **Screenshot Evidence**: Visual validation for manual verification

## 📁 Files

### Core Scrapers
- **`scrape-aa-improved.js`** - Multi-strategy scraper with DOM, React, and API extraction
- **`scrape-aa-network-focused.js`** - Network-focused scraper with comprehensive API monitoring
- **`run-aa-scraping.js`** - Runner that executes both strategies and combines results

### Legacy
- **`scrape-aa-real-data.js`** - Original scraper (kept for reference)

## 🚀 Quick Start

### Run Complete Scraping (Recommended)
```bash
# Run all scraping strategies and combine results
npm run scrape:aa

# Or run directly
node scripts/run-aa-scraping.js
```

### Run Individual Strategies
```bash
# Multi-strategy scraper
npm run scrape:aa:improved

# Network-focused scraper
npm run scrape:aa:network
```

## 📊 Output

### Data Files
All scraped data is saved to `data/aa-scraping/` with timestamps:

- `aa-combined-results-[timestamp].json` - Combined results from all strategies
- `aa-improved-[timestamp].json` - Multi-strategy scraper results
- `aa-network-focused-[timestamp].json` - Network scraper results

### Screenshots
Visual validation screenshots are saved to `screenshots/`:
- `aa-improved-full.png` - Full page screenshot
- `aa-improved-[element].png` - Specific chart/element screenshots

### Data Structure
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "combined": {
    "intelligence": [
      {
        "model": "GPT-5 high",
        "score": 67,
        "strategy": "improved",
        "confidence": "high"
      }
    ],
    "speed": [
      {
        "model": "DeepSeek V3",
        "speed": 120,
        "strategy": "networkFocused",
        "confidence": "medium"
      }
    ],
    "price": [
      {
        "model": "Claude 3.5 Sonnet",
        "price": 15.00,
        "strategy": "improved",
        "confidence": "high"
      }
    ]
  }
}
```

## 🔧 Configuration

### Browser Settings
- **Headless Mode**: Set to `false` for debugging, `true` for production
- **Slow Motion**: Configurable delay between actions for debugging
- **Viewport**: 1920x1080 for consistent rendering
- **User Agent**: Modern Chrome user agent string

### Timeouts
- **Page Load**: 60 seconds
- **Element Wait**: 15 seconds
- **API Interception**: Full page lifecycle
- **Content Stabilization**: 5 seconds after load

## 🎯 Extraction Strategies

### Strategy 1: Multi-Strategy Scraper
1. **__NEXT_DATA__ Extraction** - React app data
2. **DOM Element Extraction** - Chart and table data
3. **React Component Data** - Component props and state
4. **Targeted Model Extraction** - Pattern-based model name detection
5. **API Response Interception** - JSON data capture

### Strategy 2: Network-Focused Scraper
1. **Comprehensive Network Monitoring** - All requests/responses
2. **Progressive Page State Capture** - Multiple snapshots during load
3. **Chart Analysis** - Detailed SVG text extraction
4. **Table Structure Analysis** - Systematic table data extraction
5. **Dynamic Content Triggering** - Scrolling and interaction

## 📈 Confidence Levels

### High Confidence
- Data extracted from API responses
- Data found in __NEXT_DATA__
- Multiple strategies agree on values

### Medium Confidence
- Data extracted from DOM elements
- Single strategy with good patterns
- Numbers in expected ranges

### Low Confidence
- Limited data extraction
- Ambiguous number categorization
- No clear model associations

## 🔍 Target Metrics

### Intelligence Scores
- **Range**: 20-100 points
- **Target Models**: GPT-5, DeepSeek V3, Claude 3.5 Sonnet, Gemini
- **Source**: Intelligence/Quality benchmarks

### Speed Metrics
- **Range**: 1-1000 tokens/second
- **Measurement**: Processing throughput
- **Format**: Numerical value with "tokens/sec"

### Price Data
- **Range**: $0.01-$100 per 1M tokens
- **Currency**: USD
- **Format**: Cost per million tokens

## 🛠️ Troubleshooting

### Low Confidence Results
1. **Check Screenshots** - Visual verification in `screenshots/` folder
2. **Review Network Data** - Check for missed API endpoints
3. **Manual Verification** - Compare with actual website
4. **Re-run Scraper** - Dynamic content may load differently

### Common Issues

#### No Data Extracted
- Website structure may have changed
- JavaScript not fully loaded
- API endpoints changed
- Network connectivity issues

**Solutions:**
- Increase wait times
- Check browser console for errors
- Update selectors based on current website
- Verify website accessibility

#### Incomplete Data
- Some models found but not others
- Missing metrics for known models

**Solutions:**
- Check chart rendering timing
- Verify scrolling triggers lazy loading
- Look for pagination or tabs
- Check for model name variations

### Network Issues
- API calls not being intercepted
- JSON parsing failures

**Solutions:**
- Check Content-Type headers
- Verify response format
- Look for GraphQL endpoints
- Check for authentication requirements

## 🧪 Testing & Validation

### Manual Verification Process
1. **Run Scraper** with headless=false
2. **Compare Screenshots** with actual website
3. **Verify Key Models** (GPT-5, DeepSeek V3, Claude 3.5 Sonnet)
4. **Check Number Ranges** for reasonableness
5. **Cross-Reference** with known benchmark results

### Expected Values (as of last update)
- **GPT-5 (high)**: ~67 intelligence
- **DeepSeek V3**: ~54 intelligence
- **Claude 3.5 Sonnet**: ~50+ intelligence
- **Speed**: Varies widely by model and context
- **Price**: $0.50-$50 per 1M tokens typical range

## 🔄 Maintenance

### When to Update
- Website structure changes
- New models appear
- Scraper confidence drops below acceptable levels
- API endpoints change

### Update Process
1. **Analyze Changes** using browser dev tools
2. **Update Selectors** in extraction logic
3. **Test New Patterns** with small changes first
4. **Validate Results** against known data
5. **Update Documentation** with new patterns

### Monitoring
- Set up regular scraping schedule
- Monitor confidence levels over time
- Alert on extraction failures
- Track data quality metrics

## 📋 Development Notes

### Adding New Extraction Patterns
1. **Identify Data Source** (DOM, API, React)
2. **Add Selector/Pattern** to appropriate strategy
3. **Test Extraction** with various models
4. **Validate Data Quality** and confidence scoring
5. **Document Pattern** for future reference

### Performance Optimization
- **Parallel Processing** where possible
- **Intelligent Waiting** for dynamic content
- **Selective Screenshot** capture
- **Data Deduplication** and ranking

### Error Handling
- **Graceful Degradation** when strategies fail
- **Comprehensive Logging** for debugging
- **Timeout Management** for reliability
- **Resource Cleanup** to prevent memory leaks

## 🤝 Contributing

When improving the scrapers:

1. **Maintain Backward Compatibility** with existing data structure
2. **Add Comprehensive Logging** for new features
3. **Include Error Handling** for edge cases
4. **Update Documentation** for new patterns
5. **Test Thoroughly** across different conditions

## 📞 Support

For issues or improvements:
1. Check existing data extraction patterns
2. Review network logs for API changes
3. Verify website accessibility and structure
4. Consider dynamic content loading timing
5. Test with different browser configurations