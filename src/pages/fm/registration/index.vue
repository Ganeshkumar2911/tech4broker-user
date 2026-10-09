<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Info,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Clock,
  RefreshCw,
  ShieldCheck,
} from 'lucide-vue-next'
import { useProfileStore } from '@/stores/shared/profile'
import { useSnackbarStore } from '@/stores/shared/snackbar'
import { useThemeStore } from '@/stores/shared/theme'
import { useTourStore } from '@/stores/shared/tour'
import authToken from '@/common/authToken'

import ThemeTogglePill from '@/components/common/ThemeTogglePill.vue'
import TopBarNotifications from '@/components/common/notifications/TopBarNotifications.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'

const router = useRouter()
const profileStore = useProfileStore()
const snackbar = useSnackbarStore()
const themeStore = useThemeStore()

// ─── Status & Loading States ────────────────────────────
const isInitialLoading = ref(true)
const isRefreshingProfile = ref(false)
const isSubmitted = ref(false)

const isFetchingGroups = ref(false)
const isSubmitting = ref(false)
const groupsError = ref(null)

const hasData = (value) => {
  if (!value) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

const fmStatus = computed(() => {
  const { fm_info, fm_request } = profileStore.user || {}
  const hasFmInfo = hasData(fm_info)
  const hasFmReq = hasData(fm_request) || isSubmitted.value

  if (hasFmInfo || fm_request?.status === 'approved') return 'approved'
  if (fm_request?.status === 'rejected') return 'rejected'
  if (hasFmReq) return 'pending'
  return 'incomplete'
})

const handleRefreshStatus = async () => {
  isRefreshingProfile.value = true
  try {
    await profileStore.fetchUserProfile(true)
    snackbar.show('Profile status refreshed!', 'success')
  } catch (err) {
    console.error('Failed to refresh profile:', err)
  } finally {
    isRefreshingProfile.value = false
  }
}

const allSubmittedDetails = computed(() => {
  const req = profileStore.user?.fm_request || {}
  const source = Object.keys(req).length > 0 ? req : form

  const category = source.broker_group || source.account_category || form.account_category
  const currency = source.broker_currency || selectedCategoryCurrency.value || 'USD'
  const leverage = source.broker_leverage || (source.leverage ? (String(source.leverage).includes(':') ? source.leverage : `1:${source.leverage}`) : '1:100')
  const settlement = source.settlement_type
  const mgmtFee = source.management_fee !== '' && source.management_fee !== null && source.management_fee !== undefined ? `${source.management_fee}%` : null
  const mgmtInterval = source.management_fee_interval
  const regFee = source.registration_fee !== '' && source.registration_fee !== null && source.registration_fee !== undefined ? `${currency} ${source.registration_fee}` : null
  const visibility = source.visibility_type
  const minCap = source.min_capital !== '' && source.min_capital !== null && source.min_capital !== undefined ? `${currency} ${source.min_capital}` : null
  const perfFee = source.performance_fee !== '' && source.performance_fee !== null && source.performance_fee !== undefined ? `${source.performance_fee}%` : null
  const fmShareVal = source.fm_share !== '' && source.fm_share !== null && source.fm_share !== undefined ? `${source.fm_share}%` : null
  const brokerShareVal = source.broker_share !== '' && source.broker_share !== null && source.broker_share !== undefined ? `${source.broker_share}%` : null

  const items = [
    { label: 'Account Category', value: category },
    { label: 'Currency', value: currency },
    { label: 'Leverage', value: leverage },
    { label: 'Settlement Type', value: settlement ? (String(settlement).charAt(0).toUpperCase() + String(settlement).slice(1)) : null },
    { label: 'Management Fee', value: mgmtFee },
    { label: 'Management Interval', value: mgmtInterval ? (String(mgmtInterval).charAt(0).toUpperCase() + String(mgmtInterval).slice(1)) : null },
    { label: 'Registration Fee', value: regFee },
    { label: 'Visibility Type', value: visibility ? (String(visibility).charAt(0).toUpperCase() + String(visibility).slice(1)) : null },
    { label: 'Minimum Capital', value: minCap },
    { label: 'Performance Fee', value: perfFee },
    { label: 'FM Share', value: fmShareVal },
    { label: 'Broker Share', value: brokerShareVal },
  ]

  if (req && typeof req === 'object') {
    const knownKeys = [
      'broker_group', 'account_category', 'broker_currency', 'broker_leverage', 'leverage',
      'settlement_type', 'management_fee', 'management_fee_interval',
      'registration_fee', 'visibility_type', 'min_capital', 'performance_fee',
      'fm_share', 'broker_share', 'created_at', 'updated_at', 'status', 'id', 'user_id', 'broker_group_id'
    ]
    Object.entries(req).forEach(([k, v]) => {
      if (!knownKeys.includes(k) && v !== null && v !== undefined && v !== '') {
        items.push({
          label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          value: String(v)
        })
      }
    })
  }

  return items.filter((item) => item.value !== null && item.value !== undefined && item.value !== '')
})

// ─── Logo & Theme ─────────────────────────────────────────
const logoSrc = computed(() => {
  return themeStore.isDark ? '/logo_full-light.svg' : '/logo_full-dark.png'
})

const isDark = computed(() => themeStore.isDark)

function toggleDark(event) {
  themeStore.toggleTheme(event)
}

// ─── User Profile & Avatar ───────────────────────────────
const avatarLetter = computed(() => {
  if (profileStore.user?.name) {
    return profileStore.user.name.charAt(0).toUpperCase()
  }
  return 'F'
})

const displayName = computed(() => {
  return profileStore.user?.name || 'Fund Manager'
})

const handleLogout = () => {
  try {
    useTourStore().stopTour()
  } catch (e) {}
  authToken.removeToken()
  localStorage.removeItem('role')
  sessionStorage.clear()
  profileStore.reset()
  router.push({ name: 'login' }).then(() => {
    window.location.reload()
  })
}

// ─── Collapsible Sections State ──────────────────────────
const openSections = reactive({
  setup: true,
  fees: false,
  access: false,
  profit: false,
})

const completedSections = reactive({
  setup: false,
  fees: false,
  access: false,
  profit: false,
})

const toggleSection = (sectionKey) => {
  openSections[sectionKey] = !openSections[sectionKey]
}

// ─── Form Fields ─────────────────────────────────────────
const form = reactive({
  // Section 1: Fund Manager Setup
  account_category: '',
  selected_group_config: null,
  settlement_type: '',
  follower_account_type: 1,

  // Section 2: Management Fees
  management_fee: '',
  management_fee_unit: '%',
  management_fee_interval: '',
  registration_fee: '',
  registration_fee_unit: 'USD',

  // Section 3: Fund Access & Limits
  visibility_type: '',
  min_capital: '',
  min_capital_unit: 'USD',

  // Section 4: Profit Sharing
  performance_fee: '',
  performance_fee_unit: '%',
  fm_share: '',
  fm_share_unit: '%',
  broker_share: '',
  broker_share_unit: '%',
})

// ─── Field Errors ────────────────────────────────────────
const errors = reactive({
  account_category: '',
  settlement_type: '',
  management_fee: '',
  management_fee_interval: '',
  registration_fee: '',
  visibility_type: '',
  min_capital: '',
  performance_fee: '',
  fm_share: '',
  broker_share: '',
})

const clearError = (field) => {
  errors[field] = ''
}

// ─── Group / Account Category Data ───────────────────────
const rawGroupsData = ref({ demo: [], live: [] })

const categoryOptions = computed(() => {
  const data = rawGroupsData.value
  let rows = []
  if (Array.isArray(data)) {
    rows = data
  } else if (data && typeof data === 'object') {
    rows = data.live || []
  }

  const options = []

  rows.forEach((row) => {
    const categoryName = (row.account_category || row.group || 'Category').toUpperCase()
    const badgeName = row.badge || row.label || ''

    if (row?.currencies && Array.isArray(row.currencies)) {
      row.currencies.forEach((c) => {
        const curr = c.currency || 'USD'
        const rawLev = c.leverage ?? row.leverage ?? ''
        const lev = rawLev !== '' && rawLev !== null ? (String(rawLev).includes(':') ? rawLev : `1:${rawLev}`) : ''
        const levText = lev ? ` | Leverage: ${lev}` : ''
        const displayLabel = badgeName
          ? `${categoryName} - ${badgeName} (${curr}${levText})`
          : `${categoryName} (${curr}${levText})`

        options.push({
          label: displayLabel,
          value: c.group_config_id || c.mt5_group || row.account_category,
          group_config_id: c.group_config_id || null,
          mt5_group: c.mt5_group || row.account_category || '',
          currency: c.currency || 'USD',
          leverage: c.leverage || row.leverage || '1:100',
          account_category: categoryName,
          badge: badgeName,
        })
      })
    } else {
      const currency = row?.currency?.[0] ?? row?.currency ?? 'USD'
      const groupConfigId = row?.group_config_id ?? row?.id ?? null
      const rawLev = row.leverage ?? ''
      const lev = rawLev !== '' && rawLev !== null ? (String(rawLev).includes(':') ? rawLev : `1:${rawLev}`) : ''
      const levText = lev ? ` | Leverage: ${lev}` : ''
      const displayLabel = badgeName
        ? `${categoryName} - ${badgeName} (${currency}${levText})`
        : `${categoryName} (${currency}${levText})`

      options.push({
        label: displayLabel,
        value: groupConfigId || categoryName,
        group_config_id: groupConfigId,
        mt5_group: row.mt5_group || categoryName,
        currency: currency,
        leverage: row.leverage || '1:100',
        account_category: categoryName,
        badge: badgeName,
      })
    }
  })

  // Fallback options if backend returns empty rows
  if (options.length === 0) {
    return [
      {
        label: '18064421 - € 1.00 US... P Cent',
        value: 'default_cent',
        group_config_id: 1,
        mt5_group: 'real\\cent_group',
        currency: 'USD',
        leverage: '1:500',
        account_category: 'P Cent',
      },
      {
        label: '18064422 - $ 1.00 Standard',
        value: 'default_standard',
        group_config_id: 2,
        mt5_group: 'real\\standard_group',
        currency: 'USD',
        leverage: '1:200',
        account_category: 'Standard',
      },
    ]
  }

  return options
})

const selectedCategoryCurrency = computed(() => {
  if (!form.account_category) return 'USD'
  const opt = categoryOptions.value.find((o) => o.value === form.account_category)
  return opt?.currency || 'USD'
})

watch(selectedCategoryCurrency, (newCurrency) => {
  if (newCurrency) {
    form.registration_fee_unit = newCurrency
    form.min_capital_unit = newCurrency
  }
}, { immediate: true })

const fetchGroupDetails = async () => {
  isFetchingGroups.value = true
  groupsError.value = null
  try {
    const res = await profileStore.fetchFmGroupDetails()
    rawGroupsData.value = res?.data ?? { demo: [], live: [] }
  } catch (err) {
    console.error('Failed to load group details:', err)
    groupsError.value = 'Failed to load account categories.'
  } finally {
    isFetchingGroups.value = false
  }
}

// ─── Options Lists ───────────────────────────────────────
const followerAccountTypeOptions = [
  { label: "Copy trading only (default)", value: 1 },
  { label: "Real account only", value: 2 },
  { label: "Both options", value: 3 },
]

const settlementOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

const intervalOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
]

const visibilityOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
]

const percentUnitOption = [{ label: 'in %', value: '%' }]
const usdUnitOption = [{ label: 'In USD', value: 'USD' }]

// ─── Share Auto-Sync Logic ───────────────────────────────
let syncingShare = false

watch(
  () => form.fm_share,
  (val) => {
    if (syncingShare) return
    const n = parseFloat(val)
    if (!isNaN(n)) {
      if (n > 100) {
        errors.fm_share = 'FM Share cannot exceed 100%'
      } else if (n < 0) {
        errors.fm_share = 'FM Share cannot be negative'
      } else {
        syncingShare = true
        form.broker_share = (100 - n).toFixed(2)
        syncingShare = false
        clearError('fm_share')
        clearError('broker_share')
      }
    }
  }
)

watch(
  () => form.broker_share,
  (val) => {
    if (syncingShare) return
    const n = parseFloat(val)
    if (!isNaN(n)) {
      if (n > 100) {
        errors.broker_share = 'Broker Share cannot exceed 100%'
      } else if (n < 0) {
        errors.broker_share = 'Broker Share cannot be negative'
      } else {
        syncingShare = true
        form.fm_share = (100 - n).toFixed(2)
        syncingShare = false
        clearError('fm_share')
        clearError('broker_share')
      }
    }
  }
)

