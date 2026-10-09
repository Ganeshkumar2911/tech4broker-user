<script setup>
import { onMounted, ref, computed, watchEffect, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Info,
  UserPlus,
  UserCheck,
  BarChart2,
  KeyRound,
} from "lucide-vue-next";
import { useFmLeaderboardStore } from "@/stores/fm/leaderboard";
import { useProfileStore } from "@/stores/shared/profile";
import Pagination from "@/components/base/Pagination.vue";
import FollowDialog from "@/components/fm/leaderboard/FollowDialog.vue";
import PrivateOfferDialog from "@/components/fm/leaderboard/PrivateOfferDialog.vue";
import SparklineChart from "@/components/fm/leaderboard/SparklineChart.vue";
import BaseMenu from "@/components/base/BaseMenu.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import { getAvatar } from "@/utils/avtar.js";
import { formatFollowers } from "@/utils/formatters.js";

const props = defineProps({
  showFollow: {
    type: Boolean,
    default: true,
  },
});

const router = useRouter();
const route = useRoute();
const profile = useProfileStore();
const store = useFmLeaderboardStore();

const dialog = ref({ open: false, mode: "follow", item: null });
const privateOfferDialog = ref({ open: false, offerData: null });

const openDialog = (mode, item) => {
  if (mode === "unfollow" && item?.following_account_id) {
    store.fetchUnfollowPreview({
      trading_account_id: item.following_account_id,
    });
  }

  dialog.value = {
    open: true,
    mode,
    item,
  };
};

watchEffect(() => {
  console.log(store.data);
});

// const riskLevels = [
//   {
//     label: "LOW",
//     color: "bg-secondary-green",
//   },
//   {
//     label: "MEDIUM",
//     color: "bg-secondary-yellow",
//   },
//   {
//     label: "HIGH",
//     color: "bg-primary-yellow",
//   },
//   {
//     label: "EXTREME",
//     color: "bg-red-600",
//   },
// ];

const getRisk = (maxDD) => {
  if (maxDD <= 25) return "LOW";
  if (maxDD <= 50) return "MEDIUM";
  if (maxDD <= 75) return "HIGH";

  return "EXTREME";
};

const generateChartData = (profit, winRate) => {
  const baseValue = 10 + winRate / 10;
  const trend = profit >= 0 ? 1 : -1;
  return Array.from({ length: 12 }, (_, i) =>
    Math.max(1, Math.round(baseValue + i * trend + (Math.random() - 0.5) * 2)),
  );
};

const initials = (name) =>
  (name ?? "FM")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const fmtFollowers = (n) => formatFollowers(n);

const riskLevels = [
  { label: "LOW", color: "bg-secondary-green", textColor: "text-[#141710]" },
  {
    label: "MEDIUM",
    color: "bg-secondary-yellow",
    textColor: "text-[#1a170b]",
  },
  { label: "HIGH", color: "bg-primary-yellow", textColor: "text-[#191001]" },
  { label: "EXTREME", color: "bg-red-600", textColor: "text-[#FFFEFD]" },
];

const getRiskConfig = (maxDD) => {
  if (maxDD <= 25) return riskLevels[0];
  if (maxDD <= 50) return riskLevels[1];
  if (maxDD <= 75) return riskLevels[2];
  return riskLevels[3];
};

const getGrowthVal = (item) => {
  return Number(item?.growth_percent ?? 0);
};

const formatGrowth = (item) => {
  const val = getGrowthVal(item);
  if (isNaN(val)) return "0%";
  return `${val}%`;
};

const profitClass = (val) =>
  val >= 0 ? "text-primary-green" : "text-primary-red";

const profitSign = (val) => (val >= 0 ? "+" : "");

const formatBrokerCurrency = (currency) => {
  const normalizedCurrency = String(currency || "").toUpperCase();
  const currencySymbols = {
    USD: "$",
    USC: "C",
    CAD: "C$",
    EUR: "€",
    GBP: "£",
  };

  return currencySymbols[normalizedCurrency] || normalizedCurrency || "—";
};

