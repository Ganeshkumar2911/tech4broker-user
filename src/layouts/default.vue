<script setup>
import { ref, onMounted, computed } from "vue";
import { useProfileStore } from "@/stores/shared/profile";
import NavBar from "@/components/common/NavBar.vue";
import TopBar from "@/components/common/TopBar.vue";
import { useTickerStore } from "@/stores/shared/ticker";

const sidebarOpen = ref(false);
const sidebarCollapsed = ref(false);
const profileStore = useProfileStore();
const tickerStore = useTickerStore();

const sidebarWidth = computed(() => {
  if (!sidebarCollapsed.value) return "md:ml-[280px]";
  return "md:ml-[80px]";
});

onMounted(() => {
  profileStore.fetchUserProfile();
  tickerStore.startWebSocket();
});
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-background">
    <!-- NavBar Sidebar -->
    <NavBar
      :is-open="sidebarOpen"
      :is-collapsed="sidebarCollapsed"
      @close="sidebarOpen = false"
      @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
    />

    <!-- Main column — offset by sidebar width on md+ -->
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
