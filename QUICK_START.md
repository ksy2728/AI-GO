# AI-GO Quick Start Guide

## 🚀 Immediate Next Steps

### Step 1: Initialize Project (5 minutes)
```bash
# Create Next.js app with all options
npx create-next-app@latest ai-go \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git

cd ai-go
```

### Step 2: Install Dependencies (5 minutes)
```bash
# Core dependencies
npm install \
  @tanstack/react-query@5 \
  @tanstack/react-query-devtools@5 \
  recharts \
  socket.io-client \
  clsx \
  tailwind-merge \
  lucide-react

# Database & Backend
npm install \
  prisma \
  @prisma/client \
  ioredis \
  bull \
  bcryptjs \
  jsonwebtoken

# Internationalization
npm install \
  next-intl \
  @formatjs/intl-localematcher \
  negotiator

# Dev dependencies
npm install -D \
  @types/node \
  @types/bcryptjs \
  @types/jsonwebtoken \
  @types/negotiator \
  prettier \
  eslint-config-prettier
```

### Step 3: Initialize Shadcn UI (3 minutes)
```bash
npx shadcn-ui@latest init

# When prompted:
# - Would you like to use TypeScript? → Yes
# - Which style? → Default
# - Which color? → Slate
# - CSS variables? → Yes

# Add essential components
npx shadcn-ui@latest add \
  button \
  card \
  dialog \
  dropdown-menu \
  input \
  label \
  select \
  separator \
  skeleton \
  switch \
  table \
  tabs \
  toast \
  tooltip
```

### Step 4: Setup Database (5 minutes)
```bash
# Initialize Prisma
npx prisma init

# Create initial schema (copy from DATABASE_DESIGN.md)
# Then run:
npx prisma generate
npx prisma db push
```

### Step 5: Create Project Structure (2 minutes)
```bash
# Create directories
mkdir -p src/app/api/v1/{status,models,benchmarks,news}
mkdir -p src/app/\[locale\]/{status,benchmarks,compare,news}
mkdir -p src/components/{ui,charts,layout,features}
mkdir -p src/lib/{db,api,utils}
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/config
mkdir -p public/locales/{en,zh,ja,ko}
```

## 📝 Essential Files to Create First

### 1. Database Connection (`src/lib/db.ts`)
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 2. Redis Connection (`src/lib/redis.ts`)
```typescript
import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

redis.on('error', (err) => {
  console.error('Redis Client Error', err)
})

redis.on('connect', () => {
  console.log('Redis Client Connected')
})
```

### 3. API Client (`src/lib/api-client.ts`)
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }

  return res.json()
}
```

### 4. Theme Provider (`src/components/theme-provider.tsx`)
```typescript
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### 5. Root Layout (`src/app/layout.tsx`)
```typescript
import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI-GO - Global AI Model Monitoring',
  description: 'Real-time monitoring of AI model performance, benchmarks, and news',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

## 🔥 First Feature: Status Dashboard

### 1. Status API Route (`src/app/api/v1/status/route.ts`)
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const region = searchParams.get('region') || 'us-east'
  const limit = parseInt(searchParams.get('limit') || '20')
  
  // Check cache first
  const cacheKey = `status:${region}:${limit}`
  const cached = await redis.get(cacheKey)
  
  if (cached) {
    return NextResponse.json(JSON.parse(cached))
  }
  
  // Fetch from database
  const models = await prisma.model.findMany({
    where: { isActive: true },
    include: {
      provider: true,
    },
    take: limit,
  })
  
  // Transform and cache
  const result = {
    models: models.map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider.name,
      status: 'operational', // Mock for now
      availability: 99.9,
      latencyP95: 250,
    })),
    region,
    timestamp: new Date().toISOString(),
  }
  
  await redis.set(cacheKey, JSON.stringify(result), 'EX', 30)
  
  return NextResponse.json(result)
}
```

### 2. Status Page Component (`src/app/status/page.tsx`)
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAPI } from '@/lib/api-client'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function StatusPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['status'],
    queryFn: () => fetchAPI('/status'),
    refetchInterval: 30000, // 30 seconds
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">AI Model Status</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-full" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Model Status</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.models.map((model: any) => (
          <Card key={model.id} className="p-6">
            <h3 className="font-semibold text-lg">{model.name}</h3>
            <p className="text-sm text-gray-500">{model.provider}</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span>Status</span>
                <span className="text-green-500">●</span>
              </div>
              <div className="flex justify-between">
                <span>Availability</span>
                <span>{model.availability}%</span>
              </div>
              <div className="flex justify-between">
                <span>Latency</span>
                <span>{model.latencyP95}ms</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

## 🎯 Next Actions

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test First Route**
   - Visit: http://localhost:3000/api/v1/status
   - Visit: http://localhost:3000/status

3. **Add Sample Data**
   - Create `prisma/seed.ts`
   - Add sample providers and models
   - Run `npx prisma db seed`

4. **Implement WebSocket**
   - Create Socket.io server
   - Add real-time updates
   - Connect to frontend

5. **Add i18n**
   - Configure next-intl
   - Add translation files
   - Implement language switcher

## 🐛 Common Issues & Solutions

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Database Connection Failed
```bash
# Make sure PostgreSQL is running
# Update DATABASE_URL in .env
# Run migrations
npx prisma migrate dev
```

### Redis Connection Failed
```bash
# Install and start Redis locally
# Or use Docker:
docker run -d -p 6379:6379 redis:alpine
```

## 📚 Helpful Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Prisma Quick Start](https://www.prisma.io/docs/getting-started/quickstart)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Shadcn UI Components](https://ui.shadcn.com)

## 🎉 You're Ready!

After completing these steps, you'll have:
- ✅ Next.js 14 app with TypeScript
- ✅ Tailwind CSS configured
- ✅ Shadcn UI components ready
- ✅ Database connection setup
- ✅ API routes structure
- ✅ First working page

Happy coding! 🚀