<script setup>
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useProfileStore } from "@/stores/shared/profile";
import Tooltip from "@/components/base/Tooltip.vue";
import ThemeTogglePill from "@/components/common/ThemeTogglePill.vue";
import { useThemeStore } from "@/stores/shared/theme";

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

const themeStore = useThemeStore();

const emit = defineEmits(["close", "toggle-collapse"]);

const route = useRoute();
const router = useRouter();
const profileStore = useProfileStore();

// ✅ Role
const role = computed(() => profileStore.user?.role);

// ✅ IB Mode (only relevant for client users with is_ib = true)
const ibMode = computed({
  get: () => profileStore.activeRole === "ib",
  set: (val) => {
    profileStore.setActiveRole(val ? "ib" : "client");
    localStorage.setItem("role", val ? "ib" : "client");
  },
});

// ✅ Toggle IB mode
const toggleIbMode = () => {
  ibMode.value = !ibMode.value;

  if (ibMode.value) {
    router.push("/ib-dashboard");
  } else {
    router.push("/dashboard");
  }
};

// ✅ Display Name
const displayName = computed(
  () =>
    profileStore.user?.name ||
    (role.value === "client" ? "User" : "Fund Manager"),
);

// ✅ Display Role
const displayRole = computed(
  () =>
    profileStore.user?.role ||
    (role.value === "client" ? "Client" : "Fund Manager"),
);

// ✅ Client Nav Items (using Google Icons keywords)
const clientNavItems = [
  { label: "Home", to: "/dashboard", icon: "home" },
  { label: "Accounts", to: "/trading-accounts", icon: "account_balance" },
  { label: "Funds", to: "/funds", icon: "account_balance_wallet" },
  { label: "Trading Reports", to: "/trading-reports", icon: "analytics" },
  {
    label: "Trading",
    to: "/chart-trading",
    icon: "monitoring",
    target: "_blank",
  },
  { label: "Copy Trading", to: "/copy-trading", icon: "trending_up" },
  { label: "Promotions", to: "/refer-a-friend", icon: "local_offer" },
  { label: "Downloads", to: "/tickets", icon: "download" },
  { label: "Loyalty", to: "/loyalty-program", icon: "stars" },
];

// ✅ FM Nav Items
const fmNavItems = [
  { label: "Dashboard", to: "/fm-dashboard", icon: "home" },
  {
    label: "Trading Accounts",
    to: "/trading-accounts",
    icon: "account_balance",
  },
  { label: "Funds", to: "/fm-funds", icon: "account_balance_wallet" },
  { label: "Your Wallet", to: "/your-wallet", icon: "account_balance_wallet" },
  { label: "Tickets", to: "/tickets", icon: "confirmation_number" },
];

// ✅ IB Nav Items
const ibNavItems = [
  { label: "Dashboard", to: "/ib-dashboard", icon: "home" },
  { label: "IB Reports", to: "/ib-reports", icon: "person" },
  { label: "My Network", to: "/my-network", icon: "lan" },
  { label: "Network Analytics", to: "/network-analytics", icon: "analytics" },
  { label: "Clients", to: "/clients", icon: "group" },
  { label: "Funds", to: "/ib-funds", icon: "account_balance_wallet" },
  { label: "IB Wallet", to: "/ib-wallet", icon: "wallet" },
  { label: "Tickets", to: "/tickets", icon: "confirmation_number" },
];

// ✅ Final Nav based on role
const navItems = computed(() => {
  if (role.value === "fm") return fmNavItems;
  if (role.value === "client") {
    if (ibMode.value) return ibNavItems;
    return clientNavItems;
  }
  return [];
});

// ✅ Active Route Check
const isActive = (path) => {
  const isNetworkFlow =
    route.query.is_ib === "true" ||
    route.query.is_ib === true ||
    Boolean(route.query.ib_id);

  if (isNetworkFlow) {
    if (path === "/my-network") return true;
    if (path === "/clients") return false;
  }

  return route.path === path || (path !== "/" && route.path.startsWith(path));
};

// ✅ Show IB toggle only when user.is_ib is true or role is ib
const showIbToggle = computed(() => {
  return profileStore.user?.is_ib === true || profileStore.user?.role === "ib";
});

const getItemTarget = (item) => {
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return undefined;
  }
  return item.target;
};

// ✅ Logo Logic (Reusable for Dark/Light & Collapsed/Uncollapsed)
const logoSrc = computed(() => {
  if (props.isCollapsed) {
    return themeStore.isDark ? "/fav-light.svg" : "/fav-dark.svg";
  }
  return themeStore.isDark ? "/logo_full-light.svg" : "/logo_full-dark.png";
});
</script>

