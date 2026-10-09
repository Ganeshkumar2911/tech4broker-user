<template>
  <Transition name="fade-slide">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[99999] bg-background text-primary-text flex flex-col font-sans select-none overflow-hidden"
    >
      <!-- Sticky Header -->
      <div class="px-5 pt-5 pb-4 flex items-center justify-between bg-background border-b border-primary-border shrink-0">
        <div class="flex items-center gap-3">
          <!-- Back Button (Circular Grey) -->
          <button
            type="button"
            @click="emit('close')"
            class="w-10 h-10 rounded-full bg-card-background hover:bg-primary-border/40 border border-primary-border flex items-center justify-center text-primary-text transition-colors cursor-pointer"
          >
            <ChevronLeft class="w-5 h-5 stroke-[2.5]" />
          </button>
          <h2 class="text-xl font-extrabold text-primary-text">Watchlist</h2>
        </div>

        <!-- Top Right Plus Action Button (Circular Dark) -->
        <button
          type="button"
          @click="openCreateForm"
          class="w-10 h-10 rounded-full bg-button text-button-text flex items-center justify-center cursor-pointer shadow-md transition-transform active:scale-95"
          title="Create New Watchlist"
        >
          <Plus class="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <!-- Search Input Bar -->
      <div class="px-5 pt-3 pb-1 shrink-0 bg-background">
        <BaseSearch
          v-model="searchQuery"
          placeholder="Search watchlists..."
          height="38px"
          variant="background"
          wrapper-class="bg-card-background border border-primary-border"
        />
      </div>

      <!-- Main Body Container -->
      <div class="flex-1 overflow-y-auto p-5 flex flex-col gap-4 min-h-0 bg-background">
        <!-- Watchlist Items List (Cards Layout) -->
        <div v-if="filteredWatchlists.length > 0" class="flex flex-col gap-3">
          <div
            v-for="wl in filteredWatchlists"
            :key="wl.id"
            class="bg-card-background rounded-2xl p-4 flex items-center justify-between gap-3"
          >
            <!-- Left Side: Drag Handle Icon + Watchlist Name -->
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <GripVertical class="w-5 h-5 text-secondary-text shrink-0 opacity-80 cursor-grab" />
              <div class="flex items-center gap-2 truncate flex-1 min-w-0">
                <span class="text-[15.5px] font-extrabold text-primary-text truncate">{{ wl.name }}</span>
              </div>
            </div>

            <!-- Right Side Action Buttons (Circular Buttons) -->
            <div class="flex items-center gap-2 shrink-0">
              <!-- Edit/Pencil Circular Button -->
              <button
                type="button"
                @click="openEditForm(wl)"
                title="Rename Watchlist"
                class="w-9 h-9 rounded-full bg-card-background hover:bg-primary-border/40 border border-primary-border flex items-center justify-center text-primary-text shadow-2xs transition-transform active:scale-95 cursor-pointer"
              >
                <Pencil class="w-4 h-4 text-primary-text" />
              </button>

              <!-- Delete/Trash Circular Button -->
              <button
                type="button"
                @click="promptDelete(wl.id)"
                title="Delete Watchlist"
                class="w-9 h-9 rounded-full bg-card-background hover:bg-red-500/10 border border-primary-border flex items-center justify-center text-primary-red shadow-2xs transition-transform active:scale-95 cursor-pointer"
              >
                <Trash2 class="w-4 h-4 text-primary-red" />
              </button>
            </div>
          </div>
        </div>

        <div v-else class="py-12 text-center flex flex-col items-center justify-center gap-1.5">
          <p class="text-sm font-bold text-primary-text">No watchlists found</p>
          <p class="text-xs text-secondary-text">No watchlists matching "{{ searchQuery }}"</p>
        </div>
      </div>

      <!-- Create / Edit Watchlist Modal -->
      <WatchlistFormModal
        :is-open="showFormModal"
        :mode="formModalMode"
        :initial-name="selectedWl?.name || ''"
        :watchlist-id="selectedWl?.id"
        @close="showFormModal = false"
      />

      <!-- Delete Confirmation Modal -->
      <ConfirmationModal
        :is-open="showDeleteConfirm"
        title="Delete Watchlist"
        subtitle="This action cannot be undone"
        message="Are you sure you want to delete this watchlist and all instruments inside it?"
        confirm-text="Delete Watchlist"
        variant="danger"
        :loading="isDeletingWl"
        @close="showDeleteConfirm = false"
        @confirm="executeWlDelete"
      />
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ChevronLeft, Plus, Pencil, Trash2, GripVertical } from 'lucide-vue-next'
import BaseSearch from '@/components/base/BaseSearch.vue'
import ConfirmationModal from '@/components/base/ConfirmationModal.vue'
import WatchlistFormModal from './WatchlistFormModal.vue'
import { useWatchlistStore } from '@/stores/client/watchlist'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  mode: { type: String, default: 'manage' } // 'create' or 'manage'
})

const emit = defineEmits(['close'])

const watchlistStore = useWatchlistStore()

const searchQuery = ref('')
const showFormModal = ref(false)
const formModalMode = ref('create')
const selectedWl = ref(null)

const showDeleteConfirm = ref(false)
const targetDeleteId = ref(null)
const isDeletingWl = ref(false)

const filteredWatchlists = computed(() => {
  const list = watchlistStore.watchlists || []
  if (!searchQuery.value.trim()) return list
  const q = searchQuery.value.toLowerCase().trim()
  return list.filter(wl => String(wl.name || '').toLowerCase().includes(q))
})

const openCreateForm = () => {
  formModalMode.value = 'create'
  selectedWl.value = null
  showFormModal.value = true
}

const openEditForm = (wl) => {
  formModalMode.value = 'edit'
  selectedWl.value = wl
  showFormModal.value = true
}

const promptDelete = (id) => {
  targetDeleteId.value = id
  showDeleteConfirm.value = true
}

const executeWlDelete = async () => {
  if (!targetDeleteId.value) return
  isDeletingWl.value = true
  try {
    await watchlistStore.deleteWatchlist(targetDeleteId.value)
  } catch (err) {
    console.error("Failed to delete watchlist:", err)
  } finally {
    isDeletingWl.value = false
    showDeleteConfirm.value = false
    targetDeleteId.value = null
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      searchQuery.value = ''
      if (props.mode === 'create') {
        openCreateForm()
      }
    }
  }
)
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
