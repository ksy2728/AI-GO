'use client'

import { useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import * as Select from '@radix-ui/react-select'
import { cn } from '@/lib/utils'
import { Region, AVAILABLE_REGIONS } from '@/types/regions'

interface RegionSelectProps {
  value?: Region
  onValueChange?: (region: Region) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function RegionSelect({ 
  value, 
  onValueChange, 
  disabled = false, 
  placeholder = 'Select region...',
  className 
}: RegionSelectProps) {
  const [open, setOpen] = useState(false)

  const handleValueChange = (regionCode: string) => {
    const region = AVAILABLE_REGIONS.find(r => r.code === regionCode)
    if (region && onValueChange) {
      onValueChange(region)
    }
    setOpen(false)
  }

  return (
    <Select.Root 
      value={value?.code} 
      onValueChange={handleValueChange}
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
    >
      <Select.Trigger
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'hover:bg-accent hover:text-accent-foreground transition-colors',
          className
        )}
      >
        <Select.Value placeholder={placeholder}>
          {value ? (
            <div className="flex items-center gap-2">
              <span className="text-base">{value.flag}</span>
              <span className="truncate">{value.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>{placeholder}</span>
            </div>
          )}
        </Select.Value>
        <Select.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={cn(
            'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
          )}
          position="popper"
          sideOffset={4}
        >
          <Select.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
            <ChevronDown className="h-4 w-4" />
          </Select.ScrollUpButton>

          <Select.Viewport className="p-1">
            {AVAILABLE_REGIONS.map((region) => (
              <Select.Item
                key={region.code}
                value={region.code}
                className={cn(
                  'relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none',
                  'focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                  'hover:bg-accent hover:text-accent-foreground transition-colors'
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <Select.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </Select.ItemIndicator>
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-base">{region.flag}</span>
                  <div className="flex flex-col">
                    <Select.ItemText className="font-medium">
                      {region.name}
                    </Select.ItemText>
                    <span className="text-xs text-muted-foreground">
                      {region.displayName}
                    </span>
                  </div>
                </div>
              </Select.Item>
            ))}
          </Select.Viewport>

          <Select.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
            <ChevronDown className="h-4 w-4" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

// Compact version for smaller spaces
export function RegionSelectCompact({ 
  value, 
  onValueChange, 
  disabled = false,
  className 
}: Omit<RegionSelectProps, 'placeholder'>) {
  return (
    <RegionSelect
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      placeholder="Region"
      className={cn('h-8 min-w-[120px]', className)}
    />
  )
}