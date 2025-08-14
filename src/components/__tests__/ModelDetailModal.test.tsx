import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ModelDetailModal } from '../ModelDetailModal'

describe('ModelDetailModal', () => {
  const mockModel = {
    id: '1',
    slug: 'gpt-4',
    name: 'GPT-4',
    description: 'Advanced language model',
    provider: {
      id: 'openai',
      name: 'OpenAI',
      slug: 'openai',
    },
    foundationModel: 'gpt-4',
    releasedAt: '2023-03-14T00:00:00Z',
    modalities: ['text', 'vision'],
    capabilities: ['chat', 'analysis', 'coding'],
    contextWindow: 128000,
    maxOutputTokens: 4096,
    trainingCutoff: '2023-04-01T00:00:00Z',
    apiVersion: 'v1',
    isActive: true,
    pricing: [
      {
        tier: 'standard',
        inputPerMillion: 30,
        outputPerMillion: 60,
        currency: 'USD',
      },
    ],
    benchmarks: [
      {
        suite: { name: 'MMLU', category: 'knowledge' },
        scoreNormalized: 0.867,
      },
    ],
    status: {
      status: 'operational',
      availability: 99.9,
      latencyP50: 250,
    },
  }

  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render modal when model is provided', () => {
    render(<ModelDetailModal model={mockModel} onClose={mockOnClose} />)
    
    expect(screen.getByText('GPT-4')).toBeInTheDocument()
    expect(screen.getByText('Advanced language model')).toBeInTheDocument()
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
  })

  it('should not render when model is null', () => {
    const { container } = render(<ModelDetailModal model={null} onClose={mockOnClose} />)
    expect(container.firstChild).toBeNull()
  })

  it('should display all tabs', () => {
    render(<ModelDetailModal model={mockModel} onClose={mockOnClose} />)
    
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Technical')).toBeInTheDocument()
    expect(screen.getByText('Pricing')).toBeInTheDocument()
    expect(screen.getByText('Benchmarks')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('should display model capabilities', () => {
    render(<ModelDetailModal model={mockModel} onClose={mockOnClose} />)
    
    expect(screen.getByText('chat')).toBeInTheDocument()
    expect(screen.getByText('analysis')).toBeInTheDocument()
    expect(screen.getByText('coding')).toBeInTheDocument()
  })

  it('should display modalities', () => {
    render(<ModelDetailModal model={mockModel} onClose={mockOnClose} />)
    
    expect(screen.getByText('text')).toBeInTheDocument()
    expect(screen.getByText('vision')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    render(<ModelDetailModal model={mockModel} onClose={mockOnClose} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should display pricing information', () => {
    render(<ModelDetailModal model={mockModel} onClose={mockOnClose} />)
    
    // Click on Pricing tab
    const pricingTab = screen.getByText('Pricing')
    fireEvent.click(pricingTab)
    
    expect(screen.getByText(/\$30\.00/)).toBeInTheDocument()
    expect(screen.getByText(/\$60\.00/)).toBeInTheDocument()
  })

  it('should display benchmark scores', () => {
    render(<ModelDetailModal model={mockModel} onClose={mockOnClose} />)
    
    // Click on Benchmarks tab
    const benchmarksTab = screen.getByText('Benchmarks')
    fireEvent.click(benchmarksTab)
    
    expect(screen.getByText('MMLU')).toBeInTheDocument()
    expect(screen.getByText('86.7%')).toBeInTheDocument()
  })

  it('should display operational status', () => {
    render(<ModelDetailModal model={mockModel} onClose={mockOnClose} />)
    
    // Click on Status tab
    const statusTab = screen.getByText('Status')
    fireEvent.click(statusTab)
    
    expect(screen.getByText(/Operational/i)).toBeInTheDocument()
    expect(screen.getByText(/99\.9%/)).toBeInTheDocument()
  })

  it('should handle missing optional data gracefully', () => {
    const minimalModel = {
      ...mockModel,
      pricing: [],
      benchmarks: [],
      status: null,
    }
    
    render(<ModelDetailModal model={minimalModel} onClose={mockOnClose} />)
    
    // Should not crash and display appropriate messages
    const pricingTab = screen.getByText('Pricing')
    fireEvent.click(pricingTab)
    expect(screen.getByText(/No pricing information available/i)).toBeInTheDocument()
  })
})