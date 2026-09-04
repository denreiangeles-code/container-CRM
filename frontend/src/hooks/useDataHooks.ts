import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { useRealtimeRevision } from '../lib/realtime'
import { fetchCached, getFromCache } from '../lib/dataCache'

export const mapPipelineRow = (p: any) => ({
  id: p.id,
  added: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  pic: p.pics?.name || 'Unassigned',
  cat: p.category || (p.status === 'active' ? 'Proceed' : p.status) || 'Proceed',
  sms: p.source_data?.sms_deliverability || 'Call/Text',
  email: p.source_data?.email_deliverability || (p.contacts?.email_active ? 'Available' : 'Unavailable'),
  industry: p.companies?.industry || '',
  territory: p.source_data?.service_locations || '',
  country: p.companies?.address_country || '',
  state: p.companies?.address_state || '',
  city: p.companies?.address_city || '',
  company: p.companies?.name || '',
  contact: p.contacts ? `${p.contacts.first_name || ''} ${p.contacts.last_name || ''}`.trim() : '',
  contactMissing: !p.contact_id,
  phone: p.contacts?.phone_direct || '',
  phone2: p.contacts?.phone_2 || '',
  emailAddr: p.contacts?.email_active || '',
  email2: p.contacts?.email_2 || '',
  address: p.companies?.address_street || '',
  lifecycleStatus: p.lifecycle_status || 'active',
  conversionReason: p.conversion_reason || '',
  conversionChannel: p.conversion_channel || '',
  entryPath: p.entry_origin === 'inquiry_backfill'
    ? 'From Inquiry'
    : p.entry_origin === 'prospect_conversion'
      ? 'From Prospect'
      : 'Direct Entry',
})

export const mapInquiryRow = (row: any) => {
  const created = new Date(row.created_at)
  return {
    id: row.id,
    companyId: row.company_id,
    contactId: row.contact_id,
    ref: `INQ-${row.id.slice(0, 8).toUpperCase()}`,
    date: created.toLocaleDateString(),
    time: created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    channel: row.requirements?.match(/email/i) ? 'Email' : 'Direct',
    company: row.companies?.name || '',
    contact: row.contacts ? `${row.contacts.first_name || ''} ${row.contacts.last_name || ''}`.trim() : '',
    phone: row.contacts?.phone_direct || row.contacts?.phone_2 || '',
    email: row.contacts?.email_active || row.contacts?.email_2 || '',
    category: row.requirements || 'To be qualified',
    size: row.container_sizes?.name || '—',
    condition: row.container_conditions?.name || '—',
    qty: row.quantity ?? '—',
    neededBy: row.needed_by_date ? new Date(row.needed_by_date).toLocaleDateString() : '—',
    status: row.status || 'Under Review',
    pic: row.pics?.name || 'Unassigned',
    sourceWarmLeadId: row.source_warm_lead_id || null,
    backfilledWarmLeadId: Array.isArray(row.backfilled_warm_leads)
      ? row.backfilled_warm_leads[0]?.id || null
      : row.backfilled_warm_leads?.id || null,
    entryOrigin: row.entry_origin || (row.source_warm_lead_id ? 'warm_lead_conversion' : 'direct'),
    rejectionReason: row.rejection_reason || '',
    altSize: row.alt_size?.name || '',
    altCondition: row.alt_condition?.name || '',
    altQuantity: row.alt_quantity ?? null,
    altAskingPrice: row.alt_asking_price != null ? Number(row.alt_asking_price) : null,
    altNotes: row.alt_notes || '',
    hasAlternative: !!(row.alt_size || row.alt_condition || row.alt_quantity != null || row.alt_asking_price != null),
  }
}

