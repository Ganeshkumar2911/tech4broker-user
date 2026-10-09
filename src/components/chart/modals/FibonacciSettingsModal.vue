<script setup>
import { ref, watch, onMounted } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean,
  config: Object
});

const emit = defineEmits(['close', 'save']);

const localConfig = ref(null);

const syncConfig = () => {
  if (props.config) {
    localConfig.value = JSON.parse(JSON.stringify(props.config));
  }
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) syncConfig();
});

onMounted(() => {
  syncConfig();
});

const handleSave = () => {
  emit('save', localConfig.value);
  emit('close');
};

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <div v-if="isOpen && localConfig" class="fixed inset-0 bg-black/60 flex justify-center items-center z-[1000] backdrop-blur-sm" @click.self="handleClose">
    <div class="bg-card border border-border w-[400px] rounded-2xl text-text-strong flex flex-col shadow-2xl font-sans overflow-hidden animate-fade-in">
      <div class="flex justify-between items-center p-4 border-b border-border">
        <h2 class="text-sm font-extrabold m-0 text-text-strong uppercase tracking-tight">Fib Retracement</h2>
        <button @click="handleClose" class="bg-transparent border-none text-text-faint cursor-pointer hover:text-text-strong transition-colors">
          <X :size="20" />
        </button>
      </div>

      <div class="p-4 flex flex-col gap-4">
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 cursor-pointer text-sm text-text-strong select-none">
            <input type="checkbox" v-model="localConfig.trendLine" class="rounded accent-[#2563EB]" />
            Trend line
          </label>
        </div>

        <div class="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
          <div v-for="(level, index) in localConfig.levels" :key="index" class="flex items-center gap-2">
            <input type="checkbox" v-model="level.active" class="rounded accent-[#2563EB]" />
            <input 
              type="text" 
              :value="level.value" 
              disabled 
              class="w-[50px] bg-border/20 border border-border text-text-faint px-1.5 py-0.5 rounded text-xs focus:outline-none" 
            />
            <input 
              type="color" 
              v-model="level.color" 
              class="w-6 h-6 p-0 border-none cursor-pointer bg-transparent"
            />
          </div>
        </div>

        <hr class="border-border w-full" />

        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 cursor-pointer text-sm text-text-strong select-none">
            <input type="checkbox" v-model="localConfig.background" class="rounded accent-[#2563EB]" />
            Background
          </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05" 
            v-model.number="localConfig.opacity" 
            :disabled="!localConfig.background"
            class="w-[100px] accent-[#2563EB]"
          />
        </div>

        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 cursor-pointer text-sm text-text-strong select-none">
            <input type="checkbox" v-model="localConfig.reverse" class="rounded accent-[#2563EB]" />
            Reverse
          </label>
        </div>
      </div>
      
      <div class="flex justify-end p-4 border-t border-border gap-2">
        <button @click="handleClose" class="bg-transparent border border-border text-text-faint hover:text-text-strong px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-border/20 transition-colors">Cancel</button>
        <button @click="handleSave" class="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors">Ok</button>
      </div>
    </div>
  </div>
</template>
