<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useWithdrawStore } from "@/stores/client/withdraw";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import { formatPaymentAmount } from "@/utils/formatters";

import { useProfileStore } from "@/stores/shared/profile";

const route = useRoute();
const withdrawStore = useWithdrawStore();
const snackbar = useSnackbarStore();
const profileStore = useProfileStore();

const paymentMethodError = ref("");
const accountError = ref("");

const isIb = computed(() => profileStore.activeRole === "ib");
const isFm = computed(() => profileStore.activeRole === "fm");

const {
  selectedAccountId,
  selectedPaymentMethodId,
  accountOptions,
  paymentMethods,
  isPaymentMethodsLoading,
  isAccountsSearching,
  selectedPaymentMethod,
  sourceType,
  isDemo,
  isCheckingWithdrawable,
  isSettling,
} = storeToRefs(withdrawStore);

const showSettlementModal = ref(false);
const settlementMessage = ref("");
const settlementError = ref("");

const selectedAccountDisplay = computed(() => {
  const acc = withdrawStore.selectedAccount;
  if (!acc) return null;
  const num = acc.account?.account_number || acc.account_number || acc.login || acc.id;
  const tradingType = acc.account?.trading_type || acc.trading_type || "";
  const accountType = acc.account?.account_type || acc.account_type || "";
  const label = acc.account?.broker_label || acc.broker_label || "";
  return { num, tradingType, accountType, label };
});

const formattedMinPayout = computed(() => {
  const raw =
    selectedPaymentMethod.value?.minimum_withdrawal_amount ||
    selectedPaymentMethod.value?.minimal_payout_amount;
  if (!raw) return null;
  return formatPaymentAmount(raw, selectedPaymentMethod.value?.conversion_rate);
});

const payoutCurrency = computed(() => {
  if (selectedPaymentMethod.value?.method_type === "crypto") return "USD";
  return selectedPaymentMethod.value?.conversion_rate?.payment_currency || "USD";
});

// Account search debounce
let searchTimer = null;
const onAccountSearch = (query) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    withdrawStore.fetchAccounts(query);
  }, 300);
};

// Payment Method Options
const paymentMethodOptions = computed(() => {
  return paymentMethods.value.map((item) => ({
    label: item.wallet_label || item.name || "Withdrawal Method",
    value: item.id,
    raw: item,
  }));
});

let routeTargetSet = false;

// Set default account if provided via route query or when accounts load
const setDefaultAccount = () => {
  if (isIb.value) return;
  if (isFm.value && sourceType.value === "wallet") return;

  const targetId = route.query.accountId;
  if (targetId && !routeTargetSet) {
    const found = accountOptions.value.find(
      (opt) => String(opt.value) === String(targetId)
    );
    if (found) {
      selectedAccountId.value = found.value;
      routeTargetSet = true;
      return;
    }
  }

  if (selectedAccountId.value) return;

  // Pre-select first if none selected
  if (!selectedAccountId.value && accountOptions.value.length > 0) {
    selectedAccountId.value = accountOptions.value[0].value;
  }
};

function selectSource(type) {
  sourceType.value = type;
  if (type === "account") {
    if (!selectedAccountId.value && accountOptions.value.length > 0) {
      selectedAccountId.value = accountOptions.value[0].value;
    }
    if (accountOptions.value.length === 0) {
      withdrawStore.fetchAccounts("");
    }
  }
}

watch(
  () => route.query.accountId,
  (targetId) => {
    if (targetId && isFm.value) {
      sourceType.value = "account";
    }
  },
  { immediate: true }
);

watch(selectedPaymentMethodId, (val) => {
  if (val) paymentMethodError.value = "";
});

watch(selectedAccountId, (val) => {
  if (val) accountError.value = "";
});

watch(
  accountOptions,
  () => {
    setDefaultAccount();
  },
  { immediate: true }
);

onMounted(() => {
  if (!isIb.value) {
    withdrawStore.fetchAccounts("");
  }
  if (isFm.value) {
    withdrawStore.fetchFmWallet();
  }
  withdrawStore.fetchPaymentMethods();
});

async function handleNext() {
  accountError.value = "";
  paymentMethodError.value = "";

  const isWallet = isIb.value || (isFm.value && sourceType.value === "wallet");
  if (!isWallet && !selectedAccountId.value) {
    accountError.value = "Please select a trading account.";
    snackbar.show("Please select a trading account.", "error");
    return;
  }

  if (!isDemo.value && !selectedPaymentMethodId.value) {
    paymentMethodError.value = "Please select a withdrawal payment method.";
    snackbar.show("Please select a payment method.", "error");
    return;
  }

  // Pre-flight check for live/real/copy_trading trading accounts
  if (!isWallet && !isDemo.value && selectedAccountId.value) {
    const res = await withdrawStore.checkWithdrawable(selectedAccountId.value);
    if (!res.success) {
      if (res.requiresSettlement) {
        settlementMessage.value =
          res.message ||
          "Settlement is required before withdrawal for this account.";
        settlementError.value = "";
        showSettlementModal.value = true;
        return;
      }
      snackbar.show(
        res.error?.message || res.error || "Failed to check withdrawable balance.",
        "error"
      );
      return;
    }
  }

  withdrawStore.proceedToStep2();
}

