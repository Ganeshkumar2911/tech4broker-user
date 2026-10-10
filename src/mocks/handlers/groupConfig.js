import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

export const groupConfigHandlers = [
  // GROUP CONFIG CATEGORIES
  http.get('/api/:role' + (urls?.groupConfig?.categories || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const search = url.searchParams.get('search')
    
    const totalItems = 12
    const totalPages = Math.ceil(totalItems / perPage)

    let allCategories = Array.from({ length: totalItems }).map((_, i) => ({
      id: faker.number.int({ min: 10, max: 999 }),
      mt5_group: `demo\\${faker.word.sample()}\\USD`,
      label: faker.helpers.arrayElement(['Standard Account', 'Pro Account', 'VIP Account', 'Islamic Account']),
      account_type: faker.helpers.arrayElement(['demo', 'live']),
      account_category: faker.helpers.arrayElement(['individual', 'corporate']),
      currency: faker.finance.currencyCode(),
      leverage: faker.helpers.arrayElement([100, 200, 500]),
      badge: faker.helpers.arrayElement(['NEW', 'POPULAR', 'PREMIUM', null]),
      description: faker.lorem.sentence(),
      created_at: faker.date.recent().toISOString()
    }))

    if (search) {
      allCategories = allCategories.filter(c => c.label.toLowerCase().includes(search.toLowerCase()) || c.mt5_group.toLowerCase().includes(search.toLowerCase()))
    }

    return HttpResponse.json({
      status: 'success',
      data: paginate(allCategories, page, perPage),
      pagination: { 
        page, 
        per_page: perPage, 
        total_items: allCategories.length, 
        total_pages: Math.ceil(allCategories.length / perPage)
      }
    })
  }),

  http.post('/api/:role' + (urls?.groupConfig?.create || '/__UNMATCHED__'), async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      message: 'Category created successfully',
      data: {
        id: faker.number.int({ min: 1000, max: 9999 }),
        ...body
      }
    })
  }),

  // MT5 GROUPS (for dropdown search)
  http.get('/api/:role' + (urls?.groupConfig?.groups || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')

    let allGroups = Array.from({ length: 20 }).map((_, i) => ({
      label: `demo\\group_${i}\\USD`,
      value: `demo\\group_${i}\\USD`
    }))

    if (query) {
      allGroups = allGroups.filter(g => g.label.toLowerCase().includes(query.toLowerCase()))
    }

    return HttpResponse.json({
      status: 'success',
      data: allGroups
    })
  })
]
