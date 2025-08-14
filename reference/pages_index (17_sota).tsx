import React, { useState, useEffect } from 'react'
import { Search, Settings, User, ChevronDown, ChevronRight, Download, X, Check, TrendingUp, TrendingDown, Calendar, BarChart3, Layers, Share2, Eye } from 'lucide-react'
import * as Accordion from '@radix-ui/react-accordion'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Checkbox from '@radix-ui/react-checkbox'
import * as Dialog from '@radix-ui/react-dialog'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Treemap } from 'recharts'

interface Model {
  id: string
  name: string
  company: string
  icon: string
  context: string
  modalities: string[]
  priceIn: number
  priceOut: number
  status: 'GOOD' | 'BAD'
  updated: string
  benchmarkScore?: number
  usage?: number
  description?: string
}

const mockModels: Model[] = [
  { id: '1', name: 'GPT-4.1', company: 'OpenAI', icon: '🤖', context: '1M', modalities: ['Text', 'Code', 'Image'], priceIn: 2, priceOut: 8, status: 'GOOD', updated: '07-18', benchmarkScore: 95, usage: 34, description: 'State-of-the-art multimodal LLM with 1 million token context window.' },
  { id: '2', name: 'Claude 3 Opus', company: 'Anthropic', icon: '🧠', context: '200K', modalities: ['Text', 'Code'], priceIn: 15, priceOut: 75, status: 'GOOD', updated: '07-17', benchmarkScore: 93, usage: 22, description: 'Advanced text and code LLM with strong safety features.' },
  { id: '3', name: 'Gemini Ultra', company: 'Google', icon: '💎', context: '1M', modalities: ['Text', 'Code', 'Image', 'Audio'], priceIn: 10, priceOut: 30, status: 'GOOD', updated: '07-18', benchmarkScore: 94, usage: 18, description: 'Multimodal LLM supporting text, code, image, and audio inputs.' },
  { id: '4', name: 'Llama 3 70B', company: 'Meta', icon: '🦙', context: '128K', modalities: ['Text'], priceIn: 0.5, priceOut: 1.5, status: 'GOOD', updated: '07-16', benchmarkScore: 88, usage: 12, description: 'Large open-source text LLM with efficient inference.' },
  { id: '5', name: 'Mistral Large', company: 'Mistral', icon: '🌪️', context: '32K', modalities: ['Text', 'Code'], priceIn: 8, priceOut: 24, status: 'GOOD', updated: '07-15', benchmarkScore: 87, usage: 8, description: 'High-performance text and code LLM optimized for speed.' },
  { id: '6', name: 'Command R+', company: 'Cohere', icon: '🎯', context: '128K', modalities: ['Text'], priceIn: 3, priceOut: 15, status: 'BAD', updated: '07-14', benchmarkScore: 85, usage: 6, description: 'Text LLM with some reliability issues reported.' },
  { id: '7', name: 'Mixtral 8x22B v2', company: 'Mistral', icon: '🌪️', context: '64K', modalities: ['Text', 'Code'], priceIn: 2, priceOut: 6, status: 'GOOD', updated: '07-18', benchmarkScore: 86, usage: 5, description: 'Updated version of Mixtral with improved accuracy.' },
  { id: '8', name: 'Grok 1.5', company: 'xAI', icon: '🚀', context: '128K', modalities: ['Text'], priceIn: 5, priceOut: 15, status: 'BAD', updated: '07-17', benchmarkScore: 84, usage: 4, description: 'Experimental text LLM with mixed reviews.' },
  { id: '9', name: 'GPT-4o', company: 'OpenAI', icon: '🤖', context: '128K', modalities: ['Text', 'Code', 'Image'], priceIn: 5, priceOut: 15, status: 'GOOD', updated: '07-18', benchmarkScore: 92, usage: 28, description: 'Optimized GPT-4 variant with enhanced image capabilities.' },
  { id: '10', name: 'Claude 3 Sonnet', company: 'Anthropic', icon: '🧠', context: '200K', modalities: ['Text'], priceIn: 3, priceOut: 15, status: 'GOOD', updated: '07-17', benchmarkScore: 89, usage: 15, description: 'Text-only LLM with strong contextual understanding.' },
]

