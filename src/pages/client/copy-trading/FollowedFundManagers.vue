<template>
  <div class="space-y-6">
    <!-- Header Controls & Filters -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
    >
      <!-- Sleek Stats Pills -->
      <div v-if="store.isFetched" class="flex items-center gap-2">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card-background text-xs">
          <span class="text-secondary-text">Total Following:</span>
          <span class="font-bold text-primary-text font-mono">
            {{ store.pagination.total_items || store.records.length }}
          </span>
        </div>
      </div>
      <div v-else />

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <BaseSearch
          v-model="store.filters.search"
          placeholder="Search FM, email, account..."
          container-class="w-full sm:w-60"
          @update:modelValue="onSearch"
        />

        <div class="w-full sm:w-36">
          <BaseSelect
            v-model="store.filters.status"
            :options="statusOptions"
            placeholder="All Status"
            borderless
            rounded="full"
            @update:modelValue="store.applyFilters()"
          />
        </div>

        <button
          v-if="hasFilters"
          type="button"
          class="flex items-center justify-center px-4 h-10 rounded-full bg-card-background text-primary-text text-xs font-medium hover:opacity-80 transition-all cursor-pointer shrink-0 border-0 shadow-none outline-none focus:outline-none"
          @click="store.resetFilters()"
        >
          Clear
        </button>

        <RefreshButton
          :loading="store.loading"
          title="Refresh"
          @click="store.fetchFollowedFundManagers(true)"
        />
      </div>
    </div>

    <!-- Skeleton Cards -->
    <div
      v-if="store.loading"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="bg-card-background rounded-4xl p-6 flex flex-col gap-4 animate-pulse"
      >
        <div
          class="flex items-center justify-between pb-3 border-b border-primary-border/60"
        >
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-primary-border/60 shrink-0" />
            <div class="space-y-1.5">
              <div class="h-4 w-28 bg-primary-border/60 rounded" />
              <div class="h-3 w-20 bg-primary-border/40 rounded" />
            </div>
          </div>
          <div class="h-6 w-16 bg-primary-border/40 rounded-full" />
        </div>

        <div class="space-y-1.5 pb-3 border-b border-primary-border/60">
          <div class="h-3 w-16 bg-primary-border/40 rounded" />
          <div class="h-6 w-28 bg-primary-border/60 rounded" />
        </div>

        <div class="space-y-2.5">
          <div
            v-for="m in 5"
            :key="m"
            class="flex items-center justify-between"
          >
            <div class="h-3.5 w-20 bg-primary-border/40 rounded" />
            <div class="h-3.5 w-16 bg-primary-border/60 rounded" />
          </div>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <div class="flex-1 h-9 bg-primary-border/40 rounded-full" />
          <div class="flex-1 h-9 bg-primary-border/40 rounded-full" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="store.records.length === 0"
      class="bg-card-background rounded-4xl p-8 sm:p-12 flex flex-col items-center justify-center text-center"
    >
      <EmptyState
        title="No Followed Fund Managers Found"
        subtitle="You are not following any fund managers yet. Explore the leaderboard to start copying top strategies."
      />
    </div>

    <!-- FM Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="row in store.records"
        :key="row.id"
        class="bg-card-background rounded-4xl p-6 flex flex-col justify-between gap-4 transition-all duration-200"
      >
        <!-- Top Section -->
        <div class="space-y-4">
          <!-- FM Header -->
          <div
            class="flex items-center justify-between gap-3 pb-3 border-b border-primary-border/80"
          >
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div
                class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden"
              >
                <img
                  :src="getAvatar(row.fund_manager?.id || row.id)"
                  :alt="row.fund_manager?.name || 'FM'"
                  class="w-12 h-12 rounded-full object-cover"
                />
              </div>
              <div class="flex flex-col min-w-0 flex-1">
                <div class="flex items-center gap-2 min-w-0">
                  <p
                    class="text-sm font-bold text-primary-text leading-tight truncate"
                  >
                    {{ row.fund_manager?.name ?? "Unnamed FM" }}
                  </p>
                  <span
                    v-if="getRowCurrency(row)"
                    class="inline-flex items-center px-2 py-0.5 rounded-full bg-background text-[10px] font-bold text-secondary-text uppercase tracking-wider shrink-0"
                  >
                    {{ getRowCurrency(row) }}
                  </span>
                </div>
                <p class="text-xs text-secondary-text truncate mt-0.5">
                  Joined {{ formatDate(row.joined_at) }}
                </p>
              </div>
            </div>

            <!-- Status Badge & Menu -->
            <div class="flex items-center gap-2 shrink-0">
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize shrink-0"
                :class="statusClass(row.status)"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                {{
                  row.status === "active" ? "Active" : row.status || "Paused"
                }}
              </span>

              <BaseMenu
                :items="getMenuItems(row)"
                trigger-class="!p-1.5 bg-background hover:bg-primary-border/40 text-secondary-text hover:text-primary-text rounded-full flex items-center justify-center transition-colors cursor-pointer"
                @select="handleMenuAction(row, $event)"
              >
                <template #trigger>
                  <MoreVertical class="w-4 h-4" />
                </template>
              </BaseMenu>
            </div>
          </div>

          <!-- Net Profit Highlight -->
          <div class="pb-3 border-b border-primary-border/80">
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-secondary-text">Net Profit</span>
              <Tooltip text="Net profit earned from copying this strategy after performance fee deductions" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <div class="flex items-baseline justify-between gap-2 mt-1">
              <p
                class="font-bold text-xl font-mono tabular-nums leading-tight"
                :class="
                  (row.net_profit ?? 0) >= 0
                    ? 'text-primary-green'
                    : 'text-primary-red'
                "
              >
                {{ formatPnlValue(row.net_profit, getRowCurrency(row)) }}
              </p>
              <span class="text-xs text-secondary-text truncate">
                Gross:
                <span class="font-semibold text-primary-text font-mono">{{
                  formatPnlValue(
                    row.gross_pnl ?? row.realized_pnl,
                    getRowCurrency(row),
                  )
                }}</span>
              </span>
            </div>
          </div>

          <!-- Stats List -->
          <div class="space-y-2.5 text-xs">
            <div class="flex items-center justify-between text-[13px]">
              <div class="flex items-center gap-1.5">
                <span class="text-secondary-text">Equity</span>
                <Tooltip text="Total equity currently allocated to this fund manager strategy" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <span class="font-bold text-primary-text font-mono">
                {{
                  formatCurrencyValue(
                    getFollowerDisplayEquity(row),
                    getRowCurrency(row),
                  )
                }}
              </span>
            </div>

            <div
              v-if="isLegsLoaded(row.id)"
              class="flex items-center justify-between text-[13px]"
            >
              <div class="flex items-center gap-1.5">
                <span class="text-secondary-text">Floating P&L</span>
                <Tooltip text="Unrealized floating profit or loss on current active copied trades" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <div class="flex items-center gap-1.5">
                <span
                  class="font-bold font-mono"
                  :class="
                    getFollowerFloatingPnl(row.id) >= 0
                      ? 'text-primary-green'
                      : 'text-primary-red'
                  "
                >
                  {{
                    formatPnlValue(
                      getFollowerFloatingPnl(row.id),
                      getRowCurrency(row),
                    )
                  }}
                </span>
                <span
                  v-if="openLegsByFollower[row.id]"
                  class="text-[11px] text-secondary-text font-sans"
                >
                  ({{ openLegsByFollower[row.id]?.length || 0 }}
                  {{
                    openLegsByFollower[row.id]?.length === 1 ? "leg" : "legs"
                  }})
                </span>
                <button
                  type="button"
                  class="text-secondary-text hover:text-primary-text transition-colors p-0.5 cursor-pointer disabled:opacity-50 shrink-0"
                  :disabled="isLegsLoading(row.id)"
                  title="Refresh live Floating P&L"
                  @click.stop="fetchFollowerOpenLegs(row.id)"
                >
                  <Loader2
                    v-if="isLegsLoading(row.id)"
                    class="w-3.5 h-3.5 animate-spin text-primary-text"
                  />
                  <RefreshCw v-else class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div v-else class="flex items-center justify-between text-[13px]">
              <div class="flex items-center gap-1.5">
                <span class="text-secondary-text">Floating P&L</span>
                <Tooltip text="Unrealized floating profit or loss on current active copied trades" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <button
                type="button"
                class="text-xs text-secondary-text hover:text-primary-text flex items-center gap-1 cursor-pointer disabled:opacity-50"
                :disabled="isLegsLoading(row.id)"
                @click.stop="fetchFollowerOpenLegs(row.id)"
              >
                <Loader2
                  v-if="isLegsLoading(row.id)"
                  class="w-3 h-3 animate-spin"
                />
                <RefreshCw v-else class="w-3 h-3" />
                <span>{{
                  isLegsLoading(row.id) ? "Calculating..." : "Check Live"
                }}</span>
              </button>
            </div>

            <div class="flex items-center justify-between text-[13px]">
              <span class="text-secondary-text">Account</span>
              <span class="font-bold text-primary-text font-mono">
                #{{
                  row.account?.account_number || row.trading_account_id || "—"
                }}
                <span
                  v-if="row.account?.broker_label"
                  class="font-medium text-secondary-text font-sans"
                >
                  ({{ row.account.broker_label }})
                </span>
              </span>
            </div>

            <div class="flex items-center justify-between text-[13px]">
              <div class="flex items-center gap-1.5">
                <span class="text-secondary-text">Lot Settings</span>
                <Tooltip text="Copied lot sizing mode (Fixed lot or Multiplier ratio)" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <span class="font-bold text-primary-text capitalize">
                {{ row.lot_value != null ? row.lot_value : 1
                }}{{ row.lot_type === "multiplier" ? "x" : " Lots" }} ({{
                  row.lot_type ?? "Fixed"
                }})
              </span>
            </div>

            <div class="flex items-center justify-between text-[13px]">
              <div class="flex items-center gap-1.5">
                <span class="text-secondary-text">Total Trades</span>
                <Tooltip text="Number of copied trades executed for this strategy" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <span class="font-bold text-primary-text font-mono">{{
                row.total_trades ?? 0
              }}</span>
            </div>

            <div class="flex items-center justify-between text-[13px]">
              <div class="flex items-center gap-1.5">
                <span class="text-secondary-text">Total Fees</span>
                <Tooltip text="Cumulative performance and management fees paid to the manager" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <span class="font-bold text-primary-text font-mono">{{
                formatCurrencyValue(row.total_fees, getRowCurrency(row))
              }}</span>
            </div>

            <div class="flex items-center justify-between text-[13px]">
              <div class="flex items-center gap-1.5">
                <span class="text-secondary-text">Performance Fee</span>
                <Tooltip text="Profit share percentage charged by the fund manager on profitable trades" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <span class="font-bold text-primary-text font-mono"
                >{{
                  row.fund_manager?.performance_fee ??
                  row.offer?.performance_fee ??
                  0
                }}%</span
              >
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center gap-2 pt-2">
          <button
            type="button"
            @click="goToTradeBook(row)"
            class="flex-1 flex items-center justify-center gap-1.5 bg-background hover:bg-primary-border/40 text-primary-text font-bold text-xs py-2.5 rounded-full transition-all duration-200 cursor-pointer"
          >
            <BookOpen class="w-3.5 h-3.5 text-secondary-text" />
            <span>Trade Book</span>
          </button>
          <button
            type="button"
            @click="goToDetails(row)"
            class="flex-1 flex items-center justify-center gap-1.5 bg-background hover:bg-primary-border/40 text-primary-text font-bold text-xs py-2.5 rounded-full transition-all duration-200 cursor-pointer"
          >
            <Info class="w-3.5 h-3.5 text-secondary-text" />
            <span>Analysis Profile</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="mt-4">
      <Pagination
        v-if="store.pagination.total_items > store.pagination.per_page"
        :pagination="store.pagination"
        @page-change="handlePageChange"
      />
    </div>

    <FollowDialog
      :open="dialog.open"
      :mode="dialog.mode"
      :item="dialog.item"
      @close="dialog.open = false"
      @success="store.fetchFollowedFundManagers(true)"
    />

    <EditLotDialog
      :open="editLotDialog.open"
      :item="editLotDialog.item"
      @close="editLotDialog.open = false"
      @success="store.fetchFollowedFundManagers(true)"
    />

    <StatusUpdateDialog
      :status-dialog="statusDialog"
      @update="updateFollowerStatus"
      @close="statusDialog.open = false"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Users,
  UserMinus,
  Info,
  BookOpen,
  Play,
  Pause,
  RefreshCw,
  Loader2,
  MoreVertical,
  SlidersHorizontal,
} from "lucide-vue-next";
import BaseMenu from "@/components/base/BaseMenu.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import { useFollowedFundManagersStore } from "@/stores/fm/followedFundManagers";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import Pagination from "@/components/base/Pagination.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseSearch from "@/components/base/BaseSearch.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";
import FollowDialog from "@/components/fm/leaderboard/FollowDialog.vue";
import EditLotDialog from "@/components/fm/leaderboard/EditLotDialog.vue";
import StatusUpdateDialog from "@/components/fm/leaderboard/statusUpdateDialog.vue";
import { formatDate } from "@/utils/timeFormatter.js";
import { calculateTotalFloatingPnl } from "@/utils/livePNL.js";
import { subscribeTradeSymbols } from "@/utils/symbolUtils.js";
import { getAvatar } from "@/utils/avtar.js";
import apiRequest from "@/api/request";
import urls from "@/api/urls";

