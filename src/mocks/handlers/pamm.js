import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

export const pammHandlers = [
  // 1. FUND MANAGERS LIST
  http.get('/api/:role' + (urls?.fm?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 45
    const totalPages = Math.ceil(totalItems / perPage)

    const allFms = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      label_name: faker.finance.accountName() + ' Strategy',
      user: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        kyc_status: faker.helpers.arrayElement(['approved', 'pending'])
      },
      is_active: faker.datatype.boolean(),
      visibility_type: faker.helpers.arrayElement(['public', 'private']),
      min_capital: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
      broker_currency: 'USD',
      performance_fee: faker.number.float({ min: 10, max: 30, fractionDigits: 1 }),
      management_fee: faker.number.float({ min: 0, max: 5, fractionDigits: 1 }),
      management_fee_interval: 'monthly',
      registration_fee: faker.number.float({ min: 0, max: 50, fractionDigits: 0 }),
      broker_leverage: faker.helpers.arrayElement(['100', '200', '500']),
      broker_share: faker.number.int({ min: 10, max: 30 }),
      fm_share: faker.number.int({ min: 40, max: 70 }),
      ib_pool_percentage: faker.number.int({ min: 5, max: 15 }),
      master_account_id: faker.number.int({ min: 100000, max: 999999 }),
      coverage_account_id: faker.number.int({ min: 100000, max: 999999 }),
      broker_group: faker.helpers.arrayElement(['Real', 'Demo', 'VIP']),
      created_at: faker.date.past().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allFms, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages },
      summary: { total_fms: totalItems }
    })
  }),

  // 2. FM OFFERS
  http.get('/api/:role' + (urls?.fm?.offers || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 30
    const totalPages = Math.ceil(totalItems / perPage)

    const allOffers = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      name: faker.commerce.productName() + ' Offer',
      offer_code: faker.string.alphanumeric(6).toUpperCase(),
      fm_name: faker.person.fullName(),
      minimum_balance: faker.number.float({ min: 100, max: 5000, fractionDigits: 0 }),
      total_fees_collected: faker.number.float({ min: 500, max: 10000, fractionDigits: 2 }),
      performance_fee: faker.number.int({ min: 10, max: 40 }),
      management_fee: faker.number.float({ min: 0, max: 5, fractionDigits: 1 }),
      registration_fee: faker.number.float({ min: 0, max: 100, fractionDigits: 0 }),
      is_active: faker.datatype.boolean(),
      visibility: faker.helpers.arrayElement(['public', 'private']),
      subscribers_count: faker.number.int({ min: 0, max: 200 }),
      join_link_count: faker.number.int({ min: 0, max: 5 }),
      created_at: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allOffers, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages }
    })
  }),

  // 3. FM FOLLOWERS & HISTORY
  http.get('/api/fund_managers/followers/:id', ({ request, params }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 150
    const totalPages = Math.ceil(totalItems / perPage)

    const allFollowers = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      account_number: faker.number.int({ min: 100000, max: 999999 }),
      broker_label: faker.helpers.arrayElement(['Real', 'Demo']),
      equity: faker.number.float({ min: 500, max: 50000, fractionDigits: 2 }),
      net_profit: faker.number.float({ min: -5000, max: 15000, fractionDigits: 2 }),
      gross_pnl: faker.number.float({ min: -5000, max: 15000, fractionDigits: 2 }),
      lot_type: faker.helpers.arrayElement(['fixed', 'multiplier', 'proportion']),
      lot_value: faker.number.float({ min: 0.1, max: 5, fractionDigits: 2 }),
      total_trades: faker.number.int({ min: 10, max: 1000 }),
      open_position_count: faker.number.int({ min: 0, max: 10 }),
      offer_name: faker.helpers.arrayElement(['Main Offer', 'VIP Offer', null]),
      ib_name: faker.helpers.arrayElement([faker.company.name(), null]),
      ib_email: faker.internet.email(),
      status: faker.helpers.arrayElement(['active', 'paused']),
      joined_at: faker.date.past().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allFollowers, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages }
    })
  }),

  http.get('/api/fund_managers/followers/:id/history', ({ request, params }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 50
    const totalPages = Math.ceil(totalItems / perPage)

    const allFollowersHistory = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      account_number: faker.number.int({ min: 100000, max: 999999 }),
      broker_label: faker.helpers.arrayElement(['Real', 'Demo']),
      equity: faker.number.float({ min: 500, max: 50000, fractionDigits: 2 }),
      net_profit: faker.number.float({ min: -5000, max: 15000, fractionDigits: 2 }),
      gross_pnl: faker.number.float({ min: -5000, max: 15000, fractionDigits: 2 }),
      lot_type: faker.helpers.arrayElement(['fixed', 'multiplier', 'proportion']),
      lot_value: faker.number.float({ min: 0.1, max: 5, fractionDigits: 2 }),
      total_trades: faker.number.int({ min: 10, max: 1000 }),
      open_position_count: 0,
      offer_name: faker.helpers.arrayElement(['Main Offer', 'VIP Offer', null]),
      ib_name: faker.helpers.arrayElement([faker.company.name(), null]),
      ib_email: faker.internet.email(),
      status: 'unsubscribed',
      joined_at: faker.date.past().toISOString(),
      unfollowed_at: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allFollowersHistory, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages }
    })
  }),

  // FOLLOWER INFO DETAILS
  http.get('/api/fund_managers/followers/info/:id', ({ request, params }) => {
    return HttpResponse.json({
      status: 'success',
      data: {
        id: params.id,
        user_name: faker.person.fullName(),
        user_email: faker.internet.email(),
        account_number: faker.number.int({ min: 100000, max: 999999 }).toString(),
        trading_account_id: faker.number.int({ min: 1000, max: 9999 }),
        is_active: faker.datatype.boolean(),
        lot_type: faker.helpers.arrayElement(['fixed', 'multiplier', 'proportion']),
        lot_value: faker.number.float({ min: 0.1, max: 5.0, fractionDigits: 2 }),
        broker_currency: 'USD',
        balance: faker.number.float({ min: 500, max: 50000, fractionDigits: 2 }),
        performance_fee: faker.number.float({ min: 10, max: 50, fractionDigits: 1 }),
        management_fee: faker.number.float({ min: 0, max: 5, fractionDigits: 1 }),
        registration_fee: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
        broker_label: faker.helpers.arrayElement(['Real', 'Demo']),
        server: faker.helpers.arrayElement(['COPY_TRADING', 'MT5', 'MT4']),
        settlement_type: faker.helpers.arrayElement(['monthly', 'weekly', 'daily']),
        fm_share: faker.number.float({ min: 5, max: 30, fractionDigits: 1 }),
        broker_share: faker.number.float({ min: 0, max: 10, fractionDigits: 1 }),
        created_at: faker.date.past().toISOString()
      }
    })
  }),

  // 4. FM REQUESTS
  http.get('/api/:role' + (urls?.fm?.requestList || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 30
    const totalPages = Math.ceil(totalItems / perPage)

    const allRequests = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      user_email: faker.internet.email(),
      user_id: faker.number.int({ min: 10000, max: 99999 }),
      created_at: faker.date.recent().toISOString(),
      broker_currency: faker.finance.currencyCode(),
      broker_group: faker.helpers.arrayElement(['Demo', 'Real', 'VIP']),
      broker_leverage: faker.helpers.arrayElement(['1:100', '1:200', '1:500']),
      broker_category: faker.helpers.arrayElement(['A-Book', 'B-Book']),
      min_capital: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
      settlement_type: faker.helpers.arrayElement(['daily', 'weekly', 'monthly']),
      settlement_time: '23:59:59',
      broker_share: faker.number.int({ min: 10, max: 30 }),
      fm_share: faker.number.int({ min: 40, max: 60 }),
      ib_pool_percentage: faker.number.int({ min: 10, max: 20 }),
      performance_fee: faker.number.float({ min: 10, max: 30, fractionDigits: 1 }),
      status: faker.helpers.arrayElement(['approved', 'pending', 'rejected'])
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allRequests, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages }
    })
  }),

  // 5. SETTLEMENTS LIST
  http.get('/api/settlements', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 45
    const totalPages = Math.ceil(totalItems / perPage)

    const allSettlements = Array.from({ length: totalItems }).map((_, i) => ({
      settlement_id: faker.number.int({ min: 100000, max: 999999 }).toString(),
      fm_name: faker.person.fullName(),
      fm_id: faker.number.int({ min: 1000, max: 9999 }),
      executed_at: faker.date.recent().toISOString(),
      period: 'Q' + faker.number.int({ min: 1, max: 4 }) + ' ' + new Date().getFullYear(),
      settlement_period_start: faker.date.past().toISOString(),
      settlement_period_end: faker.date.recent().toISOString(),
      settlement_type: faker.helpers.arrayElement(['monthly', 'weekly', 'daily']),
      net_profit: faker.number.float({ min: -5000, max: 20000, fractionDigits: 2 }),
      gross_fee: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
      fm_share: faker.number.float({ min: 50, max: 3000, fractionDigits: 2 }),
      ib_pool: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
      broker_net: faker.number.float({ min: 20, max: 1000, fractionDigits: 2 }),
      followers_count: faker.number.int({ min: 5, max: 150 }),
      trades_count: faker.number.int({ min: 20, max: 500 }),
      status: faker.helpers.arrayElement(['Completed', 'Pending', 'Failed']),
      display: null // So that getNetProfit falls back to base properties
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allSettlements, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages }
    })
  }),

  // 6. SETTLEMENT DETAIL
  http.get('/api/settlements/:id', ({ request, params }) => {
    const settlementId = params.id
    
    // Generate 5-15 mock users for this settlement
    const numUsers = faker.number.int({ min: 5, max: 15 })
    const users_summary = Array.from({ length: numUsers }).map((_, i) => {
      const gross_pnl = faker.number.float({ min: -500, max: 2000, fractionDigits: 2 })
      const total_fee = faker.number.float({ min: 10, max: 200, fractionDigits: 2 })
      const fm_fee = faker.number.float({ min: 5, max: 100, fractionDigits: 2 })
      const broker_fee = faker.number.float({ min: 2, max: 50, fractionDigits: 2 })
      const ib_pool = faker.number.float({ min: 1, max: 20, fractionDigits: 2 })
      const net_pnl = gross_pnl - total_fee

      return {
        user_id: faker.number.int({ min: 10000, max: 99999 }),
        user_name: faker.person.fullName(),
        user_email: faker.internet.email(),
        phone_number: faker.phone.number(),
        account_numbers: [
          faker.number.int({ min: 100000, max: 999999 }).toString(),
          faker.number.int({ min: 100000, max: 999999 }).toString()
        ],
        followers_count: faker.number.int({ min: 1, max: 5 }),
        trades_count: faker.number.int({ min: 10, max: 100 }),
        gross_pnl,
        total_fee,
        fm_fee,
        fm_net_after_agents: fm_fee,
        broker_fee,
        broker_net: broker_fee,
        ib_pool,
        ib_distributed: ib_pool,
        net_pnl
      }
    })

    const summary = {
      total_pnl: users_summary.reduce((acc, u) => acc + u.gross_pnl, 0),
      total_fee: users_summary.reduce((acc, u) => acc + u.total_fee, 0),
      total_fm_fee: users_summary.reduce((acc, u) => acc + u.fm_fee, 0),
      total_fm_net_after_agents: users_summary.reduce((acc, u) => acc + u.fm_fee, 0),
      total_broker_fee: users_summary.reduce((acc, u) => acc + u.broker_fee, 0),
      total_broker_net: users_summary.reduce((acc, u) => acc + u.broker_fee, 0),
      total_ib_pool: users_summary.reduce((acc, u) => acc + u.ib_pool, 0),
      total_ib_distributed: users_summary.reduce((acc, u) => acc + u.ib_pool, 0)
    }

    return HttpResponse.json({
      status: 'success',
      data: {
        settlement_id: settlementId,
        fm_name: faker.person.fullName(),
        fm_id: faker.number.int({ min: 1000, max: 9999 }),
        status: faker.helpers.arrayElement(['Completed', 'Pending', 'Failed']),
        summary,
        users_summary
      }
    })
  }),

  // 7. SETTLEMENT USER DETAIL
  http.get('/api/settlements/:id/user/:userId', ({ request, params }) => {
    const { id, userId } = params
    
    // Generate 1-3 followers (sessions) for this user
    const numFollowers = faker.number.int({ min: 1, max: 3 })
    const followers = Array.from({ length: numFollowers }).map((_, i) => {
      const gross_pnl = faker.number.float({ min: -200, max: 1000, fractionDigits: 2 })
      const total_fee = faker.number.float({ min: 10, max: 100, fractionDigits: 2 })
      const fm_fee = faker.number.float({ min: 5, max: 50, fractionDigits: 2 })
      const broker_fee = faker.number.float({ min: 2, max: 20, fractionDigits: 2 })
      const ib_pool = faker.number.float({ min: 1, max: 10, fractionDigits: 2 })
      
      const numPeriods = faker.number.int({ min: 1, max: 4 })
      const periods = Array.from({ length: numPeriods }).map((_, j) => ({
        period_id: faker.string.uuid(),
        settlement_period_start: faker.date.past().toISOString(),
        settlement_period_end: faker.date.recent().toISOString(),
        trades_count: faker.number.int({ min: 1, max: 20 }),
        gross_pnl: gross_pnl / numPeriods,
        total_fee: total_fee / numPeriods,
        fm_fee: fm_fee / numPeriods,
        fm_net_after_agents: fm_fee / numPeriods,
        broker_fee: broker_fee / numPeriods,
        broker_net: broker_fee / numPeriods,
        ib_pool: ib_pool / numPeriods,
        ib_distributed: ib_pool / numPeriods,
        net_pnl: (gross_pnl - total_fee) / numPeriods
      }))

      return {
        follower_id: faker.number.int({ min: 1000, max: 9999 }),
        account_number: faker.number.int({ min: 100000, max: 999999 }).toString(),
        settlement_type: faker.helpers.arrayElement(['monthly', 'weekly', 'daily']),
        summary: {
          trades_count: periods.reduce((acc, p) => acc + p.trades_count, 0),
          gross_pnl,
          total_fee,
          fm_fee,
          fm_net_after_agents: fm_fee,
          broker_fee,
          broker_net: broker_fee,
          ib_pool,
          ib_distributed: ib_pool,
          net_pnl: gross_pnl - total_fee
        },
        periods
      }
    })

    const display = {
      user_id: userId,
      user_name: faker.person.fullName(),
      email: faker.internet.email(),
      phone_number: faker.phone.number(),
      trades_count: followers.reduce((acc, f) => acc + f.summary.trades_count, 0),
      gross_pnl: followers.reduce((acc, f) => acc + f.summary.gross_pnl, 0),
      total_fee: followers.reduce((acc, f) => acc + f.summary.total_fee, 0),
      fm_fee: followers.reduce((acc, f) => acc + f.summary.fm_fee, 0),
      fm_net_after_agents: followers.reduce((acc, f) => acc + f.summary.fm_fee, 0),
      broker_fee: followers.reduce((acc, f) => acc + f.summary.broker_fee, 0),
      broker_net: followers.reduce((acc, f) => acc + f.summary.broker_fee, 0),
      ib_pool: followers.reduce((acc, f) => acc + f.summary.ib_pool, 0),
      ib_distributed: followers.reduce((acc, f) => acc + f.summary.ib_pool, 0),
      net_pnl: followers.reduce((acc, f) => acc + f.summary.net_pnl, 0)
    }

    return HttpResponse.json({
      status: 'success',
      data: {
        display,
        user: { followers }
      }
    })
  })