export const mapQuotationRow = (row: any) => {
  const items = row.quotation_items || []
  const quantity = items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0)
  const total = Number(row.total_amount || 0)
  return {
    id: row.id,
    inquiryId: row.inquiry_id,
    ref: `QUO-${row.id.slice(0, 8).toUpperCase()}`,
    date: new Date(row.created_at).toLocaleDateString(),
    co: row.companies?.name || '',
    contact: row.contacts ? `${row.contacts.first_name || ''} ${row.contacts.last_name || ''}`.trim() : '',
    category: items[0]?.description || 'Container',
    size: '—',
    qty: quantity,
    sellTotal: total,
    profit: 0,
    margin: 0,
    status: row.status,
    source: row.inquiry_id ? `INQ-${row.inquiry_id.slice(0, 8).toUpperCase()}` : 'Direct',
    pic: row.pics?.name || 'Unassigned',
  }
}

export const mapSaleRow = (row: any) => {
  const units = Number(row.total_units || 0)
  const buyingCost = Number(row.buying_cost || 0)
  const revenue = Number(row.revenue || 0)
  const profit = Number(row.gross_profit || 0)
  const quote = row.quotations || {}
  const item = quote.quotation_items?.[0]
  const fullName = (c: any) => c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : ''
  const companyLinks = row.companies?.company_contacts ?? []
  const companyContact = (companyLinks.find((l: any) => l.is_primary) ?? companyLinks[0])?.contacts
  return {
    id: row.id,
    ref: `SAL-${row.id.slice(0, 8).toUpperCase()}`,
    date: new Date(row.created_at).toLocaleDateString(),
    createdAt: row.created_at,
    company: row.companies?.name || '',
    contact: fullName(quote.contacts) || fullName(companyContact),
    category: item?.description || 'Container',
    size: '—',
    condition: '—',
    qty: units,
    buyPU: units ? buyingCost / units : 0,
    sellPU: units ? revenue / units : 0,
    totalBuy: buyingCost,
    totalSell: revenue,
    profit,
    margin: revenue ? (profit / revenue) * 100 : 0,
    pic: row.pics?.name || 'Unassigned',
    status: row.status,
  }
}

export const mapCustomerRow = (c: any) => ({
  id: c.company_id,
  co: c.company_name,
  contact: c.primary_contact ? c.primary_contact.first_name + ' ' + (c.primary_contact.last_name || '') : '-',
  phone: c.primary_contact ? (c.primary_contact.phone_1 || c.primary_contact.phone_2) : '-',
  email: c.primary_contact ? (c.primary_contact.email || '-') : '-',
  state: c.state || '-',
  country: c.country || '-',
  sales: c.sales_count,
  units: c.total_units,
  revenue: Number(c.total_revenue),
  profit: Number(c.total_gross_profit),
  last: new Date(c.last_purchase_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  pic: c.pic_name || '-',
  status: c.status
})

export const mapContractRow = (c: any) => ({
  id: c.id,
  ref: c.contract_number,
  co: c.company_name,
  contact: c.primary_contact ? c.primary_contact.first_name + ' ' + (c.primary_contact.last_name || '') : '-',
  category: c.items && c.items.length > 0 ? c.items[0].description.split(' ')[0] : '-',
  size: c.items && c.items.length > 0 ? c.items[0].description : '-',
  qty: c.allocated_quantity ?? c.total_units,
  value: Number(c.revenue),
  pickup: c.pickup_date ? new Date(c.pickup_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unscheduled',
  pickupDateRaw: c.pickup_date ? String(c.pickup_date).slice(0, 10) : '',
  pickStatus: c.pickup_status,
  storedPickStatus: c.stored_pickup_status || c.pickup_status,
  status: c.contract_status,
  pic: c.pic_name || '-',
  sale: c.sale_number,
  inventory: c.inventory_label || 'Legacy contract — no stock allocation',
})

export const useWarmLeads = (revision = 0, enabled = true) => {
  const cacheKey = 'leads:warm-leads:active'
  const liveRevision = useRealtimeRevision(['leads', 'data'])
  const [data, setData] = useState<any[]>(() => {
    const cached = getFromCache<any[]>(cacheKey)
    return cached ? cached.map(mapPipelineRow) : []
  })

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    fetchCached(cacheKey, () => api.get('/leads/warm-leads', { params: { limit: 500 } }).then(res => res.data.data || []), 60_000)
      .then(raw => {
        if (!cancelled) setData((raw || []).map(mapPipelineRow))
      })
      .catch(console.error)
    return () => { cancelled = true }
  }, [revision, liveRevision, enabled])

  return data
}

