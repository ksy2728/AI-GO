import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ModelsPage from '../page'

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  api: {
    getModels: jest.fn()
  }
}))

// Mock the components
jest.mock('@/components/ModelDetailModal', () => ({
  ModelDetailModal: ({ model, onClose }: any) => 
    model ? <div data-testid="model-detail-modal">Model Detail</div> : null
}))

jest.mock('@/components/ModelComparisonModal', () => ({
  ModelComparisonModal: ({ models, onClose }: any) => 
    models?.length >= 2 ? <div data-testid="model-comparison-modal">Model Comparison</div> : null
}))

const { api } = require('@/lib/api-client')

describe('ModelsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Modalities Handling', () => {
    it('should handle models with undefined modalities', async () => {
      const mockModels = [
        {
          id: '1',
          name: 'Test Model 1',
          providerId: 'test-provider',
          description: 'Test description',
          isActive: true,
          modalities: undefined // undefined modalities
        }
      ]

      api.getModels.mockResolvedValue({ models: mockModels })

      render(<ModelsPage />)

      // Wait for loading to complete
      await screen.findByText('Test Model 1')

      // Should display "No modalities" badge instead of crashing
      expect(screen.getByText('No modalities')).toBeInTheDocument()
    })

    it('should handle models with empty modalities array', async () => {
      const mockModels = [
        {
          id: '2',
          name: 'Test Model 2',
          providerId: 'test-provider',
          description: 'Test description',
          isActive: true,
          modalities: [] // empty array
        }
      ]

      api.getModels.mockResolvedValue({ models: mockModels })

      render(<ModelsPage />)

      await screen.findByText('Test Model 2')

      // Should display "No modalities" badge
      expect(screen.getByText('No modalities')).toBeInTheDocument()
    })

    it('should display modalities when they exist', async () => {
      const mockModels = [
        {
          id: '3',
          name: 'Test Model 3',
          providerId: 'test-provider',
          description: 'Test description',
          isActive: true,
          modalities: ['text', 'image', 'audio'] // valid modalities
        }
      ]

      api.getModels.mockResolvedValue({ models: mockModels })

      render(<ModelsPage />)

      await screen.findByText('Test Model 3')

      // Should display first two modalities
      expect(screen.getByText('text')).toBeInTheDocument()
      expect(screen.getByText('image')).toBeInTheDocument()
      
      // Should show "+1 more" for the third modality
      expect(screen.getByText('+1 more')).toBeInTheDocument()
    })

    it('should handle models with null modalities', async () => {
      const mockModels = [
        {
          id: '4',
          name: 'Test Model 4',
          providerId: 'test-provider',
          description: 'Test description',
          isActive: true,
          modalities: null // null modalities
        }
      ]

      api.getModels.mockResolvedValue({ models: mockModels })

      render(<ModelsPage />)

      await screen.findByText('Test Model 4')

      // Should display "No modalities" badge without crashing
      expect(screen.getByText('No modalities')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      api.getModels.mockRejectedValue(new Error('API Error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<ModelsPage />)

      // Wait for error to be logged
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch models:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })
})