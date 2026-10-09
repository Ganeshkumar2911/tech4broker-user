<script setup>
import { computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useDepositStore } from "@/stores/client/deposit";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import { formatPaymentAmount } from "@/utils/formatters";

const depositStore = useDepositStore();
const {
  selectedAccountId,
  selectedPaymentMethodId,
  accountOptions,
  paymentMethods,
  isPaymentMethodsLoading,
  isAccountsSearching,
  isDemo,
  selectedPaymentMethod,
} = storeToRefs(depositStore);

const formattedMinDeposit = computed(() => {
  if (!selectedPaymentMethod.value?.minimum_deposit_amount) return null;
  return formatPaymentAmount(
    selectedPaymentMethod.value.minimum_deposit_amount,
    selectedPaymentMethod.value.conversion_rate
  );
});

const route = useRoute();

// Account search debounce
let searchTimer = null;
const onAccountSearch = (query) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    depositStore.fetchAccounts(query);
  }, 300);
};

// Payment Method Options
const paymentMethodOptions = computed(() => {
  return paymentMethods.value.map((item) => ({
    label: item.wallet_label || item.name || "Payment Method",
    value: item.id,
    raw: item,
  }));
});

let routeTargetSet = false;

// Set default account if provided via route query or when accounts load
const setDefaultAccount = () => {
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

  // If no route query and only 1 account, or pre-select first if none selected
  if (!selectedAccountId.value && accountOptions.value.length > 0) {
    selectedAccountId.value = accountOptions.value[0].value;
  }
};

// Set default payment method if available
watch(
  paymentMethods,
  (methods) => {
    if (methods && methods.length > 0 && !selectedPaymentMethodId.value && !isDemo.value) {
      selectedPaymentMethodId.value = methods[0].id;
    }
  },
  { immediate: true }
);

watch(
  accountOptions,
  () => {
    setDefaultAccount();
  },
  { immediate: true }
);

onMounted(() => {
  depositStore.fetchAccounts("");
  depositStore.fetchPaymentMethods();
});

function handleNext() {
  depositStore.proceedToStep2();
}
</script>

<template>
  <div class="space-y-6 px-2 sm:px-4 lg:px-2">
    <!-- Field 1: Trading Account Selection -->
    <div>
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
      <p class="sub-text text-secondary-text mt-1.5">
        Choose the trading account you want to deposit funds into.
      </p>
    </div>

    <!-- Field 2: Payment Method Selection (Only for Live accounts) -->
    <div v-if="!isDemo">
      <p class="mid-text font-medium text-primary-text mb-1.5">Payment Method</p>
      <BaseSelect
        v-model="selectedPaymentMethodId"
        variant="surface"
        :options="paymentMethodOptions"
        placeholder="Select a payment method"
        height="44px"
        rounded="lg"
        :is-loading="isPaymentMethodsLoading"
      />
      <p
        v-if="selectedPaymentMethod?.minimum_deposit_amount"
        class="text-xs text-secondary-text mt-1.5"
      >
        Min. Deposit Amount:
        <span class="text-primary-text font-medium">
          {{ formattedMinDeposit }}
          {{ selectedPaymentMethod.conversion_rate?.payment_currency || "USD" }}
        </span>
      </p>
    </div>

    <!-- Demo Account Indicator -->
    <div
      v-else
      class="flex items-center gap-2.5 rounded-xl px-4 py-3 bg-card-background border border-primary-border/60 text-secondary-text text-xs sm:text-sm"
    >
      <BaseIcon name="info" :size="16" class="shrink-0 text-primary-blue" />
      <span>Demo Account selected — proceed to enter virtual deposit amount.</span>
    </div>

    <!-- Continue Button -->
    <div class="pt-4">
      <button
        type="button"
        @click="handleNext"
        class="w-full h-12 rounded-full bg-button text-button-text font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
      >
        <span>Continue</span>
        <span class="material-symbols-rounded text-lg">arrow_forward</span>
      </button>

      <!-- Security Guarantee -->
      <p
        class="flex items-center justify-center gap-1.5 sub-text text-primary-green mt-3.5"
      >
        <BaseIcon name="verified_user" :size="15" />
        Your payment information is 100% secure and encrypted.
      </p>
    </div>
  </div>
</template>
