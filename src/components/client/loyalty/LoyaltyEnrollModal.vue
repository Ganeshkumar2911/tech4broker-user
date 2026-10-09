<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  X,
  Gift,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
  Wallet,
} from 'lucide-vue-next'
import { useLoyaltyStore } from '@/stores/client/loyalty'
import { useTradingAccountsStore } from '@/stores/client/tradingAccounts'
import { formatDate } from '@/utils/timeFormatter'
import LoyaltyMedia from '@/components/client/loyalty/LoyaltyMedia.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  program: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['close', 'enrolled'])

const loyaltyStore = useLoyaltyStore()
const tradingAccountsStore = useTradingAccountsStore()

const selectedAccountId = ref(null)
const termsAccepted = ref(true)

// Fetch user's trading accounts when modal opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      termsAccepted.value = true
      tradingAccountsStore.fetchAccounts(true)
      selectedAccountId.value = null
    }
  }
)

const isOnePerUser = computed(() => {
  return props.program?.account_scope === 'one_per_user'
})

const isCopyAccount = (acc) => {
  const accType = String(acc.account_type || '').toLowerCase()
  const tradingType = String(acc.trading_type || '').toLowerCase()
  const platform = String(acc.platform || '').toLowerCase()
  const category = String(acc.category || acc.account_category || '').toLowerCase()

  return (
    accType === 'copy_trading' ||
    tradingType === 'copy_trading' ||
    platform === 'copy_trading' ||
    category === 'copy_trading' ||
    Boolean(acc.is_copy || acc.is_copy_trading || acc.copy_trading || acc.is_copy_follower || acc.is_copy_master)
  )
}

const eligibleAccounts = computed(() => {
  const rules = props.program?.eligibility_rules || {}
  const excludeCopy = rules.exclude_copy_accounts === true
  const excludeCategories = Array.isArray(rules.exclude_account_categories)
    ? rules.exclude_account_categories.map((c) => String(c).toLowerCase())
    : []
  const allowedGroups = Array.isArray(rules.allowed_group_codes) && rules.allowed_group_codes.length > 0
    ? rules.allowed_group_codes.map((g) => String(g).toLowerCase())
    : null
  const requiredTradingTypes = Array.isArray(rules.trading_types) && rules.trading_types.length > 0
    ? rules.trading_types.map((t) => String(t).toLowerCase())
    : null

  return (tradingAccountsStore.data || []).filter((acc) => {
    const accType = String(acc.account_type || '').toLowerCase()
    const tradingType = String(acc.trading_type || '').toLowerCase()
    const category = String(acc.category || acc.account_category || '').toLowerCase()
    const groupName = String(acc.group_name || acc.broker_group || acc.group_code || '').toLowerCase()

    // 1. Exclude demo if require_live is true
    if (rules.require_live !== false) {
      if (accType === 'demo' || tradingType === 'demo') {
        return false
      }
    }

    // 2. Exclude copy trading accounts if exclude_copy_accounts is true
    if (excludeCopy && isCopyAccount(acc)) {
      return false
    }

    // 3. Exclude excluded account categories (e.g. ['cent', 'pamm'])
    if (excludeCategories.length > 0) {
      if (
        excludeCategories.includes(category) ||
        excludeCategories.some((cat) => groupName.includes(cat))
      ) {
        return false
      }
    }

    // 4. Filter allowed group codes if specified
    if (allowedGroups && allowedGroups.length > 0) {
      const matchesGroup = allowedGroups.some(
        (g) => groupName.includes(g) || String(acc.group_code || '').toLowerCase() === g
      )
      if (!matchesGroup) {
        return false
      }
    }

    // 5. Allowed trading types if specified (e.g. ['real'])
    if (requiredTradingTypes && requiredTradingTypes.length > 0) {
      if (!requiredTradingTypes.includes(tradingType) && !requiredTradingTypes.includes(accType)) {
        return false
      }
    }

    return true
  })
})

// Auto-select first real/live account if available
watch(
  () => eligibleAccounts.value,
  (accounts) => {
    if (accounts && accounts.length > 0 && !selectedAccountId.value) {
      const liveAccount = accounts.find((a) => a.account_type === 'live' || a.trading_type === 'real')
      selectedAccountId.value = liveAccount ? (liveAccount.id || liveAccount.account_number) : (accounts[0].id || accounts[0].account_number)
    }
  },
  { immediate: true }
)

const closeModal = () => {
  emit('close')
}

