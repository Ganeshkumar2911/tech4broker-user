<template>
    <div
        id="tour-trading-watchlist"
        class="bg-card-background border border-primary-border rounded-lg h-full flex flex-col overflow-x-auto custom-scrollbar">
        <!-- Main Tabs Header -->
        <div class="hidden lg:flex  items-center gap-5 select-none p-4 shrink-0 min-w-[280px]">
            <button v-for="tab in mainTabs" :key="tab.id" @click="activeTab = tab.id"
                class="text-base md:text-[19px] font-bold transition-colors cursor-pointer focus:outline-none whitespace-nowrap"
                :class="activeTab === tab.id ? 'text-primary-text' : 'text-secondary-text hover:text-primary-text'">
                {{ tab.name }}
            </button>
        </div>

        <!-- Active Tab Component Container -->
        <div class="flex-1 min-h-0 min-w-[280px]">
            <KeepAlive>
                <component :is="activeComponent" />
            </KeepAlive>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import WatchlistTab from './watchlist/index.vue'
import OrderBookTab from './order-book/index.vue'
import NewsTab from './news/index.vue'

const activeTab = ref('watchlist')

const mainTabs = [
    { id: 'watchlist', name: 'Watchlist' },
    { id: 'order-book', name: 'Order Book' },
    { id: 'news', name: 'News' }
]

const activeComponent = computed(() => {
    switch (activeTab.value) {
        case 'watchlist':
            return WatchlistTab
        case 'order-book':
            return OrderBookTab
        case 'news':
            return NewsTab
        default:
            return WatchlistTab
    }
})
</script>

<style lang="scss" scoped></style>
