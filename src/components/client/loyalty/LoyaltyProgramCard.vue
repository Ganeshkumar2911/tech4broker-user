<script setup>
import { computed } from 'vue'
import {
  Gift,
  Award,
  Wallet,
  Calendar,
  Layers,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  PlusCircle,
} from 'lucide-vue-next'
import { formatDate } from '@/utils/timeFormatter'
import LoyaltyMedia from '@/components/client/loyalty/LoyaltyMedia.vue'

const props = defineProps({
  program: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['select', 'enroll'])

const mediaList = computed(() => {
  if (props.program.image_urls && Array.isArray(props.program.image_urls) && props.program.image_urls.length > 0) {
    return props.program.image_urls
  }
  if (props.program.image_url) {
    return [props.program.image_url]
  }
  return []
})

const isOnePerUser = computed(() => {
  return props.program.account_scope === 'one_per_user'
})
</script>

<template>
  <div
    class="bg-card-background rounded-2xl sm:rounded-3xl overflow-hidden border-0 flex flex-col justify-between group hover:bg-card-background/90 transition-all duration-200"
  >
    <div>
      <!-- Media Banner with multi-media auto-carousel and pause-on-hover -->
      <div class="relative w-full h-48 sm:h-52 bg-background overflow-hidden shrink-0">
        <LoyaltyMedia
          :items="mediaList"
          :alt="program.name"
          :auto-slide="true"
          :pause-on-hover="true"
          :show-controls="true"
          :show-arrows="true"
          :show-dots="true"
          media-class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <!-- Top Left Program Code Badge -->
        <div class="absolute top-3 left-3 z-10 pointer-events-none">
          <BaseBadge :value="program.code || 'PROGRAM'" variant="neutral" size="2xs" />
        </div>

        <!-- Top Right Enrollment Badge -->
        <div class="absolute top-3 right-3 z-10 pointer-events-none">
          <BaseBadge
            :value="program.enrolled ? 'Enrolled' : 'Not Enrolled'"
            :variant="program.enrolled ? 'success' : 'neutral'"
            size="xs"
            :pulse="program.enrolled"
          />
        </div>
      </div>

      <!-- Content Area -->
      <div class="p-5 sm:p-6 space-y-3.5">
        <!-- Title & Status -->
        <div>
          <h3 class="text-base font-bold text-primary-text line-clamp-1" :title="program.name">
            {{ program.name }}
          </h3>
          <p class="text-xs text-secondary-text line-clamp-2 mt-1 leading-relaxed min-h-8">
            {{ program.description || 'Trade eligible pairs to earn reward points automatically and convert points to instant cash or exclusive store prizes.' }}
          </p>
        </div>

        <!-- Metadata Information -->
        <div class="space-y-2 pt-3 border-t border-primary-border/20 text-xs">
          <!-- Account Scope -->
          <div class="flex items-center justify-between text-secondary-text">
            <span class="flex items-center gap-1.5 text-[11px]">
              <Layers class="w-3.5 h-3.5 text-primary" /> Scope
            </span>
            <span class="font-medium text-primary-text text-[11px]">
              {{ isOnePerUser ? '1 Primary Account' : 'All Eligible Accounts' }}
            </span>
          </div>

          <!-- Date Validity -->
          <div v-if="program.start_at || program.end_at" class="flex items-center justify-between text-secondary-text">
            <span class="flex items-center gap-1.5 text-[11px]">
              <Calendar class="w-3.5 h-3.5 text-secondary-text" /> Validity
            </span>
            <span class="text-[11px] text-secondary-text truncate max-w-42.5">
              {{ program.start_at ? formatDate(program.start_at) : 'Open' }} - {{ program.end_at ? formatDate(program.end_at) : 'Ongoing' }}
            </span>
          </div>

          <!-- Linked MT5 Account if Enrolled -->
          <div v-if="program.enrolled && (program.account_number || program.trading_account_id || (program.trading_account_ids && program.trading_account_ids.length > 0))" class="flex items-center justify-between text-secondary-text">
            <span class="flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" /> Linked Account
            </span>
            <span class="font-bold text-primary-text text-[11px]">
              #{{ program.account_number || program.trading_account_id || program.trading_account_ids[0] }}
            </span>
          </div>

          <!-- Available Wallet Points if Enrolled -->
          <!-- <div v-if="program.enrolled && program.available_points" class="flex items-center justify-between pt-1 text-xs">
            <span class="text-secondary-text font-medium flex items-center gap-1.5 text-[11px]">
              <Wallet class="w-3.5 h-3.5 text-primary" /> Wallet Balance
            </span>
            <span class="font-bold text-primary text-xs font-mono">
              {{ Number(program.available_points || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} pts
            </span>
          </div> -->
        </div>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="p-5 sm:p-6 pt-0 flex items-center gap-2">
      <!-- Enter Program Dashboard -->
      <button
        type="button"
        @click="emit('select', program.id)"
        class="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 text-xs font-bold rounded-full transition-all cursor-pointer"
        :class="
          program.enrolled
            ? 'bg-button text-button-text hover:opacity-90'
            : 'bg-white/5 hover:bg-white/10 text-primary-text'
        "
      >
        <span>{{ program.enrolled ? 'Open Dashboard' : 'Explore Program' }}</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </button>

      <!-- Quick Join Button if not enrolled -->
      <button
        v-if="!program.enrolled"
        type="button"
        @click="emit('enroll', program)"
        class="inline-flex items-center justify-center gap-1 h-10 px-4 text-xs font-bold bg-button text-button-text rounded-full hover:opacity-90 transition-all cursor-pointer"
        title="Join Program"
      >
        <PlusCircle class="w-3.5 h-3.5" />
        <span>Join</span>
      </button>
    </div>
  </div>
</template>
