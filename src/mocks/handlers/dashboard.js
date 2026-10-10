import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

export const dashboardHandlers = [
  // 1. Dashboard Overview / Analytics Data
  http.get('/api/:role' + (urls?.dashboard?.list || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        overview: {
          platform_revenue: faker.number.int({ min: 1000000, max: 5000000 }),
          platform_revenue_change: faker.number.float({ min: 5, max: 20, fractionDigits: 1 }),
          wallet_transaction_volume: faker.number.int({ min: 20000000, max: 60000000 }),
          wallet_volume_change: faker.number.float({ min: -5, max: 15, fractionDigits: 1 }),
          active_trading_accounts: faker.number.int({ min: 5000, max: 15000 }),
          total_clients: faker.number.int({ min: 10000, max: 20000 }),
          total_fund_managers: faker.number.int({ min: 100, max: 300 }),
          active_fund_managers: faker.number.int({ min: 50, max: 200 }),
          total_ib_networks: faker.number.int({ min: 200, max: 500 }),
          total_ibs: faker.number.int({ min: 1000, max: 3000 }),
          pending_fm_requests: faker.number.int({ min: 0, max: 20 })
        },
        fund_manager_insights: {
          top_fm: {
            fm_id: faker.number.int({ min: 10, max: 999 }),
            fm_name: faker.company.name() + ' Management',
            followers: faker.number.int({ min: 500, max: 5000 }),
            aum: faker.number.int({ min: 1000000, max: 10000000 }),
            generated_revenue: faker.number.int({ min: 50000, max: 500000 }),
            performance_fee: faker.number.int({ min: 10, max: 30 })
          },
          pending_withdrawals: faker.number.int({ min: 1, max: 15 }),
          recent_fm_requests: Array.from({ length: 3 }).map((_, i) => ({
            request_id: i + 1,
            settlement_type: faker.helpers.arrayElement(['weekly', 'monthly']),
            status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
            user_email: faker.internet.email(),
            amount: faker.number.int({ min: 1000, max: 10000 }),
            created_at: faker.date.recent().toISOString()
          }))
        },
        ib_network_insights: {
          largest_network: {
            ib_name: faker.company.name() + ' Traders',
            downline_count: faker.number.int({ min: 200, max: 1000 }),
            commission: faker.number.int({ min: 50000, max: 200000 })
          },
          deepest_level: faker.number.int({ min: 3, max: 8 }),
          top_networks: Array.from({ length: 3 }).map(() => ({
            ib_name: faker.company.name() + ' Network',
            downline_count: faker.number.int({ min: 50, max: 500 }),
            commission: faker.number.int({ min: 10000, max: 100000 })
          }))
        },
        wallet_summary: {
          client_wallet_balance: faker.number.int({ min: 1000000, max: 3000000 }),
          fm_wallet_balance: faker.number.int({ min: 300000, max: 1000000 }),
          ib_wallet_balance: faker.number.int({ min: 100000, max: 500000 }),
          net_flow: faker.number.int({ min: 50000, max: 250000 }),
          total_deposits: faker.number.int({ min: 200000, max: 800000 }),
          total_withdrawals: faker.number.int({ min: 100000, max: 600000 })
        },
        wallet_breakdown: {
          deposits: 55,
          withdrawals: 25,
          fm_payouts: 15,
          ib_commissions: 5
        },
        settlement_summary: {
          completed: faker.number.int({ min: 20, max: 100 }),
          pending: faker.number.int({ min: 5, max: 25 }),
          failed: faker.number.int({ min: 0, max: 5 }),
          total_fees: faker.number.int({ min: 5000, max: 30000 })
        },
        recent_activity: Array.from({ length: 5 }).map((_, i) => ({
          id: i + 1,
          type: faker.helpers.arrayElement(['deposit', 'withdrawal', 'transfer', 'commission']),
          description: faker.finance.transactionDescription(),
          amount: faker.number.int({ min: 100, max: 10000 }),
          created_at: faker.date.recent().toISOString()
        }))
      }
    })
  }),

  // 2. Live User Accounts Count
  http.get('/api/:role' + (urls?.dashboard?.accounts || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        admins: faker.number.int({ min: 3, max: 10 }),
        client: faker.number.int({ min: 5000, max: 15000 }),
        fm: faker.number.int({ min: 50, max: 200 }),
        ib: faker.number.int({ min: 1000, max: 3000 })
      }
    })
  }),

  // 3. Revenue Analytics Chart Data
  http.get('/api/:role' + (urls?.dashboard?.revenueAnalytics || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const range = url.searchParams.get('range') || 'weekly'
    
    // Generate some chart data based on the range requested
    const length = range === 'daily' ? 7 : range === 'weekly' ? 12 : range === 'monthly' ? 30 : 12
    const chart = Array.from({ length }).map((_, i) => ({
      label: new Date(Date.now() - (length - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      fm_share: faker.number.int({ min: 500, max: 2000 }),
      ib_pool: faker.number.int({ min: 200, max: 1000 }),
      broker_net: faker.number.int({ min: 2000, max: 8000 })
    }))

    return HttpResponse.json({
      status: 'success',
      data: {
        chart,
        summary: {
          total_fm_share: chart.reduce((acc, curr) => acc + curr.fm_share, 0),
          fm_share_change: faker.number.float({ min: -5, max: 25, fractionDigits: 1 }),
          total_ib_pool: chart.reduce((acc, curr) => acc + curr.ib_pool, 0),
          ib_pool_change: faker.number.float({ min: -5, max: 25, fractionDigits: 1 }),
          total_broker_net: chart.reduce((acc, curr) => acc + curr.broker_net, 0),
          broker_net_change: faker.number.float({ min: -5, max: 25, fractionDigits: 1 })
        }
      }
    })
  }),

  // 4. Live Users List (Drawer)
  http.get('/api/:role' + (urls?.dashboard?.liveUsers || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const roleParam = url.searchParams.get('role') || ''
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    
    // Calculate how many users to generate based on role
    const totalUsers = roleParam === 'admin' ? 12 
                     : roleParam === 'fm' ? 45 
                     : roleParam === 'ib' ? 82 
                     : roleParam === 'client' ? 340 
                     : 479; // 'All Users'

    const totalPages = Math.ceil(totalUsers / perPage)
    
    // Create users for this page
    const usersCountToGenerate = page === totalPages ? totalUsers % perPage || perPage : perPage;
    
    const users = Array.from({ length: usersCountToGenerate }).map((_, i) => {
      // Pick a random role if 'All Users' is requested
      const generatedRole = roleParam ? roleParam : faker.helpers.arrayElement(['client', 'client', 'client', 'ib', 'fm', 'admin'])
      return {
        user_id: faker.number.int({ min: 10000, max: 99999 }),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: generatedRole,
        ip_address: faker.internet.ipv4(),
        active_sessions: faker.number.int({ min: 1, max: 3 }),
        last_seen: faker.date.recent().toISOString()
      }
    })

    return HttpResponse.json({
      status: 'success',
      data: {
        users,
        page,
        per_page: perPage,
        pages: totalPages,
        total: totalUsers
      }
    })
  })
]
