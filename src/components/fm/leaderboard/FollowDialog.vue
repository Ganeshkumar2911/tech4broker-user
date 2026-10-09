<script setup>
import { ref, computed, watch } from "vue";
import {
  X,
  Loader2,
  AlertTriangle,
  Layers,
  Receipt,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-vue-next";
import { useFmLeaderboardStore } from "@/stores/fm/leaderboard";
import { useProfileStore } from "@/stores/shared/profile";
import BaseSelect from "@/components/base/BaseSelect.vue";
import AddEditAccount from "@/components/client/accounts/AddEditAccount.vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: "follow" },
  item: { type: Object, default: null },
  unfollowPreviewLoading: { type: Boolean, default: false },
  unfollowActivePositions: { type: Number, default: null },
});

const emit = defineEmits(["close", "success"]);
const store = useFmLeaderboardStore();
const profileStore = useProfileStore();

const selectedMode = ref("copy_trading"); // 'copy_trading' | 'real'
const selectedAccount = ref(null);
const lotType = ref("fixed");
const lotValue = ref(0.01);
const selectedOfferId = ref(null);
const showAddAccountDialog = ref(false);
const isSuccess = ref(false);

const fmName = computed(() => {
  return (
    props.item?.label_name ||
    props.item?.fund_manager?.name ||
    props.item?.name ||
    "Unnamed"
  );
});

const fmId = computed(() => {
  return (
    props.item?.fund_manager?.id || props.item?.fm_id || props.item?.id || "—"
  );
});

const fmMode = computed(() => {
  const m =
    props.item?.fund_manager?.follower_account_mode ??
    props.item?.follower_account_mode ??
    store.followerAccountMode ??
    3;
  return Number(m);
});

const canChooseMode = computed(() => fmMode.value === 3);

const accountNumber = computed(() => {
  return (
    props.item?.account?.account_number ||
    props.item?.following_account_number ||
    props.item?.account_number ||
    null
  );
});

const performanceFee = computed(() => {
  const fee =
    props.item?.fund_manager?.performance_fee ?? props.item?.performance_fee;
  return fee != null ? fee : null;
});

const tradingAccountId = computed(() => {
  return (
    props.item?.account?.id ||
    props.item?.following_account_id ||
    props.item?.trading_account_id ||
    props.item?.account_id ||
    null
  );
});

const isRealUnfollow = computed(() => {
  return (
    props.item?.trading_type === "real" ||
    props.item?.account?.trading_type === "real" ||
    previewData.value?.trading_type === "real"
  );
});

const isPreviewLoading = computed(() => {
  return props.unfollowPreviewLoading || store.unfollowPreviewLoading;
});

const previewData = computed(() => store.unfollowPreview);

const activePositions = computed(() => {
  if (
    props.unfollowActivePositions !== null &&
    props.unfollowActivePositions !== undefined
  ) {
    return props.unfollowActivePositions;
  }
  return (
    previewData.value?.active_positions ??
    previewData.value?.positions_count ??
    previewData.value?.total_positions ??
    0
  );
});

const floatingPnl = computed(() => {
  return previewData.value?.floating_pnl ?? null;
});

const totalOpenLot = computed(() => {
  return previewData.value?.total_open_lot ?? null;
});

const openSymbols = computed(() => {
  return previewData.value?.symbols || [];
});

const requiresSettlement = computed(() => {
  return (
    Boolean(previewData.value?.requires_settlement) ||
    Boolean(previewData.value?.unsettled?.count > 0) ||
    Boolean(previewData.value?.settlement_preview?.unsettled_count > 0)
  );
});

const unsettledCount = computed(() => {
  return (
    previewData.value?.unsettled?.count ??
    previewData.value?.settlement_preview?.unsettled_count ??
    0
  );
});

const unsettledPnl = computed(() => {
  return (
    previewData.value?.unsettled?.total_pnl ??
    previewData.value?.settlement_preview?.total_pnl ??
    0
  );
});

const settlementFee = computed(() => {
  return previewData.value?.settlement_preview?.total_fee ?? null;
});

const flowSteps = computed(() => {
  if (isRealUnfollow.value) {
    return [
      "1. Review settlement preview for unsettled closed trades",
      "2. Unfollow will force settlement for this follower account",
      "3. Open positions on your MT5 account will be closed",
      "4. Capital remains safely on your MT5 account",
    ];
  }
  return (
    previewData.value?.flow || [
      "1. Review settlement preview for unsettled closed trades",
      "2. Unfollow will force settlement for this follower/account",
      "3. Open positions (if any) will be closed",
      "4. Follower membership will be marked past",
    ]
  );
});

