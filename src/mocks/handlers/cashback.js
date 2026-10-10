import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

export const cashbackHandlers = [
  // ENROLLMENTS
  http.get('/api/:role' + (urls?.cashback?.enrollments || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 45
    const totalPages = Math.ceil(totalItems / perPage)

    const allEntries = Array.from({ length: totalItems }).map((_, i) => {
      const status = faker.helpers.arrayElement(['active', 'ended'])
      return {
        id: faker.number.int({ min: 1000, max: 9999 }),
        user_name: faker.person.fullName(),
        user_email: faker.internet.email(),
        account_number: faker.number.int({ min: 100000, max: 999999 }),
        plan: {
          name: faker.helpers.arrayElement(['Gold Rebate', 'Silver Cashback', 'Diamond Loyalty'])
        },
        status: status,
        ended_by: status === 'ended' ? faker.helpers.arrayElement(['admin', 'client']) : null,
        pending_plan_id: faker.helpers.arrayElement([faker.number.int({ min: 1, max: 10 }), null]),
        pending_plan: {
          name: 'Platinum Tier'
        },
        pending_effective_at: faker.date.future().toISOString(),
        enrolled_at: faker.date.past().toISOString()
      }
    })

    return HttpResponse.json({
      status: 'success',
      data: {
        items: paginate(allEntries, page, perPage),
        total: totalItems,
        limit: perPage,
        offset: (page - 1) * perPage
      }
    })
  }),

  // TRANSACTIONS
  http.get('/api/:role' + (urls?.cashback?.transactions || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 150
    const totalPages = Math.ceil(totalItems / perPage)

    const allEntries = Array.from({ length: totalItems }).map((_, i) => {
      const status = faker.helpers.arrayElement(['PROCESSED', 'SKIPPED', 'PENDING'])
      const skipReason = status === 'SKIPPED' ? faker.helpers.arrayElement(['duration_too_short', 'ineligible_symbol', 'not_qualified']) : null
      const isDurationSkip = skipReason === 'duration_too_short'
      const amount = status === 'PROCESSED' ? faker.number.float({ min: 0.1, max: 50, fractionDigits: 2 }) : 0
      
      return {
        id: faker.number.int({ min: 10000, max: 99999 }),
        user_id: faker.number.int({ min: 100, max: 999 }),
        user: {
          name: faker.person.fullName(),
          email: faker.internet.email()
        },
        trading_account_id: faker.number.int({ min: 100000, max: 999999 }),
        trading_account: {
          account_number: faker.number.int({ min: 100000, max: 999999 }),
          trading_type: faker.helpers.arrayElement(['live', 'demo']),
          broker_currency: 'USD'
        },
        symbol: faker.helpers.arrayElement(['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD']),
        lots: faker.number.float({ min: 0.01, max: 5, fractionDigits: 2 }),
        mt5_deal_id: faker.number.int({ min: 1000000, max: 9999999 }),
        profit: faker.number.float({ min: -500, max: 500, fractionDigits: 2 }),
        transaction_type: faker.helpers.arrayElement(['rebate', 'bonus']),
        plan_code: faker.helpers.arrayElement(['GOLD', 'SILV', 'PLAT']),
        rate_per_lot: faker.number.float({ min: 2, max: 10, fractionDigits: 2 }),
        amount: amount,
        balance_after: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
        status: status,
        skip_reason: skipReason,
        metadata: {
          duration_seconds: isDurationSkip ? faker.number.int({ min: 10, max: 110 }) : faker.number.int({ min: 150, max: 3600 }),
          min_duration_seconds_applied: 120
        },
        created_at: faker.date.recent().toISOString()
      }
    })

    return HttpResponse.json({
      status: 'success',
      data: {
        items: paginate(allEntries, page, perPage),
        total: totalItems,
        limit: perPage,
        offset: (page - 1) * perPage
      }
    })
  }),

  // REDEMPTIONS
  http.get('/api/:role' + (urls?.cashback?.redemptions || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 60
    const totalPages = Math.ceil(totalItems / perPage)

    const allEntries = Array.from({ length: totalItems }).map((_, i) => {
      const status = faker.helpers.arrayElement(['completed', 'failed', 'pending'])
      return {
        id: faker.number.int({ min: 1000, max: 9999 }),
        user_id: faker.number.int({ min: 100, max: 999 }),
        trading_account_id: faker.number.int({ min: 100000, max: 999999 }),
        amount: faker.number.float({ min: 10, max: 500, fractionDigits: 2 }),
        currency: 'USD',
        ledger_transaction_id: status === 'completed' ? faker.number.int({ min: 1000000, max: 9999999 }) : null,
        status: status,
        failure_reason: status === 'failed' ? faker.lorem.sentence() : null,
        completed_at: status === 'completed' ? faker.date.recent().toISOString() : null,
        created_at: faker.date.recent().toISOString()
      }
    })

    return HttpResponse.json({
      status: 'success',
      data: {
        items: paginate(allEntries, page, perPage),
        total: totalItems,
        limit: perPage,
        offset: (page - 1) * perPage
      }
    })
  })
]