const store = useFollowedFundManagersStore();
const router = useRouter();
const snackbar = useSnackbarStore();

const editLotDialog = ref({ open: false, item: null });

const openEditLotDialog = (row) => {
  editLotDialog.value = { open: true, item: row };
};

const getMenuItems = (row) => [
  {
    id: "edit_lot",
    label: "Edit Lot Value",
    icon: SlidersHorizontal,
  },
  {
    id: "status",
    label: row.status === "active" ? "Pause Copying" : "Resume Copying",
    icon: row.status === "active" ? Pause : Play,
  },
  {
    id: "trade_book",
    label: "View Trade Book",
    icon: BookOpen,
  },
  {
    divider: true,
  },
  {
    id: "unfollow",
    label: "Unfollow Fund Manager",
    icon: UserMinus,
    danger: true,
  },
];

const handleMenuAction = (row, item) => {
  switch (item.id) {
    case "edit_lot":
      openEditLotDialog(row);
      break;
    case "status":
      openStatusDialog(row);
      break;
    case "trade_book":
      goToTradeBook(row);
      break;
    case "profile":
      goToDetails(row);
      break;
    case "unfollow":
      openUnfollow(row);
      break;
  }
};

const openLegsByFollower = ref({});
const loadingLegsByFollower = ref({});

