# AI-GO - Global AI Model Monitoring Platform

Real-time monitoring of AI model performance, availability, benchmarks, and industry news from around the world.

## 🚀 Features

- **Real-time Status Monitoring** - Live availability, latency, and performance metrics
- **Model Catalog** - Comprehensive listing of AI models across all major providers
- **Benchmark Comparisons** - Standardized performance comparisons with interactive visualizations
- **WebSocket Updates** - Real-time data streaming for live dashboards
- **Multi-language Support** - Full i18n for 11 languages
- **Dark/Light Theme** - Automatic theme detection with manual override
- **Responsive Design** - Optimized for desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Time-series**: TimescaleDB
- **Caching**: Redis
- **Real-time**: Socket.IO
- **Charts**: Recharts
- **State Management**: TanStack Query

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- npm or yarn

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/ai-go.git
cd ai-go
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your database credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/aigo?schema=public"
REDIS_URL="redis://localhost:6379"
```

4. Set up the database:
```bash
# Create the database
createdb aigo

# Run Prisma migrations
npm run db:push

# Seed the database with sample data
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🗄️ Database Setup

### PostgreSQL Setup

1. Install PostgreSQL if not already installed
2. Create a new database:
```sql
CREATE DATABASE aigo;
```

3. Install TimescaleDB extension:
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

### Redis Setup

1. Install Redis if not already installed
2. Start Redis server:
```bash
redis-server
```

## 🌍 Internationalization

The platform supports the following languages:
- English (en-US)
- Spanish (es-ES)
- French (fr-FR)
- German (de-DE)
- Japanese (ja-JP)
- Chinese Simplified (zh-CN)
- Portuguese (pt-BR)
- Italian (it-IT)
- Russian (ru-RU)
- Korean (ko-KR)
- Hindi (hi-IN)

## 📝 API Documentation

### Status Endpoints
- `GET /api/v1/status` - Get current model status
- `GET /api/v1/models` - List all models
- `GET /api/v1/models/[id]` - Get model details
- `GET /api/v1/models/[id]/history` - Get historical data
- `GET /api/v1/benchmarks` - Get benchmark comparisons
- `GET /api/v1/news` - Get latest news
- `GET /api/v1/search` - Global search

### WebSocket Events
- `subscribe:models` - Subscribe to model status updates
- `subscribe:global` - Subscribe to global status
- `status:update` - Receive status updates
- `benchmark:update` - Receive benchmark updates

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci --only=production
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- shadcn for the beautiful UI components
- All contributors and supporters of the project# Trigger rebuild
