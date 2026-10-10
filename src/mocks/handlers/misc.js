import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

function createPaginatedResponse(data, page, perPage, totalItems) {
  return HttpResponse.json({
    status: 'success',
    data: paginate(data, page, perPage),
    pagination: {
      page,
      per_page: perPage,
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / perPage)
    }
  })
}

export const miscHandlers = [
  // --- LOYALTY & CASHBACK ---
  http.get('/api/:role' + (urls?.loyalty?.programs || '/__UNMATCHED__'), ({ request }) => {
    const page = parseInt(new URL(request.url).searchParams.get('page')) || 1
    const perPage = parseInt(new URL(request.url).searchParams.get('per_page')) || 10
    const totalItems = 5
    const programs = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      name: faker.commerce.department() + ' Rewards',
      points_per_lot: faker.number.int({ min: 1, max: 10 }),
      status: faker.helpers.arrayElement(['active', 'inactive']),
      created_at: faker.date.past().toISOString()
    }))
    return createPaginatedResponse(programs, page, perPage, totalItems)
  }),

  http.get('/api/:role' + (urls?.loyalty?.enrollments || '/__UNMATCHED__'), ({ request }) => {
    const page = parseInt(new URL(request.url).searchParams.get('page')) || 1
    const perPage = parseInt(new URL(request.url).searchParams.get('per_page')) || 10
    const totalItems = 200
    const enrollments = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      client_name: faker.person.fullName(),
      account_number: faker.number.int({ min: 100000, max: 999999 }),
      points_balance: faker.number.int({ min: 0, max: 50000 }),
      status: 'active',
      enrolled_at: faker.date.past().toISOString()
    }))
    return createPaginatedResponse(enrollments, page, perPage, totalItems)
  }),

  http.get('/api/cashback/programs', ({ request }) => {
    const page = parseInt(new URL(request.url).searchParams.get('page')) || 1
    const perPage = parseInt(new URL(request.url).searchParams.get('per_page')) || 10
    const totalItems = 3
    const programs = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      name: 'Cashback Tier ' + (i + 1),
      rebate_per_lot: faker.number.float({ min: 1.0, max: 5.0, fractionDigits: 2 }),
      status: 'active',
      created_at: faker.date.past().toISOString()
    }))
    return createPaginatedResponse(programs, page, perPage, totalItems)
  }),

  http.get('/api/cashback/enrollments', ({ request }) => {
    const page = parseInt(new URL(request.url).searchParams.get('page')) || 1
    const perPage = parseInt(new URL(request.url).searchParams.get('per_page')) || 10
    const totalItems = 150
    const enrollments = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      client_name: faker.person.fullName(),
      account_number: faker.number.int({ min: 100000, max: 999999 }),
      total_cashback: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
      status: 'active',
      enrolled_at: faker.date.past().toISOString()
    }))
    return createPaginatedResponse(enrollments, page, perPage, totalItems)
  }),

  // --- SUPPORT TICKETS ---
  http.get('/api/:role' + (urls?.tickets?.list || '/__UNMATCHED__'), ({ request }) => {
    const page = parseInt(new URL(request.url).searchParams.get('page')) || 1
    const perPage = parseInt(new URL(request.url).searchParams.get('per_page')) || 10
    const totalItems = 45
    const tickets = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      ticket_id: 'TKT-' + faker.number.int({ min: 1000, max: 9999 }),
      subject: faker.lorem.words(4),
      client_name: faker.person.fullName(),
      status: faker.helpers.arrayElement(['open', 'in_progress', 'resolved', 'closed']),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
      created_at: faker.date.recent().toISOString()
    }))
    return createPaginatedResponse(tickets, page, perPage, totalItems)
  }),

  // --- PAYMENT REQUESTS ---
  http.get('/api/:role' + (urls?.paymentRequests?.list || '/__UNMATCHED__'), ({ request }) => {
    const page = parseInt(new URL(request.url).searchParams.get('page')) || 1
    const perPage = parseInt(new URL(request.url).searchParams.get('per_page')) || 10
    const totalItems = 80
    const requests = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      client_name: faker.person.fullName(),
      account_number: faker.number.int({ min: 100000, max: 999999 }),
      type: faker.helpers.arrayElement(['deposit', 'withdrawal']),
      amount: faker.number.float({ min: 50, max: 10000, fractionDigits: 2 }),
      method: faker.helpers.arrayElement(['Crypto', 'Bank Transfer', 'Credit Card']),
      status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
      created_at: faker.date.recent().toISOString()
    }))
    return createPaginatedResponse(requests, page, perPage, totalItems)
  }),

  // --- RBAC & SETTINGS ---
  http.get('/api/:role' + (urls?.rbac?.roles?.list || '/__UNMATCHED__'), ({ request }) => {
    const page = parseInt(new URL(request.url).searchParams.get('page')) || 1
    const perPage = parseInt(new URL(request.url).searchParams.get('per_page')) || 10
    const totalItems = 15
    const roles = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      name: faker.helpers.arrayElement(['Admin', 'Manager', 'Support', 'Compliance']),
      description: faker.lorem.sentence(),
      user_count: faker.number.int({ min: 1, max: 50 }),
      created_at: faker.date.past().toISOString()
    }))
    return createPaginatedResponse(roles, page, perPage, totalItems)
  }),

  http.get('/api/:role' + (urls?.rbac?.staff?.list || '/__UNMATCHED__'), ({ request }) => {
    const page = parseInt(new URL(request.url).searchParams.get('page')) || 1
    const perPage = parseInt(new URL(request.url).searchParams.get('per_page')) || 10
    const totalItems = 30
    const users = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: { name: faker.helpers.arrayElement(['Admin', 'Manager', 'Support']) },
      is_active: faker.datatype.boolean(),
      created_at: faker.date.past().toISOString()
    }))
    return createPaginatedResponse(users, page, perPage, totalItems)
  }),

  // --- LEDGERS ---
  http.get('/api/:role' + (urls?.clientLedger?.list || '/__UNMATCHED__'), ({ request }) => {
    const page = parseInt(new URL(request.url).searchParams.get('page')) || 1
    const perPage = parseInt(new URL(request.url).searchParams.get('per_page')) || 10
    const totalItems = 120
    const ledgers = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      client_name: faker.person.fullName(),
      account_number: faker.number.int({ min: 100000, max: 999999 }),
      type: faker.helpers.arrayElement(['deposit', 'withdrawal', 'transfer', 'fee']),
      amount: faker.number.float({ min: -5000, max: 5000, fractionDigits: 2 }),
      balance_after: faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 }),
      date: faker.date.recent().toISOString()
    }))
    return createPaginatedResponse(ledgers, page, perPage, totalItems)
  })
]
