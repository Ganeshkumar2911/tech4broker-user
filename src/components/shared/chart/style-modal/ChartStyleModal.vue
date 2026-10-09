<template>
    <Modal :modelValue="showChartStyleModal" @close="handleClose">
        <div class="flex flex-col text-primary-text h-[60vh] w-screen max-w-lg p-4">
            <!-- ── Top bar ── -->
            <div class="flex shrink-0 items-center justify-between border-b border-primary-border pb-2">
                <p class="text-base font-semibold text-primary-text">Chart Style</p>

            </div>

            <!-- ── Sidebar + Content ── -->
            <div class="flex min-h-0 flex-1">

                <!-- Sidebar nav -->
                <nav class="flex w-44 shrink-0 flex-col gap-0.5 border-r border-primary-border mt-4">
                    <button v-for="tab in tabs" :key="tab.id" type="button"
                        class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors"
                        :class="activeTab === tab.id
                            ? ' text-primary font-semibold'
                            : 'text-secondary-text hover:text-primary-text'"
                        @click="activeTab = tab.id; closeColorPicker()">
                        <!-- icon slot -->
                        <ChartArea v-if="tab.id === 'candle'" />
                        <Table v-else-if="tab.id === 'grid'" />

                        <!-- <svg v-else-if="tab.id === 'background'" xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M3 12h18" />
                        </svg> -->
                        {{ tab.label }}
                    </button>
                </nav>

                <!-- Content panel -->
                <div class="flex-1 overflow-y-auto pr-2 pb-36" @click="closeColorPicker">

                    <!-- ─── CANDLE tab ─────────────────────────────── -->
                    <template v-if="activeTab === 'candle'">
                        <Section title="Display">
                            <SettingRow label="Candle Type">
                                <SingleSelect v-model="localStyle.candle.type">
                                    <option v-for="v in candleTypes" :key="v.value" :value="v.value">{{ v.label }}
                                    </option>
                                </SingleSelect>

                            </SettingRow>
                            <SettingRow label="Default Tooltip">
                                <SingleSelect v-model="localStyle.candle.tooltip.showRule">
                                    <option value="none">Hidden</option>
                                    <option value="always">Visible</option>
                                </SingleSelect>

                            </SettingRow>
                            <SettingRow label="Price Mark">
                                <input v-model="localStyle.candle.priceMark.show" type="checkbox"
                                    class="h-4 w-4 accent-custom-blue cursor-pointer" />
                            </SettingRow>
                        </Section>

                        <Section title="Body">
                            <ColorRow v-for="f in bodyFields" :key="f.path" :label="f.label"
                                :value="getByPath(localStyle, f.path)" :open="activeColorField === f.path"
                                @toggle="toggleColorPicker(f.path)" @pick="(c) => setColor(f.path, c)" />
                        </Section>

                        <Section title="Border">
                            <ColorRow v-for="f in borderFields" :key="f.path" :label="f.label"
                                :value="getByPath(localStyle, f.path)" :open="activeColorField === f.path"
                                @toggle="toggleColorPicker(f.path)" @pick="(c) => setColor(f.path, c)" />
                        </Section>

                        <Section title="Wick" :last="true">
                            <ColorRow v-for="f in wickFields" :key="f.path" :label="f.label"
                                :value="getByPath(localStyle, f.path)" :open="activeColorField === f.path"
                                @toggle="toggleColorPicker(f.path)" @pick="(c) => setColor(f.path, c)" />
                        </Section>
                    </template>

                    <!-- ─── GRID tab ───────────────────────────────── -->
                    <template v-else-if="activeTab === 'grid'">
                        <Section title="Visibility">
                            <SettingRow label="Show Grid">
                                <input v-model="localStyle.grid.show" type="checkbox"
                                    class="h-4 w-4 accent-custom-blue cursor-pointer" />
                            </SettingRow>
                        </Section>

                        <Section v-for="(line, i) in gridLines" :key="line.key" :title="line.label"
                            :last="i === gridLines.length - 1">
                            <SettingRow label="Visible">
                                <input v-model="localStyle.grid[line.key].show" type="checkbox"
                                    class="h-4 w-4 accent-custom-blue cursor-pointer" />
                            </SettingRow>
                            <ColorRow label="Color" :value="getByPath(localStyle, line.colorPath)"
                                :open="activeColorField === line.colorPath" @toggle="toggleColorPicker(line.colorPath)"
                                @pick="(c) => setColor(line.colorPath, c)" />
                            <SettingRow label="Line Style">

                                <SingleSelect v-model="localStyle.grid[line.key].style">
                                    <option value="solid">Solid</option>
                                    <option value="dashed">Dashed</option>
                                    <option value="dotted">Dotted</option>>
                                </SingleSelect>

                            </SettingRow>
                            <SettingRow :label="`Thickness — ${localStyle.grid[line.key].size}px`">
                                <input v-model.number="localStyle.grid[line.key].size" type="range" min="1" max="6"
                                    class="w-36 accent-custom-blue" />
                            </SettingRow>
                        </Section>
                    </template>

                    <!-- ─── BACKGROUND tab ────────────────────────── -->
                    <template v-else-if="activeTab === 'background'">
                        <Section title="Canvas" :last="true">
                            <ColorRow label="Background Color" :value="localStyle.background.color"
                                :open="activeColorField === 'background.color'"
                                @toggle="toggleColorPicker('background.color')"
                                @pick="(c) => setColor('background.color', c)" />
                        </Section>
                    </template>
                </div>
            </div>

            <!-- ── Footer ── -->
            <div class="flex shrink-0 items-center justify-between border-t border-primary-border px-5 py-3">
                <button type="button"
                    class="rounded-lg border border-primary-border text-primary-text px-4 py-1.5 text-sm font-medium transition hover:bg-background"
                    @click="handleReset">
                    Reset
                </button>
                <div class="flex items-center gap-2">
                    <button type="button"
                        class="rounded-lg border border-primary-border text-primary-text px-4 py-1.5 text-sm font-medium transition hover:bg-background"
                        @click="handleClose">
                        Cancel
                    </button>
                    <button type="button"
                        class="rounded-lg bg-primary px-5 py-1.5 text-sm font-semibold text-button-text shadow-sm transition hover:bg-primary-hover"
                        @click="handleApply">
                        Ok
                    </button>
                </div>
            </div>
        </div>
    </Modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import Section from './StyleSection.vue'
