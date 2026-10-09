<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Award,
  Wallet,
  Clock,
  TrendingUp,
  Coins,
  ShieldCheck,
  Zap,
  Gift,
  Calendar,
  ShoppingBag,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  PlusCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowLeftRight,
  LogOut,
  Check,
  Loader2,
  Info,
  AlertCircle,
  Eye,
} from 'lucide-vue-next'
import { useLoyaltyStore } from '@/stores/client/loyalty'
import { formatDate } from '@/utils/timeFormatter'
import EmptyState from '@/components/base/EmptyState.vue'
import Pagination from '@/components/base/Pagination.vue'
import BaseTabs from '@/components/base/BaseTabs.vue'
import DataTable from '@/components/base/datatable/DataTable.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import RefreshButton from '@/components/base/RefreshButton.vue'
import LoyaltyMedia from '@/components/client/loyalty/LoyaltyMedia.vue'
import LoyaltyProgramCard from '@/components/client/loyalty/LoyaltyProgramCard.vue'
import LoyaltyWithdrawModal from '@/components/client/loyalty/LoyaltyWithdrawModal.vue'
import LoyaltyEnrollModal from '@/components/client/loyalty/LoyaltyEnrollModal.vue'
import LoyaltyLeaveModal from '@/components/client/loyalty/LoyaltyLeaveModal.vue'
import LoyaltyStoreRedeemModal from '@/components/client/loyalty/LoyaltyStoreRedeemModal.vue'
import LoyaltyStoreOrderDetailDrawer from '@/components/client/loyalty/LoyaltyStoreOrderDetailDrawer.vue'

const route = useRoute()
const router = useRouter()
const store = useLoyaltyStore()

// ─── Main Top Level Tabs ──────────────────────────────────
const activeTab = ref('programs') // 'programs' | 'transactions' | 'store' | 'store_orders'

const tabList = computed(() => [
  {
    label: 'Loyalty Programs',
    value: 'programs',
    count: store.programs?.length || null,
  },
  {
    label: 'Loyalty Transactions',
    value: 'transactions',
    count: store.pointsPagination?.total || null,
  },
  {
    label: 'Rewards Store',
    value: 'store',
    count: store.storeProductsPagination?.total || null,
  },
  {
    label: 'Store Orders',
    value: 'store_orders',
    count: store.storeRedemptionsPagination?.total || null,
  },
])

const selectTab = (tabValue) => {
  activeTab.value = tabValue
  currentView.value = 'list'
  const nextQuery = { ...route.query, tab: tabValue }
  delete nextQuery.programId
  router.replace({ query: nextQuery })
  if (tabValue === 'store') {
    store.fetchStoreProducts(1)
  } else if (tabValue === 'store_orders') {
    store.fetchStoreRedemptions(1)
  } else if (tabValue === 'transactions') {
    store.fetchPoints(
      1,
      20,
      globalPointsEntryFilter.value,
      globalProgramFilter.value === 'ALL' ? '' : globalProgramFilter.value,
      true
    )
  } else if (tabValue === 'programs') {
    store.fetchPrograms()
  }
}

// ─── Program View Flow State: 'list' (All Programs) vs 'detail' (Program Dashboard) ───
const currentView = ref('list') // 'list' | 'detail'

// ─── Program Dashboard Sub-Tabs ────────────────────────────
const programSubTab = ref('transfers') // 'transfers' | 'ledger' | 'tiers'
const programSubTabs = [
  { label: 'Wallet Transfers', value: 'transfers' },
  { label: 'Points Ledger', value: 'ledger' },
  { label: 'Tier Benefits', value: 'tiers' },
]

// ─── Modal States ───────────────────────────────────────────
const isWithdrawModalOpen = ref(false)
const isEnrollModalOpen = ref(false)
const isLeaveModalOpen = ref(false)
const isStoreRedeemModalOpen = ref(false)
const isOrderDetailDrawerOpen = ref(false)
const selectedProductForRedeem = ref(null)
const selectedOrderForDetail = ref(null)
const programToEnroll = ref(null)

const openOrderDetailDrawer = (order) => {
  selectedOrderForDetail.value = order
  isOrderDetailDrawerOpen.value = true
}
const closeOrderDetailDrawer = () => {
  isOrderDetailDrawerOpen.value = false
  selectedOrderForDetail.value = null
}

const openWithdrawModal = () => {
  isWithdrawModalOpen.value = true
}
const closeWithdrawModal = () => {
  isWithdrawModalOpen.value = false
}

const openEnrollModal = (program = null) => {
  if (typeof program === 'number' || typeof program === 'string') {
    const found = store.programs.find((p) => p.id === Number(program))
    programToEnroll.value = found || { id: Number(program) }
  } else {
    programToEnroll.value = program || store.selectedProgram || store.programs[0]
  }
  isEnrollModalOpen.value = true
}
const closeEnrollModal = () => {
  isEnrollModalOpen.value = false
  programToEnroll.value = null
}

const handleJoinProgramFromStore = (programId) => {
  if (!store.programs.length) {
    store.fetchPrograms(false, () => {
      openEnrollModal(programId)
    })
  } else {
    openEnrollModal(programId)
  }
}

const openLeaveModal = () => {
  isLeaveModalOpen.value = true
}
const closeLeaveModal = () => {
  isLeaveModalOpen.value = false
}

const openStoreRedeemModal = (product) => {
  selectedProductForRedeem.value = product
  isStoreRedeemModalOpen.value = true
}
const closeStoreRedeemModal = () => {
  isStoreRedeemModalOpen.value = false
  selectedProductForRedeem.value = null
}

// ─── Hero Banner Media Carousel State ───────────────────────
const activeHeroMediaIndex = ref(0)
const heroMediaList = computed(() => {
  const p = store.selectedProgram
  if (!p) return []
  if (p.image_urls && Array.isArray(p.image_urls) && p.image_urls.length > 0) {
    return p.image_urls
  }
  if (p.image_url) {
    return [p.image_url]
  }
  return []
})

// ─── Store Categories Filter ────────────────────────────────
const storeCategoryFilter = ref('all')
const storeCategories = [
  { label: 'All Items', value: 'all' },
  { label: 'Merchandise', value: 'merchandise' },
  { label: 'Gift Cards', value: 'gift_card' },
  { label: 'VPS Hosting', value: 'vps' },
  { label: 'Bonus Funds', value: 'bonus_funds' },
]

const filteredStoreProducts = computed(() => {
  if (storeCategoryFilter.value === 'all') {
    return store.storeProducts
  }
  return store.storeProducts.filter(
    (p) => (p.product_type || p.type) === storeCategoryFilter.value
  )
})

// ─── Points Ledger Filter ───────────────────────────────────
const pointsEntryTypeFilter = ref('ALL')
const ledgerTabs = [
  { label: 'All Ledger', value: 'ALL' },
  { label: 'Earn Only', value: 'EARN' },
]

// ─── Global Loyalty Transactions History Filter State ──────────
const globalPointsEntryFilter = ref('ALL')
const globalProgramFilter = ref('ALL')

const transactionEntryTabs = [
  { label: 'All Transactions', value: 'ALL' },
  { label: 'Earned', value: 'EARN' },
  { label: 'Transfers / Converts', value: 'CONVERT' },
  { label: 'Store Reserved', value: 'REDEEM_RESERVE' },
  { label: 'Released', value: 'REDEEM_RELEASE' },
  { label: 'Expired', value: 'EXPIRE' },
]

const programFilterOptions = computed(() => {
  const opts = [{ label: 'All Programs', value: 'ALL' }]
  if (store.programs && store.programs.length > 0) {
    store.programs.forEach((p) => {
      opts.push({
        label: p.name || p.code || `Program #${p.id}`,
        value: p.id,
      })
    })
  }
  return opts
})

const onGlobalPointsPageChange = (page) => {
  store.fetchPoints(
    page,
    store.pointsPagination.per_page || 20,
    globalPointsEntryFilter.value,
    globalProgramFilter.value === 'ALL' ? '' : globalProgramFilter.value,
    true
  )
}

const onFilterGlobalPointsEntry = (type) => {
  globalPointsEntryFilter.value = type
  store.fetchPoints(
    1,
    store.pointsPagination.per_page || 20,
    type,
    globalProgramFilter.value === 'ALL' ? '' : globalProgramFilter.value,
    true
  )
}

const onFilterGlobalProgram = (programVal) => {
  globalProgramFilter.value = programVal
  store.fetchPoints(
    1,
    store.pointsPagination.per_page || 20,
    globalPointsEntryFilter.value,
    programVal === 'ALL' ? '' : programVal,
    true
  )
}

const refreshGlobalPoints = () => {
  store.fetchPoints(
    store.pointsPagination.page || 1,
    store.pointsPagination.per_page || 20,
    globalPointsEntryFilter.value,
    globalProgramFilter.value === 'ALL' ? '' : globalProgramFilter.value,
    true
  )
}

const getProgramNameById = (progId) => {
  if (!progId) return 'Central Wallet'
  const found = store.programs?.find((p) => p.id === progId || p.id === Number(progId))
  return found?.name || found?.code || `Program #${progId}`
}

// ─── Program Selection Handlers ─────────────────────────────
const selectProgramAndOpenDashboard = (programId) => {
  store.setSelectedProgram(programId)
  currentView.value = 'detail'
  activeTab.value = 'programs'
  activeHeroMediaIndex.value = 0
  router.replace({ query: { ...route.query, programId, tab: 'programs' } })
}

