<script setup>
import { ref, computed, watch } from 'vue'
import { X, Loader2 } from 'lucide-vue-next'
import { useFmLeaderboardStore } from '@/stores/fm/leaderboard'
import BaseSelect from '@/components/base/BaseSelect.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  offerData: { type: Object, default: null },
})

const emit = defineEmits(['close', 'success'])
const store = useFmLeaderboardStore()
const selectedAccount = ref(null)
const lotType = ref('fixed')
const lotValue = ref(0.01)

const isLotInvalid = computed(() => {
  if (lotValue.value === null || lotValue.value === undefined || lotValue.value === '') return true
  const val = Number(lotValue.value)
  return isNaN(val) || val < 0.01
})

const handleLotBlur = () => {
  if (lotValue.value === null || lotValue.value === undefined || lotValue.value === '' || Number(lotValue.value) < 0.01) {
    lotValue.value = 0.01
  }
}

const getCurrencySymbol = (currency) => {
  const c = String(currency || "").toUpperCase();
  if (c === "USC" || c === "CENT") return "C";
  if (c === "USD") return "$";
  return "$";
};

const accountOptions = computed(() =>
  store.tradingAccounts.map((a) => {
    const symbol = getCurrencySymbol(a.broker_currency || a.currency);
    const balanceNum = Number(a.balance || 0);
    const balanceFmt = balanceNum.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const typeLabel =
      a.trading_type === "real" ? "Real Account" : "Copy Trading";
    const platform = a.broker || a.platform || "MT5";
    const balanceFormatted = `${symbol} ${balanceFmt}`;

    return {
      label: `#${a.account_number} · ${typeLabel} · ${platform} · ${balanceFormatted}`,
      value: a.trading_account_id,
      account_number: a.account_number,
      trading_type: a.trading_type,
      typeLabel,
      platform,
      balance: a.balance,
      balanceFormatted,
      currency: a.broker_currency || a.currency || "USD",
      raw: a,
    };
  }),
);

const selectedAccountData = computed(() =>
  store.tradingAccounts.find((a) => a.trading_account_id === selectedAccount.value)
)

const fundManager = computed(() => props.offerData?.fund_manager || {})
const offer = computed(() => props.offerData?.offer || {})
const joinLink = computed(() => props.offerData?.join_link || {})

watch(() => props.open, (val) => {
  if (val) {
    selectedAccount.value = null
    lotType.value = 'fixed'
    lotValue.value = 0.01
    store.fetchTradingAccounts()
  }
})