const fetchFollowerOpenLegs = async (followerId) => {
  if (!followerId) return;
  loadingLegsByFollower.value[followerId] = true;
  try {
    const res = await apiRequest(urls.KEYS.GET, urls.tradeBook.openLegs, {
      params: { follower_id: followerId },
      isTokenRequired: true,
    });
    const legs = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
        ? res
        : [];
    openLegsByFollower.value[followerId] = legs;
    subscribeTradeSymbols(legs, { onlyOpen: false });
  } catch (err) {
    console.error("Failed to load open legs for follower:", followerId, err);
    snackbar.show(err?.message || "Failed to load live floating P&L.", "error");
  } finally {
    loadingLegsByFollower.value[followerId] = false;
  }
};

const isLegsLoaded = (followerId) => {
  return openLegsByFollower.value[followerId] !== undefined;
};

const isLegsLoading = (followerId) => {
  return Boolean(loadingLegsByFollower.value[followerId]);
};

const getFollowerFloatingPnl = (followerId) => {
  const legs = openLegsByFollower.value[followerId];
  if (!legs || legs.length === 0) return 0;
  return calculateTotalFloatingPnl(legs);
};

const getFollowerDisplayEquity = (row) => {
  const baseEquity = Number(row?.equity || 0);
  if (isLegsLoaded(row?.id)) {
    return baseEquity + getFollowerFloatingPnl(row?.id);
  }
  return baseEquity;
};

