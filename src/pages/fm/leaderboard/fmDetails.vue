<script setup>
import { useRoute } from 'vue-router'

import AnalysisTab from '@/components/fm/details/FmAnalysis.vue'

// Route (for fm id if needed later)
const route = useRoute()
const fmId = route.params.id
</script>

<template>
  <div class="flex flex-col gap-5">

    <!-- Header (FM Info Placeholder) -->
    <!-- <div
      class="flex items-center justify-between
             bg-card-background border border-primary-border
             rounded-2xl px-5 py-4"
    >
      <div class="flex flex-col">
        <h2 class="text-sm font-semibold text-primary-text">
          Fund Manager Details
        </h2>
        <p class="text-xs text-secondary-text mt-0.5">
          Overview of performance and trading activity
        </p>
      </div>
    </div> -->

    <!-- Analysis Content -->
    <AnalysisTab :fmId="fmId" />

  </div>
</template>