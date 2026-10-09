<script setup>
import { computed, ref, nextTick, onBeforeUnmount } from "vue";
import { storeToRefs } from "pinia";
import { useDepositStore } from "@/stores/client/deposit";
import { useProfileStore } from "@/stores/shared/profile";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import BasePdfPreview from "@/components/base/BasePdfPreview.vue";
import Modal from "@/components/base/Modal.vue";
import QuickAmountChips from "@/components/base/QuickAmountChips.vue";
import DepositConfirmationDialog from "./DepositConfirmationDialog.vue";
import { formatPaymentAmount } from "@/utils/formatters";
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

const depositStore = useDepositStore();
const profileStore = useProfileStore();
const snackbar = useSnackbarStore();

const fieldErrors = ref({});
const filePreviewUrls = ref({});
const isDragging = ref({});
const isPreviewModalOpen = ref(false);
const activePreviewFieldKey = ref(null);
const pdfPreviewRef = ref(null);
const pdfNumPages = ref(0);
const pdfZoomScale = ref(1.0);

function openPreviewModal(key) {
  activePreviewFieldKey.value = key;
  pdfZoomScale.value = 1.0;
  pdfNumPages.value = 0;
  isPreviewModalOpen.value = true;
}

function closePreviewModal() {
  isPreviewModalOpen.value = false;
  activePreviewFieldKey.value = null;
  pdfNumPages.value = 0;
  pdfZoomScale.value = 1.0;
}

function clearFieldError(key) {
  if (fieldErrors.value[key]) {
    delete fieldErrors.value[key];
  }
}

function setFieldValue(key, value) {
  if (!depositStore.dynamicFormValues) {
    depositStore.dynamicFormValues = {};
  }
  depositStore.dynamicFormValues[key] = value;
  if (dynamicFormValues.value) {
    dynamicFormValues.value[key] = value;
  }
  try {
    dynamicFormValues[key] = value;
  } catch (e) {}
  clearFieldError(key);
}

function getFieldValue(key) {
  return (
    depositStore.dynamicFormValues?.[key] ??
    dynamicFormValues.value?.[key] ??
    dynamicFormValues[key] ??
    ""
  );
}

function getFile(key) {
  const val =
    depositStore.dynamicFormValues?.[key] ??
    dynamicFormValues.value?.[key] ??
    dynamicFormValues[key];
  return val instanceof File ? val : null;
}

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function isImageFile(file) {
  return (
    file?.type?.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file?.name || "")
  );
}

function isPdfFile(file) {
  return (
    file?.type === "application/pdf" ||
    /\.pdf$/i.test(file?.name || "")
  );
}

function isUtrField(field) {
  if (!field) return false;
  const key = String(field.key || "").toLowerCase();
  const label = String(field.label || "").toLowerCase();
  return (
    key === "utr" ||
    key === "url" ||
    key === "reference_id" ||
    key === "utr_number" ||
    label.includes("utr") ||
    label.includes("reference")
  );
}

function triggerFileInput(key) {
  const el = document.getElementById(`file-input-${key}`);
  el?.click();
}

function processSelectedFile(key, file) {
  if (!file) return;

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    const msg = "File size must not exceed 5MB.";
    fieldErrors.value[key] = msg;
    snackbar.show(msg, "error");
    return;
  }

  // Revoke previous preview URL if any
  if (filePreviewUrls.value[key]) {
    URL.revokeObjectURL(filePreviewUrls.value[key]);
    delete filePreviewUrls.value[key];
  }

  if (isImageFile(file) || isPdfFile(file)) {
    try {
      filePreviewUrls.value[key] = URL.createObjectURL(file);
    } catch (e) {
      console.error("Preview URL creation error:", e);
    }
  }

  setFieldValue(key, file);
}

function getPdfPreviewSrc(key) {
  const url = filePreviewUrls.value[key];
  if (!url) return "";
  return `${url}#toolbar=0&navpanes=0&pagemode=none&view=FitH`;
}

function openFileInNewTab(key) {
  const url = filePreviewUrls.value[key];
  if (url) {
    window.open(url, "_blank");
  }
}

function handleFileChange(key, event) {
  const file = event?.target?.files?.[0];
  processSelectedFile(key, file);
  if (event?.target) event.target.value = "";
}

function handleFileDrop(key, event) {
  isDragging.value[key] = false;
  const file = event?.dataTransfer?.files?.[0];
  processSelectedFile(key, file);
}

function onDragOver(key) {
  isDragging.value[key] = true;
}

function onDragLeave(key) {
  isDragging.value[key] = false;
}

