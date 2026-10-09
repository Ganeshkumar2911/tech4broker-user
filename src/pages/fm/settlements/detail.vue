<template>
  <div class="px-4 pb-8 space-y-6">

    <!-- Header & Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5 flex-wrap">
          <span
            v-if="settlement?.preview"
            class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
          >
            Preview Mode
          </span>

          <span
            v-if="settlement?.settlement_id"
            class="px-2.5 py-1 rounded-md text-xs font-bold bg-primary text-white"
          >
            Settlement #{{ settlement.settlement_id }}
          </span>

          <span
            v-if="settlement?.fm_name"
            class="px-2.5 py-1 rounded-md text-xs font-medium bg-card-background text-secondary-text border border-primary-border"
          >
            FM: <strong class="text-primary-text font-semibold">{{ settlement.fm_name }}</strong> (ID: #{{ settlement.fm_id }})
          </span>

          <span
            v-if="settlement?.status"
            class="text-xs font-medium px-2.5 py-0.5 rounded-full border capitalize"
            :class="statusClass(settlement.status)"
          >
            {{ settlement.status }}
          </span>

          <span
            v-if="settlement?.settlement_type"
            class="px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase bg-card-background text-secondary-text border border-primary-border"
          >
            {{ settlement.settlement_type }}
          </span>

          <span
            class="px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono bg-card-background text-primary border border-primary-border uppercase"
          >
            {{ activeCurrency }}
          </span>

          <span
            v-if="settlement?.executed_at"
            class="text-xs text-secondary-text flex items-center gap-1"
          >
            <Clock class="w-3.5 h-3.5" />
            {{ formatDate(settlement.executed_at) }}
          </span>
        </div>

        <p v-if="periodDateRange" class="text-xs text-secondary-text mt-1.5 flex items-center gap-1">
          <Calendar class="w-3.5 h-3.5" />
          Period: {{ periodDateRange }}
        </p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <!-- Amount View Toggle -->
        <div class="flex items-center rounded-lg border border-primary-border bg-card-background overflow-hidden">
          <button
            v-for="opt in amountViewOptions"
            :key="opt.value"
            :disabled="store.loading"
            class="px-3 py-2 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            :class="store.amountView === opt.value
              ? 'bg-primary text-white'
              : 'text-secondary-text hover:text-primary-text hover:bg-background'"
            @click="switchAmountView(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>

        <button
          :disabled="store.loading"
          class="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary-border bg-card-background hover:bg-background text-xs font-medium text-secondary-text hover:text-primary-text transition-colors disabled:opacity-50 cursor-pointer"
          @click="loadData"
        >
          <RotateCw class="w-3.5 h-3.5" :class="{ 'animate-spin': store.loading }" />
          Refresh
        </button>

        <button
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-primary-border bg-card-background hover:bg-background text-xs font-medium text-primary-text transition-colors cursor-pointer"
          @click="goToTrades"
        >
          <BarChart2 class="w-3.5 h-3.5 text-primary" />
          Flat Trades
        </button>
      </div>
    </div>

    <!-- Skeletons Loading State -->
    <div v-if="store.loading && !settlement" class="space-y-6">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div
          v-for="n in 3"
          :key="n"
          class="bg-card-background border border-primary-border rounded-2xl p-4 animate-pulse space-y-2"
        >
          <div class="h-3 w-16 bg-background rounded" />
          <div class="h-6 w-24 bg-background rounded" />
        </div>
      </div>

      <div class="bg-card-background border border-primary-border rounded-2xl p-4 animate-pulse space-y-3">
        <div class="h-4 w-48 bg-background rounded" />
        <div v-for="n in 4" :key="n" class="h-10 bg-background rounded" />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!store.loading && (!settlement || hasEmptyData)"
      class="flex flex-col items-center justify-center py-20 gap-4 bg-card-background border border-primary-border rounded-2xl"
    >
      <div class="w-14 h-14 rounded-2xl bg-background border border-primary-border flex items-center justify-center">
        <ReceiptText class="w-6 h-6 text-secondary-text" />
      </div>
      <div class="text-center max-w-sm px-4">
        <p class="text-sm font-semibold text-primary-text">
          {{ !settlement ? 'Settlement Record Not Found' : 'No Trades for Settlement' }}
        </p>
        <p class="text-xs text-secondary-text mt-1">
          {{ !settlement ? `Unable to find details for settlement #${route.params.id}.` : 'There are currently no closed follower trades recorded for this settlement.' }}
        </p>
        <button
          v-if="!settlement"
          class="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer"
          @click="router.push('/fm-settlements')"
        >
          Return to Settlements
        </button>
      </div>
    </div>

    <template v-else>

      <!-- Key Metrics Summary Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <!-- Total PnL -->
        <div class="bg-card-background border border-primary-border rounded-2xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium uppercase tracking-wide text-secondary-text">Total PnL</span>
            <TrendingUp v-if="totalPnl >= 0" class="w-3.5 h-3.5 text-primary-green" />
            <TrendingDown v-else class="w-3.5 h-3.5 text-primary-red" />
          </div>
          <div class="mt-2">
            <p
              class="text-xl font-bold tabular-nums"
              :class="totalPnl >= 0 ? 'text-primary-green' : 'text-primary-red'"
            >
              {{ totalPnl > 0 ? '+' : '' }}{{ formatCurrency(totalPnl, isBothView ? accountCurrency : null) }}
            </p>
            <p
              v-if="isBothView && usdSummaryData"
              class="text-[11px] font-mono tabular-nums mt-0.5"
              :class="usdSummaryData.total_pnl >= 0 ? 'text-primary-green/90' : 'text-primary-red/90'"
            >
              ≈ {{ usdSummaryData.total_pnl > 0 ? '+' : '' }}{{ formatCurrency(usdSummaryData.total_pnl, 'USD') }} USD
            </p>
            <p class="text-[10px] text-secondary-text mt-0.5 truncate">{{ settlement?.fm_name }} (FM #{{ settlement?.fm_id }})</p>
          </div>
        </div>

        <!-- Total Fee -->
        <div class="bg-card-background border border-primary-border rounded-2xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium uppercase tracking-wide text-secondary-text">Total Fee</span>
            <DollarSign class="w-3.5 h-3.5 text-secondary-text" />
          </div>
          <div class="mt-2">
            <p class="text-xl font-bold text-primary-text tabular-nums">
              {{ formatCurrency(summaryData.total_fee, isBothView ? accountCurrency : null) }}
            </p>
            <p
              v-if="isBothView && usdSummaryData"
              class="text-[11px] font-mono text-secondary-text mt-0.5"
            >
              ≈ {{ formatCurrency(usdSummaryData.total_fee, 'USD') }} USD
            </p>
            <p class="text-[10px] text-secondary-text mt-0.5">Performance Fee</p>
          </div>
        </div>

        <!-- FM Net Fee -->
        <!-- <div class="bg-card-background border border-primary-border rounded-2xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium uppercase tracking-wide text-secondary-text">FM Net Fee</span>
            <PieChart class="w-3.5 h-3.5 text-secondary-text" />
          </div>
          <div class="mt-2">
            <p class="text-xl font-bold text-primary-text tabular-nums">
              {{ formatCurrency(summaryData.total_fm_net_after_agents, isBothView ? accountCurrency : null) }}
            </p>
            <p
              v-if="isBothView && usdSummaryData"
              class="text-[11px] font-mono text-secondary-text mt-0.5"
            >
              ≈ {{ formatCurrency(usdSummaryData.total_fm_net_after_agents, 'USD') }} USD
            </p>
            <p class="text-[10px] text-secondary-text mt-0.5">
              Gross: {{ formatCurrency(summaryData.total_fm_fee, isBothView ? accountCurrency : null) }}
              <template v-if="isBothView && usdSummaryData">
                / {{ formatCurrency(usdSummaryData.total_fm_fee, 'USD') }}
              </template>
            </p>
          </div>
        </div> -->

        <!-- Broker Net Fee -->
        <!-- <div class="bg-card-background border border-primary-border rounded-2xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium uppercase tracking-wide text-secondary-text">Broker Net</span>
            <Building2 class="w-3.5 h-3.5 text-secondary-text" />
          </div>
          <div class="mt-2">
            <p class="text-xl font-bold text-primary-text tabular-nums">
              {{ formatCurrency(summaryData.total_broker_net, isBothView ? accountCurrency : null) }}
            </p>
            <p
              v-if="isBothView && usdSummaryData"
              class="text-[11px] font-mono text-secondary-text mt-0.5"
            >
              ≈ {{ formatCurrency(usdSummaryData.total_broker_net, 'USD') }} USD
            </p>
            <p class="text-[10px] text-secondary-text mt-0.5">
              Gross: {{ formatCurrency(summaryData.total_broker_fee, isBothView ? accountCurrency : null) }}
              <template v-if="isBothView && usdSummaryData">
                / {{ formatCurrency(usdSummaryData.total_broker_fee, 'USD') }}
              </template>
            </p>
          </div>
        </div> -->

        <!-- IB Pool Distributed -->
        <!-- <div class="bg-card-background border border-primary-border rounded-2xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium uppercase tracking-wide text-secondary-text">IB Distributed</span>
            <GitBranch class="w-3.5 h-3.5 text-secondary-text" />
          </div>
          <div class="mt-2">
            <p class="text-xl font-bold text-primary-green tabular-nums">
              {{ formatCurrency(summaryData.total_ib_distributed, isBothView ? accountCurrency : null) }}
            </p>
            <p
              v-if="isBothView && usdSummaryData"
              class="text-[11px] font-mono text-primary-green/90 mt-0.5"
            >
              ≈ {{ formatCurrency(usdSummaryData.total_ib_distributed, 'USD') }} USD
            </p>
            <p class="text-[10px] text-secondary-text mt-0.5">{{ rawIbList.length }} IBs Benefiting</p>
          </div>
        </div> -->

        <!-- Volume Stats -->
        <div class="bg-card-background border border-primary-border rounded-2xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium uppercase tracking-wide text-secondary-text">Volume</span>
            <Users class="w-3.5 h-3.5 text-secondary-text" />
          </div>
          <div class="mt-2">
            <p class="text-xl font-bold text-primary-text tabular-nums">{{ summaryData.total_trades }}</p>
            <p class="text-[10px] text-secondary-text mt-0.5">
              {{ summaryData.unique_users }} Client{{ summaryData.unique_users === 1 ? '' : 's' }} · {{ summaryData.unique_followers }} Follower{{ summaryData.unique_followers === 1 ? '' : 's' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Tabs & Search -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-primary-border pb-3">
        <div class="flex items-center gap-1.5 overflow-x-auto">
          <button
            class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
            :class="activeTab === 'users' ? 'bg-primary text-white' : 'bg-card-background border border-primary-border text-secondary-text hover:text-primary-text'"
            @click="activeTab = 'users'"
          >
            <Users class="w-3.5 h-3.5" />
            Client Summaries
            <span
              class="px-1.5 py-0.2 rounded-full text-[10px] font-semibold"
              :class="activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-background text-secondary-text'"
            >
              {{ rawUsersList.length }}
            </span>
          </button>

          <button
            class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
            :class="activeTab === 'ib_summary' ? 'bg-primary text-white' : 'bg-card-background border border-primary-border text-secondary-text hover:text-primary-text'"
            @click="activeTab = 'ib_summary'"
          >
            <PieChart class="w-3.5 h-3.5" />
            IB Summary
            <span
              class="px-1.5 py-0.2 rounded-full text-[10px] font-semibold"
              :class="activeTab === 'ib_summary' ? 'bg-white/20 text-white' : 'bg-background text-secondary-text'"
            >
              {{ rawIbList.length }}
            </span>
          </button>

          <button
            v-if="settlement?.agent_distribution?.length"
            class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
            :class="activeTab === 'agent_distribution' ? 'bg-primary text-white' : 'bg-card-background border border-primary-border text-secondary-text hover:text-primary-text'"
            @click="activeTab = 'agent_distribution'"
          >
            <Shield class="w-3.5 h-3.5" />
            Agent Distribution
            <span
              class="px-1.5 py-0.2 rounded-full text-[10px] font-semibold"
              :class="activeTab === 'agent_distribution' ? 'bg-white/20 text-white' : 'bg-background text-secondary-text'"
            >
              {{ settlement.agent_distribution.length }}
            </span>
          </button>
        </div>

        <!-- Search Bar -->
        <div v-if="activeTab === 'users' || activeTab === 'ib_summary'" class="relative w-full sm:w-72">
          <Search class="w-3.5 h-3.5 text-secondary-text absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="activeTab === 'users' ? 'Search client by name, email, ID, account...' : 'Search IB by name, email, ID...'"
            class="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-card-background border border-primary-border text-primary-text placeholder:text-secondary-text outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 1: CLIENTS SUMMARY TABLE -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'users'">

        <!-- Desktop Table -->
        <div class="hidden lg:block border border-primary-border rounded-2xl overflow-hidden bg-card-background shadow-2xs">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b border-primary-border bg-background/50">
                  <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">Client</th>
                  <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">Accounts</th>
                  <th class="text-center text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">Trades</th>
                  <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">Gross PnL</th>
                  <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">Total Fee</th>
                  <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">FM Fee</th>
                  <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">Broker Fee</th>
                  <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">IB Distributed</th>
                  <th class="text-right text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">Net PnL</th>
                  <th class="text-center text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3 w-28">Action</th>
                </tr>
              </thead>

              <tbody v-if="store.loading">
                <tr v-for="n in 4" :key="n" class="border-b border-primary-border animate-pulse">
                  <td class="p-3"><div class="h-3 w-28 bg-background rounded" /></td>
                  <td class="p-3"><div class="h-3 w-20 bg-background rounded" /></td>
                  <td class="p-3"><div class="h-3 w-12 bg-background rounded mx-auto" /></td>
                  <td class="p-3"><div class="h-3 w-14 bg-background rounded" /></td>
                  <td class="p-3"><div class="h-3 w-14 bg-background rounded" /></td>
                  <td class="p-3"><div class="h-3 w-14 bg-background rounded" /></td>
                  <td class="p-3"><div class="h-3 w-14 bg-background rounded" /></td>
                  <td class="p-3"><div class="h-3 w-14 bg-background rounded" /></td>
                  <td class="p-3 flex justify-end"><div class="h-3 w-16 bg-background rounded" /></td>
                  <td class="p-3"><div class="h-6 w-16 bg-background rounded mx-auto" /></td>
                </tr>
              </tbody>

              <tbody v-else>
                <tr
                  v-for="u in filteredUsers"
                  :key="u.user_id"
                  class="border-b border-primary-border last:border-none hover:bg-background/40 transition-colors"
                >
                  <!-- Client Profile -->
                  <td class="p-3">
                    <p class="text-xs font-semibold text-primary-text">{{ u.user_name || 'Client' }}</p>
                    <p class="text-[11px] text-secondary-text font-mono">{{ u.user_email }}</p>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="text-[10px] text-secondary-text font-mono">User ID: #{{ u.user_id }}</span>
                      <span v-if="u.phone_number" class="text-[10px] text-secondary-text">· {{ u.phone_number }}</span>
                    </div>
                  </td>

                  <!-- Accounts & Follower Counts -->
                  <td class="p-3">
                    <div class="flex flex-wrap gap-1 mb-1">
                      <span
                        v-for="acc in (u.account_numbers || [])"
                        :key="acc"
                        class="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-background border border-primary-border text-primary-text"
                      >
                        {{ acc }}
                      </span>
                      <span v-if="!u.account_numbers?.length" class="text-[11px] text-secondary-text">—</span>
                    </div>
                    <p class="text-[10px] text-secondary-text">
                      {{ u.followers_count ?? 1 }} Follower{{ (u.followers_count ?? 1) === 1 ? '' : 's' }}
                    </p>
                  </td>

                  <!-- Trades Count -->
                  <td class="p-3 text-center">
                    <span class="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-background border border-primary-border text-primary-text">
                      {{ u.trades_count ?? 0 }}
                    </span>
                  </td>

                  <!-- Gross PnL -->
                  <td class="p-3">
                    <p
                      class="text-xs font-semibold tabular-nums"
                      :class="u.gross_pnl >= 0 ? 'text-primary-green' : 'text-primary-red'"
                    >
                      {{ u.gross_pnl > 0 ? '+' : '' }}{{ formatCurrency(u.gross_pnl, isBothView ? accountCurrency : null) }}
                    </p>
                    <p
                      v-if="isBothView && u.usd"
                      class="text-[10px] font-mono tabular-nums mt-0.5"
                      :class="u.usd.gross_pnl >= 0 ? 'text-primary-green/80' : 'text-primary-red/80'"
                    >
                      {{ u.usd.gross_pnl > 0 ? '+' : '' }}{{ formatCurrency(u.usd.gross_pnl, 'USD') }} USD
                    </p>
                  </td>

                  <!-- Total Fee -->
                  <td class="p-3">
                    <p class="text-xs font-medium text-primary-text tabular-nums">
                      {{ formatCurrency(u.total_fee, isBothView ? accountCurrency : null) }}
                    </p>
                    <p
                      v-if="isBothView && u.usd"
                      class="text-[10px] font-mono text-secondary-text tabular-nums mt-0.5"
                    >
                      {{ formatCurrency(u.usd.total_fee, 'USD') }} USD
                    </p>
                  </td>

                  <!-- FM Fee -->
                  <td class="p-3">
                    <p class="text-xs font-medium text-primary-text tabular-nums">
                      {{ formatCurrency(u.fm_net_after_agents ?? u.fm_fee, isBothView ? accountCurrency : null) }}
                    </p>
                    <p
                      v-if="isBothView && u.usd"
                      class="text-[10px] font-mono text-secondary-text tabular-nums mt-0.5"
                    >
                      {{ formatCurrency(u.usd.fm_net_after_agents ?? u.usd.fm_fee, 'USD') }} USD
                    </p>
                    <p
                      v-if="u.fm_fee !== (u.fm_net_after_agents ?? u.fm_fee) && u.fm_fee != null"
                      class="text-[10px] text-secondary-text"
                    >
                      Gross: {{ formatCurrency(u.fm_fee, isBothView ? accountCurrency : null) }}
                      <template v-if="isBothView && u.usd">
                        / {{ formatCurrency(u.usd.fm_fee, 'USD') }}
                      </template>
                    </p>
                  </td>

                  <!-- Broker Fee -->
                  <td class="p-3">
                    <p class="text-xs font-medium text-primary-text tabular-nums">
                      {{ formatCurrency(u.broker_net ?? u.broker_fee, isBothView ? accountCurrency : null) }}
                    </p>
                    <p
                      v-if="isBothView && u.usd"
                      class="text-[10px] font-mono text-secondary-text tabular-nums mt-0.5"
                    >
                      {{ formatCurrency(u.usd.broker_net ?? u.usd.broker_fee, 'USD') }} USD
                    </p>
                    <p
                      v-if="u.broker_fee !== (u.broker_net ?? u.broker_fee) && u.broker_fee != null"
                      class="text-[10px] text-secondary-text"
                    >
                      Gross: {{ formatCurrency(u.broker_fee, isBothView ? accountCurrency : null) }}
                      <template v-if="isBothView && u.usd">
                        / {{ formatCurrency(u.usd.broker_fee, 'USD') }}
                      </template>
                    </p>
                  </td>

                  <!-- IB Distributed -->
                  <td class="p-3">
                    <p class="text-xs font-medium text-primary-green tabular-nums">
                      {{ formatCurrency(u.ib_distributed ?? u.ib_pool, isBothView ? accountCurrency : null) }}
                    </p>
                    <p
                      v-if="isBothView && u.usd"
                      class="text-[10px] font-mono text-primary-green/80 tabular-nums mt-0.5"
                    >
                      {{ formatCurrency(u.usd.ib_distributed ?? u.usd.ib_pool, 'USD') }} USD
                    </p>
                  </td>

                  <!-- Net PnL -->
                  <td class="p-3 text-right">
                    <p
                      class="text-xs font-bold tabular-nums"
                      :class="u.net_pnl >= 0 ? 'text-primary-green' : 'text-primary-red'"
                    >
                      {{ u.net_pnl > 0 ? '+' : '' }}{{ formatCurrency(u.net_pnl, isBothView ? accountCurrency : null) }}
                    </p>
                    <p
                      v-if="isBothView && u.usd"
                      class="text-[10px] font-mono tabular-nums mt-0.5"
                      :class="u.usd.net_pnl >= 0 ? 'text-primary-green/80' : 'text-primary-red/80'"
                    >
                      {{ u.usd.net_pnl > 0 ? '+' : '' }}{{ formatCurrency(u.usd.net_pnl, 'USD') }} USD
                    </p>
                  </td>

                  <!-- Action Button -->
                  <td class="p-3 text-center">
                    <button
                      class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-medium transition-colors cursor-pointer"
                      @click="goToUserDetails(u)"
                    >
                      <span>Details</span>
                      <ChevronRight class="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>

                <tr v-if="filteredUsers.length === 0">
                  <td colspan="10" class="text-center py-12 text-xs text-secondary-text">
                    No clients found matching your search.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Mobile Client Cards -->
        <div class="lg:hidden space-y-3">
          <div
            v-for="u in filteredUsers"
            :key="u.user_id"
            class="bg-card-background border border-primary-border rounded-2xl p-4 space-y-3 shadow-2xs cursor-pointer hover:border-primary transition-colors"
            @click="goToUserDetails(u)"
          >
            <!-- Card Header -->
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs font-semibold text-primary-text">{{ u.user_name || 'Client' }}</p>
                <p class="text-[11px] text-secondary-text font-mono">{{ u.user_email }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] text-secondary-text font-mono">User ID: #{{ u.user_id }}</span>
                  <span class="text-[10px] text-secondary-text font-mono">· {{ u.trades_count ?? 0 }} trades</span>
                </div>
              </div>

              <div class="text-right">
                <p class="text-[10px] text-secondary-text">Net PnL</p>
                <p
                  class="text-sm font-bold tabular-nums"
                  :class="u.net_pnl >= 0 ? 'text-primary-green' : 'text-primary-red'"
                >
                  {{ u.net_pnl > 0 ? '+' : '' }}{{ formatCurrency(u.net_pnl, isBothView ? accountCurrency : null) }}
                </p>
                <p
                  v-if="isBothView && u.usd"
                  class="text-[10px] font-mono tabular-nums mt-0.5"
                  :class="u.usd.net_pnl >= 0 ? 'text-primary-green/80' : 'text-primary-red/80'"
                >
                  {{ u.usd.net_pnl > 0 ? '+' : '' }}{{ formatCurrency(u.usd.net_pnl, 'USD') }} USD
                </p>
              </div>
            </div>

            <!-- Accounts chips -->
            <div v-if="u.account_numbers?.length" class="flex flex-wrap gap-1">
              <span
                v-for="acc in u.account_numbers"
                :key="acc"
                class="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-background border border-primary-border text-primary-text"
              >
                {{ acc }}
              </span>
            </div>

            <!-- Card Metrics Grid -->
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-background rounded-xl p-2.5">
                <p class="text-[10px] text-secondary-text">Gross PnL</p>
                <p class="font-semibold tabular-nums mt-0.5" :class="u.gross_pnl >= 0 ? 'text-primary-green' : 'text-primary-red'">
                  {{ u.gross_pnl > 0 ? '+' : '' }}{{ formatCurrency(u.gross_pnl, isBothView ? accountCurrency : null) }}
                </p>
                <p
                  v-if="isBothView && u.usd"
                  class="text-[10px] font-mono tabular-nums mt-0.5"
                  :class="u.usd.gross_pnl >= 0 ? 'text-primary-green/80' : 'text-primary-red/80'"
                >
                  {{ u.usd.gross_pnl > 0 ? '+' : '' }}{{ formatCurrency(u.usd.gross_pnl, 'USD') }} USD
                </p>
              </div>

              <div class="bg-background rounded-xl p-2.5">
                <p class="text-[10px] text-secondary-text">Total Fee</p>
                <p class="font-semibold text-primary-text tabular-nums mt-0.5">
                  {{ formatCurrency(u.total_fee, isBothView ? accountCurrency : null) }}
                </p>
                <p
                  v-if="isBothView && u.usd"
                  class="text-[10px] font-mono text-secondary-text tabular-nums mt-0.5"
                >
                  {{ formatCurrency(u.usd.total_fee, 'USD') }} USD
                </p>
              </div>

              <div class="bg-background rounded-xl p-2.5">
                <p class="text-[10px] text-secondary-text">FM Net Fee</p>
                <p class="font-semibold text-primary-text tabular-nums mt-0.5">
                  {{ formatCurrency(u.fm_net_after_agents ?? u.fm_fee, isBothView ? accountCurrency : null) }}
                </p>
                <p
                  v-if="isBothView && u.usd"
                  class="text-[10px] font-mono text-secondary-text tabular-nums mt-0.5"
                >
                  {{ formatCurrency(u.usd.fm_net_after_agents ?? u.usd.fm_fee, 'USD') }} USD
                </p>
              </div>

              <div class="bg-background rounded-xl p-2.5">
                <p class="text-[10px] text-secondary-text">Broker Net</p>
                <p class="font-semibold text-primary-text tabular-nums mt-0.5">
                  {{ formatCurrency(u.broker_net ?? u.broker_fee, isBothView ? accountCurrency : null) }}
                </p>
                <p
                  v-if="isBothView && u.usd"
                  class="text-[10px] font-mono text-secondary-text tabular-nums mt-0.5"
                >
                  {{ formatCurrency(u.usd.broker_net ?? u.usd.broker_fee, 'USD') }} USD
                </p>
              </div>
            </div>

            <!-- Action Details Button -->
            <button
              class="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary-hover transition-colors cursor-pointer"
              @click.stop="goToUserDetails(u)"
            >
              <span>View Client Breakdown & Trades</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 2: IB SUMMARY -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div v-else-if="activeTab === 'ib_summary'">
        <div class="border border-primary-border rounded-2xl overflow-hidden bg-card-background shadow-2xs">
          <div class="px-5 py-3.5 border-b border-primary-border flex items-center justify-between bg-card-background">
            <div class="flex items-center gap-2">
              <PieChart class="w-4 h-4 text-secondary-text" />
              <span class="text-xs font-semibold text-primary-text">IB Settlement Summary</span>
            </div>
            <span class="text-xs text-secondary-text">
              Total Commission:
              <span class="font-semibold text-primary-green">
                {{ formatCurrency(summaryData.total_ib_distributed, isBothView ? accountCurrency : null) }}
              </span>
              <span v-if="isBothView && usdSummaryData" class="text-xs text-secondary-text ml-1">
                (≈ {{ formatCurrency(usdSummaryData.total_ib_distributed, 'USD') }} USD)
              </span>
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b border-primary-border bg-background/50">
                  <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">IB Partner</th>
                  <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">Level</th>
                  <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">Split %</th>
                  <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">Eligible Trades</th>
                  <th class="text-right text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">Total Commission</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(ib, idx) in filteredIbSummary"
                  :key="ib.ib_id || idx"
                  class="border-b border-primary-border last:border-none hover:bg-background/40 transition-colors"
                >
                  <td class="p-3">
                    <p class="text-xs font-semibold text-primary-text">{{ ib.ib_name }}</p>
                    <p class="text-[11px] text-secondary-text">{{ ib.ib_email }}</p>
                    <p class="text-[10px] text-secondary-text">User ID: #{{ ib.ib_user_id }} · IB ID: #{{ ib.ib_id }}</p>
                  </td>

                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-background border border-primary-border text-primary-text">
                      Level {{ ib.ib_level }}
                    </span>
                  </td>

                  <td class="p-3">
                    <span class="text-xs font-mono text-primary-text">{{ ib.split_percentage }}%</span>
                  </td>

                  <td class="p-3">
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="tid in ib.trade_ids"
                        :key="tid"
                        class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-background border border-primary-border text-secondary-text"
                      >
                        #{{ tid }}
                      </span>
                    </div>
                  </td>

                  <td class="p-3 text-right">
                    <p class="text-xs font-bold font-mono text-primary-green">
                      {{ formatCurrency(ib.total_commission, isBothView ? accountCurrency : null) }}
                    </p>
                    <p
                      v-if="isBothView && ib.usd"
                      class="text-[10px] font-mono text-primary-green/80 mt-0.5"
                    >
                      {{ formatCurrency(ib.usd.total_commission, 'USD') }} USD
                    </p>
                  </td>
                </tr>

                <tr v-if="filteredIbSummary.length === 0">
                  <td colspan="5" class="text-center py-10 text-xs text-secondary-text">
                    No IB summary records found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 3: AGENT DISTRIBUTION -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div v-else-if="activeTab === 'agent_distribution'">
        <div class="border border-primary-border rounded-2xl overflow-hidden bg-card-background shadow-2xs">
          <div class="px-5 py-3.5 border-b border-primary-border flex items-center justify-between bg-card-background">
            <div class="flex items-center gap-2">
              <Shield class="w-4 h-4 text-secondary-text" />
              <span class="text-xs font-semibold text-primary-text">Agent Distribution</span>
            </div>
            <span class="text-xs text-secondary-text">
              Total Agent Distributed:
              <span class="font-semibold text-primary-text">
                {{ formatCurrency(summaryData.total_agent_distributed, isBothView ? accountCurrency : null) }}
              </span>
              <span v-if="isBothView && usdSummaryData" class="text-xs text-secondary-text ml-1">
                (≈ {{ formatCurrency(usdSummaryData.total_agent_distributed, 'USD') }} USD)
              </span>
            </span>
          </div>

          <div v-if="!settlement?.agent_distribution?.length" class="text-center py-12 text-xs text-secondary-text">
            No agent distributions recorded for this settlement.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b border-primary-border bg-background/50">
                  <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">Agent</th>
                  <th class="text-right text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3">Commission</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(agent, idx) in settlement.agent_distribution"
                  :key="idx"
                  class="border-b border-primary-border last:border-none"
                >
                  <td class="p-3 text-xs font-medium text-primary-text">{{ agent.name || agent.email || 'Agent' }}</td>
                  <td class="p-3 text-right text-xs font-semibold text-primary-green tabular-nums">
                    {{ formatCurrency(agent.commission, isBothView ? accountCurrency : null) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </template>

  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ReceiptText,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Building2,
  GitBranch,
  ChevronRight,
  Search,
  RotateCw,
  Clock,
  Calendar,
  BarChart2,
  Shield,
} from 'lucide-vue-next'
import { useSettlementDetailStore } from '@/stores/fm/settlements/settlementDetail'

const route = useRoute()
const router = useRouter()
const store = useSettlementDetailStore()

const activeTab = ref('users')
const searchQuery = ref('')

const settlement = computed(() => store.settlement)

// Currency computations
const accountCurrency = computed(() => {
  return (
    settlement.value?.currency?.account_currency ||
    settlement.value?.amounts?.account_units?.currency ||
    settlement.value?.display?.currency ||
    settlement.value?.broker_currency ||
    settlement.value?.currency ||
    route.query.currency ||
    'USC'
  )
})

const payoutCurrency = computed(() => {
  return (
    settlement.value?.currency?.payout_currency ||
    settlement.value?.amounts?.usd?.currency ||
    'USD'
  )
})

const activeCurrency = computed(() => {
  if (store.amountView === 'usd') {
    return payoutCurrency.value
  }
  if (store.amountView === 'account_units') {
    return accountCurrency.value
  }
  // If 'both'
  const acc = accountCurrency.value
  const pay = payoutCurrency.value
  if (acc && pay && acc.toUpperCase() !== pay.toUpperCase()) {
    return `${acc} & ${pay}`
  }
  return acc || pay || 'USD'
})

const isBothView = computed(() => store.amountView === 'both')

const amountViewOptions = computed(() => {
  const acc = accountCurrency.value || 'USC'
  const pay = payoutCurrency.value || 'USD'
  return [
    { label: `${acc} (Account Units)`, value: 'account_units' },
    { label: `${pay}`, value: 'usd' },
    { label: 'Both', value: 'both' },
  ]
})

const switchAmountView = (view) => {
  if (store.amountView === view || store.loading) return
  store.fetchSettlementDetail(route.params.id, view)
}

const getCurrencySymbol = (currency) => {
  const c = String(currency || '').trim().toUpperCase()
  if (c === 'USC' || c === 'CENT' || c === 'CENTS') return 'C'
  if (c === 'CAD') return 'C$'
  if (c === 'EUR') return '€'
  if (c === 'GBP') return '£'
  if (c === 'INR') return '₹'
  if (c === 'JPY') return '¥'
  if (c === 'USD') return '$'
  return c ? `${c} ` : '$'
}

const formatCurrency = (val, currency = null) => {
  if (val === null || val === undefined || val === '') return '—'
  const num = Number(val)
  if (isNaN(num)) return '—'
  const cur = currency || (store.amountView === 'usd' ? payoutCurrency.value : accountCurrency.value)
  const sym = getCurrencySymbol(cur)
  const isNegative = num < 0
  const formatted = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${isNegative ? '-' : ''}${sym}${formatted}`
}

// Summary Metrics Data
const summaryData = computed(() => {
  let s = {}
  if (store.amountView === 'usd') {
    s = settlement.value?.amounts?.usd?.summary || settlement.value?.display?.summary || settlement.value?.summary || {}
  } else if (store.amountView === 'both') {
    s = settlement.value?.amounts?.account_units?.summary || settlement.value?.summary_account_units || settlement.value?.display?.summary || settlement.value?.summary || {}
  } else {
    // account_units
    s = settlement.value?.amounts?.account_units?.summary || settlement.value?.display?.summary || settlement.value?.summary_account_units || settlement.value?.summary || {}
  }

  return {
    total_pnl: s.total_pnl ?? settlement.value?.total_pnl ?? 0,
    total_fee: s.total_fee ?? settlement.value?.total_fee ?? 0,
    total_trades: s.total_trades ?? settlement.value?.trades_count ?? settlement.value?.unsettled_count ?? 0,
    unique_followers: s.unique_followers ?? 0,
    unique_users: s.unique_users ?? rawUsersList.value.length,
    total_fm_fee: s.total_fm_fee ?? 0,
    total_fm_net_after_agents: s.total_fm_net_after_agents ?? s.total_fm_fee ?? 0,
    total_broker_fee: s.total_broker_fee ?? 0,
    total_broker_net: s.total_broker_net ?? s.total_broker_fee ?? 0,
    total_ib_distributed: s.total_ib_distributed ?? 0,
    total_agent_distributed: s.total_agent_distributed ?? 0,
  }
})

const usdSummaryData = computed(() => {
  if (!isBothView.value) return null
  const s = settlement.value?.amounts?.usd?.summary || settlement.value?.summary || {}
  return {
    total_pnl: s.total_pnl ?? 0,
    total_fee: s.total_fee ?? 0,
    total_fm_fee: s.total_fm_fee ?? 0,
    total_fm_net_after_agents: s.total_fm_net_after_agents ?? s.total_fm_fee ?? 0,
    total_broker_fee: s.total_broker_fee ?? 0,
    total_broker_net: s.total_broker_net ?? s.total_broker_fee ?? 0,
    total_ib_distributed: s.total_ib_distributed ?? 0,
    total_agent_distributed: s.total_agent_distributed ?? 0,
  }
})

const totalPnl = computed(() => summaryData.value.total_pnl)

// Raw users list with dual data support
const rawUsersList = computed(() => {
  if (store.amountView === 'usd') {
    return (
      settlement.value?.amounts?.usd?.users_summary ||
      settlement.value?.display?.users_summary ||
      settlement.value?.users_summary ||
      []
    )
  }

  if (store.amountView === 'both') {
    const accUsers =
      settlement.value?.amounts?.account_units?.users_summary ||
      settlement.value?.display?.users_summary ||
      settlement.value?.users_summary ||
      []
    const usdUsers = settlement.value?.amounts?.usd?.users_summary || []

    const usdMap = new Map()
    usdUsers.forEach((u) => {
      if (u.user_id != null) usdMap.set(String(u.user_id), u)
    })

    return accUsers.map((u, idx) => {
      const usdU = usdMap.get(String(u.user_id)) || usdUsers[idx] || {}
      return {
        ...u,
        usd: {
          gross_pnl: usdU.gross_pnl ?? u.gross_pnl,
          total_fee: usdU.total_fee ?? u.total_fee,
          fm_fee: usdU.fm_fee ?? u.fm_fee,
          fm_net_after_agents: usdU.fm_net_after_agents ?? u.fm_net_after_agents ?? usdU.fm_fee,
          broker_fee: usdU.broker_fee ?? u.broker_fee,
          broker_net: usdU.broker_net ?? u.broker_net ?? usdU.broker_fee,
          ib_distributed: usdU.ib_distributed ?? u.ib_distributed ?? usdU.ib_pool,
          net_pnl: usdU.net_pnl ?? u.net_pnl,
        },
      }
    })
  }

  // Default: account_units
  return (
    settlement.value?.amounts?.account_units?.users_summary ||
    settlement.value?.display?.users_summary ||
    settlement.value?.users_summary ||
    []
  )
})

// Raw IB list with dual data support
const rawIbList = computed(() => {
  if (store.amountView === 'usd') {
    return (
      settlement.value?.amounts?.usd?.ib_summary ||
      settlement.value?.display?.ib_summary ||
      settlement.value?.ib_summary ||
      []
    )
  }

  if (store.amountView === 'both') {
    const accIbs =
      settlement.value?.amounts?.account_units?.ib_summary ||
      settlement.value?.display?.ib_summary ||
      settlement.value?.ib_summary ||
      []
    const usdIbs = settlement.value?.amounts?.usd?.ib_summary || []

    const usdMap = new Map()
    usdIbs.forEach((ib) => {
      const key = ib.ib_id != null ? `id_${ib.ib_id}` : `uid_${ib.ib_user_id}`
      usdMap.set(key, ib)
    })

    return accIbs.map((ib, idx) => {
      const key = ib.ib_id != null ? `id_${ib.ib_id}` : `uid_${ib.ib_user_id}`
      const usdIb = usdMap.get(key) || usdIbs[idx] || {}
      return {
        ...ib,
        usd: {
          total_commission: usdIb.total_commission ?? ib.total_commission,
        },
      }
    })
  }

  // Default: account_units
  return (
    settlement.value?.amounts?.account_units?.ib_summary ||
    settlement.value?.display?.ib_summary ||
    settlement.value?.ib_summary ||
    []
  )
})

const hasEmptyData = computed(() => {
  if (store.loading) return false
  if (!settlement.value) return true
  const usersCount = rawUsersList.value.length
  const tradesCount =
    settlement.value?.trades_count ??
    settlement.value?.unsettled_count ??
    summaryData.value.total_trades ??
    0
  return usersCount === 0 && tradesCount === 0
})

// Search filtered lists
const filteredUsers = computed(() => {
  const list = rawUsersList.value
  if (!searchQuery.value.trim()) return list
  const q = searchQuery.value.toLowerCase().trim()
  return list.filter((u) => {
    const accMatches = Array.isArray(u.account_numbers)
      ? u.account_numbers.some((acc) => String(acc).toLowerCase().includes(q))
      : false
    return (
      String(u.user_name || '').toLowerCase().includes(q) ||
      String(u.user_email || '').toLowerCase().includes(q) ||
      String(u.user_id || '').includes(q) ||
      String(u.phone_number || '').includes(q) ||
      accMatches
    )
  })
})

const filteredIbSummary = computed(() => {
  const list = rawIbList.value
  if (!searchQuery.value.trim()) return list
  const q = searchQuery.value.toLowerCase().trim()
  return list.filter((ib) =>
    String(ib.ib_name || '').toLowerCase().includes(q) ||
    String(ib.ib_email || '').toLowerCase().includes(q) ||
    String(ib.ib_user_id || '').includes(q) ||
    String(ib.ib_id || '').includes(q)
  )
})

const periodDateRange = computed(() => {
  const start = settlement.value?.settlement_period_start
  const end = settlement.value?.settlement_period_end
  if (!start && !end) return null
  return `${formatDate(start)} – ${formatDate(end)}`
})

const formatDate = (val) => {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return String(val)
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch (e) {
    return String(val)
  }
}

const statusClass = (s) =>
  ({
    completed: 'bg-primary-green/10 text-primary-green border-primary-green/20',
    pending: 'bg-primary-yellow/10 text-primary-yellow border-primary-yellow/20',
    failed: 'bg-primary-red/10 text-primary-red border-primary-red/20',
  }[String(s).toLowerCase()] ?? 'bg-background text-secondary-text border-primary-border')

const goToUserDetails = (user) => {
  if (!user?.user_id) return
  router.push({
    name: 'fm-settlement-user',
    params: { id: route.params.id, user_id: user.user_id },
    query: {
      currency: store.amountView === 'usd' ? payoutCurrency.value : accountCurrency.value,
      amount_view: store.amountView,
    },
  })
}

const goToTrades = () => {
  router.push(`/fm-settlements/trades/${route.params.id}`)
}

const loadData = () => {
  store.fetchSettlementDetail(route.params.id)
}

onMounted(() => {
  loadData()
})
</script>
