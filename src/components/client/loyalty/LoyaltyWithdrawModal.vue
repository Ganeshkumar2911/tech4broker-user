<script setup>
import { ref, computed, watch } from 'vue'
import {
  X,
  ArrowUpRight,
  DollarSign,
  Wallet,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Zap,
  Layers,
  HelpCircle,
} from 'lucide-vue-next'
import { useLoyaltyStore } from '@/stores/client/loyalty'
import { useTradingAccountsStore } from '@/stores/client/tradingAccounts'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  programId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['close'])

const store = useLoyaltyStore()
const tradingAccountsStore = useTradingAccountsStore()

const pointsAmount = ref('')
const selectedKind = ref('primary') // 'primary' | 'general'
const selectedTradingAccountId = ref(null)

const activeProgramId = computed(() => {
  return props.programId || store.selectedProgramId || store.summary?.program_id || null
})

const allowPrimary = computed(() => Boolean(store.summary?.allow_wallet_transfer))
const allowGeneral = computed(() => Boolean(store.summary?.allow_general_wallet_transfer))
const hasAnyTransferPermission = computed(() => allowPrimary.value || allowGeneral.value)
const isPointsOnHold = computed(() => Boolean(store.summary?.points_on_hold))

// Eligible accounts for general transfer
const eligibleAccounts = computed(() => {
  return (tradingAccountsStore.data || []).filter((acc) => {
    const accType = String(acc.account_type || '').toLowerCase()
    const tradingType = String(acc.trading_type || '').toLowerCase()
    return accType !== 'demo' && tradingType !== 'demo'
  })
})

// Watch open state to initialize values
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      pointsAmount.value = ''
      tradingAccountsStore.fetchAccounts(true)
      store.fetchRedeemable(null, activeProgramId.value)

      if (allowPrimary.value) {
        selectedKind.value = 'primary'
      } else if (allowGeneral.value) {
        selectedKind.value = 'general'
      } else {
        selectedKind.value = 'primary'
      }
    }
  }
)

// Auto-select initial trading account for general transfer
watch(
  () => eligibleAccounts.value,
  (accounts) => {
    if (accounts && accounts.length > 0 && !selectedTradingAccountId.value) {
      const liveAcc = accounts.find((a) => a.account_type === 'live' || a.trading_type === 'real')
      selectedTradingAccountId.value = liveAcc ? (liveAcc.id || liveAcc.account_number) : (accounts[0].id || accounts[0].account_number)
    }
  },
  { immediate: true }
)

// Debounced preview check
let timeoutId = null
const onPointsInput = () => {
  if (timeoutId) clearTimeout(timeoutId)
  timeoutId = setTimeout(() => {
    if (pointsAmount.value) {
      store.fetchRedeemable(pointsAmount.value, activeProgramId.value)
    } else {
      store.fetchRedeemable(null, activeProgramId.value)
    }
  }, 350)
}

const handleMaxClick = () => {
  if (store.summary.available_points) {
    pointsAmount.value = String(store.summary.available_points)
    store.fetchRedeemable(pointsAmount.value, activeProgramId.value)
  }
}

const closeModal = () => {
  emit('close')
}

const conversionRate = computed(() => {
  return Number(store.redeemable?.cash_conversion_rate || store.summary?.cash_conversion_rate || 0.01)
})

const estimatedCashUsd = computed(() => {
  if (store.redeemable?.estimated_cash_usd && pointsAmount.value) {
    return Number(store.redeemable.estimated_cash_usd).toFixed(2)
  }
  const pts = Number(pointsAmount.value || 0)
  return (pts * conversionRate.value).toFixed(2)
})

const isPointsValid = computed(() => {
  const num = Number(pointsAmount.value)
  const min = Number(store.summary.min_redemption_points || 0)
  const available = Number(store.summary.available_points || 0)
  return num > 0 && num >= min && num <= available
})

const isFormValid = computed(() => {
  if (!isPointsValid.value) return false
  if (!hasAnyTransferPermission.value) return false
  if (isPointsOnHold.value) return false
  if (selectedKind.value === 'general' && !selectedTradingAccountId.value) return false
  return true
})

