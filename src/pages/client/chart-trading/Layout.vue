<template>
  <div class="flex h-screen w-full overflow-hidden bg-background">
    <!-- Client NavBar Mobile Overlay Drawer (Mobile Only) -->
    <div class="md:hidden">
      <ClientNavBar
        :is-open="sidebarOpen"
        :is-collapsed="false"
        @close="sidebarOpen = false"
      />
    </div>

    <!-- Main column — 100% Full Width on Desktop -->
    <div class="flex flex-1 flex-col overflow-hidden w-full">
      <!-- Top Bar (Hidden on Mobile view) -->
      <div class="hidden md:block">
        <TopBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      </div>

      <!-- Router View Area -->
      <main
        class="flex-1 md:h-[calc(100vh-60px)] h-full overflow-y-auto no-scrollbar bg-background"
      >
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import TopBar from "@/components/common/TopBar.vue";
import ClientNavBar from "@/layouts/client/ClientNavBar.vue";
import { useThemeStore } from "@/stores/shared/theme";
import { useTickerStore } from "@/stores/shared/ticker";
import { useTourStore } from "@/stores/shared/tour";
import { useProfileStore } from "@/stores/shared/profile";

const sidebarOpen = ref(false);
const route = useRoute();
const themeStore = useThemeStore();
const tickerStore = useTickerStore();
const profileStore = useProfileStore();
const tourStore = useTourStore();

onMounted(() => {
  profileStore.fetchUserProfile();
  tickerStore.startWebSocket();
  themeStore.init();

  // Auto-resume tour for chart-trading if active
  setTimeout(() => {
    tourStore.autoResumeTourForRoute(route.path);
  }, 750);
});

onBeforeUnmount(() => {
  tourStore.stopTour();
});
</script>
