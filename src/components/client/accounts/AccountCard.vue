<template>
  <div
    class="bg-card-background rounded-3xl sm:rounded-4xl p-4 sm:p-5 transition-all duration-200"
  >
    <!-- Header: status + login + settings -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <BaseBadge
          :value="isActive ? 'Active' : 'Inactive'"
          size="xs"
          text-case="uppercase"
        />
        <BaseBadge
          v-if="account.account_type === 'demo'"
          value="DEMO"
          variant="info"
          size="xs"
          text-case="uppercase"
        />
        <span class="text-sm">
          <span class="font-bold text-primary-text">
            {{account.account_type == "copy_trading" ? "CT" : account.platform?.toUpperCase() }}:
          </span>

          <span class="font-medium text-secondary-text ml-1">
            {{ account.account_number }}
          </span>
        </span>
      </div>
      <Tooltip text="Account Settings & Actions" position="left">
        <BaseMenu
          id="tour-account-settings-menu"
          :items="menuItems"
          trigger-class="!p-2 -mr-2 bg-background hover:bg-primary-border/40 text-primary-text rounded-full flex items-center justify-center cursor-pointer"
          @select="handleMenu(account, $event)"
        >
          <template #trigger>
            <BaseIcon name="settings" :size="18" filled class="text-primary-text" />
          </template>
        </BaseMenu>
      </Tooltip>
    </div>

    <!-- Account Label -->
    <!-- <div
      v-if="account.broker_label || account.broker_group"
      class="flex items-center gap-1.5 mt-2.5 text-xs truncate"
    >
      <span class="font-semibold text-primary-text truncate">
        {{ account.broker_label || account.broker_group }}
      </span>
    </div> -->

    <div class="border-b border-dotted border-primary-border/80 my-3"></div>

    <!-- Currency + visibility toggle -->
    <div class="flex items-center justify-between mb-3">
      <span
        class="inline-flex items-center gap-1.5 bg-background text-primary-text text-[11px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wide"
      >
        <span class="flex items-center">
          <img
            v-if="isUsCurrency"
            :src="usFlg"
            class="w-4 h-3.5 rounded-[1px] object-cover"
            alt="US Flag"
          />
          <span v-else>{{ currencyFlag }}</span>
        </span>
        {{ currencyLabel }}
      </span>
      <Tooltip :text="valuesVisible ? 'Hide Balance' : 'Show Balance'" position="top">
        <button
          id="tour-account-visibility-btn"
          type="button"
          @click="valuesVisible = !valuesVisible"
          class="text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
        >
          <BaseIcon v-if="valuesVisible" name="visibility" :size="18" />
          <BaseIcon v-else name="visibility_off" :size="18" />
        </button>
      </Tooltip>
    </div>

    <!-- Stats -->
    <div class="space-y-2 mb-4">
      <div class="flex items-center justify-between text-[13px] leading-none">
        <div class="flex items-center gap-1.5">
          <span class="text-secondary-text">Leverage</span>
          <Tooltip text="Account leverage ratio (Borrowing multiplier)" position="top" wrap>
            <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
          </Tooltip>
        </div>
        <span class="font-bold text-primary-text">{{ formatLeverage(account.broker_leverage ?? account.leverage) }}</span>
      </div>
      <div class="flex items-center justify-between text-[13px] leading-none">
        <div class="flex items-center gap-1.5">
          <span class="text-secondary-text">Credits</span>
          <Tooltip text="Non-withdrawable promotional trading credit bonus" position="top" wrap>
            <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
          </Tooltip>
        </div>
        <span class="font-bold text-primary-text"
          >{{ maskedValue(account.credit ?? account.credits ?? 0) }} {{ account.broker_currency || account.currency }}</span
        >
      </div>
      <div class="flex items-center justify-between text-[13px] leading-none">
        <div class="flex items-center gap-1.5">
          <span class="text-secondary-text">Balance</span>
          <Tooltip text="Current cash balance in the account" position="top" wrap>
            <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
          </Tooltip>
        </div>
        <span class="font-bold text-primary-text"
          >{{ maskedValue(account.balance) }} {{ account.broker_currency || account.currency }}</span
        >
      </div>
      <div class="flex items-center justify-between text-[13px] leading-none">
        <div class="flex items-center gap-1.5">
          <span class="text-secondary-text">Equity</span>
          <Tooltip text="Real-time equity value (Balance + Credit + Floating P&L)" position="top" wrap>
            <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
          </Tooltip>
        </div>
        <span class="font-bold text-primary-text"
          >{{ maskedValue(account.equity) }} {{ account.broker_currency || account.currency }}</span
        >
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-1.5 sm:gap-2">
      <div id="tour-account-deposit-withdraw" class="flex-1 flex items-center gap-1.5 sm:gap-2">
        <Tooltip text="Deposit Funds" position="top" class="flex-1">
          <button
            type="button"
            @click="$emit('deposit', account)"
            class="w-full h-8 sm:h-9 xl:h-10 p-2 text-[11px] sm:text-xs xl:text-[13px] rounded-full inline-flex items-center justify-center gap-1.5 bg-background hover:bg-primary-border/40 border border-primary-border/60 font-semibold text-primary-text transition-all duration-200 cursor-pointer"
          >
            <ArrowDownLeft class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span class="truncate">Deposit</span>
          </button>
        </Tooltip>

        <Tooltip text="Withdraw Funds" position="top" class="flex-1">
          <button
            type="button"
            @click="$emit('withdraw', account)"
            class="w-full h-8 sm:h-9 xl:h-10 p-2 text-[11px] sm:text-xs xl:text-[13px] rounded-full inline-flex items-center justify-center gap-1.5 bg-background hover:bg-primary-border/40 border border-primary-border/60 font-semibold text-primary-text transition-all duration-200 cursor-pointer"
          >
            <ArrowUpRight class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span class="truncate">Withdrawal</span>
          </button>
        </Tooltip>
      </div>

      <div id="tour-account-transfer-history" class="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Tooltip v-if="account.account_type !== 'demo'" text="Internal Transfer">
          <button
            type="button"
            @click="$emit('transfer', account)"
            class="w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 p-2 rounded-full flex items-center justify-center bg-background hover:bg-primary-border/40 border border-primary-border/60 text-primary-text transition-all duration-200 cursor-pointer shrink-0"
          >
            <ArrowLeftRight class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </Tooltip>

        <Tooltip text="Transaction History">
          <button
            type="button"
            @click="$emit('transaction', account)"
            class="w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 p-2 rounded-full flex items-center justify-center bg-background hover:bg-primary-border/40 border border-primary-border/60 text-primary-text transition-all duration-200 cursor-pointer shrink-0"
          >
            <History class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import usFlg from "@/assets/us-flg.svg";
