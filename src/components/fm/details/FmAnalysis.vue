<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FmAnalysisSection from '@/components/fm/analysis/FmAnalysisSection.vue'

const props = defineProps({
  fmId: {
    type: [String, Number],
    default: null,
  },
})

const route = useRoute()
const resolvedFmId = computed(() => props.fmId || route.params.id)
const isFollowed = computed(() => route.query.is_followed === 'true')
const followerId = computed(() => route.query.follower_id)
</script>

<template>
  <div class="w-full">
    <FmAnalysisSection
      :fm-id="resolvedFmId"
      :is-followed="isFollowed"
      :follower-id="followerId"
      :show-header="false"
    />
  </div>
</template>
