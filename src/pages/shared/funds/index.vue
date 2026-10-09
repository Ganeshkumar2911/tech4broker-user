<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import AccountsDisclaimer from '@/components/client/accounts/AccountsDisclaimer.vue'
import BaseTabs from '@/components/base/BaseTabs.vue'
import { useIBDashboard } from '@/stores/ib/dashboard'
import { useSnackbarStore } from '@/stores/shared/snackbar'

// Lazy-load Client tab components to ensure instant route transition and fast initial render
const DepositTab = defineAsyncComponent(() => import('@/components/client/funds/DepositTab.vue'))
const WithdrawTab = defineAsyncComponent(() => import('@/components/client/funds/WithdrawTab.vue'))
const TransferTab = defineAsyncComponent(() => import('@/components/client/funds/TransferTab.vue'))
const HistoryTab = defineAsyncComponent(() => import('@/components/client/funds/HistoryTab.vue'))

import { useTradingAccountsStore } from '@/stores/client/tradingAccounts'
import { useDepositStore } from '@/stores/client/deposit'
import { useWithdrawStore } from '@/stores/client/withdraw'

const route = useRoute()
const ibDashboardStore = useIBDashboard()
const tradingAccountsStore = useTradingAccountsStore()
const depositStore = useDepositStore()
const withdrawStore = useWithdrawStore()
const snackbar = useSnackbarStore()

// ─── Determine Active Role ───────────────────────────────────────────────────
const activeRole = computed(() => {
  if (route.name === 'ib-funds' || route.path.startsWith('/ib')) return 'ib'
  if (route.name === 'fm-funds' || route.path.startsWith('/fm')) return 'fm'
  return localStorage.getItem('role') || 'client'
})

// ─── Dynamic Tabs Based on Role ───────────────────────────────────────────────
const tabs = computed(() => {
  if (activeRole.value === 'ib') {
    return [
      { label: 'Withdrawal', value: 'withdraw' },
      { label: 'Transfer between trading accounts', value: 'transfer' },
    ]
  }

  if (activeRole.value === 'fm') {
    return [
      { label: 'Deposit', value: 'deposit' },
      { label: 'Withdrawal', value: 'withdraw' },
      { label: 'Transfer to trading account', value: 'transfer' },
      { label: 'History', value: 'history' },
    ]
  }

  // Client default
  return [
    { label: 'Deposit', value: 'deposit' },
    { label: 'Withdrawal', value: 'withdraw' },
    { label: 'Transfer between accounts', value: 'transfer' },
    { label: 'History', value: 'history' },
  ]
})

// ─── Tab Components Mapping ───────────────────────────────────────────────────
const tabComponents = {
  deposit: DepositTab,
  withdraw: WithdrawTab,
  transfer: TransferTab,
  history: HistoryTab,
}

const getValidTab = (tab) => {
  const allowed = tabs.value.map((t) => t.value)
  if (tab && allowed.includes(tab)) return tab
  return allowed[0] || (activeRole.value === 'ib' ? 'withdraw' : 'deposit')
}

const activeTab = ref(getValidTab(route.query.tab))

watch(
  [() => route.query.tab, tabs],
  ([newTab]) => {
    if (newTab && tabs.value.some((t) => t.value === newTab)) {
      activeTab.value = newTab
    } else {
      activeTab.value = getValidTab(newTab)
    }
  }
)

onMounted(() => {
  if (route.query.deposit_status === 'success') {
    snackbar.show('Deposit completed successfully!', 'success')
  } else if (route.query.deposit_status === 'cancelled') {
    snackbar.show('Deposit was cancelled.', 'warning')
  } else if (route.query.deposit_status === 'failed') {
    snackbar.show('Deposit failed. Please try again.', 'error')
  }

  if (activeRole.value === 'ib') {
    ibDashboardStore.fetchDashboardData()
  }
})

// Fetch corresponding payment methods when tab switches and reset steps
watch(
  activeTab,
  (newTab) => {
    depositStore.currentStep = 1
    withdrawStore.currentStep = 1
    if (newTab === 'deposit') {
      tradingAccountsStore.fetchPaymentMethods('deposit')
    } else if (newTab === 'withdraw') {
      tradingAccountsStore.fetchPaymentMethods('withdrawal')
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  depositStore.currentStep = 1
  withdrawStore.currentStep = 1
})

const isMultiStepActive = computed(() => {
  if (activeTab.value === 'deposit') return depositStore.currentStep > 1
  if (activeTab.value === 'withdraw') return withdrawStore.currentStep > 1
  return false
})

const currentStepModel = computed({
  get() {
    if (activeTab.value === 'deposit') return depositStore.currentStep
    if (activeTab.value === 'withdraw') return withdrawStore.currentStep
    return 1
  },
  set(val) {
    if (activeTab.value === 'deposit') depositStore.currentStep = val
    if (activeTab.value === 'withdraw') withdrawStore.currentStep = val
  },
})

const availableBalance = computed(() => {
  return ibDashboardStore.dashboardData?.overview?.available_balance || 0
})

const ActiveTabComponent = computed(() => tabComponents[activeTab.value])

const handleActionSuccess = () => {
  if (activeRole.value === 'ib') {
    ibDashboardStore.fetchDashboardData()
  }
}
</script>

<template>
  <div class="w-full space-y-3 sm:space-y-4">
    <!-- Tabs Outside Card (Matching Trading Reports layout) -->
    <div id="tour-funds-tabs" v-if="!isMultiStepActive" class="w-full sm:w-auto">
      <BaseTabs
        v-model="activeTab"
        :tabs="tabs"
        over-ride-class="border border-primary-border/40 p-1 gap-1.5"
        button-class="!text-sm font-medium px-5 sm:px-6 min-w-[80px] sm:min-w-[100px] justify-center"
      />
    </div>

    <!-- Main Content Card Container -->
    <div
      class="w-full rounded-2xl sm:rounded-[30px] bg-card-background py-5 sm:py-8 lg:py-[42px] px-3.5 sm:px-6 lg:px-[42px] flex flex-col gap-6 sm:gap-8 lg:gap-10 border-0 shadow-none"
    >
      <div id="tour-funds-content">
        <component
          :is="ActiveTabComponent"
          v-model:step="currentStepModel"
          :available-balance="availableBalance"
          @success="handleActionSuccess"
        />
      </div>
    </div>

    <AccountsDisclaimer />
  </div>
</template>
