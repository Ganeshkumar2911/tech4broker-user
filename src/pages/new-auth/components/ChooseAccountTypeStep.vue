<template>
  <div class="animate-fade-in text-center">
    <!-- Logo -->
    <div class="flex justify-center mb-6 sm:mb-7.5">
      <img
        src="/dar-light-logo.svg"
        alt="Panther Capitals"
        class="h-8 sm:h-9 object-contain"
        onerror="this.src='/favicon.svg'"
      />
    </div>

    <!-- Heading & Subheading -->
    <div class="text-center mb-6 sm:mb-8">
      <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight mb-2">
        Choose your account type
      </h1>
      <p class="text-xs sm:text-[13px] text-secondary-text font-normal leading-relaxed max-w-xs mx-auto">
        Select the account that best matches how you'll use Panther Capitals.
      </p>
    </div>

    <!-- Account Type Selection Cards -->
    <div class="space-y-3.5 sm:space-y-4 mb-6">
      <!-- Investor Button -->
      <button
        type="button"
        class="w-full py-4 px-5 rounded-lg border border-primary-border bg-card-background hover:border-primary-text active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center group text-center"
        @click="$emit('select', 'client')"
      >
        <span class="text-sm sm:text-base font-semibold text-primary-text transition-colors">
          I am a Investor
        </span>
      </button>

      <!-- Fund Manager Button -->
      <button
        type="button"
        class="w-full py-4 px-5 rounded-lg border border-primary-border bg-card-background hover:border-primary-text active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center group text-center"
        @click="$emit('select', 'fm')"
      >
        <span class="text-sm sm:text-base font-semibold text-primary-text transition-colors">
          I am a Fund Manager
        </span>
      </button>
    </div>

    <!-- Already have an account link -->
    <p class="text-center text-xs text-secondary-text pt-2">
      Already have an account?
      <router-link
        to="/login"
        class="text-primary-text font-bold underline ml-1 cursor-pointer hover:text-primary transition-colors"
      >
        Log In
      </router-link>
    </p>
  </div>
</template>

<script setup>
defineEmits(["select"]);
</script>
