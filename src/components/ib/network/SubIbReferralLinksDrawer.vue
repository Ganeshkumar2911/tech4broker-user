<script setup>
import { ref, computed, watch } from 'vue'
import { X, Plus, Pencil, Copy } from 'lucide-vue-next'
import BaseSearch from '@/components/base/BaseSearch.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ReferralLinkDrawer from '@/components/ib/network/ReferralLinkDrawer.vue'
import { useIbReferralLinksStore } from '@/stores/ib/referralLinks'
import { useSnackbarStore } from '@/stores/shared/snackbar'

const props = defineProps({
  open: { type: Boolean, default: false },
  node: { type: Object, default: null }
})

const emit = defineEmits(['close', 'create-campaign', 'edit-campaign'])

const store = useIbReferralLinksStore()
const snackbar = useSnackbarStore()
const searchQuery = ref('')

const referralDrawer = ref({
  open: false,
  isEdit: false,
  editData: null
})

const openCreateCampaign = () => {
  referralDrawer.value = {
    open: true,
    isEdit: false,
    editData: null
  }
  emit('create-campaign', props.node?.ib_id || props.node?.id)
}

const openEditCampaign = (item) => {
  referralDrawer.value = {
    open: true,
    isEdit: true,
    editData: item
  }
  emit('edit-campaign', { ibId: props.node?.ib_id || props.node?.id, item })
}

const closeReferralDrawer = () => {
  referralDrawer.value.open = false
}

const onCampaignSuccess = () => {
  if (props.node?.ib_id || props.node?.id) {
    store.fetchReferralLinks(props.node.ib_id || props.node.id)
  }
}

const getReferralUrl = (code) => {
  return `https://portal.panthercapitals.com/register?ref=${code || ''}`
}

const copyUrl = (text) => {
  if (!text) return
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => {
        snackbar.show('Referral URL copied to clipboard!', 'success')
      })
      .catch(() => {
        snackbar.show('Failed to copy to clipboard.', 'error')
      })
  } else {
    const input = document.createElement('input')
    input.value = text
    document.body.appendChild(input)
    input.select()
    try {
      document.execCommand('copy')
      snackbar.show('Referral URL copied to clipboard!', 'success')
    } catch (err) {
      snackbar.show('Failed to copy to clipboard.', 'error')
    }
    document.body.removeChild(input)
  }
}

const filteredCampaigns = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return store.records
  return store.records.filter(c =>
    c.name?.toLowerCase().includes(query) ||
    c.code?.toLowerCase().includes(query)
  )
})

watch(() => props.open, (val) => {
  if (val && (props.node?.ib_id || props.node?.id)) {
    searchQuery.value = ''
    store.fetchReferralLinks(props.node.ib_id || props.node.id)
  }
})
</script>

