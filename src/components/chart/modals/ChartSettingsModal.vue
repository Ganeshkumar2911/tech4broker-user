<script setup>
import { ref, watch, onMounted } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean,
  settings: Object
});

const emit = defineEmits(['close', 'save']);

const localSettings = ref(null);

const syncSettings = () => {
  if (props.settings) {
    const parsed = JSON.parse(JSON.stringify(props.settings));
    if (!parsed.candle) parsed.candle = {};
    if (!parsed.candle.type) parsed.candle.type = 'candle_solid';
    localSettings.value = parsed;
  }
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) syncSettings();
});

onMounted(() => {
  syncSettings();
});

const handleSave = () => {
  emit('save', localSettings.value);
  emit('close');
};

const handleClose = () => {
  emit('close');
};

const handleReset = () => {
  localSettings.value = {
    backgroundColor: '#ffffff',
    grid: {
      showHorizontal: false,
      showVertical: false,
      color: '#1E1E1E',
      style: 'dash'
    },
    candle: {
      type: 'candle_solid',
      upColor: '#089981',
      downColor: '#F23645'
    },
    axis: {
      textColor: '#8A92A3'
    }
  };
};
</script>

<template>
  <div v-if="isOpen && localSettings" class="fixed inset-0 bg-black/60 flex justify-center items-center z-[1000] backdrop-blur-sm" @click.self="handleClose">
    <div class="bg-card border border-border w-[400px] rounded-2xl text-text-strong flex flex-col shadow-2xl font-sans overflow-hidden animate-fade-in">
      <div class="flex justify-between items-center p-4 border-b border-border">
        <h2 class="text-sm font-extrabold m-0 text-text-strong uppercase tracking-tight">Chart Settings</h2>
        <button @click="handleClose" class="bg-transparent border-none text-text-faint cursor-pointer hover:text-text-strong transition-colors">
          <X :size="20" />
        </button>
      </div>

      <div class="p-4 flex flex-col gap-4 overflow-y-auto max-h-[400px]">
        <div>
          <h3 class="text-[10px] font-extrabold uppercase tracking-wider text-text-faint mb-3">Colors</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-text-faint">Background</label>
              <div class="flex items-center gap-2">
                <input type="color" v-model="localSettings.backgroundColor" class="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent" />
                <span class="text-xs font-mono uppercase text-text-strong">{{ localSettings.backgroundColor }}</span>
              </div>
            </div>
            
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-text-faint">Text & Axis</label>
              <div class="flex items-center gap-2">
                <input type="color" v-model="localSettings.axis.textColor" class="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent" />
                <span class="text-xs font-mono uppercase text-text-strong">{{ localSettings.axis.textColor }}</span>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-text-faint">Bullish (Up)</label>
              <div class="flex items-center gap-2">
                <input type="color" v-model="localSettings.candle.upColor" class="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent" />
                <span class="text-xs font-mono uppercase text-text-strong">{{ localSettings.candle.upColor }}</span>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-text-faint">Bearish (Down)</label>
              <div class="flex items-center gap-2">
                <input type="color" v-model="localSettings.candle.downColor" class="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent" />
                <span class="text-xs font-mono uppercase text-text-strong">{{ localSettings.candle.downColor }}</span>
              </div>
            </div>
          </div>
        </div>

        <hr class="border-border w-full" />

        <div>
          <h3 class="text-[10px] font-extrabold uppercase tracking-wider text-text-faint mb-3">Chart Style</h3>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-text-faint">Chart Type</label>
            <select v-model="localSettings.candle.type" class="bg-border/10 border border-border text-text-strong px-3 py-2 rounded-xl text-sm focus:outline-none w-full cursor-pointer transition-all">
              <option value="candle_solid">Candlestick</option>
              <option value="candle_stroke">Hollow Candlestick</option>
              <option value="ohlc">OHLC Bar</option>
              <option value="area">Line / Area</option>
            </select>
          </div>
        </div>

        <hr class="border-border w-full" />

        <div>
          <h3 class="text-[10px] font-extrabold uppercase tracking-wider text-text-faint mb-3">Grid Lines</h3>
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-6">
              <label class="flex items-center gap-2 cursor-pointer text-sm text-text-strong select-none">
                <input type="checkbox" v-model="localSettings.grid.showHorizontal" class="rounded accent-[#2563EB]" />
                Horizontal
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-sm text-text-strong select-none">
                <input type="checkbox" v-model="localSettings.grid.showVertical" class="rounded accent-[#2563EB]" />
                Vertical
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex justify-between items-center p-4 border-t border-border">
        <button @click="handleReset" class="bg-transparent border border-border text-text-faint hover:text-text-strong px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-border/20 transition-colors">Reset Defaults</button>
        <div class="flex gap-2">
          <button @click="handleClose" class="bg-transparent border border-border text-text-faint hover:text-text-strong px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-border/20 transition-colors">Cancel</button>
          <button @click="handleSave" class="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors">Apply</button>
        </div>
      </div>
    </div>
  </div>
</template>
