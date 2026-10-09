<template>
    <Transition name="modal-fade">
        <div v-if="activeOverlay !== null" ref="modalRef"
            class="absolute z-50 flex items-center gap-2 px-3 py-1 bg-card-background border border-primary-border rounded-md shadow-xl text-primary-text"
            :style="{ left: pos.x + 'px', top: pos.y + 'px' }">

            <!-- Drag -->
            <div class="flex items-center text-primary cursor-grab active:cursor-grabbing px-1 py-0.5 rounded hover:opacity-80"
                @mousedown="startDrag">
                <GripVertical size="16" />
            </div>

            <!-- Color -->
            <div class="relative">
                <div class="w-6 h-6 rounded-md cursor-pointer border border-primary-border hover:scale-105 transition"
                    :style="{ background: settings.color }" @click="toggleColorPicker" />

                <div v-if="showColorPicker"
                    class="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-10 shadow-lg">
                    <CompactPicker v-model="settings.color" @update:modelValue="applyColor" />
                </div>
            </div>

            <!-- Line Width -->
            <div class="flex items-center gap-2">
                <span class="text-[12px] text-secondary-text w-8 text-right">
                    {{ settings.lineWidth }}px
                </span>

                <RangeSlider v-model="settings.lineWidth" @change="applyLineWidth(settings.lineWidth)" :max="40" />
            </div>

            <!-- Line Style -->
            <select
                class="text-xs border border-primary-border rounded-md px-2 py-1 bg-background text-primary-text focus:outline-none"
                :value="settings.lineType" @change="applyLineStyle(($event.target).value)">
                <option v-for="style in lineStyles" :key="style.value" :value="style.value">
                    {{ style.label }}
                </option>
            </select>

            <!-- Divider -->
            <div class="w-px h-5 bg-white/10" />

            <!-- Delete -->
            <button
                class="flex items-center justify-center p-[6px] rounded-md text-[#E04C4C] hover:bg-[#E04C4C]/15 transition"
                @click="removeOverlay">
                <Trash2 class="w-4" />
            </button>
        </div>
    </Transition>
</template>

<script setup>
import { ref, reactive, watch, onUnmounted, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import { getChart } from '@/utils/chart/chart';
import { GripVertical, Trash2 } from 'lucide-vue-next';
import { CompactPicker } from 'vue-color';
import { useChartStore } from '@/stores/client/chart.js';
import RangeSlider from '@/components/base/RangeSlider.vue';

const chartStore = useChartStore();
const { activeOverlay } = storeToRefs(chartStore);

// ── Position ─────────────────────────────────────
const modalRef = ref(null);
const pos = reactive({ x: 100, y: 80 });

let dragging = false;
let dragOffset = { x: 0, y: 0 };

function startDrag(e) {
    dragging = true;

    const chartEl = document.getElementById('chart');
    const rect = chartEl.getBoundingClientRect();

    dragOffset.x = e.clientX - rect.left - pos.x;
    dragOffset.y = e.clientY - rect.top - pos.y;

    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
}

function onDrag(e) {
    if (!dragging) return;

    const chartEl = document.getElementById('chart');
    if (!chartEl) return;

    const rect = chartEl.getBoundingClientRect();

    let newX = e.clientX - rect.left - dragOffset.x;
    let newY = e.clientY - rect.top - dragOffset.y;

    // Optional clamp (keeps inside chart)
    const maxX = rect.width - 220;
    const maxY = rect.height - 60;

    pos.x = Math.max(0, Math.min(newX, maxX));
    pos.y = Math.max(0, Math.min(newY, maxY));
}

function stopDrag() {
    dragging = false;
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
}

onUnmounted(() => {
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
});

// ── Settings ─────────────────────────────────────
const settings = reactive({
    color: '#2962FF',
    lineWidth: 2,
    lineType: 'solid'
});

const showColorPicker = ref(false);

const lineStyles = [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
];

function toggleColorPicker() {
    showColorPicker.value = !showColorPicker.value;
}

function applyColor(color) {
    settings.color = color;
    showColorPicker.value = false;
    override();
}

function applyLineWidth(w) {
    settings.lineWidth = w;
    override();
}

function applyLineStyle(style) {
    settings.lineType = style;
    override();
}

function override() {
    const chart = getChart();
    if (!chart || activeOverlay.value === null) return;

    chart.overrideOverlay({
        id: activeOverlay.value?.id,
        styles: {
            line: {
                color: settings.color,
                size: settings.lineWidth,
                style: 'dashed',
                dashedValue: settings.lineType === 'dotted' ? [2, 4] : [6, 4],
            },
            point: { color: settings.color },
        },
    });

    chartStore.saveDrawings();
}

watchEffect(() => {
    const chart = getChart();
    if (activeOverlay.value && chart) {
        const overlayStyle = chart.getOverlays({ id: activeOverlay.value.id })[0]?.styles;

        if (overlayStyle) {
            settings.color = overlayStyle.line.color;
            settings.lineType = overlayStyle.line.style;
            settings.lineWidth = overlayStyle.line.size;
        }
    }
});

function removeOverlay() {
    const chart = getChart();
    if (!chart || activeOverlay.value === null) return;

    chart.removeOverlay({ id: activeOverlay.value?.id });
    chartStore.activeOverlay = null;
    chartStore.saveDrawings();
}

watch(activeOverlay, () => {
    if (activeOverlay.value !== null) {
        settings.color = '#2962FF';
        settings.lineWidth = 2;
        settings.lineType = 'solid';
        showColorPicker.value = false;
    }
});
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.18s ease, transform 0.18s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
    transform: translateY(-6px) scale(0.97);
}
</style>