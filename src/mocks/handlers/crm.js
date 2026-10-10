import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

// Helper for pagination
function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

export const crmHandlers = [
  // 1. CLIENTS LIST
  http.get('/api/:role' + (urls?.clientList?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 125
    const totalPages = Math.ceil(totalItems / perPage)

    const allClients = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone_number: faker.phone.number(),
      date_of_birth: faker.date.birthdate().toISOString(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.countryCode(),
      zip_code: faker.location.zipCode(),
      ib_name: faker.company.name() + ' IB',
      ib_email: faker.internet.email(),
      ib_id: faker.number.int({ min: 1000, max: 9999 }),
      ib_referral_code: faker.string.alphanumeric(8).toUpperCase(),
      staff_assigned: { name: faker.person.fullName() },
      referral_link_code: faker.string.alphanumeric(8).toUpperCase(),
      referral_link_name: 'Main Campaign',
      kyc_status: faker.helpers.arrayElement(['approved', 'pending', 'rejected']),
      verification_channel: faker.helpers.arrayElement(['sumsub', 'manual']),
      kyc_verified_at: faker.date.recent().toISOString(),
      docs_uploaded: faker.helpers.arrayElement(['True', 'False']),
      doc_approved: faker.helpers.arrayElement(['Approved', 'Pending']),
      kyc_reject_reason: '',
      sumsub_applicant_id: faker.string.uuid(),
      accounts: [
        { id: faker.number.int(), account_number: faker.number.int({ min: 100000, max: 999999 }), balance: faker.finance.amount() },
        { id: faker.number.int(), account_number: faker.number.int({ min: 100000, max: 999999 }), balance: faker.finance.amount() }
      ],
      tags: [
        { id: faker.string.uuid(), name: faker.helpers.arrayElement(['VIP', 'Whale', 'Retail', 'Active']), color: faker.color.rgb() },
        { id: faker.string.uuid(), name: faker.helpers.arrayElement(['Margin Call', 'High Risk', 'Low Risk']), color: faker.color.rgb() }
      ],
      created_at: faker.date.past().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      tracking_id: faker.string.alphanumeric(10).toUpperCase(),
      is_active: faker.datatype.boolean()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allClients, page, perPage),
      pagination: {
        page,
        per_page: perPage,
        total_items: totalItems,
        total_pages: totalPages
      }
    })
  }),

  // 2. TRADING ACCOUNTS
  http.get('/api/:role' + (urls?.tradingAccounts?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 85
    const totalPages = Math.ceil(totalItems / perPage)

    const allAccounts = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      account_number: faker.number.int({ min: 100000, max: 999999 }),
      client_name: faker.person.fullName(),
      user: {
        id: faker.number.int(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
      },
      entity_type: faker.helpers.arrayElement(['individual', 'corporate']),
      trading_type: faker.helpers.arrayElement(['real', 'demo', 'copy_trading']),
      account_type: faker.helpers.arrayElement(['standard', 'pro', 'vip']),
      account_role: faker.helpers.arrayElement(['master', 'slave', 'standard']),
      account_category: faker.helpers.arrayElement(['a_book', 'b_book']),
      broker_label: faker.company.name(),
      server: faker.helpers.arrayElement(['Live-1', 'Live-2', 'Demo-1']),
      broker_currency: 'USD',
      broker_leverage: faker.helpers.arrayElement([100, 200, 400, 500]),
      balance: faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }),
      equity: faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }),
      credit: faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }),
      free_margin: faker.number.float({ min: 100, max: 40000, fractionDigits: 2 }),
      is_active: faker.datatype.boolean(),
      created_at: faker.date.past().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allAccounts, page, perPage),
      pagination: {
        page,
        per_page: perPage,
        total_items: totalItems,
        total_pages: totalPages
      },
      summary: {
        total_accounts: totalItems
      }
    })
  }),

  // 3. IB NETWORK TREE
  http.get('/api/:role' + (urls?.ibTree?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 42
    const totalPages = Math.ceil(totalItems / perPage)

    const allIbs = Array.from({ length: totalItems }).map((_, i) => ({
      ib_id: i + 1,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      referral_code: faker.string.alphanumeric(8).toUpperCase(),
      staff_assigned: {
        id: faker.number.int({ min: 1, max: 10 }),
        name: faker.person.fullName()
      },
      split: faker.number.int({ min: 10, max: 50 }),
      level: 0,
      children: [
        {
          ib_id: (i + 1) * 100 + 1,
          name: faker.person.fullName(),
          email: faker.internet.email(),
          referral_code: faker.string.alphanumeric(8).toUpperCase(),
          parent_ib_id: i + 1,
          parent_name: 'Parent IB',
          parent_email: 'parent@ib.com',
          staff_assigned: { id: 1, name: faker.person.fullName() },
          split: faker.number.int({ min: 5, max: 20 }),
          level: 1,
          children: []
        }
      ]
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allIbs, page, perPage),
      pagination: {
        page,
        per_page: perPage,
        total_items: totalItems,
        total_pages: totalPages
      }
    })
  }),

  // 3.5 IB CLIENTS
  http.get('/api/:role' + (urls?.ibTree?.clients || '/__UNMATCHED__') + '/:id', ({ request, params }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 35
    const totalPages = Math.ceil(totalItems / perPage)

    const ibId = params.id

    const allClients = Array.from({ length: totalItems }).map((_, i) => ({
      user_id: i + 1,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      kyc_status: faker.helpers.arrayElement(['approved', 'pending_verification', 'rejected']),
      owner_ib: {
        name: 'Parent IB ' + ibId,
        email: `parent${ibId}@ib.com`,
        ib_id: ibId,
        referral_code: faker.string.alphanumeric(8).toUpperCase(),
        level: faker.number.int({ min: 1, max: 3 })
      },
      referral_link: {
        code: faker.string.alphanumeric(8).toUpperCase(),
        name: 'Main Campaign'
      },
      wallet_balance: faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }),
      total_pnl: faker.number.float({ min: -5000, max: 15000, fractionDigits: 2 }),
      trading_accounts: faker.number.int({ min: 1, max: 5 }),
      active_followings: faker.number.int({ min: 0, max: 3 }),
      joined_at: faker.date.past().toISOString(),
      is_active: faker.datatype.boolean()
    }))

    return HttpResponse.json({
      status: 'success',
      ib: {
        id: ibId,
        name: faker.company.name() + ' Master IB',
        email: faker.internet.email(),
        referral_code: faker.string.alphanumeric(8).toUpperCase(),
        level: faker.number.int({ min: 1, max: 5 }),
        total_clients: totalItems,
        downline_ibs: faker.number.int({ min: 2, max: 20 })
      },
      data: paginate(allClients, page, perPage),
      pagination: {
        page,
        per_page: perPage,
        total_items: totalItems,
        total_pages: totalPages
      }
    })
  }),

  // 4. LEAD STAGES
  http.get('/api/:role' + (urls?.lead?.stages || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      data: [
        { id: 1, name: 'New', color: '#3b82f6', order: 1, lead_count: faker.number.int({ min: 10, max: 50 }) },
        { id: 2, name: 'Contacted', color: '#f59e0b', order: 2, lead_count: faker.number.int({ min: 10, max: 40 }) },
        { id: 3, name: 'Qualified', color: '#8b5cf6', order: 3, lead_count: faker.number.int({ min: 5, max: 20 }) },
        { id: 4, name: 'Converted', color: '#10b981', order: 4, lead_count: faker.number.int({ min: 20, max: 100 }) },
        { id: 5, name: 'Lost', color: '#ef4444', order: 5, lead_count: faker.number.int({ min: 5, max: 30 }) }
      ]
    })
  }),

  // 5. LEADS DASHBOARD
  http.get('/api/:role' + (urls?.lead?.dashboard || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        total_leads: faker.number.int({ min: 500, max: 1000 }),
        converted_leads: faker.number.int({ min: 100, max: 300 }),
        win_rate: faker.number.float({ min: 15, max: 45, fractionDigits: 1 }),
        pipeline_value: faker.number.int({ min: 50000, max: 500000 }),
        new_leads_today: faker.number.int({ min: 5, max: 20 }),
        conversion_change: faker.number.float({ min: -5, max: 15, fractionDigits: 1 })
      }
    })
  }),

  // 6. LEADS LIST
  http.get('/api/:role' + (urls?.lead?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 150
    const totalPages = Math.ceil(totalItems / perPage)

    const allLeads = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      country: faker.location.countryCode(),
      source: faker.helpers.arrayElement(['Website', 'Referral', 'Facebook', 'Google', 'Cold Call']),
      priority: faker.helpers.arrayElement(['high', 'medium', 'low']),
      stage: {
        id: faker.helpers.arrayElement([1, 2, 3, 4, 5]),
        name: faker.helpers.arrayElement(['New', 'Contacted', 'Qualified', 'Converted', 'Lost']),
        color: '#3b82f6'
      },
      assigned_to: {
        id: faker.number.int(),
        name: faker.person.fullName()
      },
      created_at: faker.date.recent({ days: 30 }).toISOString(),
      last_contacted_at: faker.date.recent({ days: 5 }).toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allLeads, page, perPage),
      pagination: {
        page,
        per_page: perPage,
        total_items: totalItems,
        total_pages: totalPages
      }
    })
  }),

  // 7. ACCOUNT TRADES
  http.get('/api/:role' + (urls?.tradingAccounts?.accountTrades || '/__UNMATCHED__') + '/:id', ({ request, params }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = faker.number.int({ min: 10, max: 150 })
    const totalPages = Math.ceil(totalItems / perPage)

    const allTrades = Array.from({ length: totalItems }).map((_, i) => ({
      trade_id: faker.number.int({ min: 10000000, max: 99999999 }),
      login: params.id,
      symbol: faker.helpers.arrayElement(['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD']),
      type: faker.helpers.arrayElement(['BUY', 'SELL']),
      lot: faker.number.float({ min: 0.01, max: 5.0, fractionDigits: 2 }),
      entry_price: faker.number.float({ min: 1.0, max: 2000.0, fractionDigits: 5 }),
      exit_price: faker.helpers.arrayElement([null, faker.number.float({ min: 1.0, max: 2000.0, fractionDigits: 5 })]),
      status: faker.helpers.arrayElement(['OPEN', 'CLOSED']),
      profit: faker.number.float({ min: -500, max: 1000, fractionDigits: 2 }),
      created_at: faker.date.recent().toISOString(),
      closed_at: faker.helpers.arrayElement([null, faker.date.recent().toISOString()]),
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allTrades, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages },
      summary: {
        total_lots: allTrades.reduce((acc, t) => acc + t.lot, 0),
        total_pnl: allTrades.reduce((acc, t) => acc + t.profit, 0)
      }
    })
  }),

  // 8. ACCOUNT TRANSACTIONS
  http.get('/api/:role' + (urls?.tradingAccounts?.transactions || '/__UNMATCHED__') + '/:id', ({ request, params }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = faker.number.int({ min: 5, max: 50 })
    const totalPages = Math.ceil(totalItems / perPage)

    const allTransactions = Array.from({ length: totalItems }).map((_, i) => ({
      transaction_id: faker.string.alphanumeric(8).toUpperCase(),
      description: faker.finance.transactionDescription(),
      type: faker.helpers.arrayElement(['deposit', 'withdrawal', 'transfer', 'adjustment']),
      direction: faker.helpers.arrayElement(['credit', 'debit']),
      amount: faker.number.float({ min: 10, max: 5000, fractionDigits: 2 }),
      reference_id: faker.string.alphanumeric(10).toUpperCase(),
      created_at: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allTransactions, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages }
    })
  })
]
