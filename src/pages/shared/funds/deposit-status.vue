<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import BaseIcon from "@/components/base/BaseIcon.vue";
import { useTradingAccountsStore } from "@/stores/client/tradingAccounts";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import apiRequest from "@/api/request";
import urls from "@/api/urls";

const route = useRoute();
const router = useRouter();
const tradingAccountsStore = useTradingAccountsStore();
const snackbar = useSnackbarStore();

const isLoading = ref(true);
const syncResult = ref(null);
const syncError = ref("");

onMounted(async () => {
  const paymentId =
    route.query.payment_id ||
    route.query.gateway_payment_id ||
    route.query.session_id ||
    route.query.token;

  if (paymentId) {
    verifyPaymaxisSync(String(paymentId));
  } else {
    // Fallback if redirected with status query params directly
    const statusParam = route.query.deposit_status;
    if (statusParam === "success") {
      syncResult.value = {
        status: "success",
        message: "Your deposit was completed successfully.",
      };
      tradingAccountsStore.fetchAccounts();
    } else if (statusParam === "cancelled") {
      syncError.value = "The deposit transaction was cancelled.";
    } else if (statusParam === "failed") {
      syncError.value = "The deposit transaction failed.";
    } else {
      syncResult.value = {
        status: "success",
        message: "Payment processed.",
      };
    }
    isLoading.value = false;
  }
});

function verifyPaymaxisSync(paymentId) {
  isLoading.value = true;
  syncError.value = "";

  apiRequest(urls.KEYS.POST, urls.wallet.paymaxisSync, {
    data: { payment_id: paymentId },
    isTokenRequired: true,
    onSuccess: (res) => {
      isLoading.value = false;
      syncResult.value = res?.data || { status: "success" };
      snackbar.show("Deposit verified and updated successfully!", "success");
      // Refresh trading accounts balance
      tradingAccountsStore.fetchAccounts();
    },
    onFailure: (err) => {
      isLoading.value = false;
      const msg = err?.message || err?.error || "Failed to verify transaction.";
      syncError.value = msg;
      snackbar.show(msg, "error");
    },
  });
}
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center p-4">
    <div
      class="w-full max-w-md bg-card-background rounded-3xl p-6 sm:p-8 text-center space-y-6 border-0 shadow-none"
    >
      <!-- Loading State -->
      <div v-if="isLoading" class="py-8 space-y-4">
        <BaseIcon name="sync" :size="48" class="animate-spin text-primary mx-auto" />
        <h2 class="text-xl font-bold text-primary-text">Verifying Payment...</h2>
        <p class="text-sm text-secondary-text">
          Please wait while we confirm your deposit with the payment gateway.
        </p>
      </div>

      <!-- Success State -->
      <div v-else-if="syncResult && !syncError" class="space-y-6">
        <div
          class="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto"
        >
          <span class="material-symbols-rounded text-5xl">check_circle</span>
        </div>

        <div class="space-y-1.5">
          <h2 class="text-2xl font-bold text-primary-text">Deposit Successful!</h2>
          <p class="text-sm text-secondary-text">
            Your funds have been credited to your trading account.
          </p>
        </div>

        <!-- Transaction Details Box -->
        <div
          v-if="syncResult.amount || syncResult.transaction_id || syncResult.payment_id"
          class="rounded-2xl bg-background border border-primary-border/70 p-4 space-y-2.5 text-left text-xs"
        >
          <div v-if="syncResult.amount" class="flex justify-between">
            <span class="text-secondary-text">Amount Deposited:</span>
            <span class="font-bold text-primary-green">
              {{ syncResult.amount }} {{ syncResult.currency || "USD" }}
            </span>
          </div>

          <div v-if="syncResult.account_id" class="flex justify-between">
            <span class="text-secondary-text">Trading Account:</span>
            <span class="font-medium text-primary-text font-mono">
              #{{ syncResult.account_id }}
            </span>
          </div>

          <div v-if="syncResult.transaction_id" class="flex justify-between">
            <span class="text-secondary-text">Transaction ID:</span>
            <span class="font-medium text-primary-text font-mono">
              {{ syncResult.transaction_id }}
            </span>
          </div>

          <div v-if="syncResult.payment_id" class="flex justify-between">
            <span class="text-secondary-text">Gateway Payment ID:</span>
            <span class="font-medium text-primary-text font-mono truncate max-w-[180px]">
              {{ syncResult.payment_id }}
            </span>
          </div>
        </div>

        <div class="pt-2 flex flex-col gap-3">
          <button
            @click="router.push('/trading-accounts')"
            class="w-full h-12 rounded-full bg-button text-button-text font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Go to Trading Accounts
          </button>
          <button
            @click="router.push('/funds?tab=deposit')"
            class="w-full h-12 rounded-full border border-primary-border text-primary-text font-semibold hover:bg-background transition-colors cursor-pointer"
          >
            Deposit Again
          </button>
        </div>
      </div>

      <!-- Failed / Error State -->
      <div v-else class="space-y-6">
        <div
          class="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto"
        >
          <span class="material-symbols-rounded text-5xl">cancel</span>
        </div>

        <div class="space-y-1.5">
          <h2 class="text-2xl font-bold text-primary-text">Deposit Failed</h2>
          <p class="text-sm text-secondary-text">
            {{ syncError || "We could not complete your payment transaction." }}
          </p>
        </div>

        <div class="pt-2 flex flex-col gap-3">
          <button
            @click="router.push('/funds?tab=deposit')"
            class="w-full h-12 rounded-full bg-button text-button-text font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Try Again
          </button>
          <button
            @click="router.push('/dashboard')"
            class="w-full h-12 rounded-full border border-primary-border text-primary-text font-semibold hover:bg-background transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
