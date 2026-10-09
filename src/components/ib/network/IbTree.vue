<template>
  <div class="space-y-2">
    <!-- Depth Color Guide Legend (Root Level Only) -->
    <div
      v-if="depth === 0 && items.length > 0"
      class="flex items-center justify-between gap-3 mb-3 px-3.5 py-2 rounded-xl bg-card-background border border-primary-border"
    >
      <div class="flex items-center gap-2 text-xs text-secondary-text">
        <span class="font-medium text-[11px]">Level Colors:</span>
        <div class="flex items-center gap-1.5 flex-wrap">
          <span
            v-for="(t, i) in LEVEL_THEMES"
            :key="i"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold"
            :class="t.badge"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="t.indicatorBg" />
            L{{ i }}
          </span>
        </div>
      </div>
    </div>

    <div v-for="node in items" :key="node.ib_id" class="relative">
      <div
        class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-xl border border-primary-border bg-card-background hover:bg-background transition-all group cursor-pointer"
        :class="[getTheme(depth).cardBorder]"
        @click="toggle(node.ib_id)"
      >
        <!-- Top Header / Info Section -->
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <!-- Left: expand indicator -->
          <div class="shrink-0 flex flex-col items-center gap-0.5">
            <div
              class="w-7 h-7 rounded-lg bg-background border border-primary-border flex items-center justify-center transition-colors"
              :class="expanded[node.ib_id] ? getTheme(depth).badge : ''"
            >
              <ChevronRight
                v-if="node.children?.length"
                class="w-3.5 h-3.5 transition-transform duration-200"
                :class="[
                  expanded[node.ib_id] ? 'rotate-90 ' + getTheme(depth).chevron : 'text-secondary-text'
                ]"
              />
              <Minus v-else class="w-3 h-3 text-secondary-text opacity-30" />
            </div>
          </div>

          <!-- Avatar -->
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border"
            :class="getTheme(depth).avatar"
          >
            {{ (node.name || node.email)?.charAt(0).toUpperCase() }}
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <!-- Name & Level (Mobile) -->
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-primary-text truncate">
                {{ node.name || "-" }}
              </p>
              <span
                class="lg:hidden text-[10px] px-1.5 py-0.5 rounded-full border font-semibold"
                :class="getTheme(depth).badge"
              >
                L{{ node.level }}
              </span>
            </div>

            <!-- Email -->
            <p class="text-[11px] text-secondary-text truncate mt-0.5">
              {{ node.email }}
            </p>

            <!-- Meta Info -->
            <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 font-mono">
              <span class="text-[10px] text-secondary-text">
                Code: <strong class="text-primary-text">{{ node.referral_code || "N/A" }}</strong>
              </span>

              <span v-if="node.user_id" class="text-[10px] text-secondary-text opacity-40">·</span>
              <span v-if="node.user_id" class="text-[10px] text-secondary-text">
                User ID: <strong class="text-primary-text">{{ node.user_id }}</strong>
              </span>

              <span class="text-[10px] text-secondary-text opacity-40">·</span>

              <span class="text-[10px] text-secondary-text font-sans">
                {{ node.total_sub_ibs ?? node.children?.length ?? 0 }}
                sub-IB{{
                  (node.total_sub_ibs ?? node.children?.length ?? 0) !== 1
                    ? "s"
                    : ""
                }}
              </span>
            </div>
          </div>

          <!-- Mobile Actions -->
          <div class="flex items-center gap-1 lg:hidden shrink-0">
            <button
              type="button"
              class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-200"
              :class="showDetails[node.ib_id]
                ? 'bg-primary/15 border-primary/50 text-primary'
                : 'bg-background border-primary-border text-secondary-text hover:text-primary-text'"
              :title="showDetails[node.ib_id] ? 'Hide Details' : 'Show Details'"
              @click.stop="toggleDetails(node.ib_id)"
            >
              <EyeOff v-if="showDetails[node.ib_id]" class="w-3.5 h-3.5" />
              <Eye v-else class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              class="w-7 h-7 flex items-center justify-center rounded-lg bg-background border border-primary-border text-secondary-text hover:text-primary-text transition-colors"
              title="Assign Referral Link"
              @click.stop="emit('assign-referral', node)"
            >
              <Link class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              class="w-7 h-7 flex items-center justify-center rounded-lg bg-background border border-primary-border text-secondary-text hover:text-primary-text transition-colors"
              title="View Clients"
              @click.stop="$router.push(`/ib-clients/${node.ib_id}`)"
            >
              <Users class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Badges / Metrics -->
        <div
          :class="[
            showDetails[node.ib_id] ? 'grid' : 'hidden lg:flex',
            'grid-cols-2 sm:grid-cols-3 lg:flex lg:items-center gap-2 lg:gap-3 pt-2.5 lg:pt-0 border-t border-primary-border/40 dark:border-slate-700/50 lg:border-t-0 shrink-0'
          ]"
          @click.stop
        >
          <!-- Direct Clients -->
          <div class="text-center p-2 lg:p-0 rounded-lg lg:bg-transparent border border-primary-border/40 dark:border-slate-700/40 lg:border-none flex flex-col justify-center">
            <p class="text-[10px] text-secondary-text dark:text-slate-400 uppercase tracking-wide leading-none mb-1 lg:mb-0.5">
              Direct Clients
            </p>
            <p class="text-xs font-bold text-primary-text dark:text-white">
              {{ node.total_clients ?? 0 }}
            </p>
          </div>
          <div class="hidden lg:block w-px h-6 bg-primary-border dark:bg-slate-700" />

          <!-- Overall Clients -->
          <div class="text-center p-2 lg:p-0 rounded-lg lg:bg-transparent border border-primary-border/40 dark:border-slate-700/40 lg:border-none flex flex-col justify-center">
            <p class="text-[10px] text-secondary-text dark:text-slate-400 uppercase tracking-wide leading-none mb-1 lg:mb-0.5">
              Overall Clients
            </p>
            <p class="text-xs font-bold text-primary-text dark:text-white">
              {{ node.total_overall_clients ?? 0 }}
            </p>
          </div>
          <div class="hidden lg:block w-px h-6 bg-primary-border dark:bg-slate-700" />

          <!-- Self Tx -->
          <div v-if="node.transactions?.self" class="text-center p-2 lg:p-0 rounded-lg lg:bg-transparent border border-primary-border/40 dark:border-slate-700/40 lg:border-none col-span-2 sm:col-span-1 flex flex-col justify-center">
            <p class="text-[10px] text-secondary-text dark:text-slate-400 uppercase tracking-wide leading-none mb-1 lg:mb-0.5">
              Self Tx
            </p>
            <div class="flex lg:block items-center justify-center gap-2 font-mono">
              <span class="text-[11px] font-semibold text-emerald-500 dark:text-emerald-400 leading-tight">
                +${{ fmtCurrency(node.transactions.self.deposit?.overall) }}
              </span>
              <span class="text-[10px] font-semibold text-rose-500 dark:text-rose-400 leading-tight">
                -${{ fmtCurrency(node.transactions.self.withdrawal?.overall) }}
              </span>
            </div>
            <p
              class="text-[10px] font-bold font-mono leading-tight mt-0.5"
              :class="netColorClass((node.transactions.self.deposit?.overall ?? 0) - (node.transactions.self.withdrawal?.overall ?? 0))"
            >
              Net: {{ fmtSignedCurrency((node.transactions.self.deposit?.overall ?? 0) - (node.transactions.self.withdrawal?.overall ?? 0)) }}
            </p>
          </div>
          <div v-if="node.transactions?.self" class="hidden lg:block w-px h-6 bg-primary-border dark:bg-slate-700" />

          <!-- Network Tx -->
          <div v-if="node.transactions?.network" class="text-center p-2 lg:p-0 rounded-lg  lg:bg-transparent border border-primary-border/40 dark:border-slate-700/40 lg:border-none col-span-2 sm:col-span-1 flex flex-col justify-center">
            <p class="text-[10px] text-secondary-text dark:text-slate-400 uppercase tracking-wide leading-none mb-1 lg:mb-0.5">
              Network Tx
            </p>
            <div class="flex lg:block items-center justify-center gap-2 font-mono">
              <span class="text-[11px] font-semibold text-emerald-500 dark:text-emerald-400 leading-tight">
                +${{ fmtCurrency(node.transactions.network.deposit?.overall) }}
              </span>
              <span class="text-[10px] font-semibold text-rose-500 dark:text-rose-400 leading-tight">
                -${{ fmtCurrency(node.transactions.network.withdrawal?.overall) }}
              </span>
            </div>
            <p
              class="text-[10px] font-bold font-mono leading-tight mt-0.5"
              :class="netColorClass((node.transactions.network.deposit?.overall ?? 0) - (node.transactions.network.withdrawal?.overall ?? 0))"
            >
              Net: {{ fmtSignedCurrency((node.transactions.network.deposit?.overall ?? 0) - (node.transactions.network.withdrawal?.overall ?? 0)) }}
            </p>
          </div>
          <div v-if="node.transactions?.network" class="hidden lg:block w-px h-6 bg-primary-border dark:bg-slate-700" />

          <!-- Sub IBs -->
          <div class="text-center p-2 lg:p-0 rounded-lg  lg:bg-transparent border border-primary-border/40 dark:border-slate-700/40 lg:border-none flex flex-col justify-center">
            <p class="text-[10px] text-secondary-text dark:text-slate-400 uppercase tracking-wide leading-none mb-1 lg:mb-0.5">
              Sub IBs
            </p>
            <p class="text-xs font-bold text-primary-text dark:text-white">
              {{ node.total_sub_ibs ?? node.children?.length ?? 0 }}
            </p>
          </div>
          <div class="hidden lg:block w-px h-6 bg-primary-border dark:bg-slate-700" />

          <!-- Split % -->
          <div class="text-center p-2 lg:p-0 rounded-lg  lg:bg-transparent border border-primary-border/40 dark:border-slate-700/40 lg:border-none flex flex-col justify-center">
            <p
              class="text-[10px] text-secondary-text dark:text-slate-400 uppercase tracking-wide leading-none mb-1 lg:mb-0.5"
            >
              Split
            </p>
            <p class="text-xs font-bold text-primary-text dark:text-white">
              {{ node.split_percentage ?? 0 }}%
            </p>
          </div>
          <div class="hidden lg:block w-px h-6 bg-primary-border dark:bg-slate-700" />

          <!-- Level Badge -->
          <span
            class="hidden lg:inline-flex text-[11px] px-2.5 py-0.5 rounded-full border font-bold"
            :class="getTheme(depth).badge"
          >
            L{{ node.level }}
          </span>
        </div>

        <!-- Desktop Actions -->
        <div
          class="hidden lg:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <button
            class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background dark:hover:bg-slate-800 border border-transparent hover:border-primary-border dark:hover:border-slate-700 transition-colors"
            title="Assign Referral Link"
            @click.stop="emit('assign-referral', node)"
          >
            <Link class="w-3.5 h-3.5 text-secondary-text dark:text-slate-400" />
          </button>
          <button
            class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background dark:hover:bg-slate-800 border border-transparent hover:border-primary-border dark:hover:border-slate-700 transition-colors"
            title="View Clients"
            @click.stop="$router.push(`/ib-clients/${node.ib_id}`)"
          >
            <Users class="w-3.5 h-3.5 text-secondary-text dark:text-slate-400" />
          </button>
        </div>
      </div>

      <!-- Children (Recursive) -->
      <div
        v-if="node.children?.length && expanded[node.ib_id]"
        class="mt-2 ml-2 sm:ml-4 md:ml-6 pl-2 sm:pl-3 md:pl-4 space-y-2 relative"
        :class="getTheme(depth).childrenBorder"
      >
        <IbTree
          :items="node.children"
          :expanded="expanded"
          :depth="depth + 1"
          @toggle="emit('toggle', $event)"
          @expand-all="emit('expand-all')"
          @collapse-all="emit('collapse-all')"
          @edit="emit('edit', $event)"
          @add-sub="emit('add-sub', $event)"
          @assign-referral="emit('assign-referral', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ChevronRight, Minus, Link, Users, Eye, EyeOff, ChevronsDown, ChevronsUp } from "lucide-vue-next";

