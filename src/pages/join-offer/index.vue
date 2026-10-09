<script setup>
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Loader2, AlertCircle } from "lucide-vue-next";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import authToken from "@/common/authToken";
import { useFmLeaderboardStore } from "@/stores/fm/leaderboard";
import { useSnackbarStore } from "@/stores/shared/snackbar";

const route = useRoute();
const router = useRouter();
const store = useFmLeaderboardStore();
const snackbar = useSnackbarStore();

const token = computed(() => route.params.token);
const isLoading = ref(true);
const error = ref(null);
const offerData = ref(null);

const isAuthenticated = computed(() => Boolean(authToken.getToken()?.accessToken));

const fetchOfferDetails = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await apiRequest(urls.KEYS.GET, urls.fmOffers.joinByToken, {
      look_up_key: token.value,
      isTokenRequired: true,
    });

    if (response?.data) {
      offerData.value = response.data;
      handleFetchSuccess(response.data);
    } else {
      error.value = "Invalid or expired join link";
    }
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || "Failed to load offer details";
    snackbar.show(error.value, "error");
  } finally {
    isLoading.value = false;
  }
};

const handleFetchSuccess = (data) => {
  // Fetch trading accounts before navigating
  store.fetchTradingAccounts(data?.fund_manager?.id);

  // Store offer data in Pinia before navigating
  store.setPrivateOfferData(data);

  // Navigate to copy-trading
  setTimeout(() => {
    router.push({ name: "copy-trading" });
  }, 400);
};

onMounted(() => {
  if (!isAuthenticated.value) {
    // Store the return URL and redirect to login
    sessionStorage.setItem("returnUrl", route.fullPath);
    router.push({
      name: "login",
      query: { redirect: route.fullPath },
    });
  } else {
    // Fetch offer details and navigate to copy-trading
    fetchOfferDetails();
  }
});
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <!-- Loading/Processing State -->
    <div
      v-if="isLoading"
      class="bg-card-background rounded-2xl border border-primary-border w-full max-w-sm p-8 flex flex-col items-center gap-4 shadow-2xl"
    >
      <Loader2 class="w-8 h-8 animate-spin text-primary-yellow" />
      <p class="text-sm font-medium text-secondary-text">Processing join link...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error && !offerData"
      class="bg-card-background rounded-2xl border border-primary-border w-full max-w-sm p-6 shadow-2xl"
    >
      <div class="flex items-start gap-3 mb-5">
        <AlertCircle class="w-5 h-5 text-primary-red mt-0.5 shrink-0" />
        <div>
          <p class="text-sm font-semibold text-primary-text mb-1">
            Unable to Load Offer
          </p>
          <p class="text-xs text-secondary-text leading-relaxed">{{ error }}</p>
        </div>
      </div>
      <button
        class="w-full px-4 py-2.5 rounded-lg text-xs font-medium text-primary-text bg-background border border-primary-border hover:bg-card-background transition-colors cursor-pointer"
        @click="router.push({ name: 'copy-trading' })"
      >
        Back to Copy Trading
      </button>
    </div>
  </div>
</template>
