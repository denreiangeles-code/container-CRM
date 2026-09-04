import React, { useState } from 'react'
import { useCustomers } from '../../hooks/useDataHooks'
import { I, Ic } from '../../components/common/Icons'
import { Badge, ChipPIC, EmptyTableState, ExportMenu } from '../../components/common/UIComponents'
import type { BadgeStatus } from '../../types/crm'

export const BestClients = () => {
  const [search, setSearch] = useState('')
  const customers = useCustomers('All', search)
  const ranked = [...customers].sort((a, b) => b.profit - a.profit)

  return (
    <div className="page-scroll">
      <div className="page-content">
        <div className="page-header" style={{ padding: 0, border: 'none', marginBottom: 16 }}>
          <div>
            <div className="page-title">Best Clients</div>
            <div className="page-desc">Every customer, ranked by gross profit generated.</div>
          </div>
        </div>
        <div className="toolbar" style={{ padding: 0, marginBottom: 14 }}>
          <div className="search-field"><Ic n={I.search} size={13} /><input placeholder="Search clients…" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="toolbar-right">
            <span className="count-label">{ranked.length} clients</span>
            <ExportMenu data={ranked} filename="best-clients" />
          </div>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="crm" style={{ width: '100%' }}>
            <thead><tr>
              <th style={{ width: 44 }}>#</th><th>Company</th><th>Contact</th><th>PIC</th>
              <th className="r">Sales</th><th className="r">Units</th><th className="r">Revenue</th>
              <th className="r">Gross Profit</th><th>Last Purchase</th><th>Status</th>
            </tr></thead>
            <tbody>
              {ranked.map((c, i) => (
                <tr key={c.id}>
                  <td>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: i === 0 ? '#FEF3C7' : 'var(--s3)', color: i === 0 ? '#D97706' : 'var(--t4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)' }}>{c.co}</td>
                  <td style={{ fontSize: 12.5 }}>{c.contact}</td>
                  <td><ChipPIC label={c.pic} /></td>
                  <td className="r mono bold">{c.sales}</td>
                  <td className="r mono bold">{c.units}</td>
                  <td className="r revenue-cell">${c.revenue.toLocaleString()}</td>
                  <td className="r profit-cell">${c.profit.toLocaleString()}</td>
                  <td style={{ fontSize: 12, color: 'var(--t3)' }}>{c.last}</td>
                  <td><Badge status={c.status as BadgeStatus} /></td>
                </tr>
              ))}
              {ranked.length === 0 && (
                <EmptyTableState
                  colSpan={10}
                  icon={I.customer}
                  title="No client rankings yet"
                  subtitle={search ? "No customers match your search criteria." : "No customers with a recorded purchase history yet."}
                />
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
export default BestClients
