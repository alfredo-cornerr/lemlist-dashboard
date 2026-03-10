import { Company, JobOpening, TechnologyDetection, NewsEvent } from '@/lib/predict-leads'

// Export types
export type { Company, JobOpening, TechnologyDetection, NewsEvent }

// Filter types
export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterConfig {
  id: string
  type: 'select' | 'multi-select' | 'text' | 'range' | 'boolean' | 'date'
  label: string
  field: string
  options?: FilterOption[]
  min?: number
  max?: number
  placeholder?: string
}

export interface ActiveFilter {
  field: string
  operator: 'equals' | 'contains' | 'in' | 'gt' | 'lt' | 'between'
  value: string | string[] | number | [number, number] | boolean
}

// Company with full data
export interface CompanyFullData extends Company {
  similarCompanies?: Company[]
  jobOpenings?: JobOpening[]
  technologies?: TechnologyDetection[]
  newsEvents?: NewsEvent[]
}

// Export job
export interface ExportJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalCompanies: number
  processedCompanies: number
  creditsUsed: number
  filters: ActiveFilter[]
  downloadUrl?: string
  createdAt: Date
  completedAt?: Date
}

// Monitor types
export interface MonitorConfig {
  id: string
  name: string
  targetType: 'SINGLE_COMPANY' | 'FILTER_SET'
  targetConfig: SingleCompanyTarget | FilterSetTarget
  signals: SignalType[]
  frequency: 'HOURLY' | 'DAILY' | 'WEEKLY'
  isActive: boolean
  creditsPerRun: number
  lastRunAt?: Date
  nextRunAt?: Date
  totalHits: number
  createdAt: Date
}

export interface SingleCompanyTarget {
  domain: string
}

export interface FilterSetTarget {
  filters: ActiveFilter[]
}

export type SignalType = 'NEWS_EVENTS' | 'JOB_OPENINGS' | 'TECH_CHANGES' | 'WEBSITE_CHANGES' | 'CONNECTIONS'

export interface SignalHit {
  id: string
  monitorId: string
  domain: string
  companyName?: string
  signalType: SignalType
  data: any
  creditsUsed: number
  isRead: boolean
  createdAt: Date
}

// User types
export interface UserProfile {
  id: string
  email: string
  name?: string
  avatar?: string
  credits: number
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
}

// Table column
export interface DataTableColumn<T> {
  id: string
  header: string
  accessor: (row: T) => any
  sortable?: boolean
  width?: string
  cell?: (value: any, row: T) => React.ReactNode
}

// API response
export interface ApiResponse<T> {
  data: T
  meta?: {
    total?: number
    page?: number
    perPage?: number
    totalPages?: number
  }
}

export interface ApiError {
  message: string
  code?: string
  status: number
}

// Credit transaction
export interface CreditTransaction {
  id: string
  amount: number
  type: 'PURCHASE' | 'USAGE_EXPORT' | 'USAGE_SIGNAL' | 'REFUND' | 'BONUS'
  description: string
  metadata?: Record<string, any>
  createdAt: Date
}