const handleEnroll = () => {
  if (!props.program?.id) return

  if (isOnePerUser.value && !selectedAccountId.value) {
    return
  }

  const payload = {
    program_id: props.program.id,
  }

  if (selectedAccountId.value) {
    payload.trading_account_id = selectedAccountId.value
  }

  loyaltyStore.enrollInProgram(payload, (res) => {
    emit('enrolled', res)
    closeModal()
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs"
      @click.self="closeModal"
    >
      <div
        class="bg-card-background w-full h-full sm:h-auto sm:max-w-lg max-h-none sm:max-h-[92vh] rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col border-0"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-primary-border/20 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Gift class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-primary-text">Join Loyalty Program</h3>
              <p class="text-xs text-secondary-text">Start earning reward points on your trades</p>
            </div>
          </div>
          <button
            @click="closeModal"
            class="text-secondary-text hover:text-primary-text p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div class="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto min-h-0">
          <!-- Program Banner & Info Card -->
          <div class="rounded-2xl overflow-hidden bg-background">
            <div v-if="program?.image_url || (program?.image_urls && program.image_urls.length > 0)" class="relative w-full h-40 sm:h-48 overflow-hidden bg-background shrink-0">
              <LoyaltyMedia
                :items="program?.image_urls && program.image_urls.length > 0 ? program.image_urls : (program?.image_url ? [program.image_url] : [])"
                :alt="program?.name"
                :auto-slide="true"
                :pause-on-hover="true"
                :show-controls="true"
                :show-arrows="true"
                :show-dots="true"
                media-class="w-full h-full object-cover"
              />
            </div>
            <div class="p-4 space-y-2">
              <div class="flex items-center justify-between">
                <BaseBadge :value="program?.code || 'LOYALTY_PROGRAM'" variant="neutral" size="2xs" />
                <BaseBadge v-if="program?.status" :value="program.status" size="xs" />
              </div>
              <h4 class="text-base font-bold text-primary-text">{{ program?.name || 'PantherTrade Loyalty Program' }}</h4>
              <p class="text-xs text-secondary-text leading-relaxed">
                {{ program?.description || 'Earn loyalty points on every standard lot traded. Convert points to withdrawable cash or redeem exclusive store rewards.' }}
              </p>

              <!-- Metadata Pills -->
              <div class="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-secondary-text border-t border-primary-border/20">
                <div class="flex items-center gap-1">
                  <Layers class="w-3.5 h-3.5 text-primary" />
                  <span>Scope: {{ isOnePerUser ? '1 Primary Account' : 'All Eligible Accounts' }}</span>
                </div>
                <div v-if="program?.start_at || program?.end_at" class="flex items-center gap-1">
                  <Calendar class="w-3.5 h-3.5 text-primary" />
                  <span>Valid: {{ program?.start_at ? formatDate(program.start_at) : 'Open' }} - {{ program?.end_at ? formatDate(program.end_at) : 'Ongoing' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Trading Account Selection (if applicable) -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-xs font-semibold text-primary-text">
                Select Trading Account {{ isOnePerUser ? '(Primary Account)' : '(Seed / Primary Account)' }}
              </label>
              <span v-if="isOnePerUser" class="text-2xs text-amber-500 font-medium">Required</span>
              <span v-else class="text-2xs text-secondary-text font-medium">Optional</span>
            </div>

            <div v-if="tradingAccountsStore.loading" class="py-6 text-center text-xs text-secondary-text rounded-2xl bg-background flex flex-col items-center justify-center">
              <Loader2 class="w-5 h-5 animate-spin mx-auto mb-1.5 text-primary" />
              Loading accounts...
            </div>

            <div v-else-if="eligibleAccounts.length > 0" class="space-y-2 max-h-48 overflow-y-auto pr-1">
              <div
                v-for="acc in eligibleAccounts"
                :key="acc.id || acc.account_number"
                @click="selectedAccountId = acc.id || acc.account_number"
                :class="[
                  'rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all duration-150',
                  selectedAccountId === (acc.id || acc.account_number)
                    ? 'bg-white/10 ring-1 ring-primary/40'
                    : 'bg-background hover:bg-background/80'
                ]"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-card-background flex items-center justify-center text-primary font-bold text-xs">
                    #
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-primary-text">{{ acc.account_number }}</span>
                      <BaseBadge :value="acc.trading_type || 'Real'" size="2xs" text-case="uppercase" />
                    </div>
                    <p class="text-[11px] text-secondary-text mt-0.5">
                      Balance: <span class="font-bold text-primary-text">${{ acc.balance || '0.00' }}</span>
                      <span v-if="acc.group_name" class="ml-2">({{ acc.group_name }})</span>
                    </p>
                  </div>
                </div>

                <div
                  class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                  :class="selectedAccountId === (acc.id || acc.account_number) ? 'border-primary bg-primary' : 'border-primary-border/60'"
                >
                  <div v-if="selectedAccountId === (acc.id || acc.account_number)" class="w-1.5 h-1.5 rounded-full bg-black" />
                </div>
              </div>
            </div>

            <div v-else class="text-xs text-secondary-text py-3 text-center rounded-2xl bg-background">
              No live trading accounts found. Please create a live account first.
            </div>
          </div>

          <!-- Terms & Benefits Checklist -->
          <div class="bg-background rounded-2xl p-4 space-y-3">
            <h5 class="text-xs font-semibold text-primary-text flex items-center gap-1.5">
              <ShieldCheck class="w-4 h-4 text-primary" />
              Program Terms & Conditions
            </h5>
            <ul class="text-[11px] text-secondary-text space-y-2 pl-1">
              <li class="flex items-start gap-1.5">
                <CheckCircle2 class="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>Points are earned automatically on closed STP / RAW trades exceeding minimum trade duration.</span>
              </li>
              <li class="flex items-start gap-1.5">
                <CheckCircle2 class="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>Cash redemptions are instantly credited directly to your enrolled trading account balance.</span>
              </li>
              <li class="flex items-start gap-1.5">
                <CheckCircle2 class="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>Store merchandise & rewards are reserved on request and fulfilled upon review.</span>
              </li>
            </ul>

            <label class="flex items-center gap-2 pt-2.5 border-t border-primary-border/20 cursor-pointer">
              <input
                type="checkbox"
                v-model="termsAccepted"
                class="rounded border-primary-border text-primary focus:ring-primary w-4 h-4"
              />
              <span class="text-xs text-primary-text font-semibold">I accept the loyalty programme terms & rules</span>
            </label>
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
            :disabled="loyaltyStore.isEnrolling || !termsAccepted || (isOnePerUser && !selectedAccountId)"
            @click="handleEnroll"
            class="inline-flex items-center gap-1.5 h-10 px-5 text-xs font-bold text-button-text bg-button hover:opacity-90 rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="loyaltyStore.isEnrolling" class="w-3.5 h-3.5 animate-spin" />
            <ArrowRight v-else class="w-3.5 h-3.5" />
            <span>{{ loyaltyStore.isEnrolling ? 'Joining...' : 'Join Program Now' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
