<script setup>
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { useDepositStore } from "@/stores/client/deposit";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import BaseIcon from "@/components/base/BaseIcon.vue";
import { getCryptoCoinTag } from "@/utils/cryptoIcons";

const depositStore = useDepositStore();
const snackbar = useSnackbarStore();

const {
  depositResponse,
  qrCodeUrl,
  selectedCryptoMethod,
  selectedAccount,
  isDemo,
  isBankTransferMethod,
} = storeToRefs(depositStore);

const isImportantOpen = ref(true);
const copiedKey = ref(null);
let copiedTimeout = null;

const copyText = async (text, key, label) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(String(text).trim());
    copiedKey.value = key;
    snackbar.show(`${label || "Detail"} copied to clipboard!`, "success");
    clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => {
      copiedKey.value = null;
    }, 2000);
  } catch (err) {
    console.error(err);
    snackbar.show("Failed to copy.", "error");
  }
};

const isBankTransferSuccess = computed(() => {
  return (
    isBankTransferMethod.value ||
    Boolean(
      depositResponse.value?.company_bank ||
      depositResponse.value?.reference_id ||
      depositResponse.value?.utr
    )
  );
});

function formatFieldLabel(key) {
  if (!key) return "";
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const companyBankList = computed(() => {
  const bank = depositResponse.value?.company_bank;
  if (!bank || typeof bank !== "object") return [];

  return Object.entries(bank)
    .filter(
      ([_, val]) =>
        val !== null && val !== undefined && String(val).trim() !== ""
    )
    .map(([key, val]) => ({
      key,
      label: formatFieldLabel(key),
      value: String(val).trim(),
    }));
});

function formatDate(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? isoStr : d.toLocaleString();
  } catch (e) {
    return isoStr;
  }
}

const accountNumberDisplay = computed(() => {
  const acc = selectedAccount.value;
  if (!acc) return "N/A";
  const num =
    acc.account?.account_number || acc.account_number || acc.login || acc.id || "";
  return num ? `#${num}` : "N/A";
});

const accountTypeDisplay = computed(() => {
  const acc = selectedAccount.value;
  if (!acc) return "";
  return acc.account?.account_type || acc.account_type || acc.type || "";
});

const accountCurrencyDisplay = computed(() => {
  const acc = selectedAccount.value;
  if (!acc) return "";
  return acc.account?.currency || acc.account?.broker_currency || acc.currency || "";
});

const walletAddress = computed(() => depositResponse.value?.address || "");

const copyAddress = async () => {
  copyText(walletAddress.value, "walletAddress", "Wallet address");
};

function handleBack() {
  depositStore.currentStep = 2;
}

function handleDone() {
  depositStore.resetFlow();
}
</script>

