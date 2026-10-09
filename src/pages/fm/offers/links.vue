<template>
  <div class="space-y-6 pb-8">    <!-- Active Offer Content -->
    <template v-if="activeOffer">
      <!-- Offer Overview -->
      <div class="bg-card-background rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-primary-text">Offer Overview</h3>
            <p class="text-xs text-secondary-text mt-0.5">Offer code and activity</p>
          </div>
          <span
            class="text-2xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
            :class="activeOffer.is_active ? 'bg-primary-green/10 text-primary-green' : 'bg-primary-red/10 text-primary-red'"
          >{{ activeOffer.is_active ? 'Active' : 'Inactive' }}</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-primary-border/20 pt-4">
          <div class="bg-background rounded-xl p-3">
            <p class="text-2xs uppercase tracking-widest text-secondary-text">Offer Code</p>
            <p class="text-sm font-bold text-primary-text mt-0.5 font-mono">{{ activeOffer.offer_code || '—' }}</p>
          </div>
          <div class="bg-background rounded-xl p-3">
            <p class="text-2xs uppercase tracking-widest text-secondary-text">Subscribers</p>
            <p class="text-sm font-bold text-primary-text mt-0.5">{{ activeOffer.subscribers_count ?? 0 }}</p>
          </div>
          <div class="bg-background rounded-xl p-3">
            <p class="text-2xs uppercase tracking-widest text-secondary-text">Join Links</p>
            <p class="text-sm font-bold text-primary-text mt-0.5">{{ activeOffer.join_link_count ?? 0 }}</p>
          </div>
          <div class="bg-background rounded-xl p-3">
            <p class="text-2xs uppercase tracking-widest text-secondary-text">Fees Collected</p>
            <p class="text-sm font-bold text-primary-text mt-0.5">${{ fmt(activeOffer.total_fees_collected) }}</p>
          </div>
        </div>
      </div>

      <!-- Common Information -->
      <div class="bg-card-background rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-primary-text">Common Information</h3>
            <p class="text-xs text-secondary-text mt-0.5">Offer's settings</p>
          </div>
          <button
            @click="openEditInfoDialog('common')"
            class="px-4 py-1.5 rounded-full border border-primary-border text-xs font-semibold text-primary-text cursor-pointer"
          >
            Edit
          </button>
        </div>

        <div class="divide-y divide-primary-border/20 border-t border-primary-border/20 pt-2">
          <div class="flex items-center justify-between py-3">
            <span class="text-xs font-medium text-secondary-text">Title</span>
            <span class="text-xs font-semibold text-primary-text">{{ activeOffer.name }}</span>
          </div>
          <div class="flex items-center justify-between py-3">
            <span class="text-xs font-medium text-secondary-text">Visibility</span>
            <span
              class="inline-flex items-center gap-1.5 text-2xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border"
              :class="
                activeOffer.visibility === 'public'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              "
            >
              <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
              {{ activeOffer.visibility }}
            </span>
          </div>
          <div class="flex items-center justify-between py-3">
            <span class="text-xs font-medium text-secondary-text">Summary</span>
            <span class="text-xs text-primary-text">{{ activeOffer.summary || activeOffer.description || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Fees Section -->
      <div class="bg-card-background rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-primary-text">Fees Structure</h3>
            <p class="text-xs text-secondary-text mt-0.5">Fees configured for this offer</p>
          </div>
          <button
            @click="openEditInfoDialog('fees')"
            class="px-4 py-1.5 rounded-full border border-primary-border text-xs font-semibold text-primary-text cursor-pointer"
          >
            Edit
          </button>
        </div>

        <div class="divide-y divide-primary-border/20 border-t border-primary-border/20 pt-2">
          <div class="flex items-center justify-between py-3">
            <span class="text-xs font-medium text-secondary-text">Performance Fee</span>
            <span class="text-xs font-semibold text-primary-text">{{ activeOffer.performance_fee }}%</span>
          </div>
          <div class="flex items-center justify-between py-3">
            <span class="text-xs font-medium text-secondary-text">Management Fee</span>
            <span class="text-xs font-semibold text-primary-text">{{ activeOffer.management_fee }}%</span>
          </div>
          <div class="flex items-center justify-between py-3">
            <span class="text-xs font-medium text-secondary-text">Registration Fee</span>
            <span class="text-xs font-semibold text-primary-text">${{ fmt(activeOffer.registration_fee) }}</span>
          </div>
          <div class="flex items-center justify-between py-3">
            <span class="text-xs font-medium text-secondary-text">Performance Fee Share Mode</span>
            <span class="text-xs font-semibold text-primary-text capitalize">{{ activeOffer.pf_share_mode || 'broker' }}</span>
          </div>
          <div v-if="activeOffer.pf_share_mode === 'fm'" class="py-3 space-y-2">
            <div class="flex items-center justify-between py-2 mb-2 border-b border-primary-border/20">
              <span class="text-xs font-medium text-secondary-text">Broker Share</span>
              <span class="text-xs font-semibold text-primary-text">{{ formatShare(activeOffer.pf_broker_share) }}</span>
            </div>
            <p class="text-xs font-medium text-secondary-text">Additional Agents</p>
            <div
              v-for="recipient in (activeOffer.pf_share_recipients || [])"
              :key="recipient.id ?? `${recipient.destination_type}-${recipient.trading_account_id}-${recipient.wallet_id}`"
              class="flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2"
            >
              <div class="min-w-0">
                <p class="text-xs font-semibold text-primary-text truncate">{{ formatRecipient(recipient) }}</p>
                <p class="text-2xs text-secondary-text capitalize">{{ recipient.destination_type?.replaceAll('_', ' ') || 'Recipient' }}</p>
              </div>
              <span class="text-xs font-semibold text-primary-text shrink-0">{{ formatShare(recipient.share_percentage) }}</span>
            </div>
            <p v-if="!activeOffer.pf_share_recipients?.length" class="text-xs text-secondary-text">No additional agents configured</p>
          </div>
          <div v-else class="flex items-center justify-between py-3">
            <span class="text-xs font-medium text-secondary-text">Broker Share</span>
            <span class="text-xs font-semibold text-primary-text">{{ formatShare(activeOffer.pf_broker_share) }}</span>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="bg-card-background rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-primary-text">Filters</h3>
            <p class="text-xs text-secondary-text mt-0.5">Setting up limitations for followers</p>
          </div>
          <button
            @click="openEditInfoDialog('filters')"
            class="px-4 py-1.5 rounded-full border border-primary-border text-xs font-semibold text-primary-text cursor-pointer"
          >
            Edit
          </button>
        </div>

        <div class="divide-y divide-primary-border/20 border-t border-primary-border/20 pt-2">
          <div class="flex items-center justify-between py-3">
            <span class="text-xs font-medium text-secondary-text">Minimum Balance</span>
            <span class="text-xs font-semibold text-primary-text">${{ fmt(activeOffer.minimum_balance) }}</span>
          </div>
        </div>
      </div>

      <!-- Additional Agents Section -->
      <div class="bg-card-background rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-primary-text">Additional Agents</h3>
            <p class="text-xs text-secondary-text mt-0.5">Setting up additional agents & revenue sharing</p>
          </div>
          <button
            class="flex items-center gap-1.5 px-4 py-2 rounded-full bg-button text-button-text text-xs font-semibold cursor-pointer"
            @click="openCreateAgentDialog"
          >
            <Plus class="w-3.5 h-3.5" /> Add Agent
          </button>
        </div>

        <!-- Share Summary Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-primary-border/20 pt-4">
          <div class="bg-background rounded-xl p-3">
            <p class="text-2xs uppercase tracking-widest text-secondary-text">Total Share</p>
            <p class="text-sm font-bold text-primary-text mt-0.5">{{ formatShare(store.agentsSummary.total_share) }}</p>
          </div>
          <div class="bg-background rounded-xl p-3">
            <p class="text-2xs uppercase tracking-widest text-secondary-text">Remaining Share</p>
            <p class="text-sm font-bold text-primary-text mt-0.5">{{ formatShare(store.agentsSummary.remaining_share) }}</p>
          </div>
        </div>

        <!-- Agents Table -->
        <div class="overflow-x-auto border-t border-primary-border/20 pt-2">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-background/30">
                <th class="text-left text-2xs font-semibold text-secondary-text uppercase tracking-widest py-3 px-3">Account Number</th>
                <th class="text-left text-2xs font-semibold text-secondary-text uppercase tracking-widest py-3 px-3">Broker Label</th>
                <th class="text-left text-2xs font-semibold text-secondary-text uppercase tracking-widest py-3 px-3">Share</th>
                <th class="text-left text-2xs font-semibold text-secondary-text uppercase tracking-widest py-3 px-3">Status</th>
                <th class="text-left text-2xs font-semibold text-secondary-text uppercase tracking-widest py-3 px-3">Created</th>
                <th class="text-right text-2xs font-semibold text-secondary-text uppercase tracking-widest py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody v-if="store.agentsLoading">
              <tr>
                <td colspan="6" class="py-6 text-center text-xs text-secondary-text">
                  <div class="flex items-center justify-center gap-2">
                    <Loader2 class="w-4 h-4 animate-spin opacity-40" /> Loading additional agents...
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="store.agents.length === 0">
              <tr>
                <td colspan="6" class="py-6 text-center text-xs text-secondary-text">
                  No additional agents assigned
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr
                v-for="agent in store.agents"
                :key="agent.id ?? `${agent.trading_account_id}-${agent.share_percentage}`"
                class="hover:bg-background/40 transition-colors"
              >
                <td class="py-3 px-3">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-lg bg-primary-blue/10 flex items-center justify-center shrink-0">
                      <Users class="w-3.5 h-3.5 text-primary-blue" />
                    </div>
                    <span class="text-xs font-bold text-primary-text">{{ formatAgentAccount(agent) }}</span>
                  </div>
                </td>
                <td class="py-3 px-3 text-xs text-secondary-text">
                  {{ agent.broker_label || '—' }}
                </td>
                <td class="py-3 px-3 text-xs font-semibold text-primary-text">
                  {{ formatShare(agent.share_percentage) }}
                </td>
                <td class="py-3 px-3">
                  <span
                    class="text-2xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                    :class="agent.is_active ? 'bg-primary-green/10 text-primary-green' : 'bg-primary-red/10 text-primary-red'"
                  >
                    {{ agent.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="py-3 px-3 text-xs text-secondary-text">
                  {{ formatDate(agent.created_at) }}
                </td>
                <td class="py-3 px-3 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      class="p-1.5 rounded-lg bg-background hover:bg-primary-blue/10 text-secondary-text hover:text-primary-blue transition-colors cursor-pointer"
                      @click="openEditAgentDialog(agent)"
                      title="Edit Agent"
                    >
                      <Pencil class="w-3.5 h-3.5" />
                    </button>
                    <button
                      class="p-1.5 rounded-lg bg-background hover:bg-primary-red/10 text-secondary-text hover:text-primary-red transition-colors cursor-pointer"
                      @click="confirmDeleteAgent(agent)"
                      title="Delete Agent"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Offer's Join Links Section -->
    <div class="bg-card-background rounded-2xl p-5 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-primary-text">Offer's Join Links</h3>
          <p class="text-xs text-secondary-text mt-0.5">
Setting up the offer's join links. Join link is the only way to follow a private provider.

          </p>
        </div>

        <button
          class="flex items-center gap-1.5 px-4 py-2 rounded-full bg-button text-button-text text-xs font-semibold cursor-pointer"
          @click="openCreateJoinLinkDialog"
        >
          <Plus class="w-3.5 h-3.5" /> Create Link
        </button>
      </div>

      <!-- Loading Skeleton -->
      <template v-if="store.linksLoading">
        <div class="pt-2 space-y-2">
          <div v-for="n in 3" :key="n" class="h-10 bg-background rounded-xl animate-pulse" />
        </div>
      </template>

      <!-- Empty -->
      <div v-else-if="store.joinLinks.length === 0" class="py-8 flex flex-col items-center gap-2 border-t border-primary-border/20">
        <Link2 class="w-6 h-6 text-secondary-text opacity-40" />
        <p class="text-xs text-secondary-text">No join links created yet</p>
      </div>

      <!-- Table View -->
      <div v-else class="overflow-x-auto border-t border-primary-border/20 pt-2">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-background/30">
              <th class="text-left text-2xs font-semibold text-secondary-text uppercase tracking-widest py-3 px-3">Title / Code</th>
              <th class="text-left text-2xs font-semibold text-secondary-text uppercase tracking-widest py-3 px-3">Expiration</th>
              <th class="text-left text-2xs font-semibold text-secondary-text uppercase tracking-widest py-3 px-3">Status</th>
              <th class="text-left text-2xs font-semibold text-secondary-text uppercase tracking-widest py-3 px-3">Usage</th>
              <th class="text-right text-2xs font-semibold text-secondary-text uppercase tracking-widest py-3 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="link in store.joinLinks"
              :key="link.id"
              class="hover:bg-background/40 transition-colors"
            >
              <td class="py-3 px-3">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-lg bg-primary-blue/10 flex items-center justify-center shrink-0">
                    <Link2 class="w-3.5 h-3.5 text-primary-blue" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-primary-text truncate">{{ link.title }}</p>
                    <p class="text-2xs text-secondary-text font-mono mt-0.5">{{ link.link_code }}</p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-3 text-xs text-secondary-text">
                {{ link.expires_at ? formatDate(link.expires_at) : 'No expiration' }}
              </td>
              <td class="py-3 px-3">
                <span
                  class="text-2xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                  :class="
                    link.is_active
                      ? 'bg-primary-green/10 text-primary-green'
                      : 'bg-primary-red/10 text-primary-red'
                  "
                >
                  {{ link.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="py-3 px-3 text-xs font-medium text-primary-text">
                {{ link.max_uses ? `${link.used_count}/${link.max_uses}` : 'Unlimited' }}
              </td>
              <td class="py-3 px-3 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    class="p-1.5 rounded-lg bg-background hover:bg-primary-blue/10 text-secondary-text hover:text-primary-blue transition-colors cursor-pointer"
                    @click="copyLink(link.share_url)"
                    title="Copy link"
                  >
                    <Copy class="w-3.5 h-3.5" />
                  </button>
                  <button
                    class="p-1.5 rounded-lg bg-background hover:bg-primary-blue/10 text-secondary-text hover:text-primary-blue transition-colors cursor-pointer"
                    @click="openEditJoinLinkDialog(link)"
                    title="Edit link"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    class="p-1.5 rounded-lg bg-background hover:bg-primary-red/10 text-secondary-text hover:text-primary-red transition-colors cursor-pointer"
                    @click="confirmDeleteLink(link)"
                    title="Delete link"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dialogs -->
    <EditOfferInfoDialog
      v-if="activeOffer && editingSection"
      :open="editInfoDialogOpen"
      :section="editingSection"
      :offer-id="offerId"
      :offer="activeOffer"
      @close="closeEditInfoDialog"
      @updated="handleOfferUpdate"
    />

    <CreateJoinLinkDialog
      :open="joinLinkDialogOpen"
      :offer-id="offerId"
      :edit-link="editingLink"
      @close="closeJoinLinkDialog"
    />

    <CreateAgentDialog
      :open="agentDialogOpen"
      :offer-id="offerId"
      @close="closeCreateAgentDialog"
    />

    <EditAgentDialog
      :open="agentEditDialogOpen"
      :offer-id="offerId"
      :agent="editingAgent"
      @close="closeEditAgentDialog"
    />

    <DeleteAgentConfirmationDialog
      :open="!!deleteAgentTarget"
      :agent="deleteAgentTarget"
      :loading="store.deleteAgentLoading"
      @close="deleteAgentTarget = null"
      @confirm="doDeleteAgent"
    />

    <!-- Delete Link Confirmation Modal -->
    <div
      v-if="deleteLinkTarget"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      @click.self="deleteLinkTarget = null"
    >
      <div class="bg-card-background rounded-2xl border border-primary-border w-full max-w-sm p-5 space-y-4">
        <div class="flex items-center gap-2">
          <Trash2 class="w-4 h-4 text-primary-red" />
          <h2 class="text-sm font-bold text-primary-text">Delete Join Link</h2>
        </div>
        <p class="text-xs text-secondary-text leading-relaxed">
          Are you sure you want to delete <span class="font-bold text-primary-text">"{{ deleteLinkTarget.title }}"</span>? This action cannot be undone.
        </p>
        <div class="flex gap-3 pt-2">
          <button
            class="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium text-secondary-text border border-primary-border hover:bg-background transition-colors cursor-pointer"
            @click="deleteLinkTarget = null"
          >
            Cancel
          </button>
          <button
            :disabled="store.deleteLinkLoading"
            class="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary-red hover:bg-primary-red/90 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            @click="doDeleteLink"
          >
            <Loader2 v-if="store.deleteLinkLoading" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ store.deleteLinkLoading ? 'Deleting...' : 'Delete' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Plus,
  Link2,
  Copy,
  Trash2,
  Pencil,
  Users,
  Loader2,
} from 'lucide-vue-next'
import { useFmOffersStore } from '@/stores/fm/offers'
import { useSnackbarStore } from '@/stores/shared/snackbar'

import EditOfferInfoDialog from '@/components/fm/offers/EditOfferInfoDialog.vue'
import CreateJoinLinkDialog from '@/components/fm/offers/CreateJoinLinkDialog.vue'
import CreateAgentDialog from '@/components/fm/offers/CreateAgentDialog.vue'
import EditAgentDialog from '@/components/fm/offers/EditAgentDialog.vue'
import DeleteAgentConfirmationDialog from '@/components/fm/offers/DeleteAgentConfirmationDialog.vue'

const store = useFmOffersStore()
const route = useRoute()
const router = useRouter()
const snackbar = useSnackbarStore()

const offerId = computed(() => route.params.id)
const storedActiveOffer = ref(null)

const activeOffer = computed(() => {
  const currentOffer = store.offers.find((offer) => String(offer.id) === String(offerId.value))
  if (currentOffer) return currentOffer

  if (storedActiveOffer.value && String(storedActiveOffer.value.id) === String(offerId.value)) {
    return storedActiveOffer.value
  }

  return null
})

// Dialog States
const editInfoDialogOpen = ref(false)
const editingSection = ref(null)

const joinLinkDialogOpen = ref(false)
const editingLink = ref(null)
const deleteLinkTarget = ref(null)

const agentDialogOpen = ref(false)
const agentEditDialogOpen = ref(false)
const editingAgent = ref(null)
const deleteAgentTarget = ref(null)

// Section Info Edit
const openEditInfoDialog = (section) => {
  if (!activeOffer.value) {
    snackbar.show('Offer data not available.', 'error')
    return
  }
  editingSection.value = section
  editInfoDialogOpen.value = true
}

const closeEditInfoDialog = () => {
  editInfoDialogOpen.value = false
  editingSection.value = null
}

const handleOfferUpdate = () => {
  store.fetchOffers(true)
}

// Join Link Actions
const openCreateJoinLinkDialog = () => {
  if (!activeOffer.value) {
    snackbar.show('Offer details not loaded.', 'error')
    return
  }
  editingLink.value = null
  joinLinkDialogOpen.value = true
}

const openEditJoinLinkDialog = (link) => {
  editingLink.value = { ...link }
  joinLinkDialogOpen.value = true
}

const closeJoinLinkDialog = () => {
  joinLinkDialogOpen.value = false
  editingLink.value = null
}

const confirmDeleteLink = (link) => {
  deleteLinkTarget.value = link
}

const doDeleteLink = () => {
  if (!deleteLinkTarget.value) return
  store.deleteJoinLink(offerId.value, deleteLinkTarget.value.id, () => {
    deleteLinkTarget.value = null
  })
}

// Agent Actions
const openCreateAgentDialog = () => {
  agentDialogOpen.value = true
}

const closeCreateAgentDialog = () => {
  agentDialogOpen.value = false
}

const openEditAgentDialog = (agent) => {
  editingAgent.value = agent
  agentEditDialogOpen.value = true
}

const closeEditAgentDialog = () => {
  agentEditDialogOpen.value = false
  editingAgent.value = null
}

const confirmDeleteAgent = (agent) => {
  deleteAgentTarget.value = agent
}

const doDeleteAgent = () => {
  if (!deleteAgentTarget.value) return
  store.deleteAgent(offerId.value, deleteAgentTarget.value.id, () => {
    deleteAgentTarget.value = null
  })
}

const copyLink = async (url) => {
  try {
    const origin = window.location.origin
    const fullUrl = `${origin}${url || ''}`

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(fullUrl)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = fullUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    snackbar.show('Link copied to clipboard.', 'success')
  } catch (err) {
    snackbar.show('Failed to copy link.', 'error')
  }
}

const fmt = (v) =>
  (v ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const formatAgentAccount = (agent) => {
  return agent?.trading_account_id
    ?? agent?.account_number
    ?? agent?.trading_account?.account_number
    ?? '—'
}

const formatRecipient = (recipient) => {
  if (recipient?.destination_type === 'wallet') return recipient.wallet_id ? `Wallet #${recipient.wallet_id}` : 'Wallet'
  return recipient?.account_number
    ?? recipient?.trading_account_id
    ?? 'Trading account'
}

const formatShare = (share) => {
  if (share === null || share === undefined || share === '') return '—'
  return `${Number(share)}%`
}

const formatDate = (val) =>
  val
    ? new Date(val).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'

onMounted(() => {
  store.fetchOffers(true)
  if (offerId.value) {
    store.fetchJoinLinks(offerId.value)
    store.fetchAgents(offerId.value)
  }
  try {
    storedActiveOffer.value = JSON.parse(localStorage.getItem('active_offer') || 'null')
  } catch {
    storedActiveOffer.value = null
  }
})
</script>
