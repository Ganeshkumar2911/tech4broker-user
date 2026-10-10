import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

export const catchAllHandlers = [
  // Intercept all unhandled GET requests to /api/*
  http.get('/api/*', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 25
    
    // Create generic dummy data
    const genericData = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      title: faker.commerce.productName(),
      amount: faker.finance.amount(),
      status: faker.helpers.arrayElement(['active', 'pending', 'approved', 'rejected']),
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      user_id: faker.number.int({ min: 1000, max: 9999 }),
      value: faker.number.int({ min: 1, max: 100 }),
      is_active: faker.datatype.boolean(),
      description: faker.lorem.sentence()
    }))

    // Paginate
    const start = (page - 1) * perPage
    const end = start + perPage
    const paginated = genericData.slice(start, end)

    console.warn(`[MSW Catch-All] Serving generic mock for ${url.pathname}`)

    return HttpResponse.json({
      status: 'success',
      data: paginated,
      pagination: { 
        page, 
        per_page: perPage, 
        total_items: totalItems, 
        total_pages: Math.ceil(totalItems / perPage) 
      }
    })
  }),

  // Intercept all unhandled POST requests
  http.post('/api/*', ({ request }) => {
    const url = new URL(request.url)
    console.warn(`[MSW Catch-All] Serving generic mock POST for ${url.pathname}`)
    return HttpResponse.json({
      success: true,
      status: 'success',
      message: 'Operation completed successfully (Mock)'
    })
  }),

  // Intercept all unhandled PUT requests
  http.put('/api/*', ({ request }) => {
    const url = new URL(request.url)
    console.warn(`[MSW Catch-All] Serving generic mock PUT for ${url.pathname}`)
    return HttpResponse.json({
      success: true,
      status: 'success',
      message: 'Updated successfully (Mock)'
    })
  }),

  // Intercept all unhandled PATCH requests
  http.patch('/api/*', ({ request }) => {
    const url = new URL(request.url)
    console.warn(`[MSW Catch-All] Serving generic mock PATCH for ${url.pathname}`)
    return HttpResponse.json({
      success: true,
      status: 'success',
      message: 'Updated successfully (Mock)'
    })
  }),

  // Intercept all unhandled DELETE requests
  http.delete('/api/*', ({ request }) => {
    const url = new URL(request.url)
    console.warn(`[MSW Catch-All] Serving generic mock DELETE for ${url.pathname}`)
    return HttpResponse.json({
      success: true,
      status: 'success',
      message: 'Deleted successfully (Mock)'
    })
  })
]
