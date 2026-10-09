import { defineStore } from 'pinia'
import { ref } from 'vue'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import '@/assets/tour.css'
import router from '@/router'
import authToken from '@/common/authToken'
import { setUserTourApi, updateUserTourStatusApi } from '@/api/shared/tour'
import { useSnackbarStore } from '@/stores/shared/snackbar'
import { useProfileStore } from '@/stores/shared/profile'

export const STORAGE_TOUR_KEY = 'panther_user_tour_completed'
export const STORAGE_ACTIVE_TOUR_KEY = 'panther_active_tour_module'
export const STORAGE_TOUR_SESSION_KEY = 'panther_tour_session_shown'

/**
 * Check if a path belongs to public / authentication screens
 */
export const isAuthRoutePath = (path) => {
  if (!path) return false
  return (
    path === '/' ||
    path === '/login' ||
    (path.startsWith('/login/') && !path.startsWith('/login/join/')) ||
    path === '/auto-login' ||
    path.startsWith('/auto-login/') ||
    path === '/dev-login' ||
    path === '/register' ||
    path.startsWith('/register/') ||
    path === '/fm-login' ||
    path === '/fm-register' ||
    path.startsWith('/fund-manager/') ||
    path === '/reset-password'
  )
}

/**
 * Helper to match any router path to its corresponding module name
 */
export const getModuleFromPath = (path) => {
  if (!path || isAuthRoutePath(path)) return 'dashboard'
  
  // FM Modules
  if (path.includes('/fm-dashboard') || path.includes('/fm-offers')) return 'fm-dashboard'
  if (path.includes('/fm-trading-accounts')) return 'fm-trading-accounts'
  if (path.includes('/fm-leaderboard')) return 'fm-leaderboard'
  if (path.includes('/fm-trade-books')) return 'fm-trade-books'
  if (path.includes('/followers')) return 'fm-followers'
  if (path.includes('/fm-funds')) return 'fm-funds'
  if (path.includes('/your-wallet')) return 'fm-wallet'
  if (path.includes('/fm-tickets')) return 'fm-tickets'

  // IB Modules
  if (path.includes('/ib-dashboard')) return 'ib-dashboard'
  if (path.includes('/ib-reports')) return 'ib-reports'
  if (path.includes('/my-network') || path.includes('/network-analytics')) return 'my-network'
  if (path.includes('/clients')) return 'clients'
  if (path.includes('/ib-funds')) return 'ib-funds'
  if (path.includes('/ib-wallet')) return 'ib-wallet'
  if (path.includes('/ib-tickets')) return 'ib-tickets'

  // Client Modules
  if (path.includes('/chart-trading')) return 'chart-trading'
  if (path.includes('/trading-accounts')) return 'trading-accounts'
  if (path.includes('/funds')) return 'funds'
  if (path.includes('/trading-reports')) return 'trading-reports'
  if (path.includes('/copy-trading') || path.includes('/mtrading') || path.includes('/fm-copy-trading-profile')) return 'copy-trading'
  if (path.includes('/tickets')) return 'tickets'
  if (path.includes('/dashboard')) return 'dashboard'

  return 'dashboard'
}

