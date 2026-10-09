<script setup>
import { computed, ref } from 'vue';
import { useCashbackStore } from '@/stores/client/cashback';
import { CheckCircle2, AlertCircle, Info, ChevronRight, Settings, Copy, Shield, ArrowRightLeft, LogOut } from 'lucide-vue-next';
import EnrollmentModal from './EnrollmentModal.vue';
import ConfirmationModal from '@/components/base/ConfirmationModal.vue';

const store = useCashbackStore();

const isEnrollModalOpen = ref(false);
const selectedAccountForEnrollment = ref(null);
const enrollmentMode = ref('enroll'); // 'enroll' or 'change_plan'

const openEnrollModal = (account, mode = 'enroll') => {
  selectedAccountForEnrollment.value = account;
  enrollmentMode.value = mode;
  isEnrollModalOpen.value = true;
};

const isUnenrollModalOpen = ref(false);
const selectedAccountForUnenroll = ref(null);

const handleUnenroll = (account) => {
  selectedAccountForUnenroll.value = account;
  isUnenrollModalOpen.value = true;
};

const executeUnenroll = () => {
  if (selectedAccountForUnenroll.value) {
    store.unenroll(selectedAccountForUnenroll.value.trading_account_id);
    isUnenrollModalOpen.value = false;
    selectedAccountForUnenroll.value = null;
  }
};
</script>