watch(
  () => store.records,
  (records) => {
    if (Array.isArray(records)) {
      records.forEach((row) => {
        if (
          row &&
          Array.isArray(row.open_legs) &&
          row.open_legs.length > 0 &&
          !openLegsByFollower.value[row.id]
        ) {
          openLegsByFollower.value[row.id] = row.open_legs;
          subscribeTradeSymbols(row.open_legs, { onlyOpen: false });
        }
      });
    }
  },
  { immediate: true, deep: true },
);

const dialog = ref({ open: false, mode: "unfollow", item: null });

const statusOptions = [
  { label: "All Status", value: "" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
];

const statusDialog = ref({
  open: false,
  item: null,
  loading: false,
  is_active: false,
});

const openStatusDialog = (row) => {
  statusDialog.value = {
    open: true,
    item: row,
    loading: false,
    is_active: row.status !== "active",
  };
};

const updateFollowerStatus = () => {
  const row = statusDialog.value.item;
  if (!row) return;

  statusDialog.value.loading = true;

  const successHandler = () => {
    statusDialog.value.loading = false;
    snackbar.show("Follower status updated successfully.", "success");

    statusDialog.value.open = false;

    store.fetchFollowedFundManagers(true);
  };

  const failureHandler = (err) => {
    statusDialog.value.loading = false;
    snackbar.show(err?.message || "Failed to update follower status.", "error");
  };

  apiRequest(urls.KEYS.PUT, urls.followedFundManagers.update, {
    look_up_key: row.id,
    data: {
      is_active: row.status !== "active",
    },
    isTokenRequired: true,
    onSuccess: successHandler,
    onFailure: failureHandler,
  });
};

const hasFilters = computed(() =>
  Boolean(store.filters.search || store.filters.status),
);

let searchTimer = null;
const onSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => store.applyFilters(), 400);
};

