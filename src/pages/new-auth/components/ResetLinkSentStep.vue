<template>
  <div class="animate-fade-in text-center">
    <!-- 3D Flying Mail Icon -->
    <div class="flex justify-center mb-6 sm:mb-7">
      <img
        src="https://media.panthercapitals.com/media/13/file_1790234930_47e499.png"
        alt="Reset link sent"
        class="w-20 h-20 sm:w-24 sm:h-24 object-contain select-none"
      />
    </div>

    <!-- Heading -->
    <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight mb-1.5">
      Reset Link Sent!
    </h1>
    <p class="text-xs sm:text-sm text-secondary-text font-normal leading-relaxed mb-5">
      We've sent a password reset link to your registered email address.
    </p>

    <!-- Email Display -->
    <div class="text-left mb-3">
      <label class="block text-xs font-semibold text-primary-text mb-1.5">
        Email
      </label>
      <input
        :value="email"
        readonly
        type="email"
        class="w-full px-3.5 py-2.5 rounded-lg border border-primary-border bg-background text-primary-text text-xs sm:text-sm outline-none cursor-default font-medium"
      />
    </div>

    <!-- Hint -->
    <p class="text-[11px] text-secondary-text text-center mb-4 leading-relaxed">
      Didn't receive the email? Check your spam folder or try again.
    </p>

    <!-- Resend Email Button -->
    <button
      type="button"
      :disabled="resendLoading || resendTimer > 0"
      style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
      class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mb-2 hover:brightness-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      @click="$emit('resend')"
    >
      <Loader2 v-if="resendLoading" :size="16" class="animate-spin text-slate-950" />
      <span>{{
        resendLoading
          ? "Sending…"
          : resendTimer > 0
            ? `Resend Email (${resendTimer}s)`
            : "Resend Email"
      }}</span>
    </button>

    <!-- Sign Up Switch Link -->
    <p class="text-center text-xs text-secondary-text pt-2">
      Don't have an account?
      <router-link
        to="/register"
        class="text-primary-text font-bold underline ml-1 cursor-pointer hover:text-primary transition-colors"
      >
        Sign Up
      </router-link>
    </p>
  </div>
</template>

<script setup>
import { Loader2 } from "lucide-vue-next";

defineProps({
  email: { type: String, default: "" },
  resendLoading: { type: Boolean, default: false },
  resendTimer: { type: Number, default: 0 },
});

defineEmits(["resend"]);
</script>