const goBackToProgramsList = () => {
  currentView.value = 'list'
  const nextQuery = { ...route.query }
  delete nextQuery.programId
  router.replace({ query: nextQuery })
}

// ─── Pagination Handlers ────────────────────────────────────
const onPointsPageChange = (page) => {
  store.fetchPoints(page, store.pointsPagination.per_page, pointsEntryTypeFilter.value, null, true)
}

const onFilterPointsEntryType = (type) => {
  pointsEntryTypeFilter.value = type
  store.fetchPoints(1, store.pointsPagination.per_page, type, null, true)
}

const onStoreProductsPageChange = (page) => {
  store.fetchStoreProducts(page, store.storeProductsPagination.per_page, null, true)
}

const onStoreRedemptionsPageChange = (page) => {
  store.fetchStoreRedemptions(page, store.storeRedemptionsPagination.per_page, '', null, true)
}

const onTransfersPageChange = (page) => {
  store.fetchWalletTransfers(page, store.transfersPagination.per_page, '', null, true)
}

// ─── DataTable Column Definitions ───────────────────────────
const transferColumns = [
  { key: 'id', label: 'Transfer ID / Date' },
  { key: 'kind', label: 'Transfer Type' },
  { key: 'trading_account_id', label: 'Destination Account' },
  { key: 'points', label: 'Points Converted' },
  { key: 'usd_amount', label: 'USD Credited' },
  { key: 'status', label: 'Status' },
]

const ledgerColumns = [
  { key: 'created_at', label: 'Date & Time' },
  { key: 'entry_type', label: 'Type' },
  { key: 'symbol', label: 'Symbol / Volume' },
  { key: 'deal_id', label: 'Trade / Deal ID' },
  { key: 'delta', label: 'Delta (Pts)' },
  { key: 'balance_after', label: 'Balance After' },
  { key: 'lot_points_remaining', label: 'Lot Remaining' },
  { key: 'expires_at', label: 'Expires At' },
]

const globalTransactionColumns = [
  { key: 'created_at', label: 'Date & Time' },
  { key: 'entry_type', label: 'Type' },
  { key: 'program_id', label: 'Program' },
  { key: 'details', label: 'Details / Context' },
  { key: 'delta', label: 'Points (Delta)' },
  { key: 'balance_after', label: 'Balance After' },
  { key: 'lot_points_remaining', label: 'Lot Remaining' },
  { key: 'expires_at', label: 'Expires At' },
]

const storeOrderColumns = [
  { key: 'id', label: 'Order ID / Date' },
  { key: 'title', label: 'Item Name' },
  { key: 'type', label: 'Type' },
  { key: 'points', label: 'Points Reserved' },
  { key: 'cash_value', label: 'Est. Value' },
  { key: 'status', label: 'Status' },
  { key: 'notes', label: 'Delivery Notes' },
  { key: 'actions', label: 'Action', headerClass: 'text-right', cellClass: 'text-right' },
]

// ─── Status Badge Styling Helper ────────────────────────────
const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'fulfilled':
    case 'approved':
      return 'bg-emerald-500/10 text-emerald-400'
    case 'pending':
    case 'fulfilling':
      return 'bg-amber-500/10 text-amber-400'
    case 'failed':
    case 'rejected':
      return 'bg-red-500/10 text-red-400'
    default:
      return 'bg-white/5 text-secondary-text'
  }
}

// ─── Static Tier Reference Information ──────────────────────
const tierList = [
  {
    code: 'BRONZE',
    name: 'Bronze',
    requirement: '0 – 4,999 pts',
    min_points: '0',
    max_points: '4999',
    point_multiplier: '1.0000',
    cash_conversion_rate: '0.010000',
    allow_wallet_transfer: false,
    color: '#B26A2E',
    sort_order: 1,
    is_active: true,
  },
  {
    code: 'SILVER',
    name: 'Silver',
    requirement: '5,000 – 19,999 pts',
    min_points: '5000',
    max_points: '19999',
    point_multiplier: '1.4000',
    cash_conversion_rate: '0.012000',
    allow_wallet_transfer: false,
    color: '#8F99A6',
    sort_order: 2,
    is_active: true,
  },
  {
    code: 'GOLD',
    name: 'Gold',
    requirement: '20,000 – 59,999 pts',
    min_points: '20000',
    max_points: '59999',
    point_multiplier: '2.0000',
    cash_conversion_rate: '0.015000',
    allow_wallet_transfer: false,
    color: '#D6A819',
    sort_order: 3,
    is_active: true,
  },
  {
    code: 'PLATINUM',
    name: 'Platinum',
    requirement: '60,000 – 149,999 pts',
    min_points: '60000',
    max_points: '149999',
    point_multiplier: '2.5000',
    cash_conversion_rate: '0.018000',
    allow_wallet_transfer: false,
    color: '#A8ACB4',
    sort_order: 4,
    is_active: true,
  },
  {
    code: 'ELITE',
    name: 'Elite',
    requirement: '150,000+ pts',
    min_points: '150000',
    max_points: null,
    point_multiplier: '3.0000',
    cash_conversion_rate: '0.020000',
    allow_wallet_transfer: false,
    color: '#6C298F',
    sort_order: 5,
    is_active: true,
  },
]

const effectiveTiers = computed(() => {
  if (store.tiers && Array.isArray(store.tiers) && store.tiers.length > 0) {
    return store.tiers
  }
  if (store.selectedProgram?.tiers && Array.isArray(store.selectedProgram.tiers) && store.selectedProgram.tiers.length > 0) {
    return store.selectedProgram.tiers
  }
  return tierList
})

// Extract all unique custom benefit keys from the tiers
const dynamicBenefitKeys = computed(() => {
  const keysSet = new Set()
  effectiveTiers.value.forEach((tier) => {
    if (tier.benefits && typeof tier.benefits === 'object' && !Array.isArray(tier.benefits)) {
      Object.keys(tier.benefits).forEach((key) => {
        keysSet.add(key)
      })
    }
  })
  return Array.from(keysSet)
})

const formatBenefitLabel = (key) => {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const formatBenefitValue = (val) => {
  if (val === true || val === 'true' || val === 'included' || val === 'Included' || val === 'yes') {
    return { type: 'included', label: 'Included' }
  }
  if (val === false || val === 'false' || val === null || val === undefined || val === '') {
    return { type: 'none', label: '-' }
  }
  return { type: 'text', label: String(val) }
}

// ─── Dynamic Tier Ladder Comparison DataTable Columns & Rows ──────────────
const tierTableColumns = computed(() => {
  const cols = [
    { key: 'feature', label: 'Benefit / Feature', headerClass: 'text-2xs uppercase tracking-wider' },
  ]
  effectiveTiers.value.forEach((tier) => {
    cols.push({
      key: `tier_${tier.id || tier.code}`,
      label: tier.name || tier.code,
    })
  })
  return cols
})

const tierTableRows = computed(() => {
  const rows = []

  // 1. Points Required
  const reqRow = {
    id: 'req',
    feature: 'Points Required',
  }
  effectiveTiers.value.forEach((tier) => {
    const key = `tier_${tier.id || tier.code}`
    const min = Number(tier.min_points ?? 0).toLocaleString()
    const max = tier.max_points !== null && tier.max_points !== undefined ? Number(tier.max_points).toLocaleString() : '∞'
    reqRow[key] = `${min} to ${max} pts`
  })
  rows.push(reqRow)

  // 2. Points Multiplier
  const multRow = {
    id: 'mult',
    feature: 'Points Multiplier',
  }
  effectiveTiers.value.forEach((tier) => {
    const key = `tier_${tier.id || tier.code}`
    const mult = Number(tier.point_multiplier ?? 1).toFixed(4)
    multRow[key] = `${mult}×`
  })
  rows.push(multRow)

  // 3. Cash Redemption Rate
  const rateRow = {
    id: 'cash_rate',
    feature: 'Cash Redemption Rate',
  }
  effectiveTiers.value.forEach((tier) => {
    const key = `tier_${tier.id || tier.code}`
    const rate = Number(tier.cash_conversion_rate || 0.01).toFixed(6)
    rateRow[key] = `1 pt = $${rate}`
  })
  rows.push(rateRow)

  // 4. Direct Wallet Transfer
  const transferRow = {
    id: 'transfer',
    feature: 'Direct Wallet Transfer',
  }
  effectiveTiers.value.forEach((tier) => {
    const key = `tier_${tier.id || tier.code}`
    transferRow[key] = tier.allow_wallet_transfer ? 'Included' : '-'
  })
  rows.push(transferRow)

  // 5. Dynamic Custom Benefits from tier.benefits
  dynamicBenefitKeys.value.forEach((bKey) => {
    const bRow = {
      id: `benefit_${bKey}`,
      feature: formatBenefitLabel(bKey),
    }
    effectiveTiers.value.forEach((tier) => {
      const key = `tier_${tier.id || tier.code}`
      const val = tier.benefits?.[bKey]
      const formatted = formatBenefitValue(val)
      bRow[key] = formatted.label
    })
    rows.push(bRow)
  })

  return rows
})

const getTierCardStyle = (code) => {
  switch (code?.toUpperCase()) {
    case 'BRONZE':
      return {
        background: 'linear-gradient(135deg, #B26A2E 0%, #945320 50%, #763D12 100%)',
      }
    case 'SILVER':
      return {
        background: 'linear-gradient(135deg, #8F99A6 0%, #757F8C 50%, #5B6471 100%)',
      }
    case 'GOLD':
      return {
        background: 'linear-gradient(135deg, #D6A819 0%, #B88E0C 50%, #997304 100%)',
      }
    case 'PLATINUM':
      return {
        background: 'linear-gradient(135deg, #A8ACB4 0%, #8D919A 50%, #71757E 100%)',
      }
    case 'ELITE':
      return {
        background: 'linear-gradient(135deg, #6C298F 0%, #521B70 50%, #390E51 100%)',
      }
    default:
      return {
        background: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
      }
  }
}

// ─── Tier Carousel Navigation ──────────────────────────────
const tierCarouselRef = ref(null)
const scrollTierCarousel = (direction) => {
  if (!tierCarouselRef.value) return
  const scrollAmount = 280
  tierCarouselRef.value.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth',
  })
}