export const useTourStore = defineStore('tour', () => {
  const isTourRunning = ref(false)
  const currentModule = ref('dashboard')
  let isTransitioning = false
  let driverInstance = null
  let tourTimer = null
  const snackbar = useSnackbarStore()

  /**
   * Strictly verify if user is authenticated with a valid token
   */
  const isAuthenticated = () => {
    return Boolean(authToken.getToken()?.accessToken)
  }

  /**
   * Immediately cancel, clean up and remove any tour overlay and popover from DOM
   */
  const stopTour = () => {
    isTransitioning = false
    isTourRunning.value = false
    if (tourTimer) {
      clearTimeout(tourTimer)
      tourTimer = null
    }
    if (driverInstance) {
      try {
        driverInstance.destroy()
      } catch (e) {
        console.warn('[Tour] Error destroying driver instance:', e)
      }
      driverInstance = null
    }
    // Remove any leftover driver.js elements appended to document.body
    if (typeof document !== 'undefined') {
      const elements = document.querySelectorAll(
        '.driver-overlay, .driver-popover, .driver-stage, .driver-active-element, .driver-fix-stacking'
      )
      elements.forEach((el) => {
        try {
          el.remove()
        } catch (e) {}
      })
    }
  }

  /**
   * Check if user has access to the IB mode / toggle
   * Strictly verifies is_ib === true or role === 'ib'
   */
  const isIbAccessible = () => {
    const profileStore = useProfileStore()
    return profileStore.user?.is_ib === true || profileStore.user?.role === 'ib'
  }

  /**
   * Check if user has completed or dismissed the entire onboarding tour
   * Checks real-time profile API (user.is_tour) first, falling back to localStorage
   */
  const hasCompletedTour = () => {
    const profileStore = useProfileStore()
    if (profileStore.user && typeof profileStore.user.is_tour === 'boolean') {
      return profileStore.user.is_tour
    }
    return localStorage.getItem(STORAGE_TOUR_KEY) === 'true'
  }

  /**
   * Mark tour as completed in profile store, localStorage, and trigger set-tour API:
   * POST /set-tour { "is_tour": true }
   */
  const markTourCompleted = async () => {
    const profileStore = useProfileStore()
    if (profileStore.user) {
      profileStore.user.is_tour = true
    }
    localStorage.setItem(STORAGE_TOUR_KEY, 'true')
    localStorage.removeItem(STORAGE_ACTIVE_TOUR_KEY)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_TOUR_SESSION_KEY, 'true')
    }
    isTourRunning.value = false
    try {
      await setUserTourApi(true)
    } catch (err) {
      console.warn('[Tour] Error calling set-tour API:', err)
    }
  }

  /**
   * Navigate smoothly to next module and start its tour
   */
  const transitionToModule = (routePath, moduleName, delayMs = 650) => {
    if (!isAuthenticated() || isAuthRoutePath(routePath) || isAuthRoutePath(router.currentRoute.value?.path)) {
      stopTour()
      return
    }
    isTransitioning = true
    if (driverInstance) {
      driverInstance.destroy()
    }
    currentModule.value = moduleName
    localStorage.setItem(STORAGE_ACTIVE_TOUR_KEY, moduleName)
    
    // Reset window and main view scroll to top instantly
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    const mainEl = document.querySelector('main')
    if (mainEl) mainEl.scrollTop = 0

    if (tourTimer) clearTimeout(tourTimer)
    router.push(routePath).then(() => {
      tourTimer = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        if (mainEl) mainEl.scrollTop = 0
        isTransitioning = false
        if (isAuthenticated() && !isAuthRoutePath(router.currentRoute.value?.path)) {
          startModuleTour(moduleName)
        } else {
          stopTour()
        }
      }, delayMs)
    }).catch(() => {
      isTransitioning = false
    })
  }

  /**
   * Finish the entire multi-module tour
   */
  const finishCompleteTour = (role = 'client') => {
    isTransitioning = false
    if (driverInstance) {
      driverInstance.destroy()
    }
    markTourCompleted()
    if (role === 'fm') {
      snackbar.show('🎉 Tour Completed! Welcome to Fund Manager Portal.', 'success')
      router.push('/fm-dashboard')
    } else if (role === 'ib') {
      snackbar.show('🎉 Tour Completed! Welcome to Panther Partner Portal.', 'success')
      router.push('/ib-dashboard')
    } else {
      snackbar.show('🎉 Tour Completed! Welcome to Panther User Portal.', 'success')
      router.push('/dashboard')
    }
  }

  /**
   * Define multi-module steps across the entire application (Client and IB)
   */
  const getModuleSteps = (moduleName) => {
    switch (moduleName) {
      // ═══════════════════════════════════════════════════════════════════
      // CLIENT MODULES
      // ═══════════════════════════════════════════════════════════════════

      // ─── 1. CLIENT DASHBOARD ──────────────────────────────────────────
      case 'dashboard': {
        const canAccessIb = isIbAccessible()
        const steps = [
          {
            element: '#tour-logo',
            popover: {
              title: 'Welcome to Panther User Portal',
              description: 'Let us take you through a complete guided tour across all modules in the application.',
              side: 'bottom',
              align: 'start',
            },
          },
        ]

        if (canAccessIb) {
          steps.push({
            element: '#tour-role-toggle',
            popover: {
              title: 'Client / IB Mode Switcher',
              description: 'Easily switch between your Trader (Client) workspace and IB Partner dashboard.',
              side: 'right',
              align: 'center',
            },
          })
        }

        steps.push(
          {
            element: '#tour-notifications',
            popover: {
              title: 'Real-time Notifications',
              description: 'Receive instant alerts for deposits, withdrawals, trade executions, and support replies.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-theme-toggle',
            popover: {
              title: 'Dark / Light Theme Switcher',
              description: 'Toggle between sleek Dark Mode and clear Light Mode anytime for comfortable trading.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-nav-items',
            popover: {
              title: 'Navigation Menu',
              description: 'Access all essential pages: Accounts, Funds, Trading, Copy Trading, and Reports.',
              side: 'right',
              align: 'start',
            },
          },
          {
            element: '#tour-competitions-banner',
            popover: {
              title: 'Promotions & Competitions Banner',
              description: 'Stay updated with live trading competitions, exclusive bonuses, promotional prize pools, and mobile app updates.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-account-mode-tabs',
            popover: {
              title: 'Account Category Filters',
              description: 'Quickly switch views between your Live MT5 real accounts, Copy Trading accounts, and Demo practice accounts.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-account-card-first',
            popover: {
              title: 'Trading Accounts Overview',
              description: 'Check your live balances, account numbers, leverage, and currency details at a glance.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-account-actions',
            popover: {
              title: 'Quick Wallet Actions',
              description: 'Deposit funds, request fast withdrawals, transfer balance between accounts, or inspect history.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-add-account-card',
            popover: {
              title: 'Instant Add Account Shortcut (+)',
              description: 'Click this quick "+" button anytime to create and configure a new Live, Demo, or Copy Trading account directly from your dashboard.',
              side: 'left',
              align: 'center',
            },
          },
          {
            element: '#tour-marketwatch-table',
            popover: {
              title: 'Live Marketwatch',
              description: 'Track real-time currency rates, bid/ask prices, and daily market movements.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/trading-accounts', 'trading-accounts')
              },
              onDoneClick: () => {
                transitionToModule('/trading-accounts', 'trading-accounts')
              },
            },
          },
        )

        return steps
      }

      // ─── 2. CLIENT TRADING ACCOUNTS ───────────────────────────────────
      case 'trading-accounts':
        return [
          {
            element: '#tour-accounts-tabs',
            popover: {
              title: 'Account Categories & Filters',
              description: 'Filter your accounts by All, MT5 Live, Demo, or Copy Trading accounts.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-accounts-add-btn',
            popover: {
              title: 'Open New Trading Account',
              description: 'Create new Live or Demo MetaTrader 5 trading accounts in seconds.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-accounts-card-first',
            popover: {
              title: 'Trading Account Card',
              description: 'View your live balance, equity, leverage, margin, and current account status (Active/Inactive).',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-account-settings-menu',
            popover: {
              title: 'Account Settings & Actions (⚙)',
              description: 'Click the settings gear to Edit Account Label, Change Leverage ratio, view live Trades, or Change MT5 Passwords.',
              side: 'left',
              align: 'center',
            },
          },
          {
            element: '#tour-account-visibility-btn',
            popover: {
              title: 'Toggle Balance Visibility',
              description: 'Click the eye icon to quickly hide or reveal your sensitive balance, equity, and credits for privacy.',
              side: 'left',
              align: 'center',
            },
          },
          {
            element: '#tour-account-deposit-withdraw',
            popover: {
              title: 'Deposit & Withdrawal Shortcuts',
              description: 'Deposit funds instantly or request fast withdrawals directly for this specific account.',
              side: 'top',
              align: 'start',
            },
          },
          {
            element: '#tour-account-transfer-history',
            popover: {
              title: 'Internal Transfer & History',
              description: 'Move funds between your accounts with zero fees, or view full transaction ledger history.',
              side: 'top',
              align: 'end',
            },
          },
          {
            element: '#tour-accounts-grid',
            popover: {
              title: 'Account Cards & Management',
              description: 'All your trading accounts are displayed here with live equity, balance, and leverage information.',
              side: 'bottom',
              align: 'center',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/funds', 'funds')
              },
              onDoneClick: () => {
                transitionToModule('/funds', 'funds')
              },
            },
          },
        ]

      // ─── 3. CLIENT FUNDS ──────────────────────────────────────────────
      case 'funds':
        return [
          {
            element: '#tour-funds-tabs',
            popover: {
              title: 'Funds Management',
              description: 'Manage all deposits, withdrawals, internal transfers, and transaction history.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-funds-content',
            popover: {
              title: 'Payment Methods & Gateways',
              description: 'Deposit or withdraw securely via Instant Crypto, Card Gateways, or Direct Bank Wire.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/trading-reports', 'trading-reports')
              },
              onDoneClick: () => {
                transitionToModule('/trading-reports', 'trading-reports')
              },
            },
          },
        ]

      // ─── 4. CLIENT TRADING REPORTS ────────────────────────────────────
      case 'trading-reports':
        return [
          {
            element: '#tour-reports-account-selector',
            popover: {
              title: 'Select Account for Reports',
              description: 'Choose any of your trading accounts to analyze its specific trading history and performance.',
              side: 'right',
              align: 'center',
            },
          },
          {
            element: '#tour-reports-content',
            popover: {
              title: 'Performance & Statistics Summary',
              description: 'Track Total Trades, Total Volume in lots, and Net PnL across your selected account.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-reports-status-tabs',
            popover: {
              title: 'Trade Status Filters (All / Open / Closed)',
              description: 'Filter between All positions, currently Open active trades, or historically Closed orders.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-reports-date-filters',
            popover: {
              title: 'Date Range & Type Filters',
              description: 'Select custom date ranges, filter by trade type (Buy/Sell/All), and click Refresh for live updates.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-reports-table',
            popover: {
              title: 'Trades History & Execution Log',
              description: 'View full trade details including Trade ID, Symbol, Type, Entry/Exit prices, Volume, and final PnL.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/chart-trading', 'chart-trading')
              },
              onDoneClick: () => {
                transitionToModule('/chart-trading', 'chart-trading')
              },
            },
          },
        ]

      // ─── 5. CLIENT CHART TRADING (WEB TRADER) ───────────────────────────
      case 'chart-trading':
        return [
          {
            element: '#tour-trading-watchlist',
            popover: {
              title: 'Watchlist & Instruments',
              description: 'Explore live tradable instruments, search currency pairs, commodities, indices, and crypto, and organize your favorite watchlists.',
              side: 'right',
              align: 'start',
            },
          },
          {
            element: '#tour-trading-chart',
            popover: {
              title: 'Interactive Trading Chart',
              description: 'Analyze real-time price action with candlestick charts, custom timeframes (1m to 1D), and a complete suite of technical indicators.',
              side: 'left',
              align: 'start',
            },
          },
          {
            element: '#tour-trading-quick-order',
            popover: {
              title: 'Instant BUY & SELL Execution',
              description: 'Execute instant one-click market Buy and Sell orders with live bid/ask quotes and real-time execution directly on the chart.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-trading-account-select',
            popover: {
              title: 'Active Trading Account Selector',
              description: 'Select which Live or Demo MetaTrader 5 account you want to trade and monitor in real time.',
              side: 'top',
              align: 'start',
            },
          },
          {
            element: '#tour-trading-trades-panel',
            popover: {
              title: 'Open Positions & Order History',
              description: 'Track your floating PnL, modify Stop Loss & Take Profit, close active orders, and view your complete trade history.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/copy-trading', 'copy-trading')
              },
              onDoneClick: () => {
                transitionToModule('/copy-trading', 'copy-trading')
              },
            },
          },
        ]

      // ─── 6. CLIENT COPY TRADING ───────────────────────────────────────
      case 'copy-trading':
        return [
          {
            element: '#tour-copy-tabs',
            popover: {
              title: 'Copy Trading Navigation Tabs',
              description: 'Browse the Fund Manager Leaderboard, manage active copied strategies in "My Copy Trading", and view your "Following History".',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-copy-card-first',
            popover: {
              title: 'Fund Manager Strategy Card',
              description: 'Review overall Growth percentage, Win Rate, Max Drawdown risk indicator, and Minimum Deposit requirement.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-copy-card-menu, #tour-copy-card-menu-btn',
            popover: {
              title: 'Strategy Options & Instant Follow (⋮)',
              description: 'Click this menu to Follow this Fund Manager and automatically mirror their winning trades in your account.',
              side: 'left',
              align: 'center',
            },
          },
          {
            element: '#tour-copy-content',
            popover: {
              title: 'Leaderboard & Expert Traders',
              description: 'Explore verified Fund Managers and click "Know More" to analyze their detailed monthly performance and equity growth charts.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/tickets', 'tickets')
              },
              onDoneClick: () => {
                transitionToModule('/tickets', 'tickets')
              },
            },
          },
        ]

      // ─── 6. CLIENT TICKETS & SUPPORT ──────────────────────────────────
      case 'tickets': {
        const canAccessIb = isIbAccessible()
        const steps = [
          {
            element: '#tour-tickets-create-btn',
            popover: {
              title: 'Raise Support Tickets',
              description: 'Submit inquiries or request technical assistance directly from our 24/7 support desk.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-tickets-stats',
            popover: {
              title: 'Tickets Overview & Status',
              description: 'Track open tickets, recent replies, and resolution progress at a glance.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-tickets-filters',
            popover: {
              title: 'Search & Ticket Filters',
              description: 'Filter your tickets by ID, Status (Open, Solved, Closed), Priority (Low, Medium, High, Urgent), and date ranges.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-tickets-table',
            popover: {
              title: 'Support Tickets & Activity Log',
              description: 'View all ticket codes, subjects, priorities, statuses, and creation dates. Click any ticket row to view full conversation history.',
              side: 'top',
              align: 'start',
            },
          },
          {
            element: '#tour-topbar-actions',
            popover: {
              title: 'Alerts & Profile Settings',
              description: 'Check notifications, complete KYC verification, and manage your account preferences.',
              side: 'bottom',
              align: 'end',
            },
          },
        ]

        if (canAccessIb) {
          steps.push({
            element: '#tour-role-toggle',
            popover: {
              title: 'Client Tour Done! Next: IB Partner Portal',
              description: 'You completed the Client portal tour. Click Next to switch over to the IB Partner Dashboard and explore your partner tools, network, and wallet.',
              side: 'right',
              align: 'center',
              nextBtnText: 'Explore IB Portal',
              doneBtnText: 'Explore IB Portal',
              onNextClick: () => {
                const profileStore = useProfileStore()
                profileStore.setActiveRole('ib')
                localStorage.setItem('role', 'ib')
                transitionToModule('/ib-dashboard', 'ib-dashboard')
              },
              onDoneClick: () => {
                const profileStore = useProfileStore()
                profileStore.setActiveRole('ib')
                localStorage.setItem('role', 'ib')
                transitionToModule('/ib-dashboard', 'ib-dashboard')
              },
            },
          })
        } else {
          steps.push({
            element: '#tour-user-profile',
            popover: {
              title: '🎉 Complete! You are Ready to Trade',
              description: 'You have completed the full walkthrough tour. Click Finish to return to your dashboard.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Finish Tour',
              doneBtnText: 'Finish Tour',
              onNextClick: () => {
                finishCompleteTour('client')
              },
              onDoneClick: () => {
                finishCompleteTour('client')
              },
            },
          })
        }

        return steps
      }

      // ═══════════════════════════════════════════════════════════════════
      // IB PARTNER MODULES
      // ═══════════════════════════════════════════════════════════════════

      // ─── 1. IB DASHBOARD ──────────────────────────────────────────────
      case 'ib-dashboard':
        return [
          {
            element: '#tour-logo',
            popover: {
              title: 'Welcome to IB Partner Portal',
              description: 'Your comprehensive partner overview where you track client performance, trade volumes, and commission payouts.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-role-toggle',
            popover: {
              title: 'Client / IB Mode Switcher',
              description: 'Switch seamlessly between your personal trading account and IB partner management console.',
              side: 'right',
              align: 'center',
            },
          },
          {
            element: '#tour-nav-items',
            popover: {
              title: 'IB Navigation',
              description: 'Quick access to IB Reports, Network Tree, Client Reports, Funds, Wallet, and Tickets.',
              side: 'right',
              align: 'start',
            },
          },
          {
            element: '#tour-ib-competitions-banner',
            popover: {
              title: 'Promotions & Partner Contests',
              description: 'Discover active partner contests, promotional banners, deposit campaigns, and important brokerage announcements.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-ib-commission-card',
            popover: {
              title: 'Commission & Available Balance',
              description: 'View total earned commission and your current available balance ready for withdrawal or transfer.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-ib-referral-link',
            popover: {
              title: 'Referral Links & IB Plans',
              description: 'Select partner campaigns and copy your personalized invitation link to onboard new traders.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-ib-performance-chart',
            popover: {
              title: 'Performance & Volume Growth',
              description: 'Analyze net deposits, withdrawal volume, and new accounts over any custom date range.',
              side: 'top',
              align: 'start',
            },
          },
          {
            element: '#tour-ib-top-accounts',
            popover: {
              title: 'Top Accounts & Recent Clients',
              description: 'Monitor top performing accounts and recently onboarded clients.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/ib-reports', 'ib-reports')
              },
              onDoneClick: () => {
                transitionToModule('/ib-reports', 'ib-reports')
              },
            },
          },
        ]

      // ─── 2. IB REPORTS ────────────────────────────────────────────────
      case 'ib-reports':
        return [
          {
            element: '#tour-ib-reports-selector',
            popover: {
              title: 'Select IB Account',
              description: 'Filter reports across different Sub-IB levels or search specific account IDs.',
              side: 'right',
              align: 'start',
            },
          },
          {
            element: '#tour-ib-reports-summary',
            popover: {
              title: 'Commission & Volume Summary',
              description: 'Track deposit, withdrawal, and net commission totals across your partner network.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-ib-reports-table',
            popover: {
              title: 'Symbol Activity & Rebates',
              description: 'Detailed symbol-wise breakdown of closed lots, open lots, and rebate earnings.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/my-network', 'my-network')
              },
              onDoneClick: () => {
                transitionToModule('/my-network', 'my-network')
              },
            },
          },
        ]

      // ─── 3. IB MY NETWORK ─────────────────────────────────────────────
      case 'my-network':
        return [
          {
            element: '#tour-ib-network-summary',
            popover: {
              title: 'Network Overview',
              description: 'Track your multi-tier partner structure: Direct IBs, Sub-IBs, and total referred clients.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-ib-network-filters',
            popover: {
              title: 'Multi-Level Hierarchy Filters',
              description: 'Filter your network by Level, specific IB partner, or referred client.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-ib-network-chart',
            popover: {
              title: 'Network Analytics & Volume',
              description: 'Visualize your network growth curves and trade volume distributions.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/clients', 'clients')
              },
              onDoneClick: () => {
                transitionToModule('/clients', 'clients')
              },
            },
          },
        ]

      // ─── 4. IB CLIENTS ────────────────────────────────────────────────
      case 'clients':
        return [
          {
            element: '#tour-ib-clients-search',
            popover: {
              title: 'Search & Filter Clients',
              description: 'Quickly find client accounts by name, account number, or Sub-IB assignment.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-ib-clients-actions',
            popover: {
              title: 'Export & Refresh Reports',
              description: 'Download detailed client CSV reports or refresh the latest network records.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-ib-clients-table',
            popover: {
              title: 'Client Management Table',
              description: 'Inspect client status, KYC verification, balance, equity, and trading statistics.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/ib-funds', 'ib-funds')
              },
              onDoneClick: () => {
                transitionToModule('/ib-funds', 'ib-funds')
              },
            },
          },
        ]

      // ─── 5. IB FUNDS ──────────────────────────────────────────────────
      case 'ib-funds':
        return [
          {
            element: '#tour-funds-tabs',
            popover: {
              title: 'IB Funds Management',
              description: 'Transfer commission directly into your trading account or request crypto withdrawals.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-funds-content',
            popover: {
              title: 'Payout & Transfer Options',
              description: 'Fast, secure internal transfer and multi-channel withdrawal gateways.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/ib-wallet', 'ib-wallet')
              },
              onDoneClick: () => {
                transitionToModule('/ib-wallet', 'ib-wallet')
              },
            },
          },
        ]

      // ─── 6. IB WALLET ─────────────────────────────────────────────────
      case 'ib-wallet':
        return [
          {
            element: '#tour-ib-wallet-card',
            popover: {
              title: 'IB Wallet Overview',
              description: 'Check your total commission accrued, available balance, and lifetime withdrawals.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-ib-wallet-history',
            popover: {
              title: 'Wallet Transaction Ledger',
              description: 'Complete audit trail of all commission credits, payout requests, and transfer records.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/ib-tickets', 'ib-tickets')
              },
              onDoneClick: () => {
                transitionToModule('/ib-tickets', 'ib-tickets')
              },
            },
          },
        ]

      // ─── 7. IB TICKETS & SUPPORT ──────────────────────────────────────
      case 'ib-tickets':
        return [
          {
            element: '#tour-tickets-create-btn',
            popover: {
              title: 'IB Partner Support',
              description: 'Open dedicated priority support tickets for account queries or partner assistance.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-tickets-stats',
            popover: {
              title: 'Ticket Tracking',
              description: 'Monitor ticket progress, admin responses, and resolution status.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-tickets-filters',
            popover: {
              title: 'Search & Filters',
              description: 'Filter support tickets by status, priority, ticket ID, or date ranges.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-tickets-table',
            popover: {
              title: 'Tickets Management Table',
              description: 'Track all partner queries and open tickets with instant status updates.',
              side: 'top',
              align: 'start',
            },
          },
          {
            element: '#tour-topbar-actions',
            popover: {
              title: 'Notifications & Settings',
              description: 'Check real-time system alerts, KYC verification status, and theme preferences.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-user-profile',
            popover: {
              title: '🎉 Complete Walkthrough Finished!',
              description: 'You have explored all Client and IB Partner modules. Click Finish to return to your dashboard.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Finish Tour',
              doneBtnText: 'Finish Tour',
              onNextClick: () => {
                const profileStore = useProfileStore()
                profileStore.setActiveRole('client')
                localStorage.setItem('role', 'client')
                finishCompleteTour('client')
              },
              onDoneClick: () => {
                const profileStore = useProfileStore()
                profileStore.setActiveRole('client')
                localStorage.setItem('role', 'client')
                finishCompleteTour('client')
              },
            },
          },
        ]

      // ═══════════════════════════════════════════════════════════════════
      // FUND MANAGER (FM) MODULES
      // ═══════════════════════════════════════════════════════════════════

      // ─── 1. FM DASHBOARD ──────────────────────────────────────────────
      case 'fm-dashboard':
        return [
          {
            element: '#tour-logo',
            popover: {
              title: 'Welcome to Fund Manager Portal',
              description: 'Manage your strategy offerings, monitor investors, track trading profits, and manage capital.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-notifications',
            popover: {
              title: 'Real-time Alerts & Notifications',
              description: 'Stay alerted on new followers, deposit allocations, strategy milestones, and profit settlements.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-theme-toggle',
            popover: {
              title: 'Dark / Light Theme Switcher',
              description: 'Toggle between Dark and Light mode themes for comfortable management day and night.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-nav-items',
            popover: {
              title: 'Fund Manager Navigation',
              description: 'Quick access to Trading Accounts, Leaderboard, Trade Books, Followers, Funds, Wallet, and Tickets.',
              side: 'right',
              align: 'start',
            },
          },
          {
            element: '#tour-fm-competitions-banner',
            popover: {
              title: 'FM Contests & Promotions',
              description: 'Stay updated with exclusive fund manager competitions, prize pools, and performance bonuses.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-fm-overview-followers',
            popover: {
              title: 'Investors & Followers Breakdown',
              description: 'Review active followers, pending joins, strategy subscriber distribution, and total follower equity.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-fm-overview-metrics',
            popover: {
              title: 'Key Financial Metrics',
              description: 'Track total investors, High-Water Mark equity level, lifetime profit share, and management fees accrued.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-fm-account-status',
            popover: {
              title: 'FM Account Status & Offer',
              description: 'View your live master account balance, active offer parameters, profit-sharing ratio, and minimum investment terms.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-fm-performance-chart',
            popover: {
              title: 'Performance & Equity Curve',
              description: 'Analyze your historical profit curve, ROI growth trajectory, and monthly performance stats.',
              side: 'top',
              align: 'start',
            },
          },
          {
            element: '#tour-fm-performance-profile',
            popover: {
              title: 'Public Profile & Strategy Summary',
              description: 'Check your public strategy rating, trading style, maximum drawdown safety, and risk metrics.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/fm-trading-accounts', 'fm-trading-accounts')
              },
              onDoneClick: () => {
                transitionToModule('/fm-trading-accounts', 'fm-trading-accounts')
              },
            },
          },
        ]

      // ─── 2. FM TRADING ACCOUNTS ───────────────────────────────────────
      case 'fm-trading-accounts':
        return [
          {
            element: '#tour-fm-accounts-tabs',
            popover: {
              title: 'Account Filters & Platforms',
              description: 'Filter between All, MT5 Live Master, Demo, and Strategy Manager accounts.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-account-visibility-btn',
            popover: {
              title: 'Privacy & Balance Visibility',
              description: 'Click the eye icon to mask or reveal your master account balance and equity figures.',
              side: 'left',
              align: 'center',
            },
          },
          {
            element: '#tour-account-settings-menu',
            popover: {
              title: 'Account Settings & Actions',
              description: 'Change leverage, view live master trades, update password credentials, and configure account parameters.',
              side: 'left',
              align: 'center',
            },
          },
          {
            element: '#tour-account-deposit-withdraw',
            popover: {
              title: 'Deposit & Withdrawal Shortcuts',
              description: 'Deposit trading capital directly or request fast payouts from this specific account.',
              side: 'top',
              align: 'start',
            },
          },
          {
            element: '#tour-account-transfer-history',
            popover: {
              title: 'Internal Transfer & History',
              description: 'Move funds between accounts instantly or review complete transaction ledgers.',
              side: 'top',
              align: 'end',
            },
          },
          {
            element: '#tour-fm-accounts-grid',
            popover: {
              title: 'Fund Manager Master Accounts',
              description: 'Monitor all your active master trading accounts, live equity, margin level, and floating PnL.',
              side: 'bottom',
              align: 'center',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/fm-leaderboard', 'fm-leaderboard')
              },
              onDoneClick: () => {
                transitionToModule('/fm-leaderboard', 'fm-leaderboard')
              },
            },
          },
        ]

      // ─── 3. FM LEADERBOARD ────────────────────────────────────────────
      case 'fm-leaderboard':
        return [
          {
            element: '#tour-copy-card-first',
            popover: {
              title: 'Strategy Rankings & Performance',
              description: 'Compare high-return strategies, growth percentages, win rates, and follower ratings on the public board.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-copy-content',
            popover: {
              title: 'Global Leaderboard',
              description: 'Analyze how your fund manager performance benchmarks against top global traders in the Panther ecosystem.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/fm-trade-books', 'fm-trade-books')
              },
              onDoneClick: () => {
                transitionToModule('/fm-trade-books', 'fm-trade-books')
              },
            },
          },
        ]

      // ─── 4. FM TRADE BOOKS ────────────────────────────────────
      case 'fm-trade-books':
        return [
          {
            element: '#tour-fm-tradebooks-metrics',
            popover: {
              title: 'Trade Books Performance Summary',
              description: 'Track Total Trades, Open Orders, Closed Trades, Cumulative Volume in lots, and Net Realized PnL.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-fm-tradebooks-filters',
            popover: {
              title: 'Master Trades Filters',
              description: 'Filter trades by Ticket ID, symbol, Buy/Sell type, status (Open/Closed), and custom date ranges.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-fm-tradebooks-table',
            popover: {
              title: 'Master Trade Execution Log',
              description: 'Full audit log of all master orders executed, open/close price, lot size, swap, commissions, and final profit.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/followers', 'fm-followers')
              },
              onDoneClick: () => {
                transitionToModule('/followers', 'fm-followers')
              },
            },
          },
        ]

      // ─── 5. FM FOLLOWERS ──────────────────────────────────────────────
      case 'fm-followers':
        return [
          {
            element: '#tour-fm-followers-filters',
            popover: {
              title: 'Followers Search & Offer Filters',
              description: 'Search followers by name or account ID, filter by active strategy offer, and filter by subscription status.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-fm-followers-table',
            popover: {
              title: 'Followers & Investors Ledger',
              description: 'Monitor individual follower accounts, their equity, copy ratio multiplier, profit share earned, and join date.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/fm-funds', 'fm-funds')
              },
              onDoneClick: () => {
                transitionToModule('/fm-funds', 'fm-funds')
              },
            },
          },
        ]

      // ─── 6. FM FUNDS ──────────────────────────────────────────────────
      case 'fm-funds':
        return [
          {
            element: '#tour-funds-tabs',
            popover: {
              title: 'FM Funds Operations',
              description: 'Deposit capital, request profit withdrawals, transfer to master trading accounts, and inspect history.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-funds-content',
            popover: {
              title: 'Secure Payment Gateways',
              description: 'Fast, secure deposits and payouts via Crypto, Card Gateways, and Bank Wire.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/your-wallet', 'fm-wallet')
              },
              onDoneClick: () => {
                transitionToModule('/your-wallet', 'fm-wallet')
              },
            },
          },
        ]

      // ─── 7. FM WALLET ─────────────────────────────────────────────────
      case 'fm-wallet':
        return [
          {
            element: '#tour-fm-wallet-tabs',
            popover: {
              title: 'Wallet Navigation Tabs',
              description: 'Switch between Wallet Transactions and Internal Transfers history.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-fm-wallet-summary',
            popover: {
              title: 'Wallet Balances & Profit Summary',
              description: 'Track Current Wallet Balance, Lifetime Profit Share, Total Withdrawals, and Net Transfers.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-fm-wallet-table',
            popover: {
              title: 'Wallet Transactions Audit Log',
              description: 'Complete record of all performance fee settlements, payout transactions, and fee credits.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Next Module',
              doneBtnText: 'Next Module',
              onNextClick: () => {
                transitionToModule('/fm-tickets', 'fm-tickets')
              },
              onDoneClick: () => {
                transitionToModule('/fm-tickets', 'fm-tickets')
              },
            },
          },
        ]

      // ─── 8. FM TICKETS & SUPPORT ──────────────────────────────────────
      case 'fm-tickets':
        return [
          {
            element: '#tour-tickets-create-btn',
            popover: {
              title: 'Fund Manager Support Desk',
              description: 'Raise priority inquiries or technical support requests regarding master accounts, settlements, or followers.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-tickets-stats',
            popover: {
              title: 'Support Tickets Status',
              description: 'Track open inquiries, manager replies, and resolution progress in real time.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-tickets-filters',
            popover: {
              title: 'Search & Ticket Filters',
              description: 'Filter tickets by ID, status, priority, or custom creation date ranges.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-tickets-table',
            popover: {
              title: 'FM Support Tickets Log',
              description: 'Full record of all technical inquiries, responses, and resolution history.',
              side: 'top',
              align: 'start',
            },
          },
          {
            element: '#tour-topbar-actions',
            popover: {
              title: 'Notifications & Profile Settings',
              description: 'Review system notifications, verification status, and security settings.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-user-profile',
            popover: {
              title: '🎉 FM Portal Walkthrough Finished!',
              description: 'You have explored all Fund Manager tools and modules. Click Finish to return to your FM Dashboard.',
              side: 'top',
              align: 'start',
              nextBtnText: 'Finish Tour',
              doneBtnText: 'Finish Tour',
              onNextClick: () => {
                finishCompleteTour('fm')
              },
              onDoneClick: () => {
                finishCompleteTour('fm')
              },
            },
          },
        ]

      default:
        return []
    }
  }

  /**
   * Start guided tour for a specific module
   */
  const startModuleTour = (moduleName = 'dashboard') => {
    if (!isAuthenticated() || isAuthRoutePath(router.currentRoute.value?.path)) {
      stopTour()
      return
    }

    const rawSteps = getModuleSteps(moduleName)

    if (!rawSteps.length) {
      console.warn(`[Tour] No steps defined for module: ${moduleName}`)
      return
    }

    if (driverInstance) {
      driverInstance.destroy()
    }

    driverInstance = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      stagePadding: 8,
      stageRadius: 10,
      popoverOffset: 14,
      overlayColor: '#000000',
      overlayOpacity: 0.72,
      popoverClass: 'panther-tour-popover',
      nextBtnText: 'Next',
      prevBtnText: 'Previous',
      doneBtnText: 'Next Module',
      steps: rawSteps,
      onHighlightStarted: (element) => {
        if (!isAuthenticated() || isAuthRoutePath(router.currentRoute.value?.path)) {
          stopTour()
          return
        }
        if (element && typeof element.scrollIntoView === 'function') {
          element.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' })
        }
      },
      onHighlighted: () => {
        if (!isAuthenticated() || isAuthRoutePath(router.currentRoute.value?.path)) {
          stopTour()
          return
        }
        // Automatically recalculate popover position after DOM element is highlighted
        requestAnimationFrame(() => {
          if (driverInstance && typeof driverInstance.recalculatePopover === 'function') {
            driverInstance.recalculatePopover()
          }
        })
      },
      onDestroyStarted: () => {
        // If it's a programmatic transition to next module, do NOT cancel tour!
        if (isTransitioning) {
          return
        }

        // If user explicitly clicks close 'X' or dismisses overlay
        isTourRunning.value = false
        localStorage.removeItem(STORAGE_ACTIVE_TOUR_KEY)
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(STORAGE_TOUR_SESSION_KEY, 'true')
        }
        markTourCompleted()
        if (driverInstance) {
          driverInstance.destroy()
        }

        // If user dismissed tour while inside /chart-trading, return to main application dashboard
        if (router.currentRoute.value.path.includes('/chart-trading')) {
          router.push('/dashboard')
        }
      },
    })

    isTourRunning.value = true
    currentModule.value = moduleName
    driverInstance.drive()
  }

  /**
   * Auto-resume tour for the current route on page load or refresh
   * Ensures tour only triggers ONCE per login session and NEVER on page refresh / reload
   */
  const autoResumeTourForRoute = async (path) => {
    if (!isAuthenticated() || isAuthRoutePath(path) || isAuthRoutePath(router.currentRoute.value?.path)) {
      stopTour()
      return
    }

    // If tour has already been presented/handled in this login session, do NOT auto-launch on refresh
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(STORAGE_TOUR_SESSION_KEY) === 'true') {
      return
    }

    const profileStore = useProfileStore()
    if (!profileStore.isFetched) {
      try {
        await profileStore.fetchUserProfile()
      } catch (err) {
        console.warn('[Tour] Error fetching profile:', err)
        if (!isAuthenticated() || isAuthRoutePath(router.currentRoute.value?.path)) {
          stopTour()
          return
        }
      }
    }

    if (hasCompletedTour() || !isAuthenticated() || isAuthRoutePath(router.currentRoute.value?.path)) {
      return
    }

    // Mark current login session so browser reload / F5 will NOT prompt tour again
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_TOUR_SESSION_KEY, 'true')
    }

    const matchedModule = getModuleFromPath(path)
    localStorage.setItem(STORAGE_ACTIVE_TOUR_KEY, matchedModule)
    if (tourTimer) clearTimeout(tourTimer)
    tourTimer = setTimeout(() => {
      if (isAuthenticated() && !isAuthRoutePath(router.currentRoute.value?.path)) {
        startModuleTour(matchedModule)
      } else {
        stopTour()
      }
    }, 350)
  }

  /**
   * Start the complete multi-module tour from the beginning
   * @param {boolean} force - If true, bypasses hasCompletedTour check
   */
  const startTour = async (force = false) => {
    if (!isAuthenticated() || isAuthRoutePath(router.currentRoute.value?.path)) {
      stopTour()
      return
    }

    if (!force && typeof sessionStorage !== 'undefined' && sessionStorage.getItem(STORAGE_TOUR_SESSION_KEY) === 'true') {
      return
    }

    const profileStore = useProfileStore()
    if (!profileStore.isFetched) {
      try {
        await profileStore.fetchUserProfile()
      } catch (err) {
        console.warn('[Tour] Error fetching profile:', err)
        if (!isAuthenticated() || isAuthRoutePath(router.currentRoute.value?.path)) {
          stopTour()
          return
        }
      }
    }

    if (!force && hasCompletedTour()) {
      return
    }

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_TOUR_SESSION_KEY, 'true')
    }

    const activeModule = localStorage.getItem(STORAGE_ACTIVE_TOUR_KEY) || 'dashboard'
    if (tourTimer) clearTimeout(tourTimer)
    tourTimer = setTimeout(() => {
      if (isAuthenticated() && !isAuthRoutePath(router.currentRoute.value?.path)) {
        startModuleTour(activeModule)
      } else {
        stopTour()
      }
    }, 350)
  }

  /**
   * Restart the multi-module tour from the very beginning (Dashboard, IB Dashboard, or FM Dashboard based on active role)
   */
  const restartTour = async () => {
    if (!isAuthenticated() || isAuthRoutePath(router.currentRoute.value?.path)) {
      stopTour()
      return
    }

    const profileStore = useProfileStore()
    if (profileStore.user) {
      profileStore.user.is_tour = false
    }
    localStorage.removeItem(STORAGE_TOUR_KEY)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_TOUR_SESSION_KEY)
    }
    
    try {
      await setUserTourApi(false)
    } catch (err) {
      console.warn('[Tour] Error resetting tour status on restart:', err)
    }

    const role = profileStore.user?.role || localStorage.getItem('role') || 'client'
    const currentPath = router.currentRoute.value.path
    const isFm = role === 'fm' || currentPath.startsWith('/fm') || currentPath === '/your-wallet' || currentPath === '/followers'
    const isIb = !isFm && (profileStore.activeRole === 'ib' || role === 'ib')

    if (isFm) {
      localStorage.setItem(STORAGE_ACTIVE_TOUR_KEY, 'fm-dashboard')
      if (currentPath !== '/fm-dashboard') {
        router.push('/fm-dashboard').then(() => {
          if (tourTimer) clearTimeout(tourTimer)
          tourTimer = setTimeout(() => {
            if (isAuthenticated() && !isAuthRoutePath(router.currentRoute.value?.path)) {
              startModuleTour('fm-dashboard')
            }
          }, 700)
        })
      } else {
        if (tourTimer) clearTimeout(tourTimer)
        tourTimer = setTimeout(() => {
          if (isAuthenticated() && !isAuthRoutePath(router.currentRoute.value?.path)) {
            startModuleTour('fm-dashboard')
          }
        }, 350)
      }
    } else if (isIb) {
      localStorage.setItem(STORAGE_ACTIVE_TOUR_KEY, 'ib-dashboard')
      if (currentPath !== '/ib-dashboard') {
        router.push('/ib-dashboard').then(() => {
          if (tourTimer) clearTimeout(tourTimer)
          tourTimer = setTimeout(() => {
            if (isAuthenticated() && !isAuthRoutePath(router.currentRoute.value?.path)) {
              startModuleTour('ib-dashboard')
            }
          }, 700)
        })
      } else {
        if (tourTimer) clearTimeout(tourTimer)
        tourTimer = setTimeout(() => {
          if (isAuthenticated() && !isAuthRoutePath(router.currentRoute.value?.path)) {
            startModuleTour('ib-dashboard')
          }
        }, 350)
      }
    } else {
      localStorage.setItem(STORAGE_ACTIVE_TOUR_KEY, 'dashboard')
      if (currentPath !== '/dashboard') {
        router.push('/dashboard').then(() => {
          if (tourTimer) clearTimeout(tourTimer)
          tourTimer = setTimeout(() => {
            if (isAuthenticated() && !isAuthRoutePath(router.currentRoute.value?.path)) {
              startModuleTour('dashboard')
            }
          }, 700)
        })
      } else {
        if (tourTimer) clearTimeout(tourTimer)
        tourTimer = setTimeout(() => {
          if (isAuthenticated() && !isAuthRoutePath(router.currentRoute.value?.path)) {
            startModuleTour('dashboard')
          }
        }, 350)
      }
    }
  }

  /**
   * Reset completion flag
   */
  const resetTour = () => {
    localStorage.removeItem(STORAGE_TOUR_KEY)
    localStorage.removeItem(STORAGE_ACTIVE_TOUR_KEY)
    snackbar.show('Tour reset successfully! Starting full walkthrough...', 'info')
    restartTour()
  }

  return {
    isTourRunning,
    currentModule,
    hasCompletedTour,
    markTourCompleted,
    autoResumeTourForRoute,
    startTour,
    startModuleTour,
    restartTour,
    resetTour,
    stopTour,
    transitionToModule,
    finishCompleteTour,
  }
})
