<!--
  BaseIcon
  Google's Material Icons ka unified wrapper — 3 families support karta hai:

  Usage:
    <BaseIcon name="home" />                          → global default family - material-icons-round you can change this class using icons.js inside utils using family classes which is present below
    <BaseIcon name="home" />                          → filled version
    <BaseIcon name="home" family="symbols-outlined" />        → if you want you can override the family  
    <BaseIcon name="home" family="icons-round" />     → if you want you can override the family 
    <BaseIcon name="add" :size="18" class="text-primary-blue" />

  To find the icons you can use this site : https://fonts.google.com/icons
-->
<script setup>
import { computed } from "vue";
import { ICON_FAMILY } from "../../utils/icons";

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  filled: { type: Boolean, default: false },
  weight: { type: [Number, String], default: 400 },
  // null rakhein default = global config (ICON_FAMILY) use hoga
  family: { type: String, default: null },
});

const resolvedFamily = computed(() => props.family || ICON_FAMILY);

const familyClass = computed(() => {
  switch (resolvedFamily.value) {
    case "symbols-outlined":
      return "material-symbols-outlined";
    case "symbols-rounded":
      return "material-symbols-rounded";
    case "icons-round":
      return "material-icons-round";
    case "icons-outlined":
      return "material-icons-outlined";
    default:
      return "material-symbols-rounded";
  }
});

const style = computed(() => {
  const base = {
    fontSize: typeof props.size === "number" ? `${props.size}px` : props.size,
    width: typeof props.size === "number" ? `${props.size}px` : props.size,
    height: typeof props.size === "number" ? `${props.size}px` : props.size,
  };
  // Material Icons Round variable axes support nahi karta — skip
  if (resolvedFamily.value !== "icons-round") {
    base.fontVariationSettings = `'FILL' ${props.filled ? 1 : 0}, 'wght' ${props.weight}, 'GRAD' 0, 'opsz' 24`;
  }
  return base;
});
</script>

<template>
  <span
    :class="[
      familyClass,
      'inline-flex items-center justify-center leading-none select-none',
    ]"
    :style="style"
    aria-hidden="true"
    >{{ name }}</span
  >
</template>
