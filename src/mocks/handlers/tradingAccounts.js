import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import urls from '../../api/urls'

export const tradingAccountsHandlers = [
  http.get('/api/:role' + (urls?.tradingAccounts?.list || '/__UNMATCHED__'), ({ request }) => {
    const totalItems = 3;
    const accounts = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      login: faker.number.int({ min: 1000000, max: 9999999 }),
      name: faker.person.fullName(),
      group: faker.helpers.arrayElement(['Live', 'Demo', 'CopyTrading']),
      leverage: '1:500',
      balance: faker.number.int({ min: 100, max: 10000 }),
      equity: faker.number.int({ min: 100, max: 10000 }),
      currency: 'USD',
      type: faker.helpers.arrayElement(['MT5', 'MT4']),
      trading_type: faker.helpers.arrayElement(['live', 'demo']),
      status: 'active'
    }))

    return HttpResponse.json({
      status: 'success',
      data: {
        accounts,
        summary: {
          total_accounts: 3,
          total_balance: accounts.reduce((acc, curr) => acc + curr.balance, 0),
          total_pnl: faker.number.int({ min: -500, max: 2000 })
        },
        pagination: {
          page: 1,
          per_page: 10,
          total_items: totalItems,
          total_pages: 1
        }
      }
    })
  })
]
