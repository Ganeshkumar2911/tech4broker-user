<script setup>
import { computed, ref, watch } from "vue";
import { SlidersHorizontal, Loader2, X } from "lucide-vue-next";
import BaseSelect from "@/components/base/BaseSelect.vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

const props = defineProps({
  open: { type: Boolean, default: false },
  account: { type: Object, default: null },
});

const emit = defineEmits(["close", "success"]);

const snackbar = useSnackbarStore();

const selectedLeverage = ref(500);
const loading = ref(false);

const leverageOptions = [
  { label: "1:50", value: 50 },
  { label: "1:100", value: 100 },
  { label: "1:200", value: 200 },
  { label: "1:300", value: 300 },
  { label: "1:400", value: 400 },
  { label: "1:500", value: 500 },
  { label: "1:1000", value: 1000 },
];

const accountNumber = computed(
  () =>
    props.account?.account_number ??
    props.account?.raw?.account_number ??
    props.account?.login ??
    "—"
);
const platform = computed(
  () =>
    props.account?.platform?.toUpperCase() ??
    props.account?.raw?.platform?.toUpperCase() ??
    "MT5"
);
const currentLeverage = computed(() => {
  const lev = props.account?.broker_leverage ?? props.account?.leverage;
  if (!lev) return "—";
  return String(lev).startsWith("1:") ? lev : `1:${lev}`;
});

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      const raw = props.account?.broker_leverage ?? props.account?.leverage;
      const num = typeof raw === "string" ? parseInt(raw.replace("1:", ""), 10) : Number(raw);
      selectedLeverage.value = !isNaN(num) && num > 0 ? num : 500;
      loading.value = false;
    }
  },
  { immediate: true }
);

const closeDialog = () => {
  if (loading.value) return;
  emit("close");
};

const submitChangeLeverage = () => {
  if (loading.value || !props.account?.id) return;

  loading.value = true;

  const successHandler = (res) => {
    loading.value = false;
    if (props.account) {
      props.account.broker_leverage = selectedLeverage.value;
    }
    snackbar.show(
      res?.message || "Leverage updated successfully.",
      "success"
    );
    emit("success", { account: props.account, leverage: selectedLeverage.value });
    emit("close");
  };

  const failureHandler = (err) => {
    loading.value = false;
    snackbar.show(
      err?.message || err?.error || "Failed to update leverage.",
      "error"
    );
  };

  apiRequest(urls.KEYS.POST, urls.tradingAccounts.update, {
    data: {
      trading_account_id: props.account.id,
      broker_leverage: selectedLeverage.value,
    },
    isTokenRequired: true,
    onSuccess: successHandler,
    onFailure: failureHandler,
  });
};
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
    @click="closeDialog"
  >
    <div
      class="w-full max-w-md rounded-2xl border border-primary-border bg-card-background shadow-2xl overflow-hidden"
      @click.stop
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between border-b border-primary-border px-6 py-4"
      >
        <div>
          <h2 class="text-sm font-semibold text-primary-text leading-tight">
            Change Account Leverage
          </h2>
          <p class="text-[11px] text-secondary-text">
            Adjust maximum trading leverage ratio
          </p>
        </div>
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-background text-secondary-text hover:text-primary-text cursor-pointer"
          @click="closeDialog"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Body -->
      <div class="space-y-4 px-6 py-5">
        <!-- Account Info Context Card -->
        <div class="rounded-xl border border-primary-border bg-background p-3.5 space-y-2">
          <div class="flex items-center justify-between gap-3 text-xs">
            <span class="text-secondary-text">Account:</span>
            <span class="font-bold text-primary-text font-mono">#{{ accountNumber }}</span>
          </div>
          <div class="flex items-center justify-between gap-3 text-xs">
            <span class="text-secondary-text">Platform:</span>
            <span class="font-semibold text-primary-text">{{ platform }}</span>
          </div>
          <div class="flex items-center justify-between gap-3 text-xs">
            <span class="text-secondary-text">Current Leverage:</span>
            <span class="font-bold text-primary-text font-mono">{{ currentLeverage }}</span>
          </div>
        </div>

        <!-- Leverage Selector -->
        <div>
          <label class="block text-xs font-medium text-secondary-text mb-1.5">
            Select New Leverage
          </label>
          <BaseSelect
            v-model="selectedLeverage"
            :options="leverageOptions"
            placeholder="Select Leverage"
            rounded="xl"
          />
          <p class="text-[11px] text-secondary-text mt-1.5 leading-relaxed">
            Higher leverage allows larger position sizes with less margin, but carries increased risk of loss.
          </p>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div
        class="flex gap-3 border-t border-primary-border px-6 py-4 bg-card-background"
      >
        <button
          type="button"
          class="flex-1 rounded-full border border-primary-border px-4 py-2.5 text-xs font-medium text-secondary-text transition-colors hover:bg-background hover:text-primary-text disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          :disabled="loading"
          @click="closeDialog"
        >
          Cancel
        </button>
        <button
          type="button"
          class="flex-1 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-black transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          :disabled="loading"
          @click="submitChangeLeverage"
        >
          <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" />
          <span>{{ loading ? "Updating..." : "Update Leverage" }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
