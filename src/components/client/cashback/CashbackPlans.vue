<script setup>
import { computed } from 'vue';
import { useCashbackStore } from '@/stores/client/cashback';
import { ShieldCheck, Activity, ArrowUpRight, ArrowDownRight, Info, CheckCircle2 } from 'lucide-vue-next';

const store = useCashbackStore();
const program = computed(() => store.program);

const formatRule = (key, value) => {
  if (key === 'require_live') return value ? 'Live Accounts Only' : 'Demo Allowed';
  if (key === 'require_kyc') return value ? 'KYC Required' : 'No KYC Required';
  if (key === 'exclude_copy_accounts') return value ? 'Copy Trading Excluded' : 'Copy Trading Allowed';
  return null;
};

const getPlanColors = (code) => {
  switch (code?.toLowerCase()) {
    case 'win':
      return {
        iconBg: 'bg-primary-green/10 dark:bg-primary-green/20',
        text: 'text-primary-green',
        badge: 'bg-primary-green/10 text-primary-green border-primary-green/20',
        icon: ArrowUpRight
      };
    case 'loss':
      return {
        iconBg: 'bg-primary-red/10 dark:bg-primary-red/20',
        text: 'text-primary-red',
        badge: 'bg-primary-red/10 text-primary-red border-primary-red/20',
        icon: ArrowDownRight
      };
    case 'all':
      return {
        iconBg: 'bg-primary/10 dark:bg-primary/20',
        text: 'text-primary',
        badge: 'bg-primary/10 text-primary border-primary/20',
        icon: Activity
      };
    default:
      return {
        iconBg: 'bg-secondary/10 dark:bg-secondary/20',
        text: 'text-primary-text',
        badge: 'bg-secondary/10 text-primary-text border-primary-border',
        icon: ShieldCheck
      };
  }
};
</script>

<template>
  <div class="space-y-4 sm:space-y-6" v-if="program">
    <!-- Top Card: Program Overview -->
    <div class="relative overflow-hidden bg-card-background border border-primary-border/40 rounded-3xl sm:rounded-4xl p-5 sm:p-8">
      <!-- Watermark Logo -->
      <img src="/fav-light.svg" class="hidden dark:block absolute -right-8 -bottom-8 sm:-right-4 sm:-bottom-4 w-32 h-32 sm:w-40 sm:h-40 pointer-events-none select-none z-0 opacity-20 sm:opacity-100 cashback-corner-logo" alt="" />
      <img src="@/assets/logo-blue.png" class="dark:hidden absolute -right-8 -bottom-8 sm:-right-4 sm:-bottom-4 w-40 h-40 sm:w-48 sm:h-48 object-contain pointer-events-none select-none z-0 opacity-[0.02] sm:opacity-[0.03]" alt="" />

      <div class="relative z-10 flex flex-col md:flex-row gap-6 justify-between">
        <div class="flex-1 space-y-4">
          <div>
            <div class="flex flex-wrap items-center gap-2 mb-3">
              <span class="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                Active Program
              </span>
              <span v-if="program.currency" class="px-2.5 py-1 rounded-full bg-background border border-primary-border/50 text-secondary-text text-[10px] font-bold uppercase tracking-wider">
                {{ program.currency }}
              </span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-primary-text leading-tight">
              {{ program.name }}
            </h2>
            <p class="mt-2 text-sm text-secondary-text max-w-2xl leading-relaxed">
              {{ program.description }}
            </p>
          </div>

          <!-- Eligibility Rules -->
          <div v-if="program.eligibility_rules" class="pt-4 border-t border-primary-border/20">
            <h4 class="text-[11px] sm:text-xs font-black text-primary uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Eligibility Requirements
            </h4>
            <div class="flex flex-wrap gap-2">
              <template v-for="(val, key) in program.eligibility_rules" :key="key">
                <span v-if="formatRule(key, val)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-primary-border/30 text-[11px] sm:text-xs text-secondary-text font-medium">
                  <CheckCircle2 class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-green" />
                  {{ formatRule(key, val) }}
                </span>
              </template>
              
              <span v-if="program.eligibility_rules.exclude_account_categories?.length" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-primary-border/30 text-[11px] sm:text-xs text-secondary-text font-medium">
                <CheckCircle2 class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-green" />
                Excludes: <span class="uppercase">{{ program.eligibility_rules.exclude_account_categories.join(', ') }}</span>
              </span>
              
              <span v-if="program.eligibility_rules.trading_types?.length" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-primary-border/30 text-[11px] sm:text-xs text-secondary-text font-medium">
                <CheckCircle2 class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-green" />
                Type: <span class="uppercase">{{ program.eligibility_rules.trading_types.join(', ') }}</span>
              </span>
            </div>
          </div>
        </div>
        
        <!-- Redemption Min -->
        <div class="md:text-right shrink-0 flex items-center justify-between md:block bg-background/50 md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none border border-primary-border/20 md:border-none">
          <p class="text-[10px] sm:text-[11px] font-bold text-secondary-text uppercase tracking-wider md:mb-2">Min. Redemption</p>
          <div class="inline-flex items-baseline gap-1 md:px-4 md:py-3">
            <span class="text-2xl sm:text-3xl font-extrabold text-primary-text">
              ${{ program.min_redemption_amount }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Clean Vertical Cards for Plans -->
    <div class="mt-6 sm:mt-8">
      <h3 class="text-base sm:text-lg font-bold text-primary-text mb-3 sm:mb-4">Available Plans</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <div 
          v-for="plan in program.plans" 
          :key="plan.id"
          class="group relative flex flex-col bg-card-background border border-primary-border/40 rounded-2xl sm:rounded-3xl p-5 sm:p-7"
        >
          <!-- Minimalist Header -->
          <div class="flex items-center justify-between mb-5 sm:mb-6">
            <div class="flex items-center gap-2.5 sm:gap-3">
              <div class="p-2 sm:p-2.5 rounded-xl" :class="getPlanColors(plan.code).iconBg">
                <component :is="getPlanColors(plan.code).icon" class="w-4 h-4 sm:w-5 sm:h-5" :class="getPlanColors(plan.code).text" />
              </div>
              <h3 class="text-base sm:text-lg font-extrabold tracking-tight text-primary-text">{{ plan.name }}</h3>
            </div>
            <span class="px-2 py-1 sm:px-2.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full border" :class="getPlanColors(plan.code).badge">
              {{ plan.status }}
            </span>
          </div>

          <!-- Content -->
          <div class="flex-1 mb-5 sm:mb-6">
            <p class="text-xs sm:text-sm text-secondary-text leading-relaxed">
              Earn cashback based on your <span class="font-bold text-primary-text">{{ plan.qualify_on }}</span> trades.
            </p>
          </div>

          <!-- Rate Banner -->
          <div class="pt-4 sm:pt-5 border-t border-primary-border/30 flex flex-row items-center justify-between sm:flex-col sm:items-start gap-1">
            <p class="text-[9px] sm:text-[10px] font-bold text-secondary-text uppercase tracking-wider">Cashback Rate</p>
            <div class="flex items-baseline gap-1">
              <span class="text-2xl sm:text-3xl font-extrabold tracking-tighter text-primary-text group-hover:text-primary transition-colors duration-300">
                ${{ plan.rate_per_lot }}
              </span>
              <span class="text-[10px] sm:text-xs font-bold text-secondary-text uppercase">
                / Lot
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
