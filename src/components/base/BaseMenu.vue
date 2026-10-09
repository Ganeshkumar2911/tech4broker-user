<template>
  <div class="inline-block" ref="triggerWrapperRef">
    <!-- Trigger button -->
    <button
      type="button"
      ref="triggerRef"
      @click.stop="toggle"
      class="p-2 rounded-lg text-secondary-text hover:bg-background hover:text-primary-text transition"
      :class="[{ 'bg-background text-primary-text': open }, triggerClass]"
    >
      <slot name="trigger">
        <MoreVertical class="w-4 h-4" />
      </slot>
    </button>

    <!-- Menu (teleported so table overflow/z-index never clips it) -->
    <Teleport to="body">
      <Transition name="dm-fade">
        <div
          v-if="open"
          ref="menuRef"
          class="fixed z-[999] min-w-[180px] rounded-xl border border-primary-border bg-card-background shadow-lg py-1 overflow-hidden"
          :style="menuStyle"
        >
          <template v-for="(item, i) in visibleItems" :key="item.id ?? i">
            <div v-if="item.divider" class="my-1 h-px bg-primary-border" />

            <button
              v-else
              type="button"
              :disabled="item.disabled"
              @click="handleSelect(item)"
              class="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition disabled:opacity-40 disabled:cursor-not-allowed"
              :class="
                item.danger
                  ? 'text-red-600 hover:bg-red-500/10'
                  : 'text-primary-text hover:bg-background'
              "
            >
              <component :is="item.icon" v-if="typeof item.icon !== 'string'" class="w-4 h-4 shrink-0" />
              <span v-else-if="item.icon" class="material-symbols-outlined"> {{ item.icon }} </span>
              <span class="truncate">{{ item.label }}</span>
            </button>
          </template>

          <div
            v-if="!visibleItems.length"
            class="px-3.5 py-2 text-sm text-secondary-text"
          >
            No actions available
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from "vue";
import { MoreVertical } from "lucide-vue-next";

/**
 * item shape:
 * {
 *   id?: string | number,
 *   label: string,
 *   icon?: Component,
 *   action?: string,        // key you switch on in the parent
 *   handler?: () => void,   // OR pass a direct function instead of using 'select' event
 *   danger?: boolean,       // red/destructive styling (e.g. Remove, Deactivate)
 *   disabled?: boolean,
 *   hidden?: boolean,       // conditionally hide (e.g. client.is_ib === true)
 *   divider?: boolean       // renders a separator line, ignores other fields
 * }
 */

const props = defineProps({
  items: { type: Array, required: true },
  triggerClass: { type: String, default: "" },
  // top / bottom / left / right + corner variants
  position: {
    type: String,
    default: "bottom-end",
    validator: (v) =>
      [
        "top",
        "bottom",
        "left",
        "right",
        "top-start",
        "top-end",
        "bottom-start",
        "bottom-end",
        "left-start",
        "left-end",
        "right-start",
        "right-end",
      ].includes(v),
  },
  offset: { type: Number, default: 8 }, // gap between trigger and menu, px
});

const emit = defineEmits(["select"]);

const open = ref(false);
const triggerRef = ref(null);
const triggerWrapperRef = ref(null);
const menuRef = ref(null);
const menuStyle = ref({});

const visibleItems = computed(() => props.items.filter((i) => !i.hidden));

function toggle() {
  open.value ? close() : show();
}

async function show() {
  open.value = true;
  await nextTick();
  positionMenu();
  document.addEventListener("mousedown", handleClickOutside, true);
  window.addEventListener("scroll", close, true);
  window.addEventListener("resize", close);
  document.addEventListener("keydown", handleKeydown);
}

function close() {
  if (!open.value) return;
  open.value = false;
  document.removeEventListener("mousedown", handleClickOutside, true);
  window.removeEventListener("scroll", close, true);
  window.removeEventListener("resize", close);
  document.removeEventListener("keydown", handleKeydown);
}

function handleClickOutside(e) {
  if (
    menuRef.value &&
    !menuRef.value.contains(e.target) &&
    triggerWrapperRef.value &&
    !triggerWrapperRef.value.contains(e.target)
  ) {
    close();
  }
}

function handleKeydown(e) {
  if (e.key === "Escape") close();
}

function handleSelect(item) {
  if (item.disabled) return;
  if (typeof item.handler === "function") item.handler();
  emit("select", item);
  close();
}

function positionMenu() {
  const trigger = triggerRef.value.getBoundingClientRect();
  const menu = menuRef.value.getBoundingClientRect();
  const { offset } = props;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top, left;
  const [side, align] = props.position.split("-"); // e.g. 'bottom', 'end'

  switch (side) {
    case "top":
      top = trigger.top - menu.height - offset;
      left = trigger.left;
      break;
    case "bottom":
      top = trigger.bottom + offset;
      left = trigger.left;
      break;
    case "left":
      top = trigger.top;
      left = trigger.left - menu.width - offset;
      break;
    case "right":
      top = trigger.top;
      left = trigger.right + offset;
      break;
  }

  // horizontal alignment for top/bottom
  if (side === "top" || side === "bottom") {
    if (align === "end") left = trigger.right - menu.width;
    if (!align) left = trigger.left + trigger.width / 2 - menu.width / 2; // centered
  }
  // vertical alignment for left/right
  if (side === "left" || side === "right") {
    if (align === "end") top = trigger.bottom - menu.height;
    if (!align) top = trigger.top + trigger.height / 2 - menu.height / 2;
  }

  // auto-flip + clamp so it never renders off-screen
  if (left + menu.width > vw - 8) left = vw - menu.width - 8;
  if (left < 8) left = 8;
  if (top + menu.height > vh - 8) {
    top =
      side === "bottom"
        ? trigger.top - menu.height - offset
        : vh - menu.height - 8;
  }
  if (top < 8) top = 8;

  menuStyle.value = { top: `${top}px`, left: `${left}px` };
}

onBeforeUnmount(close);

defineExpose({ close });
</script>

<style scoped>
.dm-fade-enter-active,
.dm-fade-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}
.dm-fade-enter-from,
.dm-fade-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-2px);
}
</style>
