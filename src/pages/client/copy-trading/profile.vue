<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { UserPlus, UserCheck } from "lucide-vue-next";
import TradingDashboard from "@/components/client/copy-trading/charts/TradingDashboard.vue";
import FmAnalysisSection from "@/components/fm/analysis/FmAnalysisSection.vue";
import FollowDialog from "@/components/fm/leaderboard/FollowDialog.vue";
import { useFmAnalysisStore } from "@/stores/fm/analysis";
import { useRoute, useRouter } from "vue-router";
import { useFmLeaderboardStore } from "@/stores/fm/leaderboard";
import { useProfileStore } from "@/stores/shared/profile";
import { getAvatar } from "@/utils/avtar.js";
import { formatFollowers } from "@/utils/formatters.js";

const route = useRoute();
const router = useRouter();

const analysisStore = useFmAnalysisStore();
const leaderboardStore = useFmLeaderboardStore();
const isActionMenuOpen = ref(false);
const profileStore = useProfileStore();

const dialog = ref({ open: false, mode: "follow", item: null });

const openFollowDialog = (mode) => {
  const item = {
    id: fmId,
    fm_id: fmId,
    name: displayName.value,
    label_name: displayName.value,
    ...activeFm.value,
    ...fmInfo.value,
    following_account_id: followerId.value,
  };

  if (mode === "unfollow" && followerId.value) {
    leaderboardStore.fetchUnfollowPreview({
      trading_account_id: followerId.value,
    });
  }

  dialog.value = {
    open: true,
    mode,
    item,
  };
};

const handleFollowSuccess = () => {
  dialog.value.open = false;
  analysisStore.fetchAnalytics(fmId, isFollowed.value, followerId.value);
};

const windowWidth = ref(typeof window !== "undefined" ? window.innerWidth : 1024);

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener("resize", updateWindowWidth);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateWindowWidth);
});

const getActiveFmFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("activeFm") || "null");
  } catch {
    return null;
  }
};

const activeFm = ref(getActiveFmFromStorage());

const fmId = route.params.id;
const isFollowed = computed(() => route.query.is_followed === "true");
const followerId = computed(() => route.query.follower_id);

const fmtFollowers = (n) => formatFollowers(n);

const fmInfo = computed(() => analysisStore.analytics?.FundManagerinfo ?? {});
const strategyInfo = computed(
  () => analysisStore.analytics?.strategy_info ?? {},
);

const displayName = computed(() => {
  return (
    activeFm.value?.label_name ||
    fmInfo.value.label_name ||
    fmInfo.value.name ||
    activeFm.value?.name ||
    "Fund Manager"
  );
});

const displayBio = computed(() => {
  return fmInfo.value.bio || activeFm.value?.bio || null;
});

const bioContainerRef = ref(null);
const isBioExpanded = ref(false);
const isBioLong = ref(false);
const visibleBioText = ref("");

const calculateTruncation = () => {
  if (!displayBio.value || isBioExpanded.value) return;

  const el = bioContainerRef.value;
  if (!el) return;

  const pEl = el.querySelector("p");
  if (!pEl) return;

  const fullText = displayBio.value.trim();

  const computedStyle = window.getComputedStyle(pEl);
  let lineHeight = parseFloat(computedStyle.lineHeight);
  if (isNaN(lineHeight) || lineHeight <= 0) {
    const fontSize = parseFloat(computedStyle.fontSize) || 14;
    lineHeight = fontSize * 1.625;
  }

  const max2LineHeight = lineHeight * 2 + 2;

  const clone = pEl.cloneNode(true);
  clone.style.position = "absolute";
  clone.style.visibility = "hidden";
  clone.style.left = "-9999px";
  clone.style.top = "-9999px";
  clone.style.height = "auto";
  clone.style.maxHeight = "none";
  clone.style.width = `${pEl.clientWidth}px`;
  document.body.appendChild(clone);

  const btnHTML = '<button type="button" class="ml-1 text-xs font-bold text-primary cursor-pointer inline">... Show More</button>';
  
  clone.innerHTML = `<span>${fullText}</span>`;
  
  if (clone.scrollHeight <= max2LineHeight) {
    isBioLong.value = false;
    visibleBioText.value = fullText;
    if (document.body.contains(clone)) document.body.removeChild(clone);
    return;
  }

  isBioLong.value = true;

  let low = 0;
  let high = fullText.length;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = fullText.slice(0, mid).trim();
    clone.innerHTML = `<span>${candidate}</span>${btnHTML}`;

    if (clone.scrollHeight <= max2LineHeight) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (document.body.contains(clone)) document.body.removeChild(clone);
  visibleBioText.value = fullText.slice(0, best).trim();
};

