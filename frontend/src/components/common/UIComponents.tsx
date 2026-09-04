import React, { useState, useRef } from 'react'
import { I, Ic } from './Icons'
import { usePics } from '../../features/pipeline/PipelineDialogs'
import { exportToExcel, exportToGoogleSheet, exportToCSV, exportToPDF } from '../../utils/export'
import type { BadgeStatus, SmartChipOption, DetailField, DensityOption } from '../../types/crm'

export const BADGE_MAP: Record<string, string> = {
  'Proceed': 'b-green', 'Active': 'b-green', 'Completed': 'b-green', 'Accepted': 'b-green',
  'Converted to Sale': 'b-green', 'Converted': 'b-green', 'Picked Up': 'b-green', 'Available': 'b-green',
  'Removed': 'b-red', 'Lost': 'b-red', 'Rejected': 'b-red', 'Overdue': 'b-red', 'Cancelled': 'b-red',
  'Validation Rejected': 'b-red', 'Quotation Rejected': 'b-red', 'Bounced': 'b-red', 'Hard Bounce': 'b-red',
  'Unsubscribed': 'b-red', 'Spam Complaint': 'b-red',
  'Pending': 'b-amber', 'Awaiting Response': 'b-amber', 'Under Review': 'b-amber', 'Pending Validation': 'b-amber',
  'Soft Bounce': 'b-amber',
  'New Inquiry': 'b-blue', 'Draft': 'b-blue', 'Call/Text': 'b-green', 'Quotation Created': 'b-blue',
  'Calls Only': 'b-blue', 'Mail Delivery Report': 'b-blue', 'Scheduled': 'b-blue', 'Confirmed': 'b-blue', 'Sent': 'b-blue',
  'Text Only': 'b-purple', 'Negotiating': 'b-purple', 'Negotiation': 'b-purple',
  'Quotation Required': 'b-amber', 'Quotation Sent': 'b-teal',
  'Unavailable': 'b-gray',
}

export const Badge = ({ status }: { status: string }) => (
  <span className={`badge ${BADGE_MAP[status] || 'b-gray'}`}>{status}</span>
)

export const DEFAULT_SMART_STATUS_OPTIONS: SmartChipOption[] = [
  { value: 'Pending', label: 'Pending', bg: 'var(--amber-bg, #FEF3C7)', color: 'var(--amber, #92400E)', dot: '#D97706' },
  { value: 'Won', label: 'Won', bg: 'var(--green-bg, #D1FAE5)', color: 'var(--green, #065F46)', dot: '#059669' },
  { value: 'Cancelled', label: 'Cancelled', bg: 'var(--red-bg, #FEE2E2)', color: 'var(--red, #991B1B)', dot: '#DC2626' },
]

export const StatusSmartChip = ({
  status,
  onStatusChange,
  options = DEFAULT_SMART_STATUS_OPTIONS,
  disabled = false,
}: {
  status: string
  onStatusChange: (newStatus: string) => void
  options?: SmartChipOption[]
  disabled?: boolean
}) => {
  const norm = (status || '').toLowerCase().trim()
  const current = options.find(o => o.value.toLowerCase() === norm || (norm === 'converted to sale' && o.value === 'Won') || (norm === 'lost' && o.value === 'Cancelled')) || {
    value: status || 'Pending',
    label: status || 'Pending',
    bg: 'var(--s3)',
    color: 'var(--t2)',
    dot: 'var(--t4)'
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span
        style={{
          position: 'absolute',
          left: 9,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: current.dot,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <select
        value={current.value}
        disabled={disabled}
        onChange={(e) => onStatusChange(e.target.value)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          background: current.bg,
          color: current.color,
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 999,
          padding: '2.5px 22px 2.5px 21px',
          fontSize: 11.5,
          fontWeight: 600,
          cursor: disabled ? 'default' : 'pointer',
          outline: 'none',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23666666' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 7px center',
          transition: 'all 0.15s ease',
        }}
        title={disabled ? undefined : 'Click to change status'}
      >
        {options.map(opt => (
          <option
            key={opt.value}
            value={opt.value}
            style={{
              background: 'var(--ws)',
              color: 'var(--t1)',
              fontSize: 12,
              padding: '6px',
            }}
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export const Trend = ({ val, up, white }: { val: string | number; up?: boolean; white?: boolean }) => {
  const strVal = String(val)
  const isZero = strVal === '0' || strVal === '0%'
  const numericVal = parseFloat(strVal.replace(/[^0-9.-]+/g, "") || "0")
  const isUp = up !== undefined ? up : numericVal > 0

  if (isZero) {
    return (
      <span className={`trend ${white ? 'trend-up-white' : 'trend-neutral'}`}>
        - {strVal}
      </span>
    )
  }

  return (
    <span className={`trend ${white ? 'trend-up-white' : isUp ? 'trend-up' : 'trend-down'}`}>
      {isUp ? '↑' : '↓'} {strVal}
    </span>
  )
}

export const Prog = ({ pct, color = '#315EF6', tall }: { pct: number; color?: string; tall?: boolean }) => {
  const safePct = isNaN(pct) ? 0 : Math.max(0, Math.min(100, pct))
  return (
    <div className={`prog${tall ? ' tall' : ''}`}>
      <div className="prog-fill" style={{ width: `${safePct}%`, background: color }} />
    </div>
  )
}

export const Divider = () => <div className="divider" />

export const Btn = ({ children, variant = 'secondary', sm, className = '', onClick, style, disabled, title, ariaLabel }: {
  children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  sm?: boolean; className?: string; onClick?: React.MouseEventHandler<HTMLButtonElement>; style?: React.CSSProperties
  disabled?: boolean; title?: string; ariaLabel?: string
}) => (
  <button
    className={`btn btn-${variant}${sm ? ' btn-sm' : ''} ${className}`}
    onClick={onClick} style={style} disabled={disabled} title={title}
    aria-label={ariaLabel ?? title}
  >{children}</button>
)

export const EligDot = ({ on }: { on: boolean }) => (
  <div className="elig-dot" style={{ background: on ? '#059669' : '#E5E7EB' }} />
)

export const ChipPIC = ({ label }: { label: string }) => (
  <span style={{ background: 'var(--brand-bg)', color: 'var(--brand)', padding: '2px 7px', borderRadius: 5, fontSize: 11, fontWeight: 700 }}>{label}</span>
)

export const EmptyTableState = ({
  icon,
  title = 'No records found',
  subtitle = 'There are no items matching your current filters or search criteria.',
  actionLabel,
  onAction,
  colSpan,
}: {
  icon?: string
  title?: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  colSpan?: number
}) => {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        color: 'var(--t3)',
        width: '100%',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--s2)',
          border: '1px solid var(--border-s)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--t4)',
          marginBottom: 14,
        }}
      >
        <Ic n={icon || I.inbox} size={22} />
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12.5, color: 'var(--t3)', maxWidth: 420, lineHeight: 1.5, marginBottom: actionLabel && onAction ? 16 : 0 }}>
          {subtitle}
        </div>
      )}
      {actionLabel && onAction && (
        <Btn variant="secondary" sm onClick={onAction}>
          {actionLabel}
        </Btn>
      )}
    </div>
  )

  if (colSpan !== undefined) {
    return (
      <tr key="empty-table-state">
        <td colSpan={colSpan} style={{ padding: 0, border: 'none', background: 'transparent' }}>
          {content}
        </td>
      </tr>
    )
  }

  return content
}

