<script setup>
import { ref, computed, watch } from 'vue';
import Modal from '@/components/base/Modal.vue';
import { useCashbackStore } from '@/stores/client/cashback';
import { X, AlertCircle } from 'lucide-vue-next';

const props = defineProps({ isOpen: Boolean });
const emit = defineEmits(['close']);

const store = useCashbackStore();
const amount = ref('');
const selectedAccountId = ref(null);

const eligibleAccounts = computed(() => {
  return store.accounts.filter(a => a.account_type === 'live' && a.trading_type === 'real');
});

const availableAmount = computed(() => Number(store.balance?.available_amount || 0));
const minRedemptionAmount = computed(() => Number(store.balance?.min_redemption_amount || 50));

const canSubmit = computed(() => {
  const numAmount = Number(amount.value);
  return numAmount >= minRedemptionAmount.value && 
         numAmount <= availableAmount.value && 
         selectedAccountId.value;
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    amount.value = '';
    selectedAccountId.value = null;
    store.fetchAccounts(); // Ensure accounts are loaded
  }
});

const close = () => {
  emit('close');
};

const submit = () => {
  if (canSubmit.value) {
    store.redeem(amount.value, selectedAccountId.value, () => close());
  }
};
</script>

<template>
  <Modal :modelValue="isOpen" @update:modelValue="(val) => !val && close()">
    <div class="w-full lg:w-[480px] p-6 space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-xl font-bold text-primary-text">Redeem Cashback</h3>
        <button @click="close" class="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-secondary-text">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-4 rounded-xl bg-background border border-primary-border/20 space-y-3">
        <div class="flex justify-between items-center text-sm">
          <span class="text-secondary-text">Available to Redeem</span>
          <span class="font-bold text-emerald-400 font-mono tabular-nums">${{ availableAmount.toFixed(2) }}</span>
        </div>
        <div class="flex justify-between items-center text-sm">
          <span class="text-secondary-text">Minimum Amount</span>
          <span class="font-bold text-primary-text font-mono tabular-nums">${{ minRedemptionAmount.toFixed(2) }}</span>
        </div>
      </div>

      <div class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-secondary-text uppercase tracking-wider">Amount (USD)</label>
          <input
            v-model="amount"
            type="number"
            placeholder="0.00"
            class="w-full h-11 bg-background border border-primary-border rounded-xl px-4 text-primary-text placeholder:text-secondary-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-secondary-text uppercase tracking-wider">Destination Account</label>
          <select
            v-model="selectedAccountId"
            class="w-full h-11 bg-background border border-primary-border rounded-xl px-4 text-primary-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
          >
            <option :value="null" disabled>Select live trading account</option>
            <option v-for="acc in eligibleAccounts" :key="acc.trading_account_id" :value="acc.trading_account_id">
              {{ acc.account_number }} ({{ acc.broker_currency }})
            </option>
          </select>
        </div>
      </div>

      <div v-if="amount && Number(amount) < minRedemptionAmount" class="flex items-center gap-2 text-red-400 text-xs">
        <AlertCircle class="w-4 h-4" />
        <span>Amount must be at least ${{ minRedemptionAmount.toFixed(2) }}</span>
      </div>

      <div v-if="amount && Number(amount) > availableAmount" class="flex items-center gap-2 text-red-400 text-xs">
        <AlertCircle class="w-4 h-4" />
        <span>Amount exceeds available balance</span>
      </div>

      <div class="pt-4 flex justify-end gap-3">
        <button
          @click="close"
          class="px-5 h-10 rounded-full font-bold text-sm text-primary-text bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          @click="submit"
          :disabled="!canSubmit || store.isRedeeming"
          class="px-5 h-10 rounded-full font-bold text-sm transition-colors shadow-xs"
          :class="[
            canSubmit && !store.isRedeeming
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
              : 'bg-white/5 text-secondary-text opacity-50 cursor-not-allowed'
          ]"
        >
          {{ store.isRedeeming ? 'Processing...' : 'Confirm Redeem' }}
        </button>
      </div>
    </div>
  </Modal>
</template>
