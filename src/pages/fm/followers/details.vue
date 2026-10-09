<template>
  <div class="space-y-6 min-h-screen">
    <!-- Header -->
    <div>
      <h2 class="text-primary-text font-bold text-2xl">Follower Details</h2>
      <p class="text-xs text-secondary-text mt-1">
        Detailed view of follower account settings and performance.
      </p>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="store.loading" class="space-y-6 animate-pulse">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="n in 4"
          :key="n"
          class="bg-card-background rounded-2xl p-5 space-y-2"
        >
          <div class="h-3 w-20 bg-background rounded" />
          <div class="h-6 w-28 bg-background rounded" />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="h-36 bg-card-background rounded-2xl" />
          <div class="h-44 bg-card-background rounded-2xl" />
        </div>
        <div class="h-64 bg-card-background rounded-2xl" />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!store.details"
      class="flex flex-col items-center gap-3 py-20 bg-card-background rounded-2xl p-8"
    >
      <div
        class="w-14 h-14 rounded-full bg-background flex items-center justify-center"
      >
        <UserX class="w-6 h-6 text-secondary-text" />
      </div>
      <div class="text-center">
        <p class="text-base font-bold text-primary-text">No Details Found</p>
        <p class="text-xs text-secondary-text mt-1">
          This follower record could not be loaded.
        </p>
      </div>
      <button
        @click="router.back()"
        class="px-4 py-2.5 rounded-full bg-button text-button-text text-xs font-semibold cursor-pointer"
      >
        Go Back
      </button>
    </div>

    <!-- Follower Details View -->
    <template v-else>
      <!-- Metric Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-card-background rounded-2xl p-5 space-y-1">
          <div class="flex items-center gap-1.5 min-w-0">
            <p class="text-[11px] uppercase tracking-widest font-semibold text-secondary-text truncate">
              Balance
            </p>
            <Tooltip text="Current balance in follower trading account" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
          </div>
          <p class="text-2xl font-bold font-mono text-primary-text">
            ${{ fmt(store.details.balance) }}
          </p>
        </div>

        <div class="bg-card-background rounded-2xl p-5 space-y-1">
          <div class="flex items-center gap-1.5 min-w-0">
            <p class="text-[11px] uppercase tracking-widest font-semibold text-secondary-text truncate">
              Performance Fee
            </p>
            <Tooltip text="Performance fee percentage charged on follower profits" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
          </div>
          <p class="text-2xl font-bold font-mono text-primary-text">
            {{ store.details.performance_fee }}%
          </p>
        </div>

        <div class="bg-card-background rounded-2xl p-5 space-y-1">
          <div class="flex items-center gap-1.5 min-w-0">
            <p class="text-[11px] uppercase tracking-widest font-semibold text-secondary-text truncate">
              Management Fee
            </p>
            <Tooltip text="Periodic management fee charged on follower equity" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
          </div>
          <p class="text-2xl font-bold font-mono text-primary-text">
            {{ store.details.management_fee }}%
          </p>
        </div>

        <div class="bg-card-background rounded-2xl p-5 space-y-1">
          <div class="flex items-center gap-1.5 min-w-0">
            <p class="text-[11px] uppercase tracking-widest font-semibold text-secondary-text truncate">
              Registration Fee
            </p>
            <Tooltip text="One-time fee charged upon joining this offer" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
          </div>
          <p class="text-2xl font-bold font-mono text-primary-text">
            ${{ fmt(store.details.registration_fee) }}
          </p>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Subscription, Offer, Trading Account (2 Cols) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Subscription Settings -->
          <div class="bg-card-background rounded-2xl p-5 space-y-4">
            <h3 class="text-sm font-bold text-primary-text uppercase tracking-wider">
              Subscription Settings
            </h3>
            <div class="grid grid-cols-2 gap-4 border-t border-primary-border/20 pt-4">
              <div>
                <p class="text-xs text-secondary-text mb-0.5">Lot Type</p>
                <p class="text-sm font-semibold text-primary-text capitalize">
                  {{ store.details.lot_type || "—" }}
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary-text mb-0.5">Lot Value</p>
                <p class="text-sm font-semibold font-mono text-primary-text">
                  {{ store.details.lot_value ?? "—" }}
                </p>
              </div>
            </div>
          </div>

          <!-- Offer Details -->
          <div class="bg-card-background rounded-2xl p-5 space-y-4">
            <h3 class="text-sm font-bold text-primary-text uppercase tracking-wider">
              Offer Details
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-primary-border/20 pt-4">
              <div>
                <p class="text-xs text-secondary-text mb-0.5">Offer ID</p>
                <p class="text-sm font-semibold font-mono text-primary-text">
                  #{{ store.details.offer_id }}
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary-text mb-0.5">Settlement Type</p>
                <p class="text-sm font-semibold text-primary-text capitalize">
                  {{ store.details.settlement_type }}
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary-text mb-0.5">Performance Fee</p>
                <p class="text-sm font-semibold text-primary-text">
                  {{ store.details.performance_fee }}%
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary-text mb-0.5">Management Fee</p>
                <p class="text-sm font-semibold text-primary-text">
                  {{ store.details.management_fee }}%
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary-text mb-0.5">Registration Fee</p>
                <p class="text-sm font-semibold text-primary-text">
                  ${{ fmt(store.details.registration_fee) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Trading Account -->
          <div class="bg-card-background rounded-2xl p-5 space-y-4">
            <h3 class="text-sm font-bold text-primary-text uppercase tracking-wider">
              Trading Account
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-primary-border/20 pt-4">
              <div>
                <p class="text-xs text-secondary-text mb-0.5">Trading Account ID</p>
                <p class="text-sm font-semibold font-mono text-primary-text">
                  #{{ store.details.trading_account_id }}
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary-text mb-0.5">Account Number</p>
                <p class="text-sm font-semibold font-mono text-primary-text">
                  {{ store.details.account_number }}
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary-text mb-0.5">Broker Label</p>
                <p class="text-sm font-semibold text-primary-text">
                  {{ store.details.broker_label || "—" }}
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary-text mb-0.5">Server</p>
                <p class="text-sm font-semibold text-primary-text">
                  {{ store.details.server }}
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary-text mb-0.5">Balance</p>
                <p class="text-sm font-semibold font-mono text-primary-text">
                  ${{ fmt(store.details.balance) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: User Details & Status (1 Col) -->
        <div class="bg-card-background rounded-2xl p-5 space-y-5">
          <div>
            <p class="text-xs text-secondary-text mb-1">Status</p>
            <span
              class="inline-flex text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border"
              :class="
                store.details.is_active
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              "
            >
              {{ store.details.is_active ? "Active" : "Inactive" }}
            </span>
          </div>

          <div class="pt-4 border-t border-primary-border/20">
            <p class="text-xs text-secondary-text mb-1">User Name</p>
            <p class="text-sm font-semibold text-primary-text">
              {{ store.details.user_name || "—" }}
            </p>
          </div>

          <div class="pt-4 border-t border-primary-border/20">
            <p class="text-xs text-secondary-text mb-1">User Email</p>
            <p class="text-sm font-semibold text-primary-text font-mono">
              {{ store.details.user_email || "—" }}
            </p>
          </div>

          <div class="pt-4 border-t border-primary-border/20">
            <p class="text-xs text-secondary-text mb-1">Created Date</p>
            <p class="text-sm font-semibold text-primary-text">
              {{ formatDate(store.details.created_at) }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { UserX, Info } from "lucide-vue-next";
import { useFollowersDetailsStore } from "@/stores/fm/followersDetails";

const store = useFollowersDetailsStore();
const route = useRoute();
const router = useRouter();

const fmt = (v) =>
  (v ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

onMounted(() => {
  store.fetchDetails(route.params.id);
});

onUnmounted(() => {
  store.reset();
});
</script>
