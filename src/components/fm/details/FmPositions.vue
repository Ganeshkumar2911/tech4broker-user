<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useFmPositionsStore } from '@/stores/fm/positions'

import SummaryCards   from '@/components/fm/details/FMSummaryCards.vue'
// import ClosedFilters  from '@/components/fm/details/Filters.vue'
import PositionsTable from '@/components/fm/details/PositionsTable.vue'

const route = useRoute()
const store = useFmPositionsStore()

const fmId = route.params.id

const activeTab = ref('closed')

const tabs = [
  { key: 'open',   label: 'Open' },
  { key: 'closed', label: 'Closed' },
]

// ─── Tab switch ──────────────────────────────────────────────────────────────
const switchTab = (key) => {
  activeTab.value = key
  store.fetchPositions(key, fmId)
}

// ─── Pagination ──────────────────────────────────────────────────────────────
const onPageChange = (page) => {
  store.setPage(activeTab.value, page, fmId)
}

// ─── Filters ─────────────────────────────────────────────────────────────────
const applyFilters = () => {
  const bucket = store.buckets[activeTab.value]
  bucket.pagination = { ...bucket.pagination, page: 1 }
  bucket.isFetched  = false
  store.fetchPositions(activeTab.value, fmId, true)
}

onMounted(() => store.fetchPositions('closed', fmId))
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Summary -->
    <SummaryCards
      :summary="store.summary"
      :loading="store.buckets[activeTab].loading"
    />

    <!-- Tabs -->
    <div class="flex items-center gap-1 border-b border-primary-border">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="switchTab(tab.key)"
        class="px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer border-b-2 -mb-px"
        :class="activeTab === tab.key
          ? 'border-primary-border text-primary-text'
          : 'border-transparent text-secondary-text hover:text-primary-text'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Filters -->
    <!-- <ClosedFilters
      :filters="store.filters[activeTab]"
      :show-period="activeTab === 'closed'"
      @apply="applyFilters"
    /> -->

    <!-- Table -->
    <PositionsTable
      :data="store.buckets[activeTab].data"
      :loading="store.buckets[activeTab].loading"
      :type="activeTab"
      :pagination="store.buckets[activeTab].pagination"
      @page-change="onPageChange"
    />

  </div>
</template>