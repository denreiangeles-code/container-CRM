import React from 'react'
import { Ic, I } from './icons'
import Btn from './Button'

/**
 * The placeholder every grid shows when it has no rows.
 *
 * `colSpan` renders it as a full-width table row; leaving it off returns the bare
 * block, for the grids built out of divs rather than a <table> (ProspectSheet).
 */
const EmptyTableState = ({
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
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', textAlign: 'center', color: 'var(--t3)', width: '100%',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%', background: 'var(--s2)',
        border: '1px solid var(--border-s)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--t4)', marginBottom: 14,
      }}>
        <Ic n={icon || I.inbox} size={22} />
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>{title}</div>
      {subtitle && (
        <div style={{
          fontSize: 12.5, color: 'var(--t3)', maxWidth: 420, lineHeight: 1.5,
          marginBottom: actionLabel && onAction ? 16 : 0,
        }}>
          {subtitle}
        </div>
      )}
      {actionLabel && onAction && <Btn variant="secondary" sm onClick={onAction}>{actionLabel}</Btn>}
    </div>
  )

  if (colSpan !== undefined) {
    return (
      <tr>
        <td colSpan={colSpan} style={{ padding: 0, border: 'none', background: 'transparent' }}>
          {content}
        </td>
      </tr>
    )
  }
  return content
}

export default EmptyTableState