const getCurrencySymbol = (currency) => {
  const c = String(currency || "").toUpperCase();
  if (c === "USC" || c === "CENT") return "C";
  if (c === "USD") return "$";
  return "$";
};

const fmt = (val) => {
  if (val === null || val === undefined || isNaN(val)) return "0.00";
  return Number(val).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatPnl = (val) => {
  if (val === null || val === undefined || isNaN(val)) return "—";
  const num = Number(val);
  const prefix = num >= 0 ? "+$" : "-$";
  return `${prefix}${Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const accountOptions = computed(() =>
  store.tradingAccounts.map((a) => {
    const symbol = getCurrencySymbol(a.broker_currency || a.currency);
    const balanceNum = Number(a.balance || 0);
    const balanceFmt = balanceNum.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const typeLabel =
      a.trading_type === "real" ? "Real Account" : "Copy Trading";
    const platform = a.broker || a.platform || "MT5";
    const balanceFormatted = `${symbol} ${balanceFmt}`;

    return {
      label: `#${a.account_number} · ${typeLabel} · ${platform} · ${balanceFormatted}`,
      value: a.trading_account_id,
      account_number: a.account_number,
      trading_type: a.trading_type,
      typeLabel,
      platform,
      balance: a.balance,
      balanceFormatted,
      currency: a.broker_currency || a.currency || "USD",
      raw: a,
    };
  }),
);

const selectedAccountData = computed(() =>
  store.tradingAccounts.find(
    (a) => a.trading_account_id === selectedAccount.value,
  ),
);

const offerOptions = computed(() => {
  if (!store.fmOffers.length) return [];
  return store.fmOffers.map((o) => ({
    label: o.name,
    value: o.id,
  }));
});

const selectedOffer = computed(
  () => store.fmOffers.find((o) => o.id === selectedOfferId.value) || null,
);

const hasOffers = computed(() => store.fmOffers.length > 0);

const rightSectionItem = computed(() => {
  if (hasOffers.value && selectedOffer.value) {
    return {
      type: "offer",
      data: selectedOffer.value,
    };
  }
  return {
    type: "fm",
    data: props.item,
  };
});

const fetchAccountsForCurrentMode = () => {
  const id =
    props.item?.fund_manager?.id || props.item?.fm_id || props.item?.id;
  if (id) {
    store.fetchTradingAccounts(id, selectedMode.value);
  }
};

const switchMode = (mode) => {
  if (selectedMode.value === mode) return;
  selectedMode.value = mode;
  selectedAccount.value = null;
  fetchAccountsForCurrentMode();
};

watch(
  () => props.open,
  (val) => {
    if (val) {
      selectedAccount.value = null;
      lotType.value = "fixed";
      lotValue.value = 0.01;
      selectedOfferId.value = null;
      isSuccess.value = false;

      if (fmMode.value === 2) {
        selectedMode.value = "real";
      } else {
        selectedMode.value = "copy_trading";
      }

      if (props.mode === "follow") {
        const id =
          props.item?.fund_manager?.id || props.item?.fm_id || props.item?.id;
        if (id) {
          store.fetchTradingAccounts(id, selectedMode.value);
          store.fetchFmOffers(id);
        }
      } else if (props.mode === "unfollow") {
        const accId = tradingAccountId.value;
        if (accId) {
          store.fetchUnfollowPreview({ trading_account_id: accId });
        }
      }
    }
  },
);

const isLotInvalid = computed(() => {
  if (
    lotValue.value === null ||
    lotValue.value === undefined ||
    lotValue.value === ""
  )
    return true;
  const val = Number(lotValue.value);
  return isNaN(val) || val < 0.01;
});

const noOffersMessage = computed(() => {
  return (
    store.fmOffersMessage || "No public offers found for this fund manager."
  );
});

const canSubmitFollow = computed(() => {
  if (store.actionLoading || store.fmOffersLoading) return false;
  if (!hasOffers.value) return false;
  if (!selectedOfferId.value) return false;
  if (!selectedAccount.value) return false;
  if (isLotInvalid.value) return false;
  return true;
});