// ─── Lifecycle & Route Sync ────────────────────────────────
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && ['programs', 'transactions', 'store', 'store_orders'].includes(newTab)) {
      activeTab.value = newTab
      if (newTab === 'transactions') {
        store.fetchPoints(
          1,
          20,
          globalPointsEntryFilter.value,
          globalProgramFilter.value === 'ALL' ? '' : globalProgramFilter.value,
          true
        )
      }
    }
  }
)

watch(
  () => route.query.programId,
  (newProgramId) => {
    if (newProgramId) {
      const pid = Number(newProgramId)
      if (store.selectedProgramId !== pid) {
        store.setSelectedProgram(pid)
      }
      currentView.value = 'detail'
    } else {
      currentView.value = 'list'
    }
  }
)

onMounted(() => {
  const queryTab = route.query.tab
  if (queryTab && ['programs', 'transactions', 'store', 'store_orders'].includes(queryTab)) {
    activeTab.value = queryTab
  }

  const queryProgramId = route.query.programId ? Number(route.query.programId) : null

  store.fetchSummary(queryProgramId, true)

  store.fetchPrograms(false, (programsList) => {
    if (queryProgramId && programsList.some((p) => p.id === queryProgramId)) {
      selectProgramAndOpenDashboard(queryProgramId)
    } else {
      currentView.value = 'list'
    }
  })

  // Preload tabs data
  store.fetchPoints(
    1,
    20,
    globalPointsEntryFilter.value,
    globalProgramFilter.value === 'ALL' ? '' : globalProgramFilter.value,
    true
  )
  store.fetchStoreProducts(1)
  store.fetchStoreRedemptions(1)
})
</script>