let resizeObserver = null;
let lastContainerWidth = 0;

watch(displayBio, () => {
  nextTick(() => calculateTruncation());
});

watch(isBioExpanded, (newVal) => {
  if (!newVal) {
    nextTick(() => calculateTruncation());
  }
});

onMounted(() => {
  nextTick(() => calculateTruncation());
  if (bioContainerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (Math.abs(width - lastContainerWidth) > 2) {
          lastContainerWidth = width;
          calculateTruncation();
        }
      }
    });
    resizeObserver.observe(bioContainerRef.value);
  }
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

const displayBanner = computed(() => {
  return fmInfo.value.profile_banner || activeFm.value?.profile_banner || null;
});

const displayAvatar = computed(() => {
  return (
    fmInfo.value.profile_image ||
    activeFm.value?.profile_image ||
    getAvatar(fmInfo.value.name || displayName.value || fmId)
  );
});

const isArbtGoldbot = computed(() => {
  const name = String(
    displayName.value ||
    activeFm.value?.label_name ||
    activeFm.value?.name ||
    fmInfo.value?.label_name ||
    fmInfo.value?.name ||
    ""
  ).toUpperCase();
  return name.includes("ARBT_GOLDBOT") || String(fmId) === "10";
});

const copiersCount = computed(() => {
  if (activeFm.value?.total_followers != null) {
    const val = Number(activeFm.value.total_followers);
    if (isArbtGoldbot.value && !activeFm.value._followersAdjusted) {
      return val + 5;
    }
    return val;
  }
  const baseCopiers = Number(strategyInfo.value?.active_copiers ?? 0);
  if (isArbtGoldbot.value && !strategyInfo.value?._copiersAdjusted) {
    return baseCopiers + 5;
  }
  return baseCopiers;
});

const topBannerStats = computed(() => {
  const overview = analysisStore.analytics?.overview ?? {};
  const strategy = analysisStore.analytics?.strategy_info ?? {};

  return [
    {
      label: "Total Return",
      value: `${overview.total_return ?? 0}`,
    },
    {
      label: "Win Rate(in%)",
      value: `${overview.win_rate ?? 0}%`,
    },
    {
      label: "Profit Sharing",
      value: `${strategy.profit_sharing ?? 0}%`,
    },
    {
      label: "Max Drawdown",
      value: `${overview.max_drawdown ?? 0}%`,
    },
    {
      label: "Copiers",
      value: fmtFollowers(copiersCount.value),
    },
  ];
});

const handleBack = () => {
  if (window.history.state && window.history.state.back) {
    router.back();
  } else if (profileStore.user?.role === "fm" || localStorage.getItem("role") === "fm") {
    router.push("/fm-leaderboard");
  } else {
    router.push("/copy-trading");
  }
};


</script>

