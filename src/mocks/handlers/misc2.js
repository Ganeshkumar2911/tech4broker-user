import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

export const misc2Handlers = [
  // ---------------------------------------------------------
  // ENHANCED AUDIT LOGS
  // ---------------------------------------------------------
  http.get('/api/:role' + (urls?.enhancedAuditLogs?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    
    const totalItems = 35
    const allLogs = Array.from({ length: totalItems }).map((_, i) => ({
      id: faker.number.int({ min: 10000, max: 99999 }),
      module: faker.helpers.arrayElement(['CRM', 'WALLET', 'TRADING', 'USERS']),
      action: faker.helpers.arrayElement(['CREATE', 'UPDATE', 'DELETE', 'LOGIN']),
      status: faker.helpers.arrayElement(['SUCCESS', 'FAILED', 'PENDING']),
      summary: faker.lorem.sentence(),
      actor: {
        id: faker.number.int({ min: 1, max: 100 }),
        type: 'ADMIN',
        name: faker.person.fullName(),
        email: faker.internet.email()
      },
      entity: {
        id: faker.number.int({ min: 1000, max: 5000 }),
        type: 'USER'
      },
      request_context: {
        ip_address: faker.internet.ip(),
        user_agent: faker.internet.userAgent()
      },
      created_at: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allLogs, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: Math.ceil(totalItems/perPage) }
    })
  }),

  http.get('/api/audit-logs/:id/details', () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        id: faker.number.int({ min: 10000, max: 99999 }),
        module: 'CRM',
        action: 'UPDATE',
        status: 'SUCCESS',
        summary: 'Updated user details',
        old_values: { name: 'Old Name' },
        new_values: { name: 'New Name' },
        actor: { name: faker.person.fullName(), email: faker.internet.email() },
        created_at: faker.date.recent().toISOString()
      }
    })
  }),

  http.get('/api/:role' + (urls?.enhancedAuditLogs?.filters || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      step: 'modules',
      modules: ['CRM', 'WALLET', 'TRADING', 'USERS']
    })
  }),

  // ---------------------------------------------------------
  // TICKETS & PLATFORM TICKETS
  // ---------------------------------------------------------
  http.get('/api/:role' + (urls?.tickets?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    
    const totalItems = 20
    const allTickets = Array.from({ length: totalItems }).map((_, i) => ({
      id: faker.number.int({ min: 1000, max: 9999 }),
      ticket_number: `TKT-${faker.number.int({ min: 1000, max: 9999 })}`,
      subject: faker.lorem.words(4),
      status: faker.helpers.arrayElement(['open', 'in_progress', 'resolved', 'closed']),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
      category: faker.helpers.arrayElement(['General', 'Technical', 'Billing']),
      client_name: faker.person.fullName(),
      assigned_to: faker.person.fullName(),
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allTickets, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: Math.ceil(totalItems/perPage) }
    })
  }),

  http.get('/api/:role' + (urls?.platformTickets?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    
    const totalItems = 20
    const allTickets = Array.from({ length: totalItems }).map((_, i) => ({
      id: faker.number.int({ min: 1000, max: 9999 }),
      ticket_number: `PT-${faker.number.int({ min: 1000, max: 9999 })}`,
      subject: faker.lorem.words(4),
      status: faker.helpers.arrayElement(['open', 'in_progress', 'resolved', 'closed']),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
      category: faker.helpers.arrayElement(['General', 'Technical', 'Billing']),
      client_name: faker.person.fullName(),
      assigned_to: faker.person.fullName(),
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allTickets, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: Math.ceil(totalItems/perPage) }
    })
  }),

  // ---------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------
  http.get('/api/notifications/list', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    
    const totalItems = 30
    const allNotifs = Array.from({ length: totalItems }).map((_, i) => ({
      id: faker.number.int({ min: 100, max: 999 }),
      title: faker.lorem.words(3),
      message: faker.lorem.sentence(),
      type: faker.helpers.arrayElement(['system', 'alert', 'marketing']),
      status: faker.helpers.arrayElement(['sent', 'scheduled', 'draft']),
      scheduled_at: faker.date.recent().toISOString(),
      created_at: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allNotifs, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: Math.ceil(totalItems/perPage) }
    })
  }),

  http.get('/api/admin/notification/user-depth', () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        total_users: 15200,
        active_users: 12000,
        unsubscribed: 3200
      }
    })
  }),

  // ---------------------------------------------------------
  // LOYALTY PROGRAM
  // ---------------------------------------------------------
  http.get('/api/:role' + (urls?.loyalty?.deals || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    
    const totalItems = 40
    const allDeals = Array.from({ length: totalItems }).map((_, i) => ({
      id: faker.string.uuid(),
      mt5_deal_id: faker.number.int({ min: 1000000, max: 9999999 }),
      account_number: faker.number.int({ min: 1000, max: 9999 }),
      position_id: faker.number.int({ min: 100000, max: 999999 }),
      symbol: faker.helpers.arrayElement(['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD']),
      side: faker.helpers.arrayElement(['BUY', 'SELL']),
      lots: faker.finance.amount({ min: 0.01, max: 10, dec: 2 }),
      duration_seconds: faker.number.int({ min: 10, max: 3600 }),
      points_awarded: faker.finance.amount({ min: 0.1, max: 50, dec: 2 }),
      eligibility_status: faker.helpers.arrayElement(['awarded', 'not_awarded', 'pending']),
      close_time: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allDeals, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: Math.ceil(totalItems/perPage) }
    })
  }),

  // Note: catching all /loyalty/* as a fallback just in case
  http.get('/api/loyalty/*', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    
    const totalItems = 15
    const genericLoyaltyData = Array.from({ length: totalItems }).map((_, i) => ({
      id: faker.number.int({ min: 10, max: 999 }),
      program_name: faker.company.name() + ' Rewards',
      name: faker.commerce.productName(),
      points: faker.number.int({ min: 100, max: 5000 }),
      tier_name: faker.helpers.arrayElement(['Bronze', 'Silver', 'Gold', 'Platinum']),
      is_active: faker.datatype.boolean(),
      status: faker.helpers.arrayElement(['active', 'inactive', 'pending']),
      created_at: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(genericLoyaltyData, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: Math.ceil(totalItems/perPage) }
    })
  })
]
