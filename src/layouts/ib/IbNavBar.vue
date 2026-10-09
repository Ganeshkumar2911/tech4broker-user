<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useProfileStore } from "@/stores/shared/profile";
import { useThemeStore } from "@/stores/shared/theme";
import Tooltip from "@/components/base/Tooltip.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import ThemeTogglePill from "@/components/common/ThemeTogglePill.vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  isCollapsed: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "toggle-collapse"]);

const route = useRoute();
const router = useRouter();
const profileStore = useProfileStore();
const themeStore = useThemeStore();

const role = computed(() => profileStore.user?.role);

// IB Mode state
const ibMode = computed({
  get: () => profileStore.activeRole === "ib",
  set: (val) => {
    profileStore.setActiveRole(val ? "ib" : "client");
    localStorage.setItem("role", val ? "ib" : "client");
  },
});

const toggleIbMode = (toIb) => {
  ibMode.value = toIb;
  if (toIb) {
    router.push("/ib-dashboard");
  } else {
    router.push("/dashboard");
  }
};

const ibNavItems = [
  { label: "Dashboard", to: "/ib-dashboard", icon: "home" },
  { label: "IB Reports", to: "/ib-reports", icon: "person" },
  { label: "My Network", to: "/my-network", icon: "lan" },
  // { label: "Network Analytics", to: "/network-analytics", icon: "analytics" },
  { label: "Client Report", to: "/clients", icon: "description" },
  { label: "Account Report", to: "/account-report", icon: "receipt_long" },
  { label: "Funds", to: "/ib-funds", icon: "account_balance_wallet" },
  { label: "IB Wallet", to: "/ib-wallet", icon: "wallet" },
  { label: "Tickets", to: "/ib-tickets", icon: "confirmation_number" },
];

const isActive = (targetTo) => {
  const isNetworkFlow =
    route.query.is_ib === "true" ||
    route.query.is_ib === true ||
    Boolean(route.query.ib_id);

  if (isNetworkFlow && !route.path.startsWith("/ib-reports")) {
    if (targetTo.startsWith("/my-network")) return true;
    if (targetTo.startsWith("/clients")) return false;
  }

  // Handle /clients tabs
  if (targetTo === "/clients" && route.path.startsWith("/clients") && !route.path.startsWith("/clients/")) {
    return true;
  }
  
  if (targetTo === "/account-report" && route.path === "/account-report") {
    return true;
  }

  const cleanPath = targetTo.split("?")[0];
  return (
    route.path === cleanPath ||
    (cleanPath !== "/ib-dashboard" && route.path.startsWith(cleanPath))
  );
};

const showIbToggle = computed(() => {
  return profileStore.user?.is_ib === true || profileStore.user?.role === "ib";
});