import BaseIcon from "@/components/base/BaseIcon.vue";
import BaseMenu from "@/components/base/BaseMenu.vue";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  History,
  KeyRound,
  BarChart2,
  Tag,
  SlidersHorizontal,
  Info,
  Archive,
  RefreshCcw,
} from "lucide-vue-next";

const props = defineProps({
  account: { type: Object, required: true },
});

const emit = defineEmits([
  "deposit",
  "withdraw",
  "transfer",
  "history",
  "transaction",
  "changePassword",
  "editLabel",
  "changeLeverage",
  "toggleArchive",
]);

const router = useRouter();
const route = useRoute();
const valuesVisible = ref(true);

const isActive = computed(() => {
  if (props.account.is_active !== undefined) return props.account.is_active;
  return props.account.status === true || props.account.status === "active" || props.account.status === 1;
});

const isUsCurrency = computed(() => {
  const cur = (props.account.broker_currency || props.account.currency)?.toUpperCase();
  return cur === "USD" || cur === "USC";
});

const CURRENCY_FLAGS = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
  JPY: "🇯🇵",
};
const CURRENCY_LABELS = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  AUD: "Australian Dollar",
  CAD: "Canadian Dollar",
  JPY: "Japanese Yen",
  USC: "US Cent",
};

const menuItems = computed(() => {
  const items = [
    {
      label: "Edit Label",
      action: "edit_label",
      icon: Tag,
    },
    {
      label: "Change Leverage",
      action: "change_leverage",
      icon: SlidersHorizontal,
    },
    {
      label: "Trades",
      action: "trades",
      icon: BarChart2,
    },
    {
      label: "Change Password",
      action: "password",
      icon: KeyRound,
    },
  ];

  if (props.account.account_type !== "copy_trading") {
    items.push({
      label: isActive.value ? "Archive" : "Unarchive",
      action: "toggle_archive",
      icon: isActive.value ? Archive : RefreshCcw,
    });
  }

  return items;
});

const handleMenu = (account, item) => {
  switch (item.action) {
    case "edit_label":
      emit("editLabel", account);
      break;

    case "change_leverage":
      emit("changeLeverage", account);
      break;

    case "password":
      emit("changePassword", account);
      break;

    case "trades":
      localStorage.setItem("active_account", JSON.stringify(account));
      const isFm = route.path.startsWith("/fm") || localStorage.getItem("role") === "fm";
      router.push({
        name: isFm ? "fm-account-trades" : "account-trades",
        params: {
          id: account.id,
        },
      });
      break;

    case "toggle_archive":
      emit("toggleArchive", account);
      break;
  }
};

const currencyFlag = computed(
  () => CURRENCY_FLAGS[props.account.broker_currency || props.account.currency] || "💱",
);
const currencyLabel = computed(
  () => CURRENCY_LABELS[props.account.broker_currency || props.account.currency] || props.account.broker_currency || props.account.currency || "",
);

const formatLeverage = (lev) => {
  if (!lev) return "—";
  return String(lev).startsWith("1:") ? lev : `1:${lev}`;
};

const maskedValue = (value) => {
  if (!valuesVisible.value) return "*****";
  const num = Number(value);
  return Number.isFinite(num)
    ? num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 3,
      })
    : (value ?? "0.00");
};
</script>
