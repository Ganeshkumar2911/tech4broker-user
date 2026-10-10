import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'
import { paginate } from '../utils/pagination'

export const notificationsHandlers = [
  // GET ADMIN LIST (/notifications/list)
  http.get('/api/:role' + (urls?.notifications?.adminList || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const perPage = parseInt(url.searchParams.get('per_page') || '10', 10)

    const notifications = Array.from({ length: 35 }).map((_, i) => ({
      id: i + 1,
      title: faker.lorem.words(3),
      message: faker.lorem.paragraph(),
      priority: faker.helpers.arrayElement(['HIGH', 'MEDIUM', 'LOW']),
      type: faker.helpers.arrayElement(['ANNOUNCEMENT', 'SYSTEM', 'PROMOTION', 'ALERT']),
      is_active: faker.datatype.boolean(),
      created_at: faker.date.recent({ days: 30 }).toISOString(),
      sent_at: faker.datatype.boolean() ? faker.date.recent({ days: 15 }).toISOString() : null,
      image_url: faker.datatype.boolean() ? faker.image.urlLoremFlickr({ category: 'technology' }) : null,
      metadata: faker.datatype.boolean() ? { 'Campaign': 'Holiday', 'Audience': 'Traders' } : null
    }))

    return HttpResponse.json({
      status: 'success',
      ...paginate(notifications, page, perPage)
    })
  }),

  // GET MY NOTIFICATIONS (/notifications/my-notifications)
  http.get('/api/:role' + (urls?.notifications?.myNotifications || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const perPage = parseInt(url.searchParams.get('per_page') || '10', 10)

    const notifications = Array.from({ length: 15 }).map((_, i) => ({
      id: i + 1,
      notification_id: faker.number.int({ min: 100, max: 999 }),
      title: faker.lorem.words(3),
      message: faker.lorem.paragraph(),
      priority: faker.helpers.arrayElement(['HIGH', 'MEDIUM', 'LOW']),
      type: faker.helpers.arrayElement(['ANNOUNCEMENT', 'SYSTEM', 'PROMOTION', 'ALERT']),
      is_read: faker.datatype.boolean(),
      read_at: faker.datatype.boolean() ? faker.date.recent().toISOString() : null,
      created_at: faker.date.recent({ days: 10 }).toISOString(),
      image_url: faker.datatype.boolean() ? faker.image.url() : null,
      metadata: null
    }))

    return HttpResponse.json({
      status: 'success',
      ...paginate(notifications, page, perPage)
    })
  }),

  // CREATE NOTIFICATION
  http.post('/api/:role' + (urls?.notifications?.create || '/__UNMATCHED__'), async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      msg: 'Notification created successfully.',
      data: {
        id: faker.number.int({ min: 100, max: 999 }),
        ...body,
        is_active: false,
        created_at: new Date().toISOString()
      }
    })
  }),

  // UPDATE NOTIFICATION
  http.put('/api/:role' + (urls?.notifications?.update || '/__UNMATCHED__') + '/:id', async ({ request, params }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      msg: 'Notification updated successfully.',
      data: {
        id: params.id,
        ...body
      }
    })
  }),

  // SEND NOTIFICATION
  http.put('/api/:role' + (urls?.notifications?.send || '/__UNMATCHED__') + '/:id', async ({ params }) => {
    return HttpResponse.json({
      status: 'success',
      msg: 'Notification activated & sent successfully.',
      data: {
        id: params.id,
        is_active: true,
        sent_at: new Date().toISOString()
      }
    })
  }),

  // MARK AS READ
  http.put('/api/:role' + (urls?.notifications?.markRead || '/__UNMATCHED__') + '/:id', () => {
    return HttpResponse.json({
      status: 'success',
      msg: 'Notification marked as read.'
    })
  }),

  // MARK ALL AS READ
  http.put('/api/:role' + (urls?.notifications?.markRead || '/__UNMATCHED__') + '/all', () => {
    return HttpResponse.json({
      status: 'success',
      msg: 'All notifications marked as read.'
    })
  }),

  // READ STATUS (/notifications/read-status)
  http.get('/api/:role' + (urls?.notifications?.readStatus || '/__UNMATCHED__') + '/:id', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const perPage = parseInt(url.searchParams.get('per_page') || '10', 10)

    const logs = Array.from({ length: 20 }).map((_, i) => ({
      id: i + 1,
      is_read: faker.datatype.boolean(),
      read_at: faker.datatype.boolean() ? faker.date.recent().toISOString() : null,
      user: {
        name: faker.person.fullName(),
        email: faker.internet.email()
      }
    }))

    return HttpResponse.json({
      status: 'success',
      ...paginate(logs, page, perPage)
    })
  })
]
