<script setup>
import { computed, ref, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { useWithdrawStore } from "@/stores/client/withdraw";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import QuickAmountChips from "@/components/base/QuickAmountChips.vue";
import {
  getCryptoIconUrl,
  getCryptoLocalSvg,
  getCryptoBrandStyle,
  getCryptoCoinTag,
} from "@/utils/cryptoIcons";

const failedCryptoImages = ref(new Set());
function onCryptoImageError(id) {
  if (id) failedCryptoImages.value.add(id);
}



import { useProfileStore } from "@/stores/shared/profile";

const withdrawStore = useWithdrawStore();
const snackbar = useSnackbarStore();
const profileStore = useProfileStore();

const fieldErrors = ref({});

function clearFieldError(key) {
  if (fieldErrors.value[key]) {
    delete fieldErrors.value[key];
  }
}

const {
  amount,
  walletAddress,
  selectedCryptoMethod,
  dynamicFormValues,
  isSubmitting,
  showOtpModal,
  otpCode,
  otpLoading,
  otpResendCountdown,
  selectedAccount,
  isCentAccount,
  accountCurrency,
  withdrawableBalance,
  selectedPaymentMethod,
  isCryptoMethod,
  paymentCurrency,
  cryptoOptions,
  dynamicFields,
  convertedUsd,
  convertedPaymentAmount,
  conversionInfo,
  displayConversionRate,
  isBankTransferMethod,
  userBankAccounts,
  selectedUserBankAccountId,
  isBankAccountsLoading,
  isDemo,
  withdrawableDetails,
} = storeToRefs(withdrawStore);

const isIb = computed(() => profileStore.activeRole === "ib");
const isFm = computed(() => profileStore.activeRole === "fm");

const isWallet = computed(() => {
  return isIb.value || (isFm.value && withdrawStore.sourceType === "wallet");
});

const accountNumberDisplay = computed(() => {
  if (isIb.value) return "IB Wallet";
  if (isFm.value && withdrawStore.sourceType === "wallet") return "FM Wallet";
  const acc = selectedAccount.value;
  if (!acc) return "N/A";
  const num =
    acc.account?.account_number || acc.account_number || acc.login || acc.id || "";
  return num ? `#${num}` : "N/A";
});

const accountTypeDisplay = computed(() => {
  if (isWallet.value) return "Wallet";
  const acc = selectedAccount.value;
  if (!acc) return "";
  return acc.account?.account_type || acc.account_type || acc.type || "";
});

const formattedBalance = computed(() => {
  const bal = withdrawableBalance.value;
  if (isCentAccount.value) {
    return `${Number(bal).toLocaleString("en-US")} USC`;
  }
  return `$${Number(bal).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD`;
});

function selectCryptoToken(option) {
  selectedCryptoMethod.value = option;
  clearFieldError("crypto");
}

function isCryptoOptionSelected(option) {
  if (!selectedCryptoMethod.value || !option) return false;
  if (option.id && selectedCryptoMethod.value.id) {
    return option.id === selectedCryptoMethod.value.id;
  }
  if (option.name && selectedCryptoMethod.value.name) {
    return option.name === selectedCryptoMethod.value.name;
  }
  return selectedCryptoMethod.value === option;
}

function handleBack() {
  withdrawStore.currentStep = 1;
}

function validateAndScroll() {
  fieldErrors.value = {};

  if (!isDemo.value && !selectedPaymentMethod.value) {
    snackbar.show("Please select a payment method.", "error");
    return false;
  }

  const amtNum = Number(amount.value || 0);

  if (isDemo.value) {
    if (!amtNum || amtNum <= 0) {
      fieldErrors.value.amount = "Please enter a valid withdrawal amount.";
      snackbar.show("Please enter a valid withdrawal amount.", "error");
      nextTick(() => {
        const el = document.getElementById("withdraw-field-amount");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      });
      return false;
    }
    if (amtNum > withdrawableBalance.value) {
      fieldErrors.value.amount = `Amount exceeds your available balance (${withdrawableBalance.value} ${accountCurrency.value}).`;
      snackbar.show(fieldErrors.value.amount, "error");
      nextTick(() => {
        const el = document.getElementById("withdraw-field-amount");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      });
      return false;
    }
    return true;
  }

  if (isCryptoMethod.value) {
    if (!selectedCryptoMethod.value) {
      fieldErrors.value.crypto = "Please select a cryptocurrency.";
      snackbar.show("Please select a crypto token & network.", "error");
      nextTick(() => {
        const el = document.getElementById("withdraw-crypto-section");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return false;
    }

    if (!walletAddress.value || !walletAddress.value.trim()) {
      fieldErrors.value.wallet_address = "Please enter your destination wallet address.";
      snackbar.show("Please enter your destination wallet address.", "error");
      nextTick(() => {
        const el = document.getElementById("withdraw-field-wallet_address");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      });
      return false;
    }

    if (!amtNum || amtNum <= 0) {
      fieldErrors.value.amount = "Please enter a valid withdrawal amount.";
      snackbar.show("Please enter a valid withdrawal amount.", "error");
      nextTick(() => {
        const el = document.getElementById("withdraw-field-amount");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      });
      return false;
    }

    if (amtNum > withdrawableBalance.value) {
      fieldErrors.value.amount = `Amount exceeds your available balance (${withdrawableBalance.value} ${accountCurrency.value}).`;
      snackbar.show(fieldErrors.value.amount, "error");
      nextTick(() => {
        const el = document.getElementById("withdraw-field-amount");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      });
      return false;
    }

    return true;
  }

  // Bank Transfer with saved accounts
  if (isBankTransferMethod.value && userBankAccounts.value.length > 0) {
    if (!amtNum || amtNum <= 0) {
      fieldErrors.value.amount = "Please enter a valid withdrawal amount.";
      snackbar.show("Please enter a valid withdrawal amount.", "error");
      nextTick(() => {
        const el = document.getElementById("withdraw-field-amount");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      });
      return false;
    }

    if (amtNum > withdrawableBalance.value) {
      fieldErrors.value.amount = `Amount exceeds your available balance (${withdrawableBalance.value} ${accountCurrency.value}).`;
      snackbar.show(fieldErrors.value.amount, "error");
      nextTick(() => {
        const el = document.getElementById("withdraw-field-amount");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      });
      return false;
    }

    if (!selectedUserBankAccountId.value) {
      fieldErrors.value.bank_account = "Please select a destination bank account.";
      snackbar.show("Please select a bank account.", "error");
      return false;
    }

    return true;
  }

  // Dynamic PayMaxis / Fiat / Bank Transfer without saved accounts
  if (!amtNum || amtNum <= 0) {
    fieldErrors.value.amount = "Please enter a valid withdrawal amount.";
    snackbar.show("Please enter a valid withdrawal amount.", "error");
    nextTick(() => {
      const el = document.getElementById("withdraw-field-amount");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
    });
    return false;
  }

  if (amtNum > withdrawableBalance.value) {
    fieldErrors.value.amount = `Amount exceeds your available balance (${withdrawableBalance.value} ${accountCurrency.value}).`;
    snackbar.show(fieldErrors.value.amount, "error");
    nextTick(() => {
      const el = document.getElementById("withdraw-field-amount");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
    });
    return false;
  }

  for (const field of dynamicFields.value) {
    if (field.required && field.key !== "amount") {
      const val = dynamicFormValues.value[field.key];
      if (val === undefined || val === null || String(val).trim() === "") {
        const msg = `Please enter ${field.label || field.key}.`;
        fieldErrors.value[field.key] = msg;
        snackbar.show(msg, "error");
        nextTick(() => {
          const el = document.getElementById(`withdraw-field-${field.key}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          const input = el?.tagName === "INPUT" ? el : el?.querySelector("input");
          input?.focus();
        });
        return false;
      }
    }
  }

  return true;
}

function handleRequestWithdrawal() {
  if (!validateAndScroll()) return;
  
  if (isDemo.value) {
    withdrawStore.submitDemoWithdrawal();
  } else {
    withdrawStore.requestWithdrawalOtp();
  }
}

function handleVerifyOtp() {
  withdrawStore.verifyOtpAndExecute();
}

function handleResendOtp() {
  if (otpResendCountdown.value > 0) return;
  withdrawStore.requestWithdrawalOtp();
}
</script>

<template>
  <div class="space-y-6 px-2 sm:px-4 lg:px-2">
    <!-- Selected Account & Method Header Summary -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-card-background border border-primary-border/60 text-xs sm:text-sm"
    >
      <!-- Trading Account -->
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-lg bg-background border border-primary-border flex items-center justify-center text-secondary-text shrink-0"
        >
          <BaseIcon name="account_balance_wallet" :size="18" />
        </div>
        <div class="min-w-0">
          <p class="text-[11px] text-secondary-text uppercase tracking-wider">
            {{ isWallet ? "Withdrawal Source" : "Trading Account" }}
          </p>
          <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span class="font-semibold text-primary-text font-mono">
              {{ accountNumberDisplay }}
            </span>
            <span
              v-if="accountTypeDisplay"
              class="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider bg-primary-green/15 text-primary-green"
            >
              {{ accountTypeDisplay }}
            </span>
            <span class="text-xs text-secondary-text font-mono">
              ({{ accountCurrency }})
            </span>
          </div>
        </div>
      </div>

      <!-- Withdrawal Payment Method -->
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-lg bg-background border border-primary-border flex items-center justify-center text-secondary-text shrink-0"
        >
          <BaseIcon
            :name="
              isDemo ? 'smart_toy' :
              isCryptoMethod ? 'currency_bitcoin' : (isBankTransferMethod ? 'account_balance' : 'payments')
            "
            :size="18"
          />
        </div>
        <div class="min-w-0">
          <p class="text-[11px] text-secondary-text uppercase tracking-wider">Withdrawal Method</p>
          <p class="font-semibold text-primary-text truncate mt-0.5">
            {{
              isDemo
                ? "Demo Virtual Withdrawal"
                : selectedPaymentMethod?.wallet_label || selectedPaymentMethod?.name || "Withdrawal Method"
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Available Withdrawable Balance Callout -->
    <div
      class="flex items-center justify-between p-3.5 rounded-xl bg-background border border-primary-border"
    >
      <div class="flex items-center gap-2">
        <BaseIcon name="account_balance" :size="16" class="text-secondary-text" />
        <span class="text-xs text-secondary-text">Available Withdrawable Balance:</span>
      </div>
      <span class="font-bold text-sm text-primary-text font-mono">
        {{ formattedBalance }}
      </span>
    </div>

    <!-- Balance & Margin Breakdown Details (when copy trading/margin is active) -->
    <div
      v-if="withdrawableDetails && (withdrawableDetails.margin_used > 0 || withdrawableDetails.floating_pnl)"
      class="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-lg bg-surface/60 border border-primary-border/40 text-[11px] text-secondary-text"
    >
      <div class="flex items-center gap-1.5">
        <span>Total Balance:</span>
        <span class="font-semibold text-primary-text font-mono">${{ Number(withdrawableDetails.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
      </div>
      <div v-if="withdrawableDetails.margin_used" class="flex items-center gap-1.5">
        <span>Margin Used:</span>
        <span class="font-semibold text-primary-red font-mono">-${{ Number(withdrawableDetails.margin_used || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
      </div>
      <div v-if="withdrawableDetails.floating_pnl" class="flex items-center gap-1.5">
        <span>Floating P&L:</span>
        <span
          class="font-semibold font-mono"
          :class="Number(withdrawableDetails.floating_pnl) >= 0 ? 'text-primary-green' : 'text-primary-red'"
        >
          {{ Number(withdrawableDetails.floating_pnl) >= 0 ? '+' : '' }}${{ Number(withdrawableDetails.floating_pnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </span>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- CASE 1: DEMO VIRTUAL WITHDRAWAL -->
    <!-- ========================================================================= -->
    <div v-if="isDemo" class="space-y-4">
      <div class="flex items-center justify-between">
        <label
          for="withdraw-field-amount"
          class="mid-text font-medium text-primary-text"
        >
          Virtual Withdrawal Amount
          <span class="text-primary-red">*</span>
        </label>
      </div>
      <div class="relative">
        <input
          id="withdraw-field-amount"
          v-model="amount"
          type="number"
          step="any"
          placeholder="Enter virtual amount"
          class="w-full h-12 bg-background border rounded-lg px-4 text-primary-text placeholder:text-secondary-text/50 focus:outline-none transition-colors duration-200"
          :class="
            fieldErrors.amount
              ? 'border-primary-red focus:border-primary-red'
              : 'border-primary-border focus:border-primary'
          "
        />
        <div
          class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none"
        >
          <span class="text-secondary-text font-medium">{{ accountCurrency }}</span>
        </div>
      </div>
      <p v-if="fieldErrors.amount" class="text-xs text-primary-red mt-1">
        {{ fieldErrors.amount }}
      </p>
    </div>

    <!-- ========================================================================= -->
    <!-- CASE 2: CRYPTO WITHDRAWAL (Coinsbuy)                                      -->
    <!-- ========================================================================= -->
    <div v-else-if="isCryptoMethod" id="withdraw-crypto-section" class="space-y-4">
      <div>
        <p class="mid-text font-medium text-primary-text mb-1">
          Select Crypto Token & Network
        </p>
        <p class="sub-text text-secondary-text">
          Choose the cryptocurrency and blockchain network for your withdrawal destination.
        </p>
        <p v-if="fieldErrors.crypto" class="text-xs text-primary-red mt-1">
          {{ fieldErrors.crypto }}
        </p>
      </div>

      <!-- Token / Network Cards List -->
      <div
        v-if="cryptoOptions.length > 0"
        class="space-y-2.5"
      >
        <div
          v-for="method in cryptoOptions"
          :key="method.id || method.name || method.alias"
          @click="selectCryptoToken(method)"
          class="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl transition-all cursor-pointer border"
          :class="
            isCryptoOptionSelected(method)
              ? 'bg-card-background border-primary-text shadow-xs'
              : fieldErrors.crypto
              ? 'bg-background border-primary-red/50 hover:bg-card-background/60'
              : 'bg-background border-primary-border/70 hover:bg-card-background/60'
          "
        >
          <div class="flex items-center gap-3.5">
            <!-- Crypto Coin Logo Container -->
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-card-background border border-primary-border/30 relative"
            >
              <!-- Full-Color Official Coin Image (CoinCap CDN / API Logo) -->
              <img
                v-if="!failedCryptoImages.has(method.id || method.name || method.coin)"
                :src="getCryptoIconUrl(method)"
                :alt="method.name || 'Crypto'"
                class="w-full h-full object-cover"
                @error="onCryptoImageError(method.id || method.name || method.coin)"
              />
              <!-- Local Vector SVG with Official Brand Color Badge Fallback -->
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
                :style="getCryptoBrandStyle(method)"
              >
                <img
                  :src="getCryptoLocalSvg(method)"
                  :alt="method.name || 'Crypto'"
                  class="w-5 h-5 object-contain filter invert brightness-200"
                />
              </div>
            </div>







            <!-- Token Details -->
            <div>
              <div class="flex items-center gap-2">
                <span class="font-semibold text-sm sm:text-base text-primary-text">
                  {{ method.name || method.alias || method.coin }}
                </span>
                <span
                  v-if="getCryptoCoinTag(method)"
                  class="px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-md bg-secondary-text/10 text-secondary-text border border-secondary-text/20 uppercase tracking-wide shrink-0"
                >
                  {{ getCryptoCoinTag(method) }}
                </span>
              </div>
              <span v-if="method.network" class="text-xs text-secondary-text block mt-0.5">
                Network: <span class="text-primary-text font-medium">{{ method.network }}</span>
              </span>
            </div>
          </div>

          <!-- Radio Indicator -->
          <div
            class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
            :class="
              isCryptoOptionSelected(method)
                ? 'border-primary-text'
                : 'border-primary-border'
            "
          >
            <div
              v-if="isCryptoOptionSelected(method)"
              class="w-2.5 h-2.5 rounded-full bg-primary-text"
            ></div>
          </div>
        </div>
      </div>

      <!-- Destination Wallet Address Field -->
      <div class="space-y-1.5 pt-2">
        <label class="mid-text font-medium text-primary-text">
          Destination Wallet Address <span class="text-primary-red">*</span>
        </label>
        <input
          id="withdraw-field-wallet_address"
          v-model="walletAddress"
          type="text"
          :placeholder="`Enter your ${selectedCryptoMethod?.network || 'crypto'} recipient wallet address`"
          class="w-full h-11 rounded-lg border bg-background px-4 outline-none text-sm text-primary-text placeholder:text-secondary-text/50 font-mono transition-colors"
          :class="
            fieldErrors.wallet_address
              ? 'border-primary-red focus:border-primary-red ring-1 ring-primary-red/20'
              : 'border-primary-border focus:border-primary-text'
          "
          @input="clearFieldError('wallet_address')"
        />
        <p v-if="fieldErrors.wallet_address" class="text-xs text-primary-red mt-1">
          {{ fieldErrors.wallet_address }}
        </p>
      </div>

      <!-- Withdrawal Amount Field (USC vs USD aware) -->
      <div class="space-y-1.5 pt-1">
        <div class="flex items-center justify-between">
          <label class="mid-text font-medium text-primary-text">
            Withdrawal Amount (in {{ isCentAccount ? 'USC / Cents' : 'USD ($)' }})
            <span class="text-primary-red">*</span>
          </label>
          <span
            v-if="convertedUsd"
            class="text-xs font-semibold text-primary-green px-2 py-0.5 rounded-md bg-primary-green/10"
          >
            ≈ ${{ convertedUsd }} USD
          </span>
        </div>

        <div class="relative">
          <input
            id="withdraw-field-amount"
            v-model="amount"
            type="number"
            step="any"
            :placeholder="isCentAccount ? 'Enter amount in USC (e.g. 5000)' : 'Enter amount in USD (e.g. 50)'"
            class="w-full h-11 rounded-lg border bg-background px-4 pr-16 outline-none text-sm text-primary-text placeholder:text-secondary-text/50 font-mono transition-colors"
            :class="
              fieldErrors.amount
                ? 'border-primary-red focus:border-primary-red ring-1 ring-primary-red/20'
                : 'border-primary-border focus:border-primary-text'
            "
            @input="clearFieldError('amount')"
          />
          <span
            class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary-text"
          >
            {{ isCentAccount ? 'USC' : 'USD' }}
          </span>
        </div>

        <!-- Quick Amount Chips -->
        <QuickAmountChips
          :model-value="amount"
          :amounts="isCentAccount ? [1000, 5000, 10000, 50000] : [20, 50, 100, 500]"
          :currency="isCentAccount ? 'USC' : 'USD'"
          @select="(val) => { amount = val; clearFieldError('amount'); }"
        />

        <p v-if="fieldErrors.amount" class="text-xs text-primary-red mt-1">
          {{ fieldErrors.amount }}
        </p>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- CASE 2: BANK TRANSFER                                                     -->
    <!-- ========================================================================= -->
    <div v-else-if="isBankTransferMethod" class="space-y-4">
      <template v-if="userBankAccounts.length > 0">
      <!-- Amount Field -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="mid-text font-medium text-primary-text">
            Withdrawal Amount <span class="text-primary-red">*</span>
          </label>
          <span
            v-if="convertedPaymentAmount"
            class="text-xs font-semibold text-primary-green px-2 py-0.5 rounded-md bg-primary-green/10"
          >
            ≈ {{ convertedPaymentAmount }} {{ paymentCurrency }}
          </span>
        </div>

        <div class="relative">
          <input
            id="withdraw-field-amount"
            v-model="amount"
            type="number"
            step="any"
            :placeholder="`Enter amount in ${accountCurrency}`"
            class="w-full h-11 rounded-lg border bg-background px-4 pr-16 outline-none text-sm text-primary-text placeholder:text-secondary-text/50 font-mono transition-colors"
            :class="
              fieldErrors.amount
                ? 'border-primary-red focus:border-primary-red ring-1 ring-primary-red/20'
                : 'border-primary-border focus:border-primary-text'
            "
            @input="clearFieldError('amount')"
          />
          <span
            class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary-text"
          >
            {{ accountCurrency }}
          </span>
        </div>

        <!-- Quick Amount Chips -->
        <QuickAmountChips
          :model-value="amount"
          :amounts="[50, 100, 200, 500]"
          :currency="accountCurrency"
          @select="(val) => { amount = val; clearFieldError('amount'); }"
        />

        <!-- Conversion Info: You will receive -->
        <div
          v-if="convertedPaymentAmount && paymentCurrency !== accountCurrency"
          class="flex items-center justify-between rounded-lg bg-primary-green/5 border border-primary-green/15 px-3.5 py-2.5"
        >
          <div class="flex items-center gap-2 text-xs text-secondary-text">
            <BaseIcon name="currency_exchange" :size="15" class="text-primary-green" />
            <span>
              1 {{ accountCurrency }} = {{ displayConversionRate }} {{ paymentCurrency }}
            </span>
          </div>
          <span class="text-sm font-bold text-primary-green font-mono">
            ≈ {{ Number(convertedPaymentAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} {{ paymentCurrency }}
          </span>
        </div>

        <p v-if="fieldErrors.amount" class="text-xs text-primary-red mt-1">
          {{ fieldErrors.amount }}
        </p>
      </div>

      <!-- Select Receiving Bank Account -->
      <div class="space-y-2 pt-2">
        <div class="flex items-center justify-between">
          <label class="mid-text font-medium text-primary-text">
            Receiving Bank Account <span class="text-primary-red">*</span>
          </label>
          <span class="text-xs text-secondary-text">
            {{ userBankAccounts.length }} saved account{{ userBankAccounts.length > 1 ? 's' : '' }}
          </span>
        </div>
        <p class="sub-text text-secondary-text">
          Funds will be transferred to your selected verified bank account.
        </p>

        <p v-if="fieldErrors.bank_account" class="text-xs text-primary-red mt-1">
          {{ fieldErrors.bank_account }}
        </p>

        <!-- Bank Account Cards -->
        <div class="space-y-2.5">
          <div
            v-for="acc in userBankAccounts"
            :key="acc.id"
            @click="selectedUserBankAccountId = acc.id; clearFieldError('bank_account');"
            class="w-full p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4"
            :class="
              selectedUserBankAccountId === acc.id
                ? 'bg-card-background border-primary-text shadow-xs'
                : 'bg-background border-primary-border/70 hover:bg-card-background/60'
            "
          >
            <div class="flex items-start gap-3.5 min-w-0">
              <div
                class="w-10 h-10 rounded-xl bg-primary-border/40 text-primary-text flex items-center justify-center shrink-0 mt-0.5"
              >
                <BaseIcon name="account_balance" :size="20" />
              </div>
              <div class="min-w-0 space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-sm text-primary-text">
                    {{ acc.bank || "Bank" }}
                  </span>
                  <span
                    v-if="acc.account_type"
                    class="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider bg-surface border border-primary-border text-secondary-text"
                  >
                    {{ acc.account_type }}
                  </span>
                  <span
                    v-if="acc.is_default"
                    class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary-green/15 text-primary-green"
                  >
                    Default
                  </span>
                </div>
                <p class="text-xs text-secondary-text">
                  Holder: <span class="text-primary-text font-medium">{{ acc.account_name }}</span>
                </p>
                <div class="flex items-center gap-3 text-xs text-secondary-text font-mono flex-wrap">
                  <span>A/C: <span class="text-primary-text font-semibold">{{ acc.account_number }}</span></span>
                  <span v-if="acc.bank_branch_code || acc.bank_branch">
                    IFSC/Code: <span class="text-primary-text font-semibold">{{ acc.bank_branch_code || acc.bank_branch }}</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Radio Selection Circle -->
            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
              :class="
                selectedUserBankAccountId === acc.id
                  ? 'border-primary-text'
                  : 'border-primary-border'
              "
            >
              <div
                v-if="selectedUserBankAccountId === acc.id"
                class="w-2.5 h-2.5 rounded-full bg-primary-text"
              ></div>
            </div>
          </div>
        </div>
      </div>
      </template>

      <!-- No Saved Bank Accounts Fallback -->
      <template v-else>
        <div class="p-8 rounded-xl border border-primary-border bg-background text-center flex flex-col items-center justify-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-primary-border/30 flex items-center justify-center text-secondary-text mb-2">
            <BaseIcon name="account_balance" :size="32" />
          </div>
          <h3 class="text-lg font-semibold text-primary-text">No Bank Accounts Found</h3>
          <p class="text-sm text-secondary-text max-w-sm mx-auto leading-relaxed">
            Please add a bank account from your profile and wait for admin approval before you can withdraw via Bank Transfer.
          </p>
          <router-link
            to="/profile#bank-accounts-card"
            class="mt-2 px-6 py-2.5 rounded-lg bg-button text-button-text font-semibold text-sm transition-all hover:brightness-110 active:scale-95 flex items-center gap-2 shadow-md"
          >
            <BaseIcon name="person" :size="18" />
            Go to Profile
          </router-link>
        </div>
      </template>
    </div>

    <!-- ========================================================================= -->
    <!-- CASE 3: DYNAMIC PAYMAXIS / FIAT / OTHER METHODS                           -->
    <!-- ========================================================================= -->
    <div v-else class="space-y-4">
      <!-- Amount Field -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="mid-text font-medium text-primary-text">
            Withdrawal Amount <span class="text-primary-red">*</span>
          </label>
          <span
            v-if="convertedPaymentAmount"
            class="text-xs font-semibold text-primary-green px-2 py-0.5 rounded-md bg-primary-green/10"
          >
            ≈ {{ convertedPaymentAmount }} {{ paymentCurrency }}
          </span>
        </div>

        <div class="relative">
          <input
            id="withdraw-field-amount"
            v-model="amount"
            type="number"
            step="any"
            :placeholder="`Enter amount in ${accountCurrency}`"
            class="w-full h-11 rounded-lg border bg-background px-4 pr-16 outline-none text-sm text-primary-text placeholder:text-secondary-text/50 font-mono transition-colors"
            :class="
              fieldErrors.amount
                ? 'border-primary-red focus:border-primary-red ring-1 ring-primary-red/20'
                : 'border-primary-border focus:border-primary-text'
            "
            @input="clearFieldError('amount')"
          />
          <span
            class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary-text"
          >
            {{ accountCurrency }}
          </span>
        </div>

        <!-- Quick Amount Chips -->
        <QuickAmountChips
          :model-value="amount"
          :amounts="[50, 100, 200, 500]"
          :currency="accountCurrency"
          @select="(val) => { amount = val; clearFieldError('amount'); }"
        />

        <!-- Conversion Info: You will receive -->
        <div
          v-if="convertedPaymentAmount && paymentCurrency !== accountCurrency"
          class="flex items-center justify-between rounded-lg bg-primary-green/5 border border-primary-green/15 px-3.5 py-2.5"
        >
          <div class="flex items-center gap-2 text-xs text-secondary-text">
            <BaseIcon name="currency_exchange" :size="15" class="text-primary-green" />
            <span>
              1 {{ accountCurrency }} = {{ displayConversionRate }} {{ paymentCurrency }}
            </span>
          </div>
          <span class="text-sm font-bold text-primary-green font-mono">
            ≈ {{ Number(convertedPaymentAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} {{ paymentCurrency }}
          </span>
        </div>

        <p v-if="fieldErrors.amount" class="text-xs text-primary-red mt-1">
          {{ fieldErrors.amount }}
        </p>
      </div>

      <!-- Dynamic Meta fields (e.g. account_number, account_holder_name, ifsc_code, bank_name) -->
      <div
        v-for="field in dynamicFields"
        :key="field.key"
        class="space-y-1.5"
      >
        <label class="mid-text font-medium text-primary-text">
          {{ field.label || field.key }}
          <span v-if="field.required" class="text-primary-red">*</span>
        </label>

        <!-- Select -->
        <div v-if="field.type === 'select'" :id="`withdraw-field-${field.key}`">
          <BaseSelect
            v-model="dynamicFormValues[field.key]"
            :options="field.options || []"
            :placeholder="field.placeholder || `Select ${field.label || field.key}`"
            height="44px"
            rounded="lg"
            @change="clearFieldError(field.key)"
          />
        </div>

        <!-- Number input -->
        <div v-else-if="field.type === 'number'">
          <input
            :id="`withdraw-field-${field.key}`"
            v-model="dynamicFormValues[field.key]"
            type="number"
            :placeholder="field.placeholder || `Enter ${field.label || field.key}`"
            class="w-full h-11 rounded-lg border bg-background px-4 outline-none text-sm text-primary-text placeholder:text-secondary-text/50 font-mono transition-colors"
            :class="
              fieldErrors[field.key]
                ? 'border-primary-red focus:border-primary-red ring-1 ring-primary-red/20'
                : 'border-primary-border focus:border-primary-text'
            "
            @input="clearFieldError(field.key)"
          />
        </div>

        <!-- Text input -->
        <div v-else>
          <input
            :id="`withdraw-field-${field.key}`"
            v-model="dynamicFormValues[field.key]"
            type="text"
            :placeholder="field.placeholder || `Enter ${field.label || field.key}`"
            class="w-full h-11 rounded-lg border bg-background px-4 outline-none text-sm text-primary-text placeholder:text-secondary-text/50 transition-colors"
            :class="
              fieldErrors[field.key]
                ? 'border-primary-red focus:border-primary-red ring-1 ring-primary-red/20'
                : 'border-primary-border focus:border-primary-text'
            "
            @input="clearFieldError(field.key)"
          />
        </div>

        <p v-if="fieldErrors[field.key]" class="text-xs text-primary-red mt-1">
          {{ fieldErrors[field.key] }}
        </p>
      </div>
    </div>

    <!-- Security Note -->
    <div
      class="flex items-start gap-2.5 rounded-xl px-4 py-3 bg-primary-blue/10 text-primary-blue"
    >
      <BaseIcon name="info" :size="16" class="shrink-0 mt-0.5" />
      <p class="sub-text leading-relaxed">
        An email OTP verification code will be sent to your registered email upon submitting your request.
      </p>
    </div>

    <!-- Navigation Buttons -->
    <div class="pt-4 flex items-center gap-3">
      <!-- Back Button -->
      <button
        type="button"
        @click="handleBack"
        class="h-12 px-6 rounded-full border border-primary-border text-primary-text font-semibold hover:bg-card-background transition-colors cursor-pointer"
      >
        Back
      </button>

      <button
        v-if="!(isBankTransferMethod && userBankAccounts.length === 0)"
        type="button"
        @click="handleRequestWithdrawal"
        :disabled="isSubmitting"
        class="flex-1 h-12 rounded-full bg-button text-button-text font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
      >
        <BaseIcon v-if="isSubmitting" name="sync" class="animate-spin" />
        <span v-else class="material-symbols-rounded text-lg">lock</span>
        <span>{{ isSubmitting ? "Sending OTP..." : "Request Withdrawal" }}</span>
      </button>
    </div>

    <!-- OTP Verification Modal -->
    <div
      v-if="showOtpModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        class="w-full max-w-md bg-card-background border border-primary-border rounded-2xl p-6 space-y-5 shadow-lg"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div
              class="w-9 h-9 rounded-full bg-primary-blue/15 text-primary-blue flex items-center justify-center shrink-0"
            >
              <BaseIcon name="mark_email_read" :size="20" />
            </div>
            <div>
              <h3 class="font-bold text-base text-primary-text">Verify Withdrawal</h3>
              <p class="text-xs text-secondary-text">Enter the 6-digit OTP sent to your email</p>
            </div>
          </div>
          <button
            type="button"
            @click="showOtpModal = false"
            class="text-secondary-text hover:text-primary-text p-1 cursor-pointer"
          >
            <span class="material-symbols-rounded text-xl">close</span>
          </button>
        </div>

        <div class="space-y-2">
          <input
            v-model="otpCode"
            type="text"
            maxlength="6"
            placeholder="Enter 6-digit OTP"
            class="w-full h-12 text-center tracking-[0.4em] font-mono text-lg font-bold rounded-xl border border-primary-border bg-background outline-none text-primary-text placeholder:tracking-normal placeholder:font-sans placeholder:text-sm focus:border-primary-text transition-colors"
          />
        </div>

        <!-- Resend OTP Timer / Button -->
        <div class="flex items-center justify-between text-xs">
          <span class="text-secondary-text">Didn't receive code?</span>
          <button
            type="button"
            :disabled="otpResendCountdown > 0 || isSubmitting"
            @click="handleResendOtp"
            class="font-semibold transition-colors cursor-pointer"
            :class="
              otpResendCountdown > 0
                ? 'text-secondary-text cursor-not-allowed'
                : 'text-primary-blue hover:underline'
            "
          >
            {{
              otpResendCountdown > 0
                ? `Resend in ${otpResendCountdown}s`
                : "Resend Code"
            }}
          </button>
        </div>

        <!-- OTP Actions -->
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            @click="showOtpModal = false"
            class="h-11 px-5 rounded-full border border-primary-border text-primary-text text-sm font-semibold hover:bg-background transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            :disabled="otpLoading || !otpCode || otpCode.length < 6"
            @click="handleVerifyOtp"
            class="flex-1 h-11 rounded-full bg-button text-button-text text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            <BaseIcon v-if="otpLoading" name="sync" class="animate-spin" />
            <span>{{ otpLoading ? "Verifying..." : "Confirm Withdrawal" }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
