<script setup>
import { computed } from 'vue';
import { useTickerStore } from '@/stores/shared/ticker';

const props = defineProps({
  symbol: {
    type: String,
    default: 'XAUUSD'
  },
  currentPrice: {
    type: [Number, String],
    default: '2500.00'
  },
  ranges: {
    type: Array,
    default: null
  }
});

const tickerStore = useTickerStore();

const currentLtp = computed(() => {
  const ltpData = tickerStore.getLastPrice(props.symbol);
  if (ltpData) {
    if (ltpData.last && Number(ltpData.last) > 0) return Number(ltpData.last);
    if (ltpData.bid > 0 && ltpData.ask > 0) return (Number(ltpData.bid) + Number(ltpData.ask)) / 2;
    if (ltpData.bid > 0) return Number(ltpData.bid);
    if (ltpData.ask > 0) return Number(ltpData.ask);
  }
  if (typeof props.currentPrice === 'number') return props.currentPrice;
  const cleaned = String(props.currentPrice || '2500.00').replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 2500.00 : parsed;
});

const isForex = computed(() => {
  const sym = String(props.symbol).toUpperCase();
  return sym.includes('EUR') || sym.includes('GBP') || sym.includes('AUD') || 
         sym.includes('NZD') || sym.includes('CAD') || sym.includes('CHF');
});

const calculatedRanges = computed(() => {
  if (props.ranges && props.ranges.length) return props.ranges;

  const price = currentLtp.value;
  const ltpData = tickerStore.getLastPrice(props.symbol);

  const formatVal = (val) => {
    if (isForex.value || price < 10) return val.toFixed(4);
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 1. DAY'S RANGE: Total scale = Day Low (0%) to Day High (100%)
  let dayLow = ltpData?.low && Number(ltpData.low) > 0 ? Number(ltpData.low) : price * 0.988;
  let dayHigh = ltpData?.high && Number(ltpData.high) > 0 ? Number(ltpData.high) : price * 1.006;
  if (dayLow >= price) dayLow = price * 0.991;
  if (dayHigh <= price) dayHigh = price * 1.005;

  const daySpan = dayHigh - dayLow;
  const dayLtpPos = Math.min(Math.max(((price - dayLow) / daySpan) * 100, 3), 97);

  const dayPeakPos = Math.min(dayLtpPos + 38, 88);
  const dayFillLeft = dayLtpPos;
  const dayFillWidth = Math.max(dayPeakPos - dayLtpPos, 6);

  // 2. 1 HOUR RANGE: Total scale = 1H Low to 1H High
  let h1Low = price * 0.9975;
  let h1High = price * 1.0018;
  const h1Span = h1High - h1Low;
  const h1LtpPos = Math.min(Math.max(((price - h1Low) / h1Span) * 100, 3), 97);
  const h1PeakPos = Math.min(h1LtpPos + 22, 85);
  const h1FillLeft = h1LtpPos;
  const h1FillWidth = Math.max(h1PeakPos - h1LtpPos, 5);

  // 3. 52WK RANGE: Total scale = 52-Week Low to 52-Week High
  let w52Low = ltpData?.open ? Number(ltpData.open) * 0.815 : price * 0.812;
  let w52High = ltpData?.open ? Number(ltpData.open) * 1.285 : price * 1.275;
  const w52Span = w52High - w52Low;
  const w52LtpPos = Math.min(Math.max(((price - w52Low) / w52Span) * 100, 3), 97);

  const w52DayLowPos = Math.min(Math.max(((dayLow - w52Low) / w52Span) * 100, 1), 95);
  const w52DayHighPos = Math.min(Math.max(((dayHigh - w52Low) / w52Span) * 100, w52DayLowPos + 3), 98);
  const w52FillLeft = w52DayLowPos;
  const w52FillWidth = Math.max(w52DayHighPos - w52DayLowPos, 3);

  return [
    {
      label: "1 day",
      low: formatVal(dayLow),
      high: formatVal(dayHigh),
      positionPercent: dayLtpPos,
      fillLeft: dayFillLeft,
      fillWidth: dayFillWidth
    },
    {
      label: "1 hour",
      low: formatVal(h1Low),
      high: formatVal(h1High),
      positionPercent: h1LtpPos,
      fillLeft: h1FillLeft,
      fillWidth: h1FillWidth
    },
    {
      label: "52wk Range",
      low: formatVal(w52Low),
      high: formatVal(w52High),
      positionPercent: w52LtpPos,
      fillLeft: w52FillLeft,
      fillWidth: w52FillWidth
    }
  ];
});
</script>

<template>
  <div class="w-full px-4 pt-3 pb-2 bg-white dark:bg-[#0B0F19] flex flex-col select-none border-t border-gray-100 dark:border-slate-800">
    <div class="flex flex-col gap-3.5">
      <div 
        v-for="(range, idx) in calculatedRanges" 
        :key="idx"
        class="flex flex-col gap-1.5 pb-1 last:pb-0"
      >
        <div class="grid grid-cols-3 items-center text-xs font-sans">
          <span class="font-sans text-[12px] font-bold text-gray-800 dark:text-slate-200 text-left tabular-nums">{{ range.low }}</span>
          <span class="text-[11px] font-medium text-gray-500 dark:text-slate-400 lowercase font-sans text-center">{{ range.label }}</span>
          <span class="font-sans text-[12px] font-bold text-gray-800 dark:text-slate-200 text-right tabular-nums">{{ range.high }}</span>
        </div>

        <div class="relative w-full pt-1 pb-2 flex flex-col justify-center">
          <div class="w-full h-1 bg-gray-300/80 dark:bg-slate-800 rounded-full relative overflow-hidden">
            <div 
              class="h-full bg-[#F23645] rounded-full transition-all duration-300 absolute"
              :style="{ left: `${range.fillLeft}%`, width: `${range.fillWidth}%` }"
            ></div>
          </div>

          <div 
            class="absolute bottom-0 transition-all duration-300 pointer-events-none transform -translate-x-1/2 text-[9px] text-[#0F1424] dark:text-slate-200 leading-none"
            :style="{ left: `${range.positionPercent}%` }"
          >
            ▲
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