const LEVEL_THEMES = [
  {
    cardBorder: 'border-l-4 border-l-teal-500',
    childrenBorder: 'border-l-2 border-teal-500/80',
    badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
    chevron: 'text-teal-600 dark:text-teal-400',
    indicatorBg: 'bg-teal-500',
    avatar: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
  },
  {
    cardBorder: 'border-l-4 border-l-emerald-500',
    childrenBorder: 'border-l-2 border-emerald-500/80',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    chevron: 'text-emerald-600 dark:text-emerald-400',
    indicatorBg: 'bg-emerald-500',
    avatar: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  {
    cardBorder: 'border-l-4 border-l-violet-500',
    childrenBorder: 'border-l-2 border-violet-500/80',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30',
    chevron: 'text-violet-600 dark:text-violet-400',
    indicatorBg: 'bg-violet-500',
    avatar: 'bg-violet-500/20 text-violet-400 border-violet-500/40',
  },
  {
    cardBorder: 'border-l-4 border-l-amber-500',
    childrenBorder: 'border-l-2 border-amber-500/80',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    chevron: 'text-amber-600 dark:text-amber-400',
    indicatorBg: 'bg-amber-500',
    avatar: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  {
    cardBorder: 'border-l-4 border-l-rose-500',
    childrenBorder: 'border-l-2 border-rose-500/80',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    chevron: 'text-rose-600 dark:text-rose-400',
    indicatorBg: 'bg-rose-500',
    avatar: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  },
  {
    cardBorder: 'border-l-4 border-l-sky-500',
    childrenBorder: 'border-l-2 border-sky-500/80',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
    chevron: 'text-sky-600 dark:text-sky-400',
    indicatorBg: 'bg-sky-500',
    avatar: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
  },
];

function getTheme(d) {
  return LEVEL_THEMES[d % LEVEL_THEMES.length];
}

defineProps({
  items: { type: Array, default: () => [] },
  expanded: { type: Object, default: () => ({}) },
  depth: { type: Number, default: 0 },
});

const emit = defineEmits(["toggle", "expand-all", "collapse-all", "edit", "add-sub", "assign-referral"]);
const toggle = (id) => emit("toggle", id);

const showDetails = ref({});
const toggleDetails = (id) => {
  showDetails.value[id] = !showDetails.value[id];
};

function fmtCurrency(v) {
  if (v === null || v === undefined) return '0.00';
  return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtSignedCurrency(val) {
  if (val === null || val === undefined) return '$0.00';
  const num = Number(val);
  const formatted = Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (num > 0) return `+$${formatted}`;
  if (num < 0) return `-$${formatted}`;
  return `$${formatted}`;
}

function netColorClass(val) {
  const num = Number(val ?? 0);
  if (num > 0) return 'text-emerald-500 dark:text-emerald-400';
  if (num < 0) return 'text-rose-500 dark:text-rose-400';
  return 'text-primary-text dark:text-slate-300';
}
</script>
