<template>
  <div
    v-if="shouldShow"
    class="support-widget-root fixed z-[99999] pointer-events-auto bottom-4 right-4 sm:bottom-6 sm:right-6 select-none"
  >
    <!-- Tooltip (Shown on hover or initial idle attention) -->
    <!-- <Transition name="tooltip-fade">
      <div
        v-if="showTooltip"
        class="tooltip-card absolute bottom-full right-0 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap backdrop-blur-md transition-all duration-300 shadow-xl"
      >
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-support-whatsapp)] opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-support-whatsapp)]"></span>
        </span>
        <span>Chat on WhatsApp</span>
        <button
          type="button"
          @click.stop="dismissTooltip"
          class="tooltip-close ml-1 p-0.5 rounded-full transition-colors"
          aria-label="Close tooltip"
        >
          <X class="w-3.5 h-3.5" />
        </button>
        <div class="tooltip-arrow absolute top-full right-5 -mt-1 w-2 h-2 transform rotate-45"></div>
      </div>
    </Transition> -->

    <!-- Circular WhatsApp Direct Launcher Button -->
    <button
      type="button"
      @click="openWhatsApp"
      @mouseenter="showHoverTooltip"
      @mouseleave="hideHoverTooltip"
      @keydown.enter.prevent="openWhatsApp"
      @keydown.space.prevent="openWhatsApp"
      aria-label="Chat with Panther Capitals on WhatsApp"
      class="support-launcher-btn group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 focus-visible:outline-none cursor-pointer shadow-lg"
    >
      <!-- Green Glow Effect on Hover -->
      <div class="absolute inset-0 rounded-full bg-[var(--color-support-whatsapp)]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

      <!-- Official WhatsApp Brand Icon -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="w-6 h-6 sm:w-6 sm:h-6 text-[var(--color-support-whatsapp)] transition-transform duration-300 group-hover:scale-110"
      >
        <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.764.459 3.487 1.332 5.006L2 22l5.127-1.341a9.96 9.96 0 004.881 1.282h.004c5.507 0 9.99-4.478 9.99-9.985 0-2.667-1.039-5.176-2.924-7.062A9.92 9.92 0 0012.012 2zM12 20.308h-.004a8.307 8.307 0 01-4.233-1.161l-.304-.18-3.04.796.81-2.963-.198-.315a8.272 8.272 0 01-1.267-4.498c0-4.582 3.729-8.311 8.313-8.311 2.22 0 4.307.865 5.876 2.434a8.267 8.267 0 012.43 5.877c-.001 4.584-3.73 8.313-8.313 8.313zm4.557-6.225c-.25-.125-1.479-.73-1.708-.813-.229-.083-.396-.125-.563.125-.166.25-.646.813-.792.979-.146.166-.292.187-.542.062a6.85 6.85 0 01-2.01-1.239 7.57 7.57 0 01-1.393-1.734c-.146-.25-.015-.385.11-.509.112-.112.25-.292.375-.437.125-.146.166-.25.25-.417.083-.166.042-.312-.021-.437-.063-.125-.563-1.354-.771-1.854-.203-.487-.41-.421-.563-.429l-.479-.008c-.167 0-.438.063-.667.313s-.875.854-.875 2.083.896 2.417 1.021 2.583c.125.167 1.762 2.691 4.269 3.774.596.257 1.062.41 1.425.525.599.19 1.144.163 1.575.099.481-.072 1.479-.604 1.688-1.188.208-.583.208-1.083.146-1.188-.063-.104-.229-.166-.479-.291z"/>
      </svg>

      <!-- Live Pulse Indicator -->
      <!-- <span class="absolute top-0 right-0 flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-support-whatsapp)] opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-support-whatsapp)] border-2 border-[var(--color-support-bg)]"></span>
      </span> -->
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { X } from 'lucide-vue-next';
import { CRM_CONFIG } from '@/config/crmConfig';

const route = useRoute();
const showTooltip = ref(false);
let tooltipTimer = null;
let isHovered = false;

const shouldShow = computed(() => {
  if (!route || !route.path) return false;

  const path = route.path.toLowerCase();
  const name = String(route.name || '').toLowerCase();

  // Client Dashboard
  const isClientDashboard = path === '/dashboard' || path === '/' || name === 'dashboard';

  // IB Dashboard
  const isIbDashboard = path.includes('ib-dashboard') || name.includes('ib-dashboard');

  // FM Dashboard
  const isFmDashboard = path.includes('fm-dashboard') || name.includes('fm-dashboard');

  // Tickets Module
  const isTicketsModule = path.includes('ticket') || name.includes('ticket');

  return isClientDashboard || isIbDashboard || isFmDashboard || isTicketsModule;
});

function openWhatsApp() {
  dismissTooltip();
  if (typeof window !== 'undefined') {
    window.open(CRM_CONFIG.whatsappUrl, '_blank', 'noopener,noreferrer');
  }
}

function showHoverTooltip() {
  isHovered = true;
  showTooltip.value = true;
}

function hideHoverTooltip() {
  isHovered = false;
  showTooltip.value = false;
}

function dismissTooltip() {
  showTooltip.value = false;
  if (tooltipTimer) {
    clearTimeout(tooltipTimer);
    tooltipTimer = null;
  }
}

onMounted(() => {
  // Show subtle initial tooltip after 3.5s idle if not hovered
  tooltipTimer = setTimeout(() => {
    showTooltip.value = true;
  }, 3500);
});

onBeforeUnmount(() => {
  dismissTooltip();
});
</script>


<style scoped>
.support-launcher-btn {
  background-color: var(--color-support-bg);
  color: var(--color-support-text);
  border: 2px solid var(--color-support-border);
  box-shadow: 0 10px 30px var(--color-support-shadow);
}

.support-launcher-btn:hover {
  border-color: var(--color-support-whatsapp);
}

.tooltip-card {
  background-color: var(--color-support-bg);
  color: var(--color-support-text);
  border: 1px solid var(--color-support-whatsapp);
  box-shadow: 0 10px 25px var(--color-support-shadow);
}

.tooltip-close {
  color: var(--color-support-subtext);
}

.tooltip-close:hover {
  color: var(--color-support-text);
  background-color: var(--color-support-input-bg);
}

.tooltip-arrow {
  background-color: var(--color-support-bg);
  border-right: 1px solid var(--color-support-whatsapp);
  border-bottom: 1px solid var(--color-support-whatsapp);
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.96);
}
</style>
