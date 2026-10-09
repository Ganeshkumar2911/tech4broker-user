<template>
    <div class="flex flex-col gap-4 h-full border-r border-primary-border">

        <div ref="customOverlaysComp" class="flex flex-col">
            <div v-for="(item, index) in allCustomOverlays" :key="index" class="relative">

                <button @click="toggleShow(item.id)"
                    :class="item.show ? 'text-primary bg-primary-border/40' : 'text-secondary-text hover:text-primary-text hover:bg-primary-border/30'"
                    class="flex items-center px-2 justify-center capitalize cursor-pointer py-2 transition-all duration-150 text-center w-full">
                    <component v-if="item.icon" :is="Icon[item.icon]" class="w-6 h-6" />
                </button>

                <div v-if="item.show"
                    class="absolute top-0 left-12 flex flex-col gap-1 bg-card-background border border-primary-border rounded-lg z-40 min-w-[150px] shadow-xl">
                    <OverlaySelector @close="toggleShow(item.id)" v-for="overlay in item.options" :item="overlay" />
                </div>
            </div>
        </div>

        <button @click="removeOverlay"
            class="flex items-center justify-center capitalize cursor-pointer py-2 text-secondary-text hover:text-primary-text hover:bg-primary-border/30 transition-all duration-150 text-center w-full">
            <component :is="Icon.remove" class="w-6 h-6" />
        </button>

        <div class="p-1 mt-auto">

            <button @click="showChartStyleModal = true"
                class="rounded-lg border border-primary-border text-primary cursor-pointer px-2 py-1.5 hover:bg-primary-border/30 transition-all duration-150 text-center w-full flex justify-center items-center">
                <Settings class="w-4 h-4" />
            </button>
        </div>
    </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { allOverlays } from '@/utils/chart/custom-overlay';
import { ref } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { Settings } from 'lucide-vue-next';
import OverlaySelector from '../overlay-modal/OverlaySelector.vue';
import { useChartStore } from '@/stores/client/chart.js';
import { getChart } from '@/utils/chart/chart';
import { Icon } from '@/components/shared/chart/icons';

const chartStore = useChartStore();
const { showChartStyleModal } = storeToRefs(chartStore);

const allCustomOverlays = ref([...allOverlays])

const customOverlaysComp = ref(null)


const toggleShow = (id) => {

    allCustomOverlays.value = allCustomOverlays.value.map((item) => {
        if (item.id === id) {
            item.show = !item.show
        } else {
            item.show = false
        }
        return item
    })

}

onClickOutside(customOverlaysComp, () => {
    setTimeout(() => {
        allCustomOverlays.value = allCustomOverlays.value.map((item) => {
            item.show = false
            return item
        })
    }, 200)
})

const removeOverlay = () => {
    const chart = getChart()
    chart.removeOverlay('segment')
}
</script>

<style lang="scss" scoped></style>