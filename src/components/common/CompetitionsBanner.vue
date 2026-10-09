<template>
  <!-- Skeleton Loader -->
  <div
    v-if="loading || bannersStore.loading"
    class="base-carousel relative overflow-hidden rounded-[20px] bg-card-background border border-primary-border skeleton-shimmer"
  >
    <div
      class="absolute inset-0 bg-gradient-to-r from-primary-border/40 via-primary-border/20 to-primary-border/40"
    ></div>
  </div>

  <!-- Banner Swiper Carousel -->
  <Swiper
    v-else-if="displayItems && displayItems.length > 0"
    :modules="[Autoplay, Pagination, Navigation]"
    :slides-per-view="slidesPerView"
    :space-between="spaceBetween"
    :loop="displayItems.length > 1 ? loop : false"
    :autoplay="autoplay && displayItems.length > 1 ? autoplayOptions : false"
    :pagination="pagination && displayItems.length > 1 ? { clickable: true } : false"
    :navigation="navigation && displayItems.length > 1"
    :speed="speed"
    class="base-carousel"
  >
    <SwiperSlide v-for="(item, index) in displayItems" :key="item.id ?? index">
      <slot name="slide" :item="item" :index="index">
        <div
          class="relative h-full w-full"
          :class="{ 'cursor-pointer': !!getRedirectUrl(item) }"
          @click="handleBannerClick(item)"
        >
          <img
            :src="item.image_url || item.url || item.image || defaultBanner"
            :alt="item.title || `Banner ${index + 1}`"
            @error="handleImageError"
            class="w-full h-full object-cover object-center"
          />
        </div>
      </slot>
    </SwiperSlide>
  </Swiper>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { useBannersStore } from "@/stores/shared/banners";

const router = useRouter();

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import banner1 from "@/assets/header.png";
import banner2 from "@/assets/header.png";
import banner3 from "@/assets/header.png";

const bannersStore = useBannersStore();

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },

  loading: {
    type: Boolean,
    default: false,
  },

  slidesPerView: {
    type: Number,
    default: 1,
  },

  spaceBetween: {
    type: Number,
    default: 0,
  },

  loop: {
    type: Boolean,
    default: true,
  },

  autoplay: {
    type: Boolean,
    default: true,
  },

  autoplayOptions: {
    type: Object,
    default: () => ({
      delay: 1000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    }),
  },

  pagination: {
    type: Boolean,
    default: true,
  },

  navigation: {
    type: Boolean,
    default: false,
  },

  speed: {
    type: Number,
    default: 700,
  },
});

defineEmits(["button-click"]);

const defaultBanners = [
  { id: 1, image_url: banner1 },
  { id: 2, image_url: banner2 },
  { id: 3, image_url: banner3 },
];

const defaultBanner = banner1;

const getRedirectUrl = (item) => {
  if (!item) return "";
  const desc = item.redirect_url || item.description || "";
  if (typeof desc !== "string") return "";
  const trimmed = desc.trim();
  if (!trimmed) return "";

  if (
    /^(https?:\/\/|\/|www\.)/i.test(trimmed) ||
    /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)
  ) {
    if (trimmed.startsWith("www.")) {
      return `https://${trimmed}`;
    }
    if (
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      !trimmed.startsWith("/")
    ) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }
  return "";
};

const handleBannerClick = (item) => {
  const targetUrl = getRedirectUrl(item);
  if (!targetUrl) return;

  if (targetUrl.startsWith("/")) {
    router.push(targetUrl);
  } else {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }
};

const handleImageError = (e) => {
  if (e?.target) {
    e.target.src = defaultBanner;
  }
};

const handleResize = () => {
  bannersStore.fetchBanners();
};

onMounted(() => {
  bannersStore.fetchBanners();
  if (typeof window !== "undefined") {
    window.addEventListener("resize", handleResize);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", handleResize);
  }
});

const displayItems = computed(() => {
  if (Array.isArray(props.items) && props.items.length > 0) {
    return props.items;
  }
  if (Array.isArray(bannersStore.banners) && bannersStore.banners.length > 0) {
    return bannersStore.banners;
  }
  return defaultBanners;
});
</script>

<style scoped>
.base-carousel {
  width: 100%;
  aspect-ratio: 3 / 1;
  border-radius: 20px;
  overflow: hidden;
}

@media (min-width: 768px) {
  .base-carousel {
    aspect-ratio: 6 / 1;
  }
}

.base-carousel :deep(.swiper),
.base-carousel :deep(.swiper-wrapper),
.base-carousel :deep(.swiper-slide) {
  width: 100%;
  height: 100%;
}
.skeleton-shimmer {
  position: relative;
  overflow: hidden;
}

.skeleton-shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.12),
    transparent
  );
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  to {
    transform: translateX(100%);
  }
}
</style>
