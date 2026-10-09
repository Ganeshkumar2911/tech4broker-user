<!--
  HelpCard
  Dark contact-support card used at the end of forms/flows. Fully data-driven
  so it can be reused on any module's page.

  Usage:
    <HelpCard
      title="Need Help?"
      description="Facing any issues with your deposit? Talk to our Support Executive for instant assistance."
      :actions="[
        { label: 'Whatsapp', icon: 'chat', iconColor: 'text-primary-green', href: 'https://wa.me/...' },
        { label: 'Email', icon: 'mail', iconColor: 'text-primary-text', href: 'mailto:support@panthercapitals.com' },
      ]"
    />
-->
<script setup>
defineProps({
  title: { type: String, default: "Need Help?" },
  description: { type: String, default: "" },
  actions: { type: Array, default: () => [] }, // [{ label, icon, iconColor, href }]
});
</script>

<template>
  <div
    class="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#0b1120] via-[#101c3a] to-[#16243f] text-white"
  >
    <!-- subtle decorative glow, purely visual -->
    <div
      class="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary-blue/20 blur-3xl"
    />

    <p class="text-[17px] font-bold mb-2 relative">{{ title }}</p>
    <p class="sub-text text-white/70 leading-relaxed mb-5 relative">
      {{ description }}
    </p>

    <div class="flex flex-wrap gap-3 relative">
      <a
        v-for="action in actions"
        :key="action.label"
        :href="action.href"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-2 bg-white text-[#0b1120] rounded-full px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <img
          v-if="action.type === 'img'"
          :src="action.icon"
          :alt="action.label"
          class="h-5 w-5 object-contain"
        />
        <BaseIcon
          v-else-if="action.type === 'icon'"
          :name="action.icon"
          :class="action.iconColor"
          :size="20"
          filled
        />
        {{ action.label }}
      </a>
    </div>
  </div>
</template>
