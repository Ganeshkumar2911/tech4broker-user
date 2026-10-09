<script setup>
import { ref, onMounted, onUnmounted, shallowRef } from "vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import { loadPaymaxisSdk } from "@/utils/paymaxisSdk";
import { useSnackbarStore } from "@/stores/shared/snackbar";

const props = defineProps({
  paymentId: {
    type: String,
    required: true,
  },
  isProduction: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["success", "error", "cancel", "back"]);
const snackbar = useSnackbarStore();

// UI State
const sdkLoading = ref(true);
const isSubmitting = ref(false);
const showNewCardScreen = ref(true);
const savedCards = ref([]);
const selectedCardId = ref(null);
const userWantsToSaveCard = ref(true);

// SDK Instance
const sdkInstance = shallowRef(null);

const fieldStyles = {
  variant: "outlined",
  labelPosition: "floating",
  inputBase: {
    backgroundColor: "#161922",
    border: "1px solid #282d3c",
    color: "#ffffff",
    borderRadius: "0.5rem",
  },
  labelBase: {
    color: "#94a3b8",
    backgroundColor: "#161922",
  },
};

onMounted(async () => {
  try {
    const HostedFieldsSDK = await loadPaymaxisSdk(props.isProduction);
    sdkInstance.value = HostedFieldsSDK({
      paymentId: props.paymentId,
      theme: "dark",
    });

    sdkInstance.value.init();
    sdkInstance.value.renderLoadingSkeleton(
      "#paymaxis-loading-container",
      4,
      "3.5rem",
    );

    sdkInstance.value.onReady(() => {
      sdkLoading.value = false;
      const cards = sdkInstance.value.getSavedCards();

      if (cards && cards.length > 0) {
        savedCards.value = cards;
        showNewCardScreen.value = false;
        selectCard(cards[0]);
      } else {
        showNewCardScreen.value = true;
        mountNewCardFields();
      }
    });

    sdkInstance.value.onError((err) => {
      console.error("Paymaxis SDK Error:", err);
      if (!sdkLoading.value) {
        snackbar.show(err?.message || "A payment error occurred.", "error");
      }
    });
  } catch (error) {
    console.error("Failed to load Paymaxis SDK:", error);
    snackbar.show("Failed to initialize payment gateway.", "error");
    emit("error", error);
  }
});

onUnmounted(() => {
  if (sdkInstance.value) {
    try {
      sdkInstance.value.unmountField("cardNumber");
      sdkInstance.value.unmountField("expiryDate");
      sdkInstance.value.unmountField("cvv");
      sdkInstance.value.unmountField("cardholderName");
    } catch (e) {
      // ignore
    }
  }
});

function mountNewCardFields() {
  if (!sdkInstance.value) return;

  try {
    sdkInstance.value.unmountField("cvv");
  } catch (e) {}

  setTimeout(() => {
    sdkInstance.value.mountField("#cardNumber", {
      fieldType: "cardNumber",
      label: "Card Number",
      fieldStyles,
    });
    sdkInstance.value.mountField("#expiryDate", {
      fieldType: "expiryDate",
      label: "Expiry Date",
      fieldStyles,
    });
    sdkInstance.value.mountField("#cvv", {
      fieldType: "cvv",
      label: "Card Security Code (CVV)",
      fieldStyles,
    });
    sdkInstance.value.mountField("#cardholderName", {
      fieldType: "cardholderName",
      label: "Cardholder Name",
      fieldStyles,
    });
  }, 50);
}

function selectCard(card) {
  selectedCardId.value = card.id;

  if (!sdkInstance.value) return;

  try {
    sdkInstance.value.unmountField("cardNumber");
    sdkInstance.value.unmountField("expiryDate");
    sdkInstance.value.unmountField("cardholderName");
    sdkInstance.value.unmountField("cvv");
  } catch (e) {}

  setTimeout(() => {
    sdkInstance.value.mountField("#saved-cvv-container", {
      fieldType: "cvv",
      label: "Card Security Code (CVV)",
      cardBrand: card.brand,
      fieldStyles,
    });
    if (typeof sdkInstance.value.setCardBrand === "function") {
      sdkInstance.value.setCardBrand(card.brand);
    }
  }, 50);
}

function toggleNewCardScreen(show) {
  showNewCardScreen.value = show;
  if (show) {
    mountNewCardFields();
  } else if (savedCards.value.length > 0) {
    selectCard(savedCards.value[0]);
  }
}

async function handleDeleteCard(cardId) {
  if (!sdkInstance.value) return;
  try {
    await sdkInstance.value.deleteCard(cardId);
    savedCards.value = sdkInstance.value.getSavedCards() || [];

    if (savedCards.value.length === 0) {
      toggleNewCardScreen(true);
    } else if (selectedCardId.value === cardId) {
      selectCard(savedCards.value[0]);
    }
    snackbar.show("Card deleted successfully.", "success");
  } catch (err) {
    snackbar.show("Failed to delete card.", "error");
  }
}

async function handlePayNow() {
  if (!sdkInstance.value) return;

  isSubmitting.value = true;
  try {
    let result;
    if (showNewCardScreen.value) {
      result = await sdkInstance.value.handleSubmit({
        saveCard: userWantsToSaveCard.value ? "true" : "false",
        billingCountryCode: "USD",
      });
    } else {
      if (!selectedCardId.value) {
        throw new Error("No saved card selected.");
      }
      result = await sdkInstance.value.handleSubmit({
        selectedCardId: String(selectedCardId.value),
        billingCountryCode: "USD",
      });
    }

    if (result && result.redirectUrl) {
      // 3D Secure redirect
      window.location.href = result.redirectUrl;
    } else {
      snackbar.show("Payment successful.", "success");
      emit("success");
    }
  } catch (err) {
    isSubmitting.value = false;
    snackbar.show(err?.message || "Payment submission failed.", "error");
    console.error("Payment Error:", err);
  }
}
</script>

<template>
  <div class="paymaxis-checkout-wrapper space-y-6">
    <div
      v-show="sdkLoading"
      id="paymaxis-loading-container"
      class="w-full min-h-[250px]"
    ></div>

    <div v-show="!sdkLoading" class="space-y-6">
      <!-- Toggle between Saved Cards and New Card -->
      <div
        v-if="savedCards.length > 0"
        class="flex gap-4 border-b border-primary-border pb-4"
      >
        <button
          @click="toggleNewCardScreen(false)"
          class="text-sm font-medium pb-2 -mb-[17px] transition-colors cursor-pointer"
          :class="
            !showNewCardScreen
              ? 'text-primary-text border-b-2 border-primary-text'
              : 'text-secondary-text hover:text-primary-text'
          "
        >
          Saved Cards ({{ savedCards.length }})
        </button>
        <button
          @click="toggleNewCardScreen(true)"
          class="text-sm font-medium pb-2 -mb-[17px] transition-colors cursor-pointer"
          :class="
            showNewCardScreen
              ? 'text-primary-text border-b-2 border-primary-text'
              : 'text-secondary-text hover:text-primary-text'
          "
        >
          New Card
        </button>
      </div>

      <!-- Saved Cards Flow -->
      <div v-if="!showNewCardScreen" class="space-y-4">
        <div class="space-y-3">
          <div
            v-for="card in savedCards"
            :key="card.id"
            class="flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer"
            :class="
              selectedCardId === card.id
                ? 'bg-card-background border-primary-text'
                : 'bg-background border-primary-border hover:bg-card-background/60'
            "
            @click="selectCard(card)"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-white rounded-md flex items-center justify-center p-1 shrink-0"
              >
                <BaseIcon name="credit_card" class="text-black" />
              </div>
              <div>
                <p class="text-sm font-bold text-primary-text tracking-widest">
                  •••• •••• •••• {{ card.last4 }}
                </p>
                <p class="text-xs text-secondary-text uppercase">
                  {{ card.brand }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button
                @click.stop="handleDeleteCard(card.id)"
                class="text-red-500 hover:text-red-400 p-1 cursor-pointer"
                title="Delete Card"
              >
                <BaseIcon name="delete" :size="20" />
              </button>
              <div
                class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                :class="
                  selectedCardId === card.id
                    ? 'border-primary-text'
                    : 'border-primary-border'
                "
              >
                <div
                  v-if="selectedCardId === card.id"
                  class="w-2.5 h-2.5 rounded-full bg-primary-text"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-2">
          <p class="text-xs text-secondary-text mb-2">Security Code</p>
          <div id="saved-cvv-container" class="h-12 w-full max-w-[180px]"></div>
        </div>
      </div>

      <!-- New Card Flow -->
      <div v-show="showNewCardScreen" class="space-y-4">
        <div id="cardNumber" class="h-12 w-full"></div>
        <div class="grid grid-cols-2 gap-4">
          <div id="expiryDate" class="h-12 w-full"></div>
          <div id="cvv" class="h-12 w-full"></div>
        </div>
        <div id="cardholderName" class="h-12 w-full"></div>

        <label class="flex items-center gap-2 cursor-pointer mt-2">
          <input
            type="checkbox"
            v-model="userWantsToSaveCard"
            class="rounded border-primary-border bg-background text-primary-text focus:ring-primary-text"
          />
          <span class="text-sm text-secondary-text">
            Save this card for future payments
          </span>
        </label>
      </div>

      <!-- Pay Actions -->
      <div class="pt-4 flex gap-3">
        <button
          type="button"
          @click="$emit('back')"
          :disabled="isSubmitting"
          class="h-12 px-6 rounded-full border border-primary-border text-primary-text font-semibold hover:bg-background transition-colors cursor-pointer"
        >
          Back
        </button>
        <button
          type="button"
          @click="handlePayNow"
          :disabled="isSubmitting || sdkLoading"
          class="flex-1 h-12 rounded-full bg-button text-button-text font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <BaseIcon v-if="isSubmitting" name="sync" class="animate-spin" />
          <span v-else class="material-symbols-rounded text-[20px]"> lock </span>
          <span>{{ isSubmitting ? "Processing..." : "Pay Now" }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
