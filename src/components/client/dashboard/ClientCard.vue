<template>
  <div
    class="relative w-full min-w-[270px] min-[380px]:min-w-[300px] sm:min-w-[340px] md:min-w-[360px] lg:min-w-[380px] xl:w-[404px] p-6 sm:p-6 xl:px-6 xl:py-5 rounded-[28px] sm:rounded-[28px] xl:rounded-[30px] overflow-hidden bg-card-background border border-primary-border/60 text-primary-text flex flex-col gap-2.5 sm:gap-3 transition-colors duration-200"
  >
    <!-- Background decoration -->
    <div
      class="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-primary-text/5 blur-3xl card-shine"
    ></div>

    <!-- Content -->
    <div class="relative z-10 flex flex-col gap-3">
      <!-- Header -->
      <div class="flex items-center justify-between gap-2 text-xs font-bold">
        <div class="flex items-center gap-2">
          <span class="text-primary-text">
            {{ platformLabel }}:
          </span>
          <h4 class="text-primary-text">
            {{ account?.account_number }}
          </h4>
          <h4 v-if="account?.groupLabel" class="text-secondary-text">
            {{ account?.groupLabel }}
          </h4>
        </div>

        <BaseBadge
          :value="accountTypeLabel"
          size="xs"
          text-case="uppercase"
        />
      </div>

      <!-- Currency & Eye Toggle Button Row -->
      <div class="flex items-center justify-between">
        <span
          class="inline-flex items-center gap-1.5 sm:gap-2 h-6 sm:h-7 xl:h-8 px-2 sm:px-2.5 xl:px-3 text-[10px] sm:text-[11px] xl:text-[12px] rounded-full bg-primary-text/5 border border-primary-border font-semibold text-primary-text w-fit"
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
          {{ (currencyLabel || '').toUpperCase() }}
        </span>

        <Tooltip :text="valuesVisible ? 'Hide Balance' : 'Show Balance'" position="top">
          <button
            type="button"
            @click="valuesVisible = !valuesVisible"
            class="w-7 h-7 sm:w-8 sm:h-8 xl:w-9 xl:h-9 rounded-full border border-primary-border bg-primary-text/5 hover:bg-primary-text/10 flex items-center justify-center transition-all duration-200 cursor-pointer text-primary-text"
          >
            <BaseIcon v-if="valuesVisible" name="visibility" :size="16" class="text-primary-text" />
            <BaseIcon v-else name="visibility_off" :size="16" class="text-primary-text" />
          </button>
        </Tooltip>
      </div>

      <!-- Balance -->
      <div class="flex flex-col gap-0.5">
        <div class="flex items-center gap-1.5">
          <p class="text-2xs sm:text-2xs font-medium text-secondary-text">Available balance</p>
          <Tooltip text="Funds available in this account for trading and withdrawals" position="top" wrap>
            <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
          </Tooltip>
        </div>

        <h5
          class="text-lg sm:text-xl xl:text-2xl leading-tight font-bold text-primary-text flex items-baseline gap-1"
        >
          <span>{{ maskedValue(account?.balance) }}</span>

          <span
            class="text-xs sm:text-sm font-semibold text-secondary-text"
          >
            {{ account?.currency }}
          </span>
        </h5>
      </div>
    </div>

    <!-- Actions -->
    <div id="tour-account-actions" class="relative z-10 flex items-center gap-1.5 sm:gap-2 xl:gap-2.5">
      <Tooltip text="Deposit Funds" position="top" class="flex-1">
        <button
          type="button"
          @click="$emit('deposit', account)"
          class="w-full h-8 sm:h-9 xl:h-10 p-2 text-[11px] sm:text-xs xl:text-[13px] rounded-full inline-flex items-center justify-center gap-1.5 bg-button-secondary border border-primary-border hover:bg-primary-border/60 font-semibold text-primary-text transition-all duration-200 cursor-pointer"
        >
          <ArrowDownLeft class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-primary-text" />
          <span class="truncate">Deposit</span>
        </button>
      </Tooltip>

      <Tooltip text="Withdraw Funds" position="top" class="flex-1">
        <button
          type="button"
          @click="$emit('withdraw', account)"
          class="w-full h-8 sm:h-9 xl:h-10 p-2 text-[11px] sm:text-xs xl:text-[13px] rounded-full inline-flex items-center justify-center gap-1.5 bg-button-secondary border border-primary-border hover:bg-primary-border/60 font-semibold text-primary-text transition-all duration-200 cursor-pointer"
        >
          <ArrowUpRight class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-primary-text" />
          <span class="truncate">Withdrawal</span>
        </button>
      </Tooltip>

      <Tooltip text="Internal Transfer" position="top">
        <button
          type="button"
          @click="$emit('transfer', account)"
          class="w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 p-2 rounded-full flex items-center justify-center bg-button-secondary border border-primary-border hover:bg-primary-border/60 transition-all duration-200 cursor-pointer shrink-0 text-primary-text"
        >
          <ArrowLeftRight class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-text" />
        </button>
      </Tooltip>

      <Tooltip text="Transaction History" position="top">
        <button
          type="button"
          @click="$emit('history', account)"
          class="w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 p-2 rounded-full flex items-center justify-center bg-button-secondary border border-primary-border hover:bg-primary-border/60 transition-all duration-200 cursor-pointer shrink-0 text-primary-text"
        >
          <History class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-text" />
        </button>
      </Tooltip>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect } from "vue";
