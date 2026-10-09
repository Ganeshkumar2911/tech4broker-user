<template>
  <div
    v-if="!verified"
    class="flex items-center justify-between gap-4 bg-red-500/10 rounded-4xl px-5 py-2"
  >
    <div class="flex items-center gap-3">
      <BaseIcon
        :size="20"
        name="info"
        filled
        class="text-red-500 shrink-0"
      />
      <p class="text-red-600 text-sm font-semibold">
        {{ message }}
      </p>
    </div>

    <button
      type="button"
      @click="$emit('verify')"
      class="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-5 py-2.5 rounded-3xl transition-all duration-200 cursor-pointer whitespace-nowrap"
    >
      Complete KYC
    </button>
  </div>
</template>

<script setup>
defineProps({
  verified: { type: Boolean, default: false },
  message: { type: String, default: 'KYC Pending. Please verify your identity.' },
})

defineEmits(['verify'])
</script>