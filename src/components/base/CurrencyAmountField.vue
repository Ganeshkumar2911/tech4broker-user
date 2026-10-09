<!--
  CurrencyAmountField
  Currency dropdown (BaseSelect) + amount input, side by side. Reused by
  Deposit and Withdraw tabs.

  Usage:
    <CurrencyAmountField
      v-model="amount"
      v-model:currency="currency"
      :currencies="[{ label: 'USD', value: 'USD' }, { label: 'EUR', value: 'EUR' }]"
    />
-->
<script setup>
const modelValue = defineModel({ type: [String, Number], default: "" });
const currency = defineModel("currency", { type: String, default: "USD" });

defineProps({
  currencies: {
    type: Array,
    default: () => [{ label: "USD", value: "USD" }],
  },
  placeholder: {
    type: String,
    default: "Enter an amount",
  },
});
</script>

<template>
  <div class="flex w-full min-w-0">
    <BaseSelect
      v-model="currency"
      :options="currencies"
      width="90px"
      height="44px"
      rounded="left"
      variant="surface"
    />

    <input
      v-model="modelValue"
      type="number"
      min="0"
      :placeholder="placeholder"
      class="flex-1 min-w-0 h-11 rounded-r-xl border border-l-0 border-primary-border bg-transparent text-primary-text placeholder:text-secondary-text/60 px-4 outline-none"
    />
  </div>
</template>