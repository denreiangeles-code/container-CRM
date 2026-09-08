import { api } from './api'
import { toast, askConfirm } from './notify'
import { invalidateCache } from './dataCache'

/**
 * Confirm-then-delete, shared by every grid that offers a Delete action.
 *
 * Deleting is not the same as the Removed Sheet: removing files a record as
 * opted-out and can be restored, whereas this destroys the row. The confirm text
 * says so, because the two actions sit next to each other in most toolbars.
 *
 * The backend refuses to delete anything still linked downstream (a Prospect that
 * became a Warm Lead, a Sale that became a Contract) and answers 409 with a
 * sentence naming the blocker, which is surfaced verbatim.
 */
export const confirmDelete = async ({
  what,
  name,
  endpoint,
  cacheKey,
  detail,
  onDeleted,
}: {
  /** Record type as the user sees it, e.g. 'Prospect', 'Quotation'. */
  what: string
  /** Identifies the specific row -- company name, reference number. */
  name: string
  /** API path to DELETE. */
  endpoint: string
  /** dataCache prefix to drop so the grid does not re-render the deleted row. */
  cacheKey?: string
  /** Extra consequence worth spelling out before the user commits. */
  detail?: string
  onDeleted: () => void
}): Promise<boolean> => {
  const { confirmed } = await askConfirm({
    title: `Delete ${what}?`,
    message:
      `${name} will be permanently deleted.${detail ? ` ${detail}` : ''} ` +
      'This cannot be undone, and unlike removing a record it leaves nothing on the Removed Sheet.',
    danger: true,
    confirmLabel: `Delete ${what}`,
  })
  if (!confirmed) return false

  try {
    const res = await api.delete(endpoint)
    if (cacheKey) invalidateCache(cacheKey)
    toast(res.data?.message || `${what} deleted.`, 'success')
    onDeleted()
    return true
  } catch (e: any) {
    toast(e?.response?.data?.error?.message || `Failed to delete ${what.toLowerCase()}.`, 'error')
    return false
  }
}
