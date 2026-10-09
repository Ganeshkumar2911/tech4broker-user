<!--
  DepositTab
  Master orchestrator for the revamped multi-step Deposit flow.
  Step 1: DepositStepForm (Account & Payment Method selection only)
  Step 2: DepositStepMethod (Crypto token/network OR Dynamic form fields & Live conversion)
  Step 3: DepositStepConfirm (QR Code, Wallet Address, Payment Breakdown for Crypto)
  Sidebar: DepositSidebar (3-step progress guide & Need Help card)
-->
<script setup>
import { watch } from "vue";
import { storeToRefs } from "pinia";
import { useDepositStore } from "@/stores/client/deposit";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import DepositSidebar from "./deposit/DepositSidebar.vue";
import DepositStepForm from "./deposit/DepositStepForm.vue";
import DepositStepMethod from "./deposit/DepositStepMethod.vue";
import DepositStepConfirm from "./deposit/DepositStepConfirm.vue";
import PaymaxisCheckout from "./deposit/PaymaxisCheckout.vue";

const props = defineProps({
  step: {
    type: Number,
    default: 1,
  },
});

const emit = defineEmits(["update:step", "success"]);

const depositStore = useDepositStore();
const snackbar = useSnackbarStore();

const { currentStep, isPaymaxisSdk, paymaxisPaymentId } =
  storeToRefs(depositStore);

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

function handlePaymaxisSuccess() {
  snackbar.show("Deposit payment completed successfully!", "success");
  emit("success");
  depositStore.resetFlow();
}

function handlePaymaxisBack() {
  isPaymaxisSdk.value = false;
  paymaxisPaymentId.value = null;
}
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_465px] gap-8 items-start">
    <!-- Active Step Content -->
    <div class="w-full">
      <!-- Step 1: Select Trading Account & Payment Method -->
      <DepositStepForm v-if="currentStep === 1" />

      <!-- Paymaxis Hosted Fields Card Checkout View (if SDK triggered) -->
      <PaymaxisCheckout
        v-else-if="currentStep === 2 && isPaymaxisSdk"
        :payment-id="paymaxisPaymentId"
        @back="handlePaymaxisBack"
        @cancel="handlePaymaxisBack"
        @success="handlePaymaxisSuccess"
      />

      <!-- Step 2: Crypto Token Selection OR Dynamic Form Details -->
      <DepositStepMethod v-else-if="currentStep === 2" />

      <!-- Step 3: QR Code & Wallet Address Confirmation -->
      <DepositStepConfirm v-else-if="currentStep === 3" />
    </div>

    <!-- Reusable Stepper & Help Sidebar -->
    <DepositSidebar :current-step="currentStep" />
  </div>
</template>
