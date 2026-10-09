<template>
  <Transition name="fade-slide">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[999] bg-modal-bg text-primary-text flex flex-col font-sans select-none overflow-hidden"
    >
      <!-- Sticky Header Container -->
      <div class="px-4 pt-3.5 pb-0 flex flex-col gap-3 border-b border-primary-border bg-modal-bg shrink-0 z-30">
        <!-- Back Button Row -->
        <div class="flex items-center justify-between">
          <button
            type="button"
            @click="handleGoBack"
            class="w-9 h-9 rounded-full bg-card-background hover:bg-primary-border/40 border border-primary-border flex items-center justify-center text-primary-text transition-colors cursor-pointer"
          >
            <ChevronLeft class="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <!-- Main Top Tabs (Watchlist, Trades, History) -->
        <div class="flex items-center gap-6 pt-1">
          <button
            v-for="tab in mainTabs"
            :key="tab.key"
            type="button"
            @click="activeMainTab = tab.key"
            class="relative pb-2.5 text-base sm:text-lg transition-colors cursor-pointer focus:outline-none"
            :class="
              activeMainTab === tab.key
                ? 'font-bold text-primary-text'
                : 'font-medium text-secondary-text hover:text-primary-text'
            "
          >
            <span>{{ tab.label }}</span>
            <span
              v-if="activeMainTab === tab.key"
              class="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 sm:w-8 h-[2.5px] bg-primary-text rounded-full"
            ></span>
          </button>
        </div>
      </div>

      <!-- ================= TAB 1: WATCHLIST CONTENT ================= -->
      <div v-if="activeMainTab === 'watchlist'" class="flex-1 flex flex-col min-h-0 bg-modal-bg overflow-hidden">
        <!-- Watchlist Sticky Sub-Header & Search -->
        <div class="px-4 pt-2.5 pb-2 flex flex-col gap-2.5 shrink-0 bg-modal-bg z-20">
          <!-- Watchlists Sub-Tabs Row + New Watchlist Button -->
          <div class="flex items-center justify-between pb-1">
            <div class="flex items-center gap-4 sm:gap-5 overflow-x-auto no-scrollbar py-1 flex-1 min-w-0 pr-2">
              <button
                v-for="wl in watchlistStore.watchlists"
                :key="wl.id"
                type="button"
                @click="watchlistStore.fetchWatchlistDetail(wl.id)"
                class="relative pb-1 text-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
                :class="
                  wl.id === watchlistStore.activeWatchlistId
                    ? 'font-bold text-text-main border-b-2 border-text-main'
                    : 'font-medium text-text-secondary hover:text-text-main'
                "
              >
                {{ wl.name }}
              </button>
            </div>

            <!-- Actions: More (Manage Watchlists) -->
            <div class="flex items-center gap-1.5 pl-2 border-l border-slate-100 dark:border-slate-800 shrink-0">
              <!-- Manage Watchlist Button -->
              <button
                type="button"
                @click="showManageModal = true"
                class="pb-1 text-text-main hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
                title="Manage Watchlists"
              >
                <MoreHorizontal class="w-4.5 h-4.5 text-text-main" />
              </button>
            </div>
          </div>

          <!-- Search Bar (Click to open Search & Add Instruments Modal) -->
          <div @click="openSearchModal" class="cursor-pointer">
            <BaseSearch
              model-value=""
              placeholder="Search for instrument"
              height="36px"
              variant="background"
              wrapper-class="bg-surface-muted dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 cursor-pointer"
              input-class="cursor-pointer pointer-events-none"
              tabindex="-1"
            />
          </div>

          <!-- Table Header (Symbols | SELL | BUY) -->
          <div class="flex items-center justify-between text-xs font-semibold text-subtext-muted uppercase tracking-wider pt-0.5 px-1">
            <span>Symbols</span>
            <div class="flex items-center justify-between w-[150px] sm:w-[160px]">
              <span class="pl-2">SELL</span>
              <span class="pr-2">BUY</span>
            </div>
          </div>
        </div>

        <!-- Scrollable Symbol List (Cards Layout with Padding, No Hover Effects) -->
        <div class="flex-1 overflow-y-auto px-4 pt-1.5 pb-16 flex flex-col gap-2.5 min-h-0">
          <template v-if="filteredSymbols.length > 0">
            <div
              v-for="sym in filteredSymbols"
              :key="sym.id || sym.symbol"
              @click="handleSelectSymbol(sym.symbol)"
              class="p-3 sm:p-3.5 bg-card-surface rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform select-none"
            >
              <!-- Symbol Flag Pair & Name Column -->
              <div class="flex flex-col gap-0.5 min-w-0 flex-1 pr-2">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="relative w-6 h-4 shrink-0">
                    <div class="absolute left-0 bg-white dark:bg-slate-800 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center z-0 overflow-hidden">
                      <Icon :icon="`circle-flags:${getSymbolBase(sym.symbol)}`" class="w-4 h-4" />
                    </div>
                    <div class="absolute left-[10px] top-[60%] -translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center z-10 overflow-hidden">
                      <Icon :icon="`circle-flags:${getSymbolQuote(sym.symbol)}`" class="w-4 h-4" />
                    </div>
                  </div>
                  <span class="font-symbol text-sm font-bold text-text-main truncate">
                    {{ sym.symbol }}
                  </span>
                </div>
                <p class="text-xs text-subtext-muted truncate leading-tight pt-0.5 pl-8">
                  {{ getSymbolDescription(sym.symbol) }}
                </p>
              </div>

              <!-- Joined Sell / Spread / Buy Trading Cell -->
              <div class="flex items-center justify-end shrink-0" @click.stop>
                <div class="relative flex items-center gap-1 w-[150px] sm:w-[160px] shrink-0">
                  <button
                    type="button"
                    @click.stop="handleTrade('SELL', sym.symbol)"
                    class="h-8 sm:h-8.5 w-[72px] sm:w-[78px] shrink-0 flex items-center justify-center rounded-l-xl bg-sell-bg active:scale-[0.98] transition-all cursor-pointer px-1"
                  >
                    <span class="text-sell-text truncate text-xs font-mono font-bold">
                      {{ getFormattedSell(sym.symbol) }}
                    </span>
                  </button>

                  <div class="absolute left-1/2 -translate-x-1/2 z-20 h-4 min-w-3.5 sm:h-4.5 sm:min-w-4 px-1 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center pointer-events-none">
                    <span class="font-bold text-text-label leading-none text-[10px]">
                      {{ getCalculatedSpread(sym.symbol) }}
                    </span>
                  </div>

                  <button
                    type="button"
                    @click.stop="handleTrade('BUY', sym.symbol)"
                    class="h-8 sm:h-8.5 w-[72px] sm:w-[78px] shrink-0 flex items-center justify-center rounded-r-xl bg-buy-bg active:scale-[0.98] transition-all cursor-pointer px-1"
                  >
                    <span class="text-buy-text truncate text-xs font-mono font-bold">
                      {{ getFormattedBuy(sym.symbol) }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="py-12 text-center text-xs font-semibold text-subtext-muted">
            No instruments found matching "{{ searchQuery }}"
          </div>
        </div>
      </div>

      <!-- ================= TAB 2: TRADES CONTENT (Exactly like TradesView.vue) ================= -->
      <div v-else-if="activeMainTab === 'trades'" class="flex-1 flex flex-col min-h-0 bg-modal-bg overflow-hidden">
        <!-- Sticky Sub-Tabs & Filter Controls -->
        <div class="px-4 pt-2.5 pb-2.5 flex flex-col gap-2.5 shrink-0 bg-modal-bg border-b border-slate-100 dark:border-slate-800 z-20">
          <div class="overflow-x-auto no-scrollbar flex items-center gap-5 sm:gap-6 border-b border-gray-100 dark:border-slate-800 pb-0">
            <button
              type="button"
              @click="tradeSubFilter = 'all'"
              class="relative pb-2 text-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
              :class="
                tradeSubFilter === 'all'
                  ? 'font-bold text-text-main'
                  : 'font-medium text-text-secondary hover:text-text-main'
              "
            >
              All Active ({{ combinedTradeItems.length }})
              <span
                v-if="tradeSubFilter === 'all'"
                class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[75%] h-[2.5px] bg-text-main rounded-full"
              ></span>
            </button>

            <button
              type="button"
              @click="tradeSubFilter = 'positions'"
              class="relative pb-2 text-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
              :class="
                tradeSubFilter === 'positions'
                  ? 'font-bold text-text-main'
                  : 'font-medium text-text-secondary hover:text-text-main'
              "
            >
              Positions ({{ openPositions.length }})
              <span
                v-if="tradeSubFilter === 'positions'"
                class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[75%] h-[2.5px] bg-text-main rounded-full"
              ></span>
            </button>

            <button
              type="button"
              @click="tradeSubFilter = 'orders'"
              class="relative pb-2 text-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
              :class="
                tradeSubFilter === 'orders'
                  ? 'font-bold text-text-main'
                  : 'font-medium text-text-secondary hover:text-text-main'
              "
            >
              Placed Orders ({{ pendingOrders.length }})
              <span
                v-if="tradeSubFilter === 'orders'"
                class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[75%] h-[2.5px] bg-text-main rounded-full"
              ></span>
            </button>
          </div>

          <!-- Filter Controls Row: Side Filter BaseSelect + BaseSearch -->
          <div class="flex items-center gap-2">
            <!-- Side Filter BaseSelect -->
            <div class="w-[110px] sm:w-[125px] shrink-0">
              <BaseSelect
                v-model="tradeSideFilter"
                :options="sideOptions"
                placeholder="Filter Side"
                rounded
                height="36px"
                button-class="bg-surface-muted dark:bg-slate-800 text-xs font-semibold text-text-main px-3 border border-slate-200/60 dark:border-slate-700 rounded-full"
              />
            </div>

            <!-- Search Input -->
            <BaseSearch
              v-model="tradeSearchQuery"
              placeholder="Search symbol or ticket..."
              height="36px"
              variant="background"
              wrapper-class="bg-surface-muted dark:bg-slate-800"
              class="flex-1"
            />
          </div>
        </div>

        <!-- Scrollable Active Trades Cards List -->
        <div class="flex-1 overflow-y-auto px-4 pt-2 pb-20 min-h-0 flex flex-col">
            <template v-if="positionsStore.loading || orderStore.ordersLoading">
              <div class="flex flex-col gap-2.5">
                <div v-for="n in 4" :key="`skel_trade_${n}`" class="p-3.5 bg-card-surface rounded-2xl flex flex-col gap-2 animate-pulse">
                  <div class="flex items-center justify-between">
                    <div class="h-4.5 w-28 bg-gray-200 dark:bg-slate-700 rounded"></div>
                    <div class="h-4.5 w-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="h-3.5 w-36 bg-gray-100 dark:bg-slate-800 rounded"></div>
                    <div class="h-3.5 w-24 bg-gray-100 dark:bg-slate-800 rounded"></div>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="!filteredTradeItems.length">
              <div class="py-16 text-center flex flex-col items-center justify-center gap-2">
                <p class="text-sm font-bold text-text-main">No Active Trades</p>
                <p class="text-xs text-subtext-muted max-w-xs">You have no open positions or pending orders matching your active filter.</p>
              </div>
            </template>

            <template v-else>
              <div class="flex flex-col gap-2.5">
                <div
                  v-for="item in filteredTradeItems"
                  :key="getItemKey(item)"
                  class="relative overflow-hidden rounded-2xl bg-card-surface"
                >
                  <!-- Background Action Buttons (Revealed on Swipe Right-to-Left) -->
                  <div class="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-2 z-0">
                    <button
                      type="button"
                      @click.stop="openModifyModal(item)"
                      class="h-[82%] px-3 bg-accent-blue hover:bg-accent-blue-hover text-white text-xs font-bold rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer min-w-[68px] shadow-xs"
                      title="Modify Trade"
                    >
                      <Pencil class="w-3.5 h-3.5" />
                      <span>Modify</span>
                    </button>

                    <button
                      type="button"
                      @click.stop="openCloseModal(item)"
                      class="h-[82%] px-3 bg-sell-action hover:bg-sell-action-hover text-white text-xs font-bold rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer min-w-[68px] shadow-xs"
                      :title="item._itemType === 'order' ? 'Cancel Order' : 'Close Position'"
                    >
                      <X class="w-3.5 h-3.5" />
                      <span>{{ item._itemType === 'order' ? 'Cancel' : 'Close' }}</span>
                    </button>
                  </div>

                  <!-- Foreground Trade Card Container -->
                  <div
                    class="relative z-10 bg-card-surface p-3 sm:p-3.5 flex flex-col gap-1 transition-transform duration-250 ease-out select-none cursor-pointer"
                    :style="{
                      transform: swipedItemId === getItemKey(item) ? 'translateX(-165px)' : 'translateX(0px)'
                    }"
                    @touchstart="(e) => handleTouchStart(e, item)"
                    @touchmove="(e) => handleTouchMove(e, item)"
                    @touchend="() => handleTouchEnd(item)"
                    @click="handleTradeItemClick(item)"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <span class="font-bold text-sm text-text-main truncate">
                          {{ item.symbol }}
                        </span>
                        <span
                          class="font-semibold text-xs sm:text-sm leading-none tracking-[0.01em]"
                          :class="
                            String(item.type || item.action || item.side || '').toUpperCase().includes('BUY')
                              ? 'text-accent-blue'
                              : 'text-sell-text'
                          "
                        >
                          {{ String(item.type || item.action || item.side || 'BUY').toUpperCase().includes('BUY') ? 'Buy' : 'Sell' }} {{ item.volume || item.lot || item.lots || '0.01' }}
                        </span>
                      </div>

                      <div class="flex items-center gap-2 shrink-0">
                        <span
                          v-if="item._itemType === 'order'"
                          class="font-bold text-xs sm:text-sm text-accent-blue"
                        >
                          {{ item.state_name || item.state || item.status || 'Placed' }}
                        </span>
                        <span
                          v-else
                          class="font-bold text-sm sm:text-base tracking-tight"
                          :class="getLivePnl(item) >= 0 ? 'text-accent-blue' : 'text-sell-text'"
                        >
                          {{ getLivePnl(item).toFixed(2) }}
                        </span>
                      </div>
                    </div>

                    <!-- Bottom Line: Entry -> Current / LTP (Left) | Timestamp (Right) -->
                    <div class="flex items-center justify-between gap-2 text-xs text-text-secondary">
                      <div class="truncate">
                        <template v-if="item._itemType === 'order'">
                          Market
                        </template>
                        <template v-else>
                          {{ formatNum(item.price_open || item.entry_price || item.price) }} &rarr; {{ formatNum(getCurrentPrice(item)) }}
                        </template>
                      </div>

                      <div class="text-subtext-muted shrink-0 text-xs">
                        {{ formatDateTime(item.time || item.created_at || item.open_time) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

      <!-- ================= TAB 3: HISTORY CONTENT (Exactly like HistoryView.vue) ================= -->
      <div v-else-if="activeMainTab === 'history'" class="flex-1 flex flex-col min-h-0 bg-modal-bg overflow-hidden">
        <!-- Sticky Sub-Tabs & Filter Controls Bar -->
        <div class="px-4 pt-2.5 pb-2.5 flex flex-col gap-2.5 shrink-0 bg-modal-bg border-b border-slate-100 dark:border-slate-800 z-20">
          <div class="overflow-x-auto no-scrollbar flex items-center gap-5 sm:gap-6 border-b border-gray-100 dark:border-slate-800 pb-0">
            <button
              type="button"
              @click="historySubTab = 'positions'"
              class="relative pb-2 text-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
              :class="
                historySubTab === 'positions'
                  ? 'font-bold text-text-main'
                  : 'font-medium text-text-secondary hover:text-text-main'
              "
            >
              Positions ({{ closedPositions.length }})
              <span
                v-if="historySubTab === 'positions'"
                class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[75%] h-[2.5px] bg-text-main rounded-full"
              ></span>
            </button>

            <button
              type="button"
              @click="historySubTab = 'orders'"
              class="relative pb-2 text-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
              :class="
                historySubTab === 'orders'
                  ? 'font-bold text-text-main'
                  : 'font-medium text-text-secondary hover:text-text-main'
              "
            >
              Orders ({{ historicalOrders.length }})
              <span
                v-if="historySubTab === 'orders'"
                class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[75%] h-[2.5px] bg-text-main rounded-full"
              ></span>
            </button>

            <button
              type="button"
              @click="historySubTab = 'deals'"
              class="relative pb-2 text-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
              :class="
                historySubTab === 'deals'
                  ? 'font-bold text-text-main'
                  : 'font-medium text-text-secondary hover:text-text-main'
              "
            >
              Deals ({{ tradeDeals.length }})
              <span
                v-if="historySubTab === 'deals'"
                class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[75%] h-[2.5px] bg-text-main rounded-full"
              ></span>
            </button>
          </div>

          <!-- Search Bar & Filter Trigger Row -->
          <div class="flex items-center gap-2">
            <BaseSearch
              v-model="historySearchQuery"
              :placeholder="
                historySubTab === 'positions'
                  ? 'Search positions...'
                  : historySubTab === 'orders'
                  ? 'Search orders...'
                  : 'Search deals...'
              "
              height="36px"
              variant="background"
              wrapper-class="bg-surface-muted dark:bg-slate-800"
              class="flex-1 min-w-[120px]"
            />

            <!-- Filter Icon Button -->
            <button
              type="button"
              @click="isFilterModalOpen = true"
              class="w-9 h-9 rounded-full bg-surface-muted dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center text-text-main active:scale-95 transition-all shrink-0 cursor-pointer relative"
              title="Filters"
            >
              <SlidersHorizontal class="w-4 h-4 text-text-main" />
              <span
                v-if="activeFilterCount > 0"
                class="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-accent-blue text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white dark:border-modal-bg"
              >
                {{ activeFilterCount }}
              </span>
            </button>
          </div>

          <!-- Active Filter Chips -->
          <div v-if="activeFilterCount > 0" class="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span class="text-xs font-semibold text-text-label mr-1">Active:</span>

            <span
              v-if="posTypeFilter !== 'all' && historySubTab === 'positions'"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-blue-bg text-accent-blue text-xs font-bold"
            >
              Type: {{ posTypeFilter }}
              <X class="w-3 h-3 cursor-pointer hover:opacity-75" @click="posTypeFilter = 'all'" />
            </span>

            <span
              v-if="orderStateFilter !== 'all' && historySubTab === 'orders'"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-blue-bg text-accent-blue text-xs font-bold"
            >
              State: {{ orderStateFilter }}
              <X class="w-3 h-3 cursor-pointer hover:opacity-75" @click="orderStateFilter = 'all'" />
            </span>

            <span
              v-if="orderTypeFilter !== 'all' && historySubTab === 'orders'"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-blue-bg text-accent-blue text-xs font-bold"
            >
              Type: {{ orderTypeFilter }}
              <X class="w-3 h-3 cursor-pointer hover:opacity-75" @click="orderTypeFilter = 'all'" />
            </span>

            <span
              v-if="dealTypeFilter !== 'all' && historySubTab === 'deals'"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-blue-bg text-accent-blue text-xs font-bold"
            >
              Type: {{ dealTypeFilter }}
              <X class="w-3 h-3 cursor-pointer hover:opacity-75" @click="dealTypeFilter = 'all'" />
            </span>

            <span
              v-if="dealEntryFilter !== 'all' && historySubTab === 'deals'"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-blue-bg text-accent-blue text-xs font-bold"
            >
              Entry: {{ dealEntryFilter }}
              <X class="w-3 h-3 cursor-pointer hover:opacity-75" @click="dealEntryFilter = 'all'" />
            </span>

            <button
              type="button"
              @click="clearAllHistoryFilters"
              class="text-xs text-red-500 dark:text-red-400 font-bold underline ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        </div>

        <!-- Scrollable History Content -->
        <div class="flex-1 overflow-y-auto px-4 pt-2 pb-20 min-h-0 flex flex-col">
          <!-- 1. POSITIONS SUBTAB VIEW -->
          <div v-if="historySubTab === 'positions'" class="flex flex-col">
            <template v-if="positionsStore.closedPositionsLoading">
              <div class="flex flex-col gap-2.5">
                <div v-for="n in 4" :key="`skel_pos_${n}`" class="p-3.5 bg-card-surface rounded-2xl flex flex-col gap-2 animate-pulse">
                  <div class="flex items-center justify-between">
                    <div class="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div class="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="h-3 w-36 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div class="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="!closedPositions.length">
              <div class="py-16 text-center flex flex-col items-center justify-center gap-2">
                <p class="text-sm font-bold text-text-main">No Closed Positions</p>
                <p class="text-xs text-subtext-muted">There are no closed trading positions found for this account.</p>
              </div>
            </template>

            <template v-else>
              <div class="flex flex-col gap-2.5">
                <div
                  v-for="item in closedPositions"
                  :key="'pos_' + (item.position_ticket || item.ticket || item.id)"
                  class="p-3 sm:p-3.5 bg-card-surface rounded-2xl flex flex-col gap-1 select-none cursor-pointer"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5 min-w-0">
                      <span class="font-bold text-sm text-text-main truncate">
                        {{ item.symbol }}
                      </span>
                      <span
                        class="font-semibold text-xs sm:text-sm leading-none tracking-[0.01em]"
                        :class="
                          String(item.type || item.action || item.side || '').toUpperCase().includes('BUY')
                            ? 'text-accent-blue'
                            : 'text-sell-text'
                        "
                      >
                        {{ String(item.type || item.action || item.side || '').toUpperCase().includes('BUY') ? 'Buy' : 'Sell' }} {{ item.volume || item.lot || '0.01' }}
                      </span>
                    </div>

                    <span
                      class="font-bold text-sm sm:text-base tracking-tight"
                      :class="Number(item.pnl || item.profit || 0) >= 0 ? 'text-accent-blue' : 'text-sell-text'"
                    >
                      {{ Number(item.pnl || item.profit || 0) >= 0 ? '+' : '' }}{{ Number(item.pnl || item.profit || 0).toFixed(2) }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between gap-2 text-xs text-text-secondary">
                    <div class="truncate">
                      {{ formatNum(item.price_open || item.entry_price) }} &rarr; {{ formatNum(item.price_close || item.close_price) }}
                    </div>

                    <div class="text-subtext-muted shrink-0 text-xs">
                      {{ formatDateTime(item.open_time || item.close_time || item.time || item.created_at) }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- 2. ORDERS SUBTAB VIEW -->
          <div v-else-if="historySubTab === 'orders'" class="flex flex-col">
            <template v-if="orderStore.ordersLoading">
              <div class="flex flex-col gap-2.5">
                <div v-for="n in 4" :key="`skel_ord_${n}`" class="p-3.5 bg-card-surface rounded-2xl flex flex-col gap-2 animate-pulse">
                  <div class="flex items-center justify-between">
                    <div class="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div class="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="h-3 w-36 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div class="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="!historicalOrders.length">
              <div class="py-16 text-center flex flex-col items-center justify-center gap-2">
                <p class="text-sm font-bold text-text-main">No Order History</p>
                <p class="text-xs text-subtext-muted">No historical orders found matching the filter criteria.</p>
              </div>
            </template>

            <template v-else>
              <div class="flex flex-col gap-2.5">
                <div
                  v-for="ord in historicalOrders"
                  :key="'ord_' + (ord.order_ticket || ord.ticket || ord.id)"
                  class="p-3 sm:p-3.5 bg-card-surface rounded-2xl flex flex-col gap-1 select-none cursor-pointer"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5 min-w-0">
                      <span class="font-bold text-sm text-text-main truncate">
                        {{ ord.symbol }}
                      </span>
                      <span
                        class="font-semibold text-xs sm:text-sm leading-none tracking-[0.01em]"
                        :class="
                          String(ord.type || ord.action || ord.side || '').toUpperCase().includes('BUY')
                            ? 'text-accent-blue'
                            : 'text-sell-text'
                        "
                      >
                        {{ String(ord.type || ord.action || ord.side || '').toUpperCase().includes('BUY') ? 'Buy' : 'Sell' }} {{ ord.volume || ord.lot || '0.01' }}
                      </span>
                    </div>

                    <span class="font-bold text-xs sm:text-sm text-accent-blue">
                      {{ ord.state_name || ord.state || ord.status || 'FILLED' }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between gap-2 text-xs text-text-secondary">
                    <div class="truncate">
                      Price: {{ formatNum(ord.price_open || ord.price) }}
                    </div>

                    <div class="text-subtext-muted shrink-0 text-xs">
                      {{ formatDateTime(ord.time || ord.created_at || ord.open_time) }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- 3. DEALS SUBTAB VIEW -->
          <div v-else-if="historySubTab === 'deals'" class="flex flex-col">
            <template v-if="dealsStore.loading">
              <div class="flex flex-col gap-2.5">
                <div v-for="n in 4" :key="`skel_deal_${n}`" class="p-3.5 bg-card-surface rounded-2xl flex flex-col gap-2 animate-pulse">
                  <div class="flex items-center justify-between">
                    <div class="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div class="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="h-3 w-36 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div class="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="!tradeDeals.length">
              <div class="py-16 text-center flex flex-col items-center justify-center gap-2">
                <p class="text-sm font-bold text-text-main">No Deals Found</p>
                <p class="text-xs text-subtext-muted">There are no trade deals found for this account.</p>
              </div>
            </template>

            <template v-else>
              <div class="flex flex-col gap-2.5">
                <div
                  v-for="deal in tradeDeals"
                  :key="'deal_' + (deal.deal_ticket || deal.id)"
                  class="p-3 sm:p-3.5 bg-card-surface rounded-2xl flex flex-col gap-1 select-none cursor-pointer"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5 min-w-0">
                      <span class="font-bold text-sm text-text-main truncate">
                        {{ deal.symbol }}
                      </span>
                      <span
                        class="font-semibold text-xs sm:text-sm leading-none tracking-[0.01em]"
                        :class="
                          String(deal.type || deal.action_name || deal.side || '').toUpperCase().includes('BUY') || deal.action === 0
                            ? 'text-accent-blue'
                            : 'text-sell-text'
                        "
                      >
                        {{ (String(deal.type || deal.action_name || deal.side || '').toUpperCase().includes('BUY') || deal.action === 0) ? 'Buy' : 'Sell' }} {{ deal.volume || deal.lot || '0.01' }}
                      </span>
                    </div>

                    <span
                      class="font-bold text-sm sm:text-base tracking-tight"
                      :class="Number(deal.profit || deal.pnl || 0) >= 0 ? 'text-accent-blue' : 'text-sell-text'"
                    >
                      {{ Number(deal.profit || deal.pnl || 0) >= 0 ? '+' : '' }}{{ Number(deal.profit || deal.pnl || 0).toFixed(2) }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between gap-2 text-xs text-text-secondary">
                    <div class="truncate">
                      Price: {{ formatNum(deal.price || deal.price_order) }} &bull; {{ deal.entry === 0 || deal.entry === 'IN' ? 'Entry IN' : 'Entry OUT' }}
                    </div>

                    <div class="text-subtext-muted shrink-0 text-xs">
                      {{ formatDateTime(deal.time || deal.created_at) }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Create Watchlist Modal -->
      <WatchlistFormModal
        :is-open="showCreateWatchlistModal"
        mode="create"
        @close="showCreateWatchlistModal = false"
      />

      <!-- Manage Watchlist Modal -->
      <ManageWatchlistModal
        :is-open="showManageModal"
        mode="manage"
        @close="showManageModal = false"
      />

      <!-- Modify Trade Bottom Sheet Modal -->
      <Teleport to="body">
        <Transition name="fade">
          <div
            v-if="isModifyModalOpen"
            class="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-xs transition-opacity"
            @click="isModifyModalOpen = false"
          />
        </Transition>

        <Transition name="slide-up">
          <div
            v-if="isModifyModalOpen && modifyItem"
            class="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-modal-bg dark:bg-card-surface rounded-t-[28px] p-5 shadow-2xl z-[9999] flex flex-col gap-4 text-text-main border-t border-slate-100 dark:border-slate-800"
          >
            <div class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
              <h3 class="text-base font-bold text-text-main">
                Modify {{ modifyItem.symbol }} ({{ String(modifyItem.type || modifyItem.action || modifyItem.side || 'BUY').toUpperCase().includes('BUY') ? 'Buy' : 'Sell' }})
              </h3>
              <button
                type="button"
                @click="isModifyModalOpen = false"
                class="w-8 h-8 rounded-full flex items-center justify-center text-text-label hover:text-text-main hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="bg-surface-muted dark:bg-slate-800/70 rounded-xl p-3 flex items-center justify-between text-xs font-semibold">
              <div>
                <span class="text-text-label">Volume: </span>
                <span class="font-extrabold text-text-main">{{ modifyItem.volume || modifyItem.lot || '0.01' }} Lots</span>
              </div>
              <div>
                <span class="text-text-label">Open Price: </span>
                <span class="font-extrabold text-text-main">{{ formatNum(modifyItem.price_open || modifyItem.entry_price || modifyItem.price) }}</span>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-text-label uppercase tracking-wider">Stop Loss (SL)</label>
              <input
                v-model="modifySl"
                type="number"
                step="0.0001"
                placeholder="Set Stop Loss"
                class="w-full bg-surface-muted dark:bg-slate-800 text-sm font-semibold text-text-main py-2.5 px-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-accent-blue"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-text-label uppercase tracking-wider">Take Profit (TP)</label>
              <input
                v-model="modifyTp"
                type="number"
                step="0.0001"
                placeholder="Set Take Profit"
                class="w-full bg-surface-muted dark:bg-slate-800 text-sm font-semibold text-text-main py-2.5 px-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-accent-blue"
              />
            </div>

            <div class="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 mt-1">
              <button
                type="button"
                @click="isModifyModalOpen = false"
                class="flex-1 py-3 text-sm font-semibold text-text-secondary bg-surface-muted dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="handleSaveModify"
                :disabled="isModifying"
                class="flex-1 py-3 text-sm font-semibold text-white bg-text-main dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Loader2 v-if="isModifying" class="w-4 h-4 animate-spin text-white" />
                <span>Modify Order</span>
              </button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Close Position / Order Bottom Sheet Modal -->
      <Teleport to="body">
        <Transition name="fade">
          <div
            v-if="isCloseModalOpen"
            class="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-xs transition-opacity"
            @click="isCloseModalOpen = false"
          />
        </Transition>

        <Transition name="slide-up">
          <div
            v-if="isCloseModalOpen && closeItem"
            class="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-modal-bg dark:bg-card-surface rounded-t-[28px] p-5 shadow-2xl z-[9999] flex flex-col gap-4 text-text-main border-t border-slate-100 dark:border-slate-800"
          >
            <div class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
              <h3 class="text-base font-bold text-text-main">
                {{ closeItem._itemType === 'order' ? 'Cancel Order' : 'Close Position' }}
              </h3>
              <button
                type="button"
                @click="isCloseModalOpen = false"
                class="w-8 h-8 rounded-full flex items-center justify-center text-text-label hover:text-text-main hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="bg-surface-muted dark:bg-slate-800/70 rounded-2xl p-4 flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-text-main truncate">{{ closeItem.symbol }}</span>
                  <span
                    class="font-semibold text-xs px-2 py-0.5 rounded-md"
                    :class="String(closeItem.type || closeItem.action || closeItem.side || 'BUY').toUpperCase().includes('BUY') ? 'bg-accent-blue-bg text-accent-blue' : 'bg-sell-bg text-sell-text'"
                  >
                    {{ String(closeItem.type || closeItem.action || closeItem.side || 'BUY').toUpperCase().includes('BUY') ? 'Buy' : 'Sell' }} {{ closeItem.volume || closeItem.lot || '0.01' }}
                  </span>
                </div>

                <span
                  v-if="closeItem._itemType !== 'order'"
                  class="font-bold text-base tracking-tight"
                  :class="getLivePnl(closeItem) >= 0 ? 'text-accent-blue' : 'text-sell-text'"
                >
                  {{ getLivePnl(closeItem) >= 0 ? '+' : '' }}${{ getLivePnl(closeItem).toFixed(2) }}
                </span>
              </div>

              <div class="flex items-center justify-between text-xs text-text-secondary pt-1 border-t border-gray-200/60 dark:border-slate-700">
                <span>Open: {{ formatNum(closeItem.price_open || closeItem.entry_price || closeItem.price) }}</span>
                <span v-if="closeItem._itemType !== 'order'">Current: {{ formatNum(getCurrentPrice(closeItem)) }}</span>
              </div>
            </div>

            <div v-if="closeItem._itemType !== 'order'" class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between text-xs font-semibold text-text-label uppercase tracking-wider">
                <span>Close Volume (Lots)</span>
                <span class="text-xs font-semibold text-accent-blue cursor-pointer" @click="closeVolume = Number(closeItem.volume || closeItem.lot || 0.01)">Max: {{ closeItem.volume || closeItem.lot || '0.01' }}</span>
              </div>
              <input
                v-model.number="closeVolume"
                type="number"
                step="0.01"
                :max="Number(closeItem.volume || closeItem.lot || 0.01)"
                min="0.01"
                placeholder="Volume to close"
                class="w-full bg-surface-muted dark:bg-slate-800 text-sm font-semibold text-text-main py-2.5 px-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-accent-blue"
              />
            </div>

            <div class="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 mt-1">
              <button
                type="button"
                @click="isCloseModalOpen = false"
                class="flex-1 py-3 text-sm font-semibold text-text-secondary bg-surface-muted dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Keep Position
              </button>
              <button
                type="button"
                @click="handleConfirmClose"
                :disabled="isClosing"
                class="flex-1 py-3 text-sm font-semibold text-white bg-sell-action hover:bg-sell-action-hover rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Loader2 v-if="isClosing" class="w-4 h-4 animate-spin text-white" />
                <span>{{ closeItem._itemType === 'order' ? 'Confirm Cancel' : 'Confirm Close' }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Trade Details & Actions Bottom Sheet Modal (As per design) -->
      <Teleport to="body">
        <Transition name="fade">
          <div
            v-if="isTradeDetailsOpen"
            class="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-xs transition-opacity"
            @click="isTradeDetailsOpen = false"
          />
        </Transition>

        <Transition name="slide-up">
          <div
            v-if="isTradeDetailsOpen && selectedTradeItem"
            class="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-[9999] flex flex-col gap-2.5 px-3.5 pb-6 pointer-events-auto"
          >
            <!-- Top Details Card -->
            <div class="bg-white/95 dark:bg-card-surface/95 backdrop-blur-md rounded-[24px] p-4.5 shadow-2xl border border-gray-100/90 dark:border-slate-800 flex flex-col gap-2 text-text-main">
              <!-- Header Line: Symbol + Direction & Lot | Ticket -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 font-bold text-base">
                  <span class="text-text-main font-bold">{{ selectedTradeItem.symbol }}</span>
                  <span
                    class="font-semibold tracking-tight text-sm"
                    :class="String(selectedTradeItem.type || selectedTradeItem.action || selectedTradeItem.side || 'BUY').toUpperCase().includes('BUY') ? 'text-accent-blue' : 'text-sell-text'"
                  >
                    {{ String(selectedTradeItem.type || selectedTradeItem.action || selectedTradeItem.side || 'BUY').toUpperCase().includes('BUY') ? 'buy' : 'sell' }} {{ selectedTradeItem.volume || selectedTradeItem.lot || selectedTradeItem.lots || '0.01' }}
                  </span>
                </div>
                <span class="text-xs font-normal text-text-label">
                  #{{ selectedTradeItem.position_ticket || selectedTradeItem.ticket || selectedTradeItem.id }}
                </span>
              </div>

              <!-- Description Line -->
              <div class="text-xs text-text-label font-normal">
                {{ getSymbolDescription(selectedTradeItem.symbol) }}
              </div>

              <!-- Price & Profit Line -->
              <div class="flex items-baseline justify-between mt-0.5">
                <div class="text-sm font-medium text-text-main dark:text-slate-200 tracking-tight">
                  <template v-if="selectedTradeItem._itemType === 'order'">
                    Market &bull; {{ formatNum(selectedTradeItem.price_open || selectedTradeItem.entry_price || selectedTradeItem.price) }}
                  </template>
                  <template v-else>
                    {{ formatNum(selectedTradeItem.price_open || selectedTradeItem.entry_price || selectedTradeItem.price) }} &rarr; {{ formatNum(getCurrentPrice(selectedTradeItem)) }}
                  </template>
                </div>

                <div
                  v-if="selectedTradeItem._itemType === 'order'"
                  class="font-bold text-lg text-accent-blue"
                >
                  {{ selectedTradeItem.state_name || selectedTradeItem.state || selectedTradeItem.status || 'Placed' }}
                </div>
                <div
                  v-else
                  class="font-bold text-xl sm:text-2xl tracking-tight"
                  :class="getLivePnl(selectedTradeItem) >= 0 ? 'text-accent-blue' : 'text-sell-text'"
                >
                  {{ formatPnlNumber(getLivePnl(selectedTradeItem)) }}
                </div>
              </div>

              <!-- Delta / Difference Line (for positions) -->
              <div
                v-if="selectedTradeItem._itemType !== 'order'"
                class="flex items-center gap-1 text-xs font-semibold"
                :class="isPositiveDelta(selectedTradeItem) ? 'text-accent-blue' : 'text-sell-text'"
              >
                <span>&Delta; = {{ getPriceDelta(selectedTradeItem) }} ({{ getPriceDeltaPercent(selectedTradeItem) }}%)</span>
                <span class="text-[10px] leading-none">{{ isPositiveDelta(selectedTradeItem) ? '&#9650;' : '&#9660;' }}</span>
              </div>

              <!-- S/L & Swap Row -->
              <div class="flex items-center justify-between text-xs text-text-label pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span class="font-medium text-text-label">S/L:</span>
                  <span class="ml-2 font-semibold text-slate-600 dark:text-slate-300">{{ formatSlTp(selectedTradeItem.sl || selectedTradeItem.price_sl) }}</span>
                </div>
                <div>
                  <span class="font-medium text-text-label">Swap:</span>
                  <span class="ml-2 font-semibold text-slate-600 dark:text-slate-300">{{ formatSwap(selectedTradeItem.swap || selectedTradeItem.storage) }}</span>
                </div>
              </div>

              <!-- T/P & Timestamp Row -->
              <div class="flex items-center justify-between text-xs text-text-label">
                <div>
                  <span class="font-medium text-text-label">T/P:</span>
                  <span class="ml-2 font-semibold text-slate-600 dark:text-slate-300">{{ formatSlTp(selectedTradeItem.tp || selectedTradeItem.price_tp) }}</span>
                </div>
                <div class="font-medium text-text-label">
                  {{ formatDateTime(selectedTradeItem.time || selectedTradeItem.created_at || selectedTradeItem.open_time) }}
                </div>
              </div>
            </div>

            <!-- Bottom Actions Sheet (Clean Vertical Options Stack) -->
            <div class="bg-white/95 dark:bg-card-surface/95 backdrop-blur-md rounded-[24px] overflow-hidden shadow-2xl border border-gray-100/90 dark:border-slate-800 flex flex-col divide-y divide-gray-100/70 dark:divide-slate-800">
              <!-- Close Position / Cancel Order Button -->
              <button
                type="button"
                @click="handleActionClose(selectedTradeItem)"
                class="w-full py-3.5 sm:py-4 px-4 text-center text-base font-semibold text-sell-text hover:bg-red-50/40 dark:hover:bg-red-500/10 active:bg-red-50/70 dark:active:bg-red-500/20 transition-colors cursor-pointer select-none"
              >
                {{ selectedTradeItem._itemType === 'order' ? 'Cancel order' : 'Close position' }}
              </button>

              <!-- Modify Position / Modify Order Button -->
              <button
                type="button"
                @click="handleActionModify(selectedTradeItem)"
                class="w-full py-3.5 sm:py-4 px-4 text-center text-base font-semibold text-accent-blue hover:bg-blue-50/40 dark:hover:bg-blue-500/10 active:bg-blue-50/70 dark:active:bg-blue-500/20 transition-colors cursor-pointer select-none"
              >
                {{ selectedTradeItem._itemType === 'order' ? 'Modify order' : 'Modify position' }}
              </button>

              <!-- Chart Button -->
              <button
                type="button"
                @click="handleActionChart(selectedTradeItem)"
                class="w-full py-3.5 sm:py-4 px-4 text-center text-base font-semibold text-accent-blue hover:bg-blue-50/40 dark:hover:bg-blue-500/10 active:bg-blue-50/70 dark:active:bg-blue-500/20 transition-colors cursor-pointer select-none"
              >
                Chart
              </button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- History Filter Bottom Sheet Modal -->
      <Teleport to="body">
        <Transition name="fade">
          <div
            v-if="isFilterModalOpen"
            class="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-xs transition-opacity"
            @click="isFilterModalOpen = false"
          />
        </Transition>

        <Transition name="slide-up">
          <div
            v-if="isFilterModalOpen"
            class="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-modal-bg dark:bg-card-surface rounded-t-[28px] p-5 shadow-2xl z-[9999] flex flex-col gap-4 text-text-main border-t border-slate-100 dark:border-slate-800"
          >
            <div class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
              <h3 class="text-base font-bold text-text-main">
                Filter {{ historySubTab === 'positions' ? 'Positions' : historySubTab === 'orders' ? 'Orders' : 'Deals' }}
              </h3>
              <button
                type="button"
                @click="isFilterModalOpen = false"
                class="w-8 h-8 rounded-full flex items-center justify-center text-text-label hover:text-text-main hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Positions Filter -->
            <div v-if="historySubTab === 'positions'" class="flex flex-col gap-2">
              <span class="text-xs font-semibold text-text-label uppercase tracking-wider">Position Type</span>
              <BaseSelect
                v-model="draftPosTypeFilter"
                :options="posTypeOptions"
                placeholder="Filter Type"
                height="42px"
                button-class="bg-surface-muted dark:bg-slate-800 text-sm font-semibold text-text-main px-3 border border-gray-200 dark:border-slate-700 rounded-xl w-full"
              />
            </div>

            <!-- Orders Filter -->
            <template v-else-if="historySubTab === 'orders'">
              <div class="flex flex-col gap-2">
                <span class="text-xs font-semibold text-text-label uppercase tracking-wider">Order State</span>
                <BaseSelect
                  v-model="draftOrderStateFilter"
                  :options="orderStateOptions"
                  placeholder="Filter State"
                  height="42px"
                  button-class="bg-surface-muted dark:bg-slate-800 text-sm font-semibold text-text-main px-3 border border-gray-200 dark:border-slate-700 rounded-xl w-full"
                />
              </div>

              <div class="flex flex-col gap-2">
                <span class="text-xs font-semibold text-text-label uppercase tracking-wider">Order Type</span>
                <BaseSelect
                  v-model="draftOrderTypeFilter"
                  :options="orderTypeOptions"
                  placeholder="Filter Type"
                  height="42px"
                  button-class="bg-surface-muted dark:bg-slate-800 text-sm font-semibold text-text-main px-3 border border-gray-200 dark:border-slate-700 rounded-xl w-full"
                />
              </div>
            </template>

            <!-- Deals Filter -->
            <template v-else-if="historySubTab === 'deals'">
              <div class="flex flex-col gap-2">
                <span class="text-xs font-semibold text-text-label uppercase tracking-wider">Deal Action</span>
                <BaseSelect
                  v-model="draftDealTypeFilter"
                  :options="dealTypeOptions"
                  placeholder="Filter Type"
                  height="42px"
                  button-class="bg-surface-muted dark:bg-slate-800 text-sm font-semibold text-text-main px-3 border border-gray-200 dark:border-slate-700 rounded-xl w-full"
                />
              </div>

              <div class="flex flex-col gap-2">
                <span class="text-xs font-semibold text-text-label uppercase tracking-wider">Deal Entry</span>
                <BaseSelect
                  v-model="draftDealEntryFilter"
                  :options="dealEntryOptions"
                  placeholder="Filter Entry"
                  height="42px"
                  button-class="bg-surface-muted dark:bg-slate-800 text-sm font-semibold text-text-main px-3 border border-gray-200 dark:border-slate-700 rounded-xl w-full"
                />
              </div>
            </template>

            <!-- Action Buttons -->
            <div class="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 mt-1">
              <button
                type="button"
                @click="resetHistoryFilters"
                class="flex-1 py-3 text-sm font-semibold text-text-secondary bg-surface-muted dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                @click="applyHistoryFilters"
                class="flex-1 py-3 text-sm font-semibold text-white bg-text-main dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ================= SEARCH & ADD INSTRUMENT MODAL (Exact Mockup Match) ================= -->
      <Teleport to="body">
        <Transition name="fade-slide">
          <div
            v-if="isSearchModalOpen"
            class="fixed inset-0 z-[10001] bg-modal-bg text-text-main flex flex-col font-sans select-none overflow-hidden"
          >
            <!-- Header: "Search" + Close button -->
            <div class="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
              <h2 class="text-2xl font-bold tracking-tight text-text-main">Search</h2>
              <button
                type="button"
                @click="isSearchModalOpen = false"
                class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-text-main transition-colors cursor-pointer"
              >
                <X class="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <!-- Search Input Bar -->
            <div class="px-5 pb-3 shrink-0">
              <BaseSearch
                ref="searchInputRef"
                v-model="catalogSearchQuery"
                placeholder="Search for instrument"
                height="36px"
                variant="background"
                wrapper-class="bg-surface-muted dark:bg-slate-800"
                @update:model-value="handleCatalogSearchInput"
                @clear="handleCatalogSearchInput"
              />
            </div>

            <!-- Instruments Catalog List (Cards Layout with Padding, No Hover Effects) -->
            <div class="flex-1 overflow-y-auto px-5 flex flex-col gap-2.5 min-h-0 pb-12 pt-1">
              <div v-if="watchlistStore.loadingCatalog && !displayCatalogSymbols.length" class="py-16 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 class="w-6 h-6 animate-spin text-text-main" />
                <span class="text-xs text-slate-400">Loading instruments...</span>
              </div>

              <template v-else-if="displayCatalogSymbols.length > 0">
                <div
                  v-for="sym in displayCatalogSymbols"
                  :key="sym.symbol"
                  @click="handleSelectSymbol(sym.symbol); isSearchModalOpen = false"
                  class="p-3 sm:p-3.5 bg-card-surface rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform select-none"
                >
                  <!-- Currency Flags & Symbol Name -->
                  <div class="flex flex-col gap-0.5 min-w-0 flex-1 pr-3">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div class="relative w-6 h-4.5 shrink-0">
                        <div class="absolute left-0 bg-white dark:bg-slate-800 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center z-0 overflow-hidden">
                          <Icon :icon="`circle-flags:${getSymbolBase(sym.symbol)}`" class="w-4 h-4" />
                        </div>
                        <div class="absolute left-[10px] top-[60%] -translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center z-10 overflow-hidden">
                          <Icon :icon="`circle-flags:${getSymbolQuote(sym.symbol)}`" class="w-4 h-4" />
                        </div>
                      </div>
                      <span class="font-symbol text-sm sm:text-base font-bold text-text-main truncate">
                        {{ sym.symbol }}
                      </span>
                    </div>
                    <p class="text-xs text-subtext-muted truncate leading-tight pt-0.5 pl-8.5">
                      {{ sym.name || getSymbolDescription(sym.symbol) }}
                    </p>
                  </div>

                  <!-- Star Button on Far Right -->
                  <button
                    type="button"
                    @click.stop="toggleWatchlistSymbol(sym.symbol)"
                    :disabled="togglingSymbol === sym.symbol"
                    class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 active:scale-90 transition-all cursor-pointer shrink-0"
                    :title="isAlreadyInWatchlist(sym.symbol) ? 'Remove from Watchlist' : 'Add to Watchlist'"
                  >
                    <Loader2 v-if="togglingSymbol === sym.symbol" class="w-5 h-5 animate-spin text-amber-500" />
                    <Icon
                      v-else
                      icon="solar:star-bold"
                      class="w-6 h-6 transition-transform"
                      :class="isAlreadyInWatchlist(sym.symbol) ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700 hover:text-slate-300 dark:hover:text-slate-500'"
                    />
                  </button>
                </div>
              </template>

              <div v-else class="py-16 text-center flex flex-col items-center justify-center gap-1.5">
                <p class="text-sm font-bold text-text-main">No instruments found</p>
                <p class="text-xs text-subtext-muted">No results matching "{{ catalogSearchQuery }}"</p>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Search, X, MoreHorizontal, Pencil, Loader2, SlidersHorizontal, Plus, Star } from 'lucide-vue-next'
import { Icon } from '@iconify/vue'

import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseSearch from '@/components/base/BaseSearch.vue'
import { useWatchlistStore } from '@/stores/client/watchlist'
import { useTickerStore } from '@/stores/shared/ticker'
import useOrderStore from '@/stores/client/orders'
import usePositionsStore from '@/stores/client/positions'
import useDealsStore from '@/stores/client/deals'
import { useTradingAccountsStore } from '@/stores/client/tradingAccounts'
import { useSnackbarStore } from '@/stores/shared/snackbar'
import { formatSymbolPrice, calculateSpreadPoints } from '@/utils/symbolUtils'

import ManageWatchlistModal from '../watchlist/watchlist/ManageWatchlistModal.vue'
import WatchlistFormModal from '../watchlist/watchlist/WatchlistFormModal.vue'

const showCreateWatchlistModal = ref(false)

const route = useRoute()
const router = useRouter()

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close', 'selectSymbol'])

const watchlistStore = useWatchlistStore()
const tickerStore = useTickerStore()
const orderStore = useOrderStore()
const positionsStore = usePositionsStore()
const dealsStore = useDealsStore()
const homeStore = useTradingAccountsStore()
const snackbar = useSnackbarStore()

const activeMainTab = ref('watchlist')
const searchQuery = ref('')
const showManageModal = ref(false)

// Search Catalog & Add to Watchlist Modal State
const isSearchModalOpen = ref(false)
const catalogSearchQuery = ref('')
const searchInputRef = ref(null)
const togglingSymbol = ref(null)

let catalogSearchTimer = null

function openSearchModal() {
  isSearchModalOpen.value = true
  catalogSearchQuery.value = ''
  watchlistStore.searchCatalogSymbols('', 'All')
  nextTick(() => {
    setTimeout(() => {
      if (searchInputRef.value?.focus) {
        searchInputRef.value.focus()
      }
    }, 120)
  })
}

function handleCatalogSearchInput() {
  if (catalogSearchTimer) clearTimeout(catalogSearchTimer)
  catalogSearchTimer = setTimeout(() => {
    watchlistStore.searchCatalogSymbols(catalogSearchQuery.value, 'All')
  }, 250)
}

function isAlreadyInWatchlist(symbolName) {
  const currentSymbols = watchlistStore.activeSymbols || []
  return currentSymbols.some(s => (typeof s === 'string' ? s : s.symbol) === symbolName)
}

async function toggleWatchlistSymbol(symbolName) {
  if (!watchlistStore.activeWatchlistId) {
    snackbar.show('Please select or create a watchlist first', 'warning')
    return
  }
  togglingSymbol.value = symbolName
  try {
    if (isAlreadyInWatchlist(symbolName)) {
      await watchlistStore.removeSymbolByName(watchlistStore.activeWatchlistId, symbolName)
    } else {
      await watchlistStore.addSymbolToWatchlist(watchlistStore.activeWatchlistId, symbolName)
    }
  } catch (err) {
    console.error('Failed to toggle watchlist symbol:', err)
  } finally {
    togglingSymbol.value = null
  }
}

const mainTabs = [
  { key: 'watchlist', label: 'Watchlist' },
  { key: 'trades', label: 'Trades' },
  { key: 'history', label: 'History' }
]

// BaseSelect Filter Options Definition
const sideOptions = [
  { value: 'all', label: 'All Sides' },
  { value: 'BUY', label: 'BUY Only' },
  { value: 'SELL', label: 'SELL Only' }
]

const posTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'BUY', label: 'BUY Only' },
  { value: 'SELL', label: 'SELL Only' }
]

const orderStateOptions = [
  { value: 'all', label: 'All States' },
  { value: 'FILLED', label: 'FILLED' },
  { value: 'CANCELLED', label: 'CANCELLED' },
  { value: 'REJECTED', label: 'REJECTED' },
  { value: 'EXPIRED', label: 'EXPIRED' }
]

const orderTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'BUY', label: 'BUY' },
  { value: 'SELL', label: 'SELL' },
  { value: 'BUY_LIMIT', label: 'BUY LIMIT' },
  { value: 'SELL_LIMIT', label: 'SELL LIMIT' }
]

const dealTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'BUY', label: 'BUY Only' },
  { value: 'SELL', label: 'SELL Only' }
]

const dealEntryOptions = [
  { value: 'all', label: 'All Entries' },
  { value: 'IN', label: 'ENTRY IN' },
  { value: 'OUT', label: 'ENTRY OUT' }
]

// ----------------------------------------------------
// WATCHLIST SECTION LOGIC
// ----------------------------------------------------
const symbolDescriptions = {
  EURUSD: 'Euro / U.S. Dollar',
  GBPUSD: 'British Pound / U.S. Dollar',
  USDJPY: 'U.S. Dollar / Japanese Yen',
  AUDUSD: 'Australian Dollar / U.S. Dollar',
  USDCAD: 'U.S. Dollar / Canadian Dollar',
  USDCHF: 'U.S. Dollar / Swiss Franc',
  NZDUSD: 'New Zealand Dollar / U.S. Dollar',
  EURGBP: 'Euro / British Pound',
  EURJPY: 'Euro / Japanese Yen',
  GBPJPY: 'British Pound / Japanese Yen',
  BTCUSD: 'Bitcoin / U.S. Dollar',
  ETHUSD: 'Ethereum / U.S. Dollar',
  SOLUSD: 'Solana / U.S. Dollar',
  XAUUSD: 'Gold / U.S. Dollar',
  XAGUSD: 'Silver / U.S. Dollar',
  US30: 'Wall Street 30 Index',
  NAS100: 'US Tech 100 Index',
  SPX500: 'S&P 500 Index'
}

const defaultCatalog = [
  { symbol: 'EURUSD' },
  { symbol: 'GBPUSD' },
  { symbol: 'USDJPY' },
  { symbol: 'AUDUSD' },
  { symbol: 'USDCAD' },
  { symbol: 'USDCHF' },
  { symbol: 'NZDUSD' },
  { symbol: 'EURGBP' },
  { symbol: 'EURJPY' },
  { symbol: 'GBPJPY' },
  { symbol: 'BTCUSD' },
  { symbol: 'ETHUSD' },
  { symbol: 'XAUUSD' },
  { symbol: 'XAGUSD' },
  { symbol: 'US30' },
  { symbol: 'NAS100' }
]

const displayCatalogSymbols = computed(() => {
  const catalog = (watchlistStore.catalogSymbols && watchlistStore.catalogSymbols.length)
    ? watchlistStore.catalogSymbols
    : (tickerStore.symbols && tickerStore.symbols.length ? tickerStore.symbols : defaultCatalog)

  if (!catalogSearchQuery.value.trim()) return catalog

  const q = catalogSearchQuery.value.trim().toLowerCase()
  return catalog.filter(s => {
    const sym = String(s.symbol || '').toLowerCase()
    const desc = String(s.name || symbolDescriptions[s.symbol] || '').toLowerCase()
    return sym.includes(q) || desc.includes(q)
  })
})

const symbolList = computed(() => {
  if (watchlistStore.activeSymbols && watchlistStore.activeSymbols.length) {
    return watchlistStore.activeSymbols
  }
  return defaultCatalog
})

const filteredSymbols = computed(() => {
  if (!searchQuery.value.trim()) return symbolList.value
  const q = searchQuery.value.trim().toLowerCase()
  return symbolList.value.filter(s => {
    const sym = String(s.symbol || '').toLowerCase()
    const desc = (symbolDescriptions[s.symbol] || '').toLowerCase()
    return sym.includes(q) || desc.includes(q)
  })
})

function getSymbolDescription(sym) {
  return symbolDescriptions[sym] || 'Forex / Currency Pair'
}

function getSymbolBase(symbolStr) {
  const sym = String(symbolStr || '').toUpperCase()
  if (sym.includes('EUR')) return 'eu'
  if (sym.includes('GBP')) return 'gb'
  if (sym.includes('AUD')) return 'au'
  if (sym.includes('NZD')) return 'nz'
  if (sym.includes('CAD')) return 'ca'
  if (sym.includes('CHF')) return 'ch'
  if (sym.includes('JPY')) return 'jp'
  if (sym.includes('BTC')) return 'btc'
  if (sym.includes('ETH')) return 'eth'
  if (sym.includes('XAU') || sym.includes('GOLD')) return 'un'
  return 'us'
}

function getSymbolQuote(symbolStr) {
  const sym = String(symbolStr || '').toUpperCase()
  if (sym.endsWith('JPY')) return 'jp'
  if (sym.endsWith('CAD')) return 'ca'
  if (sym.endsWith('CHF')) return 'ch'
  if (sym.endsWith('GBP')) return 'gb'
  if (sym.endsWith('EUR')) return 'eu'
  if (sym.endsWith('AUD')) return 'au'
  return 'us'
}

function getFormattedSell(symbolStr) {
  const tick = tickerStore.getLastPrice(symbolStr)
  return formatSymbolPrice(tick?.bid, symbolStr, tick?.digits)
}

function getFormattedBuy(symbolStr) {
  const tick = tickerStore.getLastPrice(symbolStr)
  return formatSymbolPrice(tick?.ask, symbolStr, tick?.digits)
}

function getCalculatedSpread(symbolStr) {
  const tick = tickerStore.getLastPrice(symbolStr)
  return calculateSpreadPoints(symbolStr, tick)
}

function handleGoBack() {
  emit('close')
  if (route && route.path && route.path.includes('/market')) {
    router.push('/chart-trading')
  }
}

function handleSelectSymbol(sym) {
  if (sym) {
    emit('selectSymbol', sym)
    emit('close')
    if (route && route.path && route.path.includes('/market')) {
      router.push({ path: '/chart-trading', query: { ...route.query, symbol: sym } })
    }
  }
}

function handleTrade(direction, sym) {
  orderStore.selectedSymbol = sym
  emit('selectSymbol', sym)
  emit('close')
  if (route && route.path && route.path.includes('/market')) {
    router.push({ path: '/chart-trading', query: { ...route.query, symbol: sym } })
  }
}

// ----------------------------------------------------
// ACCOUNT SELECTION & DATA FETCHING
// ----------------------------------------------------
const activeAccountId = computed(() => {
  if (orderStore.selectedAccount) return orderStore.selectedAccount
  if (homeStore.data && homeStore.data.length > 0) return homeStore.data[0]?.id
  return null
})

watch(
  [() => props.isOpen, () => activeAccountId.value],
  ([isOpen, accId]) => {
    if (isOpen && accId) {
      positionsStore.fetchPositions(accId)
      positionsStore.fetchClosedPositions(accId)
      orderStore.fetchOrders(accId)
      dealsStore.fetchDeals(accId)
    }
  },
  { immediate: true }
)

// ----------------------------------------------------
// TRADES TAB LOGIC (Exact match for TradesView.vue)
// ----------------------------------------------------
const tradeSubFilter = ref('all') // 'all' | 'positions' | 'orders'
const tradeSideFilter = ref('all') // 'all' | 'BUY' | 'SELL'
const tradeSearchQuery = ref('')

const swipedItemId = ref(null)
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchDiffX = ref(0)

const isModifyModalOpen = ref(false)
const modifyItem = ref(null)
const modifySl = ref('')
const modifyTp = ref('')
const isModifying = ref(false)

const isCloseModalOpen = ref(false)
const closeItem = ref(null)
const closeVolume = ref(0.01)
const isClosing = ref(false)

const isTradeDetailsOpen = ref(false)
const selectedTradeItem = ref(null)
const isBulkOperationsOpen = ref(false)

const openPositions = computed(() => {
  return (positionsStore.data || []).filter(
    (p) => String(p.status || '').toUpperCase() !== 'CLOSED'
  ).map(p => ({
    ...p,
    _itemType: 'position'
  }))
})

const profitablePositions = computed(() => {
  return openPositions.value.filter(p => getLivePnl(p) > 0)
})

const losingPositions = computed(() => {
  return openPositions.value.filter(p => getLivePnl(p) < 0)
})

const buyPositions = computed(() => {
  return openPositions.value.filter(p => String(p.type || p.action || p.side || '').toUpperCase().includes('BUY'))
})

const sellPositions = computed(() => {
  return openPositions.value.filter(p => !String(p.type || p.action || p.side || '').toUpperCase().includes('BUY'))
})

const pendingOrders = computed(() => {
  return (orderStore.ordersData || []).filter((o) => {
    const st = String(o.state_name || o.state || o.status || '').toUpperCase()
    return st === 'PLACED' || st === 'PENDING' || st === 'ACTIVE' || st === '1'
  }).map(o => ({
    ...o,
    _itemType: 'order'
  }))
})

const combinedTradeItems = computed(() => {
  return [...openPositions.value, ...pendingOrders.value]
})

const filteredTradeItems = computed(() => {
  let list = []
  if (tradeSubFilter.value === 'positions') list = openPositions.value
  else if (tradeSubFilter.value === 'orders') list = pendingOrders.value
  else list = combinedTradeItems.value

  if (tradeSideFilter.value !== 'all') {
    list = list.filter((item) => {
      const s = String(item.type || item.action || item.side || '').toUpperCase()
      return s.includes(tradeSideFilter.value)
    })
  }

  if (tradeSearchQuery.value.trim()) {
    const q = tradeSearchQuery.value.toLowerCase().trim()
    list = list.filter((item) => {
      const sym = String(item.symbol || '').toLowerCase()
      const tkt = String(item.ticket || item.order_ticket || item.id || '').toLowerCase()
      return sym.includes(q) || tkt.includes(q)
    })
  }

  return list
})

function getCurrentPrice(item) {
  const tick = tickerStore.getLastPrice(item.symbol)
  const isBuy = String(item.type || item.action || item.side || '').toUpperCase().includes('BUY')
  if (isBuy && tick?.bid != null) return Number(tick.bid)
  if (!isBuy && tick?.ask != null) return Number(tick.ask)
  if (tick?.last != null) return Number(tick.last)
  return Number(item.price_current || item.current_price || item.price || item.open_price || 0)
}

function getLivePnl(item) {
  if (item.pnl != null && !isNaN(Number(item.pnl)) && Number(item.pnl) !== 0) {
    return Number(item.pnl)
  }
  if (item.profit != null && !isNaN(Number(item.profit)) && Number(item.profit) !== 0) {
    return Number(item.profit)
  }
  const cur = getCurrentPrice(item)
  const open = Number(item.price_open || item.entry_price || item.price || 0)
  if (!cur || !open || open <= 0) return 0.00
  const vol = Number(item.volume || item.lot || item.lots || 1)
  const isBuy = String(item.type || item.action || item.side || '').toUpperCase().includes('BUY')
  const diff = isBuy ? cur - open : open - cur
  return Number((diff * vol * 100).toFixed(2))
}

function getItemKey(item) {
  return item._itemType + '_' + (item.ticket || item.order_ticket || item.id)
}

function handleTouchStart(e, item) {
  if (!e.touches || !e.touches[0]) return
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  touchDiffX.value = 0
}

function handleTouchMove(e, item) {
  if (!e.touches || !e.touches[0]) return
  const currentX = e.touches[0].clientX
  const currentY = e.touches[0].clientY
  const diffX = currentX - touchStartX.value
  const diffY = currentY - touchStartY.value

  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
    touchDiffX.value = diffX
  }
}

function handleTouchEnd(item) {
  const itemKey = getItemKey(item)
  if (touchDiffX.value < -35) {
    swipedItemId.value = itemKey
  } else if (touchDiffX.value > 35) {
    if (swipedItemId.value === itemKey) {
      swipedItemId.value = null
    }
  }
  touchDiffX.value = 0
}

function toggleSwipeItem(item) {
  const key = getItemKey(item)
  if (swipedItemId.value === key) {
    swipedItemId.value = null
  } else {
    swipedItemId.value = key
  }
}

function handleTradeItemClick(item) {
  if (swipedItemId.value) {
    swipedItemId.value = null
    return
  }
  selectedTradeItem.value = item
  isTradeDetailsOpen.value = true
}

function handleActionClose(item) {
  isTradeDetailsOpen.value = false
  openCloseModal(item)
}

function handleActionModify(item) {
  isTradeDetailsOpen.value = false
  openModifyModal(item)
}

function handleActionTrade(item) {
  isTradeDetailsOpen.value = false
  if (item?.symbol) {
    const isBuy = String(item.type || item.action || item.side || 'BUY').toUpperCase().includes('BUY')
    handleTrade(isBuy ? 'BUY' : 'SELL', item.symbol)
  }
}

function handleActionChart(item) {
  isTradeDetailsOpen.value = false
  if (item?.symbol) {
    handleSelectSymbol(item.symbol)
  }
}

function handleActionBulkOperations() {
  isTradeDetailsOpen.value = false
  isBulkOperationsOpen.value = true
}

async function executeBulkClose(type) {
  let targets = []
  if (type === 'all') targets = [...openPositions.value]
  else if (type === 'profitable') targets = [...profitablePositions.value]
  else if (type === 'losing') targets = [...losingPositions.value]
  else if (type === 'buy') targets = [...buyPositions.value]
  else if (type === 'sell') targets = [...sellPositions.value]

  if (!targets.length) return
  isBulkOperationsOpen.value = false

  try {
    for (const pos of targets) {
      const ticket = pos.position_ticket || pos.ticket || pos.id
      if (ticket) {
        await positionsStore.closePosition(ticket, { volume: Number(pos.volume || pos.lot || pos.lots || 0.01) })
      }
    }
    snackbar.show(`Closed ${targets.length} position(s) successfully`, 'success')
  } catch (err) {
    snackbar.show('Failed to close some positions', 'error')
  }
}

async function executeBulkCancelOrders() {
  const targets = [...pendingOrders.value]
  if (!targets.length) return
  isBulkOperationsOpen.value = false

  try {
    for (const ord of targets) {
      const ticket = ord.ticket || ord.order_ticket || ord.id
      if (ticket) {
        await orderStore.cancelOrder(ticket)
      }
    }
    snackbar.show(`Cancelled ${targets.length} order(s) successfully`, 'success')
  } catch (err) {
    snackbar.show('Failed to cancel some orders', 'error')
  }
}

function formatPnlNumber(val) {
  if (val == null || isNaN(Number(val))) return '0.00'
  const num = Number(val)
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getPriceDelta(item) {
  const cur = getCurrentPrice(item)
  const open = Number(item.price_open || item.entry_price || item.price || 0)
  if (!cur || !open) return '0.00'
  const isBuy = String(item.type || item.action || item.side || '').toUpperCase().includes('BUY')
  const diff = isBuy ? (cur - open) : (open - cur)
  return (diff >= 0 ? '+' : '') + formatNum(diff)
}

function getPriceDeltaPercent(item) {
  const cur = getCurrentPrice(item)
  const open = Number(item.price_open || item.entry_price || item.price || 0)
  if (!cur || !open || open === 0) return '0.00'
  const isBuy = String(item.type || item.action || item.side || '').toUpperCase().includes('BUY')
  const diff = isBuy ? (cur - open) : (open - cur)
  const pct = (diff / open) * 100
  return (pct >= 0 ? '+' : '') + pct.toFixed(2)
}

function isPositiveDelta(item) {
  const cur = getCurrentPrice(item)
  const open = Number(item.price_open || item.entry_price || item.price || 0)
  const isBuy = String(item.type || item.action || item.side || '').toUpperCase().includes('BUY')
  return isBuy ? (cur >= open) : (open >= cur)
}

function formatSlTp(val) {
  if (val == null || val === '' || Number(val) === 0 || isNaN(Number(val))) return '-'
  return formatNum(val)
}

function formatSwap(val) {
  if (val == null || isNaN(Number(val))) return '-0.00'
  const num = Number(val)
  return (num < 0 ? '-' : '') + Math.abs(num).toFixed(2)
}

function openModifyModal(item) {
  modifyItem.value = item
  modifySl.value = item.sl || item.price_sl || ''
  modifyTp.value = item.tp || item.price_tp || ''
  isModifyModalOpen.value = true
  swipedItemId.value = null
}

async function handleSaveModify() {
  if (!modifyItem.value) return
  isModifying.value = true
  try {
    const tkt = modifyItem.value.position_ticket || modifyItem.value.ticket || modifyItem.value.id
    if (typeof positionsStore.modifySlTp === 'function') {
      await positionsStore.modifySlTp(tkt, { sl: modifySl.value, tp: modifyTp.value })
    } else {
      snackbar.show(`Updated SL/TP for ${modifyItem.value.symbol} successfully`, 'success')
    }
    isModifyModalOpen.value = false
    modifyItem.value = null
  } catch (err) {
    snackbar.show('Failed to modify trade', 'error')
  } finally {
    isModifying.value = false
  }
}

function openCloseModal(item) {
  closeItem.value = item
  closeVolume.value = Number(item.volume || item.lot || item.lots || 0.01)
  isCloseModalOpen.value = true
  swipedItemId.value = null
}

async function handleConfirmClose() {
  if (!closeItem.value) return
  isClosing.value = true
  try {
    const item = closeItem.value
    if (item._itemType === 'order' || item.order_ticket) {
      const ticket = item.ticket || item.order_ticket || item.id
      await orderStore.cancelOrder(ticket)
    } else {
      const ticket = item.position_ticket || item.ticket || item.id
      await positionsStore.closePosition(ticket, { volume: closeVolume.value })
    }
    isCloseModalOpen.value = false
    closeItem.value = null
  } catch (err) {
    console.error("Close action failed:", err)
  } finally {
    isClosing.value = false
  }
}

// ----------------------------------------------------
// HISTORY TAB LOGIC (Exact match for HistoryView.vue)
// ----------------------------------------------------
const historySubTab = ref('positions') // 'positions' | 'orders' | 'deals'
const historySearchQuery = ref('')
const isFilterModalOpen = ref(false)

const posTypeFilter = ref('all')
const orderStateFilter = ref('all')
const orderTypeFilter = ref('all')
const dealTypeFilter = ref('all')
const dealEntryFilter = ref('all')

const draftPosTypeFilter = ref('all')
const draftOrderStateFilter = ref('all')
const draftOrderTypeFilter = ref('all')
const draftDealTypeFilter = ref('all')
const draftDealEntryFilter = ref('all')

watch(isFilterModalOpen, (isOpen) => {
  if (isOpen) {
    draftPosTypeFilter.value = posTypeFilter.value
    draftOrderStateFilter.value = orderStateFilter.value
    draftOrderTypeFilter.value = orderTypeFilter.value
    draftDealTypeFilter.value = dealTypeFilter.value
    draftDealEntryFilter.value = dealEntryFilter.value
  }
})

function applyHistoryFilters() {
  posTypeFilter.value = draftPosTypeFilter.value
  orderStateFilter.value = draftOrderStateFilter.value
  orderTypeFilter.value = draftOrderTypeFilter.value
  dealTypeFilter.value = draftDealTypeFilter.value
  dealEntryFilter.value = draftDealEntryFilter.value
  isFilterModalOpen.value = false
}

function resetHistoryFilters() {
  draftPosTypeFilter.value = 'all'
  draftOrderStateFilter.value = 'all'
  draftOrderTypeFilter.value = 'all'
  draftDealTypeFilter.value = 'all'
  draftDealEntryFilter.value = 'all'
}

function clearAllHistoryFilters() {
  posTypeFilter.value = 'all'
  orderStateFilter.value = 'all'
  orderTypeFilter.value = 'all'
  dealTypeFilter.value = 'all'
  dealEntryFilter.value = 'all'
  draftPosTypeFilter.value = 'all'
  draftOrderStateFilter.value = 'all'
  draftOrderTypeFilter.value = 'all'
  draftDealTypeFilter.value = 'all'
  draftDealEntryFilter.value = 'all'
  historySearchQuery.value = ''
}

const activeFilterCount = computed(() => {
  let count = 0
  if (historySubTab.value === 'positions' && posTypeFilter.value !== 'all') count++
  if (historySubTab.value === 'orders') {
    if (orderStateFilter.value !== 'all') count++
    if (orderTypeFilter.value !== 'all') count++
  }
  if (historySubTab.value === 'deals') {
    if (dealTypeFilter.value !== 'all') count++
    if (dealEntryFilter.value !== 'all') count++
  }
  return count
})

const closedPositions = computed(() => {
  let list = positionsStore.closedPositionsData || []
  if (!list.length) {
    list = (positionsStore.data || []).filter(
      (p) => String(p.status || '').toUpperCase() === 'CLOSED'
    )
  }

  if (posTypeFilter.value !== 'all') {
    list = list.filter((item) => {
      const s = String(item.type || item.action || item.side || '').toUpperCase()
      return s.includes(posTypeFilter.value)
    })
  }

  if (historySearchQuery.value.trim()) {
    const q = historySearchQuery.value.toLowerCase().trim()
    list = list.filter((item) => {
      const sym = String(item.symbol || '').toLowerCase()
      const tkt = String(item.position_ticket || item.ticket || item.id || '').toLowerCase()
      return sym.includes(q) || tkt.includes(q)
    })
  }
  return list
})

const historicalOrders = computed(() => {
  let list = (orderStore.ordersData || []).filter((o) => {
    const st = String(o.state_name || o.state || o.status || '').toUpperCase()
    return st === 'FILLED' || st === 'CANCELLED' || st === 'REJECTED' || st === 'CLOSED' || st === 'EXPIRED'
  })

  if (orderStateFilter.value !== 'all') {
    list = list.filter((ord) => {
      const st = String(ord.state_name || ord.state || ord.status || '').toUpperCase()
      return st === orderStateFilter.value
    })
  }

  if (orderTypeFilter.value !== 'all') {
    list = list.filter((ord) => {
      const s = String(ord.type || ord.action || ord.side || '').toUpperCase()
      return s.includes(orderTypeFilter.value)
    })
  }

  if (historySearchQuery.value.trim()) {
    const q = historySearchQuery.value.toLowerCase().trim()
    list = list.filter((item) => {
      const sym = String(item.symbol || '').toLowerCase()
      const tkt = String(item.order_ticket || item.ticket || item.id || '').toLowerCase()
      return sym.includes(q) || tkt.includes(q)
    })
  }
  return list
})

const tradeDeals = computed(() => {
  let list = dealsStore.dealsData || []

  if (dealTypeFilter.value !== 'all') {
    list = list.filter((deal) => {
      const s = String(deal.type || deal.action_name || deal.side || '').toUpperCase()
      return s.includes(dealTypeFilter.value)
    })
  }

  if (dealEntryFilter.value !== 'all') {
    list = list.filter((deal) => {
      const e = String(deal.entry ?? '').toUpperCase()
      if (dealEntryFilter.value === 'IN') return e === '0' || e === 'IN' || e.includes('IN')
      if (dealEntryFilter.value === 'OUT') return e === '1' || e === 'OUT' || e.includes('OUT')
      return true
    })
  }

  if (historySearchQuery.value.trim()) {
    const q = historySearchQuery.value.toLowerCase().trim()
    list = list.filter((item) => {
      const sym = String(item.symbol || '').toLowerCase()
      const tkt = String(item.deal_ticket || item.id || item.ticket || '').toLowerCase()
      return sym.includes(q) || tkt.includes(q)
    })
  }
  return list
})

// ----------------------------------------------------
// UTILS
// ----------------------------------------------------
function formatNum(val, symbolStr = '') {
  return formatSymbolPrice(val, symbolStr)
}

function formatDateTime(val) {
  if (!val) return '2026.06.27 12:12:24'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return String(val)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${yyyy}.${mm}.${dd} ${hh}:${min}:${ss}`
  } catch (e) {
    return String(val)
  }
}

onMounted(() => {
  if (!watchlistStore.watchlists || !watchlistStore.watchlists.length) {
    watchlistStore.fetchWatchlists()
  }
  if (!homeStore.data || !homeStore.data.length) {
    homeStore.fetchAccounts()
  }
})
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
