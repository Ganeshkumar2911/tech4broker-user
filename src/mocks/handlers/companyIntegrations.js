import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

export const companyIntegrationsHandlers = [
  // COMPANY INTEGRATIONS LIST
  http.get('/api/:role' + (urls?.integrations?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    
    const totalItems = 20
    const totalPages = Math.ceil(totalItems / perPage)

    const allIntegrations = Array.from({ length: totalItems }).map((_, i) => ({
      id: faker.number.int({ min: 10, max: 999 }),
      company_id: faker.string.uuid().split('-')[0],
      provider: faker.helpers.arrayElement(['meta', 'slack', 'brevo', 'hubspot', 'salesforce']),
      base_url: `https://api.${faker.word.sample()}.com/v1`,
      is_active: faker.datatype.boolean(),
      last_run_at: faker.datatype.boolean() ? faker.date.recent().toISOString() : null,
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      data: paginate(allIntegrations, page, perPage),
      pagination: { 
        page, 
        per_page: perPage, 
        total_items: totalItems, 
        total_pages: totalPages
      }
    })
  }),

  // CREATE COMPANY INTEGRATION
  http.post('/api/:role' + (urls?.integrations?.create || '/__UNMATCHED__'), async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      message: 'Integration created successfully',
      data: {
        id: faker.number.int({ min: 1000, max: 9999 }),
        ...body,
        created_at: new Date().toISOString()
      }
    })
  }),

  // UPDATE COMPANY INTEGRATION
  http.put('/api/:role' + (urls?.integrations?.update || '/__UNMATCHED__') + '/:id', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      message: 'Integration updated successfully',
      data: {
        ...body,
        updated_at: new Date().toISOString()
      }
    })
  }),

  // RUN COMPANY INTEGRATION
  http.post('/api/:role' + (urls?.integrations?.run || '/__UNMATCHED__') + '/:id', () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Manual fetch completed successfully'
    })
  })
]