const followButtonText = computed(() => {
  if (store.actionLoading) return "Following...";
  if (isSuccess.value) return "Followed!";
  if (store.fmOffersLoading) return "Checking Offers...";
  if (!hasOffers.value) return "Follow Unavailable";
  return "Follow";
});

watch(
  () => store.fmOffers,
  (offers) => {
    if (offers && offers.length === 1 && !selectedOfferId.value) {
      selectedOfferId.value = offers[0].id;
    }
  },
);

const handleLotBlur = () => {
  if (
    lotValue.value === null ||
    lotValue.value === undefined ||
    lotValue.value === "" ||
    Number(lotValue.value) < 0.01
  ) {
    lotValue.value = 0.01;
  }
};

const handleOpenCreateRealAccount = () => {
  showAddAccountDialog.value = true;
};

const handleAddAccountClose = () => {
  showAddAccountDialog.value = false;
  fetchAccountsForCurrentMode();
};

const submitFollow = () => {
  if (!canSubmitFollow.value) return;

  const val = Number(lotValue.value);

  const payload = {
    fm_id: props.item?.fund_manager?.id || props.item?.fm_id || props.item?.id,
    trading_account_id: selectedAccount.value,
    lot_type: lotType.value,
    lot_value: Math.max(0.01, val),
  };

  if (selectedOfferId.value) {
    payload.offer_id = selectedOfferId.value;
    if (selectedOffer.value?.join_link_id) {
      payload.join_link_id = selectedOffer.value.join_link_id;
    }
  }

  store.followFm(payload, (res) => {
    isSuccess.value = true;
    emit("success", { mode: "follow", data: res });
    emit("close");
    setTimeout(() => {
      isSuccess.value = false;
    }, 300);
  });
};