<template>
  <!-- Overlay -->
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
      @click="emit('close')"
    />
  </Transition>

  <!-- Sidebar -->
  <aside
    class="fixed top-0 left-0 z-40 h-full bg-navbar border-r border-navbar-border text-navbar-text flex flex-col transition-all duration-300 ease-in-out -translate-x-full md:translate-x-0"
    :class="[
      { 'translate-x-0': isOpen },
      isCollapsed ? 'w-[80px]' : 'w-[280px]',
    ]"
  >
    <!-- Header -->
    <div
      id="tour-logo"
      class="h-[60px] flex items-center justify- ml-6border-navbar-border"
    >
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
            :class="
              !themeStore.isDark
                ? 'w-9 h-9 object-contain'
                : 'w-9 h-9 object-contain'
            "
          />
        </div>
      </div>
    </div>

    <!-- ─── SKELETON STATE (while profile is loading) ─── -->
    <template v-if="!profileStore.isFetched">
      <!-- Capsule placeholder skeleton -->
      <div v-if="!isCollapsed" class="px-4 py-3.5">
        <div
          class="h-9 w-full rounded-full bg-navbar-hover-bg/80 animate-pulse border border-navbar-border/40"
        />
      </div>

      <!-- Nav Items Skeleton -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
        <div
          v-for="i in 7"
          :key="i"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          :class="isCollapsed ? 'justify-center p-0' : ''"
        >
          <div
            class="w-5 h-5 rounded-lg bg-navbar-hover-bg/80 animate-pulse flex-shrink-0"
          />
          <div
            v-if="!isCollapsed"
            class="h-3.5 rounded bg-navbar-hover-bg/80 animate-pulse"
            :style="{ width: `${45 + ((i * 9) % 35)}%` }"
          />
        </div>
      </div>

      <!-- Footer User Profile Skeleton -->
      <div class="border-t border-navbar-border p-4">
        <div
          class="flex items-center"
          :class="isCollapsed ? 'justify-center' : 'gap-3'"
        >
          <div
            class="w-8 h-8 rounded-full bg-navbar-hover-bg/80 animate-pulse flex-shrink-0"
          />
          <div v-if="!isCollapsed" class="min-w-0 flex-1 space-y-1.5">
            <div class="h-3 w-20 rounded bg-navbar-hover-bg/80 animate-pulse" />
            <div
              class="h-2.5 w-14 rounded bg-navbar-hover-bg/80 animate-pulse"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- ─── REAL CONTENT (once profile is fetched) ─── -->
    <template v-else>
      <!-- IB Toggle (relocated to top, styled as full rounded capsule) -->
      <div
        id="tour-role-toggle"
        v-if="showIbToggle && !isCollapsed"
        class="px-4 py-3.5 border-navbar-border"
      >
        <div
          class="flex items-center bg-navbar-hover-bg rounded-full p-1 border border-navbar-border"
        >
          <button
            @click="toggleIbMode"
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
            @click="toggleIbMode"
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
      <nav
        id="tour-nav-items"
        class="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar"
      >
        <Tooltip
          v-for="item in navItems"
          :key="item.to"
          :text="item.label"
          position="right"
          :disabled="!isCollapsed"
          :block="true"
        >
          <RouterLink
            :to="item.to"
            :target="getItemTarget(item)"
            @click="emit('close')"
            class="flex items-center transition-all duration-200 group"
            :class="[
              isActive(item.to)
                ? isCollapsed
                  ? 'bg-navbar-active-bg text-primary-text justify-center w-10 h-10 rounded-xl border-l-4 border-button font-bold mx-auto p-0'
                  : 'nav-item-active bg-navbar-active-bg text-primary-text font-bold px-3 py-2.5 rounded-xl'
                : 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-navbar-text hover:text-navbar-text-hover hover:bg-navbar-hover-bg',
              isCollapsed && !isActive(item.to)
                ? 'justify-center w-10 h-10 p-0 mx-auto'
                : '',
            ]"
          >
            <!-- Google Icon / Component Icon -->
            <span
              v-if="typeof item.icon === 'string'"
              class="material-symbols-outlined flex-shrink-0 text-[20px] transition-transform group-hover:scale-110"
            >
              {{ item.icon }}
            </span>
            <component
              v-else
              :is="item.icon"
              class="w-4 h-4 transition-transform group-hover:scale-110 flex-shrink-0"
            />
            <span v-if="!isCollapsed">{{ item.label }}</span>

            <!-- Active dot -->
            <!-- <span
            v-if="isActive(item.to) && !isCollapsed"
            class="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
          /> -->
          </RouterLink>
        </Tooltip>
      </nav>

      <!-- Footer -->
      <div id="tour-user-profile" class="border-t border-navbar-border">
        <!-- User Info -->
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
                  profileStore.user?.name?.charAt(0).toUpperCase() || "S"
                }}</span>
              </div>
              <div class="min-w-0">
                <p
                  class="text-navbar-text-hover text-xs font-semibold truncate"
                >
                  {{ profileStore.user?.name }}
                </p>
                <p class="text-navbar-text text-[11px] capitalize truncate">
                  {{ ibMode ? "IB" : displayRole }}
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