export const AssignPicModal = ({ count, onClose, onAssign }: { count: number; onClose: () => void; onAssign: (picId: string) => void }) => {
  const pics = usePics()
  const [picId, setPicId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Assign PIC</div>
          <Btn variant="ghost" sm onClick={onClose} ariaLabel="Close"><Ic n={I.x} size={16} /></Btn>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 12.5, color: 'var(--t3)', marginBottom: 12 }}>Reassign {count} selected record{count === 1 ? '' : 's'} to:</p>
          <select className="inp" value={picId} onChange={e => setPicId(e.target.value)}>
            <option value="">-- Select a PIC --</option>
            {pics.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary" disabled={!picId || submitting} onClick={async () => { setSubmitting(true); await onAssign(picId) }}>
            {submitting ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  )
}

export const RecordDetailModal = ({ title, fields, onClose, footerExtra }: { title: string; fields: DetailField[]; onClose: () => void; footerExtra?: React.ReactNode }) => (
  <div className="overlay" onClick={onClose}>
    <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <div className="modal-title">{title}</div>
        <Btn variant="ghost" sm onClick={onClose} ariaLabel="Close"><Ic n={I.x} size={16} /></Btn>
      </div>
      <div className="modal-body" style={{ padding: 0, maxHeight: '65vh', overflow: 'auto' }}>
        {fields.map((f, i) => (
          <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: i === fields.length - 1 ? 'none' : '1px solid var(--border-s)' }}>
            <span style={{ fontSize: 12.5, color: 'var(--t3)', fontWeight: 500 }}>{f.label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', textAlign: 'right', maxWidth: '60%' }}>{f.value || <span style={{ color: 'var(--t4)' }}>—</span>}</span>
          </div>
        ))}
      </div>
      <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
        <div>{footerExtra}</div>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
)

export const ExportMenu = ({ data, filename, sm = true }: { data: any[]; filename: string; sm?: boolean }) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const btnRef = useRef<HTMLDivElement>(null)

  const options = [
    { label: 'PDF',           icon: I.export, run: () => exportToPDF(data, filename) },
    { label: 'CSV file',      icon: I.export, run: () => exportToCSV(data, filename) },
    { label: 'Excel (.xlsx)', icon: I.export, run: () => exportToExcel(data, filename) },
    { label: 'Google Sheet',  icon: I.link,   run: () => exportToGoogleSheet(data, filename) },
  ]

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, right: Math.max(8, window.innerWidth - r.right) })
    }
    setOpen(o => !o)
  }

  return (
    <div ref={btnRef} style={{ position: 'relative' }}>
      <Btn variant="ghost" sm={sm} onClick={toggle}>
        <Ic n={I.export} size={13} /> Export <Ic n={I.chevDown} size={11} />
      </Btn>
      {open && pos && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1999 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'fixed', top: pos.top, right: pos.right, width: 180, background: 'var(--ws)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, zIndex: 2000, boxShadow: 'var(--shadow-drop)' }}>
            {options.map(o => (
              <div
                key={o.label}
                onClick={() => { setOpen(false); o.run() }}
                style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 9, borderRadius: 6, cursor: 'pointer', fontSize: 12.5, color: 'var(--t2)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--s2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Ic n={o.icon} size={13} style={{ color: 'var(--t4)' }} />
                {o.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const DENSITY_KEY = 'sheetDensity'

export const readDensity = (): DensityOption => {
  try {
    const stored = localStorage.getItem(DENSITY_KEY)
    return stored === 'Compact' || stored === 'Comfortable' || stored === 'Standard'
      ? stored
      : 'Standard'
  } catch {
    return 'Standard'
  }
}

export const writeDensity = (value: DensityOption) => {
  try { localStorage.setItem(DENSITY_KEY, value) } catch { /* preference is best-effort */ }
}
