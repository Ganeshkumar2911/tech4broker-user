<!--
  BaseBadge.vue
  Unified reusable badge component for Panther User Revamp.
  
  Features:
  - Auto-infers variant (success, danger, warning, info, neutral, etc.) from trade types and statuses.
  - Auto-normalizes trade types (e.g. 0 -> BUY, 1 -> SELL) and snake_case statuses (e.g. in_progress -> In Progress).
  - Supports custom variants, sizes (xs, sm, md, lg), shapes (pill, rounded), dot indicators, pulse animations, and slots.
  - Full Dark Mode & Light Mode support using project Tailwind theme tokens.

  Usage Examples:
    <BaseBadge value="BUY" />
    <BaseBadge value="SELL" />
    <BaseBadge :value="row.type" />
    <BaseBadge status="OPEN" />
    <BaseBadge status="CLOSED" />
    <BaseBadge status="PENDING" pulse />
    <BaseBadge variant="primary" label="VIP Level 1" />
    <BaseBadge variant="success" size="xs" shape="rounded">Active</BaseBadge>
-->
<template>
  <span
    :class="[
      'inline-flex items-center justify-center font-medium transition-colors shrink-0 select-none',
      sizeClasses,
      shapeClasses,
      variantClasses,
      textCaseClasses,
      customClass,
    ]"
  >
    <!-- Optional Left Slot / Icon -->
    <slot name="prefix">
      <component
        :is="icon"
        v-if="icon && typeof icon === 'object'"
        class="shrink-0"
        :class="iconSizeClasses"
      />
      <BaseIcon
        v-else-if="icon && typeof icon === 'string'"
        :name="icon"
        :size="iconSize"
        class="shrink-0"
      />
    </slot>

    <!-- Status Dot Indicator -->
    <span
      v-if="showDot"
      class="rounded-full bg-current shrink-0"
      :class="[
        dotSizeClasses,
        pulse ? 'animate-pulse' : '',
      ]"
    />

    <!-- Main Content -->
    <slot>
      <span>{{ displayLabel }}</span>
    </slot>

    <!-- Optional Right Slot -->
    <slot name="suffix" />
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  // Main value / identifier (e.g. 'BUY', 'SELL', 'OPEN', 'PENDING', 0, 1)
  value: {
    type: [String, Number, Boolean],
    default: null,
  },
  // Specific status prop alias
  status: {
    type: [String, Number],
    default: null,
  },
  // Specific trade type prop alias
  type: {
    type: [String, Number],
    default: null,
  },
  // Explicit label override
  label: {
    type: [String, Number],
    default: null,
  },
  // Color variant: 'auto' | 'success' | 'danger' | 'warning' | 'info' | 'cyan' | 'purple' | 'primary' | 'neutral'
  variant: {
    type: String,
    default: "auto",
  },
  // Size: 'xs' | 'sm' | 'md' | 'lg'
  size: {
    type: String,
    default: "sm",
  },
  // Shape: 'auto' | 'pill' | 'rounded' | 'square'
  shape: {
    type: String,
    default: "auto",
  },
  // Status dot: boolean (auto-detected if null)
  dot: {
    type: Boolean,
    default: null,
  },
  // Dot pulse animation
  pulse: {
    type: Boolean,
    default: false,
  },
  // Text transform: 'auto' | 'uppercase' | 'capitalize' | 'lowercase' | 'none'
  textCase: {
    type: String,
    default: "auto",
  },
  // Left icon (Lucide component or Material icon string)
  icon: {
    type: [Object, String, Function],
    default: null,
  },
  // Custom classes
  customClass: {
    type: [String, Array, Object],
    default: "",
  },
});

// Normalized raw key string
const rawKey = computed(() => {
  const val = props.type !== null && props.type !== undefined
    ? props.type
    : props.status !== null && props.status !== undefined
    ? props.status
    : props.value !== null && props.value !== undefined
    ? props.value
    : props.label !== null && props.label !== undefined
    ? props.label
    : "";
  return String(val).trim();
});