const handleSubmit = () => {
  if (!isFormValid.value) return

  const payload = {
    points: Number(pointsAmount.value),
    kind: selectedKind.value,
  }

  if (activeProgramId.value) {
    payload.program_id = activeProgramId.value
  }

  if (selectedKind.value === 'general' && selectedTradingAccountId.value) {
    payload.trading_account_id = selectedTradingAccountId.value
  }

  store.transferWalletPoints(payload, () => {
    closeModal()
  })
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
  >
    <div
      class="bg-card-background w-full max-w-md rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border-0"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-primary-border/20 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <DollarSign class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-primary-text">Convert Points to Trading USD</h3>
            <p class="text-xs text-secondary-text">Instant transfer into your trading account balance</p>
          </div>
        </div>
        <button
          @click="closeModal"
          class="text-secondary-text hover:text-primary-text p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
        <!-- Balance Info Banner -->
        <div class="bg-background rounded-2xl p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-card-background flex items-center justify-center text-primary shrink-0">
              <Wallet class="w-4 h-4" />
            </div>
            <div>
              <p class="text-[11px] text-secondary-text uppercase tracking-wider font-semibold">Central Wallet Balance</p>
              <p class="text-base font-bold text-primary-text font-mono">{{ store.summary.available_points }} pts</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-[11px] text-secondary-text uppercase tracking-wider font-semibold">Min. Required</p>
            <p class="text-xs font-bold text-primary-text font-mono">{{ store.summary.min_redemption_points }} pts</p>
          </div>
        </div>

        <!-- Points On Hold Alert -->
        <div
          v-if="isPointsOnHold"
          class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5"
        >
          <div class="flex items-center gap-2 font-bold text-amber-400">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>Points On Hold</span>
          </div>
          <p class="text-[11px] text-amber-200/80 leading-relaxed">
            Your loyalty points are currently on temporary hold. Points conversions and store redemptions are paused.
          </p>
        </div>

        <!-- Permission Notice if Both Gated Off -->
        <div
          v-else-if="!hasAnyTransferPermission"
          class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5"
        >
          <div class="flex items-center gap-2 font-bold">
            <AlertCircle class="w-4 h-4 text-amber-400 shrink-0" />
            <span>Trading Transfer Not Enabled</span>
          </div>
          <p class="text-[11px] text-amber-200/80 leading-relaxed">
            Wallet-to-trading conversion is not active for your current tier. You can still redeem your points for exclusive merchandise, vouchers, and gifts in the <strong>Rewards Store</strong>!
          </p>
        </div>

        <!-- Destination Account Selection (if permitted) -->
        <div v-else class="space-y-3">
          <label class="block text-xs font-semibold text-primary-text">Destination Account</label>

          <!-- Transfer Kind Selector (if both primary and general transfers are allowed) -->
          <div v-if="allowPrimary && allowGeneral" class="grid grid-cols-2 gap-2 p-1 bg-background rounded-2xl">
            <button
              type="button"
              @click="selectedKind = 'primary'"
              class="py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              :class="selectedKind === 'primary' ? 'bg-card-background text-primary-text shadow-xs' : 'text-secondary-text hover:text-primary-text'"
            >
              Primary Account
            </button>
            <button
              type="button"
              @click="selectedKind = 'general'"
              class="py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              :class="selectedKind === 'general' ? 'bg-card-background text-primary-text shadow-xs' : 'text-secondary-text hover:text-primary-text'"
            >
              Other Account
            </button>
          </div>

          <!-- Option 1: Primary Enrolled Account -->
          <div
            v-if="selectedKind === 'primary'"
            class="p-4 rounded-2xl bg-background flex items-center justify-between"
          >
            <div>
              <p class="text-xs font-bold text-primary-text">
                Enrolled Primary Account #{{ store.summary.trading_account_id || '-' }}
              </p>
              <p class="text-[11px] text-secondary-text mt-0.5">
                Points convert and credit directly into your primary enrolled MT5 account.
              </p>
            </div>
            <BaseBadge value="Primary" variant="primary" size="xs" text-case="uppercase" />
          </div>

          <!-- Option 2: General Account Selector -->
          <div v-else class="space-y-2">
            <div v-if="tradingAccountsStore.loading" class="py-3 text-center text-xs text-secondary-text">
              <Loader2 class="w-4 h-4 animate-spin mx-auto mb-1 text-primary" />
              Loading eligible accounts...
            </div>
            <div v-else-if="eligibleAccounts.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
              <div
                v-for="acc in eligibleAccounts"
                :key="acc.id || acc.account_number"
                @click="selectedTradingAccountId = acc.id || acc.account_number"
                :class="[
                  'rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all duration-150',
                  (selectedTradingAccountId === acc.id || selectedTradingAccountId === acc.account_number)
                    ? 'bg-white/10 ring-1 ring-primary/40'
                    : 'bg-background hover:bg-background/80'
                ]"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <p class="text-xs font-bold text-primary-text">Account #{{ acc.account_number || acc.id }}</p>
                    <BaseBadge :value="acc.trading_type || acc.account_type || 'MT5'" size="2xs" text-case="uppercase" />
                  </div>
                  <p class="text-[11px] text-secondary-text mt-0.5">
                    Balance: ${{ Number(acc.balance || 0).toFixed(2) }} USD
                  </p>
                </div>
                <div
                  class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                  :class="(selectedTradingAccountId === acc.id || selectedTradingAccountId === acc.account_number) ? 'border-primary bg-primary' : 'border-primary-border/60'"
                >
                  <div v-if="selectedTradingAccountId === acc.id || selectedTradingAccountId === acc.account_number" class="w-1.5 h-1.5 rounded-full bg-black" />
                </div>
              </div>
            </div>
            <div v-else class="text-xs text-secondary-text py-3 text-center rounded-2xl bg-background">
              No eligible trading accounts found.
            </div>
          </div>
        </div>

        <!-- Points Input Field -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs font-semibold text-primary-text">Points to Convert</label>
            <button
              type="button"
              @click="handleMaxClick"
              class="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              Use Max
            </button>
          </div>
          <div class="relative">
            <input
              v-model="pointsAmount"
              type="number"
              min="1"
              placeholder="e.g. 100"
              class="w-full px-4 py-3 text-xs rounded-xl bg-background text-primary-text outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-secondary-text/50"
              @input="onPointsInput"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-secondary-text">
              pts
            </span>
          </div>
          <p v-if="pointsAmount && Number(pointsAmount) < Number(store.summary.min_redemption_points)" class="text-[11px] text-amber-500 mt-1">
            Minimum conversion is {{ store.summary.min_redemption_points }} points.
          </p>
          <p v-if="pointsAmount && Number(pointsAmount) > Number(store.summary.available_points)" class="text-[11px] text-red-500 mt-1">
            Amount exceeds available balance.
          </p>
        </div>

        <!-- Estimated Cash Calculation Preview Box -->
        <div class="bg-background rounded-2xl p-4 space-y-2.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-secondary-text">Tier Conversion Rate</span>
            <span class="text-primary-text font-semibold">1 pt = ${{ store.summary.cash_conversion_rate }} USD</span>
          </div>
          <div class="flex items-center justify-between text-xs pt-2.5 border-t border-primary-border/20">
            <span class="text-secondary-text font-medium">Instant USD Credited</span>
            <span class="text-base font-bold text-primary">
              ${{ estimatedCashUsd }} USD
            </span>
          </div>
        </div>

        <!-- Instant Fulfillment Notice -->
        <div class="flex items-start gap-2.5 text-[11px] text-secondary-text bg-background rounded-2xl p-3.5">
          <Zap class="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span>
            <strong class="text-primary font-semibold">Instant Execution:</strong> No waiting or manual admin review. Funds are deposited into your trading account balance immediately.
          </span>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-2 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-primary-border/20 bg-background/50 shrink-0">
        <button
          type="button"
          @click="closeModal"
          class="h-10 px-5 text-xs font-semibold text-secondary-text hover:text-primary-text rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="store.isTransferLoading || !isFormValid"
          @click="handleSubmit"
          class="inline-flex items-center gap-1.5 h-10 px-5 text-xs font-bold text-button-text bg-button hover:opacity-90 rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="store.isTransferLoading" class="w-3.5 h-3.5 animate-spin" />
          <ArrowUpRight v-else class="w-3.5 h-3.5" />
          <span>{{ store.isTransferLoading ? 'Converting...' : 'Transfer to Account' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