const submitUnfollow = () => {
  const accId = tradingAccountId.value;
  if (!accId) return;

  store.unfollowFm(
    {
      trading_account_id: accId,
      close_positions: true,
      force_settlement: true,
    },
    (res) => {
      isSuccess.value = true;
      emit("success", { mode: "unfollow", data: res });
      emit("close");
      setTimeout(() => {
        isSuccess.value = false;
      }, 300);
    },
  );
};
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/50"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="panel">
      <div
        v-if="open"
        class="fixed top-0 right-0 z-50 h-full w-full max-w-2xl bg-card-background border-l border-primary-border flex flex-col shadow-2xl"
        @click.stop
      >
        <!-- Header -->
        <div
          class="px-6 py-4 border-b border-primary-border flex items-center justify-between shrink-0"
        >
          <h2 class="text-sm font-semibold text-primary-text">
            {{
              mode === "follow"
                ? "Follow Fund Manager"
                : "Unfollow Fund Manager"
            }}
          </h2>
          <button
            class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors cursor-pointer"
            @click="emit('close')"
          >
            <X class="w-4 h-4 text-secondary-text" />
          </button>
        </div>

        <!-- Follow Mode -->
        <template v-if="mode === 'follow'">
          <div
            class="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-primary-border overflow-y-auto no-scrollbar"
          >
            <!-- Left Column: Form -->
            <div class="px-6 py-5 space-y-4">
              <!-- FM Summary -->
              <div class="bg-background rounded-xl p-4 space-y-1">
                <p class="text-xs font-medium text-primary-text">
                  {{ fmName }}
                </p>
                <p class="text-[11px] text-secondary-text">
                  Performance Fee:
                  {{ performanceFee != null ? `${performanceFee}%` : "—" }}
                </p>
              </div>

              <!-- Mode Switcher (Copy Trading Account vs Real Account) -->
              <div>
                <p class="text-xs text-secondary-text mb-1.5 font-medium">
                  Account Mode
                </p>
                <div
                  v-if="canChooseMode"
                  class="grid grid-cols-2 gap-1 p-1 bg-background rounded-2xl border border-primary-border/60"
                >
                  <button
                    type="button"
                    @click="switchMode('copy_trading')"
                    :class="[
                      'w-full py-2 px-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center text-center border-0 outline-none shadow-none',
                      selectedMode === 'copy_trading'
                        ? 'bg-card-background text-primary-text shadow-sm border border-primary-border/40 font-bold'
                        : 'text-secondary-text hover:text-primary-text hover:bg-card-background/40',
                    ]"
                  >
                    <span class="truncate">Copy Trading</span>
                  </button>
                  <button
                    type="button"
                    @click="switchMode('real')"
                    :class="[
                      'w-full py-2 px-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center text-center border-0 outline-none shadow-none',
                      selectedMode === 'real'
                        ? 'bg-card-background text-primary-text shadow-sm border border-primary-border/40 font-bold'
                        : 'text-secondary-text hover:text-primary-text hover:bg-card-background/40',
                    ]"
                  >
                    <span class="truncate">Real Account</span>
                  </button>
                </div>
                <div
                  v-else
                  class="px-3.5 py-2 rounded-2xl bg-background border border-primary-border/60 text-xs font-medium text-primary-text flex items-center justify-between"
                >
                  <span>{{
                    fmMode === 2 ? "Real account" : "Copy trading account"
                  }}</span>
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-full bg-card-background text-secondary-text font-bold border border-primary-border/40"
                  >
                    {{ selectedMode === "real" ? "Real" : "Copy Trading" }}
                  </span>
                </div>
              </div>

              <!-- Trading Account Select -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <p class="text-xs text-secondary-text">
                    Select Trading Account
                  </p>
                  <span
                    v-if="selectedMode === 'real'"
                    class="text-[10px] text-primary-green font-medium flex items-center gap-1"
                  >
                    <ShieldCheck class="w-3 h-3" /> User MT5 Login
                  </span>
                </div>

                <div
                  v-if="store.tradingAccountsLoading"
                  class="py-3 flex items-center justify-center gap-2 text-xs text-secondary-text"
                >
                  <Loader2 class="w-4 h-4 animate-spin text-primary" />
                  <span>Loading available accounts...</span>
                </div>

                <div
                  v-else-if="
                    selectedMode === 'real' &&
                    store.tradingAccounts.length === 0
                  "
                  class="p-3.5 rounded-xl border border-primary-border bg-background space-y-2.5"
                >
                  <p class="text-xs text-primary-text font-semibold">
                    No Real Accounts Available
                  </p>
                  <p class="text-[11px] text-secondary-text leading-relaxed">
                    You do not have an active real MT5 account with available
                    balance for this manager.
                  </p>
                  <button
                    type="button"
                    class="w-full py-2 px-3 rounded-lg bg-button text-button-text text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-colors cursor-pointer border-0 shadow-none"
                    @click="handleOpenCreateRealAccount"
                  >
                    <PlusCircle class="w-3.5 h-3.5" />
                    <span>Create Real Account</span>
                  </button>
                </div>

                <BaseSelect
                  v-else
                  v-model="selectedAccount"
                  :options="accountOptions"
                  searchable
                  :placeholder="
                    selectedMode === 'real'
                      ? 'Select real MT5 account'
                      : 'Select copy trading account'
                  "
                >
                  <!-- Trigger Slot -->
                  <template #trigger="{ selected, label }">
                    <div
                      v-if="selected && (selected.account_number || selected.raw?.account_number)"
                      class="flex items-center justify-between w-full min-w-0 pr-1 text-left"
                    >
                      <div class="flex items-center gap-1.5 truncate">
                        <span class="font-bold font-mono text-primary-text text-xs">
                          #{{ selected.account_number || selected.raw?.account_number }}
                        </span>
                        <span
                          class="text-[10px] px-1.5 py-0.5 rounded bg-primary-border/40 text-secondary-text font-semibold"
                        >
                          {{ selected.platform || selected.raw?.broker || selected.raw?.platform || "MT5" }}
                        </span>
                      </div>
                      <span class="font-bold font-mono text-xs text-primary-green shrink-0 ml-2">
                        {{ selected.balanceFormatted }}
                      </span>
                    </div>
                    <span v-else class="text-xs text-secondary-text truncate">{{ label }}</span>
                  </template>

                  <!-- Option Slot -->
                  <template #option="{ option }">
                    <div class="flex items-center justify-between w-full py-1 min-w-0">
                      <div class="flex flex-col min-w-0 mr-2 text-left">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span class="font-bold font-mono text-primary-text text-xs">
                            #{{ option.account_number || option.raw?.account_number || option.label }}
                          </span>
                          <span
                            class="text-[10px] px-1.5 py-0.5 rounded bg-primary-border/40 text-secondary-text font-semibold"
                          >
                            {{ option.platform || option.raw?.broker || option.raw?.platform || "MT5" }}
                          </span>
                        </div>
                        <span class="text-[11px] text-secondary-text mt-0.5">
                          {{ option.typeLabel || (option.trading_type === "real" ? "Real Account" : "Copy Trading") }}
                        </span>
                      </div>
                      <div class="flex flex-col items-end shrink-0 text-right">
                        <span class="font-bold font-mono text-xs text-primary-green">
                          {{ option.balanceFormatted }}
                        </span>
                        <span class="text-[10px] text-secondary-text uppercase">
                          {{ option.currency || option.raw?.currency || "USD" }}
                        </span>
                      </div>
                    </div>
                  </template>
                </BaseSelect>
              </div>

              <!-- Lot Type -->
              <div>
                <p class="text-xs text-secondary-text mb-1.5">Lot Type</p>
                <div class="flex gap-3">
                  <button
                    type="button"
                    @click="lotType = 'fixed'"
                    :class="[
                      'flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-0 shadow-none',
                      lotType === 'fixed'
                        ? 'bg-button text-button-text font-bold'
                        : 'border border-primary-border text-secondary-text hover:text-primary-text'
                    ]"
                  >
                    Fixed
                  </button>
                  <button
                    type="button"
                    @click="lotType = 'multiplier'"
                    :class="[
                      'flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-0 shadow-none',
                      lotType === 'multiplier'
                        ? 'bg-button text-button-text font-bold'
                        : 'border border-primary-border text-secondary-text hover:text-primary-text'
                    ]"
                  >
                    Multiplier
                  </button>
                </div>
              </div>

              <!-- Lot Value -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <p class="text-xs text-secondary-text">Lot Value</p>
                  <span class="text-[10px] text-secondary-text">Min: 0.01</span>
                </div>
                <input
                  v-model.number="lotValue"
                  type="number"
                  min="0.01"
                  step="0.01"
                  class="w-full px-4 py-2.5 rounded-lg bg-transparent border text-primary-text text-xs focus:outline-none transition-colors"
                  :class="[
                    isLotInvalid
                      ? 'border-red-500/80 focus:border-red-500'
                      : 'border-primary-border focus:border-primary'
                  ]"
                  placeholder="Enter lot value"
                  @blur="handleLotBlur"
                />
                <p v-if="isLotInvalid" class="text-[10px] text-red-500 mt-1">
                  Lot value must be at least 0.01
                </p>
              </div>

              <!-- Offer Dropdown (only if FM has offers) -->
              <div v-if="hasOffers">
                <p class="text-xs text-secondary-text mb-1.5">Select Offer</p>
                <BaseSelect
                  v-model="selectedOfferId"
                  :options="offerOptions"
                  :placeholder="
                    store.fmOffersLoading
                      ? 'Loading offers...'
                      : 'No offer selected'
                  "
                />
              </div>

              <!-- No Offers Notice in Left Column -->
              <div
                v-else-if="!store.fmOffersLoading && !hasOffers"
                class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 space-y-1"
              >
                <div class="flex items-start gap-2">
                  <AlertTriangle class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p class="text-xs font-semibold text-amber-400">Cannot Follow</p>
                    <p class="text-[11px] text-secondary-text mt-0.5 leading-relaxed">
                      {{ noOffersMessage }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Selected Account Card -->
              <div
                v-if="selectedAccount"
                class="bg-background rounded-xl p-3.5 space-y-2"
              >
                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <p
                      class="text-[10px] uppercase tracking-wide text-secondary-text mb-0.5"
                    >
                      Account
                    </p>
                    <p
                      class="text-xs font-semibold text-primary-text font-mono"
                    >
                      #{{ selectedAccountData?.account_number }}
                    </p>
                  </div>
                  <div>
                    <p
                      class="text-[10px] uppercase tracking-wide text-secondary-text mb-0.5"
                    >
                      Type
                    </p>
                    <p
                      class="text-xs font-semibold text-primary-text capitalize"
                    >
                      {{
                        selectedAccountData?.trading_type === "real"
                          ? "Real"
                          : "Copy Trading"
                      }}
                    </p>
                  </div>
                  <div>
                    <p
                      class="text-[10px] uppercase tracking-wide text-secondary-text mb-0.5"
                    >
                      Balance
                    </p>
                    <p
                      class="text-xs font-semibold text-primary-text font-mono"
                    >
                      {{
                        getCurrencySymbol(
                          selectedAccountData?.broker_currency ||
                            selectedAccountData?.currency,
                        )
                      }}{{
                        Number(selectedAccountData?.balance || 0).toFixed(2)
                      }}
                    </p>
                  </div>
                </div>
                <div class="pt-2 border-t border-primary-border/60">
                  <p class="text-[11px] text-secondary-text leading-relaxed">
                    <template
                      v-if="selectedAccountData?.trading_type === 'real'"
                    >
                      Trades will execute directly on your MT5 account. Your
                      funds stay in your MT5 account.
                    </template>
                    <template v-else>
                      Trades will be copied directly onto your copy trading
                      account.
                    </template>
                  </p>
                </div>
              </div>
            </div>

            <!-- Right Column: FM Info or Offer Details -->
            <div class="px-6 py-5 overflow-y-auto no-scrollbar">
              <!-- Loading state -->
              <div
                v-if="store.fmOffersLoading"
                class="flex flex-col items-center justify-center h-full min-h-[200px] gap-2"
              >
                <Loader2 class="w-5 h-5 animate-spin text-secondary-text" />
                <p class="text-xs text-secondary-text">
                  Checking available offers...
                </p>
              </div>

              <!-- FM has offers but none selected yet -->
              <template v-else-if="hasOffers && !selectedOffer">
                <div
                  class="flex flex-col items-center justify-center h-full min-h-[200px] text-center"
                >
                  <p class="text-xs text-secondary-text mb-1">
                    Select an offer
                  </p>
                  <p class="text-[11px] text-secondary-text/70">
                    Choose an offer from the dropdown to see its details
                  </p>
                </div>
              </template>

              <!-- Offer selected: show offer details -->
              <template v-else-if="rightSectionItem.type === 'offer'">
                <div class="bg-background rounded-xl p-4 space-y-3">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-semibold text-primary-text">
                      {{ rightSectionItem.data.name }}
                    </p>
                    <span
                      class="text-[11px] text-secondary-text bg-card-background px-2 py-0.5 rounded-full"
                      >#{{ rightSectionItem.data.offer_code }}</span
                    >
                  </div>
                  <div class="border-t border-primary-border" />
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <p class="text-[11px] text-secondary-text">Summary</p>
                      <p class="text-xs font-medium text-primary-text">
                        {{ rightSectionItem.data.summary || "-" }}
                      </p>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-[11px] text-secondary-text">
                        Management Fee
                      </p>
                      <p class="text-xs font-medium text-primary-text">
                        {{ rightSectionItem.data.management_fee }}% /
                        {{ rightSectionItem.data.management_fee_interval }}
                      </p>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-[11px] text-secondary-text">
                        Performance Fee
                      </p>
                      <p class="text-xs font-medium text-primary-text">
                        {{ rightSectionItem.data.performance_fee }}%
                      </p>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-[11px] text-secondary-text">
                        Registration Fee
                      </p>
                      <p class="text-xs font-medium text-primary-text">
                        ${{
                          Number(
                            rightSectionItem.data.registration_fee || 0,
                          ).toFixed(2)
                        }}
                      </p>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-[11px] text-secondary-text">
                        Min. Balance
                      </p>
                      <p class="text-xs font-medium text-primary-text">
                        ${{
                          Number(
                            rightSectionItem.data.minimum_balance || 0,
                          ).toFixed(2)
                        }}
                      </p>
                    </div>
                  </div>
                  <div
                    v-if="rightSectionItem.data.notes"
                    class="border-t border-primary-border pt-2"
                  >
                    <p class="text-[11px] text-secondary-text mb-0.5">Notes</p>
                    <p class="text-xs text-primary-text">
                      {{ rightSectionItem.data.notes }}
                    </p>
                  </div>
                </div>
              </template>

              <!-- No offers: show message from response -->
              <template v-else>
                <div
                  class="flex flex-col items-center justify-center h-full min-h-[220px] text-center px-4 py-8 bg-background border border-primary-border rounded-xl"
                >
                  <div
                    class="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3"
                  >
                    <AlertTriangle class="w-6 h-6 text-amber-500" />
                  </div>
                  <p class="text-sm font-semibold text-primary-text mb-1.5">
                    No Offers Available
                  </p>
                  <p class="text-xs text-secondary-text max-w-xs leading-relaxed">
                    {{ noOffersMessage }}
                  </p>
                </div>
              </template>
            </div>
          </div>

          <div
            class="px-6 py-4 border-t border-primary-border flex gap-3 shrink-0 bg-card-background"
          >
            <button
              class="flex-1 px-4 py-2.5 rounded-lg text-xs font-medium text-secondary-text bg-background hover:text-primary-text transition-colors cursor-pointer border-0 shadow-none"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              :disabled="!canSubmitFollow"
              class="flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold bg-button text-button-text hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0 shadow-none"
              @click="submitFollow"
            >
              <Loader2
                v-if="store.actionLoading"
                class="w-3.5 h-3.5 animate-spin"
              />
              <CheckCircle2
                v-else-if="isSuccess"
                class="w-3.5 h-3.5 text-black"
              />
              <span>{{ followButtonText }}</span>
            </button>
          </div>
        </template>

        <!-- Unfollow Mode -->
        <template v-else>
          <div class="flex-1 overflow-y-auto no-scrollbar px-6 py-5 space-y-4">
            <!-- Loading Indicator for Preview -->
            <div
              v-if="isPreviewLoading"
              class="flex flex-col items-center justify-center py-12 gap-3"
            >
              <Loader2 class="w-7 h-7 animate-spin text-primary" />
              <p class="text-xs text-secondary-text">
                Loading settlement preview & position status...
              </p>
            </div>

            <template v-else>
              <!-- FM & Account Summary Card -->
              <div class="bg-background rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-semibold text-primary-text">
                    {{ fmName }}
                  </p>
                  <span
                    class="text-[11px] text-secondary-text bg-card-background px-2 py-0.5 rounded-full"
                    >FM #{{ fmId }}</span
                  >
                </div>
                <div class="border-t border-primary-border" />
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p
                      class="text-[10px] uppercase tracking-wide text-secondary-text mb-0.5"
                    >
                      Trading Account
                    </p>
                    <p class="text-xs font-bold text-primary-text font-mono">
                      {{ accountNumber ? `#${accountNumber}` : "—" }}
                    </p>
                  </div>
                  <div>
                    <p
                      class="text-[10px] uppercase tracking-wide text-secondary-text mb-0.5"
                    >
                      Account Type
                    </p>
                    <p class="text-xs font-bold text-primary-text capitalize">
                      {{ isRealUnfollow ? "Real Account" : "Copy Trading" }}
                    </p>
                  </div>
                  <div v-if="previewData?.follower_id">
                    <p
                      class="text-[10px] uppercase tracking-wide text-secondary-text mb-0.5"
                    >
                      Membership ID
                    </p>
                    <p class="text-xs font-bold text-primary-text font-mono">
                      #{{ previewData.follower_id }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Open Positions Notice Card -->
              <div class="bg-background rounded-xl p-4 space-y-2.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Layers class="w-4 h-4 text-primary" />
                    <p class="text-xs font-semibold text-primary-text">
                      Open Positions Impact
                    </p>
                  </div>
                  <span
                    class="text-xs font-bold px-2 py-0.5 rounded-md"
                    :class="
                      activePositions > 0
                        ? 'bg-primary-red/10 text-primary-red'
                        : 'bg-primary/10 text-primary'
                    "
                  >
                    {{ activePositions }} Active
                  </span>
                </div>

                <div
                  v-if="activePositions > 0"
                  class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1"
                >
                  <div
                    v-if="floatingPnl !== null"
                    class="bg-card-background rounded-lg p-2"
                  >
                    <p class="text-[10px] text-secondary-text">Floating P&L</p>
                    <p
                      class="text-xs font-bold tabular-nums"
                      :class="
                        floatingPnl >= 0
                          ? 'text-primary-green'
                          : 'text-primary-red'
                      "
                    >
                      {{ formatPnl(floatingPnl) }}
                    </p>
                  </div>
                  <div
                    v-if="totalOpenLot !== null"
                    class="bg-card-background rounded-lg p-2"
                  >
                    <p class="text-[10px] text-secondary-text">Open Lots</p>
                    <p class="text-xs font-bold text-primary-text font-mono">
                      {{ totalOpenLot }}
                    </p>
                  </div>
                  <div
                    v-if="openSymbols.length > 0"
                    class="bg-card-background rounded-lg p-2 col-span-2 sm:col-span-1"
                  >
                    <p class="text-[10px] text-secondary-text">Symbols</p>
                    <p class="text-xs font-medium text-primary-text truncate">
                      {{ openSymbols.join(", ") }}
                    </p>
                  </div>
                </div>

                <p class="text-[11px] text-secondary-text pt-0.5">
                  <template v-if="isRealUnfollow">
                    All {{ activePositions }} open positions on your MT5 account
                    will be closed upon exit.
                  </template>
                  <template v-else>
                    All {{ activePositions }} open copy position(s) will be
                    closed or queued for closing upon exit.
                  </template>
                </p>
              </div>

              <!-- Settlement Impact Preview (Forced Settlement) -->
              <div
                v-if="requiresSettlement || unsettledCount > 0"
                class="bg-amber-500/5 rounded-xl p-4 space-y-3"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Receipt class="w-4 h-4 text-amber-400" />
                    <p class="text-xs font-bold text-amber-400">
                      Forced Performance Settlement
                    </p>
                  </div>
                  <span
                    class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400"
                  >
                    Required
                  </span>
                </div>

                <p class="text-[11px] text-secondary-text">
                  Closed trades under this membership require performance-fee
                  settlement prior to completing unfollow.
                </p>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div class="bg-card-background rounded-lg p-2.5">
                    <p class="text-[10px] text-secondary-text mb-0.5">
                      Unsettled Trades
                    </p>
                    <p class="text-xs font-bold text-primary-text">
                      {{ unsettledCount }}
                    </p>
                  </div>
                  <div class="bg-card-background rounded-lg p-2.5">
                    <p class="text-[10px] text-secondary-text mb-0.5">
                      Unsettled Net P&L
                    </p>
                    <p
                      class="text-xs font-bold tabular-nums"
                      :class="
                        unsettledPnl >= 0
                          ? 'text-primary-green'
                          : 'text-primary-red'
                      "
                    >
                      {{ formatPnl(unsettledPnl) }}
                    </p>
                  </div>
                  <div
                    class="bg-card-background rounded-lg p-2.5 col-span-2 sm:col-span-1"
                  >
                    <p class="text-[10px] text-secondary-text mb-0.5">
                      Estimated Perf. Fee
                    </p>
                    <p class="text-xs font-bold text-primary-text tabular-nums">
                      ${{ fmt(settlementFee) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Unfollow Execution Flow Steps -->
              <div class="bg-background rounded-xl p-4 space-y-2.5">
                <p class="text-xs font-semibold text-primary-text">
                  Settlement & Exit Flow
                </p>
                <div class="space-y-1.5">
                  <div
                    v-for="(step, idx) in flowSteps"
                    :key="idx"
                    class="flex items-start gap-2 text-[11px] text-secondary-text"
                  >
                    <span
                      class="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                    >
                      {{ idx + 1 }}
                    </span>
                    <span class="text-primary-text/90">{{
                      step.replace(/^[0-9]+\.\s*/, "")
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Warning Alert Box -->
              <div
                class="bg-primary-red/10 rounded-xl p-3.5 flex items-start gap-2.5"
              >
                <AlertTriangle
                  class="w-4 h-4 text-primary-red shrink-0 mt-0.5"
                />
                <div class="space-y-0.5">
                  <p class="text-xs font-bold text-primary-red">Attention</p>
                  <p class="text-[11px] text-secondary-text leading-relaxed">
                    {{
                      previewData?.warning ||
                      (isRealUnfollow
                        ? "Unfollowing will settle closed trades, close active positions on your MT5 login, and transfer this membership to your Following History."
                        : "Unfollowing will settle closed trades, close active positions, and transfer this membership to your Following History.")
                    }}
                  </p>
                </div>
              </div>
            </template>
          </div>

          <div
            class="px-6 py-4 border-t border-primary-border flex gap-3 shrink-0 bg-card-background"
          >
            <button
              class="flex-1 px-4 py-2.5 rounded-lg text-xs font-medium text-secondary-text bg-background hover:text-primary-text transition-colors cursor-pointer border-0 shadow-none"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              :disabled="store.actionLoading || isPreviewLoading"
              class="flex-1 px-4 py-2.5 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer border-0 shadow-none"
              @click="submitUnfollow"
            >
              <Loader2
                v-if="store.actionLoading"
                class="w-3.5 h-3.5 animate-spin"
              />
              <span>{{
                store.actionLoading
                  ? "Settling & Unfollowing..."
                  : "Confirm Unfollow & Settle"
              }}</span>
            </button>
          </div>
        </template>
      </div>
    </Transition>

    <!-- Create Real Account Dialog -->
    <AddEditAccount
      :open="showAddAccountDialog"
      initial-mode="real"
      @close="handleAddAccountClose"
    />
  </Teleport>
</template>