const lowerKey = computed(() => rawKey.value.toLowerCase());

// Detect if this represents a trade direction / action (BUY/SELL)
const isTradeType = computed(() => {
  if (props.type !== null && props.type !== undefined) return true;
  return ["buy", "sell", "0", "1", "long", "short"].includes(lowerKey.value);
});

// Detect if this is a status
const isStatusType = computed(() => {
  if (props.status !== null && props.status !== undefined) return true;
  return [
    "open", "closed", "active", "inactive", "pending", "approved", "rejected",
    "declined", "completed", "solved", "progress", "in_progress", "urgent",
    "high", "medium", "low", "unverified", "verified", "failed", "cancelled",
    "canceled", "processing", "submitted", "in_review", "hold", "live", "demo",
    "copy_trading", "copy trading", "copytrading", "earn", "convert", "redeem_reserve",
    "redeem_release", "redeem_commit", "expire", "expired", "fulfilled",
    "fulfilling", "enrolled", "not enrolled", "funded", "no_deposit", "no_account",
    "kyc_incomplete", "live mt5", "standard", "real"
  ].includes(lowerKey.value);
});

// Auto-inferred variant
const resolvedVariant = computed(() => {
  if (props.variant && props.variant !== "auto") {
    return props.variant.toLowerCase();
  }

  const key = lowerKey.value;

  // 1. Trade Buy
  if (["buy", "0", "long"].includes(key)) {
    return "buy";
  }

  // 2. Trade Sell
  if (["sell", "1", "short"].includes(key)) {
    return "sell";
  }

  // 3. Status Success / Primary Green
  if (
    [
      "deposit", "credit", "in",
      "open", "active", "approved", "success", "completed",
      "solved", "verified", "enabled", "live", "running", "paid",
      "earn", "redeem_release", "fulfilled", "enrolled", "funded",
      "live mt5", "real",
    ].includes(key)
  ) {
    return "success";
  }

  // 4. Status Danger / Primary Red
  if (
    [
      "withdrawal", "withdraw", "debit", "out",
      "rejected", "declined", "cancelled", "canceled", "failed",
      "urgent", "high", "danger", "error", "disabled", "blocked", "suspended",
      "redeem_commit", "expire", "expired",
    ].includes(key)
  ) {
    return "danger";
  }

  // 5. Status Warning / Primary Yellow
  if (
    [
      "pending", "processing", "in_progress", "progress", "medium",
      "warning", "hold", "review", "in_review", "submitted", "waiting", "fee", "fee_paid",
      "redeem_reserve", "fulfilling", "not enrolled", "no_deposit",
    ].includes(key)
  ) {
    return "warning";
  }

  // 6. Status Info / Primary Blue
  if (
    [
      "low", "info", "information", "transfer", "swap",
      "internal_transfer", "internal transfer", "ib_commission", "commission", "new",
      "copy_trading", "copy trading", "copytrading", "convert", "no_account",
    ].includes(key)
  ) {
    return "info";
  }

  // 7. Status Purple / Primary Purple
  if (["trade_pnl", "reward", "vip", "purple"].includes(key)) {
    return "purple";
  }

  // 8. Neutral / Secondary Text
  if (
    [
      "closed", "inactive", "unverified", "archived", "none",
      "draft", "offline", "demo", "kyc_incomplete", "standard",
    ].includes(key)
  ) {
    return "neutral";
  }

  return "neutral";
});