const goToDetails = (item) => {
  localStorage.setItem("activeFm", JSON.stringify(item));

  // Persist the active currency for downstream pages.
  const currency = item?.broker_currency ?? null;
  if (currency) {
    localStorage.setItem("active_currency", currency);
  }

  router.push(`/fm-copy-trading-profile/${item.id}`);
};

const handlePageChange = (page) => {
  store.pagination.page = page;
  store.fetchFmLeaderboard(true, page);
};

const getMenuItems = (item) => [
  {
    label: "Follow",
    action: "follow",
    value: "follow",
    icon: "person_add",
    disabled: !item.can_follow,
  },
];

const menuItems = [
  {
    label: "Follow",
    value: "follow",
    icon: UserPlus,
  },
];

const handleMenu = (account, menuItem) => {
  if (menuItem.value === "follow" && account.can_follow) {
    openDialog("follow", account);
  }
};

const openPrivateOfferDialog = (offerData) => {
  privateOfferDialog.value = { open: true, offerData };
};

const closePrivateOfferDialog = () => {
  privateOfferDialog.value = { open: false, offerData: null };
  store.clearPrivateOfferData();
};

watch(
  () => store.pendingPrivateOfferData,
  (val) => {
    if (val) {
      openPrivateOfferDialog(val);
    }
  },
  { immediate: true },
);