<template>
  <div class="space-y-6 px-2 sm:px-4 lg:px-2">
    <!-- ========================================================================= -->
    <!-- CASE 1: BANK TRANSFER CONFIRMATION DETAILS                                -->
    <!-- ========================================================================= -->
    <template v-if="isBankTransferSuccess">
      <!-- Status Header Banner -->
      <div
        class="p-5 rounded-2xl bg-card-background border border-primary-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div class="flex items-start sm:items-center gap-3.5">
          <div
            class="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20"
          >
            <BaseIcon name="hourglass_top" :size="24" />
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-semibold text-primary-text">
              Deposit Submitted
            </h3>
            <p class="text-xs sm:text-sm text-secondary-text mt-0.5">
              Your deposit request has been submitted and is pending verification.
            </p>
          </div>
        </div>

        <!-- Approval Status Badge -->
        <div class="shrink-0 self-start sm:self-center">
          <span
            class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1.5"
          >
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            {{ depositResponse?.approval_status || "Pending" }}
          </span>
        </div>
      </div>

      <!-- Transaction Overview Card -->
      <div
        class="rounded-2xl border border-primary-border/60 bg-card-background p-5 space-y-4"
      >
        <h4 class="text-xs uppercase tracking-wider text-secondary-text font-medium">
          Transaction Overview
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <!-- Deposit Amount -->
          <div class="p-3.5 rounded-xl bg-background border border-primary-border/60">
            <span class="text-xs text-secondary-text block mb-1">Deposit Amount</span>
            <span class="text-lg font-bold text-primary-text font-mono">
              {{ depositResponse?.amount?.toLocaleString() }} {{ depositResponse?.currency }}
            </span>
          </div>

          <!-- Estimated Account Credit -->
          <div class="p-3.5 rounded-xl bg-background border border-primary-border/60">
            <span class="text-xs text-secondary-text block mb-1">Estimated Account Credit</span>
            <span class="text-lg font-bold text-primary-green font-mono">
              ≈ {{ depositResponse?.estimated_account_amount }} {{ depositResponse?.estimated_account_currency }}
            </span>
          </div>

          <!-- UTR / Reference ID -->
          <div
            class="p-3.5 rounded-xl bg-background border border-primary-border/60 flex items-center justify-between"
          >
            <div class="min-w-0 flex-1">
              <span class="text-xs text-secondary-text block mb-1">UTR / Transaction ID</span>
              <span class="text-sm font-semibold text-primary-text font-mono select-all block truncate">
                {{ depositResponse?.utr }}
              </span>
            </div>
            <button
              v-if="depositResponse?.utr"
              type="button"
              @click="copyText(depositResponse.utr, 'utr', 'UTR')"
              class="shrink-0 p-1.5 rounded-md hover:bg-card-background text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
              title="Copy UTR"
            >
              <BaseIcon
                :name="copiedKey === 'utr' ? 'check' : 'content_copy'"
                :size="16"
                :class="copiedKey === 'utr' ? 'text-primary-green' : ''"
              />
            </button>
          </div>

          <!-- Reference ID -->
          <div
            class="p-3.5 rounded-xl bg-background border border-primary-border/60 flex items-center justify-between"
          >
            <div class="min-w-0 flex-1">
              <span class="text-xs text-secondary-text block mb-1">Reference ID</span>
              <span class="text-xs sm:text-sm font-semibold text-primary-text font-mono select-all block truncate">
                {{ depositResponse?.reference_id }}
              </span>
            </div>
            <button
              v-if="depositResponse?.reference_id"
              type="button"
              @click="copyText(depositResponse.reference_id, 'ref', 'Reference ID')"
              class="shrink-0 p-1.5 rounded-md hover:bg-card-background text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
              title="Copy Reference ID"
            >
              <BaseIcon
                :name="copiedKey === 'ref' ? 'check' : 'content_copy'"
                :size="16"
                :class="copiedKey === 'ref' ? 'text-primary-green' : ''"
              />
            </button>
          </div>
        </div>

        <!-- Additional Metadata Row -->
        <div class="pt-3 border-t border-primary-border/50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="flex justify-between items-center py-1">
            <span class="text-secondary-text">Target Account</span>
            <div class="flex items-center gap-1.5">
              <span class="font-semibold text-primary-text font-mono">{{ accountNumberDisplay }}</span>
              <span
                v-if="accountTypeDisplay"
                class="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
                :class="isDemo ? 'bg-primary-blue/15 text-primary-blue' : 'bg-primary-green/15 text-primary-green'"
              >
                {{ accountTypeDisplay }}
              </span>
            </div>
          </div>

          <div v-if="depositResponse?.payment_request_id" class="flex justify-between items-center py-1">
            <span class="text-secondary-text">Payment Request ID</span>
            <span class="font-semibold text-primary-text font-mono">#{{ depositResponse.payment_request_id }}</span>
          </div>

          <div v-if="depositResponse?.conversion_rate" class="flex justify-between items-center py-1">
            <span class="text-secondary-text">Exchange Rate</span>
            <span class="font-semibold text-primary-text font-mono">
              1 {{ depositResponse.conversion_rate.account_currency }} = {{ depositResponse.conversion_rate.units_per_usd }} {{ depositResponse.conversion_rate.payment_currency }}
            </span>
          </div>

          <div v-if="depositResponse?.converted_at" class="flex justify-between items-center py-1">
            <span class="text-secondary-text">Submitted At</span>
            <span class="text-secondary-text font-mono">{{ formatDate(depositResponse.converted_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Company Bank Details Card -->
      <div
        v-if="companyBankList.length > 0"
        class="rounded-2xl border border-primary-border/60 bg-card-background p-5 space-y-3.5"
      >
        <div class="flex items-center gap-2">
          <BaseIcon name="account_balance" :size="18" class="text-primary-blue" />
          <h4 class="text-sm font-semibold text-primary-text">
            Beneficiary Account Details
          </h4>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="item in companyBankList"
            :key="item.key"
            class="p-3 rounded-lg bg-background border border-primary-border/50 flex items-center justify-between gap-2"
          >
            <div class="min-w-0 flex-1">
              <span class="text-[11px] text-secondary-text uppercase tracking-wider block">
                {{ item.label }}
              </span>
              <span class="text-sm font-semibold text-primary-text font-mono block truncate mt-0.5 select-all">
                {{ item.value }}
              </span>
            </div>
            <button
              type="button"
              @click="copyText(item.value, `bank-${item.key}`, item.label)"
              class="shrink-0 p-1.5 rounded-md hover:bg-card-background text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
              :title="`Copy ${item.label}`"
            >
              <BaseIcon
                :name="copiedKey === `bank-${item.key}` ? 'check' : 'content_copy'"
                :size="15"
                :class="copiedKey === `bank-${item.key}` ? 'text-primary-green' : ''"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Notice Alert -->
      <div
        class="flex items-start gap-2.5 rounded-xl px-4 py-3 bg-primary-blue/10 text-primary-blue text-xs leading-relaxed"
      >
        <BaseIcon name="info" :size="16" class="shrink-0 mt-0.5" />
        <p>
          Our operations team will verify your payment and UTR number. Your balance will be credited to your trading account once confirmed.
        </p>
      </div>

      <!-- Action Button -->
      <div class="pt-2">
        <button
          type="button"
          @click="handleDone"
          class="w-full h-12 rounded-full bg-button text-button-text font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <span>Done</span>
        </button>
      </div>
    </template>

    <!-- ========================================================================= -->
    <!-- CASE 2: CRYPTO CONFIRMATION (QR Code, Wallet Address)                     -->
    <!-- ========================================================================= -->
    <template v-else>
      <!-- Selected Network / Token Summary -->
      <div>
        <h3 class="text-sm font-semibold text-primary-text mb-2">
          Selected Network
        </h3>
        <div
          class="flex items-center gap-3.5 p-3.5 rounded-xl bg-card-background border border-primary-border"
        >
          <!-- Crypto Icon -->
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
          >
            <!-- BTC -->
            <template
              v-if="
                selectedCryptoMethod?.type === 'btc' ||
                selectedCryptoMethod?.coin === 'BTC' ||
                selectedCryptoMethod?.alias === 'BTC'
              "
            >
              <div
                class="w-full h-full bg-[#F7931A] text-white flex items-center justify-center font-bold text-base"
              >
                <span class="font-mono font-bold">₿</span>
              </div>
            </template>

            <!-- USDC -->
            <template
              v-else-if="
                selectedCryptoMethod?.type === 'usdc' ||
                selectedCryptoMethod?.coin === 'USDC' ||
                selectedCryptoMethod?.alias === 'USDC'
              "
            >
              <div
                class="w-full h-full bg-[#2775CA] text-white flex items-center justify-center font-bold text-sm"
              >
                <span>$</span>
              </div>
            </template>

            <!-- USDT / BUSD -->
            <template
              v-else-if="
                selectedCryptoMethod?.type === 'usdt' ||
                selectedCryptoMethod?.coin === 'USDT' ||
                selectedCryptoMethod?.alias?.includes('USDT') ||
                selectedCryptoMethod?.alias?.includes('BUSD')
              "
            >
              <div
                class="w-full h-full bg-[#26A17B] text-white flex items-center justify-center font-bold text-base"
              >
                <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.6 7.4v.9h3.7v2.1h-3.7v4.6h-3.2v-4.6H6.7v-2.1h3.7v-.9c-2.3-.2-4.1-.7-4.1-1.3 0-.7 2-1.3 4.5-1.3s4.5.6 4.5 1.3c0 .6-1.8 1.1-4.1 1.3z"
                  />
                </svg>
              </div>
            </template>

            <!-- XRP -->
            <template
              v-else-if="
                selectedCryptoMethod?.type === 'xrp' ||
                selectedCryptoMethod?.coin === 'XRP' ||
                selectedCryptoMethod?.alias === 'XRP'
              "
            >
              <div
                class="w-full h-full bg-black text-white flex items-center justify-center font-bold"
              >
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path
                    d="M12 2L6 8l2 2 4-4 4 4 2-2-6-6zm0 20l6-6-2-2-4 4-4-4-2 2 6 6zM6 16l-4 4 2 2 4-4-2-2zm12-8l4-4-2-2-4 4 2 2z"
                  />
                </svg>
              </div>
            </template>

            <!-- Generic Fallback -->
            <template v-else>
              <div
                class="w-full h-full bg-primary-border/60 text-primary-text flex items-center justify-center font-bold text-xs"
              >
                {{ selectedCryptoMethod?.alias || selectedCryptoMethod?.coin || "$" }}
              </div>
            </template>
          </div>

          <div>
            <div class="flex items-center gap-2">
              <span class="font-semibold text-sm sm:text-base text-primary-text">
                {{
                  selectedCryptoMethod?.name ||
                  depositResponse?.token ||
                  depositResponse?.network ||
                  "Crypto Deposit"
                }}
              </span>
              <span
                v-if="selectedCryptoMethod || depositResponse"
                class="px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-md bg-secondary-text/10 text-secondary-text border border-secondary-text/20 uppercase tracking-wide shrink-0"
              >
                {{ getCryptoCoinTag(selectedCryptoMethod || depositResponse) }}
              </span>
            </div>
            <span v-if="depositResponse?.network" class="text-xs text-secondary-text block mt-0.5">
              Network: <span class="text-primary-text font-medium">{{ depositResponse.network }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Important Accordion Box -->
      <div
        class="rounded-xl bg-primary-blue/10 border border-primary-blue/20 transition-all overflow-hidden"
      >
        <button
          type="button"
          @click="isImportantOpen = !isImportantOpen"
          class="w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer"
        >
          <span class="font-semibold text-primary-blue dark:text-blue-400 text-sm">
            Important Instructions
          </span>
          <span
            class="material-symbols-rounded text-primary-blue dark:text-blue-400 text-xl transition-transform duration-200"
            :class="isImportantOpen ? 'rotate-180' : ''"
          >
            keyboard_arrow_up
          </span>
        </button>

        <div
          v-show="isImportantOpen"
          class="px-4 pb-4 pt-1 space-y-2 text-xs sm:text-sm text-primary-blue dark:text-blue-300 leading-relaxed"
        >
          <p class="flex items-start gap-2">
            <span>1.</span>
            <span>
              Make sure you choose the same type of chain and coin as you would for your withdrawal platform.
            </span>
          </p>
          <p class="flex items-start gap-2">
            <span>2.</span>
            <span>
              Please ensure that the deposit amount exceeds the minimum deposit threshold to be credited.
            </span>
          </p>
          <p class="flex items-start gap-2">
            <span>3.</span>
            <span>
              Send only <strong>{{ depositResponse?.token }}</strong> via the <strong>{{ depositResponse?.network }}</strong> network.
            </span>
          </p>
        </div>
      </div>

      <!-- Deposit Address & QR Code Section -->
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-primary-text">Deposit Address</h3>
        <p class="sub-text text-secondary-text leading-relaxed">
          Scan the QR code or copy the wallet address below to transfer your funds.
        </p>

        <!-- QR Code -->
        <div class="py-1 flex justify-start">
          <div class="p-3 bg-white rounded-xl border border-primary-border inline-block">
            <img
              v-if="qrCodeUrl"
              :src="qrCodeUrl"
              alt="Deposit Wallet QR Code"
              class="w-36 h-36 object-contain"
            />
          </div>
        </div>

        <!-- Address Box with 1-click Copy -->
        <div
          class="w-full h-12 rounded-xl border border-primary-border bg-background px-4 flex items-center justify-between"
        >
          <span
            class="text-xs sm:text-sm font-mono text-primary-text truncate mr-2 select-all"
          >
            {{ walletAddress }}
          </span>
          <button
            type="button"
            @click="copyAddress"
            title="Copy wallet address"
            class="shrink-0 text-secondary-text hover:text-primary-text transition-colors cursor-pointer p-1"
          >
            <span class="material-symbols-rounded text-lg">content_copy</span>
          </button>
        </div>
      </div>

      <!-- Summary Details Table -->
      <div
        class="w-full bg-card-background border border-primary-border/60 rounded-xl p-4 text-xs space-y-2.5"
      >
        <div class="flex justify-between items-center">
          <span class="text-secondary-text">Target Trading Account</span>
          <div class="flex items-center gap-1.5">
            <span class="font-semibold text-primary-text font-mono">{{ accountNumberDisplay }}</span>
            <span
              v-if="accountTypeDisplay"
              class="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
              :class="isDemo ? 'bg-primary-blue/15 text-primary-blue' : 'bg-primary-green/15 text-primary-green'"
            >
              {{ accountTypeDisplay }}
            </span>
            <span v-if="accountCurrencyDisplay" class="text-secondary-text font-mono">
              ({{ accountCurrencyDisplay }})
            </span>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <span class="text-secondary-text">Asset / Token</span>
          <span class="font-semibold text-primary-text">{{ depositResponse?.token }}</span>
        </div>

        <div class="flex justify-between items-center">
          <span class="text-secondary-text">Blockchain Network</span>
          <span class="font-semibold text-primary-text">{{ depositResponse?.network }}</span>
        </div>

        <div class="flex justify-between items-center">
          <span class="text-secondary-text">Status</span>
          <span class="font-semibold text-primary-green flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-primary-green animate-pulse"></span>
            Awaiting Transfer
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="pt-2 flex gap-3">
        <button
          type="button"
          @click="handleBack"
          class="h-12 px-6 rounded-full border border-primary-border text-primary-text font-semibold hover:bg-card-background transition-colors cursor-pointer"
        >
          Back
        </button>

        <button
          type="button"
          @click="handleDone"
          class="flex-1 h-12 rounded-full bg-button text-button-text font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <span>Done</span>
        </button>
      </div>
    </template>
  </div>
</template>
