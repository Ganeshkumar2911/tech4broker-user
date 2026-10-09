<template>
    <div v-if="selectedPosition"
        class="absolute bottom-0 left-1/2 -translate-x-1/2 w-full z-30 bg-card-background/95  border-t border-primary-border p-2 flex items-center gap-3 text-xs select-none">

        <!-- Deselect Button -->
        <button @click="$emit('deselect')"
            class="p-1 rounded-lg border border-primary-border hover:border-primary-red hover:text-primary-red bg-background text-secondary-text transition-colors flex items-center justify-center cursor-pointer"
            title="Deselect Position">
            <X class="w-3.5 h-3.5" />
        </button>

        <div class="flex items-center gap-2 border-r border-primary-border pr-3">
            <span class="font-mono text-[11px] text-secondary-text">#{{ selectedPosition.position_ticket ||
                selectedPosition.id }}</span>
            <span class="font-bold text-[11px] uppercase px-1.5 py-0.5 rounded"
                :class="selectedPosSide === 'BUY' ? 'bg-primary-blue/10 text-primary-blue' : 'bg-primary-red/10 text-primary-red'">
                {{ selectedPosSide }} {{ selectedPosition.lot || selectedPosition.volume || '0.01' }}
            </span>
            <span class="font-mono text-[11px] text-primary-text font-semibold">@ {{ selectedPosEntry }}</span>
        </div>

        <!-- SL Toggle Button -->
        <button @click="hasSelectedSl ? $emit('remove-sl') : $emit('add-sl')"
            class="px-2.5 py-1 rounded-lg border font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
            :class="hasSelectedSl ? 'bg-primary-red/10 border-primary-red/50 text-primary-red hover:bg-primary-red/20' : 'border-primary-border text-secondary-text hover:text-primary-text bg-background'">
            <span>{{ hasSelectedSl ? 'SL: ' + selectedSlText : '+ Add SL' }}</span>
            <X v-if="hasSelectedSl" class="w-3 h-3 text-primary-red hover:scale-110" />
        </button>

        <!-- TP Toggle Button -->
        <button @click="hasSelectedTp ? $emit('remove-tp') : $emit('add-tp')"
            class="px-2.5 py-1 rounded-lg border font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
            :class="hasSelectedTp ? 'bg-primary-green/10 border-primary-green/50 text-primary-green hover:bg-primary-green/20' : 'border-primary-border text-secondary-text hover:text-primary-text bg-background'">
            <span>{{ hasSelectedTp ? 'TP: ' + selectedTpText : '+ Add TP' }}</span>
            <X v-if="hasSelectedTp" class="w-3 h-3 text-primary-green hover:scale-110" />
        </button>

        <!-- Close Position Button -->
        <button @click="$emit('close-position')"
            class="px-3 py-1 bg-primary-red hover:bg-primary-red/90 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer shrink-0">
            Close Position
        </button>
    </div>
</template>

<script setup>
import { X } from 'lucide-vue-next';

defineProps({
    selectedPosition: { type: Object, default: null },
    selectedPosSide: { type: String, default: '' },
    selectedPosEntry: { type: String, default: '' },
    hasSelectedSl: { type: Boolean, default: false },
    hasSelectedTp: { type: Boolean, default: false },
    selectedSlText: { type: String, default: '' },
    selectedTpText: { type: String, default: '' }
});

defineEmits(['deselect', 'add-sl', 'remove-sl', 'add-tp', 'remove-tp', 'close-position']);
</script>
