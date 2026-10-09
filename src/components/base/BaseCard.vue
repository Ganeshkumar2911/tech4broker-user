<template>
  <div
    class="relative w-full min-w-0 min-h-[200px] sm:min-h-[220px] xl:min-h-[229px] px-3.5 sm:px-5 xl:px-6 py-3.5 sm:py-5 rounded-2xl sm:rounded-[24px] xl:rounded-[30px] overflow-hidden border-0 bg-gradient-to-br from-[#11182A] to-[#11182A] text-white flex flex-col"
    :class="wrapperClass"
  >
    <!-- Background decoration -->
    <div
      v-if="showShine"
      class="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-[#11182A] blur-3xl card-shine pointer-events-none"
    ></div>

    <!-- Jo bhi consumer pass kare, yahi render hoga (React ke children jaisa) -->
    <div class="relative z-10 flex-1 flex flex-col min-w-0 w-full">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  showShine: { type: Boolean, default: true },
  wrapperClass: { type: [String, Array, Object], default: "" },
});
</script>

<style scoped>
.card-shine {
  position: absolute;
  top: -40%;
  left: -60%;
  width: 45%;
  height: 180%;
  transform: rotate(25deg);

  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.18),
    rgba(255, 255, 255, 0.05),
    transparent
  );

  animation: shine 6s ease-in-out infinite;
}

@keyframes shine {
  0% {
    transform: translateX(-140%) rotate(25deg);
  }

  35% {
    transform: translateX(220%) rotate(25deg);
  }

  100% {
    transform: translateX(220%) rotate(25deg);
  }
}
</style>