// Variant styling classes — strictly mapped to tokens from src/style.css (no borders or shadows)
const variantClasses = computed(() => {
  switch (resolvedVariant.value) {
    case "buy":
      return "bg-buy-bg text-buy-text";
    case "sell":
      return "bg-sell-bg text-sell-text";
    case "success":
    case "green":
      return "bg-primary-green/10 text-primary-green";
    case "danger":
    case "red":
      return "bg-primary-red/10 text-primary-red";
    case "warning":
    case "yellow":
    case "amber":
      return "bg-primary-yellow/10 text-primary-yellow";
    case "info":
    case "blue":
      return "bg-primary-blue/10 text-primary-blue";
    case "purple":
      return "bg-primary-purple/10 text-primary-purple";
    case "primary":
      return "bg-primary/10 text-primary";
    case "neutral":
    case "secondary":
    case "gray":
    default:
      return "bg-secondary-text/10 text-secondary-text";
  }
});

// Dot indicator visibility
const showDot = computed(() => {
  if (props.dot !== null) return props.dot;
  // If dot is not explicitly passed:
  // Show dot for status types, hide for trade buy/sell
  if (isTradeType.value && !props.status) return false;
  if (isStatusType.value || props.status !== null) return true;
  return false;
});

// Size classes
const sizeClasses = computed(() => {
  switch (props.size) {
    case "2xs":
    case "xs":
      return "px-2.5 py-0.5 text-[10px] gap-1";
    case "md":
      return "px-3.5 py-1 text-sm gap-1.5";
    case "lg":
      return "px-4 py-1.5 text-base gap-2";
    case "sm":
    default:
      return "px-3 py-1 text-xs gap-1.5";
  }
});

// Dot size
const dotSizeClasses = computed(() => {
  switch (props.size) {
    case "2xs":
    case "xs":
      return "w-1 h-1";
    case "md":
      return "w-2 h-2";
    case "lg":
      return "w-2.5 h-2.5";
    case "sm":
    default:
      return "w-1.5 h-1.5";
  }
});

// Shape classes — default is rounded-full (pill) for all badges
const shapeClasses = computed(() => {
  if (props.shape && props.shape !== "auto") {
    switch (props.shape) {
      case "rounded":
      case "md":
        return "rounded-md";
      case "sm":
        return "rounded";
      case "lg":
        return "rounded-lg";
      case "square":
      case "none":
        return "rounded-none";
      case "pill":
      case "full":
      default:
        return "rounded-full";
    }
  }

  // Default shape: rounded-full (pill) for all badges
  return "rounded-full";
});

// Text Case classes
const textCaseClasses = computed(() => {
  if (props.textCase && props.textCase !== "auto") {
    switch (props.textCase) {
      case "uppercase":
        return "uppercase";
      case "capitalize":
        return "capitalize";
      case "lowercase":
        return "lowercase";
      case "none":
        return "";
    }
  }

  // Auto textCase
  if (isTradeType.value) {
    return "uppercase";
  }
  return "capitalize";
});

// Formatted display label
const displayLabel = computed(() => {
  if (props.label !== null && props.label !== undefined) {
    return String(props.label);
  }

  const raw = rawKey.value;
  if (!raw) return "—";

  // Trade number mapping (0 -> BUY, 1 -> SELL)
  if (raw === "0") return "BUY";
  if (raw === "1") return "SELL";

  // Trade type strings
  if (lowerKey.value === "buy") return "BUY";
  if (lowerKey.value === "sell") return "SELL";

  // Format snake_case or dash words (e.g., 'in_progress' -> 'In Progress')
  if (raw.includes("_") || raw.includes("-")) {
    return raw
      .replace(/[-_]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  return raw;
});

// Icon size
const iconSize = computed(() => {
  switch (props.size) {
    case "2xs":
    case "xs":
      return 12;
    case "md":
      return 16;
    case "lg":
      return 18;
    case "sm":
    default:
      return 14;
  }
});

const iconSizeClasses = computed(() => {
  switch (props.size) {
    case "2xs":
    case "xs":
      return "w-3 h-3";
    case "md":
      return "w-4 h-4";
    case "lg":
      return "w-4.5 h-4.5";
    case "sm":
    default:
      return "w-3.5 h-3.5";
  }
});
</script>