onMounted(() => {
  store.fetchFmLeaderboard();

  // Check if there's pending private offer data from join link
  if (store.pendingPrivateOfferData) {
    openPrivateOfferDialog(store.pendingPrivateOfferData);
  }
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Skeleton -->
    <div
      v-if="store.isLoading"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
    >
      <div
        v-for="n in 6"
        :key="n"
        :id="n === 1 ? 'tour-copy-card-first' : undefined"
        class="bg-card-background rounded-4xl p-8 flex flex-col gap-4 animate-pulse"
      >
        <!-- Card Header Skeleton -->
        <div
          class="flex items-center justify-between gap-2 border-b border-primary-border pb-5"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-14 h-14 rounded-full bg-primary-border/60 shrink-0" />
            <div class="flex flex-col gap-2">
              <div class="h-4 w-32 bg-primary-border/70 rounded" />
              <div class="h-3 w-20 bg-primary-border/40 rounded" />
            </div>
          </div>
          <div class="w-5 h-5 rounded-full bg-primary-border/40 shrink-0" />
        </div>

        <!-- Growth Section Skeleton -->
        <div class="flex flex-col gap-2 border-b border-primary-border pb-3">
          <div class="h-3 w-16 bg-primary-border/40 rounded" />
          <div class="h-6 w-24 bg-primary-border/60 rounded" />
        </div>

        <!-- Metrics Skeleton -->
        <div class="grid gap-2 border-b border-primary-border pb-3">
          <div class="flex items-center justify-between">
            <div class="h-3.5 w-20 bg-primary-border/40 rounded" />
            <div class="h-3.5 w-12 bg-primary-border/60 rounded" />
          </div>
          <div class="flex items-center justify-between">
            <div class="h-3.5 w-24 bg-primary-border/40 rounded" />
            <div class="h-3.5 w-12 bg-primary-border/60 rounded" />
          </div>
          <div class="flex items-center justify-between">
            <div class="h-3.5 w-16 bg-primary-border/40 rounded" />
            <div class="h-3.5 w-14 bg-primary-border/60 rounded" />
          </div>
          <div class="flex items-center justify-between">
            <div class="h-3.5 w-20 bg-primary-border/40 rounded" />
            <div class="h-3.5 w-14 bg-primary-border/60 rounded" />
          </div>
        </div>

        <!-- Risk Bar Skeleton -->
        <div class="flex items-center gap-2">
          <div class="flex-[1.6] h-6 rounded bg-primary-border/60" />
          <div class="flex-1 h-3 rounded bg-primary-border/30" />
          <div class="flex-1 h-3 rounded bg-primary-border/30" />
          <div class="flex-1 h-3 rounded bg-primary-border/30" />
        </div>

        <!-- Actions Skeleton -->
        <div class="flex gap-2 pt-1">
          <div class="w-full h-12 rounded-full bg-primary-border/50" />
        </div>
      </div>
    </div>

    <!-- Cards -->
    <div
      v-else-if="store.data.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
    >
      <div
        v-for="(item, index) in store.data"
        :key="item.id"
        :id="index === 0 ? 'tour-copy-card-first' : undefined"
        class="bg-card-background rounded-4xl p-8 flex flex-col gap-4 hover:border-primary-border/40 transition-colors duration-200"
      >
        <!-- Card Header -->
        <div
          class="flex items-center justify-between gap-2 border-b border-primary-border pb-5"
        >
          <div class="flex items-center gap-2.5">
            <div class="flex items-center gap-2.5">
              <div
                class="w-14 h-14 rounded-full bg-primary/50 flex items-center justify-center text-accent text-xs font-semibold shrink-0"
              >
                <img :src="getAvatar(item.id)" class="w-14 h-14 rounded-full" />

                <!-- {{ initials(item.label_name) }} -->
              </div>
              <div class="flex flex-col gap-0.5">
                <p
                  class="text-sm font-semibold text-primary-text leading-tight"
                >
                  {{ item.label_name ?? "Fund Manager" }}
                </p>
                <p class="text-[12px] text-secondary-text">
                  {{ fmtFollowers(item.total_followers) }} followers
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="showFollow"
            :id="index === 0 ? 'tour-copy-card-menu' : undefined"
          >
            <Tooltip text="Strategy Options & Actions" position="left">
              <BaseMenu
                :items="getMenuItems(item)"
                @select="handleMenu(item, $event)"
              >
                <template #trigger>
                  <button
                    type="button"
                    class="text-secondary-text hover:text-primary-text transition-colors cursor-pointer rounded-full"
                  >
                    <BaseIcon name="more_vert" :size="20" />
                  </button>
                </template>
              </BaseMenu>
            </Tooltip>
          </div>
        </div>

        <div class="gap-2 border-b border-primary-border pb-3">
          <h2 class="text-sm pl-1.25 text-secondary-text">Growth</h2>

          <p
            class="flex items-center gap-1 font-['Inter'] font-bold text-[14px] leading-none tracking-normal mt-1"
            :class="
              getGrowthVal(item) >= 0
                ? 'text-primary-green'
                : 'text-primary-red'
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linejoin="round"
              class="w-4 h-4 shrink-0 transition-transform duration-200"
              :class="
                getGrowthVal(item) >= 0
                  ? 'text-green-500'
                  : 'text-red-500 rotate-180'
              "
            >
              <path d="M12 4l7 7h-4v9H9v-9H5z" />
            </svg>
            <span>{{ formatGrowth(item) }}</span>
          </p>
        </div>

        <!-- Metrics -->
        <div class="grid gap-1 border-b border-primary-border pb-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <p class="text-[14px] text-secondary-text tracking-wide mt-1">
                Win Rate
              </p>
              <Tooltip
                text="Percentage of profitable trades out of total closed trades"
                position="top"
                wrap
              >
                <Info
                  :size="11"
                  class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0 mt-1"
                />
              </Tooltip>
            </div>
            <p class="font-bold text-[13px] text-primary-text">
              {{ item.win_rate_percent ?? "0" }}%
            </p>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <p class="text-[14px] text-secondary-text tracking-wide mt-1">
                Max Drawdown
              </p>
              <Tooltip
                text="Maximum peak-to-trough decline in account equity"
                position="top"
                wrap
              >
                <Info
                  :size="11"
                  class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0 mt-1"
                />
              </Tooltip>
            </div>
            <p class="font-bold text-[13px] text-primary-text">
              {{ item.max_dd_percent ?? "0" }}%
            </p>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <p class="text-[14px] text-secondary-text tracking-wide mt-1">
                Fees
              </p>
              <Tooltip
                text="Performance fee percentage charged on profits generated"
                position="top"
                wrap
              >
                <Info
                  :size="11"
                  class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0 mt-1"
                />
              </Tooltip>
            </div>
            <p class="font-bold text-[13px] text-primary-text">
              {{ item.fee ?? item.performance_fee ?? 0 }}%
            </p>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <p class="text-[14px] text-secondary-text tracking-wide mt-1">
                Min Deposit
              </p>
              <Tooltip
                text="Minimum capital required to copy this fund manager"
                position="top"
                wrap
              >
                <Info
                  :size="11"
                  class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0 mt-1"
                />
              </Tooltip>
            </div>
            <p class="font-bold text-[13px] text-primary-text">
              {{ item.min_capital ?? "-" }} {{ item.broker_currency || "USD" }}
            </p>
          </div>
        </div>

        <Tooltip
          :text="
            'Risk level: ' +
            getRiskConfig(item.max_dd_percent).label +
            ' based on maximum drawdown (' +
            (item.max_dd_percent ?? '0') +
            '%)'
          "
          position="top"
          class="w-full block"
        >
          <div class="flex items-center gap-2">
            <div
              v-for="risk in riskLevels"
              :key="risk.label"
              class="h-3 flex items-center justify-center transition-all cursor-default"
              :class="[
                risk.color,
                risk.label === getRiskConfig(item.max_dd_percent).label
                  ? ['flex-[1.6] h-6 font-bold text-3xs', risk.textColor]
                  : 'flex-1',
              ]"
            >
              <span
                v-if="risk.label === getRiskConfig(item.max_dd_percent).label"
              >
                {{ risk.label }} RISK
              </span>
            </div>
          </div>
        </Tooltip>

        <!-- Actions -->
        <div class="flex gap-2">
          <Tooltip
            text="View full fund manager profile and detailed performance history"
            position="top"
            class="flex-1 w-full"
          >
            <button
              @click="goToDetails(item)"
              class="w-full flex items-center justify-center gap-1.5 px-3 py-3 text-md rounded-full text-primary-text font-semibold bg-background hover:text-primary-text hover:bg-primary-border transition-all cursor-pointer"
            >
              Know More
            </button>
          </Tooltip>

          <!-- <button
            v-if="profile.user?.role === 'client'"
            @click="openDialog(item.can_follow ? 'follow' : 'follow', item)"
            class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer border-primary-border bg-background text-secondary-text hover:text-primary-text hover:bg-primary-border"
          >
            <UserPlus class="w-3.5 h-3.5" />
            {{ item.can_follow ? "Follow" : "Follow" }}
          </button> -->
        </div>
      </div>
    </div>

    <!-- Empty State Card -->
    <div
      v-else
      class="bg-card-background rounded-4xl p-8 sm:p-12 flex flex-col items-center justify-center text-center"
    >
      <EmptyState
        title="No Fund Managers Available"
        subtitle="Check back later for strategy providers to follow."
      />
    </div>

    <!-- Pagination -->
    <Pagination
      v-if="store.pagination.total_items > store.pagination.per_page"
      :pagination="store.pagination"
      @page-change="handlePageChange"
    />

    <!-- Follow Dialog -->
    <FollowDialog
      :open="dialog.open"
      :mode="dialog.mode"
      :item="dialog.item"
      :unfollow-preview-loading="store.unfollowPreviewLoading"
      :unfollow-active-positions="store.unfollowPreview?.active_positions"
      @close="dialog.open = false"
      @success="store.fetchFmLeaderboard(true)"
    />

    <!-- Private Offer Dialog -->
    <PrivateOfferDialog
      :open="privateOfferDialog.open"
      :offer-data="privateOfferDialog.offerData"
      @close="closePrivateOfferDialog"
      @success="closePrivateOfferDialog"
    />
  </div>
</template>
