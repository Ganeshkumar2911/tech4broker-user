<script setup>
import { computed } from 'vue'
import {
  X,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Truck,
  MapPin,
  Calendar,
  Wallet,
  Coins,
  DollarSign,
  User,
  Phone,
  Mail,
  FileText,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-vue-next'
import { formatDate } from '@/utils/timeFormatter'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Object,
    default: () => null,
  },
})

const emit = defineEmits(['close'])

const itemSnapshot = computed(() => props.order?.item_snapshot || {})
const shippingSnapshot = computed(() => props.order?.shipping_snapshot || {})

const hasShippingDetails = computed(() => {
  const s = shippingSnapshot.value
  return Boolean(
    s?.full_name ||
    s?.address ||
    s?.city ||
    s?.country ||
    s?.phone ||
    s?.email ||
    s?.notes
  )
})

const getStatusBadge = (status) => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
    case 'FULFILLED':
      return {
        label: 'Fulfilled',
        class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: CheckCircle2,
      }
    case 'APPROVED':
      return {
        label: 'Approved',
        class: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        icon: CheckCircle2,
      }
    case 'PENDING':
    case 'FULFILLING':
      return {
        label: 'Pending Review',
        class: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: Clock,
      }
    case 'REJECTED':
    case 'FAILED':
      return {
        label: 'Rejected',
        class: 'bg-red-500/10 text-red-400 border-red-500/20',
        icon: XCircle,
      }
    default:
      return {
        label: status || 'Pending',
        class: 'bg-white/5 text-secondary-text border-white/10',
        icon: Info,
      }
  }
}

const statusInfo = computed(() => getStatusBadge(props.order?.status))