const openUnfollow = (row) => {
  dialog.value = { open: true, mode: "unfollow", item: row };
};

const goToDetails = (row) => {
  const currency = getRowCurrency(row);
  const fmId = row.fm_id || row.fund_manager?.id || row.id;

  localStorage.setItem(
    "activeFm",
    JSON.stringify({
      id: fmId,
      label_name: row.fund_manager?.name || row.label_name || "Fund Manager",
      broker_currency: currency,
      can_follow: false,
      following_account_id: row.account?.id,
      following_account_number: row.account?.account_number,
      ...row,
    }),
  );

  localStorage.setItem("active_currency", currency);

  router.push({
    path: `/fm-copy-trading-profile/${fmId}`,
    query: { is_followed: "true", follower_id: row.id },
  });
};

const goToTradeBook = (row) => {
  const accNum =
    row?.account?.account_number || row?.trading_account_id || row?.account_number || "";
  const fmName =
    row?.fund_manager?.name ||
    row?.fund_manager?.label_name ||
    row?.label_name ||
    row?.name ||
    "";
  const fmAvatarId =
    row?.fund_manager?.id ||
    row?.fm_id ||
    row?.id ||
    "";
  if (accNum) localStorage.setItem("follower_account_number", accNum);
  if (fmName) localStorage.setItem("follower_fm_name", fmName);
  if (fmAvatarId) localStorage.setItem("follower_fm_avatar", String(fmAvatarId));
  router.push(`/copy-trading/trade-book/${row.id}`);
};

const handlePageChange = (page) => {
  store.setPage(page);
  store.fetchFollowedFundManagers(true);
};

const getRowCurrency = (row) => {
  return (
    row?.fund_manager?.broker_currency ||
    row?.broker_currency ||
    row?.account?.broker_currency ||
    "USD"
  );
};

const formatBrokerCurrency = (currency) => {
  const normalizedCurrency = String(currency || "")
    .trim()
    .toUpperCase();
  const currencySymbols = {
    USD: "$",
    USC: "C",
    CENT: "C",
  };

  return currencySymbols[normalizedCurrency] || "$";
};

const fmt = (v) =>
  (v ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatCurrencyValue = (val, currency = "USD") => {
  if (val === null || val === undefined || isNaN(val)) return "—";
  const sym = formatBrokerCurrency(currency);
  return `${sym}${fmt(Number(val))}`;
};

const formatPnlValue = (val, currency = "USD") => {
  if (val === null || val === undefined || isNaN(val)) return "—";
  const num = Number(val);
  if (isNaN(num)) return "—";
  const sym = formatBrokerCurrency(currency);
  const prefix = num >= 0 ? `+${sym}` : `-${sym}`;
  return `${prefix}${Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const statusClass = (s) =>
  ({
    active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    paused: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    stopped: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    closed: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  })[s?.toLowerCase()] ?? "bg-secondary-text/15 text-secondary-text";

onMounted(() => store.fetchFollowedFundManagers());
</script>
