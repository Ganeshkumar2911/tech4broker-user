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

    <!-- 3D Lock with Green Checkmark Icon -->
    <div class="flex justify-center mb-4 sm:mb-5">
      <img
        src="https://media.panthercapitals.com/media/13/file_1790234756_9c6add.png"
        alt="Password Updated"
        class="w-24 h-24 sm:w-28 sm:h-28 object-contain select-none"
      />
    </div>

    <!-- Heading -->
    <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight mb-2">
      Password Updated!
    </h1>
    <p class="text-xs sm:text-sm text-secondary-text font-normal leading-relaxed mb-6 max-w-xs mx-auto">
      Your password has been successfully reset. You can now log in to your account with your new password.
    </p>

    <!-- Go To Login Button -->
    <button
      type="button"
      style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
      class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.99]"
      @click="$emit('login')"
    >
      <span>Go To Login</span>
    </button>
  </div>
</template>

<script setup>
defineEmits(["login"]);
</script>
