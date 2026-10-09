<script setup>
import { computed } from "vue";
import { X, Copy, Check, Users, Network, ArrowDownLeft, ArrowUpRight, UserCheck, ShieldCheck } from "lucide-vue-next";
import { ref } from "vue";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  node: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close"]);

const copied = ref(false);

const copyReferral = (text) => {
  if (!text) return;
  navigator.clipboard.writeText(String(text));
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
};

const initials = computed(() => {
  if (!props.node) return "IB";
  const name = props.node.name || props.node.email || "IB";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
});

const selfNet = computed(() => {
  const dep = props.node?.transactions?.self?.deposit?.overall || 0;
  const wth = props.node?.transactions?.self?.withdrawal?.overall || 0;
  return dep - wth;
});

const networkNet = computed(() => {
  const dep = props.node?.transactions?.network?.deposit?.overall || 0;
  const wth = props.node?.transactions?.network?.withdrawal?.overall || 0;
  return dep - wth;
});
</script>

<template>
  <Transition name="drawer">
    <div
      v-if="open && node"
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
        <div class="sticky top-0 z-20 bg-card-background/95 backdrop-blur-md border-b border-primary-border px-5 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm font-bold shrink-0">
              {{ initials }}
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-bold text-primary-text truncate">
                {{ node.name || 'IB Partner' }}
              </h3>
              <p class="text-xs text-secondary-text truncate">
                {{ node.email || '—' }}
              </p>
            </div>
          </div>

          <button
            type="button"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-secondary-text hover:text-primary-text hover:bg-background transition-colors cursor-pointer"
            @click="emit('close')"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-5 space-y-5 flex-1">
          <!-- Quick Meta Pill Row -->
          <div class="grid grid-cols-3 gap-2.5">
            <div class="bg-background border border-primary-border rounded-xl p-2.5 text-center">
              <span class="text-[10px] text-secondary-text uppercase tracking-wider block">Level</span>
              <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">Level {{ node.level ?? 0 }}</span>
            </div>
            <div class="bg-background border border-primary-border rounded-xl p-2.5 text-center">
              <span class="text-[10px] text-secondary-text uppercase tracking-wider block">Split</span>
              <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">{{ node.split_percentage ?? 0 }}%</span>
            </div>
            <div class="bg-background border border-primary-border rounded-xl p-2.5 text-center">
              <span class="text-[10px] text-secondary-text uppercase tracking-wider block">IB ID</span>
              <span class="text-xs font-bold text-primary-text">#{{ node.ib_id || '—' }}</span>
            </div>
          </div>

          <!-- Referral & IDs -->
          <div class="bg-background border border-primary-border rounded-xl p-3.5 space-y-2.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-secondary-text">Referral Code</span>
              <div class="flex items-center gap-1.5 font-mono">
                <span class="font-bold text-primary-text">{{ node.referral_code || '—' }}</span>
                <button
                  v-if="node.referral_code"
                  type="button"
                  class="p-1 rounded text-secondary-text hover:text-primary-text hover:bg-card-background transition-colors cursor-pointer"
                  title="Copy Referral Code"
                  @click="copyReferral(node.referral_code)"
                >
                  <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <Copy v-else class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between text-xs pt-2 border-t border-primary-border">
              <span class="text-secondary-text">User ID</span>
              <span class="font-mono text-primary-text">{{ node.user_id || '—' }}</span>
            </div>
          </div>

          <!-- Parent Information -->
          <div v-if="node.parent_name || node.parent_email || node.parent_ib_id" class="bg-background border border-primary-border rounded-xl p-3.5 space-y-2">
            <div class="flex items-center gap-1.5 text-xs font-semibold text-primary-text">
              <UserCheck class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Parent IB</span>
            </div>
            <div class="text-xs space-y-1 text-secondary-text">
              <p class="text-primary-text font-medium">{{ node.parent_name || '—' }}</p>
              <p class="truncate">{{ node.parent_email || '—' }}</p>
              <p v-if="node.parent_ib_id" class="text-[11px] font-mono text-secondary-text">Parent ID: #{{ node.parent_ib_id }}</p>
            </div>
          </div>

          <!-- Clients & Sub-IBs Counts -->
          <div class="grid grid-cols-3 gap-2.5">
            <div class="bg-background border border-primary-border rounded-xl p-3">
              <div class="flex items-center gap-1.5 text-secondary-text text-[11px] mb-1">
                <Users class="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                <span>Direct</span>
              </div>
              <p class="text-base font-bold text-primary-text">{{ node.total_clients ?? 0 }}</p>
            </div>

            <div class="bg-background border border-primary-border rounded-xl p-3">
              <div class="flex items-center gap-1.5 text-secondary-text text-[11px] mb-1">
                <Network class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>Network</span>
              </div>
              <p class="text-base font-bold text-primary-text">{{ node.total_overall_clients ?? 0 }}</p>
            </div>

            <div class="bg-background border border-primary-border rounded-xl p-3">
              <div class="flex items-center gap-1.5 text-secondary-text text-[11px] mb-1">
                <ShieldCheck class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Sub-IBs</span>
              </div>
              <p class="text-base font-bold text-primary-text">{{ node.total_sub_ibs ?? (node.children?.length || 0) }}</p>
            </div>
          </div>

          <!-- Self Transactions Breakdown -->
          <div class="bg-background border border-primary-border rounded-xl p-3.5 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-primary-text tracking-wide">Self Transactions</span>
              <span class="text-xs font-mono font-semibold" :class="selfNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
                Net: {{ formatCurrency(selfNet) }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <!-- Deposit -->
              <div class="bg-card-background p-2.5 rounded-lg border border-primary-border space-y-1">
                <div class="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ArrowDownLeft class="w-3 h-3" />
                  <span>Deposits</span>
                </div>
                <p class="text-xs font-bold text-primary-text">
                  {{ formatCurrency(node.transactions?.self?.deposit?.overall) }}
                </p>
                <div class="text-[10px] text-secondary-text flex justify-between pt-1 border-t border-primary-border/60">
                  <span>Real: {{ formatCurrency(node.transactions?.self?.deposit?.real) }}</span>
                </div>
              </div>

              <!-- Withdrawal -->
              <div class="bg-card-background p-2.5 rounded-lg border border-primary-border space-y-1">
                <div class="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                  <ArrowUpRight class="w-3 h-3" />
                  <span>Withdrawals</span>
                </div>
                <p class="text-xs font-bold text-primary-text">
                  {{ formatCurrency(node.transactions?.self?.withdrawal?.overall) }}
                </p>
                <div class="text-[10px] text-secondary-text flex justify-between pt-1 border-t border-primary-border/60">
                  <span>Real: {{ formatCurrency(node.transactions?.self?.withdrawal?.real) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Network Transactions Breakdown -->
          <div class="bg-background border border-primary-border rounded-xl p-3.5 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-primary-text tracking-wide">Network Transactions</span>
              <span class="text-xs font-mono font-semibold" :class="networkNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
                Net: {{ formatCurrency(networkNet) }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <!-- Deposit -->
              <div class="bg-card-background p-2.5 rounded-lg border border-primary-border space-y-1">
                <div class="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ArrowDownLeft class="w-3 h-3" />
                  <span>Deposits</span>
                </div>
                <p class="text-xs font-bold text-primary-text">
                  {{ formatCurrency(node.transactions?.network?.deposit?.overall) }}
                </p>
                <div class="text-[10px] text-secondary-text flex justify-between pt-1 border-t border-primary-border/60">
                  <span>Real: {{ formatCurrency(node.transactions?.network?.deposit?.real) }}</span>
                </div>
              </div>

              <!-- Withdrawal -->
              <div class="bg-card-background p-2.5 rounded-lg border border-primary-border space-y-1">
                <div class="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                  <ArrowUpRight class="w-3 h-3" />
                  <span>Withdrawals</span>
                </div>
                <p class="text-xs font-bold text-primary-text">
                  {{ formatCurrency(node.transactions?.network?.withdrawal?.overall) }}
                </p>
                <div class="text-[10px] text-secondary-text flex justify-between pt-1 border-t border-primary-border/60">
                  <span>Real: {{ formatCurrency(node.transactions?.network?.withdrawal?.real) }}</span>
                </div>
              </div>
            </div>
          </div>
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
</style>
