<script setup>
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useProfileStore } from "@/stores/shared/profile";
import { useThemeStore } from "@/stores/shared/theme";
import Tooltip from "@/components/base/Tooltip.vue";
import BaseIcon from "../../components/base/BaseIcon.vue";
import BaseBadge from "@/components/base/BaseBadge.vue";
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

const clientNavItems = [
  { label: "Home", to: "/dashboard", icon: "home" },
  { label: "Accounts", to: "/trading-accounts", icon: "account_balance" },
  { label: "Funds", to: "/funds", icon: "account_balance_wallet" },
  { label: "Trading Reports", to: "/trading-reports", icon: "analytics" },
  {
    label: "Terminal",
    to: "/chart-trading",
    icon: "monitoring",
    target: "_blank",
    badge: "NEW",
    trailingIcon: "launch",
  },
  {
    label: "Copy Trading",
    to: "/copy-trading",
    icon: "file_copy",
    children: [
      {
        label: "Leaderboard",
        to: "/copy-trading?tab=copy-trading",
        tab: "copy-trading",
      },
      {
        label: "My Copy Trading",
        to: "/copy-trading?tab=my-copy-trading",
        tab: "my-copy-trading",
      },
      {
        label: "Following History",
        to: "/copy-trading?tab=history",
        tab: "history",
      },
      // {
      //   label: "Become a Provider",
      //   to: "/copy-trading?tab=provider",
      //   tab: "provider",
      // },
    ],
  },
  // { label: "Promotions", to: "/refer-a-friend", icon: "local_offer" },
  { label: "Loyalty", to: "/loyalty-program", icon: "stars" },
  { label: "Cashback", to: "/cashback", icon: "payments" },
  { label: "Tickets", to: "/tickets", icon: "confirmation_number" },
];

const openMenus = ref({
  "Copy Trading": false,
});

watch(
  () => route.path,
  (newPath) => {
    if (newPath.startsWith("/copy-trading")) {
      openMenus.value["Copy Trading"] = true;
    }
  },
  { immediate: true },
);

const toggleMenu = (label) => {
  openMenus.value[label] = !openMenus.value[label];
};

const isChildActive = (child) => {
  if (route.path === "/copy-trading") {
    const currentTab = route.query.tab || "copy-trading";
    const normalizedCurrent =
      currentTab === "following-history"
        ? "history"
        : currentTab === "leaderboard"
          ? "copy-trading"
          : currentTab;
    return normalizedCurrent === child.tab;
  }
  return false;
};

const isActive = (path) =>
  route.path === path || (path !== "/dashboard" && route.path.startsWith(path));

const showIbToggle = computed(() => {
  return profileStore.user?.is_ib === true || profileStore.user?.role === "ib";
});

