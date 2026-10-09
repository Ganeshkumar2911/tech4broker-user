<script setup>
import { ref, watch, computed } from 'vue';
import Modal from '@/components/base/Modal.vue';
import { useCashbackStore } from '@/stores/client/cashback';
import { X, Check } from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean,
  account: Object,
  mode: { type: String, default: 'enroll' } // 'enroll' or 'change_plan'
});
const emit = defineEmits(['close']);

const store = useCashbackStore();
const selectedPlanId = ref(null);
const termsAccepted = ref(false);

const plans = computed(() => store.program?.plans || []);

const currentPlanId = computed(() => {
  return props.account?.enrollment?.plan_id || null;
});

const canSubmit = computed(() => {
  if (!selectedPlanId.value) return false;
  if (props.mode === 'enroll' && !termsAccepted.value) return false;
  return true;
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.mode === 'change_plan') {
      selectedPlanId.value = props.account?.enrollment?.pending_plan_id || props.account?.enrollment?.plan_id || null;
    } else {
      selectedPlanId.value = null;
    }
    termsAccepted.value = false;
  }
});

const close = () => {
  emit('close');
};

const submit = () => {
  if (!canSubmit.value) return;

  if (props.mode === 'change_plan') {
    store.changePlan(props.account.trading_account_id, selectedPlanId.value, () => close());
  } else {
    store.enroll(props.account.trading_account_id, selectedPlanId.value, () => close());
  }
};
</script>

<template>
  <Modal :modelValue="isOpen" @update:modelValue="(val) => !val && close()">
    <div class="w-full lg:w-[500px] p-6 space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-xl font-bold text-primary-text">
          {{ mode === 'change_plan' ? 'Change Cashback Plan' : 'Enroll in Cashback' }}
        </h3>
        <button @click="close" class="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-secondary-text">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="space-y-4">
        <p class="text-sm text-secondary-text">
          {{ mode === 'change_plan' ? 'Select a new plan. Changes take effect on the 1st of next month.' : 'Choose a cashback plan that suits your trading style.' }}
        </p>
        
        <div class="grid gap-3">
          <div 
            v-for="plan in plans" 
            :key="plan.id"
            @click="selectedPlanId = plan.id"
            class="relative p-4 rounded-xl border transition-all cursor-pointer overflow-hidden flex items-center justify-between"
            :class="selectedPlanId === plan.id ? 'border-primary bg-primary/5' : 'border-primary-border/20 bg-background hover:border-primary/50'"
          >
            <div class="space-y-1 z-10 relative">
              <h4 class="font-bold text-primary-text flex items-center gap-2">
                {{ plan.name }}
                <span v-if="currentPlanId === plan.id && mode === 'change_plan'" class="text-[9px] uppercase font-bold bg-white/10 text-secondary-text px-2 py-0.5 rounded-full">
                  Current
                </span>
              </h4>
              <p class="text-xs text-secondary-text">
                Earn <strong class="text-emerald-400 font-bold">${{ plan.rate_per_lot }}</strong> / Lot 
                (Qualifies on: <span class="capitalize">{{ plan.qualify_on }}</span>)
              </p>
            </div>
            
            <div 
              class="w-5 h-5 rounded-full flex items-center justify-center border transition-colors shrink-0 z-10"
              :class="selectedPlanId === plan.id ? 'border-primary bg-primary text-primary-text' : 'border-primary-border/40 text-transparent'"
            >
              <Check class="w-3.5 h-3.5" v-if="selectedPlanId === plan.id" />
            </div>
          </div>
        </div>

        <!-- Terms (only on enroll) -->
        <label v-if="mode === 'enroll'" class="flex items-start gap-3 mt-4 cursor-pointer group">
          <div class="mt-0.5 relative shrink-0">
            <input 
              v-model="termsAccepted" 
              type="checkbox" 
              class="sr-only"
            />
            <div 
              class="w-4 h-4 border rounded flex items-center justify-center transition-colors group-hover:border-primary/50"
              :class="termsAccepted ? 'bg-primary border-primary' : 'bg-background border-primary-border/40'"
            >
              <Check class="w-3 h-3 text-white transition-opacity" :class="termsAccepted ? 'opacity-100' : 'opacity-0'" />
            </div>
          </div>
          <span class="text-xs text-secondary-text leading-relaxed select-none">
            I agree to the <a href="#" class="text-primary hover:underline" @click.prevent>Terms & Conditions</a> of the Cashback Program v{{ store.program?.terms_version }}.
          </span>
        </label>
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
          :disabled="!canSubmit || store.isEnrolling || store.isChangingPlan"
          class="px-5 h-10 rounded-full font-bold text-sm transition-colors shadow-xs"
          :class="[
            canSubmit && !store.isEnrolling && !store.isChangingPlan
              ? 'bg-primary hover:bg-primary/90 text-primary-text cursor-pointer'
              : 'bg-white/5 text-secondary-text opacity-50 cursor-not-allowed'
          ]"
        >
          {{ (store.isEnrolling || store.isChangingPlan) ? 'Processing...' : 'Confirm' }}
        </button>
      </div>
    </div>
  </Modal>
</template>
