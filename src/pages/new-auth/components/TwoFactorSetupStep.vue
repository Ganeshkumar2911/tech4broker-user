<template>
  <div class="animate-fade-in text-center">
    <!-- Logo -->
    <div class="flex justify-center mb-6 sm:mb-7">
      <img
        src="/dar-light-logo.svg"
        alt="Panther Capitals"
        class="h-8 sm:h-9 object-contain"
        onerror="this.src='/favicon.svg'"
      />
    </div>

    <!-- 1. Backup Codes Success Modal / Screen (after confirmation) -->
    <div v-if="backupCodes.length > 0" class="text-left animate-fade-in">
      <div class="text-center mb-5">
        <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight">
          Backup Codes
        </h1>
        <p class="text-xs sm:text-[13px] text-secondary-text mt-1 font-normal">
          Save these backup codes in a safe place. They will not be shown again.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-2 bg-background p-3.5 rounded-xl border border-primary-border mb-4 font-mono text-xs text-primary-text text-center select-all">
        <div
          v-for="(code, idx) in backupCodes"
          :key="idx"
          class="p-2 bg-card-background rounded border border-primary-border tracking-wider font-semibold"
        >
          {{ code }}
        </div>
      </div>

      <div class="space-y-2.5">
        <button
          type="button"
          class="w-full py-2.5 px-4 rounded-lg border border-primary-border bg-card-background hover:bg-background text-primary-text font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          @click="copyBackupCodes"
        >
          <Copy :size="15" />
          <span>{{ copied ? "Copied to Clipboard!" : "Copy All Backup Codes" }}</span>
        </button>

        <button
          type="button"
          style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
          class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.99]"
          @click="$emit('completed')"
        >
          <span>Continue to Dashboard</span>
        </button>
      </div>
    </div>

    <!-- 2. QR Code Setup Screen -->
    <div v-else>
      <div class="text-center mb-5">
        <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight">
          Set Up Two-Factor Authentication
        </h1>
        <p class="text-xs sm:text-[13px] text-secondary-text mt-1 font-normal">
          Scan the QR code with Google Authenticator or enter the key manually.
        </p>
      </div>

      <!-- Loading QR Code State -->
      <div v-if="setupLoading" class="py-8 flex flex-col items-center justify-center gap-2">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <span class="text-xs text-secondary-text">Generating authenticator QR code…</span>
      </div>

      <div v-else class="space-y-4 text-left">
        <!-- QR Code Canvas / Image Display -->
        <div class="flex justify-center p-3 bg-white rounded-xl border border-primary-border w-fit mx-auto shadow-xs">
          <img
            v-if="qrDataUrl"
            :src="qrDataUrl"
            alt="Authenticator QR Code"
            class="w-40 h-40 object-contain rounded"
          />
        </div>

        <!-- Secret Key with Copy -->
        <div v-if="secretKey" class="bg-background p-2.5 rounded-lg border border-primary-border flex items-center justify-between gap-2">
          <div class="overflow-hidden">
            <span class="block text-[10px] text-secondary-text font-medium">Secret Key:</span>
            <code class="text-xs font-mono font-bold text-primary-text tracking-wider truncate block">
              {{ secretKey }}
            </code>
          </div>
          <button
            type="button"
            class="shrink-0 p-1.5 rounded-md hover:bg-card-background text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
            title="Copy Secret Key"
            @click="copySecretKey"
          >
            <Copy :size="16" />
          </button>
        </div>

        <!-- Form for 6-digit confirmation code -->
        <form @submit.prevent="handleConfirmSubmit" class="space-y-4 pt-1">
          <label class="block text-xs font-semibold text-primary-text">
            Enter the 6-digit code from your app:
          </label>
          <div class="flex items-center justify-center gap-1.5 sm:gap-2">
            <input
              v-for="(digit, idx) in otpDigits"
              :id="`setup-otp-${idx}`"
              :key="idx"
              v-model="otpDigits[idx]"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="1"
              class="w-10 sm:w-12 h-11 sm:h-13 text-center text-lg sm:text-2xl font-bold rounded-lg sm:rounded-xl border border-primary-border bg-background text-primary-text outline-none transition-colors focus:border-primary-text"
              :class="{
                '!bg-button !text-button-text !border-transparent': otpDigits[idx],
                '!border-primary-red ring-1 ring-primary-red/20': errorMsg,
              }"
              @input="handleInput(idx, $event)"
              @keydown="handleKeydown(idx, $event)"
              @paste="handlePaste"
            />
          </div>

          <p v-if="errorMsg" class="text-[11px] text-primary-red text-center mt-1">
            {{ errorMsg }}
          </p>

          <button
            type="submit"
            :disabled="confirmLoading || otpDigits.join('').length !== 6"
            style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
            class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 hover:brightness-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="confirmLoading" :size="16" class="animate-spin text-slate-950" />
            <span>{{ confirmLoading ? "Enabling 2FA…" : "Enable & Continue" }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { Loader2, Copy } from "lucide-vue-next";
import QRCode from "qrcode";
import { useAuthStore } from "@/stores/shared/auth";
import { useSnackbarStore } from "@/stores/shared/snackbar";

const props = defineProps({
  tempToken: { type: String, default: "" },
  role: { type: String, default: "client" },
});

const emit = defineEmits(["completed"]);

const authStore = useAuthStore();
const snackbar = useSnackbarStore();

const setupLoading = ref(true);
const confirmLoading = ref(false);
const qrDataUrl = ref("");
const secretKey = ref("");
const otpDigits = ref(["", "", "", "", "", ""]);
const errorMsg = ref("");
const backupCodes = ref([]);
const copied = ref(false);

onMounted(async () => {
  await fetchSetupInfo();
});

const fetchSetupInfo = async () => {
  setupLoading.value = true;
  errorMsg.value = "";
  try {
    const res = await authStore.setup2fa(props.tempToken, props.role);
    const data = res?.data || res;
    secretKey.value = data?.secret || "";

    const otpauthUri = data?.otpauth_uri || "";
    if (otpauthUri) {
      qrDataUrl.value = await QRCode.toDataURL(otpauthUri, {
        width: 200,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });
    }

    nextTick(() => {
      document.getElementById("setup-otp-0")?.focus();
    });
  } catch (err) {
    errorMsg.value = err?.message || err?.error || "Failed to load 2FA setup information.";
  } finally {
    setupLoading.value = false;
  }
};

const copySecretKey = () => {
  if (!secretKey.value) return;
  navigator.clipboard.writeText(secretKey.value);
  snackbar.show("Secret key copied to clipboard!", "success");
};

const copyBackupCodes = () => {
  if (backupCodes.value.length === 0) return;
  navigator.clipboard.writeText(backupCodes.value.join("\n"));
  copied.value = true;
  snackbar.show("Backup codes copied to clipboard!", "success");
  setTimeout(() => {
    copied.value = false;
  }, 3000);
};

const handleInput = (index, event) => {
  const value = event.target.value.replace(/\D/g, "");
  errorMsg.value = "";

  if (value.length > 0) {
    otpDigits.value[index] = value[0];
    if (index < 5) {
      document.getElementById(`setup-otp-${index + 1}`)?.focus();
    }
  } else {
    otpDigits.value[index] = "";
  }
};

const handleKeydown = (index, event) => {
  if (event.key === "Backspace") {
    if (!otpDigits.value[index] && index > 0) {
      otpDigits.value[index - 1] = "";
      document.getElementById(`setup-otp-${index - 1}`)?.focus();
    }
  } else if (event.key === "ArrowLeft" && index > 0) {
    document.getElementById(`setup-otp-${index - 1}`)?.focus();
  } else if (event.key === "ArrowRight" && index < 5) {
    document.getElementById(`setup-otp-${index + 1}`)?.focus();
  }
};

const handlePaste = (event) => {
  event.preventDefault();
  const pasted = (event.clipboardData || window.clipboardData).getData("text");
  const digits = pasted.replace(/\D/g, "").slice(0, 6);
  if (!digits) return;

  for (let i = 0; i < 6; i++) {
    otpDigits.value[i] = digits[i] || "";
  }
  const focusIndex = Math.min(digits.length, 5);
  document.getElementById(`setup-otp-${focusIndex}`)?.focus();
};

const handleConfirmSubmit = async () => {
  const code = otpDigits.value.join("");
  if (code.length !== 6) {
    errorMsg.value = "Please enter all 6 digits of the code.";
    return;
  }

  confirmLoading.value = true;
  errorMsg.value = "";

  try {
    const res = await authStore.confirm2fa(code, props.tempToken, props.role);
    const data = res?.data || res;
    if (data?.backup_codes && Array.isArray(data.backup_codes)) {
      backupCodes.value = data.backup_codes;
    } else {
      emit("completed");
    }
  } catch (err) {
    errorMsg.value = err?.message || err?.error || "Invalid authenticator code. Please try again.";
  } finally {
    confirmLoading.value = false;
  }
};
</script>