const closeDrawer = () => {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div>
      <!-- Backdrop -->
      <Transition name="backdrop">
        <div
          v-if="open"
          class="fixed inset-0 z-100 bg-black/60 backdrop-blur-xs"
          @click="closeDrawer"
        />
      </Transition>

      <!-- Side Drawer -->
      <Transition name="drawer">
        <div
          v-if="open && order"
          class="fixed right-0 top-0 bottom-0 z-101 w-full max-w-lg bg-card-background border-l border-primary-border/30 flex flex-col shadow-2xl overflow-hidden"
          @click.stop
        >
          <!-- ─── HEADER ─── -->
          <div class="px-5 sm:px-6 py-4 sm:py-5 border-b border-primary-border/20 flex items-center justify-between shrink-0 bg-background/40">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Package class="w-5 h-5" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-sm sm:text-base font-bold text-primary-text">
                    Order #ORD-{{ order.id }}
                  </h3>
                  <BaseBadge
                    :value="order.status"
                    size="xs"
                  />
                </div>
                <p class="text-xs text-secondary-text mt-0.5">
                  Placed on {{ formatDate(order.created_at || order.requested_at) }}
                </p>
              </div>
            </div>

            <button
              type="button"
              @click="closeDrawer"
              class="text-secondary-text hover:text-primary-text p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              title="Close drawer"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- ─── SCROLLABLE BODY ─── -->
          <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 no-scrollbar">

            <!-- 1. Rejection Alert (if rejected) -->
            <div
              v-if="order.status?.toUpperCase() === 'REJECTED' || order.rejection_reason"
              class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 space-y-1.5"
            >
              <div class="flex items-center gap-2 font-bold text-red-400">
                <AlertCircle class="w-4 h-4 shrink-0" />
                <span>Order Rejected</span>
              </div>
              <p class="text-[11px] text-red-200/90 leading-relaxed">
                {{ order.rejection_reason || 'This redemption request was declined by administrators. Reserved points have been released back to your wallet.' }}
              </p>
              <p v-if="order.rejected_at" class="text-2xs text-red-400/80 font-mono">
                Rejected at: {{ formatDate(order.rejected_at) }}
              </p>
            </div>

            <!-- 2. Admin Note (if any) -->
            <div
              v-if="order.admin_note"
              class="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1"
            >
              <div class="flex items-center gap-1.5 font-bold text-blue-400">
                <FileText class="w-4 h-4 shrink-0" />
                <span>Administrator Remarks</span>
              </div>
              <p class="text-[11px] text-blue-200/90 leading-relaxed">
                {{ order.admin_note }}
              </p>
            </div>

            <!-- 3. Product Item Snapshot Card -->
            <div class="bg-background rounded-2xl p-4 sm:p-5 space-y-3.5 border border-primary-border/10">
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-1">
                  <BaseBadge :value="order.reward_type || itemSnapshot.type || 'Store Reward'" variant="neutral" size="2xs" />
                  <h4 class="text-base font-bold text-primary-text leading-snug">
                    {{ itemSnapshot.title || itemSnapshot.name || 'Reward Item' }}
                  </h4>
                </div>
                <div class="text-right shrink-0">
                  <span class="text-base sm:text-lg font-bold text-primary font-mono tabular-nums">
                    {{ Number(order.points || order.points_requested || itemSnapshot.points_cost || 0).toLocaleString() }}
                  </span>
                  <span class="text-xs text-secondary-text font-semibold ml-1">pts</span>
                </div>
              </div>

              <p v-if="itemSnapshot.description" class="text-xs text-secondary-text leading-relaxed">
                {{ itemSnapshot.description }}
              </p>

              <!-- Points & Cash Equivalent Summary -->
              <div class="pt-3 border-t border-primary-border/20 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span class="text-secondary-text text-[11px] block">Estimated Value</span>
                  <span class="text-sm font-bold text-primary-text">
                    ${{ Number(order.cash_value_snapshot || order.cash_amount || itemSnapshot.cash_value || 0).toFixed(2) }} USD
                  </span>
                </div>
                <div v-if="order.trading_account_id">
                  <span class="text-secondary-text text-[11px] block">Credited Account</span>
                  <span class="text-sm font-bold text-primary">
                    #{{ order.trading_account_id }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 4. Order Lifecycle & Status Timeline -->
            <div class="bg-background rounded-2xl p-4 sm:p-5 space-y-3 border border-primary-border/10">
              <h5 class="text-xs font-bold text-primary-text uppercase tracking-wider flex items-center gap-1.5">
                <Clock class="w-3.5 h-3.5 text-primary" />
                <span>Order Timeline</span>
              </h5>

              <div class="space-y-3 pl-2 border-l-2 border-primary-border/30 ml-2 mt-2">
                <!-- Event 1: Requested -->
                <div class="relative pl-4 space-y-0.5">
                  <div class="absolute -left-3.25 top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                  <p class="text-xs font-bold text-primary-text">Redemption Requested</p>
                  <p class="text-[11px] text-secondary-text">{{ formatDate(order.requested_at || order.created_at) }}</p>
                </div>

                <!-- Event 2: Approved (if present) -->
                <div v-if="order.approved_at" class="relative pl-4 space-y-0.5">
                  <div class="absolute -left-3.25 top-1 w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <p class="text-xs font-bold text-blue-400">Approved by Admin</p>
                  <p class="text-[11px] text-secondary-text">{{ formatDate(order.approved_at) }}</p>
                </div>

                <!-- Event 3: Fulfilled (if present) -->
                <div v-if="order.fulfilled_at" class="relative pl-4 space-y-0.5">
                  <div class="absolute -left-3.25 top-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <p class="text-xs font-bold text-emerald-400">Fulfilled & Completed</p>
                  <p class="text-[11px] text-secondary-text">{{ formatDate(order.fulfilled_at) }}</p>
                </div>

                <!-- Event 4: Rejected (if present) -->
                <div v-if="order.rejected_at" class="relative pl-4 space-y-0.5">
                  <div class="absolute -left-3.25 top-1 w-2.5 h-2.5 rounded-full bg-red-400" />
                  <p class="text-xs font-bold text-red-400">Rejected</p>
                  <p class="text-[11px] text-secondary-text">{{ formatDate(order.rejected_at) }}</p>
                </div>
              </div>
            </div>

            <!-- 5. Shipping & Delivery Information -->
            <div class="bg-background rounded-2xl p-4 sm:p-5 space-y-3 border border-primary-border/10">
              <h5 class="text-xs font-bold text-primary-text uppercase tracking-wider flex items-center gap-1.5">
                <Truck class="w-3.5 h-3.5 text-primary" />
                <span>Delivery & Recipient Details</span>
              </h5>

              <div v-if="hasShippingDetails" class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div v-if="shippingSnapshot.full_name">
                  <span class="text-secondary-text text-[11px] block">Recipient Name</span>
                  <span class="font-bold text-primary-text">{{ shippingSnapshot.full_name }}</span>
                </div>
                <div v-if="shippingSnapshot.phone">
                  <span class="text-secondary-text text-[11px] block">Phone</span>
                  <span class="font-bold text-primary-text">{{ shippingSnapshot.phone }}</span>
                </div>
                <div v-if="shippingSnapshot.email">
                  <span class="text-secondary-text text-[11px] block">Email</span>
                  <span class="font-bold text-primary-text">{{ shippingSnapshot.email }}</span>
                </div>
                <div v-if="shippingSnapshot.address" class="sm:col-span-2">
                  <span class="text-secondary-text text-[11px] block">Shipping Address</span>
                  <span class="font-bold text-primary-text">
                    {{ shippingSnapshot.address }}
                    <template v-if="shippingSnapshot.city">, {{ shippingSnapshot.city }}</template>
                    <template v-if="shippingSnapshot.state">, {{ shippingSnapshot.state }}</template>
                    <template v-if="shippingSnapshot.postal_code"> {{ shippingSnapshot.postal_code }}</template>
                    <template v-if="shippingSnapshot.country">, {{ shippingSnapshot.country }}</template>
                  </span>
                </div>
                <div v-if="shippingSnapshot.notes" class="sm:col-span-2">
                  <span class="text-secondary-text text-[11px] block">Delivery Notes</span>
                  <span class="text-primary-text italic">{{ shippingSnapshot.notes }}</span>
                </div>
              </div>

              <div v-else class="text-xs text-secondary-text py-2 flex items-center gap-2">
                <Info class="w-4 h-4 text-secondary-text/70 shrink-0" />
                <span>Digital / direct account fulfillment. No physical shipping required.</span>
              </div>
            </div>

            <!-- 6. Order & Loyalty Context Metadata -->
            <div class="bg-background rounded-2xl p-4 sm:p-5 space-y-2.5 text-xs border border-primary-border/10">
              <h5 class="text-xs font-bold text-primary-text uppercase tracking-wider mb-2">
                Order Identifiers
              </h5>
              <div class="flex items-center justify-between py-1 border-b border-primary-border/10">
                <span class="text-secondary-text">Order ID</span>
                <span class="font-mono font-bold text-primary-text">#ORD-{{ order.id }}</span>
              </div>
              <div v-if="order.program_id" class="flex items-center justify-between py-1 border-b border-primary-border/10">
                <span class="text-secondary-text">Program ID</span>
                <span class="font-mono text-primary-text">#{{ order.program_id }}</span>
              </div>
              <div v-if="order.wallet_id" class="flex items-center justify-between py-1 border-b border-primary-border/10">
                <span class="text-secondary-text">Central Wallet ID</span>
                <span class="font-mono text-primary-text">#{{ order.wallet_id }}</span>
              </div>
              <div v-if="order.enrollment_id" class="flex items-center justify-between py-1 border-b border-primary-border/10">
                <span class="text-secondary-text">Enrollment ID</span>
                <span class="font-mono text-primary-text">#{{ order.enrollment_id }}</span>
              </div>
              <div v-if="order.trading_account_id" class="flex items-center justify-between py-1 border-b border-primary-border/10">
                <span class="text-secondary-text">MT5 Trading Account</span>
                <span class="font-mono font-bold text-primary">#{{ order.trading_account_id }}</span>
              </div>
              <div v-if="itemSnapshot.idempotency_key" class="flex items-center justify-between py-1">
                <span class="text-secondary-text">Idempotency Key</span>
                <span class="font-mono text-2xs text-secondary-text truncate max-w-50" :title="itemSnapshot.idempotency_key">
                  {{ itemSnapshot.idempotency_key }}
                </span>
              </div>
            </div>

          </div>

          <!-- ─── FOOTER ─── -->
          <div class="p-4 sm:p-5 border-t border-primary-border/20 bg-background/50 flex items-center justify-end shrink-0">
            <button
              type="button"
              @click="closeDrawer"
              class="h-10 px-6 text-xs font-semibold text-secondary-text hover:text-primary-text rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
</style>
