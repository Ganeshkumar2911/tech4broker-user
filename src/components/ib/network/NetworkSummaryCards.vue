<template>
  <BaseCard
    class="w-full"
    wrapperClass="h-auto bg-none bg-white dark:bg-card-background text-primary-text"
    :show-shine="false"
  >
    <div class="space-y-5">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div v-for="card in cards" :key="card.key" class="rounded-2xl">
          <template v-if="loading">
            <div class="animate-pulse">
              <div class="h-4 w-28 rounded-md bg-background dark:bg-white/10"></div>
              <div class="h-7 w-36 rounded-md bg-background dark:bg-white/10 mt-1.5"></div>
              <BaseMetricCard :loading="true" class="mt-4" />
            </div>
          </template>

          <template v-else>
            <div class="flex items-center gap-1.5 min-w-0">
              <p class="text-sm font-medium text-primary-text truncate">{{ card.title }}</p>
              <Tooltip :text="card.tooltip" position="top" wrap>
                <Info
                  :size="11"
                  class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
                />
              </Tooltip>
            </div>
            <h2 class="text-xl font-bold text-primary-text mt-1">
              {{ card.value }}
            </h2>

            <BaseMetricCard
              class="mt-4"
              :left-value="card.real"
              :left-tooltip="card.realTooltip"
              :right-value="card.copy"
              :right-tooltip="card.copyTooltip"
            />
          </template>
        </div>
      </div>

      <!-- Net Deposit Banner Skeleton -->
      <div
        v-if="loading"
        class="rounded-xl bg-secondary-blue/60 px-5 py-4 flex items-center justify-between animate-pulse"
      >
        <div class="h-5 w-24 rounded-md bg-primary-blue/20"></div>
        <div class="h-5 w-28 rounded-md bg-primary-blue/20"></div>
      </div>

      <!-- Net Deposit banner -->
      <Tooltip text="Net deposit (Total Deposit minus Total Withdrawal)" position="top" class="w-full block">
        <div
          class="rounded-xl bg-secondary-blue dark:bg-primary-blue/15 dark:border dark:border-primary-blue/30 px-5 py-4 flex items-center justify-between cursor-default"
        >
          <span class="font-semibold text-primary-blue">Net Deposit</span>
          <span class="font-bold text-primary-blue">{{ netDepositValue }}</span>
        </div>
      </Tooltip>
    </div>
  </BaseCard>
</template>

<script setup>
import { computed } from "vue";
import { Info } from "lucide-vue-next";
import BaseCard from "@/components/base/BaseCard.vue";
import BaseMetricCard from "@/components/base/BaseMetricCard.vue";

const props = defineProps({
  loading: { type: Boolean, default: false },
  summary: { type: Object, default: () => ({}) },
});

const money = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const countFormat = (value) =>
  Number(value || 0).toLocaleString();

const cards = computed(() => [
  {
    key: "accounts",
    title: "Total Account",
    tooltip: "Total registered trading accounts in your network",
    value: `${countFormat(props.summary.total_accounts)}`,
    real: `${countFormat(props.summary.accounts_real)}`,
    copy: `${countFormat(props.summary.accounts_copy)}`,
    realTooltip: "Real trading accounts",
    copyTooltip: "Copy trading accounts",
  },
  {
    key: "withdrawal",
    title: "Total Withdrawal",
    tooltip: "Total volume withdrawn across your entire network",
    value: `${money(props.summary.total_withdrawal)} USD`,
    real: `${money(props.summary.withdrawal_real)} USD`,
    copy: `${money(props.summary.withdrawal_copy)} USD`,
    realTooltip: "Total withdrawals from real accounts",
    copyTooltip: "Total withdrawals from copy trading accounts",
  },
  {
    key: "deposit",
    title: "Total Deposit",
    tooltip: "Total volume deposited across your entire network",
    value: `${money(props.summary.total_deposit)} USD`,
    real: `${money(props.summary.deposit_real)} USD`,
    copy: `${money(props.summary.deposit_copy)} USD`,
    realTooltip: "Total deposits into real accounts",
    copyTooltip: "Total deposits into copy trading accounts",
  },
]);

const netDepositValue = computed(
  () => `${money(props.summary.net_deposit)} USD`,
);
</script>