export const useInquiries = (revision = 0, status: 'active' | 'all' = 'active') => {
  const cacheKey = `leads:inquiries:${status}`
  const liveRevision = useRealtimeRevision(['leads', 'deals'])
  const [data, setData] = useState<any[]>(() => {
    const cached = getFromCache<any[]>(cacheKey)
    return cached ? cached.map(mapInquiryRow) : []
  })

  useEffect(() => {
    let cancelled = false
    fetchCached(cacheKey, () => api.get('/leads/inquiries', { params: { limit: 500, status } }).then(res => res.data.data || []), 60_000)
      .then(raw => {
        if (!cancelled) setData((raw || []).map(mapInquiryRow))
      })
      .catch(console.error)
    return () => { cancelled = true }
  }, [revision, liveRevision, status])

  return data
}

export const useQuotations = (revision = 0) => {
  const cacheKey = 'deals:quotations'
  const liveRevision = useRealtimeRevision(['deals', 'leads'])
  const [data, setData] = useState<any[]>(() => {
    const cached = getFromCache<any[]>(cacheKey)
    return cached ? cached.map(mapQuotationRow) : []
  })

  useEffect(() => {
    let cancelled = false
    fetchCached(cacheKey, () => api.get('/deals/quotations').then(res => res.data.data || []), 60_000)
      .then(raw => {
        if (!cancelled) setData((raw || []).map(mapQuotationRow))
      })
      .catch(console.error)
    return () => { cancelled = true }
  }, [revision, liveRevision])

  return data
}

export const useSales = (revision = 0) => {
  const cacheKey = 'deals:sales'
  const liveRevision = useRealtimeRevision(['deals'])
  const [data, setData] = useState<any[]>(() => {
    const cached = getFromCache<any[]>(cacheKey)
    return cached ? cached.map(mapSaleRow) : []
  })

  useEffect(() => {
    let cancelled = false
    fetchCached(cacheKey, () => api.get('/deals/sales').then(res => res.data.data || []), 60_000)
      .then(raw => {
        if (!cancelled) setData((raw || []).map(mapSaleRow))
      })
      .catch(console.error)
    return () => { cancelled = true }
  }, [revision, liveRevision])

  return data
}

export const useAnalytics = () => {
  const cacheKey = 'analytics:dashboard'
  const liveRevision = useRealtimeRevision([])
  const [data, setData] = useState<any>(() => getFromCache(cacheKey) ?? null)

  useEffect(() => {
    let cancelled = false
    fetchCached(cacheKey, () => api.get('/analytics/dashboard').then(res => res.data.data), 45_000)
      .then(fresh => {
        if (!cancelled) setData(fresh)
      })
      .catch(console.error)
    return () => { cancelled = true }
  }, [liveRevision])

  return data
}

export const useNotifications = (revision = 0) => {
  const [data, setData] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const liveRevision = useRealtimeRevision(['notifications', 'leads'])
  const refresh = useCallback(() => {
    api.get('/notifications').then(res => {
      if (res.data.success) {
        setData(res.data.data || [])
        setUnread(res.data.meta?.unread ?? 0)
      }
    }).catch(console.error)
  }, [])
  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [refresh, revision, liveRevision])
  return { notifications: data, unread, refresh }
}

