<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
    <BaseOverviewCard
      v-for="card in cards"
      :key="card.key"
      :title="card.title"
      :value="card.value"
      :tooltip="card.key === 'withdrawal' ? 'Total client withdrawals' : card.key === 'accounts' ? 'Total client trading accounts' : 'Total client deposits'"
      :active="selectedMetric === card.key"
      :loading="loading"
      selectable
      variant="transparent"
      :left-value="card.real"
      :left-tooltip="card.realTooltip"
      :right-value="card.copy"
      :right-tooltip="card.copyTooltip"
      @select="$emit('select', card.key)"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";
import BaseOverviewCard from "@/components/base/BaseOverviewCard.vue";

const props = defineProps({
  loading: { type: Boolean, default: false },
  overview: { type: Object, default: () => ({}) },
  selectedMetric: { type: String, default: "withdrawal" },
});

defineEmits(["select"]);

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
    value: `${countFormat(props.overview.total_accounts)}`,
    real: `${countFormat(props.overview.accounts_real)}`,
    copy: `${countFormat(props.overview.accounts_copy)}`,
    realTooltip: "Real trading accounts",
    copyTooltip: "Copy trading accounts",
  },
  {
    key: "deposit",
    title: "Total Deposit",
    value: `${money(props.overview.total_deposit)} USD`,
    real: `${money(props.overview.deposit_real)} USD`,
    copy: `${money(props.overview.deposit_copy)} USD`,
    realTooltip: "Total deposits into real accounts",
    copyTooltip: "Total deposits into copy trading accounts",
  },
   {
    key: "withdrawal",
    title: "Total Withdrawal",
    value: `${money(props.overview.total_withdrawal)} USD`,
    real: `${money(props.overview.withdrawal_real)} USD`,
    copy: `${money(props.overview.withdrawal_copy)} USD`,
    realTooltip: "Total withdrawals from real accounts",
    copyTooltip: "Total withdrawals from copy trading accounts",
  },
]);
</script>
