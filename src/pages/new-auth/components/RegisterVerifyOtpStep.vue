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
    <div class="text-center mb-5">
      <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight">
        Verify Your Email
      </h1>
      <p class="text-xs sm:text-[13px] text-secondary-text mt-1 font-normal">
        Enter the OTP sent to your email address.
      </p>

      <!-- Email Display with Edit Pencil Icon -->
      <div class="flex items-center justify-center gap-2 mt-2">
        <span class="text-xs font-semibold text-primary-text">{{ email }}</span>
        <button
          type="button"
          class="text-secondary-text hover:text-primary-text transition-colors cursor-pointer p-0.5"
          title="Edit Email"
          @click="$emit('edit-email')"
        >
          <span class="material-symbols-outlined text-[15px]">edit</span>
        </button>
      </div>
    </div>

    <!-- OTP Form -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- 6-digit OTP Inputs -->
      <div class="flex items-center justify-center gap-1.5 sm:gap-2.5">
        <input
          v-for="(digit, idx) in otpDigits"
          :id="`otp-box-${idx}`"
          :key="idx"
          v-model="otpDigits[idx]"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="1"
          class="w-9 sm:w-11 sm:h-12 h-11 text-center text-base sm:text-xl font-bold rounded-lg sm:rounded-xl border border-primary-border bg-background text-primary-text outline-none transition-colors focus:border-primary-text"
          :class="{
            '!bg-button !text-button-text !border-transparent': otpDigits[idx],
            '!border-primary-red ring-1 ring-primary-red/20': errorMsg,
          }"
          @input="handleInput(idx, $event)"
          @keydown="handleKeydown(idx, $event)"
          @paste="handlePaste"
        />
      </div>

      <p v-if="errorMsg" class="text-[11px] text-primary-red text-center">
        {{ errorMsg }}
      </p>

      <!-- Resend Row -->
      <div class="flex items-center justify-between text-xs text-secondary-text px-1">
        <span>Didn't Receive Code</span>
        <button
          type="button"
          :disabled="resendLoading || resendTimer > 0"
          class="font-bold text-primary-text hover:underline transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          @click="$emit('resend')"
        >
          {{ resendTimer > 0 ? `Resend (${resendTimer}s)` : "Resend" }}
        </button>
      </div>

      <!-- Submit / Verify Button -->
      <button
        type="submit"
        :disabled="loading"
        style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
        class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 hover:brightness-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Loader2 v-if="loading" :size="16" class="animate-spin text-slate-950" />
        <span>{{ loading ? "Verifying OTP…" : "Verify OTP" }}</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Loader2 } from "lucide-vue-next";
import { useThemeStore } from "@/stores/shared/theme";

const props = defineProps({
  email: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  resendLoading: { type: Boolean, default: false },
  resendTimer: { type: Number, default: 0 },
  error: { type: String, default: "" },
});

const emit = defineEmits(["submit", "resend", "edit-email"]);

const themeStore = useThemeStore();
const isDarkTheme = computed(() => themeStore.isDark);

const otpDigits = ref(["", "", "", "", "", ""]);
const errorMsg = ref(props.error);

onMounted(() => {
  document.getElementById("otp-box-0")?.focus();
});

const handleInput = (index, event) => {
  const value = event.target.value.replace(/\D/g, "");
  errorMsg.value = "";

  if (value.length > 0) {
    otpDigits.value[index] = value[0];
    if (index < 5) {
      document.getElementById(`otp-box-${index + 1}`)?.focus();
    }
  } else {
    otpDigits.value[index] = "";
  }
};

const handleKeydown = (index, event) => {
  if (event.key === "Backspace") {
    if (!otpDigits.value[index] && index > 0) {
      otpDigits.value[index - 1] = "";
      document.getElementById(`otp-box-${index - 1}`)?.focus();
    }
  } else if (event.key === "ArrowLeft" && index > 0) {
    document.getElementById(`otp-box-${index - 1}`)?.focus();
  } else if (event.key === "ArrowRight" && index < 5) {
    document.getElementById(`otp-box-${index + 1}`)?.focus();
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
  document.getElementById(`otp-box-${focusIndex}`)?.focus();
};

const handleSubmit = () => {
  const code = otpDigits.value.join("");
  if (code.length !== 6) {
    errorMsg.value = "Please enter all 6 digits of the OTP.";
    return;
  }
  emit("submit", code);
};
</script>