<template>
  <div>
    <!-- Backdrop Overlay -->
    <Transition name="backdrop">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] bg-black/45 backdrop-blur-xs cursor-pointer"
        @click="emit('close')"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="drawer">
      <div
        v-if="open"
        class="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-lg bg-card-background border-l border-primary-border flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-primary-border flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-primary-text">
              Referral Campaigns
            </h3>
            <p class="text-[11px] text-secondary-text mt-0.5" v-if="node">
              Manage campaign links for {{ node.name || node.email }} (ID: {{ node.ib_id || node.id }})
            </p>
          </div>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background text-secondary-text hover:text-primary-text transition cursor-pointer"
            @click="emit('close')"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4 no-scrollbar">
          <!-- Action row using BaseSearch -->
          <div class="flex items-center gap-3 justify-between">
            <BaseSearch
              v-model="searchQuery"
              placeholder="Filter by name or code..."
              rounded="full"
              variant="background"
              height="38px"
              class="flex-1"
            />
            <button
              class="h-[38px] px-4 rounded-full bg-button text-button-text font-semibold text-xs transition cursor-pointer shrink-0 hover:opacity-90 flex items-center gap-1.5"
              @click="openCreateCampaign"
            >
              <Plus :size="14" />
              <span>Create Campaign</span>
            </button>
          </div>

          <!-- Loading state -->
          <div v-if="store.loading" class="space-y-3 py-6">
            <div v-for="n in 3" :key="n" class="rounded-2xl p-4 bg-background animate-pulse space-y-2.5">
              <div class="flex justify-between">
                <div class="h-4 w-32 bg-primary-border/60 rounded" />
                <div class="h-4 w-12 bg-primary-border/60 rounded-full" />
              </div>
              <div class="h-3 w-48 bg-primary-border/60 rounded" />
              <div class="h-7 w-full bg-primary-border/60 rounded-lg" />
            </div>
          </div>

          <!-- Standard EmptyState component -->
          <EmptyState
            v-else-if="filteredCampaigns.length === 0"
            title="No Campaigns Found"
            subtitle="Create customizable tracking links for this IB to assign to their client signups."
            class="py-12"
          >
            <button
              class="mt-3 px-4 py-2 rounded-full bg-button text-button-text font-semibold text-xs transition cursor-pointer inline-flex items-center gap-1.5 hover:opacity-90"
              @click="openCreateCampaign"
            >
              <Plus :size="14" />
              <span>Create First Campaign</span>
            </button>
          </EmptyState>

          <!-- Borderless Campaign list -->
          <div v-else class="space-y-3">
            <div
              v-for="item in filteredCampaigns"
              :key="item.id"
              class="rounded-2xl p-4 bg-background hover:bg-background/80 transition-all duration-200 space-y-3"
            >
              <!-- Name & Edit -->
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h4 class="text-xs font-bold text-primary-text truncate">{{ item.name }}</h4>
                  <p class="text-[10px] text-secondary-text mt-0.5 line-clamp-2" :title="item.description">
                    {{ item.description || 'No description provided.' }}
                  </p>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <span
                    class="text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-0.5"
                    :class="item.is_active !== false
                      ? 'bg-primary-green/15 text-primary-green'
                      : 'bg-primary-red/15 text-primary-red'"
                  >
                    {{ item.is_active !== false ? 'Active' : 'Inactive' }}
                  </span>
                  <button
                    class="w-7 h-7 flex items-center justify-center rounded-lg bg-card-background hover:bg-primary-border/30 transition text-secondary-text hover:text-primary-text cursor-pointer"
                    title="Edit Campaign"
                    @click="openEditCampaign(item)"
                  >
                    <Pencil :size="13" />
                  </button>
                </div>
              </div>

              <!-- Referral URL & Copy (Borderless) -->
              <div class="flex items-center gap-2 p-2.5 bg-card-background rounded-xl">
                <span class="text-[10px] font-mono font-bold bg-background px-2 py-0.5 rounded-lg text-primary-text truncate max-w-[90px]">
                  {{ item.code }}
                </span>
                <span class="text-[10px] text-secondary-text truncate flex-1 font-mono">
                  {{ getReferralUrl(item.code) }}
                </span>
                <button
                  class="p-1.5 rounded-lg hover:bg-background text-secondary-text hover:text-primary-text transition cursor-pointer"
                  title="Copy Link"
                  @click="copyUrl(getReferralUrl(item.code))"
                >
                  <Copy :size="13" />
                </button>
              </div>

              <!-- Attached Groups (Borderless) -->
              <div v-if="item.groups && item.groups.length > 0" class="space-y-1">
                <span class="text-[9px] font-semibold text-secondary-text uppercase tracking-wider block">Group Configurations</span>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="grp in item.groups"
                    :key="grp.id"
                    class="inline-flex items-center text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-primary-blue/10 text-primary-blue"
                  >
                    {{ grp.label }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-primary-border bg-card-background flex justify-end">
          <button
            class="px-4 py-2 rounded-full text-xs font-medium text-secondary-text bg-background hover:text-primary-text transition-colors cursor-pointer"
            @click="emit('close')"
          >
            Close
          </button>
        </div>
      </div>
    </Transition>

    <!-- Create / Edit Referral Campaign Drawer -->
    <ReferralLinkDrawer
      :open="referralDrawer.open"
      :is-edit="referralDrawer.isEdit"
      :edit-data="referralDrawer.editData"
      :ib-id="node?.ib_id || node?.id || ''"
      @close="closeReferralDrawer"
      @success="onCampaignSuccess"
    />
  </div>
</template>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.25s ease-out;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
</style>
