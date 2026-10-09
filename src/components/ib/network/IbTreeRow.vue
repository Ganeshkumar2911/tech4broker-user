<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Pencil, Plus, ArrowLeftRight, Users, Link, Eye, EyeOff, BarChart2, Network, Layers } from 'lucide-vue-next'
import BaseTabs from '@/components/base/BaseTabs.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import Tooltip from '@/components/base/Tooltip.vue'

const props = defineProps({
  nodes: { type: [Array, Object], default: () => [] },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['add-sub', 'edit', 'transfer-parent', 'view-clients', 'assign-referral'])

const router = useRouter()
const showDetails = ref({})

const toggleDetails = (id) => {
  showDetails.value[id] = !showDetails.value[id]
}

function fmtCurrency(v) {
  if (v === null || v === undefined) return '0.00'
  return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function calcNet(depositObj, withdrawalObj) {
  const depOverall = Number(depositObj?.overall ?? 0)
  const wdrOverall = Number(withdrawalObj?.overall ?? 0)
  const depReal = Number(depositObj?.real ?? 0)
  const wdrReal = Number(withdrawalObj?.real ?? 0)
  const depCopy = Number(depositObj?.copy_trading ?? depositObj?.copy ?? 0)
  const wdrCopy = Number(withdrawalObj?.copy_trading ?? withdrawalObj?.copy ?? 0)

  return {
    overall: depOverall - wdrOverall,
    real: depReal - wdrReal,
    copy_trading: depCopy - wdrCopy,
  }
}

function fmtSignedCurrency(val) {
  if (val === null || val === undefined) return '$0.00'
  const num = Number(val)
  const formatted = Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (num > 0) return `+$${formatted}`
  if (num < 0) return `-$${formatted}`
  return `$${formatted}`
}

function netColorClass(val) {
  const num = Number(val ?? 0)
  if (num > 0) return 'text-primary-green'
  if (num < 0) return 'text-primary-red'
  return 'text-primary-text'
}

const selectedLevel = ref('all')
const arrangeByLevel = ref(false)

// Flatten nested tree into a flat list for table display
function flattenTree(input, currentDepth = 0, result = []) {
  if (!input) return result
  const list = Array.isArray(input) ? input : [input]
  for (const node of list) {
    if (!node || typeof node !== 'object') continue
    const nodeLevel =
      node.level !== undefined && node.level !== null && !isNaN(node.level) && node.level !== ''
        ? Number(node.level)
        : currentDepth
    result.push({
      ...node,
      level: nodeLevel,
    })
    const children = node.children || node.sub_ibs
    if (Array.isArray(children) && children.length > 0) {
      flattenTree(children, currentDepth + 1, result)
    }
  }
  return result
}

const flatRows = computed(() => flattenTree(props.nodes))

const availableLevels = computed(() => {
  const maxInRows = flatRows.value.reduce((max, node) => Math.max(max, Number(node.level ?? 0)), 0)
  const maxLvl = Math.max(maxInRows, 1)
  const levels = []
  for (let i = 0; i <= maxLvl; i++) {
    levels.push(i)
  }
  return levels
})

const levelCounts = computed(() => {
  const counts = {}
  flatRows.value.forEach((node) => {
    const lvl = Number(node.level ?? 0)
    counts[lvl] = (counts[lvl] || 0) + 1
  })
  return counts
})

const levelTabs = computed(() => {
  const tabs = [
    {
      label: 'All Levels',
      value: 'all',
      count: flatRows.value.length,
    },
  ]
  availableLevels.value.forEach((lvl) => {
    tabs.push({
      label: `Level ${lvl}`,
      value: lvl,
      count: levelCounts.value[lvl] || 0,
    })
  })
  return tabs
})

const arrangeModeTabs = computed(() => [
  { label: 'Hierarchy View', value: false, icon: Network },
  { label: 'Arrange Level-wise', value: true, icon: Layers },
])

const displayedRows = computed(() => {
  let rows = [...flatRows.value]

  if (selectedLevel.value !== 'all') {
    rows = rows.filter((node) => Number(node.level ?? 0) === Number(selectedLevel.value))
  }

  if (arrangeByLevel.value) {
    rows.sort((a, b) => (a.level ?? 0) - (b.level ?? 0))
  }

  return rows
})

const goToClientDetail = (ibId) => {
  if (ibId) router.push(`/clients/${ibId}?is_ib=true`)
}

const goToIbClients = (ibId) => {
  if (ibId) router.push(`/clients?ib_id=${ibId}`)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Level Filtering & Arrangement Controls using standard BaseTabs -->
    <div
      v-if="flatRows.length > 0"
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <!-- Standard BaseTabs for Level Filters (Horizontally scrollable on smaller widths) -->
      <div class="min-w-0 flex-1 overflow-x-auto no-scrollbar py-0.5">
        <BaseTabs
          v-model="selectedLevel"
          :tabs="levelTabs"
          class="!w-auto"
        />
      </div>

      <!-- Standard BaseTabs for Arrange Mode Toggle (Fixed pill aligned to right) -->
      <div class="shrink-0 flex items-center justify-start sm:justify-end">
        <BaseTabs
          v-model="arrangeByLevel"
          :tabs="arrangeModeTabs"
          class="!w-auto"
        />
      </div>
    </div>

    <!-- Skeleton Loading State -->
    <div v-if="loading" class="w-full overflow-x-auto rounded-2xl border border-primary-border bg-card-background p-4 animate-pulse space-y-3">
      <div v-for="n in 5" :key="n" class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-background" />
          <div class="h-3 w-36 bg-background rounded" />
        </div>
        <div class="h-3 w-24 bg-background rounded" />
        <div class="h-3 w-16 bg-background rounded" />
        <div class="h-3 w-10 bg-background rounded" />
      </div>
    </div>

    <!-- Content when loaded -->
    <template v-else>
      <!-- Standard DataTable View -->
      <div class="hidden md:block w-full overflow-x-auto rounded-2xl border border-primary-border bg-card-background p-1 sm:p-4">
        <table class="w-full text-xs border-collapse">
          <!-- Standard Header -->
          <thead class="bg-primary-border/25 rounded-xl overflow-hidden">
            <tr class="font-semibold text-secondary-text tracking-wide rounded-xl">
              <th class="py-3 px-4 text-left font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap pl-2.5 rounded-l-xl">
                IB ID / User ID
              </th>
              <th class="py-3 px-4 text-left font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap">
                Name / Email
              </th>
              <th class="py-3 px-4 text-left font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap">
                Referral Code
              </th>
              <th class="py-3 px-4 text-left font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap">
                Direct Clients
              </th>
              <th class="py-3 px-4 text-left font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap">
                Overall Clients
              </th>
              <th class="py-3 px-4 text-left font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap">
                Sub IBs
              </th>
              <th class="py-3 px-4 text-left font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap">
                Self Deposits
              </th>
              <th class="py-3 px-4 text-left font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap">
                Self Withdrawals
              </th>
              <th class="py-3 px-4 text-left font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap">
                Self Net Deposit
              </th>
              <th class="py-3 px-4 text-left font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap">
                Network Deposits
              </th>
              <th class="py-3 px-4 text-left font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap">
                Network Withdrawals
              </th>
              <th class="py-3 px-4 text-left font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap">
                Network Net Deposit
              </th>
              <th class="py-3 px-4 text-left font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap">
                Parent IB
              </th>
              <th class="py-3 px-4 text-left font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap">
                Split
              </th>
              <th class="py-3 px-4 text-left font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap">
                Level
              </th>
              <th class="py-3 px-4 text-right font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap pr-2.5 rounded-r-xl">
                Actions
              </th>
            </tr>
          </thead>

          <!-- Standard Body -->
          <tbody class="divide-y divide-primary-border/60 text-sm font-medium text-primary-text">
            <tr
              v-for="node in displayedRows"
              :key="node.ib_id || node.id || node.user_id"
              :class="[
                'transition-colors hover:bg-background/60',
                node.level > 0 ? 'bg-card-background/75' : ''
              ]"
            >
              <!-- IB ID / User ID -->
              <td class="py-3.5 px-4 align-middle font-medium text-primary-text whitespace-nowrap pl-2.5">
                <div>{{ node.ib_id || node.id || '—' }}</div>
                <div v-if="node.user_id" class="text-[10px] text-secondary-text font-normal">
                  User ID: {{ node.user_id }}
                </div>
              </td>

              <!-- Name / Email -->
              <td class="py-3.5 px-4 align-middle">
                <div class="text-primary-text font-medium text-xs">{{ node.name || '—' }}</div>
                <div class="text-secondary-text mt-0.5 text-[11px] font-normal">{{ node.email || '—' }}</div>
              </td>

              <!-- Referral Code -->
              <td class="py-3.5 px-4 align-middle text-primary-text text-xs">
                {{ node.referral_code || '—' }}
              </td>

              <!-- Direct Clients -->
              <td class="py-3.5 px-4 align-middle text-primary-text font-semibold text-xs">
                {{ node.total_clients ?? 0 }}
              </td>

              <!-- Overall Clients -->
              <td class="py-3.5 px-4 align-middle text-primary-text font-semibold text-xs">
                {{ node.total_overall_clients ?? 0 }}
              </td>

              <!-- Sub IBs -->
              <td class="py-3.5 px-4 align-middle text-primary-text font-semibold text-xs">
                {{ node.total_sub_ibs ?? node.children?.length ?? node.sub_ibs?.length ?? 0 }}
              </td>

              <!-- Self Deposits -->
              <td class="py-3.5 px-4 align-middle whitespace-nowrap">
                <div class="text-xs font-semibold text-primary-green tabular-nums">
                  ${{ fmtCurrency(node.transactions?.self?.deposit?.overall) }}
                </div>
                <div class="text-[10px] text-secondary-text font-normal mt-0.5">
                  <span>Real: ${{ fmtCurrency(node.transactions?.self?.deposit?.real) }}</span>
                  <span class="mx-1">·</span>
                  <span>Copy: ${{ fmtCurrency(node.transactions?.self?.deposit?.copy_trading ?? node.transactions?.self?.deposit?.copy) }}</span>
                </div>
              </td>

              <!-- Self Withdrawals -->
              <td class="py-3.5 px-4 align-middle whitespace-nowrap">
                <div class="text-xs font-semibold text-primary-red tabular-nums">
                  ${{ fmtCurrency(node.transactions?.self?.withdrawal?.overall) }}
                </div>
                <div class="text-[10px] text-secondary-text font-normal mt-0.5">
                  <span>Real: ${{ fmtCurrency(node.transactions?.self?.withdrawal?.real) }}</span>
                  <span class="mx-1">·</span>
                  <span>Copy: ${{ fmtCurrency(node.transactions?.self?.withdrawal?.copy_trading ?? node.transactions?.self?.withdrawal?.copy) }}</span>
                </div>
              </td>

              <!-- Self Net Deposit -->
              <td class="py-3.5 px-4 align-middle whitespace-nowrap">
                <div
                  class="text-xs font-semibold tabular-nums"
                  :class="netColorClass(calcNet(node.transactions?.self?.deposit, node.transactions?.self?.withdrawal).overall)"
                >
                  {{ fmtSignedCurrency(calcNet(node.transactions?.self?.deposit, node.transactions?.self?.withdrawal).overall) }}
                </div>
                <div class="text-[10px] text-secondary-text font-normal mt-0.5">
                  <span>Real: {{ fmtSignedCurrency(calcNet(node.transactions?.self?.deposit, node.transactions?.self?.withdrawal).real) }}</span>
                  <span class="mx-1">·</span>
                  <span>Copy: {{ fmtSignedCurrency(calcNet(node.transactions?.self?.deposit, node.transactions?.self?.withdrawal).copy_trading) }}</span>
                </div>
              </td>

              <!-- Network Deposits -->
              <td class="py-3.5 px-4 align-middle whitespace-nowrap">
                <div class="text-xs font-semibold text-primary-green tabular-nums">
                  ${{ fmtCurrency(node.transactions?.network?.deposit?.overall) }}
                </div>
                <div class="text-[10px] text-secondary-text font-normal mt-0.5">
                  <span>Real: ${{ fmtCurrency(node.transactions?.network?.deposit?.real) }}</span>
                  <span class="mx-1">·</span>
                  <span>Copy: ${{ fmtCurrency(node.transactions?.network?.deposit?.copy_trading ?? node.transactions?.network?.deposit?.copy) }}</span>
                </div>
              </td>

              <!-- Network Withdrawals -->
              <td class="py-3.5 px-4 align-middle whitespace-nowrap">
                <div class="text-xs font-semibold text-primary-red tabular-nums">
                  ${{ fmtCurrency(node.transactions?.network?.withdrawal?.overall) }}
                </div>
                <div class="text-[10px] text-secondary-text font-normal mt-0.5">
                  <span>Real: ${{ fmtCurrency(node.transactions?.network?.withdrawal?.real) }}</span>
                  <span class="mx-1">·</span>
                  <span>Copy: ${{ fmtCurrency(node.transactions?.network?.withdrawal?.copy_trading ?? node.transactions?.network?.withdrawal?.copy) }}</span>
                </div>
              </td>

              <!-- Network Net Deposit -->
              <td class="py-3.5 px-4 align-middle whitespace-nowrap">
                <div
                  class="text-xs font-semibold tabular-nums"
                  :class="netColorClass(calcNet(node.transactions?.network?.deposit, node.transactions?.network?.withdrawal).overall)"
                >
                  {{ fmtSignedCurrency(calcNet(node.transactions?.network?.deposit, node.transactions?.network?.withdrawal).overall) }}
                </div>
                <div class="text-[10px] text-secondary-text font-normal mt-0.5">
                  <span>Real: {{ fmtSignedCurrency(calcNet(node.transactions?.network?.deposit, node.transactions?.network?.withdrawal).real) }}</span>
                  <span class="mx-1">·</span>
                  <span>Copy: {{ fmtSignedCurrency(calcNet(node.transactions?.network?.deposit, node.transactions?.network?.withdrawal).copy_trading) }}</span>
                </div>
              </td>

              <!-- Parent IB -->
              <td class="py-3.5 px-4 align-middle text-xs">
                <template v-if="node.parent_name || node.parent_email">
                  <div class="text-primary-text font-medium">
                    {{ node.parent_name || node.parent_email }}
                  </div>
                  <div v-if="node.parent_name && node.parent_email" class="text-secondary-text mt-0.5 text-[10px] font-normal">
                    {{ node.parent_email }}
                  </div>
                </template>
                <div v-else-if="node.parent_ib_id" class="text-secondary-text">
                  {{ node.parent_ib_id }}
                </div>
                <div v-else class="text-secondary-text">-</div>
              </td>

              <!-- Split -->
              <td class="py-3.5 px-4 align-middle text-primary-text text-xs">
                {{ node.split_percentage ?? 0 }}%
              </td>

              <!-- Level badge -->
              <td class="py-3.5 px-4 align-middle">
                <span
                  class="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-background border border-primary-border text-secondary-text"
                >
                  L{{ node.level ?? 0 }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 align-middle text-right pr-2.5">
                <div class="flex items-center justify-end gap-1">
                  <Tooltip text="Assign Referral Link" position="end">
                    <button
                      class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors text-secondary-text hover:text-primary-text"
                      @click="emit('assign-referral', node)"
                    >
                      <Link class="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip text="View Performance & Lots" position="end">
                    <button
                      class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors text-secondary-text hover:text-primary-text"
                      @click="goToClientDetail(node.ib_id || node.id)"
                    >
                      <BarChart2 class="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip text="View Clients" position="end">
                    <button
                      class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors text-secondary-text hover:text-primary-text"
                      @click="goToIbClients(node.ib_id || node.id)"
                    >
                      <Users class="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>
              </td>
            </tr>

            <tr v-if="displayedRows.length === 0">
              <td colspan="16" class="py-6 px-4 text-center whitespace-normal">
                <EmptyState
                  title="No IB records found."
                  subtitle="No network records matching the selected level filter."
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards View -->
      <div class="md:hidden space-y-3">
        <div v-if="displayedRows.length === 0" class="p-6 text-center bg-card-background border border-primary-border rounded-2xl">
          <EmptyState
            title="No IB records found."
            subtitle="No network records matching the selected level filter."
          />
        </div>

        <div
          v-for="node in displayedRows"
          :key="node.ib_id || node.id || node.user_id"
          class="bg-card-background border border-primary-border rounded-2xl p-3.5 space-y-3 transition-all"
          :class="node.level > 0 ? 'border-l-4 border-l-primary/70' : ''"
          :style="{ marginLeft: `${Math.min(node.level || 0, 3) * 6}px` }"
        >
          <!-- Card Header: Avatar, Name & Email, Level badge, Actions -->
          <div class="flex items-center justify-between gap-2 border-b border-primary-border/60 pb-2.5">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-black shrink-0">
                {{ (node.name || node.email || 'I').charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-primary-text truncate">
                  {{ node.name || '—' }}
                </p>
                <p class="text-[11px] text-secondary-text truncate">
                  {{ node.email || '—' }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <span class="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-background border border-primary-border text-secondary-text">
                L{{ node.level ?? 0 }}
              </span>
              <button
                type="button"
                class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-200"
                :class="showDetails[node.ib_id || node.id]
                  ? 'bg-primary/15 border-primary/50 text-primary'
                  : 'bg-background border-primary-border text-secondary-text hover:text-primary-text'"
                :title="showDetails[node.ib_id || node.id] ? 'Hide Details' : 'Show Details'"
                @click="toggleDetails(node.ib_id || node.id)"
              >
                <EyeOff v-if="showDetails[node.ib_id || node.id]" class="w-3.5 h-3.5" />
                <Eye v-else class="w-3.5 h-3.5" />
              </button>
              <button
                class="w-7 h-7 flex items-center justify-center rounded-lg bg-background border border-primary-border text-secondary-text hover:text-primary-text transition-colors"
                title="Assign Referral Link"
                @click="emit('assign-referral', node)"
              >
                <Link class="w-3.5 h-3.5" />
              </button>
              <button
                class="w-7 h-7 flex items-center justify-center rounded-lg bg-background border border-primary-border text-secondary-text hover:text-primary-text transition-colors"
                title="View Performance & Lots"
                @click="goToClientDetail(node.ib_id || node.id)"
              >
                <BarChart2 class="w-3.5 h-3.5" />
              </button>
              <button
                class="w-7 h-7 flex items-center justify-center rounded-lg bg-background border border-primary-border text-secondary-text hover:text-primary-text transition-colors"
                title="View Clients"
                @click="goToIbClients(node.ib_id || node.id)"
              >
                <Users class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Details Section (Shown when Eye button is toggled) -->
          <div v-if="showDetails[node.ib_id || node.id]" class="space-y-3 pt-1 border-t border-primary-border/40">
            <!-- Meta Info -->
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-secondary-text">
              <span><strong class="text-primary-text font-medium">IB ID:</strong> {{ node.ib_id || node.id || '—' }}</span>
              <span v-if="node.user_id" class="text-primary-border">|</span>
              <span v-if="node.user_id"><strong class="text-primary-text font-medium">User ID:</strong> {{ node.user_id }}</span>
              <span class="text-primary-border">|</span>
              <span><strong class="text-primary-text font-medium">Code:</strong> {{ node.referral_code || '—' }}</span>
              <span v-if="node.parent_ib_id" class="text-primary-border">|</span>
              <span v-if="node.parent_ib_id"><strong class="text-primary-text font-medium">Parent:</strong> {{ node.parent_ib_id }}</span>
            </div>

            <!-- Core Counts Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div class="bg-background border border-primary-border/60 rounded-lg p-2 text-center">
                <span class="text-[10px] text-secondary-text uppercase tracking-wider block">Direct Clients</span>
                <span class="font-semibold text-primary-text mt-0.5 block">{{ node.total_clients ?? 0 }}</span>
              </div>
              <div class="bg-background border border-primary-border/60 rounded-lg p-2 text-center">
                <span class="text-[10px] text-secondary-text uppercase tracking-wider block">Overall Clients</span>
                <span class="font-semibold text-primary-text mt-0.5 block">{{ node.total_overall_clients ?? 0 }}</span>
              </div>
              <div class="bg-background border border-primary-border/60 rounded-lg p-2 text-center">
                <span class="text-[10px] text-secondary-text uppercase tracking-wider block">Sub IBs</span>
                <span class="font-semibold text-primary-text mt-0.5 block">{{ node.total_sub_ibs ?? node.children?.length ?? node.sub_ibs?.length ?? 0 }}</span>
              </div>
              <div class="bg-background border border-primary-border/60 rounded-lg p-2 text-center">
                <span class="text-[10px] text-secondary-text uppercase tracking-wider block">Split</span>
                <span class="font-semibold text-primary-text mt-0.5 block">{{ node.split_percentage ?? 0 }}%</span>
              </div>
            </div>

            <!-- Self & Network Transactions Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              <!-- Self Tx -->
              <div class="bg-background border border-primary-border/60 rounded-lg p-2.5 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Self Tx</span>
                  <span
                    class="text-xs font-bold tabular-nums"
                    :class="netColorClass(calcNet(node.transactions?.self?.deposit, node.transactions?.self?.withdrawal).overall)"
                  >
                    {{ fmtSignedCurrency(calcNet(node.transactions?.self?.deposit, node.transactions?.self?.withdrawal).overall) }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-primary-green font-medium">+${{ fmtCurrency(node.transactions?.self?.deposit?.overall) }}</span>
                  <span class="text-primary-red font-medium">-${{ fmtCurrency(node.transactions?.self?.withdrawal?.overall) }}</span>
                </div>
                <div class="flex items-center justify-between text-[10px] text-secondary-text pt-1 border-t border-primary-border/40">
                  <span>Real: {{ fmtSignedCurrency(calcNet(node.transactions?.self?.deposit, node.transactions?.self?.withdrawal).real) }}</span>
                  <span>Copy: {{ fmtSignedCurrency(calcNet(node.transactions?.self?.deposit, node.transactions?.self?.withdrawal).copy_trading) }}</span>
                </div>
              </div>

              <!-- Network Tx -->
              <div class="bg-background border border-primary-border/60 rounded-lg p-2.5 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Network Tx</span>
                  <span
                    class="text-xs font-bold tabular-nums"
                    :class="netColorClass(calcNet(node.transactions?.network?.deposit, node.transactions?.network?.withdrawal).overall)"
                  >
                    {{ fmtSignedCurrency(calcNet(node.transactions?.network?.deposit, node.transactions?.network?.withdrawal).overall) }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-primary-green font-medium">+${{ fmtCurrency(node.transactions?.network?.deposit?.overall) }}</span>
                  <span class="text-primary-red font-medium">-${{ fmtCurrency(node.transactions?.network?.withdrawal?.overall) }}</span>
                </div>
                <div class="flex items-center justify-between text-[10px] text-secondary-text pt-1 border-t border-primary-border/40">
                  <span>Real: {{ fmtSignedCurrency(calcNet(node.transactions?.network?.deposit, node.transactions?.network?.withdrawal).real) }}</span>
                  <span>Copy: {{ fmtSignedCurrency(calcNet(node.transactions?.network?.deposit, node.transactions?.network?.withdrawal).copy_trading) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
