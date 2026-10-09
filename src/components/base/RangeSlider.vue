<template>
    <input ref="rangeInput" type="range" :min="min" :max="max" :step="step" :value="modelValue" :disabled="disabled"
        class="range-slider" @input="handleInput" @change="handleChange" />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

// Props
const props = defineProps({
    modelValue: {
        type: Number,
        default: 50
    },
    min: {
        type: Number,
        default: 0
    },
    max: {
        type: Number,
        default: 100
    },
    step: {
        type: Number,
        default: 1
    },
    disabled: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change'])

// Template ref
const rangeInput = ref(null)

// Methods
const handleInput = (event) => {
    emit('update:modelValue', Number(event.target.value))
}

const handleChange = (event) => {
    emit('change', Number(event.target.value))
}

// Update progress
const updateProgress = () => {
    if (!rangeInput.value) return

    const value = ((props.modelValue - props.min) / (props.max - props.min)) * 100
    rangeInput.value.style.setProperty('--progress', `${value}%`)
}

// Watch for value changes
watch(() => props.modelValue, updateProgress)

// Update progress on mount
onMounted(updateProgress)
</script>

<style scoped>
.range-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right,
            #135FEC 0%,
            #135FEC var(--progress, 50%),
            #2A2A2A var(--progress, 50%),
            #2A2A2A 100%);
    outline: none;
    cursor: pointer;
    --progress: 50%;
}

.range-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #135FEC;
    cursor: grab;
    transition: transform 0.1s ease;
}

.range-slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
}

.range-slider::-webkit-slider-thumb:active {
    cursor: grabbing;
    transform: scale(0.95);
}

.range-slider::-moz-range-track {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: #2A2A2A;
    border: none;
}

.range-slider::-moz-range-progress {
    height: 8px;
    border-radius: 4px;
    background: #135FEC;
    border: none;
}

.range-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #135FEC;
    cursor: grab;
    border: none;
    transition: transform 0.1s ease;
}

.range-slider::-moz-range-thumb:hover {
    transform: scale(1.1);
}

.range-slider::-moz-range-thumb:active {
    cursor: grabbing;
    transform: scale(0.95);
}

.range-slider:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.range-slider:disabled::-webkit-slider-thumb,
.range-slider:disabled::-moz-range-thumb {
    cursor: not-allowed;
}
</style>
