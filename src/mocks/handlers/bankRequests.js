import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

export const bankRequestsHandlers = [
  // BANK REQUESTS LIST
  http.get('/api/:role' + (urls?.bankRequests?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const status = url.searchParams.get('approval_status')
    
    const totalItems = 45
    const totalPages = Math.ceil(totalItems / perPage)

    let allRequests = Array.from({ length: totalItems }).map((_, i) => ({
      id: faker.number.int({ min: 1000, max: 9999 }),
      user_id: faker.number.int({ min: 10000, max: 99999 }),
      account_name: faker.person.fullName(),
      label: faker.helpers.arrayElement(['Primary', 'Secondary', null]),
      is_default: faker.datatype.boolean(),
      bank: faker.company.name() + ' Bank',
      account_type: faker.helpers.arrayElement(['Savings', 'Checking', 'Current']),
      bank_branch: faker.location.city(),
      account_number: faker.finance.accountNumber(12),
      bank_branch_code: faker.finance.bic(),
      approval_status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
      is_editing: faker.datatype.boolean(),
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString()
    }))

    if (status !== null && status !== '' && status !== 'all') {
      allRequests = allRequests.filter(req => req.approval_status === status)
    }

    return HttpResponse.json({
      status: 'success',
      data: paginate(allRequests, page, perPage),
      pagination: { page, per_page: perPage, total_items: allRequests.length, total_pages: Math.ceil(allRequests.length / perPage) }
    })
  }),

  // APPROVE
  http.post('/api/bank-accounts/:id/approve', ({ params }) => {
    return HttpResponse.json({
      status: 'success',
      message: 'Bank account approved successfully'
    })
  }),

  // REJECT
  http.post('/api/bank-accounts/:id/reject', ({ params }) => {
    return HttpResponse.json({
      status: 'success',
      message: 'Bank account rejected successfully'
    })
  }),

  // USER BANK ACCOUNTS
  http.get('/api/users/bank-accounts/:userId', ({ params }) => {
    return HttpResponse.json({
      status: 'success',
      data: Array.from({ length: 3 }).map(() => ({
        id: faker.number.int({ min: 1000, max: 9999 }),
        user_id: parseInt(params.userId),
        account_name: faker.person.fullName(),
        bank: faker.company.name() + ' Bank',
        account_number: faker.finance.accountNumber(12),
        approval_status: 'approved'
      }))
    })
  })
]
