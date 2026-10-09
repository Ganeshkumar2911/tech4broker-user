<script setup>
import { computed, ref, watch } from "vue";
import { Tag, Loader2, X } from "lucide-vue-next";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

const props = defineProps({
  open: { type: Boolean, default: false },
  account: { type: Object, default: null },
});

const emit = defineEmits(["close", "success"]);

const snackbar = useSnackbarStore();

const label = ref("");
const loading = ref(false);

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
const currency = computed(
  () => props.account?.broker_currency || props.account?.currency || "USD"
);
const currentLabel = computed(
  () => props.account?.broker_label || props.account?.broker_group || "—"
);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      label.value = props.account?.broker_label || "";
      loading.value = false;
    }
  },
  { immediate: true }
);

const closeDialog = () => {
  if (loading.value) return;
  emit("close");
};

const submitUpdateLabel = () => {
  if (loading.value || !props.account?.id) return;

  loading.value = true;

  const newLabel = label.value.trim();

  const successHandler = (res) => {
    loading.value = false;
    if (props.account) {
      props.account.broker_label = newLabel;
    }
    snackbar.show(
      res?.message || "Account label updated successfully.",
      "success"
    );
    emit("success", { account: props.account, label: newLabel });
    emit("close");
  };

  const failureHandler = (err) => {
    loading.value = false;
    snackbar.show(
      err?.message || err?.error || "Failed to update account label.",
      "error"
    );
  };

  apiRequest(urls.KEYS.POST, urls.tradingAccounts.update, {
    data: {
      trading_account_id: props.account.id,
      broker_label: newLabel,
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
            Edit Account Label
          </h2>
          <p class="text-[11px] text-secondary-text">
            Assign a custom name to identify this account
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
            <span class="text-secondary-text">Platform / Currency:</span>
            <span class="font-semibold text-primary-text">{{ platform }} ({{ currency }})</span>
          </div>
          <div class="flex items-center justify-between gap-3 text-xs">
            <span class="text-secondary-text">Current Label:</span>
            <span class="font-medium text-primary-text truncate max-w-[200px]">{{ currentLabel }}</span>
          </div>
        </div>

        <!-- Label Input -->
        <div>
          <label class="block text-xs font-medium text-secondary-text mb-1.5">
            Account Label
          </label>
          <input
            v-model="label"
            type="text"
            placeholder="e.g. Scalping MT5, Main Account"
            maxlength="50"
            class="w-full px-3.5 py-2.5 rounded-xl bg-background border border-primary-border text-primary-text text-xs focus:outline-none focus:border-primary transition-colors font-medium placeholder:text-secondary-text"
            @keyup.enter="submitUpdateLabel"
          />
          <p class="text-[11px] text-secondary-text mt-1.5 leading-relaxed">
            A label helps you quickly recognize your account across trades, transfers, and reports.
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
          @click="submitUpdateLabel"
        >
          <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" />
          <span>{{ loading ? "Saving..." : "Save Label" }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
