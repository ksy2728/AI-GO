'use client'

import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableModel } from '@/types/table'
import { getStatusColor } from '@/lib/utils'
import {
  formatPricing,
  formatContextLength,
  formatLatency,
  formatThroughput,
  formatQuality
} from '@/lib/models-table-mapper'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useGlobalStats } from '@/contexts/ModelsContext'

interface ModelTableProps {
  models: TableModel[]
  onModelClick?: (model: TableModel) => void
  className?: string
}

const columnHelper = createColumnHelper<TableModel>()

export function ModelTable({ models, onModelClick, className }: ModelTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const { totalModels } = useGlobalStats()
  
  // 서버리스 환경 감지 및 페이지네이션
  const isServerlessEnv = typeof window !== 'undefined' && 
    (window.location.hostname.includes('vercel.app') || process.env.NODE_ENV === 'production')
  
  // 서버리스 환경에서는 20개로 제한, 로컬에서는 50개
  const displayLimit = isServerlessEnv ? 20 : 50
  const displayModels = useMemo(() => models.slice(0, displayLimit), [models, displayLimit])

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Model',
      cell: (info) => (
        <div className="min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {info.getValue()}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {info.row.original.provider}
          </div>
        </div>
      ),
      minSize: 200
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <Badge 
          variant="secondary" 
          className={`${getStatusColor(info.getValue())} text-white text-xs px-2 py-1`}
        >
          {info.getValue()}
        </Badge>
      ),
      minSize: 100
    }),
    columnHelper.accessor('modalities', {
      header: 'Modalities',
      cell: (info) => (
        <div className="flex flex-wrap gap-1">
          {info.getValue().slice(0, 2).map((modality: string) => (
            <Badge key={modality} variant="outline" className="text-xs">
              {modality}
            </Badge>
          ))}
          {info.getValue().length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{info.getValue().length - 2}
            </Badge>
          )}
        </div>
      ),
      enableSorting: false,
      minSize: 120
    }),
    columnHelper.accessor('contextLength', {
      header: 'Context',
      cell: (info) => formatContextLength(info.getValue()),
      minSize: 80
    }),
    columnHelper.accessor('inputTokenPrice', {
      header: 'Input Price',
      cell: (info) => formatPricing(info.getValue()),
      minSize: 100
    }),
    columnHelper.accessor('outputTokenPrice', {
      header: 'Output Price', 
      cell: (info) => formatPricing(info.getValue()),
      minSize: 100
    }),
    columnHelper.accessor('latency', {
      header: 'Latency',
      cell: (info) => formatLatency(info.getValue()),
      minSize: 80
    }),
    columnHelper.accessor('throughput', {
      header: 'Throughput',
      cell: (info) => formatThroughput(info.getValue()),
      minSize: 100
    })
  ], [])

  const table = useReactTable({
    data: displayModels,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting
    },
    initialState: {
      sorting: [{ id: 'name', desc: false }]
    }
  })

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className || ''}`}>
      {/* 테이블 헤더 정보 */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-600">
              Showing {displayModels.length} of {models.length} models
            </p>
            {totalModels > models.length && (
              <Badge variant="outline" className="text-xs text-gray-500">
                Total in DB: {totalModels}
              </Badge>
            )}
          </div>
          {models.length > displayLimit && (
            <p className="text-xs text-orange-600">
              Limited to {displayLimit} models for optimal performance
            </p>
          )}
        </div>
      </div>

      {/* 테이블 스크롤 컨테이너 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{ minWidth: header.column.columnDef.minSize }}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center space-x-1">
                        <div
                          className={`select-none ${
                            header.column.getCanSort() 
                              ? 'cursor-pointer hover:text-gray-700' 
                              : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </div>
                        {header.column.getCanSort() && (
                          <div className="flex flex-col">
                            <ChevronUp 
                              className={`w-3 h-3 ${
                                header.column.getIsSorted() === 'asc' 
                                  ? 'text-blue-600' 
                                  : 'text-gray-300'
                              }`}
                            />
                            <ChevronDown 
                              className={`w-3 h-3 -mt-1 ${
                                header.column.getIsSorted() === 'desc' 
                                  ? 'text-blue-600' 
                                  : 'text-gray-300'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row, index) => (
              <tr 
                key={row.id}
                className={`
                  ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  ${onModelClick ? 'hover:bg-blue-50 cursor-pointer' : ''}
                  transition-colors duration-150
                `}
                onClick={() => onModelClick?.(row.original)}
              >
                {row.getVisibleCells().map(cell => (
                  <td 
                    key={cell.id}
                    className="px-4 py-3 whitespace-nowrap text-sm"
                    style={{ minWidth: cell.column.columnDef.minSize }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 빈 상태 */}
      {displayModels.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No models to display</p>
        </div>
      )}
    </div>
  )
}