// ─── Section Validations ─────────────────────────────────
const validateSection1 = () => {
  let valid = true
  if (!form.account_category) {
    errors.account_category = 'Account category is required'
    valid = false
  }
  if (!form.settlement_type) {
    errors.settlement_type = 'Settlement type is required'
    valid = false
  }
  return valid
}

const validateSection2 = () => {
  let valid = true
  const mf = parseFloat(form.management_fee)
  if (form.management_fee === '' || isNaN(mf)) {
    errors.management_fee = 'Management fee is required'
    valid = false
  } else if (mf < 0) {
    errors.management_fee = 'Must be non-negative'
    valid = false
  }

  if (!form.management_fee_interval) {
    errors.management_fee_interval = 'Interval is required'
    valid = false
  }

  const rf = parseFloat(form.registration_fee)
  if (form.registration_fee === '' || isNaN(rf)) {
    errors.registration_fee = 'Registration fee is required'
    valid = false
  } else if (rf < 0) {
    errors.registration_fee = 'Must be non-negative'
    valid = false
  }
  return valid
}

const validateSection3 = () => {
  let valid = true
  if (!form.visibility_type) {
    errors.visibility_type = 'Visibility type is required'
    valid = false
  }

  const mc = parseFloat(form.min_capital)
  if (form.min_capital === '' || isNaN(mc)) {
    errors.min_capital = 'Minimum capital is required'
    valid = false
  } else if (mc < 0) {
    errors.min_capital = 'Must be positive'
    valid = false
  }
  return valid
}

const validateSection4 = () => {
  let valid = true
  const pf = parseFloat(form.performance_fee)
  if (form.performance_fee === '' || isNaN(pf)) {
    errors.performance_fee = 'Performance fee is required'
    valid = false
  } else if (pf < 0 || pf > 50) {
    errors.performance_fee = 'Must be between 0% and 50%'
    valid = false
  }

  const fs = parseFloat(form.fm_share)
  if (form.fm_share === '' || isNaN(fs)) {
    errors.fm_share = 'FM Share is required'
    valid = false
  } else if (fs < 0 || fs > 100) {
    errors.fm_share = 'FM Share must be between 0% and 100%'
    valid = false
  }

  const bs = parseFloat(form.broker_share)
  if (form.broker_share === '' || isNaN(bs)) {
    errors.broker_share = 'Broker Share is required'
    valid = false
  } else if (bs < 0 || bs > 100) {
    errors.broker_share = 'Broker Share must be between 0% and 100%'
    valid = false
  }

  if (valid && Math.abs(fs + bs - 100) > 0.01) {
    errors.fm_share = 'FM Share + Broker Share must equal 100%'
    valid = false
  }

  return valid
}

// ─── Section Submit Handlers ─────────────────────────────
const submitSection1 = () => {
  if (!validateSection1()) return
  completedSections.setup = true
  openSections.setup = false
  openSections.fees = true
}

const submitSection2 = () => {
  if (!validateSection2()) return
  completedSections.fees = true
  openSections.fees = false
  openSections.access = true
}

const submitSection3 = () => {
  if (!validateSection3()) return
  completedSections.access = true
  openSections.access = false
  openSections.profit = true
}

