import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

export const ibCommissionHandlers = [
  // 1. APPROVAL PERIODS
  http.get('/api/:role' + (urls?.ibCommission?.approvalPeriods || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      data: Array.from({ length: 5 }).map((_, i) => ({
        key: `period_${i + 1}`,
        label: `Period ${i + 1} (${faker.date.month()} ${faker.date.recent().getFullYear()})`,
        start: faker.date.past().toISOString(),
        end: faker.date.recent().toISOString()
      }))
    })
  }),

  // 2. APPROVALS SUMMARY
  http.get('/api/:role' + (urls?.ibCommission?.approvalsSummary || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const frequency = url.searchParams.get('frequency')
    const periodKey = url.searchParams.get('period_key')

    if (!periodKey) {
      return HttpResponse.json({
        status: 'success',
        data: { empty: true, empty_message: "Please select a period" }
      })
    }

    const items = Array.from({ length: 15 }).map((_, i) => ({
      ib_id: faker.number.int({ min: 1000, max: 9999 }),
      ib_name: faker.person.fullName(),
      entry_count: faker.number.int({ min: 5, max: 50 }),
      total_commission: faker.finance.amount({ min: 100, max: 5000, dec: 2 }),
      by_currency: { USD: faker.finance.amount({ min: 100, max: 5000, dec: 2 }) },
      wallet_target: faker.helpers.arrayElement(['main', 'demo']),
      payout_mode: faker.helpers.arrayElement(['auto_settlement', 'manual'])
    }))

    return HttpResponse.json({
      status: 'success',
      data: {
        grand_total: items.reduce((sum, item) => sum + parseFloat(item.total_commission), 0).toFixed(2),
        ib_count: items.length,
        entry_count: items.reduce((sum, item) => sum + item.entry_count, 0),
        start: faker.date.past().toISOString(),
        end: faker.date.recent().toISOString(),
        empty: false,
        items
      }
    })
  }),

  // 3. APPROVAL ENTRIES (Line items)
  http.get('/api/:role' + (urls?.ibCommission?.approvalEntries || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const ibId = url.searchParams.get('ib_id')
    
    const totalItems = 30
    const allEntries = Array.from({ length: totalItems }).map((_, i) => ({
      id: faker.string.uuid(),
      ib_id: ibId,
      ib_name: faker.person.fullName(),
      ticket: faker.number.int({ min: 100000, max: 999999 }),
      login: faker.number.int({ min: 1000, max: 9999 }),
      symbol: faker.helpers.arrayElement(['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD']),
      volume: faker.finance.amount({ min: 0.1, max: 10, dec: 2 }),
      commission: faker.finance.amount({ min: 1, max: 50, dec: 2 }),
      status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
      created_at: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allEntries, page, perPage),
      pagination: { 
        page, 
        per_page: perPage, 
        total_items: totalItems, 
        total_pages: Math.ceil(totalItems/perPage) 
      }
    })
  }),

  // 4. APPROVE IB PERIOD
  http.post('/api/:role' + (urls?.ibCommission?.approveIbPeriod || '/__UNMATCHED__'), async () => {
    return HttpResponse.json({
      status: 'success',
      message: 'IB Period approved successfully and commissions dispatched.'
    })
  }),

  // 5. COMMISSIONS LIST
  http.get('/api/:role' + (urls?.ibCommission?.commissions || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    
    const totalItems = 35
    const allCommissions = Array.from({ length: totalItems }).map((_, i) => ({
      id: faker.string.uuid(),
      ib_name: faker.person.fullName(),
      ib_id: faker.number.int({ min: 1000, max: 9999 }),
      rate_assigned: faker.finance.amount({ min: 1, max: 10, dec: 2 }),
      commission_per_lot: faker.finance.amount({ min: 1, max: 10, dec: 2 }),
      commission_per_millions_volume: faker.finance.amount({ min: 10, max: 50, dec: 2 }),
      commission_per_spread: faker.finance.amount({ min: 0.1, max: 5, dec: 2 }),
      commission_per_pips: faker.finance.amount({ min: 0.1, max: 5, dec: 2 }),
      total_commission: faker.finance.amount({ min: 10, max: 100, dec: 2 }),
      created_at: faker.date.recent().toISOString(),
      wallet_target: faker.helpers.arrayElement(['main', 'demo']),
      group_name: `Group ${faker.helpers.arrayElement(['A', 'B', 'C'])}`,
      group_id: faker.number.int({ min: 100, max: 999 }),
      symbol_group_id: faker.number.int({ min: 1, max: 10 }),
      pip_value: faker.finance.amount({ min: 0.1, max: 1, dec: 4 }),
      quote_currency: 'USD',
      fx_mode: 'direct',
      fx_rate: faker.finance.amount({ min: 1, max: 1.5, dec: 4 }),
      settlement_batch_id: faker.datatype.boolean() ? faker.number.int({ min: 1000, max: 9999 }) : null,
      trade: {
        client_name: faker.person.fullName(),
        login: faker.number.int({ min: 1000, max: 9999 }),
        symbol: faker.helpers.arrayElement(['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD']),
        mt5_group: `demo\\group\\USD`,
        position_id: faker.number.int({ min: 1000000, max: 9999999 }),
        trade_status: faker.helpers.arrayElement(['open', 'closed']),
        open_deal: faker.number.int({ min: 1000000, max: 9999999 }),
        close_deal: faker.number.int({ min: 1000000, max: 9999999 }),
        price_open: faker.finance.amount({ min: 1, max: 2, dec: 5 }),
        price_close: faker.finance.amount({ min: 1, max: 2, dec: 5 }),
        open_market_ask: faker.finance.amount({ min: 1, max: 2, dec: 5 }),
        open_market_bid: faker.finance.amount({ min: 1, max: 2, dec: 5 }),
        close_market_ask: faker.finance.amount({ min: 1, max: 2, dec: 5 }),
        close_market_bid: faker.finance.amount({ min: 1, max: 2, dec: 5 }),
        closed_spread_points: faker.number.int({ min: 1, max: 50 }),
        closed_volume: faker.finance.amount({ min: 1000, max: 100000, dec: 2 }),
        contract_size: faker.number.int({ min: 1000, max: 100000 }),
        digits: 5,
        fx_source: faker.helpers.arrayElement(['Live', 'Stale']),
        open_volume: faker.finance.amount({ min: 1000, max: 100000, dec: 2 }),
        open_volume_lots: faker.finance.amount({ min: 0.01, max: 1, dec: 2 }),
        volume_entry_lots: faker.finance.amount({ min: 0.01, max: 1, dec: 2 }),
        volume_exit_lots: faker.finance.amount({ min: 0.01, max: 1, dec: 2 }),
        profit: faker.finance.amount({ min: -50, max: 50, dec: 2 }),
        open_time: faker.date.recent().toISOString(),
        close_time: faker.date.recent().toISOString()
      },
      calculation: {
        spread_allotted: faker.finance.amount({ min: 0.1, max: 2, dec: 1 }),
        pip_value: faker.finance.amount({ min: 0.1, max: 1, dec: 4 }),
        one_pip: 0.0001,
        millions_base: faker.finance.amount({ min: 0.1, max: 10, dec: 2 }),
        pips_base: faker.finance.amount({ min: 1, max: 50, dec: 1 }),
        quote_currency: 'USD',
        fx_mode: 'direct'
      },
      status: faker.helpers.arrayElement(['pending', 'approved', 'rejected'])
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allCommissions, page, perPage),
      pagination: { 
        page, 
        per_page: perPage, 
        total_items: totalItems, 
        total_pages: Math.ceil(totalItems/perPage) 
      }
    })
  }),

  // 6. CALCULATE COMMISSIONS
  http.post('/api/:role' + (urls?.ibCommission?.calculateCommissions || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Commissions calculated successfully for the selected period.'
    })
  }),

  // 7. APPROVE COMMISSION
  http.post('/api/ib-commission/commissions/:id/approve', () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Commission approved successfully.'
    })
  }),

  // 8. REJECT COMMISSION
  http.post('/api/ib-commission/commissions/:id/reject', () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Commission rejected.'
    })
  }),

  // 9. BULK APPROVE COMMISSIONS
  http.post('/api/:role' + (urls?.ibCommission?.bulkApproveCommissions || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Bulk approval successful.'
    })
  }),

  // 10. TRADES LIST
  http.get('/api/:role' + (urls?.ibCommission?.trades || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    
    const totalItems = 35
    const allTrades = Array.from({ length: totalItems }).map((_, i) => ({
      id: faker.string.uuid(),
      trade_status: faker.helpers.arrayElement(['open', 'closed']),
      client_name: faker.person.fullName(),
      login: faker.number.int({ min: 1000, max: 9999 }),
      position_id: faker.number.int({ min: 100000, max: 999999 }),
      symbol: faker.helpers.arrayElement(['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD']),
      contract_size: 100000,
      digits: 5,
      mt5_group: `demo\\group\\USD`,
      broker_group_id: faker.number.int({ min: 1, max: 10 }),
      symbol_group_id: faker.number.int({ min: 1, max: 10 }),
      referral_link_id: faker.number.int({ min: 1, max: 10 }),
      closed_volume: faker.finance.amount({ min: 1000, max: 100000, dec: 2 }),
      volume_entry_lots: faker.finance.amount({ min: 0.01, max: 1, dec: 2 }),
      open_time: faker.date.recent().toISOString(),
      close_time: faker.date.recent().toISOString(),
      is_calculated: faker.datatype.boolean()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allTrades, page, perPage),
      pagination: { 
        page, 
        per_page: perPage, 
        total_items: totalItems, 
        total_pages: Math.ceil(totalItems/perPage) 
      }
    })
  }),

  // 11. REFERRAL LINKS SEARCH
  http.get('/api/:role' + (urls?.ibCommission?.referralLinksSearch || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      data: Array.from({ length: 5 }).map((_, i) => ({
        id: i + 1,
        ib_id: faker.number.int({ min: 1000, max: 9999 }),
        ib_name: faker.person.fullName(),
        code: faker.string.alphanumeric(8).toUpperCase(),
        campaign: faker.lorem.word(),
        is_default: i === 0,
        is_active: true
      }))
    })
  }),

  // 12. RATES
  http.get('/api/ib-commission/referral-links/:id/rates', () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        method: 'per_lot',
        symbol_groups: [
          { id: 1, name: 'Forex Majors' },
          { id: 2, name: 'Metals' }
        ],
        tabs: [
          {
            broker_group_config_id: 1,
            group_label: 'Standard Account',
            mt5_group: 'demo\\standard\\USD',
            rows: [
              {
                ib_id: faker.number.int({ min: 1000, max: 9999 }),
                ib_name: 'Master IB',
                ib_email: faker.internet.email(),
                hierarchy_level: 0,
                rates: { '1': '5.00', '2': '10.00' }
              },
              {
                ib_id: faker.number.int({ min: 1000, max: 9999 }),
                ib_name: 'Sub IB 1',
                ib_email: faker.internet.email(),
                hierarchy_level: 1,
                rates: { '1': '3.00', '2': '6.00' }
              }
            ]
          }
        ]
      }
    })
  }),

  http.put('/api/ib-commission/referral-links/:id/rates', () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Rates saved successfully.'
    })
  }),

  // 13. SYMBOL GROUPS
  http.get('/api/:role' + (urls?.ibCommission?.symbolGroups || '/__UNMATCHED__'), () => {
    const totalItems = 12
    const allGroups = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      name: `Group ${i + 1}`,
      description: faker.lorem.sentence(),
      member_count: faker.number.int({ min: 5, max: 50 }),
      is_active: faker.datatype.boolean()
    }))
    return HttpResponse.json({
      status: 'success',
      data: paginate(allGroups, 1, 10),
      pagination: { page: 1, per_page: 10, total_items: totalItems, total_pages: 2 }
    })
  }),

  // 14. SYMBOLS
  http.get('/api/:role' + (urls?.ibCommission?.symbols || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    
    const totalItems = 25
    const allSymbols = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      symbol: faker.finance.currencyCode() + 'USD',
      symbol_group_id: faker.number.int({ min: 1, max: 10 }),
      symbol_group_name: `Group ${faker.helpers.arrayElement(['A', 'B', 'C'])}`,
      status: faker.helpers.arrayElement(['active', 'inactive'])
    }))
    return HttpResponse.json({
      status: 'success',
      data: paginate(allSymbols, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: Math.ceil(totalItems/perPage) }
    })
  }),

  // 15. SETTINGS
  http.get('/api/:role' + (urls?.ibCommission?.workflowSettings || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        approval_workflow: 'daily',
        auto_payout: true,
        calculation_mode: 'net'
      }
    })
  }),
  
  http.put('/api/:role' + (urls?.ibCommission?.workflowSettings || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Workflow settings updated successfully.'
    })
  }),

  // 16. SYMBOL GROUP DETAILS
  http.get('/api/ib-commission/symbol-groups/:id', ({ params }) => {
    return HttpResponse.json({
      status: 'success',
      data: {
        id: parseInt(params.id),
        name: `Group ${params.id}`,
        description: faker.lorem.sentence(),
        member_count: faker.number.int({ min: 5, max: 50 }),
        is_active: faker.datatype.boolean()
      }
    })
  }),

  http.put('/api/ib-commission/symbol-groups/:id', () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Symbol group updated successfully.'
    })
  }),

  http.delete('/api/ib-commission/symbol-groups/:id', () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Symbol group deleted successfully.'
    })
  }),

  // 17. SYMBOL GROUP MEMBERS
  http.get('/api/ib-commission/symbol-groups/:id/members', () => {
    const totalItems = 10
    const allMembers = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      symbol: faker.finance.currencyCode() + 'USD',
      symbol_group_id: faker.number.int({ min: 1, max: 10 }),
      symbol_group_name: `Group ${faker.helpers.arrayElement(['A', 'B', 'C'])}`,
      status: 'active'
    }))
    return HttpResponse.json({
      status: 'success',
      data: paginate(allMembers, 1, 100),
      pagination: { page: 1, per_page: 100, total_items: totalItems, total_pages: 1 }
    })
  }),

  http.post('/api/ib-commission/symbol-groups/:id/members', () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Members assigned successfully.'
    })
  }),

  http.post('/api/:role' + (urls?.ibCommission?.symbolGroupsUnassign || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Symbols unassigned successfully.'
    })
  })
]
