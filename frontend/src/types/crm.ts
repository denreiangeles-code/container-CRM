export type Screen =
  | 'dashboard' | 'outreach-dashboard' | 'inquiry-dashboard'
  | 'prospects' | 'warm-leads' | 'inquiries' | 'quotations' | 'sales-tracker' | 'active-clients'
  | 'customers' | 'contact-outreach' | 'contracts' | 'pickups'
  | 'daily-tasks' | 'removed' | 'deliverability'
  | 'container-catalog'
  | 'pic-performance' | 'best-clients' | 'profit-analytics' | 'inquiry-funnel'
  | 'service-territories' | 'daily-targets' | 'system-settings' | 'profile-settings'
  | 'user-management' | 'inquiry-validation' | 'inventory-management' | 'monthly-report'

export type NavItem = { id: Screen; label: string; icon: string; roles?: string[] }
export type NavGroup = { label: string; items: NavItem[] }

export type ProfitChartPoint = { m: string; profit: number; revenue: number; cost: number }
export type ChartSlice = { name: string; value: number; color: string }
export type PicPerformanceRow = {
  name: string
  initials: string
  profit: number
  sales: number
  units: number
  calls: number
  emails: number
  texts: number
  leads: number
  inquiries: number
  quotes: number
  revenue: number
}

export type OverduePickupRow = { contract: string; co: string; days: number; qty: number; size: string }
export type LossReasonRow = { reason: string; color: string; count: number }

export type BadgeStatus =
  | 'Proceed' | 'Removed' | 'Active' | 'Completed' | 'Lost' | 'Draft' | 'Sent'
  | 'New Inquiry' | 'Quotation Required' | 'Quotation Sent' | 'Negotiating' | 'Negotiation'
  | 'Converted to Sale' | 'Converted' | 'Pending' | 'Cancelled' | 'Call/Text' | 'Calls Only'
  | 'Text Only' | 'Mail Delivery Report' | 'Overdue' | 'Scheduled' | 'Confirmed'
  | 'Picked Up' | 'Accepted' | 'Rejected' | 'Under Review' | 'Awaiting Response'
  | 'Pending Validation' | 'Validation Rejected' | 'Quotation Created' | 'Quotation Rejected'
  | 'Available' | 'Unavailable' | 'Bounced' | 'Hard Bounce' | 'Soft Bounce' | 'Unsubscribed' | 'Spam Complaint'

export type SmartChipOption = { value: string; label: string; bg: string; color: string; dot: string }
export type DetailField = { label: string; value: React.ReactNode }
export type DensityOption = 'Compact' | 'Standard' | 'Comfortable'
export type PdfSection = { title?: string; rows: Record<string, any>[] }

export const SCREEN_TITLES: Record<Screen, string> = {
  'dashboard': 'Executive Overview',
  'outreach-dashboard': 'Outreach Dashboard',
  'inquiry-dashboard': 'Inquiry Dashboard',
  'prospects': 'Prospect Clients',
  'warm-leads': 'Warm Leads',
  'inquiries': 'Inquiries',
  'quotations': 'Quotations',
  'sales-tracker': 'Sales Tracker',
  'active-clients': 'Active Clients Dashboard',
  'customers': 'Customer Accounts (Master)',
  'contact-outreach': 'Contact Outreach Sheet',
  'contracts': 'Customer Contracts',
  'pickups': 'Pickup Tracking',
  'daily-tasks': 'Daily Completed Tasks',
  'removed': 'Removed Sheet',
  'deliverability': 'Deliverability Management',
  'container-catalog': 'Container Catalog',
  'pic-performance': 'PIC Performance',
  'best-clients': 'Best Clients',
  'profit-analytics': 'Profit Analytics',
  'inquiry-funnel': 'Inquiry Funnel',
  'monthly-report': 'Monthly Report',
  'service-territories': 'Service Territories',
  'daily-targets': 'Daily Targets',
  'system-settings': 'System Settings',
  'profile-settings': 'Profile Settings',
  'user-management': 'User Management',
  'inquiry-validation': 'Inquiry Validation',
  'inventory-management': 'Inventory Management',
}
