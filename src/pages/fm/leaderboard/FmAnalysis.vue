<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import FmAnalysisSection from "@/components/fm/analysis/FmAnalysisSection.vue";

const route = useRoute();
const fmId = computed(() => route.params.id);
const isFollowed = computed(() => route.query.is_followed === "true");
const followerId = computed(() => route.query.follower_id);
</script>

<template>
  <div class="max-w-[1600px] mx-auto w-full">
    <FmAnalysisSection
      :fm-id="fmId"
      :is-followed="isFollowed"
      :follower-id="followerId"
      :show-header="true"
    />
  </div>
</template>