<template>
  <div class="bg-background min-h-screen">
    <div
      class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-12 py-8 space-y-6"
    >
      <!-- Loading Skeleton for Header -->
      <div v-if="analysisStore.loading" class="space-y-6 animate-pulse">
        <div class="flex items-center gap-4 mb-6">
          <div class="h-10 w-10 rounded-full bg-card-background border border-primary-border" />
          <div class="h-8 w-32 bg-card-background border border-primary-border rounded-lg" />
        </div>
        <div class="relative w-full rounded-2xl overflow-hidden bg-card-background border border-primary-border p-6 space-y-6">
          <div class="h-44 w-full rounded-xl bg-background border border-primary-border" />
          <div class="flex items-center gap-4">
            <div class="h-20 w-20 rounded-full bg-background border border-primary-border shrink-0" />
            <div class="space-y-2 flex-1">
              <div class="h-5 w-48 bg-background rounded" />
              <div class="h-3.5 w-72 bg-background rounded" />
            </div>
          </div>
          <div class="h-24 w-full rounded-xl bg-background border border-primary-border" />
        </div>
      </div>

      <!-- Main Profile Content Header -->
      <div v-else class="relative w-full rounded-2xl">
        <div class="flex items-center gap-4 mb-6">
          <button
            type="button"
            @click="handleBack"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-card-background text-primary-text transition-colors duration-200 hover:bg-background cursor-pointer"
            aria-label="Back"
          >
            <span class="material-symbols-outlined"> arrow_back </span>
          </button>

          <h2 class="text-2xl font-bold text-primary-text">Profile</h2>
        </div>

        <!-- Banner -->
        <div
          class="relative h-36 sm:h-48 md:h-56 w-full rounded-t-2xl bg-card-background overflow-hidden border-b border-primary-border/40"
        >
          <img
            v-if="displayBanner"
            :src="displayBanner"
            alt="Banner"
            class="absolute inset-0 h-full w-full object-cover"
          />
          <div
            v-else
            class="absolute inset-0 bg-gradient-to-r from-primary-blue/20 via-primary/30 to-purple-500/20 flex items-center justify-center"
          >
            <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60"></div>
          </div>
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
          ></div>
        </div>

        <!-- Body -->
        <div class="px-4 sm:px-8 pb-6 rounded-2xl rounded-t-none bg-card-background relative">
          <!-- Avatar (Original Absolute Position) -->
          <img
            :src="displayAvatar"
            alt="Avatar"
            class="absolute -top-[45px] md:-top-[60px] h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border-4 border-card-background z-10 shadow-lg bg-card-background shrink-0"
          />

          <!-- Top Row with Follow Button -->
          <div class="flex items-center justify-end pt-3 sm:pt-4 mb-2 sm:mb-3 min-h-[48px] sm:min-h-[56px]">
            <!-- Follow / Unfollow Action Button -->
            <div v-if="profileStore.user?.role !== 'fm'" class="shrink-0">
              <button
                v-if="!isFollowed"
                type="button"
                @click="openFollowDialog('follow')"
                class="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-full bg-button text-button-text font-bold text-xs sm:text-sm transition-all hover:brightness-110 cursor-pointer shadow-md"
              >
                <UserPlus class="w-4 h-4" />
                <span>Follow</span>
              </button>

              <button
                v-else
                type="button"
                @click="openFollowDialog('unfollow')"
                class="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-xs sm:text-sm transition-all hover:bg-red-500/20 cursor-pointer"
              >
                <UserCheck class="w-4 h-4" />
                <span>Unfollow</span>
              </button>
            </div>
          </div>

          <!-- Name, Bio, Followers -->
          <div class="pt-2 sm:pt-4 min-w-0 flex-1">
            <!-- Name -->
            <h2 class="text-xl sm:text-2xl font-bold text-primary-text">
              {{ displayName }}
            </h2>

            <!-- Bio with Inline Show More / Show Less on 2nd Line -->
            <div v-if="displayBio" ref="bioContainerRef" class="mt-2.5 w-full min-w-0">
              <p class="text-sm leading-relaxed text-secondary-text w-full break-words">
                <span>{{ isBioExpanded ? displayBio : (isBioLong ? visibleBioText : displayBio) }}</span>
                <button
                  v-if="isBioLong"
                  type="button"
                  @click="isBioExpanded = !isBioExpanded"
                  class="ml-1 text-xs font-bold text-primary hover:underline cursor-pointer inline"
                >
                  {{ isBioExpanded ? " Show Less" : "... Show More" }}
                </button>
              </p>
            </div>

            <!-- Followers / Active Since -->
            <p class="mt-3 text-sm font-semibold text-primary-text">
              {{ fmtFollowers(activeFm?.total_followers ?? strategyInfo.active_copiers ?? 0) }} Followers &bull; Active Since
              {{ strategyInfo.active_since || (activeFm?.created_at ? new Date(activeFm.created_at).getFullYear() : 'N/A') }}
            </p>
          </div>

          <!-- Stats -->
          <div class="mt-6 rounded-2xl bg-background border border-primary-border px-6 sm:px-8 py-5">
            <div
              class="grid lg:grid-cols-5 rounded-xl sm:grid-cols-2 space-y-2 sm:space-y-0 gap-4"
            >
              <div v-for="item in topBannerStats" :key="item.label" class="">
                <p class="text-sm text-secondary-text">
                  {{ item.label }}
                </p>

                <p class="font-bold text-primary-text">
                  {{ item.value }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fund Manager Performance Calendar & Trade Analysis -->
      <FmAnalysisSection
        :fm-id="fmId"
        :is-followed="isFollowed"
        :follower-id="followerId"
        :show-header="true"
      />

      <TradingDashboard />
    </div>

    <!-- Follow Dialog -->
    <FollowDialog
      :open="dialog.open"
      :mode="dialog.mode"
      :item="dialog.item"
      :unfollow-preview-loading="leaderboardStore.unfollowPreviewLoading"
      :unfollow-active-positions="leaderboardStore.unfollowPreview?.active_positions"
      @close="dialog.open = false"
      @success="handleFollowSuccess"
    />
  </div>
</template>