const submitFinalRegistration = async () => {
  const v1 = validateSection1()
  const v2 = validateSection2()
  const v3 = validateSection3()
  const v4 = validateSection4()

  if (!v1) {
    openSections.setup = true
    return
  }
  if (!v2) {
    openSections.fees = true
    return
  }
  if (!v3) {
    openSections.access = true
    return
  }
  if (!v4) {
    openSections.profit = true
    return
  }

  completedSections.profit = true
  isSubmitting.value = true

  // Find selected category object
  const selectedOpt = categoryOptions.value.find((o) => o.value === form.account_category) || {}

  const payload = {
    performance_fee: parseFloat(form.performance_fee),
    management_fee: parseFloat(form.management_fee),
    management_fee_interval: form.management_fee_interval,
    settlement_type: form.settlement_type,
    follower_account_type: Number(form.follower_account_type || 1),
    registration_fee: parseFloat(form.registration_fee),
    visibility_type: form.visibility_type,
    fm_share: parseFloat(form.fm_share),
    broker_share: parseFloat(form.broker_share),
    min_capital: parseFloat(form.min_capital),
    broker_group: selectedOpt.mt5_group || form.account_category,
    broker_group_id: selectedOpt.group_config_id || null,
    broker_currency: selectedOpt.currency || 'USD',
    broker_leverage: selectedOpt.leverage || '1:100',
  }

  try {
    await profileStore.submitFmRequest(payload)
    snackbar.show('FM registration request submitted successfully!', 'success')
    isSubmitted.value = true
    await profileStore.fetchUserProfile(true)
  } catch (err) {
    console.error('FM Registration Submission Error:', err)
    snackbar.show(err?.message || err?.error || 'Failed to submit registration.', 'error')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  themeStore.init()
  isInitialLoading.value = true
  try {
    await profileStore.fetchUserProfile(true)
  } catch (err) {
    console.error('Failed to fetch user profile:', err)
  } finally {
    isInitialLoading.value = false
  }
  fetchGroupDetails()
})
</script>

