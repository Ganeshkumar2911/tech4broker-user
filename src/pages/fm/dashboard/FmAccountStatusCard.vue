<template>
  <div class="mt-4 sm:mt-6">
    <!-- Skeleton Loading State -->
    <div
      v-if="isLoading"
      class="bg-card-background border border-primary-border rounded-2xl p-5 space-y-4 animate-pulse"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-primary-border/60"></div>
          <div class="space-y-1.5">
            <div class="h-3 w-20 bg-primary-border/60 rounded"></div>
            <div class="h-4 w-36 bg-primary-border/80 rounded"></div>
          </div>
        </div>
        <div class="h-6 w-16 bg-primary-border/50 rounded-full"></div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
        <div
          v-for="n in 12"
          :key="n"
          class="rounded-xl bg-background p-3.5 space-y-2 border border-primary-border/30"
        >
          <div class="flex items-center justify-between">
            <div class="h-2.5 w-16 bg-primary-border/50 rounded"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-primary-border/40"></div>
          </div>
          <div class="h-4 w-24 bg-primary-border/70 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Approved State -->
    <div
      v-else-if="fmStatus === 'approved'"
      class="bg-card-background rounded-2xl overflow-hidden transition-all duration-200"
    >
      <div
        class="px-5 py-4 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-9 h-9 rounded-xl bg-primary-green/10 flex items-center justify-center shrink-0"
          >
            <CheckCircle2 class="w-4 h-4 text-primary-green" />
          </div>
          <div class="min-w-0">
            <p
              class="text-[10px] font-semibold uppercase tracking-widest text-secondary-text"
            >
              Fund Manager
            </p>
            <p class="text-sm font-bold text-primary-text truncate">
              Account Approved
            </p>
          </div>
        </div>

        <span
          v-if="isFmOffersRoute"
          class="rounded-full bg-primary-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-green shrink-0"
        >
          Approved
        </span>

        <Tooltip v-else text="Manage Offers">
          <button
            @click="router.push({ name: 'fm-offers' })"
            class="shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-background p-2.5 text-sm font-semibold text-primary-text cursor-pointer"
            aria-label="View FM details"
          >
            <ArrowRight class="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <!-- Inner Grid -->
      <div
        v-if="approvedFmEntries.length"
        class="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        <div
          v-for="entry in approvedFmEntries"
          :key="entry[0]"
          class="rounded-xl bg-background p-3.5 sm:p-4 flex flex-col justify-between gap-2"
        >
          <div class="flex items-center justify-between gap-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <p
                class="text-[10px] font-semibold uppercase tracking-wider text-secondary-text truncate"
              >
                {{ formatLabel(entry[0]) }}
              </p>
              <Tooltip :text="getFieldTooltip(entry[0])" position="top" wrap>
                <Info
                  :size="11"
                  class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
                />
              </Tooltip>
            </div>
            <span class="w-1.5 h-1.5 rounded-full bg-primary-green/60 shrink-0" />
          </div>
          <p class="text-sm font-bold text-primary-text break-words">
            {{ formatValue(entry[0], entry[1]) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Pending State -->
    <div
      v-else-if="fmStatus === 'pending'"
      class="bg-card-background rounded-2xl overflow-hidden transition-all duration-200"
    >
      <div
        class="px-5 py-4 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-9 h-9 rounded-xl bg-secondary-yellow/10 flex items-center justify-center shrink-0"
          >
            <Clock class="w-4 h-4 text-secondary-yellow" />
          </div>
          <div class="min-w-0">
            <p
              class="text-[10px] font-semibold uppercase tracking-widest text-secondary-text"
            >
              Status
            </p>
            <p class="text-sm font-bold text-primary-text truncate">
              Request Pending
            </p>
          </div>
        </div>

        <span
          class="rounded-full bg-secondary-yellow/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-secondary-yellow"
        >
          Pending
        </span>
      </div>

      <div
        v-if="fmRequestEntries.length"
        class="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        <div
          v-for="entry in fmRequestEntries"
          :key="entry[0]"
          class="rounded-xl bg-background p-3.5 sm:p-4 flex flex-col justify-between gap-2"
        >
          <div class="flex items-center justify-between gap-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <p
                class="text-[10px] font-semibold uppercase tracking-wider text-secondary-text truncate"
              >
                {{ formatLabel(entry[0]) }}
              </p>
              <Tooltip :text="getFieldTooltip(entry[0])" position="top" wrap>
                <Info
                  :size="11"
                  class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
                />
              </Tooltip>
            </div>
            <span class="w-1.5 h-1.5 rounded-full bg-secondary-yellow/60 shrink-0" />
          </div>
          <p class="text-sm font-bold text-primary-text break-words">
            {{ formatValue(entry[0], entry[1]) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Rejected State -->
    <div
      v-else-if="fmStatus === 'rejected'"
      class="bg-card-background rounded-2xl overflow-hidden transition-all duration-200"
    >
      <div
        class="px-5 py-4 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-9 h-9 rounded-xl bg-primary-red/10 flex items-center justify-center shrink-0"
          >
            <AlertCircle class="w-4 h-4 text-primary-red" />
          </div>
          <div class="min-w-0">
            <p
              class="text-[10px] font-semibold uppercase tracking-widest text-secondary-text"
            >
              Status
            </p>
            <p class="text-sm font-bold text-primary-text truncate">
              Application Rejected
            </p>
          </div>
        </div>

        <span
          class="rounded-full bg-primary-red/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-red"
        >
          Rejected
        </span>
      </div>

      <p class="px-5 pt-4 text-sm text-secondary-text leading-relaxed">
        Your Fund Manager application was rejected. Please review your details and apply again.
      </p>

      <div
        v-if="fmRequestEntries.length"
        class="px-4 sm:px-5 pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        <div
          v-for="entry in fmRequestEntries"
          :key="entry[0]"
          class="rounded-xl bg-background p-3.5 sm:p-4 flex flex-col justify-between gap-2"
        >
          <div class="flex items-center justify-between gap-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <p
                class="text-[10px] font-semibold uppercase tracking-wider text-secondary-text truncate"
              >
                {{ formatLabel(entry[0]) }}
              </p>
              <Tooltip :text="getFieldTooltip(entry[0])" position="top" wrap>
                <Info
                  :size="11"
                  class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
                />
              </Tooltip>
            </div>
            <span class="w-1.5 h-1.5 rounded-full bg-primary-red/60 shrink-0" />
          </div>
          <p class="text-sm font-bold text-primary-text break-words">
            {{ formatValue(entry[0], entry[1]) }}
          </p>
        </div>
      </div>

      <div class="p-5 pt-4">
        <button
          @click="profileStore.openProfileDialog('fm')"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-button text-button-text px-4 py-2.5 text-xs font-semibold hover:opacity-90 transition-all cursor-pointer"
        >
          <ClipboardList class="w-4 h-4" />
          Apply Again
        </button>
      </div>
    </div>

    <!-- Incomplete State -->
    <div
      v-else
      class="bg-card-background rounded-2xl overflow-hidden transition-all duration-200"
    >
      <div
        class="px-5 py-4 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-9 h-9 rounded-xl bg-primary-blue/10 flex items-center justify-center shrink-0"
          >
            <AlertCircle class="w-4 h-4 text-primary-blue" />
          </div>
          <div class="min-w-0">
            <p
              class="text-[10px] font-semibold uppercase tracking-widest text-secondary-text"
            >
              Action Required
            </p>
            <p class="text-sm font-bold text-primary-text truncate">
              Registration Incomplete
            </p>
          </div>
        </div>

        <span
          class="rounded-full bg-primary-blue/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-blue"
        >
          Incomplete
        </span>
      </div>

      <p class="px-5 pt-4 text-sm text-secondary-text leading-relaxed">
        Complete your Fund Manager registration to unlock the full potential of your trading account.
      </p>

      <div class="p-5 pt-4">
        <button
          @click="profileStore.openProfileDialog('fm')"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-button text-button-text px-4 py-2.5 text-xs font-semibold hover:opacity-90 transition-all cursor-pointer"
        >
          <ClipboardList class="w-4 h-4" />
          Complete FM Registration
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ClipboardList,
  Info,
} from "lucide-vue-next";
import { useProfileStore } from "@/stores/shared/profile";
import { useFMDashboardStore } from "@/stores/fm/dashboard";
import { useFmStrategiesStore } from "@/stores/fm/strategies";
import Tooltip from "@/components/base/Tooltip.vue";

const props = defineProps({
  hideArrowNav: { type: Boolean, default: false },
});

const profileStore = useProfileStore();
const dashboardStore = useFMDashboardStore();
const strategiesStore = useFmStrategiesStore();
const route = useRoute();
const router = useRouter();

const isLoading = computed(
  () => dashboardStore.dashboardLoading || strategiesStore.isLoading
);

const isFmOffersRoute = computed(
  () => props.hideArrowNav || route?.path?.includes("/fm-offers")
);

const FIELD_TOOLTIPS = {
  broker_share: "Percentage of profit or fee shared with the broker",
  fm_share: "Percentage of performance fee retained by the fund manager",
  ib_pool_percentage: "Percentage of fee/commission allocated to the IB referral pool",
  ib_pool: "Percentage of fee/commission allocated to the IB referral pool",
  management_fee: "Fixed recurring management fee charged to followers",
  management_fee_interval: "Frequency interval at which the management fee is billed",
  min_capital: "Minimum account capital required for followers to join this strategy",
  min_deposit: "Minimum initial deposit required to follow this fund manager",
  performance_fee: "Percentage fee charged on net trading profits generated for followers",
  registration_fee: "One-time registration or onboarding fee charged to new followers",
  settlement_time: "Scheduled daily time when profit sharing and fees are settled",
  settlement_type: "Frequency cycle (daily, weekly, or monthly) for fee settlements",
  visibility_type: "Visibility level of your strategy (Public on Leaderboard or Private Link)",
  visibility: "Visibility level of your strategy (Public on Leaderboard or Private Link)",
  leverage: "Trading leverage multiplier applied to this account",
  currency: "Base currency of the fund manager trading account",
  account_number: "Fund manager MT5 account identifier",
  platform: "Trading platform for this strategy account",
  description: "Strategy description and trading methodology",
  label_name: "Display name or title of the fund manager strategy",
  fm_id: "Unique strategy identifier",
  allow_fm_pf_share_mode: "Allow fund manager performance fee sharing mode",
  allow_fm_rev_share_mode: "Allow fund manager revenue share mode",
};

function getFieldTooltip(key) {
  if (!key) return "";
  const normalized = String(key).toLowerCase().trim().replace(/[\s-]+/g, "_");
  return FIELD_TOOLTIPS[normalized] || `Information for ${formatLabel(key)}`;
}

function hasData(value) {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function formatLabel(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(key, val) {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "true" : "false";
  const strVal = String(val).trim();
  const lowerKey = key.toLowerCase();

  if (lowerKey.includes("leverage") && !strVal.includes(":") && !isNaN(strVal)) {
    return `1:${strVal}`;
  }
  if (
    (lowerKey.includes("fee") ||
      lowerKey.includes("share") ||
      lowerKey.includes("profit") ||
      lowerKey.includes("percentage") ||
      lowerKey.includes("rate")) &&
    !strVal.includes("%") &&
    !isNaN(strVal)
  ) {
    return `${strVal}%`;
  }
  if (
    (lowerKey.includes("capital") ||
      lowerKey.includes("deposit") ||
      lowerKey.includes("balance") ||
      lowerKey.includes("amount")) &&
    !strVal.includes("$") &&
    !isNaN(strVal)
  ) {
    return `$${Number(strVal).toLocaleString("en-US")}`;
  }
  return strVal;
}

const activeStrategyData = computed(() => {
  // Priority 1: Selected Strategy from strategiesStore
  if (strategiesStore.selectedStrategy && hasData(strategiesStore.selectedStrategy)) {
    return strategiesStore.selectedStrategy;
  }
  // Priority 2: fm_info from dashboard store if present
  if (dashboardStore.dashboard?.fm_info && hasData(dashboardStore.dashboard.fm_info)) {
    return dashboardStore.dashboard.fm_info;
  }
  // Priority 3: Fallback to profileStore user fm_info
  if (profileStore.user?.fm_info && hasData(profileStore.user.fm_info)) {
    return profileStore.user.fm_info;
  }
  return null;
});

const fmStatus = computed(() => {
  if (activeStrategyData.value || strategiesStore.strategies.length > 0) {
    return "approved";
  }
  const { fm_info, fm_request } = profileStore.user || {};
  if (hasData(fm_info) || fm_request?.status === "approved") return "approved";
  if (fm_request?.status === "rejected") return "rejected";
  if (fm_request) return "pending";
  return "incomplete";
});

const EXCLUDED_KEYS = new Set([
  "created_at",
  "updated_at",
  "id",
  "user_id",
  "is_active",
  "status",
  "admin_account_id",
  "group",
]);

const fmInfoEntries = computed(() => {
  const info = activeStrategyData.value;
  if (!hasData(info)) return [];
  return Object.entries(info).filter(([k]) => !EXCLUDED_KEYS.has(k));
});

const fmRequestEntries = computed(() => {
  const req = profileStore.user?.fm_request;
  if (!req) return [];
  return Object.entries(req).filter(([k]) => !EXCLUDED_KEYS.has(k));
});

const approvedFmEntries = computed(() =>
  fmInfoEntries.value.length > 0 ? fmInfoEntries.value : fmRequestEntries.value
);
</script>