const logoSrc = computed(() => {
  if (props.isCollapsed) {
    return themeStore.isDark ? "/fav-light.svg" : "/fav-dark.svg";
  }
  return themeStore.isDark ? "/logo_full-light.svg" : "/logo_full-dark.png";
});
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
      @click="emit('close')"
    />
  </Transition>

  <aside
    class="fixed top-0 left-0 z-40 h-full bg-navbar border-r border-navbar-border text-navbar-text flex flex-col transition-all duration-300 ease-in-out -translate-x-full md:translate-x-0"
    :class="[
      { 'translate-x-0': isOpen },
      isCollapsed ? 'w-[80px]' : 'w-[280px]',
    ]"
  >
    <!-- Header -->
    <div id="tour-logo" class="h-[60px] flex items-center border-navbar-border">
      <div v-if="!isCollapsed" class="flex items-center gap-2.5 pl-8 pt-3">
        <div class="w-48 h-38 rounded-lg flex items-center justify-center">
          <img :src="logoSrc" alt="Logo" class="transition-all duration-300" />
        </div>
      </div>
      <div v-else class="flex ml-4 w-full">
        <div class="w-9 h-9 rounded-lg flex items-center justify-center">
          <img
            :src="logoSrc"
            alt="Logo"
            class="transition-all duration-300"
            :class="!themeStore.isDark ? 'w-9 h-9 object-contain' : 'w-9 h-9 object-contain'"
          />
        </div>
      </div>
    </div>

    <!-- ─── SKELETON STATE (while profile is loading) ─── -->
    <template v-if="!profileStore.isFetched">
      <!-- IB Toggle / Pill placeholder skeleton -->
      <div v-if="!isCollapsed" class="px-4 py-3.5">
        <div class="h-9 w-full rounded-full bg-navbar-hover-bg/80 animate-pulse border border-navbar-border/40" />
      </div>

      <!-- Nav Items Skeleton -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
        <div
          v-for="i in 7"
          :key="i"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          :class="isCollapsed ? 'justify-center p-0' : ''"
        >
          <div class="w-5 h-5 rounded-lg bg-navbar-hover-bg/80 animate-pulse flex-shrink-0" />
          <div
            v-if="!isCollapsed"
            class="h-3.5 rounded bg-navbar-hover-bg/80 animate-pulse"
            :style="{ width: `${45 + (i * 9) % 35}%` }"
          />
        </div>
      </div>

      <!-- Footer User Profile Skeleton -->
      <div class="border-t border-navbar-border p-4">
        <div class="flex items-center" :class="isCollapsed ? 'justify-center' : 'gap-3'">
          <div class="w-8 h-8 rounded-full bg-navbar-hover-bg/80 animate-pulse flex-shrink-0" />
          <div v-if="!isCollapsed" class="min-w-0 flex-1 space-y-1.5">
            <div class="h-3 w-20 rounded bg-navbar-hover-bg/80 animate-pulse" />
            <div class="h-2.5 w-14 rounded bg-navbar-hover-bg/80 animate-pulse" />
          </div>
        </div>
      </div>
    </template>

    <!-- ─── REAL CONTENT (once profile is fetched) ─── -->
    <template v-else>
      <!-- IB Toggle (Capsule) -->
      <div
        id="tour-role-toggle"
        v-if="showIbToggle && !isCollapsed"
        class="px-4 py-3.5 border-navbar-border"
      >
        <div
          class="flex items-center bg-navbar-hover-bg rounded-full p-1 border border-navbar-border"
        >
          <button
            @click="toggleIbMode(false)"
            class="flex-1 px-4 py-2 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer text-center"
            :class="
              !ibMode
                ? 'bg-button text-button-text shadow-md font-bold'
                : 'text-navbar-text hover:text-navbar-text-hover'
            "
          >
            Client
          </button>
          <button
            @click="toggleIbMode(true)"
            class="flex-1 px-4 py-2 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer text-center"
            :class="
              ibMode
                ? 'bg-button text-button-text shadow-md font-bold'
                : 'text-navbar-text hover:text-navbar-text-hover'
            "
          >
            IB
          </button>
        </div>
      </div>

    <!-- Nav -->
    <nav id="tour-nav-items" class="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
      <Tooltip
        v-for="item in ibNavItems"
        :key="item.to"
        :text="item.label"
        position="right"
        :disabled="!isCollapsed"
        :block="true"
      >
        <RouterLink
          :to="item.to"
          @click="emit('close')"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group"
          :class="[
            isActive(item.to)
              ? isCollapsed
                ? 'bg-navbar-active-bg text-primary-text justify-center w-10 h-10 rounded-xl border-l-4 border-button font-bold mx-auto p-0'
                : 'nav-item-active bg-navbar-active-bg text-primary-text font-bold'
              : 'font-medium text-navbar-text hover:text-navbar-text-hover hover:bg-navbar-hover-bg',
            isCollapsed && !isActive(item.to)
              ? 'justify-center w-10 h-10 p-0 mx-auto'
              : '',
          ]"
        >
          <BaseIcon
            v-if="typeof item.icon === 'string'"
            :name="item.icon"
            :size="20"
            filled
          />

          <component
            v-else
            :is="item.icon"
            class="w-4 h-4 transition-transform group-hover:scale-110 flex-shrink-0"
          />
          <span v-if="!isCollapsed">{{ item.label }}</span>
        </RouterLink>
      </Tooltip>
    </nav>

    <!-- Footer -->
    <div id="tour-user-profile" class="border-t border-navbar-border">
      <div class="p-4">
        <div
          class="flex items-center"
          :class="isCollapsed ? 'justify-center' : 'gap-3'"
        >
          <div
            class="flex items-center min-w-0 cursor-pointer hover:bg-navbar-hover-bg rounded-lg transition-all duration-200 p-2"
            :class="isCollapsed ? 'hidden' : 'gap-3'"
            @click="router.push('/profile')"
          >
            <div
              class="w-8 h-8 rounded-full bg-button text-button-text flex items-center justify-center flex-shrink-0"
            >
              <span class="text-xs font-bold">{{
                profileStore.user?.name?.charAt(0).toUpperCase() || "I"
              }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-navbar-text-hover text-xs font-semibold truncate">
                {{ profileStore.user?.name || "IB Partner" }}
              </p>
              <p class="text-navbar-text text-[11px] capitalize truncate">
                IB Portal
              </p>
            </div>
          </div>

          <Tooltip v-if="isCollapsed" text="Expand" position="right">
            <button
              @click="emit('toggle-collapse')"
              class="flex items-center justify-center w-10 h-10 rounded-lg text-navbar-text hover:text-navbar-text-hover hover:bg-navbar-hover-bg transition-all duration-200"
            >
              <span class="material-symbols-outlined text-[20px]"
                >chevron_right</span
              >
            </button>
          </Tooltip>
          <button
            v-else
            @click="emit('toggle-collapse')"
            class="flex items-center justify-center w-10 h-10 rounded-lg text-navbar-text hover:text-navbar-text-hover hover:bg-navbar-hover-bg transition-all duration-200 ml-auto"
            title="Collapse"
          >
            <span class="material-symbols-outlined text-[20px]"
              >chevron_left</span
            >
          </button>
        </div>
      </div>
    </div>
    </template>
  </aside>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