function removeFile(key) {
  if (filePreviewUrls.value[key]) {
    URL.revokeObjectURL(filePreviewUrls.value[key]);
    delete filePreviewUrls.value[key];
  }
  const inputEl = document.getElementById(`file-input-${key}`);
  if (inputEl) inputEl.value = "";
  setFieldValue(key, null);
}

onBeforeUnmount(() => {
  Object.values(filePreviewUrls.value).forEach((url) => {
    if (url) URL.revokeObjectURL(url);
  });
  filePreviewUrls.value = {};
});

const {
  dynamicFormValues,
  selectedCryptoMethod,
  isSubmitting,
  selectedAccount,
  selectedPaymentMethod,
  isDemo,
  isCryptoMethod,
  isBankTransferMethod,
  bankTransferDetails,
  paymentCurrency,
  dynamicFields,
  cryptoOptions,
  convertedUsd,
  minDepositAmount,
  maxDepositAmount,
  conversionInfo,
} = storeToRefs(depositStore);

const formattedMinLimit = computed(() => {
  if (!selectedPaymentMethod.value?.minimum_deposit_amount) return null;
  return formatPaymentAmount(
    selectedPaymentMethod.value.minimum_deposit_amount,
    conversionInfo.value,
  );
});

const formattedMaxLimit = computed(() => {
  if (!selectedPaymentMethod.value?.maximum_deposit_amount) return null;
  return formatPaymentAmount(
    selectedPaymentMethod.value.maximum_deposit_amount,
    conversionInfo.value,
  );
});

const quickAmountsList = computed(() => {
  const min = minDepositAmount.value || (paymentCurrency.value === "INR" ? 2500 : 50);
  const max = maxDepositAmount.value > 0 ? maxDepositAmount.value : Infinity;

  let defaults = [];
  if (paymentCurrency.value === "INR") {
    defaults = [2500, 5000, 10000, 25000];
  } else if (paymentCurrency.value === "USD") {
    defaults = [50, 100, 500, 1000];
  } else {
    defaults = [
      Math.round(min),
      Math.round(min * 2),
      Math.round(min * 5),
      Math.round(min * 10),
    ];
  }

  let validAmounts = defaults.filter((amt) => amt >= min && amt <= max);

  if (validAmounts.length === 0) {
    validAmounts = [
      Math.round(min),
      Math.round(min * 2),
      Math.round(min * 5),
      Math.round(min * 10),
    ].filter((amt) => amt <= max);

    if (validAmounts.length === 0) {
      validAmounts = [Math.round(min)];
    }
  }

  return validAmounts.slice(0, 4);
});

const copiedKey = ref(null);
let copiedTimeout = null;

async function copyBankDetail(text, key, label) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(String(text).trim());
    copiedKey.value = key;
    snackbar.show(`${label || "Detail"} copied to clipboard!`, "success");
    clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => {
      copiedKey.value = null;
    }, 2000);
  } catch (e) {
    console.error("Copy error:", e);
    snackbar.show("Failed to copy.", "error");
  }
}