import usFlg from "@/assets/us-flg.svg";
import BaseIcon from "@/components/base/BaseIcon.vue";
import {
  Eye,
  EyeOff,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  History,
  Info,
} from "lucide-vue-next";
import { getCurrencyFlag, getCurrencyLabel } from "@/utils/Countries";

const props = defineProps({
  account: {
    type: Object,
    required: true,
  },
});

defineEmits(["deposit", "withdraw", "transfer", "history"]);

const valuesVisible = ref(true);

const isUsCurrency = computed(() => {
  const cur = props.account?.broker_currency?.toUpperCase();
  return cur === "USD" || cur === "USC";
});

const currencyFlag = computed(() => getCurrencyFlag(props.account?.broker_currency));

const currencyLabel = computed(() => getCurrencyLabel(props.account?.broker_currency));

const accountTypeLabel = computed(() => {
  const acc = props.account || {};
  const type = String(
    acc.account_type || acc.trading_type || acc.type || (acc.is_demo ? "demo" : "live")
  ).toLowerCase();

  if (type === "demo") return "Demo";
  if (type === "copy_trading" || type === "copytrading") return "Copy Trading";
  return "Live";
});

const platformLabel = computed(() => {
  const acc = props.account || {};
  const type = String(
    acc.account_type || acc.trading_type || acc.type || ""
  ).toLowerCase();
  const platform = String(acc.platform || "").toLowerCase();

  if (
    type === "copy_trading" ||
    type === "copytrading" ||
    platform === "copy_trading" ||
    platform === "copytrading"
  ) {
    return "CT";
  }
  return (acc.platform || "MT5").toUpperCase();
});



// watchEffect(() => {
//   console.log(props.account);
//   // console.log(props.account.value);
// });

const maskedValue = (value) => {
  if (!valuesVisible.value) return "******";

  const num = Number(value);

  return Number.isFinite(num)
    ? num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 3,
      })
    : value;
};
</script>
<style scoped>
.card-shine {
  position: absolute;
  top: -40%;
  left: -60%;
  width: 45%;
  height: 180%;
  transform: rotate(25deg);

  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.18),
    rgba(255, 255, 255, 0.05),
    transparent
  );

  animation: shine 6s ease-in-out infinite;
}

@keyframes shine {
  0% {
    transform: translateX(-140%) rotate(25deg);
  }

  35% {
    transform: translateX(220%) rotate(25deg);
  }

  100% {
    transform: translateX(220%) rotate(25deg);
  }
}
</style>
