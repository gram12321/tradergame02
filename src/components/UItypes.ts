// Shared interface types for components
// These should be used consistently across the application

export interface PageProps {
  // Common props for page components
}

export interface NavigationProps {
  // Props for navigation components
}

export interface CompanyProps {
  // Props related to company data
}

export interface DialogProps {
  // Props for dialog/modal components
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export interface FormProps {
  // Props for form components
  onSubmit?: (data: any) => void
  onCancel?: () => void
}

export interface TableProps {
  // Props for table components
  data?: any[]
  loading?: boolean
}

export interface LoadingProps {
  // Props for loading states
  loading?: boolean
  error?: string | null
}

export interface CardProps {
  // Props for card components
  title?: string
  description?: string
  children?: React.ReactNode
}

export interface BaseComponentProps {
  // Base props that most components should accept
  className?: string
  children?: React.ReactNode
}
