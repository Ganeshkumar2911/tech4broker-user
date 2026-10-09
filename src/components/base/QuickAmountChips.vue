<!--
  QuickAmountChips
  Row of quick-pick amount buttons plus an "Other" option. Selecting one just
  emits its value -- the parent is responsible for writing it into the amount
  field (keeps this component free of any assumption about currency/formatting).

  Usage:
    <QuickAmountChips
      v-model="selectedAmount"
      :amounts="[100, 300, 500, 1000]"
      @select="(val) => amount = val"
      @other="focusAmountInput"
    />
-->
<script setup>
import { computed } from "vue";
import { formatBrokerCurrency } from "@/utils/formatters";

const props = defineProps({
  modelValue: { type: [Number, String], default: null },
  amounts: { type: Array, default: () => [100, 300, 500, 1000] },
  currency: { type: String, default: "USD" },
  otherLabel: { type: String, default: "Other" },
});

const emit = defineEmits(["update:modelValue", "select", "other"]);

function pick(amount) {
  emit("update:modelValue", amount);
  emit("select", amount);
}

function pickOther() {
  emit("update:modelValue", "");
  emit("select", "");
  emit("other");
}

const isOtherActive = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === "") return false;
  return !props.amounts.includes(Number(props.modelValue));
});

const currencySymbol = computed(() => {
  return formatBrokerCurrency(props.currency);
});

function formatChipAmount(amount) {
  const sym = currencySymbol.value;
  if (["$", "₹", "€", "£", "C$", "C"].includes(sym)) {
    return `${sym}${amount}`;
  }
  return `${amount} ${sym}`;
}
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <button
      v-for="amount in amounts"
      :key="amount"
      type="button"
      class="px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer"
      :class="
        Number(modelValue) === amount
          ? 'border-primary-text bg-primary-text text-card-background'
          : 'border-primary-border text-primary-text hover:border-primary-text/40'
      "
      @click="pick(amount)"
    >
      {{ formatChipAmount(amount) }}
    </button>

    <button
      type="button"
      class="px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer"
      :class="
        isOtherActive
          ? 'border-primary-text bg-primary-text text-card-background'
          : 'border-primary-border text-primary-text hover:border-primary-text/40'
      "
      @click="pickOther"
    >
      {{ otherLabel }}
    </button>
  </div>
</template>