<template>
  <div class="space-y-4">
    <div v-if="store.isAccountsLoading && !store.isAccountsFetched" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="n in 3" :key="n" class="h-32 bg-card-background animate-pulse rounded-2xl"></div>
    </div>
    
    <div v-else-if="store.accounts.length === 0" class="p-8 text-center bg-card-background rounded-3xl border border-primary-border/10 shadow-xs">
      <p class="text-secondary-text">No trading accounts found.</p>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div 
        v-for="account in store.accounts" 
        :key="account.trading_account_id"
        class="relative overflow-hidden bg-card-background rounded-4xl p-5 transition-all duration-200"
      >
        <!-- Dark Mode Logo -->
        <img src="/fav-light.svg" class="hidden dark:block absolute -right-2 -top-2 w-28 h-28 pointer-events-none select-none z-0 cashback-corner-logo" alt="" />
        <!-- Light Mode Logo -->
        <img src="@/assets/logo-blue.png" class="dark:hidden absolute -right-2 -top-2 w-32 h-32 object-contain pointer-events-none select-none z-0 opacity-15" alt="" />
        <!-- Brand Text Watermark Background with shine effect -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0 text-primary-text">
          <svg
            viewBox="0 0 400 100"
            class="w-[75%] max-w-[280px] h-auto opacity-[0.55] dark:opacity-40"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <mask :id="`cashback-mask-${account.trading_account_id}`">
                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="'Montserrat', 'Outfit', system-ui, sans-serif" font-weight="900" font-style="italic" font-size="40" letter-spacing="0.1em">
                  CASHBACK
                </text>
              </mask>
              <linearGradient :id="`cashback-shine-gradient-${account.trading_account_id}`" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="currentColor" stop-opacity="0" />
                <stop offset="35%" stop-color="currentColor" stop-opacity="0.2" />
                <stop offset="50%" stop-color="currentColor" stop-opacity="0.8" />
                <stop offset="65%" stop-color="currentColor" stop-opacity="0.2" />
                <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
              </linearGradient>
            </defs>

            <!-- Base subtle watermark -->
            <text opacity="0.15" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="currentColor" font-family="'Montserrat', 'Outfit', system-ui, sans-serif" font-weight="900" font-style="italic" font-size="40" letter-spacing="0.1em">
              CASHBACK
            </text>

            <!-- Shine effect masked to the text -->
            <g :mask="`url(#cashback-mask-${account.trading_account_id})`">
              <rect
                x="-100"
                y="-100"
                width="200"
                height="300"
                :fill="`url(#cashback-shine-gradient-${account.trading_account_id})`"
                class="svg-shine-rect-cashback"
              />
            </g>
          </svg>
        </div>
        <!-- Header Section -->
        <div class="relative z-10 flex items-start justify-between mb-3">
          <div class="flex items-center gap-2 flex-wrap">
            <span
              v-if="account.enrollment?.status === 'active'"
              class="text-[10px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider border bg-primary-green/10 text-primary-green border-primary-green/20 inline-flex items-center gap-1.5"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-primary-green"></span>
              Enrolled
            </span>
            <span
              v-else-if="!account.eligible"
              class="text-[10px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider border bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
            >
              Ineligible
            </span>
            <span
              v-else
              class="text-[10px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider border bg-secondary-text/10 text-secondary-text dark:text-secondary-text border-primary-border"
            >
              Not Enrolled
            </span>

            <span class="inline-flex items-center gap-1.5 text-[11px] font-medium bg-background/50 border border-primary-border/20 px-3 py-1.5 rounded-full">
              <span class="text-secondary-text uppercase">MT:</span>
              <span class="text-primary-text font-bold">{{ account.account_number }}</span>
            </span>
            
            <span class="inline-flex items-center gap-1.5 bg-background/50 border border-primary-border/20 text-secondary-text text-[11px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wide">
              {{ account.broker_currency }}
            </span>
          </div>
        </div>
        <div class="relative z-10 flex flex-wrap items-center gap-2 text-[12px] mb-2">
          <span class="text-secondary-text">Account ID: <span class="text-primary-text font-bold">{{ account.trading_account_id }}</span></span>
          <span class="text-secondary-text/40">•</span>
          <span class="text-secondary-text">Status: <span class="font-bold" :class="account.is_active ? 'text-primary-green' : 'text-primary-red'">{{ account.is_active ? 'Active' : 'Inactive' }}</span></span>
          <template v-if="account.enrollment?.status === 'active'">
            <span class="text-secondary-text/40 hidden sm:inline">•</span>
            <span class="text-[11px] text-secondary-text">Enrolled: <span class="text-primary-text font-medium">{{ account.enrollment?.enrolled_at ? new Date(account.enrollment.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-' }}</span></span>
          </template>
        </div>

        <div class="relative z-10 border-b border-primary-border/20 mb-5"></div>

        <!-- Enrolled State UI -->
        <div v-if="account.enrollment?.status === 'active'" class="relative z-10 space-y-4 mb-1">
          
          <!-- Plan Details -->
          <div class="flex items-start justify-between">
            <div>
              <p class="text-[10px] font-bold text-secondary-text uppercase tracking-wider mb-1.5">Active Plan</p>
              <div class="flex items-center gap-2 mb-2.5">
                <h4 class="text-2xl font-extrabold text-primary-text">{{ account.enrollment.plan?.name }}</h4>
                <!-- <span v-if="account.enrollment.plan?.code" class="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-background border border-primary-border text-secondary-text">{{ account.enrollment.plan.code }}</span> -->
              </div>
              <!-- <span class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Qualify: {{ account.enrollment.plan?.qualify_on === 'win' ? 'Win Trades' : account.enrollment.plan?.qualify_on }}
              </span> -->
            </div>
            
            <div class="text-right">
              <p class="text-[10px] font-bold text-secondary-text uppercase tracking-wider mb-1.5">Rate</p>
              <div class="flex items-baseline gap-1 justify-end">
                <span class="text-3xl font-extrabold text-primary">${{ account.enrollment.plan?.rate_per_lot }}</span>
                <span class="text-[11px] text-secondary-text font-semibold uppercase">/ Lot</span>
              </div>
              <!-- <p class="text-[11px] text-secondary-text mt-2 font-medium">Daily Auto-Transfer to Wallet</p> -->
            </div>
          </div>
          <!-- Action Buttons -->
          <div class="flex items-center gap-3 mt-5">
            <button 
              @click="openEnrollModal(account, 'change_plan')"
              class="flex-1 h-11 p-2 text-[13px] rounded-full inline-flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 font-bold text-primary transition-colors cursor-pointer"
            >
              <ArrowRightLeft class="w-4 h-4" />
              Change Plan
            </button>
            <button 
              @click="handleUnenroll(account)"
              class="flex-1 h-11 p-2 text-[13px] rounded-full inline-flex items-center justify-center gap-2 bg-primary-red/10 hover:bg-primary-red/20 border border-primary-red/30 font-bold text-primary-red transition-colors cursor-pointer"
            >
              <LogOut class="w-4 h-4" />
              Exit Program
            </button>
          </div>
        </div>

        <!-- Not Enrolled State -->
        <div v-else class="mt-4 pt-4 flex items-center justify-between">
          <p v-if="!account.eligible" class="text-[13px] text-secondary-text flex items-center gap-1.5 mt-2.5">
            <Info class="w-4 h-4" />
            Reason: {{ account.ineligible_reason?.replace(/_/g, ' ') }}
          </p>
          <p v-else class="text-[13px] text-secondary-text">Ready to earn cashback.</p>

          <button 
            v-if="account.eligible"
            @click="openEnrollModal(account, 'enroll')"
            class="h-8 sm:h-9 xl:h-10 px-4 text-[11px] sm:text-xs xl:text-[13px] rounded-full inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 font-semibold text-primary-text transition-all duration-200 cursor-pointer"
          >
            Enroll Now
            <ChevronRight class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>

    <EnrollmentModal 
      :is-open="isEnrollModalOpen" 
      :account="selectedAccountForEnrollment"
      :mode="enrollmentMode"
      @close="isEnrollModalOpen = false" 
    />

    <ConfirmationModal
      :is-open="isUnenrollModalOpen"
      title="Unenroll Account"
      :message="`Are you sure you want to unenroll account ${selectedAccountForUnenroll?.account_number}?`"
      confirm-text="Unenroll"
      variant="warning"
      @close="isUnenrollModalOpen = false"
      @confirm="executeUnenroll"
    />
  </div>
</template>