<template>
  <div class="space-y-6 pb-12 w-full max-w-full">

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- TOP LEVEL MAIN HIVE TABS BAR (HIDDEN WHEN INSIDE PROGRAM DASHBOARD)  -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div
      v-if="currentView === 'list' || activeTab !== 'programs'"
      class="w-full max-w-full overflow-x-auto no-scrollbar"
    >
      <BaseTabs
        :model-value="activeTab"
        @update:model-value="selectTab"
        :tabs="tabList"
      />
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- TAB 1: LOYALTY PROGRAMS (LIST & PROGRAM DASHBOARD)                  -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'programs'" class="space-y-6 animate-in fade-in duration-200">

      <!-- SUB-VIEW 1.1: ALL LOYALTY PROGRAMS LIST (CARDS CATALOGUE) -->
      <div v-if="currentView === 'list'" class="space-y-6">

        <!-- Points On Hold Warning Banner (if points are on hold) -->
        <div
          v-if="store.summary.points_on_hold"
          class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3 shadow-xs"
        >
          <AlertCircle class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div class="space-y-0.5">
            <h4 class="font-bold text-amber-300 text-sm">Loyalty Points On Hold</h4>
            <p class="text-amber-200/80 leading-relaxed">
              Your central loyalty points are currently on temporary hold. Points conversions to trading balances and rewards store redemptions are paused until the hold is resolved.
            </p>
          </div>
        </div>

        <!-- Central Loyalty Wallet Overview Header Card (List View) -->
        <div class="bg-card-background rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-0">
          <div class="space-y-2 max-w-xl">
            <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
              <Wallet class="w-3.5 h-3.5" />
              <span>Central Loyalty Wallet</span>
            </div>
            <h3 class="text-lg sm:text-xl font-bold text-primary-text">
              Loyalty Points Wallet
            </h3>
            <p class="text-xs text-secondary-text leading-relaxed">
              All loyalty points earned from any program accumulate in this single wallet. Convert your points directly to trading USD balance or redeem for store rewards.
            </p>
          </div>

          <!-- Wallet Quick Stats & Actions -->
          <div class="flex flex-wrap items-center gap-3 sm:gap-4 bg-background p-4 rounded-2xl shrink-0">
            <div class="space-y-0.5 pr-4 border-r border-primary-border/20">
              <p class="text-2xs text-secondary-text uppercase font-semibold">Available Points</p>
              <p class="text-xl font-extrabold text-primary font-mono tabular-nums">
                {{ Number(store.summary.available_points || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
              </p>
            </div>
            <div class="space-y-0.5 pr-4 border-r border-primary-border/20 hidden sm:block">
              <p class="text-2xs text-secondary-text uppercase font-semibold">Lifetime Earned</p>
              <p class="text-base font-bold text-primary-text font-mono tabular-nums">
                {{ Number(store.summary.lifetime_earned_points || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="store.summary.enrolled && (store.summary.allow_wallet_transfer || store.summary.allow_general_wallet_transfer) && !store.summary.points_on_hold"
                type="button"
                @click="openWithdrawModal"
                class="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-bold rounded-full bg-button text-button-text hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                <ArrowLeftRight class="w-3.5 h-3.5" />
                <span>Convert</span>
              </button>
              <button
                type="button"
                @click="selectTab('store')"
                class="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-semibold rounded-full bg-white/5 hover:bg-white/10 text-primary-text transition-colors cursor-pointer"
              >
                <ShoppingBag class="w-3.5 h-3.5 text-primary" />
                <span>Store</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Loading Skeleton for Programs List -->
        <div v-if="store.isProgramsLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <div
            v-for="n in 3"
            :key="n"
            class="bg-card-background rounded-2xl sm:rounded-3xl overflow-hidden animate-pulse flex flex-col justify-between border-0"
          >
            <div class="h-44 sm:h-48 bg-background w-full" />
            <div class="p-4 sm:p-6 space-y-3">
              <div class="h-4 w-1/3 bg-background rounded-full" />
              <div class="h-5 w-3/4 bg-background rounded-full" />
              <div class="h-3 w-full bg-background rounded-full" />
              <div class="h-10 w-full bg-background rounded-full mt-4" />
            </div>
          </div>
        </div>

        <!-- Programs Grid -->
        <div
          v-else-if="store.programs.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
          <LoyaltyProgramCard
            v-for="program in store.programs"
            :key="program.id"
            :program="program"
            @select="selectProgramAndOpenDashboard"
            @enroll="openEnrollModal"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="py-16 bg-card-background rounded-2xl sm:rounded-3xl text-center border-0">
          <EmptyState
            title="No loyalty programs available"
            subtitle="There are currently no active loyalty campaigns. Please check back later!"
          >
            <template #icon>
              <Gift class="w-8 h-8 text-secondary-text" />
            </template>
          </EmptyState>
        </div>
      </div>

      <!-- SUB-VIEW 1.2: INDIVIDUAL PROGRAM DASHBOARD -->
      <div v-else class="space-y-6 animate-in fade-in duration-200">
        <!-- Points On Hold Warning Banner (Program Dashboard View) -->
        <div
          v-if="store.summary.points_on_hold"
          class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3 shadow-xs"
        >
          <AlertCircle class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div class="space-y-0.5">
            <h4 class="font-bold text-amber-300 text-sm">Loyalty Points On Hold</h4>
            <p class="text-amber-200/80 leading-relaxed">
              Your loyalty points are currently on temporary hold. Points conversions and store reward redemptions are paused.
            </p>
          </div>
        </div>

        <!-- ════════════════════ PROGRAM HERO MEDIA BANNER ════════════════════ -->
        <div class="bg-card-background rounded-2xl sm:rounded-3xl xl:rounded-[30px] overflow-hidden border-0">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-0">
            <!-- Hero Media Player / Carousel with auto-slide & pause on hover -->
            <div class="lg:col-span-5 w-full h-56 sm:h-72 lg:h-auto lg:min-h-full bg-background relative overflow-hidden shrink-0">
              <LoyaltyMedia
                :items="heroMediaList"
                :alt="store.selectedProgram?.name || 'Program Banner'"
                :auto-slide="true"
                :pause-on-hover="true"
                :show-controls="true"
                :show-arrows="true"
                :show-dots="true"
                media-class="w-full h-full object-cover"
              />
            </div>

            <!-- Hero Content Details -->
            <div class="lg:col-span-7 p-4 sm:p-6 lg:p-7 flex flex-col justify-between space-y-4">
              <div class="space-y-3">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div class="flex items-center gap-2">
                    <BaseBadge
                      :value="store.selectedProgram?.code || 'PROGRAM'"
                      variant="neutral"
                      size="2xs"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <BaseBadge
                      :value="store.summary.enrolled ? 'Enrolled' : 'Not Enrolled'"
                      :variant="store.summary.enrolled ? 'success' : 'warning'"
                      size="xs"
                      :pulse="store.summary.enrolled"
                    />

                    <!-- Convert Points Button if Enrolled and Permitted (and not on hold) -->
                    <button
                      v-if="store.summary.enrolled && (store.summary.allow_wallet_transfer || store.summary.allow_general_wallet_transfer) && !store.summary.points_on_hold"
                      type="button"
                      @click="openWithdrawModal"
                      class="inline-flex items-center gap-1 h-7 px-3 text-[11px] font-bold rounded-full bg-button text-button-text hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      title="Convert Points to Trading USD"
                    >
                      <ArrowLeftRight class="w-3 h-3" />
                      <span>Convert Points</span>
                    </button>

                    <!-- Leave Program Button if Enrolled -->
                    <button
                      v-if="store.summary.enrolled"
                      type="button"
                      @click="openLeaveModal"
                      class="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-medium rounded-full bg-white/5 hover:bg-red-500/10 text-secondary-text hover:text-red-400 transition-colors cursor-pointer"
                      title="De-enroll / Leave Program"
                    >
                      <LogOut class="w-3 h-3" />
                      <span>Leave</span>
                    </button>

                    <!-- Quick Join Button if Not Enrolled -->
                    <button
                      v-else
                      type="button"
                      @click="openEnrollModal(store.selectedProgram)"
                      class="inline-flex items-center gap-1 h-7 px-3 text-[11px] font-bold rounded-full bg-button text-button-text hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <span>Join</span>
                    </button>
                  </div>
                </div>

                <h2 class="text-lg sm:text-xl lg:text-2xl font-bold text-primary-text">
                  {{ store.selectedProgram?.name || 'PantherTrade Loyalty Program' }}
                </h2>
                <p class="text-xs text-secondary-text leading-relaxed">
                  {{ store.selectedProgram?.description || 'Earn loyalty points automatically on your standard lots traded. Redeem points for withdrawable cash or exclusive store merchandise.' }}
                </p>
              </div>

              <!-- Scope & Date Validity Footer -->
              <div class="pt-3 border-t border-primary-border/20 flex flex-wrap items-center gap-4 text-xs text-secondary-text">
                <div class="flex items-center gap-1.5">
                  <Layers class="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Scope: {{ store.selectedProgram?.account_scope === 'one_per_user' ? '1 Primary Account' : 'All Eligible Accounts' }}</span>
                </div>
                <div v-if="store.selectedProgram?.start_at || store.selectedProgram?.end_at" class="flex items-center gap-1.5">
                  <Calendar class="w-3.5 h-3.5 text-secondary-text shrink-0" />
                  <span class="truncate">Valid: {{ store.selectedProgram?.start_at ? formatDate(store.selectedProgram.start_at) : 'Open' }} - {{ store.selectedProgram?.end_at ? formatDate(store.selectedProgram.end_at) : 'Ongoing' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ════════════════════ TOP KPI SUMMARY STATS CARD ════════════════════ -->
        <div id="tour-loyalty-stats" class="bg-card-background border-0 shadow-none rounded-2xl p-4 sm:p-5">
          <!-- Loading Skeleton for KPIs -->
          <div
            v-if="store.isSummaryLoading"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-0 divide-y sm:divide-y-0 xl:divide-x divide-primary-border"
          >
            <div
              v-for="n in 5"
              :key="n"
              class="flex items-center gap-3 animate-pulse py-3 sm:py-0 px-2 sm:px-4"
            >
              <div class="w-13.5 h-13.5 rounded-[15px] bg-background shrink-0" />
              <div class="space-y-2 flex-1 min-w-0">
                <div class="h-3 w-20 bg-background rounded-full" />
                <div class="h-6 w-24 bg-background rounded-full" />
              </div>
            </div>
          </div>

          <!-- Stats Grid -->
          <div
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-0 divide-y sm:divide-y-0 xl:divide-x divide-primary-border"
          >
            <!-- Metric 1: Available Points -->
            <div class="flex items-center gap-3 pb-4 sm:pb-0 xl:pr-5">
              <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
                <Wallet class="w-6 h-6 text-black" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <p class="text-xs font-semibold text-secondary-text truncate">Available Points</p>
                  <Tooltip text="Total loyalty points available to redeem or convert" position="top" wrap>
                    <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                  </Tooltip>
                </div>
                <h3 class="text-2xl font-bold text-primary-text mt-0.5 font-mono tabular-nums truncate">
                  {{ store.summary.available_points }}
                </h3>
                <p class="text-[11px] text-secondary-text truncate">
                  Min: {{ store.summary.min_redemption_points }} pts
                </p>
              </div>
            </div>

            <!-- Metric 2: Current Tier -->
            <div class="flex items-center gap-3 py-4 sm:py-0 xl:px-5">
              <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
                <Award class="w-6 h-6 text-black" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <p class="text-xs font-semibold text-secondary-text truncate">Current Tier</p>
                  <Tooltip text="Your current loyalty tier stage and multiplier" position="top" wrap>
                    <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                  </Tooltip>
                </div>
                <div class="flex items-center gap-1.5 mt-0.5 min-w-0 flex-wrap">
                  <h3 class="text-lg font-bold text-primary-text font-mono truncate">
                    {{ store.summary.current_tier?.name || 'Bronze' }}
                  </h3>
                  <span
                    class="text-3xs sm:text-2xs px-1.5 py-0.5 font-bold rounded-full shrink-0 font-mono"
                    :style="{
                      color: store.summary.current_tier?.color || '#CD7F32',
                      backgroundColor: (store.summary.current_tier?.color || '#CD7F32') + '20',
                    }"
                  >
                    {{ store.summary.current_tier?.point_multiplier }}×
                  </span>
                </div>
                <Tooltip :text="`1 pt = $${store.summary.cash_conversion_rate} USD`" position="top">
                  <p class="text-[11px] text-secondary-text truncate">
                    1 pt = ${{ store.summary.cash_conversion_rate }} USD
                  </p>
                </Tooltip>
              </div>
            </div>

            <!-- Metric 3: Lifetime Earned -->
            <div class="flex items-center gap-3 py-4 sm:py-0 xl:px-5">
              <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
                <TrendingUp class="w-6 h-6 text-black" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <p class="text-xs font-semibold text-secondary-text truncate">Lifetime Earned</p>
                  <Tooltip text="Cumulative points earned across all closed trades" position="top" wrap>
                    <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                  </Tooltip>
                </div>
                <h3 class="text-2xl font-bold text-primary-text mt-0.5 font-mono tabular-nums truncate">
                  {{ store.summary.lifetime_earned_points }}
                </h3>
                <p class="text-[11px] text-secondary-text truncate">Cumulative earned</p>
              </div>
            </div>

            <!-- Metric 4: Pending Redemptions -->
            <div class="flex items-center gap-3 py-4 sm:py-0 xl:px-5">
              <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
                <Clock class="w-6 h-6 text-black" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <p class="text-xs font-semibold text-secondary-text truncate">Pending Points</p>
                  <Tooltip text="Points reserved in pending redemptions under review" position="top" wrap>
                    <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                  </Tooltip>
                </div>
                <h3 class="text-2xl font-bold mt-0.5 font-mono tabular-nums truncate">
                  {{ store.summary.pending_redemption_points }}
                </h3>
                <p class="text-[11px] text-secondary-text truncate">Reserved in review</p>
              </div>
            </div>

            <!-- Metric 5: Next Expiry Points -->
            <div class="flex items-center gap-3 pt-4 sm:pt-0 xl:pl-5">
              <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
                <Calendar class="w-6 h-6 text-black" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <p class="text-xs font-semibold text-secondary-text truncate">Next Expiry</p>
                  <Tooltip text="Upcoming points scheduled to expire soon" position="top" wrap>
                    <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                  </Tooltip>
                </div>
                <h3 class="text-2xl font-bold text-primary-text mt-0.5 font-mono tabular-nums truncate">
                  {{ store.summary.next_expiry_points }} <span class="text-sm font-medium text-secondary-text">pts</span>
                </h3>
                <p class="text-[11px] text-secondary-text truncate">
                  {{ store.summary.next_expiry_at ? formatDate(store.summary.next_expiry_at) : 'No points expiring soon' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- ════════════════════ PROGRAM DASHBOARD SUB-TABS & FILTERS ════════════════════ -->
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <!-- Primary Sub-Tabs -->
            <div class="w-fit max-w-full overflow-x-auto no-scrollbar">
              <BaseTabs
                v-model="programSubTab"
                :tabs="programSubTabs"
              />
            </div>

            <!-- Right Controls: Secondary Filter (when in Points Ledger) + Refresh Action -->
            <div class="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end shrink-0 flex-wrap">
              <!-- Points Ledger Filter -->
              <div v-if="programSubTab === 'ledger'" class="w-fit max-w-full overflow-x-auto no-scrollbar">
                <BaseTabs
                  v-model="pointsEntryTypeFilter"
                  :tabs="ledgerTabs"
                  active-class="bg-secondary text-white dark:bg-primary/20 dark:text-primary font-semibold shadow-xs border border-secondary/20 dark:border-primary/30"
                  inactive-class="text-secondary-text hover:text-primary-text"
                  over-ride-class="border border-primary-border/20"
                  @update:modelValue="onFilterPointsEntryType"
                />
              </div>

              <!-- Refresh Button -->
              <RefreshButton
                :loading="store.isSummaryLoading || store.isTransfersLoading || store.isPointsLoading || store.isTiersLoading"
                title="Refresh Data"
                bg-class="bg-background border border-primary-border/40 hover:border-primary-border/80"
                @click="() => store.fetchAllForSelectedProgram(true)"
              />
            </div>
          </div>

          <!-- SUB-TAB 1: WALLET TRANSFERS (INSTANT CONVERSION TO TRADING ACCOUNT) -->
          <div v-if="programSubTab === 'transfers'" class="space-y-4">
            <DataTable
              :columns="transferColumns"
              :rows="store.transfers"
              :loading="store.isTransfersLoading"
              :page="store.transfersPagination.page"
              :total-pages="store.transfersPagination.pages"
              :total-items="store.transfersPagination.total"
              empty-text="No wallet transfers yet"
              empty-subtitle="Convert your loyalty points directly to USD in your trading account balance anytime."
              @update:page="onTransfersPageChange"
            >
              <template #cell-id="{ row }">
                <div>
                  <span class="font-bold text-primary-text">#TRF-{{ row.id }}</span>
                  <div class="text-[11px] text-secondary-text">{{ formatDate(row.created_at) }}</div>
                </div>
              </template>

              <template #cell-kind="{ row }">
                <BaseBadge
                  :value="row.kind === 'primary' ? 'Primary' : 'General'"
                  :variant="row.kind === 'primary' ? 'primary' : 'neutral'"
                  size="xs"
                />
              </template>

              <template #cell-trading_account_id="{ row }">
                <span class="font-semibold text-primary-text">
                  #{{ row.trading_account_id || '-' }}
                </span>
              </template>

              <template #cell-points="{ row }">
                <span class="font-bold text-primary-text">
                  {{ Number(row.points || 0).toLocaleString() }} pts
                </span>
              </template>

              <template #cell-usd_amount="{ row }">
                <span class="font-bold text-primary">
                  ${{ Number(row.usd_amount || 0).toFixed(2) }} USD
                </span>
              </template>

              <template #cell-status="{ row }">
                <BaseBadge :value="row.status" size="xs" />
              </template>

              <template #empty>
                <div class="py-8 text-center space-y-3 px-4">
                  <EmptyState
                    title="No wallet transfers yet"
                    subtitle="Convert your loyalty points directly to USD in your trading account balance anytime."
                  >
                    <template #icon>
                      <ArrowLeftRight class="w-6 h-6 text-secondary-text" />
                    </template>
                  </EmptyState>
                  <div v-if="store.summary.enrolled && (store.summary.allow_wallet_transfer || store.summary.allow_general_wallet_transfer)">
                    <button
                      type="button"
                      @click="openWithdrawModal"
                      class="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-bold rounded-full bg-button text-button-text hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <span>Convert Points Now</span>
                    </button>
                  </div>
                </div>
              </template>
            </DataTable>
          </div>

          <!-- SUB-TAB 2: POINTS LEDGER -->
          <div v-if="programSubTab === 'ledger'" class="space-y-4">
            <DataTable
              :columns="ledgerColumns"
              :rows="store.points"
              :loading="store.isPointsLoading"
              :page="store.pointsPagination.page"
              :total-pages="store.pointsPagination.pages"
              :total-items="store.pointsPagination.total"
              empty-text="No points records found"
              empty-subtitle="Your loyalty points earning history will appear here once you trade eligible pairs."
              @update:page="onPointsPageChange"
            >
              <template #cell-created_at="{ row }">
                <span class="text-secondary-text whitespace-nowrap">
                  {{ formatDate(row.created_at) }}
                </span>
              </template>

              <template #cell-entry_type="{ row }">
                <BaseBadge :value="row.entry_type" size="xs" />
              </template>

              <template #cell-symbol="{ row }">
                <span v-if="row.metadata?.symbol" class="text-primary-text font-semibold">
                  {{ row.metadata.symbol }}
                  <span class="text-secondary-text font-normal text-[11px]">({{ row.metadata.lots }} lots)</span>
                </span>
                <span v-else class="text-secondary-text">-</span>
              </template>

              <template #cell-deal_id="{ row }">
                <span class="text-secondary-text font-mono">
                  {{ row.deal_id || row.lot_id || '-' }}
                </span>
              </template>

              <template #cell-delta="{ row }">
                <span
                  class="font-bold"
                  :class="
                    Number(row.delta) > 0
                      ? 'text-primary'
                      : Number(row.delta) < 0
                      ? 'text-red-400'
                      : 'text-primary-text'
                  "
                >
                  {{ Number(row.delta) > 0 ? '+' : '' }}{{ row.delta }} pts
                </span>
              </template>

              <template #cell-balance_after="{ row }">
                <span class="text-primary-text font-bold">
                  {{ Number(row.balance_after || 0).toLocaleString() }} pts
                </span>
              </template>

              <template #cell-lot_points_remaining="{ row }">
                <span class="text-secondary-text">
                  {{ row.lot_points_remaining !== null && row.lot_points_remaining !== undefined ? `${row.lot_points_remaining} pts` : '-' }}
                </span>
              </template>

              <template #cell-expires_at="{ row }">
                <span class="text-secondary-text">
                  {{ row.expires_at ? formatDate(row.expires_at) : '-' }}
                </span>
              </template>

              <template #empty>
                <div class="py-8 text-center px-4">
                  <EmptyState
                    title="No points records found"
                    subtitle="Your loyalty points earning history will appear here once you trade eligible pairs."
                  >
                    <template #icon>
                      <Coins class="w-6 h-6 text-secondary-text" />
                    </template>
                  </EmptyState>
                </div>
              </template>
            </DataTable>
          </div>

          <!-- SUB-TAB 3: TIER BENEFITS & INFO -->
          <div v-if="programSubTab === 'tiers'" class="space-y-6">
            <!-- Tier Overview Header with Carousel Controls -->
            <div class="flex items-center justify-between gap-4">
              <div>
                <h3 class="text-sm font-bold text-primary-text">Program Tiers & Progression</h3>
                <p class="text-xs text-secondary-text">Higher stages unlock higher points multiplier and cash redemption rates</p>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  @click="scrollTierCarousel('left')"
                  class="w-8 h-8 rounded-full bg-card-background hover:bg-white/10 text-secondary-text hover:text-primary-text flex items-center justify-center transition-all cursor-pointer border-0 shadow-sm"
                  title="Previous Tier"
                >
                  <ArrowLeft class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  @click="scrollTierCarousel('right')"
                  class="w-8 h-8 rounded-full bg-card-background hover:bg-white/10 text-secondary-text hover:text-primary-text flex items-center justify-center transition-all cursor-pointer border-0 shadow-sm"
                  title="Next Tier"
                >
                  <ArrowRight class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Tier Overview Cards Horizontal Carousel -->
            <div
              ref="tierCarouselRef"
              class="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-3 pt-1 scroll-smooth snap-x snap-mandatory"
            >
              <div
                v-for="(tier, idx) in effectiveTiers"
                :key="tier.id || tier.code"
                class="w-55 sm:w-62.5 md:w-65 shrink-0 snap-start relative rounded-3xl overflow-hidden flex flex-col justify-between min-h-75 shadow-lg border border-white/10 select-none"
                :style="getTierCardStyle(tier.code)"
              >
                <!-- Brand Logo Watermark Background with shine effect strictly inside logo vector paths -->
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
                  <svg
                    viewBox="0 0 561.49 388.8"
                    class="w-32 sm:w-36 h-auto opacity-20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <mask :id="`tier-logo-mask-${tier.id || tier.code}`">
                        <g fill="#ffffff">
                          <path d="M276.33,178.03l.12-28.66c.11-27.43-17.74-51.69-43.95-59.76L96.14,47.68h-.02s-62.81-19.32-62.81-19.32l.04.08L0,18.22s38.12,20.1,52.99,52.6c5.63,12.14,16.05,21.39,28.78,25.53,89.8,29.18,167.67,51.25,194.56,81.68Z"/>
                          <path d="M250.78,169.67c-11.81-9.48-14.62-10.26-33.74-17.42,6.3,8.29,10.73,22.25,12.32,50.48l-67.09-21.36-14.66-38.05c-3.26-8.46-10.28-14.91-18.99-17.44l-56.95-16.53,77.75,164.12c6.15,15.02,35.98,40.23,75.09,69.43l-38.93-101.04,91.74,28.66v-51.96c0-19.73-4.48-31.17-26.53-48.88Z"/>
                          <path d="M342.11,285.66l9.67-133.41c-5.99,2.95-17.08,9.2-34.85,19.78-22.45,16.52-25.12,23.34-25.12,40.53v176.24l90.35-71.64c20.35-16.14,36.43-37.01,46.84-60.81l13.05-29.83c-23.1,6.44-44.97,12.76-59.36,18.3-6.41,15.34-15.76,28.47-40.58,40.83Z"/>
                          <path d="M496.26,42.04l-152.92,46.76c-30.74,9.4-51.6,37.95-51.22,70.1l.24,20.19c24.13-25.38,71.02-47.8,150.99-65.91l-25.39,57,53.54-16.33c3.26-.99,5.96-3.31,7.43-6.39l31.15-65.29c22.5-47.16,51.42-60.54,51.42-60.54l-65.24,20.42Z"/>
                          <path d="M122.54,25.42s123.47,46.95,150.82,56.02c4.49,1.49,9.33,1.54,13.86.16l144.9-54.68C341.87-7.27,217.78-10.11,122.54,25.42Z"/>
                        </g>
                      </mask>
                      <linearGradient :id="`shine-gradient-${tier.id || tier.code}`" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
                        <stop offset="35%" stop-color="#ffffff" stop-opacity="0.08" />
                        <stop offset="50%" stop-color="#ffffff" stop-opacity="0.6" />
                        <stop offset="65%" stop-color="#ffffff" stop-opacity="0.08" />
                        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
                      </linearGradient>
                    </defs>

                    <!-- Base subtle watermark -->
                    <g fill="#ffffff" opacity="0.12">
                      <path d="M276.33,178.03l.12-28.66c.11-27.43-17.74-51.69-43.95-59.76L96.14,47.68h-.02s-62.81-19.32-62.81-19.32l.04.08L0,18.22s38.12,20.1,52.99,52.6c5.63,12.14,16.05,21.39,28.78,25.53,89.8,29.18,167.67,51.25,194.56,81.68Z"/>
                      <path d="M250.78,169.67c-11.81-9.48-14.62-10.26-33.74-17.42,6.3,8.29,10.73,22.25,12.32,50.48l-67.09-21.36-14.66-38.05c-3.26-8.46-10.28-14.91-18.99-17.44l-56.95-16.53,77.75,164.12c6.15,15.02,35.98,40.23,75.09,69.43l-38.93-101.04,91.74,28.66v-51.96c0-19.73-4.48-31.17-26.53-48.88Z"/>
                      <path d="M342.11,285.66l9.67-133.41c-5.99,2.95-17.08,9.2-34.85,19.78-22.45,16.52-25.12,23.34-25.12,40.53v176.24l90.35-71.64c20.35-16.14,36.43-37.01,46.84-60.81l13.05-29.83c-23.1,6.44-44.97,12.76-59.36,18.3-6.41,15.34-15.76,28.47-40.58,40.83Z"/>
                      <path d="M496.26,42.04l-152.92,46.76c-30.74,9.4-51.6,37.95-51.22,70.1l.24,20.19c24.13-25.38,71.02-47.8,150.99-65.91l-25.39,57,53.54-16.33c3.26-.99,5.96-3.31,7.43-6.39l31.15-65.29c22.5-47.16,51.42-60.54,51.42-60.54l-65.24,20.42Z"/>
                      <path d="M122.54,25.42s123.47,46.95,150.82,56.02c4.49,1.49,9.33,1.54,13.86.16l144.9-54.68C341.87-7.27,217.78-10.11,122.54,25.42Z"/>
                    </g>

                    <!-- Shine effect strictly masked to the logo paths -->
                    <g :mask="`url(#tier-logo-mask-${tier.id || tier.code})`">
                      <rect
                        x="-350"
                        y="-200"
                        width="350"
                        height="800"
                      
                        class="svg-shine-rect"
                      />
                    </g>
                  </svg>
                </div>

                <!-- Current Badge -->
                <div v-if="store.summary.current_tier?.code === tier.code" class="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20">
                  <span class="px-2.5 py-0.5 text-3xs font-bold uppercase rounded-full bg-black/40 text-white border border-white/30 backdrop-blur-md shadow-sm">
                    Current
                  </span>
                </div>

                <!-- Content Container with Spacious Padding -->
                <div class="relative z-10 p-4 sm:p-5 flex flex-col h-full justify-between gap-3.5">
                  <!-- Top Block: Stage, Title, Code Pill -->
                  <div class="space-y-2">
                    <div class="flex items-start justify-between">
                      <div class="flex flex-col gap-0.5">
                        <span class="text-3xs font-bold uppercase tracking-widest text-white/70 font-mono">
                          Stage #{{ tier.sort_order ?? (idx + 1) }}
                        </span>
                        <div class="flex items-center gap-1.5">
                          <h3 class="text-lg sm:text-xl font-bold text-white leading-tight tracking-tight">
                            {{ tier.name }}
                          </h3>
                          <span
                            v-if="tier.is_active === false"
                            class="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-red-500/20 border border-red-500/30 text-red-200 backdrop-blur-sm"
                          >
                            Inactive
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Code Pill -->
                    <div class="inline-flex items-center gap-1.5 w-fit px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 shadow-inner">
                      <div class="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                      <span class="text-2xs font-mono font-bold text-white uppercase tracking-wider">
                        {{ tier.code }}
                      </span>
                    </div>
                  </div>

                  <!-- Middle Block: Points Required -->
                  <div class="flex flex-col gap-0.5 py-0.5">
                    <span class="text-3xs font-bold text-white/70 uppercase tracking-wider">
                      Points Required
                    </span>
                    <div class="flex items-baseline gap-1 flex-nowrap whitespace-nowrap">
                      <span class="text-sm sm:text-base font-extrabold text-white tracking-tight font-mono whitespace-nowrap">
                        {{ Number(tier.min_points ?? 0).toLocaleString() }}
                      </span>
                      <span class="text-[11px] font-medium text-white/70">to</span>
                      <span
                        v-if="tier.max_points !== null && tier.max_points !== undefined"
                        class="text-sm sm:text-base font-extrabold text-white tracking-tight font-mono whitespace-nowrap"
                      >
                        {{ Number(tier.max_points).toLocaleString() }}
                      </span>
                      <span
                        v-else
                        class="text-xl font-normal text-white leading-none inline-flex items-center"
                        title="No upper limit"
                      >
                        &infin;
                      </span>
                      <span class="text-2xs font-bold text-white/80 tracking-wider uppercase ml-0.5">
                        PTS
                      </span>
                    </div>
                  </div>

                  <!-- Bottom Block: Metrics Row (2 columns: Multiplier & Cash Value) -->
                  <div class="grid grid-cols-2 gap-2 pt-3 border-t border-white/20">
                    <!-- Multiplier -->
                    <div class="flex flex-col min-w-0">
                      <span class="text-[8px] sm:text-3xs font-bold text-white/70 uppercase tracking-wide leading-tight">
                        Multiplier
                      </span>
                      <span class="text-xs sm:text-sm font-bold text-white font-mono mt-0.5 whitespace-nowrap">
                        {{ Number(tier.point_multiplier ?? tier.multiplier ?? 1).toFixed(4) }}&times;
                      </span>
                    </div>

                    <!-- Cash Value -->
                    <div class="flex flex-col min-w-0">
                      <span class="text-[8px] sm:text-3xs font-bold text-white/70 uppercase tracking-wide leading-tight">
                        Cash Value
                      </span>
                      <div class="flex items-baseline gap-0.5 mt-0.5 whitespace-nowrap">
                        <span class="text-xs sm:text-sm font-bold text-white font-mono">
                          ${{ Number(tier.cash_conversion_rate || 0.01).toFixed(6) }}
                        </span>
                        <span class="text-[8px] text-white/60 font-medium">/pt</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tier Benefits Comparison Table using DataTable Component -->
            <div class="space-y-3">
              <div class="flex items-center justify-between px-1">
                <div>
                  <h3 class="text-sm font-bold text-primary-text">Programme Snapshot & Tier Perks</h3>
                  <p class="text-xs text-secondary-text">Compare stages, points multipliers, and redemption rates</p>
                </div>
              </div>

              <DataTable
                :columns="tierTableColumns"
                :rows="tierTableRows"
                :loading="store.isTiersLoading"
                row-key="id"
                empty-text="No tier information available"
              >
                <!-- Feature column cell -->
                <template #cell-feature="{ row }">
                  <span class="text-secondary-text font-medium">{{ row.feature }}</span>
                </template>

                <!-- Dynamic Tier Headers with "Current" Badge -->
                <template
                  v-for="tier in effectiveTiers"
                  :key="`hdr-${tier.id || tier.code}`"
                  #[`header-tier_${tier.id||tier.code}`]="{ col }"
                >
                  <div class="flex items-center gap-1.5 py-0.5">
                    <span class="font-bold text-primary-text">{{ col.label }}</span>
                    <BaseBadge
                      v-if="store.tiersData?.current_tier_id === tier.id || store.summary?.current_tier?.code === tier.code"
                      value="Current"
                      variant="primary"
                      size="2xs"
                    />
                  </div>
                </template>

                <!-- Dynamic Tier Cells -->
                <template
                  v-for="tier in effectiveTiers"
                  :key="`cell-${tier.id || tier.code}`"
                  #[`cell-tier_${tier.id||tier.code}`]="{ row, value }"
                >
                  <span
                    v-if="value === 'Included'"
                    class="text-emerald-400 font-bold inline-flex items-center gap-1"
                  >
                    <Check class="w-3.5 h-3.5" /> Included
                  </span>
                  <span v-else-if="value === '-'" class="text-secondary-text">-</span>
                  <span
                    v-else-if="row.id === 'mult'"
                    class="font-mono font-bold text-primary-text"
                  >
                    {{ value }}
                  </span>
                  <span
                    v-else-if="row.id === 'req' || row.id === 'cash_rate'"
                    class="font-mono text-primary-text"
                  >
                    {{ value }}
                  </span>
                  <span v-else class="text-primary-text font-medium">
                    {{ value }}
                  </span>
                </template>
              </DataTable>
            </div>
          </div>
        </div>

      </div>
    </div>


    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- TAB: LOYALTY TRANSACTIONS HISTORY (GLOBAL / CROSS-PROGRAM)          -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'transactions'" class="space-y-6 animate-in fade-in duration-200">
      <!-- Points On Hold Warning Banner if hold is active -->
      <div
        v-if="store.summary.points_on_hold"
        class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3 shadow-xs"
      >
        <AlertCircle class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div class="space-y-0.5">
          <h4 class="font-bold text-amber-300 text-sm">Points On Hold</h4>
          <p class="text-amber-200/80 leading-relaxed">
            Your loyalty points are currently on temporary hold. Points history is visible below, but points conversions and item redemptions are paused.
          </p>
        </div>
      </div>

      <!-- Central Wallet Mini-Stats Strip -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Available Points -->
        <div class="p-4 rounded-2xl bg-card-background border border-primary-border/40 flex items-center gap-4 relative overflow-hidden">
          <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Coins class="w-5 h-5 text-primary" />
          </div>
          <div class="min-w-0">
            <p class="text-2xs uppercase tracking-wider text-secondary-text font-semibold">Available Points</p>
            <p class="text-lg font-bold text-primary-text font-mono truncate">
              {{ Number(store.summary.available_points || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} <span class="text-xs font-normal text-secondary-text">pts</span>
            </p>
          </div>
        </div>

        <!-- Lifetime Earned -->
        <div class="p-4 rounded-2xl bg-card-background border border-primary-border/40 flex items-center gap-4 relative overflow-hidden">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <TrendingUp class="w-5 h-5 text-emerald-400" />
          </div>
          <div class="min-w-0">
            <p class="text-2xs uppercase tracking-wider text-secondary-text font-semibold">Lifetime Earned</p>
            <p class="text-lg font-bold text-emerald-400 font-mono truncate">
              {{ Number(store.summary.lifetime_earned_points || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} <span class="text-xs font-normal text-secondary-text">pts</span>
            </p>
          </div>
        </div>

        <!-- Lifetime Converted / Spent -->
        <div class="p-4 rounded-2xl bg-card-background border border-primary-border/40 flex items-center gap-4 relative overflow-hidden">
          <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Wallet class="w-5 h-5 text-purple-400" />
          </div>
          <div class="min-w-0">
            <p class="text-2xs uppercase tracking-wider text-secondary-text font-semibold">Lifetime Redeemed</p>
            <p class="text-lg font-bold text-primary-text font-mono truncate">
              {{ Number(store.summary.lifetime_redeemed_points || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} <span class="text-xs font-normal text-secondary-text">pts</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card-background p-3.5 rounded-2xl border border-primary-border/40">
        <!-- Entry Type Filter Tabs -->
        <div class="w-full md:w-auto overflow-x-auto no-scrollbar">
          <BaseTabs
            v-model="globalPointsEntryFilter"
            :tabs="transactionEntryTabs"
            active-class="bg-secondary text-white dark:bg-primary/20 dark:text-primary font-bold shadow-xs border border-secondary/20 dark:border-primary/30"
            inactive-class="text-secondary-text hover:text-primary-text"
            over-ride-class="border border-primary-border/20"
            @update:modelValue="onFilterGlobalPointsEntry"
          />
        </div>

        <!-- Right Side: Program Selector + Refresh -->
        <div class="flex items-center gap-2 self-stretch md:self-auto justify-end shrink-0">
          <div class="w-48 sm:w-56">
            <BaseSelect
              :model-value="globalProgramFilter"
              :options="programFilterOptions"
              placeholder="All Programs"
              height="36px"
              rounded="xl"
              @update:model-value="onFilterGlobalProgram"
            />
          </div>

          <RefreshButton
            :loading="store.isPointsLoading"
            title="Refresh Points History"
            bg-class="bg-background border border-primary-border/40 hover:border-primary-border/80"
            @click="refreshGlobalPoints"
          />
        </div>
      </div>

      <!-- Transactions DataTable -->
      <DataTable
        :columns="globalTransactionColumns"
        :rows="store.points"
        :loading="store.isPointsLoading"
        :page="store.pointsPagination.page"
        :total-pages="store.pointsPagination.pages"
        :total-items="store.pointsPagination.total"
        empty-text="No loyalty transactions found"
        empty-subtitle="Your points transactions, earnings, and conversions will appear here."
        @update:page="onGlobalPointsPageChange"
      >
        <!-- Date Column -->
        <template #cell-created_at="{ row }">
          <span class="text-secondary-text whitespace-nowrap text-xs">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <!-- Entry Type Badge -->
        <template #cell-entry_type="{ row }">
          <BaseBadge :value="row.entry_type" size="xs" />
        </template>

        <!-- Program Name -->
        <template #cell-program_id="{ row }">
          <span class="text-primary-text font-medium text-xs">
            {{ getProgramNameById(row.program_id) }}
          </span>
        </template>

        <!-- Trade / Details Context -->
        <template #cell-details="{ row }">
          <div v-if="row.metadata?.symbol || row.symbol" class="text-xs">
            <span class="text-primary-text font-semibold">
              {{ row.metadata?.symbol || row.symbol }}
            </span>
            <span v-if="row.metadata?.lots || row.lots" class="text-secondary-text ml-1">
              ({{ row.metadata?.lots || row.lots }} lots)
            </span>
            <span v-if="row.deal_id" class="text-secondary-text text-2xs font-mono block">
              Deal #{{ row.deal_id }}
            </span>
          </div>
          <div v-else-if="row.description || row.metadata?.description || row.note || row.notes" class="text-xs text-secondary-text max-w-xs truncate">
            {{ row.description || row.metadata?.description || row.note || row.notes }}
          </div>
          <span v-else class="text-secondary-text text-xs">-</span>
        </template>

        <!-- Delta Points -->
        <template #cell-delta="{ row }">
          <span
            class="font-bold font-mono text-xs"
            :class="
              Number(row.delta) > 0
                ? 'text-emerald-400'
                : Number(row.delta) < 0
                ? 'text-red-400'
                : 'text-primary-text'
            "
          >
            {{ Number(row.delta) > 0 ? '+' : '' }}{{ Number(row.delta || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} pts
          </span>
        </template>

        <!-- Balance After -->
        <template #cell-balance_after="{ row }">
          <span class="text-primary-text font-bold font-mono text-xs">
            {{ Number(row.balance_after || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} pts
          </span>
        </template>

        <!-- Lot Points Remaining -->
        <template #cell-lot_points_remaining="{ row }">
          <span class="text-secondary-text text-xs font-mono">
            {{ row.lot_points_remaining !== null && row.lot_points_remaining !== undefined ? `${Number(row.lot_points_remaining).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pts` : '-' }}
          </span>
        </template>

        <!-- Expiry Date -->
        <template #cell-expires_at="{ row }">
          <span class="text-secondary-text text-xs whitespace-nowrap">
            {{ row.expires_at ? formatDate(row.expires_at) : '-' }}
          </span>
        </template>

        <!-- Empty State Slot -->
        <template #empty>
          <div class="py-12 text-center px-4">
            <EmptyState
              title="No transactions found"
              subtitle="Points earned from trades, tier rewards, and wallet transfers will be recorded here."
            >
              <template #icon>
                <Coins class="w-8 h-8 text-secondary-text" />
              </template>
            </EmptyState>
          </div>
        </template>
      </DataTable>
    </div>


    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- TAB 2: REWARDS STORE CATALOGUE                                      -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'store'" class="space-y-6 animate-in fade-in duration-200">
      <!-- Points On Hold Warning Banner (Store Tab) -->
      <div
        v-if="store.summary.points_on_hold"
        class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3 shadow-xs"
      >
        <AlertCircle class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div class="space-y-0.5">
          <h4 class="font-bold text-amber-300 text-sm">Reward Redemptions Paused (Points On Hold)</h4>
          <p class="text-amber-200/80 leading-relaxed">
            Your loyalty points are currently on temporary hold. Reward item redemptions are paused until the hold is resolved.
          </p>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="w-fit max-w-full overflow-x-auto no-scrollbar">
        <BaseTabs
          v-model="storeCategoryFilter"
          :tabs="storeCategories"
        />
      </div>

      <!-- Products Grid Loading Skeleton -->
      <div v-if="store.isStoreProductsLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        <div
          v-for="n in 4"
          :key="n"
          class="bg-card-background rounded-2xl sm:rounded-3xl overflow-hidden animate-pulse flex flex-col justify-between border-0"
        >
          <div class="h-40 sm:h-44 bg-background w-full" />
          <div class="p-4 sm:p-5 space-y-3">
            <div class="h-3 w-16 bg-background rounded-full" />
            <div class="h-4 w-3/4 bg-background rounded-full" />
            <div class="h-3 w-full bg-background rounded-full" />
            <div class="h-10 w-full bg-background rounded-full mt-4" />
          </div>
        </div>
      </div>

      <!-- Store Products Grid -->
      <div
        v-else-if="filteredStoreProducts.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
      >
        <div
          v-for="product in filteredStoreProducts"
          :key="product.id"
          class="bg-card-background rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col justify-between hover:bg-card-background/90 transition-all border-0 group"
        >
          <div>
            <!-- Product Image / Video Media with auto-moving carousel & pause on hover -->
            <div class="relative w-full h-40 sm:h-44 bg-background overflow-hidden flex items-center justify-center">
              <LoyaltyMedia
                :items="product.image_urls && product.image_urls.length > 0 ? product.image_urls : (product.image_url ? [product.image_url] : [])"
                :alt="product.name || product.title"
                :auto-slide="true"
                :pause-on-hover="true"
                :show-controls="true"
                :show-arrows="true"
                :show-dots="true"
                media-class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              <!-- Type Badge -->
              <div class="absolute top-3 left-3 z-10 pointer-events-none">
                <span class="px-2.5 py-1 text-2xs font-bold rounded-full uppercase tracking-wider bg-black/60 text-white backdrop-blur-md">
                  {{ product.product_type || product.type || 'Reward' }}
                </span>
              </div>

              <!-- Stock Status Badge -->
              <div class="absolute top-3 right-3 z-10 pointer-events-none">
                <BaseBadge
                  :value="((product.stock !== null && product.stock !== undefined && product.stock <= 0) || (product.stock_qty !== null && product.stock_qty !== undefined && product.stock_qty <= 0)) ? 'Out of Stock' : (product.stock !== null && product.stock !== undefined ? `${product.stock} in stock` : (product.stock_qty !== null && product.stock_qty !== undefined ? `${product.stock_qty} in stock` : 'In Stock'))"
                  :variant="((product.stock !== null && product.stock !== undefined && product.stock <= 0) || (product.stock_qty !== null && product.stock_qty !== undefined && product.stock_qty <= 0)) ? 'danger' : 'success'"
                  size="xs"
                />
              </div>
            </div>

            <!-- Content Area -->
            <div class="p-4 sm:p-5 space-y-2">
              <h4 class="text-sm font-bold text-primary-text line-clamp-1" :title="product.name || product.title">
                {{ product.name || product.title }}
              </h4>
              <p class="text-xs text-secondary-text line-clamp-2 leading-relaxed min-h-8">
                {{ product.description || 'Exclusive loyalty reward item.' }}
              </p>

              <!-- Points Cost & Cash Equivalent -->
              <div class="pt-3 flex items-baseline justify-between border-t border-primary-border/20">
                <div>
                  <span class="text-sm sm:text-base font-bold text-primary">
                    {{ Number(product.points_required || product.points_cost || 0).toLocaleString() }}
                  </span>
                  <span class="text-xs font-semibold text-secondary-text ml-1">pts</span>
                </div>
                <span v-if="product.cash_value" class="text-xs text-secondary-text font-medium">
                  ~${{ Number(product.cash_value).toFixed(2) }} USD
                </span>
              </div>
            </div>
          </div>

          <!-- Bottom Action Area -->
          <div class="p-4 sm:p-5 pt-0">
            <!-- 1. If points are on hold and product is available, show disabled Points On Hold button -->
            <button
              v-if="store.summary.points_on_hold && product.available"
              type="button"
              disabled
              class="w-full inline-flex items-center justify-center gap-1.5 h-10 px-4 text-xs font-bold rounded-full bg-amber-500/10 text-amber-400 cursor-not-allowed border border-amber-500/20 select-none"
            >
              <AlertCircle class="w-3.5 h-3.5" />
              <span>Points On Hold</span>
            </button>
            <!-- 2. If available is true, user can redeem this reward -->
            <button
              v-else-if="product.available"
              type="button"
              @click="openStoreRedeemModal(product)"
              class="w-full inline-flex items-center justify-center gap-1.5 h-10 px-4 text-xs font-bold rounded-full transition-all cursor-pointer bg-button text-button-text hover:opacity-90 shadow-sm"
            >
              <ShoppingBag class="w-3.5 h-3.5" />
              <span>Redeem</span>
            </button>
            <!-- 3. If available is false and program_id is not null, show Join Program button -->
            <button
              v-else-if="product.program_id !== null && product.program_id !== undefined"
              type="button"
              @click="handleJoinProgramFromStore(product.program_id)"
              class="w-full inline-flex items-center justify-center gap-1.5 h-10 px-4 text-xs font-bold rounded-full transition-all cursor-pointer bg-button text-button-text hover:opacity-90 shadow-sm"
            >
              <PlusCircle class="w-3.5 h-3.5" />
              <span>Join Program</span>
            </button>
            <!-- 4. Otherwise (available: false and program_id is null), show Not Available -->
            <button
              v-else
              type="button"
              disabled
              class="w-full inline-flex items-center justify-center gap-1.5 h-10 px-4 text-xs font-bold rounded-full bg-white/5 text-secondary-text/50 cursor-not-allowed border border-white/5 select-none"
            >
              <Info class="w-3.5 h-3.5" />
              <span>Not Available</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="py-12 bg-card-background rounded-2xl sm:rounded-3xl border-0">
        <EmptyState
          title="No store rewards available"
          subtitle="Check back soon! New exclusive merchandise and vouchers are added regularly."
        >
          <template #icon>
            <ShoppingBag class="w-6 h-6 text-secondary-text" />
          </template>
        </EmptyState>
      </div>

      <!-- Store Pagination -->
      <div v-if="store.storeProductsPagination.total_pages > 1 || store.storeProductsPagination.pages > 1" class="py-3 px-4">
        <Pagination
          :pagination="store.storeProductsPagination"
          @change="onStoreProductsPageChange"
        />
      </div>
    </div>


    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- TAB 3: STORE ORDERS / REDEMPTIONS TRACKING                         -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'store_orders'" class="space-y-6 animate-in fade-in duration-200">
      <DataTable
        :columns="storeOrderColumns"
        :rows="store.storeRedemptions"
        :loading="store.isStoreRedemptionsLoading"
        :page="store.storeRedemptionsPagination.page"
        :total-pages="store.storeRedemptionsPagination.pages"
        :total-items="store.storeRedemptionsPagination.total"
        empty-text="No store orders found"
        empty-subtitle="When you redeem store merchandise or gift vouchers, your order tracking will appear here."
        @update:page="onStoreRedemptionsPageChange"
      >
        <template #cell-id="{ row }">
          <div>
            <span class="font-bold text-primary-text">#ORD-{{ row.id }}</span>
            <div class="text-[11px] text-secondary-text">{{ formatDate(row.created_at || row.requested_at) }}</div>
          </div>
        </template>

        <template #cell-title="{ row }">
          <span class="font-bold text-primary-text">
            {{ row.item_snapshot?.title || row.item_snapshot?.name || 'Reward Item' }}
          </span>
        </template>

        <template #cell-type="{ row }">
          <BaseBadge :value="row.reward_type || row.item_snapshot?.type || 'Store'" variant="neutral" size="xs" />
        </template>

        <template #cell-points="{ row }">
          <span class="font-bold text-primary-text">
            {{ Number(row.points || row.points_requested || 0).toLocaleString() }} pts
          </span>
        </template>

        <template #cell-cash_value="{ row }">
          <span class="font-bold text-primary">
            ${{ Number(row.cash_value_snapshot || row.cash_amount || 0).toFixed(2) }} USD
          </span>
        </template>

        <template #cell-status="{ row }">
          <BaseBadge :value="row.status" size="xs" />
        </template>

        <template #cell-notes="{ row }">
          <span class="text-secondary-text max-w-xs truncate block" :title="row.admin_note || row.rejection_reason || ''">
            {{ row.admin_note || row.rejection_reason || (row.shipping_snapshot?.address ? `${row.shipping_snapshot.city || ''}, ${row.shipping_snapshot.country || ''}` : '-') }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end">
            <button
              type="button"
              @click="openOrderDetailDrawer(row)"
              class="inline-flex items-center gap-1.5 h-7 px-3 text-[11px] font-semibold rounded-full bg-white/5 hover:bg-white/10 text-primary-text hover:text-primary transition-all cursor-pointer border border-primary-border/20 shadow-2xs"
              title="View Order Details"
            >
              <Eye class="w-3 h-3" />
              <span>Details</span>
            </button>
          </div>
        </template>

        <template #empty>
          <div class="py-8 text-center px-4">
            <EmptyState
              title="No store orders found"
              subtitle="When you redeem store merchandise or gift vouchers, your order tracking will appear here."
            >
              <template #icon>
                <Package class="w-6 h-6 text-secondary-text" />
              </template>
            </EmptyState>
          </div>
        </template>
      </DataTable>
    </div>


    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- DIALOGS & MODALS                                                    -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <!-- Instant Points to Trading Account Transfer Modal -->
    <LoyaltyWithdrawModal
      :open="isWithdrawModalOpen"
      :program-id="store.selectedProgramId || store.summary?.program_id"
      @close="closeWithdrawModal"
    />

    <!-- Join / Enroll Program Dialog -->
    <LoyaltyEnrollModal
      :open="isEnrollModalOpen"
      :program="programToEnroll || store.selectedProgram"
      @close="closeEnrollModal"
      @enrolled="() => store.fetchAllForSelectedProgram(true)"
    />

    <!-- Leave / De-enroll Program Dialog -->
    <LoyaltyLeaveModal
      :open="isLeaveModalOpen"
      :program="store.selectedProgram"
      @close="closeLeaveModal"
      @left="() => store.fetchAllForSelectedProgram(true)"
    />

    <!-- Store Reward Item Redemption Dialog -->
    <LoyaltyStoreRedeemModal
      :open="isStoreRedeemModalOpen"
      :product="selectedProductForRedeem"
      @close="closeStoreRedeemModal"
      @redeemed="() => store.fetchAllForSelectedProgram(true)"
    />

    <!-- Store Order Details Slide-over Side Drawer -->
    <LoyaltyStoreOrderDetailDrawer
      :open="isOrderDetailDrawerOpen"
      :order="selectedOrderForDetail"
      @close="closeOrderDetailDrawer"
    />

  </div>
</template>

<style scoped>
@keyframes logoShine {
  0% {
    transform: translateX(-400px) rotate(25deg);
  }
  45%, 100% {
    transform: translateX(950px) rotate(25deg);
  }
}

.svg-shine-rect {
  animation: logoShine 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  transform-origin: center;
}
</style>
