import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

export const ledgerHandlers = [
  // 1. CLIENT LEDGER
  http.get('/api/:role' + (urls?.clientLedger?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 120
    const totalPages = Math.ceil(totalItems / perPage)

    const allEntries = Array.from({ length: totalItems }).map((_, i) => ({
      payment_id: faker.number.int({ min: 10000000, max: 99999999 }),
      txid: faker.helpers.arrayElement([faker.string.alphanumeric(32), null]),
      external_payment_id: faker.helpers.arrayElement([faker.string.alphanumeric(16), null]),
      account_number: faker.number.int({ min: 100000, max: 999999 }),
      broker_label: faker.helpers.arrayElement(['Real', 'Demo']),
      client_name: faker.person.fullName(),
      method: faker.helpers.arrayElement(['crypto', 'wire', 'card', 'internal']),
      gateway: faker.helpers.arrayElement(['binance', 'stripe', 'manual', null]),
      type: faker.helpers.arrayElement(['deposit', 'withdrawal', 'trade_pnl', 'fee_paid']),
      amount: faker.number.float({ min: 10, max: 5000, fractionDigits: 2 }),
      broker_currency: 'USD',
      approval_status: faker.helpers.arrayElement(['approved', 'completed', 'paid', 'success', 'pending', 'processing', 'rejected', 'failed']),
      created_at: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allEntries, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages },
      summary: {
        total_deposit: 125000.50,
        total_withdrawal: 45000.25,
        total_pnl: 15200.75,
        total_fee_paid: 1250.00
      },
      filters: {
        clients: Array.from({ length: 5 }).map((_, i) => ({ id: i + 1, name: faker.person.fullName() })),
        accounts: Array.from({ length: 5 }).map((_, i) => ({ id: i + 1, account_id: i + 1, account_number: faker.number.int({ min: 100000, max: 999999 }), broker_label: 'Live' })),
        types: ['deposit', 'withdrawal', 'trade_pnl', 'fee_paid']
      }
    })
  }),

  // 2. INTERNAL TRANSFERS
  http.get('/api/:role' + (urls?.clientLedger?.internalTransfers || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 50
    const totalPages = Math.ceil(totalItems / perPage)

    const allTransfers = Array.from({ length: totalItems }).map((_, i) => ({
      ledger_id: faker.number.int({ min: 10000, max: 99999 }),
      description: faker.lorem.sentence(),
      client_name: faker.person.fullName(),
      client_id: faker.number.int({ min: 1000, max: 9999 }),
      account_number: faker.number.int({ min: 100000, max: 999999 }),
      broker_label: faker.helpers.arrayElement(['Live', 'Demo']),
      account_type: faker.helpers.arrayElement(['Standard', 'Pro']),
      type: faker.helpers.arrayElement(['deposit', 'withdrawal']),
      amount: faker.number.float({ min: 10, max: 2000, fractionDigits: 2 }),
      broker_currency: 'USD',
      status: faker.helpers.arrayElement(['completed', 'pending', 'rejected']),
      created_at: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allTransfers, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages },
      filters: {
        clients: Array.from({ length: 5 }).map((_, i) => ({ id: i + 1, name: faker.person.fullName() })),
        accounts: Array.from({ length: 5 }).map((_, i) => ({ id: i + 1, account_id: i + 1, account_number: faker.number.int({ min: 100000, max: 999999 }), broker_label: 'Live' })),
        types: ['deposit', 'withdrawal']
      }
    })
  }),

  // 3. FM LEDGER
  http.get('/api/:role' + (urls?.fmLedger?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 90
    const totalPages = Math.ceil(totalItems / perPage)

    const allEntries = Array.from({ length: totalItems }).map((_, i) => {
      const type = faker.helpers.arrayElement(['commission', 'withdrawal', 'bonus', 'adjustment'])
      const amount = type === 'withdrawal' 
        ? -faker.number.float({ min: 10, max: 500, fractionDigits: 2 })
        : faker.number.float({ min: 10, max: 500, fractionDigits: 2 })
      const balanceBefore = faker.number.float({ min: 1000, max: 5000, fractionDigits: 2 })
      const balanceAfter = balanceBefore + amount

      return {
        id: faker.number.int({ min: 1000, max: 9999 }),
        fm_name: faker.person.fullName(),
        account_number: faker.number.int({ min: 100000, max: 999999 }),
        account_id: faker.number.int({ min: 10, max: 999 }),
        account_role: faker.helpers.arrayElement(['master', 'follower']),
        type: type,
        amount: amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: faker.lorem.sentence(),
        created_at: faker.date.recent().toISOString()
      }
    })

    return HttpResponse.json({
      status: 'success',
      data: paginate(allEntries, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages },
      summary: {
        total_deposit: 85000.50,
        total_withdrawal: 25000.25,
        total_pnl: 35200.75,
        total_fm_fee: 5250.00
      }
    })
  }),

  // 4. IB LEDGER
  http.get('/api/:role' + (urls?.ibLedger?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 75
    const totalPages = Math.ceil(totalItems / perPage)

    const allEntries = Array.from({ length: totalItems }).map((_, i) => {
      const type = faker.helpers.arrayElement(['rebate', 'withdrawal', 'bonus', 'adjustment'])
      const amount = type === 'withdrawal' 
        ? -faker.number.float({ min: 10, max: 500, fractionDigits: 2 })
        : faker.number.float({ min: 10, max: 500, fractionDigits: 2 })
      const balanceBefore = faker.number.float({ min: 1000, max: 5000, fractionDigits: 2 })
      const balanceAfter = balanceBefore + amount

      return {
        id: faker.number.int({ min: 1000, max: 9999 }),
        ib_user_id: faker.number.int({ min: 1000, max: 9999 }),
        ib_name: faker.person.fullName(),
        ib_email: faker.internet.email(),
        type: type,
        amount: amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference_id: faker.string.alphanumeric(10),
        description: faker.lorem.sentence(),
        created_at: faker.date.recent().toISOString()
      }
    })

    return HttpResponse.json({
      status: 'success',
      data: paginate(allEntries, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages },
      summary: {
        total_records: totalItems,
        total_affiliate_commission: 45000.50,
        total_withdrawal: 15000.25,
        total_ib_fee: 1200.00,
        total_fee_paid: 300.00
      }
    })
  }),

  // 5. ADMIN / MY LEDGER
  http.get('/api/:role' + (urls?.adminLedger?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 60
    const totalPages = Math.ceil(totalItems / perPage)

    const allEntries = Array.from({ length: totalItems }).map((_, i) => {
      const type = faker.helpers.arrayElement(['revenue', 'withdrawal', 'expense', 'adjustment'])
      const amount = type === 'withdrawal' || type === 'expense'
        ? -faker.number.float({ min: 100, max: 5000, fractionDigits: 2 })
        : faker.number.float({ min: 100, max: 5000, fractionDigits: 2 })
      const balanceBefore = faker.number.float({ min: 10000, max: 50000, fractionDigits: 2 })
      const balanceAfter = balanceBefore + amount

      return {
        id: faker.number.int({ min: 1000, max: 9999 }),
        ledger_id: faker.number.int({ min: 1000000, max: 9999999 }),
        admin_name: faker.person.fullName(),
        type: type,
        amount: amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference_id: faker.string.alphanumeric(10),
        description: faker.lorem.sentence(),
        created_at: faker.date.recent().toISOString()
      }
    })

    return HttpResponse.json({
      status: 'success',
      data: paginate(allEntries, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages },
      summary: {
        total_records: totalItems,
        total_earnings: 245000.50,
        total_broker_fee: 15000.25,
        total_platform_earning: 215000.00
      }
    })
  }),

  // 6. SEARCH CLIENTS
  http.get('/api/:role' + (urls?.clientLedger?.allClients || '/__UNMATCHED__'), ({ request }) => {
    const totalItems = 25
    const allClients = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      name: faker.person.fullName(),
      email: faker.internet.email()
    }))

    return HttpResponse.json({
      status: 'success',
      data: allClients
    })
  }),

  // 7. SEARCH ACCOUNTS
  http.get('/api/:role' + (urls?.clientLedger?.allAccounts || '/__UNMATCHED__'), ({ request }) => {
    const totalItems = 30
    const allAccounts = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      account_id: i + 1,
      account_number: faker.number.int({ min: 100000, max: 999999 }),
      broker_label: faker.helpers.arrayElement(['Live', 'Demo', 'Pro']),
      client_name: faker.person.fullName()
    }))

    return HttpResponse.json({
      status: 'success',
      data: allAccounts
    })
  })
]