export const useContracts = (status = 'All Statuses', pickStatus = 'All Pickup Statuses', search = '', revision = 0) => {
  const cacheKey = `contracts:${status}:${pickStatus}:${search}`
  const liveRevision = useRealtimeRevision(['contracts', 'deals']);
  const [data, setData] = useState<any[]>(() => {
    const cached = getFromCache<any[]>(cacheKey)
    return cached ? cached.map(mapContractRow) : []
  });

  useEffect(() => {
    let cancelled = false;
    fetchCached(cacheKey, () => api.get('/contracts', { params: { status, pickStatus, search } }).then(res => res.data.data || []), 60_000)
      .then(raw => {
        if (!cancelled) setData((raw || []).map(mapContractRow));
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [status, pickStatus, search, revision, liveRevision]);

  return data;
}

export const useCustomers = (status = 'All', search = '', revision = 0, limit?: number, scope?: 'personal' | 'master', picId?: string) => {
  const cacheKey = `customers:${scope ?? 'default'}:${picId ?? 'all'}:${status}:${search}:${limit ?? 'all'}`
  const liveRevision = useRealtimeRevision(['deals', 'contracts'])
  const [data, setData] = useState<any[]>(() => {
    const cached = getFromCache<any[]>(cacheKey)
    return cached ? cached.map(mapCustomerRow) : []
  })

  useEffect(() => {
    let cancelled = false
    fetchCached(
      cacheKey,
      () =>
        api.get('/customers', {
          params: {
            status,
            search,
            ...(limit ? { limit } : {}),
            ...(scope ? { scope } : {}),
            ...(picId ? { pic_id: picId } : {}),
          },
        }).then(res => res.data.data || []),
      60_000
    )
      .then(raw => {
        if (!cancelled) setData((raw || []).map(mapCustomerRow))
      })
      .catch(console.error)
    return () => { cancelled = true }
  }, [status, search, revision, liveRevision, limit, scope, picId])

  return data
}

export const useProspects = (revision = 0, status: 'active' | 'converted' | 'removed' | 'all' = 'active', enabled = true) => {
  const cacheKey = `leads:prospects:${status}`
  const liveRevision = useRealtimeRevision(['leads', 'data'])
  const [prospects, setProspects] = useState<any[]>(() => {
    const cached = getFromCache<any[]>(cacheKey)
    return cached ? cached.map(mapPipelineRow) : []
  })

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    fetchCached(cacheKey, () => api.get('/leads/prospects', { params: { limit: 500, status } }).then(res => res.data.data || []), 60_000)
      .then(raw => {
        if (!cancelled) setProspects((raw || []).map(mapPipelineRow))
      })
      .catch(e => console.error("Failed to fetch API data", e))
    return () => { cancelled = true }
  }, [revision, liveRevision, status, enabled])

  return prospects
}

export const useInventory = (filters: Record<string, string> = {}, revision = 0) => {
  const cacheKey = `inventory:${JSON.stringify(filters)}`
  const liveRevision = useRealtimeRevision(['inventory', 'contracts'])
  const [data, setData] = useState<any[]>(() => getFromCache<any[]>(cacheKey) ?? [])

  useEffect(() => {
    let cancelled = false
    fetchCached(cacheKey, () => api.get('/inventory', { params: filters }).then(res => res.data.data || []), 60_000)
      .then(fresh => {
        if (!cancelled) setData(fresh)
      })
      .catch(console.error)
    return () => { cancelled = true }
  }, [JSON.stringify(filters), revision, liveRevision])

  return data
}

export const useInventorySummary = (revision = 0) => {
  const cacheKey = 'inventory:summary'
  const liveRevision = useRealtimeRevision(['inventory', 'contracts'])
  const [data, setData] = useState<any>(() => getFromCache(cacheKey) ?? null)

  useEffect(() => {
    let cancelled = false
    fetchCached(cacheKey, () => api.get('/inventory/summary').then(res => res.data.data), 60_000)
      .then(fresh => {
        if (!cancelled) setData(fresh)
      })
      .catch(console.error)
    return () => { cancelled = true }
  }, [revision, liveRevision])

  return data
}

export const useCatalogList = (path: string) => {
  const [data, setData] = useState<{ id: string; name: string }[]>([])
  useEffect(() => {
    api.get(path).then(res => { if (res.data.success) setData(res.data.data || []) }).catch(console.error)
  }, [path])
  return data
}
