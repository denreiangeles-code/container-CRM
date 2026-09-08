import React from 'react'
import { Ic, I } from './icons'
import Btn from './Button'
import { toast } from '../../lib/notify'
import { invalidateCache } from '../../lib/dataCache'

/**
 * Per-table refresh.
 *
 * The grids are served from the SWR cache in dataCache, so bumping a revision
 * counter alone would re-render the same cached rows. `cacheKey` drops that
 * cache first; screens holding their data some other way pass only `onRefresh`.
 */
const RefreshButton = ({
  cacheKey,
  onRefresh,
  label = 'Data',
}: {
  cacheKey?: string
  onRefresh: () => void
  label?: string
}) => (
  <Btn
    variant="ghost"
    sm
    title="Refresh table data"
    onClick={() => {
      if (cacheKey) invalidateCache(cacheKey)
      onRefresh()
      toast(`${label} refreshed`, 'success')
    }}
  >
    <Ic n={I.sync} size={13} /> Refresh
  </Btn>
)

export default RefreshButton
