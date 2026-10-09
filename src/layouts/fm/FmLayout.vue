<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRoute } from "vue-router";
import { useProfileStore } from "@/stores/shared/profile";
import { useTickerStore } from "@/stores/shared/ticker";
import { useTourStore } from "@/stores/shared/tour";
import FmNavBar from "./FmNavBar.vue";
import TopBar from "@/components/common/TopBar.vue";

const route = useRoute();
const sidebarOpen = ref(false);
const sidebarCollapsed = ref(false);
const profileStore = useProfileStore();
const tickerStore = useTickerStore();
const tourStore = useTourStore();

const sidebarWidth = computed(() => {
  if (!sidebarCollapsed.value) return "md:ml-[280px]";
  return "md:ml-[80px]";
});

onMounted(() => {
  profileStore.fetchUserProfile();
  tickerStore.startWebSocket();

  // Auto-resume tour for the current FM route on page load / refresh
  setTimeout(() => {
    tourStore.autoResumeTourForRoute(route.path);
  }, 750);
});

onBeforeUnmount(() => {
  tourStore.stopTour();
});
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-background">
    <!-- FM NavBar -->
    <FmNavBar
      :is-open="sidebarOpen"
      :is-collapsed="sidebarCollapsed"
      @close="sidebarOpen = false"
      @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
    />

    <!-- Main column -->
    <div class="flex flex-1 flex-col overflow-hidden" :class="sidebarWidth">
      <!-- Top Bar -->
      <TopBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <!-- Router View Area -->
      <main
        class="flex-1 overflow-y-auto no-scrollbar bg-background p-4 lg:p-6"
      >
        <router-view />
      </main>
    </div>
  </div>
</template>
