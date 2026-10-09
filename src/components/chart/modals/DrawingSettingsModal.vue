<script setup>
import { ref, watch, onMounted } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean,
  overlay: Object
});

const emit = defineEmits(['close', 'save']);

const lineSize = ref(1);
const lineColor = ref('#2962FF');
const lineStyle = ref('solid');

const parseOverlayStyles = () => {
  if (props.overlay && props.overlay.styles && props.overlay.styles.line) {
    lineSize.value = props.overlay.styles.line.size || 1;
    lineColor.value = props.overlay.styles.line.color || '#2962FF';
    lineStyle.value = props.overlay.styles.line.style || 'solid';
  } else {
    lineSize.value = 1;
    lineColor.value = '#2962FF';
    lineStyle.value = 'solid';
  }
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) parseOverlayStyles();
});

onMounted(() => {
  parseOverlayStyles();
});

const handleSave = () => {
  if (!props.overlay) return;
  emit('save', props.overlay.id, {
    line: {
      size: Number(lineSize.value),
      color: lineColor.value,
      style: lineStyle.value
    }
  });
  emit('close');
};

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/60 flex justify-center items-center z-[1000] backdrop-blur-sm" @click.self="handleClose">
    <div class="bg-card border border-border w-[320px] rounded-2xl text-text-strong flex flex-col shadow-2xl font-sans overflow-hidden animate-fade-in">
      <div class="flex justify-between items-center p-4 border-b border-border">
        <h2 class="text-sm font-extrabold m-0 text-text-strong uppercase tracking-tight">Line Settings</h2>
        <button @click="handleClose" class="bg-transparent border-none text-text-faint cursor-pointer hover:text-text-strong transition-colors">
          <X :size="20" />
        </button>
      </div>

      <div class="p-4 flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-xs text-text-faint">Color</label>
          <div class="flex items-center gap-2">
            <input 
              type="color" 
              v-model="lineColor" 
              class="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
            />
            <span class="text-xs font-mono uppercase text-text-strong">{{ lineColor }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs text-text-faint">Thickness ({{ lineSize }}px)</label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            v-model.number="lineSize" 
            class="w-full accent-[#2563EB]"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs text-text-faint">Style</label>
          <select v-model="lineStyle" class="bg-border/10 border border-border text-text-strong px-3 py-2 rounded-xl text-sm focus:outline-none w-full cursor-pointer transition-all">
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </div>
      </div>
      
      <div class="flex justify-end p-4 border-t border-border gap-2">
        <button @click="handleClose" class="bg-transparent border border-border text-text-faint hover:text-text-strong px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-border/20 transition-colors">Cancel</button>
        <button @click="handleSave" class="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors">Ok</button>
      </div>
    </div>
  </div>
</template>
