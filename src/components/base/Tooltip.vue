<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  text: {
    type: String,
    default: "",
  },
  position: {
    type: String,
    default: "center",
    validator: (value) =>
      ["top", "start", "center", "end", "right", "left", "bottom"].includes(
        value
      ),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
  wrap: {
    type: Boolean,
    default: false,
  },
  maxWidth: {
    type: [String, Number],
    default: "",
  },
});

const showTooltip = ref(false);
const wrapperRef = ref(null);

const getTooltipStyle = () => {
  if (!wrapperRef.value) return {};
  const rect = wrapperRef.value.getBoundingClientRect();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const baseStyle = {
    width: "max-content",
  };

  const maxWidthVal = props.maxWidth
    ? typeof props.maxWidth === "number"
      ? `${props.maxWidth}px`
      : props.maxWidth
    : props.wrap || isMobile
      ? "240px"
      : "";

  if (maxWidthVal) {
    baseStyle.whiteSpace = "normal";
    baseStyle.maxWidth = `min(${maxWidthVal}, calc(100vw - 24px))`;
  }

  const effectivePosition =
    isMobile && (props.position === "left" || props.position === "right")
      ? "bottom"
      : props.position;

  if (effectivePosition === "right") {
    return {
      ...baseStyle,
      position: "fixed",
      left: `${rect.right + 8}px`,
      top: `${rect.top + rect.height / 2}px`,
      transform: "translateY(-50%)",
      zIndex: "99999",
    };
  }
  if (effectivePosition === "left") {
    return {
      ...baseStyle,
      position: "fixed",
      left: `${rect.left - 8}px`,
      top: `${rect.top + rect.height / 2}px`,
      transform: "translate(-100%, -50%)",
      zIndex: "99999",
    };
  }
  if (effectivePosition === "bottom") {
    return {
      ...baseStyle,
      position: "fixed",
      left: `${Math.min(Math.max(rect.left + rect.width / 2, 120), window.innerWidth - 120)}px`,
      top: `${rect.bottom + 8}px`,
      transform: "translateX(-50%)",
      zIndex: "99999",
    };
  }
  if (effectivePosition === "start") {
    return {
      ...baseStyle,
      position: "fixed",
      left: `${rect.left}px`,
      top: `${rect.top - 8}px`,
      transform: "translateY(-100%)",
      zIndex: "99999",
    };
  }
  if (effectivePosition === "end") {
    return {
      ...baseStyle,
      position: "fixed",
      left: `${rect.right}px`,
      top: `${rect.top - 8}px`,
      transform: "translate(-100%, -100%)",
      zIndex: "99999",
    };
  }

  // Center / Top (top-center)
  return {
    ...baseStyle,
    position: "fixed",
    left: `${Math.min(Math.max(rect.left + rect.width / 2, 120), window.innerWidth - 120)}px`,
    top: `${rect.top - 8}px`,
    transform: "translate(-50%, -100%)",
    zIndex: "99999",
  };
};

const tooltipStyle = ref({});

const handleMouseEnter = () => {
  if (props.disabled) return;
  tooltipStyle.value = getTooltipStyle();
  showTooltip.value = true;
};

const handleMouseLeave = () => {
  showTooltip.value = false;
};

const handleClick = (e) => {
  if (props.disabled) return;
  if (showTooltip.value) {
    showTooltip.value = false;
  } else {
    tooltipStyle.value = getTooltipStyle();
    showTooltip.value = true;
  }
};

const handleOutsideClick = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    showTooltip.value = false;
  }
};

const handleScroll = () => {
  if (showTooltip.value) {
    showTooltip.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleOutsideClick);
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleOutsideClick);
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div
    ref="wrapperRef"
    class="tooltip-wrapper"
    :class="{ 'block': block }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
  >
    <slot />

    <Teleport to="body">
      <div
        v-if="showTooltip"
        class="tooltip-popup"
        :class="[`position-${position}`, { 'is-wrap': wrap || maxWidth }]"
        :style="tooltipStyle"
      >
        <div class="tooltip-content">
          <slot name="content">{{ text }}</slot>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip-wrapper.block {
  display: block;
  width: 100%;
}

.tooltip-popup {
  position: fixed;
  z-index: 99999;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  width: max-content;
  max-width: calc(100vw - 32px);
}

.tooltip-popup[style] {
  opacity: 1;
}

.tooltip-popup.is-wrap {
  white-space: normal;
  width: max-content;
  max-width: 220px;
}

.tooltip-popup.is-wrap .tooltip-content {
  text-align: center;
  line-height: 1.35;
  word-break: normal;
  overflow-wrap: break-word;
}

.tooltip-content {
  position: relative;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

/* Default arrow (center) */
.tooltip-content::after {
  content: "";
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgba(0, 0, 0, 0.9);
  left: 50%;
  bottom: -4px;
  transform: translateX(-50%) rotate(45deg);
}

/* START */
.tooltip-popup.position-start .tooltip-content::after {
  left: 12px;
  right: auto;
  bottom: -4px;
  transform: rotate(45deg);
}

/* CENTER / TOP */
.tooltip-popup.position-center .tooltip-content::after,
.tooltip-popup.position-top .tooltip-content::after {
  left: 50%;
  bottom: -4px;
  transform: translateX(-50%) rotate(45deg);
}

/* END */
.tooltip-popup.position-end .tooltip-content::after {
  left: auto;
  right: 12px;
  bottom: -4px;
  transform: rotate(45deg);
}

/* RIGHT */
.tooltip-popup.position-right .tooltip-content::after {
  left: -4px;
  top: 50%;
  bottom: auto;
  transform: translateY(-50%) rotate(45deg);
}

/* LEFT */
.tooltip-popup.position-left .tooltip-content::after {
  left: auto;
  right: -4px;
  top: 50%;
  bottom: auto;
  transform: translateY(-50%) rotate(45deg);
}

/* BOTTOM */
.tooltip-popup.position-bottom .tooltip-content::after {
  left: 50%;
  top: -4px;
  bottom: auto;
  transform: translateX(-50%) rotate(45deg);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .tooltip-content {
    font-size: 11px;
    padding: 5px 10px;
  }
}
</style>