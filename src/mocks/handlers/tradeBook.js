import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

export const tradeBookHandlers = [
  // 1. MASTER TRADES
  http.get('/api/:role' + (urls?.tradeBook?.masterTrades || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 120
    const totalPages = Math.ceil(totalItems / perPage)

    const allTrades = Array.from({ length: totalItems }).map((_, i) => ({
      ticket: faker.number.int({ min: 10000000, max: 99999999 }),
      account_number: faker.number.int({ min: 100000, max: 999999 }),
      master_name: faker.person.fullName(),
      symbol: faker.helpers.arrayElement(['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD']),
      cmd: faker.helpers.arrayElement([0, 1]), // Buy / Sell
      volume: faker.number.float({ min: 0.1, max: 10.0, fractionDigits: 2 }),
      open_price: faker.number.float({ min: 1.0, max: 2000.0, fractionDigits: 5 }),
      close_price: faker.helpers.arrayElement([null, faker.number.float({ min: 1.0, max: 2000.0, fractionDigits: 5 })]),
      profit: faker.number.float({ min: -500, max: 2500, fractionDigits: 2 }),
      open_time: faker.date.recent().toISOString(),
      status: faker.helpers.arrayElement(['open', 'closed'])
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allTrades, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages }
    })
  }),

  // 2. POSITIONS
  http.get('/api/:role' + (urls?.tradeBook?.positions || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 80
    const totalPages = Math.ceil(totalItems / perPage)

    const allPositions = Array.from({ length: totalItems }).map((_, i) => ({
      position_ticket: faker.number.int({ min: 10000000, max: 99999999 }),
      account_number: faker.number.int({ min: 100000, max: 999999 }),
      broker_group: 'Real',
      client_name: faker.person.fullName(),
      symbol: faker.helpers.arrayElement(['EURUSD', 'GBPUSD', 'USOUSD', 'AAPL']),
      action: faker.helpers.arrayElement([0, 1]), // buy/sell
      action_name: faker.helpers.arrayElement(['BUY', 'SELL']),
      volume: faker.number.float({ min: 0.01, max: 5.0, fractionDigits: 2 }),
      price_open: faker.number.float({ min: 1.0, max: 500.0, fractionDigits: 4 }),
      price_current: faker.number.float({ min: 1.0, max: 500.0, fractionDigits: 4 }),
      sl: 0,
      tp: 0,
      swap: faker.number.float({ min: -5.0, max: 1.0, fractionDigits: 2 }),
      profit: faker.number.float({ min: -200, max: 500, fractionDigits: 2 }),
      time_create: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allPositions, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages }
    })
  }),

  // 3. DEALS
  http.get('/api/:role' + (urls?.tradeBook?.deals || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 200
    const totalPages = Math.ceil(totalItems / perPage)

    const allDeals = Array.from({ length: totalItems }).map((_, i) => ({
      deal_ticket: faker.number.int({ min: 10000000, max: 99999999 }),
      position_ticket: faker.number.int({ min: 10000000, max: 99999999 }),
      order_ticket: faker.number.int({ min: 10000000, max: 99999999 }),
      account_number: faker.number.int({ min: 100000, max: 999999 }),
      client_name: faker.person.fullName(),
      symbol: faker.helpers.arrayElement(['EURUSD', 'GBPUSD', 'XAUUSD']),
      action: faker.helpers.arrayElement([0, 1]), // buy/sell
      action_name: faker.helpers.arrayElement(['BUY', 'SELL']),
      entry: faker.helpers.arrayElement([0, 1]), // in/out
      entry_name: faker.helpers.arrayElement(['IN', 'OUT']),
      volume: faker.number.float({ min: 0.01, max: 5.0, fractionDigits: 2 }),
      price: faker.number.float({ min: 1.0, max: 2000.0, fractionDigits: 5 }),
      price_position: faker.number.float({ min: 1.0, max: 2000.0, fractionDigits: 5 }),
      commission: faker.number.float({ min: -10.0, max: 0, fractionDigits: 2 }),
      profit: faker.number.float({ min: -1000, max: 2000, fractionDigits: 2 }),
      time: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allDeals, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages }
    })
  }),

  // 4. ORDERS
  http.get('/api/:role' + (urls?.tradeBook?.orders || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 150
    const totalPages = Math.ceil(totalItems / perPage)

    const allOrders = Array.from({ length: totalItems }).map((_, i) => ({
      order_ticket: faker.number.int({ min: 10000000, max: 99999999 }),
      position_ticket: faker.number.int({ min: 10000000, max: 99999999 }),
      account_number: faker.number.int({ min: 100000, max: 999999 }),
      symbol: faker.helpers.arrayElement(['EURUSD', 'GBPUSD', 'XAUUSD']),
      type: faker.helpers.arrayElement([0, 1]), // buy/sell
      type_name: faker.helpers.arrayElement(['BUY', 'SELL']),
      state: faker.helpers.arrayElement([4, 5]), // filled/rejected
      state_name: faker.helpers.arrayElement(['FILLED', 'REJECTED']),
      volume_initial: faker.number.float({ min: 0.01, max: 5.0, fractionDigits: 2 }),
      volume_current: faker.number.float({ min: 0.0, max: 5.0, fractionDigits: 2 }),
      price_order: faker.number.float({ min: 1.0, max: 2000.0, fractionDigits: 5 }),
      price_current: faker.number.float({ min: 1.0, max: 2000.0, fractionDigits: 5 }),
      time_setup: faker.date.recent().toISOString(),
      time_done: faker.date.recent().toISOString(),
      reject_reason: faker.helpers.arrayElement(['No money', null, null])
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allOrders, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages }
    })
  }),

  // 5. FOLLOWER DETAILS
  http.get('/api/trade-book/followers/:id', ({ request, params }) => {
    const url = new URL(request.url)
    return HttpResponse.json({
      status: 'success',
      data: {
        id: params.id,
        name: faker.person.fullName(),
        user_name: faker.person.fullName(),
        account_number: faker.number.int({ min: 100000, max: 999999 }).toString(),
        broker_currency: 'USD',
        is_active: true,
        status: 'active',
        copy_ratio: faker.number.float({ min: 0.1, max: 2.0, fractionDigits: 1 }),
        broker_group: 'Real'
      }
    })
  })
]
