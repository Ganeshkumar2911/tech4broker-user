<script setup>
import { ref, computed, watch } from 'vue'
import { X, Loader2, ArrowRight } from 'lucide-vue-next'
import { useTradingAccountsStore } from '@/stores/client/tradingAccounts'
import apiRequest from '@/api/request'
import urls from '@/api/urls'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  account: {
    type: Object,
    default: null,
  },
})
const emit = defineEmits(['close'])

const store = useTradingAccountsStore()

// const fromAccountId = ref(null)
const toAccountId   = ref(null)
const amount        = ref(null)

// const fromOptions = ref([])
const toOptions    = ref([])
// const fromSearchQuery = ref('')
const toSearchQuery = ref('')
// const fromLoading = ref(false)
const toLoading = ref(false)

let fromSearchTimer = null
let toSearchTimer   = null

import { buildAccountOption } from '@/utils/formatters'

const buildOptions = (accounts) =>
  (accounts || []).map(buildAccountOption).filter(Boolean)

const updateOptions = (newOptions, selectedValue, currentOptions) => {
  const hasSelected = newOptions.some(o => o.value === selectedValue)
  if (selectedValue && !hasSelected) {
    const prevSelected = currentOptions.find(o => o.value === selectedValue)
    if (prevSelected) {
      return [prevSelected, ...newOptions]
    }
  }
  return newOptions
}

const fetchAccounts = (q, loadingRef, optionsRef, selectedValue) => {
  loadingRef.value = true
  apiRequest(
    urls.KEYS.GET,
    urls.tradingAccounts.searchAccounts,
    {
      params: { q },
      isTokenRequired: true,
      onSuccess: (res) => {
        const rawAccounts = res?.data?.accounts || []
        const newOptions = buildOptions(rawAccounts)
        optionsRef.value = updateOptions(newOptions, selectedValue, optionsRef.value)
        loadingRef.value = false
      },
      onFailure: (err) => {
        loadingRef.value = false
      }
    }
  )
}

// const onFromSearch = (query) => {
//   clearTimeout(fromSearchTimer)
//   fromSearchQuery.value = query
//   fromSearchTimer = setTimeout(() => {
//     fetchAccounts(query, fromLoading, fromOptions, fromAccountId.value)
//   }, 350)
// }

const onToSearch = (query) => {
  clearTimeout(toSearchTimer)
  toSearchQuery.value = query
  toSearchTimer = setTimeout(() => {
    fetchAccounts(query, toLoading, toOptions, toAccountId.value)
  }, 350)
}

// const selectedFromAccount = computed(() =>
//   fromOptions.value.find((o) => o.value === fromAccountId.value)?.raw
// )
const selectedToAccount = computed(() =>
  toOptions.value.find((o) => o.value === toAccountId.value)?.raw
)

const sameAccountError = computed(() =>
  props.account?.id &&
  toAccountId.value &&
  props.account.id === toAccountId.value
    ? "Source and destination accounts cannot be the same."
    : ""
)
const amountError = computed(() => {
  if (amount.value === null || amount.value === '') return ''
  if (Number(amount.value) <= 0) return 'Amount must be greater than 0.'
  return ''
})

const isValid = computed(() =>
  toAccountId.value &&
  amount.value &&
  Number(amount.value) > 0 &&
  !sameAccountError.value
)

const transferSubmitted = ref(false)

watch(() => props.open, (val) => {
  if (val) {
    // fromAccountId.value = null
    toAccountId.value   = null
    amount.value        = null
    // fromSearchQuery.value = ''
    toSearchQuery.value = ''
    transferSubmitted.value = false
    // fromOptions.value = []
    toOptions.value = []
    // fetchAccounts('', fromLoading, fromOptions, null)
    fetchAccounts('', toLoading, toOptions, null)
  }
})

watch(() => store.actionLoading, (isLoading) => {
  if (!isLoading && transferSubmitted.value && props.open) {
    emit('close')
    transferSubmitted.value = false
  }
})

