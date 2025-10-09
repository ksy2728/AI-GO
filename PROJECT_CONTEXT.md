# AI-GO Project Context

## Project Overview
**AI-GO** is a comprehensive global AI model monitoring platform that provides real-time monitoring of AI model performance, availability, benchmarks, and industry news from around the world.

## Technical Stack

### Frontend
- **Framework**: Next.js 15.4.6 with App Router
- **Language**: TypeScript 5.9.2
- **UI Library**: React 18.3.1
- **Styling**: Tailwind CSS 3.4.17 + shadcn/ui components
- **State Management**: TanStack Query v5 for server state
- **Real-time**: Socket.IO for WebSocket connections
- **Internationalization**: next-intl with 11 language support

### Backend
- **Runtime**: Node.js 18+ with custom server.js
- **Database**: PostgreSQL with Prisma ORM v6.1.0
- **Database Options**: Neon (recommended), Supabase, PlanetScale
- **Caching**: Redis via ioredis
- **Queue Management**: Bull for background jobs

### Infrastructure
- **Deployment**: Vercel (primary), Docker support
- **CI/CD**: GitHub Actions workflows
- **Testing**: Playwright for E2E, Jest for unit tests
- **Performance**: Bundle analysis, Lighthouse audits

## Key Features
1. **Real-time Status Monitoring**: Live availability, latency, and performance metrics
2. **Model Catalog**: Comprehensive listing of AI models across all major providers
3. **Benchmark Comparisons**: Standardized performance comparisons with interactive visualizations
4. **WebSocket Updates**: Real-time data streaming for live dashboards
5. **Multi-language Support**: Full i18n for 11 languages
6. **Dark/Light Theme**: Automatic theme detection with manual override
7. **Responsive Design**: Optimized for desktop, tablet, and mobile

## Project Structure
```
/src
  /app              # Next.js App Router pages
  /components       # React components (UI, dashboard, models)
  /contexts         # React context providers (Language, Region, Models)
  /services         # Business logic and API services
  /lib              # Utilities and configurations
  /types            # TypeScript type definitions

/prisma             # Database schema and migrations
/scripts            # Automation and utility scripts
/tests              # Test suites (E2E, performance)
/public             # Static assets
```

## Current Development Status
- **Latest Commit**: Dashboard featured models service with AA API v2 integration
- **Branch**: master
- **Recent Updates**:
  - Fixed lint errors and unused imports
  - Implemented dashboard featured models service
  - Updated Intelligence Index and AI news data

## Key Services
- **Artificial Analysis API Integration**: Real-time model performance data
- **GitHub API Integration**: Repository and model tracking
- **OpenAI/Anthropic/Google API**: Model information synchronization
- **Real-time Monitoring Service**: Live status updates

## Environment Configuration
- Multiple environment profiles (.env.local, .env.production)
- Database connection via DATABASE_URL
- Redis connection via REDIS_URL
- API keys for various AI providers
- Neon PostgreSQL integration

## Development Commands
```bash
npm run dev         # Start development server
npm run build       # Production build
npm run db:push     # Update database schema
npm run sync:aa     # Sync Artificial Analysis data
npm run test:e2e    # Run E2E tests
```

## Session Context Established
- Project type: Next.js full-stack application
- Primary focus: AI model monitoring and benchmarking
- Development environment: Windows (D:\ksy_project\ai server information)
- Active branch: master
- Ready for development tasks

---
*Context loaded successfully. Ready for development assistance.*