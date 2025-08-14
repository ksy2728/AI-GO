import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.DATABASE_URL = 'file:./test.db'
process.env.REDIS_URL = ''
process.env.NODE_ENV = 'test'
process.env.OPENAI_API_KEY = 'test-api-key'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// UI components will be mocked individually in tests if needed

jest.mock('lucide-react', () => ({
  X: () => 'X',
  Calendar: () => 'Calendar',
  Code: () => 'Code',
  Globe: () => 'Globe',
  DollarSign: () => 'DollarSign',
  Activity: () => 'Activity',
  TrendingUp: () => 'TrendingUp',
  TrendingDown: () => 'TrendingDown',
  AlertCircle: () => 'AlertCircle',
  Clock: () => 'Clock',
}))

// Mock OpenAI for tests
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    models: {
      list: jest.fn().mockResolvedValue({
        data: [
          { id: 'gpt-4', created: 1678536000, owned_by: 'openai' },
          { id: 'gpt-3.5-turbo', created: 1677536000, owned_by: 'openai' },
        ],
      }),
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          id: 'test-completion',
          choices: [
            {
              message: {
                content: 'Test response',
              },
            },
          ],
        }),
      },
    },
  })),
}))