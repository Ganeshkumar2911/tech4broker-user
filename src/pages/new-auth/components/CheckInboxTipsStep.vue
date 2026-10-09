<template>
  <div class="animate-fade-in text-center">
    <!-- Top Logo -->
    <div class="flex justify-center mb-6 sm:mb-7">
      <img
        src="/dar-light-logo.svg"
        alt="Panther Capitals"
        class="h-8 sm:h-9 object-contain"
        onerror="this.src='/favicon.svg'"
      />
    </div>

    <!-- 3D Inbox Tray Icon -->
    <div class="flex justify-center mb-4">
      <img
        src="https://media.panthercapitals.com/media/13/file_1790234904_839550.png"
        alt="Check your inbox"
        class="w-20 h-20 sm:w-24 sm:h-24 object-contain select-none"
      />
    </div>

    <!-- Heading -->
    <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight mb-1">
      Check your inbox
    </h1>
    <p class="text-xs sm:text-sm text-secondary-text font-normal leading-relaxed mb-5">
      Click the link in your email to reset your password.
    </p>

    <!-- Tips Card -->
    <div
      class="bg-background border border-primary-border rounded-2xl p-4 sm:p-5 text-left space-y-3.5 mb-5"
    >
      <h4 class="text-xs sm:text-[13px] font-bold text-primary-text">
        Not seeing the email?
      </h4>
      <div class="space-y-3 text-xs text-secondary-text">
        <div class="flex items-center gap-3">
          <span class="w-7 h-7 rounded-full bg-card-background border border-primary-border flex items-center justify-center shrink-0 text-primary-text">
            <Mail :size="14" />
          </span>
          <span class="font-normal text-secondary-text">Check your spam/junk folder</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="w-7 h-7 rounded-full bg-card-background border border-primary-border flex items-center justify-center shrink-0 text-primary-text">
            <Clock :size="14" />
          </span>
          <span class="font-normal text-secondary-text">It may take a few minutes to arrive</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="w-7 h-7 rounded-full bg-card-background border border-primary-border flex items-center justify-center shrink-0 text-primary-text">
            <RotateCcw :size="14" />
          </span>
          <span class="font-normal text-secondary-text">Still not received? Try again</span>
        </div>
      </div>
    </div>

    <!-- Back to Login Button -->
    <button
      type="button"
      style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
      class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.99]"
      @click="$emit('proceed')"
    >
      <span>Back To Login</span>
    </button>
  </div>
</template>

<script setup>
import { Mail, Clock, RotateCcw } from "lucide-vue-next";

defineEmits(["proceed"]);
</script>
