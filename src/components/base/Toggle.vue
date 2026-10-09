<template>
    <div class="inline-flex items-center">
        <button @click="toggle" :class="[props.disabled ? 'opacity-30 cursor-not-allowed' : '',
            'relative inline-flex h-5.5 w-10 items-center rounded-full transition-colors duration-100 ease-in-out focus:outline-none', isOn ? 'bg-primary' : 'bg-primary-border'

        ]" role="switch" :aria-checked="isOn">
            <!-- Toggle circle -->
            <span :class="[
                'inline-block h-4.5 w-4.5 transform rounded-full transition-transform duration-100 ease-in-out bg-white',
                isOn
                    ? 'translate-x-5'
                    : 'translate-x-0.5'
            ]" />
        </button>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change'])

// Reactive state
const isOn = ref(props.modelValue)

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
    isOn.value = newValue
})

// Toggle function
const toggle = () => {
    if (props.disabled) return

    isOn.value = !isOn.value
    emit('update:modelValue', isOn.value)
    emit('change', isOn.value)
}
</script>