const treemapData = [
  { name: 'OpenAI', value: 54, children: [{ name: 'GPT-4o', value: 34 }, { name: 'GPT-4-mini', value: 13 }, { name: 'GPT-3.5', value: 7 }] },
  { name: 'Anthropic', value: 22, children: [{ name: 'Claude 3 Opus', value: 15 }, { name: 'Claude 3 Sonnet', value: 7 }] },
  { name: 'Google', value: 12, children: [{ name: 'Gemini Ultra', value: 8 }, { name: 'Gemini Pro', value: 4 }] },
  { name: 'Meta', value: 8, children: [{ name: 'Llama 3 70B', value: 5 }, { name: 'Llama 3 8B', value: 3 }] },
  { name: 'Others', value: 4 },
]

const events = [
  { id: '1', date: '2024-07-25', title: 'AI Safety Summit', speaker: 'Dr. Sarah Chen', type: 'upcoming' },
  { id: '2', date: '2024-07-20', title: 'LLM Architecture Deep Dive', speaker: 'Prof. Alex Kumar', type: 'upcoming' },
  { id: '3', date: '2024-07-10', title: 'Multimodal AI Revolution', speaker: 'Jane Smith', type: 'past', slides: true },
  { id: '4', date: '2024-07-05', title: 'Scaling Laws & Efficiency', speaker: 'Dr. Mike Johnson', type: 'past', slides: true },
]

// Move CustomTreemapContent here before usage
const CustomTreemapContent = ({ root, depth, x, y, width, height, index, colors }: any) => {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: depth < 2 ? colors[Math.floor((index / root.children.length) * colors.length)] : 'rgba(255,255,255,0.5)',
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {depth === 1 && (
        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={14}>
          {root.name}
        </text>
      )}
      {depth === 1 && (
        <text x={x + width / 2} y={y + height / 2 + 20} textAnchor="middle" fill="#fff" fontSize={12}>
          {root.value}%
        </text>
      )}
    </g>
  )
}

