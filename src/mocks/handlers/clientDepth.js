import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

export const clientDepthHandlers = [
  // 1. Client Overview
  http.get('/api/overview/:userId', ({ params }) => {
    return HttpResponse.json({
      status: 'success',
      data: {
        total_deposit: faker.finance.amount({ min: 1000, max: 100000, dec: 2 }),
        total_withdrawal: faker.finance.amount({ min: 100, max: 50000, dec: 2 }),
        net_deposit: faker.finance.amount({ min: 500, max: 50000, dec: 2 }),
        total_pnl: faker.finance.amount({ min: -5000, max: 20000, dec: 2 }),
        wallet_balance: faker.finance.amount({ min: 1000, max: 50000, dec: 2 }),
        trading_balance: faker.finance.amount({ min: 1000, max: 50000, dec: 2 }),
        margin_used: faker.finance.amount({ min: 100, max: 5000, dec: 2 }),
        free_margin: faker.finance.amount({ min: 1000, max: 40000, dec: 2 }),
        active_accounts: faker.number.int({ min: 1, max: 5 }),
        open_positions: faker.number.int({ min: 0, max: 10 })
      }
    })
  }),

  // 2. User Charts
  http.get('/api/user-charts', ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')
    const months = parseInt(url.searchParams.get('months')) || 6

    const generateChartData = (numMonths) => {
      return Array.from({ length: numMonths }).map((_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - (numMonths - i - 1))
        return {
          label: d.toISOString().split('T')[0],
          deposit: parseFloat(faker.finance.amount({ min: 100, max: 10000, dec: 2 })),
          withdrawal: parseFloat(faker.finance.amount({ min: 0, max: 5000, dec: 2 })),
          equity: parseFloat(faker.finance.amount({ min: 1000, max: 50000, dec: 2 })),
          pnl: parseFloat(faker.finance.amount({ min: -1000, max: 5000, dec: 2 }))
        }
      })
    }

    const charts = generateChartData(months)

    return HttpResponse.json({
      status: 'success',
      data: {
        deposit_withdrawal_chart: charts,
        equity_chart: charts,
        summary: {
          period_deposit: faker.finance.amount({ min: 1000, max: 50000, dec: 2 }),
          period_withdrawal: faker.finance.amount({ min: 100, max: 20000, dec: 2 }),
          period_pnl: faker.finance.amount({ min: -5000, max: 15000, dec: 2 })
        }
      }
    })
  }),

  // 3. Account Details
  http.get('/api/account-details', ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')

    return HttpResponse.json({
      status: 'success',
      data: {
        trading_accounts: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }).map(() => ({
          account_number: faker.number.int({ min: 100000, max: 999999 }),
          balance: faker.finance.amount({ min: 100, max: 50000, dec: 2 }),
          equity: faker.finance.amount({ min: 100, max: 50000, dec: 2 }),
          margin_free: faker.finance.amount({ min: 100, max: 40000, dec: 2 }),
          type: faker.helpers.arrayElement(['Standard', 'Pro', 'VIP']),
          broker: faker.company.name(),
          leverage: faker.helpers.arrayElement(['1:100', '1:200', '1:500']),
          currency: 'USD',
          status: faker.helpers.arrayElement(['Active', 'Inactive']),
          created_at: faker.date.past().toISOString()
        }))
      }
    })
  })
]