function formatFieldLabel(key) {
  if (!key) return "";
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

const bankDetailsList = computed(() => {
  const details = bankTransferDetails.value;
  if (!details || typeof details !== "object") return [];

  return Object.entries(details)
    .filter(
      ([_, value]) =>
        value !== null && value !== undefined && String(value).trim() !== "",
    )
    .map(([key, value]) => ({
      key,
      label: formatFieldLabel(key),
      value: String(value).trim(),
      canCopy: true,
    }));
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
  Object.values(filePreviewUrls.value).forEach((url) => {
    if (url) URL.revokeObjectURL(url);
  });
  filePreviewUrls.value = {};
  fieldErrors.value = {};
  depositStore.clearDynamicForm();
  depositStore.currentStep = 1;
}

const accountNumberDisplay = computed(() => {
  const acc = selectedAccount.value;
  if (!acc) return "N/A";
  const num =
    acc.account?.account_number ||
    acc.account_number ||
    acc.login ||
    acc.id ||
    "";
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
  return (
    acc.account?.currency || acc.account?.broker_currency || acc.currency || ""
  );
});

function validateAndScroll() {
  fieldErrors.value = {};

  if (isCryptoMethod.value) {
    if (!selectedCryptoMethod.value) {
      fieldErrors.value.crypto = "Please select a cryptocurrency.";
      snackbar.show("Please select a crypto token & network.", "error");
      nextTick(() => {
        const el = document.getElementById("crypto-selection-section");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return false;
    }
    return true;
  }

  if (isDemo.value) {
    const amt = Number(
      depositStore.dynamicFormValues?.amount ??
        dynamicFormValues.value?.amount ??
        dynamicFormValues.amount ??
        0,
    );
    if (!amt || amt <= 0) {
      fieldErrors.value.amount = "Please enter a valid deposit amount.";
      snackbar.show("Please enter a valid deposit amount.", "error");
      nextTick(() => {
        const el = document.getElementById("field-amount");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      });
      return false;
    }
    return true;
  }

  // Dynamic Fields Validation
  for (const field of dynamicFields.value) {
    const rawVal =
      depositStore.dynamicFormValues?.[field.key] ??
      dynamicFormValues.value?.[field.key] ??
      dynamicFormValues[field.key];
    const isFile = field.type === "file";
    const isValEmpty = isFile
      ? !rawVal || (typeof rawVal === "string" && !rawVal.trim())
      : (rawVal === undefined || rawVal === null || String(rawVal).trim() === "");

    if (field.required && isValEmpty) {
      const msg = isFile
        ? `Please upload ${field.label || "attachment"}.`
        : `Please provide ${field.label || field.key}.`;
      fieldErrors.value[field.key] = msg;
      snackbar.show(msg, "error");

      nextTick(() => {
        const el =
          document.getElementById(`field-${field.key}`) ||
          document.getElementById(`field-container-${field.key}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        const input = el?.tagName === "INPUT" ? el : el?.querySelector("input");
        input?.focus();
      });
      return false;
    }

    if (isFile && rawVal instanceof File) {
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (rawVal.size > MAX_SIZE) {
        const msg = "File size must not exceed 5MB.";
        fieldErrors.value[field.key] = msg;
        snackbar.show(msg, "error");
        nextTick(() => {
          const el =
            document.getElementById(`field-${field.key}`) ||
            document.getElementById(`field-container-${field.key}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        return false;
      }
    }

    if (field.key === "amount") {
      const val =
        rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : "";
      const amt = Number(val || 0);
      const minAmount = minDepositAmount.value;
      const maxAmount = maxDepositAmount.value;
      if (amt <= 0) {
        const msg = "Please enter a valid deposit amount.";
        fieldErrors.value.amount = msg;
        snackbar.show(msg, "error");
        nextTick(() => {
          const el = document.getElementById("field-amount");
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          el?.focus();
        });
        return false;
      }
      if (minAmount > 0 && amt < minAmount) {
        const msg = `Minimum deposit amount is ${formattedMinLimit.value} ${paymentCurrency.value}.`;
        fieldErrors.value.amount = msg;
        snackbar.show(msg, "error");
        nextTick(() => {
          const el = document.getElementById("field-amount");
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          el?.focus();
        });
        return false;
      }
      if (maxAmount > 0 && amt > maxAmount) {
        const msg = `Maximum deposit amount is ${formattedMaxLimit.value} ${paymentCurrency.value}.`;
        fieldErrors.value.amount = msg;
        snackbar.show(msg, "error");
        nextTick(() => {
          const el = document.getElementById("field-amount");
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          el?.focus();
        });
        return false;
      }
    }
  }

  return true;
}

const showConfirmationDialog = ref(false);

const currentMethodType = computed(() => {
  if (isDemo.value) return "";
  const m = selectedPaymentMethod.value;
  if (!m) return "";
  const mt = String(m.method_type || "").toLowerCase().trim();
  if (mt === "upi" || mt === "imps") return mt;
  const code = String(
    m.payment_method_code || m.gateway || m.wallet_label || m.name || ""
  ).toLowerCase();
  if (code.includes("upi")) return "upi";
  if (code.includes("imps")) return "imps";
  return "";
});

const isUpiOrImpsMethod = computed(() => {
  return currentMethodType.value === "upi" || currentMethodType.value === "imps";
});

function executeDeposit() {
  if (isDemo.value) {
    depositStore.submitDemoDeposit();
  } else if (isCryptoMethod.value) {
    depositStore.submitCryptoDeposit();
  } else if (isBankTransferMethod.value) {
    depositStore.submitBankTransferDeposit();
  } else {
    depositStore.submitDynamicDeposit(profileStore.user || {});
  }
}

function handleSubmit() {
  if (!validateAndScroll()) return;

  if (isUpiOrImpsMethod.value) {
    showConfirmationDialog.value = true;
    return;
  }

  executeDeposit();
}

function handleConfirmDeposit() {
  showConfirmationDialog.value = false;
  executeDeposit();
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
            Trading Account
          </p>
          <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span class="font-semibold text-primary-text font-mono">
              {{ accountNumberDisplay }}
            </span>
            <span
              v-if="accountTypeDisplay"
              class="text-2xs font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
              :class="
                isDemo
                  ? 'bg-primary-blue/15 text-primary-blue'
                  : 'bg-primary-green/15 text-primary-green'
              "
            >
              {{ accountTypeDisplay }}
            </span>
            <span
              v-if="accountCurrencyDisplay"
              class="text-xs text-secondary-text font-mono"
            >
              ({{ accountCurrencyDisplay }})
            </span>
          </div>
        </div>
      </div>

      <!-- Deposit Payment Method -->
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-lg bg-background border border-primary-border flex items-center justify-center text-secondary-text shrink-0"
        >
          <BaseIcon
            :name="
              isDemo
                ? 'smart_toy'
                : isCryptoMethod
                  ? 'currency_bitcoin'
                  : isBankTransferMethod
                    ? 'account_balance'
                    : 'payments'
            "
            :size="18"
          />
        </div>
        <div class="min-w-0">
          <p class="text-[11px] text-secondary-text uppercase tracking-wider">
            Deposit Method
          </p>
          <p class="font-semibold text-primary-text truncate mt-0.5">
            {{
              isDemo
                ? "Demo Virtual Deposit"
                : selectedPaymentMethod?.wallet_label ||
                  selectedPaymentMethod?.name ||
                  "Payment Method"
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- CASE 1: CRYPTO TOKEN & NETWORK SELECTION (Fixed UI, dynamic API options) -->
    <!-- ========================================================================= -->
    <div v-if="isCryptoMethod" id="crypto-selection-section" class="space-y-4">
      <div>
        <p class="mid-text font-medium text-primary-text mb-1">Select Crypto</p>
        <p class="sub-text text-secondary-text">
          Choose the cryptocurrency and blockchain network to generate your
          deposit address.
        </p>
        <p v-if="fieldErrors.crypto" class="text-xs text-primary-red mt-1">
          {{ fieldErrors.crypto }}
        </p>
      </div>

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
                  class="px-2 py-0.5 text-2xs sm:text-xs font-semibold rounded-md bg-secondary-text/10 text-secondary-text border border-secondary-text/20 uppercase tracking-wide shrink-0"
                >
                  {{ getCryptoCoinTag(method) }}
                </span>
              </div>
              <span v-if="method.network" class="text-xs text-secondary-text block mt-0.5">
                Network:
                <span class="text-primary-text font-medium">{{
                  method.network
                }}</span>
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

      <div v-else class="py-8 text-center text-secondary-text text-sm">
        No crypto tokens available.
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- CASE 2: DYNAMIC FORM GENERATOR (Bank Transfer, UPI, Paymaxis, Demo, etc.) -->
    <!-- ========================================================================= -->
    <div v-else class="space-y-5">
      <!-- BANK TRANSFER BENEFICIARY DETAILS CARD -->
      <div
        v-if="isBankTransferMethod && bankTransferDetails"
        class="rounded-xl border border-primary-border/70 bg-card-background overflow-hidden"
      >
        <!-- Card Header with Bank Icon & Status Badge -->
        <div
          class="px-4 py-3.5 border-b border-primary-border/50 bg-background/50 flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="w-9 h-9 rounded-lg bg-primary-blue/10 text-primary-blue flex items-center justify-center shrink-0"
            >
              <BaseIcon name="account_balance" :size="18" />
            </div>
            <div>
              <h4 class="text-sm font-semibold text-primary-text">
                Beneficiary Bank Details
              </h4>
              <p class="text-[11px] text-secondary-text">
                Transfer your deposit amount to this official bank account
              </p>
            </div>
          </div>
          <span
            class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary-green/10 text-primary-green border border-primary-green/20 shrink-0 flex items-center gap-1"
          >
            <BaseIcon name="verified" :size="13" />
            Verified
          </span>
        </div>

        <!-- Bank Details Grid -->
        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="item in bankDetailsList"
            :key="item.key"
            class="p-3 rounded-lg bg-background border border-primary-border/60 flex items-center justify-between gap-2 transition-colors hover:border-primary-border"
          >
            <div class="min-w-0 flex-1">
              <p
                class="text-[11px] font-medium uppercase tracking-wider text-secondary-text"
              >
                {{ item.label }}
              </p>
              <p
                class="text-sm font-semibold text-primary-text truncate mt-0.5 select-all font-mono"
              >
                {{ item.value }}
              </p>
            </div>

            <!-- One-Click Copy Button -->
            <button
              v-if="item.canCopy"
              type="button"
              @click="copyBankDetail(item.value, item.key, item.label)"
              class="shrink-0 p-1.5 rounded-md hover:bg-card-background text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
              :title="`Copy ${item.label}`"
            >
              <BaseIcon
                :name="copiedKey === item.key ? 'check' : 'content_copy'"
                :size="16"
                :class="copiedKey === item.key ? 'text-primary-green' : ''"
              />
            </button>
          </div>
        </div>

        <!-- How to Pay Instruction Banner -->
        <div
          class="px-4 py-3 bg-primary-blue/5 border-t border-primary-border/40 flex items-start gap-2.5 text-xs text-secondary-text"
        >
          <BaseIcon
            name="info"
            :size="16"
            class="shrink-0 text-primary-blue mt-0.5"
          />
          <p class="leading-relaxed">
            Please make your payment to the bank account details above. Once
            transferred, enter the
            <strong class="text-primary-text font-medium"
              >Deposit Amount</strong
            >
            and the
            <strong class="text-primary-text font-medium"
              >UTR / Reference ID</strong
            >
            from your bank receipt below to submit your request.
          </p>
        </div>
      </div>

      <!-- Dynamic Fields -->
      <div
        v-for="field in dynamicFields"
        :key="field.key"
        :id="`field-container-${field.key}`"
        class="space-y-1.5"
      >
        <!-- Field Header (Label & Optional Live Conversion) -->
        <div class="flex items-center justify-between">
          <label class="mid-text font-medium text-primary-text">
            {{ field.label || field.key }}
            <span v-if="field.required" class="text-primary-red">*</span>
          </label>

          <!-- Live USD Conversion Badge for Amount Field -->
          <span
            v-if="field.key === 'amount' && convertedUsd"
            class="text-xs font-semibold text-primary-green px-2 py-0.5 rounded-md bg-primary-green/10"
          >
            ≈ ${{ convertedUsd }} USD
          </span>
        </div>

        <!-- 1. AMOUNT NUMBER FIELD WITH CURRENCY BADGE -->
        <div v-if="field.key === 'amount'" class="space-y-2.5">
          <div class="relative">
            <input
              :id="`field-${field.key}`"
              :value="getFieldValue(field.key)"
              type="number"
              step="any"
              :placeholder="
                field.placeholder || `Enter amount in ${paymentCurrency}`
              "
              class="w-full h-11 rounded-lg border bg-background px-4 pr-16 outline-none text-sm text-primary-text placeholder:text-secondary-text/50 font-mono transition-colors"
              :class="
                fieldErrors[field.key]
                  ? 'border-primary-red focus:border-primary-red ring-1 ring-primary-red/20'
                  : 'border-primary-border focus:border-primary-text'
              "
              @input="(e) => setFieldValue(field.key, e.target.value)"
            />
            <!-- Fixed Payment Currency (No manual select dropdown) -->
            <span
              class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary-text"
            >
              {{ paymentCurrency }}
            </span>
          </div>

          <!-- Min / Max Amount Limits Hint -->
          <div
            v-if="formattedMinLimit || formattedMaxLimit"
            class="flex items-center justify-between text-[11px] text-secondary-text px-0.5"
          >
            <span v-if="formattedMinLimit">
              Min:
              <strong class="text-primary-text font-medium"
                >{{ formattedMinLimit }} {{ paymentCurrency }}</strong
              >
            </span>
            <span v-if="formattedMaxLimit">
              Max:
              <strong class="text-primary-text font-medium"
                >{{ formattedMaxLimit }} {{ paymentCurrency }}</strong
              >
            </span>
          </div>

          <!-- Quick Amount Chips -->
          <QuickAmountChips
            :model-value="getFieldValue(field.key)"
            :amounts="quickAmountsList"
            :currency="paymentCurrency"
            @select="(val) => setFieldValue(field.key, val)"
          />
        </div>

        <!-- 2. SELECT DROPDOWN FIELD -->
        <div v-else-if="field.type === 'select'" :id="`field-${field.key}`">
          <BaseSelect
            :model-value="getFieldValue(field.key)"
            :options="field.options || []"
            :placeholder="
              field.placeholder || `Select ${field.label || field.key}`
            "
            height="44px"
            rounded="lg"
            @update:model-value="(val) => setFieldValue(field.key, val)"
            @change="clearFieldError(field.key)"
          />
        </div>

        <!-- 3. GENERIC NUMBER FIELD -->
        <div v-else-if="field.type === 'number'">
          <input
            :id="`field-${field.key}`"
            :value="getFieldValue(field.key)"
            type="number"
            :placeholder="
              field.placeholder || `Enter ${field.label || field.key}`
            "
            class="w-full h-11 rounded-lg border bg-background px-4 outline-none text-sm text-primary-text placeholder:text-secondary-text/50 font-mono transition-colors"
            :class="
              fieldErrors[field.key]
                ? 'border-primary-red focus:border-primary-red ring-1 ring-primary-red/20'
                : 'border-primary-border focus:border-primary-text'
            "
            @input="(e) => setFieldValue(field.key, e.target.value)"
          />
        </div>

        <!-- 4. FILE UPLOAD FIELD (Handles proof of payment attachments) -->
        <div
          v-else-if="field.type === 'file'"
          :id="`field-${field.key}`"
          class="space-y-3"
        >
          <!-- Hidden Native File Input -->
          <input
            :id="`file-input-${field.key}`"
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx"
            class="hidden"
            @change="(e) => handleFileChange(field.key, e)"
          />

          <!-- Dropzone State (When no file selected) -->
          <div
            v-if="!getFile(field.key)"
            @click="triggerFileInput(field.key)"
            @dragover.prevent="onDragOver(field.key)"
            @dragleave.prevent="onDragLeave(field.key)"
            @drop.prevent="(e) => handleFileDrop(field.key, e)"
            class="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 group"
            :class="[
              fieldErrors[field.key]
                ? 'border-primary-red bg-primary-red/5'
                : isDragging[field.key]
                  ? 'border-primary-blue bg-primary-blue/5 scale-[0.99]'
                  : 'border-primary-border/80 bg-background hover:border-primary-blue/60 hover:bg-card-background',
            ]"
          >
            <div
              class="w-10 h-10 rounded-xl bg-primary-blue/10 text-primary-blue flex items-center justify-center group-hover:scale-105 transition-transform shrink-0"
            >
              <BaseIcon name="cloud_upload" :size="22" />
            </div>
            <div class="space-y-0.5">
              <p class="text-xs font-semibold text-primary-text">
                {{ field.placeholder || "Click to upload attachment or drag & drop" }}
              </p>
              <p class="text-[11px] text-secondary-text">
                PNG, JPG, WEBP, PDF (max 5MB)
              </p>
            </div>
          </div>

          <!-- File Selected State (Selected File Card with Preview, Change & Delete) -->
          <div v-else>
            <div
              class="border border-primary-green/40 bg-primary-green/5 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-colors"
            >
              <div class="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  class="w-9 h-9 rounded-lg bg-primary-green/15 text-primary-green flex items-center justify-center shrink-0"
                >
                  <BaseIcon
                    :name="
                      isPdfFile(getFile(field.key))
                        ? 'picture_as_pdf'
                        : isImageFile(getFile(field.key))
                          ? 'image'
                          : 'description'
                    "
                    :size="18"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <p
                    class="text-xs font-semibold text-primary-text truncate"
                    :title="getFile(field.key).name"
                  >
                    {{ getFile(field.key).name }}
                  </p>
                  <p class="text-[11px] text-secondary-text font-mono mt-0.5">
                    {{ formatFileSize(getFile(field.key).size) }}
                  </p>
                </div>
              </div>

              <!-- Actions: Preview, Change & Delete -->
              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  @click.stop="openPreviewModal(field.key)"
                  class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary-text bg-card-background border border-primary-border hover:bg-background transition-colors flex items-center gap-1 cursor-pointer"
                  title="Preview attachment"
                >
                  <BaseIcon name="visibility" :size="15" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  @click.stop="triggerFileInput(field.key)"
                  class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary-text bg-card-background border border-primary-border hover:bg-background transition-colors flex items-center gap-1 cursor-pointer"
                  title="Replace attachment"
                >
                  <BaseIcon name="cached" :size="15" />
                  <span>Change</span>
                </button>
                <button
                  type="button"
                  @click.stop="removeFile(field.key)"
                  class="p-1.5 rounded-lg text-secondary-text hover:text-primary-red hover:bg-primary-red/10 transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <BaseIcon name="delete" :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. GENERIC TEXT FIELD (Handles UTR, Reference ID & other text fields) -->
        <div v-else>
          <input
            :id="`field-${field.key}`"
            :value="getFieldValue(field.key)"
            type="text"
            :placeholder="
              field.placeholder ||
              (isUtrField(field)
                ? 'Enter 12-digit UTR or Reference ID'
                : `Enter ${field.label || field.key}`)
            "
            class="w-full h-11 rounded-lg border bg-background px-4 outline-none text-sm text-primary-text placeholder:text-secondary-text/50 transition-colors"
            :class="[
              isUtrField(field) ? 'font-mono' : '',
              fieldErrors[field.key]
                ? 'border-primary-red focus:border-primary-red ring-1 ring-primary-red/20'
                : 'border-primary-border focus:border-primary-text',
            ]"
            @input="(e) => setFieldValue(field.key, e.target.value)"
          />
          <!-- Specific Helper Hint for UTR / Reference ID -->
          <p
            v-if="isUtrField(field) && !fieldErrors[field.key]"
            class="text-[11px] text-secondary-text mt-1 flex items-center gap-1"
          >
            <BaseIcon name="help_outline" :size="13" />
            Found in your bank receipt or SMS notification after completing
            payment.
          </p>
        </div>

        <!-- Field Inline Error Message -->
        <p v-if="fieldErrors[field.key]" class="text-xs text-primary-red mt-1">
          {{ fieldErrors[field.key] }}
        </p>
      </div>
    </div>

    <!-- Kind Reminder / Notice -->
    <div
      class="flex items-start gap-2.5 rounded-xl px-4 py-3 bg-primary-blue/10 text-primary-blue"
    >
      <BaseIcon name="info" :size="16" class="shrink-0 mt-0.5" />
      <p class="sub-text leading-relaxed">
        {{
          isDemo
            ? "Demo deposits will instantly credit virtual balance to your demo trading account."
            : isBankTransferMethod
              ? "Your deposit will be credited to your trading account once your bank transfer and UTR number are verified by our team."
              : "Funds will be credited automatically to your account once confirmed by the payment gateway."
        }}
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

      <!-- Submit / Continue Button -->
      <button
        type="button"
        @click="handleSubmit"
        :disabled="isSubmitting"
        class="flex-1 h-12 rounded-full bg-button text-button-text font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
      >
        <BaseIcon v-if="isSubmitting" name="sync" class="animate-spin" />
        <span v-else class="material-symbols-rounded text-lg">lock</span>
        <span>
          {{
            isSubmitting
              ? "Processing..."
              : isDemo
                ? "Deposit Virtual Funds"
                : isCryptoMethod
                  ? "Continue to Payment"
                  : isBankTransferMethod
                    ? "Submit Deposit Request"
                    : isUpiOrImpsMethod
                      ? (currentMethodType === "imps" ? "Proceed to IMPS Payment" : "Proceed to UPI Payment")
                      : "Proceed to Payment"
          }}
        </span>
      </button>
    </div>

    <!-- Encrypted Note -->
    <p
      class="flex items-center justify-center gap-1.5 sub-text text-primary-green"
    >
      <BaseIcon name="verified_user" :size="15" />
      Your payment information is 100% secure and encrypted.
    </p>

    <!-- UPI / IMPS Deposit Confirmation Dialog -->
    <DepositConfirmationDialog
      :is-open="showConfirmationDialog"
      :method-type="currentMethodType"
      :is-submitting="isSubmitting"
      @close="showConfirmationDialog = false"
      @confirm="handleConfirmDeposit"
    />

    <!-- Attachment Preview Modal Popup (Full Screen on Mobile, Centered Modal on Desktop) -->
    <Teleport to="body">
      <div
        v-if="isPreviewModalOpen && activePreviewFieldKey && getFile(activePreviewFieldKey)"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/60 backdrop-blur-[2px]"
      >
        <!-- Backdrop click for desktop -->
        <div
          class="hidden sm:block fixed inset-0 z-[-1]"
          @click="closePreviewModal"
        ></div>

        <!-- Modal Dialog (Full Screen on mobile, max-4xl rounded card on desktop) -->
        <div
          class="w-full h-full sm:h-auto sm:max-h-[92vh] sm:w-[90vw] md:w-[82vw] lg:max-w-4xl flex flex-col bg-card-background text-primary-text sm:rounded-2xl sm:border border-primary-border overflow-hidden select-auto"
        >
          <!-- Unified Responsive Header -->
          <div
            class="px-4 sm:px-6 py-3 border-b border-primary-border bg-card-background flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 shrink-0"
          >
            <!-- Top Row on Mobile / Left on Desktop: File Info & Mobile Close -->
            <div class="flex items-center justify-between sm:justify-start gap-2.5 min-w-0 flex-1">
              <div class="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  :class="
                    isPdfFile(getFile(activePreviewFieldKey))
                      ? 'bg-primary-red/10 text-primary-red border border-primary-red/20'
                      : 'bg-primary-blue/10 text-primary-blue border border-primary-blue/20'
                  "
                >
                  <BaseIcon
                    :name="
                      isPdfFile(getFile(activePreviewFieldKey))
                        ? 'picture_as_pdf'
                        : 'visibility'
                    "
                    :size="18"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <h3
                    class="text-sm font-semibold text-primary-text truncate"
                    :title="getFile(activePreviewFieldKey).name"
                  >
                    {{ getFile(activePreviewFieldKey).name }}
                  </h3>
                  <p class="text-[11px] text-secondary-text font-mono flex items-center gap-1.5 mt-0.5">
                    <span
                      v-if="isPdfFile(getFile(activePreviewFieldKey)) && pdfNumPages > 0"
                      class="font-medium text-primary-text"
                    >
                      {{ pdfNumPages }} {{ pdfNumPages === 1 ? 'Page' : 'Pages' }} &bull;
                    </span>
                    <span>{{ formatFileSize(getFile(activePreviewFieldKey).size) }}</span>
                  </p>
                </div>
              </div>

              <!-- Mobile Close Button (Top right on mobile) -->
              <button
                type="button"
                @click="closePreviewModal"
                class="sm:hidden p-1.5 rounded-lg text-secondary-text hover:text-primary-text hover:bg-background transition-colors cursor-pointer shrink-0"
                title="Close preview"
              >
                <BaseIcon name="close" :size="20" />
              </button>
            </div>

            <!-- Actions Row: Zoom Controls (PDF) + Open in Tab + Desktop Close -->
            <div
              class="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-primary-border/40"
            >
              <!-- Zoom Controls (PDF Canvas only) -->
              <div
                v-if="isPdfFile(getFile(activePreviewFieldKey)) && !pdfPreviewRef?.useIframeFallback"
                class="flex items-center bg-background border border-primary-border rounded-lg p-0.5"
              >
                <button
                  type="button"
                  @click.stop="pdfPreviewRef?.zoomOut()"
                  :disabled="pdfZoomScale <= 0.6"
                  class="p-1 rounded text-secondary-text hover:text-primary-text hover:bg-card-background disabled:opacity-40 transition-colors cursor-pointer"
                  title="Zoom out"
                >
                  <BaseIcon name="remove" :size="15" />
                </button>
                <button
                  type="button"
                  @click.stop="pdfPreviewRef?.resetZoom()"
                  class="px-2 py-0.5 text-[11px] font-mono text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
                  title="Fit to width / Reset zoom"
                >
                  {{ Math.round(pdfZoomScale * 100) }}%
                </button>
                <button
                  type="button"
                  @click.stop="pdfPreviewRef?.zoomIn()"
                  :disabled="pdfZoomScale >= 2.5"
                  class="p-1 rounded text-secondary-text hover:text-primary-text hover:bg-card-background disabled:opacity-40 transition-colors cursor-pointer"
                  title="Zoom in"
                >
                  <BaseIcon name="add" :size="15" />
                </button>
              </div>

              <div class="flex items-center gap-2">
                <!-- Open in New Tab -->
                <button
                  type="button"
                  @click.stop="openFileInNewTab(activePreviewFieldKey)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-text bg-background border border-primary-border hover:bg-card-background rounded-lg transition-colors cursor-pointer"
                  title="Open in new tab"
                >
                  <BaseIcon name="open_in_new" :size="14" />
                  <span>Open in Tab</span>
                </button>

                <!-- Desktop Close Button (hidden on mobile, shown on sm+) -->
                <button
                  type="button"
                  @click="closePreviewModal"
                  class="hidden sm:inline-flex p-1.5 rounded-lg text-secondary-text hover:text-primary-text hover:bg-background transition-colors cursor-pointer"
                  title="Close preview"
                >
                  <BaseIcon name="close" :size="18" />
                </button>
              </div>
            </div>
          </div>

          <!-- Modal Body (Single Unified Scroll Container, fills 100% height on mobile) -->
          <div
            class="flex-1 overflow-y-auto p-3 sm:p-6 bg-background no-scrollbar"
          >
            <!-- PDF Document Preview -->
            <div
              v-if="isPdfFile(getFile(activePreviewFieldKey))"
              class="w-full flex justify-center"
            >
              <BasePdfPreview
                ref="pdfPreviewRef"
                :file="getFile(activePreviewFieldKey)"
                :file-name="getFile(activePreviewFieldKey).name"
                :show-header="false"
                :scrollable="false"
                @update:num-pages="(n) => (pdfNumPages = n)"
                @update:zoom-scale="(z) => (pdfZoomScale = z)"
                @open-external="openFileInNewTab(activePreviewFieldKey)"
              />
            </div>

            <!-- Image Preview -->
            <div
              v-else-if="isImageFile(getFile(activePreviewFieldKey)) && filePreviewUrls[activePreviewFieldKey]"
              class="flex items-center justify-center p-2 rounded-xl bg-card-background border border-primary-border"
            >
              <img
                :src="filePreviewUrls[activePreviewFieldKey]"
                :alt="getFile(activePreviewFieldKey).name"
                class="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>

            <!-- Generic File Preview -->
            <div
              v-else
              class="flex flex-col items-center justify-center py-12 gap-3 text-center"
            >
              <div
                class="w-16 h-16 rounded-2xl bg-primary-blue/10 text-primary-blue flex items-center justify-center border border-primary-blue/20"
              >
                <BaseIcon name="description" :size="36" />
              </div>
              <div>
                <p class="text-sm font-semibold text-primary-text">
                  {{ getFile(activePreviewFieldKey).name }}
                </p>
                <p class="text-xs text-secondary-text mt-1">
                  {{ formatFileSize(getFile(activePreviewFieldKey).size) }}
                </p>
              </div>
              <button
                type="button"
                @click.stop="openFileInNewTab(activePreviewFieldKey)"
                class="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-button-text bg-button rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
              >
                <BaseIcon name="download" :size="16" />
                <span>Download / View File</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
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
