import { cn, formatNumber, formatDate, formatCurrency, getStatusColor, calculatePercentChange } from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('should combine class names', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      const result = cn('base', { active: true, disabled: false })
      expect(result).toBe('base active')
    })

    it('should merge tailwind classes correctly', () => {
      const result = cn('text-red-500', 'text-blue-500')
      expect(result).toBe('text-blue-500')
    })

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'end')
      expect(result).toBe('base end')
    })
  })

  describe('formatNumber', () => {
    it('should format large numbers with K suffix', () => {
      expect(formatNumber(1500)).toBe('1.5K')
      expect(formatNumber(15000)).toBe('15K')
    })

    it('should format millions with M suffix', () => {
      expect(formatNumber(1500000)).toBe('1.5M')
      expect(formatNumber(15000000)).toBe('15M')
    })

    it('should format billions with B suffix', () => {
      expect(formatNumber(1500000000)).toBe('1.5B')
    })

    it('should return small numbers as is', () => {
      expect(formatNumber(999)).toBe('999')
      expect(formatNumber(0)).toBe('0')
    })

    it('should handle negative numbers', () => {
      expect(formatNumber(-1500)).toBe('-1.5K')
      expect(formatNumber(-1500000)).toBe('-1.5M')
    })
  })

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const date = '2024-03-14T12:30:00Z'
      const formatted = formatDate(date)
      expect(formatted).toContain('Mar')
      expect(formatted).toContain('14')
      expect(formatted).toContain('2024')
    })

    it('should format Date object correctly', () => {
      const date = new Date('2024-03-14T12:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toContain('Mar')
      expect(formatted).toContain('14')
      expect(formatted).toContain('2024')
    })

    it('should handle invalid dates', () => {
      const result = formatDate('invalid')
      expect(result).toBe('Invalid Date')
    })

    it('should handle null and undefined', () => {
      expect(formatDate(null)).toBe('N/A')
      expect(formatDate(undefined)).toBe('N/A')
    })
  })

  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(1234.5)).toBe('$1,234.50')
      expect(formatCurrency(1234)).toBe('$1,234.00')
    })

    it('should handle different currencies', () => {
      expect(formatCurrency(1234.56, 'EUR')).toContain('1,234.56')
      expect(formatCurrency(1234.56, 'GBP')).toContain('1,234.56')
    })

    it('should handle zero and negative values', () => {
      expect(formatCurrency(0)).toBe('$0.00')
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56')
    })

    it('should handle very large numbers', () => {
      expect(formatCurrency(1000000000)).toBe('$1,000,000,000.00')
    })
  })

  describe('getStatusColor', () => {
    it('should return correct colors for status', () => {
      expect(getStatusColor('operational')).toBe('bg-green-500')
      expect(getStatusColor('degraded')).toBe('bg-yellow-500')
      expect(getStatusColor('outage')).toBe('bg-red-500')
      expect(getStatusColor('maintenance')).toBe('bg-blue-500')
    })

    it('should return default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('bg-gray-500')
      expect(getStatusColor('')).toBe('bg-gray-500')
    })

    it('should handle case insensitive status', () => {
      expect(getStatusColor('OPERATIONAL')).toBe('bg-green-500')
      expect(getStatusColor('Degraded')).toBe('bg-yellow-500')
    })
  })

  describe('calculatePercentChange', () => {
    it('should calculate positive percent change', () => {
      expect(calculatePercentChange(100, 150)).toBe(50)
      expect(calculatePercentChange(50, 100)).toBe(100)
    })

    it('should calculate negative percent change', () => {
      expect(calculatePercentChange(150, 100)).toBe(-33.33)
      expect(calculatePercentChange(100, 50)).toBe(-50)
    })

    it('should handle zero values', () => {
      expect(calculatePercentChange(0, 100)).toBe(Infinity)
      expect(calculatePercentChange(100, 0)).toBe(-100)
      expect(calculatePercentChange(0, 0)).toBe(0)
    })

    it('should handle same values', () => {
      expect(calculatePercentChange(100, 100)).toBe(0)
    })

    it('should round to 2 decimal places', () => {
      expect(calculatePercentChange(3, 10)).toBe(233.33)
    })
  })
})