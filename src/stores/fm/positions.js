import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'
import apiRequest from '@/api/request'
import urls from '@/api/urls'

const makeBucket = () => ({
  data: [],
  loading: false,
  isFetched: false,
  pagination: {
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 1,
  },
})

export const useFmPositionsStore = defineStore('fmPositions', () => {
  const summary = ref(null)

  const buckets = reactive({
    both:   makeBucket(),
    open:   makeBucket(),
    closed: makeBucket(),
  })

  const filters = reactive({
    both:   { magic_numbers: [] },
    open:   { magic_numbers: [] },
    closed: {
      magic_numbers: [],
      filter_type: null,
      from_date: null,
      to_date: null,
    },
  })

  // ─── Payload ───────────────────────────────────────────────────────────────
  const buildPayload = (type, fmId) => {
    const f = filters[type]
    const b = buckets[type]

    const payload = {
      fm_id: Number(fmId),
      type,
      page: b.pagination.page,
      per_page: b.pagination.per_page,
    }

    if (f.magic_numbers?.length) {
      payload.magic_numbers = f.magic_numbers
    }

    if (type === 'closed' && f.filter_type) {
      payload.filter_type = f.filter_type

      if (f.filter_type === 'custom') {
        if (f.from_date) payload.from_date = f.from_date
        if (f.to_date)   payload.to_date   = f.to_date
      }
    }

    return payload
  }

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchPositions = (type, fmId, force = false) => {
    const b = buckets[type]
    if (b.isFetched && !force) return

    b.loading = true

    const successHandler = (res) => {
      const d = res?.data

      if (type === 'open')   b.data = d?.open_positions   || []
      if (type === 'closed') b.data = d?.closed_positions || []
      if (type === 'both') {
        b.data = [
          ...(d?.open_positions   || []),
          ...(d?.closed_positions || []),
        ]
      }

      if (d?.summary) summary.value = d.summary

      if (res?.pagination) {
        b.pagination = res.pagination
      }

      b.isFetched = true
      b.loading   = false
    }

    const failureHandler = () => {
      b.loading = false
    }

    apiRequest(urls.KEYS.POST, urls.fm.positions, {
      data: buildPayload(type, fmId),
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    })
  }

  // ─── Pagination ───────────────────────────────────────────────────────────
  const setPage = (type, page, fmId) => {
    const b = buckets[type]
    b.pagination = { ...b.pagination, page }
    b.isFetched  = false
    fetchPositions(type, fmId, true)
  }

  const resetAll = () => {
    Object.keys(buckets).forEach((type) => {
      Object.assign(buckets[type], makeBucket())
    })
    summary.value = null
  }

  return {
    summary,
    buckets,
    filters,
    fetchPositions,
    setPage,
    resetAll,
  }
})