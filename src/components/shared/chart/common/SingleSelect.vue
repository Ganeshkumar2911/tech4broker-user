<template>
    <div ref="selectRef" class="relative w-full">

        <!-- Trigger -->
        <button @click.prevent="toggle"
            class="w-full flex items-center text-xs font-semibold text-primary-text focus:outline-none transition-all cursor-pointer hover:text-primary">
            <img v-if="selectedImg" :src="selectedImg" alt="" class="">
            <span v-else>
                {{ selectedLabel || placeholder }}
            </span>
            <ChevronDown class="w-3.5 h-3.5 ml-1 text-secondary-text transition-transform duration-200"
                :class="{ 'rotate-180': isOpen }" />
        </button>

        <!-- Dropdown -->
        <transition name="dropdown">
            <div v-if="isOpen"
                class="absolute z-50 mt-2 w-full bg-card-background border border-primary-border rounded-lg shadow-xl overflow-hidden min-w-[150px]">
                <ul class="max-h-60 overflow-y-auto no-scrollbar">
                    <li v-for="option in options" :key="option.label" @click.prevent="select(option)"
                        class="px-4 py-2 text-xs cursor-pointer flex justify-between items-center hover:bg-background transition-colors text-primary-text font-medium">
                        <div class="flex items-center gap-2">
                            <img v-if="getOptionImg(option)" :src="getOptionImg(option)" alt="">
                            <span>{{ option.label }}</span>
                        </div>
                        <!-- Selected Tick -->
                        <Check v-if="isSelected(option)" class="w-4 h-4 text-primary" />
                    </li>
                </ul>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { Check, ChevronDown } from "lucide-vue-next"
import { ref, computed, onMounted, onBeforeUnmount } from "vue"
import { useThemeStore } from "@/stores/shared/theme"

const props = defineProps({
    modelValue: {
        type: Object,
        default: null
    },
    options: {
        type: Array,
        required: true
    },
    placeholder: {
        type: String,
        default: "Select..."
    }
})

const emit = defineEmits(["update:modelValue"])

const isOpen = ref(false)
const selectRef = ref(null)
const themeStore = useThemeStore()

/* Toggle */
const toggle = () => {
    isOpen.value = !isOpen.value
}

/* Check selected */
const isSelected = (option) => {
    return (
        props.modelValue?.span === option.span &&
        props.modelValue?.type === option.type &&
        props.modelValue?.value === option.value
    )
}

/* Select option */
const select = (option) => {
    if (isSelected(option)) return

    emit("update:modelValue", option)
    isOpen.value = false
}

const getOptionImg = (option) => {
    return !themeStore.isDark ? option.darkImg || option.img : option.img
}

/* Selected label */
const selectedLabel = computed(() => {
    const selected = props.options.find(o =>
        o.span === props.modelValue?.span &&
        o.type === props.modelValue?.type &&
        props.modelValue?.value === o.value
    )
    return selected?.label
})

const selectedImg = computed(() => {

    const selected = props.options.find(o =>
        o.span === props.modelValue?.span &&
        o.type === props.modelValue?.type &&
        props.modelValue?.value === o.value
    )
    return selected ? getOptionImg(selected) : undefined

})

/* Click outside */
const handleClickOutside = (e) => {
    if (selectRef.value && !selectRef.value.contains(e.target)) {
        isOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener("click", handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.18s ease;
    transform-origin: top;
}

.dropdown-enter-from {
    opacity: 0;
    transform: scaleY(0.95);
}

.dropdown-enter-to {
    opacity: 1;
    transform: scaleY(1);
}

.dropdown-leave-from {
    opacity: 1;
    transform: scaleY(1);
}

.dropdown-leave-to {
    opacity: 0;
    transform: scaleY(0.95);
}
</style>