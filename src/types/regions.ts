export interface Region {
  code: string
  name: string
  displayName: string
  flag: string
  timezone: string
  location: {
    lat: number
    lng: number
  }
  provider?: string
}

// Only regions with actual data in database: 'global', 'us-east-1', 'us-east'
export const AVAILABLE_REGIONS: Region[] = [
  {
    code: 'global',
    name: 'Global',
    displayName: 'Global (All Regions)',
    flag: '🌍',
    timezone: 'UTC',
    location: { lat: 0, lng: 0 }
  },
  {
    code: 'us-east-1',
    name: 'US East 1',
    displayName: 'US East (N. Virginia)',
    flag: '🇺🇸',
    timezone: 'America/New_York',
    location: { lat: 39.0458, lng: -76.6413 }
  },
  {
    code: 'us-east',
    name: 'US East',
    displayName: 'US East (Legacy)',
    flag: '🇺🇸',
    timezone: 'America/New_York',
    location: { lat: 39.0458, lng: -76.6413 }
  }
]

export const getRegionByCode = (code: string): Region | undefined => {
  return AVAILABLE_REGIONS.find(region => region.code === code)
}

export const getDefaultRegion = (): Region => {
  return AVAILABLE_REGIONS[0] // Global as default
}

export const getRegionDisplayName = (code: string, t?: (key: string) => string): string => {
  const region = getRegionByCode(code)
  if (!region) return code
  
  if (t) {
    return t(`regions.${code}`) || region.displayName
  }
  
  return region.displayName
}