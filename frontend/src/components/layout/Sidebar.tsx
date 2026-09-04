import React from 'react'
import { I, Ic } from '../common/Icons'
import type { Screen, NavGroup } from '../../types/crm'

export const NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Executive Overview', icon: I.dashboard, roles: ['admin', 'sales_manager'] },
      { id: 'outreach-dashboard', label: 'Outreach Dashboard', icon: I.target, roles: ['admin', 'sales_manager'] },
      { id: 'inquiry-dashboard', label: 'Inquiry Dashboard', icon: I.inquiry, roles: ['admin', 'sales_manager', 'procurement'] },
    ],
  },
  {
    label: 'Sales Core',
    items: [
      { id: 'prospects', label: 'Prospect Clients', icon: I.prospect, roles: ['admin', 'sales_manager'] },
      { id: 'warm-leads', label: 'Warm Leads', icon: I.lead, roles: ['admin', 'sales_manager'] },
      { id: 'inquiries', label: 'Inquiries', icon: I.inquiry, roles: ['admin', 'sales_manager'] },
      { id: 'quotations', label: 'Quotations', icon: I.quote, roles: ['admin', 'sales_manager'] },
      { id: 'sales-tracker', label: 'Sales Tracker', icon: I.sales, roles: ['admin', 'sales_manager'] },
      { id: 'active-clients', label: 'Active Clients', icon: I.customer, roles: ['admin', 'sales_manager'] },
    ],
  },
  {
    label: 'Procurement Core',
    items: [
      { id: 'inquiry-validation', label: 'Inquiry Validation', icon: I.check, roles: ['admin', 'procurement'] },
    ],
  },
  {
    label: 'Operations Core',
    items: [
      { id: 'pickups', label: 'Pickup Tracking', icon: I.pickup, roles: ['admin', 'operations', 'sales_manager'] },
      { id: 'contracts', label: 'Customer Contracts', icon: I.contract, roles: ['admin', 'operations', 'sales_manager'] },
      { id: 'customers', label: 'Customer Accounts (Master)', icon: I.customer, roles: ['admin', 'operations', 'sales_manager'] },
    ],
  },
  {
    label: 'Catalog & Stock',
    items: [
      { id: 'inventory-management', label: 'Inventory Management', icon: I.upload, roles: ['admin', 'operations', 'procurement', 'sales_manager'] },
      { id: 'container-catalog', label: 'Container Catalog', icon: I.container, roles: ['admin', 'operations', 'procurement', 'sales_manager'] },
    ],
  },
  {
    label: 'Outreach & Data',
    items: [
      { id: 'contact-outreach', label: 'Contact Outreach', icon: I.outreach, roles: ['admin', 'sales_manager'] },
      { id: 'daily-tasks', label: 'Daily Tasks', icon: I.tasks, roles: ['admin', 'sales_manager'] },
      { id: 'removed', label: 'Removed Sheet', icon: I.removed, roles: ['admin', 'sales_manager'] },
      { id: 'deliverability', label: 'Deliverability', icon: I.deliverabil, roles: ['admin', 'sales_manager'] },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { id: 'pic-performance', label: 'PIC Performance', icon: I.analytics, roles: ['admin', 'sales_manager'] },
      { id: 'best-clients', label: 'Best Clients', icon: I.flag, roles: ['admin', 'sales_manager'] },
      { id: 'profit-analytics', label: 'Profit Analytics', icon: I.profit, roles: ['admin', 'sales_manager'] },
      { id: 'inquiry-funnel', label: 'Inquiry Funnel', icon: I.inquiry, roles: ['admin', 'sales_manager'] },
      { id: 'monthly-report', label: 'Monthly Report', icon: I.calendar, roles: ['admin', 'sales_manager'] },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { id: 'service-territories', label: 'Service Territories', icon: I.map, roles: ['admin'] },
      { id: 'daily-targets', label: 'Daily Targets', icon: I.target, roles: ['admin'] },
      { id: 'system-settings', label: 'System Settings', icon: I.config, roles: ['admin'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { id: 'user-management', label: 'User Management', icon: I.customer, roles: ['admin'] },
    ],
  },
]

export const Sidebar = ({ active, onNav, expanded, pinned, onTogglePin, role }: {
  active: Screen; onNav: (s: Screen) => void; expanded: boolean;
  pinned: boolean; onTogglePin: () => void;
  role?: string;
}) => {
  const visibleGroups = NAV
    .filter(group => group.label !== 'Administration' || role === 'admin')
    .map(group => ({ ...group, items: group.items.filter(item => !item.roles || (role && item.roles.includes(role))) }))
    .filter(group => group.items.length > 0)

  return (
    <aside className={`sidebar${expanded ? ' expanded' : ''}`}>
      {/* Logo */}
      <div className="sb-logo">
        <div className="sb-logo-icon">
          <Ic n={I.container} size={17} style={{ color: 'white' }} />
        </div>
        {expanded && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2 }}>ContainerCRM</div>
            <div style={{ fontSize: 10, color: 'var(--sb-text)', fontWeight: 500 }}>Enterprise</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        {visibleGroups.map(group => (
          <div key={group.label}>
            <div className="sb-group-label">{group.label}</div>
            {group.items.map(item => (
              <button
                type="button"
                key={item.id}
                className={`sb-item${active === item.id ? ' active' : ''}`}
                onClick={() => onNav(item.id)}
                data-tooltip={item.label}
                title={expanded ? undefined : item.label}
                aria-current={active === item.id ? 'page' : undefined}
                aria-label={item.label}
              >
                <div className="sb-icon-wrap">
                  <Ic n={item.icon} size={16} style={{ color: active === item.id ? 'white' : 'var(--sb-icon)' }} />
                </div>
                <span className="sb-item-label">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sb-bottom">
        <button
          type="button"
          className="sb-item"
          data-tooltip={pinned ? 'Collapse Sidebar' : 'Pin Sidebar Open'}
          title={pinned ? 'Collapse Sidebar' : 'Pin Sidebar Open'}
          aria-label={pinned ? 'Collapse sidebar' : 'Pin sidebar open'}
          aria-pressed={pinned}
          onClick={onTogglePin}
        >
          <div className="sb-icon-wrap">
            <Ic n={pinned ? I.chevLeft : I.chevRight} size={16} style={{ color: 'var(--sb-icon)' }} />
          </div>
          <span className="sb-item-label">{pinned ? 'Collapse' : 'Pin Open'}</span>
        </button>
      </div>
    </aside>
  )
}
export default Sidebar