,
  // FM Full Analysis Mock
  http.post(/\/api\/.*\/fund_managers\/full-analysis$/, async () => {
    const totalItems = 50;
    const trades = Array.from({ length: totalItems }).map((_, i) => ({
      trade_id: faker.number.int({ min: 1000000, max: 9999999 }).toString(),
      created_at: faker.date.recent({ days: 30 }).toISOString(),
      type: faker.helpers.arrayElement(['Buy', 'Sell']),
      symbol: faker.helpers.arrayElement(['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD']),
      volume: faker.number.float({ min: 0.01, max: 2.0, fractionDigits: 2 }),
      open_price: faker.number.float({ min: 1.0, max: 2000.0, fractionDigits: 4 }),
      close_price: faker.number.float({ min: 1.0, max: 2000.0, fractionDigits: 4 }),
      sl: faker.number.float({ min: 1.0, max: 2000.0, fractionDigits: 4 }),
      tp: faker.number.float({ min: 1.0, max: 2000.0, fractionDigits: 4 }),
      commission: faker.number.float({ min: -10.0, max: 0.0, fractionDigits: 2 }),
      swap: faker.number.float({ min: -5.0, max: 5.0, fractionDigits: 2 }),
      pnl: faker.number.float({ min: -500.0, max: 1000.0, fractionDigits: 2 }),
      status: 'closed'
    }));
    trades.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return HttpResponse.json({ status: 'success', data: trades });
  }),

  // FM Analytics Mock
  http.get(/\/api\/.*\/fund_managers\/analytics(\/.*)?$/, () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        FundManagerinfo: {
          id: 1,
          name: faker.person.fullName(),
          label_name: faker.company.name() + " Strategy",
          bio: faker.lorem.paragraph(),
        },
        strategy_info: {
          active_copiers: faker.number.int({ min: 10, max: 500 }),
          performance_fee: 20,
          management_fee: 2,
          profit_sharing: 25,
          min_capital: 500,
          master_balance: 50000,
          master_equity: 51200,
          settlement: 'weekly',
          min_balance: 500,
          active_since: '2023-01-01',
          trades_per_week: 15,
          profitable_weeks: 42
        },
        trade_statistics: {
          total_trades: 150,
          win_rate: 68.5,
          profit_factor: 1.5,
          max_drawdown: 12.4,
          profitable_trades: 103,
          best_trade: 500,
          worst_trade: -200,
          avg_trade_pnl: 50.5,
          long_short: '60/40'
        },
        overview: {
          total_profit: 4500.5,
          total_loss: -1200.2,
          net_profit: 3300.3,
          total_return: 35.4,
          win_rate: 68.5,
          max_drawdown: 12.4
        },
        monthly_returns: [
          { month: 'Jan', return: 5.5 },
          { month: 'Feb', return: -2.0 },
          { month: 'Mar', return: 12.3 },
          { month: 'Apr', return: 4.1 },
          { month: 'May', return: 6.8 },
          { month: 'Jun', return: 1.2 }
        ]
      }
    });
  }),

  // FM Growth Chart Mock
  http.get(/\/api\/.*\/fund_managers\/growth_chart(\/.*)?$/, () => {
    const data = Array.from({ length: 30 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      return {
        date: date.toISOString().split('T')[0],
        value: faker.number.float({ min: 100, max: 200, fractionDigits: 2 }),
        pnl: faker.number.float({ min: -50, max: 100, fractionDigits: 2 })
      };
    });
    return HttpResponse.json({ status: 'success', data });
  }),

  // Followed Fund Managers Mock
  http.get(/\/api\/.*\/followed-fund-managers$/, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const perPage = parseInt(url.searchParams.get('per_page')) || 10;
    const totalItems = 25;
    const items = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      status: faker.helpers.arrayElement(['active', 'paused']),
      fm: {
        id: faker.number.int({ min: 1, max: 100 }),
        name: faker.person.fullName(),
        label_name: faker.company.name() + ' Strategy',
        performance_fee: faker.number.int({ min: 10, max: 30 })
      },
      account: {
        account_number: faker.number.int({ min: 100000, max: 999999 }),
        broker_label: faker.company.name()
      },
      net_profit: faker.number.float({ min: -1000, max: 5000, fractionDigits: 2 }),
      gross_pnl: faker.number.float({ min: -800, max: 6000, fractionDigits: 2 }),
      equity: faker.number.float({ min: 1000, max: 20000, fractionDigits: 2 }),
      high_water_mark: faker.number.float({ min: 1000, max: 25000, fractionDigits: 2 }),
      lot_type: faker.helpers.arrayElement(['multiplier', 'fixed']),
      lot_value: faker.number.float({ min: 0.1, max: 5.0, fractionDigits: 2 }),
      offer: { name: 'Standard Offer' },
      created_at: faker.date.recent({ days: 90 }).toISOString(),
      open_legs: []
    }));
    return HttpResponse.json({
      status: 'success',
      data: items.slice((page - 1) * perPage, page * perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: Math.ceil(totalItems / perPage) }
    });
  }),

  // Followed Fund Managers History Mock
  http.get(/\/api\/.*\/followed-fund-managers\/history$/, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const perPage = parseInt(url.searchParams.get('per_page')) || 10;
    const totalItems = 25;
    const items = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      fund_manager: {
        id: faker.number.int({ min: 1, max: 100 }),
        name: faker.person.fullName(),
        performance_fee: faker.number.int({ min: 10, max: 30 })
      },
      account: {
        account_number: faker.number.int({ min: 100000, max: 999999 }),
        broker_label: faker.company.name()
      },
      net_profit: faker.number.float({ min: -2000, max: 10000, fractionDigits: 2 }),
      gross_pnl: faker.number.float({ min: -1500, max: 12000, fractionDigits: 2 }),
      lot_type: faker.helpers.arrayElement(['multiplier', 'fixed']),
      lot_value: faker.number.float({ min: 0.1, max: 5.0, fractionDigits: 2 }),
      offer: { name: 'Standard Offer' },
      joined_at: faker.date.past().toISOString(),
      left_at: faker.date.recent().toISOString(),
      total_trades: faker.number.int({ min: 10, max: 500 }),
      total_fees: faker.number.float({ min: 50, max: 1000, fractionDigits: 2 })
    }));
    return HttpResponse.json({
      status: 'success',
      data: items.slice((page - 1) * perPage, page * perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: Math.ceil(totalItems / perPage) },
      summary: { total_memberships: totalItems, total_trades: items.reduce((acc, curr) => acc + curr.total_trades, 0) }
    });
  })

];