import SettingRow from './SettingRow.vue'
import ColorRow from './ColorRow.vue'

import { chartTypes } from '@/utils/chart/chart'
import {
    applyChartStyles,
    cloneChartStyle,
    createDefaultChartStyleOverrides,
    getChartTypeOption,
    normalizeLineStyle,
} from '@/utils/chart/chartStyles'
import { ChartArea, Table } from 'lucide-vue-next'
import Modal from '@/components/base/Modal.vue'
import { useChartStore } from '@/stores/client/chart.js'
import SingleSelect from '@/components/base/SingleSelect.vue'

import { useThemeStore } from '@/stores/shared/theme'

// ── Stores ───────────────────────────────────────────────────────────────────
const chartStore = useChartStore()
const themeStore = useThemeStore()
const { showChartStyleModal, chartStyleOverrides, selectedCandleType } = storeToRefs(chartStore)

// ── Tabs config ───────────────────────────────────────────────────────────────
const tabs = [
    { id: 'candle', label: 'Candle' },
    { id: 'grid', label: 'Grid' },
    // { id: 'background', label: 'Background' },
]
const activeTab = ref('candle')

// ── Color field groups ────────────────────────────────────────────────────────
const bodyFields = [
    { path: 'candle.bar.upColor', label: 'Up (Bullish)' },
    { path: 'candle.bar.downColor', label: 'Down (Bearish)' },
    { path: 'candle.bar.noChangeColor', label: 'Flat' },
]
const borderFields = [
    { path: 'candle.bar.upBorderColor', label: 'Up Border' },
    { path: 'candle.bar.downBorderColor', label: 'Down Border' },
    { path: 'candle.bar.noChangeBorderColor', label: 'Flat Border' },
]
const wickFields = [
    { path: 'candle.bar.upWickColor', label: 'Up Wick' },
    { path: 'candle.bar.downWickColor', label: 'Down Wick' },
    { path: 'candle.bar.noChangeWickColor', label: 'Flat Wick' },
]
const gridLines = [
    { key: 'horizontal', label: 'Horizontal Lines', colorPath: 'grid.horizontal.color' },
    { key: 'vertical', label: 'Vertical Lines', colorPath: 'grid.vertical.color' },
]

// ── Local state ───────────────────────────────────────────────────────────────
const candleTypes = chartTypes
const activeColorField = ref(null)
const localStyle = ref(createDefaultChartStyleOverrides(themeStore.isDark ? 'dark' : 'light'))

// ── Handlers ──────────────────────────────────────────────────────────────────
function handleClose() {
    showChartStyleModal.value = false
    activeColorField.value = null
}

function handleReset() {
    localStyle.value = createDefaultChartStyleOverrides(themeStore.isDark ? 'dark' : 'light')
    activeColorField.value = null
}

function handleApply() {
    const nextStyle = normalizeLineStyle(localStyle.value)
    nextStyle.isUserCustomGridColor = true
    chartStore.setChartStyleOverrides(nextStyle)
    selectedCandleType.value = getChartTypeOption(nextStyle.candle.type)
    applyChartStyles(themeStore.isDark ? 'dark' : 'light', nextStyle)
    handleClose()
}

function toggleColorPicker(field) {
    activeColorField.value = activeColorField.value === field ? null : field
}

function closeColorPicker() {
    activeColorField.value = null
}

function setColor(path, color) {
    setByPath(localStyle.value, path, color?.hex ?? color)
}

function getByPath(target, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], target)
}

function setByPath(target, path, value) {
    const keys = path.split('.')
    const lastKey = keys.pop()
    const parent = keys.reduce((acc, key) => acc[key], target)
    if (lastKey) parent[lastKey] = value
}

watch(showChartStyleModal, (isOpen) => {
    if (!isOpen) return
    localStyle.value = cloneChartStyle(chartStyleOverrides.value)
    activeColorField.value = null
    activeTab.value = 'candle'
})
</script>

<style scoped>
.flex-1.overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
}

.flex-1.overflow-y-auto::-webkit-scrollbar {
    width: 4px;
}

.flex-1.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.flex-1.overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 99px;
}
</style>
