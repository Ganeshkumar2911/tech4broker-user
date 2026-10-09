<script setup>
import { computed, ref } from 'vue';
import { useCashbackStore } from '@/stores/client/cashback';
import { Wallet, ArrowLeftRight } from 'lucide-vue-next';
import RedeemModal from './RedeemModal.vue';

const store = useCashbackStore();
const isRedeemModalOpen = ref(false);

const availableAmount = computed(() => Number(store.balance?.available_amount || 0));
const lifetimeAmount = computed(() => Number(store.balance?.lifetime_earned_amount || 0));
const canRedeem = computed(() => store.balance?.can_redeem === true);

const openRedeemModal = () => {
  if (canRedeem.value) {
    isRedeemModalOpen.value = true;
  }
};
</script>

<template>
  <div class="bg-card-background rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-primary-border/10 ">
    <div class="space-y-2 max-w-xl">
      <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
        <Wallet class="w-3.5 h-3.5" />
        <span>Cashback Wallet</span>
      </div>
      <h3 class="text-lg sm:text-xl font-bold text-primary-text">
        Available Cashback Balance
      </h3>
      <p class="text-xs text-secondary-text leading-relaxed">
        Earn USD cashback per lot on closed trades based on your active plan. 
        Minimum redemption amount is ${{ store.balance?.min_redemption_amount || '50.00' }}.
      </p>
    </div>

    <!-- Wallet Quick Stats & Actions -->
    <div class="flex flex-wrap items-center gap-3 sm:gap-4 bg-background p-4 rounded-2xl shrink-0">
      <div class="space-y-0.5 pr-4 border-r border-primary-border/20">
        <p class="text-2xs text-secondary-text uppercase font-semibold">Available (USD)</p>
        <p class="text-xl font-extrabold text-emerald-400 font-mono tabular-nums">
          ${{ availableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </p>
      </div>
      <div class="space-y-0.5 pr-4 border-r border-primary-border/20 hidden sm:block">
        <p class="text-2xs text-secondary-text uppercase font-semibold">Lifetime Earned</p>
        <p class="text-base font-bold text-primary-text font-mono tabular-nums">
          ${{ lifetimeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="openRedeemModal"
          :disabled="!canRedeem"
          :class="[
            'inline-flex items-center gap-1.5 h-9 px-4 text-xs font-bold rounded-full transition-opacity ',
            canRedeem 
              ? 'bg-emerald-500 text-white hover:opacity-90 cursor-pointer' 
              : 'bg-white/5 text-secondary-text opacity-50 cursor-not-allowed'
          ]"
        >
          <ArrowLeftRight class="w-3.5 h-3.5" />
          <span>Redeem</span>
        </button>
      </div>
    </div>
  </div>

  <RedeemModal 
    :is-open="isRedeemModalOpen" 
    @close="isRedeemModalOpen = false" 
  />
</template>