export default function AIGODashboard() {
  const [activeTab, setActiveTab] = useState('Total')
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [showCompareBar, setShowCompareBar] = useState(false)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [showBenchmarks, setShowBenchmarks] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBenchmark, setSelectedBenchmark] = useState('MMLU')
  const [compareDialogOpen, setCompareDialogOpen] = useState(false)

  const tabs = ['Total', 'Text LLM', 'Code LLM', 'Image', 'Audio', 'Multimodal']

  useEffect(() => {
    setShowCompareBar(selectedModels.length > 0)
  }, [selectedModels])

  const handleModelSelect = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, id].length <= 2 ? [...prev, modelId] : prev
    )
  }

  const clearSelection = () => {
    setSelectedModels([])
  }

  const filteredModels = mockModels.filter(model => {
    if (activeTab === 'Total') return true
    if (activeTab === 'Text LLM') return model.modalities.includes('Text')
    if (activeTab === 'Code LLM') return model.modalities.includes('Code')
    if (activeTab === 'Image') return model.modalities.includes('Image')
    if (activeTab === 'Audio') return model.modalities.includes('Audio')
    if (activeTab === 'Multimodal') return model.modalities.length > 1
    return true
  }).filter(model => model.name.toLowerCase().includes(searchQuery.toLowerCase()) || model.company.toLowerCase().includes(searchQuery.toLowerCase()))

  const spotlightModels = filteredModels.slice(0, 6)
  const listModels = filteredModels.slice(6)

  const openModelDetail = (model: Model) => {
    setSelectedModel(model)
  }

  const closeModelDetail = () => {
    setSelectedModel(null)
  }

  const openCompareDialog = () => {
    if (selectedModels.length >= 2) {
      setCompareDialogOpen(true)
    }
  }

  const closeCompareDialog = () => {
    setCompareDialogOpen(false)
  }

  const selectedModelsData = mockModels.filter(m => selectedModels.includes(m.id))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Header */}
      <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="h-full flex items-center px-4">
          {/* Logo */}
          <div className="w-32 flex items-center cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="text-2xl font-bold text-blue-600">AI-GO</div>
            <div className="ml-2 text-xl">⬩</div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-sm mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search model, company, or feature..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Primary Tabs */}
          <nav className="flex space-x-6 ml-auto mr-8">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setShowBenchmarks(tab === 'Total')
                  clearSelection()
                }}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* Profile/Settings */}
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Settings">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg" aria-label="User Profile">
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Gutter */}
        <div className="w-16 bg-gray-100 min-h-screen">
          <nav className="mt-8 space-y-4">
            <button className="w-full p-3 hover:bg-gray-200 text-gray-700" onClick={() => window.scrollTo(0, 0)} aria-label="Overview">
              <Eye className="w-5 h-5 mx-auto" />
            </button>
            <button className="w-full p-3 hover:bg-gray-200 text-gray-700" onClick={() => setShowBenchmarks(true)} aria-label="Benchmarks">
              <BarChart3 className="w-5 h-5 mx-auto" />
            </button>
            <button className="w-full p-3 hover:bg-gray-200 text-gray-700" aria-label="Compare">
              <Layers className="w-5 h-5 mx-auto" />
            </button>
            <button className="w-full p-3 hover:bg-gray-200 text-gray-700" aria-label="Events">
              <Calendar className="w-5 h-5 mx-auto" />
            </button>
            <button className="w-full p-3 hover:bg-gray-200 text-gray-700" aria-label="Usage Share">
              <Share2 className="w-5 h-5 mx-auto" />
            </button>
          </nav>
        </div>

        {/* Main Rail */}
        <main className="flex-1 max-w-6xl mx-auto px-6 py-6">
          {showBenchmarks && activeTab === 'Total' ? (
            <BenchmarkRanking
              selectedBenchmark={selectedBenchmark}
              setSelectedBenchmark={setSelectedBenchmark}
              models={mockModels}
              openModelDetail={openModelDetail}
            />
          ) : (
            <>
              <SpotlightGrid models={spotlightModels} openModelDetail={openModelDetail} />
              <DenseMasterList
                models={listModels}
                selectedModels={selectedModels}
                onSelect={handleModelSelect}
                openModelDetail={openModelDetail}
              />
              <EventsPanel />
            </>
          )}

          <UsageShareTreemap data={treemapData} openModelDetail={openModelDetail} />
        </main>

        {/* Right Sidebar */}
        <aside className="w-72 bg-white border-l border-gray-200 p-4 flex flex-col space-y-6">
          <LatestReleases />
          <QuickQuoteWidget models={mockModels} />
          <div className="border border-gray-300 rounded-md h-64 flex items-center justify-center text-gray-400">
            250250 Ad Slot
          </div>
        </aside>
      </div>

      {/* Compare Action Bar */}
      {showCompareBar && (
        <div className="fixed bottom-0 left-16 right-72 bg-white border-t border-gray-300 flex items-center justify-between px-6 h-12 shadow-md">
          <div className="text-sm text-gray-700">
            {selectedModels.length} of 2 models selected 	6 choose another to compare
          </div>
          <div className="space-x-4">
            <button
              onClick={openCompareDialog}
              disabled={selectedModels.length < 2}
              className={`px-3 py-1 rounded bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Compare Now
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1 rounded border border-gray-300 text-sm font-semibold hover:bg-gray-100"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Model Detail Drawer */}
      <Dialog.Root open={!!selectedModel} onOpenChange={open => !open && closeModelDetail()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
          <Dialog.Content className="fixed top-0 right-0 h-full w-104 bg-white shadow-lg p-6 overflow-y-auto">
            {selectedModel && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-4xl">{selectedModel.icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold">{selectedModel.name}</h3>
                      <StatusBadge status={selectedModel.status} />
                    </div>
                  </div>
                  <Dialog.Close asChild>
                    <button aria-label="Close" className="p-2 hover:bg-gray-100 rounded">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <SpecsTable model={selectedModel} />
                <LiveStatus model={selectedModel} />
                <PricingTable model={selectedModel} />
                <BenchmarksMini model={selectedModel} />
                <NotesSection description={selectedModel.description || ''} />
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Compare Dialog */}
      <Dialog.Root open={compareDialogOpen} onOpenChange={open => !open && closeCompareDialog()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
          <Dialog.Content className="fixed top-0 right-0 h-full w-104 bg-white shadow-lg p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Compare Models</h3>
              <Dialog.Close asChild>
                <button aria-label="Close" className="p-2 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border border-gray-300">Feature</th>
                    {selectedModelsData.map(model => (
                      <th key={model.id} className="p-2 border border-gray-300 text-center">
                        {model.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-gray-300 font-semibold">Company</td>
                    {selectedModelsData.map(model => (
                      <td key={model.id} className="p-2 border border-gray-300 text-center">
                        {model.company}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300 font-semibold">Context</td>
                    {selectedModelsData.map(model => (
                      <td key={model.id} className="p-2 border border-gray-300 text-center">
                        {model.context}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300 font-semibold">Modalities</td>
                    {selectedModelsData.map(model => (
                      <td key={model.id} className="p-2 border border-gray-300 text-center">
                        {model.modalities.join(', ')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300 font-semibold">Price In / Out</td>
                    {selectedModelsData.map(model => (
                      <td key={model.id} className="p-2 border border-gray-300 text-center">
                        ${model.priceIn} / ${model.priceOut}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300 font-semibold">Status</td>
                    {selectedModelsData.map(model => (
                      <td key={model.id} className="p-2 border border-gray-300 text-center">
                        <StatusBadge status={model.status} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300 font-semibold">Last Updated</td>
                    {selectedModelsData.map(model => (
                      <td key={model.id} className="p-2 border border-gray-300 text-center">
                        {model.updated}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

function StatusBadge({ status }: { status: 'GOOD' | 'BAD' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
        status === 'GOOD' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}
      aria-label={`Server status ${status.toLowerCase()}`}
    >
      <span
        className={`w-2 h-2 rounded-full mr-1 ${
          status === 'GOOD' ? 'bg-green-600' : 'bg-red-600'
        }`
        }
      />
      {status}
    </span>
  )
}

function SpotlightGrid({ models, openModelDetail }: { models: Model[]; openModelDetail: (model: Model) => void }) {
  return (
    <section className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6 max-w-[1020px]">
      {models.map(model => (
        <div
          key={model.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow cursor-pointer hover:shadow-md"
          onClick={() => openModelDetail(model)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && openModelDetail(model)}
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center text-3xl rounded bg-gray-100">
              {model.icon}
            </div>
            <div>
              <div className="font-semibold text-lg">{model.name}</div>
              <div className="text-sm text-gray-500">
                {model.context} ctx  {model.modalities.join(', ')}  ${model.priceIn}${model.priceOut}
              </div>
            </div>
          </div>
          <StatusBadge status={model.status} />
        </div>
      ))}
    </section>
  )
}

function DenseMasterList({ models, selectedModels, onSelect, openModelDetail }: { models: Model[]; selectedModels: string[]; onSelect: (id: string) => void; openModelDetail: (model: Model) => void }) {
  return (
    <section className="max-w-[1020px] mb-6">
      <div className="overflow-y-auto max-h-[800px] border border-gray-300 rounded">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr className="text-left text-sm text-gray-600">
              <th className="w-10 p-2">Check</th>
              <th className="w-10 p-2">Icon</th>
              <th className="p-2">Model</th>
              <th className="p-2">Context</th>
              <th className="p-2">Modalities</th>
              <th className="p-2">Price In/Out</th>
              <th className="p-2">Status</th>
              <th className="p-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {models.map(model => (
              <tr
                key={model.id}
                className={`cursor-pointer hover:shadow-md ${selectedModels.includes(model.id) ? 'bg-blue-50' : model.id && parseInt(model.id) % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                onClick={() => openModelDetail(model)}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && openModelDetail(model)}
              >
                <td className="p-2 text-center" onClick={e => e.stopPropagation()}>
                  <Checkbox.Root
                    id={`checkbox-${model.id}`}
                    checked={selectedModels.includes(model.id)}
                    onCheckedChange={() => onSelect(model.id)}
                    className="w-5 h-5 rounded border border-gray-400 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Select model ${model.name} for comparison`}
                  >
                    <Checkbox.Indicator>
                      <Check className="w-4 h-4 text-blue-600" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                </td>
                <td className="p-2 text-center text-2xl">{model.icon}</td>
                <td className="p-2">{model.name}</td>
                <td className="p-2">{model.context}</td>
                <td className="p-2">{model.modalities.join(', ')}</td>
                <td className="p-2">${model.priceIn} / ${model.priceOut}</td>
                <td className="p-2">
                  <StatusBadge status={model.status} />
                </td>
                <td className="p-2">{model.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function EventsPanel() {
  const [open, setOpen] = useState(false)
  return (
    <section className="max-w-[1020px]">
      <Accordion.Root type="single" collapsible onValueChange={val => setOpen(!!val)}>
        <Accordion.Item value="events">
          <Accordion.Header>
            <Accordion.Trigger className="flex items-center justify-between w-full p-4 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
              <span className="font-semibold text-lg">Presentation Schedule</span>
              {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="p-4 bg-white border border-t-0 border-gray-300 rounded-b">
            <div className="flex space-x-4">
              <EventsList type="past" />
              <EventsList type="upcoming" />
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </section>
  )
}

function EventsList({ type }: { type: 'past' | 'upcoming' }) {
  const filtered = events.filter(e => e.type === type)
  return (
    <div className="flex-1">
      <h4 className="font-semibold mb-2 capitalize">{type} Talks</h4>
      <ul className="space-y-2">
        {filtered.map(event => (
          <li key={event.id} className="text-sm">
            <div className="flex justify-between">
              <span>{event.date}</span>
              {event.type === 'past' && event.slides && (
                <a href="#" className="text-blue-600 hover:underline flex items-center space-x-1" aria-label={`Download slides for ${event.title}`}>
                  <Download className="w-4 h-4" />
                  <span>Slides</span>
                </a>
              )}
            </div>
            <div className="font-semibold">{event.title}</div>
            <div className="text-gray-500">{event.speaker}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LatestReleases() {
  const releases = [
    { id: 'r1', icon: '🤖', title: 'GPT-4o Patch', date: '07-18' },
    { id: 'r2', icon: '🧠', title: 'Claude 3 Opus Update', date: '07-17' },
    { id: 'r3', icon: '💎', title: 'Gemini Ultra Release', date: '07-18' },
  ]
  return (
    <section>
      <h4 className="font-semibold mb-2">Latest Releases</h4>
      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {releases.map(release => (
          <li key={release.id} className="flex items-center space-x-2 text-sm">
            <span className="text-2xl">{release.icon}</span>
            <span>{release.title}  {release.date}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function QuickQuoteWidget({ models }: { models: Model[] }) {
  const goodCount = models.filter(m => m.status === 'GOOD').length
  const badCount = models.filter(m => m.status === 'BAD').length
  return (
    <section>
      <h4 className="font-semibold mb-2">Quick Quote / Health Widget</h4>
      <div className="grid grid-cols-5 gap-1">
        {models.slice(0, 20).map(model => (
          <div
            key={model.id}
            className={`h-4 rounded ${model.status === 'GOOD' ? 'bg-green-500' : 'bg-red-500'}`}
            title={`${model.name}: ${model.status}`}
          />
        ))}
      </div>
      <div className="mt-2 text-sm text-gray-600">
        {goodCount} models GOOD, {badCount} models BAD
      </div>
    </section>
  )
}

function UsageShareTreemap({ data, openModelDetail }: { data: any[]; openModelDetail: (model: Model) => void }) {
  const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']

  const onClick = (node: any) => {
    if (node.depth === 2) {
      const model = mockModels.find(m => m.name === node.data.name)
      if (model) openModelDetail(model)
    }
  }

  return (
    <section className="max-w-[1020px] mt-6">
      <h3 className="text-lg font-semibold mb-2">Usage Share Treemap</h3>
      <ResponsiveContainer width="100%" height={240}>
        <Treemap
          data={data}
          dataKey="value"
          ratio={4 / 3}
          stroke="#fff"
          fill="#8884d8"
          content={(props) => <CustomTreemapContent {...props} colors={colors} />}
          onClick={onClick}
        />
      </ResponsiveContainer>
    </section>
  )
}

function BenchmarkRanking({ selectedBenchmark, setSelectedBenchmark, models, openModelDetail }: { selectedBenchmark: string; setSelectedBenchmark: (val: string) => void; models: Model[]; openModelDetail: (model: Model) => void }) {
  const benchmarks = ['MMLU', 'HumanEval', 'Others']

  const filteredModels = models.filter(m => m.benchmarkScore !== undefined).sort((a, b) => (b.benchmarkScore || 0) - (a.benchmarkScore || 0)).slice(0, 20)

  return (
    <section className="max-w-[1020px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Benchmark Rankings</h2>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="inline-flex items-center px-3 py-1 border border-gray-300 rounded cursor-pointer hover:bg-gray-100">
            {selectedBenchmark} <ChevronDown className="w-4 h-4 ml-1" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className="bg-white border border-gray-300 rounded shadow-md mt-1">
            {benchmarks.map(bm => (
              <DropdownMenu.Item
                key={bm}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                onSelect={() => setSelectedBenchmark(bm)}
              >
                {bm}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={filteredModels} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} />
          <YAxis dataKey="name" type="category" width={150} />
          <Tooltip />
          <Bar
            dataKey="benchmarkScore"
            fill="#3b82f6"
            onClick={(data) => {
              if (data && data.payload) {
                openModelDetail(data.payload as Model)
              }
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}

function SpecsTable({ model }: { model: Model }) {
  return (
    <table className="w-full mb-4 border border-gray-300 rounded">
      <tbody>
        <tr className="border-b border-gray-300">
          <td className="p-2 font-semibold">Company</td>
          <td className="p-2">{model.company}</td>
        </tr>
        <tr className="border-b border-gray-300">
          <td className="p-2 font-semibold">Context Window</td>
          <td className="p-2">{model.context}</td>
        </tr>
        <tr className="border-b border-gray-300">
          <td className="p-2 font-semibold">Modalities</td>
          <td className="p-2">{model.modalities.join(', ')}</td>
        </tr>
      </tbody>
    </table>
  )
}

function LiveStatus({ model }: { model: Model }) {
  // Mock sparkline data
  const data = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: Math.floor(Math.random() * 100) }))
  return (
    <div className="mb-4">
      <h4 className="font-semibold mb-2">Live Status (Last 30 days)</h4>
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function PricingTable({ model }: { model: Model }) {
  return (
    <table className="w-full mb-4 border border-gray-300 rounded">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 border border-gray-300">Plan</th>
          <th className="p-2 border border-gray-300">Price In</th>
          <th className="p-2 border border-gray-300">Price Out</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="p-2 border border-gray-300">Standard</td>
          <td className="p-2 border border-gray-300">${model.priceIn}</td>
          <td className="p-2 border border-gray-300">${model.priceOut}</td>
        </tr>
      </tbody>
    </table>
  )
}

function BenchmarksMini({ model }: { model: Model }) {
  return (
    <div className="mb-4">
      <h4 className="font-semibold mb-2">Benchmarks</h4>
      <div className="h-16">
        <ResponsiveContainer width="100%" height={60}>
          <BarChart data={[{ name: model.name, score: model.benchmarkScore || 0 }]}> 
            <Bar dataKey="score" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function NotesSection({ description }: { description: string }) {
  return (
    <div className="prose max-w-none">
      <h4 className="font-semibold mb-2">Notes</h4>
      <p>{description}</p>
    </div>
  )
}
