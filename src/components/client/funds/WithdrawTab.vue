<!--
  WithdrawTab
  Master orchestrator for the modernized multi-step Withdrawal flow.
  Step 1: WithdrawStepForm (Account & Payment Method selection only)
  Step 2: WithdrawStepDetails (Crypto / PayMaxis dynamic fields, USC/USD amounts & Email OTP verification)
  Sidebar: WithdrawSidebar (2-step progress guide & Need Help card)
-->
<script setup>
import { watch } from "vue";
import { storeToRefs } from "pinia";
import { useWithdrawStore } from "@/stores/client/withdraw";
import WithdrawSidebar from "./withdraw/WithdrawSidebar.vue";
import WithdrawStepForm from "./withdraw/WithdrawStepForm.vue";
import WithdrawStepDetails from "./withdraw/WithdrawStepDetails.vue";

const props = defineProps({
  step: {
    type: Number,
    default: 1,
  },
});

const emit = defineEmits(["update:step", "done"]);

const withdrawStore = useWithdrawStore();
const { currentStep } = storeToRefs(withdrawStore);

// Sync prop step if passed
watch(
  () => props.step,
  (newStep) => {
    if (newStep && newStep !== currentStep.value) {
      currentStep.value = newStep;
    }
  },
  { immediate: true }
);

watch(currentStep, (newStep) => {
  emit("update:step", newStep);
});
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_465px] gap-8 items-start">
    <!-- Active Step Content -->
    <div class="w-full">
      <!-- Step 1: Select Trading Account & Withdrawal Method -->
      <WithdrawStepForm v-if="currentStep === 1" />

      <!-- Step 2: Dynamic Form / Crypto Network, Amount & OTP Verification -->
      <WithdrawStepDetails v-else-if="currentStep === 2" />
    </div>

    <!-- Reusable Stepper & Help Sidebar -->
    <WithdrawSidebar :current-step="currentStep" />
  </div>
</template>