const getItemTarget = (item) => {
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return undefined;
  }
  return item.target;
};

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
      isCollapsed ? 'w-20' : 'w-70',
    ]"
  >
    <!-- Header -->
    <div id="tour-logo" class="h-15 flex items-center border-navbar-border">
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
            :class="!themeStore.isDark ? 'w-9  h-9 object-contain' : 'w-9 h-9 object-contain'"
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
          <div class="w-5 h-5 rounded-lg bg-navbar-hover-bg/80 animate-pulse shrink-0" />
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
          <div class="w-8 h-8 rounded-full bg-navbar-hover-bg/80 animate-pulse shrink-0" />
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
      <template v-for="item in clientNavItems" :key="item.to">
        <!-- Item without children OR when sidebar is collapsed -->
        <Tooltip
          v-if="!item.children || isCollapsed"
          :text="item.label"
          position="right"
          :disabled="!isCollapsed"
          :block="true"
        >
          <button
            v-if="item.children && isCollapsed"
            type="button"
            @click="emit('toggle-collapse')"
            class="flex items-center transition-all duration-200 group justify-center w-10 h-10 p-0 mx-auto rounded-xl cursor-pointer"
            :class="[
              isActive(item.to)
                ? 'bg-navbar-active-bg text-primary-text justify-center w-10 h-10 rounded-xl border-l-4 border-button font-bold mx-auto p-0'
                : 'text-navbar-text hover:text-navbar-text-hover hover:bg-navbar-hover-bg'
            ]"
          >
            <BaseIcon
              v-if="typeof item.icon === 'string'"
              :name="item.icon"
              :size="20"
            />
            <component
              v-else
              :is="item.icon"
              class="w-4 h-4 transition-transform group-hover:scale-110 shrink-0"
            />
          </button>
          <RouterLink
            v-else
            :to="item.to"
            :target="getItemTarget(item)"
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
              class="shrink-0"
            />
            <component
              v-else
              :is="item.icon"
              class="w-5 h-5 shrink-0"
            />
            <div v-if="!isCollapsed" class="flex items-center gap-2 min-w-0">
              <span class="truncate">{{ item.label }}</span>
              <BaseBadge
                v-if="item.badge"
                variant="danger"
                size="xs"
                class="font-bold tracking-wider shrink-0"
              >
                {{ item.badge }}
              </BaseBadge>
            </div>
            <BaseIcon
              v-if="item.trailingIcon && !isCollapsed"
              :name="item.trailingIcon"
              :size="16"
              class="ml-auto text-navbar-text group-hover:text-navbar-text-hover shrink-0"
            />
          </RouterLink>
        </Tooltip>

        <!-- Item with children (Expanded sidebar mode) -->
        <div v-else class="flex flex-col">
          <!-- Parent item (Accordion Header) -->
          <div
            @click="toggleMenu(item.label)"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-navbar-text hover:text-navbar-text-hover hover:bg-navbar-hover-bg transition-all duration-200 group cursor-pointer select-none"
          >
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <BaseIcon
                v-if="typeof item.icon === 'string'"
                :name="item.icon"
                :size="20"
                class="shrink-0"
              />
              <component
                v-else
                :is="item.icon"
                class="w-5 h-5 shrink-0"
              />
              <span class="truncate">{{ item.label }}</span>
            </div>

            <!-- Accordion Chevron Arrow (Google Material icon, exactly 18px without extra padding) -->
            <BaseIcon
              name="expand_more"
              :size="18"
              class="ml-auto text-navbar-text group-hover:text-navbar-text-hover transition-transform duration-200 shrink-0"
              :class="{ 'rotate-180': openMenus[item.label] }"
            />
          </div>

          <!-- Accordion Submenu -->
          <div
            class="grid transition-all duration-200 ease-in-out overflow-hidden"
            :class="openMenus[item.label] ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'"
          >
            <div class="overflow-hidden flex flex-col space-y-1">
              <RouterLink
                v-for="child in item.children"
                :key="child.to"
                :to="child.to"
                @click="emit('close')"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group"
                :class="[
                  isChildActive(child)
                    ? 'nav-item-active bg-navbar-active-bg text-primary-text font-bold'
                    : 'font-medium text-navbar-text hover:text-navbar-text-hover hover:bg-navbar-hover-bg',
                ]"
              >
                <!-- Invisible 20px spacer matching parent icon -->
                <BaseIcon
                  :name="item.icon"
                  :size="20"
                  class="opacity-0 shrink-0 select-none pointer-events-none"
                />
                <span class="truncate">{{ child.label }}</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </template>
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
              class="w-8 h-8 rounded-full bg-button text-button-text flex items-center justify-center shrink-0"
            >
              <span class="text-xs font-bold">{{
                profileStore.user?.name?.charAt(0).toUpperCase() || "C"
              }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-navbar-text-hover text-xs font-semibold truncate">
                {{ profileStore.user?.name || "Client User" }}
              </p>
              <p class="text-navbar-text text-[11px] capitalize truncate">
                Client Portal
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
