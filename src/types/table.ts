export interface TableModel {
  id: string
  name: string
  provider: string
  status: string
  modalities: string[]
  contextLength?: number
  inputTokenPrice?: number
  outputTokenPrice?: number
  throughput?: number
  latency?: number
  quality?: number
  description?: string
}

export interface TableColumn {
  id: string
  header: string
  accessorKey?: string
  cell?: (value: any) => React.ReactNode
  sortable?: boolean
  width?: string
}

export interface TableProps {
  models: TableModel[]
  onModelClick?: (model: TableModel) => void
  className?: string
}