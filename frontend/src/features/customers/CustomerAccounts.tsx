import React, { useState } from 'react'
import { toast } from '../../lib/notify'
import { invalidateCache } from '../../lib/dataCache'
import { useCustomers } from '../../hooks/useDataHooks'
import { I, Ic } from '../../components/common/Icons'
import { Btn, Badge, ChipPIC, EmptyTableState, RecordDetailModal, ExportMenu } from '../../components/common/UIComponents'
import { usePics, NewManualSaleDialog } from '../pipeline/PipelineDialogs'
import type { BadgeStatus } from '../../types/crm'

export const CustomerAccounts = ({ role }: { role?: string }) => {
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [picFilter, setPicFilter] = useState('')
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [revision, setRevision] = useState(0)
  const [viewRow, setViewRow] = useState<any>(null)
  const pics = usePics()

  const isOpsOrAdmin = role === 'admin' || role === 'operations'
  const customers = useCustomers(tab, search, revision, undefined, 'master', picFilter || undefined)
  const filtered = tab === 'All' ? customers : customers.filter(c => c.status === tab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Customer Accounts (Master)</div>
          <div className="page-desc">Centralized company-wide accounts compiled across all sales managers and PICs.</div>
        </div>
        <Btn variant="primary" sm onClick={() => setShowNewCustomer(true)} title="Customers are created by recording a sale">
          <Ic n={I.plus} size={13} /> Record Sale → New Customer
        </Btn>
        {showNewCustomer && (
          <NewManualSaleDialog
            onClose={() => setShowNewCustomer(false)}
            onSaved={() => { setShowNewCustomer(false); setRevision(r => r + 1); }}
          />
        )}
      </div>
      <div className="tabs">
        {['All', 'Active', 'Floating'].map(t => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      <div className="toolbar">
        <div className="search-field">
          <Ic n={I.search} size={13} />
          <input placeholder="Search master customer accounts…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {isOpsOrAdmin && (
          <select className="sel" value={picFilter} onChange={e => setPicFilter(e.target.value)}>
            <option value="">All PICs</option>
            {pics.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <div className="toolbar-right">
          <Btn variant="ghost" sm onClick={() => { invalidateCache('customers'); setRevision(r => r + 1); toast('Customer accounts refreshed', 'success') }} title="Refresh table data">
            <Ic n={I.sync} size={13} /> Refresh
          </Btn>
          <span className="count-label">{filtered.length} customers</span>
          <ExportMenu data={filtered} filename="customer-accounts-master" />
        </div>
      </div>
      <div className="table-wrap">
        <table className="crm">
          <thead><tr>
            <th>Company</th><th>Contact</th><th>State</th><th>PIC</th>
            <th className="r">Sales</th><th className="r">Units</th><th className="r">Revenue</th>
            <th className="r">Gross Profit</th><th>Last Purchase</th><th>Status</th>
            <th className="col-actions">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <EmptyTableState
                colSpan={11}
                icon={I.customer}
                title="No customer accounts found"
                subtitle={search || picFilter ? 'No customer accounts match your search or filter criteria.' : 'There are no customer accounts in the system yet.'}
              />
            ) : (
              filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)' }}>{c.co}</div>
                    <div style={{ fontSize: 11, color: 'var(--t4)', fontFamily: 'var(--mono)' }}>{c.phone}</div>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{c.contact}</td>
                  <td><span className="badge b-gray" style={{ fontFamily: 'var(--mono)' }}>{c.state}</span></td>
                  <td><ChipPIC label={c.pic} /></td>
                  <td className="r mono bold">{c.sales}</td>
                  <td className="r mono bold">{c.units}</td>
                  <td className="r revenue-cell">${c.revenue.toLocaleString()}</td>
                  <td className="r profit-cell">${c.profit.toLocaleString()}</td>
                  <td style={{ fontSize: 12, color: 'var(--t3)' }}>{c.last}</td>
                  <td><Badge status={c.status as BadgeStatus} /></td>
                  <td className="col-actions">
                    <div className="row-actions"><Btn variant="ghost" sm onClick={() => setViewRow(c)}>View</Btn></div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {viewRow && (
        <RecordDetailModal
          title={viewRow.co}
          onClose={() => setViewRow(null)}
          fields={[
            { label: 'Contact', value: viewRow.contact },
            { label: 'Phone', value: viewRow.phone },
            { label: 'Email', value: viewRow.email },
            { label: 'State', value: viewRow.state },
            { label: 'Country', value: viewRow.country },
            { label: 'Status', value: <Badge status={viewRow.status as BadgeStatus} /> },
            { label: 'PIC', value: viewRow.pic },
            { label: 'Sales Count', value: viewRow.sales },
            { label: 'Total Units', value: viewRow.units },
            { label: 'Revenue', value: `$${viewRow.revenue.toLocaleString()}` },
            { label: 'Gross profit', value: `$${viewRow.profit.toLocaleString()}` },
            { label: 'Last purchase', value: viewRow.last },
          ]}
        />
      )}
    </div>
  )
}
export default CustomerAccounts
