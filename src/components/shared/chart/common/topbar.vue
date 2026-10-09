<template>
    <div class="flex items-center gap-4 border-b border-primary-border w-full text-primary-text h-[6vh]">

        <!-- symbol select -->
        <div class="pl-4">
            <p class="font-bold text-[13.33px] text-primary-text">{{ currentSymbol }}</p>
        </div>
        <div class="h-full w-px bg-primary-border" />
        <!-- intervals -->
        <div class="">
            <SingleSelect :options="intervals" v-model="selectedInterval" />
        </div>
        <div class="h-full w-px bg-primary-border" />

        <div class="">
            <SingleSelect :options="chartTypes" v-model="selectedCandleType" />
        </div>
        <div class="h-full w-px bg-primary-border" />

        <!-- indicator -->
        <button @click="showIndicatorModal = true"
            class="flex items-center gap-1 text-xs text-secondary-text hover:text-primary-text transition-colors cursor-pointer">
            <CandlestickChart class="w-5" :stroke-width="1" />
            <p>Indicators</p>
        </button>

        <div class="h-full w-px bg-primary-border" />

    </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { chartTypes, getChart, intervals, getSymbolPricePrecision } from '@/utils/chart/chart';
import SingleSelect from './SingleSelect.vue';
import { CandlestickChart } from 'lucide-vue-next';
import { applyChartStyles } from '@/utils/chart/chartStyles';
import { useChartStore } from '@/stores/client/chart.js';
import { useThemeStore } from '@/stores/shared/theme';

const chartStore = useChartStore();
const themeStore = useThemeStore();

const { currentSymbol, selectedInterval, selectedCandleType, showIndicatorModal, chartStyleOverrides } = storeToRefs(chartStore);

watch(selectedInterval, (newVal, oldVal) => {
    const chart = getChart();
    if (chart && newVal !== oldVal) {
        chart.setPeriod(newVal.value);
    }
});

watch(currentSymbol, (newVal, oldVal) => {
    const chart = getChart();
    if (chart && newVal !== oldVal) {
        const precision = getSymbolPricePrecision(newVal, chartStore.historicalCandles);
        chart.setSymbol({
            ticker: newVal,
            pricePrecision: precision,
            volumePrecision: 2
        });
    }
});

watch(selectedCandleType, (newVal, oldVal) => {
    const chart = getChart();
    const candleTypeVal = newVal?.value || newVal;
    if (chart && candleTypeVal) {
        chartStore.setChartStyleOverrides({
            ...chartStyleOverrides.value,
            candle: {
                ...chartStyleOverrides.value?.candle,
                type: candleTypeVal
            }
        });
        applyChartStyles(themeStore.isDark ? 'dark' : 'light', chartStore.chartStyleOverrides, chart);
    }
});
</script>

<style lang="scss" scoped></style>
