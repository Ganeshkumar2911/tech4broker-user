import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import urls from '../../api/urls'

export const tradingAccountsHandlers = [
  http.get(/\/api\/.*\/accounts$/, ({ request }) => {
    console.log("Mock GET /accounts hit!", request.url);
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
  }),

  // Account Groups Mock
  http.get(/\/api\/.*\/account-groups$/, () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        demo: [
          {
            account_category: "standard",
            description: "Standard account for everyday trading",
            currencies: [
              { group_config_id: 1, currency: "USD", leverage: 500 },
              { group_config_id: 2, currency: "EUR", leverage: 500 }
            ]
          },
          {
            account_category: "pro",
            description: "Professional account with tighter spreads",
            currencies: [
              { group_config_id: 3, currency: "USD", leverage: 200 }
            ]
          }
        ],
        live: [
          {
            account_category: "vip",
            description: "VIP account for high volume traders",
            currencies: [
              { group_config_id: 4, currency: "USD", leverage: 100 }
            ]
          },
          {
            account_category: "standard",
            description: "Standard account for everyday trading",
            currencies: [
              { group_config_id: 5, currency: "USD", leverage: 400 },
              { group_config_id: 6, currency: "GBP", leverage: 400 }
            ]
          }
        ]
      }
    });
  }),

  // Create Account Mock
  http.post(/\/api\/.*\/accounts\/create$/, () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Account created successfully'
    });
  })
]