<template>
  <div class="min-h-screen bg-background text-primary-text flex flex-col font-sans">

    <!-- Standalone Top Header Bar (NO SIDEBAR) -->
    <header class="h-[60px] bg-card-background border-b border-primary-border px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-none">
      <!-- Left Logo -->
      <div class="flex items-center gap-3">
        <img :src="logoSrc" alt="Panther Capitals" class="h-8 sm:h-9 object-contain" />
      </div>

      <!-- Right Action Controls -->
      <div class="flex items-center gap-3">
        <TopBarNotifications />
        <ThemeTogglePill :is-dark="isDark" @toggle="toggleDark" />

        <!-- User Profile Avatar & Logout -->
        <div
          class="flex items-center gap-2.5 pl-2 border-l border-primary-border"
        >
          <div
            class="w-8 h-8 rounded-full bg-card-background border border-primary-border text-primary flex items-center justify-center select-none"
          >
            <span class="text-xs font-bold">{{ avatarLetter }}</span>
          </div>
          <span class="hidden sm:block text-xs font-semibold text-primary-text">
            {{ displayName }}
          </span>
          <button
            type="button"
            @click="handleLogout"
            class="p-1.5 rounded-full text-secondary-text cursor-pointer ml-1"
            title="Logout"
          >
            <LogOut :size="16" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Body -->
    <main class="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col items-center">

      <!-- 1. Initial Loading State -->
      <div v-if="isInitialLoading" class="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 class="w-10 h-10 text-primary animate-spin" />
        <p class="text-xs text-secondary-text font-medium">Checking registration status...</p>
      </div>

      <!-- 2. PENDING APPROVAL SCREEN -->
      <div v-else-if="fmStatus === 'pending'" class="max-w-[720px] w-full py-6 space-y-6">
        <div class="bg-card-background rounded-3xl p-8 sm:p-10 border-0 text-center space-y-6 shadow-none">
          <!-- Animated glowing status icon -->
          <div class="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div class="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-75"></div>
            <div class="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 relative z-10">
              <Clock :size="38" />
            </div>
          </div>

          <!-- Header Titles -->
          <div class="space-y-2">
            <div class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock :size="13" /> Registration Pending Approval
            </div>
            <h1 class="text-2xl sm:text-3xl font-bold text-primary-text tracking-tight">
              Request Under Review
            </h1>
            <p class="text-xs sm:text-sm text-secondary-text leading-relaxed max-w-md mx-auto">
              Your Fund Manager registration request has been submitted successfully and is currently under review by our admin team. Please wait while your request is being verified.
            </p>
          </div>

          <!-- Submitted Summary Box (Full Details - No Border) -->
          <div v-if="allSubmittedDetails.length > 0" class="bg-background/80 rounded-2xl p-5 border-0 text-left space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-primary-border/20">
              <div class="flex items-center gap-2">
                <ShieldCheck :size="16" class="text-amber-500" />
                <h3 class="text-xs font-bold text-primary-text uppercase tracking-wider">
                  Submitted Application Summary
                </h3>
              </div>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Full Summary
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-1">
              <div
                v-for="(item, idx) in allSubmittedDetails"
                :key="idx"
                class="bg-card-background/60 p-2.5 rounded-xl border-0 space-y-0.5"
              >
                <span class="text-secondary-text block text-[10px] font-medium uppercase tracking-wide">
                  {{ item.label }}
                </span>
                <span class="font-semibold text-primary-text break-words">
                  {{ item.value }}
                </span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              :disabled="isRefreshingProfile"
              @click="handleRefreshStatus"
              class="w-full sm:w-auto px-8 py-2.5 rounded-full bg-button text-button-text font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-none disabled:opacity-60"
            >
              <RefreshCw :size="14" :class="{ 'animate-spin': isRefreshingProfile }" />
              <span>Refresh Status</span>
            </button>
            <button
              type="button"
              @click="router.push('/dashboard')"
              class="w-full sm:w-auto px-8 py-2.5 rounded-full border-0 bg-background text-primary-text font-semibold text-xs cursor-pointer hover:bg-primary-border/20 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>

      <!-- 3. APPROVED SCREEN -->
      <div v-else-if="fmStatus === 'approved'" class="max-w-[720px] w-full py-6 space-y-6">
        <div class="bg-card-background rounded-3xl p-8 sm:p-10 border-0 text-center space-y-6 shadow-none">
          <div class="w-20 h-20 mx-auto rounded-full bg-primary-green/10 border border-primary-green/30 flex items-center justify-center text-primary-green">
            <CheckCircle2 :size="40" />
          </div>
          <div class="space-y-2">
            <div class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary-green/10 text-primary-green border border-primary-green/20">
              <CheckCircle2 :size="13" /> Approved
            </div>
            <h1 class="text-2xl sm:text-3xl font-bold text-primary-text tracking-tight">
              FM Registration Approved!
            </h1>
            <p class="text-xs sm:text-sm text-secondary-text leading-relaxed max-w-md mx-auto">
              Your Fund Manager application has been approved by the admin team. You can now access your FM Manager Dashboard.
            </p>
          </div>
          <div class="pt-2 flex justify-center">
            <button
              type="button"
              @click="router.push('/fm-dashboard')"
              class="px-8 py-2.5 rounded-full bg-button text-button-text font-semibold text-xs cursor-pointer shadow-none"
            >
              Go to FM Dashboard
            </button>
          </div>
        </div>
      </div>

      <!-- 4. REJECTED SCREEN -->
      <div v-else-if="fmStatus === 'rejected'" class="max-w-[720px] w-full py-6 space-y-6">
        <div class="bg-card-background rounded-3xl p-8 sm:p-10 border-0 text-center space-y-6 shadow-none">
          <div class="w-20 h-20 mx-auto rounded-full bg-primary-red/10 border border-primary-red/30 flex items-center justify-center text-primary-red">
            <AlertCircle :size="40" />
          </div>
          <div class="space-y-2">
            <div class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary-red/10 text-primary-red border border-primary-red/20">
              Declined
            </div>
            <h1 class="text-2xl sm:text-3xl font-bold text-primary-text tracking-tight">
              Registration Declined
            </h1>
            <p class="text-xs sm:text-sm text-secondary-text leading-relaxed max-w-md mx-auto">
              Your Fund Manager registration request was declined. Please contact support or re-apply.
            </p>
          </div>
          <div class="pt-2 flex justify-center">
            <button
              type="button"
              @click="isSubmitted = false"
              class="px-8 py-2.5 rounded-full bg-button text-button-text font-semibold text-xs cursor-pointer shadow-none"
            >
              Re-Apply Registration
            </button>
          </div>
        </div>
      </div>

      <!-- 5. REGISTRATION FORM (If incomplete) -->
      <div v-else class="max-w-[960px] w-full space-y-6">
        <!-- Page Header -->
        <div class="text-center space-y-1.5 pt-2">
          <h1 class="text-2xl lg:text-3xl font-bold text-primary-text tracking-tight">
            Register Fund Manager
          </h1>
          <p class="text-xs sm:text-sm text-secondary-text">
            Set up the fund manager's account, fees, settlement rules, and visibility preferences.
          </p>
        </div>

        <!-- Info Notice Banner -->
        <div class="bg-card-background border border-primary-border rounded-2xl p-4 sm:p-5 flex items-start gap-4 text-primary-text shadow-none">
          <div class="w-8 h-8 rounded-full bg-blue-600/15 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info :size="18" />
          </div>
          <div class="space-y-1">
            <h3 class="text-primary-text font-bold text-[23px] leading-[100%] tracking-normal" style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 23px; line-height: 100%; letter-spacing: 0%;">You're almost there</h3>
            <p class="text-slate-600 leading-relaxed font-medium text-xs mt-1">
              Please complete each section below to manage your account profile. This will help us offer you an improved and tailored service.
            </p>
          </div>
        </div>

        <!-- Sections Container (Borderless & No Shadow Cards) -->
        <div class="space-y-4">

          <!-- ─── SECTION 1: Fund Manager Setup ─── -->
          <div class="bg-card-background rounded-2xl overflow-hidden border-0 shadow-none">
            <button
              type="button"
              class="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer"
              @click="toggleSection('setup')"
            >
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-semibold text-primary-text">Fund Manager Setup</h2>
                  <CheckCircle2 v-if="completedSections.setup" :size="16" class="text-primary-green" />
                </div>
                <p class="text-xs text-secondary-text">Basic information and performance setting.</p>
              </div>
              <component :is="openSections.setup ? ChevronUp : ChevronDown" :size="20" class="text-secondary-text" />
            </button>

            <div v-show="openSections.setup" class="px-6 pb-6 pt-2">
              <div class="max-w-xl mx-auto space-y-5 py-2">

                <!-- Account Category (BaseSelect) -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-primary-text">Account Category</label>
                  <BaseSelect
                    v-model="form.account_category"
                    :options="categoryOptions"
                    placeholder="Select account category"
                    :is-loading="isFetchingGroups"
                    searchable
                    rounded="xl"
                    @change="clearError('account_category')"
                  >
                    <template #trigger="{ selected, label }">
                      <div v-if="selected && selected.account_category" class="flex items-center gap-2 flex-wrap min-w-0">
                        <span class="font-medium text-xs capitalize text-primary-text">
                          {{ selected.account_category }}
                        </span>
                        <span
                          v-if="selected.badge"
                          class="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-semibold tracking-wide"
                        >
                          {{ selected.badge }}
                        </span>
                        <span
                          v-if="selected.currency"
                          class="px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase"
                        >
                          {{ selected.currency }}
                        </span>
                        <span
                          v-if="selected.leverage !== undefined && selected.leverage !== null && selected.leverage !== ''"
                          class="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-[10px] font-semibold"
                        >
                          Leverage: 1:{{ String(selected.leverage).replace('1:', '') }}
                        </span>
                      </div>
                      <span v-else class="truncate text-secondary-text/80 text-xs font-normal">
                        {{ label }}
                      </span>
                    </template>

                    <template #option="{ option }">
                      <div class="flex items-center gap-2 flex-wrap min-w-0 py-0.5">
                        <span class="font-medium text-xs capitalize text-primary-text">
                          {{ option.account_category || option.label }}
                        </span>
                        <span
                          v-if="option.badge"
                          class="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-semibold tracking-wide"
                        >
                          {{ option.badge }}
                        </span>
                        <span
                          v-if="option.currency"
                          class="px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase"
                        >
                          {{ option.currency }}
                        </span>
                        <span
                          v-if="option.leverage !== undefined && option.leverage !== null && option.leverage !== ''"
                          class="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-[10px] font-semibold"
                        >
                          Leverage: 1:{{ String(option.leverage).replace('1:', '') }}
                        </span>
                      </div>
                    </template>
                  </BaseSelect>
                  <p class="text-[11px] text-secondary-text">Select the account category this fund manager will operate under.</p>
                  <p v-if="errors.account_category" class="text-[11px] text-primary-red mt-1">{{ errors.account_category }}</p>
                </div>

                <!-- Settlement Type (BaseSelect) -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-primary-text">Settlement Type</label>
                  <BaseSelect
                    v-model="form.settlement_type"
                    :options="settlementOptions"
                    placeholder="Select settlement type"
                    rounded="xl"
                    @change="clearError('settlement_type')"
                  />
                  <p class="text-[11px] text-secondary-text">Choose how and when performance fees are settled.</p>
                  <p v-if="errors.settlement_type" class="text-[11px] text-primary-red mt-1">{{ errors.settlement_type }}</p>
                </div>

                <!-- Follower Account Type (BaseSelect) -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-primary-text">Follower Account Type</label>
                  <BaseSelect
                    v-model="form.follower_account_type"
                    :options="followerAccountTypeOptions"
                    placeholder="Select follower account type"
                    rounded="xl"
                  />
                  <p class="text-[11px] text-secondary-text">Select allowed account options for followers.</p>
                </div>

                <!-- Submit Section 1 (Rounded Pill Button, No Shadow/Hover) -->
                <div class="pt-3 flex justify-center">
                  <button
                    type="button"
                    class="px-8 py-2.5 rounded-full bg-button text-button-text font-semibold text-xs cursor-pointer shadow-none"
                    @click="submitSection1"
                  >
                    Next
                  </button>
                </div>

              </div>
            </div>
          </div>

          <!-- ─── SECTION 2: Management Fees ─── -->
          <div class="bg-card-background rounded-2xl overflow-hidden border-0 shadow-none">
            <button
              type="button"
              class="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer"
              @click="toggleSection('fees')"
            >
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-semibold text-primary-text">Management Fees</h2>
                  <CheckCircle2 v-if="completedSections.fees" :size="16" class="text-primary-green" />
                </div>
                <p class="text-xs text-secondary-text">Configure management and registration fee details</p>
              </div>
              <component :is="openSections.fees ? ChevronUp : ChevronDown" :size="20" class="text-secondary-text" />
            </button>

            <div v-show="openSections.fees" class="px-6 pb-6 pt-2">
              <div class="max-w-xl mx-auto space-y-5 py-2">

                <!-- Management Fee -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-primary-text">Management Fee</label>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="form.management_fee"
                      type="number"
                      placeholder="e.g. 20"
                      class="flex-1 px-4 py-2.5 rounded-xl border border-primary-border bg-background text-primary-text placeholder:text-secondary-text/60 text-xs outline-none focus:border-primary transition-colors"
                      :class="{ 'border-primary-red': errors.management_fee }"
                      @focus="clearError('management_fee')"
                    />
                    <span class="px-3.5 py-2.5 rounded-xl border border-primary-border bg-card-background text-xs font-medium text-secondary-text flex items-center justify-center min-w-[75px] select-none">
                      in %
                    </span>
                  </div>
                  <p class="text-[11px] text-secondary-text">Fixed percentage charged for managing the investor's capital.</p>
                  <p v-if="errors.management_fee" class="text-[11px] text-primary-red mt-1">{{ errors.management_fee }}</p>
                </div>

                <!-- Management Fee Interval (BaseSelect) -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-primary-text">Management Fee Interval</label>
                  <BaseSelect
                    v-model="form.management_fee_interval"
                    :options="intervalOptions"
                    placeholder="Select Interval"
                    rounded="xl"
                    @change="clearError('management_fee_interval')"
                  />
                  <p class="text-[11px] text-secondary-text">Select how often the management fee is charged.</p>
                  <p v-if="errors.management_fee_interval" class="text-[11px] text-primary-red mt-1">{{ errors.management_fee_interval }}</p>
                </div>

                <!-- Registration Fee -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-primary-text">Registration Fee</label>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="form.registration_fee"
                      type="number"
                      placeholder="e.g. 20"
                      class="flex-1 px-4 py-2.5 rounded-xl border border-primary-border bg-background text-primary-text placeholder:text-secondary-text/60 text-xs outline-none focus:border-primary transition-colors"
                      :class="{ 'border-primary-red': errors.registration_fee }"
                      @focus="clearError('registration_fee')"
                    />
                    <span class="px-3.5 py-2.5 rounded-xl border border-primary-border bg-card-background text-xs font-medium text-secondary-text flex items-center justify-center min-w-[75px] select-none">
                      In {{ selectedCategoryCurrency }}
                    </span>
                  </div>
                  <p class="text-[11px] text-secondary-text">One Time fee charged when an investor registers for this fund.</p>
                  <p v-if="errors.registration_fee" class="text-[11px] text-primary-red mt-1">{{ errors.registration_fee }}</p>
                </div>

                <!-- Submit Section 2 (Rounded Pill Button, No Shadow/Hover) -->
                <div class="pt-3 flex justify-center">
                  <button
                    type="button"
                    class="px-8 py-2.5 rounded-full bg-button text-button-text font-semibold text-xs cursor-pointer shadow-none"
                    @click="submitSection2"
                  >
                    Next
                  </button>
                </div>

              </div>
            </div>
          </div>

          <!-- ─── SECTION 3: Fund Access & Limits ─── -->
          <div class="bg-card-background rounded-2xl overflow-hidden border-0 shadow-none">
            <button
              type="button"
              class="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer"
              @click="toggleSection('access')"
            >
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-semibold text-primary-text">Fund Access & Limits</h2>
                  <CheckCircle2 v-if="completedSections.access" :size="16" class="text-primary-green" />
                </div>
                <p class="text-xs text-secondary-text">Control who can access the fund and minimum investment.</p>
              </div>
              <component :is="openSections.access ? ChevronUp : ChevronDown" :size="20" class="text-secondary-text" />
            </button>

            <div v-show="openSections.access" class="px-6 pb-6 pt-2">
              <div class="max-w-xl mx-auto space-y-5 py-2">

                <!-- Visibility Type (BaseSelect) -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-primary-text">Visibility Type</label>
                  <BaseSelect
                    v-model="form.visibility_type"
                    :options="visibilityOptions"
                    placeholder="Select Visibility"
                    rounded="xl"
                    @change="clearError('visibility_type')"
                  />
                  <p class="text-[11px] text-secondary-text">Controls who can discover and register for this fund.</p>
                  <p v-if="errors.visibility_type" class="text-[11px] text-primary-red mt-1">{{ errors.visibility_type }}</p>
                </div>

                <!-- Minimum Capital -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-primary-text">Minimum Capital</label>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="form.min_capital"
                      type="number"
                      placeholder="e.g. 20"
                      class="flex-1 px-4 py-2.5 rounded-xl border border-primary-border bg-background text-primary-text placeholder:text-secondary-text/60 text-xs outline-none focus:border-primary transition-colors"
                      :class="{ 'border-primary-red': errors.min_capital }"
                      @focus="clearError('min_capital')"
                    />
                    <span class="px-3.5 py-2.5 rounded-xl border border-primary-border bg-card-background text-xs font-medium text-secondary-text flex items-center justify-center min-w-[75px] select-none">
                      In {{ selectedCategoryCurrency }}
                    </span>
                  </div>
                  <p class="text-[11px] text-secondary-text">Minimum amount an investor must deposit to participate.</p>
                  <p v-if="errors.min_capital" class="text-[11px] text-primary-red mt-1">{{ errors.min_capital }}</p>
                </div>

                <!-- Submit Section 3 (Rounded Pill Button, No Shadow/Hover) -->
                <div class="pt-3 flex justify-center">
                  <button
                    type="button"
                    class="px-8 py-2.5 rounded-full bg-button text-button-text font-semibold text-xs cursor-pointer shadow-none"
                    @click="submitSection3"
                  >
                    Next
                  </button>
                </div>

              </div>
            </div>
          </div>

          <!-- ─── SECTION 4: Profit Sharing ─── -->
          <div class="bg-card-background rounded-2xl overflow-hidden border-0 shadow-none">
            <button
              type="button"
              class="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer"
              @click="toggleSection('profit')"
            >
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-semibold text-primary-text">Profit Sharing</h2>
                  <CheckCircle2 v-if="completedSections.profit" :size="16" class="text-primary-green" />
                </div>
                <p class="text-xs text-secondary-text">Define how the applicable fees are shared.</p>
              </div>
              <component :is="openSections.profit ? ChevronUp : ChevronDown" :size="20" class="text-secondary-text" />
            </button>

            <div v-show="openSections.profit" class="px-6 pb-6 pt-2">
              <div class="max-w-xl mx-auto space-y-5 py-2">

                <!-- Performance Fee (%) -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-primary-text">Performance Fee (%)</label>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="form.performance_fee"
                      type="number"
                      placeholder="e.g. 20"
                      class="flex-1 px-4 py-2.5 rounded-xl border border-primary-border bg-background text-primary-text placeholder:text-secondary-text/60 text-xs outline-none focus:border-primary transition-colors"
                      :class="{ 'border-primary-red': errors.performance_fee }"
                      @focus="clearError('performance_fee')"
                    />
                    <span class="px-3.5 py-2.5 rounded-xl border border-primary-border bg-card-background text-xs font-medium text-secondary-text flex items-center justify-center min-w-[75px] select-none">
                      in %
                    </span>
                  </div>
                  <p class="text-[11px] text-secondary-text">Percentage of the profit charged as a performance fee.</p>
                  <p v-if="errors.performance_fee" class="text-[11px] text-primary-red mt-1">{{ errors.performance_fee }}</p>
                </div>

                <!-- FM Share (%) -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-primary-text">FM Share (%)</label>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="form.fm_share"
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      placeholder="e.g. 20"
                      class="flex-1 px-4 py-2.5 rounded-xl border border-primary-border bg-background text-primary-text placeholder:text-secondary-text/60 text-xs outline-none focus:border-primary transition-colors"
                      :class="{ 'border-primary-red': errors.fm_share }"
                      @focus="clearError('fm_share')"
                    />
                    <span class="px-3.5 py-2.5 rounded-xl border border-primary-border bg-card-background text-xs font-medium text-secondary-text flex items-center justify-center min-w-[75px] select-none">
                      in %
                    </span>
                  </div>
                  <p class="text-[11px] text-secondary-text">Percentage of the applicable fee allocated to the Fund Manager.</p>
                  <p v-if="errors.fm_share" class="text-[11px] text-primary-red mt-1">{{ errors.fm_share }}</p>
                </div>

                <!-- Broker Share (%) -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-primary-text">Broker Share (%)</label>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="form.broker_share"
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      placeholder="e.g. 20"
                      class="flex-1 px-4 py-2.5 rounded-xl border border-primary-border bg-background text-primary-text placeholder:text-secondary-text/60 text-xs outline-none focus:border-primary transition-colors"
                      :class="{ 'border-primary-red': errors.broker_share }"
                      @focus="clearError('broker_share')"
                    />
                    <span class="px-3.5 py-2.5 rounded-xl border border-primary-border bg-card-background text-xs font-medium text-secondary-text flex items-center justify-center min-w-[75px] select-none">
                      in %
                    </span>
                  </div>
                  <p class="text-[11px] text-secondary-text">Percentage of the applicable fee allocated to the Broker.</p>
                  <p v-if="errors.broker_share" class="text-[11px] text-primary-red mt-1">{{ errors.broker_share }}</p>
                </div>

                <!-- Final Submit Button (Rounded Full Button, No Shadow/Hover) -->
                <div class="pt-4 flex justify-center">
                  <button
                    type="button"
                    :disabled="isSubmitting"
                    class="px-10 py-2.5 rounded-full bg-button text-button-text font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-none disabled:opacity-60"
                    @click="submitFinalRegistration"
                  >
                    <Loader2 v-if="isSubmitting" :size="14" class="animate-spin" />
                    <span>{{ isSubmitting ? 'Submitting…' : 'Submit' }}</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>

        <!-- Footer Disclaimers & Restrictions -->
        <div class="pt-6 border-t border-primary-border/60 space-y-4 text-secondary-text text-[11px] leading-relaxed">
          <div>
            <h4 class="font-semibold text-primary-text mb-1">Disclaimer:</h4>
            <p>
              The information presented on this page is intended exclusively for informational and regulatory transparency purposes. It should not be interpreted as an invitation, solicitation, or recommendation to participate in any financial service, investment, or transaction. Trading leveraged financial instruments such as Foreign Exchange (Forex) and Contracts for Difference (CFDs) carries substantial risk and can result in losses exceeding the initial capital invested. These products may not be appropriate for every investor, as leverage magnifies both profits and losses, and traders do not gain ownership of the underlying assets. Historical performance is not a reliable indicator of future outcomes.
            </p>
            <p class="mt-2">
              Before engaging in leveraged trading, individuals should carefully assess their financial situation, investment objectives, and trading experience to ensure they fully comprehend the risks involved. Panther Capitals Ltd. is not responsible for any financial losses arising from trading activities. The materials provided on this website are general in nature and do not take into account personal financial circumstances or investment goals. We strongly recommend reviewing the full suite of legal and risk disclosure documents available on this site and obtaining independent professional advice if needed.
            </p>
          </div>

          <div>
            <h4 class="font-semibold text-primary-text mb-1">Regional Restrictions:</h4>
            <p>
              Panther Capitals Ltd we don't offer services to residents of certain countries, including: Syria, North Korea, Iran, Iraq, Mauritius, USA, Canada, Sudan, Myanmar, Yemen, Afghanistan, Vanuatu, and those within the European Economic Area (EEA).
            </p>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>
