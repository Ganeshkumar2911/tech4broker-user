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

    <!-- Heading & Subheading -->
    <div class="text-center mb-5 sm:mb-6">
      <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight">
        Two-Factor Authentication
      </h1>
      <p class="text-xs sm:text-[13px] text-secondary-text mt-1 font-normal">
        {{
          isBackupMode
            ? "Enter an 8-character backup code from your saved codes."
            : "Enter the 6-digit verification code from your authenticator app to continue."
        }}
      </p>
    </div>

    <!-- 2FA Form -->
    <form @submit.prevent="handleSubmit" class="space-y-4 text-left">
      <!-- 1. TOTP 6-digit input boxes -->
      <div v-if="!isBackupMode" class="flex items-center justify-center gap-1.5 sm:gap-2.5 my-5 sm:my-6">
        <input
          v-for="(digit, idx) in otpDigits"
          :id="`two-factor-box-${idx}`"
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

      <!-- 2. Backup Code single input -->
      <div v-else class="my-5 sm:my-6">
        <label class="block text-xs font-semibold text-primary-text mb-1.5">
          Backup Code
        </label>
        <input
          id="backup-code-input"
          v-model="backupCode"
          type="text"
          placeholder="e.g. A1B2-C3D4"
          maxlength="14"
          class="w-full px-3.5 py-2.5 rounded-lg border border-primary-border bg-card-background text-primary-text placeholder:text-placeholder text-xs sm:text-sm outline-none focus:border-primary-text font-mono uppercase tracking-widest text-center transition-colors"
          :class="{ '!border-primary-red ring-1 ring-primary-red/20': errorMsg }"
          @input="errorMsg = ''"
        />
      </div>

      <!-- Don't ask again on this device checkbox -->
      <div class="flex items-center justify-start gap-1.5 select-none pt-0.5">
        <label class="flex items-center gap-2 text-xs text-secondary-text cursor-pointer">
          <input
            v-model="dontAskDevice"
            type="checkbox"
            class="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-primary-border text-button focus:ring-0 cursor-pointer accent-[#0f172a] dark:accent-[#e0ca3c]"
          />
          <span class="text-xs text-secondary-text">Don't ask again on this device</span>
        </label>
        <span
          class="inline-flex items-center text-secondary-text hover:text-primary-text cursor-help p-0.5 transition-colors"
          title="Trust this browser for 30 days"
        >
          <Info :size="13" class="stroke-[2.2]" />
        </span>
      </div>

      <!-- Error Message -->
      <p v-if="errorMsg" class="text-[11px] text-primary-red text-center mt-1">
        {{ errorMsg }}
      </p>

      <!-- Submit / Verify Button -->
      <button
        type="submit"
        :disabled="loading || isSubmitDisabled"
        style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
        class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 hover:brightness-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Loader2 v-if="loading" :size="16" class="animate-spin text-slate-950" />
        <span>{{ loading ? "Verifying…" : (isBackupMode ? "Verify Backup Code" : "Verify Code") }}</span>
      </button>

      <!-- Use a different method Link -->
      <div class="text-center pt-1.5">
        <button
          type="button"
          class="text-xs font-bold text-primary-text hover:underline transition-colors cursor-pointer"
          @click="toggleMethod"
        >
          {{ isBackupMode ? "Use Authenticator App" : "Use a different method" }}
        </button>
      </div>

      <!-- Help Prompt & Countdown Timer -->
      <p class="text-center text-xs text-secondary-text pt-4 leading-relaxed">
        Didn't receive the code? Check your
        <strong class="text-primary-text font-bold">authenticator app</strong>
        or try again in
        <strong class="text-primary-text font-bold">{{ resendTimer > 0 ? `${resendTimer} seconds.` : "a moment." }}</strong>
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { Loader2, Info } from "lucide-vue-next";

const props = defineProps({
  loading: { type: Boolean, default: false },
  resendTimer: { type: Number, default: 30 },
  error: { type: String, default: "" },
});

const emit = defineEmits(["submit", "resend"]);

const otpDigits = ref(["", "", "", "", "", ""]);
const backupCode = ref("");
const isBackupMode = ref(false);
const dontAskDevice = ref(false);
const errorMsg = ref(props.error);

watch(
  () => props.error,
  (newErr) => {
    errorMsg.value = newErr || "";
  }
);

onMounted(() => {
  focusFirstInput();
});

const focusFirstInput = () => {
  nextTick(() => {
    if (isBackupMode.value) {
      document.getElementById("backup-code-input")?.focus();
    } else {
      document.getElementById("two-factor-box-0")?.focus();
    }
  });
};

const isSubmitDisabled = computed(() => {
  if (isBackupMode.value) {
    return !backupCode.value.trim();
  }
  return otpDigits.value.join("").length !== 6;
});

const handleInput = (index, event) => {
  const value = event.target.value.replace(/\D/g, "");
  errorMsg.value = "";

  if (value.length > 0) {
    otpDigits.value[index] = value[0];
    if (index < 5) {
      document.getElementById(`two-factor-box-${index + 1}`)?.focus();
    }
  } else {
    otpDigits.value[index] = "";
  }

  // Auto-submit if all 6 digits entered
  const currentCode = otpDigits.value.join("");
  if (currentCode.length === 6 && !props.loading) {
    handleSubmit();
  }
};

const handleKeydown = (index, event) => {
  if (event.key === "Backspace") {
    if (!otpDigits.value[index] && index > 0) {
      otpDigits.value[index - 1] = "";
      document.getElementById(`two-factor-box-${index - 1}`)?.focus();
    }
  } else if (event.key === "ArrowLeft" && index > 0) {
    document.getElementById(`two-factor-box-${index - 1}`)?.focus();
  } else if (event.key === "ArrowRight" && index < 5) {
    document.getElementById(`two-factor-box-${index + 1}`)?.focus();
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
  document.getElementById(`two-factor-box-${focusIndex}`)?.focus();

  if (digits.length === 6 && !props.loading) {
    handleSubmit();
  }
};

const toggleMethod = () => {
  isBackupMode.value = !isBackupMode.value;
  errorMsg.value = "";
  focusFirstInput();
};

const handleSubmit = () => {
  if (isBackupMode.value) {
    const code = backupCode.value.trim();
    if (!code) {
      errorMsg.value = "Please enter your backup code.";
      return;
    }
    emit("submit", {
      backup_code: code,
      dont_ask_device: dontAskDevice.value,
    });
  } else {
    const code = otpDigits.value.join("");
    if (code.length !== 6) {
      errorMsg.value = "Please enter all 6 digits of the verification code.";
      return;
    }
    emit("submit", {
      totp_code: code,
      dont_ask_device: dontAskDevice.value,
    });
  }
};
</script>