const submit = async () => {
  if (!isValid.value) return
  transferSubmitted.value = true
  store.internalTransfer({
    // from_account_id: fromAccountId.value,
    to_account_id:   toAccountId.value,
    amount:          amount.value,
  })
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
  >
    <div class="w-full max-w-md rounded-2xl border border-primary-border bg-card-background" @click.stop>

      <!-- Header -->
      <div class="px-6 py-4 border-b border-primary-border flex items-center justify-between">
        <h2 class="text-sm font-semibold text-primary-text">Internal Transfer</h2>
        <button
          class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors"
          :disabled="store.actionLoading"
          @click="emit('close')"
        >
          <X class="w-4 h-4 text-secondary-text" />
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-5 space-y-4" :class="{ 'opacity-60 pointer-events-none': store.actionLoading }">

        <!-- From Account -->
        <!-- <div>
          <p class="text-xs text-secondary-text mb-1.5">From Account</p>
          <BaseSelect
            v-model="fromAccountId"
            :options="fromOptions"
            :isLoading="fromLoading"
            searchable
            placeholder="Search account..."
            @search="onFromSearch"
          />
          <div v-if="selectedFromAccount" class="mt-2 bg-background border border-primary-border rounded-lg px-3 py-2 grid grid-cols-3 gap-2">
            <div>
              <p class="text-[10px] text-secondary-text">User</p>
              <p class="text-xs font-medium text-primary-text truncate">{{ selectedFromAccount.user.name }}</p>
            </div>
            <div>
              <p class="text-[10px] text-secondary-text">Account</p>
              <p class="text-xs font-medium text-primary-text">#{{ selectedFromAccount.account.account_number }}</p>
            </div>
            <div>
              <p class="text-[10px] text-secondary-text">Balance</p>
              <p class="text-xs font-medium text-primary-text">{{ getFormattedBalance(selectedFromAccount) }}</p>
            </div>
          </div>
        </div> -->
        <div>
  <p class="text-xs text-secondary-text mb-1.5">
    From Account
  </p>

  <div class="bg-background border border-primary-border rounded-lg px-3 py-3">
    <div class="grid grid-cols-3 gap-2">
      <div>
        <p class="text-[10px] text-secondary-text">
          Account
        </p>

        <p class="text-xs font-medium text-primary-text">
          #{{ props.account?.account_number || props.account?.login }}
        </p>
      </div>

      <div>
        <p class="text-[10px] text-secondary-text">
          Platform
        </p>

        <p class="text-xs font-medium text-primary-text">
          {{ props.account?.platform }}
        </p>
      </div>

      <div>
        <p class="text-[10px] text-secondary-text">
          Balance
        </p>

        <p class="text-xs font-medium text-primary-text">
          {{ props.account?.broker_currency || props.account?.currency }}
          {{ props.account?.balance }}
        </p>
      </div>
    </div>
  </div>
</div>

        <!-- Arrow divider -->
        <div class="flex items-center justify-center">
          <div class="w-7 h-7 rounded-full bg-background border border-primary-border flex items-center justify-center">
            <ArrowRight class="w-3.5 h-3.5 text-secondary-text rotate-90" />
          </div>
        </div>

        <!-- To Account -->
        <div>
          <p class="text-xs text-secondary-text mb-1.5">To Account</p>
          <BaseSelect
            v-model="toAccountId"
            :options="toOptions"
            :isLoading="toLoading"
            searchable
            placeholder="Search account..."
            @search="onToSearch"
          />
          <div v-if="selectedToAccount" class="mt-2 bg-background border border-primary-border rounded-lg px-3 py-2 grid grid-cols-3 gap-2">
            <div>
              <p class="text-[10px] text-secondary-text">User</p>
              <p class="text-xs font-medium text-primary-text truncate">{{ selectedToAccount.user.name }}</p>
            </div>
            <div>
              <p class="text-[10px] text-secondary-text">Account</p>
              <p class="text-xs font-medium text-primary-text">#{{ selectedToAccount.account.account_number }}</p>
            </div>
            <div>
              <p class="text-[10px] text-secondary-text">Balance</p>
              <p class="text-xs font-medium text-primary-text">{{ getFormattedBalance(selectedToAccount) }}</p>
            </div>
          </div>
          <p v-if="sameAccountError" class="text-[11px] text-primary-red mt-1.5">{{ sameAccountError }}</p>
        </div>

        <!-- Amount -->
        <div>
          <p class="text-xs text-secondary-text mb-1.5">Amount</p>
          <input
            v-model="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            class="w-full px-3 py-2.5 rounded-lg bg-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary transition-colors placeholder:text-secondary-text"
            :class="{ 'border-primary-red': amountError }"
          />
          <p v-if="amountError" class="text-[11px] text-primary-red mt-1.5">{{ amountError }}</p>
          <p v-else class="text-[11px] text-secondary-text mt-1.5">Please enter amount in USD.</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-primary-border flex gap-3">
        <button
          :disabled="store.actionLoading"
          class="flex-1 px-4 py-2.5 rounded-lg text-xs font-medium text-secondary-text border border-primary-border hover:bg-background hover:text-primary-text transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          :disabled="store.actionLoading || !isValid"
          class="flex-1 px-4 py-2.5 rounded-lg text-xs font-medium text-black bg-primary hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          @click="submit"
        >
          <Loader2 v-if="store.actionLoading" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ store.actionLoading ? 'Transferring...' : 'Transfer' }}</span>
        </button>
      </div>

    </div>
  </div>
</template>
