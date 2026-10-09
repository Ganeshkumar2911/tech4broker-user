<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { X, Copy, Check, CreditCard, ShieldCheck, Activity, Wallet, Eye } from "lucide-vue-next";

const router = useRouter();

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  client: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close"]);

const copiedId = ref(null);

const copyText = (text, id) => {
  if (!text) return;
  navigator.clipboard.writeText(String(text));
  copiedId.value = id;
  setTimeout(() => {
    copiedId.value = null;
  }, 2000);
};

const formatBalance = (val) => {
  const num = Number(val);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const clientInitials = computed(() => {
  if (!props.client) return "CL";
  const name = props.client.name || props.client.email || "CL";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
});

const accountsList = computed(() => {
  if (!props.client) return [];
  if (Array.isArray(props.client.accounts)) {
    return props.client.accounts;
  }
  return [];
});

const goToClientDetail = () => {
  if (props.client?.id) {
    emit("close");
    router.push(`/clients/${props.client.id}`);
  }
};
</script>

<template>
  <Transition name="drawer">
    <div
      v-if="open"
      class="fixed inset-0 z-50 overflow-hidden flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        @click="emit('close')"
      />

      <!-- Drawer Panel -->
      <div
        class="relative w-full max-w-md bg-card-background border-l border-primary-border text-primary-text h-full overflow-y-auto flex flex-col z-10 no-scrollbar transition-colors shadow-2xl"
      >
        <!-- Header -->
        <div
          class="sticky top-0 z-20 bg-card-background/95 backdrop-blur-md border-b border-primary-border px-5 py-4 flex items-center justify-between"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-10 h-10 rounded-full bg-background border border-primary-border text-secondary-text flex items-center justify-center text-sm font-bold shrink-0"
            >
              {{ clientInitials }}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-primary-text truncate">
                  {{ client?.name || "Client Accounts" }}
                </h3>
                <span
                  class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-background text-secondary-text border border-primary-border shrink-0"
                >
                  {{ accountsList.length }} {{ accountsList.length === 1 ? 'Account' : 'Accounts' }}
                </span>
              </div>
              <p class="text-xs text-secondary-text truncate mt-0.5">
                {{ client?.email || "—" }}
              </p>
            </div>
          </div>

          <button
            type="button"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-secondary-text hover:text-primary-text hover:bg-background transition-colors cursor-pointer"
            @click="emit('close')"
            aria-label="Close"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-5 space-y-4 flex-1">
          <!-- Accounts Cards List -->
          <div v-if="accountsList.length > 0" class="space-y-3">
            <div
              v-for="acc in accountsList"
              :key="acc.id || acc.account_number"
              class="bg-background border border-primary-border/80 hover:border-primary-border rounded-2xl p-4 transition-all duration-200 space-y-3 shadow-xs"
            >
              <!-- Card Top Row: Account Number + Badges -->
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-8 h-8 rounded-xl bg-card-background border border-primary-border flex items-center justify-center text-secondary-text shrink-0">
                    <CreditCard class="w-4 h-4 text-primary" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5 font-mono text-xs font-bold text-primary-text">
                      <span>{{ acc.account_number || `Account #${acc.id}` }}</span>
                      <button
                        v-if="acc.account_number"
                        type="button"
                        @click="copyText(acc.account_number, acc.id || acc.account_number)"
                        class="text-secondary-text hover:text-primary-text transition-colors cursor-pointer p-0.5"
                        title="Copy Account Number"
                      >
                        <component
                          :is="copiedId === (acc.id || acc.account_number) ? Check : Copy"
                          class="w-3 h-3 text-emerald-500"
                          v-if="copiedId === (acc.id || acc.account_number)"
                        />
                        <Copy v-else class="w-3 h-3" />
                      </button>
                    </div>
                    <span class="text-[10px] text-secondary-text block capitalize">
                      {{ (acc.trading_type || 'standard').replace('_', ' ') }}
                    </span>
                  </div>
                </div>

                <!-- Account Type Badges -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <BaseBadge
                    v-if="acc.account_type"
                    :value="acc.account_type"
                    size="2xs"
                  />

                  <BaseBadge
                    :status="acc.is_active !== false ? 'Active' : 'Inactive'"
                    size="2xs"
                  />
                </div>
              </div>

              <!-- Card Balance Row -->
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-card-background border border-primary-border/60">
                <div class="flex items-center gap-1.5">
                  <Wallet class="w-3.5 h-3.5 text-secondary-text" />
                  <span class="text-xs text-secondary-text">Balance</span>
                </div>
                <div class="flex items-baseline gap-1 font-mono">
                  <span class="text-sm font-bold text-primary-text">
                    {{ formatBalance(acc.balance) }}
                  </span>
                  <span class="text-2xs font-semibold text-secondary-text">
                    {{ acc.broker_currency || 'USD' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="h-64 flex flex-col items-center justify-center text-center p-6 bg-background rounded-2xl border border-dashed border-primary-border/80 space-y-2"
          >
            <div class="w-12 h-12 rounded-full bg-card-background border border-primary-border flex items-center justify-center text-secondary-text">
              <CreditCard class="w-6 h-6 stroke-[1.5]" />
            </div>
            <h4 class="text-xs font-bold text-primary-text">No Trading Accounts</h4>
            <p class="text-[11px] text-secondary-text max-w-[220px]">
              This client has not registered or linked any live or copy trading accounts yet.
            </p>
          </div>
        </div>

        <!-- Drawer Footer -->
        <div class="p-4 border-t border-primary-border bg-card-background/95 flex items-center gap-3">
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 py-2.5 px-4 rounded-xl border border-primary-border bg-background hover:bg-card-background text-secondary-text hover:text-primary-text text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            v-if="client?.id"
            type="button"
            @click="goToClientDetail"
            class="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
          >
            <Eye class="w-3.5 h-3.5" />
            <span>View Full Details</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-active > div:last-child,
.drawer-leave-active > div:last-child {
  transition: transform 0.25s ease-out;
}

.drawer-enter-from > div:last-child,
.drawer-leave-to > div:last-child {
  transform: translateX(100%);
}
</style>