const submitFollow = () => {
  const val = Number(lotValue.value)
  if (isNaN(val) || val < 0.01 || !selectedAccount.value) return

  const payload = {
    fm_id: fundManager.value.id,
    trading_account_id: selectedAccount.value,
    lot_type: lotType.value,
    lot_value: Math.max(0.01, val),
    offer_id: offer.value.id,
    join_link_id: joinLink.value.id,
  }

  store.followFm(payload, () => {
    emit('success')
    emit('close')
  })
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
  >
    <div class="bg-card-background rounded-2xl border border-primary-border w-full max-w-2xl" @click.stop>

      <!-- Header -->
      <div class="px-6 py-4 border-b border-primary-border flex items-center justify-between">
        <h2 class="text-sm font-semibold text-primary-text">Follow Fund Manager - Private Offer</h2>
        <button class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors" @click="emit('close')">
          <X class="w-4 h-4 text-secondary-text" />
        </button>
      </div>

      <!-- Content -->
      <div class="grid grid-cols-2 divide-x divide-primary-border">
        <!-- Left Column: Form -->
        <div class="px-6 py-5 space-y-4">
          <!-- FM Summary -->
          <div class="bg-background border border-primary-border rounded-xl p-4 space-y-1">
            <p class="text-xs font-medium text-primary-text">{{ fundManager.name || 'Fund Manager' }}</p>
            <p class="text-[11px] text-secondary-text">{{ fundManager.email }}</p>
          </div>

          <!-- Join Link Info -->
          <div class="bg-background border border-primary-border rounded-xl p-4 space-y-1">
            <p class="text-xs font-semibold text-primary-text">{{ joinLink.title }}</p>
            <p class="text-[11px] text-secondary-text">{{ joinLink.description }}</p>
            <div class="border-t border-primary-border mt-2 pt-2">
              <p class="text-[10px] text-secondary-text mb-1">Campaign Info:</p>
              <div class="text-[10px] text-secondary-text space-y-0.5">
                <p v-if="joinLink.max_uses">Capacity: {{ joinLink.used_count }} / {{ joinLink.max_uses }}</p>
                <p v-if="joinLink.expires_at">Expires: {{ new Date(joinLink.expires_at).toLocaleDateString() }}</p>
              </div>
            </div>
          </div>

          <div>
            <p class="text-xs text-secondary-text mb-1.5">Select Trading Account</p>
            <BaseSelect
              v-model="selectedAccount"
              :options="accountOptions"
              searchable
              placeholder="Search trading account"
            >
              <!-- Trigger Slot -->
              <template #trigger="{ selected, label }">
                <div
                  v-if="selected && (selected.account_number || selected.raw?.account_number)"
                  class="flex items-center justify-between w-full min-w-0 pr-1 text-left"
                >
                  <div class="flex items-center gap-1.5 truncate">
                    <span class="font-bold font-mono text-primary-text text-xs">
                      #{{ selected.account_number || selected.raw?.account_number }}
                    </span>
                    <span
                      class="text-[10px] px-1.5 py-0.5 rounded bg-primary-border/40 text-secondary-text font-semibold"
                    >
                      {{ selected.platform || selected.raw?.broker || selected.raw?.platform || "MT5" }}
                    </span>
                  </div>
                  <span class="font-bold font-mono text-xs text-primary-green shrink-0 ml-2">
                    {{ selected.balanceFormatted }}
                  </span>
                </div>
                <span v-else class="text-xs text-secondary-text truncate">{{ label }}</span>
              </template>

              <!-- Option Slot -->
              <template #option="{ option }">
                <div class="flex items-center justify-between w-full py-1 min-w-0">
                  <div class="flex flex-col min-w-0 mr-2 text-left">
                    <div class="flex items-center gap-1.5 flex-wrap">
                          <span class="font-bold font-mono text-primary-text text-xs">
                            #{{ option.account_number || option.raw?.account_number || option.label }}
                          </span>
                      <span
                        class="text-[10px] px-1.5 py-0.5 rounded bg-primary-border/40 text-secondary-text font-semibold"
                      >
                        {{ option.platform || option.raw?.broker || option.raw?.platform || "MT5" }}
                      </span>
                    </div>
                    <span class="text-[11px] text-secondary-text mt-0.5">
                      {{ option.typeLabel || (option.trading_type === "real" ? "Real Account" : "Copy Trading") }}
                    </span>
                  </div>
                  <div class="flex flex-col items-end shrink-0 text-right">
                    <span class="font-bold font-mono text-xs text-primary-green">
                      {{ option.balanceFormatted }}
                    </span>
                    <span class="text-[10px] text-secondary-text uppercase">
                      {{ option.currency || option.raw?.currency || "USD" }}
                    </span>
                  </div>
                </div>
              </template>
            </BaseSelect>
          </div>

          <div>
            <p class="text-xs text-secondary-text mb-1.5">Lot Type</p>
            <div class="flex gap-3">
              <button
                @click="lotType = 'fixed'"
                :class="[
                  'flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors',
                  lotType === 'fixed'
                    ? 'bg-button text-button-text'
                    : 'border border-primary-border text-secondary-text hover:text-primary-text'
                ]"
              >
                Fixed
              </button>
              <button
                @click="lotType = 'multiplier'"
                :class="[
                  'flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors',
                  lotType === 'multiplier'
                    ? 'bg-button text-button-text'
                    : 'border border-primary-border text-secondary-text hover:text-primary-text'
                ]"
              >
                Multiplier
              </button>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <p class="text-xs text-secondary-text">Lot Value</p>
              <span class="text-[10px] text-secondary-text">Min: 0.01</span>
            </div>
            <input
              v-model.number="lotValue"
              type="number"
              min="0.01"
              step="0.01"
              class="w-full px-4 py-2.5 rounded-lg bg-background border text-primary-text text-xs focus:outline-none transition-colors"
              :class="[
                isLotInvalid
                  ? 'border-red-500/70 focus:border-red-500'
                  : 'border-primary-border focus:border-primary'
              ]"
              placeholder="Enter lot value (min 0.01)"
              @blur="handleLotBlur"
            />
            <p v-if="isLotInvalid" class="text-[10px] text-red-500 mt-1">
              Lot value must be at least 0.01
            </p>
          </div>

          <div v-if="selectedAccount" class="bg-background border border-primary-border rounded-xl p-3 grid grid-cols-3 gap-3">
            <div>
              <p class="text-[10px] uppercase tracking-wide text-secondary-text mb-0.5">Account</p>
              <p class="text-xs font-medium text-primary-text">#{{ selectedAccountData?.account_number }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wide text-secondary-text mb-0.5">Broker</p>
              <p class="text-xs font-medium text-primary-text">{{ selectedAccountData?.broker }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wide text-secondary-text mb-0.5">Balance</p>
              <p class="text-xs font-medium text-primary-text">${{ selectedAccountData?.balance?.toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <!-- Right Column: Offer Details -->
        <div class="px-6 py-5">
          <div class="bg-background border border-primary-border rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-primary-text">{{ offer.name }}</p>
              <span class="text-[11px] text-secondary-text bg-card-background border border-primary-border px-2 py-0.5 rounded-full">{{ offer.id }}</span>
            </div>
            <div class="border-t border-primary-border" />
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-[11px] text-secondary-text">Summary</p>
                <p class="text-xs font-medium text-primary-text">{{ offer.summary || '-' }}</p>
              </div>
              <div class="flex items-center justify-between">
                <p class="text-[11px] text-secondary-text">Management Fee</p>
                <p class="text-xs font-medium text-primary-text">{{ offer.management_fee }}% / {{ offer.management_fee_interval }}</p>
              </div>
              <div class="flex items-center justify-between">
                <p class="text-[11px] text-secondary-text">Performance Fee</p>
                <p class="text-xs font-medium text-primary-text">{{ offer.performance_fee }}%</p>
              </div>
              <div class="flex items-center justify-between">
                <p class="text-[11px] text-secondary-text">Registration Fee</p>
                <p class="text-xs font-medium text-primary-text">${{ offer.registration_fee?.toFixed(2) }}</p>
              </div>
              <div class="flex items-center justify-between">
                <p class="text-[11px] text-secondary-text">Min. Balance</p>
                <p class="text-xs font-medium text-primary-text">${{ offer.minimum_balance?.toFixed(2) }}</p>
              </div>
            </div>
            <div v-if="offer.notes" class="border-t border-primary-border pt-2">
              <p class="text-[11px] text-secondary-text mb-0.5">Notes</p>
              <p class="text-xs text-primary-text">{{ offer.notes }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 border-t border-primary-border flex gap-3">
        <button
          class="flex-1 px-4 py-2.5 rounded-lg text-xs font-medium text-secondary-text border border-primary-border hover:bg-background hover:text-primary-text transition-colors"
          @click="emit('close')"
        >Cancel</button>
        <button
          :disabled="!selectedAccount || store.actionLoading || isLotInvalid"
          class="flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold bg-button text-button-text hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer border-0 shadow-none"
          @click="submitFollow"
        >
          <Loader2 v-if="store.actionLoading" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ store.actionLoading ? 'Following...' : 'Follow' }}</span>
        </button>
      </div>

    </div>
  </div>
</template>