async function handleRunSettlement() {
  settlementError.value = "";
  const res = await withdrawStore.runAccountSettlement(
    selectedAccountId.value,
    withdrawStore.settlementHint
  );

  if (res.success) {
    showSettlementModal.value = false;
    withdrawStore.proceedToStep2();
  } else {
    settlementError.value =
      res.message || "Failed to execute settlement. Please try again.";
  }
}
</script>

<template>
  <div class="space-y-6 px-2 sm:px-4 lg:px-2">
    <!-- Field 1: Source Selection (Trading Account, IB Wallet, or FM Wallet/Account) -->
    <div v-if="isIb">
      <p class="mid-text font-medium text-primary-text mb-1.5">Source</p>
      <div class="flex items-center justify-between h-[44px] px-4 rounded-lg bg-surface border border-primary-border">
        <div class="flex items-center gap-2.5">
          <BaseIcon name="account_balance_wallet" :size="18" class="text-primary" />
          <span class="text-sm font-semibold text-primary-text">IB Wallet</span>
        </div>
        <span class="text-xs font-mono font-bold text-primary">
          ${{ Number(withdrawStore.withdrawableBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} USD
        </span>
      </div>
      <p class="sub-text text-secondary-text mt-1.5">
        Funds will be withdrawn directly from your IB Wallet.
      </p>
    </div>

    <!-- FM Mode: Give 2 options - Wallet and Account -->
    <div v-else-if="isFm" class="space-y-3">
      <div>
        <p class="mid-text font-medium text-primary-text mb-1.5">Withdraw From</p>
        <div class="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-card-background border border-primary-border">
          <button
            type="button"
            @click="selectSource('wallet')"
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
            :class="
              sourceType === 'wallet'
                ? 'bg-button text-button-text font-semibold shadow-sm'
                : 'text-secondary-text hover:text-primary-text hover:bg-background/50'
            "
          >
            <BaseIcon name="account_balance_wallet" :size="17" />
            <span>Wallet</span>
          </button>
          <button
            type="button"
            @click="selectSource('account')"
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
            :class="
              sourceType === 'account'
                ? 'bg-button text-button-text font-semibold shadow-sm'
                : 'text-secondary-text hover:text-primary-text hover:bg-background/50'
            "
          >
            <BaseIcon name="trending_up" :size="17" />
            <span>Trading Account</span>
          </button>
        </div>
      </div>

      <!-- FM Wallet Option -->
      <div v-if="sourceType === 'wallet'">
        <div class="flex items-center justify-between h-[44px] px-4 rounded-lg bg-surface border border-primary-border">
          <div class="flex items-center gap-2.5">
            <BaseIcon name="account_balance_wallet" :size="18" class="text-primary" />
            <span class="text-sm font-semibold text-primary-text">FM Wallet</span>
          </div>
          <span class="text-xs font-mono font-bold text-primary">
            ${{ Number(withdrawStore.withdrawableBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} USD
          </span>
        </div>
        <p class="sub-text text-secondary-text mt-1.5">
          Funds will be withdrawn directly from your FM Wallet.
        </p>
      </div>

      <!-- FM Trading Account Option -->
      <div v-else>
        <BaseSelect
          v-model="selectedAccountId"
          :options="accountOptions"
          :is-loading="isAccountsSearching"
          height="44px"
          placeholder="Select a trading account"
          searchable
          rounded="lg"
          @search="onAccountSearch"
        />
        <p v-if="accountError" class="text-xs text-primary-red mt-1 font-medium">
          {{ accountError }}
        </p>
        <p v-else class="sub-text text-secondary-text mt-1.5">
          Choose the trading account you want to withdraw funds from.
        </p>
      </div>
    </div>

    <!-- Client Mode: Trading Account only -->
    <div v-else>
      <p class="mid-text font-medium text-primary-text mb-1.5">Account</p>
      <BaseSelect
        v-model="selectedAccountId"
        :options="accountOptions"
        :is-loading="isAccountsSearching"
        height="44px"
        placeholder="Select a trading account"
        searchable
        rounded="lg"
        @search="onAccountSearch"
      />
      <p v-if="accountError" class="text-xs text-primary-red mt-1 font-medium">
        {{ accountError }}
      </p>
      <p v-else class="sub-text text-secondary-text mt-1.5">
        Choose the trading account you want to withdraw funds from.
      </p>
    </div>

    <!-- Field 2: Withdrawal Payment Method Selection -->
    <div v-if="!isDemo">
      <p class="mid-text font-medium text-primary-text mb-1.5">Withdrawal Method</p>
      <BaseSelect
        v-model="selectedPaymentMethodId"
        variant="surface"
        :options="paymentMethodOptions"
        placeholder="Select a withdrawal method"
        height="44px"
        rounded="lg"
        :is-loading="isPaymentMethodsLoading"
      />
      <p v-if="paymentMethodError" class="text-xs text-primary-red mt-1 font-medium">
        {{ paymentMethodError }}
      </p>
      <p
        v-if="formattedMinPayout"
        class="text-xs text-secondary-text mt-1.5"
      >
        Min. Withdrawal Amount:
        <span class="text-primary-text font-medium">
          {{ formattedMinPayout }}
          {{ payoutCurrency }}
        </span>
      </p>
    </div>

    <!-- Demo Account Indicator -->
    <div
      v-else
      class="flex items-center gap-2.5 rounded-xl px-4 py-3 bg-card-background border border-primary-border/60 text-secondary-text text-xs sm:text-sm"
    >
      <BaseIcon name="info" :size="16" class="shrink-0 text-primary-blue" />
      <span>Demo Account selected — proceed to enter virtual withdrawal amount.</span>
    </div>

    <!-- Continue Button -->
    <div class="pt-4">
      <button
        type="button"
        @click="handleNext"
        :disabled="isCheckingWithdrawable"
        class="w-full h-12 rounded-full bg-button text-button-text font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
      >
        <BaseIcon v-if="isCheckingWithdrawable" name="sync" class="animate-spin" />
        <span>{{ isCheckingWithdrawable ? "Checking Account..." : "Continue" }}</span>
        <span v-if="!isCheckingWithdrawable" class="material-symbols-rounded text-lg">arrow_forward</span>
      </button>

      <!-- Security Guarantee -->
      <p
        class="flex items-center justify-center gap-1.5 sub-text text-primary-green mt-3.5"
      >
        <BaseIcon name="verified_user" :size="15" />
        Withdrawal requests are processed with multi-factor security verification.
      </p>
    </div>

    <!-- Settlement Required Modal -->
    <div
      v-if="showSettlementModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        class="w-full max-w-md bg-card-background border border-primary-border rounded-2xl p-6 space-y-5 shadow-xl"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0"
            >
              <BaseIcon name="account_balance_wallet" :size="20" />
            </div>
            <div>
              <h3 class="font-bold text-base text-primary-text">Settlement Required</h3>
              <p class="text-xs text-secondary-text">Account requires settlement before withdrawal</p>
            </div>
          </div>
          <button
            type="button"
            :disabled="isSettling"
            @click="showSettlementModal = false"
            class="text-secondary-text hover:text-primary-text p-1 cursor-pointer disabled:opacity-50"
          >
            <span class="material-symbols-rounded text-xl">close</span>
          </button>
        </div>

        <!-- Account Info Summary -->
        <div
          v-if="selectedAccountDisplay"
          class="flex items-center justify-between p-3 rounded-xl bg-surface border border-primary-border/60 text-xs"
        >
          <div class="space-y-0.5">
            <span class="text-secondary-text block text-[11px] uppercase tracking-wider">Trading Account</span>
            <span class="font-bold text-primary-text font-mono text-sm">#{{ selectedAccountDisplay.num }}</span>
          </div>
          <div class="text-right space-y-0.5">
            <span
              v-if="selectedAccountDisplay.tradingType"
              class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-amber-500/15 text-amber-500"
            >
              {{ selectedAccountDisplay.tradingType === 'copy_trading' ? 'Copy Trading' : selectedAccountDisplay.tradingType }}
            </span>
            <p v-if="selectedAccountDisplay.label" class="text-[11px] text-secondary-text">
              {{ selectedAccountDisplay.label }}
            </p>
          </div>
        </div>

        <!-- Explanation Message -->
        <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs leading-relaxed space-y-1">
          <div class="flex items-start gap-2">
            <BaseIcon name="info" :size="16" class="text-amber-500 shrink-0 mt-0.5" />
            <p class="text-primary-text font-medium">
              {{ settlementMessage }}
            </p>
          </div>
          <p class="text-secondary-text pl-6 text-[11px]">
            Running settlement will reconcile any open fees or profit share for this account and calculate your exact withdrawable balance.
          </p>
        </div>

        <!-- Error Feedback if any -->
        <div
          v-if="settlementError"
          class="p-3 rounded-xl bg-primary-red/10 border border-primary-red/20 text-xs text-primary-red font-medium flex items-center gap-2"
        >
          <BaseIcon name="error" :size="15" class="shrink-0" />
          <span>{{ settlementError }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3 pt-1">
          <button
            type="button"
            :disabled="isSettling"
            @click="showSettlementModal = false"
            class="h-11 px-5 rounded-full border border-primary-border text-primary-text text-sm font-semibold hover:bg-surface transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            :disabled="isSettling"
            @click="handleRunSettlement"
            class="flex-1 h-11 rounded-full bg-button text-button-text text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            <BaseIcon v-if="isSettling" name="sync" class="animate-spin" />
            <BaseIcon v-else name="autorenew" :size="18" />
            <span>{{ isSettling ? "Settling Account..." : "Run Settlement" }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
