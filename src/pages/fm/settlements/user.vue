<template>
  <div class="px-4 pb-8 space-y-6">
    <!-- Header & Navigation -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div class="space-y-1">
        <div class="flex items-center gap-2.5 flex-wrap pt-1">
          <!-- <button
            class="p-2 rounded-xl border border-primary-border bg-card-background hover:bg-background text-secondary-text hover:text-primary-text transition-colors cursor-pointer mr-1"
            title="Back to Settlement Details"
            @click="goBack"
          >
            <ArrowLeft class="w-4 h-4" />
          </button>

          <h1 class="text-base font-bold text-primary-text">
            Client Settlement Details
          </h1> -->

          <span
            v-if="store.data?.settlement_id"
            class="px-2.5 py-1 rounded-md text-xs font-bold bg-primary text-white"
          >
            Settlement #{{ store.data.settlement_id }}
          </span>

          <span
            v-if="store.data?.fm_name"
            class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-card-background text-secondary-text border border-primary-border"
          >
            FM: {{ store.data.fm_name }} (FM #{{ store.data.fm_id }})
          </span>

          <span
            v-if="store.data?.status"
            class="text-[11px] font-medium px-2.5 py-0.5 rounded-full border capitalize"
            :class="statusClass(store.data.status)"
          >
            {{ store.data.status }}
          </span>

          <span
            class="px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono bg-card-background text-primary border border-primary-border uppercase"
          >
            {{ activeCurrency }}
          </span>
        </div>
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
          @click="loadData()"
        >
          <RotateCw
            class="w-3.5 h-3.5"
            :class="{ 'animate-spin': store.loading }"
          />
          Refresh
        </button>
      </div>
    </div>

    <!-- Skeletons Loading State -->
    <div v-if="store.loading" class="space-y-6">
      <div
        class="bg-card-background border border-primary-border rounded-2xl p-5 animate-pulse space-y-4"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-background" />
          <div class="space-y-2">
            <div class="h-4 w-40 bg-background rounded" />
            <div class="h-3 w-60 bg-background rounded" />
          </div>
        </div>
      </div>

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
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!store.data || (!userData.user_id && !store.data?.display)"
      class="flex flex-col items-center justify-center py-20 gap-4 bg-card-background border border-primary-border rounded-2xl"
    >
      <div
        class="w-14 h-14 rounded-2xl bg-background border border-primary-border flex items-center justify-center"
      >
        <ReceiptText class="w-6 h-6 text-secondary-text" />
      </div>
      <div class="text-center max-w-sm px-4">
        <p class="text-sm font-semibold text-primary-text">
          No Settlement Data Found
        </p>
        <p class="text-xs text-secondary-text mt-1">
          Unable to find settlement details for this client in settlement #{{ route.params.id }}.
        </p>
        <button
          class="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer"
          @click="goBack"
        >
          Return to Settlement
        </button>
      </div>
    </div>

    <template v-else>
      <!-- Client Profile Hero Card -->
      <div
        class="bg-card-background border border-primary-border rounded-2xl p-4 sm:p-5 shadow-2xs"
      >
        <div
          class="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div
              class="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm flex items-center justify-center shrink-0"
            >
              {{
                (
                  userData.user_name ||
                  userData.user?.name ||
                  userData.name ||
                  "U"
                )[0].toUpperCase()
              }}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-base font-bold text-primary-text truncate">
                  {{
                    userData.user_name ||
                    userData.user?.name ||
                    userData.name ||
                    "Client Details"
                  }}
                </h2>
                <span
                  class="text-2xs font-mono font-semibold px-2 py-0.5 rounded-md border text-secondary-text bg-background border-primary-border"
                >
                  User ID: #{{
                    userData.user_id ||
                    userData.user?.user_id ||
                    currentUserId
                  }}
                </span>
              </div>
              <div
                class="flex items-center gap-3 text-xs text-secondary-text mt-1.5 flex-wrap font-medium"
              >
                <span
                  v-if="userData.user_email || userData.user?.email || userData.email"
                  class="flex items-center gap-1 font-mono text-primary-text select-all"
                >
                  <Mail class="w-3.5 h-3.5 text-primary shrink-0" />
                  {{ userData.user_email || userData.user?.email || userData.email }}
                </span>
                <span
                  v-if="userData.phone_number || userData.user?.phone_number"
                  class="flex items-center gap-1 text-secondary-text"
                >
                  <Phone class="w-3.5 h-3.5 text-secondary-text shrink-0" />
                  {{ userData.phone_number || userData.user?.phone_number }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Stats Count -->
          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <div
              class="flex items-center gap-2 bg-background border border-primary-border rounded-xl px-3 py-2 text-xs"
            >
              <Users class="w-3.5 h-3.5 text-primary" />
              <span class="text-secondary-text">Follower Sessions:</span>
              <span class="font-bold text-primary-text">{{
                followerList.length
              }}</span>
            </div>
            <div
              class="flex items-center gap-2 bg-background border border-primary-border rounded-xl px-3 py-2 text-xs"
            >
              <Activity class="w-3.5 h-3.5 text-primary" />
              <span class="text-secondary-text">Total Trades:</span>
              <span class="font-bold text-primary-text">{{
                userSummary.trades_count ?? totalTradesCount
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Metrics Summary Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <!-- Net PnL -->
        <div
          class="bg-card-background border border-primary-border rounded-2xl p-4 flex flex-col justify-between"
        >
          <div class="flex items-center justify-between">
            <span
              class="text-[11px] font-medium uppercase tracking-wide text-secondary-text"
              >Net PnL</span
            >
            <TrendingUp
              v-if="userSummary.net_pnl >= 0"
              class="w-3.5 h-3.5 text-primary-green"
            />
            <TrendingDown v-else class="w-3.5 h-3.5 text-primary-red" />
          </div>
          <div class="mt-2">
            <p
              class="text-xl font-bold tabular-nums"
              :class="
                userSummary.net_pnl >= 0
                  ? 'text-primary-green'
                  : 'text-primary-red'
              "
            >
              {{ userSummary.net_pnl > 0 ? "+" : ""
              }}{{ formatCurrency(userSummary.net_pnl, isBothView ? accountCurrency : null) }}
            </p>
            <p
              v-if="isBothView && usdUserSummary"
              class="text-[11px] font-mono tabular-nums mt-0.5"
              :class="usdUserSummary.net_pnl >= 0 ? 'text-primary-green/90' : 'text-primary-red/90'"
            >
              ≈ {{ usdUserSummary.net_pnl > 0 ? "+" : "" }}{{ formatCurrency(usdUserSummary.net_pnl, "USD") }} USD
            </p>
            <p class="text-2xs text-secondary-text mt-0.5">
              After deductions
            </p>
          </div>
        </div>

        <!-- Gross PnL -->
        <div
          class="bg-card-background border border-primary-border rounded-2xl p-4 flex flex-col justify-between"
        >
          <div class="flex items-center justify-between">
            <span
              class="text-[11px] font-medium uppercase tracking-wide text-secondary-text"
              >Gross PnL</span
            >
            <TrendingUp
              v-if="userSummary.gross_pnl >= 0"
              class="w-3.5 h-3.5 text-primary-green"
            />
            <TrendingDown v-else class="w-3.5 h-3.5 text-primary-red" />
          </div>
          <div class="mt-2">
            <p
              class="text-xl font-bold tabular-nums"
              :class="
                userSummary.gross_pnl >= 0
                  ? 'text-primary-green'
                  : 'text-primary-red'
              "
            >
              {{ userSummary.gross_pnl > 0 ? "+" : ""
              }}{{ formatCurrency(userSummary.gross_pnl, isBothView ? accountCurrency : null) }}
            </p>
            <p
              v-if="isBothView && usdUserSummary"
              class="text-[11px] font-mono tabular-nums mt-0.5"
              :class="usdUserSummary.gross_pnl >= 0 ? 'text-primary-green/90' : 'text-primary-red/90'"
            >
              ≈ {{ usdUserSummary.gross_pnl > 0 ? "+" : "" }}{{ formatCurrency(usdUserSummary.gross_pnl, "USD") }} USD
            </p>
            <p class="text-2xs text-secondary-text mt-0.5">
              Raw Trading Profit
            </p>
          </div>
        </div>

        <!-- Total Fee -->
        <div
          class="bg-card-background border border-primary-border rounded-2xl p-4 flex flex-col justify-between"
        >
          <div class="flex items-center justify-between">
            <span
              class="text-[11px] font-medium uppercase tracking-wide text-secondary-text"
              >Total Fee</span
            >
            <DollarSign class="w-3.5 h-3.5 text-secondary-text" />
          </div>
          <div class="mt-2">
            <p class="text-xl font-bold text-primary-text tabular-nums">
              {{ formatCurrency(userSummary.total_fee, isBothView ? accountCurrency : null) }}
            </p>
            <p
              v-if="isBothView && usdUserSummary"
              class="text-[11px] font-mono text-secondary-text mt-0.5"
            >
              ≈ {{ formatCurrency(usdUserSummary.total_fee, "USD") }} USD
            </p>
            <p class="text-2xs text-secondary-text mt-0.5">
              Performance Fee
            </p>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs & Actions -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary-border pb-3"
      >
        <div class="flex items-center gap-1.5 overflow-x-auto">
          <button
            class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
            :class="
              activeTab === 'settlements'
                ? 'bg-primary text-white'
                : 'bg-card-background border border-primary-border text-secondary-text hover:text-primary-text'
            "
            @click="activeTab = 'settlements'"
          >
            <Users class="w-3.5 h-3.5" />
            Follower Sessions & Periods
            <span
              class="px-1.5 py-0.2 rounded-full text-2xs font-semibold"
              :class="
                activeTab === 'settlements'
                  ? 'bg-white/20 text-white'
                  : 'bg-background text-secondary-text'
              "
            >
              {{ followerList.length }}
            </span>
          </button>

          <button
            v-if="store.data?.ib_distribution?.length"
            class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
            :class="
              activeTab === 'ib_distribution'
                ? 'bg-primary text-white'
                : 'bg-card-background border border-primary-border text-secondary-text hover:text-primary-text'
            "
            @click="activeTab = 'ib_distribution'"
          >
            <GitBranch class="w-3.5 h-3.5" />
            IB Distribution Logs
            <span
              class="px-1.5 py-0.2 rounded-full text-2xs font-semibold"
              :class="
                activeTab === 'ib_distribution'
                  ? 'bg-white/20 text-white'
                  : 'bg-background text-secondary-text'
              "
            >
              {{ store.data.ib_distribution.length }}
            </span>
          </button>

          <button
            v-if="store.data?.agent_distribution?.length"
            class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
            :class="
              activeTab === 'agent_distribution'
                ? 'bg-primary text-white'
                : 'bg-card-background border border-primary-border text-secondary-text hover:text-primary-text'
            "
            @click="activeTab = 'agent_distribution'"
          >
            <Shield class="w-3.5 h-3.5" />
            Agent Distribution
            <span
              class="px-1.5 py-0.2 rounded-full text-2xs font-semibold"
              :class="
                activeTab === 'agent_distribution'
                  ? 'bg-white/20 text-white'
                  : 'bg-background text-secondary-text'
              "
            >
              {{ store.data.agent_distribution.length }}
            </span>
          </button>
        </div>

        <!-- Search Bar -->
        <div class="relative w-full sm:w-64">
          <Search
            class="w-3.5 h-3.5 text-secondary-text absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search period, symbol, trade..."
            class="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-card-background border border-primary-border text-primary-text placeholder:text-secondary-text outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 1: FOLLOWER SESSIONS & PERIODS ACCORDION -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'settlements'" class="space-y-6">
        <!-- Follower Session Filter Pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1">
          <span class="text-xs font-medium text-secondary-text shrink-0"
            >Follower Session:</span
          >
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
            :class="
              selectedFollowerId === 'ALL'
                ? 'bg-primary text-white'
                : 'bg-card-background border border-primary-border text-secondary-text hover:text-primary-text'
            "
            @click="selectedFollowerId = 'ALL'"
          >
            All ({{ followerList.length }})
          </button>
          <button
            v-for="follower in followerList"
            :key="follower.follower_id"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
            :class="
              selectedFollowerId === String(follower.follower_id)
                ? 'bg-primary text-white'
                : 'bg-card-background border border-primary-border text-secondary-text hover:text-primary-text'
            "
            @click="selectedFollowerId = String(follower.follower_id)"
          >
            <span class="font-mono font-semibold"
              >#{{ follower.follower_id }}</span
            >
            <span class="text-2xs opacity-80 font-mono"
              >({{ follower.account_number }})</span
            >
          </button>
        </div>

        <!-- Follower Session Cards -->
        <div
          v-for="follower in displayedFollowers"
          :key="follower.follower_id"
          class="border border-primary-border rounded-2xl overflow-hidden bg-card-background shadow-2xs space-y-4 p-4 sm:p-5"
        >
          <!-- Follower Session Header -->
          <div
            class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-primary-border pb-4"
          >
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-bold text-primary-text">
                  Follower Session #{{ follower.follower_id }}
                </span>
                <span
                  class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-background border border-primary-border text-primary-text"
                >
                  Account: {{ follower.account_number }}
                </span>
                <span
                  v-if="follower.settlement_type"
                  class="text-2xs uppercase font-bold px-2 py-0.5 rounded border text-secondary-text bg-background border-primary-border"
                >
                  Type: {{ follower.settlement_type }}
                </span>
              </div>
            </div>

            <!-- Follower Session Totals Bar -->
            <div
              class="flex items-center gap-3 bg-background border border-primary-border rounded-xl px-3.5 py-2 text-xs shrink-0 flex-wrap"
            >
              <div>
                <span class="text-3xs uppercase text-secondary-text block"
                  >Trades</span
                >
                <span class="font-bold text-primary-text font-mono">{{
                  follower.summary?.trades_count ?? follower.trades?.length ?? 0
                }}</span>
              </div>
              <div class="h-6 w-px bg-primary-border" />
              <div>
                <span class="text-3xs uppercase text-secondary-text block"
                  >Gross PnL</span
                >
                <span
                  class="font-bold font-mono"
                  :class="
                    getFollowerGrossPnl(follower) >= 0
                      ? 'text-primary-green'
                      : 'text-primary-red'
                  "
                >
                  {{ getFollowerGrossPnl(follower) > 0 ? "+" : ""
                  }}{{ formatCurrency(getFollowerGrossPnl(follower), isBothView ? accountCurrency : null) }}
                </span>
                <span
                  v-if="isBothView && getFollowerGrossPnlUsd(follower) != null"
                  class="text-2xs font-mono text-secondary-text block"
                >
                  ≈ {{ getFollowerGrossPnlUsd(follower) > 0 ? "+" : "" }}{{ formatCurrency(getFollowerGrossPnlUsd(follower), 'USD') }}
                </span>
              </div>
              <div class="h-6 w-px bg-primary-border" />
              <div>
                <span class="text-3xs uppercase text-secondary-text block"
                  >Total Fee</span
                >
                <span class="font-bold text-primary-text font-mono">{{
                  formatCurrency(getFollowerTotalFee(follower), isBothView ? accountCurrency : null)
                }}</span>
                <span
                  v-if="isBothView && getFollowerTotalFeeUsd(follower) != null"
                  class="text-2xs font-mono text-secondary-text block"
                >
                  ≈ {{ formatCurrency(getFollowerTotalFeeUsd(follower), 'USD') }}
                </span>
              </div>
              <div class="h-6 w-px bg-primary-border" />
              <div>
                <span class="text-3xs uppercase text-secondary-text block"
                  >Net PnL</span
                >
                <span
                  class="font-bold font-mono"
                  :class="
                    getFollowerNetPnl(follower) >= 0
                      ? 'text-primary-green'
                      : 'text-primary-red'
                  "
                >
                  {{ getFollowerNetPnl(follower) > 0 ? "+" : ""
                  }}{{ formatCurrency(getFollowerNetPnl(follower), isBothView ? accountCurrency : null) }}
                </span>
                <span
                  v-if="isBothView && getFollowerNetPnlUsd(follower) != null"
                  class="text-2xs font-mono text-secondary-text block"
                >
                  ≈ {{ getFollowerNetPnlUsd(follower) > 0 ? "+" : "" }}{{ formatCurrency(getFollowerNetPnlUsd(follower), 'USD') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Periods Breakdown -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-semibold text-primary-text uppercase tracking-wider"
              >
                Settlement Periods ({{ follower.periods?.length ?? 0 }})
              </span>
            </div>

            <div
              v-for="period in getFilteredPeriods(follower.periods || [])"
              :key="period.period_key"
              class="border border-primary-border rounded-xl overflow-hidden bg-background/50"
            >
              <!-- Period Header Row (Accordion Clickable) -->
              <div
                class="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-background transition-colors"
                @click="
                  togglePeriodExpand(
                    `${follower.follower_id}-${period.period_key}`,
                  )
                "
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg bg-card-background border border-primary-border flex items-center justify-center text-primary font-bold text-xs shrink-0"
                  >
                    <Calendar class="w-4 h-4" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs font-bold text-primary-text">
                        {{ formatPeriodDate(period.period_key) }}
                      </span>
                      <span
                        class="text-2xs font-mono px-1.5 py-0.2 rounded bg-card-background border border-primary-border text-secondary-text"
                      >
                        {{ period.period_key }}
                      </span>
                      <span
                        v-if="period.period_type"
                        class="text-3xs uppercase font-bold px-1.5 py-0.2 rounded bg-card-background border border-primary-border text-secondary-text"
                      >
                        {{ period.period_type }}
                      </span>
                    </div>
                    <p class="text-[11px] text-secondary-text mt-0.5">
                      {{
                        period.trades_count ??
                        (period.trades ? period.trades.length : 0)
                      }}
                      Trades in this period
                    </p>
                  </div>
                </div>

                <!-- Period Summary Metrics -->
                <div
                  class="flex items-center gap-4 text-xs shrink-0 flex-wrap justify-between md:justify-end"
                >
                  <div class="text-left md:text-right">
                    <span class="text-2xs text-secondary-text block"
                      >Gross PnL</span
                    >
                    <span
                      class="font-mono font-semibold"
                      :class="
                        getPeriodGrossPnl(period) >= 0
                          ? 'text-primary-green'
                          : 'text-primary-red'
                      "
                    >
                      {{ getPeriodGrossPnl(period) > 0 ? "+" : ""
                      }}{{ formatCurrency(getPeriodGrossPnl(period), isBothView ? accountCurrency : null) }}
                    </span>
                    <span
                      v-if="isBothView && getPeriodGrossPnlUsd(period) != null"
                      class="text-2xs font-normal text-secondary-text block"
                    >
                      ≈ {{ getPeriodGrossPnlUsd(period) > 0 ? "+" : "" }}{{ formatCurrency(getPeriodGrossPnlUsd(period), 'USD') }}
                    </span>
                  </div>

                  <div class="text-left md:text-right">
                    <span class="text-2xs text-secondary-text block"
                      >Fee</span
                    >
                    <span
                      class="font-mono font-semibold text-primary-text"
                      >{{ formatCurrency(getPeriodFee(period), isBothView ? accountCurrency : null) }}</span
                    >
                    <span
                      v-if="isBothView && getPeriodFeeUsd(period) != null"
                      class="text-2xs font-normal text-secondary-text block"
                    >
                      ≈ {{ formatCurrency(getPeriodFeeUsd(period), 'USD') }}
                    </span>
                  </div>

                  <div class="text-left md:text-right">
                    <span class="text-2xs text-secondary-text block"
                      >Net PnL</span
                    >
                    <span
                      class="font-mono font-bold"
                      :class="
                        getPeriodNetPnl(period) >= 0
                          ? 'text-primary-green'
                          : 'text-primary-red'
                      "
                    >
                      {{ getPeriodNetPnl(period) > 0 ? "+" : ""
                      }}{{ formatCurrency(getPeriodNetPnl(period), isBothView ? accountCurrency : null) }}
                    </span>
                    <span
                      v-if="isBothView && getPeriodNetPnlUsd(period) != null"
                      class="text-2xs font-normal text-secondary-text block"
                    >
                      ≈ {{ getPeriodNetPnlUsd(period) > 0 ? "+" : "" }}{{ formatCurrency(getPeriodNetPnlUsd(period), 'USD') }}
                    </span>
                  </div>

                  <ChevronDown
                    class="w-4 h-4 text-secondary-text transition-transform duration-200"
                    :class="{
                      'rotate-180 text-primary':
                        expandedPeriodKey ===
                        `${follower.follower_id}-${period.period_key}`,
                    }"
                  />
                </div>
              </div>

              <!-- Period Expanded Content -->
              <div
                v-if="
                  expandedPeriodKey ===
                  `${follower.follower_id}-${period.period_key}`
                "
                class="p-4 border-t border-primary-border bg-card-background space-y-4"
              >
                <!-- HWM & Distribution Cards Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <!-- HWM Details -->
                  <div
                    class="bg-background rounded-xl p-3.5 border border-primary-border/60 space-y-2 text-xs"
                  >
                    <p
                      class="text-xs font-semibold text-primary-text flex items-center gap-1.5"
                    >
                      <Activity class="w-3.5 h-3.5 text-primary" /> High Water
                      Mark (HWM)
                    </p>
                    <div class="space-y-1.5 pt-1">
                      <div class="flex justify-between">
                        <span class="text-secondary-text">Previous HWM:</span>
                        <span class="font-mono text-primary-text">{{
                          formatCurrency(period.hwm?.previous_hwm)
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-secondary-text"
                          >Current Total Before:</span
                        >
                        <span class="font-mono text-primary-text">{{
                          formatCurrency(period.hwm?.current_total_before)
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-secondary-text"
                          >Profit Above HWM:</span
                        >
                        <span
                          class="font-mono font-semibold text-primary-green"
                          >{{
                            formatCurrency(period.hwm?.profit_above_hwm)
                          }}</span
                        >
                      </div>
                      <div
                        class="flex justify-between border-t border-primary-border/60 pt-1.5"
                      >
                        <span class="text-secondary-text">New Equity:</span>
                        <span
                          class="font-mono font-semibold text-primary-text"
                          >{{ formatCurrency(period.hwm?.new_equity) }}</span
                        >
                      </div>
                    </div>
                  </div>

                  <!-- Fee Distribution Details -->
                  <!-- <div
                    class="bg-background rounded-xl p-3.5 border border-primary-border/60 space-y-2 text-xs"
                  >
                    <p
                      class="text-xs font-semibold text-primary-text flex items-center gap-1.5"
                    >
                      <GitBranch class="w-3.5 h-3.5 text-primary" /> Fee & Pool
                      Splits
                    </p>
                    <div class="space-y-1.5 pt-1">
                      <div class="flex justify-between">
                        <span class="text-secondary-text"
                          >Total Performance Fee:</span
                        >
                        <span class="font-mono font-medium text-primary-text">{{
                          formatCurrency(
                            period.distribution?.total_fee ?? period.fee,
                          )
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-secondary-text">FM Share (Net):</span>
                        <span class="font-mono text-primary-text">{{
                          formatCurrency(
                            period.distribution?.fm_net_after_agents ??
                              period.fm_fee,
                          )
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-secondary-text"
                          >Broker Share (Net):</span
                        >
                        <span class="font-mono text-primary-text">{{
                          formatCurrency(
                            period.distribution?.broker_net ??
                              period.broker_net ??
                              period.broker_fee,
                          )
                        }}</span>
                      </div>
                      <div
                        class="flex justify-between border-t border-primary-border/60 pt-1.5"
                      >
                        <span class="text-secondary-text"
                          >IB Pool / Distributed:</span
                        >
                        <span class="font-mono text-primary-green"
                          >{{
                            formatCurrency(
                              period.distribution?.ib_pool ?? period.ib_pool,
                            )
                          }}
                          /
                          {{
                            formatCurrency(period.distribution?.ib_distributed)
                          }}</span
                        >
                      </div>
                    </div>
                  </div> -->
                </div>

                <!-- IB Splits if present in this period -->
                <div
                  v-if="period.distribution?.ib_splits?.length"
                  class="bg-background rounded-xl p-3.5 border border-primary-border/60"
                >
                  <p
                    class="text-[11px] font-semibold text-secondary-text uppercase tracking-wider mb-2"
                  >
                    IB Commission Splits for this Period
                  </p>
                  <div class="overflow-x-auto">
                    <table class="w-full text-xs">
                      <thead>
                        <tr
                          class="border-b border-primary-border text-2xs text-secondary-text uppercase"
                        >
                          <th class="text-left py-1.5 px-2 font-medium">
                            IB Partner
                          </th>
                          <th class="text-left py-1.5 px-2 font-medium">
                            Level
                          </th>
                          <th class="text-left py-1.5 px-2 font-medium">
                            Role
                          </th>
                          <th class="text-left py-1.5 px-2 font-medium">
                            Pool Share %
                          </th>
                          <th class="text-left py-1.5 px-2 font-medium">
                            Split %
                          </th>
                          <th class="text-right py-1.5 px-2 font-medium">
                            Commission
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="split in period.distribution.ib_splits"
                          :key="split.ib_id"
                          class="border-b border-primary-border/40 last:border-none"
                        >
                          <td class="py-1.5 px-2 font-medium text-primary-text">
                            {{ split.ib_name }}
                            <span class="text-secondary-text text-2xs"
                              >({{ split.ib_email }})</span
                            >
                          </td>
                          <td class="py-1.5 px-2 text-secondary-text">
                            L{{ split.ib_level }}
                          </td>
                          <td class="py-1.5 px-2">
                            <span
                              class="px-1.5 py-0.2 rounded text-3xs uppercase font-bold bg-card-background border border-primary-border text-secondary-text"
                            >
                              {{ split.role || "Partner" }}
                            </span>
                          </td>
                          <td class="py-1.5 px-2 font-mono text-primary-text">
                            {{ split.pool_share_pct }}%
                          </td>
                          <td class="py-1.5 px-2 font-mono text-primary-text">
                            {{ split.split_percentage }}%
                          </td>
                          <td
                            class="py-1.5 px-2 text-right font-mono font-semibold text-primary-green"
                          >
                            {{ formatCurrency(split.commission) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Trades in this Period Table -->
                <div class="space-y-2">
                  <p
                    class="text-[11px] font-semibold text-secondary-text uppercase tracking-wider"
                  >
                    Closed Trades in this Period ({{
                      period.trades?.length ?? 0
                    }})
                  </p>
                  <div
                    class="overflow-x-auto border border-primary-border/60 rounded-xl"
                  >
                    <table class="w-full text-xs">
                      <thead>
                        <tr
                          class="border-b border-primary-border/60 bg-background/80 text-2xs text-secondary-text uppercase"
                        >
                          <th class="text-left py-2 px-3 font-medium">
                            Trade ID
                          </th>
                          <th class="text-left py-2 px-3 font-medium">
                            Symbol
                          </th>
                          <th class="text-left py-2 px-3 font-medium">
                            Account
                          </th>
                          <th class="text-left py-2 px-3 font-medium">
                            Closed At
                          </th>
                          <th class="text-right py-2 px-3 font-medium">
                            Gross PnL
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="t in period.trades"
                          :key="t.trade_id"
                          class="border-b border-primary-border/30 last:border-none hover:bg-background/40 transition-colors"
                        >
                          <td
                            class="py-2 px-3 font-mono font-semibold text-primary-text"
                          >
                            #{{ t.trade_id }}
                          </td>
                          <td class="py-2 px-3">
                            <span
                              class="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold bg-background border border-primary-border text-primary-text"
                            >
                              {{ t.symbol }}
                            </span>
                          </td>
                          <td class="py-2 px-3 font-mono text-secondary-text">
                            {{ t.account_number }}
                          </td>
                          <td class="py-2 px-3 text-secondary-text">
                            {{ formatDate(t.closed_at) }}
                          </td>
                          <td
                            class="py-2 px-3 text-right font-mono font-semibold"
                            :class="
                              getTradeGrossPnl(t) >= 0
                                ? 'text-primary-green'
                                : 'text-primary-red'
                            "
                          >
                            <div>
                              {{ getTradeGrossPnl(t) > 0 ? "+" : ""
                              }}{{ formatCurrency(getTradeGrossPnl(t), isBothView ? accountCurrency : null) }}
                            </div>
                            <div
                              v-if="isBothView && getTradeGrossPnlUsd(t) != null"
                              class="text-2xs font-normal text-secondary-text"
                            >
                              ≈ {{ getTradeGrossPnlUsd(t) > 0 ? "+" : "" }}{{ formatCurrency(getTradeGrossPnlUsd(t), 'USD') }}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="getFilteredPeriods(follower.periods || []).length === 0"
              class="text-center py-6 text-xs text-secondary-text"
            >
              No periods matching search filter.
            </div>
          </div>
        </div>

        <div
          v-if="displayedFollowers.length === 0"
          class="text-center py-12 text-xs text-secondary-text border border-primary-border rounded-2xl bg-card-background"
        >
          No follower sessions matching the selected filter.
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 2: IB DISTRIBUTION LOGS -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div v-else-if="activeTab === 'ib_distribution'">
        <div
          class="border border-primary-border rounded-2xl overflow-hidden bg-card-background shadow-2xs"
        >
          <div
            class="px-5 py-3.5 border-b border-primary-border flex items-center justify-between bg-card-background"
          >
            <div class="flex items-center gap-2">
              <GitBranch class="w-4 h-4 text-secondary-text" />
              <span class="text-xs font-semibold text-primary-text"
                >Client IB Distribution Logs</span
              >
            </div>
            <span class="text-xs text-secondary-text">
              {{ store.data?.ib_distribution?.length ?? 0 }} Records
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b border-primary-border bg-background/50">
                  <th
                    class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3"
                  >
                    Trade ID
                  </th>
                  <th
                    class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3"
                  >
                    IB Partner
                  </th>
                  <th
                    class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3"
                  >
                    Level
                  </th>
                  <th
                    class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3"
                  >
                    Role
                  </th>
                  <th
                    class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3"
                  >
                    Pool Share %
                  </th>
                  <th
                    class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3"
                  >
                    Actual Share %
                  </th>
                  <th
                    class="text-right text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3"
                  >
                    Commission
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(ib, idx) in filteredIbDistribution"
                  :key="idx"
                  class="border-b border-primary-border last:border-none hover:bg-background/40 transition-colors"
                >
                  <td
                    class="p-3 font-mono text-xs font-semibold text-primary-text"
                  >
                    #{{ ib.trade_id }}
                  </td>

                  <td class="p-3">
                    <p class="text-xs font-semibold text-primary-text">
                      {{ ib.ib_name }}
                    </p>
                    <p class="text-[11px] text-secondary-text">
                      {{ ib.ib_email }}
                    </p>
                    <p class="text-2xs text-secondary-text">
                      User ID: #{{ ib.ib_user_id }} · IB ID: #{{ ib.ib_id }}
                    </p>
                  </td>

                  <td class="p-3">
                    <span
                      class="px-2 py-0.5 rounded text-[11px] font-medium bg-background border border-primary-border text-primary-text"
                    >
                      Level {{ ib.ib_level }}
                    </span>
                  </td>

                  <td class="p-3">
                    <span
                      class="px-2 py-0.5 rounded text-2xs uppercase font-bold bg-background border border-primary-border text-secondary-text"
                    >
                      {{ ib.role || "Partner" }}
                    </span>
                  </td>

                  <td class="p-3 font-mono text-xs text-primary-text">
                    {{ ib.pool_share_pct }}%
                  </td>

                  <td class="p-3 font-mono text-xs text-primary-text">
                    {{ ib.split_percentage }}%
                  </td>

                  <td
                    class="p-3 text-right font-mono text-xs font-bold text-primary-green"
                  >
                    {{ formatCurrency(ib.commission) }}
                  </td>
                </tr>

                <tr v-if="filteredIbDistribution.length === 0">
                  <td
                    colspan="7"
                    class="text-center py-10 text-xs text-secondary-text"
                  >
                    No IB distribution records found for this client.
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
        <div
          class="border border-primary-border rounded-2xl overflow-hidden bg-card-background shadow-2xs"
        >
          <div
            class="px-5 py-3.5 border-b border-primary-border flex items-center justify-between bg-card-background"
          >
            <div class="flex items-center gap-2">
              <Shield class="w-4 h-4 text-secondary-text" />
              <span class="text-xs font-semibold text-primary-text"
                >Agent Distribution</span
              >
            </div>
            <span class="text-xs text-secondary-text">
              {{ store.data?.agent_distribution?.length ?? 0 }} Records
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b border-primary-border bg-background/50">
                  <th
                    class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3"
                  >
                    Agent
                  </th>
                  <th
                    class="text-right text-[11px] font-medium text-secondary-text uppercase tracking-wider p-3"
                  >
                    Commission
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(agent, idx) in store.data.agent_distribution"
                  :key="idx"
                  class="border-b border-primary-border last:border-none"
                >
                  <td class="p-3 text-xs font-medium text-primary-text">
                    {{ agent.name || agent.email || "Agent" }}
                  </td>
                  <td
                    class="p-3 text-right text-xs font-semibold text-primary-green tabular-nums"
                  >
                    {{ formatCurrency(agent.commission) }}
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
import { onMounted, computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  ReceiptText,
  Users,
  GitBranch,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Building2,
  Activity,
  Calendar,
  ChevronDown,
  Search,
  RotateCw,
  Shield,
  Mail,
  Phone,
} from "lucide-vue-next";
import { useSettlementUserStore } from "@/stores/fm/settlements/settlementUser";

const route = useRoute();
const router = useRouter();
const store = useSettlementUserStore();

const activeTab = ref("settlements");
const searchQuery = ref("");
const selectedFollowerId = ref("ALL");
const expandedPeriodKey = ref(null);

const currentUserId = computed(() => {
  return (
    route.params.user_id ||
    route.params.userId ||
    route.params.client_id ||
    route.params.clientId ||
    ""
  );
});

const accountCurrency = computed(() => {
  return (
    store.data?.currency?.account_currency ||
    store.data?.amounts?.account_units?.currency ||
    store.data?.display?.currency ||
    store.data?.broker_currency ||
    store.data?.currency ||
    route.query.currency ||
    "USC"
  );
});

const payoutCurrency = computed(() => {
  return (
    store.data?.currency?.payout_currency ||
    store.data?.amounts?.usd?.currency ||
    "USD"
  );
});

const activeCurrency = computed(() => {
  if (store.amountView === "usd") {
    return payoutCurrency.value;
  }
  if (store.amountView === "account_units") {
    return accountCurrency.value;
  }
  const acc = accountCurrency.value;
  const pay = payoutCurrency.value;
  if (acc && pay && acc.toUpperCase() !== pay.toUpperCase()) {
    return `${acc} & ${pay}`;
  }
  return acc || pay || "USD";
});

const isBothView = computed(() => store.amountView === "both");

const amountViewOptions = computed(() => {
  const acc = accountCurrency.value || "USC";
  const pay = payoutCurrency.value || "USD";
  return [
    { label: `${acc} (Account Units)`, value: "account_units" },
    { label: `${pay}`, value: "usd" },
    { label: "Both", value: "both" },
  ];
});

const switchAmountView = (view) => {
  if (store.amountView === view || store.loading) return;
  router.replace({ query: { ...route.query, amount_view: view } });
  store.fetchSettlementUser(route.params.id, currentUserId.value, view);
};

const getCurrencySymbol = (currency) => {
  const c = String(currency || "")
    .trim()
    .toUpperCase();
  if (c === "USC" || c === "CENT") return "C";
  if (c === "CAD") return "C$";
  if (c === "EUR") return "€";
  if (c === "GBP") return "£";
  if (c === "INR") return "₹";
  if (c === "JPY") return "¥";
  if (c === "USD") return "$";
  return c ? `${c} ` : "$";
};

const formatCurrency = (val, currency = null) => {
  if (val === null || val === undefined || val === "") return "—";
  const num = Number(val);
  if (isNaN(num)) return "—";
  const cur =
    currency ||
    (store.amountView === "usd" ? payoutCurrency.value : accountCurrency.value);
  const sym = getCurrencySymbol(cur);
  const isNegative = num < 0;
  const formatted = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? "-" : ""}${sym}${formatted}`;
};

const formatDate = (isoString) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (e) {
    return isoString;
  }
};

const formatPeriodDate = (periodKey) => {
  if (!periodKey) return "";
  try {
    const d = new Date(periodKey);
    if (isNaN(d.getTime())) return periodKey;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return periodKey;
  }
};

const displayData = computed(() => store.data?.display || {});

const userData = computed(() => {
  const d = displayData.value;
  const u = store.data?.user || {};
  return {
    ...u,
    ...d,
    user_name: d.user_name || u.name || u.user_name || "Client",
    user_email: d.user_email || u.email || u.user_email || "",
    phone_number: d.phone_number || u.phone_number || "",
    user_id: d.user_id || u.user_id || currentUserId.value,
    followers: u.followers || d.followers || [],
  };
});

const userSummary = computed(() => {
  const d = displayData.value;
  const uid = currentUserId.value;
  if (store.amountView === "usd") {
    const usdUser = store.data?.amounts?.usd?.users_summary?.find(
      (item) => String(item.user_id) === String(uid)
    );
    if (usdUser) return usdUser;
  }
  if (store.amountView === "account_units" || store.amountView === "both") {
    const accUser = store.data?.amounts?.account_units?.users_summary?.find(
      (item) => String(item.user_id) === String(uid)
    );
    if (accUser) return accUser;
  }
  return d;
});

const usdUserSummary = computed(() => {
  if (!isBothView.value) return null;
  const uid = currentUserId.value;
  const list = store.data?.amounts?.usd?.users_summary || [];
  const found = list.find((item) => String(item.user_id) === String(uid));
  if (found) return found;
  return store.data?.amounts?.usd?.summary || null;
});

const followerList = computed(() => {
  return store.data?.user?.followers || userData.value?.followers || [];
});

const displayedFollowers = computed(() => {
  if (selectedFollowerId.value === "ALL") {
    return followerList.value;
  }
  return followerList.value.filter(
    (f) => String(f.follower_id) === String(selectedFollowerId.value),
  );
});

const getFollowerGrossPnl = (follower) => {
  if (store.amountView === "account_units" || store.amountView === "both") {
    if (follower.summary?.gross_pnl_account_units != null) {
      return follower.summary.gross_pnl_account_units;
    }
    if (
      displayData.value.follower_ids?.includes(follower.follower_id) &&
      displayData.value.gross_pnl != null
    ) {
      return displayData.value.gross_pnl;
    }
    if (follower.summary?.gross_pnl != null && accountCurrency.value === "USC") {
      return Number((follower.summary.gross_pnl * 100).toFixed(2));
    }
  }
  return follower.summary?.gross_pnl ?? 0;
};

const getFollowerTotalFee = (follower) => {
  if (store.amountView === "account_units" || store.amountView === "both") {
    if (follower.summary?.fee_account_units != null) {
      return follower.summary.fee_account_units;
    }
    if (
      displayData.value.follower_ids?.includes(follower.follower_id) &&
      displayData.value.total_fee != null
    ) {
      return displayData.value.total_fee;
    }
    if (follower.summary?.total_fee != null && accountCurrency.value === "USC") {
      return Number((follower.summary.total_fee * 100).toFixed(2));
    }
  }
  return follower.summary?.total_fee ?? 0;
};

const getFollowerNetPnl = (follower) => {
  if (store.amountView === "account_units" || store.amountView === "both") {
    if (follower.summary?.net_pnl_account_units != null) {
      return follower.summary.net_pnl_account_units;
    }
    if (
      displayData.value.follower_ids?.includes(follower.follower_id) &&
      displayData.value.net_pnl != null
    ) {
      return displayData.value.net_pnl;
    }
    if (follower.summary?.net_pnl != null && accountCurrency.value === "USC") {
      return Number((follower.summary.net_pnl * 100).toFixed(2));
    }
  }
  return follower.summary?.net_pnl ?? 0;
};

const getFollowerGrossPnlUsd = (follower) => follower.summary?.gross_pnl ?? null;
const getFollowerTotalFeeUsd = (follower) => follower.summary?.total_fee ?? null;
const getFollowerNetPnlUsd = (follower) => follower.summary?.net_pnl ?? null;

const getPeriodGrossPnl = (p) => {
  if (store.amountView === "account_units" || store.amountView === "both") {
    if (p.gross_pnl_account_units != null) return p.gross_pnl_account_units;
    if (Array.isArray(p.trades) && p.trades.length) {
      const sum = p.trades.reduce(
        (acc, t) =>
          acc +
          (t.gross_pnl_account_units ??
            (t.gross_pnl != null && accountCurrency.value === "USC"
              ? t.gross_pnl * 100
              : t.gross_pnl) ??
            0),
        0
      );
      return Number(sum.toFixed(2));
    }
    if (p.gross_pnl != null && accountCurrency.value === "USC") {
      return Number((p.gross_pnl * 100).toFixed(2));
    }
  }
  return p.gross_pnl ?? 0;
};

const getPeriodFee = (p) => {
  if (store.amountView === "account_units" || store.amountView === "both") {
    if (p.fee_account_units != null) return p.fee_account_units;
    if (Array.isArray(p.trades) && p.trades.length) {
      const sum = p.trades.reduce(
        (acc, t) =>
          acc +
          (t.fee_account_units ??
            (t.fee != null && accountCurrency.value === "USC"
              ? t.fee * 100
              : t.fee) ??
            0),
        0
      );
      return Number(sum.toFixed(2));
    }
    if (p.fee != null && accountCurrency.value === "USC") {
      return Number((p.fee * 100).toFixed(2));
    }
  }
  return p.fee ?? 0;
};

const getPeriodNetPnl = (p) => {
  if (store.amountView === "account_units" || store.amountView === "both") {
    if (p.net_pnl_account_units != null) return p.net_pnl_account_units;
    if (Array.isArray(p.trades) && p.trades.length) {
      const sum = p.trades.reduce(
        (acc, t) =>
          acc +
          (t.net_pnl_account_units ??
            (t.net_pnl != null && accountCurrency.value === "USC"
              ? t.net_pnl * 100
              : t.net_pnl) ??
            0),
        0
      );
      return Number(sum.toFixed(2));
    }
    if (p.net_pnl != null && accountCurrency.value === "USC") {
      return Number((p.net_pnl * 100).toFixed(2));
    }
  }
  return p.net_pnl ?? 0;
};

const getPeriodGrossPnlUsd = (p) => p.gross_pnl ?? null;
const getPeriodFeeUsd = (p) => p.fee ?? null;
const getPeriodNetPnlUsd = (p) => p.net_pnl ?? null;

const getTradeGrossPnl = (t) => {
  if (store.amountView === "account_units" || store.amountView === "both") {
    return t.gross_pnl_account_units ?? t.gross_pnl ?? 0;
  }
  return t.gross_pnl ?? 0;
};
const getTradeGrossPnlUsd = (t) => t.gross_pnl ?? null;

const totalTradesCount = computed(() => {
  let count = 0;
  followerList.value.forEach((f) => {
    count += f.summary?.trades_count ?? f.trades?.length ?? 0;
  });
  return count;
});

const getFilteredPeriods = (periods) => {
  if (!searchQuery.value.trim()) return periods;
  const q = searchQuery.value.toLowerCase().trim();
  return periods.filter((p) => {
    const periodMatches =
      String(p.period_key || "")
        .toLowerCase()
        .includes(q) ||
      String(p.period_type || "")
        .toLowerCase()
        .includes(q);
    const tradeMatches = Array.isArray(p.trades)
      ? p.trades.some(
          (t) =>
            String(t.trade_id || "").includes(q) ||
            String(t.symbol || "")
              .toLowerCase()
              .includes(q),
        )
      : false;
    return periodMatches || tradeMatches;
  });
};

const filteredIbDistribution = computed(() => {
  const list =
    (store.amountView === "usd"
      ? store.data?.amounts?.usd?.ib_distribution
      : null) ||
    store.data?.ib_distribution ||
    [];
  if (!searchQuery.value.trim()) return list;
  const q = searchQuery.value.toLowerCase().trim();
  return list.filter((ib) => {
    return (
      String(ib.trade_id || "").includes(q) ||
      String(ib.ib_name || "")
        .toLowerCase()
        .includes(q) ||
      String(ib.ib_email || "")
        .toLowerCase()
        .includes(q) ||
      String(ib.ib_user_id || "").includes(q) ||
      String(ib.role || "")
        .toLowerCase()
        .includes(q)
    );
  });
});

const togglePeriodExpand = (key) => {
  expandedPeriodKey.value = expandedPeriodKey.value === key ? null : key;
};

const statusClass = (s) =>
  ({
    completed: 'bg-primary-green/10 text-primary-green border-primary-green/20',
    pending: 'bg-primary-yellow/10 text-primary-yellow border-primary-yellow/20',
    failed: 'bg-primary-red/10 text-primary-red border-primary-red/20',
  }[String(s).toLowerCase()] ??
  'bg-background text-secondary-text border-primary-border');

const goBack = () => {
  router.push({
    path: `/fm-settlements/${route.params.id}`,
    query: {
      currency: activeCurrency.value,
      amount_view: store.amountView,
    },
  });
};

const loadData = (view = null) => {
  const targetView =
    view || route.query.amount_view || store.amountView || "account_units";
  store.fetchSettlementUser(route.params.id, currentUserId.value, targetView);
};

onMounted(() => {
  loadData();
});
</script>
