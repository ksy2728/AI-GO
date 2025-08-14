import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.DATABASE_URL = 'file:./test.db'
process.env.REDIS_URL = ''
process.env.NODE_ENV = 'test'