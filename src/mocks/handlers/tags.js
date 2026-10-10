import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'
import { paginate } from '../utils/pagination'

export const tagsHandlers = [
  // GET TAGS LIST
  http.get('/api/:role' + (urls?.tags?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const perPage = parseInt(url.searchParams.get('per_page') || '10', 10)

    const tags = Array.from({ length: 45 }).map((_, i) => {
      const name = faker.commerce.department() + ' ' + faker.number.int({ min: 1, max: 100 })
      return {
        id: i + 1,
        name: name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        color: faker.color.rgb(),
        status: faker.helpers.arrayElement(['active', 'inactive']),
        lead_usage_count: faker.number.int({ min: 0, max: 50 }),
        user_usage_count: faker.number.int({ min: 0, max: 50 }),
        total_usage_count: faker.number.int({ min: 0, max: 100 }),
        created_by: {
          name: faker.person.fullName()
        },
        created_at: faker.date.recent({ days: 60 }).toISOString()
      }
    })

    return HttpResponse.json({
      status: 'success',
      ...paginate(tags, page, perPage)
    })
  }),

  // GET TAGS LIMITS
  http.get('/api/:role' + (urls?.tags?.limits || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        lead: 15,
        user: 10
      }
    })
  }),

  // CREATE TAG
  http.post('/api/:role' + (urls?.tags?.create || '/__UNMATCHED__'), async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      message: 'Tag created successfully',
      data: {
        id: faker.number.int({ min: 100, max: 999 }),
        slug: body.name.toLowerCase().replace(/\s+/g, '-'),
        lead_usage_count: 0,
        user_usage_count: 0,
        total_usage_count: 0,
        created_by: { name: 'Admin' },
        created_at: new Date().toISOString(),
        ...body
      }
    })
  }),

  // UPDATE TAG
  http.put('/api/tags/:id', async ({ request, params }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      message: 'Tag updated successfully',
      data: {
        id: params.id,
        ...body
      }
    })
  }),

  // ACTIVATE TAG
  http.post('/api/tags/:id/activate', ({ params }) => {
    return HttpResponse.json({
      status: 'success',
      message: 'Tag activated successfully'
    })
  }),

  // DEACTIVATE TAG
  http.post('/api/tags/:id/deactivate', ({ params }) => {
    return HttpResponse.json({
      status: 'success',
      message: 'Tag deactivated successfully'
    })
  }),

  // DELETE TAG
  http.delete('/api/tags/:id', ({ params }) => {
    return HttpResponse.json({
      status: 'success',
      message: 'Tag deleted successfully'
    })
  })
]
